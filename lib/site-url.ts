export function getSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try { return new URL(value); } catch { return new URL("http://localhost:3000"); }
}
