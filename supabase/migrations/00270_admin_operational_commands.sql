-- Clã das Sombras — operational admin commands
-- Apply after 00260_complete_club_operations.sql.

create or replace function public.service_update_support_ticket(
  p_ticket_id uuid,
  p_status text,
  p_assigned_admin_id uuid,
  p_actor_user_id uuid,
  p_reason text
)
returns public.support_ticket
language plpgsql
security definer
set search_path=public
as $$
declare
  v_old public.support_ticket;
  v_new public.support_ticket;
begin
  if p_status not in ('OPEN','IN_PROGRESS','WAITING_USER','WAITING_INTERNAL','RESOLVED','CLOSED') then raise exception 'invalid_ticket_status'; end if;
  if p_actor_user_id is null then raise exception 'actor_required'; end if;
  if length(trim(coalesce(p_reason,''))) < 5 then raise exception 'change_reason_required'; end if;

  select * into v_old from public.support_ticket where id=p_ticket_id for update;
  if not found then raise exception 'ticket_not_found'; end if;

  update public.support_ticket
  set status=p_status::public.ticket_status,
      assigned_admin_id=p_assigned_admin_id,
      updated_at=now()
  where id=p_ticket_id
  returning * into v_new;

  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,old_state,new_state,reason,ticket_id)
  values(p_actor_user_id,'SUPPORT_TICKET_UPDATED','SUPPORT_TICKET',p_ticket_id::text,to_jsonb(v_old),to_jsonb(v_new),trim(p_reason),p_ticket_id);
  return v_new;
end;
$$;
revoke all on function public.service_update_support_ticket(uuid,text,uuid,uuid,text) from public;
grant execute on function public.service_update_support_ticket(uuid,text,uuid,uuid,text) to service_role;

create or replace function public.service_add_ticket_note(
  p_ticket_id uuid,
  p_body text,
  p_internal boolean,
  p_actor_user_id uuid
)
returns public.ticket_note
language plpgsql
security definer
set search_path=public
as $$
declare
  v_note public.ticket_note;
begin
  if p_actor_user_id is null then raise exception 'actor_required'; end if;
  if length(trim(coalesce(p_body,''))) < 2 then raise exception 'note_required'; end if;
  if not exists(select 1 from public.support_ticket where id=p_ticket_id) then raise exception 'ticket_not_found'; end if;

  insert into public.ticket_note(ticket_id,author_user_id,internal,body)
  values(p_ticket_id,p_actor_user_id,coalesce(p_internal,true),trim(p_body))
  returning * into v_note;

  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,new_state,ticket_id,metadata)
  values(p_actor_user_id,'SUPPORT_TICKET_NOTE_ADDED','SUPPORT_TICKET',p_ticket_id::text,to_jsonb(v_note),p_ticket_id,jsonb_build_object('internal',v_note.internal));
  return v_note;
end;
$$;
revoke all on function public.service_add_ticket_note(uuid,text,boolean,uuid) from public;
grant execute on function public.service_add_ticket_note(uuid,text,boolean,uuid) to service_role;

create or replace function public.service_update_moderation_case(
  p_case_id uuid,
  p_status text,
  p_assigned_admin_id uuid,
  p_resolution jsonb,
  p_actor_user_id uuid,
  p_reason text
)
returns public.moderation_case
language plpgsql
security definer
set search_path=public
as $$
declare
  v_old public.moderation_case;
  v_new public.moderation_case;
begin
  if p_status not in ('OPEN','INVESTIGATING','ACTION_REQUIRED','RESOLVED','DISMISSED') then raise exception 'invalid_case_status'; end if;
  if p_actor_user_id is null then raise exception 'actor_required'; end if;
  if length(trim(coalesce(p_reason,''))) < 5 then raise exception 'change_reason_required'; end if;

  select * into v_old from public.moderation_case where id=p_case_id for update;
  if not found then raise exception 'moderation_case_not_found'; end if;

  update public.moderation_case
  set status=p_status::public.case_status,
      assigned_admin_id=p_assigned_admin_id,
      resolution=case when p_resolution is null then resolution else p_resolution end,
      updated_at=now()
  where id=p_case_id
  returning * into v_new;

  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,old_state,new_state,reason,metadata)
  values(p_actor_user_id,'MODERATION_CASE_UPDATED','MODERATION_CASE',p_case_id::text,to_jsonb(v_old),to_jsonb(v_new),trim(p_reason),jsonb_build_object('status',p_status));
  return v_new;
end;
$$;
revoke all on function public.service_update_moderation_case(uuid,text,uuid,jsonb,uuid,text) from public;
grant execute on function public.service_update_moderation_case(uuid,text,uuid,jsonb,uuid,text) to service_role;

create or replace function public.service_mark_payment_refund_pending(
  p_order_id uuid,
  p_actor_user_id uuid,
  p_reason text,
  p_stripe_refund_id text
)
returns public.payment_order
language plpgsql
security definer
set search_path=public
as $$
declare
  v_old public.payment_order;
  v_new public.payment_order;
begin
  if p_actor_user_id is null then raise exception 'actor_required'; end if;
  if length(trim(coalesce(p_reason,''))) < 5 then raise exception 'refund_reason_required'; end if;

  select * into v_old from public.payment_order where id=p_order_id for update;
  if not found then raise exception 'payment_order_not_found'; end if;
  if v_old.status not in ('PAID','PARTIALLY_REFUNDED') then raise exception 'payment_not_refundable'; end if;

  update public.payment_order
  set status='REFUND_PENDING',
      metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
        'admin_refund_requested',true,
        'admin_refund_reason',trim(p_reason),
        'stripe_refund_id',p_stripe_refund_id,
        'refund_requested_by',p_actor_user_id,
        'refund_requested_at',now()
      ),
      updated_at=now()
  where id=p_order_id
  returning * into v_new;

  insert into public.admin_audit_log(actor_user_id,action,target_type,target_id,old_state,new_state,reason,metadata)
  values(p_actor_user_id,'STRIPE_REFUND_REQUESTED','PAYMENT_ORDER',p_order_id::text,to_jsonb(v_old),to_jsonb(v_new),trim(p_reason),jsonb_build_object('stripe_refund_id',p_stripe_refund_id));
  return v_new;
end;
$$;
revoke all on function public.service_mark_payment_refund_pending(uuid,uuid,text,text) from public;
grant execute on function public.service_mark_payment_refund_pending(uuid,uuid,text,text) to service_role;
