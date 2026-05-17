// Echo-OSINT v0.2 - Main Entry Point
import express from 'express';
import cors from 'cors';
import { createUsernameRecon, detectTargetType } from './recon/username';
import { createDomainRecon } from './recon/domain';
import { createBeliefSpace } from './core/belief-space';
import { createBriefGenerator } from './core/brief-generator';
import { httpClient } from './core/http-client';
import { Target, Finding, Belief, TimelineEvent } from './types';

export { httpClient, detectTargetType };
export { createUsernameRecon, createDomainRecon } from './recon';
export { createBeliefSpace, createBriefGenerator } from './core';

// Re-export types
export type { Target, Finding, Belief, TimelineEvent, IntelligenceBrief, InvestigationState } from './types';

// Create and configure Express app
export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  return app;
}

// Run reconnaissance on a target
export async function runRecon(
  targetValue: string,
  mode: 'hunter' | 'investigator' | 'watcher' = 'investigator',
  depth: 'quick' | 'normal' | 'deep' = 'normal'
): Promise<{
  target: Target;
  findings: Finding[];
  beliefs: Belief[];
  brief: import('./types').IntelligenceBrief;
  stats: { totalFindings: number; establishedFacts: number; likelyAssessments: number; leads: number; negativeFindings: number };
}> {
  const targetType = detectTargetType(targetValue);
  const target: Target = {
    id: `tgt-${Date.now()}`,
    value: targetValue,
    type: targetType,
    discoveredAt: new Date(),
  };

  const findings: Finding[] = [];
  const timeline: TimelineEvent[] = [];

  timeline.push({ timestamp: new Date(), action: `Target: ${targetValue} (${targetType})` });

  // Run recon based on type
  if (targetType === 'username') {
    const usernameRecon = createUsernameRecon(target);
    const usernameFindings = await usernameRecon.run();
    findings.push(...usernameFindings);
    timeline.push(...usernameFindings.map(f => ({ timestamp: new Date(), action: `Found: ${f.source}`, finding: f })));
  } else if (targetType === 'domain') {
    const domainRecon = createDomainRecon(target);
    const domainFindings = await domainRecon.run();
    findings.push(...domainFindings);
    timeline.push(...domainFindings.map(f => ({ timestamp: new Date(), action: `Found: ${f.type} record`, finding: f })));
  }

  // Create beliefs
  const beliefSpace = createBeliefSpace();
  for (const finding of findings) {
    const belief: Belief = {
      id: `bel-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      targetId: target.id,
      claim: `${finding.source}: ${finding.value}`,
      status: finding.significance.total > 0.85 ? 'established' : finding.significance.total > 0.5 ? 'likely' : 'uncertain',
      confidence: finding.significance.total,
      evidence: finding.evidence,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    beliefSpace.addBelief(belief);
  }

  const contradictions = beliefSpace.detectContradictions();
  const briefGen = createBriefGenerator();
  const brief = briefGen.generate(target, mode, findings, Array.from(beliefSpace.beliefs.values()), contradictions, timeline);

  return {
    target,
    findings,
    beliefs: Array.from(beliefSpace.beliefs.values()),
    brief,
    stats: {
      totalFindings: findings.length,
      establishedFacts: brief.establishedFacts.length,
      likelyAssessments: brief.likelyAssessments.length,
      leads: brief.leads.length,
      negativeFindings: brief.negativeFindings.length,
    },
  };
}

// CLI main
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  Echo-OSINT v0.2 - Autonomous Intelligence Engine         ║
╠════════════════════════════════════════════════════════════╣
║  Usage:                                                    ║
║    npm run dev -- <target> [mode] [depth]                  ║
║    npm run api          # Start API server on :3001         ║
║                                                            ║
║  Examples:                                                 ║
║    npm run dev -- octocat investigator                     ║
║    npm run dev -- github.com investigator deep             ║
║    npm run dev -- user@example.com hunter                   ║
╚════════════════════════════════════════════════════════════╝
`);
    return;
  }

  const [target, mode = 'investigator', depth = 'normal'] = args;
  console.log(`\n🔍 Running reconnaissance on: ${target}\n`);

  const result = await runRecon(target, mode as any, depth as any);

  console.log(`\n📊 Results for ${target}:`);
  console.log(`   Mode: ${mode} | Depth: ${depth}`);
  console.log(`   Findings: ${result.stats.totalFindings}`);
  console.log(`   Established Facts: ${result.stats.establishedFacts}`);
  console.log(`   Leads: ${result.stats.leads}\n`);

  console.log(`📝 Brief:\n   ${result.brief.summary}\n`);

  if (result.brief.leads.length > 0) {
    console.log(`🔦 Top Leads:`);
    result.brief.leads.slice(0, 3).forEach((lead, i) => {
      console.log(`   ${i + 1}. [${lead.priority.toUpperCase()}] ${lead.description}`);
    });
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}