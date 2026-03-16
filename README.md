# Echo-OSINT: Autonomous Intelligence Engine

<p align="center">
  <img src="https://img.shields.io/badge/Version-0.1.0--alpha-blue" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/TypeScript-Ready-3178c6" alt="TypeScript">
  <img src="https://img.shields.io/badge/CrewAI-Powered-ff6b6b" alt="CrewAI">
  <img src="https://img.shields.io/badge/NVIDIA-NIM-76b900" alt="NVIDIA NIM">
</p>

> **Premium OSINT intelligence using free data sources + AI orchestration**

---

## The Problem

Current OSINT tools require expensive subscriptions:
- Brandwatch/Meltwater: **$10,000+/year**
- Twitter API: **$100+/month**
- News feeds: **$500+/month**

**Echo-OSINT** delivers better intelligence at 1/100th the cost by leveraging free data sources + AI.

---

## The Vision

**Echo-OSINT** is an autonomous intelligence engine that produces premium-quality OSINT (Open Source Intelligence) without requiring expensive data subscriptions.

| Component | What It Does |
|-----------|-------------|
| **Free Data Sources** | Reddit, GitHub, HackerNews, SearXNG, RSS |
| **CrewAI Orchestration** | Multi-agent research crews with memory |
| **NVIDIA NIM Inference** | High-quality LLM synthesis (free tier: 1k req/day) |
| **Knowledge Graph** | Temporal signal propagation tracking |

### The Promise

```
ORDINARY: Pay $1000/month for Twitter API → Get raw tweets
ECHO-OSINT: Use free Reddit/GitHub/HN → AI crew researches
            cross-platform → NVIDIA NIM synthesizes →
            Better intelligence at 1/100th the cost
```

---

## Features

- **Natural Language Queries**: Ask questions in plain English
- **Multi-Source Fusion**: Collects from Reddit, GitHub, HackerNews, and more
- **Self-Correcting Research**: CrewAI agents validate and refine findings
- **Confidence Scoring**: Every finding includes reliability assessment
- **Prediction Engine**: Forecasts signal propagation across platforms
- **Fully Local-Ready**: Self-host SearXNG, Qdrant, Neo4j for complete privacy

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/Jinish2170/Echo-OSINT.git
cd Echo-OSINT
npm install
```

### 2. Configure NVIDIA API (Required)

1. Go to **[https://build.nvidia.com/](https://build.nvidia.com/)**
2. Sign up for free account
3. Generate API key
4. Copy environment template:

```bash
copy .env.example .env
```

5. Edit `.env` and add your key:

```env
NVIDIA_API_KEY=nv-your-api-key-here
```

### 3. Run Your First Query

```bash
npm run dev -- "artificial intelligence trends 2025"
```

### Expected Output

```
🔍 Echo-OSINT: Processing query "artificial intelligence trends 2025"
📡 Collected from 4 sources
📊 Total findings: 47
🤖 CrewAI crew initialized (ready for full research cycle)
✅ Query complete in 2450ms | Confidence: 84.3%

INTELLIGENCE RESULT
📊 Confidence: 84.3%
📁 Sources: 4
🔍 Findings: 47

🔮 Predictions:
• High likelihood of mainstream coverage within 24-48 hours (75% confidence)
```

---

## Programmatic Usage

```typescript
import { EchoOSINT } from './src';

const engine = new EchoOSINT();

// Run an intelligence query
const result = await engine.query('trends in quantum computing');

