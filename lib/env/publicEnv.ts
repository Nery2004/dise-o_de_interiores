export function optionalPublicValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || null;
}

export function optionalPublicHttpUrl(value: string | undefined) {
  const candidate = optionalPublicValue(value);
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString().replace(/\/$/, "")
      : null;
  } catch {
    return null;
  }
}

export function safeSiteUrl(value: string | undefined) {
  const candidate = optionalPublicValue(value);
  if (!candidate) return "http://localhost:3000";
  return optionalPublicHttpUrl(candidate) ?? "http://localhost:3000";
}

export const publicEnv = {
  siteUrl: safeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
  supabaseUrl: optionalPublicHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: optionalPublicValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
} as const;

export const publicEnvPresence = {
  siteUrl: Boolean(optionalPublicValue(process.env.NEXT_PUBLIC_SITE_URL)),
  supabaseUrl: Boolean(publicEnv.supabaseUrl),
  supabaseAnonKey: Boolean(publicEnv.supabaseAnonKey),
} as const;
