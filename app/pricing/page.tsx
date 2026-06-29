import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { Metadata } from "next";
import { PACKAGES, formatDiscount, formatPrice } from "@/lib/packages";
import "../design.css";

export const metadata: Metadata = {
  title: 'Harga — bdForms',
  description: 'Paket registrasi event mulai dari gratis. Starter (30 peserta), Standard (120 peserta), Pro (500 peserta), Enterprise (custom).',
}

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

const ROWS = FEATURES_TABLE;

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <span className="material-symbols-outlined" style={{ color: 'var(--success)' }}>check_circle</span>
  if (value === false) return <span className="material-symbols-outlined" style={{ color: 'var(--error)', opacity: 0.4 }}>cancel</span>
  if (value === 'soon') return <span style={{ fontSize: '11px', background: 'var(--primary-container)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>Segera</span>
  return <span style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>{value}</span>
}

export default function PricingPage() {
  return (
    <div className="bd">
      <SiteNav />

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
              {pkg.highlighted && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "var(--green)", color: "var(--on-green)" }}>{pkg.label}</span></div>}
              <div className="mb-5">
                <h3 className="mb-2 text-2xl font-bold">{pkg.name}</h3>
                {pkg.label && !pkg.highlighted && <span className="inline-block rounded-lg px-2 py-1 text-xs font-bold" style={{ background: "rgba(91,255,161,0.15)", color: "var(--green)" }}>{pkg.label}</span>}
              </div>
              <div className="mb-6">
                {pkg.id === 'enterprise' ? (
                  <p className="text-xl font-bold" style={{ color: 'var(--on-surface-variant)' }}>Hubungi Kami untuk penawaran khusus</p>
                ) : (
                  <>
                    {pkg.normalPrice ? <p className="mb-1 text-sm line-through" style={{ color: "var(--on-surface-variant)" }}>{formatPrice(pkg.normalPrice)}</p> : null}
                    {pkg.discount > 0 && <span className="mb-2 inline-block rounded px-2 py-0.5 text-xs font-bold" style={{ background: "rgba(91,255,161,0.15)", color: "var(--green)" }}>Hemat {formatDiscount(pkg.discount)}</span>}
                    <p className="text-3xl font-bold" style={{ color: pkg.price === 0 ? "var(--green)" : undefined }}>{pkg.price === 0 ? "Gratis" : formatPrice(pkg.price)}</p>
                    <p className="mt-2 text-sm" style={{ color: "var(--on-surface-variant)" }}>{pkg.maxParticipants ? `Maks. ${pkg.maxParticipants} peserta` : "Tak Terbatas"}</p>
                  </>
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
                  <tr key={r.name} className="border-b" style={{ borderColor: "rgba(59,73,76,0.1)" }}>
                    <td className="p-5 text-sm">{r.name}</td>
                    <td className="p-5 text-center"><Cell value={r.starter} /></td>
                    <td className="p-5 text-center"><Cell value={r.standard} /></td>
                    <td className="p-5 text-center"><Cell value={r.pro} /></td>
                    <td className="p-5 text-center"><Cell value={r.enterprise} /></td>
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
