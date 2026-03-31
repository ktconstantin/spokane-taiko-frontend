alter table public.documents
  add column if not exists visibility text,
  add column if not exists folder text,
  add column if not exists resource_url text;

alter table public.documents
  alter column storage_path drop not null,
  alter column url drop not null;

update public.documents
set visibility = coalesce(visibility, 'member_only'),
    folder = coalesce(folder, 'sheet_music');

alter table public.documents
  alter column visibility set default 'member_only',
  alter column folder set default 'sheet_music';

alter table public.documents
  alter column visibility set not null,
  alter column folder set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'documents_visibility_check'
  ) then
    alter table public.documents
      add constraint documents_visibility_check
      check (visibility in ('public', 'member_only'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'documents_folder_check'
  ) then
    alter table public.documents
      add constraint documents_folder_check
      check (folder in ('sheet_music', 'resources'));
  end if;
end $$;

create index if not exists documents_visibility_idx
on public.documents (visibility);

create index if not exists documents_folder_idx
on public.documents (folder);

alter table public.documents enable row level security;

drop policy if exists "Authenticated users can view documents" on public.documents;
drop policy if exists "Anyone can read public documents" on public.documents;
create policy "Anyone can read public documents"
on public.documents
for select
to anon, authenticated
using (visibility = 'public');

drop policy if exists "Authenticated users can read member documents" on public.documents;
create policy "Authenticated users can read member documents"
on public.documents
for select
to authenticated
using (visibility = 'member_only');

drop policy if exists "Admin users can insert documents" on public.documents;
drop policy if exists "Admins can insert documents" on public.documents;
create policy "Admins can insert documents"
on public.documents
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

drop policy if exists "Admin users can update documents" on public.documents;
drop policy if exists "Admins can update documents" on public.documents;
create policy "Admins can update documents"
on public.documents
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

drop policy if exists "Admin users can delete documents" on public.documents;
drop policy if exists "Admins can delete documents" on public.documents;
create policy "Admins can delete documents"
on public.documents
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

insert into public.documents (
  title,
  description,
  resource_url,
  visibility,
  folder,
  created_at,
  updated_at,
  uploaded_by
)
select
  r.title,
  r.description,
  r.url,
  coalesce(r.visibility, 'public'),
  'resources',
  coalesce(r.created_at, timezone('utc', now())),
  coalesce(r.updated_at, coalesce(r.created_at, timezone('utc', now()))),
  null
from public.resources r
where not exists (
  select 1
  from public.documents d
  where d.folder = 'resources'
    and d.title = r.title
    and coalesce(d.resource_url, '') = coalesce(r.url, '')
);

drop table if exists public.resources;
