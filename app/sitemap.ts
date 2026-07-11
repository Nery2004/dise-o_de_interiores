import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return [
    { path: "/", priority: 1, frequency: "weekly" as const },
    { path: "/editor", priority: 0.9, frequency: "monthly" as const },
    { path: "/colors", priority: 0.8, frequency: "monthly" as const },
    { path: "/projects", priority: 0.6, frequency: "monthly" as const },
    { path: "/privacy", priority: 0.4, frequency: "yearly" as const },
  ].map((item) => ({ url: new URL(item.path, base).toString(), lastModified: new Date(), changeFrequency: item.frequency, priority: item.priority }));
}
