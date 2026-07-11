import type { Metadata } from "next";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";

export const metadata: Metadata = {
  title: "Privacidad",
  description:
    "Cómo Interior Color Studio utiliza el almacenamiento local, las imágenes y los servicios configurables.",
};

const sections = [
  [
    "Qué información utiliza la aplicación",
    "Interior Color Studio trabaja con las fotografías que eliges, las máscaras que dibujas o detectas, los colores aplicados, las propuestas y la configuración del proyecto.",
  ],
  [
    "Almacenamiento local e IndexedDB",
    "Los proyectos, imágenes originales, propuestas, favoritos y preferencias se guardan por defecto en IndexedDB dentro del navegador y dispositivo que estás usando. No requieren una cuenta.",
  ],
  [
    "Paletas y Supabase",
    "Las paletas guardadas pueden utilizar Supabase cuando ese servicio está configurado. No se utiliza Supabase para guardar las imágenes completas de los proyectos.",
  ],
  [
    "Procesamiento de imágenes",
    "En modo mock, la detección funciona con datos de desarrollo y las imágenes no deben enviarse a un proveedor de IA. Si se configura un proveedor externo, la fotografía podría procesarse temporalmente de acuerdo con el funcionamiento de ese proveedor.",
  ],
  [
    "Proveedores externos configurables",
    "La aplicación permite configurar proveedores de detección desde el servidor. Las claves privadas deben permanecer en variables del entorno del servidor y no exponerse en la interfaz del navegador.",
  ],
  [
    "Eliminar información local",
    "Puedes eliminar proyectos individuales desde Mis proyectos. Al borrarlos se elimina la copia guardada por esta aplicación en IndexedDB para ese navegador y dispositivo.",
  ],
  [
    "Limitaciones",
    "El almacenamiento local depende del navegador, el espacio disponible y las acciones del dispositivo. Borrar datos del navegador puede eliminar proyectos. Esta página es una explicación informativa del producto y no constituye una garantía legal definitiva.",
  ],
] as const;

export default function PrivacyPage() {
  return (
    <>
      <PublicHeader />
      <main id="contenido" className="bg-[var(--cream)]">
        <section className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--sage-dark)]">
            Privacidad
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[var(--graphite)] sm:text-5xl">
            Cómo se utilizan tus datos en Interior Color Studio
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Una explicación sencilla sobre almacenamiento local, procesamiento
            de imágenes y servicios opcionales.
          </p>
          <div className="mt-12 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {sections.map(([title, description]) => (
              <section key={title} className="py-7">
                <h2 className="text-xl font-bold text-[var(--graphite)]">
                  {title}
                </h2>
                <p className="mt-3 leading-7 text-[var(--muted)]">
                  {description}
                </p>
              </section>
            ))}
          </div>
          <p className="mt-8 text-sm text-[var(--muted)]">
            Última actualización informativa:{" "}
            {new Intl.DateTimeFormat("es", { dateStyle: "long" }).format(
              new Date(),
            )}
            .
          </p>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
