# Echo-OSINT: Autonomous Intelligence Engine

<p align="center">
  <img src="https://img.shields.io/badge/Version-0.1.0-alpha-blue" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/TypeScript-Ready-3178c6" alt="TypeScript">
  <img src="https://img.shields.io/badge/CrewAI-Powered-ff6b6b" alt="CrewAI">
  <img src="https://img.shields.io/badge/NVIDIA-NIM-76b900" alt="NVIDIA NIM">
</p>

> **Premium OSINT intelligence using free data sources + AI orchestration**

---

## 🎯 The Vision

**Echo-OSINT** is an autonomous intelligence engine that produces premium-quality OSINT (Open Source Intelligence) without requiring expensive data subscriptions. It combines:

| Component | What It Does |
|-----------|-------------|
| **Free Data Sources** | Reddit, GitHub, HackerNews, SearXNG, RSS |
| **CrewAI Orchestration** | Multi-agent research crews with memory |
| **NVIDIA NIM Inference** | High-quality LLM synthesis (free tier available) |
| **Knowledge Graph** | Temporal signal propagation tracking |

### The "Impossible" Promise

```
ORDINARY: Pay $1000/month for Twitter API → Get raw tweets
          Pay $500/month for news feeds → Get raw articles

ECHO-OSINT: Use free Reddit/GitHub/HN → AI crew researches
            cross-platform → NVIDIA NIM synthesizes →
            Better intelligence at 1/100th the cost
```

---

## 🚀 Features

- **Natural Language Queries**: Ask questions in plain English
- **Multi-Source Fusion**: Collects from Reddit, GitHub, HackerNews, and more
- **Self-Correcting Research**: CrewAI agents validate and refine findings
- **Confidence Scoring**: Every finding includes reliability assessment
- **Prediction Engine**: Forecasts signal propagation across platforms
- **Fully Local-Ready**: Self-host SearXNG, Qdrant, Neo4j for complete privacy

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Jinish2170/Echo-OSINT.git
cd Echo-OSINT

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your API keys (see Configuration section)
```

---

## ⚡ Quick Start

### Basic Query

```bash
npm run dev -- "what are the latest trends in AI"
```

### Programmatic Usage

```typescript
import { EchoOSINT } from './src';

const engine = new EchoOSINT();

const result = await engine.query('trends in quantum computing');

// Access results
console.log(result.synthesis.summary);
console.log(result.synthesis.predictions);
console.log(result.confidence);
```

---

## 🔧 Configuration

### Required: NVIDIA NIM API Key

1. Visit [https://build.nvidia.com/](https://build.nvidia.com/)
2. Sign up for free account
3. Generate API key
4. Add to `.env`:
   ```
   NVIDIA_API_KEY=nv-xxxxxxxxxxxxxxxx
   ```

### Optional: Enhanced Data Sources

| Source | Key Needed | Benefit |
|--------|------------|---------|
| Reddit | No (works free) | 60 req/min |
| GitHub | Yes (recommended) | 5000 req/hour |
| HackerNews | No | Unlimited |
| SearXNG | No (uses public) | Metasearch |

### Optional: Local Services

For full capability, self-host:
- **SearXNG** - `docker run -d --name searxng -p 8080:8080 searxng/searxng:latest`
- **Qdrant** - `docker run -d --name qdrant -p 6333:6333 qdrant/qdrant`
- **Neo4j** - `docker run -d --name neo4j -p 7474:7474 -p 7687:7687 neo4j`

---

## 🏗️ Architecture

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

## 🎯 Usage Examples

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

---

## 📋 Roadmap

- [ ] v0.1 - Basic multi-source collection (Reddit, GitHub, HN, SearXNG)
- [ ] v0.2 - CrewAI research crew integration
- [ ] v0.3 - NVIDIA NIM synthesis
- [ ] v0.4 - Knowledge graph for signal propagation
- [ ] v0.5 - Self-hosted SearXNG integration
- [ ] v1.0 - Production-ready autonomous intelligence engine

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

## ⚠️ Disclaimer

This tool is for educational and research purposes. Always:
- Respect platform terms of service
- Adhere to rate limits
- Verify critical intelligence through primary sources

---

<div align="center">

**Built with** ❤️ **using CrewAI + NVIDIA NIM**

</div>