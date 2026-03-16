// GitHub Collector - Free API
import axios from 'axios';
import { BaseCollector } from './base';
import { FINDING } from '../types';
import CONFIG from '../config';

export class GitHubCollector extends BaseCollector {
  private token: string;

  constructor() {
    const cfg = CONFIG.sources.github;
    super('github', cfg.enabled, cfg.rateLimit);
    this.token = cfg.token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Echo-OSINT/0.1',
    };

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    return headers;
  }

  async collect(query: string, limit: number = 20): Promise<FINDING[]> {
    await this.checkRateLimit();
    const findings: FINDING[] = [];

    try {
      // Search repositories
      const searchResponse = await axios.get(
        'https://api.github.com/search/repositories',
        {
          headers: this.getHeaders(),
          params: {
            q: query,
            sort: 'stars',
            order: 'desc',
            per_page: Math.min(limit, 10),
          },
        }
      );

      const repos = searchResponse.data.items || [];

      for (const repo of repos) {
        findings.push(
          this.createFinding(
            `${repo.full_name}\n\n${repo.description || ''}\n\nStars: ${repo.stargazers_count}\nForks: ${repo.forks_count}\nLanguage: ${repo.language || 'N/A'}`,
            repo.full_name,
            'entity',
            repo.html_url
          )
        );
      }

      // Search code (if we have a token - higher rate limits)
      if (this.token) {
        try {
          const codeResponse = await axios.get(
            'https://api.github.com/search/code',
            {
              headers: this.getHeaders(),
              params: {
                q: query,
                per_page: Math.min(limit, 5),
              },
            }
          );

          const codeItems = codeResponse.data.items || [];

          for (const item of codeItems) {
            findings.push(
              this.createFinding(
                `${item.path}\n\nRepository: ${item.repository.full_name}`,
                item.repository.full_name,
                'relationship',
                item.html_url
              )
            );
          }
        } catch (error) {
          // Code search might fail due to rate limits - that's okay
          console.log('Code search rate limited, skipping');
        }
      }

      // Get trending repositories
      try {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const dateStr = weekAgo.toISOString().split('T')[0];

        const trendingResponse = await axios.get(
          'https://api.github.com/search/repositories',
          {
            headers: this.getHeaders(),
            params: {
              q: `${query} created:>${dateStr}`,
              sort: 'stars',
              order: 'desc',
              per_page: 5,
            },
          }
        );

        const trending = trendingResponse.data.items || [];

        for (const repo of trending) {
          findings.push(
            this.createFinding(
              `${repo.full_name} - Rising Star\n\n${repo.description || ''}\n\nStars: ${repo.stargazers_count} (${repo.stargazers_count - repo.watchers_count} new this week)`,
              repo.full_name,
              'trend',
              repo.html_url
            )
          );
        }
      } catch (error) {
        console.error('Error fetching trending:', error);
      }
    } catch (error) {
      console.error('GitHub collection error:', error);
    }

    return findings;
  }

  async test(): Promise<boolean> {
    try {
      const response = await axios.get('https://api.github.com/rate_limit', {
        headers: this.getHeaders(),
      });

      return response.status === 200;
    } catch {
      return false;
    }
  }

  getRateLimitStatus(): { remaining: number; reset: Date } | null {
    // This would need to be tracked from API responses
    return null;
  }
}

export function createGitHubCollector(): GitHubCollector {
  return new GitHubCollector();
}