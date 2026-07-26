# Echo-OSINT

**Deterministic OSINT engine with a reasoning layer** — reconnaissance, belief modeling, and intelligence brief generation in a single TypeScript stack.

Echo-OSINT goes beyond simple username checkers. It combines multi-platform reconnaissance with a Bayesian-inspired belief space and significance scoring engine, producing structured intelligence briefs with ranked investigative leads — not just raw data dumps.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│              (React 18 + Vite + TypeScript)           │
└──────────────────────┬──────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────┐
│                Express.js Backend                    │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Recon Layer  │  │ Belief Space │  │ Significance│ │
│  │              │  │              │  │   Engine    │ │
│  │ • Username   │  │ • Bayesian   │  │ • Novelty   │ │
│  │ • Domain     │  │   confidence │  │ • Rarity    │ │
│  │              │  │ • Contradict.│  │ • Severity  │ │
│  │              │  │   detection  │  │ • Timeliness│ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │
│         └─────────────────┼────────────────┘        │
│                           ▼                          │
│              ┌────────────────────────┐              │
│              │  Intelligence Brief    │              │
│              │     Generator          │              │
│              └────────────┬───────────┘              │
│                           ▼                          │
│              ┌────────────────────────┐              │
│              │  Investigation Store   │              │
│              │   (JSON persistence)   │              │
│              └────────────────────────┘              │
└─────────────────────────────────────────────────────┘
```

## Core Capabilities

### Multi-Platform Username Reconnaissance

Checks account existence across **50+ platforms** via HTTP status probes — social networks, developer platforms, forums, and more. Results feed directly into the belief space for correlation analysis.

### Domain Intelligence

- **RDAP lookups** — registrant and registration data via `rdap.org`
- **DNS resolution** — record enumeration through Cloudflare DNS-over-HTTPS
- **Subdomain discovery** — passive enumeration via Certificate Transparency logs (`crt.sh`)

### Belief Space (Reasoning Layer)

The belief space is what separates Echo-OSINT from conventional recon tools. Rather than presenting flat lists of hits, it maintains a structured model of what is known about a target:

- **Bayesian-inspired confidence scoring** — each finding carries a confidence value that updates as corroborating or contradicting evidence arrives
- **Keyword contradiction detection** — flags when new findings conflict with established beliefs
- **In-memory knowledge graph** — findings are interlinked, not siloed by data source

### Significance Engine

Not all findings matter equally. The significance engine scores each result across four weighted dimensions:

| Dimension    | What it measures                              |
|-------------|-----------------------------------------------|
| **Novelty**     | How unexpected is this finding?               |
| **Rarity**      | How uncommon is this data point across targets?|
| **Severity**    | What is the potential impact or sensitivity?   |
| **Timeliness**  | How recent or time-critical is this?           |

High-significance findings surface to the top of intelligence briefs automatically.

### Intelligence Brief Generator

Produces structured, readable briefs from raw reconnaissance data — summarizing findings, ranking leads by significance, and highlighting areas that warrant further investigation. Briefs are generated deterministically from the belief space state.

### Investigation Persistence

Investigations are saved as JSON files on disk, allowing you to resume, review, or compare investigations over time without external database dependencies.

## Investigation Modes

| Mode            | Purpose                                          |
|----------------|--------------------------------------------------|
| **Hunter**         | Aggressive, broad-spectrum reconnaissance         |
| **Investigator**   | Balanced depth and breadth                        |
| **Watcher**        | Lighter touch, monitoring-oriented                |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/Jinish2170/Echo-OSINT.git
cd Echo-OSINT
npm install
```

### CLI Usage

```bash
# Basic recon
npm run dev -- <target> [mode] [depth]

# Examples
npm run dev -- johndoe hunter
npm run dev -- example.com investigator deep
```

### API Server

Start the Express backend:

```bash
npm run dev
```

#### Endpoints

| Method | Path                      | Description                        |
|--------|---------------------------|------------------------------------|
| GET    | `/health`                 | Health check                       |
| POST   | `/recon`                  | Launch a new reconnaissance task   |
| GET    | `/investigations`         | List all saved investigations      |
| GET    | `/investigation/:id`      | Retrieve a specific investigation  |

### Frontend

The React frontend provides a browser-based interface for launching investigations and reviewing results.

```bash
cd frontend
npm install
npm run dev
```

## Tech Stack

| Layer     | Technology                                  |
|-----------|---------------------------------------------|
| Language  | TypeScript (100%)                           |
| Backend   | Express.js                                  |
| Frontend  | React 18, Vite                              |
| HTTP      | Axios with retry logic, caching, and rate limiting (p-queue) |
| Storage   | JSON file persistence                       |

## Project Structure

```
src/
├── api/
│   └── server.ts            # Express REST API
├── recon/
│   ├── username.ts           # 50+ platform username checks
│   └── domain.ts             # RDAP, DNS-over-HTTPS, crt.sh
├── core/
│   ├── belief-space.ts       # Bayesian confidence & contradiction detection
│   ├── significance.ts       # Weighted novelty/rarity/severity/timeliness
│   ├── brief-generator.ts    # Structured intelligence brief output
│   └── investigation-store.ts # JSON persistence layer
frontend/
└── src/
    └── App.tsx               # React UI
```

~2,100 lines of TypeScript.

## Design Philosophy

Echo-OSINT is **fully deterministic** — no external AI services, no LLM calls, no cloud dependencies beyond the public APIs it queries (RDAP, DNS-over-HTTPS, crt.sh, platform URLs). The "intelligence" comes from structured reasoning: belief modeling, significance scoring, and contradiction detection applied programmatically to raw OSINT data.

This makes it **fast, reproducible, and auditable**. The same target queried twice produces the same belief state and the same brief.

## License

See [LICENSE](LICENSE) for details.

---

<p align="center"><i>Built by <a href="https://github.com/Jinish2170">Jinish</a></i></p>
