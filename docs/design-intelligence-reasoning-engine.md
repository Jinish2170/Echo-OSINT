# Echo-OSINT: The Reasoning Engine — Beyond Adaptive Pivoting

**Date:** 2026-04-05
**Purpose:** Define what makes the system genuinely intelligent, not just adaptive

---

## The Remaining Gap

The adaptive pivot loop (OODA cycle) is better than a linear pipeline. But it's still:
1. Find something → run next module → find something → repeat

The problem: **this is breadth-first search dressed up as intelligence.** It's systematic, not reasoning. It doesn't form hypotheses, test them, discard false paths, or build understanding incrementally.

### What Real Intelligence Does

A human OSINT analyst doesn't methodically run every available tool. They:

1. **Form hypotheses**: "jsmith42 probably uses the same email everywhere"
2. **Test hypotheses**: Check if GitHub-proton.me email appears elsewhere
3. **Abandon false paths**: "The WHOIS registrant has a common name — probably unrelated"
4. **Follow strong signals**: "This email format (first.last@company) is unusual — the company is small, worth investigating"
5. **Notice contradictions**: "jsmith42 claims to be in London but their GitHub activity timezone is US Pacific"
6. **Recognize patterns**: "Three of jsmith42's projects have dependencies on the same obscure library — they work on a specific tech stack"
7. **Change strategy**: "Username recon found nothing unusual. Switch to email-based approach instead"

The key insight: **intelligence is NOT about finding everything. It's about forming and testing beliefs about what's true.**

---

## The Reasoning Architecture

### Layer 1: Belief Space (Not Finding Space)

Instead of accumulating findings, the system maintains a **belief space**:

```typescript
interface BELIEF {
  id: string;
  statement: string;                    // "jsmith42 works at CompanyXYZ"
  confidence: number;                   // 0.0 - 1.0
  evidenceFor: EVIDENCE[];
  evidenceAgainst: EVIDENCE[];
  status: 'hypothesis' | 'likely' | 'established' | 'refuted';
  importance: number;                   // How central is this belief to understanding the target?
  dependencies: string[];               // Other beliefs this one depends on
  discoveredAt: Date;
  lastUpdated: Date;
}
```

Every finding is processed into beliefs:
- Finding: "GitHub bio says 'at CompanyXYZ'" → updates belief: `jsmith42 works at CompanyXYZ` (confidence +0.3)
- Finding: "LinkedIn has no CompanyXYZ affiliation" → adds evidenceAgainst same belief (confidence -0.1)
- Finding: "jsmith@companyxyz.com found in breach" → updates belief: `jsmith42 has company email` (confidence +0.5)

### Layer 2: Hypothesis Generation Engine

After each recon cycle, the system generates hypotheses from its current belief space:

```
Current established beliefs:
  - jsmith42 has email jsmith@companyxyz.com (confidence: 0.85)
  - companyxyz.com WHOIS shows registrant "Jane Smith" (confidence: 0.80)
  - companyxyz.com uses Google Workspace (confidence: 0.95)

Generated hypotheses to investigate:
  1. "Jane Smith may be related to jsmith42"
     → Evidence: Same company domain, "Smith" matches pattern
     → Test method: Search for Jane Smith social profiles + company records
     → Priority: HIGH — would establish a key relationship

  2. "CompanyXYZ is a small company (corporate email but unknown brand)"
     → Evidence: No news mentions, no social media presence for company
     → Test method: Company registry search, business databases
     → Priority: MEDIUM — context about target's organization

  3. "companyxyz.com has other subdomains we haven't found"
     → Evidence: Only found www and mail subdomains so far
     → Test method: Subdomain enumeration (crt.sh, DNS brute-force)
     → Priority: HIGH — subdomains may reveal infrastructure
```

### Layer 3: Strategy Selection

The system isn't limited to one strategy. It reasons about which strategy to use:

| Observation | Strategy Switch |
|-------------|----------------|
| Username found on 40+ platforms | **AMPLIFY** — check profiles for contact info, cross-link data |
| Username found on 2-5 platforms | **DEEPEN** — full content analysis of each profile |
| Username found on 0 platforms | **PIVOT** — try email search, domain search, or full name instead |
| Email found in breaches | **FOLLOW** — investigate breach context, leaked data, associated accounts |
| Domain reveals person name | **BRANCH** — new person reconnaissance as parallel investigation |
| Contradictory evidence | **VERIFY** — dedicated verification cycle for the contradictory claim |
| Finding is time-sensitive | **PRIORITIZE** — investigate this path immediately before signal decays |
| Multiple entities share attributes | **CLUSTER** — group entities and find the connecting structure |

