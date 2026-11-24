import { revalidateTag } from "next/cache";
import { collectSignals } from "@/lib/ai/collect";
import { generateScriptsForNiche, getAiConfig, isAiConfigured } from "@/lib/ai/generate";
import { currentMonday, formatWeekRange, slugifyWeek } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasAdminConfig } from "@/lib/supabase/client";

export const maxDuration = 300;

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!hasAdminConfig() || !isAiConfigured()) {
    return Response.json(
      { error: "Configure Supabase e AI_API_KEY para gerar os packs." },
      { status: 503 },
    );
  }

  const admin = createAdminClient();
  const weekStart = currentMonday();

  const { data: existingPack } = await admin
    .from("packs")
    .select("id")
    .eq("week_start", weekStart)
    .maybeSingle();
  if (existingPack) {
    return Response.json({ skipped: true, reason: "pack já existe", week_start: weekStart });
  }

  const { data: runningRun } = await admin
    .from("generation_runs")
    .select("id,started_at")
    .eq("week_start", weekStart)
    .eq("status", "running")
    .maybeSingle();
  if (runningRun) {
    return Response.json({ skipped: true, reason: "geração em andamento", week_start: weekStart });
  }

  const { data: run, error: runError } = await admin
    .from("generation_runs")
    .insert({ week_start: weekStart, status: "running" })
    .select("id")
    .single();
  if (runError || !run) {
    return Response.json({ error: "Falha ao iniciar geração" }, { status: 500 });
  }

  const { data: niches, error: nichesError } = await admin
    .from("niches")
    .select("id,name,slug,subniches(id,name,slug)")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (nichesError || !niches?.length) {
    await admin
      .from("generation_runs")
      .update({ status: "failed", error: "Nenhum nicho ativo", finished_at: new Date().toISOString() })
      .eq("id", run.id);
    return Response.json({ error: "Nenhum nicho ativo" }, { status: 500 });
  }

  const { data: pack, error: packError } = await admin
    .from("packs")
    .insert({
      week_start: weekStart,
      slug: slugifyWeek(weekStart),
      title: `Roteiros da semana — ${formatWeekRange(weekStart)}`,
      summary:
        "Scripts completos para Reels, TikTok e Shorts, escritos a partir das notícias e eventos da semana.",
      price_cents: 1990,
      status: "draft",
      model: getAiConfig().writerModel,
      prompt_version: "v2-critic",
    })
    .select("id")
    .single();
  if (packError || !pack) {
    await admin
      .from("generation_runs")
      .update({ status: "failed", error: "Falha ao criar pack", finished_at: new Date().toISOString() })
      .eq("id", run.id);
    return Response.json({ error: "Falha ao criar pack" }, { status: 500 });
  }

  let totalScripts = 0;
  let totalSignals = 0;
  const failures: string[] = [];

  for (const niche of niches) {
    const subniches = (niche.subniches ?? []) as Array<{ id: string; name: string; slug: string }>;
    if (!subniches.length) continue;

    try {
      const signals = await collectSignals({
        nicheName: niche.name,
        subnicheNames: subniches.map((sub) => sub.name),
        weekStart,
      });

      if (signals.length) {
        const { error } = await admin.from("trend_signals").insert(
          signals.map((signal) => ({
            pack_id: pack.id,
            niche_id: niche.id,
            title: signal.title,
            url: signal.url,
            source: signal.source,
            published_at: signal.published_at,
            summary: signal.summary,
            score: 80,
          })),
        );
        if (!error) totalSignals += signals.length;
      }

      const batch = await generateScriptsForNiche({
        nicheName: niche.name,
        subniches,
        signals,
        weekStart,
      });

      const rows = batch.scripts.slice(0, subniches.length).map((item, index) => ({
        pack_id: pack.id,
        niche_id: niche.id,
        subniche_id: subniches[index].id,
        title: item.title,
        hook: item.hook,
        body: item.body,
        cta: item.cta,
        caption: item.caption,
        hashtags: item.hashtags,
        duration_seconds: item.duration_seconds,
        score: item.score,
        position: totalScripts + index + 1,
      }));

      const { error } = await admin.from("scripts").insert(rows);
      if (error) throw new Error(error.message);
      totalScripts += rows.length;
    } catch (error) {
      failures.push(`${niche.slug}: ${error instanceof Error ? error.message.slice(0, 160) : "erro"}`);
    }
  }

  const status = totalScripts > 0 && failures.length === 0 ? "completed" : "failed";
  const finishedAt = new Date().toISOString();

  if (totalScripts > 0 && failures.length === 0) {
    await admin
      .from("packs")
      .update({
        status: "published",
        published_at: finishedAt,
        generated_at: finishedAt,
        scripts_count: totalScripts,
      })
      .eq("id", pack.id);
  } else {
    await admin.from("packs").delete().eq("id", pack.id);
  }

  await admin
    .from("generation_runs")
    .update({
      status,
      pack_id: status === "completed" ? pack.id : null,
      scripts_count: totalScripts,
      signals_count: totalSignals,
      error: failures.length ? failures.join(" | ").slice(0, 1000) : null,
      finished_at: finishedAt,
    })
    .eq("id", run.id);

  revalidateTag("packs", { expire: 0 });
  revalidateTag("scripts", { expire: 0 });

  return Response.json({
    week_start: weekStart,
    status,
    scripts: totalScripts,
    signals: totalSignals,
    failures,
  });
}
