-- Clã das Sombras — result confirmation timeout and safe auto-confirmation
-- Apply after 00380_competition_autostart_runtime.sql.
--
-- A submitted score becomes immutable while awaiting the opponent. The opponent receives
-- an explicit confirmation deadline and may confirm or dispute before it expires. The
-- service-role maintenance worker may auto-confirm only after the deadline and only when
-- there is no unresolved dispute. Competition rules may require evidence for auto-confirm.

insert into public.platform_config(key,category,value)
values(
  'competition.result_confirmation',
  'COMPETITION',
  '{"timeout_hours":24,"auto_confirm_enabled":true,"require_evidence":false}'::jsonb
)
on conflict(key) do nothing;

create or replace function public.match_confirmation_timeout_hours(p_competition_id uuid)
returns integer
language plpgsql
security definer
stable
set search_path=public
as $$
declare
  v_rules jsonb:='{}'::jsonb;
  v_cfg jsonb:='{}'::jsonb;
  v_hours integer:=24;
begin
  if p_competition_id is not null then
    select coalesce(rules,'{}'::jsonb) into v_rules
    from public.competition
    where id=p_competition_id;
  end if;

  select coalesce(value,'{}'::jsonb) into v_cfg
  from public.platform_config
  where key='competition.result_confirmation';

  v_hours:=coalesce(
    nullif(v_rules->>'confirmation_timeout_hours','')::integer,
    nullif(v_cfg->>'timeout_hours','')::integer,
    24
  );

  return greatest(1,least(168,v_hours));
end;
$$;
revoke all on function public.match_confirmation_timeout_hours(uuid) from public,anon,authenticated;
grant execute on function public.match_confirmation_timeout_hours(uuid) to service_role;

create or replace function public.submit_match_result(
  p_match_id uuid,
  p_home_score integer,
  p_away_score integer,
  p_idempotency_key text
)
returns public.match
language plpgsql
security definer
set search_path=public
as $$
declare
  v_match public.match;
  v_user_club uuid;
  v_opponent_user uuid;
  v_deadline timestamptz;
  v_timeout integer;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key))<3 then raise exception 'idempotency_key_required'; end if;
  if p_home_score < 0 or p_away_score < 0 then raise exception 'invalid_score'; end if;

  select * into v_match from public.match where id=p_match_id for update;
  if not found then raise exception 'match_not_found'; end if;

  select id into v_user_club
  from public.club
  where user_id=auth.uid() and id in (v_match.home_club_id,v_match.away_club_id)
  limit 1;
  if v_user_club is null then raise exception 'not_match_participant'; end if;

  -- Idempotent replay returns the original submission; any other second submission is
  -- rejected so neither participant can silently replace a pending score.
  if v_match.state='RESULT_SUBMITTED' then
    if v_match.submitted_by=auth.uid()
       and coalesce(v_match.result_metadata->>'submission_key','')=p_idempotency_key then
      return v_match;
    end if;
    raise exception 'result_already_submitted';
  end if;

  if v_match.state not in ('READY','PLAYED') then raise exception 'match_not_submittable'; end if;

  v_timeout:=public.match_confirmation_timeout_hours(v_match.competition_id);
  v_deadline:=now()+make_interval(hours=>v_timeout);

  update public.match
  set home_score=p_home_score,
      away_score=p_away_score,
      submitted_by=auth.uid(),
      submitted_at=now(),
      state='RESULT_SUBMITTED',
      result_metadata=coalesce(result_metadata,'{}'::jsonb) || jsonb_build_object(
        'submission_key',p_idempotency_key,
        'confirmation_deadline',v_deadline,
        'confirmation_timeout_hours',v_timeout,
        'confirmation_mode',null
      ),
      updated_at=now()
  where id=p_match_id
  returning * into v_match;

  select user_id into v_opponent_user
  from public.club
  where id=case when v_user_club=v_match.home_club_id then v_match.away_club_id else v_match.home_club_id end;

  if v_opponent_user is not null then
    insert into public.notification(user_id,type,title,body,href)
    values(
      v_opponent_user,
      'MATCH_RESULT_SUBMITTED',
      'Resultado à espera da tua confirmação',
      format('Foi submetido um resultado. Confirma ou abre disputa até %s.',to_char(v_deadline at time zone 'UTC','YYYY-MM-DD HH24:MI UTC')),
      format('/play?universe=%s',v_match.universe_id)
    );
  end if;

  return v_match;
