import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import PageTransition from "@/components/PageTransition";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: `Política de privacidade do ${SITE_NAME}.`,
  alternates: { canonical: "/privacidade" },
};

export default function PrivacidadePage() {
  return (
    <PageTransition className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
      <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">Legal</p>
      <h1 className="mt-3 font-display text-5xl font-bold uppercase">Privacidade</h1>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-2xl font-bold text-ink uppercase">Dados coletados</h2>
          <p className="mt-2">
            Coletamos nome, e-mail e WhatsApp no checkout. Não pedimos CPF nem endereço: o produto
            é digital. Dados de pagamento ficam exclusivamente no Mercado Pago.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink uppercase">Base legal e uso</h2>
          <p className="mt-2">
            Usamos os dados para executar o contrato (confirmar pagamento, entregar os roteiros e
            enviar o link da biblioteca). Um token aleatório associado ao pedido permite o acesso
            ao conteúdo sem necessidade de senha.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink uppercase">Compartilhamento</h2>
          <p className="mt-2">
            Compartilhamos o e-mail com o gateway de pagamento para emissão da cobrança. Não
            vendemos dados e não usamos seus contatos para publicidade sem consentimento.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink uppercase">Retenção e exclusão</h2>
          <p className="mt-2">
            Os dados são mantidos enquanto houver relação comercial e obrigação fiscal. Você pode
            solicitar acesso ou exclusão pelo canal de atendimento informado no pedido.
          </p>
        </section>
      </div>
    </PageTransition>
  );
}
