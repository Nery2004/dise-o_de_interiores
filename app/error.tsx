"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--cream)] px-5 text-center">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--terracotta)]">
          Algo no salió como esperábamos
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-[var(--graphite)]">
          No pudimos mostrar esta página
        </h1>
        <p className="mt-4 text-[var(--muted)]">
          Puedes intentarlo otra vez o volver a la página principal.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-[var(--graphite)] px-6 py-3 text-sm font-bold text-white"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="rounded-full border border-[var(--line)] bg-white px-6 py-3 text-sm font-bold"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
