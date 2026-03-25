alter table public.profiles
add column if not exists is_dues_member boolean not null default false;

create table if not exists public.member_dues_payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  dues_month date not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references public.profiles(id) on delete set null
);

create unique index if not exists member_dues_payments_member_month_idx
on public.member_dues_payments (member_id, dues_month);

create index if not exists member_dues_payments_member_id_idx
on public.member_dues_payments (member_id);

create or replace function public.set_member_dues_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_member_dues_updated_at on public.member_dues_payments;

create trigger set_member_dues_updated_at
before update on public.member_dues_payments
for each row
execute function public.set_member_dues_updated_at();

alter table public.member_dues_payments enable row level security;

drop policy if exists "Admins can read all dues payments" on public.member_dues_payments;
create policy "Admins can read all dues payments"
on public.member_dues_payments
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

drop policy if exists "Members can read their own dues payments" on public.member_dues_payments;
create policy "Members can read their own dues payments"
on public.member_dues_payments
for select
to authenticated
using (member_id = auth.uid());

drop policy if exists "Admins can insert dues payments" on public.member_dues_payments;
create policy "Admins can insert dues payments"
on public.member_dues_payments
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

drop policy if exists "Admins can update dues payments" on public.member_dues_payments;
create policy "Admins can update dues payments"
on public.member_dues_payments
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

drop policy if exists "Admins can delete dues payments" on public.member_dues_payments;
create policy "Admins can delete dues payments"
on public.member_dues_payments
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
