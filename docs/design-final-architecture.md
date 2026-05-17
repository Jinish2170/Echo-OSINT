# Echo-OSINT v0.2: Final Architecture (Post-Iteration)

**Date:** 2026-04-05
**Status:** Approved — all gaps analyzed, solutions iterated and validated

---

## All Gaps Discovered (12 Total)

| # | Gap | Category | Severity |
|---|-----|----------|----------|
| 1 | No guided investigation workflows, just query + dump | Product | CRITICAL |
| 2 | No result persistence or investigation growth | Product | HIGH |
| 3 | Confidence score is meaningless to users (no evidence trail) | Product | HIGH |
| 4 | No differentiation from SpiderFoot/Maltego/Shodan | Product | CRITICAL |
| 5 | Entity extraction from arbitrary text is an NLP-scale problem | Architecture | CRITICAL |
| 6 | Co-occurrence ≠ causation (false relationship inference) | Architecture | HIGH |
| 7 | Identity resolution naive (same username ≠ same person) | Architecture | HIGH |
| 8 | Rate limit composition explodes under parallel modules | Architecture | MED |
| 9 | AI synthesis layer entirely removed (v0.2 design cut LLM) | Agentic | HIGH |
| 10 | No agent memory or investigation state for AI agents | Agentic | MED |
| 11 | Recon modules not exposed as agent-callable tools | Agentic | MED |
| 12 | No structured output enforcement for LLM responses | Agentic | MED |

---

## Solved Architectures (After Iteration)

### 1. Entity Extraction: Structured Path (Winning Solution)

**Do NOT extract entities from text.** Instead, each recon module creates structured ENTITY objects directly from its API response schema:

```typescript
// WHOIS module: API returns registrantName, registrantEmail → create entities
entityExtractor.createFromWhois(data): [
  createEntity('email', data.registrantEmail, 'whois', 0.85),
  createEntity('person', data.registrantName, 'whois', 0.80),
  createEntity('org', data.registrantOrg, 'whois', 0.85),
]

// Username module: API returns profileURLs → create entities
entityExtractor.fromUsernameCheck(data): [
  createEntity('social_profile', profileURL, 'username', 0.70),
]
```

**Only 2 types of unstructured extraction needed:**
- Regex for emails, domains, IPs, URLs found in text content (these are regex-perfect)
- Skip name extraction from prose entirely

The EntityExtractor is purely a dedup+normalization layer, NOT an NLP extraction layer.

### 2. Identity Resolution: Probabilistic Graph (Winning Solution)

**Never merge entities automatically.** Instead, create `same_identity_as` edges:

| Signal Pair | Same Entity Confidence |
|------------|----------------------|
| Exact same email | 0.95 |
| Same unusual username (8+ chars, non-common) | 0.85 |
| Same common username | 0.30 |
| Same avatar hash | 0.95 |
| Bio similarity >70% | 0.50 |
| Same phone number | 0.95 |
| Same registration address | 0.80 |

Confidence accumulates across signals. At >0.9 cumulative, the UI displays:
> "Likely same person (92% confidence across 3 signals)"

This is how Maltego actually works — potential links, not auto-merging.

### 3. Relationships: Deterministic Rules-Only (Winning Solution)

**No co-occurrence inference for core relationships.** Only verified relationships:

| Rule | Relationship Type | Verification |
|------|------------------|-------------|
| WHOIS registrant → domain | `owns` | WHOIS confirmed |
| DNS A record → IP | `resolved_to` | DNS confirmed |
| Profile URL exists (200) | `has_profile` | HTTP confirmed |
| Email in HIBP breach | `found_in` | HIBP confirmed |
| Certificate → domain | `has_certificate` | CT log confirmed |
| Domain → tech detected | `uses_technology` | HTTP fingerprint confirmed |

Co-occurrence creates `mentioned_with` edge at confidence 0.2 (visible but clearly weak).

### 4. Rate Limits: Two-Tier (Winning Solution)

```
Global Layer:    p-queue with concurrency=20
                   ↓
Per-Module Layer: Each module has its own rate window
                   ↓
HTTP Cache:        TTL-based cache (5min default, configurable)
```

Shodan: 256 queries/day → module tracks daily budget, fails gracefully at limit.
HIBP: 10/min → module waits on limit, returns partial results.
WHOIS: 30/min → module self-throttles.
Username check: 50 platforms at concurrency=10 → completes in ~25s.

### 5. AI Agent Layer: Optional Enhancement, Not Core (Winning Solution)

**Phase 1 works WITHOUT AI.** The deterministic pipeline produces:
- Entities (structured, verified)
- Relationships (deterministic, high-confidence)
- Confidence scores (evidence-based, transparent)

