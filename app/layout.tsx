import type { Metadata } from "next";
import { Manrope, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "@/lib/site-url";
import { DecorObjectsProvider } from "@/components/decor-objects-context";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html lang="es" className={`${manrope.variable} ${geistMono.variable}`}>
      <body><DecorObjectsProvider>{children}</DecorObjectsProvider></body>
    </html>
  );
}
