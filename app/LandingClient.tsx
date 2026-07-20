"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { PACKAGES, formatDiscount, formatPrice } from "@/lib/packages";
import FaqAccordion from "@/components/FaqAccordion";
import SiteNav from "@/components/SiteNav";
import "./design.css";

const CORE_FEATURES = [
  { icon: "how_to_reg", label: "Registrasi Peserta" },
  { icon: "qr_code_scanner", label: "QR Check-in Offline" },
  { icon: "monitoring", label: "Dashboard Real-Time" },
  { icon: "download", label: "Export Data" },
  { icon: "tune", label: "Custom Form" },
  { icon: "badge", label: "Tiket QR Digital" },
  { icon: "draw", label: "Tanda Tangan Digital" },
  { icon: "image", label: "Banner Event" },
  { icon: "mark_email_read", label: "Notifikasi ke Penyelenggara" },
];

const ADDON_FEATURES = [
  { icon: "alternate_email", label: "Email Sender", desc: "Kirim tiket & notifikasi dari alamat pengirim yang rapi dan terpercaya." },
  { icon: "brush", label: "White-label", desc: "Hilangkan watermark bdForms, tampilkan branding event Anda sendiri." },
  { icon: "language", label: "Custom Domain", desc: "Gunakan domain khusus untuk halaman registrasi event Anda." },
  { icon: "notifications_active", label: "Reminder", desc: "Kirim pengingat otomatis ke peserta sebelum hari acara berlangsung." },
  { icon: "groups", label: "Multi Admin", desc: "Tambahkan beberapa admin panitia untuk mengelola event bersama." },
  { icon: "headset_mic", label: "Priority Support", desc: "Dukungan khusus dengan waktu respons lebih cepat untuk event penting." },
];

const TRUSTED_LOGOS = [
  { name: "Area Desain", src: "/logos/Logo_Area_Desain.png", invert: false },
  { name: "Barika", src: "/logos/Logo_Barika.png", invert: false },
  { name: "EggGeek", src: "/logos/Logo_Eggeek.png", invert: false },
  { name: "nightCoders", src: "/logos/Logo_Nightcoders.png", invert: true },
  { name: "Startup Banda Aceh Community", src: "/logos/Logo_Startup_Banda_Aceh_Community.png", invert: false },
];

const FEATURES = [
  { icon: "qr_code_scanner", title: "Check-in dalam 3 Detik", desc: "Scanner QR offline-first yang tetap bekerja walau sinyal hilang." },
  { icon: "monitoring", title: "Dashboard Real-Time", desc: "Pantau jumlah peserta, status kehadiran, dan kuota sisa secara langsung." },
  { icon: "tune", title: "Form yang Bisa Dikustomisasi", desc: "Tambahkan field sesuai kebutuhan event kamu — dari NIM hingga pertanyaan custom." },
  { icon: "download", title: "Export Data Peserta", desc: "Download data peserta dalam format CSV kapan saja dengan satu klik." },
  { icon: "cloud_off", title: "Offline-First Architecture", desc: "Sistem tetap berjalan sempurna walau koneksi internet terputus." },
  { icon: "lock", title: "Data Aman & Terenkripsi", desc: "Data peserta dilindungi dengan Row Level Security dan enkripsi end-to-end." },
];

const HOW_IT_WORKS = [
  { title: "Buat Event dalam 30 Detik", desc: "Masukkan nama event, jadwal, lokasi, kuota, dan paket yang sesuai.", visual: "form" },
  { title: "Atur Form Pendaftaran", desc: "Pilih field wajib, tambah pertanyaan custom, lalu simpan template event.", visual: "toggles" },
  { title: "Share & Terima Pendaftar", desc: "Bagikan link pendaftaran dan peserta otomatis menerima tiket QR.", visual: "ticket" },
  { title: "Check-in & Pantau Real-Time", desc: "Panitia scan QR, sistem mencatat kehadiran, dashboard langsung ter-update.", visual: "scanner" },
];

