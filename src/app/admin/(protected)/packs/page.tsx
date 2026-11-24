import Link from "next/link";
import { getAdminPacks } from "@/lib/catalog";
import { formatDate, formatPrice } from "@/lib/format";
import { setPackStatus } from "./actions";

export const instant = false;

export default async function AdminPacksPage() {
  const packs = await getAdminPacks();

  return (
    <section>
      <h2 className="font-display text-3xl font-bold uppercase">Packs</h2>
      <div className="mt-6 grid gap-3">
        {packs.map((pack) => (
          <div key={pack.id} className="flex flex-wrap items-center justify-between gap-4 border border-line bg-panel p-4">
            <div>
              <p className="font-semibold">{pack.title}</p>
              <p className="mt-1 text-xs text-muted">
                {formatDate(pack.week_start)} · {pack.scripts_count} roteiros · {formatPrice(pack.price_cents)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="border border-line px-2 py-1 text-xs font-semibold uppercase">{pack.status}</span>
              <Link href={`/pack/${pack.slug}`} className="text-sm font-semibold text-accent">
                Ver
              </Link>
              <form action={setPackStatus}>
                <input type="hidden" name="id" value={pack.id} />
                <input type="hidden" name="status" value={pack.status === "published" ? "draft" : "published"} />
                <button type="submit" className="border border-ink px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-ink hover:text-white">
                  {pack.status === "published" ? "Despublicar" : "Publicar"}
                </button>
              </form>
            </div>
          </div>
        ))}
        {!packs.length ? <p className="text-sm text-muted">Nenhum pack no banco ainda.</p> : null}
      </div>
    </section>
  );
}
