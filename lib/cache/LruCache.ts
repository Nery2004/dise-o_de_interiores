export type LruCacheOptions<K, V> = {
  maxEntries: number;
  maxEstimatedBytes: number;
  estimateBytes?: (value: V, key: K) => number;
  dispose?: (value: V, key: K) => void;
};

type Entry<V> = { value: V; estimatedBytes: number };

export class LruCache<K, V> {
  private readonly entries = new Map<K, Entry<V>>();
  private estimatedBytes = 0;

  constructor(private readonly options: LruCacheOptions<K, V>) {}

  get size() { return this.entries.size; }
  get bytes() { return this.estimatedBytes; }

  get(key: K) {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V, estimatedBytes?: number) {
    this.delete(key);
    const bytes = Math.max(0, Math.round(estimatedBytes ?? this.options.estimateBytes?.(value, key) ?? 0));
    this.entries.set(key, { value, estimatedBytes: bytes });
    this.estimatedBytes += bytes;
    this.trim();
    return value;
  }

  delete(key: K) {
    const entry = this.entries.get(key);
    if (!entry) return false;
    this.entries.delete(key);
    this.estimatedBytes -= entry.estimatedBytes;
    this.options.dispose?.(entry.value, key);
    return true;
  }

  clear() {
    for (const [key, entry] of this.entries) this.options.dispose?.(entry.value, key);
    this.entries.clear();
    this.estimatedBytes = 0;
  }

  stats() {
    return { entries: this.entries.size, estimatedBytes: this.estimatedBytes, maxEntries: this.options.maxEntries, maxEstimatedBytes: this.options.maxEstimatedBytes };
  }

  private trim() {
    while (this.entries.size > this.options.maxEntries || this.estimatedBytes > this.options.maxEstimatedBytes) {
      const oldest = this.entries.keys().next().value as K | undefined;
      if (oldest === undefined) break;
      this.delete(oldest);
    }
  }
}
