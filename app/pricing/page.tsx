import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import "../design.css";

const PLANS = [
  {
    name: "Starter",
    badge: "Trial Gratis",
    badgeStyle: { background: "rgba(91,255,161,0.15)", color: "var(--green)" },
    price: "Gratis",
    normalPrice: null,
    desc: "Maks. 30 peserta",
    featured: false,
    features: ["Maks. 30 peserta", "QR Check-in offline", "Dashboard real-time", "Export CSV"],
  },
  {
    name: "Standard",
    badge: "PALING POPULER",
    badgeStyle: { background: "var(--green)", color: "var(--on-green)" },
    price: "Rp 21.000",
    normalPrice: "Rp 30.000",
    desc: "Maks. 120 peserta",
    featured: true,
    features: ["Maks. 120 peserta", "QR Check-in offline", "Dashboard real-time", "Export CSV", "Link scanner panitia"],
  },
  {
    name: "Pro",
    badge: null,
    badgeStyle: null,
    price: "Rp 85.000",
    normalPrice: "Rp 125.000",
    desc: "Maks. 500 peserta",
    featured: false,
    features: ["Maks. 500 peserta", "QR Check-in offline", "Dashboard real-time", "Export CSV", "Link scanner panitia", "Priority support"],
  },
  {
    name: "Enterprise",
    badge: "Custom",
    badgeStyle: { background: "rgba(0,224,255,0.15)", color: "var(--primary)" },
    price: "Hubungi Kami",
    normalPrice: null,
    desc: "Peserta tak terbatas",
    featured: false,
    features: ["Peserta tak terbatas", "White-label", "Custom branding", "Dedicated support", "SLA guarantee"],
  },
];

const ROWS = [
  { f: "Maks. Peserta", starter: "30", standard: "120", pro: "500", enterprise: "Unlimited" },
  { f: "QR Check-in offline", starter: true, standard: true, pro: true, enterprise: true },
  { f: "Dashboard real-time", starter: true, standard: true, pro: true, enterprise: true },
  { f: "Export CSV", starter: true, standard: true, pro: true, enterprise: true },
  { f: "Link scanner panitia", starter: false, standard: true, pro: true, enterprise: true },
  { f: "Priority support", starter: false, standard: false, pro: true, enterprise: true },
  { f: "White-label", starter: false, standard: false, pro: false, enterprise: true },
  { f: "Custom branding", starter: false, standard: false, pro: false, enterprise: true },
  { f: "Dedicated support", starter: false, standard: false, pro: false, enterprise: true },
  { f: "SLA guarantee", starter: false, standard: false, pro: false, enterprise: true },
];

function Cell({ v }: { v: boolean | string }) {
  if (typeof v === "string") return <span style={{ color: "var(--on-surface-variant)" }}>{v}</span>;
  return (
    <span
      className="material-symbols-outlined"
      style={{ color: v ? "var(--green)" : "var(--outline-variant)", opacity: v ? 1 : 0.4, fontVariationSettings: v ? "'FILL' 1" : undefined }}
    >
      {v ? "check_circle" : "close"}
    </span>
  );
}

export default function PricingPage() {
  return (
    <div className="bd">
      <SiteNav active="pricing" />

      <main className="px-6 pt-40 pb-24 md:px-10">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-5xl">Pilih Paket yang Tepat</h1>
          <p className="mx-auto max-w-2xl text-base" style={{ color: "var(--on-surface-variant)" }}>
            Harga terjangkau untuk setiap skala event. Tanpa biaya tersembunyi.
          </p>
          <div className="mx-auto mt-4 h-1 w-24 rounded-full" style={{ background: "var(--green)" }} />
        </div>

        <div className="mx-auto mb-28 grid max-w-6xl grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-2xl p-6 ${p.featured ? "" : "glass"}`}
              style={p.featured ? { border: "2px solid var(--green)", background: "rgba(91,255,161,0.03)" } : undefined}
            >
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-xl font-bold">{p.name}</h3>
                {p.badge && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={p.badgeStyle!}>
                    {p.badge}
                  </span>
                )}
              </div>
              <div className="mb-1 flex items-baseline gap-2">
                <span className="text-3xl font-bold" style={{ color: "var(--green)" }}>{p.price}</span>
                {p.normalPrice && (
                  <span className="text-sm line-through" style={{ color: "var(--on-surface-variant)" }}>{p.normalPrice}</span>
                )}
              </div>
              <div className="mb-6 flex items-center gap-2">
                <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>{p.desc}</p>
                {p.normalPrice && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "rgba(255,191,0,0.15)", color: "rgb(255,191,0)" }}>Hemat 30%</span>
                )}
              </div>
              <div className="mb-8 flex flex-col gap-3">
                {p.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-base" style={{ color: "var(--green)", fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    {f}
                  </div>
                ))}
              </div>
              <div className="mt-auto">
                {p.name === "Enterprise" ? (
                  <Link href="/auth/login" className="block w-full rounded-xl border py-3 text-center font-bold" style={{ borderColor: "var(--outline-variant)" }}>
                    Mulai Sekarang
                  </Link>
                ) : (
                  <Link href="/auth/login" className="block w-full rounded-xl py-3 text-center font-bold" style={{ background: "var(--green)", color: "var(--on-green)" }}>
                    Mulai Sekarang
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mb-28 max-w-4xl">
          <h3 className="mb-10 text-center text-2xl font-bold">Bandingkan Semua Fitur</h3>
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "rgba(59,73,76,0.3)", background: "rgba(14,14,14,0.5)" }}>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: "rgba(59,73,76,0.2)" }}>
                  <th className="p-5 text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Fitur</th>
                  <th className="p-5 text-center font-bold">Starter</th>
                  <th className="p-5 text-center font-bold" style={{ color: "var(--green)" }}>Standard</th>
                  <th className="p-5 text-center font-bold">Pro</th>
                  <th className="p-5 text-center font-bold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.f} className="border-b" style={{ borderColor: "rgba(59,73,76,0.1)" }}>
                    <td className="p-5 text-sm">{r.f}</td>
                    <td className="p-5 text-center"><Cell v={r.starter} /></td>
                    <td className="p-5 text-center"><Cell v={r.standard} /></td>
                    <td className="p-5 text-center"><Cell v={r.pro} /></td>
                    <td className="p-5 text-center"><Cell v={r.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass mx-auto max-w-4xl rounded-2xl p-12 text-center md:p-16" style={{ borderColor: "rgba(91,255,161,0.2)" }}>
          <h2 className="mb-6 text-3xl font-bold md:text-4xl">Siap menghilangkan antrian registrasi?</h2>
          <p className="mx-auto mb-10 max-w-2xl text-base" style={{ color: "var(--on-surface-variant)" }}>
            Bergabung dengan para event organizer yang percaya bdForms untuk check-in cepat & terverifikasi.
          </p>
          <Link href="/auth/login" className="inline-block rounded-xl px-10 py-4 text-base font-bold neon-green" style={{ background: "var(--green)", color: "var(--on-green)" }}>
            Mulai Sekarang
          </Link>
        </div>
      </main>

      <footer className="border-t border-white/5 px-6 py-12 md:px-10" style={{ background: "var(--surface-lowest)" }}>
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>layers</span>
            <span className="font-bold" style={{ color: "var(--primary)" }}>bdForms</span>
          </div>
          <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>&copy; 2026 bdForms. Built for speed.</p>
        </div>
      </footer>
    </div>
  );
}
