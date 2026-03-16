// SearXNG Collector - Self-hosted Metasearch
import axios from 'axios';
import { BaseCollector } from './base';
import { FINDING } from '../types';
import CONFIG from '../config';

export class SearXNGCollector extends BaseCollector {
  private baseUrl: string;

  constructor() {
    const cfg = CONFIG.sources.searxng;
    super('searxng', cfg.enabled, 0);
    this.baseUrl = cfg.baseUrl;
  }

  async collect(query: string, limit: number = 20): Promise<FINDING[]> {
    await this.checkRateLimit();
    const findings: FINDING[] = [];

    try {
      // SearXNG JSON search API
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          q: query,
          format: 'json',
          engines: 'google,bing,duckduckgo,wikipedia',
          language: 'en',
          safe_search: 1,
        },
        timeout: 30000,
      });

      const results = response.data.results || [];

      for (const result of results.slice(0, limit)) {
        findings.push(
          this.createFinding(
            `${result.title}\n\n${result.content?.substring(0, 500) || ''}`,
            result.url,
            'entity',
            result.url
          )
        );
      }

      // Get suggestions if available
      const suggestions = response.data.suggestions || [];

      if (suggestions.length > 0) {
        for (const suggestion of suggestions.slice(0, 3)) {
          findings.push(
            this.createFinding(
              `Related search: ${suggestion}`,
              'suggestion',
              'trend'
            )
          );
        }
      }
    } catch (error) {
      console.error('SearXNG collection error:', error);
    }

    return findings;
  }

  async test(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          q: 'test',
          format: 'json',
        },
        timeout: 10000,
      });

      return response.status === 200 && response.data.results !== undefined;
    } catch {
      return false;
    }
  }

  getHealthStatus(): { healthy: boolean; latency?: number } {
    const start = Date.now();

    return new Promise(resolve => {
      axios
        .get(`${this.baseUrl}/search`, {
          params: { q: 'health', format: 'json' },
          timeout: 5000,
        })
        .then(() => {
          resolve({ healthy: true, latency: Date.now() - start });
        })
        .catch(() => {
          resolve({ healthy: false });
        });
    }) as any;
  }
}

export function createSearXNGCollector(): SearXNGCollector {
  return new SearXNGCollector();
}