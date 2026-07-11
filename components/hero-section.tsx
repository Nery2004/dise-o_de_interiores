import Link from "next/link";
import {
  ArrowRight,
  Check,
  Monitor,
  PackageOpen,
  ScanLine,
} from "lucide-react";
import { LandingRoomDemo } from "@/components/landing-room-demo";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--line)] bg-[var(--cream)]">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[var(--sage)]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-[var(--terracotta)]/10 blur-3xl" />
      <div className="mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-20">
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/75 px-3 py-1.5 text-xs font-bold text-[var(--sage-dark)]">
            <ScanLine size={14} />
            Estudio visual de color para interiores
          </p>
          <h1 className="mt-6 max-w-2xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-[var(--graphite)] sm:text-6xl lg:text-7xl">
            Visualiza nuevos colores en tus espacios antes de pintar.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">
            Sube una fotografía de tu habitación, selecciona una pared y prueba
            diferentes tonos conservando las sombras, la textura y la
            iluminación original.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/editor"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--graphite)] px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[var(--sage-dark)]"
            >
              Probar el editor
              <ArrowRight size={17} />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--line)] bg-white/70 px-6 text-sm font-bold text-[var(--graphite)] transition hover:bg-white"
            >
              Ver cómo funciona
            </a>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-[var(--muted)]">
            <li className="flex items-center gap-1.5">
              <Check size={14} className="text-[var(--sage-dark)]" />
              Sin instalación
            </li>
            <li className="flex items-center gap-1.5">
              <Monitor size={14} className="text-[var(--sage-dark)]" />
              Funciona desde el navegador
            </li>
            <li className="flex items-center gap-1.5">
              <PackageOpen size={14} className="text-[var(--sage-dark)]" />
              Exportación en alta resolución
            </li>
          </ul>
        </div>
        <div className="relative z-10 lg:pl-4">
          <div className="absolute -left-5 -top-5 h-24 w-24 rounded-2xl border border-[var(--line)] bg-[var(--terracotta)]/15" />
          <LandingRoomDemo priority />
        </div>
      </div>
    </section>
  );
}
