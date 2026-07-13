"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { BeforeAfterClip } from "@/components/before-after-clip";
import { ComparisonHandle } from "@/components/comparison-handle";
import { interiorColors } from "@/data/interiorColors";
import {
  getLandingRoomImage,
  LANDING_ROOM_BASE_IMAGE,
} from "@/data/landingRoomImages";

const demoColors = [
  "Verde salvia",
  "Azul niebla",
  "Terracota cálida",
  "Greige claro",
]
  .map((name) => interiorColors.find((color) => color.name === name)!)
  .filter(Boolean);

export function LandingRoomDemo({
  showPalette = true,
  priority = false,
}: {
  showPalette?: boolean;
  priority?: boolean;
}) {
  const [color, setColor] = useState(demoColors[0]);
  const [position, setPosition] = useState(58);
  const comparisonRef = useRef<HTMLDivElement>(null);
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_24px_70px_rgba(42,48,43,.16)]">
      <div className="flex items-center gap-2 border-b border-[var(--line)] bg-white px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#d98f7a]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#dacb8b]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#94ac91]" />
        <span className="ml-2 text-[11px] font-semibold text-[var(--muted)]">
          Vista previa del espacio
        </span>
      </div>
      <div
        ref={comparisonRef}
        className="relative aspect-video overflow-hidden bg-[#e8e4dc] select-none"
      >
        <Image
          src={LANDING_ROOM_BASE_IMAGE}
          alt="Sala de ejemplo antes de pintar la pared"
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 720px"
          className="canvas-fixed-image pointer-events-none object-cover"
          draggable={false}
        />
        <BeforeAfterClip direction="vertical" position={position}>
          <Image
            src={getLandingRoomImage(color.hex)}
            alt={`Misma sala con la pared pintada en ${color.name}`}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 720px"
            className="canvas-fixed-image pointer-events-none object-cover"
            draggable={false}
          />
        </BeforeAfterClip>
        <ComparisonHandle
          containerRef={comparisonRef}
          direction="vertical"
          position={position}
          onPositionChange={setPosition}
        />
        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          Después
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-[var(--graphite)] backdrop-blur">
          Antes
        </span>
      </div>
      {showPalette ? (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs font-semibold text-[var(--graphite)]">
              {color.name}
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-[var(--muted)]">
              {color.hex}
            </p>
          </div>
          <div
            className="flex gap-2"
            role="group"
            aria-label="Colores de demostración"
          >
            {demoColors.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setColor(item)}
                aria-label={`Probar ${item.name}`}
                aria-pressed={color.id === item.id}
                className={`h-9 w-9 rounded-full border-2 transition hover:scale-105 ${color.id === item.id ? "border-[var(--graphite)] ring-2 ring-black/10" : "border-white"}`}
                style={{ backgroundColor: item.hex }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
