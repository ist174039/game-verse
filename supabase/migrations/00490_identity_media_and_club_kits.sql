-- Clã das Sombras — manager/club identity media and three club kits
-- Apply after 00470_gold_package_catalog.sql.

-- Restrict browser-side profile editing to identity fields only. Progression is backend-owned.
revoke update on table public.user_profile from authenticated;
revoke update on table public.user_profile from anon;
grant update(username, avatar_url, locale) on table public.user_profile to authenticated;

do $$
begin
  create type public.club_kit_type as enum ('HOME','AWAY','THIRD');
exception when duplicate_object then null;
end $$;

create table if not exists public.club_kit (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.club(id) on delete cascade,
  kit_type public.club_kit_type not null,
  image_url text,
  primary_color text not null default '#111111' check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_color text not null default '#F5BF16' check (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(club_id, kit_type)
);

alter table public.club_kit enable row level security;

drop trigger if exists club_kit_updated_at on public.club_kit;
create trigger club_kit_updated_at
before update on public.club_kit
for each row execute function public.set_updated_at();

create policy "club kits readable authenticated"
on public.club_kit for select to authenticated
using (true);

create policy "club owner inserts kits"
on public.club_kit for insert to authenticated
with check (exists(select 1 from public.club c where c.id=club_id and c.user_id=auth.uid()));

create policy "club owner updates kits"
on public.club_kit for update to authenticated
using (exists(select 1 from public.club c where c.id=club_id and c.user_id=auth.uid()))
with check (exists(select 1 from public.club c where c.id=club_id and c.user_id=auth.uid()));

create policy "club owner deletes kits"
on public.club_kit for delete to authenticated
using (exists(select 1 from public.club c where c.id=club_id and c.user_id=auth.uid()));

grant usage on type public.club_kit_type to authenticated;
grant select, insert, update, delete on table public.club_kit to authenticated;

-- Every club always owns the three visual identities, even before a custom image is uploaded.
insert into public.club_kit(club_id,kit_type,primary_color,secondary_color)
select c.id,v.kit_type::public.club_kit_type,v.primary_color,v.secondary_color
from public.club c
cross join (values
  ('HOME','#111111','#F5BF16'),
  ('AWAY','#F5BF16','#111111'),
  ('THIRD','#FFFFFF','#111111')
) as v(kit_type,primary_color,secondary_color)
on conflict(club_id,kit_type) do nothing;

create or replace function public.initialize_club_kits()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.club_kit(club_id,kit_type,primary_color,secondary_color)
  values
    (new.id,'HOME','#111111','#F5BF16'),
    (new.id,'AWAY','#F5BF16','#111111'),
    (new.id,'THIRD','#FFFFFF','#111111')
  on conflict(club_id,kit_type) do nothing;
  return new;
end;
$$;
revoke all on function public.initialize_club_kits() from public, anon, authenticated;

drop trigger if exists club_initialize_kits on public.club;
create trigger club_initialize_kits
after insert on public.club
for each row execute function public.initialize_club_kits();


-- Club identity updates must never expose competitive/economic columns to the browser.
create or replace function public.update_club_identity(
  p_club_id uuid,
  p_name text,
  p_motto text,
  p_logo_url text
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_name text := trim(coalesce(p_name,''));
  v_motto text := nullif(trim(coalesce(p_motto,'')), '');
  v_logo text := nullif(trim(coalesce(p_logo_url,'')), '');
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if not exists(select 1 from public.club c where c.id=p_club_id and c.user_id=auth.uid()) then
    raise exception 'club_not_owned';
  end if;
  if char_length(v_name) < 3 or char_length(v_name) > 60 then raise exception 'invalid_club_name'; end if;
  if v_motto is not null and char_length(v_motto) > 120 then raise exception 'invalid_club_motto'; end if;
  if v_logo is not null and char_length(v_logo) > 2048 then raise exception 'invalid_club_logo_url'; end if;

  update public.club
  set name=v_name, motto=v_motto, logo_url=v_logo
  where id=p_club_id;

  return p_club_id;
end;
$$;

revoke all on function public.update_club_identity(uuid,text,text,text) from public, anon;
grant execute on function public.update_club_identity(uuid,text,text,text) to authenticated;

-- Identity media buckets. User-provided SVG is intentionally excluded.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
  ('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp']),
  ('club-logos','club-logos',true,5242880,array['image/jpeg','image/png','image/webp']),
  ('club-kits','club-kits',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update
set public=excluded.public,
    file_size_limit=excluded.file_size_limit,
    allowed_mime_types=excluded.allowed_mime_types;

create policy avatar_owner_delete on storage.objects for delete to authenticated
using (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);

create policy club_logo_owner_delete on storage.objects for delete to authenticated
using (bucket_id='club-logos' and exists(
  select 1 from public.club c
  where c.id::text=(storage.foldername(name))[1] and c.user_id=auth.uid()
));

create policy club_kit_owner_insert on storage.objects for insert to authenticated
with check (bucket_id='club-kits' and exists(
  select 1 from public.club c
  where c.id::text=(storage.foldername(name))[1] and c.user_id=auth.uid()
));

create policy club_kit_owner_update on storage.objects for update to authenticated
using (bucket_id='club-kits' and exists(
  select 1 from public.club c
  where c.id::text=(storage.foldername(name))[1] and c.user_id=auth.uid()
))
with check (bucket_id='club-kits' and exists(
  select 1 from public.club c
  where c.id::text=(storage.foldername(name))[1] and c.user_id=auth.uid()
));

create policy club_kit_owner_delete on storage.objects for delete to authenticated
using (bucket_id='club-kits' and exists(
  select 1 from public.club c
  where c.id::text=(storage.foldername(name))[1] and c.user_id=auth.uid()
));
