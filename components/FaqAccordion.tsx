"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "Apakah bdForms gratis?",
    a: "Ya! Paket Starter gratis untuk event dengan maks. 25 peserta. Untuk event lebih besar, tersedia paket Standard, Pro, dan Enterprise dengan harga terjangkau.",
  },
  {
    q: "Apakah sistem tetap berjalan kalau internet mati?",
    a: "Ya. Scanner check-in bdForms menggunakan teknologi offline-first — data peserta disimpan lokal di perangkat panitia dan akan otomatis tersinkron saat koneksi kembali.",
  },
  {
    q: "Bagaimana peserta mendapatkan QR tiket?",
    a: "Setelah mengisi form pendaftaran, QR tiket otomatis terunduh ke perangkat peserta. Peserta cukup tunjukkan QR ini saat check-in.",
  },
  {
    q: "Berapa lama setup event di bdForms?",
    a: "Kurang dari 30 detik. Daftar akun, pilih paket, isi detail event, dan link pendaftaran langsung siap disebarkan.",
  },
  {
    q: "Apakah data peserta aman?",
    a: "Ya. Data disimpan di Supabase dengan enkripsi dan Row Level Security (RLS) — hanya penyelenggara event yang bisa mengakses data pesertanya.",
  },
  {
    q: "Bisa kustomisasi form pendaftaran?",
    a: "Bisa. Penyelenggara bisa mengaktifkan field tambahan seperti No. HP, Instansi, Jabatan, NIP/NIM/ID, atau menambahkan pertanyaan custom sendiri.",
  },
  {
    q: "Bagaimana cara panitia melakukan check-in?",
    a: "Penyelenggara generate link scanner dari dashboard, bagikan ke panitia. Panitia buka link di HP, arahkan kamera ke QR peserta — check-in selesai dalam detik.",
  },
  {
    q: "Apakah bisa dipakai untuk event besar?",
    a: "Tentu. bdForms tersedia dalam paket Pro (maks. 500 peserta) dan Enterprise (custom volume) untuk event skala besar seperti seminar universitas, konferensi, dan acara pemerintahan.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="rounded-xl border transition-colors duration-300"
              style={{
                borderColor: isOpen ? "var(--primary)" : "var(--outline-variant)",
                background: isOpen ? "var(--primary-container)" : "var(--surface)",
                boxShadow: isOpen ? "var(--shadow-sm)" : "none",
              }}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
            >
              <span className="text-sm font-bold md:text-base" style={{ color: "var(--on-surface)" }}>
                {item.q}
              </span>
              <span
                className="material-symbols-outlined shrink-0 text-xl transition-transform duration-300"
                style={{
                  color: isOpen ? "var(--green)" : "var(--on-surface-variant)",
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                expand_more
              </span>
            </button>
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                maxHeight: isOpen ? "200px" : "0px",
                opacity: isOpen ? 1 : 0,
              }}
            >
              <p
                className="px-5 pb-5 text-sm leading-relaxed"
                style={{ color: "var(--on-surface-variant)" }}
              >
                {item.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}