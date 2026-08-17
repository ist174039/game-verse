-- Clã das Sombras — Platform governance, configuration and backoffice

do $$ begin create type public.ticket_status as enum ('OPEN','IN_PROGRESS','WAITING_USER','WAITING_INTERNAL','RESOLVED','CLOSED'); exception when duplicate_object then null; end $$;
do $$ begin create type public.case_status as enum ('OPEN','INVESTIGATING','ACTION_REQUIRED','RESOLVED','DISMISSED'); exception when duplicate_object then null; end $$;

create table if not exists public.platform_config (
  key text primary key,
  category text not null,
  value jsonb not null,
  version integer not null default 1 check (version > 0),
  effective_from timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_config_history (
  id bigint generated always as identity primary key,
  key text not null,
  category text not null,
  value jsonb not null,
  version integer not null,
  effective_from timestamptz not null,
  changed_by uuid references auth.users(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique(key,version)
);

create table if not exists public.feature_flag (
  key text primary key,
  enabled boolean not null default false,
  scope text not null default 'GLOBAL' check (scope in ('GLOBAL','ENVIRONMENT','UNIVERSE','COHORT')),
  scope_reference text,
  configuration jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.support_ticket (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid references auth.users(id) on delete set null,
  club_id uuid references public.club(id) on delete set null,
  universe_id uuid references public.universe(id) on delete set null,
  category text not null check (category in ('PAYMENT','ECONOMY','MATCH','MARKET','ACCOUNT','UNIVERSE','MODERATION','TECHNICAL','OTHER')),
  priority text not null default 'NORMAL' check (priority in ('LOW','NORMAL','HIGH','CRITICAL')),
  status public.ticket_status not null default 'OPEN',
  subject text not null,
  description text not null,
  assigned_admin_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ticket_note (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_ticket(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  internal boolean not null default true,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.moderation_case (
  id uuid primary key default gen_random_uuid(),
  case_type text not null check (case_type in ('RESULT_DISPUTE','SOCIAL_REPORT','FRAUD','APPEAL','PAYMENT_RISK','OTHER')),
  status public.case_status not null default 'OPEN',
  severity text not null default 'MEDIUM' check (severity in ('LOW','MEDIUM','HIGH','CRITICAL')),
  reporter_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  target_club_id uuid references public.club(id) on delete set null,
  target_universe_id uuid references public.universe(id) on delete set null,
  match_id uuid references public.match(id) on delete set null,
  assigned_admin_id uuid references auth.users(id) on delete set null,
  summary text not null,
  evidence jsonb not null default '[]'::jsonb,
  signals jsonb not null default '{}'::jsonb,
  resolution jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.economic_freeze (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('USER','CLUB','UNIVERSE')),
  user_id uuid references auth.users(id) on delete cascade,
  club_id uuid references public.club(id) on delete cascade,
  universe_id uuid references public.universe(id) on delete cascade,
  reason text not null,
  case_id uuid references public.moderation_case(id) on delete set null,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  released_by uuid references auth.users(id) on delete set null,
  released_at timestamptz,
  check (
    (scope='USER' and user_id is not null and club_id is null and universe_id is null) or
    (scope='CLUB' and club_id is not null and user_id is null and universe_id is null) or
    (scope='UNIVERSE' and universe_id is not null and user_id is null and club_id is null)
  )
);

create unique index if not exists active_user_freeze_idx on public.economic_freeze(user_id) where active and scope='USER';
create unique index if not exists active_club_freeze_idx on public.economic_freeze(club_id) where active and scope='CLUB';
create unique index if not exists active_universe_freeze_idx on public.economic_freeze(universe_id) where active and scope='UNIVERSE';

create table if not exists public.policy_version (
  id uuid primary key default gen_random_uuid(),
  policy_key text not null,
  version integer not null check (version > 0),
  title text not null,
  content jsonb not null,
  effective_from timestamptz not null,
  published_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(policy_key,version)
);

create trigger platform_config_updated_at before update on public.platform_config for each row execute function public.set_updated_at();
create trigger feature_flag_updated_at before update on public.feature_flag for each row execute function public.set_updated_at();
create trigger support_ticket_updated_at before update on public.support_ticket for each row execute function public.set_updated_at();
create trigger moderation_case_updated_at before update on public.moderation_case for each row execute function public.set_updated_at();

alter table public.platform_config enable row level security;
alter table public.platform_config_history enable row level security;
alter table public.feature_flag enable row level security;
alter table public.support_ticket enable row level security;
alter table public.ticket_note enable row level security;
alter table public.moderation_case enable row level security;
alter table public.economic_freeze enable row level security;
alter table public.policy_version enable row level security;

-- End-users can see only their own non-internal tickets. All administration and
-- governance writes are service-role/server workflows with explicit RBAC + audit.
create policy "requester reads own tickets" on public.support_ticket
for select to authenticated using (requester_user_id = auth.uid());

create policy "requester reads public ticket notes" on public.ticket_note
for select to authenticated using (
  internal = false and exists(
    select 1 from public.support_ticket t
    where t.id = ticket_id and t.requester_user_id = auth.uid()
  )
);

create policy "effective policies readable" on public.policy_version
for select to authenticated using (effective_from <= now());
