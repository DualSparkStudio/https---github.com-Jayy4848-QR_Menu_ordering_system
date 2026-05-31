/**
 * Simple in-memory cache with TTL support
 */

interface CacheItem<T> {
  data: T;
  expires: number;
}

export class SimpleCache<T = any> {
  private cache = new Map<string, CacheItem<T>>();

  /**
   * Get item from cache
   * Returns null if not found or expired
   */
  get(key: string): T | null {
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
  set(key: string, data: T, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs,
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all items from cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired items
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Global cache instances for common use cases
 */
export const menuCache = new SimpleCache();
export const restaurantCache = new SimpleCache();
export const orderCache = new SimpleCache();

/**
 * Auto-cleanup expired items every 5 minutes
 */
if (typeof window !== 'undefined') {
  setInterval(() => {
    menuCache.cleanup();
    restaurantCache.cleanup();
    orderCache.cleanup();
  }, 5 * 60 * 1000);
}
