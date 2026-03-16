// Reddit Collector - Free Tier
import axios from 'axios';
import { BaseCollector, CollectorRegistry } from './base';
import { FINDING, PLATFORM } from '../types';
import CONFIG from '../config';

export class RedditCollector extends BaseCollector {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    const cfg = CONFIG.sources.reddit;
    super('reddit', cfg.enabled, cfg.rateLimit);
    this.rateLimit = cfg.rateLimit;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const { clientId, clientSecret, userAgent } = CONFIG.sources.reddit;

    if (!clientId || !clientSecret) {
      // Use public API without auth (lower rate limit)
      return 'public';
    }

    try {
      const response = await axios.post(
        'https://www.reddit.com/api/v1/access_token',
        new URLSearchParams({ grant_type: 'client_credentials' }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': userAgent,
          },
          auth: { username: clientId, password: clientSecret },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
      return this.accessToken!;
    } catch (error) {
      console.error('Failed to get Reddit access token:', error);
      return 'public';
    }
  }

  async collect(query: string, limit: number = 20): Promise<FINDING[]> {
    await this.checkRateLimit();
    const findings: FINDING[] = [];

    try {
      const token = await this.getAccessToken();
      const headers: Record<string, string> = {
        'User-Agent': CONFIG.sources.reddit.userAgent,
      };

      if (token !== 'public') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Search subreddits
      const subreddits = CONFIG.sources.reddit.subreddits;

      for (const subreddit of subreddits.slice(0, 5)) {
        try {
          const searchUrl = `https://www.reddit.com/r/${subreddit}/search.json`;
          const response = await axios.get(searchUrl, {
            headers,
            params: {
              q: query,
              limit: Math.min(limit / subreddits.length, 10),
              sort: 'relevance',
              t: 'year',
            },
          });

          const posts = response.data.data?.children || [];

          for (const post of posts) {
            const data = post.data;
            findings.push(
              this.createFinding(
                `${data.title}\n\n${data.selftext?.substring(0, 500)}`,
                data.author,
                'entity',
                `https://reddit.com${data.permalink}`
              )
            );
          }
        } catch (error) {
          console.error(`Error searching r/${subreddit}:`, error);
        }
      }

      // Get trending discussions
      try {
        const trendingUrl = 'https://www.reddit.com/r/popular/hot.json';
        const response = await axios.get(trendingUrl, {
          headers,
          params: { limit: 10 },
        });

        const posts = response.data.data?.children || [];

        for (const post of posts) {
          const data = post.data;
          if (
            data.title.toLowerCase().includes(query.toLowerCase()) ||
            data.selftext?.toLowerCase().includes(query.toLowerCase())
          ) {
            findings.push(
              this.createFinding(
                `${data.title}\n\n${data.selftext?.substring(0, 500)}`,
                data.author,
                'trend',
                `https://reddit.com${data.permalink}`
              )
            );
          }
        }
      } catch (error) {
        console.error('Error getting trending:', error);
      }
    } catch (error) {
      console.error('Reddit collection error:', error);
    }

    return findings;
  }

  async test(): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      const headers: Record<string, string> = {
        'User-Agent': CONFIG.sources.reddit.userAgent,
      };

      if (token !== 'public') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.get('https://www.reddit.com/r/technology/hot.json', {
        headers,
        params: { limit: 1 },
      });

      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export function createRedditCollector(): RedditCollector {
  return new RedditCollector();
}