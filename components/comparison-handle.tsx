"use client";

import { GripVertical } from "lucide-react";
import {
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ComparisonDirection } from "@/lib/canvas/canvasTransformUtils";

type ComparisonHandleProps = {
  containerRef: RefObject<HTMLElement | null>;
  direction: ComparisonDirection;
  disabled?: boolean;
  onPositionChange: (position: number) => void;
  position: number;
  scale?: number;
};

export function ComparisonHandle({
  containerRef,
  direction,
  disabled = false,
  onPositionChange,
  position,
  scale = 1,
}: ComparisonHandleProps) {
  const pointerIdRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const pendingPositionRef = useRef(position);
  const [isDragging, setIsDragging] = useState(false);
  const safeScale = Math.max(scale, Number.EPSILON);
  const hitSize = 44 / safeScale;
  const lineSize = 2 / safeScale;
  const handleSize = 44 / safeScale;

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  useEffect(() => {
    pendingPositionRef.current = position;
    containerRef.current?.style.setProperty("--comparison-position", `${position}%`);
  }, [containerRef, position]);

  function schedulePosition(nextPosition: number) {
    pendingPositionRef.current = nextPosition;
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      containerRef.current?.style.setProperty(
        "--comparison-position",
        `${pendingPositionRef.current}%`,
      );
    });
  }

  function updateFromPointer(event: PointerEvent<HTMLDivElement>) {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const next =
      direction === "vertical"
        ? ((event.clientX - bounds.left) / bounds.width) * 100
        : ((event.clientY - bounds.top) / bounds.height) * 100;
    schedulePosition(Math.min(100, Math.max(0, next)));
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    pointerIdRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      containerRef.current?.style.setProperty(
        "--comparison-position",
        `${pendingPositionRef.current}%`,
      );
    }
    onPositionChange(pendingPositionRef.current);
    setIsDragging(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const handledKeys = [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ];
    if (!handledKeys.includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const delta = event.shiftKey ? 10 : 1;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      onPositionChange(position - delta);
    }
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      onPositionChange(position + delta);
    }
    if (event.key === "Home") onPositionChange(0);
    if (event.key === "End") onPositionChange(100);
  }

  const axisStyle =
    direction === "vertical"
      ? {
          bottom: 0,
          left: `var(--comparison-position, ${position}%)`,
          top: 0,
          width: hitSize,
          transform: "translateX(-50%)",
        }
      : {
          height: hitSize,
          left: 0,
          right: 0,
          top: `var(--comparison-position, ${position}%)`,
          transform: "translateY(-50%)",
        };

  return (
    <div
      data-canvas-control="true"
      className={
        direction === "vertical"
          ? "absolute z-30 cursor-ew-resize touch-none"
          : "absolute z-30 cursor-ns-resize touch-none"
      }
      style={{ ...axisStyle, pointerEvents: disabled ? "none" : "auto" }}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label="Posición de comparación"
      aria-orientation={direction === "vertical" ? "horizontal" : "vertical"}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      aria-disabled={disabled}
      onKeyDown={handleKeyDown}
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onPositionChange(50);
      }}
      onPointerDown={(event) => {
        if (disabled || event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        pointerIdRef.current = event.pointerId;
        setIsDragging(true);
        updateFromPointer(event);
      }}
      onPointerMove={(event) => {
        if (pointerIdRef.current !== event.pointerId) return;
        event.preventDefault();
        event.stopPropagation();
        updateFromPointer(event);
      }}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onLostPointerCapture={() => {
        pointerIdRef.current = null;
        setIsDragging(false);
      }}
    >
      <span
        className="pointer-events-none absolute bg-white shadow-[0_0_0_1px_rgba(0,0,0,.25)]"
        style={
          direction === "vertical"
            ? {
                bottom: 0,
                left: "50%",
                top: 0,
                width: lineSize,
                transform: "translateX(-50%)",
              }
            : {
                height: lineSize,
                left: 0,
                right: 0,
                top: "50%",
                transform: "translateY(-50%)",
              }
        }
      />
      <span
        className="pointer-events-none absolute grid place-items-center rounded-full bg-[#1f2421] text-white shadow-lg"
        style={{
          border: `${2 / safeScale}px solid white`,
          height: handleSize,
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${isDragging ? 1.06 : 1})`,
          width: handleSize,
        }}
      >
        <GripVertical
          size={17 / safeScale}
          className={direction === "horizontal" ? "rotate-90" : ""}
        />
      </span>
    </div>
  );
}
