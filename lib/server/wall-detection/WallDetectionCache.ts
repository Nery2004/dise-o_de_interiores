import "server-only";
import type { WallDetectionApiResponse } from "@/lib/wallDetection/types";

type Entry = { expiresAt: number; response: WallDetectionApiResponse };

export class WallDetectionCache {
  private entries = new Map<string, Entry>();
  constructor(private maximumEntries = 50, private ttlMs = 30 * 60 * 1000) {}

  get(key: string) {
    const entry = this.entries.get(key);
    if (!entry || entry.expiresAt < Date.now()) { this.entries.delete(key); return null; }
    this.entries.delete(key);
    this.entries.set(key, entry);
    return structuredClone(entry.response);
  }

  set(key: string, response: WallDetectionApiResponse) {
    this.entries.set(key, { expiresAt: Date.now() + this.ttlMs, response: structuredClone(response) });
    while (this.entries.size > this.maximumEntries) this.entries.delete(this.entries.keys().next().value as string);
  }
}

export const wallDetectionCache = new WallDetectionCache();
