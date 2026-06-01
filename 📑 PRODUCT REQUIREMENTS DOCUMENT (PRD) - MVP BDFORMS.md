

##  FINAL PRODUCT REQUIREMENTS
## DOCUMENT (PRD) - BDFORMS MVP
Status: LOCKED (12-Hour Hackathon Edition)
## 1. Product Overview
● Product Name: bdForms
● Tagline: Fast-Track Registration Platform
● Primary Objective: Mendigitalisasi meja registrasi dengan waktu check-in di bawah
3 detik, 100% paperless, dan menggunakan arsitektur offline-first scanner yang kebal
terhadap koneksi internet venue yang mati.
## 2. Target User & Problem Statement
● Organizers: Kewalahan mengatur antrean dan sinkronisasi data sering terputus
akibat sinyal Wi-Fi/seluler venue yang buruk.
● Attendees: Antrean panjang dan proses tanda tangan manual yang memperlambat
laju registrasi.
● Security Flaw: Sistem form digital konvensional sangat rentan kecurangan "titip
absen" melalui screenshot barcode/QR.
- Core Unique Selling Proposition (USP)
- Self-Service Signature: Peserta melakukan Tanda Tangan Digital (TTD) langsung di
smartphone masing-masing (Canvas to Base64).
- Offline-First Sub-3-Second Check-in: Proses scanning dan validasi dilakukan
melalui local state memory, bukan live fetch database per scan.
- Anti-Cheat System: * Layar verifikasi memiliki jam digital real-time (mencegah
screenshot statis).
○ Sistem deteksi ganda dengan State "REJECTED" untuk QR yang di-scan dua
kali.
- Scope of Work (3 Core Screens Only)
Tim engineering HANYA membangun 3 antarmuka berikut:
● Page 1: Registration (User Facing)
○ Input: Nama, Email, dan komponen
## <canvas>
untuk TTD.
## ○ Action: Saat
submit
, data di-
## INSERT
ke database. UI langsung mengambil
qr_token
(yang di-generate oleh DB) dan menampilkannya sebagai QR
Code statis di layar peserta.
● Page 2: Scanner (Admin Facing - Mobile PWA)
○ UI: Tombol raksasa "TAP TO SCAN" menggunakan
html5-qrcode
## .

