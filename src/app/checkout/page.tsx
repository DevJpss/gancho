import type { Metadata } from "next";
import { Suspense } from "react";
import CheckoutForm from "@/components/CheckoutForm";
import PageTransition from "@/components/PageTransition";
import { getPackBySlug, getPlans } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Finalize sua compra de roteiros Gancho.",
  robots: { index: false, follow: false },
};

async function CheckoutContent(props: PageProps<"/checkout">) {
  const params = await props.searchParams;
  const kind = params.kind === "subscription" ? "subscription" : "pack";
  const slug = typeof params.slug === "string" ? params.slug : "";
  const pack = kind === "pack" ? await getPackBySlug(slug) : null;
  const plan = kind === "subscription" ? (await getPlans()).find((item) => item.slug === slug) ?? null : null;

  if ((kind === "pack" && !pack) || (kind === "subscription" && !plan)) {
    return (
      <div className="u-card u-enter border border-line bg-panel p-8">
        <h1 className="font-display text-3xl font-bold uppercase">Item não encontrado</h1>
        <p className="mt-2 text-sm text-muted">Escolha um pack ou plano válido para continuar.</p>
      </div>
    );
  }

  const priceCents = pack?.price_cents ?? plan?.price_cents ?? 0;
  const title = pack?.title ?? plan?.name ?? "";

  return (
    <>
      <span className="u-enter text-xs font-semibold tracking-[0.14em] text-accent uppercase">
        Último passo
      </span>
      <h1 className="u-enter u-enter-1 mt-2 mb-3 font-display text-6xl font-bold uppercase sm:text-7xl">
        Checkout
      </h1>
      <p className="u-enter u-enter-2 mb-10 max-w-2xl text-muted">
        Seus dados de pagamento ficam somente no gateway. Não pedimos CPF nem endereço: o produto
        é digital e o acesso é liberado na hora.
      </p>
      <CheckoutForm kind={kind} slug={slug} title={title} priceCents={priceCents} />
    </>
  );
}

export default function CheckoutPage(props: PageProps<"/checkout">) {
  return (
    <PageTransition className="px-4 py-12 sm:px-8 lg:px-16">
      <Suspense fallback={<p className="text-sm text-muted">Preparando o checkout…</p>}>
        <CheckoutContent {...props} />
      </Suspense>
    </PageTransition>
  );
}
