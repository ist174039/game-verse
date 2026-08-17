-- Clã das Sombras — competition activation, scheduling, progression and prize settlement
-- Apply after 00270_admin_operational_commands.sql.

create table if not exists public.competition_prize_settlement (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competition(id) on delete restrict,
  recipient_club_id uuid not null references public.club(id) on delete restrict,
  amount bigint not null check (amount > 0),
  ledger_transaction_id uuid not null references public.ledger_transaction(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(competition_id)
);

alter table public.competition_prize_settlement enable row level security;
drop policy if exists competition_prize_settlement_read on public.competition_prize_settlement;
create policy competition_prize_settlement_read on public.competition_prize_settlement for select to authenticated using (true);

-- Correct the old placement snapshot: the canonical table is league_standing.
create or replace function public.service_snapshot_league_placements(
  p_competition_id uuid,
  p_division_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  v_comp public.competition;
  v_div public.competition_division;
  v_row record;
  v_count integer:=0;
  v_total integer:=0;
  v_outcome text;
begin
  select * into v_comp from public.competition where id=p_competition_id;
  if not found then raise exception 'competition_not_found'; end if;
  if v_comp.type<>'LEAGUE' then raise exception 'league_required'; end if;
  if v_comp.season_id is null then return 0; end if;

  if p_division_id is not null then
    select * into v_div from public.competition_division where id=p_division_id and competition_id=p_competition_id;
    if not found then raise exception 'division_not_found'; end if;
  end if;

  select count(*) into v_total
  from public.league_standing s
  where s.competition_id=p_competition_id
    and (p_division_id is null or exists(
      select 1 from public.division_membership dm
      where dm.division_id=p_division_id and dm.club_id=s.club_id and dm.season_id=v_comp.season_id
    ));

  for v_row in
    select s.club_id,s.position,s.played,s.won,s.drawn,s.lost,s.goals_for,s.goals_against,s.points
    from public.league_standing s
    where s.competition_id=p_competition_id
      and (p_division_id is null or exists(
        select 1 from public.division_membership dm
        where dm.division_id=p_division_id and dm.club_id=s.club_id and dm.season_id=v_comp.season_id
      ))
    order by s.position asc nulls last
  loop
    v_outcome:='STAY';
    if p_division_id is null and v_row.position=1 then
      v_outcome:='CHAMPION';
    elsif p_division_id is not null and v_div.level=1 and v_row.position=1 then
      v_outcome:='CHAMPION';
    elsif p_division_id is not null and v_div.promotion_slots>0 and v_row.position<=v_div.promotion_slots then
      v_outcome:='PROMOTED';
    elsif p_division_id is not null and v_div.relegation_slots>0 and v_row.position>v_total-v_div.relegation_slots then
      v_outcome:='RELEGATED';
    end if;

    insert into public.season_placement(season_id,competition_id,division_id,club_id,final_position,outcome,snapshot)
    values(v_comp.season_id,p_competition_id,p_division_id,v_row.club_id,v_row.position,v_outcome,
      jsonb_build_object(
        'played',v_row.played,'won',v_row.won,'drawn',v_row.drawn,'lost',v_row.lost,
        'goals_for',v_row.goals_for,'goals_against',v_row.goals_against,
        'goal_difference',v_row.goals_for-v_row.goals_against,'points',v_row.points
      ))
    on conflict(season_id,competition_id,club_id) do update
      set division_id=excluded.division_id,final_position=excluded.final_position,outcome=excluded.outcome,snapshot=excluded.snapshot;
    v_count:=v_count+1;
  end loop;
  return v_count;
end;
$$;
revoke all on function public.service_snapshot_league_placements(uuid,uuid) from public;
grant execute on function public.service_snapshot_league_placements(uuid,uuid) to service_role;

create or replace function public.service_settle_competition_prize(
  p_competition_id uuid,
  p_winner_club_id uuid,
  p_actor_user_id uuid default null
)
returns public.competition_prize_settlement
language plpgsql
security definer
set search_path=public
as $$
declare
  v_comp public.competition;
  v_existing public.competition_prize_settlement;
  v_universe_account public.universe_currency_account;
  v_club_account public.club_currency_account;
  v_tx public.ledger_transaction;
  v_result public.competition_prize_settlement;
  v_pct numeric:=100;
  v_amount bigint;
begin
  select * into v_existing from public.competition_prize_settlement where competition_id=p_competition_id;
  if found then return v_existing; end if;

  select * into v_comp from public.competition where id=p_competition_id for update;
  if not found then raise exception 'competition_not_found'; end if;
  if v_comp.status<>'COMPLETED' then raise exception 'competition_not_completed'; end if;
  if not exists(select 1 from public.club where id=p_winner_club_id and universe_id=v_comp.universe_id) then raise exception 'winner_not_in_universe'; end if;
  if v_comp.prize_pool<=0 then raise exception 'competition_has_no_prize_pool'; end if;

  if coalesce(v_comp.rules->>'champion_prize_pct','')<>'' then
    v_pct:=(v_comp.rules->>'champion_prize_pct')::numeric;
  end if;
  if v_pct<=0 or v_pct>100 then raise exception 'invalid_champion_prize_pct'; end if;
  v_amount:=floor(v_comp.prize_pool*v_pct/100.0)::bigint;
  if v_amount<=0 then raise exception 'competition_prize_is_zero'; end if;

  select * into v_universe_account from public.universe_currency_account
  where universe_id=v_comp.universe_id and currency='SILVER' for update;
  if not found then raise exception 'universe_silver_account_not_found'; end if;
  if v_universe_account.balance<v_amount then raise exception 'competition_prize_pool_unfunded'; end if;

  insert into public.club_currency_account(club_id,currency,balance)
  values(p_winner_club_id,'SILVER',0) on conflict(club_id,currency) do nothing;
  select * into v_club_account from public.club_currency_account where club_id=p_winner_club_id and currency='SILVER' for update;

  insert into public.ledger_transaction(transaction_type,idempotency_key,reference_type,reference_id,reason,created_by,metadata)
  values('COMPETITION_PRIZE',format('competition_prize_%s',p_competition_id),'COMPETITION',p_competition_id,'Competition champion prize',p_actor_user_id,
    jsonb_build_object('winner_club_id',p_winner_club_id,'prize_pool',v_comp.prize_pool,'champion_prize_pct',v_pct))
  returning * into v_tx;

  insert into public.ledger_entry(transaction_id,direction,currency,scope,universe_account_id,amount)
  values(v_tx.id,'DEBIT','SILVER','UNIVERSE',v_universe_account.id,v_amount);
  insert into public.ledger_entry(transaction_id,direction,currency,scope,club_account_id,amount)
  values(v_tx.id,'CREDIT','SILVER','CLUB',v_club_account.id,v_amount);
  update public.universe_currency_account set balance=balance-v_amount,updated_at=now() where id=v_universe_account.id;
  update public.club_currency_account set balance=balance+v_amount,updated_at=now() where id=v_club_account.id;

  insert into public.competition_prize_settlement(competition_id,recipient_club_id,amount,ledger_transaction_id)
  values(p_competition_id,p_winner_club_id,v_amount,v_tx.id) returning * into v_result;

  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,new_state,reason,metadata)
  values(p_actor_user_id,'COMPETITION_PRIZE_SETTLED','COMPETITION',p_competition_id::text,to_jsonb(v_result),'Competition prize settled',jsonb_build_object('winner_club_id',p_winner_club_id,'amount',v_amount));
  return v_result;
end;
$$;
revoke all on function public.service_settle_competition_prize(uuid,uuid,uuid) from public;
grant execute on function public.service_settle_competition_prize(uuid,uuid,uuid) to service_role;

create or replace function public.service_activate_competition(
  p_competition_id uuid,
  p_actor_user_id uuid,
  p_starts_at timestamptz default now(),
  p_round_interval_days integer default 7
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_comp public.competition;
  v_clubs uuid[];
  v_n integer;
  v_base_n integer;
  v_round integer;
  v_i integer;
  v_round_id uuid;
  v_home uuid;
  v_away uuid;
  v_last uuid;
  v_match_id uuid;
  v_bracket integer;
  v_byes integer;
  v_index integer;
  v_tie integer;
  v_match_count integer:=0;
  v_round_count integer:=0;
begin
  if p_actor_user_id is null then raise exception 'actor_required'; end if;
  if p_round_interval_days<1 or p_round_interval_days>90 then raise exception 'invalid_round_interval'; end if;

  select * into v_comp from public.competition where id=p_competition_id for update;
  if not found then raise exception 'competition_not_found'; end if;
  if v_comp.status='COMPLETED' then raise exception 'competition_already_completed'; end if;
  if v_comp.status='ACTIVE' then
    select count(*) into v_match_count from public.match where competition_id=p_competition_id;
    select count(*) into v_round_count from public.competition_round where competition_id=p_competition_id;
    return jsonb_build_object('competition_id',p_competition_id,'status','ACTIVE','matches',v_match_count,'rounds',v_round_count,'idempotent',true);
  end if;
  if v_comp.status not in ('DRAFT','REGISTRATION','OPEN','SCHEDULED') then raise exception 'competition_not_activatable'; end if;
  if v_comp.type not in ('LEAGUE','CUP','TOURNAMENT') then raise exception 'competition_type_not_schedulable'; end if;
  if exists(select 1 from public.match where competition_id=p_competition_id) or exists(select 1 from public.cup_tie where competition_id=p_competition_id) then
    raise exception 'competition_schedule_already_exists';
  end if;

  update public.competition_registration
  set state='APPROVED',approved_at=coalesce(approved_at,now())
  where competition_id=p_competition_id and state='REGISTERED';

  insert into public.competition_participant(competition_id,club_id,seed,status)
  select r.competition_id,r.club_id,row_number() over(order by r.registered_at,r.club_id)::integer,'ACTIVE'
  from public.competition_registration r
  where r.competition_id=p_competition_id and r.state='APPROVED'
  on conflict(competition_id,club_id) do update set status='ACTIVE';

  select array_agg(club_id order by seed nulls last,joined_at,club_id),count(*)
  into v_clubs,v_base_n
  from public.competition_participant
  where competition_id=p_competition_id and status='ACTIVE';
  if v_base_n<2 then raise exception 'competition_requires_two_participants'; end if;

  if v_comp.type='LEAGUE' then
    insert into public.league_standing(competition_id,club_id)
    select p_competition_id,unnest(v_clubs) on conflict(competition_id,club_id) do nothing;

    v_n:=v_base_n;
    if mod(v_n,2)=1 then v_clubs:=array_append(v_clubs,null::uuid);v_n:=v_n+1;end if;
    for v_round in 1..(v_n-1) loop
      insert into public.competition_round(competition_id,round_number,name,starts_at,status)
      values(p_competition_id,v_round,format('Jornada %s',v_round),p_starts_at+make_interval(days=>(v_round-1)*p_round_interval_days),case when v_round=1 then 'ACTIVE' else 'PENDING' end)
      returning id into v_round_id;
      v_round_count:=v_round_count+1;

      for v_i in 1..(v_n/2) loop
        v_home:=v_clubs[v_i];v_away:=v_clubs[v_n-v_i+1];
        if v_home is not null and v_away is not null then
          if mod(v_round,2)=0 then v_last:=v_home;v_home:=v_away;v_away:=v_last;end if;
          insert into public.match(universe_id,competition_id,home_club_id,away_club_id,state,scheduled_at,round_id,leg,matchday)
          values(v_comp.universe_id,p_competition_id,v_home,v_away,'SCHEDULED',p_starts_at+make_interval(days=>(v_round-1)*p_round_interval_days),v_round_id,1,v_round);
          v_match_count:=v_match_count+1;
        end if;
      end loop;

      if v_n>2 then
        v_last:=v_clubs[v_n];
        for v_i in reverse v_n..3 loop v_clubs[v_i]:=v_clubs[v_i-1]; end loop;
        v_clubs[2]:=v_last;
      end if;
    end loop;
  else
    v_n:=v_base_n;v_bracket:=1;
    while v_bracket<v_n loop v_bracket:=v_bracket*2;end loop;
    v_byes:=v_bracket-v_n;v_index:=1;
    insert into public.competition_round(competition_id,round_number,name,starts_at,status)
    values(p_competition_id,1,'Round 1',p_starts_at,'ACTIVE') returning id into v_round_id;
    v_round_count:=1;

    for v_tie in 1..(v_bracket/2) loop
      if v_tie<=v_byes then
        v_home:=v_clubs[v_index];v_away:=null;v_index:=v_index+1;
        insert into public.cup_tie(competition_id,round_number,tie_number,home_club_id,away_club_id,winner_club_id,state)
        values(p_competition_id,1,v_tie,v_home,null,v_home,'SETTLED');
      else
        v_home:=v_clubs[v_index];v_away:=v_clubs[v_index+1];v_index:=v_index+2;
        insert into public.match(universe_id,competition_id,home_club_id,away_club_id,state,scheduled_at,round_id,leg,matchday)
        values(v_comp.universe_id,p_competition_id,v_home,v_away,'SCHEDULED',p_starts_at,v_round_id,1,1) returning id into v_match_id;
        insert into public.cup_tie(competition_id,round_number,tie_number,home_club_id,away_club_id,match_id,state)
        values(p_competition_id,1,v_tie,v_home,v_away,v_match_id,'READY');
        v_match_count:=v_match_count+1;
      end if;
    end loop;
  end if;

  update public.competition set status='ACTIVE' where id=p_competition_id;
  if v_comp.season_id is not null then update public.season set status='ACTIVE' where id=v_comp.season_id and status in ('DRAFT','REGISTRATION','SCHEDULED'); end if;

  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,old_state,new_state,reason,metadata)
  values(p_actor_user_id,'COMPETITION_ACTIVATED','COMPETITION',p_competition_id::text,to_jsonb(v_comp),(select to_jsonb(c) from public.competition c where c.id=p_competition_id),'Competition activated and schedule generated',jsonb_build_object('participants',v_base_n,'matches',v_match_count,'rounds',v_round_count));
  return jsonb_build_object('competition_id',p_competition_id,'status','ACTIVE','participants',v_base_n,'matches',v_match_count,'rounds',v_round_count);
end;
$$;
revoke all on function public.service_activate_competition(uuid,uuid,timestamptz,integer) from public;
grant execute on function public.service_activate_competition(uuid,uuid,timestamptz,integer) to service_role;

create or replace function public.service_progress_competition(
  p_competition_id uuid,
  p_actor_user_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_comp public.competition;
  v_match_count integer;
  v_unfinished integer;
  v_winner uuid;
  v_loser uuid;
  v_tie public.cup_tie;
  v_match public.match;
  v_round integer;
  v_round_ties integer;
  v_round_open integer;
  v_next_exists boolean;
  v_winners uuid[];
  v_i integer;
  v_round_id uuid;
  v_match_id uuid;
  v_start timestamptz;
  v_days integer:=7;
  v_div uuid;
begin
  select * into v_comp from public.competition where id=p_competition_id for update;
  if not found then raise exception 'competition_not_found'; end if;
  if v_comp.status='COMPLETED' then return jsonb_build_object('competition_id',p_competition_id,'status','COMPLETED','idempotent',true); end if;
  if v_comp.status<>'ACTIVE' then raise exception 'competition_not_active'; end if;
  if coalesce(v_comp.rules->>'round_interval_days','')<>'' then v_days:=(v_comp.rules->>'round_interval_days')::integer;end if;
  if v_days<1 or v_days>90 then v_days:=7;end if;

  if v_comp.type='LEAGUE' then
    with ranked as (
      select club_id,row_number() over(order by points desc,(goals_for-goals_against) desc,goals_for desc,club_id)::integer as pos
      from public.league_standing where competition_id=p_competition_id
    )
    update public.league_standing s set position=r.pos,updated_at=now() from ranked r
    where s.competition_id=p_competition_id and s.club_id=r.club_id;

    update public.competition_round r set status='COMPLETED'
    where r.competition_id=p_competition_id and not exists(
      select 1 from public.match m where m.round_id=r.id and m.state not in ('SETTLED','CANCELLED')
    );
    update public.competition_round set status='ACTIVE'
    where id=(select id from public.competition_round where competition_id=p_competition_id and status='PENDING' order by round_number limit 1);

    select count(*),count(*) filter(where state not in ('SETTLED','CANCELLED')) into v_match_count,v_unfinished from public.match where competition_id=p_competition_id;
    if v_match_count>0 and v_unfinished=0 then
      select club_id into v_winner from public.league_standing where competition_id=p_competition_id order by position asc limit 1;
      update public.competition set status='COMPLETED' where id=p_competition_id;
      update public.competition_round set status='COMPLETED' where competition_id=p_competition_id;
      update public.competition_participant set status=case when club_id=v_winner then 'CHAMPION' else status end where competition_id=p_competition_id;

      if v_comp.season_id is not null then
        if exists(select 1 from public.competition_division where competition_id=p_competition_id) then
          for v_div in select id from public.competition_division where competition_id=p_competition_id loop perform public.service_snapshot_league_placements(p_competition_id,v_div);end loop;
        else perform public.service_snapshot_league_placements(p_competition_id,null);end if;
      end if;
      if v_winner is not null and v_comp.prize_pool>0 then perform public.service_settle_competition_prize(p_competition_id,v_winner,p_actor_user_id);end if;
      insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,reason,metadata)
      values(p_actor_user_id,'COMPETITION_COMPLETED','COMPETITION',p_competition_id::text,'League completed',jsonb_build_object('winner_club_id',v_winner));
      return jsonb_build_object('competition_id',p_competition_id,'status','COMPLETED','winner_club_id',v_winner);
    end if;
    return jsonb_build_object('competition_id',p_competition_id,'status','ACTIVE','matches',v_match_count,'unfinished',v_unfinished);
  end if;

  if v_comp.type not in ('CUP','TOURNAMENT') then raise exception 'competition_progression_not_supported'; end if;

  for v_tie in select * from public.cup_tie where competition_id=p_competition_id and state='READY' and match_id is not null order by round_number,tie_number for update loop
    select * into v_match from public.match where id=v_tie.match_id;
    if found and v_match.state='SETTLED' and v_match.home_score<>v_match.away_score then
      v_winner:=case when v_match.home_score>v_match.away_score then v_match.home_club_id else v_match.away_club_id end;
      v_loser:=case when v_winner=v_match.home_club_id then v_match.away_club_id else v_match.home_club_id end;
      update public.cup_tie set winner_club_id=v_winner,state='SETTLED' where id=v_tie.id;
      update public.competition_participant set status='ELIMINATED' where competition_id=p_competition_id and club_id=v_loser and status='ACTIVE';
    end if;
  end loop;

  select max(round_number) into v_round from public.cup_tie where competition_id=p_competition_id;
  if v_round is null then raise exception 'cup_schedule_missing'; end if;
  select count(*),count(*) filter(where state<>'SETTLED') into v_round_ties,v_round_open from public.cup_tie where competition_id=p_competition_id and round_number=v_round;
  if v_round_open>0 then return jsonb_build_object('competition_id',p_competition_id,'status','ACTIVE','round',v_round,'open_ties',v_round_open);end if;

  update public.competition_round set status='COMPLETED' where competition_id=p_competition_id and round_number=v_round;
  if v_round_ties=1 then
    select winner_club_id into v_winner from public.cup_tie where competition_id=p_competition_id and round_number=v_round limit 1;
    if v_winner is null then raise exception 'cup_winner_missing';end if;
    update public.competition set status='COMPLETED' where id=p_competition_id;
    update public.competition_participant set status=case when club_id=v_winner then 'CHAMPION' when status='ACTIVE' then 'ELIMINATED' else status end where competition_id=p_competition_id;
    if v_comp.prize_pool>0 then perform public.service_settle_competition_prize(p_competition_id,v_winner,p_actor_user_id);end if;
    insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,reason,metadata)
    values(p_actor_user_id,'COMPETITION_COMPLETED','COMPETITION',p_competition_id::text,'Cup completed',jsonb_build_object('winner_club_id',v_winner));
    return jsonb_build_object('competition_id',p_competition_id,'status','COMPLETED','winner_club_id',v_winner,'round',v_round);
  end if;

  select exists(select 1 from public.cup_tie where competition_id=p_competition_id and round_number=v_round+1) into v_next_exists;
  if v_next_exists then return jsonb_build_object('competition_id',p_competition_id,'status','ACTIVE','round',v_round+1,'idempotent',true);end if;
  select array_agg(winner_club_id order by tie_number) into v_winners from public.cup_tie where competition_id=p_competition_id and round_number=v_round;
  v_start:=now()+make_interval(days=>v_days);
  insert into public.competition_round(competition_id,round_number,name,starts_at,status)
  values(p_competition_id,v_round+1,format('Round %s',v_round+1),v_start,'ACTIVE') returning id into v_round_id;
  for v_i in 1..(array_length(v_winners,1)/2) loop
    insert into public.match(universe_id,competition_id,home_club_id,away_club_id,state,scheduled_at,round_id,leg,matchday)
    values(v_comp.universe_id,p_competition_id,v_winners[(v_i-1)*2+1],v_winners[(v_i-1)*2+2],'SCHEDULED',v_start,v_round_id,1,v_round+1) returning id into v_match_id;
    insert into public.cup_tie(competition_id,round_number,tie_number,home_club_id,away_club_id,match_id,state)
    values(p_competition_id,v_round+1,v_i,v_winners[(v_i-1)*2+1],v_winners[(v_i-1)*2+2],v_match_id,'READY');
  end loop;
  return jsonb_build_object('competition_id',p_competition_id,'status','ACTIVE','round',v_round+1,'ties',array_length(v_winners,1)/2);
end;
$$;
revoke all on function public.service_progress_competition(uuid,uuid) from public;
grant execute on function public.service_progress_competition(uuid,uuid) to service_role;

create or replace function public.service_progress_active_competitions()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare v_comp record;v_count integer:=0;
begin
  for v_comp in select id from public.competition where status='ACTIVE' order by created_at loop
    begin
      perform public.service_progress_competition(v_comp.id,null);
      v_count:=v_count+1;
    exception when others then
      raise warning 'competition progression failed for %: %',v_comp.id,sqlerrm;
    end;
  end loop;
  return v_count;
end;
$$;
revoke all on function public.service_progress_active_competitions() from public;
grant execute on function public.service_progress_active_competitions() to service_role;
