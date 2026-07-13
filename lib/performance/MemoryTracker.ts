export type MemorySnapshot = {
  entries: number;
  estimatedBytes: number;
  resources: Record<string, number>;
};

export class MemoryTracker {
  private readonly resources = new Map<string, number>();

  set(key: string, estimatedBytes: number) {
    this.resources.set(key, Math.max(0, Math.round(estimatedBytes)));
  }

  delete(key: string) {
    this.resources.delete(key);
  }

  clear() {
    this.resources.clear();
  }

  snapshot(): MemorySnapshot {
    const resources = Object.fromEntries(this.resources);
    return {
      entries: this.resources.size,
      estimatedBytes: Object.values(resources).reduce((sum, value) => sum + value, 0),
      resources,
    };
  }
}
