// server/cache.mjs - In-memory TTL cache with hit/miss statistics

export class MemoryCache {
  constructor(defaultTtlHours = 24) {
    this.defaultTtlMs = defaultTtlHours * 60 * 60 * 1000;
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) {
      this.misses++;
      return null;
    }
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return item.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  stats() {
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses
    };
  }

  clear() {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

export const globalCache = new MemoryCache();