### Layer 4: The Investigation Tree

```
                    ┌─────────────────────┐
                    │ TARGET: jsmith42    │
                    │ Hypothesis: active   │
                    │ online presence      │
                    └──────────┬──────────┘
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
    │ H1: found    │    │ H2: has      │    │ H3: works    │
    │ on multiple  │    │ public       │    │ at tech      │
    │ platforms    │    │ email in     │    │ company      │
    │ CONFIRMED    │    │ bio           │    │ CONFIRMED    │
    │ (47 found)   │    │ CONFIRMED    │    │ (GitHub +    │
    │              │    │ (proton.me)  │    │  email)      │
    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
           │                   │                   │
    ┌──────▼──────┐    ┌──────▼──────┐    ┌──────▼───────┐
    │ Hypothesis: │    │ Hypothesis: │    │ Hypothesis:  │
    │ same username│   │ email in    │    │ Jane Smith   │
    │ = same person│    │ breaches    │    │ is related   │
    │ VERIFYING   │    │ VERIFYING   │    │ VERIFYING    │
    └─────────────┘    └─────────────┘    └──────────────┘
```

Each hypothesis branches into sub-hypotheses. Confirmed hypotheses become established beliefs. Refuted ones are pruned. The tree grows organically based on what makes sense.

---

## The Actual Intelligence Loop (Reasoning-Based)

```
┌─────────────────────────────────────────────────────────────────┐
│                    REASONING CYCLE                               │
│                                                                  │
│  CYCLE START                                                     │
│  ───────────                                                     │
│                                                                  │
│  Phase 1: REASON (What do we believe? What are we uncertain about?)
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ Input: Current belief space (established beliefs,        │     │
│  │        hypotheses, refuted claims)                       │     │
│  │ Output: Updated beliefs, new hypotheses,                │     │
│  │         investigation strategy                           │     │
│  │                                                          │     │
│  │ Process:                                                  │     │
│  │ 1. Evaluate existing hypotheses against new evidence     │     │
│  │ 2. Update confidence scores (Bayesian-style)             │     │
│  │ 3. Generate new hypotheses from established beliefs      │     │
│  │ 4. Prioritize hypotheses by importance × testability     │     │
│  │ 5. Select strategy (AMPLIFY/DEEPEN/PIVOT/FOLLOW/        │     │
│  │                    BRANCH/VERIFY/PRIORITIZE/CLUSTER)     │     │
│  └────────────────────────┬────────────────────────────────┘     │
│                           │                                      │
│                           ▼                                      │
│  Phase 2: INVESTIGATE (Run the most valuable recon)              │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ Input: Top-priority hypothesis, selected strategy        │     │
│  │ Output: New findings from recon modules                  │     │
│  │                                                          │     │
│  │ Process:                                                  │     │
│  │ 1. Select recon modules that can test the hypothesis     │     │
│  │ 2. Execute modules with focused parameters               │     │
│  │ 3. Process raw findings into evidence                    │     │
│  │ 4. Score evidence reliability                            │     │
│  └────────────────────────┬────────────────────────────────┘     │
│                           │                                      │
│                           ▼                                      │
│  Phase 3: SYNTHESIZE (What have we learned?)                     │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ Input: New evidence, current belief space                │     │
│  │ Output: Updated beliefs, changed hypothesis states       │     │
│  │                                                          │     │
│  │ Process:                                                  │     │
│  │ 1. Map evidence to relevant beliefs (support/refute)     │     │
│  │ 2. Update belief confidence scores                       │     │
│  │ 3. Promote/demote hypothesis statuses                    │     │
│  │ 4. Detect contradictions between beliefs                 │     │
│  │ 5. Identify belief clusters (related belief groups)      │     │
│  └────────────────────────┬────────────────────────────────┘     │
│                           │                                      │
│                           ▼                                      │
│  CYCLE END — Repeat or stop                                     │
│  ─────────────────────                                          │
│  Stop conditions:                                                │
│  - Top hypotheses all resolved (established or refuted)         │
│  - No testable hypotheses remaining                             │
│  - Max iterations reached                                       │
│  - Budget (API calls) exhausted                                 │
│  - User intervention (interactive mode)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## The LLM's Real Role (Not Summarization)

### LLM as Hypothesis Generator

```
PROMPT:
You are an intelligence analyst investigating the target: jsmith42

