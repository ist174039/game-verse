-- Clã das Sombras — competition runtime maintenance
-- Apply after 00280_competition_automation.sql.

create or replace function public.service_ready_scheduled_matches(p_limit integer default 500)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare v_count integer;
begin
  if p_limit<1 or p_limit>5000 then raise exception 'invalid_processing_limit'; end if;
  with due as (
    select id from public.match
    where state='SCHEDULED' and scheduled_at is not null and scheduled_at<=now()
    order by scheduled_at asc
    for update skip locked
    limit p_limit
  )
  update public.match m set state='READY',updated_at=now()
  from due where m.id=due.id;
  get diagnostics v_count=row_count;

  update public.competition_round r set status='ACTIVE'
  where r.status='PENDING' and r.starts_at is not null and r.starts_at<=now()
    and exists(select 1 from public.match m where m.round_id=r.id and m.state in ('READY','PLAYED','RESULT_SUBMITTED','CONFIRMED','DISPUTED','AUTO_CONFIRMED','SETTLED'));
  return v_count;
end;
$$;
revoke all on function public.service_ready_scheduled_matches(integer) from public;
grant execute on function public.service_ready_scheduled_matches(integer) to service_role;