**Phase 3 adds AI as optional enhancement:**
```typescript
class OSINTAgent {
  // LLM can call these tools:
  tools: {
    'whois': (domain: string) => Promise<WHOIS_DATA>,
    'username_check': (username: string) => Promise<USERNAME_RESULT>,
    'email_lookup': (email: string) => Promise<EMAIL_INFO>,
    'dns_lookup': (domain: string) => Promise<DNS_RECORD[]>,
    'check_ports': (ip: string) => Promise<PORT_SERVICE[]>,
    'breach_check': (email: string) => Promise<BREACH_DATA>,
  };

  async investigate(question: string): Promise<InvestigationResult> {
    // LLM decides which tools to call → calls them → synthesizes answer
    // Uses NVIDIA NIM with response_format: json_object for structured output
  }
}
```

The agent layer provides:
- **Pivot suggestions**: "You found this email — want to check HIBP?"
- **Insight discovery**: "All 3 targets share the same mail server (unusual pattern)"
- **Report enrichment**: "Generate executive summary from 47 entities"
- **Follow-up research**: "This subdomain resolves to an IP not seen elsewhere — scanning it"

**Key design principle:** The AI layer ENHANCES the deterministic pipeline, it doesn't REPLACE it. If the LLM is unavailable or rate-limited, the recon pipeline still works perfectly. This eliminates the single point of failure that killed v0.1.

### 6. Investigation State: File-Based + Investigation Graph (Winning Solution)

```
investigations/
  2026-04-05/
    target-jsmith.json    # Investigation state
    target-example.com.json

Each investigation JSON:
{
  "id": "inv-jsmith-20260405",
  "target": { "type": "username", "value": "jsmith" },
  "entities": [...],
  "relationships": [...],
  "timeline": [...],
  "modulesRun": ["username-recon", "breach-monitor"],
  "modulesSkipped": ["email-lookup"],  // User chose not to run
  "confidence": 0.82,
  "createdAt": "2026-04-05T10:00:00Z",
  "updatedAt": "2026-04-05T10:15:00Z"
}
```

New recon runs can append to existing investigations:
```bash
echo-osint recon jsmith --resume    # Continue Monday's investigation
echo-osint recon jsmith --add-email john@example.com  # Pivot to email
```

---

## The Product Differentiator: "Echo" Signal Tracking

**Phase 2 unique feature — no existing tool does this well.**

When you run recon on a target, the system doesn't just find entities — it tracks HOW signals propagate:

1. **Signal Origin Detection**: Find the earliest mention of a username/domain/technology across all collected platforms
2. **Velocity Calculation**: Measure how fast the signal spreads across platforms (GitHub day 1 → Reddit day 3 → HN day 7 → news day 14)
3. **Amplification Detection**: Identify who amplified the signal (influential accounts, media coverage)
4. **Cross-Platform Correlation**: "This username appeared on GitHub 3 months before Reddit, suggesting the person started in dev before community engagement"

This is the UNIQUE capability that differentiates Echo-OSINT from SpiderFoot (finds entities, no tracking) and Maltego (graphs relationships, no temporal tracking).

---

## 4-Phase Implementation Plan

### Phase 1: Core Recon Engine (Weeks 1-2)
- [ ] New type definitions (Target, Entity, Relationship, ReconResult)
- [ ] BaseReconModule + ReconRegistry (mirrors existing collector pattern)
- [ ] HTTP client wrapper with retry, timeout, p-queue
- [ ] Username recon (50+ platforms, parallel, rate-limited)
- [ ] Domain recon (WHOIS via RDAP, DNS, subdomains via crt.sh)
- [ ] Confidence engine (evidence-based, transparent scoring)
- [ ] Report output (JSON + Markdown)
- [ ] CLI entry point: `echo-osint recon <target>`

### Phase 2: Pipeline Enhancement (Weeks 3-4)
- [ ] Email recon (HIBP, enrichment)
- [ ] Infrastructure recon (Shodan/Censys API)
- [ ] Breach monitoring (HIBP + pastebin)
- [ ] Entity extraction pipeline (structured API response parsing)
- [ ] Relationship mapper (deterministic rules)
- [ ] Identity resolver (probabilistic graph)
- [ ] Investigation state (file-based persistence)
- [ ] Investigation resume (`--resume` flag)
- [ ] Signal tracking foundation (temporal data capture)

### Phase 3: AI Enhancement (Weeks 5-6)
- [ ] OSINTAgent class with tool-based reasoning
- [ ] NVIDIA NIM integration with structured output (JSON schema enforcement)
- [ ] Pivot suggestion engine
- [ ] Insight discovery patterns
- [ ] Report enrichment (executive summaries via LLM)
- [ ] Agent memory (investigation context persistence)

