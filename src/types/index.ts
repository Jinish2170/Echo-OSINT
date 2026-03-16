// Echo-OSINT Core Types

export interface INTELLIGENCE_QUERY {
  id: string;
  query: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, unknown>;
}

export interface INTELLIGENCE_RESULT {
  id: string;
  query: string;
  findings: FINDING[];
  synthesis: SYNTHESIS;
  confidence: number;
  sources: SOURCE[];
  propagation_path: PROPAGATION_PATH;
  timestamp: Date;
}

export interface FINDING {
  entity: string;
  type: 'entity' | 'event' | 'trend' | 'relationship';
  content: string;
  source: string;
  timestamp: Date;
  relevance: number;
  sentiment?: number;
}

export interface SYNTHESIS {
  summary: string;
  key_insights: string[];
  predictions: PREDICTION[];
  recommendations: string[];
}

export interface PREDICTION {
  projection: string;
  confidence: number;
  timeframe: string;
  signals: string[];
}

export interface SOURCE {
  platform: string;
  url: string;
  reliability_score: number;
  freshness: Date;
}

export interface PROPAGATION_PATH {
  origin: PLATFORM;
  intermediate: PLATFORM[];
  current: PLATFORM;
  velocity: number;
  estimated_arrival?: Date;
}

export type PLATFORM =
  | 'reddit'
  | 'github'
  | 'hackernews'
  | 'youtube'
  | 'twitter'
  | 'news'
  | 'rss'
  | 'discord'
  | 'lemmy';

export interface AGENT_CONFIG {
  role: string;
  goal: string;
  backstory: string;
  tools: string[];
  memory?: boolean;
  max_iterations?: number;
}

export interface COLLECTOR_CONFIG {
  platform: PLATFORM;
  enabled: boolean;
  rate_limit: number;
  retry_strategy?: 'exponential' | 'linear' | 'constant';
}

export interface KNOWLEDGE_NODE {
  id: string;
  type: 'person' | 'organization' | 'technology' | 'event' | 'location';
  properties: Record<string, unknown>;
  embeddings?: number[];
  first_seen: Date;
  last_updated: Date;
}

export interface KNOWLEDGE_EDGE {
  source: string;
  target: string;
  relationship: string;
  weight: number;
  temporal?: boolean;
  valid_from: Date;
  valid_to?: Date;
}

export interface RESEARCH_STATE {
  query: string;
  phase: 'discovery' | 'collection' | 'analysis' | 'validation' | 'synthesis';
  findings: FINDING[];
  confidence: number;
  validated: boolean;
  retry_count: number;
}