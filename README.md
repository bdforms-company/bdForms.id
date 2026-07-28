# bdForms

> **Fast-Track Registration Platform** — Platform registrasi event end-to-end dengan sistem check-in super cepat (di bawah 3 detik), mendukung scanner offline-first, dan dilengkapi dashboard manajemen event yang komprehensif.

[![Live Demo](https://img.shields.io/badge/demo-bdforms.id-5bffa1?style=for-the-badge)](https://www.bdforms.id)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)

## 🚀 Fitur Utama

Dari versi MVP sebelumnya, **bdForms** telah berkembang pesat menjadi platform yang *production-ready* dengan berbagai penambahan fitur utama:

- **Sistem Autentikasi Lengkap (Supabase Auth):** Mendukung Login, Register, Lupa Password, dan Reset Password.
- **Dashboard Organizer:** Dasbor terpusat untuk mengelola banyak event sekaligus, melihat metrik partisipan, dan mengelola pendaftaran.
- **Custom Event Slugs (`/e/[slug]`):** Bagikan link pendaftaran yang rapi dan mudah diingat (contoh: `bdforms.id/e/konser-musik`).
- **Export Data Mudah:** Unduh rekap data partisipan langsung dari dashboard ke format **PDF** atau **Excel (XLSX)**.
- **Profil Pengguna & Avatar:** Dukungan manajemen profil dan unggah foto profil (menggunakan Supabase Storage).
- **Email Integration:** Terintegrasi dengan **Resend** untuk pengiriman notifikasi dan email transaksional.
- **Error Tracking Real-time:** Memonitor setiap issue dan error di *client-side* maupun *server-side* menggunakan **Sentry**.
- **Tanda Tangan Digital On-Device:** Peserta dapat membubuhkan tanda tangan langsung di browser (Canvas → Base64).
- **Offline-First QR Scanner:** Sistem validasi QR code berjalan super mulus dan instan tanpa ketergantungan koneksi internet yang stabil di lokasi event (berbasis memori lokal / Zustand).

---

## 🛠️ Tech Stack & Arsitektur

Platform ini dibangun menggunakan susunan teknologi modern untuk menjamin kecepatan, skalabilitas, dan kenyamanan *developer experience*.

| Kategori | Teknologi |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Frontend UI** | React 19, Tailwind CSS 4, shadcn/ui, base-ui |
| **State Management** | Zustand (utamanya untuk offline scanner state) |
| **Backend & Database** | Supabase (PostgreSQL, Auth, Storage) |
| **QR Code** | `qrcode.react` (Generate), `html5-qrcode` (Scanner) |
| **Export Data** | `jspdf`, `jspdf-autotable`, `xlsx` |
| **Email** | Resend |
| **Monitoring** | Sentry (`@sentry/nextjs`) |

---

## 📂 Struktur Direktori (App Router)

```text
bdforms/
├── app/
│   ├── page.tsx          # Landing page utama
│   ├── auth/             # Modul Autentikasi (Login, Signup, Reset Password, Callback)
│   ├── dashboard/        # Dasbor pengelolaan event, metrik, & export partisipan
│   ├── e/[slug]/         # URL pendaftaran event yang SEO-friendly
│   ├── register/         # Form pendaftaran (QR generation & signature)
│   ├── scan/             # Halaman verifikasi QR code untuk panitia
│   ├── profile/          # Manajemen profil pengguna (Update Nama, Avatar)
│   └── api/              # Route handlers untuk API
├── components/           # Reusable UI components (SiteNav, SignaturePad, dll)
├── store/                # Zustand store (useScannerStore)
├── lib/                  # Utility functions (Supabase clients, dll)
├── migrations/           # Skrip migrasi database (mis. add-avatar-support.sql)
└── schema.sql            # Skrip skema database utama
```

---

## 💻 Instalasi Lokal

### Prasyarat
- Node.js 20 atau lebih baru
- Akun [Supabase](https://supabase.com/)
- Akun [Resend](https://resend.com/) *(Opsional)*
- Akun [Sentry](https://sentry.io/) *(Opsional)*

### Langkah-langkah

1. **Clone repositori dan install dependencies**
   ```bash
   git clone <url-repo-anda>
   cd bdforms
   npm install
   ```

2. **Setup Environment Variables**
   Buat file `.env.local` di *root* direktori dan tambahkan konfigurasi berikut:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   
   # Opsional (Integrasi Pihak Ketiga)
   RESEND_API_KEY=<resend-api-key>
   SENTRY_AUTH_TOKEN=<sentry-auth-token>
   ```

3. **Setup Database & Storage (Supabase)**
   - Buka SQL Editor di proyek Supabase Anda.
   - Jalankan seluruh query di file `schema.sql` untuk membuat tabel-tabel utama (`events`, `participants`).
   - Jalankan query dari `migrations/add-avatar-support.sql` untuk mengatur tabel `profiles` dan bucket storage untuk `avatars`.

4. **Jalankan Development Server**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 🔒 Roadmap & Status Perkembangan

- [x] Sistem Autentikasi (Auth)
- [x] Dashboard analytics & laporan
- [x] Export data ke format PDF & Excel
- [x] Manajemen Profil pengguna & foto Avatar
- [x] RLS (Row Level Security) per event / user
- [x] Custom slug pendaftaran (`/e/slug`)
- [x] Pengiriman tiket QR otomatis via email secara transaksional
- [ ] Manajemen billing / tier Pro (Integrasi Payment Gateway)
- [ ] Face match verification untuk check-in lanjutan

---

<p align="center">© 2026 bdForms · Built for speed.</p>
