-- Clã das Sombras — competition engine

create table if not exists public.competition_participant (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competition(id) on delete cascade,
  club_id uuid not null references public.club(id) on delete cascade,
  seed integer,
  status text not null default 'ACTIVE' check (status in ('PENDING','ACTIVE','ELIMINATED','WITHDRAWN','DISQUALIFIED','CHAMPION')),
  joined_at timestamptz not null default now(),
  unique(competition_id, club_id)
);

create table if not exists public.competition_round (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competition(id) on delete cascade,
  round_number integer not null check (round_number > 0),
  name text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'PENDING' check (status in ('PENDING','ACTIVE','COMPLETED')),
  unique(competition_id, round_number)
);

alter table public.match add column if not exists round_id uuid references public.competition_round(id) on delete set null;
alter table public.match add column if not exists leg integer not null default 1 check (leg > 0);
alter table public.match add column if not exists matchday integer check (matchday is null or matchday > 0);

create table if not exists public.league_standing (
  competition_id uuid not null references public.competition(id) on delete cascade,
  club_id uuid not null references public.club(id) on delete cascade,
  played integer not null default 0,
  won integer not null default 0,
  drawn integer not null default 0,
  lost integer not null default 0,
  goals_for integer not null default 0,
  goals_against integer not null default 0,
  points integer not null default 0,
  position integer,
  updated_at timestamptz not null default now(),
  primary key(competition_id, club_id)
);

