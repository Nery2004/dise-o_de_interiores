import {
  Blend,
  Download,
  Droplets,
  FolderOpen,
  Image,
  Layers3,
  PenTool,
  Sparkles,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { landingFeatures } from "@/data/landingContent";

const icons = {
  sparkles: Sparkles,
  pen: PenTool,
  swatch: Droplets,
  compare: Blend,
  layers: Layers3,
  image: Image,
  folder: FolderOpen,
  droplets: Download,
};

export function FeatureGrid() {
  return (
    <section className="bg-[var(--surface-soft)] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          eyebrow="Herramientas"
          title="Precisión para explorar, comparar y presentar"
          description="Funciones conectadas alrededor de una misma imagen, desde la selección inicial hasta la propuesta final."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {landingFeatures.map((feature) => {
            const Icon = icons[feature.icon];
            return (
              <article
                key={feature.title}
                className="landing-reveal rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[0_8px_30px_rgba(40,45,41,.04)] transition hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(40,45,41,.08)]"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--sage)]/18 text-[var(--sage-dark)]">
                  <Icon size={19} />
                </span>
                <h3 className="mt-5 font-bold text-[var(--graphite)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
