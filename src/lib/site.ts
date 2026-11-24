export const SITE_NAME = "Gancho";
export const SITE_TAGLINE = "Roteiros prontos toda segunda-feira.";
export const SITE_DESCRIPTION =
  "Toda segunda, uma IA coleta o que está acontecendo e escreve scripts completos para Reels, TikTok e Shorts — divididos por nicho e subnicho. Compre o pack da semana ou assine e receba todos.";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://gancho.vercel.app"
).replace(/\/+$/, "");

export function absoluteUrl(path = "/"): string {
  if (!path || path === "/") return `${SITE_URL}/`;
  return `${SITE_URL}/${path.replace(/^\/+/, "")}`;
}

/** Preços padrão; podem ser sobrescritos pela tabela `plans` e pelo campo do pack. */
export const DEFAULT_PACK_PRICE_CENTS = 1990;
export const DEFAULT_PLAN_PRICE_CENTS = 3990;
export const COMPARISON_PRICE_CENTS = 10000;
export const FREE_PREVIEW_COUNT = 2;
