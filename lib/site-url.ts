import { publicEnv } from "@/lib/env/publicEnv";

export function getSiteUrl() {
  const value = publicEnv.siteUrl;
  try { return new URL(value); } catch { return new URL("http://localhost:3000"); }
}
