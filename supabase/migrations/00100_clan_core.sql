-- Clã das Sombras — Core domain schema
-- Fresh-environment baseline. Ledger-first, universe-scoped competition/economy.

create extension if not exists pgcrypto;

-- ---------- ENUMS ----------
do $$ begin create type public.currency_code as enum ('GOLD','SILVER','BRONZE'); exception when duplicate_object then null; end $$;
do $$ begin create type public.universe_kind as enum ('MAIN','COMMUNITY'); exception when duplicate_object then null; end $$;
do $$ begin create type public.universe_state as enum ('DRAFT','CONFIGURING','OPEN_FOR_MEMBERS','ACTIVE','SEASON_RUNNING','SEASON_CLOSED','SUSPENDED','CANCELLED','ARCHIVED'); exception when duplicate_object then null; end $$;
do $$ begin create type public.universe_access_policy as enum ('PUBLIC','APPLICATION','INVITE_ONLY','PRIVATE'); exception when duplicate_object then null; end $$;
do $$ begin create type public.universe_role as enum ('OWNER','ADMIN','MODERATOR','MEMBER'); exception when duplicate_object then null; end $$;
do $$ begin create type public.economic_profile as enum ('HARDCORE','COMPETITIVE','STANDARD','OPEN','CUSTOM'); exception when duplicate_object then null; end $$;
do $$ begin create type public.financing_policy as enum ('DISABLED','LIMITED','STANDARD','OPEN'); exception when duplicate_object then null; end $$;
do $$ begin create type public.player_asset_status as enum ('AVAILABLE','OWNED','ACTIVE','RESERVE','LISTED','AUCTION','UNAVAILABLE','FREE_AGENT'); exception when duplicate_object then null; end $$;
do $$ begin create type public.competition_type as enum ('LEAGUE','CUP','TOURNAMENT','FRIENDLY_EVENT'); exception when duplicate_object then null; end $$;
do $$ begin create type public.match_state as enum ('SCHEDULED','READY','PLAYED','RESULT_SUBMITTED','CONFIRMED','DISPUTED','AUTO_CONFIRMED','SETTLED','CANCELLED'); exception when duplicate_object then null; end $$;
do $$ begin create type public.ledger_direction as enum ('DEBIT','CREDIT'); exception when duplicate_object then null; end $$;
do $$ begin create type public.ledger_scope as enum ('USER','CLUB','UNIVERSE','PLATFORM'); exception when duplicate_object then null; end $$;

-- ---------- GLOBAL USER IDENTITY ----------
create table if not exists public.user_profile (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  avatar_url text,
  locale text not null default 'pt',
  manager_level integer not null default 1 check (manager_level >= 1),
  manager_xp bigint not null default 0 check (manager_xp >= 0),
  reputation numeric(5,2) not null default 100 check (reputation between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Gold/Bronze are global user balances. Silver never belongs here.
create table if not exists public.user_currency_account (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  currency public.currency_code not null check (currency in ('GOLD','BRONZE')),
  balance bigint not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, currency)
);

-- ---------- UNIVERSES ----------
create table if not exists public.universe (
  id uuid primary key default gen_random_uuid(),
  kind public.universe_kind not null default 'COMMUNITY',
  name text not null,
  slug text not null unique,
  description text,
  owner_user_id uuid references auth.users(id) on delete restrict,
  state public.universe_state not null default 'DRAFT',
  access_policy public.universe_access_policy not null default 'APPLICATION',
  economic_profile public.economic_profile not null default 'STANDARD',
  financing_policy public.financing_policy not null default 'STANDARD',
  starting_silver bigint not null default 25000 check (starting_silver >= 0),
  external_financing_limit_pct numeric(6,2) not null default 50 check (external_financing_limit_pct >= 0),
  market_fee_pct numeric(6,3) not null default 5 check (market_fee_pct between 0 and 100),
  auction_fee_pct numeric(6,3) not null default 5 check (auction_fee_pct between 0 and 100),
  min_squad_size integer not null default 18 check (min_squad_size > 0),
  max_squad_size integer not null default 25 check (max_squad_size >= min_squad_size),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind = 'MAIN' and owner_user_id is null) or kind = 'COMMUNITY')
);

create table if not exists public.universe_membership (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.universe_role not null default 'MEMBER',
  joined_at timestamptz not null default now(),
  unique(universe_id, user_id)
);

