alter table public.events enable row level security;

drop policy if exists "Authenticated users can read events" on public.events;
create policy "Authenticated users can read events"
on public.events
for select
to authenticated
using (true);

drop policy if exists "Admins can insert events" on public.events;
create policy "Admins can insert events"
on public.events
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

drop policy if exists "Admins can update events" on public.events;
create policy "Admins can update events"
on public.events
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

drop policy if exists "Admins can delete events" on public.events;
create policy "Admins can delete events"
on public.events
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

drop view if exists public.public_events;

create view public.public_events as
select
  id,
  title,
  event_type,
  location,
  is_recurring,
  event_date,
  start_time,
  end_time,
  recurrence_days,
  recurring_start_time,
  recurring_end_time,
  cancelled_dates,
  created_at
from public.events;

grant select on public.public_events to anon, authenticated;
