export type PerformanceMetric = "render" | "export";
export type PerformanceSnapshot = {
  lastRenderMs: number | null;
  lastExportMs: number | null;
};

let snapshot: PerformanceSnapshot = {
  lastRenderMs: null,
  lastExportMs: null,
};
const listeners = new Set<() => void>();

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
    snapshot =
      metric === "render"
        ? { ...snapshot, lastRenderMs: duration }
        : { ...snapshot, lastExportMs: duration };
    listeners.forEach((listener) => listener());
  };
}
