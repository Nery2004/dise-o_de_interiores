import Link from "next/link";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";

export default function NotFound() {
  return (
    <>
      <PublicHeader />
      <main className="grid min-h-[65vh] place-items-center bg-[var(--cream)] px-5 py-20 text-center">
        <div>
          <p className="font-mono text-sm font-bold text-[var(--terracotta)]">
            404
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-[var(--graphite)]">
            Esta página no está disponible
          </h1>
          <p className="mt-4 text-[var(--muted)]">
            Puedes volver al inicio o continuar directamente en el editor.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="rounded-full border border-[var(--line)] bg-white px-6 py-3 text-sm font-bold"
            >
              Volver al inicio
            </Link>
            <Link
              href="/editor"
              className="rounded-full bg-[var(--graphite)] px-6 py-3 text-sm font-bold text-white"
            >
              Abrir editor
            </Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
