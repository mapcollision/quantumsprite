-- PartySnap — esquema de base de datos
-- Copia y pega esto completo en Supabase → SQL Editor → Run

create extension if not exists "pgcrypto";

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  admin_token uuid not null default gen_random_uuid(),
  name text not null,
  event_date date,
  upload_enabled boolean not null default true,
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

-- Seguridad: la app NUNCA llama a Supabase directamente desde el navegador.
-- Todo pasa por nuestras propias rutas de API (servidor), usando la
-- Secret/Service Role key. Por eso activamos RLS y NO agregamos políticas:
-- así ninguna llave pública (anon/publishable) puede leer ni escribir nada.
alter table events enable row level security;
alter table media enable row level security;