Current beliefs:
ESTABLISHED (confidence > 0.8):
  • jsmith42 has GitHub profile with email jsmith@proton.me
  • jsmith42 uses CompanyXYZ email (jsmith@companyxyz.com)
  • CompanyXYZ domain registered to "Jane Smith"

LIKELY (confidence 0.5-0.8):
  • jsmith42 works at CompanyXYZ
  • Jane Smith may be jsmith42's real name or relative

UNCERTAIN (confidence < 0.5):
  • jsmith42's location (claimed: London, evidence: US Pacific timezone)

Generate 3-5 specific, testable hypotheses.
For each, suggest which recon module would test it.
Format: JSON array of {hypothesis, importance, testMethod, expectedEvidence}
```

### LLM as Evidence Evaluator

```
PROMPT:
You are evaluating evidence for the claim: "jsmith42 works at CompanyXYZ"

Supporting evidence:
  1. [GitHub bio] jsmith42's GitHub says "developer at CompanyXYZ"
     Source reliability: 0.85 (self-declared, public)
  2. [Email pattern] jsmith@companyxyz.com uses standard corporate format
     Source reliability: 0.90 (email verified in breach)

Contradicting evidence:
  1. [LinkedIn absence] No LinkedIn profile found for "jsmith CompanyXYZ"
     Source reliability: 0.60 (absence of evidence ≠ evidence of absence)

Evaluate: Is this claim sufficiently supported?
What additional evidence would strengthen or weaken it?

Return JSON: {claim, confidence, reasoning, recommendedNextStep}
```

### LLM as Contradiction Resolver

```
PROMPT:
Contradiction detected:
  Belief A: "jsmith42 is in London" (confidence: 0.6, from LinkedIn)
  Belief B: "jsmith42 operates in US-Pacific timezone" (confidence: 0.8, from GitHub commit timestamps)

These beliefs conflict. Analyze possible resolutions:
  1. jsmith42 moved from London to US-Pacific (both true, at different times)
  2. jsmith42 works remotely for London company from US (both true, different meanings of "in")
  3. One source is wrong
  4. The GitHub account may not belong to jsmith42

Which resolution is most plausible? What evidence would resolve this?
```

---

## The Belief Update Mechanism (Bayesian-Inspired)

```typescript
function updateBelief(belief: BELIEF, newEvidence: EVIDENCE): BELIEF {
  const prior = belief.confidence;
  const evidenceReliability = newEvidence.reliability;
  const evidenceStance = newEvidence.supports ? 1 : -1;

  // Bayesian-inspired update:
  // positive evidence pushes confidence up, negative pulls down
  // stronger evidence has more impact
  // diminishing returns near 0 and 1 (harder to change established beliefs)

  const impact = evidenceReliability * (1 - prior * evidenceStance) * 0.3;
  // Near 0 or 1: (1 - prior) is small → harder to shift
  // In middle: maximum impact

  const newConfidence = evidenceStance > 0
    ? prior + impact * (1 - prior)  // Push up, asymptotically toward 1
    : prior - impact * prior;        // Push down, asymptotically toward 0

  belief.confidence = Math.max(0, Math.min(1, newConfidence));

  if (evidenceStance > 0) {
    belief.evidenceFor.push(newEvidence);
  } else {
    belief.evidenceAgainst.push(newEvidence);
  }

  // Update status thresholds
  if (belief.confidence > 0.85 && belief.evidenceFor.length >= 2) {
    belief.status = 'established';
  } else if (belief.confidence > 0.5) {
    belief.status = 'likely';
  } else if (belief.confidence > 0.2) {
    belief.status = 'hypothesis';
  } else if (belief.evidenceAgainst.length >= 2) {
    belief.status = 'refuted';
  }

  return belief;
}
```

Key property: **It takes multiple independent pieces of evidence to establish a belief, but a single strong contradiction can significantly reduce confidence.** This mirrors real intelligence analysis.

---

## The Output: Intelligence Briefing (Not Report)

The output is structured as an intelligence briefing, not a data dump:

```
═══════════════════════════════════════════════════════════
 INTELLIGENCE BRIEF — jsmith42
 Generated: 2026-04-05 11:00 UTC | 4 reasoning cycles
