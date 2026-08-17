-- Clã das Sombras — competition registration, divisions and season progression

create table if not exists public.competition_registration (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competition(id) on delete cascade,
  club_id uuid not null references public.club(id) on delete cascade,
  state text not null default 'REGISTERED' check (state in ('REGISTERED','APPROVED','REJECTED','WITHDRAWN')),
  registered_at timestamptz not null default now(),
  approved_at timestamptz,
  unique(competition_id,club_id)
);

create table if not exists public.competition_division (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competition(id) on delete cascade,
  code text not null,
  name text not null,
  level integer not null check (level > 0),
  capacity integer check (capacity is null or capacity > 1),
  promotion_slots integer not null default 0 check (promotion_slots >= 0),
  relegation_slots integer not null default 0 check (relegation_slots >= 0),
  metadata jsonb not null default '{}'::jsonb,
  unique(competition_id,code),
  unique(competition_id,level)
);

create table if not exists public.division_membership (
  id uuid primary key default gen_random_uuid(),
  division_id uuid not null references public.competition_division(id) on delete cascade,
  club_id uuid not null references public.club(id) on delete cascade,
  season_id uuid references public.season(id) on delete cascade,
  seed integer,
  created_at timestamptz not null default now(),
  unique(division_id,club_id,season_id)
);

create table if not exists public.season_placement (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.season(id) on delete cascade,
  competition_id uuid not null references public.competition(id) on delete cascade,
  division_id uuid references public.competition_division(id) on delete set null,
  club_id uuid not null references public.club(id) on delete cascade,
  final_position integer not null check (final_position > 0),
  outcome text not null default 'STAY' check (outcome in ('CHAMPION','PROMOTED','STAY','RELEGATED','ELIMINATED')),
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(season_id,competition_id,club_id)
);

create table if not exists public.cup_tie (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competition(id) on delete cascade,
  round_number integer not null check (round_number > 0),
  tie_number integer not null check (tie_number > 0),
  home_club_id uuid references public.club(id) on delete restrict,
  away_club_id uuid references public.club(id) on delete restrict,
  match_id uuid references public.match(id) on delete set null,
  winner_club_id uuid references public.club(id) on delete set null,
  state text not null default 'PENDING' check (state in ('PENDING','READY','PLAYED','SETTLED')),
  unique(competition_id,round_number,tie_number)
);

create or replace function public.register_for_competition(p_competition_id uuid)
returns public.competition_registration
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comp public.competition;
  v_club public.club;
  v_reg public.competition_registration;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_comp from public.competition where id=p_competition_id;
  if not found then raise exception 'competition_not_found'; end if;
  if v_comp.status not in ('DRAFT','REGISTRATION','OPEN') then raise exception 'registration_closed'; end if;
  select * into v_club from public.club where universe_id=v_comp.universe_id and user_id=auth.uid();
  if not found then raise exception 'club_required_in_universe'; end if;
  insert into public.competition_registration(competition_id,club_id)
  values(p_competition_id,v_club.id)
  on conflict(competition_id,club_id) do update set state='REGISTERED',registered_at=now()
  returning * into v_reg;
  return v_reg;
end;
$$;
revoke all on function public.register_for_competition(uuid) from public;
grant execute on function public.register_for_competition(uuid) to authenticated;

create or replace function public.service_snapshot_league_placements(
  p_competition_id uuid,
  p_division_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comp public.competition;
  v_div public.competition_division;
  v_row record;
  v_count integer := 0;
  v_outcome text;
begin
  select * into v_comp from public.competition where id=p_competition_id;
  if not found then raise exception 'competition_not_found'; end if;
  if v_comp.type <> 'LEAGUE' then raise exception 'league_required'; end if;
  if v_comp.season_id is null then raise exception 'season_required'; end if;
  if p_division_id is not null then
    select * into v_div from public.competition_division where id=p_division_id and competition_id=p_competition_id;
    if not found then raise exception 'division_not_found'; end if;
  end if;

  for v_row in
    select s.club_id,s.position,s.played,s.won,s.drawn,s.lost,s.goals_for,s.goals_against,s.goal_difference,s.points
    from public.competition_standing s
    where s.competition_id=p_competition_id
      and (p_division_id is null or exists(select 1 from public.division_membership dm where dm.division_id=p_division_id and dm.club_id=s.club_id and dm.season_id=v_comp.season_id))
    order by s.position asc
  loop
    v_outcome := 'STAY';
    if v_row.position=1 then v_outcome := 'CHAMPION';
    elsif p_division_id is not null and v_div.promotion_slots>0 and v_row.position<=v_div.promotion_slots then v_outcome := 'PROMOTED';
    elsif p_division_id is not null and v_div.relegation_slots>0 and v_row.position > (select count(*) from public.competition_standing cs where cs.competition_id=p_competition_id)-v_div.relegation_slots then v_outcome := 'RELEGATED';
    end if;

    insert into public.season_placement(season_id,competition_id,division_id,club_id,final_position,outcome,snapshot)
    values(v_comp.season_id,p_competition_id,p_division_id,v_row.club_id,v_row.position,v_outcome,
      jsonb_build_object('played',v_row.played,'won',v_row.won,'drawn',v_row.drawn,'lost',v_row.lost,'goals_for',v_row.goals_for,'goals_against',v_row.goals_against,'goal_difference',v_row.goal_difference,'points',v_row.points))
    on conflict(season_id,competition_id,club_id) do update set division_id=excluded.division_id,final_position=excluded.final_position,outcome=excluded.outcome,snapshot=excluded.snapshot;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;
revoke all on function public.service_snapshot_league_placements(uuid,uuid) from public;
grant execute on function public.service_snapshot_league_placements(uuid,uuid) to service_role;

create or replace function public.service_progress_cup_tie(p_tie_id uuid)
returns public.cup_tie
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tie public.cup_tie;
  v_match public.match;
begin
  select * into v_tie from public.cup_tie where id=p_tie_id for update;
  if not found then raise exception 'cup_tie_not_found'; end if;
  if v_tie.match_id is null then raise exception 'cup_match_missing'; end if;
  select * into v_match from public.match where id=v_tie.match_id;
  if v_match.state <> 'SETTLED' then raise exception 'match_not_settled'; end if;
  if v_match.home_score=v_match.away_score then raise exception 'cup_tie_requires_winner'; end if;
  update public.cup_tie set winner_club_id=case when v_match.home_score>v_match.away_score then v_match.home_club_id else v_match.away_club_id end,state='SETTLED' where id=p_tie_id returning * into v_tie;
  return v_tie;
end;
$$;
revoke all on function public.service_progress_cup_tie(uuid) from public;
grant execute on function public.service_progress_cup_tie(uuid) to service_role;

alter table public.competition_registration enable row level security;
alter table public.competition_division enable row level security;
alter table public.division_membership enable row level security;
alter table public.season_placement enable row level security;
alter table public.cup_tie enable row level security;
create policy competition_registration_read on public.competition_registration for select to authenticated using (true);
create policy competition_division_read on public.competition_division for select to authenticated using (true);
create policy division_membership_read on public.division_membership for select to authenticated using (true);
create policy season_placement_read on public.season_placement for select to authenticated using (true);
create policy cup_tie_read on public.cup_tie for select to authenticated using (true);
