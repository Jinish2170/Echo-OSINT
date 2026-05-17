// Intelligence Brief Generator - Produces structured briefings
import {
  Target,
  Finding,
  Belief,
  Contradiction,
  IntelligenceBrief,
  Lead,
  TimelineEvent,
  EvidenceLink,
} from '../types';

export class BriefGenerator {
  generate(
    target: Target,
    mode: 'hunter' | 'investigator' | 'watcher',
    findings: Finding[],
    beliefs: Belief[],
    contradictions: Contradiction[],
    timeline: TimelineEvent[]
  ): IntelligenceBrief {
    const establishedFacts = beliefs.filter(b => b.status === 'established');
    const likelyAssessments = beliefs.filter(b => b.status === 'likely');
    const leads = this.generateLeads(findings, mode);
    const negativeFindings = this.generateNegativeFindings(findings);
    const summary = this.generateSummary(target, mode, findings, establishedFacts);

    return {
      target,
      mode,
      startedAt: timeline[0]?.timestamp || new Date(),
      completedAt: new Date(),
      establishedFacts,
      likelyAssessments,
      contradictions,
      leads,
      negativeFindings,
      timeline,
      summary,
    };
  }

  private generateLeads(findings: Finding[], mode: 'hunter' | 'investigator' | 'watcher'): Lead[] {
    const leads: Lead[] = [];

    // Sort findings by significance
    const sorted = [...findings].sort((a, b) => b.significance.total - a.significance.total);

    for (const finding of sorted.slice(0, 5)) {
      const priority = this.determineLeadPriority(finding, mode);

      leads.push({
        id: `lead-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        description: `Investigate ${finding.source}: ${finding.value}`,
        priority,
        rationale: this.generateLeadRationale(finding),
        estimatedEffort: this.estimateEffort(finding),
      });
    }

    return leads;
  }

  private determineLeadPriority(
    finding: Finding,
    mode: 'hunter' | 'investigator' | 'watcher'
  ): 'high' | 'medium' | 'low' {
    if (mode === 'hunter' && finding.type === 'infrastructure') {
      return 'high';
    }
    if (mode === 'investigator' && finding.type === 'credential') {
      return 'high';
    }
    if (finding.significance.total > 0.7) return 'high';
    if (finding.significance.total > 0.5) return 'medium';
    return 'low';
  }

  private generateLeadRationale(finding: Finding): string {
    return `This ${finding.type} finding from ${finding.source} has significance score ${finding.significance.total.toFixed(2)}. Evidence includes: ${finding.evidence[0]?.data || 'detected'}`;
  }

  private estimateEffort(finding: Finding): string {
    switch (finding.type) {
      case 'infrastructure':
        return '10-15 min';
      case 'breach':
        return '15-20 min';
      case 'credential':
        return '20-30 min';
      default:
        return '5-10 min';
    }
  }

  private generateNegativeFindings(findings: Finding[]): string[] {
    const negatives: string[] = [];

    // Check what we looked for but didn't find
    const sourcesChecked = new Set(findings.map(f => f.source));

    if (!sourcesChecked.has('github')) {
      negatives.push('No GitHub presence detected');
    }
    if (!sourcesChecked.has('linkedin')) {
      negatives.push('No LinkedIn profile found');
    }
    if (findings.length < 3) {
      negatives.push('Limited online presence detected');
    }

    return negatives;
  }

  private generateSummary(
    target: Target,
    mode: 'hunter' | 'investigator' | 'watcher',
    findings: Finding[],
    establishedFacts: Belief[]
  ): string {
    const typeLabel = target.type === 'username' ? 'Username' :
                      target.type === 'domain' ? 'Domain' :
                      target.type === 'email' ? 'Email' : 'IP';

    const findingCount = findings.length;
    const factCount = establishedFacts.length;

    switch (mode) {
      case 'hunter':
        return `Attack surface analysis for ${typeLabel} "${target.value}": ${findingCount} findings, ${factCount} established facts. Priority attack vectors identified.`;
      case 'investigator':
        return `Investigation report for ${typeLabel} "${target.value}": ${factCount} established facts, ${findingCount} total findings. Evidence chain documented.`;
      case 'watcher':
        return `Monitoring snapshot for ${typeLabel} "${target.value}": ${findingCount} findings detected, ${factCount} confirmed facts.`;
      default:
        return `Intelligence brief for ${typeLabel} "${target.value}": ${findingCount} findings, ${factCount} established facts.`;
    }
  }
}

export function createBriefGenerator(): BriefGenerator {
  return new BriefGenerator();
}