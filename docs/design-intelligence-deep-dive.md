# Echo-OSINT: The Intelligence Problem — Deep Dive

**Date:** 2026-04-05
**Purpose:** Solve the fundamental question — how do you make an OSINT tool INTELLIGENT, not just thorough?

---

## Part 1: The Use Case Problem — Who Needs What?

Every OSINT tool fails because they try to serve everyone. Let's be surgical.

### The Three Real User Archetypes

#### A. The Hunter (Penetration Tester / Bug Bounty)
**Scenario:** "I'm hired to pentest Acme Corp. I need to find every entry point before I touch their infrastructure."

**What they ACTUALLY do:**
1. Start with a company name or domain
2. Discover subdomains (they don't care about DNS records — they want attack surface)
3. Find technologies used (they want: is there a known CVE?)
4. Find email formats, employee names (they want: who can I phish?)
5. Find exposed APIs, leaked credentials, exposed repos (they want: direct attack vectors)
6. Map relationships between all discovered assets

**What they output:** A pentest report with findings, severity, and proof of concept.

**What frustrates them about current tools:**
- SpiderFoot gives them 500 entities with no prioritization → manual triage hell
- Tools don't prioritize by risk → they spend hours on low-value findings
- No connection to vulnerability databases → they have to cross-reference manually
- Tools don't follow chains (subdomain → IP → open port → known vuln → exploit)

**Intelligence needs:**
- **Risk-driven automation** — "This subdomain runs an outdated Apache with known CVEs — FLAG IT"
- **Chain following** — don't just find the asset, follow the trail to the vulnerability
- **Prioritized results** — critical findings first, not alphabetical

---

#### B. The Investigator (Journalist / Researcher / Analyst)
**Scenario:** "I'm investigating whether this company is connected to this political figure."

**What they ACTUALLY do:**
1. Start with a person name or email or username
2. Find linked assets (domains, companies, social profiles)
3. Cross-reference with public records, leaks, past investigations
4. Find the connections: same address, same company registration, same domain WHOIS
5. Build a timeline of events and relationships
6. Verify every claim with multiple independent sources

**What they output:** An article/report with claims, evidence, and source attribution.

**What frustrates them about current tools:**
- Tools don't verify — finding something ≠ confirming it's true
- Tools don't build timelines — they dump data without chronology
- Tools don't distinguish rumor from evidence
- No source chain: "where did this finding come from and how reliable is it?"

**Intelligence needs:**
- **Evidence chains** — "Claim X is supported by Source A (reliable 0.9) and Source B (moderate 0.6)"
- **Temporal analysis** — "This domain was registered 2 weeks before the scandal broke"
- **Cross-source verification** — "Email found in breach matches WHOIS registrant"
- **Credibility assessment** — rate sources, flag unreliable data, highlight contradictions

---

#### C. The Watcher (Corporate Intelligence / Threat Intel / Security Team)
**Scenario:** "Monitor for any mention of our company, leaks of our data, or emerging threats."

**What they ACTUALLY do:**
1. Set up monitoring targets (company name, executive names, product names, code snippets)
2. Continuously scan sources for mentions
3. Assess if mentions are significant (news, rumors, leaks, coordinated campaigns)
4. Track how signals evolve over time (growing threat vs. one-off mention)
5. Alert on anomalies (sudden spike in mentions, new credentials in breach dumps)

**What they output:** Alerts and periodic threat intelligence reports.

**What frustrates them about current tools:**
- No persistent monitoring — tools are one-shot, not continuous
- No signal-vs-noise distinction — every mention is an alert = alert fatigue
- No context — "someone mentioned our company" vs. "a known threat actor mentioned our company"
- No velocity tracking — is this trending up or was it a flash that died?

**Intelligence needs:**
- **Persistent monitoring** — run recon on schedule, compare to previous results
- **Anomaly detection** — "This is the first time this email appeared in a breach"
- **Signal velocity** — "Mentions increased 3x this week vs. last month"
- **Context enrichment** — "This isn't just any mention — it's from a known APT forum"

---

## Part 2: The Intelligence Cycle — What Makes It Intelligent?

The intelligence community has a formal cycle for a reason. It works:

```
PLANNING → COLLECTION → PROCESSING → ANALYSIS → DISSEMINATION → (back to PLANNING with new PIRs)
```

Where PIRs = Priority Intelligence Requirements (the questions you're trying to answer).

### The Loop is the Intelligence

The difference between a scanner and an intelligence system:

| Scanner | Intelligence System |
|---------|-------------------|
| Run once, dump results | Continuous loop — findings generate new questions |
| Returns all data | Filters by relevance to PIRs |
| No adaptation | Strategy adapts based on what it finds |
| Static pipeline | Dynamic — follows the trail |
| Results are endpoint | Results are starting point for next query |

### The Missing Mechanism: Adaptive Pivoting

This is the CORE intelligence capability. Here's what it looks like:

```
TARGET: "jsmith42"

Step 1: Username recon across 50 platforms → Found on GitHub, Reddit, Twitter
  ↳ INTELLIGENT INSIGHT: GitHub profile shows email in bio: john.smith@proton.me
  ↳ PIVOT DECISION: Run email recon on john.smith@proton.me

Step 2: Email recon on john.smith@proton.me → Found in HIBP (3 breaches in 2019)
  ↳ INTELLIGENT INSIGHT: One breach was from "CompanyXYZ" — previously unknown affiliation
  ↳ PIVOT DECISION: Run domain recon on companyxyz.com

Step 3: Domain recon on companyxyz.com → WHOIS shows registrant: "Jane Doe"
  ↳ INTELLIGENT INSIGHT: Jane Doe is not jsmith — potential business partner or adversary
  ↳ PIVOT DECISION: Run person recon on "Jane Doe CompanyXYZ"

Step 4: Person recon on "Jane Doe" → LinkedIn shows she's CTO at CompanyXYZ
  ↳ INTELLIGENT INSIGHT: jsmith was listed as "freelance developer" in her LinkedIn posts
  ↳ INTELLIGENT PREDICTION: jsmith is likely a contractor. Check GitHub for CompanyXYZ repositories.

Step 5: GitHub search for "CompanyXYZ jsmith" → jsmith contributed to 3 private repos now public
  ↳ INTELLIGENT INSIGHT: One repo contains API keys in commit history
  ↳ ALERT FLAG: Exposed credentials discovered
```

A scanner stops at Step 1. An intelligence system follows the chain for 5 steps because **each finding generates the next question**.

### This Requires Three Capabilities:

#### 1. Pattern Recognition
The system recognizes patterns in collected data:
- "This email was in breaches from companies the target was affiliated with"
- "This domain's registrant has the same name as a person found on Reddit"
- "This GitHub repo was created 2 days before the target claimed the affiliation"
- "These two accounts have nearly identical bio text — likely same person"

#### 2. Pivot Decision Making
The system knows what to investigate next:
- Found email? → Check HIBP, check associated accounts, check email format conventions
- Found domain? → Check WHOIS, check subdomains, check certificates
- Found vulnerability? → Check if exploitable, check if similar vulns exist on other assets
- Found relationship? → Check the other end of the relationship, check its network

#### 3. Significance Assessment
The system evaluates whether a finding matters:
- "Username found on 2 platforms" → NOT SIGNIFICANT (common username)
- "Username found on 47 out of 50 platforms" → HIGHLY SIGNIFICANT (very active person)
- "Email found in old 2013 breach" → MODERATE (data is stale)
- "Email found in yesterday's breach" → CRITICAL (active threat)
- "Domain registered 10 years ago" → NOT SIGNIFICANT (established business)
- "Domain registered 2 days ago with target's name" → HIGHLY SIGNIFICANT (new development)

---

## Part 3: The Architecture — How Intelligence Actually Works

### The Agent-Centric Model (Not Pipeline)

Instead of: `Target → Collect → Enrich → Report` (linear pipeline)

Use: `Target → Intelligence Engine → Adaptive Cycle → Report`

The Intelligence Engine is an **agent loop**:

```
┌─────────────────────────────────────────────────────────┐
│                  INTELLIGENCE ENGINE                     │
│                                                         │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────┐  │
│  │   OBSERVE   │───→│    ORIENT    │───→│  DECIDE    │  │
│  │  What do we │    │ What does it │    │  What next │  │
│  │  have?      │    │ mean?        │    │  do we run?│  │
│  └─────────────┘    └──────────────┘    └─────┬──────┘  │
│       ▲                                       │          │
│       │                                       │          │
│       │          ┌──────────────┐    ┌────────▼──────┐  │
│       │    ┌─────┤   ASSESS     │←───┤    ACT        │  │
│       │    │     │ Is this      │    │ Run recon     │  │
│       │    │     │ significant? │    │ on new target │  │
│       │    │     └──────────────┘    └───────────────┘  │
│       │    │                                             │
│       └────┘                                             │
│        │                                                 │
│        ▼                                                 │
│  ┌─────────────┐                                        │
│  │ DISSEMINATE │  (when loop completes or significance  │
│  │   REPORT    │   findings are ready for the user)     │
│  └─────────────┘                                        │
└─────────────────────────────────────────────────────────┘
                     OODA Loop
         (Observe → Orient → Decide → Act)
```

### Three Engine Modes (Matching Three User Archetypes)

#### Mode A: Deep Recon (for The Hunter)
```
Input: Target (domain/company/IP)
Engine: Runs max N iterations of adaptive pivoting
Stop condition: No new significant findings found, or depth limit reached
Output: Attack surface map with prioritized vulnerabilities
```

#### Mode B: Investigation (for The Investigator)
```
Input: Target (person/entity) + PIRs (specific questions)
Engine: Runs cycles to answer PIRs, following evidence chains
Stop condition: All PIRs answered, or no new evidence paths
Output: Investigation report with claims, evidence, and timeline
```

#### Mode C: Persistent Watch (for The Watcher)
```
Input: Monitoring targets (company, executives, keywords)
Engine: Scheduled scans, anomaly detection, velocity tracking
Stop condition: Continuous (with configurable schedule)
Output: Alerts + periodic reports with trend analysis
```

### The Intelligence Data Model

Not just entities and relationships. Each piece of intelligence has:

```typescript
interface INTELLIGENCE_ITEM {
  id: string;
  type: 'finding' | 'assessment' | 'lead' | 'alert';
  claim: string;              // "jsmith42 owns the domain evil-corp.com"
  evidence: EVIDENCE_LINK[];   // Source, data, reliability score
  confidence: number;          // 0-1, weighted by evidence quality
  significance: 'critical' | 'high' | 'medium' | 'low' | 'negligible';
  relevance: number;           // 0-1, how relevant to the original PIR
  analysisNotes: string[];     // LLM-generated or rule-generated analysis
  createdAt: Date;
  updatedBy: string[];         // Which cycles updated/enriched this item
}

interface EVIDENCE_LINK {
  source: string;              // "whois", "hibp", "github"
  data: Record<string, unknown>;
  reliability: number;         // Source reliability score
  verified: boolean;           // Cross-verified by another source?
  verificationSource?: string; // If verified, which other source confirmed?
}
```

### The Pivot Engine — How the System Decides What to Do Next

The intelligent part is the PIVOT ENGINE. It takes the current intelligence state and decides:

```typescript
interface PIVOT_DECISION {
  trigger: string;              // What finding triggered this decision
  action: 'recon' | 'verify' | 'deepen' | 'expand' | 'monitor';
  targetType: TARGET_TYPE;
  targetValue: string;
  reason: string;               // "Email found in breach — checking associated accounts"
  priority: number;             // Higher = run sooner
  maxDepth: number;             // How many iterations to follow this lead
}
```

**The Pivot Rules (examples):**

| Trigger Finding | Pivot Action | Max Depth |
|----------------|-------------|-----------|
| Email found in recon | Run email recon (HIBP, format analysis) | 2 |
| WHOIS reveals new domain | Run domain recon on that domain | 3 |
| Subdomain discovered | Run port scan on subdomain's IP | 2 |
| Person found with name | Run social profile search on that name | 2 |
| Username found on social | Check same username on other platforms | 1 |
| Common username on >10 platforms | Check if any profiles contain contact info | 2 |
| Vulnerability found on asset | Deepen: check exploit availability | 3 |
| Person connected to company | Expand: recon company infrastructure | 3 |
| Breached credential found | Verify: attempt to find source/context of breach | 2 |
| Sudden spike in platform mentions | Monitor: set up persistent watch | 1 |

**Stop Conditions (when the loop ends):**

1. **No significant findings** — last 2 cycles produced no new items above "low" significance
2. **Depth limit reached** — user set max_iterations=5, we're at 5
3. **PIRs satisfied** — all questions have been answered with confidence >0.7
4. **Budget exhausted** — API rate limits or user-defined request cap

### The Significance Engine — What Matters and Why

The significance engine evaluates each finding on 4 axes:

| Axis | Question | Example |
|------|---------|---------|
| Novelty | Is this new? | First time this email seen vs. third instance |
| Rarity | Is this uncommon? | Exposed SSH port vs. exposed HTTP |
| Severity | How bad is it? | Critical CVE vs. informational finding |
| Timeliness | How fresh is it? | Breach yesterday vs. breach 5 years ago |

Combined:
```
significance_score = novelty * 0.3 + rarity * 0.25 + severity * 0.3 + timeliness * 0.15
```

This automatically prioritizes:
- **Critical:** New, rare, severe, fresh (exposed credentials of target's admin)
- **High:** New, moderately common, moderately severe (vulnerable service found)
- **Medium:** Somewhat new, common, low severity (outdated software version)
- **Low:** Not new, very common, benign (standard DNS records)

---

## Part 4: The LLM's Actual Role — Not Decoration

Previous designs used LLMs to "summarize results" or "generate executive summary." That's cosmetic. The LLM's REAL roles in an intelligent OSINT system:

### Role 1: The Pivot Decider
After each recon cycle, the LLM receives:
- Current intelligence items
- What's been tried
- What's been found
- Original questions

The LLM decides: "What should we investigate next?"

Prompt structure:
```
You are an intelligence analyst. You have the following findings:
[Previous findings ranked by significance]

Based on these findings, what should we investigate next?
Choose from: run_email_recon, run_domain_recon, run_person_recon,
                              run_infra_recon, verify_finding, stop

Return your decision as JSON: { action: string, target: string, reason: string }
```

This is a REAL intelligence function — the system adapts its strategy based on what it finds.

### Role 2: The Pattern Analyst
The LLM analyzes relationships and finds non-obvious patterns:
```
"Analysis: jsmith42's email was found in 3 breaches, all from companies
in the same industry (fintech). This suggests jsmith42 works in fintech,
not general software development. The WHOIS registrant for companyxyz.com
shares a last name with jsmith42 — potential family business connection.
Recommend investigating: (1) jsmith42's GitHub for fintech-related repos,
(2) the registrant's other domain registrations."
```

### Role 3: The Evidence Verifier
Confidence is calculated from evidence, not formulas. The LLM evaluates:

```
"Claim: jsmith42 owns companyxyz.com
   Evidence 1: Domain WHOIS shows registrant name similar to jsmith42's real name (from GitHub)
     → Reliability: 0.7 (WHOIS can be faked, names may be coincidental)
   Evidence 2: jsmith42's GitHub bio mentions "working at CompanyXYZ"
     → Reliability: 0.85 (self-declared, but consistent with Evidence 1)
   Evidence 3: CompanyXYZ's Twitter follows jsmith42
     → Reliability: 0.6 (correlation, not causation)
   Combined confidence: 0.78
   Cross-verification: WHOIS email uses companyxyz.com domain — consistent
   Assessment: LIKELY. Recommend verifying with additional evidence.
```

### Role 4: The Question Generator
The LLM generates follow-up questions for the user:
```
Based on our findings, we have unanswered questions:
1. Who is Jane Doe? Found as WHOIS registrant for companyxyz.com — should we investigate?
2. The GitHub repo api-keys was deleted. Should we search for the cached content?
3. jsmith42 has an old Twitter account (inactive since 2022). Archive check?
4. CompanyXYZ has 3 subdomains pointing to AWS. Full AWS recon?

Please respond with numbers or type your own investigation direction.
```

---

## Part 5: The Complete Architecture

### The Intelligence Engine

```typescript
class IntelligenceEngine {
  // Deterministic layer
  private collectors: CollectorRegistry;       // Content collectors (existing)
  private reconModules: ReconRegistry;          // Recon modules (new)
  private httpCache: TTLCache;                  // Request deduplication

  // Intelligence layer
  private pivotEngine: PivotEngine;             // Decides what to investigate next
  private significanceEngine: SignificanceEngine;
  private identityGraph: IdentityGraph;         // Probabilistic identity resolution
  private evidenceStore: EvidenceStore;         // All intelligence items

  // AI layer (uses NVIDIA NIM)
  private llm: LLMProvider;                     // The analyst
  private structuredOutput: StructuredLLM;      // JSON schema enforced responses

  // Investigation management
  private investigations: Map<string, Investigation>;
  private monitoring: MonitorRegistry;          // Persistent watch targets

  /**
   * Main entry: Deep Adaptive Recon
   *
   * This is the intelligence loop — not a pipeline.
   */
  async deepRecon(
    target: Target,
    options?: {
      mode: 'hunter' | 'investigator' | 'watcher';
      pir?: string[];           // Priority Intelligence Requirements
      maxIterations?: number;   // How many pivot cycles
      depth?: 'quick' | 'normal' | 'deep';
      interactive?: boolean;    // Ask user for direction between cycles
    }
  ): Promise<IntelligenceReport> {
    const investigation = this.createInvestigation(target);
    const config = this.resolveConfig(options);

    // Cycle 0: Initial broad sweep
    const initialFindings = await this.initialSweep(target, config);
    investigation.add(initialFindings);

    // Adaptive loop
    for (let i = 0; i < config.maxIterations; i++) {
      // OBSERVE: What do we have?
      const currentItems = investigation.getItemsAboveSignificance('low');

      // ASSESS: Did this cycle find anything significant?
      const previousSignificantItems = investigation.getSignificantItemCount();

      // DECIDE: What should we investigate next?
      const pivotDecision = await this.pivotEngine.decide(
        currentItems,
        investigation.getPIRs(),
        investigation.getHistory()  // What's been tried
      );

      // Check stop conditions
      if (this.shouldStop(investigation, pivotDecision, config)) {
        break;
      }

      // ACT: Run the next recon step
      const newFindings = await this.executePivot(pivotDecision);

      // Enrich: LLM analyzes new findings for patterns/significance
      const enrichment = await this.llm.analyze(newFindings, currentItems);
      newFindings.add(enrichment);

      investigation.add(newFindings);

      // Interactive mode: ask user for direction
      if (config.interactive && newFindings.hasSignificant()) {
        const questions = this.generateFollowUpQuestions(newFindings);
        investigation.addQuestions(questions);
        // User responds → influences next pivot
      }
    }

    // Final assessment
    const report = await this.assess(investigation);
    return report;
  }

  /**
   * Persistent monitoring mode
   */
  async startMonitoring(targets: MonitorTarget[], schedule: CronSchedule) {
    for (const target of targets) {
      const monitor = new Monitor(target, schedule);
      this.monitoring.register(monitor);
      monitor.start();
    }
  }

  /**
   * Compare current vs. previous monitoring results
   */
  async processMonitoringUpdate(monitor: Monitor, newResults: Finding[]) {
    const previous = monitor.getLastResults();
    const changes = this.detectChanges(newResults, previous);

    if (changes.hasSignificantChanges()) {
      const alert = this.generateAlert(changes);
      await this.sendAlert(alert, monitor.config.channels);
    }

    monitor.update(newResults);
  }
}
```

### The Adaptive Pivot Loop in Detail

```
CYCLE 0: Initial Sweep
  ┌─────────────────────────────────────┐
  │ For target "jsmith42" (username):   │
  │ 1. Check username across 50 platforms│
  │ 2. For each found profile, collect:  │
  │    - Bio/display name               │
  │    - Contact info (email, website)   │
  │    - Recent activity               │
  │ 3. Extract all entities (emails,    │
  │    domains, names, org names)       │
  │ 4. Score significance of findings    │
  └──────────────┬──────────────────────┘
                 │
                 ▼
CYCLE 1: Email Analysis
  ┌─────────────────────────────────────┐
  │ From Cycle 0, found:                │
  │ - john.smith@proton.me (GitHub bio) │
  │ - jsmith@companyxyz.com (Twitter)   │
  │                                     │
  │ PIVOT DECISION:                     │
  │ 1. Run HIBP on both emails          │
  │ 2. Analyze email formats            │
  │ 3. Check email-domain associations  │
  │                                     │
  │ NEW FINDINGS:                       │
  │ - john.smith@proton.me in 3 breaches│
  │ - jsmith@companyxyz.com → domain:   │
  │   companyxyz.com (NEW TARGET!)      │
  │                                   │
  │ SIGNIFICANCE: jsmith@companyxyz.com  │
  │   is CRITICAL — links to new domain │
  └──────────────┬──────────────────────┘
                 │
                 ▼
CYCLE 2: Domain Recon (pivoted from email)
  ┌─────────────────────────────────────┐
  │ NEW TARGET: companyxyz.com           │
  │ 1. WHOIS → registrant: Jane Smith   │
  │ 2. DNS → MX: companyxyz.com uses     │
  │    Google Workspace (corporate)      │
  │ 3. Subdomains → api.companyxyz.com   │
  │    reveals: REST API, GraphQL, S3     │
  │ 4. SSL certs → 3 additional domains  │
  │ 5. Tech stack → Django, PostgreSQL   │
  │                                     │
  │ LLM ANALYSIS:                       │
  │ "Jane Smith as registrant matches   │
  │  jsmith pattern. Likely same person  │
  │  who uses jsmith@companyxyz.com      │
  │  S3 bucket at api.companyxyz.com     │
  │  contains backup — potential data    │
  │  exposure risk. FLAG."               │
  │                                     │
  │ PIVOT: S3 bucket investigation        │
  └──────────────┬──────────────────────┘
                 │
                 ▼
CYCLE 3: Infrastructure Deep Dive
  ┌─────────────────────────────────────┐
  │ 1. Check api.companyxyz.com ports    │
  │    via Shodan → port 5432 (Postgres)│
  │    open to internet!                │
  │ 2. Check S3 bucket permissions      │
  │    → publicly readable backups       │
  │ 3. Cross-reference with CVE database │
  │    → Django version has known vuln   │
  │                                     │
  │ ALERT GENERATED:                     │
  │ CRITICAL: Open PostgreSQL + public   │
  │ S3 backups on jsmith's company.      │
  │ Immediate investigation warranted.   │
  │                                     │
  │ STOP CONDITION: All critical alerts │
  │ found, no new pivot targets of        │
  │ significance. Report generated.      │
  └─────────────────────────────────────┘
```

---

## Part 6: What Makes This Genuinely Novel

### Existing Tools vs. Echo-OSINT

| Capability | SpiderFoot | Maltego | Recon-ng | Echo-OSINT |
|-----------|-----------|---------|----------|-----------|
| Multi-source data collection | YES | Via transforms | Via modules | YES |
| Graph visualization | Basic | EXCELLENT | Minimal | Phase 2 |
| Vulnerability mapping | Partial | Via transforms | Via modules | Phase 1 |
| **Adaptive pivoting** | NO | NO (manual) | NO (manual) | **YES — CORE** |
| **Significance scoring** | NO | NO | NO | **YES** |
| **Evidence chains** | NO | Partial | NO | **YES** |
| **PIR-driven research** | NO | NO | NO | **YES** |
| **LLM pattern analysis** | NO | NO | NO | **Phase 3** |
| **Persistent monitoring** | NO | NO | NO | **Phase 4** |
| **Signal tracking** | NO | NO | NO | **Phase 4 (Echo)** |
| Interactive investigation | NO | Partial | Partial | **Phase 3** |

The gap is clear: **no existing tool adapts its search strategy based on findings**. They all run pre-defined modules and dump results. Echo-OSINT's adaptive loop follows the intelligence wherever it leads.

### The Product Positioning

**Not:** "Another OSINT scanner"
**But:** "Autonomous intelligence that follows the trail so you don't have to"

**Not:** "Find everything about a target"
**But:** "Ask a question, get answers with evidence, and discover connections you didn't know existed"

**Not:** "Replace the intelligence analyst"
**But:** "Amplify the analyst — handle the tedious discovery work, surface the significant findings, suggest the pivots"

---

## Part 7: Implementation Phases (Revised for Intelligence)

### Phase 1: Foundational Recon (Weeks 1-3)
**Goal:** Working recon tools with structured data model

- [ ] Core type system: Target, IntelligenceItem, EvidenceLink, PivotDecision
- [ ] BaseReconModule with proper rate limiting, retry, timeouts
- [ ] HTTP client with TTL cache (request deduplication)
- [ ] Username recon (50+ platforms, structured entity extraction)
- [ ] Domain recon (WHOIS/RDAP, DNS, subdomains via crt.sh)
- [ ] Significance engine (novelty + rarity + severity + timeliness)
- [ ] Evidence store (all findings with source + reliability)
- [ ] Pivot engine (rule-based: "if email found → check HIBP")
- [ ] CLI: `echo-osint recon <target> --mode hunter --depth normal`
- [ ] Report output: prioritized findings (not alphabetical dump)

### Phase 2: Intelligence Loop (Weeks 4-6)
**Goal:** Adaptive pivoting — the system follows the trail

- [ ] Multi-cycle recon loop (initial sweep + adaptive pivots)
- [ ] Email recon (HIBP, format analysis, domain extraction)
- [ ] Infrastructure recon (Shodan/Censys API integration)
- [ ] Identity graph (probabilistic resolution)
- [ ] Evidence chain building (cross-source verification)
- [ ] Stop conditions (no significant findings, depth limit, PIR satisfied)
- [ ] Investigation state (save/load/resume)
- [ ] LLM pattern analysis (NVIDIA NIM for finding analysis)
- [ ] CLI: `echo-osint recon jsmith42 --mode investigator --pirs "who does jsmith work for?"`

### Phase 3: AI Enhancement (Weeks 7-9)
**Goal:** LLM-powered pivot decisions and analysis

- [ ] OSINTAgent with tool-based reasoning
- [ ] Adaptive pivot decision (LLM decides next step based on findings)
- [ ] Structured output enforcement (JSON schema for all LLM responses)
- [ ] Follow-up question generation for user
- [ ] Evidence verification (LLM evaluates claim strength)
- [ ] Report enrichment (executive summaries, narrative reports)
- [ ] Interactive mode: user guides investigation direction
- [ ] Agent memory (investigation context persists between cycles)

### Phase 4: Persistent Watch & Echo Tracking (Weeks 10-12)
**Goal:** Continuous monitoring + signal propagation tracking

- [ ] Monitor registry (scheduled scans)
- [ ] Anomaly detection (compare current vs. previous results)
- [ ] Alert system (significant change notifications)
- [ ] Signal origin detection (first appearance of entity)
- [ ] Velocity tracking (how fast does signal spread?)
- [ ] Cross-platform propagation correlation
- [ ] HTML reports with signal timeline visualization
- [ ] CLI: `echo-osint watch add --target companyxyz.com --schedule daily`

---

## Part 8: Critical Design Decisions

### Decision 1: Rule-Based Pivots FIRST, LLM Later
Phase 1-2 use rule-based pivot engines. Phase 3 adds LLM pivot decisions.

**Why:** Rules are deterministic, testable, and fast. LLM pivot decisions are powerful but expensive, slow, and harder to test. Starting with rules means the intelligence loop works from Day 1. LLM makes it smarter, not functional.

Rules cover 80% of pivots: "found email → check HIBP", "found domain → WHOIS", "found subdomain → port scan". The LLM handles the remaining 20% — the creative, non-obvious connections.

### Decision 2: Intelligence Items Over Raw Findings
Every finding is wrapped in an `IntelligenceItem` with claim, evidence, confidence, and significance. This is the atomic unit of intelligence — not a raw API response.

**Why:** Raw findings are noise. Intelligence items are signal. The system operates on intelligence items, which means every output is structured for human consumption.

### Decision 3: Three Modes, One Engine
Same underlying engine, different configurations:

| Setting | Hunter | Investigator | Watcher |
|---------|--------|-------------|---------|
| maxIterations | 5 | 8 | continuous |
| significanceThreshold | medium | low | high (alert only) |
| pivotsPermitted | All | All | Domain-restricted |
| outputFormat | Vulnerability map | Investigation report | Alert feed + trends |
| LLMAnalysis | Yes (risk focus) | Yes (evidence focus) | Yes (anomaly focus) |

**Why:** One codebase, three products. Users get exactly what they need.

### Decision 4: PIRs as Core Input
The investigator mode requires Priority Intelligence Requirements:

```bash
echo-osint recon jsmith42 \
  --mode investigator \
  --pirs "What company does jsmith work for?" \
  --pirs "Is jsmith connected to Jane Doe?" \
  --pirs "Has jsmith's email appeared in any breaches?"
```

The engine measures success by whether PIRs are answered, not by how many findings it collects.

**Why:** This is what intelligence analysts actually do. They don't want "everything" — they want answers to specific questions. The PIR-centric approach is what separates an intelligence tool from a data dump.

### Decision 5: Transparent Confidence — Every Number Has an Audit Trail
```json
{
  "claim": "jsmith42 owns companyxyz.com",
  "confidence": 0.78,
  "evidenceChain": [
    {
      "source": "WHOIS",
      "finding": "Registrant name: Jane Smith",
      "reliability": 0.7,
      "howItSupportsClaim": "Name matches email domain jsmith@companyxyz.com"
    },
    {
      "source": "GitHub",
      "finding": "Bio says 'at CompanyXYZ'",
      "reliability": 0.85,
      "howItSupportsClaim": "Self-declared affiliation"
    }
  ],
  "contradictions": [
    {
      "source": "LinkedIn",
      "finding": "No CompanyXYZ affiliation visible",
      "weight": 0.4
    }
  ]
}
```

**Why:** Intelligence consumers don't trust scores. They trust evidence. Show the evidence, the score follows naturally.

---

## Part 9: The Echo Feature — Signal Propagation (Phase 4)

This is the UNIQUE feature that justifies the product name "Echo-OSINT."

### The Hypothesis

Information propagates across platforms in predictable patterns:
1. A developer creates a tool on GitHub
2. It's discussed on Reddit r/programming
3. It's posted to HackerNews
4. A tech blog covers it
5. Mainstream news mentions it

The same pattern applies to:
- Security incidents (discovered → HN → Reddit → news → social media)
- Company events (filing → press release → news → social discussion)
- Credential leaks (breach → forum → paste site → news)

### How Echo Tracking Works

```
Signal: "jsmith42"
Platforms checked: GitHub, Reddit, HN, Twitter, Pastebin, HIBP, News APIs

TIMELINE CONSTRUCTION:
  2023-06-15 | GitHub repo created by jsmith42 (first appearance)
  2023-09-22 | Reddit post mentions jsmith42's tool (99 days later)
  2023-10-05 | HN discussion about jsmith42's tool (13 days after Reddit)
  2023-11-01 | Tech blog article mentions tool (27 days after HN)

VELOCITY CALCULATION:
  Platform 1→2: 99 days
  Platform 2→3: 13 days
  Platform 3→4: 27 days
  Accelerating: YES (99 → 13 is huge acceleration)
  Predicted next: 7-14 days to mainstream mention

AMPLIFICATION NETWORK:
  Who amplified the signal:
  - Reddit user /u/techguru (1.2M followers) — 500 upvotes
  - HN front page (1200 points) — reached wide audience
  - TechCrunch article — mainstream credibility

ECHO MAP:
  GitHub (origin)
    └── Reddit (amplified by /u/techguru)
         └── HackerNews (front page)
              └── TechCrunch (article)
                   └── Twitter (viral thread)

PREDICTION: Signal will reach mainstream (Forbes/Wired) in 7-14 days
            unless already covered (monitoring active)
```

### Why This is Valuable

| User | Echo Value |
|------|-----------|
| Hunter | "This CVE appeared on GitHub 2 months ago but just hit news — is the exploit weaponizable now?" |
| Investigator | "This person's social media appeared 6 months AFTER their domain was registered — they hid their identity first" |
| Watcher | "Mentions of our company are following the same propagation pattern as the XYZ breach — prepare for mainstream coverage" |

---

## Part 10: Summary — What We've Actually Designed

Echo-OSINT is **NOT a scanner**. It is:

1. **An Intelligence Loop** — Findings generate new questions, which drive new research, which generates more questions. It follows the trail.

2. **Evidence-Led** — Every claim has a source, every source has a reliability score, every score has an evidence chain. Nothing is a black box.

3. **PIR-Driven** — The system measures success by answering the user's questions, not by collecting the most data.

4. **Adaptive** — The pivot engine (rule-based first, LLM-enhanced later) decides what to investigate next based on what it finds.

5. **Significance-Aware** — A 500-item result dump is useless. Results are prioritized: Critical → High → Medium → Low → Negligible. Users see what matters first.

6. **Transparent** — The confidence score is accompanied by the full evidence chain. Users can audit every number.

7. **Persistent** — Investigations can be resumed, monitoring targets run on schedule, and the system compares current results to past baselines.

8. **Multi-Persona** — One engine, three modes: Hunter (attack surface), Investigator (evidence chains), Watcher (anomaly detection).

And Phase 4 adds the **Echo Signal Tracking** — tracking how information propagates across platforms over time. This is the genuinely novel feature that nothing else does.
