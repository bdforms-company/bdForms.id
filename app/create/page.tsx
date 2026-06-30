"use client";

import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/lib/supabase";
import type { FieldConfig } from "@/lib/types";
import { DEFAULT_FIELD_CONFIG, PRESET_FIELDS } from "@/lib/types";
import { getPackageById } from "@/lib/packages";
import "../design.css";

const SITE = "bdforms.id";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-medium transition-colors hover:bg-white/5"
      style={{ borderColor: "var(--outline-variant)", color: copied ? "var(--green)" : "var(--on-surface-variant)" }}
    >
      <span className="material-symbols-outlined text-sm">{copied ? "check" : "content_copy"}</span>
      {copied ? "Tersalin!" : "Salin"}
    </button>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: checked ? "var(--green)" : "#1e2a2c" }}
    >
      <span
        className="pointer-events-none inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? "translate(23px, 3px)" : "translate(3px, 3px)" }}
      />
    </button>
  );
}

function CreateEventContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageParam = searchParams.get("package") || "starter";
  const statusParam = searchParams.get("status") || "";
  const selectedPackage = getPackageById(packageParam);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [waGroupUrl, setWaGroupUrl] = useState("");
  const [docEnabled, setDocEnabled] = useState(false);
  const [docSlug, setDocSlug] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [tosEnabled, setTosEnabled] = useState(false);
  const [tosText, setTosText] = useState("");
  const [emailRequired, setEmailRequired] = useState(false);
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [regDeadline, setRegDeadline] = useState("");
  const [location, setLocation] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [compressingBanner, setCompressingBanner] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [fieldConfig, setFieldConfig] = useState<FieldConfig>(DEFAULT_FIELD_CONFIG);
  const [showFieldConfig, setShowFieldConfig] = useState(false);

  const bannerCompressIdRef = useRef(0);

  useEffect(() => {
    return () => {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [bannerPreview]);

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("File harus berupa gambar."); e.target.value = ""; return; }
    if (file.size > 10 * 1024 * 1024) { setError("Ukuran file terlalu besar (maks. 10MB)."); e.target.value = ""; return; }
    const compressId = ++bannerCompressIdRef.current;
    setBannerPreview(null);
    setBannerFile(null);
    setCompressingBanner(true);
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.3, maxWidthOrHeight: 1600, useWebWorker: true, fileType: "image/jpeg" });
      if (compressId !== bannerCompressIdRef.current) return;
      setBannerFile(compressed);
      setBannerPreview(URL.createObjectURL(compressed));
    } catch (err) {
      if (compressId !== bannerCompressIdRef.current) return;
      console.error("Banner compression:", err);
      setError("Gagal memproses gambar. Coba gambar lain.");
      e.target.value = "";
    } finally {
      if (compressId === bannerCompressIdRef.current) setCompressingBanner(false);
    }
  };

  const removeBanner = () => {
    bannerCompressIdRef.current++;
    setBannerFile(null);
    setBannerPreview(null);
    setCompressingBanner(false);
  };

  const updatePresetField = (key: Exclude<keyof FieldConfig, "customQuestions">, patch: { enabled?: boolean; required?: boolean }) => {
    setFieldConfig({ ...fieldConfig, [key]: { ...fieldConfig[key], ...patch } });
  };

  const handleSlugBlur = async () => {
    const cleaned = slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setSlug(cleaned);
    if (!cleaned) { setSlugError(null); return; }
    if (!/^[a-z0-9-]+$/.test(cleaned)) {
      setSlugError("Hanya huruf kecil, angka, dan tanda hubung (-) yang diperbolehkan.");
      return;
    }
    setCheckingSlug(true);
    const { data } = await supabase.from("events").select("id").eq("slug", cleaned).single();
    setCheckingSlug(false);
    setSlugError(data ? "URL ini sudah dipakai. Coba yang lain." : null);
  };

  const handleCreate = async () => {
    setError(null);
    if (!name.trim()) { setError("Nama event wajib diisi."); return; }
    if (!regDeadline) { setError("Deadline pendaftaran wajib diisi."); return; }
    if (!eventStart) { setError("Tanggal mulai event wajib diisi."); return; }
    if (!location.trim()) { setError("Lokasi wajib diisi."); return; }
    if (eventEnd && new Date(eventEnd) <= new Date(eventStart)) { setError("Tanggal selesai harus setelah tanggal mulai."); return; }
    if (new Date(regDeadline) > new Date(eventStart)) { setError("Deadline pendaftaran tidak boleh setelah tanggal mulai event."); return; }
    if (slug && !/^[a-z0-9-]+$/.test(slug)) { setError("Slug tidak valid. Gunakan huruf kecil, angka, dan tanda hubung saja."); return; }
    if (waGroupUrl && !waGroupUrl.startsWith("https://chat.whatsapp.com/")) { setError("Link WhatsApp harus diawali dengan https://chat.whatsapp.com/"); return; }
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
        ...(slug ? { slug } : {}),
        ...(waGroupUrl ? { whatsapp_group_url: waGroupUrl } : {}),
        tos_enabled: tosEnabled,
        ...(tosEnabled && tosText ? { tos_text: tosText } : {}),
        ...(docEnabled && docSlug ? { doc_slug: docSlug } : {}),
        ...(docEnabled && docUrl ? { doc_url: docUrl } : {}),
        email_required: emailRequired,
      });
      if (insertError) {
        if (insertError.code === "23505") {
          setSlugError("URL ini sudah dipakai. Coba yang lain.");
          return;
        }
        throw insertError;
      }
      setCreatedEventId(newEventId);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Gagal membuat event.");
    } finally { setLoading(false); setUploadingBanner(false); }
  };

  const packageStatus = statusParam === "pending_payment" ? "pending_payment" : (packageParam === "starter" ? "active" : "pending_payment");

  if (createdEventId) {
    return (
      <div className="bd min-h-screen px-4 pt-16 pb-24 md:px-10">
        <div className="mx-auto max-w-lg text-center">
          <span className="material-symbols-outlined mb-6 text-6xl" style={{ color: "var(--green)", fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
          <h1 className="mb-3 text-2xl font-bold">Event Berhasil Dibuat! 🎉</h1>
          <p className="mb-8 text-base" style={{ color: "var(--on-surface-variant)" }}>Kelola pendaftaran dan scanner dari halaman Manage Event.</p>
          <Link href={`/dashboard/events/${createdEventId}`} className="flex items-center justify-center gap-2 rounded-xl py-3 font-bold" style={{ background: "var(--green)", color: "var(--on-green)" }}>
            Kelola Event →
          </Link>
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
            {/* Nama Event */}
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Nama Event <span style={{ color: "var(--error)" }}>*</span></label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seminar Nasional AI 2025" required className="bd-input w-full rounded-lg px-4 py-3" />
            </div>

            {/* Slug */}
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>URL Pendek Event <span style={{ color: "var(--on-surface-variant)", fontWeight: 400 }}>(opsional)</span></label>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                  setSlugError(null);
                }}
                onBlur={handleSlugBlur}
                placeholder="contoh: warkopai1"
                className="bd-input w-full rounded-lg px-4 py-3"
              />
              <p className="mt-1 pl-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                Buat link clean untuk event kamu. Contoh: warkopai1 → {SITE}/e/warkopai1
              </p>
              {checkingSlug && <p className="mt-1 pl-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>Memeriksa ketersediaan URL...</p>}
              {slugError && <p className="mt-1 pl-1 text-xs" style={{ color: "var(--error)" }}>{slugError}</p>}
              {slug && !slugError && !checkingSlug && (
                <p className="mt-1 pl-1 text-xs" style={{ color: "var(--primary)" }}>
                  Link pendaftaran: {SITE}/e/{slug}
                </p>
              )}
            </div>

            {/* Banner */}
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
              <label className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 transition-colors" style={{ borderColor: "var(--outline-variant)", cursor: compressingBanner ? "default" : "pointer", opacity: compressingBanner ? 0.5 : 1 }}>
                <span className="material-symbols-outlined text-xl" style={{ color: "var(--on-surface-variant)" }}>image</span>
                <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>{compressingBanner ? "Memproses gambar..." : "Pilih gambar banner"}</span>
                <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" disabled={compressingBanner} />
              </label>
              <p className="mt-2 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                💡 Gunakan gambar landscape 1200×630px untuk hasil terbaik. Format: JPG/PNG, maks. 2MB.
              </p>
            </div>

            {/* Deadline */}
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Deadline Pendaftaran <span style={{ color: "var(--error)" }}>*</span></label>
              <input type="datetime-local" value={regDeadline} onChange={(e) => setRegDeadline(e.target.value)} required className="bd-input w-full rounded-lg px-4 py-3" style={{ colorScheme: "dark" }} />
            </div>

            {/* Tanggal mulai & selesai */}
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

            {/* Lokasi */}
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Lokasi <span style={{ color: "var(--error)" }}>*</span></label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Gedung Convention Hall" required className="bd-input w-full rounded-lg px-4 py-3" />
            </div>

            {/* WhatsApp Group */}
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Link Grup WhatsApp <span style={{ color: "var(--on-surface-variant)", fontWeight: 400 }}>(opsional)</span></label>
              <input
                type="url"
                value={waGroupUrl}
                onChange={(e) => setWaGroupUrl(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="bd-input w-full rounded-lg px-4 py-3"
              />
              <p className="mt-1 pl-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                Peserta akan diajak gabung grup WA setelah berhasil daftar
              </p>
            </div>

            {/* Data Peserta */}
            <div>
              <button type="button" onClick={() => setShowFieldConfig(!showFieldConfig)} className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-colors hover:bg-white/5" style={{ borderColor: "var(--outline-variant)" }}>
                <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base" style={{ color: "var(--primary)" }}>tune</span>Data Peserta (Opsional)</span>
                <span className="material-symbols-outlined text-base" style={{ color: "var(--on-surface-variant)" }}>{showFieldConfig ? "expand_less" : "expand_more"}</span>
              </button>
              {showFieldConfig && (
                <div className="mt-3 overflow-hidden rounded-xl border" style={{ borderColor: "var(--outline-variant)" }}>
                  <p className="px-3 pt-3 pb-2 text-xs" style={{ color: "var(--on-surface-variant)" }}>Nama dan Email selalu aktif. Aktifkan field tambahan sesuai kebutuhan.</p>

                  {/* Email required toggle */}
                  <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderTop: "1px solid var(--outline-variant)", background: "var(--surface-low)" }}>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg" style={{ color: "var(--primary)" }}>mail</span>
                      <div>
                        <span className="text-sm font-medium">Email</span>
                        <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Selalu ditampilkan</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Toggle checked={emailRequired} onChange={setEmailRequired} />
                      <span className="text-[9px] uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>Wajib</span>
                    </div>
                  </div>

                  {PRESET_FIELDS.map((field) => {
                    const cfg = fieldConfig[field.key];
                    return (
                      <div key={field.key} className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderTop: "1px solid var(--outline-variant)", background: "var(--surface-low)" }}>
                        <div className="flex items-center gap-2"><span className="material-symbols-outlined text-lg" style={{ color: "var(--primary)" }}>{field.icon}</span><span className="text-sm font-medium">{field.label}</span></div>
                        <div className="flex items-center gap-5">
                          <div className="flex flex-col items-center gap-1">
                            <Toggle checked={cfg.enabled} onChange={(v) => updatePresetField(field.key, { enabled: v, required: v ? cfg.required : false })} />
                            <span className="text-[9px] uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>Tampilkan</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <Toggle checked={cfg.required} onChange={(v) => updatePresetField(field.key, { required: v })} disabled={!cfg.enabled} />
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
                        Pertanyaan Custom (maks. {selectedPackage?.id === "starter" ? 1 : selectedPackage?.id === "standard" ? 3 : 10})
                      </p>
                    </div>
                    {fieldConfig.customQuestions.map((q, qi) => (
                      <div key={q.id} className="flex items-center gap-3 px-4 py-3" style={{ background: "var(--surface-low)" }}>
                        <input type="text" value={q.label} onChange={(e) => { const updated = [...fieldConfig.customQuestions]; updated[qi] = { ...q, label: e.target.value }; setFieldConfig({ ...fieldConfig, customQuestions: updated }); }} placeholder="Tulis pertanyaan..." className="bd-input flex-1 rounded-lg px-3 py-2 text-sm" />
                        <div className="flex flex-col items-center gap-1">
                          <Toggle checked={q.required} onChange={(v) => { const updated = [...fieldConfig.customQuestions]; updated[qi] = { ...q, required: v }; setFieldConfig({ ...fieldConfig, customQuestions: updated }); }} />
                          <span className="text-[9px] uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>Wajib</span>
                        </div>
                        <button type="button" onClick={() => setFieldConfig({ ...fieldConfig, customQuestions: fieldConfig.customQuestions.filter((_, i) => i !== qi) })} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-white/10"><span className="material-symbols-outlined text-base" style={{ color: "var(--error)" }}>delete</span></button>
                      </div>
                    ))}
                    {fieldConfig.customQuestions.length < (selectedPackage?.id === "starter" ? 1 : selectedPackage?.id === "standard" ? 3 : 10) && (
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

            {/* Materi / Dokumen */}
            <div className="rounded-xl border" style={{ borderColor: "var(--outline-variant)" }}>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base" style={{ color: "var(--primary)" }}>description</span>
                  <div>
                    <span className="text-sm font-medium">Materi / Dokumen Pre-Event</span>
                    <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>opsional</p>
                  </div>
                </div>
                <Toggle checked={docEnabled} onChange={setDocEnabled} />
              </div>
              {docEnabled && (
                <div className="flex flex-col gap-3 border-t px-4 pb-4 pt-3" style={{ borderColor: "var(--outline-variant)" }}>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Slug Dokumen</label>
                    <input
                      type="text"
                      value={docSlug}
                      onChange={(e) => setDocSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      placeholder="contoh: aisel"
                      className="bd-input w-full rounded-lg px-4 py-3"
                    />
                    {docSlug && (
                      <p className="mt-1 pl-1 text-xs" style={{ color: "var(--primary)" }}>{SITE}/doc/{docSlug}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>URL Materi</label>
                    <input
                      type="url"
                      value={docUrl}
                      onChange={(e) => setDocUrl(e.target.value)}
                      placeholder="https://medium.com/..."
                      className="bd-input w-full rounded-lg px-4 py-3"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Terms of Service */}
            <div className="rounded-xl border" style={{ borderColor: "var(--outline-variant)" }}>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base" style={{ color: "var(--primary)" }}>gavel</span>
                  <div>
                    <span className="text-sm font-medium">Persetujuan Peserta / ToS</span>
                    <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>opsional</p>
                  </div>
                </div>
                <Toggle checked={tosEnabled} onChange={setTosEnabled} />
              </div>
              {tosEnabled && (
                <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: "var(--outline-variant)" }}>
                  <label className="mb-1 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Teks Persetujuan</label>
                  <textarea
                    value={tosText}
                    onChange={(e) => setTosText(e.target.value)}
                    placeholder="Dengan mendaftar, saya menyetujui bahwa data saya akan digunakan untuk keperluan acara ini..."
                    rows={4}
                    className="bd-input w-full rounded-lg px-4 py-3 text-sm"
                  />
                </div>
              )}
            </div>

            {error && <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>}
            <button onClick={handleCreate} disabled={loading || compressingBanner || checkingSlug || !!slugError} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold neon-green transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50" style={{ background: "var(--green)", color: "var(--on-green)" }}>
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
