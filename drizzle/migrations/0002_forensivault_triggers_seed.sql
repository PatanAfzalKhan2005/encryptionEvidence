-- Signup trigger, admin helpers, seed demo accounts

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role public.app_role := 'INVESTIGATOR';
begin
  if new.raw_user_meta_data ? 'role' then
    new_role := (new.raw_user_meta_data->>'role')::public.app_role;
  end if;
  if new_role = 'ADMIN' then
    new_role := 'INVESTIGATOR';
  end if;
  insert into public.profiles (id, name, email)
    values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email);
  insert into public.user_roles (user_id, role) values (new.id, new_role);
  return new;
end
$$;
grant execute on function public.handle_new_user() to authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin-scoped team listing (roles live in protected user_roles)
create or replace function public.list_all_users()
returns table (
  id uuid,
  name text,
  email text,
  status text,
  last_login_at timestamptz,
  created_at timestamptz,
  role text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.email, p.status, p.last_login_at, p.created_at,
         coalesce(r.role::text, 'INVESTIGATOR')
  from public.profiles p
  left join public.user_roles r on r.user_id = p.id
  order by p.created_at asc
$$;
grant execute on function public.list_all_users() to authenticated;

-- Admin-only status change
create or replace function public.admin_set_user_status(_user_id uuid, _status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'ADMIN') then
    raise exception 'FORBIDDEN: admin role required';
  end if;
  update public.profiles set status = _status where id = _user_id;
end
$$;
grant execute on function public.admin_set_user_status(uuid, text) to authenticated;

-- ── seed demo accounts (password: demo1234) ─────────────────
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'admin@forensivault.com', crypt('demo1234', gen_salt('bf')), now(),
   '{"name":"Admin User","role":"ADMIN"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'investigator@forensivault.com', crypt('demo1234', gen_salt('bf')), now(),
   '{"name":"Det. Sarah Chen","role":"INVESTIGATOR"}', now(), now(), '', ''),
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'auditor@forensivault.com', crypt('demo1234', gen_salt('bf')), now(),
   '{"name":"James Auditor","role":"AUDITOR"}', now(), now(), '', '');

-- Trigger downgrades ADMIN from signup metadata; restore the seed admin role.
update public.user_roles
  set role = 'ADMIN'
  where user_id = (select id from auth.users where email = 'admin@forensivault.com');

insert into auth.identities (
  id, user_id, provider, provider_id, identity_data, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id, 'email', u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  now(), now(), now()
from auth.users u
where u.email in ('admin@forensivault.com','investigator@forensivault.com','auditor@forensivault.com');
