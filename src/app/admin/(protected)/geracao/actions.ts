"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { SITE_URL } from "@/lib/site";

export async function triggerGeneration(): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const secret = process.env.CRON_SECRET;
  if (!secret) return { ok: false, message: "CRON_SECRET não configurado." };

  try {
    const response = await fetch(`${SITE_URL}/api/cron/gerar-packs`, {
      method: "GET",
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    const body = (await response.json()) as {
      status?: string;
      scripts?: number;
      skipped?: boolean;
      reason?: string;
      error?: string;
      failures?: string[];
    };
    revalidatePath("/admin/geracao");
    revalidatePath("/admin/packs");

    if (!response.ok) {
      return { ok: false, message: body.error ?? `Falha HTTP ${response.status}` };
    }
    if (body.skipped) return { ok: true, message: `Geração ignorada: ${body.reason}` };
    return {
      ok: body.status === "completed",
      message: `${body.status}: ${body.scripts ?? 0} roteiros${
        body.failures?.length ? ` · ${body.failures.join(" | ")}` : ""
      }`,
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Falha ao disparar o job." };
  }
}
