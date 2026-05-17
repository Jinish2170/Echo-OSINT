// HTTP Client with retry, TTL cache, global concurrency pool, and rate limiting
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import pQueue from 'p-queue';

export interface HttpClientConfig {
  timeout?: number;
  maxRetries?: number;
  cacheTTL?: number; // milliseconds
  maxConcurrent?: number;
}

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

export class HttpClient {
  private client: AxiosInstance;
  private cache: Map<string, CacheEntry> = new Map();
  private queue: pQueue;
  private cacheTTL: number;
  private requestCount = 0;
  private windowStart = Date.now();

  constructor(config: HttpClientConfig = {}) {
    const {
      timeout = 30000,
      maxRetries = 3,
      cacheTTL = 5 * 60 * 1000, // 5 minutes default
      maxConcurrent = 10,
    } = config;

    this.cacheTTL = cacheTTL;
    this.queue = new pQueue({ concurrency: maxConcurrent });

    this.client = axios.create({
      timeout,
      headers: {
        'User-Agent': 'Echo-OSINT/0.2',
        'Accept': 'application/json',
      },
    });

    // Add retry interceptor
    this.client.interceptors.response.use(
      response => response,
      async error => {
        const config = error.config as AxiosRequestConfig & { _retryCount?: number };
        const retryCount = config._retryCount || 0;

        if (retryCount < maxRetries && this.shouldRetry(error)) {
          config._retryCount = retryCount + 1;
          const delay = this.calculateBackoff(retryCount);
          await this.sleep(delay);
          return this.client(config);
        }

        return Promise.reject(error);
      }
    );
  }

  private shouldRetry(error: { code?: string; response?: { status?: number } }): boolean {
    // Retry on network errors and 5xx errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return true;
    if (error.response?.status && error.response.status >= 500) return true;
    return false;
  }

  private calculateBackoff(retryCount: number): number {
    // Exponential backoff with jitter
    const base = Math.min(1000 * Math.pow(2, retryCount), 30000);
    const jitter = Math.random() * 1000;
    return base + jitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCacheKey(url: string, params?: Record<string, unknown>): string {
    return `${url}:${JSON.stringify(params || {})}`;
  }

  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.cacheTTL;
  }

  async get<T = unknown>(url: string, params?: Record<string, unknown>, useCache = true): Promise<T> {
    return this.queue.add(async () => {
      const cacheKey = this.getCacheKey(url, params);

      // Check cache first
      if (useCache) {
        const cached = this.cache.get(cacheKey);
        if (cached && this.isCacheValid(cached)) {
          return cached.data as T;
        }
      }

      // Check rate limit
      this.checkRateLimit();

      const response = await this.client.get<T>(url, { params });
      const data = response.data;

      // Cache the result
      if (useCache) {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data;
    }) as Promise<T>;
  }

  async post<T = unknown>(url: string, data?: unknown): Promise<T> {
    return this.queue.add(async () => {
      this.checkRateLimit();
      const response = await this.client.post<T>(url, data);
      return response.data;
    }) as Promise<T>;
  }

  private checkRateLimit(): void {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window

    if (now - this.windowStart > windowMs) {
      this.requestCount = 0;
      this.windowStart = now;
    }

    // Global rate limit of 60 requests per minute
    if (this.requestCount >= 60) {
      const waitTime = windowMs - (now - this.windowStart);
      if (waitTime > 0) {
        this.sleep(waitTime);
        this.requestCount = 0;
        this.windowStart = Date.now();
      }
    }

    this.requestCount++;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

export const httpClient = new HttpClient();