// BeliefSpace - Bayesian belief maintenance with evidence chains
import { Belief, BELIEF_STATUS, EvidenceLink, BeliefSpace, Contradiction } from '../types';

export class BeliefSpaceImpl implements BeliefSpace {
  beliefs: Map<string, Belief> = new Map();

  addBelief(belief: Belief): void {
    this.beliefs.set(belief.id, belief);
  }

  updateBelief(beliefId: string, evidence: EvidenceLink, isPositive: boolean): void {
    const belief = this.beliefs.get(beliefId);
    if (!belief) return;

    // Bayesian-inspired update with diminishing returns near 0 and 1
    const currentConf = belief.confidence;
    const evidenceWeight = evidence.reliability * 0.3; // Evidence contributes up to 30%

    let delta: number;
    if (isPositive) {
      // Positive evidence increases confidence with diminishing returns
      delta = evidenceWeight * (1 - currentConf);
    } else {
      // Negative evidence decreases confidence with diminishing returns
      delta = -evidenceWeight * currentConf;
    }

    const newConfidence = Math.max(0.01, Math.min(0.99, currentConf + delta));
    const newStatus: BELIEF_STATUS = newConfidence > 0.85 ? 'established' :
                                   newConfidence >= 0.5 ? 'likely' : 'uncertain';

    belief.confidence = newConfidence;
    belief.status = newStatus;
    belief.evidence.push(evidence);
    belief.updatedAt = new Date();

    this.beliefs.set(beliefId, belief);
  }

  getBeliefsByStatus(status: BELIEF_STATUS): Belief[] {
    return Array.from(this.beliefs.values()).filter(b => b.status === status);
  }

  getBelief(beliefId: string): Belief | undefined {
    return this.beliefs.get(beliefId);
  }

  getTargetBeliefs(targetId: string): Belief[] {
    return Array.from(this.beliefs.values()).filter(b => b.targetId === targetId);
  }

  detectContradictions(): Contradiction[] {
    const contradictions: Contradiction[] = [];
    const beliefs = Array.from(this.beliefs.values());

    for (let i = 0; i < beliefs.length; i++) {
      for (let j = i + 1; j < beliefs.length; j++) {
        const a = beliefs[i];
        const b = beliefs[j];

        // Check for same target but conflicting claims
        if (a.targetId === b.targetId && this.areContradictory(a.claim, b.claim)) {
          const severity = this.calculateContradictionSeverity(a, b);
          contradictions.push({
            beliefIdA: a.id,
            beliefIdB: b.id,
            claimA: a.claim,
            claimB: b.claim,
            severity,
            explanation: this.explainContradiction(a, b),
          });
        }
      }
    }

    return contradictions;
  }

  private areContradictory(claimA: string, claimB: string): boolean {
    // Simple keyword-based contradiction detection
    const contradictions: [string, string][] = [
      ['london', 'us'], ['uk', 'us'], ['europe', 'america'],
      ['san francisco', 'new york'], ['Seattle', 'Miami'],
      ['verified', 'fake'], ['real', 'fake'], ['active', 'banned'],
    ];

    const aLower = claimA.toLowerCase();
    const bLower = claimB.toLowerCase();

    for (const [wordA, wordB] of contradictions) {
      if (aLower.includes(wordA) && bLower.includes(wordB)) return true;
      if (aLower.includes(wordB) && bLower.includes(wordA)) return true;
    }

    // Check for explicit negation conflicts
    const aHasNegation = aLower.includes('not ') || aLower.includes('nt');
    const bHasPositive = bLower.includes('is ') && !bLower.includes('not ');
    if (aHasNegation && bHasPositive) return true;

    return false;
  }

  private calculateContradictionSeverity(a: Belief, b: Belief): 'high' | 'medium' | 'low' {
    const confDiff = Math.abs(a.confidence - b.confidence);
    const avgConf = (a.confidence + b.confidence) / 2;

    if (avgConf > 0.7 && confDiff < 0.2) return 'high';
    if (avgConf > 0.5 || confDiff < 0.3) return 'medium';
    return 'low';
  }

  private explainContradiction(a: Belief, b: Belief): string {
    // Could be different sources, timing, or context
    const sourceA = a.evidence[0]?.source || 'unknown';
    const sourceB = b.evidence[0]?.source || 'unknown';

    if (sourceA !== sourceB) {
      return `Different sources may have conflicting information: ${sourceA} vs ${sourceB}`;
    }
    return 'Contradicting claims detected from evidence';
  }
}

export function createBeliefSpace(): BeliefSpaceImpl {
  return new BeliefSpaceImpl();
}