// Access structured results
console.log('Summary:', result.synthesis.summary);
console.log('Confidence:', result.confidence);
console.log('Predictions:', result.synthesis.predictions);
console.log('Recommendations:', result.synthesis.recommendations);
```

---

## Data Sources

| Source | Auth Required | Rate Limit | Status |
|--------|---------------|------------|--------|
| Reddit | Optional | 60/min (free) | ✅ Ready |
| GitHub | Optional (recommended) | 5000/hr | ✅ Ready |
| HackerNews | No | Unlimited | ✅ Ready |
| SearXNG | No | Depends on instance | ✅ Ready |
| RSS | No | Unlimited | ✅ Ready |

---

## Self-Hosting (Optional)

For full privacy and capability, self-host these services:

### SearXNG (Metasearch)
```bash
docker run -d --name searxng -p 8080:8080 searxng/searxng:latest
```

### Qdrant (Vector Database)
```bash
docker run -d --name qdrant -p 6333:6333 qdrant/qdrant
```

### Neo4j (Knowledge Graph)
```bash
docker run -d --name neo4j -p 7474:7474 -p 7687:7687 neo4j
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ECHO-OSINT ENGINE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────┐   │
│  │   Reddit    │    │    GitHub    │    │    HackerNews       │   │
│  │  Collector  │    │   Collector  │    │     Collector       │   │
│  └──────┬──────┘    └──────┬───────┘    └──────────┬──────────┘   │
│         │                  │                       │               │
│         └──────────────────┼───────────────────────┘               │
│                            ▼                                        │
│               ┌────────────────────────┐                           │
│               │   Collector Registry   │                           │
│               └───────────┬────────────┘                           │
│                           ▼                                         │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    CREWAI RESEARCH CREW                       │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐        │ │
│  │  │Discovery │→ │ Collect  │→ │ Analyze  │→ │Validate│→ Synth │ │
│  │  │  Agent   │  │  Agent   │  │  Agent   │  │ Agent  │→ Agent │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                            ▼                                         │
│               ┌────────────────────────┐                           │
│               │    NVIDIA NIM LLM      │                           │
│               │   (Llama 3.1 70B)      │                           │
│               └───────────┬────────────┘                           │
│                           ▼                                         │
│               ┌────────────────────────┐                           │
│               │   INTELLIGENCE OUTPUT  │                           │
│               │  • Summary             │                           │
│               │  • Key Insights        │                           │
│               │  • Predictions         │                           │
│               │  • Recommendations     │                           │
│               └────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Usage Examples

### Tech Trend Detection
```bash
npm run dev -- "what frameworks are developers excited about"
```

### Early Signal Detection
```bash
npm run dev -- "what emerging technologies are getting traction"
```

### Competitive Intelligence
```bash
npm run dev -- "compare React vs Vue vs Svelte discussions"
```

### Market Research
```bash
npm run dev -- "what are the problems in the AI industry"
```

---

## Project Structure

```
echo-osint/
├── src/
│   ├── index.ts           # Main engine entry point
│   ├── config/            # Configuration management
│   ├── types/             # TypeScript type definitions
│   ├── collectors/        # Data source collectors
│   │   ├── reddit.ts      # Reddit collector
│   │   ├── github.ts      # GitHub collector
│   │   ├── hackernews.ts  # HackerNews collector
│   │   └── searxng.ts     # SearXNG collector
│   └── orchestration/     # CrewAI crew definitions
├── tests/                 # Test files
├── examples/              # Usage examples
├── .env.example           # Environment template
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript config
```

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev -- "query"` | Run an intelligence query |
| `npm run build` | Compile TypeScript |
| `npm test` | Run tests |
| `npm run lint` | Lint code |

---

## Roadmap

- [x] v0.1 - Basic multi-source collection (Reddit, GitHub, HN, SearXNG)
- [ ] v0.2 - CrewAI research crew integration
- [ ] v0.3 - NVIDIA NIM synthesis
- [ ] v0.4 - Knowledge graph for signal propagation
- [ ] v0.5 - Self-hosted SearXNG integration
- [ ] v1.0 - Production-ready autonomous intelligence engine

---

## Requirements

- Node.js 20+
- NVIDIA API key (free at https://build.nvidia.com/)

---

## Disclaimer

This tool is for educational and research purposes. Always:
- Respect platform terms of service
- Adhere to rate limits
- Verify critical intelligence through primary sources

---

<div align="center">

**Built with** ❤️ **using CrewAI + NVIDIA NIM**

<a href="https://github.com/Jinish2170/Echo-OSINT">GitHub</a> • <a href="https://github.com/Jinish2170/Echo-OSINT/issues">Issues</a>

</div>