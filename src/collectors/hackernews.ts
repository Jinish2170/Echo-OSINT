// HackerNews Collector - Free Firebase API, No Auth Required
import axios from 'axios';
import { BaseCollector } from './base';
import { FINDING } from '../types';
import CONFIG from '../config';

export class HackerNewsCollector extends BaseCollector {
  private baseUrl: string;

  constructor() {
    const cfg = CONFIG.sources.hackernews;
    super('hackernews', cfg.enabled, cfg.rateLimit);
    this.baseUrl = cfg.baseUrl;
  }

  async collect(query: string, limit: number = 20): Promise<FINDING[]> {
    await this.checkRateLimit();
    const findings: FINDING[] = [];

    try {
      // Get top stories
      const topStoriesResponse = await axios.get(`${this.baseUrl}/topstories.json`);
      const topStoryIds = topStoriesResponse.data.slice(0, 50);

      // Fetch story details in parallel (limit concurrent requests)
      const storyPromises = topStoryIds.slice(0, 20).map(async (id: number) => {
        try {
          const storyResponse = await axios.get(`${this.baseUrl}/item/${id}.json`);
          return storyResponse.data;
        } catch {
          return null;
        }
      });

      const stories = await Promise.all(storyPromises);

      for (const story of stories) {
        if (!story) continue;

        const matchesQuery =
          story.title?.toLowerCase().includes(query.toLowerCase()) ||
          story.text?.toLowerCase().includes(query.toLowerCase());

        if (matchesQuery || findings.length < limit / 2) {
          findings.push(
            this.createFinding(
              `${story.title}\n\n${story.text?.substring(0, 500) || ''}\n\nScore: ${story.score}\nComments: ${story.descendants || 0}`,
              story.by || 'unknown',
              'trend',
              story.url || `https://news.ycombinator.com/item?id=${story.id}`
            )
          );
        }
      }

      // Also search for specific query if top stories don't match enough
      if (findings.length < limit / 2) {
        // HackerNews doesn't have a native search API, so we use Algolia's JSON search
        try {
          const searchResponse = await axios.get(
            'https://hn.algolia.com/api/v1/search',
            {
              params: {
                query,
                tags: 'story',
                hitsPerPage: limit,
              },
            }
          );

          const searchHits = searchResponse.data.hits || [];

          for (const hit of searchHits.slice(0, 10)) {
            findings.push(
              this.createFinding(
                `${hit.title}\n\n${hit.story_text?.substring(0, 500) || ''}\n\nPoints: ${hit.points}\nComments: ${hit.num_comments}`,
                hit.author || 'unknown',
                'entity',
                hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`
              )
            );
          }
        } catch (error) {
          console.error('HN Algolia search error:', error);
        }
      }

      // Get recent Ask HN posts (often contain valuable discussions)
      try {
        const askResponse = await axios.get(
          'https://hn.algolia.com/api/v1/search',
          {
            params: {
              query,
              tags: 'ask_hn',
              hitsPerPage: 5,
            },
          }
        );

        const askHits = askResponse.data.hits || [];

        for (const hit of askHits) {
          findings.push(
            this.createFinding(
              `ASK HN: ${hit.title}\n\n${hit.story_text || ''}`,
              hit.author || 'unknown',
              'event',
              hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`
            )
          );
        }
      } catch (error) {
        console.error('HN Ask search error:', error);
      }
    } catch (error) {
      console.error('HackerNews collection error:', error);
    }

    // Remove duplicates based on URL
    const uniqueFindings = Array.from(
      new Map(findings.map(f => [f.source + '|' + (f as any).url, f])).values()
    );

    return uniqueFindings.slice(0, limit);
  }

  async test(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/topstories.json`);
      return Array.isArray(response.data);
    } catch {
      return false;
    }
  }
}

export function createHackerNewsCollector(): HackerNewsCollector {
  return new HackerNewsCollector();
}