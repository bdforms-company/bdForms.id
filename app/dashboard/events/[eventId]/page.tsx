"use client";

import { useCallback, useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { CustomField, FieldConfig } from "@/lib/types";
import { DEFAULT_FIELD_CONFIG, PRESET_FIELDS, parseFieldConfig } from "@/lib/types";
import "../../../design.css";

type Participant = {
  id: string;
  name: string;
  email: string | null;
  is_checked_in: boolean;
  check_in_time: string | null;
  custom_data: Record<string, string> | null;
  extra_data: Record<string, string> | null;
};

type Ev = {
  name: string;
  status: "active" | "closed";
  owner_id: string | null;
  expected_participants: number | null;
  custom_fields: CustomField[] | null;
  field_config: FieldConfig;
  scanner_token: string | null;
  scanner_token_expires_at: string | null;
  package_type?: string;
  package_status?: string;
  event_date?: string | null;
  event_end?: string | null;
  slug?: string | null;
  doc_slug?: string | null;
  doc_url?: string | null;
};

type Tab = "pendaftar" | "monitoring" | "scanner";

function buildExtraChips(extraData: Record<string, string> | null, fieldConfig: FieldConfig) {
  const data = extraData ?? {};
  const chips: { id: string; label: string; value: string }[] = [];
  for (const field of PRESET_FIELDS) {
    const val = data[field.key]?.trim();
    if (val) chips.push({ id: field.key, label: field.label, value: val });
  }
  for (const q of fieldConfig.customQuestions) {
    const val = data[q.id]?.trim();
    if (val) chips.push({ id: q.id, label: q.label || "Pertanyaan", value: val });
  }
  return chips;
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nowDatetimeLocal() {
  return toDatetimeLocal(new Date().toISOString());
}


function isTokenValid(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt) > new Date();
}

function ManageEventInner() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;

  const [ev, setEv] = useState<Ev | null>(null);
  const [list, setList] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [tab, setTab] = useState<Tab>("pendaftar");
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("https://www.bdforms.id");

  const [editingSlug, setEditingSlug] = useState(false);
  const [slugInput, setSlugInput] = useState("");
  const [savingSlug, setSavingSlug] = useState(false);
  const [slugSaveError, setSlugSaveError] = useState<string | null>(null);
  const [copiedDoc, setCopiedDoc] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editExpected, setEditExpected] = useState("");
  const [editRegDeadline, setEditRegDeadline] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editEventEnd, setEditEventEnd] = useState("");
  const [editBannerUrl, setEditBannerUrl] = useState<string | null>(null);
  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
  const [editBannerPreview, setEditBannerPreview] = useState<string | null>(null);
  const [compressingBanner, setCompressingBanner] = useState(false);
  const [editQuotaLocked, setEditQuotaLocked] = useState(false);
  const [editDateFieldsLocked, setEditDateFieldsLocked] = useState(false);
  const [editPackageType, setEditPackageType] = useState("");
  const [editFieldConfig, setEditFieldConfig] = useState<FieldConfig>(DEFAULT_FIELD_CONFIG);

  useEffect(() => {
    window.setTimeout(() => setOrigin(window.location.origin), 0);
  }, []);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();

    const { data: evData, error: evError } = await supabase
      .from("events")
      .select("name, status, owner_id, expected_participants, custom_fields, field_config, scanner_token, scanner_token_expires_at, package_type, package_status, event_date, event_end, slug, doc_slug, doc_url")
      .eq("id", eventId)
      .single();

    if (evError || !evData) {
      setLoading(false);
      setAccessDenied(true);
      return;
    }

    if (evData.owner_id) {
      if (!session) {
        router.push("/auth/login");
        setLoading(false);
        return;
      }
      if (session.user.id !== evData.owner_id) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
    }

    const fields = Array.isArray(evData.custom_fields) ? (evData.custom_fields as CustomField[]) : [];
    setEv({
      ...evData,
      status: (evData.status ?? "active") as "active" | "closed",
      custom_fields: fields,
      field_config: parseFieldConfig(evData.field_config),
      slug: evData.slug ?? null,
      doc_slug: evData.doc_slug ?? null,
      doc_url: evData.doc_url ?? null,
    } as Ev);

    const { data: pData } = await supabase
      .from("participants")
      .select("id, name, email, is_checked_in, check_in_time, custom_data, extra_data")
      .eq("event_id", eventId)
      .order("check_in_time", { ascending: false, nullsFirst: false });

    setList((pData ?? []) as Participant[]);
    setUpdated(new Date());
    setLoading(false);
  }, [eventId, router]);

  useEffect(() => {
    window.setTimeout(() => { void load(); }, 0);
  }, [load]);

  useEffect(() => {
    if (ev?.status !== "active" || tab !== "monitoring") return;
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [ev?.status, tab, load]);

  const handleCloseEvent = async () => {
    setClosing(true);
    const { error } = await supabase.from("events").update({ status: "closed" }).eq("id", eventId);
    setClosing(false);
    setCloseModalOpen(false);
    if (!error) await load();
  };

  const generateScannerToken = async () => {
    setGeneratingToken(true);
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("events")
      .update({ scanner_token: token, scanner_token_expires_at: expiresAt })
      .eq("id", eventId);
    setGeneratingToken(false);
    if (!error) await load();
  };

  const copyScannerLink = (link: string) => {
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const saveSlug = async () => {
    const trimmed = slugInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!trimmed) { setSlugSaveError("Slug tidak boleh kosong."); return; }
    if (!/^[a-z0-9-]+$/.test(trimmed)) { setSlugSaveError("Hanya huruf kecil, angka, dan tanda hubung (-)."); return; }
    setSavingSlug(true);
    setSlugSaveError(null);
    const { data: existing } = await supabase.from("events").select("id").eq("slug", trimmed).single();
    if (existing) {
      setSavingSlug(false);
      setSlugSaveError("Slug sudah digunakan, coba yang lain.");
      return;
    }
    const { error } = await supabase.from("events").update({ slug: trimmed }).eq("id", eventId);
    setSavingSlug(false);
    if (error) {
      setSlugSaveError(error.message.includes("unique") ? "Slug sudah digunakan, coba yang lain." : error.message);
      return;
    }
    setEditingSlug(false);
    setSlugInput("");
    await load();
  };

  const closeEditModal = () => {
    if (editBannerPreview) URL.revokeObjectURL(editBannerPreview);
    setEditOpen(false);
    setEditError(null);
    setEditBannerFile(null);
    setEditBannerPreview(null);
  };

  const openEditModal = async () => {
    setEditOpen(true);
    setEditError(null);
    setEditLoading(true);
    setEditBannerFile(null);
    setEditBannerPreview(null);

    const { data, error } = await supabase
      .from("events")
      .select("name, expected_participants, registration_deadline, event_date, event_end, banner_url, package_type, field_config")
      .eq("id", eventId)
      .single();

    if (error || !data) {
      setEditError("Gagal memuat data event.");
      setEditLoading(false);
      return;
    }

    const now = new Date();
    const eventStartStr = data.event_date ? toDatetimeLocal(data.event_date) : "";
    const eventEndStr = data.event_end ? toDatetimeLocal(data.event_end) : "";
    const eventDateStr = data.event_date ? String(data.event_date).split("T")[0] : "";
    const regDl = data.registration_deadline
      ? new Date(data.registration_deadline)
      : eventDateStr
        ? new Date(`${eventDateStr}T23:59:59`)
        : null;
    const evEnd = eventDateStr ? new Date(`${eventDateStr}T23:59:59`) : null;

    setEditName(data.name ?? "");
    setEditExpected(data.expected_participants != null ? String(data.expected_participants) : "");
    setEditRegDeadline(data.registration_deadline ? toDatetimeLocal(data.registration_deadline) : "");
    setEditEventDate(eventStartStr);
    setEditEventEnd(eventEndStr);
    setEditBannerUrl(data.banner_url ?? null);
    setEditPackageType(data.package_type ?? "");
    setEditFieldConfig(parseFieldConfig(data.field_config));
    setEditQuotaLocked(regDl ? now > regDl : false);
    setEditDateFieldsLocked(evEnd ? now > evEnd : false);
    setEditLoading(false);
  };

  const handleEditBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setEditError("File harus berupa gambar.");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setEditError("Ukuran file terlalu besar (maks. 10MB).");
      e.target.value = "";
      return;
    }

    if (editBannerPreview) URL.revokeObjectURL(editBannerPreview);
    setEditBannerPreview(null);
    setEditBannerFile(null);
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

    setEditBannerFile(finalFile);
    setEditBannerPreview(URL.createObjectURL(finalFile));
    setCompressingBanner(false);
  };

  const handleEditSave = async () => {
    setEditError(null);
    if (!editName.trim()) {
      setEditError("Nama event wajib diisi.");
      return;
    }
    if (!editQuotaLocked && editExpected) {
      const cap = Number(editExpected);
      if (cap < list.length) {
        setEditError(`Kuota minimal ${list.length} (jumlah peserta saat ini).`);
        return;
      }
      const pkgLimits: Record<string, number> = { starter: 30, standard: 120, pro: 500 };
      const pkgLimit = editPackageType && pkgLimits[editPackageType] != null ? pkgLimits[editPackageType] : null;
      if (pkgLimit && cap > pkgLimit) {
        setEditError("Maks. peserta untuk paket " + editPackageType.charAt(0).toUpperCase() + editPackageType.slice(1) + " adalah " + pkgLimit + " orang");
        return;
      }
    }
    if (!editDateFieldsLocked && editRegDeadline && new Date(editRegDeadline) < new Date()) {
      setEditError("Deadline pendaftaran tidak boleh di masa lalu.");
      return;
    }
    if (!editDateFieldsLocked && editEventDate && editRegDeadline && new Date(editEventDate) < new Date(editRegDeadline)) {
      setEditError("Tanggal mulai event tidak boleh sebelum deadline pendaftaran.");
      return;
    }
    if (!editDateFieldsLocked && editEventDate && editEventEnd && new Date(editEventEnd) <= new Date(editEventDate)) {
      setEditError("Tanggal selesai harus setelah tanggal mulai.");
      return;
    }

    setEditSaving(true);
    try {
      let bannerUrl = editBannerUrl;
      if (editBannerFile) {
        const ext = editBannerFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const filename = `${eventId}_${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("event-banners")
          .upload(filename, editBannerFile, { contentType: editBannerFile.type });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("event-banners").getPublicUrl(filename);
        bannerUrl = urlData.publicUrl;
      }

      const updates: Record<string, unknown> = { name: editName.trim(), banner_url: bannerUrl };
      if (!editQuotaLocked) updates.expected_participants = editExpected ? Number(editExpected) : null;
      if (!editDateFieldsLocked) {
        updates.registration_deadline = editRegDeadline ? new Date(editRegDeadline).toISOString() : null;
        updates.event_date = editEventDate ? new Date(editEventDate).toISOString() : null;
        updates.event_end = editEventEnd ? new Date(editEventEnd).toISOString() : null;
      }
      if (list.length === 0) updates.field_config = editFieldConfig;

      const { error } = await supabase.from("events").update(updates).eq("id", eventId);
      if (error) throw error;
      closeEditModal();
      await load();
    } catch (e) {
      console.error(e);
      setEditError(e instanceof Error ? e.message : "Gagal menyimpan perubahan.");
    } finally {
      setEditSaving(false);
    }
  };

    const buildExportColumns = (participants: Participant[], fieldConfig: FieldConfig) => {
        const columns: { header: string; accessor: (p: Participant, index?: number) => string; }[] = [
            { header: "No", accessor: (_, index) => (index !== undefined ? index + 1 : "").toString() },
            { header: "Nama Lengkap", accessor: (p) => p.name ?? "" },
            { header: "Email", accessor: (p) => p.email ?? "" },
        ];

        const presetFieldLabels: { [key: string]: string } = {
            phone: "No. HP",
            institution: "Instansi / Lembaga / Komunitas / Startup",
            position: "Jabatan / Posisi",
            idNumber: "NIP / NIM / ID",
        };

        // Add enabled preset fields in order
        PRESET_FIELDS.forEach(field => {
            if (fieldConfig[field.key]?.enabled) {
                columns.push({
                    header: presetFieldLabels[field.key] || field.label,
                    accessor: (p) => {
                        const extraData = p.extra_data ?? {};
                        return extraData[field.key] ?? "";
                    }
                });
            }
        });

        // Add custom questions
        fieldConfig.customQuestions.forEach(q => {
            columns.push({
                header: q.label,
                accessor: (p) => {
                    const customData = p.custom_data ?? {};
                    return customData[q.id] ?? "";
                }
            });
        });

        columns.push(
            { header: "Status Kehadiran", accessor: (p) => p.is_checked_in ? "Hadir" : "Belum Hadir" },
            { header: "Waktu Check-in", accessor: (p) => p.check_in_time ? new Date(p.check_in_time).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB' : "-" }
        );
        // QR Code is not part of CSV export anymore
        // { header: "Kode QR", accessor: (p) => p.qr_code ?? "" }


        return columns;
    };

    const exportCSV = () => {
        if (!ev) return;

        const columns = buildExportColumns(list, ev.field_config);
        const header = columns.map(col => col.header);
        const rows = list.map((p, index) => columns.map(col => col.accessor(p, index)));

        const csvContent = [
            header.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const bom = "\uFEFF"; // Byte Order Mark for proper Excel/Sheets encoding
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const eventName = ev.name.replace(/[^a-zA-Z0-9]/gi, '_').toLowerCase();
        const date = new Date().toLocaleDateString('id-ID').replace(/\//g, '-');
        a.download = `${eventName}_${date}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

  useEffect(() => {
    if (accessDenied && !loading) {
      router.push("/dashboard");
    }
  }, [accessDenied, loading, router]);

  if (loading) {
    return (
      <div className="bd flex min-h-screen items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-5xl" style={{ color: "var(--green)" }}>progress_activity</span>
      </div>
    );
  }

  if (accessDenied || !ev) {
    return (
      <div className="bd flex min-h-screen items-center justify-center">
        <p style={{ color: "var(--on-surface-variant)" }}>Mengalihkan...</p>
      </div>
    );
  }

  const isClosed = ev.status === "closed";
  const total = list.length;
  const checkedIn = list.filter((p) => p.is_checked_in).length;
  const belum = total - checkedIn;
  const cap = ev.expected_participants ?? null;
  const sisa = cap !== null ? Math.max(cap - total, 0) : null;

  const stats = [
    { label: "Total Terdaftar", value: cap !== null ? `${total} / ${cap}` : `${total}`, icon: "groups", color: "var(--primary)" },
    { label: "Sudah Check-in", value: `${checkedIn}`, icon: "task_alt", color: "var(--green)" },
    { label: "Belum Check-in", value: `${belum}`, icon: "schedule", color: "var(--on-surface-variant)" },
    { label: "Kuota Sisa", value: sisa !== null ? `${sisa}` : "Unlimited", icon: "confirmation_number", color: sisa === 0 ? "var(--error)" : "var(--cyan)" },
  ];

  const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const tokenValid = ev.scanner_token && isTokenValid(ev.scanner_token_expires_at);
  const scannerLink = tokenValid ? `${origin}/scan?token=${ev.scanner_token}` : "";

  const tabs: { id: Tab; label: string }[] = [
    { id: "pendaftar", label: "Pendaftaran" },
    { id: "monitoring", label: "Pemantauan" },
    { id: "scanner", label: "Scanner" },
  ];

  return (
    <div className="bd min-h-screen px-4 pt-6 pb-16 md:px-10">
      {ev.package_status === 'pending_payment' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="glass w-full max-w-2xl rounded-2xl p-8 text-center">
            <span className="material-symbols-outlined mb-4 text-6xl" style={{ color: "rgba(255,191,0,0.9)" }}>schedule</span>
            <p className="mb-4 text-2xl font-bold">⏳ Event ini menunggu konfirmasi pembayaran dari tim bdForms</p>
            <p className="mb-8 text-base" style={{ color: "var(--on-surface-variant)" }}>
              Detail event sudah tersimpan. Semua fitur akan aktif setelah pembayaran dikonfirmasi. Hubungi kami jika butuh bantuan.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/dashboard" className="rounded-xl border px-6 py-3 font-bold" style={{ borderColor: "var(--outline-variant)" }}>
                ← Kembali ke Dashboard
              </Link>
              <a
                href="https://wa.me/6285199527012?text=Halo%20bdForms%2C%20saya%20ingin%20konfirmasi%20pembayaran%20untuk%20event%20saya"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl px-6 py-3 font-bold"
                style={{ background: "var(--green)", color: "var(--on-green)" }}
              >
                Hubungi bdForms via WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
      <header className="mx-auto mb-6 max-w-5xl">
        <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm" style={{ color: "var(--on-surface-variant)" }}>
          ← Dashboard
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{ev.name}</h1>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  background: isClosed ? "var(--surface-container)" : "rgba(91,255,161,0.15)",
                  color: isClosed ? "var(--on-surface-variant)" : "var(--green)",
                }}
              >
                {isClosed ? "⚫ Selesai" : "🟢 Aktif"}
              </span>
              {ev.package_type && (
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    background: ev.package_type === 'starter' ? 'var(--surface-container)' : ev.package_type === 'standard' ? 'rgba(0,150,255,0.15)' : ev.package_type === 'pro' ? 'rgba(91,255,161,0.15)' : 'rgba(255,191,0,0.15)',
                    color: ev.package_type === 'starter' ? 'var(--on-surface-variant)' : ev.package_type === 'standard' ? '#0096ff' : ev.package_type === 'pro' ? 'var(--green)' : '#ffbf00'
                  }}
                >
                  {ev.package_type.charAt(0).toUpperCase() + ev.package_type.slice(1)}
                </span>
              )}
            </div>
          </div>
          {!isClosed && (
            <button
              onClick={() => setCloseModalOpen(true)}
              className="rounded-lg border px-4 py-2 text-sm font-medium"
              style={{ borderColor: "var(--error)", color: "var(--error)" }}
            >
              Tutup Event
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto mb-6 max-w-5xl border-b" style={{ borderColor: "var(--outline-variant)" }}>
        <div className="flex gap-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="pb-3 text-sm font-medium transition-colors"
              style={{
                color: tab === t.id ? "var(--green)" : "var(--on-surface-variant)",
                borderBottom: tab === t.id ? "2px solid var(--green)" : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Pendaftaran */}
      {tab === "pendaftar" && (
        <div className="mx-auto max-w-5xl">
          {isClosed && (
            <div className="mb-4 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)" }}>
              ⚫ Event Selesai — Data hanya bisa dilihat
            </div>
          )}

          {/* 1. Link Pendaftaran */}
          <div className="glass mb-6 rounded-2xl p-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Link Pendaftaran Peserta</h2>
              {!ev.slug && !isClosed && !editingSlug && (
                total === 0 ? (
                  <button
                    onClick={() => { setEditingSlug(true); setSlugInput(""); setSlugSaveError(null); }}
                    className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5"
                    style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)" }}
                  >
                    <span className="material-symbols-outlined text-sm">link</span>
                    Tambah URL Pendek
                  </button>
                ) : (
                  <span
                    className="text-xs"
                    style={{ color: "var(--on-surface-variant)" }}
                    title="Tidak bisa diubah setelah ada peserta"
                  >
                    🔒 URL Pendek terkunci
                  </span>
                )
              )}
            </div>
            <p className="mb-4 text-sm" style={{ color: "var(--on-surface-variant)" }}>Bagikan ke peserta via WhatsApp atau media sosial</p>

            {editingSlug && (
              <div className="mb-4 rounded-xl border p-4" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-low)" }}>
                <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>URL Pendek Event</label>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-sm" style={{ color: "var(--on-surface-variant)" }}>bdforms.id/e/</span>
                  <input
                    value={slugInput}
                    onChange={(e) => { setSlugInput(e.target.value.toLowerCase().replace(/\s+/g, "-")); setSlugSaveError(null); }}
                    placeholder="nama-event"
                    className="bd-input flex-1 rounded-lg px-3 py-2 text-sm"
                    autoFocus
                  />
                </div>
                {slugSaveError && <p className="mt-1 text-xs" style={{ color: "var(--error)" }}>{slugSaveError}</p>}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={saveSlug}
                    disabled={savingSlug}
                    className="rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50"
                    style={{ background: "var(--green)", color: "var(--on-green)" }}
                  >
                    {savingSlug ? "Menyimpan..." : "Simpan"}
                  </button>
                  <button
                    onClick={() => { setEditingSlug(false); setSlugSaveError(null); }}
                    className="rounded-lg border px-4 py-2 text-sm"
                    style={{ borderColor: "var(--outline-variant)" }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 rounded-xl border p-4" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-low)" }}>
              <code className="truncate text-sm">
                {ev.slug ? `bdforms.id/e/${ev.slug}` : `${origin}/register?eventId=${eventId}`}
              </code>
              <button
                onClick={() => {
                  const link = ev.slug ? `https://bdforms.id/e/${ev.slug}` : `${origin}/register?eventId=${eventId}`;
                  navigator.clipboard?.writeText(link);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="shrink-0 rounded-lg p-2 hover:bg-white/10"
                title="Salin"
              >
                <span className="material-symbols-outlined text-base" style={{ color: copied ? "var(--green)" : "var(--on-surface-variant)" }}>
                  {copied ? "check" : "content_copy"}
                </span>
              </button>
            </div>
          </div>

          {/* 2. Field yang Diaktifkan */}
          <div className="glass mb-6 rounded-2xl p-6">
            <h2 className="mb-2 text-lg font-bold">Field yang Diaktifkan</h2>
            <p className="mb-4 text-sm" style={{ color: "var(--on-surface-variant)" }}>Berikut field yang akan muncul di form pendaftaran</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: "var(--outline-variant)" }}><span className="font-semibold">Nama</span> <span style={{ color: "var(--error)" }}>*</span></span>
              <span className="rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: "var(--outline-variant)" }}><span className="font-semibold">Email</span> <span style={{ color: "var(--error)" }}>*</span></span>
              {PRESET_FIELDS.map((field) => {
                const cfg = ev.field_config[field.key];
                if (!cfg?.enabled) return null;
                return <span key={field.key} className="rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: "var(--outline-variant)" }}><span className="font-semibold">{field.label}</span>{cfg.required && <span style={{ color: "var(--error)" }}> *</span>}</span>;
              })}
              {ev.field_config.customQuestions.map((q) => <span key={q.id} className="rounded-lg border px-3 py-1.5 text-sm" style={{ borderColor: "var(--outline-variant)" }}><span className="font-semibold">{q.label || "Pertanyaan"}</span>{q.required && <span style={{ color: "var(--error)" }}> *</span>}</span>)}
            </div>
          </div>

          {/* 3. Materi / Dokumen (if exists) */}
          {ev.doc_url && ev.doc_slug && (
            <div className="glass mb-6 rounded-2xl p-6">
              <h2 className="mb-2 text-lg font-bold">Materi Pre-Event</h2>
              <p className="mb-4 text-sm" style={{ color: "var(--on-surface-variant)" }}>Link materi yang bisa dibagikan ke peserta</p>
              <div className="flex items-center justify-between gap-3 rounded-xl border p-4" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-low)" }}>
                <code className="truncate text-sm">bdforms.id/doc/{ev.doc_slug}</code>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => { navigator.clipboard?.writeText(`https://bdforms.id/doc/${ev.doc_slug}`); setCopiedDoc(true); setTimeout(() => setCopiedDoc(false), 1500); }}
                    className="rounded-lg p-2 hover:bg-white/10"
                    title="Salin"
                  >
                    <span className="material-symbols-outlined text-base" style={{ color: copiedDoc ? "var(--green)" : "var(--on-surface-variant)" }}>
                      {copiedDoc ? "check" : "content_copy"}
                    </span>
                  </button>
                  <a
                    href={ev.doc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5"
                    style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)" }}
                  >
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                    Buka Materi
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* 4. Edit Form button */}
          {!isClosed && (
            <div className="mb-6">
              <button onClick={openEditModal} className="flex items-center gap-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/5" style={{ borderColor: "var(--outline-variant)" }}>
                <span className="material-symbols-outlined text-base">edit</span>Edit Form Pendaftaran
              </button>
              {total > 0 && <p className="mt-2 text-xs" style={{ color: "var(--on-surface-variant)" }}>Detail event tetap bisa diedit. Konfigurasi field terkunci karena sudah ada peserta.</p>}
            </div>
          )}
        </div>
      )}

      {/* Tab: Pemantauan */}
      {tab === "monitoring" && (
        <div className="mx-auto max-w-5xl">
          {isClosed && (
            <div className="mb-4 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)" }}>
              ⚫ Event sudah ditutup — Data tidak akan berubah
            </div>
          )}
          
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {updated && (
                <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                  Diperbarui {updated.toLocaleTimeString("id-ID")}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={exportCSV}
                disabled={total === 0}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-40"
                style={{ background: "var(--green)", color: "var(--on-green)" }}
              >
                <span className="material-symbols-outlined text-base">download</span>
                Export CSV
              </button>
              {!isClosed && (
                <button onClick={load} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--outline-variant)" }}>
                  <span className="material-symbols-outlined text-base">refresh</span>
                  Refresh
                </button>
              )}
            </div>
          </div>

          <StatsGrid stats={stats} />
          <ParticipantList list={list} ev={ev} initials={initials} buildExtraChips={buildExtraChips} />
        </div>
      )}

      {/* Tab: Scanner */}
      {tab === "scanner" && (
        <div className="mx-auto max-w-5xl">
          {isClosed ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined mb-4 text-6xl" style={{ color: "var(--on-surface-variant)" }}>
                qr_code_scanner
              </span>
              <p className="text-lg font-medium" style={{ color: "var(--on-surface-variant)" }}>
                Scanner tidak aktif — event sudah ditutup
              </p>
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 md:p-8">
              <h2 className="mb-2 text-lg font-bold">Link Scanner untuk Panitia</h2>
              <p className="mb-6 text-sm" style={{ color: "var(--on-surface-variant)" }}>
                Generate link scanner dan bagikan ke tim panitia. Link berlaku 24 jam.
              </p>

              {tokenValid ? (
                <>
                  <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border p-4" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-low)" }}>
                    <code className="truncate text-sm">{scannerLink}</code>
                    <button onClick={() => copyScannerLink(scannerLink)} className="shrink-0 rounded-lg p-2 hover:bg-white/10" title="Salin">
                      <span className="material-symbols-outlined text-base" style={{ color: copied ? "var(--green)" : "var(--on-surface-variant)" }}>
                        {copied ? "check" : "content_copy"}
                      </span>
                    </button>
                  </div>
                  <p className="mb-4 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                    Berlaku hingga {new Date(ev.scanner_token_expires_at!).toLocaleString("id-ID")}
                  </p>
                  <button
                    onClick={generateScannerToken}
                    disabled={generatingToken}
                    className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
                    style={{ borderColor: "var(--outline-variant)" }}
                  >
                    {generatingToken ? "Memproses..." : "Generate Ulang"}
                  </button>
                </>
              ) : (
                <>
                  <p className="mb-4 text-sm" style={{ color: "var(--on-surface-variant)" }}>Belum ada link aktif</p>
                  <button
                    onClick={generateScannerToken}
                    disabled={generatingToken}
                    className="rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50"
                    style={{ background: "var(--green)", color: "var(--on-green)" }}
                  >
                    {generatingToken ? "Memproses..." : "Generate Link Scanner"}
                  </button>
                </>
              )}

              <p className="mt-6 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                Panitia tidak perlu login untuk menggunakan link scanner ini.
              </p>
            </div>
          )}
        </div>
      )}

      {closeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={(e) => e.target === e.currentTarget && setCloseModalOpen(false)}>
          <div className="glass w-full max-w-md rounded-2xl p-6">
            <h3 className="mb-3 text-lg font-bold">Tutup event ini?</h3>
            <p className="mb-6 text-sm" style={{ color: "var(--on-surface-variant)" }}>
              Scanner dan pendaftaran akan dinonaktifkan. Dashboard tetap bisa diakses.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCloseModalOpen(false)} className="flex-1 rounded-xl border py-3 font-bold" style={{ borderColor: "var(--outline-variant)" }}>Batal</button>
              <button onClick={handleCloseEvent} disabled={closing} className="flex-1 rounded-xl py-3 font-bold disabled:opacity-50" style={{ background: "var(--error)", color: "var(--on-error)" }}>
                {closing ? "Menutup..." : "Tutup Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <EditEventModal
          editLoading={editLoading}
          editName={editName}
          setEditName={setEditName}
          editExpected={editExpected}
          setEditExpected={setEditExpected}
          editPackageType={editPackageType}
          editFieldConfig={editFieldConfig}
          setEditFieldConfig={setEditFieldConfig}
          editRegDeadline={editRegDeadline}
          setEditRegDeadline={setEditRegDeadline}
          editEventDate={editEventDate}
          setEditEventDate={setEditEventDate}
          editEventEnd={editEventEnd}
          setEditEventEnd={setEditEventEnd}
          editBannerUrl={editBannerUrl}
          editBannerPreview={editBannerPreview}
          editBannerFile={editBannerFile}
          compressingBanner={compressingBanner}
          editQuotaLocked={editQuotaLocked}
          editDateFieldsLocked={editDateFieldsLocked}
          editError={editError}
          editSaving={editSaving}
          listLength={list.length}
          onClose={closeEditModal}
          onSave={handleEditSave}
          onBannerChange={handleEditBannerChange}
          onClearBannerPreview={() => {
            if (editBannerPreview) URL.revokeObjectURL(editBannerPreview);
            setEditBannerPreview(null);
            setEditBannerFile(null);
          }}
        />
      )}
    </div>
  );
}

