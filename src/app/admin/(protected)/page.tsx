import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasAdminConfig } from "@/lib/supabase/client";

export const instant = false;

export default async function AdminHome() {
  if (!hasAdminConfig()) {
    return <p className="border border-line bg-panel p-6 text-sm text-muted">Configure o Supabase para ver os dados do painel.</p>;
  }
  const admin = createAdminClient();
  const [packs, orders, scripts, subscriptions, runs] = await Promise.all([
    admin.from("packs").select("id,status", { count: "exact" }),
    admin.from("orders").select("id,status,total_cents", { count: "exact" }),
    admin.from("scripts").select("id", { count: "exact" }),
    admin.from("subscriptions").select("id,status", { count: "exact" }),
    admin.from("generation_runs").select("id,status,week_start", { count: "exact" }).order("started_at", { ascending: false }).limit(5),
  ]);

  const paid = (orders.data ?? []).filter((order) => order.status === "paid");
  const revenueCents = paid.reduce((sum, order) => sum + order.total_cents, 0);
  const cards = [
    { label: "Packs publicados", value: (packs.data ?? []).filter((p) => p.status === "published").length },
    { label: "Roteiros gerados", value: scripts.count ?? 0 },
    { label: "Pedidos pagos", value: paid.length },
    { label: "Receita (pagos)", value: `R$ ${(revenueCents / 100).toFixed(2).replace(".", ",")}` },
    { label: "Assinaturas ativas", value: (subscriptions.data ?? []).filter((s) => s.status === "active").length },
  ];

  return (
    <div className="grid gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="border border-line bg-panel p-5">
            <p className="text-xs text-muted">{card.label}</p>
            <p className="mt-2 font-display text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="border border-line bg-panel p-6">
        <h2 className="font-display text-2xl font-bold uppercase">Últimas gerações</h2>
        <div className="mt-4 grid gap-2 text-sm">
          {(runs.data ?? []).map((run) => (
            <div key={run.id} className="flex justify-between border-b border-line py-2">
              <span>{run.week_start}</span>
              <span className="font-semibold">{run.status}</span>
            </div>
          ))}
          {!runs.data?.length ? <p className="text-muted">Nenhuma geração registrada.</p> : null}
        </div>
      </section>

      <div className="flex flex-wrap gap-4 text-sm font-semibold">
        <Link href="/admin/packs" className="u-btn u-btn--outline px-5 text-sm">
          Ver packs
        </Link>
        <Link href="/admin/pedidos" className="u-btn u-btn--outline px-5 text-sm">
          Ver pedidos
        </Link>
        <Link href="/admin/geracao" className="u-btn u-btn--primary px-5 text-sm">
          Configurar geração
        </Link>
      </div>
    </div>
  );
}
