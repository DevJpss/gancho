import type { MetadataRoute } from "next";
import { getNiches, getPacks } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [packs, niches] = await Promise.all([getPacks(), getNiches()]);
  const now = new Date();

  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/packs"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/planos"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/termos"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/privacidade"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    ...packs.map((pack) => ({
      url: absoluteUrl(`/pack/${pack.slug}`),
      lastModified: new Date(pack.published_at ?? pack.week_start),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...niches.map((niche) => ({
      url: absoluteUrl(`/nichos/${niche.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
