-- Gancho — schema inicial
-- Aplicar em um PROJETO SUPABASE NOVO (as tabelas genéricas aqui não coexistem
-- com as do evidence-reps). Supabase > SQL Editor > New query.

create extension if not exists "pgcrypto";

create type pack_status as enum ('draft', 'published', 'archived');
create type order_status as enum ('pending_payment', 'paid', 'cancelled', 'refunded', 'expired');
create type order_kind as enum ('pack', 'subscription');
create type subscription_status as enum ('pending', 'active', 'cancelled', 'expired');
create type generation_status as enum ('running', 'completed', 'failed');

-- ---------------------------------------------------------------------------
-- Conteúdo
-- ---------------------------------------------------------------------------

create table niches (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  description text,
  accent      text,
  sort_order  int default 0,
  active      boolean default true,
  created_at  timestamptz default now()
);

create table subniches (
  id          uuid primary key default gen_random_uuid(),
  niche_id    uuid not null references niches(id) on delete cascade,
  name        text not null,
  slug        text not null,
  description text,
  sort_order  int default 0,
  active      boolean default true,
  created_at  timestamptz default now(),
  unique (niche_id, slug)
);

create table packs (
  id                       uuid primary key default gen_random_uuid(),
  week_start               date unique not null,
  slug                     text unique not null,
  title                    text not null,
  summary                  text,
  cover_url                text,
  price_cents              integer not null check (price_cents >= 0),
  compare_at_price_cents   integer,
  status                   pack_status default 'draft',
  published_at             timestamptz,
  generated_at             timestamptz,
  model                    text,
  prompt_version           text,
  scripts_count            integer default 0,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

create table trend_signals (
  id            uuid primary key default gen_random_uuid(),
  pack_id       uuid not null references packs(id) on delete cascade,
  niche_id      uuid references niches(id) on delete set null,
  title         text not null,
  url           text,
  source        text,
  published_at  timestamptz,
  summary       text,
  score         real,
  created_at    timestamptz default now()
);

create table scripts (
  id                uuid primary key default gen_random_uuid(),
  pack_id           uuid not null references packs(id) on delete cascade,
  niche_id          uuid references niches(id) on delete set null,
  subniche_id       uuid references subniches(id) on delete set null,
  title             text not null,
  hook              text not null,
  body              text not null,
  cta               text not null,
  caption           text not null,
  hashtags          text[] default '{}',
  duration_seconds  integer default 45,
  score             real,
  position          integer default 0,
  created_at        timestamptz default now()
);

create index scripts_pack_position_idx on scripts (pack_id, position);

create table plans (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text unique not null,
  price_cents  integer not null check (price_cents >= 0),
  interval     text default 'monthly',
  features     jsonb default '[]'::jsonb,
  active       boolean default true,
  sort_order   int default 0,
  created_at   timestamptz default now()
);

create table generation_runs (
  id             uuid primary key default gen_random_uuid(),
  week_start     date not null,
  status         generation_status default 'running',
  pack_id        uuid references packs(id) on delete set null,
  scripts_count  integer default 0,
  signals_count  integer default 0,
  error          text,
  started_at     timestamptz default now(),
  finished_at    timestamptz
);

-- ---------------------------------------------------------------------------
-- Clientes, pedidos e pagamentos
-- ---------------------------------------------------------------------------

create table admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table customers (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  email        text not null unique,
  phone        text not null,
  access_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_at   timestamptz default now()
);

create table orders (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null,
  customer_id       uuid not null references customers(id) on delete restrict,
  kind              order_kind default 'pack',
  status            order_status default 'pending_payment',
  pack_id           uuid references packs(id) on delete set null,
  plan_id           uuid references plans(id) on delete set null,
  total_cents       integer not null,
  payment_provider  text,
  payment_id        text,
  paid_at           timestamptz,
  created_at        timestamptz default now()
);

create table order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id) on delete cascade,
  pack_id        uuid references packs(id) on delete set null,
  name_snapshot  text not null,
  price_cents    integer not null,
  qty            integer not null default 1 check (qty > 0)
);

create table payments (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid references orders(id) on delete cascade,
  provider              text not null,
  provider_payment_id   text unique,
  status                text not null,
  amount_cents          integer not null,
  payload               jsonb,
  created_at            timestamptz default now()
);

create table subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  customer_id             uuid not null references customers(id) on delete cascade,
  plan_id                 uuid not null references plans(id) on delete restrict,
  provider                text,
  provider_preapproval_id text unique,
  status                  subscription_status default 'pending',
  current_period_end      timestamptz,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now(),
  unique (customer_id, plan_id)
);

create table webhook_events (
  id            uuid primary key default gen_random_uuid(),
  provider      text not null,
  event_id      text not null,
  payload       jsonb,
  processed_at  timestamptz default now(),
  unique (provider, event_id)
);

