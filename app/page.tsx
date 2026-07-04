import Image from "next/image";
import Link from "next/link";
import { FeatureCard } from "@/components/feature-card";
import { StudioFrame } from "@/components/studio-frame";
import { moodBoards } from "@/lib/editor-data";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-14 lg:px-10 lg:pb-20 lg:pt-14">
        <div className="max-w-2xl">
          <p className="mb-5 text-sm font-medium uppercase tracking-[0.28em] text-[#697469]">
            Interior Color Studio
          </p>
          <h1 className="text-balance text-5xl font-semibold leading-[0.98] text-[#1f2421] sm:text-6xl lg:text-7xl">
            Refined wall color studies for real rooms.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#5d665f]">
            Upload a room, prepare wall selections, and shape a palette around
            natural light, texture, and material warmth.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/editor"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#1f2421] px-6 text-sm font-semibold text-[#fbfaf7] transition hover:bg-[#343b36]"
            >
              Open editor
            </Link>
            <a
              href="#studio-foundation"
              className="inline-flex h-12 items-center justify-center rounded-full border border-[#d7d0c3] px-6 text-sm font-semibold text-[#2f382f] transition hover:border-[#a7b39e] hover:bg-white/55"
            >
              View foundation
            </a>
          </div>
        </div>

        <StudioFrame>
          <Image
            src="/interior-studio-room.png"
            alt="Warm modern living room with a feature wall for color studies"
            width={1536}
            height={1024}
            priority
            className="h-full w-full object-cover"
          />
        </StudioFrame>
      </section>

      <section
        id="studio-foundation"
        className="border-y border-[#e2dbcf] bg-[#f4f0e7]"
      >
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-12 sm:px-8 md:grid-cols-3 lg:px-10">
          <FeatureCard
            kicker="Phase 01"
            title="Clean product shell"
            description="App Router routes, shared components, typed data, and deploy-ready defaults."
          />
          <FeatureCard
            kicker="Editor"
            title="Focused workspace"
            description="A calm canvas with upload, wall selection, palette, and rendering panels."
          />
          <FeatureCard
            kicker="Design"
            title="Interior-first UI"
            description="Neutral surfaces, tactile accents, and responsive layouts for room imagery."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="grid gap-5 md:grid-cols-3">
          {moodBoards.map((board) => (
            <div
              key={board.name}
              className="rounded-lg border border-[#e1dacd] bg-white/60 p-5"
            >
              <div className="mb-5 flex gap-2">
                {board.colors.map((color) => (
                  <span
                    key={color}
                    className="h-10 flex-1 rounded-md border border-black/5"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <h2 className="text-lg font-semibold text-[#242a25]">
                {board.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#687169]">
                {board.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
