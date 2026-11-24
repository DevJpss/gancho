export type PackStatus = "draft" | "published" | "archived";
export type OrderStatus = "pending_payment" | "paid" | "cancelled" | "refunded" | "expired";
export type OrderKind = "pack" | "subscription";

export type Subniche = {
  id: string;
  niche_id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
};

export type Niche = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  accent: string | null;
  sort_order: number;
  subniches?: Subniche[];
};

export type Script = {
  id: string;
  pack_id: string;
  niche_id: string | null;
  subniche_id: string | null;
  title: string;
  hook: string;
  body: string;
  cta: string;
  caption: string;
  hashtags: string[];
  duration_seconds: number;
  score: number | null;
  position: number;
  niches?: Pick<Niche, "name" | "slug"> | null;
  subniches?: Pick<Subniche, "name" | "slug"> | null;
};

export type Pack = {
  id: string;
  week_start: string;
  slug: string;
  title: string;
  summary: string | null;
  cover_url: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  status: PackStatus;
  published_at: string | null;
  generated_at: string | null;
  scripts_count: number;
  scripts?: Script[];
};

export type Plan = {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
  interval: string;
  features: string[];
  active: boolean;
  sort_order: number;
};

export type ActionState = {
  ok: boolean;
  message: string;
};

export type CheckoutInput = {
  kind: OrderKind;
  slug: string;
  full_name: string;
  email: string;
  phone: string;
  payment_method: "pix" | "card";
};

export type PublicCustomer = {
  id: string;
  full_name: string;
  email: string;
  access_token: string;
};

export type Order = {
  id: string;
  code: string;
  customer_id: string;
  kind: OrderKind;
  status: OrderStatus;
  pack_id: string | null;
  plan_id: string | null;
  total_cents: number;
  payment_provider: string | null;
  payment_id: string | null;
  paid_at: string | null;
  created_at: string;
  pack?: Pick<Pack, "id" | "slug" | "title" | "week_start"> | null;
  plan?: Pick<Plan, "id" | "name" | "slug"> | null;
};

export type GeneratedScript = {
  title: string;
  hook: string;
  body: string;
  cta: string;
  caption: string;
  hashtags: string[];
  duration_seconds: number;
  score: number;
};
