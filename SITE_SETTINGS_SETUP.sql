-- Site-wide settings that admins can change from the UI.
-- Single-row table (id is always 1). Anyone can read it; only admins can update it.
create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  -- Homepage hero photo. The URL points at a resized copy stored under
  -- photos/homepage/, so deleting the gallery photo doesn't break the homepage.
  homepage_photo_url text,
  homepage_photo_path text,
  homepage_photo_alt text,
  homepage_source_photo_id uuid references public.photos(id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles(id) on delete set null
);

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

create or replace function public.set_site_settings_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
before update on public.site_settings
for each row
execute function public.set_site_settings_updated_at();

alter table public.site_settings enable row level security;

-- Clients can read, and admins can update; nobody inserts or deletes rows from the browser.
revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant update (
  homepage_photo_url,
  homepage_photo_path,
  homepage_photo_alt,
  homepage_source_photo_id,
  updated_by
) on public.site_settings to authenticated;

drop policy if exists "Anyone can read site settings" on public.site_settings;
create policy "Anyone can read site settings"
on public.site_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can update site settings" on public.site_settings;
create policy "Admins can update site settings"
on public.site_settings
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
