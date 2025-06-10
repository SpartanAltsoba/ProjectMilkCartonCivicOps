"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiCache = exports.CacheKeyBuilder = void 0;
const logger_1 = require("../logger");
class CacheKeyBuilder {
    static build(key) {
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
    static filterRelevantHeaders(headers) {
        // Only include headers that affect caching
        const relevantHeaderNames = ["accept", "content-type", "if-none-match"];
        return Object.entries(headers)
            .filter(([key]) => relevantHeaderNames.includes(key.toLowerCase()))
            .reduce((acc, [key, value]) => (Object.assign(Object.assign({}, acc), { [key.toLowerCase()]: value })), {});
    }
}
exports.CacheKeyBuilder = CacheKeyBuilder;
class ApiCache {
    constructor(options = {}) {
        this.cache = new Map();
        this.maxSize = options.maxSize || 1000;
        this.defaultTtl = options.defaultTtl || 3600000; // 1 hour in milliseconds
    }
    async get(key) {
        const cacheKey = CacheKeyBuilder.build(key);
        const entry = this.cache.get(cacheKey);
        if (!entry) {
            return null;
        }
        if (this.isExpired(entry)) {
            this.cache.delete(cacheKey);
            return null;
        }
        logger_1.logger.debug("Cache hit", { key: cacheKey });
        return entry.data;
    }
    async set(key, data, ttl) {
        const cacheKey = CacheKeyBuilder.build(key);
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }
        this.cache.set(cacheKey, {
            data,
            timestamp: Date.now(),
            ttl: ttl || this.defaultTtl,
        });
        logger_1.logger.debug("Cache set", { key: cacheKey });
    }
    async delete(key) {
        const cacheKey = CacheKeyBuilder.build(key);
        this.cache.delete(cacheKey);
        logger_1.logger.debug("Cache delete", { key: cacheKey });
    }
    async clear() {
        this.cache.clear();
        logger_1.logger.debug("Cache cleared");
    }
    isExpired(entry) {
        return Date.now() - entry.timestamp > entry.ttl;
    }
    evictOldest() {
        let oldestKey = null;
        let oldestTimestamp = Infinity;
        this.cache.forEach((entry, key) => {
            if (entry.timestamp < oldestTimestamp) {
                oldestKey = key;
                oldestTimestamp = entry.timestamp;
            }
        });
        if (oldestKey) {
            this.cache.delete(oldestKey);
            logger_1.logger.debug("Cache eviction", { key: oldestKey });
        }
    }
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
    async cleanup() {
        const keysToDelete = [];
        this.cache.forEach((entry, key) => {
            if (Date.now() - entry.timestamp > entry.ttl) {
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(key => this.cache.delete(key));
        logger_1.logger.debug("Cache cleanup", { deletedKeys: keysToDelete.length });
    }
}
exports.ApiCache = ApiCache;
//# sourceMappingURL=cache.js.map