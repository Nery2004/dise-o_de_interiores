"use client";

import { useEditor } from "@/components/editor-context";
import { formatFileSize } from "@/lib/utils";

function EmptyValue() {
  return <span className="text-[#a0a7b1]">-</span>;
}

export function RightPanel() {
  const { dimensions, image, originalFile } = useEditor();

  const details = [
    { label: "Ancho", value: dimensions?.width ? `${dimensions.width}px` : null },
    { label: "Alto", value: dimensions?.height ? `${dimensions.height}px` : null },
    {
      label: "Tamano del archivo",
      value: originalFile ? formatFileSize(originalFile.size) : null,
    },
    { label: "Formato", value: image?.format ?? null },
  ];

  return (
    <aside className="rounded-lg border border-[#dde1e7] bg-white p-4 shadow-sm">
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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8290]">
          Color seleccionado
        </p>
        <div className="mt-4 h-24 rounded-md border border-dashed border-[#d5dbe3] bg-white" />
      </section>
    </aside>
  );
}
