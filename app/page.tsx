import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import "./design.css";

const HERO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDrFWYLjWMiX0Q2WHYhuCtMG_CuBKigdzinUmpMTqbYvyyq6g1OP2paB0NCgGedQbOr72K43Haqf_PIAuM1s_ckoh4a8lCAm60kZ--RYCDXQ-mRqOiulz4Go0zsNRnkCrb6c3hjups2rjgSxiU0v-2Xp0YNNxCLEYnqaKqMwIcxNKJCN8g8HmJiCZ3tKZ_6XxzqUcNq0Xoo5IrSkLXz0Fnad-TjilzrCg4MiRqtLbq0nM3czrSJg7F7og_PfFI8YJBl_1d-a4LlSaY";

const LOGOS = ["Aceh Hackathon", "Barika Coffee and Space", "Nightcoder", "Egg Geak"];

export default function LandingPage() {
  return (
    <div className="bd">
      <SiteNav active="product" />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-40 pb-20 md:px-10">
        <div className="hero-accent" style={{ top: -100, left: -200, background: "radial-gradient(circle, rgba(0,224,255,0.10) 0%, transparent 70%)" }} />
        <div className="hero-accent" style={{ bottom: 0, right: -200, background: "radial-gradient(circle, rgba(91,255,161,0.07) 0%, transparent 70%)" }} />
        <div className="relative z-10 mx-auto text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5" style={{ borderColor: "rgba(59,73,76,0.5)", background: "var(--surface-low)" }}>
            <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--green)" }} />
            <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Fast. Secure. offline-first.</span>
          </div>
          <h1 className="mx-auto mb-6 max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Fast-Track Registration Under <span className="gradient-text">3 Seconds</span>
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-base md:text-lg" style={{ color: "var(--on-surface-variant)" }}>
            Sistem registrasi event. Tanpa antrian, tanpa kendala sinyal, dan proses validasi instan untuk pengalaman tamu yang eksklusif.
          </p>
          <div className="mb-20 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/create" className="rounded-xl px-8 py-4 text-base font-bold neon-cyan" style={{ background: "var(--primary-container)", color: "var(--on-primary-container)" }}>Start Free Trial</Link>
            <Link href="/pricing" className="rounded-xl border px-8 py-4 text-base font-bold transition-colors hover:bg-white/5" style={{ borderColor: "var(--outline-variant)" }}>Book a Demo</Link>
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

      {/* Trust marquee */}
      <section className="overflow-hidden border-y border-white/5 py-16" style={{ background: "rgba(14,14,14,0.5)" }}>
        <p className="mb-10 text-center text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Dipercaya oleh organizer ternama</p>
        <div className="mask-fade relative">
          <div className="flex w-max items-center gap-24 whitespace-nowrap animate-scroll">
            {[...LOGOS, ...LOGOS].map((logo, i) => (
              <span key={i} className="shrink-0 text-2xl font-semibold opacity-60" style={{ color: "var(--on-surface-variant)" }}>{logo}</span>
            ))}
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
