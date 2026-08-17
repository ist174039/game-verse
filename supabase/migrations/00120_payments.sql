-- Clã das Sombras — Stripe / Gold purchasing

create table if not exists public.gold_package (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  gold_amount bigint not null check (gold_amount > 0),
  price_cents integer not null check (price_cents > 0),
  fiat_currency text not null default 'eur',
  stripe_price_id text unique,
  active boolean not null default false,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_order (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  package_id uuid references public.gold_package(id) on delete restrict,
  provider text not null default 'STRIPE' check (provider = 'STRIPE'),
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  amount_cents integer not null check (amount_cents >= 0),
  fiat_currency text not null default 'eur',
  gold_amount bigint not null check (gold_amount > 0),
  status text not null default 'PENDING' check (status in ('PENDING','PAID','EXPIRED','FAILED','REFUND_PENDING','PARTIALLY_REFUNDED','REFUNDED')),
  refunded_cents integer not null default 0 check (refunded_cents >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_order_user_idx on public.payment_order(user_id, created_at desc);
create index if not exists payment_order_payment_intent_idx on public.payment_order(stripe_payment_intent_id) where stripe_payment_intent_id is not null;

create trigger gold_package_updated_at before update on public.gold_package for each row execute function public.set_updated_at();
create trigger payment_order_updated_at before update on public.payment_order for each row execute function public.set_updated_at();

alter table public.gold_package enable row level security;
alter table public.payment_order enable row level security;

create policy "active gold packages readable" on public.gold_package
for select to authenticated using (active = true);

create policy "users read own payment orders" on public.payment_order
for select to authenticated using (user_id = auth.uid());

-- Browser clients cannot create/update payment orders. Server/service-role does it
-- after authenticating the current user and validating the package server-side.
