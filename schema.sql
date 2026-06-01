-- ============================================================
-- bdForms — Executable DB Schema (paste di Supabase SQL Editor)
-- ============================================================

-- Table 1: events
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Table 2: participants
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  email text,
  signature_url text,                                   -- TTD Base64 JPEG (TEXT langsung, no storage bucket)
  qr_token text unique default gen_random_uuid()::text, -- auto-generated token
  is_checked_in boolean default false,
  check_in_time timestamptz
);

-- Index krusial buat kecepatan pencarian server-side
create index if not exists idx_participants_qr_token on participants(qr_token);

-- ============================================================
-- Seed 1 event biar langsung punya event_id buat dev.
-- COPY uuid yang ke-return, taruh ke NEXT_PUBLIC_EVENT_ID di .env.local
-- ============================================================
insert into events (name) values ('Hackathon Demo Event') returning id;

-- (MVP) RLS sengaja DI-DISABLE buat kecepatan dev — sesuai PRD section 5.
-- Production-ready bakal pake RLS policy berbasis event_id.
alter table events disable row level security;
alter table participants disable row level security;
