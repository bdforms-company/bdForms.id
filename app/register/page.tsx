"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import { SignaturePad, type SignaturePadHandle } from "@/components/SignaturePad";
import "../design.css";

type Result = { name: string; qr_token: string };

export default function RegisterPage() {
  const sigRef = useRef<SignaturePadHandle>(null);
  const [eventId, setEventId] = useState<string | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("eventId");
    setEventId(id);
  }, []);

  const handleSubmit = async () => {
    setError(null);
    if (!eventId) {
      setError("Link pendaftaran tidak valid.");
      return;
    }
    if (!name.trim()) {
      setError("Nama wajib diisi.");
      return;
    }
    if (sigRef.current?.isEmpty()) {
      setError("Tanda tangan dulu ya.");
      return;
    }

    setLoading(true);
    try {
      const signature = sigRef.current!.toJPEG(0.3);
      const { data, error } = await supabase
        .from("participants")
        .insert({
          event_id: eventId,
          name: name.trim(),
          email: email.trim() || null,
          signature_url: signature,
        })
        .select("name, qr_token")
        .single();

      if (error) throw error;
      setResult(data as Result);
    } catch (e) {
      console.error("Register error:", e);
      const msg =
        e instanceof Error
          ? e.message
          : e && typeof e === "object" && "message" in e
            ? String((e as Record<string, unknown>).message)
            : "Gagal mendaftar.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setName("");
    setEmail("");
    setError(null);
    sigRef.current?.clear();
  };

  // Link invalid (tidak ada eventId)
  if (eventId === null) {
    return (
      <div className="bd flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="material-symbols-outlined text-6xl" style={{ color: "var(--error)" }}>link_off</span>
        <h1 className="text-2xl font-bold">Link pendaftaran tidak valid</h1>
        <p className="max-w-sm text-sm" style={{ color: "var(--on-surface-variant)" }}>
          Minta link pendaftaran ke penyelenggara acara, atau buat event baru.
        </p>
        <Link href="/create" className="rounded-lg px-6 py-3 font-bold" style={{ background: "var(--green)", color: "var(--on-green)" }}>
          Buat Event
        </Link>
      </div>
    );
  }

  return (
    <div className="bd flex min-h-screen flex-col">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/5 bg-black/60 px-4 backdrop-blur-xl md:px-10">
        <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)" }}>layers</span>
        <span className="text-lg font-bold">bdForms</span>
        <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)" }}>account_circle</span>
      </header>

      <main className="flex flex-grow items-center justify-center px-4 pt-28 pb-16">
        {result ? (
          <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
            <h1 className="mb-2 text-2xl font-bold gradient-text">Pendaftaran Berhasil</h1>
            <p className="mb-6 text-lg">{result.name}</p>
            <div className="mx-auto mb-6 inline-block rounded-xl bg-white p-4">
              <QRCodeCanvas value={result.qr_token} size={232} />
            </div>
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Kode cadangan</p>
            <p className="mb-6 font-mono text-3xl font-bold tracking-widest" style={{ color: "var(--green)" }}>
              {result.qr_token.slice(-6).toUpperCase()}
            </p>
            <p className="mb-6 text-sm" style={{ color: "var(--on-surface-variant)" }}>
              Screenshot layar ini dan tunjukkan ke panitia saat check-in.
            </p>
            <button onClick={resetForm} className="w-full rounded-xl border py-3 font-bold transition-colors hover:bg-white/5" style={{ borderColor: "var(--outline-variant)" }}>
              Daftar peserta lain
            </button>
          </div>
        ) : (
          <div className="glass w-full max-w-md rounded-2xl p-8">
            <h1 className="mb-8 text-center text-2xl font-bold">Registrasi Kehadiran</h1>
            <div className="flex flex-col gap-4">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Lengkap" className="bd-input w-full rounded-lg p-3" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (opsional)" className="bd-input w-full rounded-lg p-3" />
              <div>
                <p className="mb-2 text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Tanda Tangan</p>
                <div className="overflow-hidden rounded-xl border-2 border-dashed" style={{ borderColor: "var(--outline-variant)" }}>
                  <SignaturePad ref={sigRef} />
                </div>
                <button type="button" onClick={() => sigRef.current?.clear()} className="mt-2 text-sm underline" style={{ color: "var(--on-surface-variant)" }}>
                  Hapus tanda tangan
                </button>
              </div>
              {error && <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={loading || eventId === undefined}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-3 font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{ background: "var(--primary-container)", color: "var(--on-primary-container)" }}
              >
                <span className="material-symbols-outlined">qr_code</span>
                {loading ? "Memproses..." : "Daftar & Dapatkan QR Code"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
