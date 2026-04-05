# Requirements: Echo-OSINT v0.2

**Defined:** 2026-04-05
**Core Value:** Discovery rate of non-obvious connections — the tool must regularly uncover relationships, affiliations, or vulnerabilities the user hadn't considered

## v1 Requirements

### Reconnaissance Engine

- [ ] **RECON-01**: User can input a username and discover its presence across 50+ platforms with profile URLs
- [ ] **RECON-02**: User can input a domain and get WHOIS, DNS records, subdomains, SSL certs, and tech stack
- [ ] **RECON-03**: User can input an email and check HIBP breaches and discover associated accounts
- [ ] **RECON-04**: User can input an IP and get open ports, running services, and known vulnerabilities (via Shodan/Censys)
- [ ] **RECON-05**: System auto-detects target type from input (username/email/domain/IP)

### Reasoning Engine

- [ ] **REASON-01**: System maintains belief space with three states: established (conf > 0.85), likely (0.5-0.85), hypothesis/uncertain (< 0.5)
- [ ] **REASON-02**: System generates new testable hypotheses from established beliefs after each recon cycle
- [ ] **REASON-03**: System applies Bayesian-inspired confidence updates when new evidence arrives (with diminishing returns near 0 and 1)
- [ ] **REASON-04**: System detects contradictions between beliefs (e.g., "claimed London" vs "operating timezone US Pacific")
- [ ] **REASON-05**: System selects investigation strategy based on findings: AMPLIFY, DEEPEN, PIVOT, FOLLOW, BRANCH, VERIFY
- [ ] **REASON-06**: System stops investigation when no significant findings, depth limit reached, or PIRs satisfied

### Intelligence Briefing

- [ ] **BRIEF-01**: Briefing includes established facts with full evidence chains
- [ ] **BRIEF-02**: Briefing includes likely assessments with caveats about uncertainty
- [ ] **BRIEF-03**: Briefing includes contradictions with possible explanations
- [ ] **BRIEF-04**: Briefing includes leads with specific investigation recommendations
- [ ] **BRIEF-05**: Briefing includes negative findings (what was looked for but not found)
- [ ] **BRIEF-06**: Briefing includes chronological discovery timeline

### Investigation State

- [ ] **STATE-01**: Each investigation persists to JSON file with target, beliefs, evidence, and history
- [ ] **STATE-02**: User can resume a past investigation with `--resume` flag
- [ ] **STATE-03**: User can pivot mid-investigation by adding new targets (discovered entities)

### HTTP Infrastructure

- [ ] **HTTP-01**: HTTP client wrapper with configurable retry (exponential backoff), global timeout, and TTL request cache
- [ ] **HTTP-02**: Two-tier rate limiting: global p-queue concurrency cap + per-module rate windows

### Significance & Evidence

- [ ] **SIG-01**: Every finding scored for significance: novelty (0.3) + rarity (0.25) + severity (0.3) + timeliness (0.15)
- [ ] **EVID-01**: Every confidence score has full evidence chain (source, data, reliability score, verification status)
- [ ] **EVID-02**: Evidence sources are scored by reliability (WHOIS=0.95, GitHub=0.90, Reddit=0.60, etc.)

### CLI

- [ ] **CLI-01**: `echo-osint recon <target>` runs the full intelligence loop
- [ ] **CLI-02**: `--mode hunter|investigator|watcher` selects output format and investigation strategy
- [ ] **CLI-03**: `--depth quick|normal|deep` controls investigation depth
- [ ] **CLI-04**: `--interactive` enables follow-up questions between cycles

## v2 Requirements

### AI Enhancement

- **AI-01**: LLM-powered hypothesis generation from belief patterns (beyond rules)
- **AI-02**: LLM evidence evaluation (weighing conflicting evidence)
- **AI-03**: LLM contradiction resolution (suggest explanations for conflicts)
- **AI-04**: Structured JSON output from LLM (JSON schema enforcement)
- **AI-05**: AI agent with tool-based reasoning (recon modules as agent tools)

### Persistent Watch

- **WATCH-01**: Monitor registry for scheduled scans
- **WATCH-02**: Anomaly detection (compare current vs previous results)
- **WATCH-03**: Alert system for significant changes

### Echo Signal Tracking

- **ECHO-01**: Signal origin detection (first appearance of entity across platforms)
- **ECHO-02**: Velocity calculation (how fast signal spreads)
- **ECHO-03**: Cross-platform propagation correlation
- **ECHO-04**: Amplification detection (who's spreading the signal)

## Out of Scope

| Feature | Reason |
|---------|--------|
| CrewAI orchestration | Python ecosystem mismatch; build lightweight custom agent in Phase 3 |
| Qdrant vector DB | External service dependency; in-memory sufficient for v0.2 |
| Neo4j graph DB | External service dependency; in-memory graph sufficient for v0.2 |
| Puppeteer/Playwright | 500MB+ dependency bloat; not needed for API-based recon |
| NLP-based entity extraction | Recon modules create structured entities from API schemas — zero NLP needed |
| Auto-merge identity entities | Probabilistic graph preserves all information; user judges |
| Active port scanning | v0.2 passive only; active scanning needs explicit opt-in |
| Reddit/GitHub content search (trend finding) | v0.2 focuses on target recon; keyword search preserved as legacy mode |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| RECON-01 | Phase 1 | Pending |
| RECON-02 | Phase 1 | Pending |
| RECON-03 | Phase 2 | Pending |
| RECON-04 | Phase 2 | Pending |
| RECON-05 | Phase 1 | Pending |
| REASON-01 | Phase 1 | Pending |
| REASON-02 | Phase 1 | Pending |
| REASON-03 | Phase 1 | Pending |
| REASON-04 | Phase 1 | Pending |
| REASON-05 | Phase 1 | Pending |
| REASON-06 | Phase 1 | Pending |
| BRIEF-01 | Phase 1 | Pending |
| BRIEF-02 | Phase 1 | Pending |
| BRIEF-03 | Phase 1 | Pending |
| BRIEF-04 | Phase 1 | Pending |
| BRIEF-05 | Phase 1 | Pending |
| BRIEF-06 | Phase 1 | Pending |
| STATE-01 | Phase 2 | Pending |
| STATE-02 | Phase 2 | Pending |
| STATE-03 | Phase 2 | Pending |
| HTTP-01 | Phase 1 | Pending |
| HTTP-02 | Phase 1 | Pending |
| SIG-01 | Phase 1 | Pending |
| EVID-01 | Phase 1 | Pending |
| EVID-02 | Phase 1 | Pending |
| CLI-01 | Phase 1 | Pending |
| CLI-02 | Phase 1 | Pending |
| CLI-03 | Phase 1 | Pending |
| CLI-04 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-05*
*Last updated: 2026-04-05 after initial definition*
