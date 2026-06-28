import Image from "next/image";
import Link from "next/link";
import "./design.css";

const HERO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDrFWYLjWMiX0Q2WHYhuCtMG_CuBKigdzinUmpMTqbYvyyq6g1OP2paB0NCgGedQbOr72K43Haqf_PIAuM1s_ckoh4a8lCAm60kZ--RYCDXQ-mRqOiulz4Go0zsNRnkCrb6c3hjups2rjgSxiU0v-2Xp0YNNxCLEYnqaKqMwIcxNKJCN8g8HmJiCZ3tKZ_6XxzqUcNq0Xoo5IrSkLXz0Fnad-TjilzrCg4MiRqtLbq0nM3czrSJg7F7og_PfFI8YJBl_1d-a4LlSaY";

// Logo files should be in public/logos/
const TRUSTED_LOGOS = [
  { name: "Area Desain", src: "/logos/Logo_Area_Desain.png", invert: false },
  { name: "Barika", src: "/logos/Logo_Barika.png", invert: false },
  { name: "EggGeek", src: "/logos/Logo_Eggeek.png", invert: false },
  { name: "nightCoders", src: "/logos/Logo_Nightcoders.png", invert: true },
  { name: "Startup Banda Aceh Community", src: "/logos/Logo_Startup_Banda_Aceh_Community.png", invert: false },
];

const DOCS = [
  {
    col: "Documentation",
    items: [
      { i: "rocket_launch", t: "Getting Started", d: "Start building in minutes" },
      { i: "group", t: "Participant Registration", d: "Digital sign-up flows" },
      { i: "qr_code_2", t: "QR Check-In", d: "Instant gate validation" },
    ],
  },
  {
    col: "Modules",
    items: [
      { i: "verified_user", t: "Anti-Fraud Verification", d: "Secure attendee identity" },
      { i: "monitoring", t: "Analytics & Reports", d: "Real-time event insights" },
      { i: "hub", t: "System Architecture", d: "Offline-first infrastructure" },
    ],
  },
];

const SOLUTIONS = [
  {
    col: "Event Types",
    items: [
      { i: "school", t: "Campus Events", d: "Universitas & organisasi mahasiswa" },
      { i: "cast_for_education", t: "Seminar & Workshop", d: "Professional learning sessions" },
      { i: "diversity_3", t: "Communities & Organizations", d: "Clubs & NGO gatherings" },
    ],
  },
  {
    col: "Use Cases",
    items: [
      { i: "timer_off", t: "Reduce Registration Queue", d: "Faster check-in at the gate" },
      { i: "gpp_bad", t: "Prevent Attendance Fraud", d: "Verified entry only" },
      { i: "history_edu", t: "Paperless Registration", d: "Fully digital workflows" },
    ],
  },
];

type Group = { col: string; items: { i: string; t: string; d: string }[] };

