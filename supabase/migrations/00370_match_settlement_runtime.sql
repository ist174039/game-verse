-- Clã das Sombras — match settlement runtime hardening
-- Apply after 00360_transfer_contracts_match_evidence.sql.
-- Fixes the ordering mismatch between match_settlement insertion and match.state=SETTLED,
-- then completes finance, participant notification and competition progression from the
-- durable SETTLED transition.

-- 00320 originally reacted to the match_settlement INSERT. confirm_and_settle_match()
-- inserts the settlement before it updates match.state to SETTLED, so calling
-- service_create_match_financial_events() from that trigger could raise match_not_settled
-- and rollback the entire confirmation. Keep the settlement trigger as a safe fast-path
-- only when the match is already SETTLED; the authoritative runtime trigger below reacts
-- to the actual state transition.
create or replace function public.match_finance_after_settlement()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_state text;
begin
  if new.status<>'APPLIED' then return new; end if;

  select state into v_state from public.match where id=new.match_id;
  if v_state='SETTLED'
     and not exists(select 1 from public.match_financial_event where match_id=new.match_id) then
    perform public.service_create_match_financial_events(new.match_id);
  end if;

  return new;
end;
$$;
revoke all on function public.match_finance_after_settlement() from public,anon,authenticated;

drop trigger if exists match_finance_settlement_trigger on public.match_settlement;
create trigger match_finance_settlement_trigger
  after insert on public.match_settlement
  for each row execute function public.match_finance_after_settlement();

-- The SETTLED state is the domain boundary for consequences. This trigger deliberately
-- performs only idempotent/durable work. Competition progression is wrapped in its own
-- subtransaction so a prize/configuration issue cannot rollback a valid match result.
create or replace function public.match_after_settled_runtime()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_home_user uuid;
  v_away_user uuid;
  v_home_name text;
  v_away_name text;
  v_result_text text;
begin
  if new.state<>'SETTLED' or old.state is not distinct from new.state then
    return new;
  end if;

  -- Financial events are created only for an applied settlement and only once.
  if exists(
       select 1 from public.match_settlement ms
       where ms.match_id=new.id and ms.status='APPLIED'
     )
     and not exists(select 1 from public.match_financial_event mfe where mfe.match_id=new.id) then
    perform public.service_create_match_financial_events(new.id);
  end if;

  select user_id,name into v_home_user,v_home_name from public.club where id=new.home_club_id;
  select user_id,name into v_away_user,v_away_name from public.club where id=new.away_club_id;
  v_result_text:=format('%s %s — %s %s',coalesce(v_home_name,'Casa'),coalesce(new.home_score,0),coalesce(new.away_score,0),coalesce(v_away_name,'Fora'));

  if v_home_user is not null then
    insert into public.notification(user_id,type,title,body,href)
    values(v_home_user,'MATCH_SETTLED','Resultado liquidado',v_result_text,format('/play?universe=%s',new.universe_id));
  end if;
  if v_away_user is not null and v_away_user is distinct from v_home_user then
    insert into public.notification(user_id,type,title,body,href)
    values(v_away_user,'MATCH_SETTLED','Resultado liquidado',v_result_text,format('/play?universe=%s',new.universe_id));
  end if;

  -- Progress the league/cup immediately for responsive UX. A failure here must not make
  -- confirmation fail; the maintenance worker will retry ACTIVE competitions.
  if new.competition_id is not null then
    begin
      perform public.service_progress_competition(new.competition_id,null);
    exception when others then
      raise warning 'competition progression deferred for match %: %',new.id,sqlerrm;
    end;
  end if;

  return new;
end;
$$;
revoke all on function public.match_after_settled_runtime() from public,anon,authenticated;

drop trigger if exists match_after_settled_runtime_trigger on public.match;
create trigger match_after_settled_runtime_trigger
  after update of state on public.match
  for each row
  when (old.state is distinct from new.state and new.state='SETTLED')
  execute function public.match_after_settled_runtime();

-- Repair any SETTLED matches created before this migration whose finance trigger was
-- skipped/disabled. Failures are isolated per match and are retriable by an operator.
do $$
declare
  v_match record;
begin
  for v_match in
    select m.id
    from public.match m
    where m.state='SETTLED'
      and exists(select 1 from public.match_settlement ms where ms.match_id=m.id and ms.status='APPLIED')
      and not exists(select 1 from public.match_financial_event mfe where mfe.match_id=m.id)
    order by m.settled_at nulls last,m.id
  loop
    begin
      perform public.service_create_match_financial_events(v_match.id);
    exception when others then
      raise warning 'match finance backfill failed for %: %',v_match.id,sqlerrm;
    end;
  end loop;
end;
$$;
