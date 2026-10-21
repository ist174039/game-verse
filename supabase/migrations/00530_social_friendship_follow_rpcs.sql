-- Secure player friendship and follow writes. Actor identity always comes from auth.uid().

create or replace function public.request_friendship(p_target_user_id uuid)
returns jsonb
language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid(); v_friendship public.friendship;
begin
  if v_actor is null or (auth.jwt()->>'is_anonymous') = 'true' then raise exception 'authentication_required'; end if;
  if p_target_user_id is null or p_target_user_id=v_actor then raise exception 'invalid_friend_target'; end if;
  if not exists(select 1 from public.user_profile where id=p_target_user_id) then raise exception 'user_not_found'; end if;
  if exists(select 1 from public.user_block where (blocker_user_id=v_actor and blocked_user_id=p_target_user_id) or (blocker_user_id=p_target_user_id and blocked_user_id=v_actor)) then raise exception 'friendship_blocked'; end if;
  perform pg_advisory_xact_lock(hashtextextended(least(v_actor,p_target_user_id)::text||':'||greatest(v_actor,p_target_user_id)::text,0));

  -- A reverse pending request is accepted in place; otherwise user_a is the requester.
  select * into v_friendship from public.friendship where user_a=p_target_user_id and user_b=v_actor for update;
  if found and v_friendship.status='PENDING' then
    update public.friendship set status='ACCEPTED' where user_a=p_target_user_id and user_b=v_actor returning * into v_friendship;
    insert into public.notification(user_id,type,title,body,href)
    values(p_target_user_id,'FRIEND_ACCEPTED','Pedido de amizade aceite','O teu pedido de amizade foi aceite.','/community');
    return to_jsonb(v_friendship);
  elsif found then raise exception 'friendship_already_exists'; end if;

  select * into v_friendship from public.friendship where user_a=v_actor and user_b=p_target_user_id for update;
  if found then raise exception 'friendship_already_exists'; end if;
  insert into public.friendship(user_a,user_b,status) values(v_actor,p_target_user_id,'PENDING') returning * into v_friendship;
  insert into public.notification(user_id,type,title,body,href)
  values(p_target_user_id,'FRIEND_REQUEST','Pedido de amizade','Recebeste um pedido de amizade.','/community');
  return to_jsonb(v_friendship);
end;
$$;
revoke all on function public.request_friendship(uuid) from public, anon;
grant execute on function public.request_friendship(uuid) to authenticated;

create or replace function public.respond_friendship(p_requester_user_id uuid,p_accept boolean)
returns jsonb
language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid(); v_friendship public.friendship;
begin
  if v_actor is null or (auth.jwt()->>'is_anonymous') = 'true' then raise exception 'authentication_required'; end if;
  if p_requester_user_id is null or p_requester_user_id=v_actor then raise exception 'invalid_friendship'; end if;
  -- A block prevents accepting a relationship, but must not prevent clearing a
  -- pending request. Otherwise a blocked user's request can remain stuck forever.
  if p_accept and exists(select 1 from public.user_block where (blocker_user_id=v_actor and blocked_user_id=p_requester_user_id) or (blocker_user_id=p_requester_user_id and blocked_user_id=v_actor)) then raise exception 'friendship_blocked'; end if;
  perform pg_advisory_xact_lock(hashtextextended(least(v_actor,p_requester_user_id)::text||':'||greatest(v_actor,p_requester_user_id)::text,0));
  select * into v_friendship from public.friendship where user_a=p_requester_user_id and user_b=v_actor and status='PENDING' for update;
  if not found then raise exception 'friendship_request_not_found'; end if;
  if p_accept then
    update public.friendship set status='ACCEPTED' where user_a=p_requester_user_id and user_b=v_actor returning * into v_friendship;
    insert into public.notification(user_id,type,title,body,href)
    values(p_requester_user_id,'FRIEND_ACCEPTED','Pedido de amizade aceite','O teu pedido de amizade foi aceite.','/community');
    return to_jsonb(v_friendship);
  end if;
  delete from public.friendship where user_a=p_requester_user_id and user_b=v_actor;
  return jsonb_build_object('user_a',p_requester_user_id,'user_b',v_actor,'status','REJECTED');
end;
$$;
revoke all on function public.respond_friendship(uuid,boolean) from public, anon;
grant execute on function public.respond_friendship(uuid,boolean) to authenticated;

create or replace function public.remove_friendship(p_other_user_id uuid)
returns boolean
language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid();
begin
  if v_actor is null or (auth.jwt()->>'is_anonymous') = 'true' then raise exception 'authentication_required'; end if;
  if p_other_user_id is null or p_other_user_id=v_actor then raise exception 'invalid_friend_target'; end if;
  perform pg_advisory_xact_lock(hashtextextended(least(v_actor,p_other_user_id)::text||':'||greatest(v_actor,p_other_user_id)::text,0));
  delete from public.friendship
  where status='ACCEPTED' and ((user_a=v_actor and user_b=p_other_user_id) or (user_a=p_other_user_id and user_b=v_actor));
  return found;
end;
$$;
revoke all on function public.remove_friendship(uuid) from public, anon;
grant execute on function public.remove_friendship(uuid) to authenticated;

create or replace function public.follow_player(p_target_user_id uuid)
returns boolean
language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid();
begin
  if v_actor is null or (auth.jwt()->>'is_anonymous') = 'true' then raise exception 'authentication_required'; end if;
  if p_target_user_id is null or p_target_user_id=v_actor then raise exception 'invalid_follow_target'; end if;
  if not exists(select 1 from public.user_profile where id=p_target_user_id) then raise exception 'user_not_found'; end if;
  if exists(select 1 from public.user_block where (blocker_user_id=v_actor and blocked_user_id=p_target_user_id) or (blocker_user_id=p_target_user_id and blocked_user_id=v_actor)) then raise exception 'follow_blocked'; end if;
  insert into public.follow(follower_id,followed_id) values(v_actor,p_target_user_id) on conflict do nothing;
  return found;
end;
$$;
revoke all on function public.follow_player(uuid) from public, anon;
grant execute on function public.follow_player(uuid) to authenticated;

create or replace function public.unfollow_player(p_target_user_id uuid)
returns boolean
language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid();
begin
  if v_actor is null or (auth.jwt()->>'is_anonymous') = 'true' then raise exception 'authentication_required'; end if;
  if p_target_user_id is null or p_target_user_id=v_actor then raise exception 'invalid_follow_target'; end if;
  delete from public.follow where follower_id=v_actor and followed_id=p_target_user_id;
  return found;
end;
$$;
revoke all on function public.unfollow_player(uuid) from public, anon;
grant execute on function public.unfollow_player(uuid) to authenticated;