○ Logic (Offline-First): Saat halaman dimuat (saat ada sinyal awal), sistem
men-download seluruh data pendaftar ke local state (Zustand/IndexedDB).
Proses scanning mencocokkan data secara lokal. Data yang sukses di-scan
masuk ke background queue untuk di-
## UPDATE
ke server kapan pun internet
tersedia.
● Page 3: Verification Security Screen (Admin Facing)
○ State A (VERIFIED - Layar Hijau): Jika
is_checked_in == false
## .
Tampilkan Nama Peserta, Render Base64 TTD, dan Jam Digital Berdetak.
Update status di local state menjadi
true
## .
○ State B (REJECTED - Layar Merah): Jika
is_checked_in == true
## .
Tampilkan peringatan raksasa: "SUDAH CHECK-IN PADA [waktu]". Cegah
eksekusi lanjutan.
## 5. Technical Architecture
● Frontend: Next.js (App Router), React, Tailwind CSS, Shadcn UI, Zustand (untuk
local state management).
● Backend & Database: Supabase (PostgreSQL).
● Security Posture: Row Level Security (RLS) di-DISABLE murni untuk kecepatan
development MVP. (Narasi juri: Arsitektur production-ready akan menggunakan RLS
policy berbasis event_id).
## 6. Executable Database Schema
Eksekusi script ini di Supabase SQL Editor:
## SQL
-- Table 1: events
create table events (
id uuid primary key default gen_random_uuid(),
name text not null,
created_at timestamptz default now()
## );

-- Table 2: participants
create table participants (
id uuid primary key default gen_random_uuid(),
event_id uuid references events(id) on delete cascade,

name text not null,
email text,
signature_url text, -- Menyimpan data TTD dalam format Base64 TEXT
qr_token text unique default gen_random_uuid()::text, -- Auto-generate token
is_checked_in boolean default false,
check_in_time timestamptz
## );

-- Indexing krusial untuk kecepatan pencarian lokal/server
create index idx_participants_qr_token on participants(qr_token);

- Strict Out of Scope (Haram Disentuh Saat Hackathon)
Untuk memastikan code freeze tepat waktu, fitur berikut dilarang dikerjakan dan hanya
digunakan untuk presentasi Future Roadmap:
- Dashboard Analytics berupa grafik dan diagram.
- Pengiriman QR Code via Email (SMTP rawan delay, buang waktu setup).
- Integrasi hardware USB Barcode Scanner kasir.
- Penyimpanan gambar TTD menggunakan Supabase Storage (MVP menggunakan
## TEXT
Base64 langsung ke tabel untuk memangkas kerumitan storage bucket).
- Setup Row Level Security (RLS) Policies.


## 1. SOFTWARE REQUIREMENTS SPECIFICATION
## (SRS)
Functional Requirements (FR)
● FR-1 (Pendaftaran): Sistem menerima input string (nama, email) dan gambar
(Canvas TTD) dari client.
● FR-2 (Payload Compression): Sistem klien wajib mengonversi input
## <canvas>

menjadi format
image/jpeg
dengan parameter kualitas maksimal
## 0.3
sebelum
disimpan atau di-
## INSERT
ke database. (Target ukuran: < 20KB per pendaftar).
● FR-3 (QR Generation): Sistem mengembalikan
qr_token
dari database
(auto-generated UUID) dan me-render-nya sebagai QR Code statis di UI secara
instan.
● FR-4 (Offline Caching): Klien Admin (Scanner) memiliki fungsi fetch untuk menarik
seluruh baris dari tabel
participants
berdasar
event_id
dan menyimpannya ke
local state (Zustand).
● FR-5 (Local Validation): Modul Scanner membaca string dari QR Code dan
melakukan
## FIND
pada data di local state dengan kompleksitas waktu O(1).
● FR-6 (Anti-Cheat Logic): Sistem membedakan aksi untuk
is_checked_in ==
false
(izinkan & update state lokal jadi
true
) dan
is_checked_in == true

## (blokir).
● FR-7 (Hardware Exception Handling): Jika API
html5-qrcode
gagal
mendapatkan instansiasi kamera (permission denied/hardware failure), sistem
membatalkan inisialisasi secara graceful dan me-render UI fallback.
Non-Functional Requirements (NFR)
● NFR-1 (Latency): Waktu antara scan QR hingga layar berpindah ke
"VERIFIED/REJECTED" maksimal 300ms.
● NFR-2 (Offline Resiliency): Aplikasi Scanner (Page 2 & 3) kebal terhadap
disconnect Wi-Fi mendadak tanpa memicu crash atau infinite loading.
● NFR-3 (Data Payload Limit): Kapasitas memori browser mobile tidak boleh
melampaui batas aman (dijamin oleh FR-2).
● NFR-4 (Day-Zero Deployment): Lingkungan production (Vercel) wajib terhubung
dengan repository (CI/CD) pada Jam ke-1 development untuk mendeteksi build-error
Next.js lebih awal.



##  2. SOFTWARE DESIGN DOCUMENT (SDD) - MVP
Dokumen ini mendefinisikan bagaimana arsitektur state lokal bekerja untuk menopang klaim
"Kebal Internet".
Architecture Component (Zustand Local Store)
Kunci keberhasilan offline-first ada di state management. Berikut adalah blueprint untuk file
store/useScannerStore.ts
## :
interface Participant {
id: string;
name: string;
signature_url: string; // Harus format kompresi JPEG Base64
qr_token: string;
is_checked_in: boolean;
check_in_time: string | null;
## }

interface ScannerStore {
participants: Record<string, Participant>; // Lookup O(1) < 1ms
syncQueue: string[]; // Antrean ID untuk background sync
cameraError: boolean; // State tangkapan FR-7

## // Actions
fetchInitialData: (eventId: string) => Promise<void>;
validateScan: (qrToken: string) => 'NOT_FOUND' | 'VERIFIED' | 'DUPLICATE';
processCheckIn: (qrToken: string) => void;
syncToServer: () => Promise<void>;
setCameraError: (status: boolean) => void;
## }


Data Flow Diagram (Proses Scan Offline)
- Init (Online): Admin buka Halaman Scanner -> Aplikasi menembak
## SELECT *
FROM participants
-> Data disimpan ke
Zustand store
## (di-mapping
menggunakan
qr_token
sebagai key objek).
- Scan (Offline Mode): Kamera mendeteksi
token_123
-> Aplikasi mencari
store.participants["token_123"]
. Waktu komputasi: O(1) atau nyaris 0 ms.
## 3. Evaluasi State Lokal:
## ○ Jika
is_checked_in == false
-> Update properti lokal jadi
true
, render
Page 3 (Hijau).
## ○ Jika
is_checked_in == true
-> Langsung render Page 3 (Merah).
- Background Sync (Opsional untuk MVP): Jika ada internet, eksekusi
## UPDATE
participants SET is_checked_in = true
di background untuk semua token
yang berhasil lolos di langkah 3.
## Camera Exception Fallback Architecture
## Jika
html5-qrcode
melempar
NotAllowedError
atau
NotFoundError
## :
● A. Manual Token Input (Rekomendasi Terpilih): UI me-render layar abu-abu
dengan form
<input type="text">
darurat. Admin mengetik 6 karakter terakhir
dari
qr_token
(atau UUID versi pendek) yang tercetak di bawah QR peserta.
Menembak fungsi
validateScan
secara manual.
○ Trade-off: Memperlama waktu check-in (> 3 detik), tapi menyelamatkan event
jika kamera mati.
● B. External Camera Request: Meminta peserta memfoto QR menggunakan kamera
bawaan HP lalu mengunggahnya (upload) ke sistem lokal.
○ Trade-off: Terlalu banyak friksi, memakan memori tambahan.
● C. Network Ping Bypass: Halt sistem sepenuhnya sampai kamera kembali online.
○ Trade-off: Gagal demo, aplikasi mati statis.



## 3. UI/UX FLOW (USER JOURNEYS)
Flow 1: Peserta (Registration Journey)
- Akses: Buka URL pendaftaran.
## 2. Input: Isi Nama, Email.
- Tanda Tangan: Menggambar di
## <canvas>
. (Sistem berjalan di background:
canvas.toDataURL('image/jpeg', 0.3)
## ).
- Submit: Klik "Daftar". Sistem melakukan
## INSERT
ke DB.
- Output: Layar menampilkan QR Code besar + ID Token pendek di bawahnya
(sebagai mitigasi Fallback A). Peserta men-screenshot layar.
Flow 2: Panitia (Scanner & Security Journey)
- Preparation (Online): Buka URL Scanner. Sistem mengunduh data (indikator: "Data
Synced: N/N").
## 2. Active Mode:
○ Normal: Layar viewfinder kamera aktif.
○ Exception (Kamera Diblokir): Muncul UI layar abu-abu: "IZIN KAMERA
DIBLOKIR." + Form Input Manual Token (Memicu Fallback A).
- Scan/Input: Membaca data QR secara optikal (atau manual input).
- Decision Split (Instan & Offline):
○ Kondisi A (Valid): Layar HIJAU ("✅ VERIFIED"). Menampilkan Nama,
render Base64 TTD, dan Jam Digital Berdetak (system clock + ms).
○ Kondisi B (Duplicate): Layar MERAH ("❌ DITOLAK"). Menampilkan
peringatan besar: "SUDAH CHECK-IN PADA [waktu]".
- Reset: Ketuk layar untuk kembali ke Step 2. (Background: Sistem mengembalikan
koneksi dan melakukan
## UPDATE
data ke Supabase).

