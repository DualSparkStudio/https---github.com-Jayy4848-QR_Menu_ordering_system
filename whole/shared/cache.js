"use strict";
/**
 * Simple in-memory cache with TTL support
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderCache = exports.restaurantCache = exports.menuCache = exports.SimpleCache = void 0;
class SimpleCache {
    constructor() {
        this.cache = new Map();
    }
    /**
     * Get item from cache
     * Returns null if not found or expired
     */
    get(key) {
        const item = this.cache.get(key);
        if (!item) {
            return null;
        }
        // Check if expired
        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return null;
        }
        return item.data;
    }
    /**
     * Set item in cache with TTL
     * @param key Cache key
     * @param data Data to cache
     * @param ttlMs Time to live in milliseconds (default: 60 seconds)
     */
    set(key, data, ttlMs = 60000) {
        this.cache.set(key, {
            data,
            expires: Date.now() + ttlMs,
        });
    }
    /**
     * Check if key exists and is not expired
     */
    has(key) {
        return this.get(key) !== null;
    }
    /**
     * Delete item from cache
     */
    delete(key) {
        return this.cache.delete(key);
    }
    /**
     * Clear all items from cache
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Get cache size
     */
    size() {
        return this.cache.size;
    }
    /**
     * Clean up expired items
     */
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expires) {
                this.cache.delete(key);
            }
        }
    }
}
exports.SimpleCache = SimpleCache;
/**
 * Global cache instances for common use cases
 */
exports.menuCache = new SimpleCache();
exports.restaurantCache = new SimpleCache();
exports.orderCache = new SimpleCache();
/**
 * Auto-cleanup expired items every 5 minutes
 */
if (typeof window !== 'undefined') {
    setInterval(() => {
        exports.menuCache.cleanup();
        exports.restaurantCache.cleanup();
        exports.orderCache.cleanup();
    }, 5 * 60 * 1000);
}
//# sourceMappingURL=cache.js.map