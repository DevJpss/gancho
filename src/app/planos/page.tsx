import type { Metadata } from "next";
import Link from "next/link";
import PageTransition from "@/components/PageTransition";
import { getLatestPack, getPlans } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { COMPARISON_PRICE_CENTS, DEFAULT_PACK_PRICE_CENTS, absoluteUrl } from "@/lib/site";

const forward = ["nav-forward"];

export const metadata: Metadata = {
  title: "Planos",
  description: "Compre o pack avulso da semana ou assine e receba todos os roteiros.",
  alternates: { canonical: "/planos" },
  openGraph: { url: absoluteUrl("/planos") },
};

export default async function PlanosPage() {
  const [plans, pack] = await Promise.all([getPlans(), getLatestPack()]);
  const plan = plans[0];

  return (
    <PageTransition className="px-4 py-14 sm:px-8 lg:px-16">
      <p className="u-enter text-xs font-semibold tracking-[0.14em] text-accent uppercase">Planos</p>
      <h1 className="u-enter u-enter-1 mt-3 font-display text-6xl font-bold uppercase sm:text-7xl">
        Escolha seu ritmo
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Um pack quando você precisa de conteúdo hoje. Assinatura quando você publica toda semana.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <article className="u-card u-reveal border border-line bg-panel p-8">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Pagamento único</p>
          <h2 className="mt-2 font-display text-3xl font-bold uppercase">Pack avulso</h2>
          <p className="mt-5 font-display text-6xl font-bold">
            {formatPrice(DEFAULT_PACK_PRICE_CENTS)}
          </p>
          <ul className="mt-7 space-y-3 text-sm">
            <li>✓ 32 roteiros completos de uma semana</li>
            <li>✓ Hook, corpo cronometrado, CTA e legenda</li>
            <li>✓ Entrega imediata após o pagamento</li>
          </ul>
          <Link
            href={pack ? `/checkout?kind=pack&slug=${pack.slug}` : "/packs"}
            transitionTypes={forward}
            className="u-btn u-btn--dark u-btn--block mt-9 px-6"
          >
            Comprar pack da semana
          </Link>
        </article>

        <article className="u-card u-reveal border-2 border-accent bg-panel p-8">
          <p className="text-xs font-semibold tracking-wide text-accent uppercase">Assinatura mensal</p>
          <h2 className="mt-2 font-display text-3xl font-bold uppercase">
            {plan?.name ?? "Gancho Pro"}
          </h2>
          <p className="mt-5 font-display text-6xl font-bold">
            {formatPrice(plan?.price_cents ?? 3990)}
          </p>
          <p className="text-sm text-muted">/mês</p>
          <ul className="mt-7 space-y-3 text-sm">
            {(plan?.features ?? []).map((feature) => (
              <li key={feature}>✓ {feature}</li>
            ))}
          </ul>
          <Link
            href={`/checkout?kind=subscription&slug=${plan?.slug ?? "pro"}`}
            transitionTypes={forward}
            className="u-btn u-btn--primary u-btn--block mt-9 px-6"
          >
            Assinar agora
          </Link>
          <p className="mt-3 text-xs text-muted">
            Assinatura processada pelo Mercado Pago. Você recebe o link de cobrança recorrente.
          </p>
        </article>
      </div>

      <p className="mt-10 text-sm text-muted">
        Para comparação: assinaturas de ferramentas de IA para criação custam em torno de{" "}
        {formatPrice(COMPARISON_PRICE_CENTS)}/mês. Aqui o foco é só o roteiro pronto.
      </p>
    </PageTransition>
  );
}
