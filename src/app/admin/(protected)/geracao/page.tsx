import GenerateButton from "@/components/GenerateButton";
import { currentMonday } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAiConfig, isAiConfigured } from "@/lib/ai/generate";
import { hasAdminConfig } from "@/lib/supabase/client";

export const instant = false;

export default async function AdminGeracaoPage() {
  if (!hasAdminConfig()) {
    return <p className="border border-line bg-panel p-6 text-sm text-muted">Configure o Supabase para acompanhar a geração.</p>;
  }
  const admin = createAdminClient();
  const ai = getAiConfig();
  const [niches, runs] = await Promise.all([
    admin.from("niches").select("id,name,slug,active,subniches(name,slug)").order("sort_order", { ascending: true }),
    admin.from("generation_runs").select("id,week_start,status,scripts_count,signals_count,error,started_at").order("started_at", { ascending: false }).limit(20),
  ]);

  return (
    <div className="grid gap-8">
      <section className="border border-line bg-panel p-6">
        <h2 className="font-display text-2xl font-bold uppercase">Job de segunda-feira</h2>
        <p className="mt-2 text-sm text-muted">
          Semana atual: <strong>{currentMonday()}</strong>. O Vercel Cron dispara{" "}
          <code>GET /api/cron/gerar-packs</code> toda segunda às 12:00 UTC (9h em Brasília).
        </p>
        <p className="mt-2 text-sm text-muted">
          IA: {isAiConfigured() ? "configurada" : "não configurada (defina AI_API_KEY)"}.
          {isAiConfigured()
            ? ` Roteirista: ${ai.writerModel}. Jurado: ${ai.judgeModel}.`
            : ""}
        </p>
        <div className="mt-5">
          <GenerateButton />
        </div>
      </section>

      <section className="border border-line bg-panel p-6">
        <h2 className="font-display text-2xl font-bold uppercase">Nichos ativos</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(niches.data ?? []).map((niche) => (
            <div key={niche.id} className="border border-line p-4">
              <p className="font-semibold">{niche.name}</p>
              <p className="mt-1 text-xs text-muted">
                {(niche.subniches as unknown[] | null)?.length ?? 0} subnichos ·{" "}
                {niche.active ? "ativo" : "inativo"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-line bg-panel p-6">
        <h2 className="font-display text-2xl font-bold uppercase">Histórico de gerações</h2>
        <div className="mt-4 grid gap-2 text-sm">
          {(runs.data ?? []).map((run) => (
            <div key={run.id} className="flex flex-wrap justify-between gap-2 border-b border-line py-2">
              <span>{run.week_start}</span>
              <span>
                {run.status} · {run.scripts_count ?? 0} roteiros · {run.signals_count ?? 0} sinais
              </span>
              {run.error ? <span className="w-full text-xs text-red-700">{run.error}</span> : null}
            </div>
          ))}
          {!runs.data?.length ? <p className="text-muted">Nenhuma geração registrada.</p> : null}
        </div>
      </section>
    </div>
  );
}
