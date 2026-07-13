import { notFound } from "next/navigation";
import { DevCapabilities } from "@/components/dev-capabilities";
import { APP_NAME, APP_RELEASE_CHANNEL, APP_VERSION } from "@/config/app";
import { publicEnvPresence } from "@/lib/env/publicEnv";
import { getServerEnv } from "@/lib/env/serverEnv";

export const dynamic = "force-dynamic";

export default function DevelopmentStatusPage() {
  if (process.env.NODE_ENV === "production") notFound();
  let provider = "configuración inválida";
  try { provider = getServerEnv().wallAIProvider; } catch {}
  return <main className="min-h-screen bg-[#f3f4f6] px-5 py-12"><div className="mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#69717d]">Solo desarrollo</p><h1 className="mt-2 text-3xl font-semibold">Estado de {APP_NAME}</h1><p className="mt-2 text-sm text-[#69717d]">No se muestran valores ni secretos.</p><dl className="mt-8 grid gap-3 sm:grid-cols-2"><Item label="Entorno" value={process.env.NODE_ENV} /><Item label="Versión" value={APP_VERSION} /><Item label="Canal" value={APP_RELEASE_CHANNEL} /><Item label="Proveedor IA" value={provider} /><Item label="Supabase configurado" value={publicEnvPresence.supabaseUrl && publicEnvPresence.supabaseAnonKey ? "Sí" : "No"} /><Item label="NEXT_PUBLIC_SITE_URL presente" value={publicEnvPresence.siteUrl ? "Sí" : "No"} /><Item label="Variables públicas de Supabase" value={publicEnvPresence.supabaseUrl && publicEnvPresence.supabaseAnonKey ? "Completas" : "Ausentes o incompletas"} /></dl><div className="mt-3"><DevCapabilities /></div></div></main>;
}

function Item({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-[#dfe3e8] bg-white p-4"><dt className="text-sm text-[#69717d]">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>; }
