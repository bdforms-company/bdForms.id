"use client";

import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { CustomField } from "@/lib/types";
import "../design.css";

const FIELD_TYPES: CustomField["type"][] = [
  "text",
  "email",
  "phone",
  "number",
  "textarea",
  "select",
];

const FIELD_TYPE_LABELS: Record<CustomField["type"], string> = {
  text: "Text",
  email: "Email",
  phone: "Phone",
  number: "Number",
  textarea: "Textarea",
  select: "Select",
};

const MAX_CUSTOM_FIELDS = 10;

export default function CreateEventPage() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [regDeadline, setRegDeadline] = useState("");
  const [expected, setExpected] = useState("");
  const [location, setLocation] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [compressingBanner, setCompressingBanner] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<"success" | "error" | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [optionsFieldId, setOptionsFieldId] = useState<string | null>(null);
  const [optionsInput, setOptionsInput] = useState("");
  const labelInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Ukuran file terlalu besar (maks. 10MB).");
      e.target.value = "";
      return;
    }

    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerPreview(null);
    setBannerFile(null);
    setCompressingBanner(true);

    let finalFile = file;
    try {
      finalFile = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: "image/jpeg",
      });
    } catch (err) {
      console.error("Banner compression failed:", err);
    }

    setBannerFile(finalFile);
    setBannerPreview(URL.createObjectURL(finalFile));
    setCompressingBanner(false);
  };

  const removeBanner = () => {
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerFile(null);
    setBannerPreview(null);
  };

  const updateField = (id: string, patch: Partial<CustomField>) => {
    setCustomFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const addField = (type: CustomField["type"]) => {
    if (customFields.length >= MAX_CUSTOM_FIELDS) return;
    const id = crypto.randomUUID();
    setCustomFields((prev) => [
      ...prev,
      { id, label: "", type, required: false, ...(type === "select" ? { options: [] } : {}) },
    ]);
    setShowAddDropdown(false);
    setTimeout(() => labelInputRefs.current[id]?.focus(), 0);
  };

  const moveField = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= customFields.length) return;
    setCustomFields((prev) => {
      const copy = [...prev];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  };

  const deleteField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
    if (optionsFieldId === id) setOptionsFieldId(null);
  };

  const openOptionsEditor = (field: CustomField) => {
    setOptionsFieldId(field.id);
    setOptionsInput((field.options ?? []).join(", "));
  };

  const saveOptions = () => {
    if (!optionsFieldId) return;
    const options = optionsInput
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    updateField(optionsFieldId, { options });
    setOptionsFieldId(null);
  };

  const handleGenerate = async () => {
    setError(null);
    if (!name.trim()) {
      setError("Nama event wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      const newEventId = crypto.randomUUID();
      let bannerUrl: string | null = null;

      if (bannerFile) {
        setUploadingBanner(true);
        const ext = bannerFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const filename = `${newEventId}_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("event-banners")
          .upload(filename, bannerFile, { contentType: bannerFile.type });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("event-banners").getPublicUrl(filename);
        bannerUrl = urlData.publicUrl;
        setUploadingBanner(false);
      }

      const { data, error } = await supabase
        .from("events")
        .insert({
          id: newEventId,
          name: name.trim(),
          event_date: date || null,
          registration_deadline: regDeadline ? new Date(regDeadline).toISOString() : null,
          location: location.trim() || null,
          expected_participants: expected ? Number(expected) : null,
          ...(bannerUrl ? { banner_url: bannerUrl } : {}),
          custom_fields: customFields,
        })
        .select("id")
        .single();
      if (error) throw error;
      const createdId = data.id as string;
      setEventId(createdId);
      setEmailStatus(null);

      const email = organizerEmail.trim();
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        const base = origin || window.location.origin;
        fetch("/api/send-organizer-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            eventName: name.trim(),
            regLink: `${base}/register?eventId=${createdId}`,
            scanLink: `${base}/scan?eventId=${createdId}`,
            dashLink: `${base}/dashboard?eventId=${createdId}`,
          }),
        })
          .then((res) => res.json())
          .then((result) => setEmailStatus(result.ok ? "success" : "error"))
          .catch(() => setEmailStatus("error"));
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Gagal membuat event.");
    } finally {
      setLoading(false);
      setUploadingBanner(false);
    }
  };

  const regLink = eventId ? `${origin}/register?eventId=${eventId}` : "";
  const scanLink = eventId ? `${origin}/scan?eventId=${eventId}` : "";
  const dashLink = eventId ? `${origin}/dashboard?eventId=${eventId}` : "";

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
            Offline-First Registration Platform
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
              <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Email Kamu (untuk backup link)</label>
              <input
                type="email"
                value={organizerEmail}
                onChange={(e) => setOrganizerEmail(e.target.value)}
                placeholder="panitia@email.com"
                className="bd-input w-full rounded-lg px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Banner Event (opsional)</label>
              {compressingBanner ? (
                <div className="mx-auto flex aspect-square max-h-[200px] w-full max-w-[200px] flex-col items-center justify-center gap-2 rounded-xl border" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-low)" }}>
                  <span className="material-symbols-outlined animate-spin text-3xl" style={{ color: "var(--on-surface-variant)" }}>progress_activity</span>
                  <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Memproses gambar...</span>
                </div>
              ) : bannerPreview ? (
                <div className="relative mx-auto aspect-square max-h-[200px] w-full max-w-[200px] overflow-hidden rounded-xl border" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-low)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bannerPreview} alt="Preview banner" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={removeBanner}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border bg-black/60 backdrop-blur-sm transition-colors hover:bg-black/80"
                    style={{ borderColor: "var(--outline-variant)" }}
                    title="Hapus banner"
                  >
                    <span className="material-symbols-outlined text-base" style={{ color: "var(--on-surface-variant)" }}>close</span>
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 transition-colors hover:bg-white/5" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-low)" }}>
                  <span className="material-symbols-outlined text-3xl" style={{ color: "var(--on-surface-variant)" }}>image</span>
                  <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Pilih gambar banner</span>
                  <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
                </label>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Nama Event</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="cth: Aceh Hackathon 2026" className="bd-input w-full rounded-lg px-4 py-3" />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Deadline Pendaftaran</label>
              <input
                type="datetime-local"
                value={regDeadline}
                onChange={(e) => setRegDeadline(e.target.value)}
                className="bd-input w-full rounded-lg px-4 py-3"
                style={{ colorScheme: "dark" }}
              />
              <p className="mt-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                Setelah tanggal ini, peserta tidak bisa daftar lagi
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Tanggal Event</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bd-input w-full rounded-lg px-4 py-3" style={{ colorScheme: "dark" }} />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Maksimal Peserta</label>
                <input type="number" value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="cth: 100 (kosongkan = unlimited)" className="bd-input w-full rounded-lg px-4 py-3" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Lokasi</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="cth: Banda Aceh Convention Hall" className="bd-input w-full rounded-lg px-4 py-3" />
            </div>

            <div>
              <h3 className="mb-1 text-sm font-semibold">Field Tambahan (Opsional)</h3>
              <p className="mb-4 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                Tambah pertanyaan custom untuk peserta (misal: instansi, no HP, NIP, dll)
              </p>

              {customFields.length > 0 && (
                <div className="mb-4 flex flex-col gap-2">
                  {customFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="rounded-xl border p-3"
                      style={{ borderColor: "var(--outline-variant)", background: "var(--surface-low)" }}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className="material-symbols-outlined mt-2 shrink-0 cursor-grab text-base"
                          style={{ color: "var(--on-surface-variant)" }}
                          title="Drag handle"
                        >
                          drag_indicator
                        </span>
                        <div className="min-w-0 flex-1">
                          <input
                            ref={(el) => {
                              labelInputRefs.current[field.id] = el;
                            }}
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            placeholder="Label field"
                            className="bd-input mb-2 w-full rounded-lg px-3 py-2 text-sm"
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="rounded px-2 py-0.5 text-xs font-medium uppercase"
                              style={{ background: "var(--surface-container)", color: "var(--primary)" }}
                            >
                              {FIELD_TYPE_LABELS[field.type]}
                            </span>
                            <label className="flex cursor-pointer items-center gap-1.5 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                className="accent-[var(--green)]"
                              />
                              Wajib
                            </label>
                            {field.type === "select" && (
                              <button
                                type="button"
                                onClick={() => openOptionsEditor(field)}
                                className="text-xs underline"
                                style={{ color: "var(--primary)" }}
                              >
                                Edit Options
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => moveField(index, -1)}
                            disabled={index === 0}
                            className="rounded p-1 text-sm hover:bg-white/10 disabled:opacity-30"
                            title="Pindah ke atas"
                          >
                            ⬆️
                          </button>
                          <button
                            type="button"
                            onClick={() => moveField(index, 1)}
                            disabled={index === customFields.length - 1}
                            className="rounded p-1 text-sm hover:bg-white/10 disabled:opacity-30"
                            title="Pindah ke bawah"
                          >
                            ⬇️
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteField(field.id)}
                            className="rounded p-1 text-sm hover:bg-white/10"
                            title="Hapus"
                          >
                            ❌
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {customFields.length >= MAX_CUSTOM_FIELDS && (
                <p className="mb-3 text-xs" style={{ color: "var(--error)" }}>
                  Maksimal {MAX_CUSTOM_FIELDS} field tambahan.
                </p>
              )}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAddDropdown((v) => !v)}
                  disabled={customFields.length >= MAX_CUSTOM_FIELDS}
                  className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5 disabled:opacity-40"
                  style={{ borderColor: "var(--outline-variant)" }}
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Tambah Field
                </button>
                {showAddDropdown && (
                  <div
                    className="absolute left-0 z-10 mt-2 min-w-[160px] rounded-xl border py-1 shadow-lg"
                    style={{ borderColor: "var(--outline-variant)", background: "var(--surface-high)" }}
                  >
                    {FIELD_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => addField(type)}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-white/10"
                      >
                        {FIELD_TYPE_LABELS[type]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {optionsFieldId && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                onClick={(e) => e.target === e.currentTarget && setOptionsFieldId(null)}
              >
                <div className="glass w-full max-w-sm rounded-2xl p-5">
                  <h4 className="mb-3 font-semibold">Edit Options</h4>
                  <p className="mb-3 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                    Pisahkan opsi dengan koma (cth: Opsi A, Opsi B, Opsi C)
                  </p>
                  <input
                    value={optionsInput}
                    onChange={(e) => setOptionsInput(e.target.value)}
                    placeholder="Opsi 1, Opsi 2, Opsi 3"
                    className="bd-input mb-4 w-full rounded-lg px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOptionsFieldId(null)}
                      className="flex-1 rounded-lg border py-2 text-sm"
                      style={{ borderColor: "var(--outline-variant)" }}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={saveOptions}
                      className="flex-1 rounded-lg py-2 text-sm font-bold"
                      style={{ background: "var(--green)", color: "var(--on-green)" }}
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold neon-green transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
              style={{ background: "var(--green)", color: "var(--on-green)" }}
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              {uploadingBanner ? "Mengunggah banner..." : loading ? "Membuat..." : "Generate Magic Links"}
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

              {emailStatus === "success" && (
                <p className="mb-4 text-sm" style={{ color: "var(--green)" }}>✉️ Link sudah dikirim ke email kamu</p>
              )}
              {emailStatus === "error" && (
                <p className="mb-4 text-sm" style={{ color: "var(--error)" }}>Gagal kirim email, tapi link sudah tampil di bawah.</p>
              )}

              <h2 className="mb-2 flex items-center gap-3 text-xl font-semibold">
                <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>link</span>
                Link Akses
              </h2>
              <p className="mb-6 text-sm" style={{ color: "var(--on-surface-variant)" }}>Bagikan ke peserta & panitia.</p>

              {[
                { label: "Pendaftaran Peserta (bagi ke tamu via WA)", link: regLink, key: "reg", dot: "var(--primary)" },
                { label: "Scanner (buat panitia)", link: scanLink, key: "scan", dot: "var(--green)" },
                { label: "Dashboard Pemantauan (buat kamu)", link: dashLink, key: "dash", dot: "var(--cyan)" },
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
