import { audiences } from "@/data/landingContent";
import { SectionHeading } from "@/components/section-heading";

export function AudienceSection() {
  return (
    <section className="bg-[var(--surface-soft)] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          eyebrow="Para quién es"
          title="Una herramienta visual para distintas conversaciones"
          centered
        />
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
          {audiences.map(([title, description], index) => (
            <article key={title} className="landing-reveal bg-white p-6">
              <span className="font-mono text-xs font-bold text-[var(--terracotta)]">
                0{index + 1}
              </span>
              <h3 className="mt-4 font-bold text-[var(--graphite)]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
