import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { PACKAGES, formatDiscount, formatPrice } from "@/lib/packages";
import "../design.css";

const ROWS = [
  { f: "Maks. Peserta", starter: "25", standard: "120", pro: "500", enterprise: "Unlimited" },
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
          {PACKAGES.map((pkg) => (
            <div key={pkg.id} className={`glass relative flex flex-col rounded-2xl p-6 ${pkg.highlighted ? "neon-green" : ""}`} style={{ borderWidth: pkg.highlighted ? "2px" : "1px", borderColor: pkg.highlighted ? "var(--green)" : "rgba(255,255,255,0.07)" }}>
              {pkg.highlighted && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "var(--green)", color: "var(--on-green)" }}>PALING POPULER</span></div>}
              <div className="mb-5">
                <h3 className="mb-2 text-2xl font-bold">{pkg.name}</h3>
                {pkg.label && <span className="inline-block rounded-lg px-2 py-1 text-xs font-bold" style={{ background: pkg.highlighted ? "var(--green)" : "rgba(91,255,161,0.15)", color: pkg.highlighted ? "var(--on-green)" : "var(--green)" }}>{pkg.label}</span>}
              </div>
              <div className="mb-6">
                {pkg.normalPrice ? <p className="mb-1 text-sm line-through" style={{ color: "var(--on-surface-variant)" }}>{formatPrice(pkg.normalPrice)}</p> : null}
                {pkg.discount > 0 && <span className="mb-2 inline-block rounded px-2 py-0.5 text-xs font-bold" style={{ background: "rgba(91,255,161,0.15)", color: "var(--green)" }}>Hemat {formatDiscount(pkg.discount)}%</span>}
                <p className="text-3xl font-bold" style={{ color: pkg.price === 0 ? "var(--green)" : undefined }}>{pkg.price === null ? "Hubungi Kami" : pkg.price === 0 ? "Gratis" : formatPrice(pkg.price)}</p>
                <p className="mt-2 text-sm" style={{ color: "var(--on-surface-variant)" }}>{pkg.maxParticipants ? `Maks. ${pkg.maxParticipants} peserta` : "Peserta tak terbatas"}</p>
                <p className="mt-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>{pkg.pricePerPerson ? `${formatPrice(pkg.pricePerPerson)}/orang` : "Tanpa biaya per peserta"}</p>
              </div>
              <div className="mb-8 flex flex-col gap-3">{pkg.features.map((f) => <div key={f} className="flex items-center gap-2 text-sm"><span className="material-symbols-outlined text-base" style={{ color: "var(--green)", fontVariationSettings: "'FILL' 1" }}>check_circle</span>{f}</div>)}</div>
              <Link href={pkg.id === "enterprise" ? "https://wa.me/6285349902918?text=Halo%2C%20saya%20tertarik%20dengan%20paket%20Enterprise%20bdForms." : "/create/package"} className="mt-auto block w-full rounded-xl py-3 text-center font-bold" style={{ background: pkg.highlighted ? "var(--green)" : "var(--surface-container)", color: pkg.highlighted ? "var(--on-green)" : "var(--on-surface)" }}>{pkg.cta}</Link>
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
