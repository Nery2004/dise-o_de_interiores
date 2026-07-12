"use client";

import { RefreshCw, Square } from "lucide-react";
import { useEditor } from "@/components/editor-context";
import { useWallBaseAnalysis } from "@/components/use-wall-base-analysis";
import {
  DEFAULT_WHITE_BASE_SETTINGS,
  getNeutralizationLabel,
} from "@/lib/paint/whiteBaseOptimizer";
import type { WallColorProfile, WallMask, WhiteBaseSettings } from "@/types/editor";

const profileLabels: Record<WallColorProfile, string> = {
  "warm-light": "Cálido claro",
  "warm-dark": "Cálido oscuro",
  "cool-light": "Frío claro",
  "cool-dark": "Frío oscuro",
  "neutral-light": "Neutro claro",
  "neutral-dark": "Neutro oscuro",
  saturated: "Color intenso",
  unknown: "Sin determinar",
};

function AdvancedRange({
  label,
  maximum,
  minimum,
  onChange,
  value,
}: {
  label: string;
  maximum: number;
  minimum: number;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-xs font-medium text-[#667066]">
        {label}
        <span className="tabular-nums text-[#303830]">{Math.round(value)}</span>
      </span>
      <input
        type="range"
        min={minimum}
        max={maximum}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1.5 w-full accent-[#50634f]"
      />
    </label>
  );
}

export function WhiteBaseControls({ mask }: { mask: WallMask }) {
  const {
    setWhiteBasePreview,
    updateMask,
    whiteBasePreviewMaskId,
  } = useEditor();
  const { analysis, cancel, recalculate, status } = useWallBaseAnalysis(mask);
  const settings: WhiteBaseSettings = {
    ...DEFAULT_WHITE_BASE_SETTINGS,
    ...mask.whiteBaseSettings,
  };

  function updateWhiteBase(data: Partial<WhiteBaseSettings>) {
    updateMask(mask.id, {
      whiteBaseSettings: { ...settings, ...data },
    });
  }

  const manualControls: Array<{
    key: keyof Pick<
      WhiteBaseSettings,
      | "neutralizationStrength"
      | "saturationReduction"
      | "warmthCorrection"
      | "baseBrightness"
      | "baseContrast"
      | "shadowPreservation"
      | "texturePreservation"
    >;
    label: string;
    minimum: number;
    maximum: number;
  }> = [
    { key: "neutralizationStrength", label: "Neutralización de color", minimum: 0, maximum: 100 },
    { key: "saturationReduction", label: "Reducción de saturación", minimum: 0, maximum: 100 },
    { key: "warmthCorrection", label: "Corrección de calidez", minimum: -100, maximum: 100 },
    { key: "baseBrightness", label: "Luminosidad de base", minimum: 0, maximum: 100 },
    { key: "baseContrast", label: "Contraste de base", minimum: -50, maximum: 50 },
    { key: "shadowPreservation", label: "Conservación de sombras", minimum: 0, maximum: 100 },
    { key: "texturePreservation", label: "Conservación de textura", minimum: 0, maximum: 100 },
  ];

  return (
    <div className="rounded-md border border-[#dce4da] bg-white p-3">
      <label className="block">
        <span className="text-xs font-semibold text-[#5f6875]">
          Neutralización
        </span>
        <select
          value={settings.mode}
          onChange={(event) =>
            updateWhiteBase({ mode: event.target.value as "auto" | "manual" })
          }
          className="mt-2 h-10 w-full rounded-md border border-[#dfe3e8] bg-white px-3 text-sm"
        >
          <option value="auto">Automática</option>
          <option value="manual">Manual</option>
        </select>
      </label>

      <div className="mt-3 rounded-md bg-[#f5f7f4] p-3 text-xs text-[#596159]">
        {status === "analyzing" ? (
          <p className="font-semibold">Analizando pared...</p>
        ) : status === "error" ? (
          <p className="font-semibold text-[#a04436]">No se pudo analizar la pared.</p>
        ) : (
          <div className="space-y-1.5">
            <p>
              Perfil: <b>{profileLabels[analysis?.profile ?? settings.profile ?? "unknown"]}</b>
            </p>
            <p className="flex items-center gap-2">
              Color estimado:
              <span
                className="h-4 w-4 rounded border border-black/10"
                style={{
                  backgroundColor:
                    analysis?.averageColor ?? settings.averageColor ?? "#808080",
                }}
              />
              <b>{analysis?.averageColor ?? settings.averageColor ?? "Pendiente"}</b>
            </p>
            <p>
              Neutralización: <b>{getNeutralizationLabel(settings.neutralizationStrength)}</b>
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => void (status === "analyzing" ? cancel() : recalculate())}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#dfe3e8] bg-white px-2 text-xs font-semibold text-[#465046] hover:bg-[#f7f9f6]"
        >
          <RefreshCw size={13} className={status === "analyzing" ? "animate-spin" : ""} />
          {status === "analyzing" ? "Cancelar" : "Recalcular base"}
        </button>
        <button
          type="button"
          aria-pressed={whiteBasePreviewMaskId === mask.id}
          onClick={() => setWhiteBasePreview(whiteBasePreviewMaskId !== mask.id)}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#dfe3e8] bg-white px-2 text-xs font-semibold text-[#465046] hover:bg-[#f7f9f6] aria-pressed:bg-[#e8eee6]"
        >
          <Square size={13} /> Ver solo base
        </button>
      </div>

      {settings.mode === "manual" ? (
        <div className="mt-4 space-y-3 border-t border-[#e6ebe4] pt-4">
          {manualControls.map((control) => (
            <AdvancedRange
              key={control.key}
              label={control.label}
              minimum={control.minimum}
              maximum={control.maximum}
              value={settings[control.key]}
              onChange={(value) => updateWhiteBase({ [control.key]: value })}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
