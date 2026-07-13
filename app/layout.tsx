import type { Metadata } from "next";
import "./globals.css";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Interior Color Studio | Prueba colores en tus paredes",
    template: "%s | Interior Color Studio",
  },
  description:
    "Sube una foto de tu habitación, selecciona las paredes y visualiza diferentes colores antes de pintar.",
  openGraph: {
    title: "Interior Color Studio | Prueba colores en tus paredes",
    description: "Visualiza nuevos colores en tus espacios antes de pintar.",
    type: "website",
    locale: "es_GT",
    siteName: "Interior Color Studio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Interior Color Studio",
    description: "Prueba colores en tus paredes antes de pintar.",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
