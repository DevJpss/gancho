"use client";

import { useActionState, useState } from "react";
import { checkout } from "@/app/checkout/actions";
import { formatPrice } from "@/lib/format";
import type { ActionState } from "@/lib/types";

const field =
  "w-full border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-accent";
const label = "flex flex-col gap-1.5 text-sm font-medium";

type Props = {
  kind: "pack" | "subscription";
  slug: string;
  title: string;
  priceCents: number;
};

export default function CheckoutForm({ kind, slug, title, priceCents }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(checkout, {
    ok: false,
    message: "",
  });
  const [method, setMethod] = useState<"pix" | "card">("pix");
  const isSubscription = kind === "subscription";

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="slug" value={slug} />

      <div className="grid gap-6">
        <section className="grid gap-4 border border-line bg-panel p-6">
          <h2 className="font-display text-2xl font-bold uppercase">Seus dados</h2>
          <label className={label}>
            Nome completo
            <input name="full_name" required minLength={3} className={field} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>
              E-mail
              <input name="email" type="email" required className={field} />
            </label>
            <label className={label}>
              WhatsApp
              <input name="phone" type="tel" required placeholder="11999999999" className={field} />
            </label>
          </div>
          <p className="text-xs text-muted">
            O link da biblioteca será exibido no pedido. Guarde esse endereço.
          </p>
        </section>

        <fieldset className="grid gap-3 border border-line bg-panel p-6">
          <legend className="font-display text-2xl font-bold uppercase">Forma de pagamento</legend>
          {isSubscription ? (
            <>
              <label className="flex items-center gap-3 text-sm font-medium">
                <input type="radio" checked readOnly />
                Assinatura recorrente no cartão
              </label>
              <p className="pl-6 text-xs text-muted">
                Assinaturas usam cobrança recorrente do Mercado Pago. Pix fica disponível apenas
                na compra avulsa.
              </p>
              <input type="hidden" name="payment_method" value="card" />
            </>
          ) : (
            <>
              <label className="flex items-center gap-3 text-sm font-medium">
                <input
                  type="radio"
                  name="payment_method"
                  value="pix"
                  checked={method === "pix"}
                  onChange={() => setMethod("pix")}
                />
                Pix
              </label>
              <p className="pl-6 text-xs text-muted">QR Code gerado após criar o pedido.</p>
              <label className="flex items-center gap-3 text-sm font-medium">
                <input
                  type="radio"
                  name="payment_method"
                  value="card"
                  checked={method === "card"}
                  onChange={() => setMethod("card")}
                />
                Cartão de crédito
              </label>
              <p className="pl-6 text-xs text-muted">
                Você vai para o checkout seguro do Mercado Pago.
              </p>
            </>
          )}
        </fieldset>

        {state.message ? (
          <p role="alert" className="border border-red-500 bg-white p-3 text-sm text-red-700">
            {state.message}
          </p>
        ) : null}
      </div>

      <aside className="h-fit border border-accent bg-panel p-6">
        <h2 className="mb-4 font-display text-2xl font-bold uppercase">Resumo</h2>
        <p className="text-sm text-muted">{title}</p>
        <div className="mt-4 flex justify-between border-t border-line pt-4 font-semibold">
          <span>Total</span>
          <span>{formatPrice(priceCents)}</span>
        </div>
        <p className="mt-2 text-xs text-muted">Sem frete · entrega digital imediata</p>
        <button
          type="submit"
          disabled={pending}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center bg-accent px-6 font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Criando pedido..." : "Finalizar pedido"}
        </button>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Ao continuar, você concorda com os <a href="/termos" className="underline">termos de uso</a> e a{" "}
          <a href="/privacidade" className="underline">política de privacidade</a>.
        </p>
      </aside>
    </form>
  );
}
