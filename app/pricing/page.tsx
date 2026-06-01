import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import "../design.css";

const PLANS = [
  {
    tier: "Entry Level",
    name: "FREE",
    price: "Rp 0",
    desc: "Cocok untuk proyek kecil & komunitas.",
    cta: "Start for Free",
    href: "/create" as const,
    blocked: false,
    featured: false,
    features: ["50 Peserta per event", "Iklan ditampilkan", "Paperless Registration"],
  },
  {
    tier: "Professional",
    name: "PRO",
    price: "Rp 50.000",
    desc: "Semua yang dibutuhkan untuk event profesional.",
    cta: "Get Started Now",
    href: null,
    blocked: true,
    featured: true,
    features: ["Unlimited Peserta", "Tanpa iklan", "Paperless Registration"],
  },
];

const ROWS = [
  { f: "Max Peserta", free: "50", pro: "Unlimited" },
  { f: "No Ads", free: false, pro: true },
  { f: "Paperless Registration", free: true, pro: true },
];

function Cell({ v }: { v: boolean | string }) {
  if (typeof v === "string") return <span style={{ color: "var(--on-surface-variant)" }}>{v}</span>;
  return (
    <span className="material-symbols-outlined" style={{ color: v ? "var(--green)" : "var(--outline-variant)", opacity: v ? 1 : 0.4 }}>
      {v ? "check" : "close"}
    </span>
  );
}

export default function PricingPage() {
  return (
    <div className="bd">
      <SiteNav active="pricing" />

      <main className="px-6 pt-40 pb-24 md:px-10">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-5xl">Simple Pricing for Every Event</h1>
          <p className="mx-auto max-w-2xl text-base" style={{ color: "var(--on-surface-variant)" }}>
            Paket fleksibel untuk organisasi, kampus, komunitas, dan event organizer profesional. Tanpa biaya tersembunyi.
          </p>
        </div>

        <div className="mx-auto mb-28 grid max-w-3xl grid-cols-1 items-stretch gap-6 md:grid-cols-2">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`glass relative flex flex-col rounded-2xl p-8 ${p.featured ? "neon-green" : ""}`}
              style={p.featured ? { borderColor: "rgba(91,255,161,0.4)" } : undefined}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold" style={{ background: "var(--green)", color: "var(--on-green)" }}>
                  PALING POPULER
                </div>
              )}
              <span className="mb-2 text-xs uppercase tracking-widest" style={{ color: p.featured ? "var(--green)" : "var(--on-surface-variant)" }}>{p.tier}</span>
              <h2 className="mb-6 text-2xl font-bold">{p.name}</h2>
              <div className="mb-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{p.price}</span>
                <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>/ event</span>
              </div>
              <p className="mb-6 text-sm" style={{ color: "var(--on-surface-variant)" }}>{p.desc}</p>
              {p.blocked ? (
                <button
                  type="button"
                  disabled
                  title="Billing coming soon"
                  className="mb-8 cursor-not-allowed rounded-xl py-3 text-center font-bold opacity-45"
                  style={{ background: "var(--green)", color: "var(--on-green)" }}
                >
                  {p.cta}
                </button>
              ) : (
                <Link
                  href={p.href!}
                  className="mb-8 rounded-xl py-3 text-center font-bold"
                  style={{ border: "1px solid var(--outline-variant)" }}
                >
                  {p.cta}
                </Link>
              )}
              <ul className="flex flex-grow flex-col gap-4">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-base" style={{ color: "var(--green)", marginTop: 2 }}>check_circle</span>
                    <span className="text-sm" style={{ color: "var(--on-surface)" }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mx-auto mb-28 max-w-2xl">
          <h3 className="mb-10 text-center text-2xl font-bold">Compare All Features</h3>
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "rgba(59,73,76,0.3)", background: "rgba(14,14,14,0.5)" }}>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: "rgba(59,73,76,0.2)" }}>
                  <th className="p-5 text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Core Features</th>
                  <th className="p-5 text-center font-bold">Free</th>
                  <th className="p-5 text-center font-bold" style={{ color: "var(--green)" }}>Pro</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.f} className="border-b" style={{ borderColor: "rgba(59,73,76,0.1)" }}>
                    <td className="p-5 text-sm">{r.f}</td>
                    <td className="p-5 text-center"><Cell v={r.free} /></td>
                    <td className="p-5 text-center"><Cell v={r.pro} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass mx-auto max-w-4xl rounded-2xl p-12 text-center md:p-16" style={{ borderColor: "rgba(91,255,161,0.2)" }}>
          <h2 className="mb-6 text-3xl font-bold md:text-4xl">Ready to eliminate registration queues?</h2>
          <p className="mx-auto mb-10 max-w-2xl text-base" style={{ color: "var(--on-surface-variant)" }}>
            Bergabung dengan para event organizer yang percaya bdForms untuk check-in cepat & terverifikasi.
          </p>
          <Link href="/create" className="inline-block rounded-xl px-10 py-4 text-base font-bold neon-green" style={{ background: "var(--green)", color: "var(--on-green)" }}>
            Start Free Trial
          </Link>
        </div>
      </main>

      <footer className="border-t border-white/5 px-6 py-12 md:px-10" style={{ background: "var(--surface-lowest)" }}>
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>layers</span>
            <span className="font-bold" style={{ color: "var(--primary)" }}>bdForms</span>
          </div>
          <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>© 2026 bdForms. Built for speed.</p>
        </div>
      </footer>
    </div>
  );
}
