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
      window.open("https://wa.me/6285199527012?text=Halo%2C%20saya%20tertarik%20dengan%20paket%20Enterprise%20Regesit.%20Bisa%20dibantu%3F", "_blank");
    } else {
      setSelectedPackage(pkgId);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentContinue = () => {
    if (!selectedPackage) return;
    setShowPaymentModal(false);
    router.push(`/create?package=${selectedPackage}&status=pending_payment`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#0a0e1a" }}>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>Memuat...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "#0a0e1a" }}>
      {/* Radial glow behind heading */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          top: "-120px",
          width: "900px",
          height: "600px",
          background: "radial-gradient(ellipse at center, rgba(0,102,255,0.18) 0%, rgba(0,200,255,0.08) 40%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Star/dot particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { top: "8%", left: "12%", size: 2, opacity: 0.4, delay: "0s" },
          { top: "15%", left: "85%", size: 3, opacity: 0.3, delay: "1s" },
          { top: "25%", left: "5%", size: 2, opacity: 0.5, delay: "2s" },
          { top: "35%", left: "92%", size: 2, opacity: 0.35, delay: "0.5s" },
          { top: "45%", left: "8%", size: 3, opacity: 0.25, delay: "1.5s" },
          { top: "55%", left: "88%", size: 2, opacity: 0.4, delay: "3s" },
          { top: "65%", left: "15%", size: 2, opacity: 0.3, delay: "2.5s" },
          { top: "12%", left: "45%", size: 2, opacity: 0.2, delay: "0.8s" },
          { top: "75%", left: "78%", size: 3, opacity: 0.3, delay: "1.2s" },
          { top: "80%", left: "30%", size: 2, opacity: 0.25, delay: "3.5s" },
          { top: "20%", left: "65%", size: 2, opacity: 0.35, delay: "2.2s" },
          { top: "50%", left: "50%", size: 2, opacity: 0.15, delay: "4s" },
        ].map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              background: `rgba(0,180,255,${star.opacity})`,
              animation: `twinkle 3s ease-in-out ${star.delay} infinite alternate`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 px-4 pt-6 pb-24 md:px-10">
        <div className="mx-auto max-w-6xl">
          <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.5)" }}>
            ← Dashboard
          </Link>

          {/* Header */}
          <div className="mb-14 text-center">
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              Pilih Paket Event
            </h1>
            <p className="text-base" style={{ color: "rgba(255,255,255,0.5)" }}>
              Paket mulai dari <span style={{ color: "#00C8FF" }}>Gratis</span> · Standard {formatPrice(600)}/orang · Pro {formatPrice(570)}/orang
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {PACKAGES.map((pkg) => {
              const isBlocked = pkg.id === "starter" && starterBlocked;
              const isHL = pkg.highlighted;

              return (
                <div
                  key={pkg.id}
                  className="relative flex flex-col justify-between rounded-2xl p-6 transition-transform hover:scale-[1.02]"
                  style={{
                    background: isHL
                      ? "linear-gradient(135deg, #0066FF 0%, #00C8FF 100%)"
                      : "rgba(255,255,255,0.04)",
                    border: isHL
                      ? "none"
                      : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: isHL
                      ? "0 0 40px rgba(0,102,255,0.3), 0 8px 32px rgba(0,0,0,0.4)"
                      : "0 0 20px rgba(0,102,255,0.06), 0 4px 16px rgba(0,0,0,0.3)",
                    opacity: isBlocked ? 0.6 : 1,
                    minHeight: "480px",
                  }}
                >
                  <div className="flex-1 flex flex-col">
                    {/* Package name & label */}
                    <div className="mb-5">
                      {isHL && (
                        <div className="mb-4">
                          <span
                            className="inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-lg"
                            style={{
                              background: "rgba(255,255,255,0.2)",
                              color: "#fff",
                              backdropFilter: "blur(8px)",
                              border: "1px solid rgba(255,255,255,0.3)",
                            }}
                          >
                            PALING POPULER
                          </span>
                        </div>
                      )}
                      <h3 className="mb-1.5 text-xl font-bold" style={{ color: isHL ? "#fff" : "rgba(255,255,255,0.95)" }}>
                        {pkg.name}
                      </h3>
                      {pkg.label && (
                        <span
                          className="inline-block rounded-lg px-2.5 py-1 text-xs font-medium"
                          style={{
                            background: isHL ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
                            color: isHL ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)",
                          }}
                        >
                          {pkg.label}
                        </span>
                      )}
                    </div>

                    {/* Price display */}
                    <div className="mb-6">
                      {pkg.id === "starter" ? (
                        <>
                          <p className="text-4xl font-extrabold" style={{ color: isHL ? "#fff" : "#00C8FF" }}>
                            Gratis
                          </p>
                          <p className="mt-1 text-sm" style={{ color: isHL ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)" }}>
                            per orang
                          </p>
                        </>
                      ) : pkg.id === "enterprise" ? (
                        <div>
                          <p className="text-2xl font-extrabold" style={{ color: "rgba(255,255,255,0.9)" }}>
                            Custom
                          </p>
                          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                            Hubungi Kami untuk penawaran khusus
                          </p>
                        </div>
                      ) : (
                        <>
                          {pkg.normalPrice && pkg.normalPrice > (pkg.price || 0) && (
                            <p className="mb-1 text-sm line-through" style={{ color: isHL ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.3)" }}>
                              {formatPrice(pkg.normalPrice)}
                            </p>
                          )}
                          <div className="mb-1 flex items-baseline gap-2">
                            <p className="text-4xl font-extrabold" style={{ color: isHL ? "#fff" : "rgba(255,255,255,0.95)" }}>
                              {formatPrice(pkg.price || 0)}
                            </p>
                            {pkg.discount > 0 && (
                              <span
                                className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                                style={{
                                  background: isHL ? "rgba(255,255,255,0.2)" : "rgba(0,102,255,0.15)",
                                  color: isHL ? "#fff" : "#00C8FF",
                                }}
                              >
                                Hemat {formatDiscount(pkg.discount)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm" style={{ color: isHL ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)" }}>
                            {formatPrice(pkg.pricePerPerson || 0)}/orang
                          </p>
                        </>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="mb-5" style={{ height: 1, background: isHL ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)" }} />

                    {/* Feature list */}
                    <ul className="mb-6 space-y-3 flex-1">
                      {pkg.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <span
                            className="material-symbols-outlined mt-0.5 text-base shrink-0"
                            style={{
                              color: isHL ? "rgba(255,255,255,0.8)" : "rgba(0,180,255,0.6)",
                              fontVariationSettings: "'FILL' 1",
                              fontSize: "18px",
                            }}
                          >
                            check_circle
                          </span>
                          <span style={{ color: isHL ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.7)" }}>
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <div className="mt-auto">
                    {isBlocked ? (
                      <div className="text-center">
                        <p className="mb-3 text-xs" style={{ color: "#ff6b6b" }}>
                          Kamu sudah punya {activeEventCount} event aktif. Tutup event lama dulu atau pilih paket berbayar.
                        </p>
                        <button
                          disabled
                          className="w-full rounded-full py-3.5 font-bold cursor-not-allowed text-sm"
                          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}
                        >
                          Tidak Tersedia
                        </button>
                      </div>
                    ) : pkg.id === "enterprise" ? (
                      <button
                        onClick={() => handlePackageSelect(pkg.id as PackageId)}
                        className="w-full rounded-full border py-3.5 font-bold text-sm transition-all hover:bg-white/5 active:scale-95"
                        style={{ borderColor: "rgba(0,180,255,0.4)", color: "#00C8FF" }}
                      >
                        {pkg.cta}
                      </button>
                    ) : isHL ? (
                      <button
                        onClick={() => handlePackageSelect(pkg.id as PackageId)}
                        className="w-full rounded-full py-3.5 font-bold text-sm transition-all hover:brightness-110 active:scale-95 shadow-lg"
                        style={{
                          background: "#fff",
                          color: "#0066FF",
                        }}
                      >
                        {pkg.cta}
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePackageSelect(pkg.id as PackageId)}
                        className="w-full rounded-full py-3.5 font-bold text-sm transition-all hover:brightness-110 active:scale-95 shadow-lg"
                        style={{
                          background: "linear-gradient(135deg, #0066FF 0%, #00C8FF 100%)",
                          color: "#fff",
                        }}
                      >
                        {pkg.cta}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Modal */}
          {showPaymentModal && selectedPackage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={(e) => e.target === e.currentTarget && setShowPaymentModal(false)}>
              <div
                className="relative rounded-2xl p-8"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  maxWidth: "440px",
                  width: "100%",
                }}
              >
                <h3 className="mb-4 text-xl font-bold text-white">
                  Konfirmasi Paket {PACKAGES.find((p) => p.id === selectedPackage)?.name}
                </h3>
                {selectedPackage !== "enterprise" ? (
                  <div
                    className="mb-4 space-y-2 rounded-xl p-4"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "rgba(255,255,255,0.5)" }}>Paket:</span>
                      <span className="font-semibold text-white">{PACKAGES.find((p) => p.id === selectedPackage)?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "rgba(255,255,255,0.5)" }}>Maks. peserta:</span>
                      <span className="font-semibold text-white">{PACKAGES.find((p) => p.id === selectedPackage)?.maxParticipants}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "rgba(255,255,255,0.5)" }}>Harga:</span>
                      <span className="text-lg font-bold text-white">{formatPrice(PACKAGES.find((p) => p.id === selectedPackage)?.price || 0)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 rounded-xl p-4 text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                    Untuk paket Enterprise, kami akan segera menghubungi Anda untuk penawaran khusus.
                  </div>
                )}
                <div
                  className="mb-4 rounded-xl p-3 text-sm"
                  style={{ background: "rgba(0,102,255,0.1)", color: "#00C8FF", border: "1px solid rgba(0,102,255,0.2)" }}
                >
                  💡 Lanjutkan buat event kamu. Setelah event dibuat, kamu akan diarahkan untuk konfirmasi pembayaran via WhatsApp.
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 rounded-full border py-3 font-bold transition-colors hover:bg-white/5"
                    style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)" }}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handlePaymentContinue}
                    className="flex-1 rounded-full py-3 font-bold transition-all hover:brightness-110 active:scale-95"
                    style={{ background: "linear-gradient(135deg, #0066FF 0%, #00C8FF 100%)", color: "#fff" }}
                  >
                    Lanjut Buat Event →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Twinkle animation */}
      <style jsx>{`
        @keyframes twinkle {
          0% { opacity: 0.2; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.5); }
        }
      `}</style>
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
