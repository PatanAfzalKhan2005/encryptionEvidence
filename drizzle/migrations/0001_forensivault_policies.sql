-- ForensiVault grants and RLS policies

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users can view own roles"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid());

grant execute on function public.has_role(uuid, public.app_role) to authenticated;

grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Authenticated can view profiles"
  on public.profiles for select to authenticated using (true);
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

grant select, insert, update, delete on public.cases to authenticated;
grant all on public.cases to service_role;
alter table public.cases enable row level security;
create policy "Team can view cases" on public.cases for select to authenticated using (true);
create policy "Team can create cases" on public.cases for insert to authenticated with check (true);
create policy "Team can update cases" on public.cases for update to authenticated using (true) with check (true);
create policy "Team can delete cases" on public.cases for delete to authenticated using (true);

grant select, insert, update, delete on public.evidence to authenticated;
grant all on public.evidence to service_role;
alter table public.evidence enable row level security;
create policy "Team can view evidence" on public.evidence for select to authenticated using (true);
create policy "Team can upload evidence" on public.evidence for insert to authenticated with check (true);
create policy "Team can update evidence" on public.evidence for update to authenticated using (true) with check (true);
create policy "Team can delete evidence" on public.evidence for delete to authenticated using (true);

grant select, insert on public.custody_events to authenticated;
grant all on public.custody_events to service_role;
alter table public.custody_events enable row level security;
create policy "Team can view custody events" on public.custody_events for select to authenticated using (true);
create policy "Team can record custody events" on public.custody_events for insert to authenticated with check (true);

grant select, insert on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "Team can view audit logs" on public.audit_logs for select to authenticated using (true);
create policy "Team can record audit events" on public.audit_logs for insert to authenticated with check (true);

create policy "Team can read evidence files"
  on storage.objects for select to authenticated
  using (bucket_id = 'evidence-files');
create policy "Team can upload evidence files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'evidence-files');
create policy "Team can delete evidence files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'evidence-files');
