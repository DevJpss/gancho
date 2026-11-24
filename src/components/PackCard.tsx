import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/format";
import type { Pack } from "@/lib/types";

const forward = ["nav-forward"];

export default function PackCard({ pack, featured = false }: { pack: Pack; featured?: boolean }) {
  return (
    <article className={`u-card u-reveal flex flex-col border border-line bg-panel p-6 ${featured ? "border-accent" : ""}`}>
      <div className="flex items-center justify-between gap-3 text-xs font-semibold tracking-wide uppercase">
        <span className="text-accent">
          {featured ? "Pack da semana" : "Arquivo"}
        </span>
        <span className="text-muted">{formatDate(pack.week_start)}</span>
      </div>
      <h3 className="mt-4 font-display text-3xl font-bold uppercase">{pack.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{pack.summary}</p>
      <div className="mt-6 flex items-end justify-between gap-4 border-t border-line pt-4">
        <div>
          <p className="font-display text-4xl font-bold">{formatPrice(pack.price_cents)}</p>
          <p className="text-xs text-muted">{pack.scripts_count} roteiros completos</p>
        </div>
        <Link
          href={`/pack/${pack.slug}`}
          transitionTypes={forward}
          className="u-btn u-btn--dark px-5 text-sm"
        >
          Ver pack
        </Link>
      </div>
    </article>
  );
}
