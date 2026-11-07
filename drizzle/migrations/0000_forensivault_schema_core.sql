-- ForensiVault core schema: roles, profiles, cases, evidence, custody, audit

create type public.app_role as enum ('ADMIN','INVESTIGATOR','AUDITOR','LEGAL_OFFICER','SYSTEM');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'New User',
  email text,
  status text not null default 'ACTIVE',
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.cases (
  id text primary key,
  title text not null,
  description text,
  type text not null default 'Cybercrime',
  priority text not null default 'MEDIUM',
  location text,
  investigator text not null,
  status text not null default 'PENDING',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evidence (
  id text primary key,
  name text not null,
  case_id text not null,
  type text not null default 'DOCUMENT',
  collected_by text,
  collection_date date,
  collection_time text,
  collection_location text,
  priority text not null default 'MEDIUM',
  remarks text,
  description text,
  mime_type text,
  file_size bigint not null default 0,
  storage_path text not null,
  uploaded_date date not null default current_date,
  integrity_status text not null default 'PENDING',
  encryption_status text not null default 'PENDING',
  processing_status text not null default 'UNPROCESSED',
  original_hash text,
  current_hash text,
  last_verified timestamptz,
  storage_status text,
  processed_at timestamptz,
  processed_by text,
  uploaded_by uuid,
  created_at timestamptz not null default now()
);

create table public.custody_events (
  id text primary key,
  evidence_id text not null references public.evidence(id) on delete cascade,
  action text not null,
  user_name text not null,
  role text not null,
  status text,
  remarks text,
  ip_address text,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id text primary key,
  user_name text not null,
  role text not null,
  action text not null,
  resource text,
  result text not null default 'SUCCESS',
  details text,
  created_at timestamptz not null default now()
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;
