# Echo-OSINT: Product Definition — What It Is, Who It's For, How It Works

**Date:** 2026-04-05
**Purpose:** Definitive product specification — the "what" before the "how"

---

## The Product in One Sentence

**Echo-OSINT is an autonomous intelligence engine that investigates a target, forms and tests hypotheses, follows evidence chains, and delivers an intelligence briefing with transparent evidence and identified uncertainties.**

---

## Who It's For (Three Personas)

### Persona 1: The Hunter
**Role:** Pentester, bug bounty hunter, red teamer
**Problem:** "I need to find attack surface fast and prioritize what's exploitable."
**How they use it:** Give it a company domain → get prioritized vulnerability map with proof
**What they'd pay for:** Attack surface automation, CVE correlation, exploit chain mapping
**Current workflow:** Manual subdomain enum → Shodan → manual vuln research → report writing (4-6 hours)
**Echo-OSINT:** Domain input → automated recon → prioritized findings with CVEs → report ready (15 minutes)

### Persona 2: The Investigator
**Role:** Investigative journalist, corporate analyst, legal researcher
**Problem:** "I need to find connections between people, companies, and assets — with evidence I can cite."
**How they use it:** Give it a person name/username → get evidence-backed investigation report
**What they'd pay for:** Source verification, evidence chains, timeline generation, exportable reports
**Current workflow:** Manual searches across 10+ sites → spreadsheet tracking → manual cross-referencing → write-up (8-12 hours)
**Echo-OSINT:** Target input → hypothesis-driven investigation → evidence-linked briefing (30 minutes)

### Persona 3: The Watcher
**Role:** Security analyst, threat intelligence, corporate monitoring
**Problem:** "I need to know when something significant changes — and what it means."
**How they use it:** Set up monitoring targets → get alerts on anomalies → periodic intelligence reports
**What they'd pay for:** Persistent monitoring, anomaly detection, alert quality (not quantity)
**Current workflow:** Manual periodic checks → alert fatigue from too many tools → missed signals
**Echo-OSINT:** Set watch targets → automated monitoring → "only alert me on significant changes"

---

## What It Does (Core Capabilities — Phase 1)

### 1. Target Reconnaissance
- **Username recon**: Check across 50+ platforms, extract contact info from profiles
- **Domain recon**: WHOIS, DNS, subdomains, SSL certs, tech fingerprinting
- **Email recon**: HIBP breach check, format analysis, associated accounts
- **Infrastructure recon**: Shodan/Censys port scan, service detection, CVE mapping

### 2. Reasoning Engine (The Intelligence Part)
- **Belief space**: Maintains established facts, likely claims, and uncertainties separately
- **Hypothesis generation**: Each finding generates new questions to investigate
- **Evidence tracking**: Every claim has sources, reliability scores, and contradicting evidence
- **Bayesian confidence**: Confidence updates based on evidence strength, decays with contradictions
- **Contradiction detection**: "These two findings conflict — here's why and how to resolve it"

### 3. Intelligence Briefing (The Output)
- **Established facts**: What we know with high confidence (with full evidence chain)
- **Likely assessments**: What probably is true (with caveats about uncertainty)
- **Contradictions**: What conflicts and possible explanations
- **Leads**: What's worth investigating next (with specific recommendations)
- **Negative findings**: What we looked for but didn't find (also intelligence)
- **Timeline**: Chronological view of discoveries and events

### 4. Investigation State
- **Save/Resume**: Investigations persist to JSON files, can be continued later
- **Pivot**: Add new targets mid-investigation ("also check this email we just found")
- **Compare**: Run investigation again later and see what changed

---

## What Makes It Different

### vs. SpiderFoot
SpiderFoot runs 200+ modules and dumps 500+ entities. The user has to manually figure out what matters. Echo-OSINT says: "Here are the 3 things that matter, here's why, and here's the evidence."

### vs. Maltego
Maltego requires manual transform selection and graph building. Echo-OSINT automates the investigation while still giving the user full control over direction (interactive mode).

### vs. Manual OSINT
Manual OSINT is slow, misses connections, and doesn't track evidence systematically. Echo-OSINT follows evidence chains a human would miss because it checks every hypothesis and never gets "tunnel vision."

---

## The Intelligence Loop (In Plain English)

```
You give it a target: "jsmith42"

It starts broad: Checks 50+ platforms where that username might exist.
From what it finds, it extracts: emails, names, domains, organizations.

Now it gets smart:
  It found "jsmith@proton.me" in a GitHub bio → checks if that email
  appears in any data breaches → found in 3 breaches, one from
  "FinTech Co" → now it investigates FinTech Co → discovers the
  company domain → runs domain recon → finds the domain registrant
  is "Jane Smith" → is she related to jsmith42? → investigates
  Jane Smith separately → finds she's CTO at FinTech Co and jsmith42
  is listed as "freelance developer" in her LinkedIn posts.

What started as "check this username" became "discovered a contractor
relationship between jsmith42 and FinTech Co, with CTO Jane Smith."

The system didn't just find data — it CONNECTED the dots.
```

---

## What It's NOT

- **Not a passive scanner**: It actively reasons about what to investigate next
- **Not an AI chatbot**: The AI doesn't chat — it analyzes evidence and generates hypotheses
- **Not a data lake**: It doesn't store everything — it maintains beliefs and curates findings
- **Not a replacement for human analysts**: It amplifies them — handles the tedious discovery, surfaces what matters

---

## Build Philosophy

