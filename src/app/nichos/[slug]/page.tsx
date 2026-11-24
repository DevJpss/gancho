import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import PageTransition from "@/components/PageTransition";
import { getLatestPack, getNiches, getNicheBySlug, getScriptsByPack } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";

const forward = ["nav-forward"];

export async function generateStaticParams() {
  const niches = await getNiches();
  return niches.length ? niches.map((niche) => ({ slug: niche.slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata(props: PageProps<"/nichos/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const niche = await getNicheBySlug(slug);
  if (!niche) return { title: "Nicho não encontrado" };
  return {
    title: `Roteiros de ${niche.name}`,
    description: `Roteiros prontos para ${niche.name}: ${niche.subniches?.map((s) => s.name).join(", ")}.`,
    alternates: { canonical: `/nichos/${niche.slug}` },
    openGraph: { url: absoluteUrl(`/nichos/${niche.slug}`) },
  };
}

async function NicheDetail(props: PageProps<"/nichos/[slug]">) {
  const { slug } = await props.params;
  const niche = await getNicheBySlug(slug);
  if (!niche) {
    return <p className="border border-line bg-panel p-8">Nicho não encontrado.</p>;
  }

  const pack = await getLatestPack();
  const allScripts = pack ? await getScriptsByPack(pack.id) : [];
  const scripts = allScripts.filter((script) => script.niche_id === niche.id).slice(0, 4);

  return (
    <>
      <p className="u-enter text-xs font-semibold tracking-[0.14em] text-accent uppercase">Nicho</p>
      <h1 className="u-enter u-enter-1 mt-3 font-display text-6xl font-bold uppercase sm:text-7xl">{niche.name}</h1>
      <p className="u-enter u-enter-2 mt-4 max-w-2xl text-lg text-muted">{niche.description}</p>

      <div className="u-reveal mt-10 flex flex-wrap gap-2">
        {niche.subniches?.map((sub) => (
          <span key={sub.id} className="border border-line bg-panel px-3 py-2 text-sm font-medium">
            {sub.name}
          </span>
        ))}
      </div>

      <h2 className="mt-14 font-display text-3xl font-bold uppercase">
        Do pack da semana
      </h2>
      <p className="mt-2 text-sm text-muted">
        Amostra de títulos e hooks. O roteiro completo está no pack.
      </p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {scripts.map((script) => (
          <article key={script.id} className="u-card u-reveal border border-line bg-panel p-6">
            <p className="text-xs font-semibold tracking-wide text-accent uppercase">
              {script.subniches?.name ?? "Subnicho"}
            </p>
            <h3 className="mt-2 font-display text-2xl font-bold uppercase">{script.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">“{script.hook}”</p>
          </article>
        ))}
        {!scripts.length ? (
          <p className="text-sm text-muted">
            Ainda não há roteiros publicados para este nicho. O próximo pack sai na segunda.
          </p>
        ) : null}
      </div>

      {pack ? (
        <Link
          href={`/pack/${pack.slug}`}
          transitionTypes={forward}
          className="u-btn u-btn--primary mt-10 px-7"
        >
          Ver pack completo →
        </Link>
      ) : null}
    </>
  );
}

export default function NichePage(props: PageProps<"/nichos/[slug]">) {
  return (
    <PageTransition className="px-4 py-14 sm:px-8 lg:px-16">
      <Suspense fallback={<p className="text-sm text-muted">Carregando nicho…</p>}>
        <NicheDetail {...props} />
      </Suspense>
    </PageTransition>
  );
}
