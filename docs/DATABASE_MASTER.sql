-- MASTER DATABASE SCHEMA (Regesit)
-- Includes Tables, Indices, RPCs, and RLS
-- Added 2026-08-02: Storage Bucket for participant uploads

CREATE TABLE IF NOT EXISTS public.events (...); -- Simplified for master reference
CREATE TABLE IF NOT EXISTS public.participants (...);
CREATE TABLE IF NOT EXISTS public.profiles (...);

-- RPCs (Database-side logic)
-- 1. Analytics Aggregation
CREATE OR REPLACE FUNCTION public.get_event_summary(...) ...;
-- 2. Batch Check-in
CREATE OR REPLACE FUNCTION public.batch_checkin(...) ...;

-- RLS Policies (From dokumentasi_skema.sql)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select_policy" ...;
-- [All other policies from dokumentasi_skema.sql applied here]

CREATE TABLE IF NOT EXISTS public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_online boolean default false,
  -- is_online: true = Non-QR/Webinar event (no QR ticket generated)
  --            false = QR Code event (QR ticket generated and sent to participant)
  created_at timestamptz default now()
);

-- Storage Bucket: participant-uploads
-- Created: 2026-08-02
-- Purpose: Store files uploaded by participants via custom Upload field
-- file_size_limit: 5MB, allowed: PDF, PNG, JPG only
-- RLS: anon+authenticated can INSERT, authenticated can SELECT
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'participant-uploads',
  'participant-uploads',
  false,
  5242880,
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Participants can upload files"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'participant-uploads');

CREATE POLICY "Organizers can view participant uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'participant-uploads');
