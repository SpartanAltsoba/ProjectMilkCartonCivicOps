import { logger } from "../logger";

export interface CacheKey {
  endpoint: string;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheKeyBuilder {
  static build(key: CacheKey): string {
    const { endpoint, params, headers } = key;
    const parts = [endpoint];

    if (params && Object.keys(params).length > 0) {
      parts.push(JSON.stringify(params));
    }

    if (headers && Object.keys(headers).length > 0) {
      const relevantHeaders = this.filterRelevantHeaders(headers);
      if (Object.keys(relevantHeaders).length > 0) {
        parts.push(JSON.stringify(relevantHeaders));
      }
    }

    return parts.join("::");
  }

  private static filterRelevantHeaders(headers: Record<string, string>): Record<string, string> {
    // Only include headers that affect caching
    const relevantHeaderNames = ["accept", "content-type", "if-none-match"];
    return Object.entries(headers)
      .filter(([key]) => relevantHeaderNames.includes(key.toLowerCase()))
      .reduce((acc, [key, value]) => ({ ...acc, [key.toLowerCase()]: value }), {});
  }
}

export class ApiCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly maxSize: number;
  private readonly defaultTtl: number;

  constructor(options: { maxSize?: number; defaultTtl?: number } = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTtl = options.defaultTtl || 3600000; // 1 hour in milliseconds
  }

  async get<T>(key: CacheKey): Promise<T | null> {
    const cacheKey = CacheKeyBuilder.build(key);
    const entry = this.cache.get(cacheKey) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(cacheKey);
      return null;
    }

    logger.debug("Cache hit", { key: cacheKey });
    return entry.data;
  }

  async set<T>(key: CacheKey, data: T, ttl?: number): Promise<void> {
    const cacheKey = CacheKeyBuilder.build(key);

    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
    });

    logger.debug("Cache set", { key: cacheKey });
  }

  async delete(key: CacheKey): Promise<void> {
    const cacheKey = CacheKeyBuilder.build(key);
    this.cache.delete(cacheKey);
    logger.debug("Cache delete", { key: cacheKey });
  }

  async clear(): Promise<void> {
    this.cache.clear();
    logger.debug("Cache cleared");
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTimestamp) {
        oldestKey = key;
        oldestTimestamp = entry.timestamp;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug("Cache eviction", { key: oldestKey });
    }
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  async cleanup(): Promise<void> {
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (Date.now() - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
    logger.debug("Cache cleanup", { deletedKeys: keysToDelete.length });
  }
}
