interface CacheEntry {
  key: string;
  value: any;
  expiresAt: Date;
}

interface Params {
  apiName: string;
  entityType: string;
  entityId: number;
  dataKey: string;
}

export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheEntry>;

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private generateKey(params: Params): string {
    return `${params.apiName}:${params.entityType}:${params.entityId}:${params.dataKey}`;
  }

  public async get(params: Params): Promise<any | null> {
    const key = this.generateKey(params);

    // Check memory cache
    const memoryEntry = this.cache.get(key);
    if (memoryEntry && memoryEntry.expiresAt > new Date()) {
      console.log(`✅ Memory cache hit for ${key}`);
      return memoryEntry.value;
    }

    // If expired, remove from cache
    if (memoryEntry) {
      this.cache.delete(key);
    }

    console.log(`❌ Cache miss for ${key}`);
    return null;
  }

  public async set(params: Params, value: any, ttlHours: number = 24): Promise<void> {
    const key = this.generateKey(params);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    // Update memory cache
    this.cache.set(key, {
      key,
      value,
      expiresAt,
    });

    console.log(`✅ Cache set for ${key}, expires at ${expiresAt.toISOString()}`);
  }

  public async invalidate(params: Params): Promise<void> {
    const key = this.generateKey(params);

    // Remove from memory cache
    this.cache.delete(key);
    console.log(`🗑️ Cache invalidated for ${key}`);
  }

  public async cleanup(): Promise<void> {
    const now = new Date();
    let cleanedCount = 0;

    // Cleanup memory cache
    this.cache.forEach((value, key) => {
      if (value.expiresAt <= now) {
        this.cache.delete(key);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  public getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  public clear(): void {
    this.cache.clear();
    console.log("🗑️ Cache cleared");
  }
}

// Simple key-value cache for basic operations
export class SimpleCache {
  private static cache = new Map<string, { value: any; expiresAt: number }>();

  static set(key: string, value: any, ttlSeconds: number = 3600): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  static get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  static delete(key: string): boolean {
    return this.cache.delete(key);
  }

  static clear(): void {
    this.cache.clear();
  }

  static size(): number {
    return this.cache.size;
  }
}

export const cacheManager = CacheManager.getInstance();
