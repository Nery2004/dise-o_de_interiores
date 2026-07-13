import { Download, ImageUp, Palette, ScanSearch } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { howItWorksSteps } from "@/data/landingContent";

const icons = {
  upload: ImageUp,
  scan: ScanSearch,
  palette: Palette,
  download: Download,
};

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="scroll-mt-20 bg-white py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          eyebrow="Cómo funciona"
          title="De una fotografía a una decisión más clara"
          description="Un proceso flexible: comienza con ayuda automática y conserva siempre el control manual."
          centered
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorksSteps.map((step, index) => {
            const Icon = icons[step.icon];
            return (
              <article
                key={step.title}
                className="landing-reveal rounded-2xl border border-[var(--line)] bg-[var(--cream)] p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--sage-dark)] text-white">
                    <Icon size={20} />
                  </span>
                  <span className="font-mono text-sm font-bold text-[var(--terracotta-text)]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-bold text-[var(--graphite)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
