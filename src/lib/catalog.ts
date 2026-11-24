import { cacheLife, cacheTag } from "next/cache";
import {
  demoNiches,
  demoPacks,
  demoPlans,
  demoSubniches,
  getDemoScripts,
} from "./demo-content";
import { hasPublicConfig } from "./supabase/client";
import { createAdminClient } from "./supabase/admin";
import type { Niche, Pack, Plan, Script } from "./types";

const NICHE_FIELDS = "id,name,slug,description,accent,sort_order,subniches(id,niche_id,name,slug,description,sort_order)";
const PACK_FIELDS =
  "id,week_start,slug,title,summary,cover_url,price_cents,compare_at_price_cents,status,published_at,generated_at,scripts_count";
const SCRIPT_FIELDS =
  "id,pack_id,niche_id,subniche_id,title,hook,body,cta,caption,hashtags,duration_seconds,score,position,niches(name,slug),subniches(name,slug)";

export async function getNiches(): Promise<Niche[]> {
  "use cache";
  cacheTag("niches");
  cacheLife("hours");

  if (!hasPublicConfig()) {
    return demoNiches.map((niche) => ({
      ...niche,
      subniches: demoSubniches.filter((sub) => sub.niche_id === niche.id),
    }));
  }

  try {
    const { data, error } = await createAdminClient()
      .from("niches")
      .select(NICHE_FIELDS)
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error || !data) return demoNiches;
    return data as unknown as Niche[];
  } catch {
    return demoNiches;
  }
}

export async function getNicheBySlug(slug: string): Promise<Niche | null> {
  const niches = await getNiches();
  return niches.find((niche) => niche.slug === slug) ?? null;
}

export async function getPacks(): Promise<Pack[]> {
  "use cache";
  cacheTag("packs");
  cacheLife("minutes");

  if (!hasPublicConfig()) return demoPacks;

  try {
    const { data, error } = await createAdminClient()
      .from("packs")
      .select(PACK_FIELDS)
      .eq("status", "published")
      .order("week_start", { ascending: false });
    if (error || !data) return demoPacks;
    return data as Pack[];
  } catch {
    return demoPacks;
  }
}

export async function getLatestPack(): Promise<Pack | null> {
  const packs = await getPacks();
  return packs[0] ?? null;
}

export async function getPackBySlug(slug: string): Promise<Pack | null> {
  const packs = await getPacks();
  return packs.find((pack) => pack.slug === slug) ?? null;
}

export async function getPackById(id: string): Promise<Pack | null> {
  if (!hasPublicConfig()) return demoPacks.find((pack) => pack.id === id) ?? null;
  try {
    const { data, error } = await createAdminClient()
      .from("packs")
      .select(PACK_FIELDS)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data as Pack;
  } catch {
    return null;
  }
}

export async function getScriptsByPack(packId: string): Promise<Script[]> {
  "use cache";
  cacheTag("scripts");
  cacheLife("minutes");

  if (!hasPublicConfig()) return getDemoScripts(packId);

  try {
    const { data, error } = await createAdminClient()
      .from("scripts")
      .select(SCRIPT_FIELDS)
      .eq("pack_id", packId)
      .order("position", { ascending: true });
    if (error || !data) return [];
    return data as unknown as Script[];
  } catch {
    return [];
  }
}

export async function getPlans(): Promise<Plan[]> {
  "use cache";
  cacheTag("plans");
  cacheLife("hours");

  if (!hasPublicConfig()) return demoPlans;

  try {
    const { data, error } = await createAdminClient()
      .from("plans")
      .select("id,name,slug,price_cents,interval,features,active,sort_order")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error || !data) return demoPlans;
    return data as Plan[];
  } catch {
    return demoPlans;
  }
}

export async function getAdminPacks(): Promise<Pack[]> {
  if (!hasPublicConfig()) return demoPacks;
  try {
    const { data, error } = await createAdminClient()
      .from("packs")
      .select(PACK_FIELDS)
      .order("week_start", { ascending: false });
    if (error || !data) return [];
    return data as Pack[];
  } catch {
    return [];
  }
}

export async function getAdminNiches(): Promise<Niche[]> {
  if (!hasPublicConfig()) return demoNiches;
  try {
    const { data, error } = await createAdminClient()
      .from("niches")
      .select(NICHE_FIELDS)
      .order("sort_order", { ascending: true });
    if (error || !data) return [];
    return data as unknown as Niche[];
  } catch {
    return [];
  }
}
