/**
 * Simple in-memory cache with TTL support
 */
export declare class SimpleCache<T = any> {
    private cache;
    /**
     * Get item from cache
     * Returns null if not found or expired
     */
    get(key: string): T | null;
    /**
     * Set item in cache with TTL
     * @param key Cache key
     * @param data Data to cache
     * @param ttlMs Time to live in milliseconds (default: 60 seconds)
     */
    set(key: string, data: T, ttlMs?: number): void;
    /**
     * Check if key exists and is not expired
     */
    has(key: string): boolean;
    /**
     * Delete item from cache
     */
    delete(key: string): boolean;
    /**
     * Clear all items from cache
     */
    clear(): void;
    /**
     * Get cache size
     */
    size(): number;
    /**
     * Clean up expired items
     */
    cleanup(): void;
}
/**
 * Global cache instances for common use cases
 */
export declare const menuCache: SimpleCache<any>;
export declare const restaurantCache: SimpleCache<any>;
export declare const orderCache: SimpleCache<any>;
//# sourceMappingURL=cache.d.ts.map