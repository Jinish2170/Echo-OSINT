# Echo-OSINT v0.2: Redesign Proposal

**Date:** 2026-04-05
**Goal:** Practical, powerful, clean OSINT tool that actually works

---

## Core Philosophy

**Keep it simple but strong.** 5 powerful modules over 15 weak ones. Each module does one thing exceptionally well. The pipeline is linear: target → collect → enrich → correlate → report.

**Target-based, not query-based.** Real OSINT starts with a TARGET (person, domain, email, IP), not a search query.

**No phantom dependencies.** If it's not implemented, it's not in the config.

---

## New Architecture

```
Target Engine          Collectors         Enrichers          Correlator          Report
────────────           ──────────         ──────────         ──────────          ──────
┌──────────────┐    ┌──────────────────┐ ┌───────────────┐ ┌──────────────────┐ ┌───────────┐
│ Target Parse ├────┤ Recon Collectors ├──┤ Entity Extract├──┤ Identity Resolve ├──┤ Report    │
│ Input:       │    │ Source-specific  │ │ NER           │ │ Cross-source      │ │ Graph     │
│ username     │    │ API calls        │ │ Pattern match │ │ Link resolution  │ │ Timeline  │
│ email        │    │ Parallel         │ │ Normalize     │ │ Dedup            │ │ Confidence│
│ domain       │    │ Rate-limited     │ │ Classify      │ │ Graph build      │ │ Export    │
│ IP           │    │                  │ │               │ │                  │ │           │
│ text         │    └──────────────────┘ └───────────────┘ └──────────────────┘ └───────────┘
└──────────────┘
```

---

## Module Breakdown

### 1. Engine Module (`src/engine/`)
**What:** Target parser + orchestration pipeline
**Responsibility:**
- Parse target input and detect type (username/email/domain/IP/text)
- Select which collectors to run based on target type
- Coordinate the pipeline: collect → enrich → correlate → report
- Single entry class: `EchoOSINT.recon(target, options?)`

### 2. Collectors Module (`src/collectors/`)
**What:** Source-specific reconnaissance collectors
**Keep (refactor):**
- `github.ts` — Change to username/org recon, repo discovery, commit history analysis
- `reddit.ts` — Change to user profile search, post history, comment analysis

**Keep (as-is):**
- `hackernews.ts` — User submission history, comment threads

**Remove:**
- `searxng.ts` — Too unreliable (depends on self-hosted instance), not actionable for recon

**Add:**
- `username.ts` — Check username across 200+ platforms via single API (sherlock-style: namecheck, about.me, gravatar, etc.)
- `domain.ts` — DNS enumeration, WHOIS, subdomain discovery, SSL cert transparency
- `email.ts` — HIBP breach check, email format detection, Hunter.io-style enrichment
- `social.ts` — Twitter/X profile, Instagram, LinkedIn profile scraping (public)

### 3. Enrichers Module (`src/enrichers/`) — NEW
**What:** Extract structured entities from raw collector results
**Responsibility:**
- Extract names, emails, domains, IPs, phone numbers from text content
- Classify entities (person, org, technology, location, infrastructure)
- Normalize entity representations (strip formatting, lowercase domains)
- Add metadata (first seen, source attribution)

### 4. Correlator Module (`src/correlator/`) — NEW
**What:** Link entities across sources, build relationship graph
**Responsibility:**
- Identity resolution: same email on GitHub and Reddit = same person
- Cross-source correlation: entities that co-occur are related
- Graph construction: nodes = entities, edges = relationships
- Confidence calculation: more corroborating sources = higher confidence

