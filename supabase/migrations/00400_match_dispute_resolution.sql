-- Clã das Sombras — auditable match dispute resolution
-- Apply after 00390_match_result_confirmation_timeout.sql.
--
-- Disputes are resolved only through a service-role command. An administrator may
-- uphold the submitted score, correct the score and settle it, or send the match
-- back to READY for a replay. Every decision is idempotent, audited and notified.

alter table public.match_dispute
  add column if not exists decision text,
  add column if not exists resolution_key text,
  add column if not exists resolution_metadata jsonb not null default '{}'::jsonb;

create unique index if not exists match_dispute_resolution_key_uidx
  on public.match_dispute(resolution_key)
  where resolution_key is not null;

-- Prevent parallel unresolved disputes for the same match. Existing duplicates are
-- still resolvable; the function below closes every unresolved dispute for the match.
create or replace function public.open_match_dispute(p_match_id uuid, p_reason text)
returns public.match_dispute
language plpgsql
security definer
set search_path=public
as $$
declare
  v_match public.match;
  v_dispute public.match_dispute;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_reason is null or length(trim(p_reason))<5 then raise exception 'dispute_reason_required'; end if;

  select * into v_match
  from public.match
  where id=p_match_id
  for update;
  if not found then raise exception 'match_not_found'; end if;

  if not exists(
    select 1 from public.club c
    where c.user_id=auth.uid()
      and c.id in (v_match.home_club_id,v_match.away_club_id)
  ) then
    raise exception 'not_match_participant';
  end if;

  if v_match.state not in ('RESULT_SUBMITTED','CONFIRMED','DISPUTED') then
    raise exception 'match_not_disputable';
  end if;

  select * into v_dispute
  from public.match_dispute
  where match_id=p_match_id
    and state not in ('RESOLVED','REJECTED')
  order by created_at
  limit 1
  for update;

  if found then
    return v_dispute;
  end if;

  insert into public.match_dispute(match_id,opened_by,reason)
  values(p_match_id,auth.uid(),trim(p_reason))
  returning * into v_dispute;

  update public.match
  set state='DISPUTED',updated_at=now()
  where id=p_match_id;

  return v_dispute;
end;
$$;
revoke all on function public.open_match_dispute(uuid,text) from public,anon;
grant execute on function public.open_match_dispute(uuid,text) to authenticated;

create or replace function public.service_resolve_match_dispute(
  p_dispute_id uuid,
  p_decision text,
  p_resolution text,
  p_actor_user_id uuid,
  p_idempotency_key text,
  p_home_score integer default null,
  p_away_score integer default null
)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_dispute public.match_dispute;
  v_match public.match;
  v_old_match jsonb;
  v_result jsonb:='{}'::jsonb;
  v_decision text:=upper(trim(coalesce(p_decision,'')));
  v_state text;
  v_settlement_id uuid;
  v_home_user uuid;
  v_away_user uuid;
  v_message text;
