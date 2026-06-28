"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/lib/supabase";
import { PACKAGES, formatDiscount, formatPrice } from "@/lib/packages";
import "../../design.css";

type PackageId = "starter" | "standard" | "pro" | "enterprise";

function PackageSelectionContent() {
  const router = useRouter();
  const [activeEventCount, setActiveEventCount] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageId | null>(null);
  const [organizerName, setOrganizerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [starterBlocked, setStarterBlocked] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session || !active) {
        setLoading(false);
        return;
      }
      const { count } = await supabase.from("events").select("*", { count: "exact", head: true }).eq("owner_id", session.user.id).eq("status", "active");
      if (active) {
        setActiveEventCount(count ?? 0);
        setStarterBlocked((count ?? 0) >= 1);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const handlePackageSelect = (pkgId: PackageId) => {
    if (pkgId === "starter") {
      if (starterBlocked) return;
      router.push("/create?package=starter");
    } else if (pkgId === "enterprise") {
      window.open("https://wa.me/6285349902918?text=Halo%2C%20saya%20tertarik%20dengan%20paket%20Enterprise%20bdForms.%20Bisa%20dibantu%3F", "_blank");
    } else {
      setSelectedPackage(pkgId);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentContinue = () => {
    if (!selectedPackage || !organizerName.trim()) return;
    const pkg = PACKAGES.find((p) => p.id === selectedPackage);
    if (!pkg) return;
    const msg = `Halo bdForms, saya ${organizerName.trim()} ingin memesan paket ${pkg.name} untuk ${pkg.maxParticipants} peserta. Total: ${formatPrice(pkg.price || 0)}. Mohon konfirmasi pembayarannya.`;
    window.open(`https://wa.me/6285349902918?text=${encodeURIComponent(msg)}`, "_blank");
    router.push(`/create?package=${selectedPackage}&status=pending_payment`);
  };

  if (loading) {
    return (
      <div className="bd flex min-h-screen items-center justify-center">
        <p style={{ color: "var(--on-surface-variant)" }}>Memuat...</p>
      </div>
    );
  }

  return (
    <div className="bd min-h-screen px-4 pt-6 pb-24 md:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm" style={{ color: "var(--on-surface-variant)" }}>
          ← Dashboard
        </Link>
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-3xl font-bold md:text-4xl">Pilih Paket Event</h1>
          <p className="text-base" style={{ color: "var(--on-surface-variant)" }}>
            Paket mulai dari <span style={{ color: "var(--green)" }}>Gratis</span> · Standard {formatPrice(225)}/orang · Pro {formatPrice(216)}/orang
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PACKAGES.map((pkg) => {
            const isBlocked = pkg.id === "starter" && starterBlocked;
            const isHL = pkg.highlighted;
            return (
              <div key={pkg.id} className={`glass relative rounded-2xl p-6 ${isHL ? "neon-green" : ""}`} style={{ borderWidth: isHL ? "2px" : "1px", borderColor: isHL ? "var(--green)" : "var(--outline-variant)", opacity: isBlocked ? 0.6 : 1 }}>
                {isHL && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "var(--green)", color: "var(--on-green)" }}>PALING POPULER</span></div>}
                <div className="mb-4">
                  <h3 className="mb-2 text-2xl font-bold">{pkg.name}</h3>
                  {pkg.label && <span className="inline-block rounded-lg px-2 py-1 text-xs font-medium" style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}>{pkg.label}</span>}
                </div>
                <div className="mb-4"><p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>{pkg.maxParticipants ? `Maks. ${pkg.maxParticipants} peserta` : "Tak Terbatas"}</p></div>
                <div className="mb-6">
                  {pkg.id === "starter" ? (
                    <p className="text-3xl font-bold" style={{ color: "var(--green)" }}>Gratis</p>
                  ) : pkg.id === "enterprise" ? (
                    <p className="text-2xl font-bold">Hubungi Kami</p>
                  ) : (
                    <>
                      {pkg.normalPrice && pkg.normalPrice > (pkg.price || 0) && <p className="mb-1 text-sm" style={{ color: "var(--on-surface-variant)", textDecoration: "line-through" }}>{formatPrice(pkg.normalPrice)}</p>}
                      <div className="mb-2 flex items-center gap-2">
                        <p className="text-3xl font-bold">{formatPrice(pkg.price || 0)}</p>
                        {pkg.discount > 0 && <span className="rounded px-2 py-0.5 text-xs font-bold" style={{ background: "rgba(91,255,161,0.15)", color: "var(--green)" }}>Hemat {formatDiscount(pkg.discount)}%</span>}
                      </div>
                      <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>({formatPrice(pkg.pricePerPerson)}/orang)</p>
                    </>
                  )}
                </div>
                <ul className="mb-6 space-y-2">
                  {pkg.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="material-symbols-outlined mt-0.5 text-base" style={{ color: "var(--green)", fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {isBlocked ? (
                  <div className="text-center">
                    <p className="mb-3 text-xs" style={{ color: "var(--error)" }}>Kamu sudah punya {activeEventCount} event aktif. Tutup event lama dulu atau pilih paket berbayar.</p>
                    <button disabled className="w-full rounded-xl py-3 font-bold opacity-50" style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}>Tidak Tersedia</button>
                  </div>
                ) : pkg.id === "enterprise" ? (
                  <button onClick={() => handlePackageSelect(pkg.id as PackageId)} className="w-full rounded-xl border py-3 font-bold" style={{ borderColor: "var(--outline-variant)" }}>{pkg.cta}</button>
                ) : (
                  <button onClick={() => handlePackageSelect(pkg.id as PackageId)} className="w-full rounded-xl py-3 font-bold" style={{ background: "var(--green)", color: "var(--on-green)" }}>{pkg.cta}</button>
                )}
              </div>
            );
          })}
        </div>
        {showPaymentModal && selectedPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0, 0, 0, 0.85)" }} onClick={(e) => e.target === e.currentTarget && setShowPaymentModal(false)}>
            <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "#0f1212", border: "1px solid rgba(91,255,161,0.3)" }}>
              <h3 className="mb-4 text-xl font-bold">Konfirmasi Paket {PACKAGES.find((p) => p.id === selectedPackage)?.name}</h3>
              <div className="mb-4 space-y-2 rounded-xl border p-4" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-low)" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--on-surface-variant)" }}>Paket:</span>
                  <span className="font-semibold">{PACKAGES.find((p) => p.id === selectedPackage)?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--on-surface-variant)" }}>Maks. peserta:</span>
                  <span className="font-semibold">{PACKAGES.find((p) => p.id === selectedPackage)?.maxParticipants}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--on-surface-variant)" }}>Total:</span>
                  <span className="text-lg font-bold">{formatPrice(PACKAGES.find((p) => p.id === selectedPackage)?.price || 0)}</span>
                </div>
              </div>
              <div className="mb-4 rounded-xl border p-3 text-sm" style={{ borderColor: "rgba(255,191,0,0.3)", background: "rgba(255,191,0,0.05)", color: "var(--on-surface)" }}>
                💡 Pembayaran dilakukan via transfer. Setelah konfirmasi dari tim bdForms, event kamu akan aktif.
              </div>
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium">Nama / Organisasi kamu</label>
                <input type="text" value={organizerName} onChange={(e) => setOrganizerName(e.target.value)} placeholder="cth: Ahmad / BEM Universitas" className="bd-input w-full rounded-lg px-4 py-3" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowPaymentModal(false)} className="flex-1 rounded-xl border py-3 font-bold" style={{ borderColor: "var(--outline-variant)" }}>Batal</button>
                <button onClick={handlePaymentContinue} disabled={!organizerName.trim()} className="flex-1 rounded-xl py-3 font-bold disabled:opacity-50" style={{ background: "var(--green)", color: "var(--on-green)" }}>Lanjut via WhatsApp →</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PackageSelectionPage() {
  return (
    <AuthGuard>
      <PackageSelectionContent />
    </AuthGuard>
  );
}
