"use client";

import { ColorPalette } from "@/components/color-palette";
import { useEditor } from "@/components/editor-context";
import { MaskControls } from "@/components/mask-controls";
import { MaskEditingPanel } from "@/components/mask-editing-panel";
import { MaskList } from "@/components/mask-list";
import { WallDetectionPanel } from "@/components/wall-detection-panel";
import { formatFileSize } from "@/lib/utils";
import { BrushControls } from "@/components/brush-controls";
import { ProposalPanel } from "@/components/proposal-panel";
import { PaintSimulationControls } from "@/components/paint-simulation-controls";

function EmptyValue() {
  return <span className="text-[#a0a7b1]">-</span>;
}

export function RightPanel() {
  const {
    activeColor,
    activeTool,
    dimensions,
    image,
    maskPreviewEnabled,
    originalFile,
    toggleMaskPreview,
  } = useEditor();

  const details = [
    { label: "Ancho", value: dimensions?.width ? `${dimensions.width}px` : null },
    { label: "Alto", value: dimensions?.height ? `${dimensions.height}px` : null },
    {
      label: "Tamano del archivo",
      value: originalFile ? formatFileSize(originalFile.size) : null,
    },
    { label: "Formato", value: image?.format ?? null },
  ];
  const isBrushTool = activeTool === "add-to-mask" || activeTool === "remove-from-mask";

  return (
    <aside className="max-h-[calc(100vh-8.5rem)] overflow-auto rounded-lg border border-[#dde1e7] bg-white p-4 shadow-sm">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8290]">
          Propiedades
        </p>
        <h2 className="mt-2 text-base font-semibold text-[#202124]">
          Informacion de la imagen
        </h2>

        <dl className="mt-4 divide-y divide-[#edf0f3] rounded-md border border-[#edf0f3]">
          {details.map((detail) => (
            <div
              key={detail.label}
              className="grid grid-cols-[1fr_auto] gap-3 px-3 py-3 text-sm"
            >
              <dt className="text-[#69717d]">{detail.label}</dt>
              <dd className="font-medium text-[#30343b]">
                {detail.value ?? <EmptyValue />}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-5 rounded-md border border-[#edf0f3] bg-[#fafbfc] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8290]">
              Mascaras
            </p>
            <h2 className="mt-2 text-base font-semibold text-[#202124]">
              Paredes detectadas
            </h2>
          </div>
          <button
            type="button"
            onClick={toggleMaskPreview}
            className="rounded-md border border-[#dfe3e8] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#4b5563] transition hover:bg-[#f8fafc]"
          >
            {maskPreviewEnabled ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        <div className="mt-4">
          <WallDetectionPanel />
        </div>
        <div className="mt-4">
          <MaskList />
        </div>
      </section>

      <ColorPalette />

      <PaintSimulationControls />

      <ProposalPanel />

      <section className="mt-5 rounded-md border border-[#edf0f3] bg-[#fafbfc] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8290]">
          {isBrushTool ? "Refinar máscara" : "Mascara seleccionada"}
        </p>
        <div className="mt-4">
          {isBrushTool ? <BrushControls /> : activeTool === "edit-mask" ? <MaskEditingPanel /> : <MaskControls />}
        </div>
      </section>

      <section className="mt-5 rounded-md border border-[#edf0f3] bg-[#fafbfc] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8290]">
          Color seleccionado
        </p>
        <div className="mt-4 flex h-24 items-center justify-center rounded-md border border-dashed border-[#d5dbe3] bg-white">
          {activeColor ? (
            <span
              className="h-12 w-12 rounded-md border border-black/10 shadow-sm"
              style={{ backgroundColor: activeColor }}
            />
          ) : null}
        </div>
      </section>
    </aside>
  );
}
