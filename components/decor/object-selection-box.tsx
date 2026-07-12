"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { ObjectResizeHandle, PlacedDecorObject } from "@/types/placed-decor-object";

const handles: Array<{ id: ObjectResizeHandle; x: string; y: string; cursor: string }> = [
  { id: "north-west", x: "0%", y: "0%", cursor: "nwse-resize" },
  { id: "north-east", x: "100%", y: "0%", cursor: "nesw-resize" },
  { id: "south-east", x: "100%", y: "100%", cursor: "nwse-resize" },
  { id: "south-west", x: "0%", y: "100%", cursor: "nesw-resize" },
];

export function ObjectSelectionBox({ object, canvasScale, onResizeStart, onRotateStart }: { object: PlacedDecorObject; canvasScale: number; onResizeStart: (handle: ObjectResizeHandle, event: ReactPointerEvent<HTMLButtonElement>) => void; onRotateStart: (event: ReactPointerEvent<HTMLButtonElement>) => void }) {
  const inverse = 1 / Math.max(canvasScale, 0.01);
  const handleStyle = { "--object-handle-size": `${12 * inverse}px` } as CSSProperties;
  return <div className="pointer-events-none absolute inset-0" style={{ border: `${1.5 * inverse}px solid #2563eb` }}><span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-[#2563eb] px-2 py-1 text-white" style={{ fontSize: 11 * inverse, lineHeight: `${16 * inverse}px`, transform: `translate(-50%,-100%) rotate(${-object.rotation}deg)`, transformOrigin: "bottom center" }}>{object.name} · {Math.round(object.rotation)}°</span>{handles.map((handle) => <button key={handle.id} type="button" data-canvas-control="true" aria-label={`Redimensionar ${object.name} desde ${handle.id}`} onPointerDown={(event) => onResizeStart(handle.id, event)} className="object-transform-handle pointer-events-auto absolute rounded-full border-2 border-[#2563eb] bg-white shadow" style={{ ...handleStyle, left: handle.x, top: handle.y, cursor: handle.cursor }} />)}<span className="absolute left-1/2 top-0 block -translate-x-1/2 bg-[#2563eb]" style={{ width: 1.5 * inverse, height: 30 * inverse, marginTop: -30 * inverse }} /><button type="button" data-canvas-control="true" aria-label={`Rotar ${object.name}`} onPointerDown={onRotateStart} className="object-rotation-handle object-transform-handle pointer-events-auto absolute left-1/2 top-0 rounded-full border-2 border-[#2563eb] bg-white shadow" style={{ ...handleStyle, marginTop: -38 * inverse, cursor: "grab" }} /></div>;
}
