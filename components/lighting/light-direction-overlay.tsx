"use client";

import { useRoomLighting } from "@/components/room-lighting-context";
import type { ImageDimensions } from "@/types/editor";

export function LightDirectionOverlay({ dimensions }: { dimensions: ImageDimensions }) {
  const lighting = useRoomLighting();
  const profile = lighting.activeProfile;
  if (!lighting.guideVisible || !profile) return null;
  const origin = { x: dimensions.width * 0.5, y: dimensions.height * 0.42 };
  const length = Math.min(dimensions.width, dimensions.height) * 0.18;
  const target = { x: origin.x + profile.direction.x * length, y: origin.y + profile.direction.y * length };
  return <svg aria-label="Guía de dirección de la luz" className="pointer-events-none absolute inset-0 z-30 h-full w-full" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}><defs><marker id="light-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#f59e0b" /></marker></defs><circle cx={origin.x} cy={origin.y} r={Math.max(6, length * 0.045)} fill="#fff" stroke="#f59e0b" strokeWidth="3" /><line x1={origin.x} y1={origin.y} x2={target.x} y2={target.y} stroke="#f59e0b" strokeWidth="4" strokeDasharray="9 6" markerEnd="url(#light-arrow)" /><text x={origin.x + 12} y={origin.y - 14} fill="#7c4a03" fontSize={Math.max(14, dimensions.width * 0.012)} fontWeight="700">Dirección de sombra</text></svg>;
}
