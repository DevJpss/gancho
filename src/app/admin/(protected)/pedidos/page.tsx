import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import { firstRelation } from "@/lib/relations";
import { hasAdminConfig } from "@/lib/supabase/client";

export const instant = false;

export default async function AdminOrdersPage() {
  if (!hasAdminConfig()) {
    return <p className="border border-line bg-panel p-6 text-sm text-muted">Configure o Supabase para ver pedidos.</p>;
  }
  const admin = createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select("id,code,kind,status,total_cents,paid_at,customers(email,full_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <section>
      <h2 className="font-display text-3xl font-bold uppercase">Pedidos</h2>
      <div className="mt-6 grid gap-3">
        {(orders ?? []).map((order) => {
          const customer = firstRelation(order.customers);
          return (
            <div key={order.id} className="flex flex-wrap items-center justify-between gap-4 border border-line bg-panel p-4">
              <div>
                <p className="font-semibold">{order.code}</p>
                <p className="mt-1 text-xs text-muted">
                  {customer?.full_name ?? "—"} · {customer?.email ?? "—"} · {order.kind}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold">{formatPrice(order.total_cents)}</span>
                <span className="border border-line px-2 py-1 text-xs font-semibold uppercase">{order.status}</span>
                <Link href={`/pedido/${order.code}`} className="text-sm font-semibold text-accent">
                  Abrir
                </Link>
              </div>
            </div>
          );
        })}
        {!orders?.length ? <p className="text-sm text-muted">Nenhum pedido ainda.</p> : null}
      </div>
    </section>
  );
}