end;
$$;
revoke all on function public.submit_match_result(uuid,integer,integer,text) from public,anon;
grant execute on function public.submit_match_result(uuid,integer,integer,text) to authenticated;

-- Canonical settlement implementation shared by human confirmation and the timeout worker.
-- It remains private to authenticated users; only the SECURITY DEFINER wrapper and
-- service-role maintenance can reach it.
create or replace function public.service_finalize_match_result(
  p_match_id uuid,
  p_idempotency_key text,
  p_confirmed_by uuid default null,
  p_auto boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_match public.match;
  v_competition public.competition;
  v_settlement public.match_settlement;
  v_version integer;
  v_home_delta integer:=0;
  v_away_delta integer:=0;
  v_home_result text;
  v_away_result text;
  v_home_points integer:=0;
  v_away_points integer:=0;
  v_mode text:=case when p_auto then 'AUTO_TIMEOUT' else 'OPPONENT_CONFIRMATION' end;
begin
  if p_idempotency_key is null or length(trim(p_idempotency_key))<3 then raise exception 'idempotency_key_required'; end if;

  select * into v_match from public.match where id=p_match_id for update;
  if not found then raise exception 'match_not_found'; end if;

  if v_match.state='SETTLED' then
    select * into v_settlement
    from public.match_settlement
    where match_id=p_match_id and status='APPLIED'
    order by settlement_version desc
    limit 1;
    return jsonb_build_object(
      'match_id',v_match.id,
      'settlement_id',v_settlement.id,
      'version',v_settlement.settlement_version,
      'home_elo_delta',coalesce((v_settlement.payload->>'home_elo_delta')::int,0),
      'away_elo_delta',coalesce((v_settlement.payload->>'away_elo_delta')::int,0),
      'standings_updated',coalesce((v_settlement.payload->>'standings_updated')::boolean,false),
      'settled_at',v_match.settled_at,
      'idempotent',true
    );
  end if;

  if v_match.state<>'RESULT_SUBMITTED' then raise exception 'result_not_awaiting_confirmation'; end if;
  if exists(
    select 1 from public.match_dispute d
    where d.match_id=p_match_id and d.state not in ('RESOLVED','REJECTED')
  ) then raise exception 'match_has_open_dispute'; end if;
  if v_match.home_score is null or v_match.away_score is null then raise exception 'submitted_score_missing'; end if;

  if v_match.home_score>v_match.away_score then
    v_home_result:='W';v_away_result:='L';v_home_points:=3;v_away_points:=0;v_home_delta:=16;v_away_delta:=-16;
  elsif v_match.home_score<v_match.away_score then
    v_home_result:='L';v_away_result:='W';v_home_points:=0;v_away_points:=3;v_home_delta:=-16;v_away_delta:=16;
  else
    v_home_result:='D';v_away_result:='D';v_home_points:=1;v_away_points:=1;v_home_delta:=0;v_away_delta:=0;
  end if;

  select * into v_competition from public.competition where id=v_match.competition_id;

  if v_competition.type='LEAGUE' then
    insert into public.league_standing(competition_id,club_id)
    values(v_competition.id,v_match.home_club_id) on conflict do nothing;
    insert into public.league_standing(competition_id,club_id)
    values(v_competition.id,v_match.away_club_id) on conflict do nothing;

    update public.league_standing set
      played=played+1,
      won=won+case when v_home_result='W' then 1 else 0 end,
      drawn=drawn+case when v_home_result='D' then 1 else 0 end,
      lost=lost+case when v_home_result='L' then 1 else 0 end,
      goals_for=goals_for+v_match.home_score,
      goals_against=goals_against+v_match.away_score,
      points=points+v_home_points,
      updated_at=now()
    where competition_id=v_competition.id and club_id=v_match.home_club_id;

    update public.league_standing set
      played=played+1,
      won=won+case when v_away_result='W' then 1 else 0 end,
      drawn=drawn+case when v_away_result='D' then 1 else 0 end,
      lost=lost+case when v_away_result='L' then 1 else 0 end,
      goals_for=goals_for+v_match.away_score,
      goals_against=goals_against+v_match.home_score,
      points=points+v_away_points,
      updated_at=now()
    where competition_id=v_competition.id and club_id=v_match.away_club_id;
  end if;

  update public.club set elo=greatest(0,elo+v_home_delta),updated_at=now() where id=v_match.home_club_id;
  update public.club set elo=greatest(0,elo+v_away_delta),updated_at=now() where id=v_match.away_club_id;

  if p_auto then
    update public.match
    set state='AUTO_CONFIRMED',
        confirmed_at=now(),
        result_metadata=coalesce(result_metadata,'{}'::jsonb) || jsonb_build_object('confirmation_mode',v_mode),
        updated_at=now()
    where id=p_match_id;
  end if;

  select coalesce(max(settlement_version),0)+1 into v_version
  from public.match_settlement
  where match_id=p_match_id;

  insert into public.match_settlement(match_id,settlement_version,status,payload)
  values(
    p_match_id,
    v_version,
    'APPLIED',
    jsonb_build_object(
      'idempotency_key',p_idempotency_key,
      'home_elo_delta',v_home_delta,
      'away_elo_delta',v_away_delta,
      'home_points',v_home_points,
      'away_points',v_away_points,
      'standings_updated',coalesce(v_competition.type='LEAGUE',false),
      'confirmation_mode',v_mode,
      'confirmed_by',p_confirmed_by
    )
  ) returning * into v_settlement;

  update public.match
  set state='SETTLED',
      confirmed_at=coalesce(confirmed_at,now()),
      settled_at=now(),
      result_metadata=coalesce(result_metadata,'{}'::jsonb) || jsonb_build_object(
        'confirmation_mode',v_mode,
        'confirmed_by',p_confirmed_by
      ),
      updated_at=now()
  where id=p_match_id
  returning * into v_match;

  if p_auto then
    insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,new_state,reason,metadata)
    values(
      null,
      'MATCH_RESULT_AUTO_CONFIRMED',
      'MATCH',
      p_match_id::text,
      to_jsonb(v_match),
      'Result confirmation timeout expired without an open dispute',
      jsonb_build_object(
        'submitted_by',v_match.submitted_by,
        'submitted_at',v_match.submitted_at,
        'confirmation_deadline',v_match.result_metadata->>'confirmation_deadline',
        'evidence_count',(select count(*) from public.match_evidence e where e.match_id=p_match_id),
        'settlement_id',v_settlement.id
      )
    );
  end if;

  return jsonb_build_object(
    'match_id',v_match.id,
    'settlement_id',v_settlement.id,
    'version',v_version,
    'home_elo_delta',v_home_delta,
    'away_elo_delta',v_away_delta,
    'standings_updated',coalesce(v_competition.type='LEAGUE',false),
    'settled_at',v_match.settled_at,
    'confirmation_mode',v_mode
  );
