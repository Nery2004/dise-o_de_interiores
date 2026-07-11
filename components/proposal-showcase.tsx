import Image from "next/image";
import { SectionHeading } from "@/components/section-heading";

const proposals = [
  {
    name: "Opción natural",
    description: "Salvia, lino y acentos de madera para un ambiente sereno.",
    color: "#8FA59A",
    palette: ["#8FA59A", "#F5F1E8", "#A9785B"],
  },
  {
    name: "Opción moderna",
    description: "Greige claro y grafito con una base limpia y contemporánea.",
    color: "#B6AEA1",
    palette: ["#B6AEA1", "#F1F3F2", "#4A4A4A"],
  },
  {
    name: "Opción cálida",
    description: "Terracota suave, crema y rosa piedra para sumar calidez.",
    color: "#C98276",
    palette: ["#C98276", "#E7D6AA", "#C5AAA4"],
  },
];

export function ProposalShowcase() {
  return (
    <section className="bg-[var(--cream)] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <SectionHeading
          eyebrow="Propuestas de diseño"
          title="Varias ideas para una misma habitación"
          description="Compara varias propuestas para una misma habitación antes de decidir."
          centered
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {proposals.map((proposal) => (
            <article
              key={proposal.name}
              className="landing-reveal overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm"
            >
              <div className="relative aspect-[3/2] overflow-hidden">
                <Image
                  src="/interior-studio-room.png"
                  alt={`Vista de ${proposal.name}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 420px"
                  className="object-cover"
                />
                <div
                  className="absolute inset-0 opacity-65 mix-blend-multiply"
                  style={{
                    backgroundColor: proposal.color,
                    clipPath: "polygon(0 4%, 72% 0, 69% 61%, 0 72%)",
                  }}
                />
              </div>
              <div className="p-5">
                <div className="flex gap-2">
                  {proposal.palette.map((color) => (
                    <span
                      key={color}
                      className="h-7 w-7 rounded-full border border-black/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <h3 className="mt-4 text-lg font-bold text-[var(--graphite)]">
                  {proposal.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {proposal.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
