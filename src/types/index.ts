// Echo-OSINT v0.2 Core Types - Phase 1: Type System + Belief Space + Significance Engine

export type TARGET_TYPE = 'username' | 'email' | 'domain' | 'ip';
export type PLATFORM = 'reddit' | 'github' | 'hackernews' | 'searxng' | 'youtube' | 'rss';
export type BELIEF_STATUS = 'established' | 'likely' | 'uncertain';
export type FINDING_TYPE = 'entity' | 'relationship' | 'credential' | 'breach' | 'infrastructure';

export interface Target {
  id: string;
  value: string;
  type: TARGET_TYPE;
  discoveredAt: Date;
  source?: string;
}

export interface EvidenceLink {
  id: string;
  source: string;
  sourceType: 'api' | 'web' | 'user' | 'derived';
  data: string;
  reliability: number; // 0-1
  collectedAt: Date;
  verified: boolean;
  verificationNote?: string;
}

export interface Belief {
  id: string;
  targetId: string;
  claim: string;
  status: BELIEF_STATUS;
  confidence: number; // 0-1
  evidence: EvidenceLink[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Finding {
  id: string;
  target: Target;
  type: FINDING_TYPE;
  value: string;
  source: string;
  sourceUrl?: string;
  significance: SignificanceScore;
  evidence: EvidenceLink[];
  collectedAt: Date;
}

export interface EvidenceStore {
  addEvidence(beliefId: string, evidence: EvidenceLink): void;
  getEvidence(beliefId: string): EvidenceLink[];
  getAllEvidence(): Map<string, EvidenceLink[]>;
}

export interface BeliefSpace {
  beliefs: Map<string, Belief>;
  addBelief(belief: Belief): void;
  updateBelief(beliefId: string, evidence: EvidenceLink, isPositive: boolean): void;
  getBeliefsByStatus(status: BELIEF_STATUS): Belief[];
  getBelief(beliefId: string): Belief | undefined;
  getTargetBeliefs(targetId: string): Belief[];
  detectContradictions(): Contradiction[];
}

export interface Contradiction {
  beliefIdA: string;
  beliefIdB: string;
  claimA: string;
  claimB: string;
  severity: 'high' | 'medium' | 'low';
  explanation?: string;
}

export interface SignificanceScore {
  novelty: number;    // 0-1, how unexpected
  rarity: number;     // 0-1, how common
  severity: number;   // 0-1, impact if true
  timeliness: number; // 0-1, how current
  total: number;      // weighted sum
}

export interface EvidenceStore {
  addEvidence(beliefId: string, evidence: EvidenceLink): void;
  getEvidence(beliefId: string): EvidenceLink[];
  getAllEvidence(): Map<string, EvidenceLink[]>;
}

export interface BeliefSpace {
  beliefs: Map<string, Belief>;
  addBelief(belief: Belief): void;
  updateBelief(beliefId: string, evidence: EvidenceLink, isPositive: boolean): void;
  getBeliefsByStatus(status: BELIEF_STATUS): Belief[];
  getBelief(beliefId: string): Belief | undefined;
  getTargetBeliefs(targetId: string): Belief[];
  detectContradictions(): Contradiction[];
}

export interface Contradiction {
  beliefIdA: string;
  beliefIdB: string;
  claimA: string;
  claimB: string;
  severity: 'high' | 'medium' | 'low';
  explanation?: string;
}

export interface SignificanceScore {
  novelty: number;    // 0-1, how unexpected
  rarity: number;     // 0-1, how common
  severity: number;   // 0-1, impact if true
  timeliness: number; // 0-1, how current
  total: number;      // weighted sum
}

export interface Finding {
  id: string;
  target: Target;
  type: 'entity' | 'relationship' | 'credential' | 'breach' | 'infrastructure';
  value: string;
  source: string;
  sourceUrl?: string;
  significance: SignificanceScore;
  evidence: EvidenceLink[];
  collectedAt: Date;
}

export interface IntelligenceBrief {
  target: Target;
  mode: 'hunter' | 'investigator' | 'watcher';
  startedAt: Date;
  completedAt?: Date;
  establishedFacts: Belief[];
  likelyAssessments: Belief[];
  contradictions: Contradiction[];
  leads: Lead[];
  negativeFindings: string[];
  timeline: TimelineEvent[];
  summary: string;
}

export interface Lead {
  id: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
  estimatedEffort: string;
}

export interface TimelineEvent {
  timestamp: Date;
  action: string;
  finding?: Finding;
  belief?: Belief;
}

export interface InvestigationState {
  id: string;
  target: Target;
  mode: 'hunter' | 'investigator' | 'watcher';
  depth: 'quick' | 'normal' | 'deep';
  beliefs: Belief[];
  findings: Finding[];
  brief?: IntelligenceBrief;
  createdAt: Date;
  updatedAt: Date;
  iteration: number;
}

export type InvestigationStrategy = 'AMPLIFY' | 'DEEPEN' | 'PIVOT' | 'FOLLOW' | 'BRANCH' | 'VERIFY';

export interface Hypothesis {
  id: string;
  beliefId: string;
  claim: string;
  testable: boolean;
  strategy: InvestigationStrategy;
  createdAt: Date;
}