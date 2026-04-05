# Echo-OSINT v0.2 Roadmap

**Created:** 2026-04-05
**Core Value:** Discovery rate of non-obvious connections
**Total Phases:** 6 | **Requirements Mapped:** 29

## Phase 1: Type System + Belief Space + Significance Engine
**Goal:** All core types defined, belief space with Bayesian updates, significance scoring, evidence chains
**Requirements:** RECON-05, REASON-01, REASON-03, REASON-04, REASON-06, BRIEF-01, BRIEF-02, BRIEF-03, BRIEF-05, SIG-01, EVID-01, EVID-02

### Success Criteria
1. `Target`, `TARGET_TYPE`, `BELIEF`, `BELIEF_STATUS`, `EvidenceLink` types compile with no `any`
2. `BeliefSpace` class correctly applies Bayesian updates (verified by unit tests)
3. `SignificanceEngine` scores findings on novelty + rarity + severity + timeliness
4. `updateBelief` function handles positive/negative evidence with diminishing returns
5. `ContradictionDetector` finds conflicting beliefs and reports them

## Phase 2: Core Recon Modules (Username + Domain + HTTP)
**Goal:** Username recon across platforms, domain recon (WHOIS/DNS/subdomains), HTTP client with rate limiting
**Requirements:** RECON-01, RECON-02, HTTP-01, HTTP-02

### Success Criteria
1. Username recon checks 50+ platforms with p-queue concurrency=10, returns structured entities
2. Domain recon returns WHOIS (via RDAP), DNS records (A/MX/NS/TXT), subdomains (via crt.sh)
3. HTTP client includes: retry with exponential backoff, configurable timeout, TTL cache (5min), global concurrency pool
4. Two-tier rate limiting works: global pool respects platform limits, per-module windows don't exceed API quotas
5. Every recon module creates structured ENTITY objects (no regex extraction needed)

## Phase 3: Reasoning Engine (Rule-Based)
**Goal:** Adaptive reasoning loop — hypothesis generation, strategy selection, evidence application
**Requirements:** REASON-02, REASON-05, BRIEF-04, BRIEF-06

### Success Criteria
1. `HypothesisGenerator` creates testable hypotheses from established beliefs (rule-based)
2. `StrategySelector` picks AMPLIFY/DEEPEN/PIVOT/FOLLOW/BRANCH/VERIFY based on findings
3. Evidence application flows from recon module → EvidenceStore → updateBelief → brief update
4. Intelligence Brief includes: leads with specific recommendations, chronological timeline
5. Stop conditions work: no significant findings for 2 cycles → stops

## Phase 4: Intelligence Brief + CLI
**Goal:** Structured briefing output, CLI entry point, three modes
**Requirements:** CLI-01, CLI-02, CLI-03

### Success Criteria
1. `IntelligenceBrief` generator produces: established facts, likely assessments, contradictions, leads, negative findings, timeline
2. CLI command `echo-osint recon <target>` parses target, detects type, runs investigation, outputs brief
3. `--mode hunter` produces attack-surface-prioritized output
4. `--mode investigator` produces evidence-linked investigation report
5. `--depth quick|normal|deep` controls max iterations and module selection
6. Markdown output formats correctly with status symbols (✓ ≈ ⚠ → ✗)

## Phase 5: Email/Infra Recon + Investigation State
**Requirements:** RECON-03, RECON-04, STATE-01, STATE-02, STATE-03, CLI-04

### Success Criteria
1. Email recon queries HIBP API, extracts breach context, discovers associated accounts
2. Infrastructure recon queries Shodan/Censys API for open ports, services, CVEs
3. InvestigationState saves to JSON file, loads with `--resume`, adds new targets with pivot
4. Interactive mode presents follow-up questions between cycles
5. Investigation resume correctly continues from last belief state (no re-collection)

## Phase 6: Cleanup + Integration Testing
**Goal:** Remove dead deps, verify backward compatibility, integration tests for full recon workflows
**Requirements:** (none new — integration/verification phase)

### Success Criteria
1. Dead dependencies removed: crewai, crewai-tools, langchain, qdrant-client, neo4j-driver, puppeteer, playwright, rss-parser, feedparser, date-fns, openai
2. `npm run build` succeeds with zero errors
3. Existing `EchoOSINT.query()` API still works (backward compatible)
4. Integration test: `echo-osint recon jsmith42 --depth normal` completes and produces valid IntelligenceBrief
5. Integration test: `echo-osint recon example.com --mode hunter` produces attack surface prioritization

---
*Last updated: 2026-04-05 after roadmap creation*
