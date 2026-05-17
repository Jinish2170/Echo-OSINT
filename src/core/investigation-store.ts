// File-based investigation persistence
// Saves each completed recon to investigations/YYYY-MM-DD/{targetId}.json
import fs from 'fs';
import path from 'path';
import { Target, Finding, Belief, IntelligenceBrief, Contradiction } from '../types';

export interface InvestigationRecord {
  id: string;
  target: Target;
  mode: 'hunter' | 'investigator' | 'watcher';
  depth: 'quick' | 'normal' | 'deep';
  findings: Finding[];
  beliefs: Belief[];
  contradictions: Contradiction[];
  brief: IntelligenceBrief;
  stats: {
    totalFindings: number;
    establishedFacts: number;
    likelyAssessments: number;
    leads: number;
    negativeFindings: number;
  };
  createdAt: string;
}

export interface InvestigationSummary {
  id: string;
  target: { value: string; type: string };
  mode: string;
  createdAt: string;
  stats: InvestigationRecord['stats'];
}

function sanitize(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

function dateDir(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export class InvestigationStore {
  private root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
    fs.mkdirSync(this.root, { recursive: true });
  }

  save(record: InvestigationRecord): string {
    const dir = path.join(this.root, dateDir(new Date(record.createdAt)));
    fs.mkdirSync(dir, { recursive: true });
    const filename = `${sanitize(record.target.value)}__${record.id}.json`;
    const fullPath = path.join(dir, filename);
    fs.writeFileSync(fullPath, JSON.stringify(record, null, 2), 'utf8');
    return path.relative(this.root, fullPath);
  }

  list(limit = 100): InvestigationSummary[] {
    if (!fs.existsSync(this.root)) return [];
    const dayDirs = fs.readdirSync(this.root, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort()
      .reverse();

    const summaries: InvestigationSummary[] = [];
    for (const day of dayDirs) {
      const dayPath = path.join(this.root, day);
      const files = fs.readdirSync(dayPath).filter(f => f.endsWith('.json'));
      files.sort().reverse();
      for (const f of files) {
        try {
          const raw = fs.readFileSync(path.join(dayPath, f), 'utf8');
          const rec = JSON.parse(raw) as InvestigationRecord;
          summaries.push({
            id: rec.id,
            target: { value: rec.target.value, type: rec.target.type },
            mode: rec.mode,
            createdAt: rec.createdAt,
            stats: rec.stats,
          });
          if (summaries.length >= limit) return summaries;
        } catch {
          // skip corrupt file
        }
      }
    }
    return summaries;
  }

  get(id: string): InvestigationRecord | null {
    if (!fs.existsSync(this.root)) return null;
    const dayDirs = fs.readdirSync(this.root, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const day of dayDirs) {
      const dayPath = path.join(this.root, day);
      const files = fs.readdirSync(dayPath).filter(f => f.endsWith('.json'));
      const match = files.find(f => f.includes(id));
      if (match) {
        try {
          const raw = fs.readFileSync(path.join(dayPath, match), 'utf8');
          return JSON.parse(raw) as InvestigationRecord;
        } catch {
          return null;
        }
      }
    }
    return null;
  }
}

let _store: InvestigationStore | null = null;
export function getInvestigationStore(): InvestigationStore {
  if (!_store) {
    const root = process.env.ECHO_INVESTIGATIONS_DIR || path.join(process.cwd(), 'investigations');
    _store = new InvestigationStore(root);
  }
  return _store;
}
