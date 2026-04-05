# Echo-OSINT: Autonomous Intelligence Engine

## What This Is

An autonomous OSINT intelligence engine that investigates a target (username, email, domain, IP), forms and tests hypotheses, follows evidence chains, and delivers an intelligence briefing with transparent evidence and identified uncertainties. Not a scanner — a reasoning system that follows the trail.

## Core Value

**Discovery rate of non-obvious connections.** If the tool only confirms what the user already knows, it fails. If it regularly uncovers relationships, affiliations, or vulnerabilities the user hadn't considered, it succeeds.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **RECON-01**: User can investigate a username to discover its presence across 50+ platforms
- [ ] **RECON-02**: User can investigate a domain to get WHOIS, DNS, subdomains, SSL certs, and tech stack
- [ ] **RECON-03**: User can investigate an email to check HIBP breaches and associated accounts
- [ ] **RECON-04**: User can investigate an IP address for open ports, services, and vulnerabilities
- [ ] **REASON-01**: System maintains a belief space — established facts, likely claims, and uncertainties are separate
- [ ] **REASON-02**: System generates testable hypotheses from current beliefs after each recon cycle
- [ ] **REASON-03**: System uses Bayesian-inspired confidence updates when new evidence arrives
- [ ] **REASON-04**: System detects contradictions between beliefs and suggests resolutions
- [ ] **REASON-05**: System selects investigation strategy based on findings (AMPLIFY/DEEPEN/PIVOT/FOLLOW/BRANCH/VERIFY)
- [ ] **BRIEF-01**: System generates intelligence briefing with: established facts, likely assessments, contradictions, leads, negative findings, and timeline
- [ ] **STATE-01**: Investigations persist to JSON files and can be resumed later
- [ ] **STATE-02**: User can pivot mid-investigation (add new targets discovered during investigation)
- [ ] **CLI-01**: CLI command `echo-osint recon <target>` runs the intelligence loop
- [ ] **CLI-02**: Three modes: `--mode hunter`, `--mode investigator`, `--mode watcher`
- [ ] **SIG-01**: Significance scoring for all findings (novelty × 0.3 + rarity × 0.25 + severity × 0.3 + timeliness × 0.15)
- [ ] **EVID-01**: Every confidence score has a full evidence chain (source, data, reliability, verification status)
- [ ] **HTTP-01**: HTTP client with retry, timeout, TTL cache, and global concurrency pool
- [ ] **HTTP-02**: Two-tier rate limiting — global concurrency cap + per-module rate windows

### Out of Scope

- **CrewAI for v0.2** — Python ecosystem mismatch with npm bridge; unreliable. AI layer comes later as lightweight custom agent.
- **Qdrant/Neo4j for v0.2** — External service dependency overkill for initial version. In-memory graph sufficient for single-target investigations.
- **Puppeteer/Playwright** — 500MB+ bloat, overkill for API-based recon. Use axios + Cheerio if page scraping needed later.
- **Active port scanning** — v0.2 uses passive data sources only (APIs, public data). Active scanning is future phase with explicit opt-in.
- **NLP-based name extraction** — Recon modules create structured entities from API responses. No NLP needed for OSINT context.
- **Auto-merge of identity entities** — Probabilistic graph with confidence scores instead. User trusts evidence, not black-box merging.

## Context

**Existing codebase (v0.1):** 10 source files implementing a collector pattern (BaseCollector + CollectorRegistry) with 4 data sources (Reddit, GitHub, HackerNews, SearXNG). The collector pattern is well-designed and will be kept. Everything else (CrewAI orchestration, synthesis, confidence scoring, propagation analysis) is a placeholder — 30% of stated architecture is implemented.

**Research findings (7 docs in docs/):**
1. `analysis-architectural-weakness.md` — 143 lines of architectural issues (no entity extraction, stateless, 12 dead deps, error swallowing)
2. `analysis-osint-capability-gap.md` — Comparison with SpiderFoot, Maltego, Recon-ng. Keyword search ≠ target recon.
3. `analysis-osint-capability-gap.md` — SpiderFoot/Maltego comparison, what real OSINT does vs what we do
4. `design-redesign-proposal.md` — Initial Target→Collect→Enrich→Correlate→Report pipeline
5. `design-final-architecture.md` — Post-iteration: 12 gaps analyzed and solved, probabilistic identity graph, deterministic rules for relationships
6. `design-intelligence-deep-dive.md` — Three user personas (Hunter/Investigator/Watcher), intelligence cycle, OODA loop, adaptive pivoting, belief space, LLM roles
7. `design-intelligence-reasoning-engine.md` — Bayesian belief updates, hypothesis generation, contradiction resolution, intelligence briefing format
8. `design-product-definition.md` — What it is, who it's for, what it's NOT, north star metric, implementation phases

**Key insight from deep analysis:** The fundamental flaw in v0.1 isn't missing features — it's the wrong paradigm (keyword search vs target recon). The fundamental breakthrough in v0.2 is the Belief Space (not findings list) + Hypothesis Generation + Bayesian Updates. This is what separates an intelligence tool from a scanner.

**Three user personas discovered:**
1. **The Hunter** (Pentester/Bug Bounty) — wants prioritized attack surface with CVEs
2. **The Investigator** (Journalist/Analyst) — wants evidence-linked investigation with source attribution
3. **The Watcher** (Threat Intel/Security Team) — wants anomaly detection and persistent monitoring

## Constraints

- **Tech Stack**: TypeScript/Node.js (existing) — stay in ecosystem, no Python dependencies
- **No External Services**: v0.2 must work without Qdrant, Neo4j, or other external services
- **Free APIs Only**: Shodan free tier, HIBP (free API), crt.sh (free), RDAP (free), GitHub API (free authenticated)
- **Node.js 20+**: Per package.json engine requirement
- **Under 500 lines per file**: Per CLAUDE.md project convention
- **Rate Limits**: Must respect all API rate limits — no aggressive scanning
- **Passive Only**: No active port scanning or brute force in v0.2

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Deterministic core first, AI second | LLM is single point of failure; must work without it | Phase 1-2 = rule-based reasoning, Phase 3 = LLM enhancement | ✓ Good |
| Structured API parsing over NLP entity extraction | Each recon module knows its API schema — zero false positives | Modules create their own entities, EntityExtractor = dedup only | ✓ Good |
| Probabilistic identity graph over auto-merge | Maltego-style: show potential links, don't destroy information | same_identity_as edges with confidence, no merging | ✓ Good |
| Rules-only relationships, no co-occurrence inference | "Google and Amazon in same search" ≠ related | Domain-specific rules only, co-occurrence = 0.2 confidence at most | ✓ Good |
| Rule-based pivots first, LLM later | Rules cover 80% of cases, testable, fast | LLM handles remaining 20% — creative, non-obvious connections | ✓ Good |
| Three modes (Hunter/Investigator/Watcher), one engine | Same codebase, different output formats and behaviors | Max iterations, significance thresholds, output formats vary by mode | ✓ Good |
| PIRs as core input for investigator mode | Analysts want answers to questions, not data dumps | Engine measures success by questions answered, not findings collected | — Pending |
| Echo signal tracking as product differentiator | No existing tool tracks signal propagation across platforms over time | Phase 4 unique feature — justifies the "Echo" name | — Pending |

---
*Last updated: 2026-04-05 after deep analysis and design iteration (3 rounds of architectural analysis)*