function StatsGrid({ stats }: { stats: { label: string; value: string; icon: string; color: string }[] }) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="glass rounded-2xl p-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>{s.label}</p>
            <span className="material-symbols-outlined" style={{ color: s.color }}>{s.icon}</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

function ParticipantList({
  list,
  ev,
  initials,
  buildExtraChips,
}: {
  list: Participant[];
  ev: Ev;
  initials: (name: string) => string;
  buildExtraChips: (extraData: Record<string, string> | null, fieldConfig: FieldConfig) => { id: string; label: string; value: string }[];
}) {
  const total = list.length;
  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Daftar Peserta ({total})</h2>
      {total === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
          Belum ada peserta yang daftar.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((p) => (
            <div key={p.id} className="glass flex items-center justify-between gap-3 rounded-xl p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold" style={{ background: "var(--surface-container)", color: "var(--primary)" }}>
                  {initials(p.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.name}</p>
                  {p.email && <p className="truncate text-xs" style={{ color: "var(--on-surface-variant)" }}>{p.email}</p>}
                  {(() => {
                    const data = p.custom_data ?? {};
                    const fields = ev.custom_fields ?? [];
                    const legacyChips = fields.filter((f) => data[f.id]).map((f) => ({ id: f.id, label: f.label || "Field", value: data[f.id] }));
                    const extraChips = buildExtraChips(p.extra_data, ev.field_config);
                    const chips = [...legacyChips, ...extraChips];
                    if (chips.length === 0) return null;
                    const visible = chips.slice(0, 3);
                    const overflow = chips.length - visible.length;
                    return (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {visible.map((c) => (
                          <span key={c.id} className="rounded px-2 py-0.5 text-xs" style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}>
                            {c.label}: {c.value}
                          </span>
                        ))}
                        {overflow > 0 && (
                          <span className="rounded px-2 py-0.5 text-xs" style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}>
                            +{overflow} more
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="shrink-0 text-right">
                {p.is_checked_in ? (
                  <>
                    <span className="flex items-center justify-end gap-1 text-sm font-semibold" style={{ color: "var(--green)" }}>
                      <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      Check-in
                    </span>
                    {p.check_in_time && (
                      <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
                        {new Date(p.check_in_time).toLocaleTimeString("id-ID")}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="rounded-full px-3 py-1 text-xs" style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}>
                    Belum hadir
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditEventModal({
  editLoading, editName, setEditName, editExpected, setEditExpected,
  editPackageType, editFieldConfig, setEditFieldConfig,
  editRegDeadline, setEditRegDeadline, editEventDate, setEditEventDate, editEventEnd, setEditEventEnd,
  editBannerUrl, editBannerPreview, compressingBanner, editQuotaLocked,
  editDateFieldsLocked, editError, editSaving, listLength,
  onClose, onSave, onBannerChange, onClearBannerPreview,
}: {
  editLoading: boolean;
  editName: string;
  setEditName: (v: string) => void;
  editExpected: string;
  setEditExpected: (v: string) => void;
  editPackageType: string;
  editFieldConfig: FieldConfig;
  setEditFieldConfig: (v: FieldConfig) => void;
  editRegDeadline: string;
  setEditRegDeadline: (v: string) => void;
  editEventDate: string;
  setEditEventDate: (v: string) => void;
  editEventEnd: string;
  setEditEventEnd: (v: string) => void;
  editBannerUrl: string | null;
  editBannerPreview: string | null;
  editBannerFile: File | null;
  compressingBanner: boolean;
  editQuotaLocked: boolean;
  editDateFieldsLocked: boolean;
  editError: string | null;
  editSaving: boolean;
  listLength: number;
  onClose: () => void;
  onSave: () => void;
  onBannerChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearBannerPreview: () => void;
}) {
  const packageLimits: Record<string, number> = { starter: 30, standard: 120, pro: 500 };
  const packageLimit = editPackageType && packageLimits[editPackageType] != null ? packageLimits[editPackageType] : undefined;
  const packageName = editPackageType ? editPackageType.charAt(0).toUpperCase() + editPackageType.slice(1) : "";
  const quotaNumber = editExpected ? Number(editExpected) : null;
  const quotaLimitError = packageLimit && quotaNumber && quotaNumber > packageLimit ? `Maks. peserta untuk paket ${packageName} adalah ${packageLimit} orang` : null;
  const fieldConfigLocked = listLength > 0;
  const updatePresetField = (key: Exclude<keyof FieldConfig, "customQuestions">, patch: { enabled?: boolean; required?: boolean }) => {
    setEditFieldConfig({ ...editFieldConfig, [key]: { ...editFieldConfig[key], ...patch } });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "rgba(0,0,0,0.7)", padding: "24px" }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="glass relative mx-auto w-full max-w-[560px] rounded-2xl p-6" style={{ marginTop: "24px", marginBottom: "24px" }}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Edit Event</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10" aria-label="Tutup">
            <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)" }}>close</span>
          </button>
        </div>
        {editLoading ? (
          <p className="py-8 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>Memuat data event...</p>
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Nama Event</label>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className="bd-input w-full rounded-lg px-4 py-3" />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Banner Event</label>
              {compressingBanner ? (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-low)" }}>
                  <span className="material-symbols-outlined animate-spin text-3xl" style={{ color: "var(--on-surface-variant)" }}>progress_activity</span>
                </div>
              ) : editBannerPreview || editBannerUrl ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-low)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={editBannerPreview ?? editBannerUrl!} alt="Preview banner" className="h-full w-full object-cover" />
                  {editBannerPreview && (
                    <button type="button" onClick={onClearBannerPreview} className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border bg-black/60 backdrop-blur-sm" style={{ borderColor: "var(--outline-variant)" }}>
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  )}
                </div>
              ) : null}
              <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 transition-colors hover:bg-white/5" style={{ borderColor: "var(--outline-variant)" }}>
                <span className="material-symbols-outlined text-xl" style={{ color: "var(--on-surface-variant)" }}>image</span>
                <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Pilih gambar banner</span>
                <input type="file" accept="image/*" onChange={onBannerChange} className="hidden" />
              </label>
              <p className="mt-2 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                💡 Gunakan gambar landscape 1200×630px untuk hasil terbaik. Format: JPG/PNG, maks. 2MB.
              </p>
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
                Maksimal Peserta
                {editQuotaLocked && <span className="normal-case tracking-normal" style={{ fontSize: "11px" }}>🔒 Tidak bisa diubah</span>}
              </label>
              <input type="number" value={editExpected} onChange={(e) => setEditExpected(e.target.value)} disabled={editQuotaLocked} min={listLength} max={packageLimit} placeholder="Kosongkan = unlimited" className="bd-input w-full rounded-lg px-4 py-3 disabled:opacity-60" />
              {quotaLimitError && <p className="mt-2 text-sm" style={{ color: "var(--error)" }}>{quotaLimitError}</p>}
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
                Deadline Pendaftaran
                {editDateFieldsLocked && <span className="normal-case tracking-normal" style={{ fontSize: "11px" }}>🔒 Tidak bisa diubah</span>}
              </label>
              <input type="datetime-local" value={editRegDeadline} onChange={(e) => setEditRegDeadline(e.target.value)} disabled={editDateFieldsLocked} min={editDateFieldsLocked ? undefined : nowDatetimeLocal()} className="bd-input w-full rounded-lg px-4 py-3 disabled:opacity-60" style={{ colorScheme: "dark" }} />
            </div>
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
                Tanggal Mulai
                {editDateFieldsLocked && <span className="normal-case tracking-normal" style={{ fontSize: "11px" }}>🔒 Tidak bisa diubah</span>}
              </label>
              <input type="datetime-local" value={editEventDate} onChange={(e) => setEditEventDate(e.target.value)} disabled={editDateFieldsLocked} min={editDateFieldsLocked ? undefined : editRegDeadline || undefined} className="bd-input w-full rounded-lg px-4 py-3 disabled:opacity-60" style={{ colorScheme: "dark" }} />
            </div>
            <div>
              <label className="mb-1 flex items-center justify-between text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Tanggal Selesai {editDateFieldsLocked && <span style={{ color: "var(--error)", fontSize: "11px" }}>🔒 Tidak bisa diubah</span>}</label>
              <input type="datetime-local" value={editEventEnd} onChange={(e) => setEditEventEnd(e.target.value)} disabled={editDateFieldsLocked} min={editEventDate || undefined} className="bd-input w-full rounded-lg px-4 py-3 disabled:opacity-60" style={{ colorScheme: "dark" }} />
            </div>
            <div className="my-2 border-t pt-5" style={{ borderColor: "var(--outline-variant)" }}>
              <h3 className="mb-2 text-sm font-bold">Konfigurasi Field Pendaftaran</h3>
              {fieldConfigLocked && (
                <p className="mb-4 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)", background: "var(--surface-low)" }}>
                  Tidak bisa mengubah form setelah ada peserta yang mendaftar
                </p>
              )}
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--outline-variant)" }}>
                {PRESET_FIELDS.map((field, idx) => {
                  const cfg = editFieldConfig[field.key];
                  return (
                    <div key={field.key} className="flex items-center justify-between gap-3 px-3 py-3" style={{ borderBottom: idx < PRESET_FIELDS.length - 1 ? "1px solid var(--outline-variant)" : undefined, background: "var(--surface-low)" }}>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg" style={{ color: "var(--primary)" }}>{field.icon}</span>
                        <span className="text-sm font-medium">{field.label}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                        <label className="flex items-center gap-1">
                          <input type="checkbox" checked={cfg.enabled} disabled={fieldConfigLocked} onChange={(e) => updatePresetField(field.key, { enabled: e.target.checked, required: e.target.checked ? cfg.required : false })} className="accent-[var(--green)] disabled:opacity-50" />
                          Tampilkan
                        </label>
                        <label className="flex items-center gap-1">
                          <input type="checkbox" checked={cfg.required} disabled={fieldConfigLocked || !cfg.enabled} onChange={(e) => updatePresetField(field.key, { required: e.target.checked })} className="accent-[var(--green)] disabled:opacity-50" />
                          Wajib
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--outline-variant)" }}>
                <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Pertanyaan Custom (max 2)</p>{!fieldConfigLocked && editFieldConfig.customQuestions.length < 2 && <button type="button" onClick={() => setEditFieldConfig({ ...editFieldConfig, customQuestions: [...editFieldConfig.customQuestions, { id: crypto.randomUUID(), label: "", required: false }] })} className="rounded-lg border px-3 py-1 text-xs" style={{ borderColor: "var(--outline-variant)" }}>+ Tambah</button>}</div>
                {editFieldConfig.customQuestions.map((q, qi) => <div key={q.id} className="mb-2 flex items-center gap-2"><input disabled={fieldConfigLocked} value={q.label} onChange={(e)=>{const customQuestions=[...editFieldConfig.customQuestions];customQuestions[qi]={...q,label:e.target.value};setEditFieldConfig({...editFieldConfig,customQuestions});}} placeholder="Tulis pertanyaan..." className="bd-input flex-1 rounded-lg px-3 py-2 text-sm disabled:opacity-60"/><button type="button" disabled={fieldConfigLocked} onClick={()=>{const customQuestions=[...editFieldConfig.customQuestions];customQuestions[qi]={...q,required:!q.required};setEditFieldConfig({...editFieldConfig,customQuestions});}} className="relative inline-flex h-6 w-11 rounded-full disabled:opacity-40" style={{ background: q.required ? "var(--green)" : "#1e2a2c" }}><span className="h-[18px] w-[18px] rounded-full bg-white transition-transform" style={{ transform: q.required ? "translate(23px, 3px)" : "translate(3px, 3px)" }} /></button><button type="button" disabled={fieldConfigLocked} onClick={()=>setEditFieldConfig({...editFieldConfig,customQuestions:editFieldConfig.customQuestions.filter((_,i)=>i!==qi)})} className="rounded-lg p-2 disabled:opacity-40"><span className="material-symbols-outlined text-base" style={{color:"var(--error)"}}>delete</span></button></div>)}
              </div>
            </div>
            {editError && <p className="text-sm" style={{ color: "var(--error)" }}>{editError}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} disabled={editSaving} className="flex-1 rounded-xl border py-3 font-bold disabled:opacity-50" style={{ borderColor: "var(--outline-variant)" }}>Batal</button>
              <button type="button" onClick={onSave} disabled={editSaving || compressingBanner} className="flex-1 rounded-xl py-3 font-bold disabled:opacity-50" style={{ background: "var(--green)", color: "var(--on-green)" }}>
                {editSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ManageEventPage() {
  return <ManageEventInner />;
}
