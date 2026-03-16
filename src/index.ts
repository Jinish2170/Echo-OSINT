// Echo-OSINT - Main Entry Point
/**
 * ECHO-OSINT: Autonomous Intelligence Engine
 *
 * An AI-powered OSINT system that uses free data sources,
 * CrewAI for orchestration, and NVIDIA NIM for inference
 * to produce premium intelligence without premium costs.
 */

import { createCollectorRegistry } from './collectors';
import { createResearchCrew } from './orchestration/types';
import { INTELLIGENCE_QUERY, INTELLIGENCE_RESULT, FINDING } from './types';
import CONFIG from './config';

/**
 * Main Echo-OSINT Engine Class
 */
export class EchoOSINT {
  private registry = createCollectorRegistry();

  /**
   * Execute an intelligence query
   *
   * @param query - Natural language query
   * @param options - Optional configuration
   * @returns Structured intelligence result
   */
  async query(
    query: string,
    options?: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      timeout?: number;
      collectAll?: boolean;
    }
  ): Promise<INTELLIGENCE_RESULT> {
    const startTime = Date.now();

    console.log(`\n🔍 Echo-OSINT: Processing query "${query}"`);

    // Step 1: Direct collection from all sources (parallel)
    const collections = await this.registry.collectAll(query, 20);

    console.log(`📡 Collected from ${collections.size} sources`);

    // Aggregate all findings
    const allFindings: FINDING[] = [];
    const sourceCount: Record<string, number> = {};

    for (const [platform, findings] of collections.entries()) {
      sourceCount[platform] = findings.length;
      allFindings.push(...findings);
    }

    console.log(`📊 Total findings: ${allFindings.length}`);

    // Step 2: Run CrewAI research crew
    let crewResult: any = null;
    try {
      const { crew } = createResearchCrew();
      // Note: In production, we'd pass the collected findings to the crew
      // For now, this demonstrates the architecture
      // crewResult = await crew.kickoff(query);
      console.log('🤖 CrewAI crew initialized (ready for full research cycle)');
    } catch (error) {
      console.error('Crew execution error:', error);
    }

    // Step 3: Analyze propagation paths
    const propagationPath = this.analyzePropagation(allFindings);

    // Calculate overall confidence
    const confidence = this.calculateConfidence(allFindings);

    // Prepare result
    const result: INTELLIGENCE_RESULT = {
      id: `intl-${Date.now()}`,
      query,
      findings: allFindings.slice(0, 50),
      synthesis: {
        summary: this.generateSummary(allFindings),
        key_insights: this.extractInsights(allFindings),
        predictions: this.generatePredictions(allFindings),
        recommendations: this.generateRecommendations(allFindings),
      },
      confidence,
      sources: this.extractSources(allFindings),
      propagation_path: propagationPath,
      timestamp: new Date(),
    };

    const duration = Date.now() - startTime;
    console.log(`✅ Query complete in ${duration}ms | Confidence: ${(confidence * 100).toFixed(1)}%`);

    return result;
  }

  /**
   * Analyze signal propagation across platforms
   */
  private analyzePropagation(findings: FINDING[]) {
    const platformOrder: FINDING['source'][] = [
      'github',
      'reddit',
      'hackernews',
      'searxng',
      'news',
    ];

    const sourceTimes = new Map<FINDING['source'], number>();

    for (const finding of findings) {
      const existing = sourceTimes.get(finding.source) || 0;
      sourceTimes.set(finding.source, existing + 1);
    }

    const detected = Array.from(sourceTimes.keys());
    const velocity = detections => {
        // Calculate relative velocity based on platform positions
        return detections.length > 0 ? 1.2 : 0.8;
    };

    return {
      origin: 'github' as const, // Would be dynamically determined
      intermediate: detected.slice(0, -1) as any,
      current: detected[detected.length - 1] || 'searxng' as any,
      velocity: velocity(detected),
      estimated_arrival: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Calculate confidence score based on findings
   */
  private calculateConfidence(findings: FINDING[]): number {
    if (findings.length === 0) return 0;

    const sourceScores: Record<string, number> = {
      github: 0.95,
      hackernews: 0.9,
      reddit: 0.75,
      searxng: 0.7,
    };

    let totalScore = 0;
    for (const finding of findings) {
      totalScore += sourceScores[finding.source] || 0.5;
    }

    // Factor in quantity and diversity
    const uniqueSources = new Set(findings.map(f => f.source)).size;
    const quantityBonus = Math.min(findings.length / 20, 0.2);
    const diversityBonus = Math.min(uniqueSources / 4, 0.15);

    const baseConfidence = totalScore / findings.length;

    return Math.min(baseConfidence + quantityBonus + diversityBonus, 0.98);
  }

  /**
   * Generate summary from findings
   */
  private generateSummary(findings: FINDING[]): string {
    if (findings.length === 0) return 'No findings collected.';

    const platforms = Array.from(new Set(findings.map(f => f.source)));
    const entities = new Set(findings.map(f => f.entity));

    return `Collected ${findings.length} findings from ${platforms.length} platforms ` +
      `covering ${entities.size} unique entities. Sources include: ${platforms.join(', ')}.`;
  }

  /**
   * Extract key insights from findings
   */
  private extractInsights(findings: FINDING[]): string[] {
    const insights: string[] = [];

    // Group by source
    const bySource = new Map<string, FINDING[]>();
    for (const finding of findings) {
      const existing = bySource.get(finding.source) || [];
      existing.push(finding);
      bySource.set(finding.source, existing);
    }

    // Generate insight for each active source
    for (const [source, sourceFindings] of bySource) {
      insights.push(`${source}: ${sourceFindings.length} relevant data points collected`);
    }

    return insights.slice(0, 5);
  }

  /**
   * Generate predictions based on trends
   */
  private generatePredictions(findings: FINDING[]): any[] {
    // Simple prediction based on GitHub and HN presence
    const platforms = new Set(findings.map(f => f.source));

    const predictions = [];

    if (platforms.has('github') && platforms.has('hackernews')) {
      predictions.push({
        projection: 'High likelihood of mainstream coverage within 24-48 hours',
        confidence: 0.75,
        timeframe: '24-48 hours',
        signals: ['GitHub trending', 'HackerNews coverage'],
      });
    }

    if (platforms.has('reddit')) {
      predictions.push({
        projection: 'Reddit discussion expected to increase',
        confidence: 0.65,
        timeframe: '12-24 hours',
        signals: ['Active subreddit discussions'],
      });
    }

    return predictions;
  }

  /**
   * Generate recommendations based on findings
   */
  private generateRecommendations(findings: FINDING[]): string[] {
    const recommendations: string[] = [];
    const platforms = new Set(findings.map(f => f.source));

    if (!platforms.has('github')) {
      recommendations.push('Consider monitoring GitHub for developer adoption signals');
    }

    if (findings.length < 10) {
      recommendations.push('Expand search query or add more data sources for comprehensive coverage');
    }

    recommendations.push('Monitor collected sources for follow-up developments');

    return recommendations;
  }

  /**
   * Extract unique sources
   */
  private extractSources(findings: FINDING[]) {
    const seen = new Set<string>();
    const sources: any[] = [];

    for (const finding of findings) {
      const key = finding.source;
      if (!seen.has(key)) {
        seen.add(key);
        sources.push({
          platform: finding.source,
          reliability_score: 0.8,
          freshness: finding.timestamp,
        });
      }
    }

    return sources;
  }

  /**
   * Test all collectors
   */
  async testCollectors(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    const collectors = this.registry.getAll();

    console.log('\n🧪 Testing collectors...');

    for (const collector of collectors) {
      try {
        results[collector.getPlatform()] = await collector.test();
      } catch (error) {
        results[collector.getPlatform()] = false;
      }
    }

    return results;
  }
}

// Export main class
export default EchoOSINT;

// Quick-start function for CLI usage
export async function main() {
  const engine = new EchoOSINT();

  // Test collectors first
  console.log('\n═══════════════════════════════════════════════════');
  console.log('   ECHO-OSINT: Autonomous Intelligence Engine v0.1');
  console.log('═══════════════════════════════════════════════════\n');

  // Check for command line args
  const args = process.argv.slice(2);
  const query = args.join(' ') || 'artificial intelligence trends 2025';

  if (args.length === 0) {
    console.log('Usage: npm run dev -- "<your query>"');
    console.log('Example: npm run dev -- "what are the latest trends in AI"\n');
  }

  // Run test
  console.log('📋 Testing data collectors...\n');
  const testResults = await engine.testCollectors();

  for (const [platform, status] of Object.entries(testResults)) {
    console.log(`  ${status ? '✅' : '❌'} ${platform}`);
  }

  // Run query
  console.log(`\n🔍 Running intelligence query: "${query}"\n`);

  const result = await engine.query(query);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('   INTELLIGENCE RESULT');
  console.log('═══════════════════════════════════════════════════\n');

  console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`📁 Sources: ${result.sources.length}`);
  console.log(`🔍 Findings: ${result.findings.length}\n`);

  console.log('📝 SYNTHESIS:\n');
  console.log(result.synthesis.summary);
  console.log('\n💡 Key Insights:');

  for (const insight of result.synthesis.key_insights) {
    console.log(`  • ${insight}`);
  }

  if (result.synthesis.predictions.length > 0) {
    console.log('\n🔮 Predictions:');
    for (const pred of result.synthesis.predictions) {
      console.log(`  • ${pred.projection} (${(pred.confidence * 100).toFixed(0)}% confidence)`);
    }
  }

  if (result.synthesis.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    for (const rec of result.synthesis.recommendations) {
      console.log(`  • ${rec}`);
    }
  }

  console.log('\n');
}

// Run main if executed directly
if (require.main === module) {
  main().catch(console.error);
}