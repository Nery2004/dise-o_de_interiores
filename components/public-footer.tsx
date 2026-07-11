import Link from "next/link";
import { Paintbrush } from "lucide-react";
import { footerNavigation } from "@/config/navigation";
import { APP_VERSION } from "@/config/app";

export function PublicFooter() {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--graphite)] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1fr_auto] lg:px-10">
        <div className="max-w-md">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10">
              <Paintbrush size={17} />
            </span>
            <p className="font-bold">Interior Color Studio</p>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/65">
            Visualiza colores, compara propuestas y prepara decisiones de
            pintura con mayor claridad.
          </p>
        </div>
        <nav
          aria-label="Enlaces del pie"
          className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm"
        >
          {footerNavigation.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="text-white/70 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-white/50">
      © {new Date().getFullYear()} Interior Color Studio · v{APP_VERSION}
      </div>
    </footer>
  );
}
