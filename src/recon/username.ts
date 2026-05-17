// Username Reconnaissance Module - Discovers presence across 50+ platforms
import { httpClient } from '../core/http-client';
import { Target, Finding, EvidenceLink, TARGET_TYPE } from '../types';
import { significanceEngine } from '../core/significance';

interface PlatformResult {
  platform: string;
  url: string | null;
  exists: boolean;
  username?: string;
  profileUrl?: string;
}

// Common platforms for username reconnaissance
const PLATFORMS = [
  // Social
  { name: 'github', url: 'https://api.github.com/users/{username}', check: 'exists' },
  { name: 'twitter', url: 'https://twitter.com/{username}', check: 'url' },
  { name: 'linkedin', url: 'https://www.linkedin.com/in/{username}', check: 'url' },
  { name: 'instagram', url: 'https://www.instagram.com/{username}', check: 'url' },
  { name: 'facebook', url: 'https://www.facebook.com/{username}', check: 'url' },
  { name: 'reddit', url: 'https://www.reddit.com/user/{username}', check: 'url' },
  { name: 'mastodon', url: 'https://mastodon.social/@{username}', check: 'url' },
  { name: 'threads', url: 'https://threads.net/@{username}', check: 'url' },

  // Dev
  { name: 'gitlab', url: 'https://gitlab.com/{username}', check: 'url' },
  { name: 'stackoverflow', url: 'https://stackoverflow.com/users/{username}', check: 'url' },
  { name: 'devto', url: 'https://dev.to/{username}', check: 'url' },
  { name: 'npm', url: 'https://www.npmjs.com/~{username}', check: 'url' },
  { name: 'pypi', url: 'https://pypi.org/user/{username}', check: 'url' },
  { name: 'dockerhub', url: 'https://hub.docker.com/u/{username}', check: 'url' },
  { name: 'bitbucket', url: 'https://bitbucket.org/{username}', check: 'url' },

  // Content
  { name: 'youtube', url: 'https://youtube.com/@{username}', check: 'url' },
  { name: 'medium', url: 'https://medium.com/@{username}', check: 'url' },
  { name: 'substack', url: 'https://{username}.substack.com', check: 'url' },
  { name: 'hashnode', url: 'https://hashnode.com/@{username}', check: 'url' },
  { name: 'deviantart', url: 'https://www.deviantart.com/{username}', check: 'url' },

  // Professional
  { name: 'keybase', url: 'https://keybase.io/{username}', check: 'url' },
  { name: 'slideshare', url: 'https://www.slideshare.net/{username}', check: 'url' },
  { name: 'speakerdeck', url: 'https://speakerdeck.com/{username}', check: 'url' },
  { name: 'credly', url: 'https://www.credly.com/users/{username}', check: 'url' },

  // Gaming
  { name: 'steam', url: 'https://steamcommunity.com/id/{username}', check: 'url' },
  { name: 'discord', url: 'https://discord.com/users/{username}', check: 'url' },
  { name: 'twitch', url: 'https://www.twitch.tv/{username}', check: 'url' },
  { name: 'epicgames', url: 'https://www.epicgames.com/{username}', check: 'url' },

  // Finance
  { name: 'hackerone', url: 'https://hackerone.com/{username}', check: 'url' },
  { name: 'bugcrowd', url: 'https://bugcrowd.com/{username}', check: 'url' },
  { name: 'openbugbounty', url: 'https://www.openbugbounty.org/researchers/{username}', check: 'url' },

  // Communication
  { name: 'telegram', url: 'https://t.me/{username}', check: 'url' },
  { name: 'signal', url: 'https://signal.me/#p/{username}', check: 'url' },

  // Code/Paste
  { name: 'replit', url: 'https://replit.com/@{username}', check: 'url' },
  { name: 'codepen', url: 'https://codepen.io/{username}', check: 'url' },
  { name: 'jsfiddle', url: 'https://jsfiddle.net/user/{username}', check: 'url' },
  { name: 'glitch', url: 'https://glitch.com/@{username}', check: 'url' },
  { name: 'bitbucket', url: 'https://bitbucket.org/{username}', check: 'url' },
  { name: 'sourceforge', url: 'https://sourceforge.net/u/{username}', check: 'url' },

  // Blogging
  { name: 'ghost', url: 'https://{username}.ghost.io', check: 'url' },
  { name: 'tumblr', url: 'https://{username}.tumblr.com', check: 'url' },

  // Other
  { name: 'snapchat', url: 'https://www.snapchat.com/add/{username}', check: 'url' },
  { name: 'tiktok', url: 'https://www.tiktok.com/@{username}', check: 'url' },
  { name: 'pinterest', url: 'https://www.pinterest.com/{username}', check: 'url' },
  { name: 'flickr', url: 'https://www.flickr.com/people/{username}', check: 'url' },
  { name: 'vimeo', url: 'https://vimeo.com/{username}', check: 'url' },
  { name: 'soundcloud', url: 'https://soundcloud.com/{username}', check: 'url' },
  { name: 'mixcloud', url: 'https://www.mixcloud.com/{username}', check: 'url' },
  { name: 'lastfm', url: 'https://www.last.fm/user/{username}', check: 'url' },
  { name: 'myspace', url: 'https://myspace.com/{username}', check: 'url' },
  { name: 'dribbble', url: 'https://dribbble.com/{username}', check: 'url' },
  { name: 'behance', url: 'https://www.behance.net/{username}', check: 'url' },
  { name: 'artstation', url: 'https://www.artstation.com/{username}', check: 'url' },
];

