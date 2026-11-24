import type { Metadata } from "next";
import Link from "next/link";
import PackCard from "@/components/PackCard";
import { getPacks } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Packs de roteiros",
  description:
    "Todos os packs semanais de roteiros para Reels, TikTok e Shorts, organizados por nicho e subnicho.",
  alternates: { canonical: "/packs" },
  openGraph: { url: absoluteUrl("/packs"), title: "Packs de roteiros | Gancho" },
};

export default async function PacksPage() {
  const packs = await getPacks();

  return (
    <main className="px-4 py-14 sm:px-8 lg:px-16">
      <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">Biblioteca</p>
      <h1 className="mt-3 font-display text-6xl font-bold uppercase sm:text-7xl">
        Packs publicados
      </h1>
      <p className="mt-4 max-w-2xl text-muted">
        Cada pack sai na segunda-feira com um roteiro por subnicho. Os packs anteriores ficam
        disponíveis para quem assina.
      </p>

      {packs.length ? (
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {packs.map((pack, index) => (
            <PackCard key={pack.id} pack={pack} featured={index === 0} />
          ))}
        </div>
      ) : (
        <div className="mt-12 border border-line bg-panel p-8">
          <p className="font-semibold">Nenhum pack publicado ainda.</p>
          <p className="mt-2 text-sm text-muted">
            O primeiro pack é gerado automaticamente pelo job de segunda-feira.
          </p>
        </div>
      )}

      <p className="mt-12 text-sm text-muted">
        Prefere receber todos? <Link href="/planos" className="font-semibold text-accent underline underline-offset-4">Ver planos</Link>
      </p>
    </main>
  );
}
