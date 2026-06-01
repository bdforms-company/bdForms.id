"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";
import { useScannerStore } from "@/store/useScannerStore";
import "../design.css";

type UiState = "loading" | "invalid" | "ready" | "scanning" | "verified" | "duplicate" | "notfound";

function LiveClock({ dark = false }: { dark?: boolean }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 50);
    return () => clearInterval(id);
  }, []);
  const p2 = (n: number) => String(n).padStart(2, "0");
  const p3 = (n: number) => String(n).padStart(3, "0");
  return (
    <div className="rounded-lg px-4 py-2 font-mono text-xl font-bold" style={{ background: dark ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.08)" }}>
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

  const [eventId, setEventId] = useState<string | null | undefined>(undefined);
  const [ui, setUi] = useState<UiState>("loading");
  const [manual, setManual] = useState("");
  const [fetchErr, setFetchErr] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lockRef = useRef(false);

  // baca eventId dari URL
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("eventId");
    setEventId(id);
  }, []);

  // unduh data event tsb
  useEffect(() => {
    if (eventId === undefined) return;
    if (!eventId) {
      setUi("invalid");
      return;
    }
    let active = true;
    fetchInitialData(eventId)
      .then(() => active && setUi("ready"))
      .catch((e) => {
        console.error(e);
        if (active) {
          setFetchErr("Gagal mengunduh data (offline). Memakai data tersimpan.");
          setUi("ready");
        }
      });
    return () => {
      active = false;
    };
  }, [eventId, fetchInitialData]);

  useEffect(() => {
    if (ui !== "scanning") return;
    lockRef.current = false;
    const qr = new Html5Qrcode("qr-reader");
    scannerRef.current = qr;
    qr.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decoded) => {
        if (lockRef.current) return;
        lockRef.current = true;
        handleToken(decoded);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui]);

  const handleToken = (raw: string) => {
    const token = raw.trim();
    const result = validateScan(token);
    processCheckIn(token);
    if (result === "VERIFIED") setUi("verified");
    else if (result === "DUPLICATE") setUi("duplicate");
    else setUi("notfound");
  };

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

  if (ui === "scanning") {
    return (
      <div className="bd flex min-h-screen flex-col items-center gap-4 px-4 pt-16">
        <h1 className="text-xl font-bold">Arahkan kamera ke QR</h1>
        <div id="qr-reader" className="glass w-full max-w-sm overflow-hidden rounded-2xl" />
        <button onClick={backToReady} className="rounded-lg border px-6 py-2" style={{ borderColor: "var(--outline-variant)" }}>Batal</button>
      </div>
    );
  }

  if (ui === "verified") {
    return (
      <div onClick={backToReady} className="flex min-h-screen cursor-pointer flex-col items-center justify-center gap-4 p-6 text-center text-black" style={{ background: "var(--green-bright)" }}>
        <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        <h1 className="text-4xl font-bold">VERIFIED ✅</h1>
        <h2 className="text-2xl font-bold">{lastScanned?.name}</h2>
        <LiveClock dark />
        {lastScanned?.signature_url && (
          <div className="mt-2 flex h-32 w-full max-w-xs items-center justify-center rounded-xl bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lastScanned.signature_url} alt="Tanda tangan" className="max-h-28" />
          </div>
        )}
        <p className="text-sm opacity-70">(ketuk layar untuk scan berikutnya)</p>
      </div>
    );
  }

  if (ui === "duplicate") {
    const t = lastScanned?.check_in_time ? new Date(lastScanned.check_in_time).toLocaleTimeString("id-ID") + " WIB" : "-";
    return (
      <div onClick={backToReady} className="flex min-h-screen cursor-pointer flex-col items-center justify-center gap-5 p-6 text-center" style={{ background: "var(--error)", color: "var(--on-error)" }}>
        <span className="material-symbols-outlined text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
        <h1 className="text-4xl font-bold">DITOLAK</h1>
        <div className="w-full max-w-xs rounded-xl bg-white/20 p-4">
          <p className="text-lg font-bold">SUDAH CHECK-IN PADA</p>
          <p className="font-mono text-xl">{t}</p>
        </div>
        {lastScanned?.name && <p>{lastScanned.name}</p>}
        <p className="text-sm opacity-70">(ketuk layar untuk scan berikutnya)</p>
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

      {fetchErr && <p className="mx-auto mb-4 max-w-md text-sm" style={{ color: "var(--green)" }}>{fetchErr}</p>}

      {cameraError ? (
        <div className="mx-auto mb-6 w-full max-w-md rounded-lg border p-4 text-sm" style={{ borderColor: "var(--error)", color: "var(--error)" }}>
          IZIN KAMERA DIBLOKIR / kamera tidak tersedia. Gunakan input manual di bawah.
        </div>
      ) : (
        <button onClick={() => setUi("scanning")} className="glass mx-auto flex h-60 w-60 flex-col items-center justify-center gap-4 rounded-3xl transition-transform hover:scale-105 active:scale-95">
          <span className="material-symbols-outlined text-6xl" style={{ color: "var(--primary)" }}>photo_camera</span>
          <span className="text-xl font-bold tracking-widest">TAP TO SCAN</span>
        </button>
      )}

      <div className="mx-auto mt-auto mb-12 w-full max-w-md">
        <div className="flex gap-2">
          <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Manual 6-digit token..." className="bd-input flex-1 rounded-lg p-4 text-center font-mono uppercase" />
          <button onClick={submitManual} className="rounded-lg px-5 font-bold" style={{ background: "var(--primary-container)", color: "var(--on-primary-container)" }}>Cek</button>
        </div>
      </div>
    </div>
  );
}
