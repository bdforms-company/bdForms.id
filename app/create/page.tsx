"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/lib/supabase";
import type { FieldConfig } from "@/lib/types";
import { DEFAULT_FIELD_CONFIG, PRESET_FIELDS } from "@/lib/types";
import { getPackageById } from "@/lib/packages";
import "../design.css";

function CreateEventContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageParam = searchParams.get("package") || "starter";
  const statusParam = searchParams.get("status") || "";
  const selectedPackage = getPackageById(packageParam);

  const [name, setName] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [regDeadline, setRegDeadline] = useState("");
  const [location, setLocation] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [compressingBanner, setCompressingBanner] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [fieldConfig, setFieldConfig] = useState<FieldConfig>(DEFAULT_FIELD_CONFIG);
  const [showFieldConfig, setShowFieldConfig] = useState(false);

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("File harus berupa gambar."); e.target.value = ""; return; }
    if (file.size > 10 * 1024 * 1024) { setError("Ukuran file terlalu besar (maks. 10MB)."); e.target.value = ""; return; }
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerPreview(null); setBannerFile(null); setCompressingBanner(true);
    let finalFile = file;
    try { finalFile = await imageCompression(file, { maxSizeMB: 0.3, maxWidthOrHeight: 1600, useWebWorker: true, fileType: "image/jpeg" }); } catch (err) { console.error("Banner compression:", err); }
    setBannerFile(finalFile); setBannerPreview(URL.createObjectURL(finalFile)); setCompressingBanner(false);
  };

  const removeBanner = () => { if (bannerPreview) URL.revokeObjectURL(bannerPreview); setBannerFile(null); setBannerPreview(null); };

  const updatePresetField = (key: Exclude<keyof FieldConfig, "customQuestions">, patch: { enabled?: boolean; required?: boolean }) => {
    setFieldConfig({ ...fieldConfig, [key]: { ...fieldConfig[key], ...patch } });
  };

  const handleCreate = async () => {
    setError(null);
    if (!name.trim()) { setError("Nama event wajib diisi."); return; }
    if (!regDeadline) { setError("Deadline pendaftaran wajib diisi."); return; }
    if (!eventStart) { setError("Tanggal mulai event wajib diisi."); return; }
    if (!location.trim()) { setError("Lokasi wajib diisi."); return; }
    if (eventEnd && new Date(eventEnd) <= new Date(eventStart)) { setError("Tanggal selesai harus setelah tanggal mulai."); return; }
    if (new Date(regDeadline) > new Date(eventStart)) { setError("Deadline pendaftaran tidak boleh setelah tanggal mulai event."); return; }
    setLoading(true);
    try {
      const newEventId = crypto.randomUUID();
      let bannerUrl: string | null = null;
      if (bannerFile) {
        setUploadingBanner(true);
        const ext = bannerFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const filename = `${newEventId}_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("event-banners").upload(filename, bannerFile, { contentType: bannerFile.type });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("event-banners").getPublicUrl(filename);
        bannerUrl = urlData.publicUrl;
        setUploadingBanner(false);
      }
      const { data: { session } } = await supabase.auth.getSession();
      const pkgStatus = statusParam === "pending_payment" ? "pending_payment" : (packageParam === "starter" ? "active" : "pending_payment");
      const { error: insertError } = await supabase.from("events").insert({
        id: newEventId,
        name: name.trim(),
        event_date: eventStart || null,
        event_end: eventEnd || null,
        registration_deadline: regDeadline ? new Date(regDeadline).toISOString() : null,
        location: location.trim() || null,
        expected_participants: selectedPackage?.maxParticipants ?? null,
        ...(bannerUrl ? { banner_url: bannerUrl } : {}),
        field_config: fieldConfig,
        package_type: packageParam,
        package_status: pkgStatus,
        owner_id: session?.user?.id ?? null,
      });
      if (insertError) throw insertError;
      setCreatedEventId(newEventId);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Gagal membuat event.");
    } finally { setLoading(false); setUploadingBanner(false); }
  };

  const packageStatus = statusParam === "pending_payment" ? "pending_payment" : (packageParam === "starter" ? "active" : "pending_payment");

  if (createdEventId) {
    const isPending = packageStatus === "pending_payment";
    return (
      <div className="bd min-h-screen px-4 pt-16 pb-24 md:px-10">
        <div className="mx-auto max-w-lg text-center">
          <span className="material-symbols-outlined mb-6 text-6xl" style={{ color: isPending ? "rgba(255,191,0,0.9)" : "var(--green)", fontVariationSettings: "'FILL' 1" }}>
            {isPending ? "schedule" : "check_circle"}
          </span>
          <h1 className="mb-4 text-2xl font-bold">
            {isPending ? "Event Dibuat! Menunggu Konfirmasi Pembayaran \u23f3" : "Event Berhasil Dibuat! \ud83c\udf89"}
          </h1>
          {isPending && <p className="mb-8 text-base" style={{ color: "var(--on-surface-variant)" }}>Event kamu sudah tersimpan. Tim bdForms akan mengkonfirmasi pembayaran kamu segera. Setelah dikonfirmasi, event akan aktif otomatis.</p>}
          <div className="flex flex-col gap-3">
            {isPending && <a href="https://wa.me/6285349902918" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl py-3 font-bold" style={{ background: "var(--green)", color: "var(--on-green)" }}><span className="material-symbols-outlined text-base">chat</span>Konfirmasi Pembayaran via WA</a>}
            <Link href={`/dashboard/events/${createdEventId}`} className="flex items-center justify-center gap-2 rounded-xl border py-3 font-bold" style={{ borderColor: isPending ? "var(--outline-variant)" : undefined, background: isPending ? undefined : "var(--green)", color: isPending ? undefined : "var(--on-green)" }}>
              {isPending ? "Lihat Event" : "Kelola Event \u2192"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bd min-h-screen px-4 pt-16 pb-24 md:px-10">
      <div className="mb-12 flex flex-col items-center text-center">
        <button onClick={() => router.push("/dashboard")} className="mb-6 flex items-center gap-1 text-sm" style={{ color: "var(--on-surface-variant)" }}><span className="material-symbols-outlined text-base">arrow_back</span>Dashboard</button>
        <h1 className="mb-4 max-w-3xl text-3xl font-bold md:text-5xl">Buat Event dalam <span className="gradient-text">30 Detik</span></h1>
        {selectedPackage && <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Paket: <span className="font-semibold" style={{ color: "var(--green)" }}>{selectedPackage.name}</span>{selectedPackage.maxParticipants && ` · Maks. ${selectedPackage.maxParticipants} peserta`}</p>}
      </div>
      <div className="mx-auto max-w-xl">
        <div className="glass rounded-2xl p-6 md:p-8">
          <h2 className="mb-8 flex items-center gap-3 text-xl font-semibold"><span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>add_circle</span>Detail Event</h2>
          <div className="flex flex-col gap-5">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Nama Event <span style={{ color: "var(--error)" }}>*</span></label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seminar Nasional AI 2025" required className="bd-input w-full rounded-lg px-4 py-3" />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Banner Event (opsional)</label>
              {compressingBanner ? (
                <div className="mx-auto flex aspect-square max-h-[200px] w-full max-w-[200px] flex-col items-center justify-center gap-2 rounded-xl border" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-low)" }}><span className="material-symbols-outlined animate-spin text-3xl" style={{ color: "var(--on-surface-variant)" }}>progress_activity</span><span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Memproses gambar...</span></div>
              ) : bannerPreview ? (
                <div className="relative mx-auto aspect-square max-h-[200px] w-full max-w-[200px] overflow-hidden rounded-xl border" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-low)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bannerPreview} alt="Preview banner" className="h-full w-full object-cover" />
                  <button type="button" onClick={removeBanner} className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border bg-black/60 backdrop-blur-sm" style={{ borderColor: "var(--outline-variant)" }}><span className="material-symbols-outlined text-base">close</span></button>
                </div>
              ) : null}
              <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 transition-colors hover:bg-white/5" style={{ borderColor: "var(--outline-variant)" }}>
                <span className="material-symbols-outlined text-xl" style={{ color: "var(--on-surface-variant)" }}>image</span>
                <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Pilih gambar banner</span>
                <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
              </label>
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Deadline Pendaftaran <span style={{ color: "var(--error)" }}>*</span></label>
              <input type="datetime-local" value={regDeadline} onChange={(e) => setRegDeadline(e.target.value)} required className="bd-input w-full rounded-lg px-4 py-3" style={{ colorScheme: "dark" }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Mulai <span style={{ color: "var(--error)" }}>*</span></label>
                <input type="datetime-local" value={eventStart} onChange={(e) => setEventStart(e.target.value)} required className="bd-input w-full rounded-lg px-4 py-3" style={{ colorScheme: "dark" }} />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Selesai</label>
                <input type="datetime-local" value={eventEnd} onChange={(e) => setEventEnd(e.target.value)} min={eventStart || undefined} className="bd-input w-full rounded-lg px-4 py-3" style={{ colorScheme: "dark" }} />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Lokasi <span style={{ color: "var(--error)" }}>*</span></label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Gedung Convention Hall" required className="bd-input w-full rounded-lg px-4 py-3" />
            </div>
            <div>
              <button type="button" onClick={() => setShowFieldConfig(!showFieldConfig)} className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-colors hover:bg-white/5" style={{ borderColor: "var(--outline-variant)" }}>
                <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base" style={{ color: "var(--primary)" }}>tune</span>Data Peserta (Opsional)</span>
                <span className="material-symbols-outlined text-base" style={{ color: "var(--on-surface-variant)" }}>{showFieldConfig ? "expand_less" : "expand_more"}</span>
              </button>
              {showFieldConfig && (
                <div className="mt-3 overflow-hidden rounded-xl border" style={{ borderColor: "var(--outline-variant)" }}>
                  <p className="px-3 pt-3 pb-2 text-xs" style={{ color: "var(--on-surface-variant)" }}>Nama dan Email selalu aktif. Aktifkan field tambahan sesuai kebutuhan.</p>
                  {PRESET_FIELDS.map((field) => {
                    const cfg = fieldConfig[field.key];
                    return (
                      <div key={field.key} className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderTop: "1px solid var(--outline-variant)", background: "var(--surface-low)" }}>
                        <div className="flex items-center gap-2"><span className="material-symbols-outlined text-lg" style={{ color: "var(--primary)" }}>{field.icon}</span><span className="text-sm font-medium">{field.label}</span></div>
                        <div className="flex items-center gap-5">
                          <div className="flex flex-col items-center gap-1">
                            <button type="button" onClick={() => updatePresetField(field.key, { enabled: !cfg.enabled, required: !cfg.enabled ? cfg.required : false })} className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200" style={{ background: cfg.enabled ? "var(--green)" : "#1e2a2c" }}><span className="pointer-events-none inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-200" style={{ transform: cfg.enabled ? "translate(23px, 3px)" : "translate(3px, 3px)" }} /></button>
                            <span className="text-[9px] uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>Tampilkan</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <button type="button" disabled={!cfg.enabled} onClick={() => updatePresetField(field.key, { required: !cfg.required })} className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: cfg.required ? "var(--green)" : "#1e2a2c" }}><span className="pointer-events-none inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-200" style={{ transform: cfg.required ? "translate(23px, 3px)" : "translate(3px, 3px)" }} /></button>
                            <span className="text-[9px] uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>Wajib</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Custom Questions */}
                  <div style={{ borderTop: "1px solid var(--outline-variant)" }}>
                    <div className="px-4 pt-4 pb-2">
                      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
                        Pertanyaan Custom (maks. {selectedPackage?.id === 'starter' ? 1 : selectedPackage?.id === 'standard' ? 3 : 10})
                      </p>
                    </div>
                    {fieldConfig.customQuestions.map((q, qi) => (
                      <div key={q.id} className="flex items-center gap-3 px-4 py-3" style={{ background: "var(--surface-low)" }}>
                        <input type="text" value={q.label} onChange={(e) => { const updated = [...fieldConfig.customQuestions]; updated[qi] = { ...q, label: e.target.value }; setFieldConfig({ ...fieldConfig, customQuestions: updated }); }} placeholder="Tulis pertanyaan..." className="bd-input flex-1 rounded-lg px-3 py-2 text-sm" />
                        <div className="flex flex-col items-center gap-1">
                          <button type="button" onClick={() => { const updated = [...fieldConfig.customQuestions]; updated[qi] = { ...q, required: !q.required }; setFieldConfig({ ...fieldConfig, customQuestions: updated }); }} className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200" style={{ background: q.required ? "var(--green)" : "#1e2a2c" }}><span className="pointer-events-none inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-200" style={{ transform: q.required ? "translate(23px, 3px)" : "translate(3px, 3px)" }} /></button>
                          <span className="text-[9px] uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>Wajib</span>
                        </div>
                        <button type="button" onClick={() => setFieldConfig({ ...fieldConfig, customQuestions: fieldConfig.customQuestions.filter((_, i) => i !== qi) })} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-white/10"><span className="material-symbols-outlined text-base" style={{ color: "var(--error)" }}>delete</span></button>
                      </div>
                    ))}
                    {fieldConfig.customQuestions.length < (selectedPackage?.id === 'starter' ? 1 : selectedPackage?.id === 'standard' ? 3 : 10) && (
                      <div className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setFieldConfig({ ...fieldConfig, customQuestions: [...fieldConfig.customQuestions, { id: crypto.randomUUID(), label: "", required: false }] })}
                          className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-white/5"
                          style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)" }}
                        >
                          <span className="material-symbols-outlined text-base">add</span>Tambah Pertanyaan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {error && <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>}
            <button onClick={handleCreate} disabled={loading || compressingBanner} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold neon-green transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50" style={{ background: "var(--green)", color: "var(--on-green)" }}>
              <span className="material-symbols-outlined">auto_awesome</span>
              {uploadingBanner ? "Mengunggah banner..." : loading ? "Membuat..." : "Buat Event"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateEventPage() {
  return <AuthGuard><CreateEventContent /></AuthGuard>;
}
