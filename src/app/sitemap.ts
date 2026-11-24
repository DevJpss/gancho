import type { MetadataRoute } from "next";
import { getNiches, getPacks } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";

/** Data da última alteração de conteúdo; new Date() no build tornaria o lastmod inútil. */
const STATIC_LAST_MOD = "2026-11-24";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [packs, niches] = await Promise.all([getPacks(), getNiches()]);
  const lastModified = new Date(STATIC_LAST_MOD);

  return [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/packs"), lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/planos"), lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/termos"), lastModified, changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/privacidade"), lastModified, changeFrequency: "yearly", priority: 0.2 },
    ...packs.map((pack) => ({
      url: absoluteUrl(`/pack/${pack.slug}`),
      lastModified: new Date(pack.published_at ?? pack.week_start),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...niches.map((niche) => ({
      url: absoluteUrl(`/nichos/${niche.slug}`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
