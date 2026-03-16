// Base Collector Interface
import { PLATFORM, FINDING } from '../types';

export abstract class BaseCollector {
  protected platform: PLATFORM;
  protected enabled: boolean;
  protected rateLimit: number;
  protected requestCount = 0;
  protected windowStart = Date.now();

  constructor(platform: PLATFORM, enabled: boolean, rateLimit: number) {
    this.platform = platform;
    this.enabled = enabled;
    this.rateLimit = rateLimit;
  }

  abstract collect(query: string, limit?: number): Promise<FINDING[]>;
  abstract test(): Promise<boolean>;

  protected async checkRateLimit(): Promise<boolean> {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window

    if (now - this.windowStart > windowMs) {
      this.requestCount = 0;
      this.windowStart = now;
    }

    if (this.requestCount >= this.rateLimit) {
      const waitTime = windowMs - (now - this.windowStart);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCount = 0;
        this.windowStart = Date.now();
      }
    }

    this.requestCount++;
    return true;
  }

  protected createFinding(
    content: string,
    entity: string,
    type: FINDING['type'],
    url?: string
  ): FINDING {
    return {
      entity,
      type,
      content,
      source: this.platform,
      timestamp: new Date(),
      relevance: 0.8, // Default, will be updated by analysis
    };
  }

  getPlatform(): PLATFORM {
    return this.platform;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export interface CollectorRegistry {
  register(collector: BaseCollector): void;
  get(platform: PLATFORM): BaseCollector | undefined;
  getAll(): BaseCollector[];
  collectAll(query: string, limitPerSource?: number): Promise<Map<PLATFORM, FINDING[]>>;
}

export class DefaultCollectorRegistry implements CollectorRegistry {
  private collectors: Map<PLATFORM, BaseCollector> = new Map();

  register(collector: BaseCollector): void {
    this.collectors.set(collector.getPlatform(), collector);
  }

  get(platform: PLATFORM): BaseCollector | undefined {
    return this.collectors.get(platform);
  }

  getAll(): BaseCollector[] {
    return Array.from(this.collectors.values());
  }

  async collectAll(
    query: string,
    limitPerSource: number = 20
  ): Promise<Map<PLATFORM, FINDING[]>> {
    const results = new Map<PLATFORM, FINDING[]>();

    const promises = Array.from(this.collectors.entries()).map(
      async ([platform, collector]) => {
        if (!collector.isEnabled()) return;

        try {
          await collector.checkRateLimit();
          const findings = await collector.collect(query, limitPerSource);
          results.set(platform, findings);
        } catch (error) {
          console.error(`Error collecting from ${platform}:`, error);
          results.set(platform, []);
        }
      }
    );

    await Promise.all(promises);
    return results;
  }
}