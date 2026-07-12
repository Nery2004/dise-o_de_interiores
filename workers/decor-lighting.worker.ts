/// <reference lib="webworker" />

import { applyObjectColorAdjustments, type ObjectColorAdjustments } from "@/lib/lighting/pixelAdjustment";

type Request = { id: number; width: number; height: number; data: ArrayBuffer; settings: ObjectColorAdjustments };

self.onmessage = (event: MessageEvent<Request>) => {
  const { id, width, height, data, settings } = event.data;
  // OffscreenCanvas availability is checked by the client. ImageData keeps the
  // per-pixel stage independent from the DOM and transferable back to the UI.
  const image = new ImageData(new Uint8ClampedArray(data), width, height);
  const adjusted = applyObjectColorAdjustments(image, settings);
  self.postMessage({ id, data: adjusted.data.buffer }, { transfer: [adjusted.data.buffer] });
};

export {};