begin
  if p_actor_user_id is null then raise exception 'admin_actor_required'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key))<8 then raise exception 'idempotency_key_required'; end if;
  if p_resolution is null or length(trim(p_resolution))<5 then raise exception 'resolution_reason_required'; end if;
  if v_decision not in ('UPHOLD','CORRECT_SCORE','REPLAY') then raise exception 'invalid_dispute_decision'; end if;

  select * into v_dispute
  from public.match_dispute
  where id=p_dispute_id
  for update;
  if not found then raise exception 'dispute_not_found'; end if;

  if v_dispute.resolution_key=p_idempotency_key then
    return coalesce(v_dispute.resolution_metadata,'{}'::jsonb)
      || jsonb_build_object('dispute_id',v_dispute.id,'match_id',v_dispute.match_id,'decision',v_dispute.decision,'idempotent',true);
  end if;

  if v_dispute.state in ('RESOLVED','REJECTED') then
    raise exception 'dispute_already_resolved';
  end if;

  select * into v_match
  from public.match
  where id=v_dispute.match_id
  for update;
  if not found then raise exception 'match_not_found'; end if;

  v_old_match:=to_jsonb(v_match);

  -- A previously applied settlement must be reversed before an appeal can change
  -- the score or request a replay. This keeps standings, Elo and ledger reversible.
  if exists(
    select 1 from public.match_settlement s
    where s.match_id=v_match.id and s.status='APPLIED'
  ) then
    perform public.service_reverse_match_settlement(
      v_match.id,
      'Administrative dispute resolution: '||trim(p_resolution),
      trim(p_idempotency_key)||':reverse'
    );
    select * into v_match from public.match where id=v_match.id for update;
  end if;

  if v_decision='CORRECT_SCORE' then
    if p_home_score is null or p_away_score is null or p_home_score<0 or p_away_score<0 then
      raise exception 'corrected_score_required';
    end if;
    update public.match
    set home_score=p_home_score,
        away_score=p_away_score,
        state='RESULT_SUBMITTED',
        confirmed_at=null,
        settled_at=null,
        result_metadata=coalesce(result_metadata,'{}'::jsonb)||jsonb_build_object(
          'admin_dispute_id',p_dispute_id,
          'admin_dispute_decision',v_decision,
          'admin_corrected_score',jsonb_build_object('home',p_home_score,'away',p_away_score),
          'confirmation_deadline',null,
          'confirmation_mode','ADMIN_DISPUTE_RESOLUTION'
        ),
        updated_at=now()
    where id=v_match.id;
    v_state:='RESOLVED';
  elsif v_decision='UPHOLD' then
    if v_match.home_score is null or v_match.away_score is null then raise exception 'submitted_score_missing'; end if;
    update public.match
    set state='RESULT_SUBMITTED',
        confirmed_at=null,
        settled_at=null,
        result_metadata=coalesce(result_metadata,'{}'::jsonb)||jsonb_build_object(
          'admin_dispute_id',p_dispute_id,
          'admin_dispute_decision',v_decision,
          'confirmation_deadline',null,
          'confirmation_mode','ADMIN_DISPUTE_RESOLUTION'
        ),
        updated_at=now()
    where id=v_match.id;
    v_state:='REJECTED';
  else
    update public.match
    set state='READY',
        home_score=null,
        away_score=null,
        submitted_by=null,
        submitted_at=null,
        confirmed_at=null,
        settled_at=null,
        result_metadata=coalesce(result_metadata,'{}'::jsonb)||jsonb_build_object(
          'admin_dispute_id',p_dispute_id,
          'admin_dispute_decision',v_decision,
          'replay_required',true,
          'confirmation_deadline',null,
          'confirmation_mode','ADMIN_DISPUTE_RESOLUTION'
        ),
        updated_at=now()
    where id=v_match.id;
    v_state:='RESOLVED';
  end if;

  -- One administrative ruling closes every unresolved dispute attached to the match.
  update public.match_dispute
  set state=v_state,
      decision=v_decision,
      resolution=trim(p_resolution),
      resolved_by=p_actor_user_id,
      resolved_at=now(),
      resolution_metadata=coalesce(resolution_metadata,'{}'::jsonb)||jsonb_build_object(
        'administrative_resolution',true,
        'decision',v_decision,
        'resolved_by',p_actor_user_id,
        'resolved_at',now()
      )
  where match_id=v_match.id
    and state not in ('RESOLVED','REJECTED');

  if v_decision in ('UPHOLD','CORRECT_SCORE') then
    v_result:=public.service_finalize_match_result(
      v_match.id,
      trim(p_idempotency_key)||':settle',
      p_actor_user_id,
      false
    );

    select id into v_settlement_id
    from public.match_settlement
    where match_id=v_match.id and status='APPLIED'
    order by settlement_version desc
    limit 1;

    if v_settlement_id is not null then
      update public.match_settlement
      set payload=coalesce(payload,'{}'::jsonb)||jsonb_build_object(
        'confirmation_mode','ADMIN_DISPUTE_RESOLUTION',
        'admin_dispute_id',p_dispute_id,
        'admin_dispute_decision',v_decision,
        'admin_actor_user_id',p_actor_user_id
      )
      where id=v_settlement_id;
    end if;

    update public.match
    set result_metadata=coalesce(result_metadata,'{}'::jsonb)||jsonb_build_object(
      'confirmation_mode','ADMIN_DISPUTE_RESOLUTION',
      'admin_dispute_id',p_dispute_id,
      'admin_dispute_decision',v_decision,
      'admin_actor_user_id',p_actor_user_id
    ),updated_at=now()
    where id=v_match.id;
  else
    v_result:=jsonb_build_object('match_id',v_match.id,'state','READY','replay_required',true);
  end if;

  update public.match_dispute
  set resolution_key=trim(p_idempotency_key),
      resolution_metadata=coalesce(resolution_metadata,'{}'::jsonb)||v_result||jsonb_build_object(
        'dispute_id',p_dispute_id,
        'match_id',v_match.id,
        'decision',v_decision,
        'idempotency_key',trim(p_idempotency_key)
      )
  where id=p_dispute_id;

  select user_id into v_home_user from public.club where id=v_match.home_club_id;
  select user_id into v_away_user from public.club where id=v_match.away_club_id;

  v_message:=case v_decision
    when 'UPHOLD' then 'A disputa foi analisada. O resultado submetido foi mantido e a partida foi liquidada.'
    when 'CORRECT_SCORE' then format('A disputa foi analisada. O resultado oficial foi corrigido para %s-%s e liquidado.',p_home_score,p_away_score)
    else 'A disputa foi analisada. A partida deve ser repetida e voltou ao estado pronta para jogar.'
  end;

  insert into public.notification(user_id,type,title,body,href)
  select u,'MATCH_DISPUTE_RESOLVED','Disputa de resultado resolvida',v_message,format('/play?universe=%s',v_match.universe_id)
  from (select v_home_user as u union select v_away_user) x
  where u is not null;

  insert into public.domain_event(universe_id,type,aggregate_type,aggregate_id,payload)
  values(
    v_match.universe_id,
    'MATCH_DISPUTE_RESOLVED',
    'MATCH',
    v_match.id,
    jsonb_build_object(
      'dispute_id',p_dispute_id,
      'decision',v_decision,
      'actor_user_id',p_actor_user_id,
      'resolution',trim(p_resolution)
    )
  );

  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,old_state,new_state,reason,metadata)
  values(
    p_actor_user_id,
    'MATCH_DISPUTE_RESOLVED',
    'MATCH_DISPUTE',
    p_dispute_id::text,
    jsonb_build_object('dispute',to_jsonb(v_dispute),'match',v_old_match),
    jsonb_build_object(
      'decision',v_decision,
      'match',(select to_jsonb(m) from public.match m where m.id=v_match.id),
      'dispute',(select to_jsonb(d) from public.match_dispute d where d.id=p_dispute_id)
    ),
    trim(p_resolution),
    jsonb_build_object('idempotency_key',trim(p_idempotency_key),'settlement_id',v_settlement_id)
  );

  return v_result||jsonb_build_object(
    'dispute_id',p_dispute_id,
    'match_id',v_match.id,
    'decision',v_decision,
    'settlement_id',v_settlement_id,
    'idempotent',false
  );
end;
$$;
revoke all on function public.service_resolve_match_dispute(uuid,text,text,uuid,text,integer,integer) from public,anon,authenticated;
grant execute on function public.service_resolve_match_dispute(uuid,text,text,uuid,text,integer,integer) to service_role;
