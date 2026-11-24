import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: `Termos de uso do ${SITE_NAME}.`,
  alternates: { canonical: "/termos" },
};

export default function TermosPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
      <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">Legal</p>
      <h1 className="mt-3 font-display text-5xl font-bold uppercase">Termos de uso</h1>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-display text-2xl font-bold text-ink uppercase">O que é vendido</h2>
          <p className="mt-2">
            Roteiros editoriais digitais (hook, corpo com marcação de tempo, CTA e legenda) para
            produção de vídeos curtos. O produto é entregue em formato digital, na área de pedido
            e na biblioteca acessível pelo link enviado após a confirmação do pagamento.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink uppercase">Uso permitido</h2>
          <p className="mt-2">
            A licença é pessoal e permite usar os roteiros nos seus próprios canais. Não é permitido
            revender, redistribuir ou publicar os textos como produto próprio. A assinatura não
            cobre contas de clientes terceiros.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink uppercase">Responsabilidade</h2>
          <p className="mt-2">
            Os roteiros são sugestões geradas com apoio de inteligência artificial a partir de
            manchetes públicas. Você deve conferir fatos, nomes, números, direitos de imagem e a
            adequação ao seu nicho antes de publicar. Não garantimos alcance, visualizações ou
            resultado comercial.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink uppercase">Pagamento e acesso</h2>
          <p className="mt-2">
            O pagamento é processado pelo Mercado Pago. Não armazenamos dados de cartão. O acesso
            é liberado após a confirmação do pagamento pelo webhook do gateway. Guarde o link da
            biblioteca enviado na confirmação.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink uppercase">Cancelamento</h2>
          <p className="mt-2">
            Para assinaturas, cancele a qualquer momento pela área do Mercado Pago. O acesso segue
            ativo até o fim do período já pago. Para compras avulsas, se você não acessou o
            conteúdo, pode solicitar cancelamento em até 7 dias. Após o acesso, o produto digital
            é considerado entregue — situações de falha técnica são analisadas caso a caso.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold text-ink uppercase">Contato</h2>
          <p className="mt-2">
            Use o canal de atendimento informado na confirmação do pedido para dúvidas sobre
            cobrança ou acesso.
          </p>
        </section>
      </div>
    </main>
  );
}
