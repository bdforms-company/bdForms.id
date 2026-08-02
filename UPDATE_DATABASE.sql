-- Jalankan ini di Supabase SQL Editor:

-- 1. Tambah kolom is_online
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- 2. Tambah kolom location (jika belum ada)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS location TEXT;

-- 3. Tambah kolom event_date & event_end (jika belum ada)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS event_end TIMESTAMPTZ;

-- 4. Tambah kolom banner_url (jika belum ada)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- 5. Tambah kolom package_type, package_status, owner_id, slug, custom_fields (jika belum ada)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS package_type TEXT,
ADD COLUMN IF NOT EXISTS package_status TEXT,
ADD COLUMN IF NOT EXISTS owner_id UUID,
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS custom_fields JSONB;

-- 6. Bucket Storage untuk upload peserta
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'participant-uploads',
  'participant-uploads',
  false,
  5242880,
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Kebijakan RLS (Opsional, sesuaikan dengan kebutuhan)
CREATE POLICY "Participants can upload files"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'participant-uploads');

CREATE POLICY "Organizers can view participant uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'participant-uploads');