### 5. Report Module (`src/reporter/`) — NEW
**What:** Generate structured intelligence reports
**Responsibility:**
- Entity list with profile page (what we know about each entity)
- Relationship graph (who's connected to what)
- Timeline (when entities appeared/were discovered)
- Confidence scores per finding and overall
- Export: JSON (structured), markdown (readable)

---

## New File Structure

```
src/
├── index.ts                      # EchoOSINT class, recon() entry point
├── config/index.ts               # Simplified config (only what's implemented)
├── types/
│   ├── index.ts                  # Common types (Platform, Priority)
│   ├── target.ts                 # Target types and validation
│   ├── entity.ts                 # Entity models
│   └── report.ts                 # Report models
├── engine/
│   ├── index.ts                  # Pipeline orchestration
│   └── pipeline.ts               # collect → enrich → correlate → report flow
├── collectors/
│   ├── base.ts                   # BaseCollector (keep, improve rate limiting)
│   ├── registry.ts               # CollectorRegistry (extract from base.ts)
│   ├── username.ts               # Username recon across platforms
│   ├── domain.ts                 # Domain/infrastructure recon
│   ├── email.ts                  # Email recon and enrichment
│   ├── github.ts                 # GitHub user/org recon (refactored)
│   ├── reddit.ts                 # Reddit user recon (refactored)
│   ├── hackernews.ts             # HN user recon
│   └── social.ts                 # Social media profile discovery
├── enrichers/
│   ├── index.ts                  # Enricher registry
│   ├── text.ts                   # Text entity extraction (names, emails, etc.)
│   ├── classify.ts               # Entity classification
│   └── normalize.ts              # Entity normalization
├── correlator/
│   ├── index.ts                  # Main correlator
│   ├── identity.ts               # Identity resolution
│   └── graph.ts                  # Relationship graph builder
├── reporter/
│   ├── index.ts                  # Report generator
│   ├── json.ts                   # JSON export
│   └── markdown.ts               # Markdown export
└── utils/
    ├── http.ts                   # HTTP client wrapper with retry + timeout
    ├── ratelimit.ts              # Rate limiter using p-queue
    └── dedup.ts                  # Deduplication utilities
```

---

## Core Type Definitions

### Target Types (`src/types/target.ts`)

```typescript
export type TargetType = 'username' | 'email' | 'domain' | 'ip' | 'text';

export interface Target {
  input: string;
  type: TargetType;
  normalized: string;
  confidence: number;  // How confident we are about type detection
}

export interface ReconOptions {
  sources?: PLATFORM[];      // Override which sources to use
  depth?: 'quick' | 'normal' | 'deep';
  timeout?: number;          // Global timeout (ms)
  maxResults?: number;       // Per-source limit
}
```

### Entity Types (`src/types/entity.ts`)

```typescript
export type EntityCategory = 'person' | 'organization' | 'technology' | 'infrastructure' | 'location';
export type EntityType = 'username' | 'email' | 'domain' | 'ip' | 'url' | 'name' | 'phone' | 'technology';

export interface Entity {
  id: string;                 // Normalized unique ID
  type: EntityType;
  category: EntityCategory;
  value: string;              // The actual value (e.g., "jsmith42")
  aliases: string[];          // Known aliases
  sources: EntitySource[];    // Where we found this entity
  attributes: Record<string, unknown>;  // Additional metadata
  firstSeen: Date;
  lastSeen: Date;
  confidence: number;
}

export interface EntitySource {
  platform: PLATFORM;
  url?: string;
  context: string;            // Where/how it was found
  foundAt: Date;
}
```

### Report Types (`src/types/report.ts`)

```typescript
export interface ReconResult {
  target: Target;
  entities: Entity[];
  relationships: Relationship[];
  timeline: TimelineEntry[];
  confidence: number;
  duration: number;
  sourcesQueried: number;
  sourcesSuccess: number;
}

export interface Relationship {
  from: string;       // Entity ID
  to: string;         // Entity ID
  type: 'owns' | 'uses' | 'located_at' | 'associated_with' | 'mentioned_with';
  confidence: number;
  evidence: string[];  // Source context supporting this relationship
}

export interface TimelineEntry {
  date: Date;
  entity: string;      // Entity ID
  event: string;       // What happened
  source: PLATFORM;
}
```

---

## Key Design Decisions

### 1. Drop CrewAI for v0.2
**Why:** The CrewAI npm bridge is unreliable. The Python version is the real thing. For v0.2, we implement the intelligence pipeline directly in TypeScript. We can add CrewAI back later as an optional LLM-based analysis layer.

### 2. Drop Qdrant/Neo4j for v0.2
**Why:** Both require external services. The in-memory graph (Map-based) is sufficient for single-target investigations. Add them later for multi-session persistence.

### 3. Keep it CLI-first
**Why:** The primary use case is an investigator running targeted recon. Clean CLI output matters more than API endpoints.

### 4. Three Depth Levels
- `quick` — Username check across platforms only (~30s)
- `normal` — Full recon on detected entities (~5min)
- `deep` — Follow links, check breach databases, enumerate subdomains (~15min)

### 5. No Puppeteer/Playwright
**Why:** Overkill for API-based recon. If we need page scraping later, use axios + Cheerio (lightweight) instead of full browser automation.

---

## Implementation Priority

### Wave 1: Foundation (MVP)
1. New types (target, entity, report)
2. BaseCollector improvements (proper rate limiting with p-queue, retry, timeouts)
3. Username collector (cross-platform profile check)
4. Enrichers (extract emails, names, domains from text)
5. Correlator (basic identity resolution)
6. Report output (JSON + markdown)
7. CLI entry point

### Wave 2: Recon Depth
8. Domain collector (DNS, WHOIS, subdomain discovery)
9. Email collector (HIBP, enrichment)
10. Social profile collector
11. Improved entity extraction (NER patterns)
12. Timeline generation
13. Relationship graph visualization (ASCII or simple HTML)

### Wave 3: Intelligence Features
14. Pivot capability (from any finding, launch new recon)
15. Cross-query persistence (remember past investigations)
16. Confidence scoring (evidence-based, not source-based)
17. Export in standard formats (STIX optional)

---

## What Gets Removed

| Current File | Action | Reason |
|-------------|--------|--------|
| `src/orchestration/types.ts` | DELETE | CrewAI non-functional, dead weight |
| `src/collectors/searxng.ts` | DELETE | Unreliable without self-hosting |
| `puppeteer` dep | DELETE | 400MB, never used |
| `playwright` dep | DELETE | 100MB, redundant |
| `crewai` dep | DELETE | Python framework, wrong ecosystem |
| `crewai-tools` dep | DELETE | Same reason |
| `langchain` dep | DELETE | Same reason |
| `langchain-nvidia-nim` dep | DELETE | Same reason |
| `qdrant-client` dep | DELETE | Not needed yet |
| `neo4j-driver` dep | DELETE | Not needed yet |
| `rss-parser` dep | DELETE | Not needed |
| `feedparser` dep | DELETE | Not needed, redundant |
| `date-fns` dep | DELETE | Use Date methods directly |
| `openai` dep | DELETE | Not used directly |
| `p-queue` dep | KEEP | Will use for proper rate limiting |
| `axios` dep | KEEP | Core HTTP client |
| `dotenv` dep | KEEP | Config loading |

Net result: **10 dependencies removed**, 3 kept. ~600MB saved in node_modules.

---

## CLI Usage After Redesign

```bash
# Quick username recon
echo-osint username jsmith42

# Full domain recon
echo-osint domain example.com

# Deep email investigation
echo-osint email user@example.com --deep

# Free-text reconnaissance (legacy mode)
echo-osint text "artificial intelligence trends"
```