function Dropdown({ label, groups }: { label: string; groups: Group[] }) {
  return (
    <div className="bd-menu">
      <button className="flex items-center gap-1 text-sm font-medium hover:opacity-80" style={{ color: "var(--on-surface-variant)" }}>
        {label}
        <span className="material-symbols-outlined text-base">expand_more</span>
      </button>
      <div className="bd-mega">
        <div className="glass rounded-2xl p-6" style={{ width: 580, maxWidth: "90vw", background: "rgba(10,10,10,0.97)" }}>
          <div className="grid grid-cols-2 gap-x-8">
            {groups.map((g) => (
              <div key={g.col}>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(186,201,205,0.5)" }}>{g.col}</p>
                <div className="flex flex-col gap-1">
                  {g.items.map((it) => (
                    <a key={it.t} href="#" className="flex items-start gap-3 rounded-xl p-2 hover:bg-white/5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(0,224,255,0.1)" }}>
                        <span className="material-symbols-outlined text-[20px]" style={{ color: "var(--primary)" }}>{it.i}</span>
                      </span>
                      <span>
                        <span className="block text-sm font-semibold" style={{ color: "var(--on-surface)" }}>{it.t}</span>
                        <span className="block text-xs" style={{ color: "var(--on-surface-variant)" }}>{it.d}</span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="bd">
      {/* Nav */}
      <nav className="fixed top-0 z-50 flex h-20 w-full items-center justify-between border-b border-white/5 bg-black/70 px-6 backdrop-blur-xl md:px-10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px]" style={{ color: "var(--primary)" }}>layers</span>
          <span className="text-xl font-bold" style={{ color: "var(--primary)" }}>bdForms</span>
        </div>
        <div className="hidden items-center gap-8 md:flex">
          <Link href="/" className="border-b-2 pb-1 text-sm font-bold" style={{ color: "var(--green)", borderColor: "var(--green)" }}>Product</Link>
          <Dropdown label="Docs" groups={DOCS} />
          <Dropdown label="Solutions" groups={SOLUTIONS} />
          <Link href="/pricing" className="text-sm font-medium hover:opacity-80" style={{ color: "var(--on-surface-variant)" }}>Pricing</Link>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/auth/login" className="hidden text-sm hover:opacity-80 sm:block" style={{ color: "var(--on-surface-variant)" }}>Login</Link>
          <Link href="/create" className="rounded-full px-6 py-2.5 text-sm font-bold neon-green" style={{ background: "var(--green)", color: "var(--on-green)" }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-40 pb-20 md:px-10">
        <div className="hero-accent" style={{ top: -100, left: -200, background: "radial-gradient(circle, rgba(0,224,255,0.10) 0%, transparent 70%)" }} />
        <div className="hero-accent" style={{ bottom: 0, right: -200, background: "radial-gradient(circle, rgba(91,255,161,0.07) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5" style={{ borderColor: "rgba(59,73,76,0.5)", background: "var(--surface-low)" }}>
            <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--green)" }} />
            <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Fast. Secure. Offline-First.</span>
          </div>
          <h1 className="mx-auto mb-6 max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Fast-Track Registration Under <span className="gradient-text">3 Seconds</span>
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-base md:text-lg" style={{ color: "var(--on-surface-variant)" }}>
            Sistem registrasi event termutakhir di Indonesia. Tanpa antrian, tanpa kendala sinyal, dan proses validasi instan untuk pengalaman tamu yang eksklusif.
          </p>
          <div className="mb-20 flex justify-center">
            <Link href="/auth/login" className="rounded-xl px-8 py-4 text-base font-bold neon-cyan" style={{ background: "var(--primary-container)", color: "var(--on-primary-container)" }}>Start Free Trial</Link>
          </div>
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border shadow-2xl" style={{ borderColor: "rgba(59,73,76,0.3)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HERO_IMG} alt="Visualisasi piramida neon 3D" className="aspect-video w-full object-cover opacity-90" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #050505, transparent 60%)" }} />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-20 md:px-10">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { v: "< 3 detik", t: "Rata-rata waktu check-in per peserta" },
            { v: "100%", t: "Paperless & Digital Workflow" },
            { v: "Offline", t: "Sinkronisasi data otomatis tanpa sinyal" },
          ].map((s) => (
            <div key={s.t} className="glass rounded-2xl p-10 text-center">
              <h3 className="gradient-text mb-2 text-3xl font-bold">{s.v}</h3>
              <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>{s.t}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trusted organizers */}
      <section className="overflow-hidden border-y border-white/5 px-6 py-16 md:px-10" style={{ background: "rgba(14,14,14,0.5)" }}>
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h2 className="mb-3 text-2xl font-bold md:text-3xl">Dipercaya oleh komunitas & organisasi terkemuka</h2>
          <p className="text-sm md:text-base" style={{ color: "var(--on-surface-variant)" }}>Bergabung dengan ratusan penyelenggara event di Aceh dan sekitarnya</p>
        </div>
        <div className="mask-fade relative">
          <div className="flex w-max items-stretch gap-4 whitespace-nowrap animate-scroll">
            {Array.from({ length: 6 }).flatMap(() => TRUSTED_LOGOS).map((logo, i) => (
              <div key={`${logo.name}-${i}`} className="glass flex w-56 shrink-0 flex-col items-center justify-center gap-3 rounded-xl px-6 py-4 transition-transform hover:scale-105 md:w-64" style={{ background: "rgba(13,16,16,0.9)", borderColor: "rgba(255,255,255,0.12)" }}>
                <Image src={logo.src} alt={logo.name} width={160} height={40} className="h-10 w-auto object-contain" style={{ filter: logo.invert ? "brightness(0) invert(1)" : undefined }} />
                <span className="text-center text-xs" style={{ color: "var(--on-surface-variant)" }}>{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-24 md:px-10" style={{ background: "linear-gradient(180deg, rgba(5,5,5,0.85), rgba(14,14,14,0.55))" }}>
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <span className="mb-3 inline-flex rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ borderColor: "rgba(91,255,161,0.25)", color: "var(--green)", background: "rgba(91,255,161,0.08)" }}>
              Panduan Cepat
            </span>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Cara Kerja bdForms dari awal sampai event selesai</h2>
            <p className="text-sm md:text-base" style={{ color: "var(--on-surface-variant)" }}>
              Mulai dari login, buat event, bagikan link pendaftaran ke peserta, aktifkan scanner panitia, sampai tutup event dan unduh data peserta.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { n: "01", i: "login", h: "Login atau daftar akun", p: "Masuk ke dashboard bdForms untuk mulai mengelola event kamu dalam satu tempat." },
              { n: "02", i: "event", h: "Buat event baru", p: "Isi nama event, jadwal, lokasi, kuota peserta, deadline pendaftaran, dan pilih paket yang sesuai." },
              { n: "03", i: "dynamic_form", h: "Atur form pendaftaran", p: "Pilih field peserta seperti No. HP, Instansi, Jabatan, NIP/NIM/ID, atau tambahkan pertanyaan custom." },
              { n: "04", i: "ios_share", h: "Share link pendaftaran", p: "Kirim link pendaftaran ke peserta lewat WhatsApp, Instagram, email, atau media komunitas kamu." },
              { n: "05", i: "qr_code_scanner", h: "Bagikan link scanner panitia", p: "Berikan link scanner khusus ke panitia registrasi agar check-in QR bisa dilakukan cepat di lokasi event." },
              { n: "06", i: "monitoring", h: "Pantau dashboard real-time", p: "Lihat jumlah peserta, status kehadiran, dan perkembangan registrasi langsung dari dashboard." },
              { n: "07", i: "task_alt", h: "Check-in saat event", p: "Panitia scan QR peserta. Sistem tetap siap dipakai untuk alur check-in yang cepat dan rapi." },
              { n: "08", i: "archive", h: "Tutup event & export data", p: "Setelah selesai, tutup event dan download data peserta untuk laporan atau arsip panitia." },
            ].map((step) => (
              <div key={step.n} className="glass group relative overflow-hidden rounded-2xl p-6 transition-transform hover:-translate-y-1" style={{ background: "rgba(13,16,16,0.82)", borderColor: "rgba(255,255,255,0.1)" }}>
                <div className="absolute right-4 top-4 text-5xl font-black opacity-[0.06]">{step.n}</div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "rgba(0,224,255,0.1)", color: "var(--primary)" }}>
                  <span className="material-symbols-outlined">{step.i}</span>
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "rgba(91,255,161,0.12)", color: "var(--green)" }}>{step.n}</span>
                  <h3 className="font-bold">{step.h}</h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--on-surface-variant)" }}>{step.p}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/auth/login" className="rounded-xl px-6 py-3 text-sm font-bold neon-green" style={{ background: "var(--green)", color: "var(--on-green)" }}>
              Mulai Buat Event
            </Link>
            <Link href="/pricing" className="rounded-xl border px-6 py-3 text-sm font-bold" style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface)" }}>
              Lihat Paket Harga
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="px-6 py-28 md:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Masalah Registrasi Konvensional</h2>
            <div className="mx-auto h-1 w-24 rounded-full" style={{ background: "var(--primary)" }} />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { i: "timer_off", h: "Antrian Panjang", p: "Proses manual yang memakan waktu menyebabkan penumpukan tamu di area lobi event." },
              { i: "signal_wifi_off", h: "Sinyal Tidak Stabil", p: "Kegagalan sistem berbasis web murni saat koneksi internet di venue terganggu." },
              { i: "lock_reset", h: "Rentan Kecurangan", p: "Tiket fisik atau PDF yang mudah dipalsukan tanpa sistem validasi real-time yang ketat." },
            ].map((c) => (
              <div key={c.h} className="rounded-2xl border p-8" style={{ borderColor: "rgba(59,73,76,0.25)", background: "rgba(28,27,27,0.3)" }}>
                <span className="material-symbols-outlined mb-5 text-5xl" style={{ color: "var(--error)" }}>{c.i}</span>
                <h4 className="mb-3 text-xl font-semibold">{c.h}</h4>
                <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>{c.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-20 md:px-10" style={{ background: "var(--surface-lowest)" }}>
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
            <div className="col-span-2">
              <div className="mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>layers</span>
                <span className="text-lg font-bold" style={{ color: "var(--primary)" }}>bdForms</span>
              </div>
              <p className="mb-8 max-w-xs text-sm" style={{ color: "var(--on-surface-variant)" }}>
                Solusi manajemen event dan registrasi berbasis offline-first untuk performa maksimal di setiap acara.
              </p>
              <div className="flex gap-4">
                {["share", "public", "mail"].map((ic) => (
                  <span key={ic} className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--surface-container)" }}>
                    <span className="material-symbols-outlined text-base" style={{ color: "var(--on-surface-variant)" }}>{ic}</span>
                  </span>
                ))}
              </div>
            </div>
            {[
              { t: "Product", items: ["Features", "Pricing", "Security", "Roadmap"] },
              { t: "Resources", items: ["Documentation", "API Reference", "Blog", "Community"] },
              { t: "Company", items: ["About Us", "Careers", "Contact", "Partner"] },
              { t: "Legal", items: ["Privacy Policy", "Terms of Service", "Cookie Policy"] },
            ].map((col) => (
              <div key={col.t} className="flex flex-col gap-4">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--on-surface)" }}>{col.t}</p>
                {col.items.map((it) => (
                  <a key={it} href="#" className="text-sm hover:opacity-80" style={{ color: "var(--on-surface-variant)" }}>{it}</a>
                ))}
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
            <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>© 2026 bdForms. Built for speed.</p>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--green)" }} />
              <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>All Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
