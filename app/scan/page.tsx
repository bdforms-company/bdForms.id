"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/supabase";
import { useScannerStore } from "@/store/useScannerStore";
import { Switch } from "@/components/ui/switch"; // Import the Switch component
import "../design.css";

type UiState = "loading" | "invalid" | "token_invalid" | "not_yet" | "ended" | "ready" | "scanning" | "verified" | "duplicate" | "notfound";

function getScannerWindow(eventDate: string) {
  const windowStart = new Date(`${eventDate}T00:00:00`);
  const windowEnd = new Date(`${eventDate}T00:00:00`);
  windowEnd.setDate(windowEnd.getDate() + 1);
  windowEnd.setHours(23, 59, 59, 999);
  return { windowStart, windowEnd };
}

function getInitialEventId(): string | null | undefined {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  if (params.get("token")) return undefined;
  return params.get("eventId");
}

function getInitialUi(): UiState {
  if (typeof window === "undefined") return "loading";
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || params.get("eventId") ? "loading" : "invalid";
}

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 50);
    return () => clearInterval(id);
  }, []);
  const p2 = (n: number) => String(n).padStart(2, "0");
  const p3 = (n: number) => String(n).padStart(3, "0");
  return (
    <div className="inline-block rounded-lg px-4 py-2 font-mono text-2xl font-bold" style={{ background: "rgba(91,255,161,0.1)", color: "var(--green)" }}>
      {p2(now.getHours())}:{p2(now.getMinutes())}:{p2(now.getSeconds())}:{p3(now.getMilliseconds())} WIB
    </div>
  );
}

