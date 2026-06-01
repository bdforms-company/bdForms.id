"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import "../design.css";

export default function CreateEventPage() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [expected, setExpected] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleGenerate = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Nama event wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .insert({
          name: name.trim(),
          event_date: date || null,
          location: location.trim() || null,
          expected_participants: expected ? Number(expected) : null,
        })
        .select("id")
        .single();
      if (error) throw error;
      setEventId(data.id as string);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Gagal membuat event.");
    } finally {
      setLoading(false);
    }
  };

  const regLink = eventId ? `${origin}/register?eventId=${eventId}` : "";
  const scanLink = eventId ? `${origin}/scan?eventId=${eventId}` : "";

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const features = [
    { i: "bolt", t: "Under 3 Second Check-In" },
    { i: "wifi_off", t: "Offline-First Architecture" },
    { i: "shield", t: "Anti-Fraud Protection" },
    { i: "monitoring", t: "Real-Time Analytics" },
  ];

  return (
    <div className="bd min-h-screen px-4 pt-16 pb-24 md:px-10">
      {/* Header */}
      <div className="mb-16 flex flex-col items-center text-center">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ color: "var(--green)" }}>wifi_off</span>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--green)" }}>
             Fast Registration Platform
          </span>
        </Link>
        <h1 className="mb-4 max-w-3xl text-3xl font-bold md:text-5xl">
          Buat Event dalam <span className="gradient-text">30 Detik</span>
        </h1>
        <p className="max-w-2xl text-base" style={{ color: "var(--on-surface-variant)" }}>
          Setup sistem registrasi offline-first dan langsung dapat link pendaftaran peserta & link scanner.
          Tanpa konfigurasi rumit.
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: form */}
        <div className="glass rounded-2xl p-6 md:p-8">
          <h2 className="mb-8 flex items-center gap-3 text-xl font-semibold">
            <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>add_circle</span>
            Detail Event
          </h2>

          <div className="flex flex-col gap-5">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Nama Event</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="cth: Aceh Hackathon 2026" className="bd-input w-full rounded-lg px-4 py-3" />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Tanggal</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bd-input w-full rounded-lg px-4 py-3" style={{ colorScheme: "dark" }} />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Perkiraan Peserta</label>
                <input type="number" value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="500" className="bd-input w-full rounded-lg px-4 py-3" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Lokasi</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="cth: Banda Aceh Convention Hall" className="bd-input w-full rounded-lg px-4 py-3" />
            </div>

            {error && <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold neon-green transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
              style={{ background: "var(--green)", color: "var(--on-green)" }}
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              {loading ? "Membuat..." : "Generate Magic Links"}
            </button>
          </div>
        </div>

        {/* Right: result */}
        <div className="glass flex flex-col rounded-2xl p-6 md:p-8">
          {eventId ? (
            <>
              <div className="mb-8 flex items-start gap-4 rounded-xl border p-4" style={{ borderColor: "rgba(91,255,161,0.3)", background: "var(--surface-high)" }}>
                <span className="material-symbols-outlined" style={{ color: "var(--green)", fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <div>
                  <h4 className="mb-1 font-semibold">Event Berhasil Dibuat</h4>
                  <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Mode offline otomatis aktif. Bagikan link di bawah.</p>
                </div>
              </div>

              <h2 className="mb-2 flex items-center gap-3 text-xl font-semibold">
                <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>link</span>
                Link Akses
              </h2>
              <p className="mb-6 text-sm" style={{ color: "var(--on-surface-variant)" }}>Bagikan ke peserta & panitia.</p>

              {[
                { label: "Pendaftaran Peserta (bagi ke tamu via WA)", link: regLink, key: "reg", dot: "var(--primary)" },
                { label: "Scanner (buat panitia)", link: scanLink, key: "scan", dot: "var(--green)" },
              ].map((l) => (
                <div key={l.key} className="mb-5">
                  <label className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: l.dot }} />
                    {l.label}
                  </label>
                  <div className="flex items-center justify-between gap-3 rounded-xl border p-4" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-low)" }}>
                    <code className="truncate text-sm">{l.link}</code>
                    <button onClick={() => copy(l.link, l.key)} className="shrink-0 rounded-lg p-2 hover:bg-white/10" title="Salin">
                      <span className="material-symbols-outlined text-base" style={{ color: copied === l.key ? "var(--green)" : "var(--on-surface-variant)" }}>
                        {copied === l.key ? "check" : "content_copy"}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="flex flex-grow flex-col items-center justify-center text-center" style={{ color: "var(--on-surface-variant)" }}>
              <span className="material-symbols-outlined mb-4 text-5xl">link</span>
              <p className="text-sm">Isi detail event di sebelah kiri,<br />lalu klik <b>Generate Magic Links</b>.</p>
            </div>
          )}
        </div>
      </div>

      {/* Feature strip */}
      <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.t} className="glass flex items-center gap-4 rounded-xl p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container)" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>{f.i}</span>
            </span>
            <span className="text-sm font-semibold">{f.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
