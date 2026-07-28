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

-- ============================================================
-- Storage: qr-temp (public QR PNGs for ticket emails)
-- Paste di Supabase SQL Editor jika bucket belum ada.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('qr-temp', 'qr-temp', true)
on conflict (id) do nothing;

create policy "Allow anon upload qr-temp"
on storage.objects for insert
to anon
with check (bucket_id = 'qr-temp');

create policy "Allow anon read qr-temp"
on storage.objects for select
to anon
using (bucket_id = 'qr-temp');

-- ============================================================
-- RPC: get_event_summary
-- ============================================================
create or replace function public.get_event_summary(
  p_event_id uuid,
  p_group_by_key text,
  p_source_column text
)
returns table (
  group_value text,
  total_participants bigint,
  checked_in_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    coalesce(nullif(
      case
        when p_source_column = 'custom_data' then p.custom_data ->> p_group_by_key
        when p_source_column = 'extra_data' then p.extra_data ->> p_group_by_key
        when p_source_column = 'institution' then p.extra_data ->> 'institution'
        when p_source_column = 'phone' then p.extra_data ->> 'phone'
        else null
      end, ''
    ), 'Tidak Diketahui') as group_value,
    count(*)::bigint as total_participants,
    count(*) filter (where p.is_checked_in = true)::bigint as checked_in_count
  from participants p
  where p.event_id = p_event_id
  group by 1
  order by total_participants desc, group_value asc;
end;
$$;

-- ============================================================
-- RPC: batch_check_in
-- ============================================================
create or replace function public.batch_check_in(tokens text[])
returns table (
  qr_token text,
  is_checked_in boolean,
  check_in_time timestamptz
)
language sql
security definer
set search_path = public
as $$
  update participants p
  set
    is_checked_in = true,
    check_in_time = coalesce(p.check_in_time, now())
  where p.qr_token = any(tokens)
  returning p.qr_token, p.is_checked_in, p.check_in_time;
$$;
