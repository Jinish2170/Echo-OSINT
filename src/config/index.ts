import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  // NVIDIA NIM Configuration
  nvidia: {
    apiKey: process.env.NVIDIA_API_KEY || '',
    baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    model: process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct',
    freeTierLimit: 1000, // requests per day
  },

  // Data Source Configuration
  sources: {
    reddit: {
      enabled: process.env.REDDIT_ENABLED === 'true' || true,
      clientId: process.env.REDDIT_CLIENT_ID || '',
      clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
      userAgent: process.env.REDDIT_USER_AGENT || 'Echo-OSINT/0.1',
      rateLimit: 60, // requests per minute
      subreddits: (process.env.REDDIT_SUBREDDITS || 'technology,programming,artificial,MachineLearning,cryptocurrency,cybersecurity').split(','),
    },
    github: {
      enabled: process.env.GITHUB_ENABLED === 'true' || true,
      token: process.env.GITHUB_TOKEN || '',
      rateLimit: 5000, // requests per hour (authenticated)
    },
    hackernews: {
      enabled: process.env.HN_ENABLED === 'true' || true,
      baseUrl: 'https://hacker-news.firebaseio.com/v0',
      rateLimit: 0, // No limit
    },
    youtube: {
      enabled: process.env.YOUTUBE_ENABLED === 'true' || false,
      apiKey: process.env.YOUTUBE_API_KEY || '',
      quotaLimit: 10000, // units per day
    },
    searxng: {
      enabled: process.env.SEARXNG_ENABLED === 'true' || true,
      baseUrl: process.env.SEARXNG_URL || 'http://localhost:8080',
    },
    rss: {
      enabled: process.env.RSS_ENABLED === 'true' || true,
      feeds: (process.env.RSS_FEEDS || '').split(',').filter(Boolean),
    },
  },

  // Knowledge Base Configuration
  knowledge: {
    vectorDb: {
      provider: process.env.VECTOR_DB_PROVIDER || 'qdrant',
      url: process.env.QDRANT_URL || 'localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
      collection: 'echo-osint-intelligence',
    },
    graphDb: {
      provider: process.env.GRAPH_DB_PROVIDER || 'neo4j',
      uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
      username: process.env.NEO4J_USERNAME || 'neo4j',
      password: process.env.NEO4J_PASSWORD || '',
    },
  },

  // CrewAI Configuration
  crewai: {
    agents: {
      discovery: {
        max_iterations: 10,
        memory: true,
      },
      collector: {
        max_iterations: 20,
        memory: true,
      },
      analysis: {
        max_iterations: 15,
        memory: true,
      },
      validator: {
        max_iterations: 10,
        memory: true,
      },
      synthesizer: {
        max_iterations: 5,
        memory: true,
      },
    },
    process: process.env.CREWAI_PROCESS || 'hierarchical',
  },

  // Research Configuration
  research: {
    confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.7'),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
    parallelSources: parseInt(process.env.PARALLEL_SOURCES || '5'),
    timeout: parseInt(process.env.RESEARCH_TIMEOUT || '120000'),
  },
};

export default CONFIG;