create table if not exists public.club (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  name text not null,
  motto text,
  logo_url text,
  prestige bigint not null default 0 check (prestige >= 0),
  fans bigint not null default 0 check (fans >= 0),
  elo integer not null default 1200,
  reputation_score numeric(5,2) not null default 100 check (reputation_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(universe_id, user_id),
  unique(universe_id, name)
);

create table if not exists public.club_currency_account (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.club(id) on delete cascade,
  currency public.currency_code not null default 'SILVER' check (currency = 'SILVER'),
  balance bigint not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(club_id, currency)
);

create table if not exists public.universe_currency_account (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe(id) on delete cascade,
  currency public.currency_code not null default 'SILVER' check (currency = 'SILVER'),
  balance bigint not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(universe_id, currency)
);

-- ---------- LEDGER ----------
create table if not exists public.ledger_transaction (
  id uuid primary key default gen_random_uuid(),
  transaction_type text not null,
  idempotency_key text unique,
  reference_type text,
  reference_id uuid,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.ledger_entry (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.ledger_transaction(id) on delete restrict,
  direction public.ledger_direction not null,
  currency public.currency_code not null,
  scope public.ledger_scope not null,
  user_account_id uuid references public.user_currency_account(id) on delete restrict,
  club_account_id uuid references public.club_currency_account(id) on delete restrict,
  universe_account_id uuid references public.universe_currency_account(id) on delete restrict,
  amount bigint not null check (amount > 0),
  created_at timestamptz not null default now(),
  check (
    (scope = 'USER' and user_account_id is not null and club_account_id is null and universe_account_id is null) or
    (scope = 'CLUB' and club_account_id is not null and user_account_id is null and universe_account_id is null) or
    (scope = 'UNIVERSE' and universe_account_id is not null and user_account_id is null and club_account_id is null) or
    (scope = 'PLATFORM' and user_account_id is null and club_account_id is null and universe_account_id is null)
  )
);

create index if not exists ledger_entry_transaction_idx on public.ledger_entry(transaction_id);
create index if not exists ledger_entry_user_account_idx on public.ledger_entry(user_account_id) where user_account_id is not null;
create index if not exists ledger_entry_club_account_idx on public.ledger_entry(club_account_id) where club_account_id is not null;

-- ---------- PLAYERS ----------
create table if not exists public.player_master (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_id text not null,
  provider_version text,
  name text not null,
  position text not null,
  overall integer not null check (overall between 1 and 100),
  nationality text,
  image_url text,
  attributes jsonb not null default '{}'::jsonb,
  popularity_index numeric(8,3),
  updated_at timestamptz not null default now(),
  unique(provider, external_id)
);

create table if not exists public.universe_player (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe(id) on delete cascade,
  player_id uuid not null references public.player_master(id) on delete restrict,
  owner_club_id uuid references public.club(id) on delete set null,
  status public.player_asset_status not null default 'AVAILABLE',
  platform_price bigint not null default 0 check (platform_price >= 0),
  market_reference_value bigint not null default 0 check (market_reference_value >= 0),
  salary_reference bigint not null default 0 check (salary_reference >= 0),
  acquired_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(universe_id, player_id)
);

create index if not exists universe_player_owner_idx on public.universe_player(owner_club_id) where owner_club_id is not null;

create table if not exists public.player_contract (
  id uuid primary key default gen_random_uuid(),
  universe_player_id uuid not null references public.universe_player(id) on delete restrict,
  club_id uuid not null references public.club(id) on delete restrict,
  salary bigint not null check (salary >= 0),
  start_season_id uuid,
  end_season_id uuid,
  status text not null default 'ACTIVE',
  clauses jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- INFRASTRUCTURE ----------
create table if not exists public.club_infrastructure (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.club(id) on delete cascade,
  infrastructure_type text not null check (infrastructure_type in ('STADIUM','ACADEMY','TRAINING','MARKETING','FINANCE')),
  level integer not null default 1 check (level between 1 and 5),
  maintenance_cost bigint not null default 0 check (maintenance_cost >= 0),
  updated_at timestamptz not null default now(),
  unique(club_id, infrastructure_type)
);

-- ---------- SEASONS / COMPETITIONS / MATCHES ----------
create table if not exists public.season (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe(id) on delete cascade,
  name text not null,
  status text not null default 'DRAFT',
  starts_at timestamptz,
  ends_at timestamptz,
  registration_starts_at timestamptz,
  registration_ends_at timestamptz,
  rules_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(universe_id, name)
);

alter table public.player_contract
  add constraint player_contract_start_season_fk foreign key (start_season_id) references public.season(id) on delete set null;
alter table public.player_contract
  add constraint player_contract_end_season_fk foreign key (end_season_id) references public.season(id) on delete set null;

create table if not exists public.competition (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe(id) on delete cascade,
  season_id uuid references public.season(id) on delete restrict,
  type public.competition_type not null,
  name text not null,
  status text not null default 'DRAFT',
  rules jsonb not null default '{}'::jsonb,
  entry_fee bigint not null default 0 check (entry_fee >= 0),
  prize_pool bigint not null default 0 check (prize_pool >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.match (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe(id) on delete cascade,
  competition_id uuid references public.competition(id) on delete restrict,
  home_club_id uuid not null references public.club(id) on delete restrict,
  away_club_id uuid not null references public.club(id) on delete restrict,
  state public.match_state not null default 'SCHEDULED',
  scheduled_at timestamptz,
  home_score integer check (home_score >= 0),
  away_score integer check (away_score >= 0),
  submitted_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz,
  confirmed_at timestamptz,
  settled_at timestamptz,
  result_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (home_club_id <> away_club_id)
);

create table if not exists public.match_evidence (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.match(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  file_path text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.match_settlement (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.match(id) on delete restrict,
  settlement_version integer not null default 1,
  status text not null check (status in ('APPLIED','REVERSED')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique(match_id, settlement_version)
);

-- ---------- MARKET ----------
create table if not exists public.market_listing (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe(id) on delete cascade,
  universe_player_id uuid not null references public.universe_player(id) on delete restrict,
  seller_club_id uuid not null references public.club(id) on delete restrict,
  listing_type text not null check (listing_type in ('DIRECT','AUCTION')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','SOLD','CANCELLED','EXPIRED')),
  asking_price bigint check (asking_price >= 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  buy_now_price bigint check (buy_now_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.auction_bid (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.market_listing(id) on delete cascade,
  bidder_club_id uuid not null references public.club(id) on delete restrict,
  amount bigint not null check (amount > 0),
  created_at timestamptz not null default now()
);

-- ---------- COMMUNITY / SOCIAL ----------
create table if not exists public.community (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text,
  visibility text not null default 'PUBLIC' check (visibility in ('PUBLIC','PRIVATE','INVITE_ONLY','APPROVAL_REQUIRED')),
  created_at timestamptz not null default now()
);

create table if not exists public.community_membership (
  community_id uuid not null references public.community(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'MEMBER' check (role in ('OWNER','ADMIN','MODERATOR','MEMBER')),
  joined_at timestamptz not null default now(),
  primary key(community_id, user_id)
);

create table if not exists public.community_universe (
  community_id uuid not null references public.community(id) on delete cascade,
  universe_id uuid not null references public.universe(id) on delete cascade,
  primary key(community_id, universe_id)
);

create table if not exists public.follow (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(follower_id, followed_id),
  check (follower_id <> followed_id)
);

create table if not exists public.friendship (
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING','ACCEPTED','BLOCKED')),
  created_at timestamptz not null default now(),
  primary key(user_a, user_b),
  check (user_a <> user_b)
);

-- ---------- AUDIT ----------
create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  old_state jsonb,
  new_state jsonb,
  reason text,
  ticket_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- UPDATED_AT ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare t text;
begin
  foreach t in array array['user_profile','user_currency_account','universe','club','club_currency_account','universe_currency_account','universe_player','player_contract','club_infrastructure','match','market_listing']
  loop
    execute format('drop trigger if exists %I_updated_at on public.%I', t, t);
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ---------- RLS BASELINE ----------
alter table public.user_profile enable row level security;
alter table public.user_currency_account enable row level security;
alter table public.universe enable row level security;
alter table public.universe_membership enable row level security;
alter table public.club enable row level security;
alter table public.club_currency_account enable row level security;
alter table public.universe_currency_account enable row level security;
alter table public.player_master enable row level security;
alter table public.universe_player enable row level security;
alter table public.player_contract enable row level security;
alter table public.club_infrastructure enable row level security;
alter table public.season enable row level security;
alter table public.competition enable row level security;
alter table public.match enable row level security;
alter table public.match_evidence enable row level security;
alter table public.market_listing enable row level security;
alter table public.auction_bid enable row level security;
alter table public.community enable row level security;
alter table public.community_membership enable row level security;
alter table public.follow enable row level security;
alter table public.friendship enable row level security;

create policy "profiles readable authenticated" on public.user_profile for select to authenticated using (true);
create policy "profile owner updates own profile" on public.user_profile for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "own global currency readable" on public.user_currency_account for select to authenticated using (user_id = auth.uid());
create policy "universes readable authenticated" on public.universe for select to authenticated using (state <> 'CANCELLED');
create policy "memberships visible to member" on public.universe_membership for select to authenticated using (user_id = auth.uid());
create policy "clubs readable authenticated" on public.club for select to authenticated using (true);
create policy "own club silver readable" on public.club_currency_account for select to authenticated using (exists(select 1 from public.club c where c.id = club_id and c.user_id = auth.uid()));
create policy "players readable authenticated" on public.player_master for select to authenticated using (true);
create policy "universe players readable authenticated" on public.universe_player for select to authenticated using (true);
create policy "own contracts readable" on public.player_contract for select to authenticated using (exists(select 1 from public.club c where c.id = club_id and c.user_id = auth.uid()));
create policy "infrastructure readable" on public.club_infrastructure for select to authenticated using (true);
create policy "seasons readable" on public.season for select to authenticated using (true);
create policy "competitions readable" on public.competition for select to authenticated using (true);
create policy "matches readable" on public.match for select to authenticated using (true);
create policy "market readable" on public.market_listing for select to authenticated using (true);
create policy "communities readable" on public.community for select to authenticated using (visibility = 'PUBLIC' or owner_user_id = auth.uid() or exists(select 1 from public.community_membership cm where cm.community_id = id and cm.user_id = auth.uid()));
create policy "own community memberships" on public.community_membership for select to authenticated using (user_id = auth.uid());
create policy "follows visible to actor" on public.follow for select to authenticated using (follower_id = auth.uid() or followed_id = auth.uid());
create policy "friendships visible to actor" on public.friendship for select to authenticated using (user_a = auth.uid() or user_b = auth.uid());

-- No direct INSERT/UPDATE policies for balances, market settlement, match settlement,
-- universe treasury or admin audit. Those operations must go through vetted server-side
-- functions/service-role workflows added in subsequent migrations.
