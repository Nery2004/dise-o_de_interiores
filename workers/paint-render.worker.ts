/// <reference lib="webworker" />

import { PaintRenderPipeline, type PaintRenderInput } from "@/lib/paint/PaintRenderPipeline";

type Request = { id: number; input: Omit<PaintRenderInput, "signal" | "diagnostics"> };

self.onmessage = (event: MessageEvent<Request>) => {
  const { id, input } = event.data;
  try {
    const result = new PaintRenderPipeline().render({ ...input, diagnostics: false });
    const data = result.imageData.buffer as ArrayBuffer;
    self.postMessage({ id, data, width: result.width, height: result.height, timings: result.timings }, { transfer: [data] });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : "Paint worker failed" });
  }
};

export {};