═══════════════════════════════════════════════════════════

ASSESSMENT (Established Facts — confidence > 85%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ✓ jsmith42 maintains active GitHub account with 12 public repos
   Evidence: GitHub API (verified), cross-checked with activity log
 ✓ jsmith42 uses email jsmith@proton.me
   Evidence: Self-declared in GitHub bio, found in 3 HIBP breaches
 ✓ jsmith42 is affiliated with CompanyXYZ (companyxyz.com)
   Evidence: GitHub bio, corporate email format, domain WHOIS

KEY ASSESSMENTS (Likely — confidence 50-85%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ≈ CompanyXYZ appears to be a small fintech startup
   Evidence: Domain registrant "Jane Smith", Google Workspace setup
   Missing: Company registry records, public business filings
 ≈ jsmith42's role is backend development
   Evidence: GitHub repos show Django/PostgreSQL stack
   Confidence limited by: No job title disclosed

CONTRADICTIONS (Require resolution)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⚠ Claimed location: London (LinkedIn) vs Operating timezone: US Pacific
   Possible explanations: Remote work, relocated, or account sharing
   Resolution: Check CompanyXYZ office locations, recent post timestamps

LEADS (Unverified — worth investigating)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 → Jane Smith (CompanyXYZ registrant) — possible business partner
   Recommended: Full person recon on Jane Smith + CompanyXYZ
 → CompanyXYZ S3 bucket at api.companyxyz.com — publicly readable
   Recommended: Infrastructure assessment
 → jsmith42 deleted repository "api-keys" — cached content unknown
   Recommended: GitHub Archive/Internet Archive search

NEGATIVE FINDINGS (What we looked for but didn't find)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ✗ No Twitter/X activity since 2022 (account appears dormant)
 ✗ No Reddit posts matching jsmith42 username
 ✗ No public LinkedIn profile for "jsmith" or "Jane Smith CompanyXYZ"
 ─ These negatives are informative: jsmith42 reduces social media exposure

DISCOVERY TIMELINE
━━━━━━━━━━━━━━━━━━
 Cycle 0 (15s): 47 platforms checked, 8 matches found
 Cycle 1 (30s): Email recon on 2 addresses, 3 breach matches
 Cycle 2 (45s): Domain recon on companyxyz.com, WHOIS + DNS
 Cycle 3 (60s): Infrastructure scan, 2 open ports identified
 Total: 45 API calls, 2 min 30 sec

CONFIDENCE IN OVERALL ASSESSMENT: 76%
Based on 3 established facts, 2 likely assessments, 1 contradiction
Primary uncertainty: CompanyXYZ size/nature, jsmith42's exact role
```

---

## How This Differs Fundamentally From All Existing Designs

| Traditional Scanner | Previous Echo-OSINT Design | This Design |
|---------------------|--------------------------|-------------|
| Runs all modules | Runs adaptive pivot loop | Maintains belief space |
| Dumps findings | Prioritizes by significance | Forms and tests hypotheses |
| No state between runs | State = investigation file | State = belief network |
| Confidence = formula | Confidence = evidence count | Confidence = Bayesian update |
| Output = data list | Output = prioritized report | Output = intelligence briefing |
| "Here's everything we found" | "Here's what matters most" | "Here's what we believe, with evidence, and what we're uncertain about" |

The user doesn't want more data. They want **answers to their questions with transparent evidence and identified uncertainties.** This is what intelligence analysts actually deliver.

---

## Implementation: The Reasoning Engine Code

```typescript
class ReasoningEngine {
  private beliefSpace = new Map<string, BELIEF>();
  private history: REASONING_CYCLE[] = [];

  async reasonCycle(
    target: TARGET,
    reconModules: ReconRegistry,
    llm: LLMProvider,
    options: ReasoningOptions
  ): Promise<REASONING_RESULT> {
    // Step 1: ASSESS current belief state
    const assessment = this.assessBeliefs();

    // Step 2: GENERATE hypotheses
    const hypotheses = await this.generateHypotheses(llm, assessment);

    // Step 3: PRIORITIZE — what can we test?
    const testable = this.prioritizeForTesting(hypotheses);

    // Step 4: SELECT strategy
    const strategy = this.selectStrategy(testable, assessment);

    // Step 5: INVESTIGATE — run recon
    const newEvidence = await this.investigate(testable, strategy, reconModules);

    // Step 6: UPDATE beliefs with new evidence
    for (const evidence of newEvidence) {
      this.applyEvidence(evidence);
    }

    // Step 7: DETECT contradictions
    const contradictions = this.detectContradictions();

    // Step 8: CHECK stop conditions
    const shouldStop = this.checkStopConditions(options);

    const cycle: REASONING_CYCLE = {
      iteration: this.history.length + 1,
      assessment,
      hypothesesGenerated: hypotheses.length,
      evidencesCollected: newEvidence.length,
      beliefsUpdated: this.countUpdatedBeliefs(),
      contradictions: contradictions.length,
      shouldStop,
    };

    this.history.push(cycle);

    return { cycle, assessment };
  }

  async fullInvestigation(
    target: TARGET,
    reconModules: ReconRegistry,
    llm: LLMProvider,
    options: InvestigationOptions
  ): Promise<INTELLIGENCE_BRIEF> {
    this.beliefSpace.clear();
    this.history = [];

    // Seed initial beliefs from the target
    this.seedInitialBeliefs(target);

    // Initial broad sweep — establish baseline
    const initialFindings = await this.broadSweep(target, reconModules);
    for (const finding of initialFindings) {
      this.applyEvidence(finding.toEvidence());
    }

    // Reasoning cycles (adaptive loop)
    for (let i = 0; i < options.maxCycles; i++) {
      const result = await this.reasonCycle(target, reconModules, llm, {
        maxCycles: options.maxCycles,
        stopOnNoProgress: true,
        stopOnAllResolved: true,
      });

      if (result.cycle.shouldStop) break;

      // Interactive mode: present findings to user
      if (options.interactive && result.cycle.evidencesCollected > 0) {
        const questions = this.generateFollowUpQuestions(result);
        const userResponse = await options.onInteractive(questions);
        if (userResponse?.redirect) {
          this.seedNewBeliefs(userResponse.redirect);
        }
      }
    }

    return this.generateBrief();
  }
}
```

---

## The Complete System View

```
┌────────────────────────────────────────────────────────────────┐
│                     ECHO-OSINT v0.3                             │
│                  (Intelligence Engine)                          │
│                                                                 │
│  ┌────────────┐    ┌─────────────────┐    ┌────────────────┐  │
│  │  TARGET    │    │  DETERMINISTIC  │    │  INTELLIGENCE  │  │
│  │  INPUT     │───→│   RECON LAYER   │───→│  REASONING     │  │
│  │  (username,│    │  - Collectors   │    │  LAYER         │  │
│  │   email,   │    │  - Modules      │    │  - Belief      │  │
│  │   domain,  │    │  - HTTP         │    │    Space       │  │
│  │   IP)      │    │  - Cache        │    │  - Hypothesis  │  │
│  └────────────┘    │  - Rate Limit   │    │    Generator   │  │
│                    └──────┬──────────┘    │  - Strategy    │  │
│                           │               │    Selector    │  │
│                           │               │  - Contradict  │  │
│                    ┌──────▼──────────┐    │    Resolver    │  │
│                    │  EVIDENCE       │    │  - Bayesian    │  │
│                    │  PIPELINE       │    │    Updates     │  │
│                    │  - Extract      │    └───────┬────────┘  │
│                    │  - Normalize    │            │           │
│                    │  - Score        │            │           │
│                    └─────────────────┘            │           │
│                                                   │           │
│                                          ┌────────▼────────┐  │
│                                          │  INTELLIGENCE   │  │
│                                          │  BRIEF          │  │
│                                          │  - Established  │  │
│                                          │  - Likely       │  │
│                                          │  - Contradict.  │  │
│                                          │  - Leads        │  │
│                                          │  - Timeline     │  │
│                                          └─────────────────┘  │
│                                                                 │
│  Phase 3 Enhancement:                                           │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  LLM LAYER (optional):                                │      │
│  │  • Hypothesis generation from belief patterns         │      │
│  │  • Evidence evaluation and weighting                  │      │
│  │  • Contradiction resolution suggestions               │      │
│  │  • Follow-up question generation                      │      │
│  │  • Executive summary writing                          │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
│  Phase 4 Enhancement:                                           │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  ECHO TRACKER:                                       │      │
│  │  • Signal origin detection                           │      │
│  │  • Cross-platform velocity                          │      │
│  │  • Amplification network mapping                     │      │
│  │  • Propagation prediction                           │      │
│  └──────────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────────┘
```
