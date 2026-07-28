-- ============================================================
-- bdForms — Avatar Support Migration
-- Paste di Supabase SQL Editor untuk mengaktifkan fitur foto profil
-- ============================================================

-- 1. Tambah kolom avatar_url ke tabel profiles (jika belum ada)
alter table profiles add column if not exists avatar_url text;

-- 2. Buat storage bucket 'avatars' (public, supaya bisa diakses langsung)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 3. Policy: User yang login bisa upload avatar ke folder miliknya sendiri
create policy "Users can upload own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: User yang login bisa update/replace avatar miliknya
create policy "Users can update own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Semua orang bisa lihat avatar (public bucket)
create policy "Anyone can view avatars"
on storage.objects for select
to public
using (bucket_id = 'avatars');

-- 6. Policy: User bisa hapus avatar miliknya sendiri
create policy "Users can delete own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);