create table if not exists public.match_dispute (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.match(id) on delete cascade,
  opened_by uuid not null references auth.users(id) on delete restrict,
  reason text not null,
  state text not null default 'OPEN' check (state in ('OPEN','UNDER_REVIEW','RESOLVED','REJECTED')),
  resolution text,
  resolved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create or replace function public.submit_match_result(
  p_match_id uuid,
  p_home_score integer,
  p_away_score integer,
  p_idempotency_key text
)
returns public.match
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.match;
  v_user_club uuid;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_home_score < 0 or p_away_score < 0 then raise exception 'invalid_score'; end if;

  select * into v_match from public.match where id = p_match_id for update;
  if not found then raise exception 'match_not_found'; end if;

  select id into v_user_club from public.club
  where user_id = auth.uid() and id in (v_match.home_club_id, v_match.away_club_id)
  limit 1;
  if v_user_club is null then raise exception 'not_match_participant'; end if;
  if v_match.state not in ('READY','PLAYED','RESULT_SUBMITTED') then raise exception 'match_not_submittable'; end if;

  update public.match
  set home_score = p_home_score,
      away_score = p_away_score,
      submitted_by = auth.uid(),
      submitted_at = now(),
      state = 'RESULT_SUBMITTED',
      result_metadata = coalesce(result_metadata,'{}'::jsonb) || jsonb_build_object('submission_key',p_idempotency_key),
      updated_at = now()
  where id = p_match_id
  returning * into v_match;

  return v_match;
end;
$$;

revoke all on function public.submit_match_result(uuid,integer,integer,text) from public;
grant execute on function public.submit_match_result(uuid,integer,integer,text) to authenticated;

create or replace function public.confirm_and_settle_match(
  p_match_id uuid,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.match;
  v_confirmer_club uuid;
  v_competition public.competition;
  v_settlement public.match_settlement;
  v_version integer;
  v_home_delta integer := 0;
  v_away_delta integer := 0;
  v_home_result text;
  v_away_result text;
  v_home_points integer := 0;
  v_away_points integer := 0;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;

  select * into v_match from public.match where id = p_match_id for update;
  if not found then raise exception 'match_not_found'; end if;
  if v_match.state = 'SETTLED' then
    select * into v_settlement from public.match_settlement where match_id = p_match_id and status='APPLIED' order by settlement_version desc limit 1;
    return jsonb_build_object('match_id',v_match.id,'settlement_id',v_settlement.id,'version',v_settlement.settlement_version,'home_elo_delta',coalesce((v_settlement.payload->>'home_elo_delta')::int,0),'away_elo_delta',coalesce((v_settlement.payload->>'away_elo_delta')::int,0),'standings_updated',true,'settled_at',v_match.settled_at);
  end if;
  if v_match.state <> 'RESULT_SUBMITTED' then raise exception 'result_not_awaiting_confirmation'; end if;
  if v_match.submitted_by = auth.uid() then raise exception 'opponent_confirmation_required'; end if;

  select id into v_confirmer_club from public.club
  where user_id = auth.uid() and id in (v_match.home_club_id, v_match.away_club_id)
  limit 1;
  if v_confirmer_club is null then raise exception 'not_match_participant'; end if;

  if v_match.home_score > v_match.away_score then
    v_home_result := 'W'; v_away_result := 'L'; v_home_points := 3; v_away_points := 0; v_home_delta := 16; v_away_delta := -16;
  elsif v_match.home_score < v_match.away_score then
    v_home_result := 'L'; v_away_result := 'W'; v_home_points := 0; v_away_points := 3; v_home_delta := -16; v_away_delta := 16;
  else
    v_home_result := 'D'; v_away_result := 'D'; v_home_points := 1; v_away_points := 1; v_home_delta := 0; v_away_delta := 0;
  end if;

  select * into v_competition from public.competition where id = v_match.competition_id;

  if v_competition.type = 'LEAGUE' then
    insert into public.league_standing(competition_id,club_id) values(v_competition.id,v_match.home_club_id) on conflict do nothing;
    insert into public.league_standing(competition_id,club_id) values(v_competition.id,v_match.away_club_id) on conflict do nothing;

    update public.league_standing set
      played=played+1,
      won=won + case when v_home_result='W' then 1 else 0 end,
      drawn=drawn + case when v_home_result='D' then 1 else 0 end,
      lost=lost + case when v_home_result='L' then 1 else 0 end,
      goals_for=goals_for+v_match.home_score,
      goals_against=goals_against+v_match.away_score,
      points=points+v_home_points,
      updated_at=now()
    where competition_id=v_competition.id and club_id=v_match.home_club_id;

    update public.league_standing set
      played=played+1,
      won=won + case when v_away_result='W' then 1 else 0 end,
      drawn=drawn + case when v_away_result='D' then 1 else 0 end,
      lost=lost + case when v_away_result='L' then 1 else 0 end,
      goals_for=goals_for+v_match.away_score,
      goals_against=goals_against+v_match.home_score,
      points=points+v_away_points,
      updated_at=now()
    where competition_id=v_competition.id and club_id=v_match.away_club_id;
  end if;

  update public.club set elo = greatest(0, elo + v_home_delta), updated_at=now() where id=v_match.home_club_id;
  update public.club set elo = greatest(0, elo + v_away_delta), updated_at=now() where id=v_match.away_club_id;

  select coalesce(max(settlement_version),0)+1 into v_version from public.match_settlement where match_id=p_match_id;
  insert into public.match_settlement(match_id,settlement_version,status,payload)
  values(p_match_id,v_version,'APPLIED',jsonb_build_object('idempotency_key',p_idempotency_key,'home_elo_delta',v_home_delta,'away_elo_delta',v_away_delta,'home_points',v_home_points,'away_points',v_away_points))
  returning * into v_settlement;

  update public.match set state='SETTLED', confirmed_at=now(), settled_at=now(), updated_at=now() where id=p_match_id returning * into v_match;

  return jsonb_build_object('match_id',v_match.id,'settlement_id',v_settlement.id,'version',v_version,'home_elo_delta',v_home_delta,'away_elo_delta',v_away_delta,'standings_updated',v_competition.type='LEAGUE','settled_at',v_match.settled_at);
end;
$$;

revoke all on function public.confirm_and_settle_match(uuid,text) from public;
grant execute on function public.confirm_and_settle_match(uuid,text) to authenticated;

create or replace function public.open_match_dispute(p_match_id uuid, p_reason text)
returns public.match_dispute
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.match;
  v_dispute public.match_dispute;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_match from public.match where id=p_match_id for update;
  if not found then raise exception 'match_not_found'; end if;
  if not exists(select 1 from public.club c where c.user_id=auth.uid() and c.id in (v_match.home_club_id,v_match.away_club_id)) then raise exception 'not_match_participant'; end if;
  if v_match.state not in ('RESULT_SUBMITTED','CONFIRMED','DISPUTED') then raise exception 'match_not_disputable'; end if;
  insert into public.match_dispute(match_id,opened_by,reason) values(p_match_id,auth.uid(),trim(p_reason)) returning * into v_dispute;
  update public.match set state='DISPUTED',updated_at=now() where id=p_match_id;
  return v_dispute;
end;
$$;

revoke all on function public.open_match_dispute(uuid,text) from public;
grant execute on function public.open_match_dispute(uuid,text) to authenticated;

alter table public.competition_participant enable row level security;
alter table public.competition_round enable row level security;
alter table public.league_standing enable row level security;
alter table public.match_dispute enable row level security;

create policy competition_participant_read on public.competition_participant for select to authenticated using (true);
create policy competition_round_read on public.competition_round for select to authenticated using (true);
create policy league_standing_read on public.league_standing for select to authenticated using (true);
create policy match_dispute_read on public.match_dispute for select to authenticated using (opened_by=auth.uid() or exists(select 1 from public.match m join public.club c on c.id in (m.home_club_id,m.away_club_id) where m.id=match_id and c.user_id=auth.uid()));
