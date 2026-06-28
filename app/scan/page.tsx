"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/supabase";
import { useScannerStore } from "@/store/useScannerStore";
import "../design.css";

type UiState = "loading" | "invalid" | "token_invalid" | "not_yet" | "ended" | "ready" | "scanning" | "verified" | "duplicate" | "notfound";

function getScannerWindow(eventDate: string) {
  const windowStart = new Date(`${eventDate}T00:00:00`);
  const windowEnd = new Date(`${eventDate}T00:00:00`);
  windowEnd.setDate(windowEnd.getDate() + 1);
  windowEnd.setHours(23, 59, 59, 999);
  return { windowStart, windowEnd };
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

  const [eventId, setEventId] = useState<string | null | undefined>(undefined);
  const [ui, setUi] = useState<UiState>("loading");
  const [manual, setManual] = useState("");
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [eventName, setEventName] = useState("");
  const [eventDateLabel, setEventDateLabel] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lockRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const idParam = params.get("eventId");

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
      return;
    }

    if (idParam) {
      setEventId(idParam);
      return;
    }

    setEventId(null);
    setUi("invalid");
  }, []);

  useEffect(() => {
    if (eventId === undefined) return;
    if (!eventId) {
      if (ui !== "token_invalid") setUi("invalid");
      return;
    }
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
    return (
      <div className="bd flex min-h-screen flex-col items-center gap-4 px-4 pt-16">
        <h1 className="text-xl font-bold">Arahkan kamera ke QR</h1>
        <div id="qr-reader" className="glass w-full max-w-sm overflow-hidden rounded-2xl" />
        <button onClick={backToReady} className="rounded-lg border px-6 py-2" style={{ borderColor: "var(--outline-variant)" }}>Batal</button>
      </div>
    );
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
