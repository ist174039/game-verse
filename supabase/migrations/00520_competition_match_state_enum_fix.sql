-- Clã das Sombras — competition schedule match_state enum fix
-- Fixes SQLSTATE 42804 during competition activation when READY/SCHEDULED
-- was held in a text variable and inserted into public.match.state (match_state enum).

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
  v_ready_count integer:=0;
  v_scheduled_at timestamptz;
  v_match_state public.match_state;
begin
  if p_round_interval_days<1 or p_round_interval_days>90 then raise exception 'invalid_round_interval'; end if;

  select * into v_comp from public.competition where id=p_competition_id for update;
  if not found then raise exception 'competition_not_found'; end if;
  if v_comp.status='COMPLETED' then raise exception 'competition_already_completed'; end if;
  if v_comp.status='ACTIVE' then
    select count(*) into v_match_count from public.match where competition_id=p_competition_id;
    select count(*) into v_round_count from public.competition_round where competition_id=p_competition_id;
    select count(*) into v_ready_count from public.match where competition_id=p_competition_id and state='READY';
    return jsonb_build_object('competition_id',p_competition_id,'status','ACTIVE','matches',v_match_count,'rounds',v_round_count,'ready_matches',v_ready_count,'idempotent',true);
  end if;
  if v_comp.status not in ('DRAFT','REGISTRATION','OPEN','SCHEDULED') then raise exception 'competition_not_activatable'; end if;
  if v_comp.type not in ('LEAGUE','CUP','TOURNAMENT') then raise exception 'competition_type_not_schedulable'; end if;
  if exists(select 1 from public.match where competition_id=p_competition_id)
     or exists(select 1 from public.cup_tie where competition_id=p_competition_id) then
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
    select p_competition_id,unnest(v_clubs)
    on conflict(competition_id,club_id) do nothing;

    v_n:=v_base_n;
    if mod(v_n,2)=1 then
      v_clubs:=array_append(v_clubs,null::uuid);
      v_n:=v_n+1;
    end if;

    for v_round in 1..(v_n-1) loop
      v_scheduled_at:=p_starts_at+make_interval(days=>(v_round-1)*p_round_interval_days);
      insert into public.competition_round(competition_id,round_number,name,starts_at,status)
      values(
        p_competition_id,
        v_round,
        format('Jornada %s',v_round),
        v_scheduled_at,
        case when v_round=1 then 'ACTIVE' else 'PENDING' end
      ) returning id into v_round_id;
      v_round_count:=v_round_count+1;

      v_match_state:=case
        when v_scheduled_at<=now() then 'READY'::public.match_state
        else 'SCHEDULED'::public.match_state
      end;
      for v_i in 1..(v_n/2) loop
        v_home:=v_clubs[v_i];
        v_away:=v_clubs[v_n-v_i+1];
        if v_home is not null and v_away is not null then
          if mod(v_round,2)=0 then
            v_last:=v_home;
            v_home:=v_away;
            v_away:=v_last;
          end if;
          insert into public.match(universe_id,competition_id,home_club_id,away_club_id,state,scheduled_at,round_id,leg,matchday)
          values(v_comp.universe_id,p_competition_id,v_home,v_away,v_match_state,v_scheduled_at,v_round_id,1,v_round);
          v_match_count:=v_match_count+1;
          if v_match_state='READY' then v_ready_count:=v_ready_count+1; end if;
        end if;
      end loop;

      if v_n>2 then
        v_last:=v_clubs[v_n];
        for v_i in reverse v_n..3 loop
          v_clubs[v_i]:=v_clubs[v_i-1];
        end loop;
        v_clubs[2]:=v_last;
      end if;
    end loop;
  else
    v_n:=v_base_n;
    v_bracket:=1;
    while v_bracket<v_n loop v_bracket:=v_bracket*2; end loop;
    v_byes:=v_bracket-v_n;
    v_index:=1;
    v_scheduled_at:=p_starts_at;
    v_match_state:=case
      when v_scheduled_at<=now() then 'READY'::public.match_state
      else 'SCHEDULED'::public.match_state
    end;

    insert into public.competition_round(competition_id,round_number,name,starts_at,status)
    values(p_competition_id,1,'Round 1',v_scheduled_at,'ACTIVE')
    returning id into v_round_id;
    v_round_count:=1;

    for v_tie in 1..(v_bracket/2) loop
      if v_tie<=v_byes then
        v_home:=v_clubs[v_index];
        v_away:=null;
        v_index:=v_index+1;
        insert into public.cup_tie(competition_id,round_number,tie_number,home_club_id,away_club_id,winner_club_id,state)
        values(p_competition_id,1,v_tie,v_home,null,v_home,'SETTLED');
      else
        v_home:=v_clubs[v_index];
        v_away:=v_clubs[v_index+1];
        v_index:=v_index+2;
        insert into public.match(universe_id,competition_id,home_club_id,away_club_id,state,scheduled_at,round_id,leg,matchday)
        values(v_comp.universe_id,p_competition_id,v_home,v_away,v_match_state,v_scheduled_at,v_round_id,1,1)
        returning id into v_match_id;
        insert into public.cup_tie(competition_id,round_number,tie_number,home_club_id,away_club_id,match_id,state)
        values(p_competition_id,1,v_tie,v_home,v_away,v_match_id,'READY');
        v_match_count:=v_match_count+1;
        if v_match_state='READY' then v_ready_count:=v_ready_count+1; end if;
      end if;
    end loop;
  end if;

  update public.competition set status='ACTIVE' where id=p_competition_id;
  if v_comp.season_id is not null then
    update public.season
    set status='ACTIVE'
    where id=v_comp.season_id and status in ('DRAFT','REGISTRATION','SCHEDULED');
  end if;

  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,old_state,new_state,reason,metadata)
  values(
    p_actor_user_id,
    'COMPETITION_ACTIVATED',
    'COMPETITION',
    p_competition_id::text,
    to_jsonb(v_comp),
    (select to_jsonb(c) from public.competition c where c.id=p_competition_id),
    case when p_actor_user_id is null then 'Competition activated automatically' else 'Competition activated and schedule generated' end,
    jsonb_build_object(
      'participants',v_base_n,
      'matches',v_match_count,
      'rounds',v_round_count,
      'ready_matches',v_ready_count,
      'automatic',p_actor_user_id is null
    )
  );

  return jsonb_build_object(
    'competition_id',p_competition_id,
    'status','ACTIVE',
    'participants',v_base_n,
    'matches',v_match_count,
    'rounds',v_round_count,
    'ready_matches',v_ready_count,
    'automatic',p_actor_user_id is null
  );
end;
$$;

revoke all on function public.service_activate_competition(uuid,uuid,timestamptz,integer) from public,anon,authenticated;
grant execute on function public.service_activate_competition(uuid,uuid,timestamptz,integer) to service_role;
