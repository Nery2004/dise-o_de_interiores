"use client";

import Link from "next/link";
import { Menu, Paintbrush, X } from "lucide-react";
import { useEffect, useState } from "react";
import { publicNavigation } from "@/config/navigation";

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    function onScroll() {
      setCompact(window.scrollY > 24);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all ${compact ? "border-[var(--line)] bg-[var(--cream)]/95 shadow-sm backdrop-blur-xl" : "border-transparent bg-[var(--cream)]/80 backdrop-blur-lg"}`}
    >
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-5 transition-all sm:px-8 lg:px-10 ${compact ? "h-14" : "h-18"}`}
      >
        <Link
          href="/"
          aria-label="Interior Color Studio, inicio"
          className="flex items-center gap-3"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--graphite)] text-white">
            <Paintbrush size={17} />
          </span>
          <span className="text-sm font-bold tracking-[0.04em] text-[var(--graphite)]">
            Interior Color Studio
          </span>
        </Link>
        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-1 lg:flex"
        >
          {publicNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-white hover:text-[var(--graphite)]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/editor"
            className="ml-2 rounded-full bg-[var(--graphite)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--sage-dark)]"
          >
            Probar ahora
          </Link>
        </nav>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen((current) => !current)}
          className="grid h-11 w-11 place-items-center rounded-full border border-[var(--line)] bg-white lg:hidden"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open ? (
        <div
          id="mobile-navigation"
          className={`fixed inset-x-0 border-t border-[var(--line)] bg-[var(--cream)] p-5 lg:hidden ${compact ? "top-14 h-[calc(100dvh-3.5rem)]" : "top-[4.5rem] h-[calc(100dvh-4.5rem)]"}`}
        >
          <nav
            aria-label="Navegación móvil"
            className="mx-auto flex max-w-md flex-col gap-2"
          >
            {publicNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-xl border border-transparent px-4 py-3.5 text-lg font-semibold text-[var(--graphite)] transition hover:border-[var(--line)] hover:bg-white"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/editor"
              onClick={() => setOpen(false)}
              className="mt-3 rounded-xl bg-[var(--graphite)] px-4 py-4 text-center font-semibold text-white"
            >
              Probar ahora
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
