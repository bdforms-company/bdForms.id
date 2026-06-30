"use client";

import Image from "next/image";
import Link from "next/link";
import { PACKAGES, formatDiscount, formatPrice } from "@/lib/packages";
import FaqAccordion from "@/components/FaqAccordion";
import SiteNav from "@/components/SiteNav";
import "./design.css";

const FEATURES_TABLE = [
  { name: 'Kapasitas peserta', starter: '30', standard: '120', pro: '500', enterprise: 'Custom (>500)' },
  { name: 'Harga', starter: 'Gratis', standard: 'Rp 72.000', pro: 'Rp 285.000', enterprise: 'Hubungi Kami' },
  { name: 'Registrasi peserta', starter: true, standard: true, pro: true, enterprise: true },
  { name: 'QR check-in offline', starter: true, standard: true, pro: true, enterprise: true },
  { name: 'Dashboard real-time', starter: true, standard: true, pro: true, enterprise: true },
  { name: 'Unduh QR peserta', starter: true, standard: true, pro: true, enterprise: true },
  { name: 'Tanda tangan digital', starter: true, standard: true, pro: true, enterprise: true },
  { name: 'Banner event', starter: true, standard: true, pro: true, enterprise: true },
  { name: 'Email ke penyelenggara', starter: true, standard: true, pro: true, enterprise: true },
  { name: 'Export CSV', starter: true, standard: true, pro: true, enterprise: true },
  { name: 'Export PDF', starter: false, standard: true, pro: true, enterprise: true },
  { name: 'Export Spreadsheet', starter: false, standard: false, pro: true, enterprise: true },
  { name: 'Email ke peserta', starter: false, standard: false, pro: true, enterprise: true },
  { name: 'Custom questions', starter: '1', standard: '3', pro: '10', enterprise: 'Unlimited' },
  { name: 'Notifikasi milestone', starter: false, standard: '3x/event', pro: '3x/event', enterprise: '3x/event' },
  { name: 'Durasi data tersimpan', starter: '7 hari', standard: '30 hari', pro: 'Permanent', enterprise: 'Permanent' },
  { name: 'Analytics', starter: false, standard: false, pro: 'soon', enterprise: 'soon' },
  { name: 'Subdomain custom', starter: false, standard: false, pro: 'soon', enterprise: 'soon' },
  { name: 'White-label', starter: false, standard: false, pro: false, enterprise: 'soon' },
  { name: 'Watermark bdForms', starter: true, standard: true, pro: true, enterprise: false },
  { name: 'Priority support', starter: false, standard: false, pro: true, enterprise: 'Dedicated' },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <span className="material-symbols-outlined" style={{ color: 'var(--success)' }}>check_circle</span>
  if (value === false) return <span className="material-symbols-outlined" style={{ color: 'var(--error)', opacity: 0.4 }}>cancel</span>
  if (value === 'soon') return <span style={{ fontSize: '11px', background: 'var(--primary-container)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>Segera</span>
  return <span style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>{value}</span>
}

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
  return (
    <div className="relative mx-auto max-w-md rounded-3xl p-[1px]" style={{ background: "var(--brand-gradient)" }}>
      <div className="rounded-3xl p-6 shadow-2xl" style={{ background: "linear-gradient(145deg, #0D1120, #151C30)", color: "#E8EEFF" }}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs" style={{ color: "#7A8AB0" }}>bdForms Dashboard</p>
            <h3 className="text-lg font-bold">Seminar Teknologi Aceh</h3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--brand-gradient)" }}>
            <span className="material-symbols-outlined">qr_code_2</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            ["247", "Total Terdaftar"],
            ["189", "Sudah Check-in"],
            ["58", "Belum Hadir"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-xl font-black">{value}</p>
              <p className="mt-1 text-[10px]" style={{ color: "#7A8AB0" }}>{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span style={{ color: "#7A8AB0" }}>Check-in Progress</span>
            <span style={{ color: "#33DDFF" }}>76%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[76%] rounded-full" style={{ background: "var(--brand-gradient)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

{/* JSON-LD Structured Data */}
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

function StepVisual({ type }: { type: string }) {
  return (
    <div className="glass rounded-3xl p-6 shadow-lg">
      {type === "form" && (
        <div className="space-y-3">
          <div className="h-4 w-32 rounded bg-[var(--primary)]/20" />
          <div className="bd-input h-11 rounded-xl" />
          <div className="bd-input h-11 rounded-xl" />
          <div className="h-10 w-28 rounded-xl" style={{ background: "var(--brand-gradient)" }} />
        </div>
      )}
      {type === "toggles" && (
        <div className="space-y-3">
          {["Nama Lengkap", "NIM / NIP", "Instansi", "Pertanyaan Custom"].map((item) => (
            <div key={item} className="flex items-center justify-between rounded-xl border p-3" style={{ borderColor: "var(--outline-variant)" }}>
              <span className="text-sm">{item}</span>
              <span className="h-5 w-9 rounded-full" style={{ background: "var(--brand-gradient)" }} />
            </div>
          ))}
        </div>
      )}
      {type === "ticket" && (
        <div className="flex items-center gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl" style={{ background: "var(--surface-container)" }}>
            <span className="material-symbols-outlined text-5xl" style={{ color: "var(--primary)" }}>qr_code_2</span>
          </div>
          <div className="flex-1 space-y-3">
            <div className="h-4 w-32 rounded bg-[var(--primary)]/20" />
            <div className="h-3 w-full rounded bg-[var(--outline-variant)]" />
            <div className="h-3 w-2/3 rounded bg-[var(--outline-variant)]" />
          </div>
        </div>
      )}
      {type === "scanner" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed" style={{ borderColor: "var(--primary)" }}>
            <span className="material-symbols-outlined text-5xl" style={{ color: "var(--primary)" }}>qr_code_scanner</span>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl p-3" style={{ background: "var(--primary-container)", color: "var(--on-primary-container)" }}>Valid ✓</div>
            <div className="h-12 rounded-xl" style={{ background: "var(--surface-container)" }} />
            <div className="h-12 rounded-xl" style={{ background: "var(--surface-container)" }} />
          </div>
        </div>
      )}
    </div>
  );
}

function LogoCard({ name, src, invert }: { name: string; src: string; invert: boolean }) {
  return (
    <div className="glass flex w-[160px] flex-shrink-0 items-center justify-center rounded-2xl p-4" style={{ marginRight: '24px' }}>
      <Image src={src} alt={name} width={170} height={42} className="h-10 w-auto object-contain" style={{ filter: invert ? "brightness(0)" : undefined }} />
    </div>
  );
}

function PricingCard({ pkg }: { pkg: (typeof PACKAGES)[number] }) {
  return (
    <div className={`glass relative flex flex-col rounded-3xl p-6 ${pkg.highlighted ? "accent-glow" : ""}`} style={{ borderWidth: pkg.highlighted ? 2 : 1, borderColor: pkg.highlighted ? "var(--primary)" : "var(--outline-variant)" }}>
      {pkg.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
          {pkg.label}
        </span>
      )}
      <h3 className="mb-2 text-2xl font-bold">{pkg.name}</h3>
      <div className="mb-6">
        {pkg.id === 'enterprise' ? (
          <p className="text-xl font-bold" style={{ color: 'var(--on-surface-variant)' }}>Hubungi Kami untuk penawaran khusus</p>
        ) : (
          <>
            {pkg.normalPrice ? <p className="text-sm line-through" style={{ color: "var(--on-surface-variant)" }}>{formatPrice(pkg.normalPrice)}</p> : null}
            {pkg.discount > 0 && <span className="mb-2 w-fit rounded px-2 py-0.5 text-xs font-bold" style={{ background: "var(--primary-container)", color: "var(--on-primary-container)" }}>Hemat {formatDiscount(pkg.discount)}</span>}
            <p className="mb-2 text-3xl font-black">{pkg.price === 0 ? "Gratis" : formatPrice(pkg.price)}</p>
            <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>{pkg.maxParticipants ? `Maks. ${pkg.maxParticipants} peserta` : "Peserta tak terbatas"}</p>
            {pkg.pricePerPerson ? <p className="mt-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>{formatPrice(pkg.pricePerPerson)}/orang</p> : null}
          </>
        )}
      </div>
      <div className="mb-8 flex flex-col gap-3">
        {pkg.features.map((feature) => (
          <div key={feature} className="flex items-start gap-2 text-sm">
            <span className="material-symbols-outlined text-base" style={{ color: "var(--success)", fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            {feature}
          </div>
        ))}
      </div>
      <Link href={pkg.id === "enterprise" ? "https://wa.me/6285199527012?text=Halo%2C%20saya%20tertarik%20dengan%20paket%20Enterprise%20bdForms." : "/create/package"} className="mt-auto rounded-xl px-5 py-3 text-center text-sm font-bold" style={{ background: pkg.highlighted ? "var(--primary)" : "var(--surface-container)", color: pkg.highlighted ? "var(--on-primary)" : "var(--on-surface)" }}>
        {pkg.cta}
      </Link>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="bd">
      <SiteNav />

      <section className="relative flex min-h-[calc(100vh-64px)] items-center overflow-hidden px-6 py-20 md:px-10">
        <div className="hero-accent" style={{ top: -120, left: -180, background: "radial-gradient(circle, rgba(0,102,255,0.12), transparent 70%)" }} />
        <div className="hero-accent" style={{ bottom: -160, right: -160, background: "radial-gradient(circle, rgba(0,200,255,0.12), transparent 70%)" }} />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold" style={{ borderColor: "var(--outline)", background: "var(--primary-container)", color: "var(--on-primary-container)" }}>
               Sistem Registrasi Event Modern dan Tanpa Ribet
            </div>
            <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight md:text-6xl" style={{ color: "var(--on-background)" }}>
              Registrasi Event Tanpa Antrian, <span className="gradient-text">Dalam 3 Detik.</span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed md:text-lg lg:mx-0" style={{ color: "var(--on-surface-variant)" }}>
              Sistem registrasi offline-first dengan QR check-in instan. Dari seminar kampus hingga acara pemerintahan.
            </p>
            <div className="mb-10 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href="/auth/signup" className="rounded-xl px-7 py-3.5 text-sm font-bold accent-glow" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>Mulai Gratis</Link>
              <a href="#how-it-works" className="rounded-xl border px-7 py-3.5 text-sm font-bold" style={{ borderColor: "var(--outline)", color: "var(--on-surface)" }}>Lihat Cara Kerjanya</a>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                ["< 3 Detik", "Check-in"],
                ["< 30 Detik", "Setup Event"],
                ["100%", "Offline-First"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border p-4 text-center" style={{ borderColor: "var(--outline-variant)", background: "var(--surface)" }}>
                  <p className="gradient-text text-xl font-black">{value}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
          <MockupCard />
        </div>
      </section>

      <section className="border-y py-14 md:px-10" style={{ borderColor: "var(--outline-variant)", background: "var(--surface)" }}>
        <p className="mb-8 text-center text-sm font-semibold" style={{ color: "var(--on-surface-variant)" }}>Dipercaya oleh komunitas & organisasi terkemuka</p>
        <div className="mx-auto w-full overflow-hidden">
          <div style={{
            display: 'flex',
            width: 'max-content',
            animation: 'marquee 25s linear infinite',
          }}>
            {TRUSTED_LOGOS.map(logo => <LogoCard key={`a-${logo.name}`} {...logo} />)}
            {TRUSTED_LOGOS.map(logo => <LogoCard key={`b-${logo.name}`} {...logo} />)}
            {TRUSTED_LOGOS.map(logo => <LogoCard key={`c-${logo.name}`} {...logo} />)}
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-24 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-black md:text-5xl">Semua yang kamu butuhkan untuk event sukses</h2>
            <p style={{ color: "var(--on-surface-variant)" }}>Satu platform untuk registrasi, check-in, dan pemantauan peserta.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="glass rounded-3xl p-7 transition-transform hover:-translate-y-1">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "var(--brand-gradient)", color: "white" }}>
                  <span className="material-symbols-outlined">{feature.icon}</span>
                </div>
                <h3 className="mb-3 text-lg font-bold">{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-6 py-24 md:px-10" style={{ background: "var(--surface)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-black md:text-5xl">Cara Kerja bdForms</h2>
            <p style={{ color: "var(--on-surface-variant)" }}>Dari buat event sampai check-in, semua dalam satu platform.</p>
          </div>
          <div className="relative space-y-12">
            <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-[var(--outline-variant)] lg:block" />
            {HOW_IT_WORKS.map((step, index) => (
              <div key={step.title} className="relative grid items-center gap-8 lg:grid-cols-2">
                <div className={`glass rounded-3xl p-8 ${index % 2 ? "lg:order-2" : ""}`}>
                  <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-black" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>{index + 1}</span>
                  <h3 className="mb-3 text-2xl font-bold">{step.title}</h3>
                  <p style={{ color: "var(--on-surface-variant)" }}>{step.desc}</p>
                </div>
                <div className={index % 2 ? "lg:order-1" : ""}>
                  <StepVisual type={step.visual} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-6 py-24 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-black md:text-5xl">Harga Transparan, Tanpa Biaya Tersembunyi</h2>
            <p style={{ color: "var(--on-surface-variant)" }}>Mulai gratis, upgrade sesuai kebutuhan.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {PACKAGES.map((pkg) => <PricingCard key={pkg.id} pkg={pkg} />)}
          </div>
          <div className="mx-auto mt-20 max-w-5xl">
            <h2 className="mb-10 text-center text-3xl font-bold">Bandingkan Semua Fitur</h2>
            <div className="overflow-x-auto rounded-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--outline)' }}>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b" style={{ background: 'var(--surface-container)', borderColor: 'var(--outline-variant)' }}>
                    <th className="p-4 text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Fitur</th>
                    <th className="p-4 text-center font-bold">Starter</th>
                    <th className="p-4 text-center font-bold" style={{ color: "var(--primary)" }}>Standard</th>
                    <th className="p-4 text-center font-bold">Pro</th>
                    <th className="p-4 text-center font-bold">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES_TABLE.map((row, index) => (
                    <tr key={row.name} style={{ background: index % 2 === 0 ? 'var(--surface)' : 'var(--surface-lowest)', borderBottom: '1px solid var(--outline-variant)' }}>
                      <td className="p-4 text-sm" style={{ color: "var(--on-surface-variant)" }}>{row.name}</td>
                      <td className="p-4 text-center"><Cell value={row.starter} /></td>
                      <td className="p-4 text-center"><Cell value={row.standard} /></td>
                      <td className="p-4 text-center"><Cell value={row.pro} /></td>
                      <td className="p-4 text-center"><Cell value={row.enterprise} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="px-6 py-24 md:px-10" style={{ background: "var(--surface)" }}>
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-black md:text-5xl">Pertanyaan yang Sering Ditanyakan</h2>
            <p style={{ color: "var(--on-surface-variant)" }}>Tidak menemukan jawaban? Hubungi kami via WhatsApp.</p>
          </div>
          <FaqAccordion />
        </div>
      </section>

      <section className="px-6 py-20 md:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border p-8 text-center md:p-14" style={{ borderColor: "var(--outline-variant)", background: "var(--surface)", boxShadow: "var(--shadow-md)" }}>
            <h2 className="mx-auto mb-4 max-w-3xl text-3xl font-black md:text-5xl">Siap menghilangkan antrian di meja registrasi?</h2>
            <p className="mx-auto mb-8 max-w-2xl" style={{ color: "var(--on-surface-variant)" }}>Bergabung dengan penyelenggara event yang sudah beralih ke sistem lebih cepat.</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/auth/signup" className="rounded-xl px-7 py-3.5 text-sm font-bold" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>Mulai Gratis Sekarang</Link>
              <a href="https://wa.me/6285199527012" target="_blank" rel="noopener noreferrer" className="rounded-xl border px-7 py-3.5 text-sm font-bold" style={{ borderColor: "var(--outline)", color: "var(--on-surface)" }}>Hubungi Kami</a>
            </div>
          </div>

          <footer style={{ borderTop: '1px solid var(--outline-variant)', padding: '48px 24px 24px' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: '32px',
                paddingBottom: '40px',
              }}>
                {/* Left: Logo + Email */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src="/logo.png" alt="bdForms" style={{ width: '28px', height: '28px' }} />
                    <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--on-surface)' }}>bdForms</span>
                  </div>
                  <a href="mailto:contact.bdforms@gmail.com" style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                    contact.bdforms@gmail.com
                  </a>
                </div>

                {/* Right: Menu + Connect */}
                <div style={{ display: 'flex', gap: '64px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '4px' }}>Menu</p>
                    <a href="#how-it-works" style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>Cara Kerja</a>
                    <a href="#features" style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>Fitur</a>
                    <a href="#pricing" style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>Harga</a>
                    <a href="#faq" style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>FAQ</a>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '4px' }}>Connect</p>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <a href="https://www.instagram.com/bdforms.id" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--on-surface-variant)' }}>
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </a>
                      <a href="https://www.linkedin.com/company/bdforms-id" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--on-surface-variant)' }}>
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                      <a href="https://www.facebook.com/share/1DCysFqEMi" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--on-surface-variant)' }}>
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </a>
                      <a href="https://x.com/bdforms" target="_blank" rel="noopener noreferrer" aria-label="X">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--on-surface-variant)' }}>
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                      <a href="https://www.threads.com/@bdforms.id" target="_blank" rel="noopener noreferrer" aria-label="Threads">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--on-surface-variant)' }}>
                          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.31-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.05 7.164 1.43 1.781 3.63 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.36-.218-3.259-.797-1.063-.685-1.685-1.74-1.752-2.97-.065-1.2.38-2.31 1.256-3.124.84-.78 2.026-1.235 3.436-1.314.997-.057 1.93.043 2.766.297-.114-.687-.345-1.226-.687-1.61-.467-.523-1.193-.795-2.16-.809h-.03c-.78 0-1.84.215-2.515 1.235l-1.74-1.193c.903-1.366 2.367-2.118 4.255-2.118h.04c3.046.02 4.862 1.876 5.043 5.142.103.046.205.094.305.144 1.418.71 2.456 1.787 3 3.115.756 1.847.823 4.854-1.628 7.279-1.86 1.847-4.117 2.68-7.318 2.703zm.694-11.86c-.114-.002-.23-.001-.346.005-1.628.092-2.643.835-2.59 1.892.054 1.063 1.214 1.554 2.327 1.494 1.094-.06 2.36-.5 2.577-3.026a6.293 6.293 0 0 0-1.968-.365z"/>
                        </svg>
                      </a>
                      <a href="https://wa.me/6285199527012" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--on-surface-variant)' }}>
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>© 2026 bdForms. Hak cipta dilindungi.</p>
              </div>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}