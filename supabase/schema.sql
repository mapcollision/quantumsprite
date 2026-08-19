-- PartySnap database schema
-- Copy and paste this entirely into Supabase → SQL Editor → Run

create extension if not exists "pgcrypto";

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  admin_token uuid not null default gen_random_uuid(),
  name text not null,
  event_date date,
  upload_enabled boolean not null default true,
  expired boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  storage_path text not null,
  guest_name text,
  media_type text not null default 'image',
  created_at timestamptz not null default now()
);

create index if not exists media_event_id_idx on media(event_id);
create unique index if not exists events_admin_token_idx on events(admin_token);

alter table events enable row level security;
alter table media enable row level security;
