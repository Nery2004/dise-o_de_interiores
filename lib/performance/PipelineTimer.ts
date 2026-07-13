import { performance } from "@/lib/performance/performancePolyfill";

export class PipelineTimer {
  private readonly startedAt = performance.now();
  private previousAt = this.startedAt;
  private readonly stages = new Map<string, number>();

  stage(name: string) {
    const now = performance.now();
    this.stages.set(name, (this.stages.get(name) ?? 0) + now - this.previousAt);
    this.previousAt = now;
  }

  finish() {
    const now = performance.now();
    return {
      stages: Object.fromEntries(this.stages),
      totalMs: now - this.startedAt,
    };
  }
}
