-- Clã das Sombras — domain events, journal, notifications, social persistence and storage

create table if not exists public.domain_event (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid references public.universe(id) on delete cascade,
  club_id uuid references public.club(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  aggregate_type text not null,
  aggregate_id uuid,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists domain_event_unprocessed_idx on public.domain_event(occurred_at) where processed_at is null;

create table if not exists public.journal_article (
  id uuid primary key default gen_random_uuid(),
  universe_id uuid references public.universe(id) on delete cascade,
  event_id uuid references public.domain_event(id) on delete set null,
  category text not null,
  title text not null,
  summary text not null,
  body text,
  importance integer not null default 1 check (importance between 1 and 5),
  published_at timestamptz not null default now()
);

create table if not exists public.notification (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notification_user_unread_idx on public.notification(user_id,created_at desc) where read_at is null;

create table if not exists public.community_post (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.community(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  media jsonb not null default '[]'::jsonb,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table if not exists public.community_comment (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_post(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table if not exists public.community_reaction (
  post_id uuid not null references public.community_post(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null check (reaction in ('LIKE','FIRE','TROPHY','RESPECT')),
  created_at timestamptz not null default now(),
  primary key(post_id,user_id,reaction)
);

create table if not exists public.conversation (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('DIRECT','GROUP','COMMUNITY')),
  community_id uuid references public.community(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_member (
  conversation_id uuid not null references public.conversation(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key(conversation_id,user_id)
);

create table if not exists public.message (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversation(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

create table if not exists public.user_block (
  blocker_user_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_user_id,blocked_user_id),
  check(blocker_user_id <> blocked_user_id)
);

create table if not exists public.content_report (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  status text not null default 'OPEN' check (status in ('OPEN','REVIEWING','RESOLVED','REJECTED')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.domain_event enable row level security;
alter table public.journal_article enable row level security;
alter table public.notification enable row level security;
alter table public.community_post enable row level security;
alter table public.community_comment enable row level security;
alter table public.community_reaction enable row level security;
alter table public.conversation enable row level security;
alter table public.conversation_member enable row level security;
alter table public.message enable row level security;
alter table public.user_block enable row level security;
alter table public.content_report enable row level security;

create policy journal_read on public.journal_article for select to authenticated using (true);
create policy notification_own_read on public.notification for select to authenticated using (user_id=auth.uid());
create policy notification_own_update on public.notification for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy community_post_read on public.community_post for select to authenticated using (exists(select 1 from public.community c where c.id=community_id and (c.visibility='PUBLIC' or exists(select 1 from public.community_membership m where m.community_id=c.id and m.user_id=auth.uid()))));
create policy community_post_insert on public.community_post for insert to authenticated with check (author_user_id=auth.uid() and exists(select 1 from public.community_membership m where m.community_id=community_id and m.user_id=auth.uid()));
create policy community_comment_read on public.community_comment for select to authenticated using (true);
create policy community_comment_insert on public.community_comment for insert to authenticated with check (author_user_id=auth.uid());
create policy community_reaction_read on public.community_reaction for select to authenticated using (true);
create policy community_reaction_write on public.community_reaction for insert to authenticated with check (user_id=auth.uid());
create policy conversation_member_read on public.conversation_member for select to authenticated using (user_id=auth.uid());
create policy conversation_read on public.conversation for select to authenticated using (exists(select 1 from public.conversation_member m where m.conversation_id=id and m.user_id=auth.uid()));
create policy message_read on public.message for select to authenticated using (exists(select 1 from public.conversation_member m where m.conversation_id=conversation_id and m.user_id=auth.uid()));
create policy message_insert on public.message for insert to authenticated with check (sender_user_id=auth.uid() and exists(select 1 from public.conversation_member m where m.conversation_id=conversation_id and m.user_id=auth.uid()));
create policy user_block_own on public.user_block for all to authenticated using (blocker_user_id=auth.uid()) with check (blocker_user_id=auth.uid());
create policy content_report_own_read on public.content_report for select to authenticated using (reporter_user_id=auth.uid());
create policy content_report_insert on public.content_report for insert to authenticated with check (reporter_user_id=auth.uid());

-- Storage buckets are private by default. Public media uses signed URLs or explicit read policies.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
  ('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp']),
  ('club-logos','club-logos',true,5242880,array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('community-media','community-media',false,15728640,array['image/jpeg','image/png','image/webp','video/mp4']),
  ('match-evidence','match-evidence',false,26214400,array['image/jpeg','image/png','image/webp','application/pdf','video/mp4'])
on conflict(id) do update set file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

create policy avatar_owner_write on storage.objects for insert to authenticated with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy avatar_owner_update on storage.objects for update to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy club_logo_owner_write on storage.objects for insert to authenticated with check (bucket_id='club-logos' and exists(select 1 from public.club c where c.id::text=(storage.foldername(name))[1] and c.user_id=auth.uid()));
create policy community_media_member_write on storage.objects for insert to authenticated with check (bucket_id='community-media' and exists(select 1 from public.community_membership m where m.community_id::text=(storage.foldername(name))[1] and m.user_id=auth.uid()));
create policy match_evidence_participant_write on storage.objects for insert to authenticated with check (bucket_id='match-evidence' and exists(select 1 from public.match mt join public.club c on c.id in (mt.home_club_id,mt.away_club_id) where mt.id::text=(storage.foldername(name))[1] and c.user_id=auth.uid()));
