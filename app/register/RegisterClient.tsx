"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import html2canvas from "html2canvas-pro";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import type { CustomField, FieldConfig } from "@/lib/types";
import { DEFAULT_FIELD_CONFIG, PRESET_FIELDS, parseFieldConfig } from "@/lib/types";
import { SignaturePad, type SignaturePadHandle } from "@/components/SignaturePad";
import "../design.css";

type Result = { id: string; name: string; qr_token: string };

export default function RegisterClient() {
  const sigRef = useRef<SignaturePadHandle>(null);
  const [eventId, setEventId] = useState<string | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [eventName, setEventName] = useState("");
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [closedDeadlineLabel, setClosedDeadlineLabel] = useState("");
  const [emailStatus, setEmailStatus] = useState<"sent" | "failed" | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customData, setCustomData] = useState<Record<string, string>>({});
  const [fieldConfig, setFieldConfig] = useState<FieldConfig>(DEFAULT_FIELD_CONFIG);
  const [extraData, setExtraData] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showSignupBanner, setShowSignupBanner] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const emailSentRef = useRef(false);
  const autoDownloadedRef = useRef(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("eventId");
    setEventId(id);
  }, []);

  // cek limit: true kalau kuota sudah penuh
  const isAtCapacity = async (): Promise<boolean> => {
    if (!eventId) return false;
    const { data: ev } = await supabase
      .from("events")
      .select("expected_participants")
      .eq("id", eventId)
      .single();
    const cap = ev?.expected_participants ?? null;
    if (!cap) return false; // kosong = unlimited
    const { count } = await supabase
      .from("participants")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);
    return (count ?? 0) >= cap;
  };

  useEffect(() => {
    if (!eventId) return;
    let active = true;
    supabase
      .from("events")
      .select("name, banner_url, event_date, registration_deadline, custom_fields, field_config")
      .eq("id", eventId)
      .single()
      .then(({ data }) => {
        if (!active || !data) return;
        if (data.banner_url) setBannerUrl(data.banner_url);
        if (data.name) setEventName(data.name);
        const fields = Array.isArray(data.custom_fields) ? (data.custom_fields as CustomField[]) : [];
        setCustomFields(fields);
        setFieldConfig(parseFieldConfig(data.field_config));

        const deadline = data.registration_deadline
          ? new Date(data.registration_deadline)
          : data.event_date
            ? new Date(`${data.event_date}T23:59:59`)
            : null;

        if (deadline && new Date() > deadline) {
          setRegistrationClosed(true);
          setClosedDeadlineLabel(
            deadline.toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" }),
          );
        }
      });
    return () => {
      active = false;
    };
  }, [eventId]);

  // cek kuota saat halaman dibuka (setelah deadline)
  useEffect(() => {
    if (!eventId || registrationClosed) return;
    let active = true;
    isAtCapacity().then((f) => {
      if (active && f) setFull(true);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, registrationClosed]);

  useEffect(() => {
    if (!result || !eventId) return;
    let active = true;
    supabase
      .from("events")
      .select("name")
      .eq("id", eventId)
      .single()
      .then(({ data }) => {
        if (active && data?.name) setEventName(data.name);
      });
    return () => {
      active = false;
    };
  }, [result, eventId]);

  useEffect(() => {
    if (!result || !email.trim() || emailSentRef.current) return;
    emailSentRef.current = true;

    const sendTicket = async () => {
      let evName = eventName;
      if (!evName && eventId) {
        const { data } = await supabase
          .from("events")
          .select("name")
          .eq("id", eventId)
          .single();
        evName = data?.name ?? "Event";
      }

      try {
        const res = await fetch("/api/send-participant-ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            participantName: result.name,
            eventName: evName || "Event",
            qrToken: result.qr_token,
            backupCode: result.qr_token.slice(-6).toUpperCase(),
            bannerUrl: bannerUrl ?? undefined,
          }),
        });
        const data = await res.json();
        setEmailStatus(data.ok ? "sent" : "failed");
      } catch {
        setEmailStatus("failed");
      }
    };

    sendTicket();
  }, [result, email, eventName, eventId, bannerUrl]);

  const downloadTicket = async () => {
    const el = document.getElementById("ticket-card");
    if (!el || !result) return;
    const canvas = await html2canvas(el);
    const dataUrl = canvas.toDataURL("image/png");
    const safeName = result.name.trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "_") || "peserta";
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `Tiket_${safeName}.png`;
    link.click();
  };

  useEffect(() => {
    if (!result || autoDownloadedRef.current) return;
    autoDownloadedRef.current = true;
    const timer = setTimeout(() => {
      downloadTicket();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const handleSubmit = async () => {
    setError(null);
    setFieldErrors({});
    if (!eventId) {
      setError("Link pendaftaran tidak valid.");
      return;
    }
    if (!name.trim()) {
      setError("Nama wajib diisi.");
      return;
    }

    const errors: Record<string, string> = {};
    for (const field of PRESET_FIELDS) {
      const cfg = fieldConfig[field.key];
      if (cfg.enabled && cfg.required && !extraData[field.key]?.trim()) {
        errors[field.key] = `${field.label} wajib diisi.`;
      }
    }
    for (const q of fieldConfig.customQuestions) {
      if (q.required && !extraData[q.id]?.trim()) {
        errors[q.id] = `${q.label || "Pertanyaan"} wajib diisi.`;
      }
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Lengkapi field yang wajib diisi.");
      return;
    }

    if (sigRef.current?.isEmpty()) {
      setError("Tanda tangan dulu ya.");
      return;
    }

    for (const field of customFields) {
      if (field.required && !customData[field.id]?.trim()) {
        setError(`Field ${field.label} wajib diisi`);
        return;
      }
    }

    setLoading(true);
    try {
      // cek ulang kuota sebelum simpan
      if (await isAtCapacity()) {
        setFull(true);
        return;
      }

      const signature = sigRef.current!.toJPEG(0.3);
      const { data, error } = await supabase
        .from("participants")
        .insert({
          event_id: eventId,
          name: name.trim(),
          email: email.trim() || null,
          signature_url: signature,
          custom_data: customData,
          extra_data: extraData,
        })
        .select("id, name, qr_token")
        .single();

      if (error) throw error;

      const participant = data as Result;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from("participants").update({ user_id: session.user.id }).eq("id", participant.id);
        setIsLoggedIn(true);
      }

      setResult(participant);
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

  // ===== Link tidak valid =====
  if (eventId === null) {
    return (
      <div className="bd flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="material-symbols-outlined text-6xl" style={{ color: "var(--error)" }}>link_off</span>
        <h1 className="text-2xl font-bold">Link pendaftaran tidak valid</h1>
        <p className="max-w-sm text-sm" style={{ color: "var(--on-surface-variant)" }}>
          Minta link pendaftaran ke penyelenggara acara, atau buat event baru.
        </p>
        <Link href="/create" className="rounded-lg px-6 py-3 font-bold" style={{ background: "var(--green)", color: "var(--on-green)" }}>Buat Event</Link>
      </div>
    );
  }

  // ===== Pendaftaran tutup (deadline) =====
  if (registrationClosed) {
    return (
      <div className="bd flex min-h-screen flex-col">
        <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/5 bg-black/60 px-4 backdrop-blur-xl md:px-10">
          <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)" }}>layers</span>
          <span className="text-lg font-bold">bdForms</span>
          <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)" }}>account_circle</span>
        </header>
        <main className="flex flex-grow flex-col items-center justify-center px-4 pt-28 pb-16">
          {bannerUrl && (
            <div className="relative mb-6 aspect-video w-full max-w-md overflow-hidden rounded-2xl">
              <Image src={bannerUrl} alt="Banner event" fill className="object-cover" unoptimized loading="eager" />
            </div>
          )}
          <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
            <span className="material-symbols-outlined mb-4 text-7xl" style={{ color: "var(--error)" }}>event_busy</span>
            <h1 className="mb-3 text-2xl font-bold">Pendaftaran Sudah Tutup</h1>
            <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
              Pendaftaran untuk {eventName || "acara ini"} telah ditutup pada {closedDeadlineLabel}
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ===== Kuota penuh =====
  if (full) {
    return (
      <div className="bd flex min-h-screen flex-col">
        <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/5 bg-black/60 px-4 backdrop-blur-xl md:px-10">
          <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)" }}>layers</span>
          <span className="text-lg font-bold">bdForms</span>
          <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)" }}>account_circle</span>
        </header>
        <main className="flex flex-grow flex-col items-center justify-center px-4 pt-28 pb-16">
          {bannerUrl && (
            <div className="relative mb-6 aspect-video w-full max-w-md overflow-hidden rounded-2xl">
              <Image src={bannerUrl} alt="Banner event" fill className="object-cover" unoptimized loading="eager" />
            </div>
          )}
          <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
            <span className="material-symbols-outlined mb-4 text-7xl" style={{ color: "var(--error)" }}>event_busy</span>
            <h1 className="mb-3 text-2xl font-bold">Pendaftaran Penuh</h1>
            <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
              Kuota peserta untuk acara ini sudah penuh. Silakan hubungi penyelenggara acara.
            </p>
          </div>
        </main>
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

      <main className="flex flex-grow flex-col items-center justify-center px-4 pt-28 pb-16">
        {result ? (
          <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
            <h1 className="mb-6 text-2xl font-bold gradient-text">Pendaftaran Berhasil</h1>
            <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
              <div
                id="ticket-card"
                style={{
                  width: "100%",
                  maxWidth: 320,
                  padding: 32,
                  borderRadius: 16,
                  backgroundColor: "#0a0c0c",
                  color: "#e8eaed",
                  margin: "0 auto 24px",
                  textAlign: "center",
                  boxSizing: "border-box",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: "#8a9299", fontWeight: 600 }}>⬡ bdForms</span>
                <span style={{ fontSize: 12, color: "#8a9299", fontWeight: 500, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {eventName || "Event"}
                </span>
              </div>
              <div style={{ height: 1, backgroundColor: "#1e2a2c", marginBottom: 24 }} />
              <div style={{ display: "inline-block", backgroundColor: "#ffffff", padding: "12px", borderRadius: 8, marginBottom: 20 }}>
                <QRCodeCanvas value={result.qr_token} size={180} />
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#e8eaed", margin: "0 0 20px" }}>{result.name}</p>
              <p style={{ fontSize: 10, color: "#8a9299", letterSpacing: 2, textTransform: "uppercase", margin: "0 0 4px" }}>KODE CADANGAN</p>
              <p style={{ fontSize: 28, fontWeight: 700, fontFamily: "monospace", letterSpacing: 4, color: "#5bffa1", margin: "0 0 24px" }}>
                {result.qr_token.slice(-6).toUpperCase()}
              </p>
              <div style={{ height: 1, backgroundColor: "#1e2a2c", marginBottom: 16 }} />
              <p style={{ fontSize: 12, color: "#8a9299", margin: 0 }}>Tunjukkan QR ini saat check-in</p>
              </div>
            </div>
            {email.trim() && emailStatus === "sent" && (
              <p className="mb-4 text-sm" style={{ color: "var(--on-surface-variant)" }}>
                ✉️ Tiket juga dikirim ke {email.trim()}
              </p>
            )}
            {email.trim() && emailStatus === "failed" && (
              <p className="mb-4 text-sm" style={{ color: "var(--on-surface-variant)" }}>
                ⚠️ Tiket gagal dikirim ke email. Silakan download manual di atas.
              </p>
            )}
            <button
              type="button"
              onClick={downloadTicket}
              className="mx-auto mb-6 flex w-full max-w-[320px] items-center justify-center gap-2 rounded-xl border py-3 font-bold transition-colors hover:bg-white/5"
              style={{ borderColor: "var(--outline-variant)" }}
            >
              <span className="material-symbols-outlined">download</span>
              Download Tiket
            </button>
            {!isLoggedIn && showSignupBanner && (
              <div className="rounded-xl border p-4 text-left" style={{ borderColor: "rgba(91,255,161,0.4)" }}>
                <p className="mb-3 text-sm">💡 Buat akun gratis untuk simpan riwayat event yang kamu ikuti</p>
                <div className="flex items-center gap-3">
                  <Link
                    href="/auth/signup"
                    className="rounded-lg border px-4 py-2 text-sm font-medium"
                    style={{ borderColor: "var(--green)", color: "var(--green)" }}
                  >
                    Buat Akun
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowSignupBanner(false)}
                    className="text-sm underline"
                    style={{ color: "var(--on-surface-variant)" }}
                  >
                    Lewati
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {bannerUrl && (
              <div className="relative mb-6 aspect-video w-full max-w-md overflow-hidden rounded-2xl">
                <Image src={bannerUrl} alt="Banner event" fill className="object-cover" unoptimized loading="eager" />
              </div>
            )}
            <div className="glass w-full max-w-md rounded-2xl p-8">
            <h1 className="mb-8 text-center text-2xl font-bold">Registrasi Kehadiran</h1>
            <div className="flex flex-col gap-4">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Lengkap" className="bd-input w-full rounded-lg p-3" />
              <div>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (opsional)" className="bd-input w-full rounded-lg p-3" />
                <p className="mt-1 pl-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                  💌 Isi email biar tiket QR otomatis dikirim ke inbox kamu sebagai cadangan.
                </p>
              </div>
              {PRESET_FIELDS.map((field) => {
                const cfg = fieldConfig[field.key];
                if (!cfg.enabled) return null;
                return (
                  <div key={field.key}>
                    <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
                      {field.label}{cfg.required ? " *" : ""}
                    </label>
                    <input
                      type={field.type}
                      value={extraData[field.key] ?? ""}
                      onChange={(e) => {
                        setExtraData((prev) => ({ ...prev, [field.key]: e.target.value }));
                        if (fieldErrors[field.key]) {
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next[field.key];
                            return next;
                          });
                        }
                      }}
                      placeholder={field.placeholder}
                      required={cfg.required}
                      className="bd-input w-full rounded-lg p-3"
                    />
                    {fieldErrors[field.key] && (
                      <p className="mt-1 text-xs" style={{ color: "var(--error)" }}>{fieldErrors[field.key]}</p>
                    )}
                  </div>
                );
              })}
              {fieldConfig.customQuestions.map((q) => (
                <div key={q.id}>
                  <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
                    {q.label || "Pertanyaan"}{q.required ? " *" : ""}
                  </label>
                  <input
                    type="text"
                    value={extraData[q.id] ?? ""}
                    onChange={(e) => {
                      setExtraData((prev) => ({ ...prev, [q.id]: e.target.value }));
                      if (fieldErrors[q.id]) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next[q.id];
                          return next;
                        });
                      }
                    }}
                    required={q.required}
                    className="bd-input w-full rounded-lg p-3"
                  />
                  {fieldErrors[q.id] && (
                    <p className="mt-1 text-xs" style={{ color: "var(--error)" }}>{fieldErrors[q.id]}</p>
                  )}
                </div>
              ))}
              {customFields.map((field) => (
                <div key={field.id}>
                  <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
                    {field.label || "Field"}
                    {field.required && <span style={{ color: "var(--error)" }}> *</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={customData[field.id] ?? ""}
                      onChange={(e) => setCustomData((prev) => ({ ...prev, [field.id]: e.target.value }))}
                      placeholder={field.placeholder}
                      required={field.required}
                      rows={3}
                      className="bd-input w-full rounded-lg p-3"
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={customData[field.id] ?? ""}
                      onChange={(e) => setCustomData((prev) => ({ ...prev, [field.id]: e.target.value }))}
                      required={field.required}
                      className="bd-input w-full rounded-lg p-3"
                    >
                      <option value="">Pilih...</option>
                      {(field.options ?? []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === "phone" ? "tel" : field.type}
                      value={customData[field.id] ?? ""}
                      onChange={(e) => setCustomData((prev) => ({ ...prev, [field.id]: e.target.value }))}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="bd-input w-full rounded-lg p-3"
                    />
                  )}
                </div>
              ))}
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
          </>
        )}
      </main>
    </div>
  );
}
