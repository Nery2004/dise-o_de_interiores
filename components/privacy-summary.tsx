import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function PrivacySummary() {
  return (
    <section className="bg-[var(--cream)] px-5 py-20 sm:px-8">
      <div className="landing-reveal mx-auto grid max-w-5xl gap-7 rounded-3xl border border-[var(--line)] bg-white p-7 shadow-sm sm:p-10 md:grid-cols-[auto_1fr_auto] md:items-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--sage)]/20 text-[var(--sage-dark)]">
          <ShieldCheck size={26} />
        </span>
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--graphite)]">
            Privacidad comprensible desde el inicio
          </h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Los proyectos se guardan localmente por defecto. En modo mock las
            imágenes no deben enviarse a proveedores externos; si habilitas un
            proveedor de IA, la imagen podría procesarse temporalmente mediante
            ese servicio. Las claves privadas permanecen del lado del servidor.
          </p>
        </div>
        <Link
          href="/privacy"
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--sage-dark)]"
        >
          Leer privacidad
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
