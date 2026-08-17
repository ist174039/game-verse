-- Clã das Sombras — recurring club economy and retention

create table if not exists public.sponsorship_contract (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe(id) on delete cascade,
  club_id uuid not null references public.club(id) on delete cascade,
  name text not null,
  state text not null default 'OFFERED' check (state in ('OFFERED','ACTIVE','COMPLETED','BREACHED','CANCELLED')),
  signing_bonus bigint not null default 0 check (signing_bonus >= 0),
  periodic_payment bigint not null default 0 check (periodic_payment >= 0),
  objective_bonus bigint not null default 0 check (objective_bonus >= 0),
  objectives jsonb not null default '{}'::jsonb,
  starts_at timestamptz not null default now(),
  ends_at timestamptz
);

create table if not exists public.club_loan (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid not null references public.universe(id) on delete cascade,
  club_id uuid not null references public.club(id) on delete cascade,
  principal bigint not null check (principal > 0),
  outstanding_principal bigint not null check (outstanding_principal >= 0),
  interest_rate_pct numeric(8,4) not null default 0 check (interest_rate_pct >= 0),
  installments integer not null check (installments > 0),
  installments_paid integer not null default 0 check (installments_paid >= 0),
  state text not null default 'ACTIVE' check (state in ('OFFERED','ACTIVE','REPAID','DEFAULTED','CANCELLED')),
  originated_at timestamptz not null default now(),
  next_payment_at timestamptz
);

create table if not exists public.club_financial_cycle (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.club(id) on delete cascade,
  cycle_key text not null,
  payroll bigint not null default 0,
  maintenance bigint not null default 0,
  match_operating_cost bigint not null default 0,
  sponsorship_income bigint not null default 0,
  stadium_income bigint not null default 0,
  other_income bigint not null default 0,
  net_result bigint not null default 0,
  settled_at timestamptz,
  unique(club_id, cycle_key)
);

create table if not exists public.mission_definition (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  cadence text not null check (cadence in ('DAILY','WEEKLY','SEASONAL','ONE_TIME')),
  target integer not null check (target > 0),
  reward_bronze bigint not null default 0 check (reward_bronze >= 0),
  reward_manager_xp bigint not null default 0 check (reward_manager_xp >= 0),
  active boolean not null default true,
  criteria jsonb not null default '{}'::jsonb
);

create table if not exists public.user_mission (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid not null references public.mission_definition(id) on delete cascade,
  period_key text not null,
  progress integer not null default 0 check (progress >= 0),
  state text not null default 'ACTIVE' check (state in ('ACTIVE','COMPLETED','CLAIMED','EXPIRED')),
  completed_at timestamptz,
  claimed_at timestamptz,
  unique(user_id, mission_id, period_key)
);

create table if not exists public.achievement_definition (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  tier text not null check (tier in ('BRONZE','SILVER','GOLD','LEGENDARY')),
  reward_bronze bigint not null default 0 check (reward_bronze >= 0),
  reward_manager_xp bigint not null default 0 check (reward_manager_xp >= 0),
  criteria jsonb not null default '{}'::jsonb
);

