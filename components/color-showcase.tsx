import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { interiorColors } from "@/data/interiorColors";

const groups = [
  {
    label: "Neutros",
    colors: interiorColors
      .filter((color) => color.category === "neutros")
      .slice(0, 4),
  },
  {
    label: "Cálidos",
    colors: interiorColors
      .filter(
        (color) =>
          color.undertone === "calido" &&
          ["terracotas", "amarillos"].includes(color.category),
      )
      .slice(0, 4),
  },
  {
    label: "Naturales",
    colors: interiorColors
      .filter((color) => color.category === "verdes")
      .slice(0, 4),
  },
  {
    label: "Fríos",
    colors: interiorColors
      .filter(
        (color) => color.undertone === "frio" && color.category === "azules",
      )
      .slice(0, 4),
  },
  {
    label: "Oscuros",
    colors: interiorColors
      .filter((color) => color.category === "oscuros")
      .slice(0, 4),
  },
];

export function ColorShowcase() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Biblioteca de colores"
            title="Tonos pensados para interiores"
            description="Explora colores por categoría, luminosidad, ambiente y habitación recomendada."
          />
          <Link
            href="/colors"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--line)] px-5 text-sm font-bold text-[var(--graphite)] transition hover:bg-[var(--cream)]"
          >
            Explorar colores
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {groups.map((group) => (
            <article
              key={group.label}
              className="landing-reveal rounded-2xl border border-[var(--line)] bg-[var(--cream)] p-4"
            >
              <h3 className="font-bold text-[var(--graphite)]">
                {group.label}
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {group.colors.map((color) => (
                  <div
                    key={color.id}
                    className="group relative aspect-square rounded-xl border border-black/5"
                    style={{ backgroundColor: color.hex }}
                    title={`${color.name} · ${color.hex}`}
                  >
                    <span className="absolute inset-x-1 bottom-1 translate-y-1 rounded bg-black/50 px-1 py-1 text-center text-[9px] font-semibold text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                      {color.name}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
