import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import SimulatePaymentButton from "@/components/SimulatePaymentButton";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasAdminConfig } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";
import { firstRelation } from "@/lib/relations";

export const metadata: Metadata = {
  title: "Pedido",
  robots: { index: false, follow: false },
};

type PaymentRow = {
  status: string;
  payload: Record<string, unknown> | null;
  provider: string;
};

async function OrderDetail(props: PageProps<"/pedido/[code]">) {
  const { code } = await props.params;

  if (!hasAdminConfig()) {
    return (
      <div className="border border-line bg-panel p-8">
        <h1 className="font-display text-3xl font-bold uppercase">Pedido {code}</h1>
        <p className="mt-3 text-sm text-muted">
          Configure o Supabase para acompanhar pedidos reais.
        </p>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id,code,kind,status,total_cents,paid_at,packs(slug,title),plans(name,slug),customer_id")
    .eq("code", code)
    .maybeSingle();

  if (!order) {
    return (
      <div className="border border-line bg-panel p-8">
        <h1 className="font-display text-3xl font-bold uppercase">Pedido não encontrado</h1>
        <Link href="/packs" className="mt-4 inline-block font-semibold text-accent">
          Ver packs →
        </Link>
      </div>
    );
  }

  const { data: customer } = await admin
    .from("customers")
    .select("access_token")
    .eq("id", order.customer_id)
    .maybeSingle();
  const { data: payment } = await admin
    .from("payments")
    .select("status,payload,provider")
    .eq("order_id", order.id)
    .maybeSingle();
  const pay = payment as PaymentRow | null;
  const payload = pay?.payload ?? {};
  const method = String(payload.method ?? "");
  const paid = order.status === "paid";
  const libraryUrl = customer?.access_token ? `/biblioteca?token=${customer.access_token}` : null;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">Pedido {order.code}</p>
        <h1 className="mt-3 font-display text-5xl leading-none font-bold uppercase sm:text-6xl">
          {paid ? "Conteúdo liberado" : "Pagamento pendente"}
        </h1>
        <p className="mt-5 max-w-xl text-muted">
          {paid
            ? "Seu pagamento foi confirmado. Guarde o link da biblioteca abaixo para acessar os roteiros quando quiser."
            : "Escolha o método abaixo para concluir. O acesso é liberado automaticamente quando o pagamento for confirmado."}
        </p>

        {paid && libraryUrl ? (
          <div className="mt-8 border-2 border-accent bg-panel p-6">
            <p className="text-xs font-semibold tracking-wide text-accent uppercase">Acesso ao conteúdo</p>
            <p className="mt-3 text-sm text-muted">
              Este link é pessoal e não depende de login. Salve nos favoritos.
            </p>
            <Link
              href={libraryUrl}
              className="mt-5 inline-block bg-accent px-7 py-4 font-semibold text-white hover:opacity-90"
            >
              Abrir minha biblioteca →
            </Link>
            <p className="mt-4 break-all text-xs text-muted">{libraryUrl}</p>
          </div>
        ) : null}

        {!paid && pay ? (
          <div className="mt-8 border border-line bg-panel p-6">
            <h2 className="font-display text-2xl font-bold uppercase">Pagar {formatPrice(order.total_cents)}</h2>
            {pay.provider === "demo" ? (
              <div className="mt-5 grid gap-4">
                <p className="text-sm text-muted">
                  Modo demo: nenhuma cobrança será feita. Use o botão para simular a confirmação e
                  testar a entrega.
                </p>
                <SimulatePaymentButton code={order.code} />
              </div>
            ) : null}
            {method === "pix" ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-[180px_1fr]">
                {typeof payload.qr_code_base64 === "string" && payload.qr_code_base64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`data:image/png;base64,${payload.qr_code_base64}`}
                    alt="QR Code Pix"
                    className="h-44 w-44 border border-line bg-white"
                  />
                ) : null}
                <div>
                  <p className="text-sm font-semibold">Pix copia e cola</p>
                  <p className="mt-2 break-all text-xs text-muted">
                    {String(payload.qr_code ?? "QR Code indisponível")}
                  </p>
                </div>
              </div>
            ) : null}
            {(method === "card" || method === "preapproval") && typeof payload.init_point === "string" && payload.init_point ? (
              <a
                href={payload.init_point}
                className="mt-5 inline-block bg-accent px-7 py-4 font-semibold text-white hover:opacity-90"
              >
                {method === "preapproval" ? "Ativar assinatura no Mercado Pago" : "Ir para o pagamento"}
              </a>
            ) : null}
          </div>
        ) : null}

        {["cancelled", "refunded", "expired"].includes(order.status) ? (
          <p className="mt-8 border border-line bg-panel p-6 text-sm text-muted">
            Pedido {order.status}. Entre em contato pelo canal informado no checkout se precisar de ajuda.
          </p>
        ) : null}
      </div>

      <aside className="h-fit border border-line bg-panel p-6">
        <h2 className="font-display text-2xl font-bold uppercase">Resumo</h2>
        <div className="mt-4 space-y-2 text-sm">
          <p className="text-muted">
            {order.kind === "pack"
              ? firstRelation(order.packs)?.title ?? "Pack de roteiros"
              : firstRelation(order.plans)?.name ?? "Assinatura"}
          </p>
          <div className="flex justify-between border-t border-line pt-3 font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.total_cents)}</span>
          </div>
          <p className="text-xs text-muted">
            Status: {paid ? "pago" : order.status}
          </p>
        </div>
        <Link href="/packs" className="mt-6 block text-center text-sm font-semibold text-accent">
          Ver outros packs
        </Link>
      </aside>
    </div>
  );
}

export default function OrderPage(props: PageProps<"/pedido/[code]">) {
  return (
    <main className="px-4 py-14 sm:px-8 lg:px-16">
      <Suspense fallback={<p className="text-sm text-muted">Carregando pedido…</p>}>
        <OrderDetail {...props} />
      </Suspense>
    </main>
  );
}