### Phase 4: Echo Signal Tracking (Weeks 7-8)
- [ ] Signal origin detection across platforms
- [ ] Velocity calculation and visualization
- [ ] Cross-platform correlation engine
- [ ] Prediction engine (where will this signal appear next?)
- [ ] Amplification detection (who's spreading the signal?)
- [ ] HTML report with signal timeline visualization

---

## What's Different About This Design vs Standard Approaches

| Standard Approach | Echo-OSINT Approach | Why It's Better |
|-------------------|-------------------|-----------------|
| Regex for all entity extraction | Structured API parsing | Zero false positives, each module owns its entities |
| Auto-merge same-value entities | Probabilistic edges, no merging | Maltego-style, user trusts the evidence |
| Co-occurrence = relationship | Rules-only core + low-confidence co-occurrence | No false relationship hallucinations |
| Global rate limiter | Two-tier: global concurrency + per-module windows | Each API gets appropriate treatment |
| AI OR deterministic | Deterministic core + optional AI enhancement | Works without AI, better with it |
| Stateless queries | Investigation state with resume | Grows intelligence over time |
| Result dump | Transparent confidence with evidence trail | User can audit every confidence score |
| Topic search | Target reconstruction | Actual OSINT, not Google with formatting |

---

## File Structure (Final)

```
src/
├── index.ts                          # Main entry, backward-compatible query()
├── cli.ts                            # New CLI: echo-osint recon <target>
├── config/
│   └── index.ts                      # Extended with recon API configs
├── types/
│   ├── target.ts                     # Target, TARGET_TYPE
│   ├── entity.ts                     # Entity, ENTITY_TYPE
│   ├── relationship.ts               # Relationship, RELATIONSHIP_TYPE
│   ├── recon.ts                      # ReconResult, ReconReport
│   └── platform.ts                   # PLATFORM, OSINT_SOURCE extensions
├── collectors/                       # EXISTING (unchanged)
│   ├── base.ts                       # BaseCollector, CollectorRegistry
│   ├── reddit.ts
│   ├── github.ts
│   ├── hackernews.ts
│   └── index.ts
├── osint/
│   ├── base.ts                       # BaseReconModule, ReconRegistry
│   ├── http.ts                       # HTTP client (retry, timeout, cache)
│   ├── confidence-engine.ts          # Multi-factor confidence scoring
│   ├── identity-resolver.ts          # Probabilistic identity graph
│   ├── relationship-mapper.ts        # Deterministic relationship rules
│   ├── investigation.ts              # Investigation state management
│   ├── collectors/
│   │   ├── username.ts               # Platform enumeration
│   │   ├── domain.ts                 # WHOIS + DNS + subdomains (orchestrates sub-modules)
│   │   ├── email.ts                  # HIBP + enrichment
│   │   └── infrastructure.ts         # Shodan/Censys port scan + services
│   └── report/
│       ├── index.ts                  # Report generator
│       └── markdown.ts               # Markdown formatter
├── ai/                               # Phase 3
│   ├── agent.ts                      # OSINTAgent class
│   ├── tools.ts                      # Recon modules as agent tools
│   └── prompts.ts                    # System prompts for investigation
├── echo/                             # Phase 4
│   ├── signal-tracker.ts             # Signal origin and velocity
│   ├── propagation.ts                # Cross-platform correlation
│   └── prediction.ts                 # Where will the signal appear next?
└── utils/
    ├── dedup.ts                      # Entity deduplication
    └── validation.ts                 # Target input validation
```

Note: OSINT collectors are FLAT (5 files) instead of deeply nested directories. Each collector is an orchestrator within itself. This keeps the file count manageable while maintaining clean module separation.

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| API rate limits block recon | HIGH | LOW | Per-module rate limits, cached results, graceful degradation |
| Username recon false positives | HIGH | MED | HTTP status + content length check, mark uncertain findings |
| Free API tiers too limiting | MED | HIGH | Cache aggressively, prioritize best sources per target type |
| Entity extraction misses edge cases | MED | LOW | Structured parsing eliminates most edge cases; regex covers the rest |
| AI hallucination in Phase 3 | MED | HIGH | AI is optional enhancement; core pipeline is deterministic |
| User trust in confidence scores | LOW | HIGH | Full evidence trail per score; no black box numbers |

---

## Summary

Echo-OSINT v0.2 becomes a **deterministic recon engine with optional AI synthesis**. The core value proposition:

1. **Target-based recon** — input a username, domain, email, or IP
2. **Deterministic pipeline** — reliable, auditable, high-speed data collection
3. **Evidence-based confidence** — every score backed by transparent rules
4. **Investigation growth** — resume and expand past investigations
5. **AI-powered insights** (Phase 3) — pivot suggestions, pattern discovery, report enrichment
6. **Echo signal tracking** (Phase 4) — the UNIQUE feature that tracks signal propagation across platforms

This is a product that works day one (deterministic), gets smarter over time (AI enhancement), and differentiates from all existing tools (Echo signal tracking).
