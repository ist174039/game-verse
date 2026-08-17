-- Clã das Sombras — persistent social operations
-- Apply after 00290_market_auction_runtime.sql.

create unique index if not exists one_community_conversation_idx
on public.conversation(community_id) where kind='COMMUNITY' and community_id is not null;

create or replace function public.create_community_with_owner(
  p_name text,
  p_slug text,
  p_description text,
  p_visibility text default 'PUBLIC'
)
returns public.community
language plpgsql security definer set search_path=public
as $$
declare v_community public.community;v_conversation public.conversation;
begin
  if auth.uid() is null then raise exception 'authentication_required';end if;
  if length(trim(coalesce(p_name,'')))<3 then raise exception 'community_name_too_short';end if;
  if p_slug !~ '^[a-z0-9][a-z0-9-]{2,48}$' then raise exception 'invalid_community_slug';end if;
  if p_visibility not in ('PUBLIC','PRIVATE','INVITE_ONLY','APPROVAL_REQUIRED') then raise exception 'invalid_community_visibility';end if;
  insert into public.community(owner_user_id,name,slug,description,visibility)
  values(auth.uid(),trim(p_name),lower(trim(p_slug)),nullif(trim(coalesce(p_description,'')),''),p_visibility)
  returning * into v_community;
  insert into public.community_membership(community_id,user_id,role) values(v_community.id,auth.uid(),'OWNER');
  insert into public.conversation(kind,community_id,title) values('COMMUNITY',v_community.id,v_community.name) returning * into v_conversation;
  insert into public.conversation_member(conversation_id,user_id) values(v_conversation.id,auth.uid());
  return v_community;
end;
$$;
revoke all on function public.create_community_with_owner(text,text,text,text) from public;
grant execute on function public.create_community_with_owner(text,text,text,text) to authenticated;

create or replace function public.join_public_community(p_community_id uuid)
returns public.community_membership
language plpgsql security definer set search_path=public
as $$
declare v_community public.community;v_membership public.community_membership;v_conversation public.conversation;
begin
  if auth.uid() is null then raise exception 'authentication_required';end if;
  select * into v_community from public.community where id=p_community_id for update;
  if not found then raise exception 'community_not_found';end if;
  if v_community.visibility<>'PUBLIC' then raise exception 'community_requires_controlled_admission';end if;
  insert into public.community_membership(community_id,user_id,role) values(p_community_id,auth.uid(),'MEMBER')
  on conflict(community_id,user_id) do update set user_id=excluded.user_id returning * into v_membership;
  insert into public.conversation(kind,community_id,title) values('COMMUNITY',p_community_id,v_community.name)
  on conflict(community_id) where kind='COMMUNITY' and community_id is not null do nothing;
  select * into v_conversation from public.conversation where kind='COMMUNITY' and community_id=p_community_id;
  insert into public.conversation_member(conversation_id,user_id) values(v_conversation.id,auth.uid()) on conflict do nothing;
  return v_membership;
end;
$$;
revoke all on function public.join_public_community(uuid) from public;
grant execute on function public.join_public_community(uuid) to authenticated;

create or replace function public.create_community_post(p_community_id uuid,p_body text)
returns public.community_post
language plpgsql security definer set search_path=public
as $$
declare v_post public.community_post;
begin
  if auth.uid() is null then raise exception 'authentication_required';end if;
  if length(trim(coalesce(p_body,'')))<2 or length(p_body)>5000 then raise exception 'invalid_post_body';end if;
  if not exists(select 1 from public.community_membership where community_id=p_community_id and user_id=auth.uid()) then raise exception 'community_membership_required';end if;
  insert into public.community_post(community_id,author_user_id,body) values(p_community_id,auth.uid(),trim(p_body)) returning * into v_post;
  return v_post;
end;
$$;
revoke all on function public.create_community_post(uuid,text) from public;
grant execute on function public.create_community_post(uuid,text) to authenticated;

create or replace function public.start_direct_conversation(p_other_user_id uuid)
returns public.conversation
language plpgsql security definer set search_path=public
as $$
declare v_conversation public.conversation;
begin
  if auth.uid() is null then raise exception 'authentication_required';end if;
  if p_other_user_id=auth.uid() then raise exception 'cannot_message_self';end if;
  if not exists(select 1 from public.user_profile where id=p_other_user_id) then raise exception 'user_not_found';end if;
  if exists(select 1 from public.user_block where (blocker_user_id=auth.uid() and blocked_user_id=p_other_user_id) or (blocker_user_id=p_other_user_id and blocked_user_id=auth.uid())) then raise exception 'direct_message_blocked';end if;

  select c.* into v_conversation
  from public.conversation c
  where c.kind='DIRECT'
    and (select count(*) from public.conversation_member cm where cm.conversation_id=c.id)=2
    and exists(select 1 from public.conversation_member cm where cm.conversation_id=c.id and cm.user_id=auth.uid())
    and exists(select 1 from public.conversation_member cm where cm.conversation_id=c.id and cm.user_id=p_other_user_id)
  order by c.created_at desc limit 1;
  if found then return v_conversation;end if;

  insert into public.conversation(kind) values('DIRECT') returning * into v_conversation;
  insert into public.conversation_member(conversation_id,user_id) values(v_conversation.id,auth.uid()),(v_conversation.id,p_other_user_id);
  return v_conversation;
end;
$$;
revoke all on function public.start_direct_conversation(uuid) from public;
grant execute on function public.start_direct_conversation(uuid) to authenticated;

create or replace function public.send_social_message(p_conversation_id uuid,p_body text)
returns public.message
language plpgsql security definer set search_path=public
as $$
declare v_message public.message;v_conversation public.conversation;v_other uuid;
begin
  if auth.uid() is null then raise exception 'authentication_required';end if;
  if length(trim(coalesce(p_body,'')))<1 or length(p_body)>4000 then raise exception 'invalid_message_body';end if;
  select * into v_conversation from public.conversation where id=p_conversation_id;
  if not found then raise exception 'conversation_not_found';end if;
  if not exists(select 1 from public.conversation_member where conversation_id=p_conversation_id and user_id=auth.uid()) then raise exception 'conversation_membership_required';end if;
  if v_conversation.kind='DIRECT' then
    select user_id into v_other from public.conversation_member where conversation_id=p_conversation_id and user_id<>auth.uid() limit 1;
    if exists(select 1 from public.user_block where (blocker_user_id=auth.uid() and blocked_user_id=v_other) or (blocker_user_id=v_other and blocked_user_id=auth.uid())) then raise exception 'direct_message_blocked';end if;
  end if;
  insert into public.message(conversation_id,sender_user_id,body) values(p_conversation_id,auth.uid(),trim(p_body)) returning * into v_message;
  return v_message;
end;
$$;
revoke all on function public.send_social_message(uuid,text) from public;
grant execute on function public.send_social_message(uuid,text) to authenticated;
