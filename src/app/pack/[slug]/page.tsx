import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ScriptCard from "@/components/ScriptCard";
import PageTransition from "@/components/PageTransition";
import { getPackBySlug, getPacks, getScriptsByPack } from "@/lib/catalog";
import { formatDate, formatPrice } from "@/lib/format";
import { jsonLdHtml } from "@/lib/jsonld";
import { FREE_PREVIEW_COUNT, absoluteUrl } from "@/lib/site";

const forward = ["nav-forward"];
const back = ["nav-back"];

export async function generateStaticParams() {
  const packs = await getPacks();
  return packs.length ? packs.map((pack) => ({ slug: pack.slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata(props: PageProps<"/pack/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const pack = await getPackBySlug(slug);
  if (!pack) return { title: "Pack não encontrado" };
  return {
    title: `Pack de ${formatDate(pack.week_start)}`,
    description: pack.summary ?? "Roteiros completos para Reels, TikTok e Shorts.",
    alternates: { canonical: `/pack/${pack.slug}` },
    openGraph: {
      url: absoluteUrl(`/pack/${pack.slug}`),
      title: `${pack.title} | Gancho`,
      description: pack.summary ?? undefined,
    },
  };
}

async function PackDetail(props: PageProps<"/pack/[slug]">) {
  const { slug } = await props.params;
  const pack = await getPackBySlug(slug);
  if (!pack) {
    return (
      <div className="border border-line bg-panel p-8">
        <h1 className="font-display text-3xl font-bold uppercase">Pack não encontrado</h1>
        <Link href="/packs" transitionTypes={back} className="u-link mt-4 inline-block font-semibold text-accent">
          Ver todos os packs →
        </Link>
      </div>
    );
  }

  const scripts = await getScriptsByPack(pack.id);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pack.title,
    description: pack.summary,
    image: pack.cover_url ?? absoluteUrl("/opengraph-image"),
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (pack.price_cents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      url: absoluteUrl(`/pack/${pack.slug}`),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(structuredData) }}
      />
      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          <p className="u-enter text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            Pack de {formatDate(pack.week_start)}
          </p>
          <h1 className="u-enter u-enter-1 mt-3 font-display text-5xl leading-none font-bold uppercase sm:text-7xl" data-scroll="fade">
            {pack.title}
          </h1>
          <p className="u-enter u-enter-2 mt-5 max-w-2xl text-lg leading-relaxed text-muted">{pack.summary}</p>

          <div className="u-reveal mt-8 flex flex-wrap gap-3 text-xs font-semibold tracking-wide uppercase">
            <span className="border border-line bg-panel px-3 py-2">{pack.scripts_count} roteiros</span>
            <span className="border border-line bg-panel px-3 py-2">8 nichos</span>
            <span className="border border-line bg-panel px-3 py-2">hook + corpo + CTA + legenda</span>
          </div>

          <div className="mt-12">
            <h2 className="font-display text-3xl font-bold uppercase" data-scroll="fade">
              Amostra grátis
            </h2>
            <p className="mt-2 text-sm text-muted">
              Os primeiros {FREE_PREVIEW_COUNT} roteiros estão liberados abaixo. Os demais são
              entregues logo após o pagamento.
            </p>
            <div className="mt-6 grid gap-6">
              {scripts.slice(0, FREE_PREVIEW_COUNT).map((script, index) => (
                <ScriptCard key={script.id} script={script} index={index + 1} />
              ))}
              {!scripts.length ? (
                <p className="border border-line bg-panel p-6 text-sm text-muted">
                  A amostra ainda não foi carregada para este pack.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="u-card u-reveal h-fit border border-accent bg-panel p-6 lg:sticky lg:top-6" data-scroll="none">
          <p className="text-xs font-semibold tracking-wide text-accent uppercase">Pack completo</p>
          <p className="mt-3 font-display text-5xl font-bold">{formatPrice(pack.price_cents)}</p>
          {pack.compare_at_price_cents ? (
            <p className="text-sm text-muted line-through">
              {formatPrice(pack.compare_at_price_cents)}
            </p>
          ) : null}
          <p className="mt-3 text-sm text-muted">
            Pagamento único, acesso imediato. Arquivo digital — sem frete.
          </p>
          <Link
            href={`/checkout?kind=pack&slug=${pack.slug}`}
            transitionTypes={forward}
            className="u-btn u-btn--primary u-btn--block mt-6 px-6"
          >
            Comprar pack
          </Link>
          <Link
            href="/planos"
            transitionTypes={forward}
            className="u-btn u-btn--outline u-btn--block mt-3 px-6 text-sm"
          >
            Ou assine e receba todos
          </Link>
          <div className="mt-6 border-t border-line pt-5 text-xs leading-relaxed text-muted">
            <p>✓ {pack.scripts_count} roteiros prontos para gravar</p>
            <p className="mt-1">✓ Markers de tempo no corpo do script</p>
            <p className="mt-1">✓ Legenda e hashtags incluídas</p>
          </div>
        </aside>
      </div>
    </>
  );
}

export default function PackPage(props: PageProps<"/pack/[slug]">) {
  return (
    <PageTransition className="px-4 py-14 sm:px-8 lg:px-16">
      <Suspense fallback={<p className="text-sm text-muted">Carregando pack…</p>}>
        <PackDetail {...props} />
      </Suspense>
    </PageTransition>
  );
}
