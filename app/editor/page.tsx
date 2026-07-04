import Image from "next/image";
import { EditorPanel } from "@/components/editor-panel";
import { StudioFrame } from "@/components/studio-frame";
import { editorStages, wallColorSwatches } from "@/lib/editor-data";

export default function EditorPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ed] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr_320px]">
        <aside className="space-y-4">
          <EditorPanel title="Room Source" eyebrow="Input">
            <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#c9c1b2] bg-white/65 px-5 text-center transition hover:border-[#9ba98f] hover:bg-white">
              <span className="text-sm font-semibold text-[#252b27]">
                Upload room photo
              </span>
              <span className="mt-2 text-xs leading-5 text-[#747b73]">
                JPG, PNG, or WebP
              </span>
              <input className="sr-only" type="file" accept="image/*" />
            </label>
          </EditorPanel>

          <EditorPanel title="Workspace" eyebrow="Flow">
            <div className="space-y-3">
              {editorStages.map((stage) => (
                <div
                  key={stage.id}
                  className="rounded-md border border-[#e1dacd] bg-[#fbfaf7] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#252b27]">
                      {stage.label}
                    </p>
                    <span className="rounded-full bg-[#d8e0d1] px-2.5 py-1 text-[11px] font-medium text-[#354034]">
                      {stage.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#747b73]">
                    {stage.description}
                  </p>
                </div>
              ))}
            </div>
          </EditorPanel>
        </aside>

        <section className="min-w-0">
          <StudioFrame className="min-h-[420px] lg:min-h-[680px]">
            <Image
              src="/interior-studio-room.png"
              alt="Interior room preview inside the editor canvas"
              width={1536}
              height={1024}
              priority
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-4 top-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/55 bg-white/72 px-4 py-3 shadow-sm backdrop-blur-md">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#697469]">
                  Canvas
                </p>
                <h1 className="text-base font-semibold text-[#202621]">
                  Living room study
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button className="h-9 rounded-full border border-[#d7d0c3] px-4 text-xs font-semibold text-[#313832] transition hover:bg-[#f4f0e7]">
                  Reset
                </button>
                <button className="h-9 rounded-full bg-[#1f2421] px-4 text-xs font-semibold text-white transition hover:bg-[#343b36]">
                  Export
                </button>
              </div>
            </div>
          </StudioFrame>
        </section>

        <aside className="space-y-4">
          <EditorPanel title="Wall Color" eyebrow="Palette">
            <div className="grid grid-cols-2 gap-3">
              {wallColorSwatches.map((swatch) => (
                <button
                  key={swatch.hex}
                  className="group rounded-md border border-[#e1dacd] bg-white p-2 text-left transition hover:-translate-y-0.5 hover:border-[#a7b39e] hover:shadow-sm"
                >
                  <span
                    className="block h-16 rounded border border-black/5"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  <span className="mt-2 block text-xs font-semibold text-[#262c28]">
                    {swatch.name}
                  </span>
                  <span className="mt-1 block font-mono text-[11px] text-[#7a8279]">
                    {swatch.hex}
                  </span>
                </button>
              ))}
            </div>
          </EditorPanel>

          <EditorPanel title="Render Notes" eyebrow="Output">
            <div className="space-y-3 text-sm leading-6 text-[#626b64]">
              <p>Mask detection and realistic wall repainting arrive later.</p>
              <p>
                This phase keeps the interface ready for selection, color, and
                rendering modules.
              </p>
            </div>
          </EditorPanel>
        </aside>
      </div>
    </main>
  );
}
