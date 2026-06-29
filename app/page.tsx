"use client";

import Image from "next/image";
import Link from "next/link";
import { PACKAGES, formatDiscount, formatPrice } from "@/lib/packages";
import FaqAccordion from "@/components/FaqAccordion";
import SiteNav from "@/components/SiteNav";
import { useTranslation } from "@/lib/useTranslation";
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
      <Link href={pkg.id === "enterprise" ? "https://wa.me/6285349902918?text=Halo%2C%20saya%20tertarik%20dengan%20paket%20Enterprise%20bdForms." : "/create/package"} className="mt-auto rounded-xl px-5 py-3 text-center text-sm font-bold" style={{ background: pkg.highlighted ? "var(--primary)" : "var(--surface-container)", color: pkg.highlighted ? "var(--on-primary)" : "var(--on-surface)" }}>
        {pkg.cta}
      </Link>
    </div>
  );
}

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="bd">
      <SiteNav />

      <section className="relative flex min-h-[calc(100vh-64px)] items-center overflow-hidden px-6 py-20 md:px-10">
        <div className="hero-accent" style={{ top: -120, left: -180, background: "radial-gradient(circle, rgba(0,102,255,0.12), transparent 70%)" }} />
        <div className="hero-accent" style={{ bottom: -160, right: -160, background: "radial-gradient(circle, rgba(0,200,255,0.12), transparent 70%)" }} />
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold" style={{ borderColor: "var(--outline)", background: "var(--primary-container)", color: "var(--on-primary-container)" }}>
              ⚡ {t("hero.badge")}
            </div>
            <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight md:text-6xl" style={{ color: "var(--on-background)" }}>
              {t("hero.title")} <span className="gradient-text">{t("hero.titleAccent")}</span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed md:text-lg lg:mx-0" style={{ color: "var(--on-surface-variant)" }}>
              {t("hero.subtitle")}
            </p>
            <div className="mb-10 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href="/auth/signup" className="rounded-xl px-7 py-3.5 text-sm font-bold accent-glow" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>{t("hero.ctaPrimary")}</Link>
              <a href="#how-it-works" className="rounded-xl border px-7 py-3.5 text-sm font-bold" style={{ borderColor: "var(--outline)", color: "var(--on-surface)" }}>{t("hero.ctaSecondary")}</a>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                [t("stats.checkinValue"), t("stats.checkin")],
                [t("stats.setupValue"), t("stats.setup")],
                [t("stats.offlineValue"), t("stats.offline")],
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
            <h2 className="mb-4 text-3xl font-black md:text-5xl">{t("features.title")}</h2>
            <p style={{ color: "var(--on-surface-variant)" }}>{t("features.subtitle")}</p>
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
            <h2 className="mb-4 text-3xl font-black md:text-5xl">{t("howItWorks.title")}</h2>
            <p style={{ color: "var(--on-surface-variant)" }}>{t("howItWorks.subtitle")}</p>
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
            <h2 className="mb-4 text-3xl font-black md:text-5xl">{t("pricing.title")}</h2>
            <p style={{ color: "var(--on-surface-variant)" }}>{t("pricing.subtitle")}</p>
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
            <h2 className="mb-4 text-3xl font-black md:text-5xl">{t("faq.title")}</h2>
            <p style={{ color: "var(--on-surface-variant)" }}>{t("faq.subtitle")}</p>
          </div>
          <FaqAccordion />
        </div>
      </section>

      <section className="px-6 py-20 md:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border p-8 text-center md:p-14" style={{ borderColor: "var(--outline-variant)", background: "var(--surface)", boxShadow: "var(--shadow-md)" }}>
            <h2 className="mx-auto mb-4 max-w-3xl text-3xl font-black md:text-5xl">{t("cta.title")}</h2>
            <p className="mx-auto mb-8 max-w-2xl" style={{ color: "var(--on-surface-variant)" }}>{t("cta.subtitle")}</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/auth/signup" className="rounded-xl px-7 py-3.5 text-sm font-bold" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>{t("cta.primary")}</Link>
              <a href="https://wa.me/6285349902918" target="_blank" rel="noopener noreferrer" className="rounded-xl border px-7 py-3.5 text-sm font-bold" style={{ borderColor: "var(--outline)", color: "var(--on-surface)" }}>{t("cta.secondary")}</a>
            </div>
          </div>

          <footer className="mt-12 border-t pt-8" style={{ borderColor: "var(--outline-variant)" }}>
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="bdForms" width={32} height={32} className="h-8 w-8" />
                <div>
                  <p className="font-black" style={{ color: "var(--primary)" }}>bdForms</p>
                  <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{t("footer.tagline")}</p>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-5 text-sm" style={{ color: "var(--on-surface-variant)" }}>
                <a href="#how-it-works">{t("nav.howItWorks")}</a>
                <a href="#features">{t("nav.features")}</a>
                <a href="#pricing">{t("nav.pricing")}</a>
                <a href="#faq">{t("nav.faq")}</a>
              </div>
              <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{t("footer.copyright")}</p>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}