import type { NextConfig } from "next";

function optionalOrigin(value: string | undefined) {
  if (!value) return null;
  try { return new URL(value).origin; } catch { return null; }
}

const supabaseOrigin = optionalOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseWebSocketOrigin = supabaseOrigin?.replace(/^http/, "ws");
const connectSources = ["'self'", supabaseOrigin, supabaseWebSocketOrigin].filter(Boolean).join(" ");
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' data:",
  `connect-src ${connectSources}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  process.env.NODE_ENV === "production" ? "upgrade-insecure-requests" : "",
].filter(Boolean).join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  images: { formats: ["image/avif", "image/webp"] },
  async headers() { return [{ source: "/(.*)", headers: securityHeaders }]; },
};

export default nextConfig;