end;
$$;
revoke all on function public.service_finalize_match_result(uuid,text,uuid,boolean) from public,anon,authenticated;
grant execute on function public.service_finalize_match_result(uuid,text,uuid,boolean) to service_role;

create or replace function public.confirm_and_settle_match(
  p_match_id uuid,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_match public.match;
  v_confirmer_club uuid;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;

  select * into v_match from public.match where id=p_match_id for update;
  if not found then raise exception 'match_not_found'; end if;

  if v_match.state='SETTLED' then
    return public.service_finalize_match_result(p_match_id,p_idempotency_key,auth.uid(),false);
  end if;
  if v_match.state<>'RESULT_SUBMITTED' then raise exception 'result_not_awaiting_confirmation'; end if;
  if v_match.submitted_by=auth.uid() then raise exception 'opponent_confirmation_required'; end if;

  select id into v_confirmer_club
  from public.club
  where user_id=auth.uid() and id in (v_match.home_club_id,v_match.away_club_id)
  limit 1;
  if v_confirmer_club is null then raise exception 'not_match_participant'; end if;

  return public.service_finalize_match_result(p_match_id,p_idempotency_key,auth.uid(),false);
end;
$$;
revoke all on function public.confirm_and_settle_match(uuid,text) from public,anon;
grant execute on function public.confirm_and_settle_match(uuid,text) to authenticated;

create or replace function public.service_process_result_confirmation_timeouts(p_limit integer default 200)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_match record;
  v_cfg jsonb:='{}'::jsonb;
  v_enabled boolean;
  v_require_evidence boolean;
  v_deadline timestamptz;
  v_evidence_count integer;
  v_confirmed integer:=0;
  v_deferred_evidence integer:=0;
  v_failed integer:=0;
begin
  if p_limit<1 or p_limit>1000 then raise exception 'invalid_processing_limit'; end if;

  select coalesce(value,'{}'::jsonb) into v_cfg
  from public.platform_config
  where key='competition.result_confirmation';

  for v_match in
    select m.id,m.competition_id,m.submitted_at,m.result_metadata,c.rules
    from public.match m
    left join public.competition c on c.id=m.competition_id
    where m.state='RESULT_SUBMITTED' and m.submitted_at is not null
    order by m.submitted_at,m.id
    for update of m skip locked
    limit p_limit
  loop
    v_enabled:=coalesce(
      nullif(v_match.rules->>'auto_confirm','')::boolean,
      nullif(v_cfg->>'auto_confirm_enabled','')::boolean,
      true
    );
    if not v_enabled then continue; end if;

    v_deadline:=coalesce(
      nullif(v_match.result_metadata->>'confirmation_deadline','')::timestamptz,
      v_match.submitted_at+make_interval(hours=>public.match_confirmation_timeout_hours(v_match.competition_id))
    );
    if v_deadline>now() then continue; end if;

    if exists(
      select 1 from public.match_dispute d
      where d.match_id=v_match.id and d.state not in ('RESOLVED','REJECTED')
    ) then continue; end if;

    v_require_evidence:=coalesce(
      nullif(v_match.rules->>'require_evidence_for_auto_confirm','')::boolean,
      nullif(v_cfg->>'require_evidence','')::boolean,
      false
    );
    select count(*) into v_evidence_count from public.match_evidence where match_id=v_match.id;

    if v_require_evidence and v_evidence_count=0 then
      v_deferred_evidence:=v_deferred_evidence+1;
      continue;
    end if;

    begin
      perform public.service_finalize_match_result(
        v_match.id,
        format('auto-confirm:%s',v_match.id),
        null,
        true
      );
      v_confirmed:=v_confirmed+1;
    exception when others then
      v_failed:=v_failed+1;
      raise warning 'auto confirmation failed for match %: %',v_match.id,sqlerrm;
    end;
  end loop;

  return jsonb_build_object(
    'confirmed',v_confirmed,
    'deferred_evidence',v_deferred_evidence,
    'failed',v_failed
  );
end;
$$;
revoke all on function public.service_process_result_confirmation_timeouts(integer) from public,anon,authenticated;
grant execute on function public.service_process_result_confirmation_timeouts(integer) to service_role;

-- Existing pending submissions get an explicit deadline without changing their score/state.
update public.match m
set result_metadata=coalesce(m.result_metadata,'{}'::jsonb) || jsonb_build_object(
  'confirmation_deadline',m.submitted_at+make_interval(hours=>public.match_confirmation_timeout_hours(m.competition_id)),
  'confirmation_timeout_hours',public.match_confirmation_timeout_hours(m.competition_id)
)
where m.state='RESULT_SUBMITTED'
  and m.submitted_at is not null
  and coalesce(m.result_metadata->>'confirmation_deadline','')='';
