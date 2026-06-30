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
  const [eventId, setEventId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
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
  const [whatsappGroupUrl, setWhatsappGroupUrl] = useState<string | null>(null);
  const [tosEnabled, setTosEnabled] = useState(false);
  const [tosText, setTosText] = useState("");
  const [tosExpanded, setTosExpanded] = useState(false);
  const [tosChecked, setTosChecked] = useState(false);
  const [emailRequired, setEmailRequired] = useState(false);
  const [eventNotFound, setEventNotFound] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(false);
  const emailSentRef = useRef(false);
  const autoDownloadedRef = useRef(false);

  useEffect(() => {
    setEventId(new URLSearchParams(window.location.search).get("eventId"));
    setMounted(true);
  }, []);

  const isAtCapacity = async (): Promise<boolean> => {
    if (!eventId) return false;
    const { data: ev } = await supabase
      .from("events")
      .select("expected_participants")
      .eq("id", eventId)
      .single();
    const cap = ev?.expected_participants ?? null;
    if (!cap) return false;
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
      .select("name, banner_url, event_date, registration_deadline, custom_fields, field_config, whatsapp_group_url, tos_enabled, tos_text, email_required, status, package_status")
      .eq("id", eventId)
      .single()
      .then(({ data }) => {
        if (!active) return;
        if (!data) { setEventNotFound(true); return; }

        if (data.package_status === "pending_payment") {
          if (data.name) setEventName(data.name);
          if (data.banner_url) setBannerUrl(data.banner_url);
          setPendingPayment(true);
          return;
        }

        if (data.status === "closed") {
          if (data.name) setEventName(data.name);
          if (data.banner_url) setBannerUrl(data.banner_url);
          setRegistrationClosed(true);
          setClosedDeadlineLabel("");
          return;
        }

        if (data.banner_url) setBannerUrl(data.banner_url);
        if (data.name) setEventName(data.name);
        const fields = Array.isArray(data.custom_fields) ? (data.custom_fields as CustomField[]) : [];
        setCustomFields(fields);
        setFieldConfig(parseFieldConfig(data.field_config));
        setWhatsappGroupUrl(data.whatsapp_group_url ?? null);
        setTosEnabled(!!data.tos_enabled);
        setTosText(typeof data.tos_text === "string" ? data.tos_text : "");
        setEmailRequired(!!data.email_required);

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
    return () => { active = false; };
  }, [eventId]);

  useEffect(() => {
    if (!eventId || registrationClosed) return;
    let active = true;
    isAtCapacity().then((f) => { if (active && f) setFull(true); });
    return () => { active = false; };
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
      .then(({ data }) => { if (active && data?.name) setEventName(data.name); });
    return () => { active = false; };
  }, [result, eventId]);

  useEffect(() => {
    if (!result || !email.trim() || emailSentRef.current) return;
    emailSentRef.current = true;

    const sendTicket = async () => {
      let evName = eventName;
      if (!evName && eventId) {
        const { data } = await supabase.from("events").select("name").eq("id", eventId).single();
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
    const timer = setTimeout(() => { downloadTicket(); }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const handleSubmit = async () => {
    setError(null);
    setFieldErrors({});
    setEmailError(null);
    if (!eventId) { setError("Link pendaftaran tidak valid."); return; }
    if (!name.trim()) { setError("Nama wajib diisi."); return; }

    if (emailRequired && !email.trim()) {
      setEmailError("Email wajib diisi untuk acara ini");
      setError("Lengkapi field yang wajib diisi.");
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

    if (sigRef.current?.isEmpty()) { setError("Tanda tangan dulu ya."); return; }

    for (const field of customFields) {
      if (field.required && !customData[field.id]?.trim()) {
        setError(`Field ${field.label} wajib diisi`);
        return;
      }
    }

    if (tosEnabled && !tosChecked) {
      setError("Kamu harus menyetujui ketentuan terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      if (await isAtCapacity()) { setFull(true); return; }

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
    } finally { setLoading(false); }
  };

  if (!mounted) {
    return (
      <div className="bd flex min-h-screen items-center justify-center">
        <p style={{ color: "var(--on-surface-variant)" }}>Memuat...</p>
      </div>
    );
  }

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

  if (eventNotFound) {
    return (
      <div className="bd flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="material-symbols-outlined text-6xl" style={{ color: "var(--error)" }}>event_busy</span>
        <h1 className="text-2xl font-bold">Event tidak ditemukan</h1>
        <p className="max-w-sm text-sm" style={{ color: "var(--on-surface-variant)" }}>
          Link pendaftaran ini tidak valid atau event sudah tidak tersedia.
        </p>
      </div>
    );
  }

  if (pendingPayment) {
    return (
      <div className="bd flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="glass w-full max-w-md rounded-2xl p-8">
          <span className="material-symbols-outlined mb-4 text-7xl" style={{ color: "var(--warning)" }}>schedule</span>
          <h1 className="mb-3 text-2xl font-bold">Pendaftaran Belum Dibuka</h1>
          <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
            Penyelenggara sedang mempersiapkan acara ini. Coba lagi nanti atau hubungi penyelenggara.
          </p>
        </div>
      </div>
    );
  }

  if (registrationClosed) {
    return (
      <div className="bd flex min-h-screen flex-col">
        <main className="flex flex-grow flex-col items-center justify-center px-4 pt-8 pb-16">
          {bannerUrl && (
            <div className="relative mb-6 aspect-video w-full max-w-md overflow-hidden rounded-2xl">
              <Image src={bannerUrl} alt="Banner event" fill className="object-cover" loading="eager" />
            </div>
          )}
          <div className="glass w-full max-w-md rounded-2xl p-8 text-center">
            <span className="material-symbols-outlined mb-4 text-7xl" style={{ color: "var(--error)" }}>event_busy</span>
            <h1 className="mb-3 text-2xl font-bold">Pendaftaran Sudah Tutup</h1>
            <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
              Pendaftaran untuk {eventName || "acara ini"} telah ditutup{closedDeadlineLabel ? ` pada ${closedDeadlineLabel}` : ""}.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (full) {
    return (
      <div className="bd flex min-h-screen flex-col">
        <main className="flex flex-grow flex-col items-center justify-center px-4 pt-8 pb-16">
          {bannerUrl && (
            <div className="relative mb-6 aspect-video w-full max-w-md overflow-hidden rounded-2xl">
              <Image src={bannerUrl} alt="Banner event" fill className="object-cover" loading="eager" />
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

  const tosIsLong = tosText.length >= 200;

  return (
    <div className="bd flex min-h-screen flex-col">
      <main className="flex flex-grow flex-col items-center justify-center px-4 pt-8 pb-16">
        {result ? (
          <div className="glass w-full max-w-md rounded-2xl p-8 text-center" style={{ paddingBottom: whatsappGroupUrl ? 80 : undefined }}>
            <h1 className="mb-6 text-2xl font-bold gradient-text">Pendaftaran Berhasil</h1>
            <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
              <div
                id="ticket-card"
                style={{
                  width: "100%",
                  maxWidth: 320,
                  padding: 32,
                  paddingBottom: 0,
                  borderRadius: 16,
                  backgroundColor: "#FFFFFF",
                  color: "#0A0F1E",
                  margin: "0 auto 24px",
                  textAlign: "center",
                  boxSizing: "border-box",
                  fontFamily: "system-ui, sans-serif",
                  border: "2px solid #0066FF",
                  boxShadow: "0 4px 24px rgba(0,102,255,0.15)",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="bdForms" width={32} height={32} style={{ objectFit: "contain" }} />
                  <span style={{ color: "#0066FF", fontWeight: "bold", fontSize: 16 }}>bdForms</span>
                </div>
                <p style={{ fontSize: 11, color: "#5A6580", textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 16px", textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {eventName || "Event"}
                </p>
                <div style={{ height: 1, backgroundColor: "#E0E8FF", marginBottom: 24 }} />
                <div style={{ display: "inline-block", backgroundColor: "#ffffff", padding: "12px", borderRadius: 12, border: "1px solid #E0E8FF", marginBottom: 20 }}>
                  <QRCodeCanvas value={result.qr_token} size={180} />
                </div>
                <p style={{ fontSize: 20, fontWeight: 700, color: "#0A0F1E", margin: "0 0 20px" }}>{result.name}</p>
                <p style={{ fontSize: 10, color: "#5A6580", letterSpacing: 2, textTransform: "uppercase", margin: "0 0 4px" }}>KODE CADANGAN</p>
                <p style={{ fontSize: 28, fontWeight: 700, fontFamily: "monospace", letterSpacing: 4, color: "#0066FF", margin: "0 0 24px" }}>
                  {result.qr_token.slice(-6).toUpperCase()}
                </p>
                <div style={{ margin: "0 -32px", padding: "16px 32px", backgroundColor: "#F8FAFF" }}>
                  <p style={{ fontSize: 12, color: "#5A6580", margin: "0 0 4px" }}>Tunjukkan QR ini saat check-in</p>
                  <p style={{ fontSize: 11, color: "#0066FF", fontWeight: 600, margin: 0 }}>bdForms</p>
                </div>
              </div>
            </div>
            {email.trim() && emailStatus === "sent" && (
              <p className="mb-4 text-sm" style={{ color: "var(--on-surface-variant)" }}>
                ✉️ Tiket dikirim ke {email.trim()}
              </p>
            )}
            {email.trim() && emailStatus === "failed" && (
              <p className="mb-4 text-sm" style={{ color: "var(--on-surface-variant)" }}>
                ⚠️ Gagal kirim email, silakan download tiket manual
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



          </div>
        ) : (
          <>
            {bannerUrl && (
              <div className="relative mb-6 aspect-video w-full max-w-md overflow-hidden rounded-2xl">
                <Image src={bannerUrl} alt="Banner event" fill className="object-cover" loading="eager" />
              </div>
            )}
            <div className="glass w-full max-w-md rounded-2xl p-8">
              <h1 className="mb-8 text-center text-2xl font-bold">Registrasi Kehadiran</h1>
              <div className="flex flex-col gap-4">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Lengkap" className="bd-input w-full rounded-lg p-3" />

                {/* Email field */}
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                    placeholder={emailRequired ? "Email *" : "Email (opsional)"}
                    required={emailRequired}
                    className="bd-input w-full rounded-lg p-3"
                  />
                  {emailError && (
                    <p className="mt-1 text-xs" style={{ color: "var(--error)" }}>{emailError}</p>
                  )}
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
                            setFieldErrors((prev) => { const next = { ...prev }; delete next[field.key]; return next; });
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
                          setFieldErrors((prev) => { const next = { ...prev }; delete next[q.id]; return next; });
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
                          <option key={opt} value={opt}>{opt}</option>
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

                {/* ToS section */}
                {tosEnabled && tosText && (
                  <div className="rounded-xl border p-4" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-low)" }}>
                    <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Ketentuan Acara</p>
                    <div className="mb-3 text-sm" style={{ color: "var(--on-surface-variant)" }}>
                      {tosIsLong && !tosExpanded ? (
                        <>
                          <span>{tosText.slice(0, 100)}...</span>
                          {" "}
                          <button
                            type="button"
                            onClick={() => setTosExpanded(true)}
                            className="underline"
                            style={{ color: "var(--primary)" }}
                          >
                            Selengkapnya
                          </button>
                        </>
                      ) : (
                        <>
                          <span>{tosText}</span>
                          {tosIsLong && (
                            <>
                              {" "}
                              <button
                                type="button"
                                onClick={() => setTosExpanded(false)}
                                className="underline"
                                style={{ color: "var(--primary)" }}
                              >
                                Sembunyikan
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={tosChecked}
                        onChange={(e) => setTosChecked(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded"
                        style={{ accentColor: "var(--primary)" }}
                      />
                      <span className="text-sm">
                        Saya menyetujui ketentuan di atas dan bersedia data saya digunakan untuk keperluan acara ini
                      </span>
                    </label>
                  </div>
                )}

                {error && <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>}
                <button
                  onClick={handleSubmit}
                  disabled={loading || eventId === undefined || (tosEnabled && !tosChecked)}
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
      {result && whatsappGroupUrl && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--surface)',
          borderTop: '1px solid var(--outline)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
          padding: '12px 16px',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>groups</span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--on-surface)' }}>
              Gabung grup WhatsApp acara
            </span>
          </div>
          <a
            href={whatsappGroupUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'var(--primary)',
              color: 'var(--on-primary)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            Gabung →
          </a>
        </div>
      )}
    </div>
  );
}