export default function ScanPage() {
  const {
    participants,
    totalCount,
    cameraError,
    lastScanned,
    fetchInitialData,
    validateScan,
    processCheckIn,
    setCameraError,
    reset,
  } = useScannerStore();

  const [eventId, setEventId] = useState<string | null | undefined>(getInitialEventId);
  const [ui, setUi] = useState<UiState>(getInitialUi);
  const [manual, setManual] = useState("");
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [eventName, setEventName] = useState("");
  const [eventDateLabel, setEventDateLabel] = useState("");
  const [autoScan, setAutoScan] = useState(false); // New state for Auto-scan Mode

  // Load autoScan preference from localStorage
  useEffect(() => {
    const storedAutoScan = localStorage.getItem("bdforms_autoscan");
    if (storedAutoScan !== null) {
      setAutoScan(JSON.parse(storedAutoScan));
    }
  }, []);

  // Persist autoScan preference to localStorage
  useEffect(() => {
    localStorage.setItem("bdforms_autoscan", JSON.stringify(autoScan));
  }, [autoScan]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lockRef = useRef(false);

  const [activeToast, setActiveToast] = useState<{
    message: string;
    type: 'VERIFIED' | 'DUPLICATE' | 'NOTFOUND';
    style: React.CSSProperties;
  } | null>(null);

  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const getRandomPositionStyle = () => {
    const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center'] as const;
    const chosen = positions[Math.floor(Math.random() * positions.length)];
    
    // Generate random value between 15px and 40px
    const getRandomOffset = () => `${Math.floor(Math.random() * 26) + 15}px`;
    
    const baseStyle: any = {
      position: 'fixed',
      zIndex: 99999,
    };
    
    switch (chosen) {
      case 'top-left':
        return { ...baseStyle, top: getRandomOffset(), left: getRandomOffset() };
      case 'top-right':
        return { ...baseStyle, top: getRandomOffset(), right: getRandomOffset() };
      case 'bottom-left':
        return { ...baseStyle, bottom: getRandomOffset(), left: getRandomOffset() };
      case 'bottom-right':
        return { ...baseStyle, bottom: getRandomOffset(), right: getRandomOffset() };
      case 'top-center':
        const centerOffset = Math.floor(Math.random() * 21) - 10; // -10px to +10px
        return {
          ...baseStyle,
          top: getRandomOffset(),
          left: `calc(50% + ${centerOffset}px)`,
          transform: 'translateX(-50%)',
        };
    }
  };

  const getToastStyle = (type: 'VERIFIED' | 'DUPLICATE' | 'NOTFOUND'): React.CSSProperties => {
    let background = '#5A6580';
    if (type === 'VERIFIED') background = '#16A34A';
    else if (type === 'DUPLICATE') background = '#D97706';
    
    return {
      background,
      color: '#FFFFFF',
      padding: '16px 24px',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: 600,
      maxWidth: '280px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    };
  };

  const showAutoScanToast = useCallback((message: string, type: 'VERIFIED' | 'DUPLICATE' | 'NOTFOUND') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    
    const positionStyle = getRandomPositionStyle();
    const baseStyle = getToastStyle(type);
    
    setActiveToast({
      message,
      type,
      style: { ...baseStyle, ...positionStyle } as React.CSSProperties,
    });
    
    toastTimerRef.current = setTimeout(() => {
      setActiveToast(null);
    }, 1200);
  }, []);

  const [verifiedCount, setVerifiedCount] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [notFoundCount, setNotFoundCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const qrReaderDivRef = useRef<HTMLDivElement>(null);


  const handleToken = useCallback((raw: string) => {
    if (lockRef.current) return; // Prevent double scanning during cooldown

    const token = raw.trim();
    const participant = participants[token];
    const result = validateScan(token);
    processCheckIn(token);

    if (autoScan) {
      if (result === "VERIFIED") {
        showAutoScanToast(`Check-in Berhasil — ${participant?.name || "Participant"}`, "VERIFIED");
        setVerifiedCount(prev => prev + 1);
        if (qrReaderDivRef.current) {
          qrReaderDivRef.current.classList.add('flash-green');
          setTimeout(() => {
            qrReaderDivRef.current?.classList.remove('flash-green');
          }, 300);
        }
      } else if (result === "DUPLICATE") {
        showAutoScanToast(`Sudah Check-in — ${participant?.name || "Participant"}`, "DUPLICATE");
        setDuplicateCount(prev => prev + 1);
      } else { // NOTFOUND
        showAutoScanToast("QR Tidak Dikenali", "NOTFOUND");
        setNotFoundCount(prev => prev + 1);
      }

      // Implement cooldown
      lockRef.current = true;
      setCooldown(1); // Start 1-second cooldown
      cooldownTimerRef.current = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 0) {
            clearInterval(cooldownTimerRef.current!);
            lockRef.current = false;
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    } else {
      if (result === "VERIFIED") setUi("verified");
      else if (result === "DUPLICATE") setUi("duplicate");
      else setUi("notfound");
    }
  }, [showAutoScanToast, autoScan, validateScan, processCheckIn, participants]);

  // Cooldown effect cleanup
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      supabase
        .from("events")
        .select("id")
        .eq("scanner_token", token)
        .gt("scanner_token_expires_at", new Date().toISOString())
        .eq("status", "active")
        .single()
        .then(({ data }) => {
          if (data?.id) {
            setEventId(data.id);
          } else {
            setEventId(null);
            setUi("token_invalid");
          }
        });
    }
  }, []);

  useEffect(() => {
    if (eventId === undefined || !eventId) return;
    let active = true;

    const init = async () => {
      const { data: ev } = await supabase
        .from("events")
        .select("name, event_date")
        .eq("id", eventId)
        .single();

      if (!active) return;

      if (ev?.name) setEventName(ev.name);

      if (ev?.event_date) {
        const { windowStart, windowEnd } = getScannerWindow(ev.event_date);
        const now = new Date();
        setEventDateLabel(
          windowStart.toLocaleDateString("id-ID", { dateStyle: "long" }),
        );

        if (now < windowStart) {
          setUi("not_yet");
          return;
        }
        if (now > windowEnd) {
          setUi("ended");
          return;
        }
      }

      try {
        await fetchInitialData(eventId);
        if (active) setUi("ready");
      } catch (e) {
        console.error(e);
        if (active) {
          setFetchErr("Gagal mengunduh data (offline). Memakai data tersimpan.");
          setUi("ready");
        }
      }
    };

    init();
    return () => {
      active = false;
    };
  }, [eventId, fetchInitialData]);

  // Keep handleToken in a ref so scanner useEffect doesn't restart when handleToken changes
  const handleTokenRef = useRef(handleToken);
  useEffect(() => {
    handleTokenRef.current = handleToken;
  }, [handleToken]);

  useEffect(() => {
    if (ui !== "scanning") {
      // Ensure scanner stops if UI state changes from scanning
      const inst = scannerRef.current;
      if (inst) inst.stop().then(() => inst.clear()).catch(() => {});
      scannerRef.current = null;
      return;
    }

    lockRef.current = false;
    const qr = new Html5Qrcode("qr-reader");
    scannerRef.current = qr;

    const qrboxConfig = { width: 300, height: 300 };

    qr.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: qrboxConfig },
      (decoded) => {
        handleTokenRef.current(decoded);
      },
      () => {}
    ).catch((err) => {
      console.error("Kamera gagal start:", err);
      setCameraError(true);
      setUi("ready");
    });
    return () => {
      const inst = scannerRef.current;
      scannerRef.current = null;
      if (inst) inst.stop().then(() => inst.clear()).catch(() => {});
    };
  }, [ui, autoScan]);

  const submitManual = () => {
    const code = manual.trim().toLowerCase();
    if (!code) return;
    const full = Object.keys(participants).find((t) => t.toLowerCase().endsWith(code));
    if (!full) {
      setUi("notfound");
      return;
    }
    handleToken(full);
  };

  const backToReady = () => {
    reset();
    setManual("");
    setVerifiedCount(0);
    setDuplicateCount(0);
    setNotFoundCount(0);
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(() => {});
      scannerRef.current = null;
    }
    setUi("ready");
  };

  const syncedCount = Object.keys(participants).length;

  if (ui === "loading") {
    return (
      <div className="bd flex min-h-screen items-center justify-center">
        <p style={{ color: "var(--on-surface-variant)" }}>Memuat data peserta...</p>
      </div>
    );
  }

  if (ui === "token_invalid") {
    return (
      <div className="bd flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="material-symbols-outlined text-6xl" style={{ color: "var(--error)" }}>link_off</span>
        <h1 className="text-2xl font-bold">Link Scanner Tidak Valid</h1>
        <p className="max-w-sm text-sm" style={{ color: "var(--on-surface-variant)" }}>
          Link ini sudah expired atau tidak valid. Minta link baru dari penyelenggara event.
        </p>
      </div>
    );
  }

  if (ui === "invalid") {
    return (
      <div className="bd flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="material-symbols-outlined text-6xl" style={{ color: "var(--error)" }}>link_off</span>
        <h1 className="text-2xl font-bold">Link scanner tidak valid</h1>
        <p className="max-w-sm text-sm" style={{ color: "var(--on-surface-variant)" }}>Gunakan link scanner dari halaman buat event.</p>
        <Link href="/create" className="rounded-lg px-6 py-3 font-bold" style={{ background: "var(--green)", color: "var(--on-green)" }}>Buat Event</Link>
      </div>
    );
  }

  if (ui === "not_yet") {
    return (
      <div className="bd flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
          <span className="material-symbols-outlined mb-4 text-7xl" style={{ color: "var(--on-surface-variant)" }}>schedule</span>
          <h1 className="mb-3 text-2xl font-bold">Scanner Belum Aktif</h1>
          <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
            Scanner akan aktif mulai {eventDateLabel}
          </p>
        </div>
      </div>
    );
  }

  if (ui === "ended") {
    return (
      <div className="bd flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
          <span className="material-symbols-outlined mb-4 text-7xl" style={{ color: "var(--green)" }}>check_circle</span>
          <h1 className="mb-3 text-2xl font-bold">Event Sudah Selesai</h1>
          <p className="mb-6 text-sm" style={{ color: "var(--on-surface-variant)" }}>
            Scanner untuk {eventName || "acara ini"} sudah ditutup. Cek dashboard untuk lihat data peserta.
          </p>
          <Link
            href={`/dashboard?eventId=${eventId}`}
            className="inline-block rounded-lg px-6 py-3 font-bold"
            style={{ background: "var(--green)", color: "var(--on-green)" }}
          >
            Buka Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (ui === "scanning") {
    if (autoScan) {
      return (
        <div className="bd flex min-h-screen flex-col items-center gap-4 px-4 pt-10 relative">
          <h1 className="text-xl font-bold">Arahkan kamera ke QR (Auto-Scan)</h1>
          <div
            id="qr-reader"
            ref={qrReaderDivRef}
            className="w-full max-w-lg overflow-hidden rounded-2xl border-8 border-transparent relative"
            style={{ animation: (cooldown > 0 && ui === "scanning") ? `flash-cooldown ${cooldown * 1000}ms linear forwards` : 'none' }}
          >
            {cooldown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-4xl font-bold z-10" style={{ backdropFilter: 'blur(2px)', background: 'rgba(0,0,0,0.3)' }}>
                {Math.ceil(cooldown)}
              </div>
            )}
          </div>
          <button onClick={backToReady} className="rounded-lg border px-6 py-2" style={{ borderColor: "var(--outline-variant)" }}>✕ Keluar Auto-Scan</button>

          {/* Active Toast Notification */}
          {activeToast && (
            <div
              className="animate-toast"
              style={{ ...activeToast.style, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1", flexShrink: 0 }}
              >
                {activeToast.type === 'VERIFIED' ? 'check_circle' : activeToast.type === 'DUPLICATE' ? 'error' : 'help'}
              </span>
              {activeToast.message}
            </div>
          )}

          <style jsx>{`
            .flash-green {
              animation: green-border-flash 0.3s ease-out forwards;
            }
            @keyframes green-border-flash {
              0% { border-color: transparent; }
              50% { border-color: rgba(91,255,161,0.7); }
              100% { border-color: transparent; }
            }
            @keyframes flash-cooldown {
              0% { border-color: transparent; }
              50% { border-color: rgba(255,255,255,0.7); }
              100% { border-color: transparent; }
            }
            @keyframes toast-fade-in-out {
              0% { opacity: 0; }
              16.6% { opacity: 1; }
              83.3% { opacity: 1; }
              100% { opacity: 0; }
            }
            .animate-toast {
              animation: toast-fade-in-out 1.2s ease-in-out forwards;
            }
          `}</style>
        </div>
      );
    } else {
      return (
        <div className="bd flex min-h-screen flex-col items-center gap-4 px-4 pt-10">
          <h1 className="text-xl font-bold">Arahkan kamera ke QR</h1>
          <div id="qr-reader" className="glass w-full max-w-lg overflow-hidden rounded-2xl" />
          <button onClick={backToReady} className="rounded-lg border px-6 py-2" style={{ borderColor: "var(--outline-variant)" }}>Batal</button>
        </div>
      );
    }
  }

  // ===== VERIFIED (dark + neon hijau) =====
  if (ui === "verified") {
    return (
      <div onClick={backToReady} className="bd flex min-h-screen cursor-pointer flex-col items-center justify-center p-6 text-center">
        <div className="glass neon-green w-full max-w-sm rounded-3xl p-8" style={{ borderColor: "rgba(91,255,161,0.4)" }}>
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full" style={{ background: "rgba(91,255,161,0.12)" }}>
            <span className="material-symbols-outlined text-6xl" style={{ color: "var(--green)", fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: "var(--green)" }}>Verified</p>
          <h1 className="mb-5 text-3xl font-bold">{lastScanned?.name}</h1>
          <LiveClock />
          {lastScanned?.signature_url && (
            <div className="mt-6 flex h-28 items-center justify-center rounded-xl bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lastScanned.signature_url} alt="Tanda tangan" className="max-h-24" />
            </div>
          )}
        </div>
        <p className="mt-6 text-sm" style={{ color: "var(--on-surface-variant)" }}>Ketuk layar untuk scan berikutnya</p>
      </div>
    );
  }

  // ===== DITOLAK (dark + neon merah) =====
  if (ui === "duplicate") {
    const t = lastScanned?.check_in_time ? new Date(lastScanned.check_in_time).toLocaleTimeString("id-ID") + " WIB" : "-";
    return (
      <div onClick={backToReady} className="bd flex min-h-screen cursor-pointer flex-col items-center justify-center p-6 text-center">
        <div className="glass w-full max-w-sm rounded-3xl p-8" style={{ borderColor: "rgba(255,180,171,0.4)", boxShadow: "0 0 22px rgba(255,180,171,0.25)" }}>
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full" style={{ background: "rgba(255,180,171,0.12)" }}>
            <span className="material-symbols-outlined text-6xl" style={{ color: "var(--error)", fontVariationSettings: "'FILL' 1" }}>cancel</span>
          </div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: "var(--error)" }}>Ditolak</p>
          <h1 className="mb-5 text-2xl font-bold">Sudah Check-in</h1>
          <div className="rounded-xl p-4" style={{ background: "rgba(255,180,171,0.1)" }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Waktu check-in</p>
            <p className="font-mono text-xl font-bold" style={{ color: "var(--error)" }}>{t}</p>
          </div>
          {lastScanned?.name && <p className="mt-4" style={{ color: "var(--on-surface-variant)" }}>{lastScanned.name}</p>}
        </div>
        <p className="mt-6 text-sm" style={{ color: "var(--on-surface-variant)" }}>Ketuk layar untuk scan berikutnya</p>
      </div>
    );
  }

  if (ui === "notfound") {
    return (
      <div onClick={backToReady} className="bd flex min-h-screen cursor-pointer flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="material-symbols-outlined text-6xl" style={{ color: "var(--on-surface-variant)" }}>help</span>
        <h1 className="text-2xl font-bold">QR tidak dikenali</h1>
        <p className="text-sm opacity-70">(ketuk layar untuk coba lagi)</p>
      </div>
    );
  }

  // ready
  return (
    <div className="bd flex min-h-screen flex-col px-4 pt-6">
      <div className="mx-auto mb-8 w-full max-w-md rounded-lg py-3 text-center text-sm font-medium" style={{ background: "var(--surface-container)" }}>
        🟢 Offline Ready ({syncedCount}/{totalCount || syncedCount} Data Synced)
      </div>

      {/* Auto-scan Mode Toggle */}
      <div className="mx-auto mb-8 w-full max-w-md flex items-center justify-between">
        <div>
          <label htmlFor="autoScanToggle" className="block text-sm font-medium text-white">Mode Auto-Scan</label>
          <p className="text-xs text-gray-400">Scan otomatis tanpa konfirmasi manual. Cocok untuk check-in massal.</p>
        </div>
        <Switch
          id="autoScanToggle"
          checked={autoScan}
          onCheckedChange={setAutoScan}
        />
      </div>

      {fetchErr && <p className="mx-auto mb-4 max-w-md text-sm" style={{ color: "var(--green)" }}>{fetchErr}</p>}

      {cameraError ? (
        <div className="mx-auto mb-6 w-full max-w-md rounded-lg border p-4 text-sm" style={{ borderColor: "var(--error)", color: "var(--error)" }}>
          IZIN KAMERA DIBLOKIR / kamera tidak tersedia. Gunakan input manual di bawah.
        </div>
      ) : (
        <button onClick={() => setUi("scanning")} className="glass mx-auto flex h-80 w-80 flex-col items-center justify-center gap-5 rounded-3xl transition-transform hover:scale-105 active:scale-95">
          <span className="material-symbols-outlined text-8xl" style={{ color: "var(--primary)" }}>photo_camera</span>
          <span className="text-2xl font-bold tracking-widest">TAP TO SCAN</span>
        </button>
      )}

      {!autoScan && ( // Only show manual input in normal mode
        <div className="mx-auto mt-auto mb-12 w-full max-w-md">
          <div className="flex gap-2">
            <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Manual 6-digit token..." className="bd-input flex-1 rounded-lg p-4 text-center font-mono uppercase" />
            <button onClick={submitManual} className="rounded-lg px-5 font-bold" style={{ background: "var(--primary-container)", color: "var(--on-primary-container)" }}>Cek</button>
          </div>
        </div>
      )}
    </div>
  );
}
