// Echo-OSINT Express API Server
import express from 'express';
import cors from 'cors';
import { createUsernameRecon, detectTargetType } from '../recon/username';
import { createDomainRecon } from '../recon/domain';
import { createBeliefSpace } from '../core/belief-space';
import { createBriefGenerator } from '../core/brief-generator';
import { httpClient } from '../core/http-client';
import { getInvestigationStore } from '../core/investigation-store';
import { Target, Finding, Belief, TimelineEvent, IntelligenceBrief } from '../types';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Types for API requests
interface ReconRequest {
  target: string;
  mode?: 'hunter' | 'investigator' | 'watcher';
  depth?: 'quick' | 'normal' | 'deep';
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main reconnaissance endpoint
app.post('/recon', async (req, res): Promise<void> => {
  const { target: targetValue, mode = 'investigator', depth = 'normal' } = req.body as ReconRequest;

  if (!targetValue) {
    res.status(400).json({ error: 'Target is required' });
    return;
  }

  console.log(`[${new Date().toISOString()}] Starting reconnaissance for: ${targetValue}`);

  try {
    // Detect target type
    const targetType = detectTargetType(targetValue);
    console.log(`Detected target type: ${targetType}`);

    const target: Target = {
      id: `tgt-${Date.now()}`,
      value: targetValue,
      type: targetType,
      discoveredAt: new Date(),
    };

    // Run appropriate recon modules
    const findings: Finding[] = [];
    const timeline: TimelineEvent[] = [];

    timeline.push({
      timestamp: new Date(),
      action: `Target identified: ${targetValue} (${targetType})`,
    });

    if (targetType === 'username') {
      timeline.push({ timestamp: new Date(), action: 'Running username reconnaissance' });
      const usernameRecon = createUsernameRecon(target);
      const usernameFindings = await usernameRecon.run();
      findings.push(...usernameFindings);

      for (const finding of usernameFindings) {
        timeline.push({ timestamp: new Date(), action: `Found: ${finding.source}`, finding });
      }
    } else if (targetType === 'domain') {
      timeline.push({ timestamp: new Date(), action: 'Running domain reconnaissance' });
      const domainRecon = createDomainRecon(target);
      const domainFindings = await domainRecon.run();
      findings.push(...domainFindings);

      for (const finding of domainFindings) {
        timeline.push({ timestamp: new Date(), action: `Found: ${finding.type} record`, finding });
      }
    } else {
      // For email and IP, use username recon as placeholder
      timeline.push({ timestamp: new Date(), action: 'Running target reconnaissance' });
      const usernameRecon = createUsernameRecon(target);
      const genericFindings = await usernameRecon.run();
      findings.push(...genericFindings);
    }

    // Create beliefs from findings
    const beliefSpace = createBeliefSpace();
    for (const finding of findings) {
      const belief: Belief = {
        id: `bel-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        targetId: target.id,
        claim: `${finding.source}: ${finding.value}`,
        status: finding.significance.total > 0.85 ? 'established' :
                finding.significance.total > 0.5 ? 'likely' : 'uncertain',
        confidence: finding.significance.total,
        evidence: finding.evidence,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      beliefSpace.addBelief(belief);
    }

    // Detect contradictions
    const contradictions = beliefSpace.detectContradictions();

    // Generate brief
    const briefGenerator = createBriefGenerator();
    const brief = briefGenerator.generate(
      target,
      mode as 'hunter' | 'investigator' | 'watcher',
      findings,
      Array.from(beliefSpace.beliefs.values()),
      contradictions,
      timeline
    );

    console.log(`[${new Date().toISOString()}] Reconnaissance complete: ${findings.length} findings`);

    const stats = {
      totalFindings: findings.length,
      establishedFacts: brief.establishedFacts.length,
      likelyAssessments: brief.likelyAssessments.length,
      leads: brief.leads.length,
      negativeFindings: brief.negativeFindings.length,
    };

    // Persist investigation for History tab and resume support
    try {
      const store = getInvestigationStore();
      const relPath = store.save({
        id: target.id,
        target,
        mode: mode as 'hunter' | 'investigator' | 'watcher',
        depth: depth as 'quick' | 'normal' | 'deep',
        findings,
        beliefs: Array.from(beliefSpace.beliefs.values()),
        contradictions,
        brief,
        stats,
        createdAt: new Date().toISOString(),
      });
      console.log(`[${new Date().toISOString()}] Saved investigation: ${relPath}`);
    } catch (err) {
      console.error('Failed to save investigation:', err);
    }

    res.json({
      success: true,
      target,
      findings,
      beliefs: Array.from(beliefSpace.beliefs.values()),
      contradictions,
      brief,
      stats,
    });
  } catch (error) {
    console.error('Reconnaissance error:', error);
    res.status(500).json({
      error: 'Reconnaissance failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// List past investigations (most recent first)
app.get('/investigations', (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10) || 50, 200);
    const summaries = getInvestigationStore().list(limit);
    res.json({ success: true, count: summaries.length, investigations: summaries });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list investigations', message: err instanceof Error ? err.message : String(err) });
  }
});

// Get a single investigation by id (full record)
app.get('/investigation/:id', (req, res) => {
  const record = getInvestigationStore().get(req.params.id);
  if (!record) {
    res.status(404).json({ error: 'Investigation not found', id: req.params.id });
    return;
  }
  res.json({ success: true, ...record });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     ███████╗███████╗██████╗ ██╗   ██╗███████╗██████╗      ║
║     ██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗     ║
║     █████╗  ███████╗██████╔╝██║   ██║█████╗  ██████╔╝     ║
║     ██╔══╝  ╚════██║██╔═══╝ ██║   ██║██╔══╝  ██╔══██╗     ║
║     ███████╗███████║██║     ╚██████╔╝███████╗██║  ██║     ║
║     ╚══════╝╚══════╝╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝     ║
║                                                            ║
║     Autonomous Intelligence Engine v0.2                    ║
║     API Server running on http://localhost:${PORT}             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

  Endpoints:
  - GET  /health                Health check
  - POST /recon                 Start reconnaissance (auto-persists)
  - GET  /investigations        List past investigations
  - GET  /investigation/:id     Get full investigation by target id

  Request body:
  {
    "target": "username, domain, email, or IP",
    "mode": "hunter|investigator|watcher",
    "depth": "quick|normal|deep"
  }

  Example:
  curl -X POST http://localhost:${PORT}/recon \\
    -H "Content-Type: application/json" \\
    -d '{"target": "octocat", "mode": "investigator"}'
`);
});

export default app;