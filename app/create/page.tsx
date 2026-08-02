"use client";

import { useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/lib/supabase";
import type { FieldConfig } from "@/lib/types";
import { getPackageById } from "@/lib/packages";
import "../design.css";

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SITE = "regesit.com";

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

// Custom Field Component
function SortableField({ field, index, updateField, removeField, duplicateField }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="group relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-2 w-full">
        <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 shrink-0">⠿</div>
        <input 
          type="text" 
          value={field.label} 
          onChange={(e) => updateField(field.id, { label: e.target.value })} 
          placeholder="Ketik pertanyaan..."
          className="flex-1 min-w-0 text-base font-medium border-b border-gray-200 pb-1 focus:border-primary focus:outline-none"
        />
        <select 
          value={field.type}
          onChange={(e) => updateField(field.id, { type: e.target.value })}
          className="text-xs font-bold bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 shrink-0"
        >
          {["text", "email", "para", "number", "phone", "link", "dropdown", "radio", "multiselect", "upload"].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
        </select>
        <button onClick={() => duplicateField(field)} className="text-gray-400 hover:text-gray-600 shrink-0"><span className="material-symbols-outlined text-sm">content_copy</span></button>
        <button onClick={() => removeField(field.id)} className="text-red-400 hover:text-red-600 shrink-0"><span className="material-symbols-outlined text-sm">delete</span></button>
      </div>

      <div className="mt-4 flex items-center gap-6">
        <label className="flex items-center gap-2 text-xs font-bold uppercase cursor-pointer">
          Wajib
          <button 
            type="button"
            onClick={() => updateField(field.id, { required: !field.required })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${field.required ? 'bg-primary' : 'bg-gray-300'}`}
          >
            <span className={`pointer-events-none inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${field.required ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </label>
      </div>
      
      {["dropdown", "radio", "multiselect"].includes(field.type) && (
        <div className="mt-4 pt-4 border-t space-y-2">
          {field.options?.map((opt: string, idx: number) => (
             <div key={idx} className="flex gap-2 items-center">
               <span className="text-gray-400">⠿</span>
               <input type="text" value={opt} className="flex-1 p-2 rounded border text-sm" placeholder={`Opsi ${idx + 1}`} onChange={(e) => {
                 const newOpts = [...field.options];
                 newOpts[idx] = e.target.value;
                 updateField(field.id, { options: newOpts });
               }} />
               <button onClick={() => updateField(field.id, { options: field.options.filter((_: any, i: number) => i !== idx) })} className="text-red-400">✕</button>
             </div>
          ))}
          <button onClick={() => updateField(field.id, { options: [...(field.options || []), ""] })} className="text-xs text-primary font-bold">+ Tambah Opsi</button>
        </div>
      )}
    </div>
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
  const [eventStart, setEventStart] = useState<Date | null>(null);
  const [eventEnd, setEventEnd] = useState<Date | null>(null);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [eventType, setEventType] = useState<"qr" | "non-qr">("qr");
  
  // Debug log on change
  useEffect(() => {
    console.log("Event type changed to:", eventType);
  }, [eventType]);
  
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [compressingBanner, setCompressingBanner] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const bannerCompressIdRef = useRef(0);
  
  type CustomField = { id: string; type: "text" | "email" | "wa" | "phone" | "options" | "file"; label: string; required: boolean; options?: string[] };
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [showFieldConfig, setShowFieldConfig] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setCustomFields((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateField = (id: string, updates: any) => {
    setCustomFields(customFields.map(f => f.id === id ? { ...f, ...updates } : f));
  };
  const removeField = (id: string) => setCustomFields(customFields.filter(f => f.id !== id));
  const duplicateField = (field: any) => setCustomFields([...customFields, { ...field, id: crypto.randomUUID() }]);

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
    console.log('=== SUBMIT FIRED ===');
    console.log('form data:', { name, location, eventStart, eventEnd, isOnline: eventType === "non-qr" });
    setError(null);
    
    // Validation
    if (!name.trim()) { setError("Nama event wajib diisi."); return; }
    if (!eventStart) { setError("Tanggal mulai event wajib diisi."); return; }
    
    // QR mode requires location
    if (eventType === "qr" && !location.trim()) {
      setError("Lokasi event wajib diisi untuk QR Code Event.");
      return;
    }
    
    if (eventEnd && new Date(eventEnd) <= new Date(eventStart)) { setError("Tanggal selesai harus setelah tanggal mulai."); return; }
    if (slug && !/^[a-z0-9-]+$/.test(slug)) { setError("Slug tidak valid."); return; }
    
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
      
      const { error: insertError, data: insertData } = await supabase.from("events").insert({
        id: newEventId,
        name: name.trim(),
        event_date: eventStart || null,
        event_end: eventEnd || null,
        location: eventType === "qr" ? location.trim() : null,
        wa_group_url: waGroupUrl.trim() || null,
        is_online: eventType === "non-qr",
        expected_participants: selectedPackage?.maxParticipants ?? null,
        ...(bannerUrl ? { banner_url: bannerUrl } : {}),
        package_type: packageParam,
        package_status: pkgStatus,
        owner_id: session?.user?.id ?? null,
        ...(slug ? { slug } : {}),
        custom_fields: customFields
      }).select();
      
      if (insertError) {
        console.error("Supabase insert error detailed:", JSON.stringify(insertError, null, 2));
        throw insertError;
      }
      
      router.push(`/dashboard/events/${newEventId}`);
    } catch (e) {
      console.error("SUBMIT ERROR:", e);
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
    <div className="bd min-h-screen px-4 py-16 md:px-10" style={{ background: "var(--surface)", color: "var(--on-surface)" }}>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Left Side: Visual/Banner */}
        <div className="flex flex-col gap-6">
          <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1 text-sm" style={{ color: "var(--on-surface-variant)" }}><span className="material-symbols-outlined text-base">arrow_back</span>Dashboard</button>
          <div className="aspect-[4/3] w-full rounded-3xl border border-dashed flex flex-col items-center justify-center p-6 text-center" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-low)" }}>
            {compressingBanner ? (
              <span className="material-symbols-outlined animate-spin text-4xl" style={{ color: "var(--on-surface-variant)" }}>progress_activity</span>
            ) : bannerPreview ? (
              <img src={bannerPreview} alt="Banner" className="h-full w-full object-cover rounded-2xl" />
            ) : (
              <>
                <span className="material-symbols-outlined mb-2 text-4xl" style={{ color: "var(--on-surface-variant)" }}>image</span>
                <p style={{ color: "var(--on-surface-variant)" }}>Pilih banner event</p>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" id="banner-upload" />
            {!bannerPreview && <label htmlFor="banner-upload" className="mt-4 cursor-pointer rounded-full px-6 py-2 text-sm font-bold" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>Upload Banner</label>}
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold">Buat Event</h1>
            <p style={{ color: "var(--on-surface-variant)" }}>Atur detail event kamu dengan cepat dan mudah.</p>
          </div>
        </div>

        {/* Right Side: Main Input */}
        <div className="rounded-3xl p-8 border" style={{ background: "var(--surface-low)", borderColor: "var(--outline-variant)" }}>
          <div className="mb-8 flex gap-4 p-1 rounded-xl" style={{ background: "var(--surface)" }}>
            <button onClick={() => setEventType("qr")} className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${eventType === "qr" ? "shadow-sm" : ""}`} style={{ background: eventType === "qr" ? "var(--primary)" : "transparent", color: eventType === "qr" ? "var(--on-primary)" : "var(--on-surface-variant)" }}>QR Code Event</button>
            <button onClick={() => setEventType("non-qr")} className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${eventType === "non-qr" ? "shadow-sm" : ""}`} style={{ background: eventType === "non-qr" ? "var(--primary)" : "transparent", color: eventType === "non-qr" ? "var(--on-primary)" : "var(--on-surface-variant)" }}>Non-QR (Webinar)</button>
          </div>
          
            <div className="flex flex-col gap-6">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Event" className="w-full rounded-xl px-4 py-4 text-lg font-bold focus:outline-none border border-outline-variant focus:ring-2 focus:ring-primary" style={{ background: "var(--surface)" }} />
              <input type="text" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="Slug (opsional)" className="w-full rounded-xl px-4 py-4 focus:outline-none border border-outline-variant focus:ring-2 focus:ring-primary" style={{ background: "var(--surface)" }} />
              
              <div className="grid grid-cols-2 gap-4">
                <DatePicker 
                    selected={eventStart} 
                    onChange={(date) => setEventStart(date)}
                    showTimeSelect
                    dateFormat="Pp"
                    placeholderText="Mulai"
                    className="w-full rounded-xl px-4 py-3 border border-outline-variant focus:ring-2 focus:ring-primary focus:outline-none"
                    style={{ background: "var(--surface)" }}
                    wrapperClassName="w-full"
                />
                <DatePicker 
                    selected={eventEnd} 
                    onChange={(date) => setEventEnd(date)}
                    showTimeSelect
                    dateFormat="Pp"
                    placeholderText="Selesai"
                    className="w-full rounded-xl px-4 py-3 border border-outline-variant focus:ring-2 focus:ring-primary focus:outline-none"
                    style={{ background: "var(--surface)" }}
                    wrapperClassName="w-full"
                />
              </div>
              
              <input 
                type="text" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
                placeholder={eventType === "qr" ? "Lokasi / Alamat" : "Virtual Link (Zoom, Meet, dll.)"}
                className="w-full rounded-xl px-4 py-4 focus:outline-none border border-outline-variant focus:ring-2 focus:ring-primary" 
                style={{ background: "var(--surface)" }} 
              />
              <input 
                type="text" 
                value={waGroupUrl} 
                onChange={(e) => setWaGroupUrl(e.target.value)} 
                placeholder="Link Grup WhatsApp (opsional)" 
                className="w-full rounded-xl px-4 py-4 focus:outline-none border border-outline-variant focus:ring-2 focus:ring-primary" 
                style={{ background: "var(--surface)" }} 
              />
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface-low text-gray-500 font-bold">── Pertanyaan Tambahan ──</span>
              </div>
            </div>

            {/* Custom Fields Area - Redesigned */}
            <div className="rounded-xl border border-dashed p-6" style={{ background: "var(--surface)", borderColor: "var(--outline-variant)" }}>
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-bold text-lg">Custom Fields</h3>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={customFields} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {customFields.map((f, i) => (
                      <SortableField 
                        key={f.id} 
                        field={f} 
                        index={i} 
                        updateField={updateField} 
                        removeField={removeField} 
                        duplicateField={duplicateField} 
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <button 
                onClick={() => setCustomFields([...customFields, { id: crypto.randomUUID(), type: "text", label: "", required: false }])} 
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-sm font-bold transition-all hover:bg-gray-50" 
                style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)" }}
              >
                <span className="material-symbols-outlined text-sm">add</span> Tambah Field
              </button>
            </div>

            <div className="flex gap-4">
              <button onClick={() => console.log("Previewing...")} className="flex-1 rounded-xl py-4 font-bold border border-primary text-primary hover:bg-primary/5">Preview</button>
              <button onClick={handleCreate} className="flex-[2] rounded-xl py-4 font-bold transition-all hover:opacity-90" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>Buat Event</button>
            </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateEventPage() {
  return <AuthGuard><CreateEventContent /></AuthGuard>;
}
