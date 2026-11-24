import { trendSignalSchema, type TrendSignal } from "./schemas";

const locale = process.env.NEWS_LOCALE ?? "pt-BR";
const region = process.env.NEWS_REGION ?? "BR";
const language = process.env.NEWS_LANGUAGE ?? "pt-419";

function decodeEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .trim();
}

function tagValue(item: string, tag: string): string {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? decodeEntities(match[1]) : "";
}

/**
 * Coleta sinais de tendência via Google News RSS. Não exige chave de API e
 * respeita o feed público. Falhas em um nicho não derrubam o job inteiro.
 */
export async function collectSignals(input: {
  nicheName: string;
  subnicheNames: string[];
  weekStart: string;
  limit?: number;
}): Promise<TrendSignal[]> {
  const terms = [input.nicheName, ...input.subnicheNames.slice(0, 3)].join(" OR ");
  const query = encodeURIComponent(`${terms} after:${input.weekStart} when:7d`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=${locale}&gl=${region}&ceid=${region}:${language}`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return [];
    const xml = await response.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

    const signals = items.slice(0, input.limit ?? 6).flatMap((item) => {
      const title = tagValue(item, "title");
      const link = tagValue(item, "link");
      const published = tagValue(item, "pubDate");
      const source = tagValue(item, "source");
      const parsed = trendSignalSchema.safeParse({
        title: title.replace(/\s+-\s+[^-]+$/, ""),
        url: link,
        source: source || "Google News",
        published_at: published ? new Date(published).toISOString() : null,
        summary: null,
      });
      return parsed.success ? [parsed.data] : [];
    });

    return signals;
  } catch {
    return [];
  }
}
