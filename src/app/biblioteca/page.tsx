import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import ScriptCard from "@/components/ScriptCard";
import { getPacks, getScriptsByPack } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { maskEmail, maskFullName } from "@/lib/privacy";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasAdminConfig } from "@/lib/supabase/client";
import { firstRelation } from "@/lib/relations";
import { accessTokenSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Minha biblioteca",
  robots: { index: false, follow: false },
};

// Dados pessoais não podem ser pré-renderizados nem guardados em cache.
export const instant = false;

async function LibraryContent(props: PageProps<"/biblioteca">) {
  await connection();
  const params = await props.searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  const accessForm = (
    <div className="max-w-md border border-line bg-panel p-6">
      <h1 className="font-display text-3xl font-bold uppercase">Minha biblioteca</h1>
      <p className="mt-3 text-sm text-muted">
        Informe o token recebido na página do pedido. Ele fica no link que aparece depois da
        confirmação do pagamento.
      </p>
      <form action="/biblioteca" method="get" className="mt-5 flex gap-2">
        <input
          name="token"
          required
          placeholder="token de acesso"
          className="min-w-0 flex-1 border border-line bg-white px-3 py-2.5 text-sm"
        />
        <button type="submit" className="bg-accent px-5 py-2.5 text-sm font-semibold text-white">
          Acessar
        </button>
      </form>
    </div>
  );

  if (!token || !hasAdminConfig() || !accessTokenSchema.safeParse(token).success) {
    return <main className="px-4 py-14 sm:px-8 lg:px-16">{accessForm}</main>;
  }

  const admin = createAdminClient();
  const { data: customer } = await admin
    .from("customers")
    .select("id,full_name,email")
    .eq("access_token", token)
    .maybeSingle();

  if (!customer) {
    return (
      <main className="px-4 py-14 sm:px-8 lg:px-16">
        {accessForm}
        <p role="alert" className="mt-4 max-w-md border border-red-500 bg-white p-3 text-sm text-red-700">
          Token inválido. Confira o link enviado na confirmação do pedido.
        </p>
      </main>
    );
  }

  const { data: orders } = await admin
    .from("orders")
    .select("id,code,kind,status,total_cents,paid_at,packs(slug,title)")
    .eq("customer_id", customer.id)
    .eq("status", "paid")
    .order("paid_at", { ascending: false });
  const { data: subscription } = await admin
    .from("subscriptions")
    .select("id,status,current_period_end,plans(name)")
    .eq("customer_id", customer.id)
    .eq("status", "active")
    .maybeSingle();

  const packs = await getPacks();
  const purchasedSlugs = new Set(
    (orders ?? [])
      .filter((order) => order.kind === "pack")
      .map((order) => firstRelation(order.packs)?.slug)
      .filter((slug): slug is string => Boolean(slug)),
  );
  const hasSubscription = Boolean(subscription);
  const visiblePacks = packs.filter((pack) => hasSubscription || purchasedSlugs.has(pack.slug)).slice(0, 4);
  const scriptsByPack = new Map(
    await Promise.all(
      visiblePacks.map(async (pack) => [pack.id, await getScriptsByPack(pack.id)] as const),
    ),
  );

  return (
    <main className="px-4 py-14 sm:px-8 lg:px-16">
      <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">Biblioteca</p>
      <h1 className="mt-3 font-display text-5xl font-bold uppercase sm:text-6xl">
        Olá, {maskFullName(customer.full_name)}
      </h1>
      <p className="mt-3 text-muted">{maskEmail(customer.email)}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        {hasSubscription ? (
          <span className="border-2 border-accent bg-panel px-4 py-2 text-sm font-semibold text-accent">
            Assinatura ativa · todos os packs liberados
          </span>
        ) : null}
        {(orders ?? []).map((order) => (
          <span key={order.id} className="border border-line bg-panel px-4 py-2 text-xs text-muted">
            {order.code} · {formatPrice(order.total_cents)}
          </span>
        ))}
      </div>

      {!visiblePacks.length ? (
        <div className="mt-10 border border-line bg-panel p-8">
          <p className="font-semibold">Nenhum pack liberado ainda.</p>
          <p className="mt-2 text-sm text-muted">
            Se você já pagou, aguarde a confirmação ou verifique se usou o link do pedido correto.
          </p>
        </div>
      ) : null}

      <div className="mt-12 grid gap-10">
        {visiblePacks.map((pack) => {
          const scripts = scriptsByPack.get(pack.id) ?? [];
          return (
            <section key={pack.id}>
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-accent uppercase">
                    Pack liberado
                  </p>
                  <h2 className="mt-1 font-display text-3xl font-bold uppercase">{pack.title}</h2>
                </div>
                <p className="text-sm text-muted">{scripts.length} roteiros</p>
              </div>
              <div className="mt-6 grid gap-4">
                {scripts.map((script, index) => (
                  <details key={script.id} className="border border-line bg-panel">
                    <summary className="cursor-pointer px-5 py-4 font-semibold">
                      {String(index + 1).padStart(2, "0")} — {script.title}
                    </summary>
                    <div className="border-t border-line px-5 pb-5">
                      <ScriptCard script={script} />
                    </div>
                  </details>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {hasSubscription && packs.length > visiblePacks.length ? (
        <p className="mt-10 text-sm text-muted">
          Mostrando os {visiblePacks.length} packs mais recentes. Os anteriores continuam liberados
          enquanto a assinatura estiver ativa.
        </p>
      ) : null}
    </main>
  );
}

export default function BibliotecaPage(props: PageProps<"/biblioteca">) {
  return (
    <Suspense fallback={<main className="px-4 py-14 text-sm text-muted">Carregando biblioteca…</main>}>
      <LibraryContent {...props} />
    </Suspense>
  );
}