| Principle | Applied To |
|-----------|-----------|
| Deterministic first, AI second | Core pipeline works without LLM; LLM enhances it |
| Evidence over claims | Every number has an audit trail |
| Hypotheses over checklists | Ask "what could be true?" not "what should I check?" |
| Significance over volume | 5 important findings > 500 raw findings |
| Transparent over magical | User sees HOW every conclusion was reached |
| Adaptable over rigid | System changes strategy based on what it finds |

---

## Revised Implementation Plan

### Phase 1 (Weeks 1-3): Belief Space + Core Recon
**Goal:** Working system that investigates and reasons (no LLM)

1. Type system: Target, BELIEF, BELIEF_STATUS, EvidenceLink, EvidenceType
2. BeliefSpace class: Map of beliefs with Bayesian update mechanism
3. BaseReconModule + ReconRegistry (username, domain, email modules)
4. HTTP client: retry, timeout, TTL cache, global concurrency pool
5. SignificanceEngine: novelty + rarity + severity + timeliness scoring
6. EvidenceStore: structured evidence creation from recon module results
7. ReasoningEngine:
   - AssessBeliefs: evaluate current state
   - HypothesisGenerator: rule-based hypothesis generation from beliefs
   - StrategySelector: AMPLIFY/DEEPEN/PIVOT/FOLLOW/BRANCH/VERIFY
   - ContradictionDetector: find conflicting beliefs
   - StopConditionChecker: when to stop investigating
8. IntelligenceBrief generator: structured output
9. InvestigationState: save/load/resume
10. CLI: `echo-osint recon jsmith42 --mode hunter`

### Phase 2 (Weeks 4-6): Adaptive Loop + AI Enhancement
**Goal:** LLM-powered hypothesis generation and evidence evaluation

11. LLM integration with structured output (NVIDIA NIM, JSON schema)
12. AI hypothesis generation (from belief patterns, not just rules)
13. AI evidence evaluation (weighing conflicting evidence)
14. AI contradiction resolution (suggest explanations for conflicts)
15. Interactive mode: follow-up questions for the user
16. Infrastructure recon module (Shodan/Censys)
17. Breach monitoring (HIBP + pastebin)
18. Identity resolver (probabilistic graph)

### Phase 3 (Weeks 7-9): Echo Signal Tracking + Persistent Watch
**Goal:** Temporal tracking and continuous monitoring

19. Signal origin detection across platforms
20. Velocity calculation and visualization
21. Cross-platform propagation correlation
22. Monitor registry (scheduled scans)
23. Anomaly detection (compare current vs. previous)
24. Alert system (significant change notifications)
25. HTML reports with signal timeline

---

## File Structure (Final — Intelligence-Focused)

```
src/
├── index.ts                          # EchoOSINT class (full stack entry)
├── cli.ts                            # CLI entry point
├── config/index.ts                   # Configuration (only what's implemented)
├── types/
│   ├── target.ts                     # Target, TargetType
│   ├── belief.ts                     # BELIEF, EvidenceLink, BeliefStatus
│   ├── intelligence.ts               # INTELLIGENCE_BRIEF, ReasoningCycle
│   └── recon.ts                      # ReconResult, ReconReport
├── collectors/                       # EXISTING (content research — unchanged)
│   └── ...
├── osint/
│   ├── base.ts                       # BaseReconModule, ReconRegistry
│   ├── http.ts                       # HTTP client (retry, timeout, cache)
│   ├── significance.ts               # SignificanceEngine
│   └── collectors/
│       ├── username.ts               # Platform enumeration
│       ├── domain.ts                 # WHOIS + DNS + subdomains + certs
│       ├── email.ts                  # HIBP + enrichment
│       └── infrastructure.ts         # Shodan/Censys (Phase 2)
├── reasoning/                        # THE INTELLIGENCE PART
│   ├── engine.ts                     # ReasoningEngine (main orchestrator)
│   ├── belief-space.ts               # BELIEF storage + Bayesian updates
│   ├── hypothesis-generator.ts       # Rule-based (Phase 1) + LLM (Phase 2)
│   ├── strategy-selector.ts          # AMPLIFY/DEEPEN/PIVOT/FOLLOW/BRANCH/VERIFY
│   ├── contradiction-detector.ts     # Conflict detection in belief space
│   └── stop-conditions.ts            # When to stop investigating
├── investigation/                    # STATE MANAGEMENT
│   ├── state.ts                      # InvestigationState (save/load)
│   └── monitor.ts                    # MonitorRegistry (Phase 3)
├── report/
│   ├── brief.ts                      # IntelligenceBrief generator
│   └── markdown.ts                   # Markdown formatter
├── ai/                               # Phase 2
│   ├── agent.ts                      # OSINTAgent (LLM-powered reasoning)
│   ├── tools.ts                      # Recon modules exposed as agent tools
│   └── prompts.ts                    # System prompts for reasoning
└── echo/                             # Phase 3
    ├── signal.ts                     # Signal tracking
    ├── propagation.ts                # Cross-platform correlation
    └── velocity.ts                   # Velocity calculation
```

---

## The North Star Metric

**Not:** Number of findings per investigation
**But:** Percentage of investigations where the system discovers a non-obvious connection the user didn't know about

If Echo-OSINT only confirms what the user already knows, it fails. If it regularly uncovers relationships, affiliations, or vulnerabilities the user hadn't considered, it succeeds.

This is the metric that matters: **discovery rate of non-obvious connections.**
