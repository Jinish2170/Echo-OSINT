// Collectors Index - Export all collectors
export { BaseCollector, DefaultCollectorRegistry, CollectorRegistry } from './base';
export { RedditCollector, createRedditCollector } from './reddit';
export { GitHubCollector, createGitHubCollector } from './github';
export { HackerNewsCollector, createHackerNewsCollector } from './hackernews';
export { SearXNGCollector, createSearXNGCollector } from './searxng';

import { createRedditCollector } from './reddit';
import { createGitHubCollector } from './github';
import { createHackerNewsCollector } from './hackernews';
import { createSearXNGCollector } from './searxng';
import { DefaultCollectorRegistry } from './base';
import { PLATFORM } from '../types';

/**
 * Create a fully configured collector registry with all available collectors
 */
export function createCollectorRegistry(): DefaultCollectorRegistry {
  const registry = new DefaultCollectorRegistry();

  // Register all collectors
  registry.register(createRedditCollector());
  registry.register(createGitHubCollector());
  registry.register(createHackerNewsCollector());
  registry.register(createSearXNGCollector());

  return registry;
}

/**
 * Get collector for a specific platform
 */
export function getCollector(platform: PLATFORM) {
  const registry = createCollectorRegistry();
  return registry.get(platform);
}