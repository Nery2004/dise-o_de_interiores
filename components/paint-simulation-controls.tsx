"use client";

import { useEditor } from "@/components/editor-context";
import { blendModeOptions } from "@/lib/editor-data";
import { savePaintPreferences } from "@/lib/paint/paintPreferences";
import { resolvePaintSettings } from "@/lib/paint/paintSettings";
import type {
  BlendMode,
  PaintMode,
  RenderQuality,
  WallMask,
} from "@/types/editor";
import { WhiteBaseControls } from "@/components/white-base-controls";

const qualityOptions: Array<{
  label: string;
  description: string;
  value: RenderQuality;
}> = [
  { label: "Rendimiento", description: "Preview ligero", value: "draft" },
  { label: "Automático", description: "Balance recomendado", value: "high" },
  { label: "Calidad", description: "Preview de mayor detalle", value: "ultra" },
];

function RangeControl({
  disabled = false,
  label,
  maximum,
  minimum,
  onChange,
  suffix,
  value,
}: {
  disabled?: boolean;
  label: string;
  maximum: number;
  minimum: number;
  onChange: (value: number) => void;
  suffix: string;
  value: number;
}) {
  return (
    <label className={disabled ? "block opacity-45" : "block"}>
      <span className="flex items-center justify-between text-xs font-semibold text-[#5f6875]">
        {label}
        <span className="tabular-nums text-[#202124]">
          {Math.round(value)}{suffix}
        </span>
      </span>
      <input
        type="range"
        min={minimum}
        max={maximum}
        step={1}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-[#1f2421] disabled:cursor-not-allowed"
      />
    </label>
  );
}

export function PaintSimulationControls() {
  const {
    globalBlendMode,
    masks,
    selectedMaskId,
    setWhiteBasePreview,
    updateMask,
  } = useEditor();
  const selectedMask = masks.find((mask) => mask.id === selectedMaskId);

  if (!selectedMask) {
    return (
      <section className="mt-5 rounded-md border border-[#edf0f3] bg-[#fafbfc] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8290]">
          Simulación de pintura
        </p>
        <p className="mt-3 text-sm leading-5 text-[#7b8490]">
          Selecciona una pared para configurar su acabado.
        </p>
      </section>
    );
  }

  const settings = resolvePaintSettings(selectedMask, globalBlendMode);
  function updatePaint(data: Partial<WallMask>) {
    updateMask(selectedMask!.id, data);
    savePaintPreferences(
      resolvePaintSettings({ ...selectedMask!, ...data }, globalBlendMode),
    );
  }

  function setPaintMode(paintMode: PaintMode) {
    updatePaint({ paintMode });
    if (paintMode === "direct") setWhiteBasePreview(false);
  }

  return (
    <section className="mt-5 rounded-md border border-[#dfe4dc] bg-[#f7faf6] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#647064]">
        Simulación de pintura
      </p>
      <p className="mt-2 text-xs leading-5 text-[#69746a]">
        Reemplaza el color conservando iluminación, sombras y textura.
      </p>

      <div className="mt-4 space-y-4">
        <label className="flex items-center justify-between gap-3 rounded-md border border-[#dfe4dc] bg-white px-3 py-2.5 text-sm font-semibold text-[#303830]">
          Base blanca automática
          <input
            type="checkbox"
            checked={settings.paintMode === "white-base"}
            onChange={(event) =>
              setPaintMode(event.target.checked ? "white-base" : "direct")
            }
            className="h-4 w-4 accent-[#50634f]"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-[#5f6875]">
            Modo de pintura
          </span>
          <select
            value={settings.paintMode}
            onChange={(event) =>
              setPaintMode(event.target.value as PaintMode)
            }
            className="mt-2 h-10 w-full rounded-md border border-[#dfe3e8] bg-white px-3 text-sm"
          >
            <option value="direct">Pintura directa</option>
            <option value="white-base">Base blanca</option>
          </select>
        </label>

        {settings.paintMode === "white-base" ? (
          <WhiteBaseControls mask={selectedMask} />
        ) : null}

        <RangeControl
          label="Intensidad"
          minimum={0}
          maximum={200}
          suffix="%"
          value={settings.paintIntensity}
          onChange={(paintIntensity) => updatePaint({ paintIntensity })}
        />
        <RangeControl
          disabled={settings.paintMode !== "white-base"}
          label="Cobertura de imprimación"
          minimum={0}
          maximum={100}
          suffix="%"
          value={settings.primerCoverage}
          onChange={(primerCoverage) => updatePaint({ primerCoverage })}
        />
        <RangeControl
          label="Suavizado del borde"
          minimum={0}
          maximum={40}
          suffix=" px"
          value={settings.edgeFeather}
          onChange={(edgeFeather) => updatePaint({ edgeFeather })}
        />

        <label className="block">
          <span className="text-xs font-semibold text-[#5f6875]">Modo de rendimiento</span>
          <select
            value={settings.renderQuality}
            onChange={(event) =>
              updatePaint({
                renderQuality: event.target.value as RenderQuality,
              })
            }
            className="mt-2 h-10 w-full rounded-md border border-[#dfe3e8] bg-white px-3 text-sm"
          >
            {qualityOptions.map((quality) => (
              <option key={quality.value} value={quality.value}>
                {quality.label} — {quality.description}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-[#5f6875]">Blend</span>
          <select
            value={settings.blendMode}
            onChange={(event) =>
              updatePaint({ blendMode: event.target.value as BlendMode })
            }
            className="mt-2 h-10 w-full rounded-md border border-[#dfe3e8] bg-white px-3 text-sm"
          >
            {blendModeOptions.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
