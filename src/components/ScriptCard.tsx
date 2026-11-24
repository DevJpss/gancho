import type { Script } from "@/lib/types";

type Props = {
  script: Script;
  index?: number;
  locked?: boolean;
};

export default function ScriptCard({ script, index, locked = false }: Props) {
  const nicheName = script.niches?.name ?? "Nicho";
  const subnicheName = script.subniches?.name ?? "Subnicho";

  return (
    <article className="border border-line bg-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide uppercase">
          <span className="bg-ink px-2 py-1 text-white">{nicheName}</span>
          <span className="text-accent">{subnicheName}</span>
        </div>
        <span className="text-xs text-muted">
          {script.duration_seconds}s
          {index ? ` · Roteiro ${String(index).padStart(2, "0")}` : ""}
        </span>
      </div>

      <div className="grid gap-5 p-5 sm:p-6">
        <h3 className="font-display text-2xl font-bold uppercase sm:text-3xl">{script.title}</h3>

        <div>
          <p className="mb-1.5 text-[11px] font-semibold tracking-[0.14em] text-accent uppercase">
            Hook — fale nos primeiros 2 segundos
          </p>
          <p className="border-l-4 border-accent pl-4 text-lg leading-snug font-medium">
            “{script.hook}”
          </p>
        </div>

        {locked ? (
          <div className="relative min-h-32 overflow-hidden border border-dashed border-line bg-canvas/60 p-4">
            <p className="select-none text-sm leading-relaxed text-muted/40 blur-[5px]">
              {script.body}
            </p>
            <div className="absolute inset-0 flex items-center justify-center bg-panel/70">
              <span className="bg-ink px-4 py-2 text-xs font-semibold tracking-wide text-white uppercase">
                liberado após a compra
              </span>
            </div>
          </div>
        ) : (
          <>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
                Corpo — com marcação de tempo
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-line">{script.body}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
                  CTA
                </p>
                <p className="text-sm font-medium">{script.cta}</p>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
                  Legenda
                </p>
                <p className="text-sm">{script.caption}</p>
              </div>
            </div>
            {script.hashtags.length ? (
              <p className="text-xs text-accent">
                {script.hashtags.map((tag) => `#${tag}`).join(" ")}
              </p>
            ) : null}
          </>
        )}
      </div>
    </article>
  );
}