create table settings (
  key   text primary key,
  value jsonb not null
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table niches           enable row level security;
alter table subniches        enable row level security;
alter table packs            enable row level security;
alter table trend_signals    enable row level security;
alter table scripts          enable row level security;
alter table plans            enable row level security;
alter table generation_runs  enable row level security;
alter table admins           enable row level security;
alter table customers        enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;
alter table payments         enable row level security;
alter table subscriptions    enable row level security;
alter table webhook_events   enable row level security;
alter table settings         enable row level security;

create policy "niches publicas" on niches for select using (active = true);
create policy "subniches publicas" on subniches for select using (active = true);
create policy "packs publicados" on packs for select using (status = 'published');
create policy "planos ativos" on plans for select using (active = true);

create policy "scripts de packs publicados" on scripts for select using (
  exists (select 1 from packs p where p.id = scripts.pack_id and p.status = 'published')
);

create policy "sinais de packs publicados" on trend_signals for select using (
  exists (select 1 from packs p where p.id = trend_signals.pack_id and p.status = 'published')
);

-- Demais tabelas: sem policy pública. Acesso somente via service_role.

-- Capas dos packs (leitura pública, escrita apenas pelo service_role no servidor).
insert into storage.buckets (id, name, public)
values ('pack-covers', 'pack-covers', true)
on conflict (id) do nothing;

create policy "capas publicas" on storage.objects for select
using (bucket_id = 'pack-covers');

-- ---------------------------------------------------------------------------
-- Seed
-- ---------------------------------------------------------------------------

insert into niches (name, slug, description, sort_order) values
  ('Finanças', 'financas', 'Renda, investimentos e organização sem juridiquês.', 0),
  ('Saúde & Treino', 'saude-e-treino', 'Treino, recuperação e hábitos com pé no chão.', 1),
  ('Tecnologia & IA', 'tecnologia-e-ia', 'Ferramentas, automação e o que muda na prática.', 2),
  ('Beleza & Estética', 'beleza-e-estetica', 'Rotinas, produtos e tendências sem promessa milagrosa.', 3),
  ('Alimentação', 'alimentacao', 'Comida de verdade, receitas e rotina na cozinha.', 4),
  ('Carreira & Negócios', 'carreira-e-negocios', 'Vendas, marketing e trabalho com linguagem de adulto.', 5),
  ('Casa & Decoração', 'casa-e-decoracao', 'Espaços menores, organização e reformas possíveis.', 6),
  ('Educação', 'educacao', 'Estudo, concursos e idiomas com método.', 7)
on conflict (slug) do nothing;

insert into subniches (niche_id, name, slug, sort_order)
select n.id, v.name, v.slug, v.ord
from (values
  ('financas', 'Investimentos', 'investimentos', 0),
  ('financas', 'Cartões', 'cartoes', 1),
  ('financas', 'Renda extra', 'renda-extra', 2),
  ('financas', 'Imposto de renda', 'imposto-de-renda', 3),
  ('saude-e-treino', 'Musculação', 'musculacao', 0),
  ('saude-e-treino', 'Emagrecimento', 'emagrecimento', 1),
  ('saude-e-treino', 'Corrida', 'corrida', 2),
  ('saude-e-treino', 'Recuperação', 'recuperacao', 3),
  ('tecnologia-e-ia', 'Ferramentas de IA', 'ferramentas-de-ia', 0),
  ('tecnologia-e-ia', 'Gadgets', 'gadgets', 1),
  ('tecnologia-e-ia', 'Automação', 'automacao', 2),
  ('tecnologia-e-ia', 'Privacidade', 'privacidade', 3),
  ('beleza-e-estetica', 'Skincare', 'skincare', 0),
  ('beleza-e-estetica', 'Maquiagem', 'maquiagem', 1),
  ('beleza-e-estetica', 'Cabelos', 'cabelos', 2),
  ('beleza-e-estetica', 'Procedimentos', 'procedimentos', 3),
  ('alimentacao', 'Receitas', 'receitas', 0),
  ('alimentacao', 'Dieta', 'dieta', 1),
  ('alimentacao', 'Organização', 'organizacao', 2),
  ('alimentacao', 'Bebidas', 'bebidas', 3),
  ('carreira-e-negocios', 'Empreendedorismo', 'empreendedorismo', 0),
  ('carreira-e-negocios', 'Vendas', 'vendas', 1),
  ('carreira-e-negocios', 'Marketing digital', 'marketing-digital', 2),
  ('carreira-e-negocios', 'Currículo', 'curriculo', 3),
  ('casa-e-decoracao', 'Organização', 'organizacao', 0),
  ('casa-e-decoracao', 'Reforma', 'reforma', 1),
  ('casa-e-decoracao', 'Jardinagem', 'jardinagem', 2),
  ('casa-e-decoracao', 'Limpeza', 'limpeza', 3),
  ('educacao', 'Concursos', 'concursos', 0),
  ('educacao', 'Vestibular', 'vestibular', 1),
  ('educacao', 'Idiomas', 'idiomas', 2),
  ('educacao', 'Técnicas de estudo', 'tecnicas-de-estudo', 3)
) as v(niche_slug, name, slug, ord)
join niches n on n.slug = v.niche_slug
on conflict (niche_id, slug) do nothing;

insert into plans (name, slug, price_cents, interval, features, sort_order) values
  ('Gancho Pro', 'pro', 3990, 'monthly',
   '["Todos os packs da semana", "Arquivo das semanas anteriores", "Novos roteiros toda segunda-feira", "Cancele quando quiser"]'::jsonb,
   0)
on conflict (slug) do nothing;

insert into settings (key, value) values
  ('site_name', '"Gancho"'::jsonb),
  ('whatsapp_number', '""'::jsonb),
  ('gateway_fee_pix_bps', '100'::jsonb),
  ('gateway_fee_card_bps', '399'::jsonb),
  ('gateway_fee_fixed_cents', '30'::jsonb),
  ('default_pack_price_cents', '1990'::jsonb)
on conflict (key) do nothing;
