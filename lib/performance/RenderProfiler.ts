export class RenderProfiler {
  private readonly renders = new Map<string, number>();

  mark(component: string) {
    if (process.env.NODE_ENV !== "development") return;
    this.renders.set(component, (this.renders.get(component) ?? 0) + 1);
  }

  snapshot() {
    return Object.fromEntries(this.renders);
  }

  clear() {
    this.renders.clear();
  }
}

export const renderProfiler = new RenderProfiler();
