import type { Metadata } from "next";
import { DecorObjectsPage } from "@/components/decor/decor-objects-page";
import { PublicFooter } from "@/components/public-footer";
import { SiteHeader } from "@/components/site-header";
import { DecorObjectsProvider } from "@/components/decor-objects-context";

export const metadata: Metadata = {
  title: "Biblioteca de objetos decorativos",
  description: "Explora muebles, plantas, lámparas y accesorios decorativos para preparar tus próximas propuestas de interior.",
};

export default function ObjectsPage() {
  return <DecorObjectsProvider><a href="#contenido" className="fixed left-4 top-3 z-[60] -translate-y-20 rounded-md bg-[var(--graphite)] px-4 py-2 text-sm font-bold text-white transition focus:translate-y-0">Saltar al contenido</a><SiteHeader /><DecorObjectsPage /><PublicFooter /></DecorObjectsProvider>;
}