create table if not exists public.user_achievement (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievement_definition(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique(user_id, achievement_id)
);

create table if not exists public.daily_reward_claim (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  claim_date date not null default current_date,
  streak integer not null default 1 check (streak > 0),
  reward_bronze bigint not null default 0 check (reward_bronze >= 0),
  reward_manager_xp bigint not null default 0 check (reward_manager_xp >= 0),
  claimed_at timestamptz not null default now(),
  unique(user_id, claim_date)
);

create table if not exists public.bronze_store_item (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null check (category in ('COSMETIC','BADGE','FRAME','CLUB_CUSTOMIZATION','COLLECTIBLE')),
  price_bronze bigint not null check (price_bronze > 0),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.bronze_purchase (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.bronze_store_item(id) on delete restrict,
  price_bronze bigint not null check (price_bronze > 0),
  ledger_transaction_id uuid references public.ledger_transaction(id) on delete restrict,
  purchased_at timestamptz not null default now()
);

create or replace function public.claim_daily_reward(p_idempotency_key text)
returns public.daily_reward_claim
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last public.daily_reward_claim;
  v_claim public.daily_reward_claim;
  v_streak integer := 1;
  v_bronze bigint;
  v_xp bigint;
  v_tx uuid;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_claim from public.daily_reward_claim where user_id=auth.uid() and claim_date=current_date;
  if found then return v_claim; end if;

  select * into v_last from public.daily_reward_claim where user_id=auth.uid() order by claim_date desc limit 1;
  if found and v_last.claim_date = current_date - 1 then v_streak := least(v_last.streak + 1, 30); end if;
  v_bronze := 25 + least(v_streak, 7) * 5;
  v_xp := 10 + least(v_streak, 7) * 2;

  select public.service_grant_user_currency(auth.uid(),'BRONZE',v_bronze,'DAILY_REWARD','Daily engagement reward',p_idempotency_key) into v_tx;
  update public.user_profile set manager_xp = manager_xp + v_xp, updated_at=now() where id=auth.uid();

  insert into public.daily_reward_claim(user_id,claim_date,streak,reward_bronze,reward_manager_xp)
  values(auth.uid(),current_date,v_streak,v_bronze,v_xp)
  returning * into v_claim;
  return v_claim;
end;
$$;

revoke all on function public.claim_daily_reward(text) from public;
grant execute on function public.claim_daily_reward(text) to authenticated;

create or replace function public.buy_bronze_item(p_item_id uuid, p_idempotency_key text)
returns public.bronze_purchase
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.bronze_store_item;
  v_purchase public.bronze_purchase;
  v_tx uuid;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_item from public.bronze_store_item where id=p_item_id and active=true for update;
  if not found then raise exception 'store_item_not_available'; end if;
  select public.service_debit_user_currency(auth.uid(),'BRONZE',v_item.price_bronze,'BRONZE_STORE_PURCHASE','Bronze store purchase',p_idempotency_key) into v_tx;
  insert into public.bronze_purchase(user_id,item_id,price_bronze,ledger_transaction_id)
  values(auth.uid(),v_item.id,v_item.price_bronze,v_tx) returning * into v_purchase;
  return v_purchase;
end;
$$;

revoke all on function public.buy_bronze_item(uuid,text) from public;
grant execute on function public.buy_bronze_item(uuid,text) to authenticated;

alter table public.sponsorship_contract enable row level security;
alter table public.club_loan enable row level security;
alter table public.club_financial_cycle enable row level security;
alter table public.mission_definition enable row level security;
alter table public.user_mission enable row level security;
alter table public.achievement_definition enable row level security;
alter table public.user_achievement enable row level security;
alter table public.daily_reward_claim enable row level security;
alter table public.bronze_store_item enable row level security;
alter table public.bronze_purchase enable row level security;

create policy sponsorship_own_club_read on public.sponsorship_contract for select to authenticated using (exists(select 1 from public.club c where c.id=club_id and c.user_id=auth.uid()));
create policy loan_own_club_read on public.club_loan for select to authenticated using (exists(select 1 from public.club c where c.id=club_id and c.user_id=auth.uid()));
create policy financial_cycle_own_club_read on public.club_financial_cycle for select to authenticated using (exists(select 1 from public.club c where c.id=club_id and c.user_id=auth.uid()));
create policy mission_definition_read on public.mission_definition for select to authenticated using (active=true);
create policy user_mission_own_read on public.user_mission for select to authenticated using (user_id=auth.uid());
create policy achievement_definition_read on public.achievement_definition for select to authenticated using (true);
create policy user_achievement_own_read on public.user_achievement for select to authenticated using (user_id=auth.uid());
create policy daily_reward_own_read on public.daily_reward_claim for select to authenticated using (user_id=auth.uid());
create policy bronze_store_read on public.bronze_store_item for select to authenticated using (active=true);
create policy bronze_purchase_own_read on public.bronze_purchase for select to authenticated using (user_id=auth.uid());
