-- Lets specific users add new members without full admin rights.
-- Admins (role = 'admin') can always add members; anyone else needs can_add_members = true.
alter table public.profiles
add column if not exists can_add_members boolean not null default false;

-- Lock down which profile columns the browser can write.
-- Before this, "Users can update own profile" had no column restriction, so any
-- logged-in member could set their own role to 'admin'. Members may now only
-- change their name; role, dues status and permissions are changed server-side
-- (Edge Function / dashboard), which use the service role and are unaffected.
revoke insert, update on public.profiles from anon, authenticated;
grant update (full_name, updated_at) on public.profiles to authenticated;

alter policy "Users can update own profile"
on public.profiles
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Profiles (names, emails, roles, dues status) are only readable when signed in.
-- Previously "Anyone can view profiles" let logged-out visitors read every row.
alter policy "Anyone can view profiles"
on public.profiles
to authenticated
using (true);

alter policy "Anyone can view profiles"
on public.profiles
rename to "Signed-in users can view profiles";
