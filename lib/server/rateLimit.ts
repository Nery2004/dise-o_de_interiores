import "server-only";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};
export interface RateLimiter {
  check(key: string): Promise<RateLimitResult>;
}
export interface DistributedRateLimiter extends RateLimiter {
  readonly distributed: true;
}

type Entry = { count: number; resetAt: number };

export class InMemoryRateLimiter implements RateLimiter {
  private readonly entries = new Map<string, Entry>();
  constructor(
    private readonly limit = 10,
    private readonly windowMs = 60_000,
  ) {}
  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const current = this.entries.get(key);
    const entry =
      !current || current.resetAt <= now
        ? { count: 0, resetAt: now + this.windowMs }
        : current;
    entry.count += 1;
    this.entries.set(key, entry);
    if (this.entries.size > 5_000)
      for (const [entryKey, value] of this.entries)
        if (value.resetAt <= now) this.entries.delete(entryKey);
    return {
      allowed: entry.count <= this.limit,
      remaining: Math.max(0, this.limit - entry.count),
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1_000)),
    };
  }
}

const globalRateLimit = globalThis as typeof globalThis & {
  wallDetectionRateLimiter?: InMemoryRateLimiter;
};
export const wallDetectionRateLimiter =
  (globalRateLimit.wallDetectionRateLimiter ??= new InMemoryRateLimiter());
