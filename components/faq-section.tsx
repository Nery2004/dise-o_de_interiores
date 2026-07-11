import { ChevronDown } from "lucide-react";
import { faqItems } from "@/data/landingContent";
import { SectionHeading } from "@/components/section-heading";

export function FAQSection() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:px-10">
        <SectionHeading
          eyebrow="Preguntas frecuentes"
          title="Lo importante antes de comenzar"
          description="Respuestas claras sobre funcionamiento, privacidad y límites de la visualización."
        />
        <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {faqItems.map(([question, answer]) => (
            <details key={question} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-bold text-[var(--graphite)] focus-visible:outline-none">
                <span>{question}</span>
                <ChevronDown
                  size={18}
                  className="shrink-0 transition group-open:rotate-180"
                />
              </summary>
              <p className="max-w-2xl pb-5 pr-8 text-sm leading-7 text-[var(--muted)]">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
