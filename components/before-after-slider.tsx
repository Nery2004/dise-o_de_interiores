"use client";

import { GripVertical } from "lucide-react";
import { type PointerEvent, useRef } from "react";
import { useComparison } from "@/components/comparison-context";
import { useEditor } from "@/components/editor-context";

export function BeforeAfterSlider({
  direction,
}: {
  direction: "vertical" | "horizontal";
}) {
  const comparison = useComparison();
  const { zoom } = useEditor();
  const frame = useRef<number | null>(null);
  function update(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const next =
      direction === "vertical"
        ? ((event.clientX - bounds.left) / bounds.width) * 100
        : ((event.clientY - bounds.top) / bounds.height) * 100;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() =>
      comparison.setComparisonPosition(next),
    );
  }
  const position = comparison.comparisonPosition;
  return (
    <div
      className="absolute inset-0 z-20 touch-none"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        update(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          update(event);
      }}
      onDoubleClick={() => comparison.setComparisonPosition(50)}
      role="slider"
      tabIndex={0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      aria-label="Posición de comparación"
      onKeyDown={(event) => {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) event.preventDefault();
        const delta = event.shiftKey ? 10 : 1;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp")
          comparison.setComparisonPosition(position - delta);
        if (event.key === "ArrowRight" || event.key === "ArrowDown")
          comparison.setComparisonPosition(position + delta);
        if (event.key === "Home") comparison.setComparisonPosition(0);
        if (event.key === "End") comparison.setComparisonPosition(100);
      }}
    >
      <span className="absolute left-3 top-3 rounded bg-black/65 px-2 py-1 text-xs font-semibold text-white" style={{ transform: `scale(${1 / zoom})`, transformOrigin: "top left" }}>
        Editada
      </span>
      <span className="absolute bottom-3 right-3 rounded bg-black/65 px-2 py-1 text-xs font-semibold text-white" style={{ transform: `scale(${1 / zoom})`, transformOrigin: "bottom right" }}>
        Original
      </span>
      <div
        className="absolute bg-white shadow-[0_0_0_1px_rgba(0,0,0,.25)]"
        style={
          direction === "vertical"
            ? { left: `${position}%`, top: 0, bottom: 0, width: 2 / zoom }
            : { top: `${position}%`, left: 0, right: 0, height: 2 / zoom }
        }
      />
      <span
        className="absolute grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-[#1f2421] text-white shadow-lg"
        style={
          direction === "vertical"
            ? { left: `${position}%`, top: "50%", transform: `translate(-50%, -50%) scale(${1 / zoom})` }
            : { top: `${position}%`, left: "50%", transform: `translate(-50%, -50%) scale(${1 / zoom})` }
        }
      >
        <GripVertical
          size={17}
          className={direction === "horizontal" ? "rotate-90" : ""}
        />
      </span>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          comparison.setComparisonPosition(50);
        }}
        className="absolute bottom-3 left-1/2 rounded bg-black/65 px-2 py-1 text-[10px] font-semibold text-white"
        style={{ transform: `translateX(-50%) scale(${1 / zoom})`, transformOrigin: "bottom center" }}
      >
        50 %
      </button>
    </div>
  );
}