export class UsernameRecon {
  private target: Target;
  private findings: Finding[] = [];

  constructor(target: Target) {
    this.target = target;
  }

  async run(concurrentLimit = 10): Promise<Finding[]> {
    const username = this.target.value;
    const results = await this.checkPlatforms(username, concurrentLimit);

    for (const result of results) {
      if (result.exists && result.url) {
        const finding = this.createFinding(result);
        this.findings.push(finding);
      }
    }

    return this.findings;
  }

  private async checkPlatforms(username: string, limit: number): Promise<PlatformResult[]> {
    const results: PlatformResult[] = [];
    const queue = [...PLATFORMS];
    let index = 0;

    while (index < queue.length) {
      const batch = queue.slice(index, index + limit);
      index += limit;

      const batchResults = await Promise.all(
        batch.map(p => this.checkPlatform(username, p))
      );

      results.push(...batchResults.filter(r => r !== null) as PlatformResult[]);
    }

    return results;
  }

  private async checkPlatform(
    username: string,
    platform: { name: string; url: string; check: string }
  ): Promise<PlatformResult | null> {
    const url = platform.url.replace('{username}', username);

    try {
      // Special handling for GitHub API
      if (platform.name === 'github') {
        const data = await httpClient.get<{ id: number; login: string }>(
          `https://api.github.com/users/${username}`,
          undefined,
          false // Don't cache API calls
        );

        return {
          platform: 'github',
          url: data?.login ? `https://github.com/${username}` : null,
          exists: !!data?.id,
          username: data?.login,
          profileUrl: data?.login ? `https://github.com/${username}` : undefined,
        };
      }

      // For web pages, check if URL returns 200
      const response = await httpClient.get<string>(url, undefined, false);

      return {
        platform: platform.name,
        url: response ? url : null,
        exists: !!response,
        profileUrl: response ? url : undefined,
      };
    } catch {
      return {
        platform: platform.name,
        url: null,
        exists: false,
      };
    }
  }

  private createFinding(result: PlatformResult): Finding {
    const evidence: EvidenceLink = {
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      source: result.platform,
      sourceType: 'api',
      data: `Found profile at ${result.url}`,
      reliability: significanceEngine.getSourceReliability(result.platform),
      collectedAt: new Date(),
      verified: false,
    };

    const significance = significanceEngine.calculateSignificance(
      { source: result.platform, type: 'entity' },
      { similarFindingsCount: this.findings.filter(f => f.source === result.platform).length }
    );

    return {
      id: `find-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      target: this.target,
      type: 'entity',
      value: result.url || '',
      source: result.platform,
      sourceUrl: result.url || undefined,
      significance,
      evidence: [evidence],
      collectedAt: new Date(),
    };
  }

  getFindings(): Finding[] {
    return this.findings;
  }
}

export function createUsernameRecon(target: Target): UsernameRecon {
  return new UsernameRecon(target);
}

export function detectTargetType(input: string): TARGET_TYPE {
  // IP address
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipRegex.test(input)) return 'ip';

  // Domain
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/;
  if (domainRegex.test(input)) return 'domain';

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(input)) return 'email';

  // Default to username
  return 'username';
}