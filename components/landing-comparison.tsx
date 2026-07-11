import { LandingRoomDemo } from "@/components/landing-room-demo";
import { SectionHeading } from "@/components/section-heading";

export function LandingComparison() {
  return (
    <section className="overflow-hidden bg-[var(--graphite)] py-20 text-white sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
        <div>
          <div className="[&_h2]:!text-white [&_p]:!text-white/65">
            <SectionHeading
              eyebrow="Antes y después"
              title="Compara sin perder el contexto del espacio"
              description="El color se integra sobre la fotografía para conservar la lectura de sombras, textura e iluminación. Desliza para revisar la diferencia."
            />
          </div>
          <ul className="mt-7 space-y-3 text-sm text-white/70">
            <li>— Una misma escala y posición visual</li>
            <li>— División vertical u horizontal en el editor</li>
            <li>— Comparaciones exportables para presentar opciones</li>
          </ul>
        </div>
        <div className="landing-reveal [&>div]:border-white/15">
          <LandingRoomDemo showPalette={false} />
        </div>
      </div>
    </section>
  );
}