function MockupCard() {
  const [activeView, setActiveView] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveView((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) {
      setActiveView((prev) => (prev + 1) % 4);
    }
    if (isRightSwipe) {
      setActiveView((prev) => (prev - 1 + 4) % 4);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div
      className="relative mx-auto w-full max-w-lg rounded-2xl border border-slate-200/60 bg-white shadow-xl overflow-hidden text-left font-sans select-none animate-float"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Chrome Window Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/85 bg-slate-50/60 dark:bg-slate-900/40 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          <span className="h-2 w-2 rounded-full bg-green-400" />
        </div>
        <div className="rounded bg-slate-100 dark:bg-slate-800/60 px-3 py-0.5 text-[9px] text-slate-400 dark:text-slate-500 font-mono tracking-tight w-40 text-center truncate">
          admin.bdforms.id/event-104a
        </div>
        <div className="w-10" />
      </div>

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-[110px_1fr] h-[255px] md:grid-cols-[130px_1fr] md:h-[285px]">
        {/* Mock Sidebar */}
        <div className="border-r border-slate-100 dark:border-slate-800/85 bg-slate-50/30 dark:bg-slate-900/10 p-2.5 space-y-4">
          <div className="space-y-1">
            <div className="h-1.5 w-10 rounded bg-slate-300 dark:bg-slate-700/60" />
            <div className="h-4 rounded bg-slate-200/80 dark:bg-slate-850" />
          </div>
          <nav className="space-y-1">
            {[
              ["dashboard", "Overview", 0],
              ["edit_note", "Form Builder", 1],
              ["qr_code_scanner", "QR Scanner", 2],
              ["analytics", "Analytics", 3],
            ].map(([icon, label, idx]) => (
              <button
                key={label as string}
                onClick={() => setActiveView(idx as number)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-semibold w-full text-left transition-colors cursor-pointer ${activeView === idx
                    ? "bg-(--primary-container) text-(--on-primary-container)"
                    : "text-slate-455 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/40"
                  }`}
              >
                <span className="material-symbols-outlined text-xs" style={{ fontSize: "12px" }}>{icon as string}</span>
                {label as string}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area with transition */}
        <div className="p-3.5 flex flex-col justify-between overflow-hidden relative">
          {activeView === 0 && (
            <div className="flex-1 flex flex-col justify-between h-full animate-fade-in">
              <div className="flex justify-between items-start gap-2 text-left">
                <div className="min-w-0">
                  <p className="text-[8px] uppercase font-bold tracking-wider text-slate-450 dark:text-slate-500">Live Dashboard</p>
                  <h4 className="text-[10px] md:text-xs font-black text-slate-800 dark:text-slate-100 truncate mt-0.5">Seminar Deep Learning 2026</h4>
                </div>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold text-emerald-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 my-2">
                {[
                  ["320", "Terdaftar", "text-slate-800 dark:text-slate-200"],
                  ["284", "Hadir (88%)", "text-primary"],
                  ["36", "Sisa Kuota", "text-slate-400 dark:text-slate-500"],
                ].map(([value, label, colorClass]) => (
                  <div key={label} className="border border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/20 rounded-md p-1.5 text-center">
                    <p className={`text-xs font-black ${colorClass}`}>{value}</p>
                    <p className="text-[7px] text-slate-450 dark:text-slate-500 tracking-tight mt-0.5 truncate">{label}</p>
                  </div>
                ))}
              </div>

              <div className="flex-1 overflow-hidden border border-slate-100 dark:border-slate-850 bg-slate-50/10 dark:bg-slate-900/5 rounded-md p-2 flex flex-col">
                <p className="text-[7px] font-bold text-slate-455 dark:text-slate-500 mb-1.5 uppercase tracking-wider text-left">Activity Feed</p>
                <div className="space-y-1 overflow-hidden">
                  {[
                    ["Faisal R.", "13:54:10", "Checked in (Offline)"],
                    ["Annisa Safitri", "13:52:45", "Registered"],
                    ["Muhammad Danil", "13:50:02", "Checked in (Online)"],
                  ].map(([name, time, action], index) => (
                    <div key={name} className="flex items-center justify-between text-[8px] text-slate-600 dark:text-slate-400 border-b border-slate-100/50 dark:border-slate-850/50 pb-1 last:border-b-0">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className={`h-1 w-1 rounded-full shrink-0 ${index === 1 ? "bg-blue-400" : "bg-emerald-400"}`} />
                        <span className="font-semibold truncate">{name}</span>
                      </div>
                      <span className="text-slate-400 dark:text-slate-500 text-[7px] shrink-0">{time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeView === 1 && (
            <div className="flex-1 flex flex-col justify-between h-full animate-fade-in text-left">
              <div className="min-w-0">
                <p className="text-[8px] uppercase font-bold tracking-wider text-slate-455 dark:text-slate-500">Event Form Builder</p>
                <h4 className="text-[10px] md:text-xs font-black text-slate-800 dark:text-slate-100 truncate mt-0.5">Atur Field Pendaftaran</h4>
              </div>

              <div className="space-y-1.5 flex-1 my-2">
                {[
                  ["Nama Lengkap", "Text Input", "Wajib"],
                  ["Alamat Email", "Email Input", "Wajib"],
                  ["Nomor WhatsApp", "Phone Input", "Wajib"],
                  ["Instansi / Institusi", "Text Input", "Opsional"],
                ].map(([field, type, required]) => (
                  <div key={field} className="flex items-center justify-between border border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/20 px-2 py-1 rounded">
                    <div className="flex flex-col text-left">
                      <span className="text-[8px] font-bold text-slate-700 dark:text-slate-200">{field}</span>
                      <span className="text-[6px] text-slate-400 dark:text-slate-550">{type}</span>
                    </div>
                    <span className={`text-[6px] px-1 py-0.5 rounded-sm font-bold uppercase tracking-wide ${required === "Wajib" ? "bg-blue-500/10 text-blue-500" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>{required}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-1.5">
                <button className="h-4.5 px-2 rounded border border-slate-200 dark:border-slate-800 text-[7px] font-semibold text-slate-500 dark:text-slate-400">Batal</button>
                <button className="h-4.5 px-2 rounded bg-primary text-white text-[7px] font-semibold">Simpan Template</button>
              </div>
            </div>
          )}

          {activeView === 2 && (
            <div className="flex-1 flex flex-col justify-between h-full animate-fade-in text-left">
              <div className="min-w-0">
                <p className="text-[8px] uppercase font-bold tracking-wider text-slate-455 dark:text-slate-500">QR Scanner</p>
                <h4 className="text-[10px] md:text-xs font-black text-slate-800 dark:text-slate-100 truncate mt-0.5">Kamera Scanner Offline-First</h4>
              </div>

              <div className="relative flex-1 rounded border border-slate-200 bg-white flex items-center justify-center overflow-hidden my-2">
                {/* Target box */}
                <div className="absolute w-20 h-20 border border-dashed border-blue-500 rounded flex items-center justify-center">
                  {/* Pulsing laser line */}
                  <div className="w-full h-0.5 bg-blue-500 absolute top-1/2 left-0 -translate-y-1/2 animate-bounce" />

                  {/* Mock QR code inside */}
                  <div className="w-10 h-10 opacity-60">
                    <svg className="w-full h-full text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 3h8v8H3zm2 2v4h4V5zm8-2h8v8h-8zm2 2v4h4V5zM3 13h8v8H3zm2 2v4h4v-4zm13-2h3v2h-3zm-2 2h2v2h-2zm2 2h3v2h-3zm-2 2h2v2h-2zm2-4h2v2h-2zm-4 4h2v2h-2zm0-4h2v2h-2zm2-2h2v2h-2z" />
                    </svg>
                  </div>
                </div>

                {/* HUD Info */}
                <div className="absolute bottom-1.5 left-2 right-2 flex justify-between items-center text-[6px] text-slate-500">
                  <span className="flex items-center gap-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Camera Active
                  </span>
                  <span className="bg-blue-500/80 px-1 py-0.5 rounded text-[5px]">Local DB Mode</span>
                </div>
              </div>

              <div className="border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 rounded flex items-center justify-between">
                <div className="flex items-center gap-1 text-left">
                  <span className="material-symbols-outlined text-[9px] text-emerald-500">check_circle</span>
                  <span className="text-[8px] font-bold text-slate-700 dark:text-slate-200 font-sans">Farhan Hakim (Standard Ticket)</span>
                </div>
                <span className="text-[7px] font-mono text-emerald-500">VERIFIED</span>
              </div>
            </div>
          )}

          {activeView === 3 && (
            <div className="flex-1 flex flex-col justify-between h-full animate-fade-in text-left">
              <div className="min-w-0">
                <p className="text-[8px] uppercase font-bold tracking-wider text-slate-455 dark:text-slate-500">Analytics</p>
                <h4 className="text-[10px] md:text-xs font-black text-slate-800 dark:text-slate-100 truncate mt-0.5">Rasio Kehadiran & Grafik</h4>
              </div>

              <div className="grid grid-cols-2 gap-2 flex-1 my-2">
                <div className="border border-slate-100 dark:border-slate-850 bg-slate-50/10 dark:bg-slate-900/10 rounded p-1.5 flex flex-col justify-between text-left">
                  <span className="text-[7px] font-bold text-slate-455 dark:text-slate-400">Kehadiran</span>
                  <div className="flex items-baseline gap-0.5 mt-0.5">
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">88.7%</span>
                    <span className="text-[5px] text-emerald-500 font-bold">+2.4% vs target</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-1.5">
                    <div className="bg-primary h-full rounded-full" style={{ width: '88.7%' }} />
                  </div>
                </div>

                <div className="border border-slate-100 dark:border-slate-850 bg-slate-50/10 dark:bg-slate-900/10 rounded p-1.5 flex flex-col justify-between text-left">
                  <span className="text-[7px] font-bold text-slate-455 dark:text-slate-400">Waktu Puncak</span>
                  <div className="mt-0.5">
                    <span className="text-xs font-black text-slate-900 dark:text-slate-100">13.00 - 13.30</span>
                    <p className="text-[5px] text-slate-400 mt-0.5">142 Peserta check-in</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <div className="flex justify-between items-center text-[6px] text-slate-455">
                  <span>Paket Pendaftaran</span>
                  <span>Rasio Kehadiran</span>
                </div>
                {[
                  ["Starter (Gratis)", "100%", "bg-slate-300"],
                  ["Standard Plan", "92.5%", "bg-primary"],
                  ["Pro & Enterprise", "84.1%", "bg-emerald-500"],
                ].map(([label, percent, color]) => (
                  <div key={label} className="flex items-center gap-1.5 text-[7px] font-semibold">
                    <span className="w-20 truncate text-slate-600 dark:text-slate-400">{label}</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800/60 h-1 rounded overflow-hidden">
                      <div className={`h-full rounded ${color}`} style={{ width: percent }} />
                    </div>
                    <span className="font-mono text-slate-700 dark:text-slate-350 shrink-0">{percent}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Swipe Indicators */}
      <div className="flex justify-center gap-1.5 py-2 bg-slate-50/30 dark:bg-slate-900/20 border-t border-slate-150 dark:border-slate-850">
        {[0, 1, 2, 3].map((idx) => (
          <button
            key={idx}
            onClick={() => setActiveView(idx)}
            className={`h-1 rounded-full transition-all duration-300 ${activeView === idx ? "w-4 bg-primary" : "w-1.5 bg-slate-200 dark:bg-slate-800"
              }`}
            aria-label={`View State ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

{/* JSON-LD Structured Data */ }
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "bdForms",
      "applicationCategory": "BusinessApplication",
      "description": "Platform registrasi event offline-first dengan QR check-in instan",
      "url": "https://www.bdforms.id",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "IDR"
      },
      "operatingSystem": "Web Browser",
      "inLanguage": ["id", "en"]
    })
  }}
/>


function PricingCard({ pkg }: { pkg: (typeof PACKAGES)[number] }) {
  const isPrimary = pkg.highlighted;
  const isEnterprise = pkg.id === "enterprise";
  const displayPrice = isEnterprise ? "Custom" : pkg.price === 0 ? "Gratis" : formatPrice(pkg.price);

  return (
    <div
      className={`relative flex flex-col rounded-2xl p-6 transition-all duration-300 ${isPrimary
          ? "border-2 border-primary bg-white shadow-xl md:-translate-y-3 z-10"
          : isEnterprise
            ? "border border-slate-200/70 bg-white shadow-sm"
            : "border border-slate-200/60 bg-white/70 hover:bg-white hover:shadow-md"
        }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${isPrimary ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
          }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isPrimary ? "bg-white" : "bg-slate-400"}`} />
          {pkg.label}
        </span>
        {isPrimary && <span className="material-symbols-outlined text-primary" style={{ fontSize: "16px" }}>star</span>}
      </div>

      <p className="text-[10px] font-medium text-slate-500 mb-2">{(pkg as { scale?: string }).scale ?? ""}</p>

      <h3 className="text-sm font-bold uppercase tracking-wider mb-1 text-slate-800">{pkg.name}</h3>

      <div className="inline-flex items-center gap-1.5 mb-4 text-slate-700">
        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>group</span>
        <span className="text-xl font-black tracking-tight">
          {isEnterprise ? "Tak terbatas" : `${pkg.maxParticipants?.toLocaleString("id-ID")} peserta`}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black tracking-tight text-slate-900">
            {displayPrice}
          </span>
          {!isEnterprise && pkg.price !== 0 && (
            <span className="text-[10px] text-slate-450 font-medium">/event</span>
          )}
        </div>
        {!isEnterprise && pkg.price === 0 && (
          <p className="text-[10px] text-slate-500 mt-0.5">Tidak perlu kartu kredit</p>
        )}
        {!isEnterprise && pkg.price !== 0 && pkg.pricePerPerson && pkg.pricePerPerson > 0 && (
          <p className="text-[10px] text-slate-400 mt-0.5">
            ≈ Rp {pkg.pricePerPerson.toLocaleString("id-ID")}/peserta
          </p>
        )}
        {isEnterprise && (
          <p className="text-[10px] text-slate-500 mt-0.5">Harga berdasarkan kebutuhan organisasi</p>
        )}
      </div>

      <Link
        href={isEnterprise ? "https://wa.me/6285199527012?text=Halo%2C%20saya%20tertarik%20dengan%20paket%20Enterprise%20bdForms." : "/create/package"}
        className={`w-full rounded-lg py-2.5 text-center text-[10px] font-bold transition-all uppercase tracking-wider mb-5 ${isPrimary
            ? "bg-primary text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
            : isEnterprise
              ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              : "border border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100"
          }`}
      >
        {pkg.cta}
      </Link>

      <div className="space-y-2 text-left border-t border-slate-100 pt-4 mt-auto">
        {pkg.features.map((feature) => (
          <div key={feature} className={`flex items-start gap-2 text-[10px] leading-snug text-slate-600`}>
            <span className={`material-symbols-outlined shrink-0 mt-px ${isPrimary ? "text-primary" : "text-slate-400"}`} style={{ fontSize: "12px" }}>check</span>
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="bd">
      <SiteNav />
      <main>

        <section className="relative flex min-h-[calc(100vh-64px)] items-center overflow-hidden px-6 py-16 md:px-10 bg-linear-to-b from-slate-50/50 to-white dark:from-[#06080F] dark:to-[#0B0E17]">
          {/* Subtle grid accent */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

          <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] w-full">
            <div className="text-center lg:text-left flex flex-col justify-center">
              <div className="mb-6 text-xs font-semibold text-slate-500 dark:text-slate-450 text-left">
                Sistem registrasi lapangan offline-first tanpa kendala jaringan internet.
              </div>
              <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl text-slate-950 dark:text-slate-50 text-left">
                Registrasi Event Tanpa Antrian, <span className="text-primary dark:text-blue-400">Dalam 3 Detik.</span>
              </h1>
              <p className="mb-8 max-w-xl text-sm leading-relaxed md:text-base text-slate-550 dark:text-slate-400 text-left">
                Kelola check-in ribuan peserta secara mandiri dan offline. Didukung enkripsi tanda tangan digital, sinkronisasi otomatis multi-perangkat, dan Row Level Security.
              </p>
              <div className="mb-10 flex flex-col justify-stretch gap-3.5 sm:flex-row sm:justify-start">
                <Link
                  href="/auth/signup"
                  aria-label="Coba alur registrasi sekarang (hero)"
                  className="rounded-xl bg-primary hover:bg-blue-700 text-white px-7 py-3 text-sm font-bold text-center shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all"
                >
                  Coba Alurnya
                </Link>
                <a
                  href="#how-it-works"
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 px-7 py-3 text-sm font-bold text-slate-700 dark:text-slate-350 text-center transition-colors hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Lihat Cara Kerjanya
                </a>
              </div>

              {/* Modern editorial proof line instead of stats grid */}
              <div className="mt-6 pt-8 border-t border-slate-100 dark:border-slate-850/60 text-left">
                <p className="text-[11px] text-slate-500 dark:text-slate-450 flex items-center flex-wrap gap-x-2.5 gap-y-1.5 font-medium">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Spesifikasi Lapangan:</span>
                  <span>Check-in QR &lt; 3 Detik</span>
                  <span className="text-slate-250 dark:text-slate-800">•</span>
                  <span>Setup Event &lt; 30 Detik</span>
                  <span className="text-slate-250 dark:text-slate-800">•</span>
                  <span>100% Berjalan Offline</span>
                </p>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              {/* Visual ambient accent */}
              <div className="absolute w-[300px] h-[300px] rounded-full bg-blue-500/5 dark:bg-blue-500/5 blur-3xl" />
              <MockupCard />
            </div>
          </div>
        </section>

        <section className="border-y border-slate-150 dark:border-slate-850 bg-white/40 dark:bg-slate-900/10 py-10">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-6">
              Dipercaya oleh organisasi & komunitas terkemuka
            </p>
            <div className="relative mx-auto max-w-6xl overflow-hidden">
              <div className="flex w-max items-center gap-10 px-4 animate-marquee hover:paused">
                {TRUSTED_LOGOS.concat(TRUSTED_LOGOS).map((logo, idx) => (
                  <div
                    key={`${logo.name}-${idx}`}
                    className="flex h-12 w-[120px] shrink-0 items-center justify-center rounded-xl border border-transparent bg-transparent px-2 opacity-70 grayscale transition-all duration-200 hover:opacity-100 hover:grayscale-0 hover:bg-white/60 dark:hover:bg-slate-900/20"
                  >
                    <Image
                      src={logo.src}
                      alt={logo.name}
                      width={120}
                      height={32}
                      className="h-6 w-auto object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="px-6 py-24 md:px-10">
          <div className="mx-auto max-w-6xl">
            {/* Asymmetric Header */}
            <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] border-b border-slate-100 dark:border-slate-850 pb-12 mb-16">
              <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl text-slate-950 dark:text-slate-50">
                Semua yang dibutuhkan untuk event sukses.
              </h2>
              <div className="flex items-end">
                <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                  Mulai dari membuat formulir pendaftaran hingga menyambut kedatangan peserta di lokasi acara dengan lancar dan tanpa kendala.
                </p>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] items-stretch mb-12">
              <div className="space-y-6 text-left">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold text-emerald-500 uppercase tracking-wide">
                    Check-in Lancar
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Peserta bisa masuk cepat, walau jaringan sedang tidak stabil.</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                    bdForms menjaga proses check-in tetap berjalan rapi di lapangan, jadi panitia tidak perlu berhenti hanya karena sinyal sedang lemah.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 border-t border-slate-100 dark:border-slate-850 pt-5">
                  {[
                    ["Fleksibel", "Form bisa disesuaikan untuk kebutuhan tiap acara."],
                    ["Cepat", "Peserta daftar dan scan tanpa alur yang berbelit."],
                    ["Aman", "Data peserta tersimpan rapi dan mudah dikelola."],
                  ].map(([title, desc]) => (
                    <div key={title} className="rounded-2xl border border-slate-100 dark:border-slate-850 bg-white/60 dark:bg-slate-900/20 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">{title}</div>
                      <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#0B0E17] p-5 shadow-sm">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    <span>Preview Fitur</span>
                    <span className="text-blue-500">Live</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/60 dark:bg-slate-900/30 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Formulir Pendaftaran</div>
                      <div className="mt-3 space-y-2">
                        <div className="h-8 rounded-lg bg-white dark:bg-[#06080F] border border-slate-200/60 dark:border-slate-800 px-3 flex items-center text-[10px] text-slate-400">Nama Lengkap</div>
                        <div className="h-8 rounded-lg bg-white dark:bg-[#06080F] border border-slate-200/60 dark:border-slate-800 px-3 flex items-center text-[10px] text-slate-400">Instansi / Kampus</div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/60 dark:bg-slate-900/30 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">QR Check-in</div>
                      <div className="mt-3 rounded-lg bg-white dark:bg-[#06080F] border border-slate-200/60 dark:border-slate-800 p-4 flex items-center justify-center min-h-[88px]">
                        <span className="material-symbols-outlined text-4xl text-blue-500">qr_code_2</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/60 dark:bg-slate-900/30 p-4 sm:col-span-2 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Kehadiran Masuk</div>
                        <div className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100">342 / 400</div>
                      </div>
                      <div className="h-2 w-32 rounded-full bg-slate-100 dark:bg-slate-850 overflow-hidden">
                        <div className="h-full w-[85.5%] rounded-full bg-blue-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 dark:border-slate-850 bg-white/60 dark:bg-slate-900/20 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800">
                      <span className="material-symbols-outlined text-lg">tune</span>
                    </div>
                    <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">Formulir Sesuai Kebutuhan</h4>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Tambahkan field sesuai acara, dari nama sampai pertanyaan khusus.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 dark:border-slate-850 bg-white/60 dark:bg-slate-900/20 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800">
                      <span className="material-symbols-outlined text-lg">download</span>
                    </div>
                    <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">Laporan Siap Diunduh</h4>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Data peserta dan kehadiran bisa diunduh kapan saja dengan mudah.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 dark:border-slate-850 bg-white/60 dark:bg-slate-900/20 p-4 sm:col-span-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800">
                      <span className="material-symbols-outlined text-lg">lock</span>
                    </div>
                    <h4 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">Data Tetap Aman</h4>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                      Informasi pendaftar dan riwayat kehadiran tersimpan rapi, hanya dapat diakses oleh tim yang berwenang.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-6 py-16 md:py-20 bg-slate-50/40 dark:bg-slate-900/10">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] items-center">

              {/* Left Column: Vertical Steps Timeline */}
              <div className="space-y-6 text-left">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[9px] font-bold text-blue-500 uppercase tracking-wide">
                    Alur Praktis
                  </span>
                  <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl lg:text-4xl text-slate-950 dark:text-slate-50">
                    Cara Kerja bdForms
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                    Alur lengkap dari pendaftaran online hingga presensi di lokasi acara.
                  </p>
                </div>

                <div className="relative border-l border-slate-200 dark:border-slate-800 pl-5 ml-2 space-y-4">
                  {[
                    ["01", "Buat Event & Formulir", "Isi detail acara dan sesuaikan formulir pendaftaran dalam sekejap."],
                    ["02", "Sebarkan Link", "Peserta mendaftar online dan menerima QR tiket via email secara otomatis."],
                    ["03", "Scan QR di Lokasi", "Presensi di pintu masuk cepat via scanner HP/tablet, lancar meski tanpa internet."],
                    ["04", "Pantau & Rekap Data", "Lihat jumlah kedatangan secara langsung dan unduh laporan kapan saja."]
                  ].map(([num, title, desc]) => (
                    <div key={num} className="relative space-y-0.5 text-left">
                      <span className="absolute left-[-29px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-100 text-[8px] font-mono font-bold text-white dark:text-slate-900">
                        {num}
                      </span>
                      <h4 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h4>
                      <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Single Unified Product Visual */}
              <div className="border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#0B0E17] rounded-2xl p-5 md:p-6 shadow-sm relative overflow-hidden">
                <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full bg-blue-500/10 blur-2xl" />

                {/* Product Window Top Bar */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-850" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 ml-2">Seminar AI 2026</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Live Presensi
                  </div>
                </div>

                {/* Product Visual Content Showcase */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  {/* Panel 1: Registration & Ticket Output */}
                  <div className="border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <span>Tiket Pendaftar</span>
                      <span className="text-blue-500">Tergenerasi ✓</span>
                    </div>
                    <div className="bg-white dark:bg-[#06080F] border border-slate-200/60 dark:border-slate-800 rounded-lg p-3 space-y-2.5 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md bg-slate-100 dark:bg-slate-850 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-2xl text-slate-800 dark:text-slate-200">qr_code_2</span>
                        </div>
                        <div className="space-y-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">Budi Santoso</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">TK-2026-0892</p>
                          <span className="inline-block px-1.5 py-0.2 text-[8px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 rounded">
                            VIP Pass
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Panel 2: Live Gate Scanner & Progress */}
                  <div className="border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <span>Presensi Pintu Masuk</span>
                      <span className="text-emerald-500 font-mono">Offline Ready</span>
                    </div>
                    <div className="bg-white dark:bg-[#06080F] border border-slate-200/60 dark:border-slate-800 rounded-lg p-3 space-y-2 shadow-2xs">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span>Kedatangan</span>
                        <span className="text-emerald-500 font-mono text-xs">342 / 400</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-850 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full w-[85.5%]" />
                      </div>
                      <div className="pt-1 flex items-center gap-1.5 text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                        Check-in Berhasil (1 detik lalu)
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        <section id="pricing" className="px-6 py-24 md:px-10">
          <div className="mx-auto max-w-6xl">

            {/* Editorial Header */}
            <div className="mb-16 text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[9px] font-bold text-blue-500 uppercase tracking-wide mb-4">
                Harga
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl text-slate-950 dark:text-slate-50 max-w-2xl">
                Pilih skala event,<br />bukan fitur yang dikunci.
              </h2>
              <p className="mt-4 text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                Semua paket mencakup fitur inti yang sama. Yang berbeda hanya kapasitas peserta. Butuh lebih? Tambahkan add-on sesuai kebutuhan event.
              </p>

              {/* Scale overview bar */}
              <div className="mt-8 flex flex-wrap gap-2.5">
                {[
                  { scale: "s.d. 30 peserta", label: "Starter", color: "bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400" },
                  { scale: "s.d. 120 peserta", label: "Standard", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                  { scale: "s.d. 500 peserta", label: "Pro", color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" },
                  { scale: "Tak terbatas", label: "Enterprise", color: "bg-slate-900/10 dark:bg-white/10 text-slate-700 dark:text-slate-300" },
                ].map(({ scale, label, color }) => (
                  <div key={label} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold ${color}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>group</span>
                    <span>{label}</span>
                    <span className="opacity-60">·</span>
                    <span>{scale}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan Cards */}
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 items-start">
              {PACKAGES.map((pkg) => <PricingCard key={pkg.id} pkg={pkg} />)}
            </div>

            {/* Feature Coverage Block */}
            <div className="mt-20 space-y-6">

              {/* Core Features */}
              <div className="rounded-2xl border border-slate-200/70 bg-white p-6 md:p-7 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">Termasuk di semua paket</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CORE_FEATURES.map(({ icon, label }) => (
                    <div key={label} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700">
                      <span className="material-symbols-outlined text-slate-400" style={{ fontSize: "13px" }}>{icon}</span>
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add-ons */}
              <div className="rounded-2xl border border-blue-500/15 bg-white p-6 md:p-7 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-blue-500">Add-on opsional</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {ADDON_FEATURES.map(({ icon, label, desc }) => (
                    <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex gap-3">
                      <span className="material-symbols-outlined mt-0.5 shrink-0 text-blue-500" style={{ fontSize: "18px" }}>{icon}</span>
                      <div>
                        <div className="text-[11px] font-bold text-slate-800 mb-0.5">{label}</div>
                        <p className="text-[10px] leading-relaxed text-slate-500">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enterprise extras callout */}
              <div className="rounded-2xl bg-white border border-slate-200/70 p-6 md:p-7 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Enterprise</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">Untuk organisasi dan penyelenggara rutin</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                    Skala peserta tak terbatas, branding penuh, custom domain, dedicated support, SLA, dan onboarding langsung bersama tim bdForms.
                  </p>
                </div>
                <a
                  href="https://wa.me/6285199527012?text=Halo%2C%20saya%20tertarik%20dengan%20paket%20Enterprise%20bdForms."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary text-white hover:bg-blue-700 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>chat</span>
                  Diskusi Kebutuhan
                </a>
              </div>

            </div>
          </div>
        </section>

        <section id="faq" className="px-6 py-24 md:px-10 border-t border-slate-100 dark:border-slate-850/80">
          <div className="mx-auto max-w-4xl grid gap-12 md:grid-cols-[240px_1fr]">
            <div className="text-left space-y-3 shrink-0">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[9px] font-bold text-blue-500 uppercase tracking-wide">
                FAQ
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-slate-50">
                Pertanyaan Umum
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tidak menemukan jawaban yang dicari? Silakan hubungi kami kapan saja via WhatsApp.
              </p>
            </div>
            <div className="text-left">
              <FaqAccordion />
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:px-10">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-2xl bg-white border border-slate-200/70 p-8 text-center md:p-16 text-slate-900 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

              <h2 className="mx-auto mb-4 max-w-2xl text-2xl font-extrabold md:text-4xl tracking-tight leading-tight text-slate-950">
                Siap menghilangkan antrian di meja registrasi?
              </h2>
              <p className="mx-auto mb-8 max-w-lg text-xs md:text-sm text-slate-500 leading-relaxed">
                Bergabunglah dengan ratusan penyelenggara event yang sudah beralih ke sistem registrasi offline-first yang lebih cepat, aman, dan tanpa kendala sinyal.
              </p>
              <div className="flex flex-col justify-center gap-3.5 sm:flex-row relative z-10">
                <Link
                  href="/auth/signup"
                  aria-label="Mulai gratis sekarang — daftar dari bagian akhir halaman"
                  className="rounded-xl bg-primary hover:bg-blue-700 text-white px-7 py-3 text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-blue-500/10"
                >
                  Mulai Gratis Sekarang
                </Link>
                <a
                  href="https://wa.me/6285199527012"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-7 py-3 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Hubungi Kami
                </a>
              </div>
            </div>

            <footer className="mt-20 border-t border-slate-100 dark:border-slate-850/80 pt-16 pb-8 text-left">
              <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                {/* Left: Brand info */}
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-2.5">
                    <Image src="/logo.png" alt="bdForms Logo" width={28} height={28} className="object-contain" />
                    <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
                      bd<span className="text-primary">Forms</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                    Platform registrasi event offline-first dengan check-in QR instan dan sinkronisasi real-time.
                  </p>
                  <a
                    href="mailto:contact.bdforms@gmail.com"
                    className="text-xs text-slate-450 dark:text-slate-500 hover:text-primary block transition-colors font-medium"
                  >
                    contact.bdforms@gmail.com
                  </a>
                </div>

                {/* Right: Navigation columns */}
                <div className="flex gap-16 flex-wrap text-left">
                  <div className="space-y-3.5 text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Menu</p>
                    <div className="flex flex-col gap-2.5">
                      <a href="#how-it-works" className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">Cara Kerja</a>
                      <a href="#features" className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">Fitur</a>
                      <a href="#pricing" className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">Harga</a>
                      <a href="#faq" className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">FAQ</a>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Connect</p>
                    <div className="flex items-center gap-4 text-slate-450 dark:text-slate-500">
                      <a href="https://www.instagram.com/bdforms.id" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-primary transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </a>
                      <a href="https://www.linkedin.com/company/bdforms-id" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="hover:text-primary transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </a>
                      <a href="https://wa.me/6285199527012" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="hover:text-primary transition-colors">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-850/50 mt-16 pt-8 text-center">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">© 2026 bdForms. Hak cipta dilindungi.</p>
              </div>
            </footer>
          </div>
        </section>
      </main>
    </div>
  );
}