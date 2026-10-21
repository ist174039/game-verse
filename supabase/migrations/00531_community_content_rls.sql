-- Keep community comments and reactions within the visibility boundary of their post.
-- Public community posts are readable by signed-in users; writes require membership.

drop policy if exists community_comment_read on public.community_comment;
create policy community_comment_read on public.community_comment
for select to authenticated
using (
  exists (
    select 1
    from public.community_post p
    join public.community c on c.id = p.community_id
    where p.id = post_id
      and (
        c.visibility = 'PUBLIC'
        or exists (
          select 1 from public.community_membership m
          where m.community_id = c.id and m.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists community_comment_insert on public.community_comment;
create policy community_comment_insert on public.community_comment
for insert to authenticated
with check (
  author_user_id = auth.uid()
  and exists (
    select 1
    from public.community_post p
    join public.community_membership m on m.community_id = p.community_id
    where p.id = post_id and m.user_id = auth.uid()
  )
);

drop policy if exists community_reaction_read on public.community_reaction;
create policy community_reaction_read on public.community_reaction
for select to authenticated
using (
  exists (
    select 1
    from public.community_post p
    join public.community c on c.id = p.community_id
    where p.id = post_id
      and (
        c.visibility = 'PUBLIC'
        or exists (
          select 1 from public.community_membership m
          where m.community_id = c.id and m.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists community_reaction_write on public.community_reaction;
create policy community_reaction_write on public.community_reaction
for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.community_post p
    join public.community_membership m on m.community_id = p.community_id
    where p.id = post_id and m.user_id = auth.uid()
  )
);
