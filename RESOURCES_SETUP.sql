create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  url text not null,
  category text not null,
  visibility text not null check (visibility in ('public', 'member_only')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists resources_visibility_idx
on public.resources (visibility);

create index if not exists resources_category_idx
on public.resources (category);

create or replace function public.set_resources_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_resources_updated_at on public.resources;

create trigger set_resources_updated_at
before update on public.resources
for each row
execute function public.set_resources_updated_at();

alter table public.resources enable row level security;

drop policy if exists "Anyone can read public resources" on public.resources;
create policy "Anyone can read public resources"
on public.resources
for select
to anon, authenticated
using (visibility = 'public');

drop policy if exists "Authenticated users can read member resources" on public.resources;
create policy "Authenticated users can read member resources"
on public.resources
for select
to authenticated
using (visibility = 'member_only');

drop policy if exists "Admins can insert resources" on public.resources;
create policy "Admins can insert resources"
on public.resources
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Admins can update resources" on public.resources;
create policy "Admins can update resources"
on public.resources
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

drop policy if exists "Admins can delete resources" on public.resources;
create policy "Admins can delete resources"
on public.resources
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
