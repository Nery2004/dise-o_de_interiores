export type PerformanceMetric = "render" | "export" | "paint" | "comparison" | "interaction" | "storage";
export type PerformanceDistribution = {
  calls: number;
  averageMs: number;
  maximumMs: number;
  p50Ms: number;
  p95Ms: number;
};
export type PerformanceSnapshot = {
  lastRenderMs: number | null;
  lastExportMs: number | null;
  metrics: Partial<Record<PerformanceMetric, PerformanceDistribution>>;
};

let snapshot: PerformanceSnapshot = {
  lastRenderMs: null,
  lastExportMs: null,
  metrics: {},
};
const listeners = new Set<() => void>();
const samples = new Map<PerformanceMetric, number[]>();
const MAX_SAMPLES = 240;

function percentile(values: number[], amount: number) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * amount))] ?? 0;
}

function distribution(values: number[]): PerformanceDistribution {
  return {
    calls: values.length,
    averageMs: values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length),
    maximumMs: Math.max(0, ...values),
    p50Ms: percentile(values, 0.5),
    p95Ms: percentile(values, 0.95),
  };
}

export class PerformanceMonitor {
  record(metric: PerformanceMetric, durationMs: number) {
    if (process.env.NODE_ENV !== "development") return;
    const values = samples.get(metric) ?? [];
    values.push(Math.max(0, durationMs));
    if (values.length > MAX_SAMPLES) values.splice(0, values.length - MAX_SAMPLES);
    samples.set(metric, values);
    snapshot = {
      ...snapshot,
      lastRenderMs: metric === "render" ? durationMs : snapshot.lastRenderMs,
      lastExportMs: metric === "export" ? durationMs : snapshot.lastExportMs,
      metrics: { ...snapshot.metrics, [metric]: distribution(values) },
    };
    listeners.forEach((listener) => listener());
  }

  clear() {
    samples.clear();
    snapshot = { lastRenderMs: null, lastExportMs: null, metrics: {} };
    listeners.forEach((listener) => listener());
  }
}

export const performanceMonitor = new PerformanceMonitor();

export function getPerformanceSnapshot() {
  return snapshot;
}

export function subscribePerformance(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function beginPerformanceMeasure(metric: PerformanceMetric) {
  if (process.env.NODE_ENV !== "development") return () => {};
  const startedAt = performance.now();
  let finished = false;
  return () => {
    if (finished) return;
    finished = true;
    const duration = Math.max(0, performance.now() - startedAt);
    performanceMonitor.record(metric, duration);
  };
}
