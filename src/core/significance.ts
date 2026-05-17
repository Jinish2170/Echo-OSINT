// SignificanceEngine - Scores findings on novelty, rarity, severity, timeliness
import { Finding, SignificanceScore } from '../types';

// Platform base rates (how common is this type of finding)
const PLATFORM_RARITY: Record<string, number> = {
  github: 0.7,
  reddit: 0.4,
  hackernews: 0.8,
  hibp: 0.9, // Breaches are rare but significant
  crt_sh: 0.5,
  rdap: 0.9,
  shodan: 0.8,
};

// Source reliability weights
const SOURCE_RELIABILITY: Record<string, number> = {
  rdap: 0.95,
  hibp: 0.9,
  shodan: 0.85,
  crt_sh: 0.8,
  github: 0.9,
  reddit: 0.6,
  hackernews: 0.7,
};

export class SignificanceEngine {
  calculateSignificance(
    finding: Partial<Finding>,
    context?: {
      similarFindingsCount?: number;
      overallFindingCount?: number;
      sourceAge?: Date;
    }
  ): SignificanceScore {
    const novelty = this.calculateNovelty(finding, context);
    const rarity = this.calculateRarity(finding, context);
    const severity = this.calculateSeverity(finding);
    const timeliness = this.calculateTimeliness(finding, context);

    // Weighted formula from REQ SIG-01
    const total = (novelty * 0.3) + (rarity * 0.25) + (severity * 0.3) + (timeliness * 0.15);

    return {
      novelty: Math.round(novelty * 100) / 100,
      rarity: Math.round(rarity * 100) / 100,
      severity: Math.round(severity * 100) / 100,
      timeliness: Math.round(timeliness * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  private calculateNovelty(
    finding: Partial<Finding>,
    context?: { similarFindingsCount?: number; overallFindingCount?: number }
  ): number {
    // How unexpected is this finding
    const similarCount = context?.similarFindingsCount || 0;
    const totalCount = context?.overallFindingCount || 1;

    // If similar findings exist, it's less novel
    if (similarCount > 0) {
      return Math.max(0.1, 1 - (similarCount / Math.max(totalCount, 1)));
    }

    // Check if this is a common type of finding
    const source = finding.source?.toLowerCase() || '';
    if (source.includes('linkedin') || source.includes('twitter')) {
      return 0.3; // Very common for username searches
    }
    if (source.includes('github') || source.includes('gitlab')) {
      return 0.5; // Moderately common for devs
    }

    return 0.8; // Uncommon finding
  }

  private calculateRarity(
    finding: Partial<Finding>,
    context?: { similarFindingsCount?: number }
  ): number {
    const source = finding.source || '';
    const platform = Object.keys(PLATFORM_RARITY).find(p => source.includes(p));
    const baseRarity = platform ? PLATFORM_RARITY[platform] : 0.5;

    // Adjust based on type
    if (finding.type === 'breach') return 0.9;
    if (finding.type === 'credential') return 0.95;
    if (finding.type === 'infrastructure') return 0.7;

    return baseRarity;
  }

  private calculateSeverity(finding: Partial<Finding>): number {
    // Severity based on finding type
    switch (finding.type) {
      case 'credential':
        return 1.0; // Critical
      case 'breach':
        return 0.9; // High
      case 'infrastructure':
        return 0.7; // Medium-High
      case 'relationship':
        return 0.5; // Medium
      case 'entity':
      default:
        return 0.4; // Lower
    }
  }

  private calculateTimeliness(
    finding: Partial<Finding>,
    context?: { sourceAge?: Date }
  ): number {
    if (!context?.sourceAge) return 0.5; // Default middle

    const ageMs = Date.now() - context.sourceAge.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    if (ageDays < 1) return 1.0;
    if (ageDays < 7) return 0.9;
    if (ageDays < 30) return 0.7;
    if (ageDays < 90) return 0.5;
    if (ageDays < 365) return 0.3;
    return 0.1;
  }

  getSourceReliability(source: string): number {
    return SOURCE_RELIABILITY[source.toLowerCase()] || 0.7;
  }
}

export const significanceEngine = new SignificanceEngine();