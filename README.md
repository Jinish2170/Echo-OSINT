# Echo-OSINT

<p align="center">
  <img src="https://img.shields.io/badge/Version-0.2.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178c6" alt="TypeScript">
  <img src="https://img.shields.io/badge/Stack-Express%20%2B%20React-22c55e" alt="Stack">
</p>

> **Autonomous intelligence engine: investigate a target, evaluate evidence, surface what matters.**

Give Echo-OSINT a username, domain, email, or IP. It runs targeted reconnaissance, structures the findings as evidence-backed beliefs, generates a brief, and proposes the next leads to chase — all in one shot, with a transparent audit trail.

---

## What it does

| Capability | Detail |
|------------|--------|
| **Username recon** | Checks 50+ platforms (GitHub, GitLab, Mastodon, dev/social/gaming/finance) in parallel |
| **Domain recon** | RDAP/WHOIS, DNS-over-HTTPS (A/MX/NS/TXT), subdomain enumeration via crt.sh CT logs |
| **Belief space** | Every finding becomes a belief with `established` / `likely` / `uncertain` status |
| **Significance scoring** | Multi-factor: novelty + rarity + severity + timeliness (no opaque numbers) |
| **Intelligence brief** | Auto-generated summary with established facts, leads, negative findings |
| **Investigation history** | Every scan persists to `investigations/YYYY-MM-DD/` — resume, compare, export |
| **Dashboard** | React UI for running scans, exploring findings, exporting JSON |

---

## Quick start

```bash
git clone https://github.com/Jinish2170/Echo-OSINT.git
cd Echo-OSINT
npm install
cd frontend && npm install && cd ..

# Run API (3001) + dashboard (3000) together
npm run start:all
```

Then open **http://localhost:3000** and scan a target.

### Or use the CLI

```bash
npm run dev -- octocat investigator
npm run dev -- github.com investigator deep
```

### Or hit the API directly

```bash
npm run api    # backend only on :3001

curl -X POST http://localhost:3001/recon \
  -H "Content-Type: application/json" \
  -d '{"target":"octocat","mode":"investigator"}'
```

---

## Three modes, three users

| Mode | For | Question it answers |
|------|-----|---------------------|
| **Hunter** | Pentesters, bug bounty | "What attack surface does this target expose?" |
| **Investigator** | Journalists, analysts | "What connections and identities back this target?" |
| **Watcher** | Threat intel, monitoring | "What's changed since last scan?" |

---

## API

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/health` | Liveness check |
| `POST` | `/recon` | Run a scan. Body: `{ target, mode?, depth? }`. Auto-persists. |
| `GET`  | `/investigations?limit=50` | List past investigations (newest first) |
| `GET`  | `/investigation/:id` | Load a full past investigation |

### Response shape

```jsonc
{
  "success": true,
  "target":      { "id": "tgt-...", "value": "octocat", "type": "username", ... },
  "findings":    [ /* Finding[] with significance score + evidence */ ],
  "beliefs":     [ /* Belief[] derived from findings */ ],
  "contradictions": [ /* detected conflicts */ ],
  "brief": {
    "summary": "...",
    "establishedFacts": [...],
    "likelyAssessments": [...],
    "leads": [{ "priority": "high", "description": "...", "rationale": "..." }],
    "negativeFindings": [...]
  },
  "stats": { "totalFindings": 32, "establishedFacts": 0, "likelyAssessments": 31, "leads": 5, "negativeFindings": 1 }
}
```

---

## Architecture

```
src/
├── api/server.ts             Express API (recon, history endpoints)
├── core/
│   ├── http-client.ts        Retry + TTL cache + concurrency
│   ├── significance.ts       Multi-factor scoring
│   ├── belief-space.ts       Belief storage + contradiction detection
│   ├── brief-generator.ts    Intelligence brief synthesis
│   └── investigation-store.ts File-based persistence
├── recon/
│   ├── username.ts           50+ platform enumeration
│   └── domain.ts             RDAP + DNS + subdomain (crt.sh)
├── types/                    Shared types (Target, Finding, Belief, ...)
└── index.ts                  Programmatic entry + CLI

frontend/                     React + Vite dashboard
investigations/YYYY-MM-DD/    Auto-saved scan results (gitignored)
```

The pipeline is **deterministic-first**. No LLM is required for Phase 1 — every confidence score traces back to evidence collected from named sources. AI synthesis (Phase 3) and Echo signal tracking (Phase 4) are designed to enhance, not replace, this core. See `docs/design-final-architecture.md`.

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run start:all` | API on :3001 + dashboard dev server on :3000 (recommended) |
| `npm run api` | Backend only |
| `npm run frontend:dev` | Dashboard dev server only |
| `npm run build` | Compile backend TypeScript |
| `npm run frontend` | Build production dashboard bundle |
| `npm run dev -- <target> [mode] [depth]` | CLI recon |
| `npm test` | Run tests |
| `npm run typecheck` | TypeScript check, no emit |

---

## Roadmap

- [x] **v0.2** — Deterministic recon engine, belief space, dashboard, investigation persistence
- [ ] **v0.3** — Email recon (HIBP), infrastructure recon (Shodan/Censys), identity resolver
- [ ] **v0.4** — AI enhancement layer (NVIDIA NIM / structured output) for pivot suggestions and report enrichment
- [ ] **v0.5** — "Echo" signal tracking: temporal propagation across platforms, velocity, prediction
- [ ] **v1.0** — Production-ready autonomous intelligence engine

See `docs/design-product-definition.md` for the full vision.

---

## Requirements

- Node.js 20+
- No paid API keys required for Phase 1 capability (RDAP, DoH, crt.sh, public profile checks)

---

## Disclaimer

For authorized security testing, journalism, and research. Respect platform ToS, rate limits, and applicable laws. Verify critical intelligence through primary sources.

---

<div align="center">

**MIT License** · <a href="https://github.com/Jinish2170/Echo-OSINT">GitHub</a> · <a href="https://github.com/Jinish2170/Echo-OSINT/issues">Issues</a>

</div>
