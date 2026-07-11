import { CheckCircle2 } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

const benefits = [
  "Reduce la incertidumbre antes de pintar",
  "Compara tonos en tu propio espacio",
  "Presenta opciones de manera profesional",
  "Guarda diferentes ideas en un mismo proyecto",
  "Evita depender únicamente de muestras pequeñas",
];

export function BenefitsSection() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:px-10">
        <SectionHeading
          eyebrow="Beneficios"
          title="Decide con una referencia visual más completa"
          description="Una fotografía no sustituye una muestra física, pero ayuda a comparar alternativas dentro del contexto real de la habitación."
        />
        <div className="grid gap-3">
          {benefits.map((benefit) => (
            <div
              key={benefit}
              className="landing-reveal flex items-center gap-4 rounded-xl border border-[var(--line)] bg-[var(--cream)] p-4"
            >
              <CheckCircle2
                className="shrink-0 text-[var(--sage-dark)]"
                size={21}
              />
              <p className="font-semibold text-[var(--graphite)]">{benefit}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
