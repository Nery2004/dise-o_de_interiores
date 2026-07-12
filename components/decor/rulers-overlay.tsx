"use client";

import { useDecorPlacement } from "@/components/decor-placement-context";
import { decorObjectsById } from "@/data/decorObjects";
import type { ImageDimensions } from "@/types/editor";

export function RulersOverlay({ dimensions }: { dimensions: ImageDimensions }) {
  const placement = useDecorPlacement();
  const selected = placement.placedObjects.filter((object) => object.selected);
  const first = selected[0];
  const second = selected[1];
  const asset = first ? decorObjectsById.get(first.decorObjectId) : undefined;
  const pixelsPerCm = first && asset ? first.width / asset.approximateWidthCm : 1;
  const distance = first && second ? Math.hypot(second.x - first.x, second.y - first.y) / Math.max(0.01, pixelsPerCm) : 0;
  return <div className="pointer-events-none absolute inset-0 z-30" aria-hidden="true"><div className="absolute inset-x-0 top-0 h-5 border-b border-[#475569] bg-white/75">{Array.from({ length: 11 }, (_, index) => <span key={index} className="absolute top-0 h-2 border-l border-[#475569] text-[7px]" style={{ left: `${index * 10}%` }}>{index * 10}</span>)}</div><div className="absolute inset-y-0 left-0 w-5 border-r border-[#475569] bg-white/75">{Array.from({ length: 11 }, (_, index) => <span key={index} className="absolute left-0 w-2 border-t border-[#475569] text-[7px]" style={{ top: `${index * 10}%` }}>{index * 10}</span>)}</div>{first && second ? <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}><line x1={first.x} y1={first.y} x2={second.x} y2={second.y} stroke="#0f766e" strokeWidth="2" strokeDasharray="6 5" /><text x={(first.x + second.x) / 2} y={(first.y + second.y) / 2 - 8} fill="#0f766e" fontSize="13" fontWeight="700">{Math.round(distance)} cm aprox.</text></svg> : null}</div>;
}
