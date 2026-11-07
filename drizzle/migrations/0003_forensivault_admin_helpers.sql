-- Admin helpers with PostgREST-friendly parameter names

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(auth.uid(), 'ADMIN')
$$;
grant execute on function public.is_admin() to authenticated;

create or replace function public.set_user_status(p_user_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'ADMIN') then
    raise exception 'FORBIDDEN: admin role required';
  end if;
  update public.profiles set status = p_status where id = p_user_id;
end
$$;
grant execute on function public.set_user_status(uuid, text) to authenticated;
