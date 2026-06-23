"use client";

import { useCallback, useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { CustomField } from "@/lib/types";
import "../design.css";

type Participant = {
  id: string;
  name: string;
  email: string | null;
  is_checked_in: boolean;
  check_in_time: string | null;
  custom_data: Record<string, string> | null;
};
type Ev = { name: string; expected_participants: number | null; custom_fields: CustomField[] | null };

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nowDatetimeLocal() {
  return toDatetimeLocal(new Date().toISOString());
}

function minEventDateAfterDeadline(regDeadline: string) {
  const dl = new Date(regDeadline);
  const min = new Date(dl);
  if (dl.getHours() > 0 || dl.getMinutes() > 0 || dl.getSeconds() > 0 || dl.getMilliseconds() > 0) {
    min.setDate(min.getDate() + 1);
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${min.getFullYear()}-${pad(min.getMonth() + 1)}-${pad(min.getDate())}`;
}

export default function DashboardPage() {
  const [eventId, setEventId] = useState<string | null | undefined>(undefined);
  const [ev, setEv] = useState<Ev | null>(null);
  const [list, setList] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editExpected, setEditExpected] = useState("");
  const [editRegDeadline, setEditRegDeadline] = useState("");
  const [editEventDate, setEditEventDate] = useState("");
  const [editBannerUrl, setEditBannerUrl] = useState<string | null>(null);
  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
  const [editBannerPreview, setEditBannerPreview] = useState<string | null>(null);
  const [compressingBanner, setCompressingBanner] = useState(false);
  const [editQuotaLocked, setEditQuotaLocked] = useState(false);
  const [editDateFieldsLocked, setEditDateFieldsLocked] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("eventId");
    setEventId(id);
  }, []);

  const load = useCallback(async () => {
    if (!eventId) return;
    const [{ data: evData }, { data: pData }] = await Promise.all([
      supabase.from("events").select("name, expected_participants, custom_fields").eq("id", eventId).single(),
      supabase
        .from("participants")
        .select("id, name, email, is_checked_in, check_in_time, custom_data")
        .eq("event_id", eventId)
        .order("check_in_time", { ascending: false, nullsFirst: false }),
    ]);
    if (evData) {
      const fields = Array.isArray(evData.custom_fields) ? (evData.custom_fields as CustomField[]) : [];
      setEv({ ...evData, custom_fields: fields } as Ev);
    }
    setList((pData ?? []) as Participant[]);
    setUpdated(new Date());
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    if (eventId === undefined) return;
    if (!eventId) {
      setLoading(false);
      return;
    }
    load();
    const t = setInterval(load, 8000); // auto-refresh tiap 8 detik
    return () => clearInterval(t);
  }, [eventId, load]);

  if (eventId === null) {
    return (
      <div className="bd flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="material-symbols-outlined text-6xl" style={{ color: "var(--error)" }}>link_off</span>
        <h1 className="text-2xl font-bold">Link dashboard tidak valid</h1>
        <Link href="/create" className="rounded-lg px-6 py-3 font-bold" style={{ background: "var(--green)", color: "var(--on-green)" }}>Buat Event</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bd flex min-h-screen items-center justify-center">
        <p style={{ color: "var(--on-surface-variant)" }}>Memuat dashboard...</p>
      </div>
    );
  }

  const total = list.length;
  const checkedIn = list.filter((p) => p.is_checked_in).length;
  const belum = total - checkedIn;
  const cap = ev?.expected_participants ?? null;
  const sisa = cap !== null ? Math.max(cap - total, 0) : null;

  const stats = [
    { label: "Total Terdaftar", value: cap !== null ? `${total} / ${cap}` : `${total}`, icon: "groups", color: "var(--primary)" },
    { label: "Sudah Check-in", value: `${checkedIn}`, icon: "task_alt", color: "var(--green)" },
    { label: "Belum Check-in", value: `${belum}`, icon: "schedule", color: "var(--on-surface-variant)" },
    { label: "Kuota Sisa", value: sisa !== null ? `${sisa}` : "Unlimited", icon: "confirmation_number", color: sisa === 0 ? "var(--error)" : "var(--cyan)" },
  ];

  const initials = (name: string) =>
    name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const closeEditModal = () => {
    if (editBannerPreview) URL.revokeObjectURL(editBannerPreview);
    setEditOpen(false);
    setEditError(null);
    setEditBannerFile(null);
    setEditBannerPreview(null);
  };

  const openEditModal = async () => {
    if (!eventId) return;
    setEditOpen(true);
    setEditError(null);
    setEditLoading(true);
    setEditBannerFile(null);
    setEditBannerPreview(null);

    const { data, error } = await supabase
      .from("events")
      .select("name, expected_participants, registration_deadline, event_date, banner_url")
      .eq("id", eventId)
      .single();

    if (error || !data) {
      setEditError("Gagal memuat data event.");
      setEditLoading(false);
      return;
    }

    const now = new Date();
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
    setEditEventDate(eventDateStr);
    setEditBannerUrl(data.banner_url ?? null);
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
    if (!eventId) return;
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
    }

    if (!editDateFieldsLocked && editRegDeadline) {
      if (new Date(editRegDeadline) < new Date()) {
        setEditError("Deadline pendaftaran tidak boleh di masa lalu.");
        return;
      }
    }

    if (!editDateFieldsLocked && editEventDate && editRegDeadline) {
      if (new Date(`${editEventDate}T00:00:00`) <= new Date(editRegDeadline)) {
        setEditError("Tanggal event harus setelah deadline pendaftaran.");
        return;
      }
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

      const updates: Record<string, unknown> = {
        name: editName.trim(),
        banner_url: bannerUrl,
      };

      if (!editQuotaLocked) {
        updates.expected_participants = editExpected ? Number(editExpected) : null;
      }
      if (!editDateFieldsLocked) {
        updates.registration_deadline = editRegDeadline ? new Date(editRegDeadline).toISOString() : null;
        updates.event_date = editEventDate || null;
      }

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

  const exportCSV = () => {
    const customFieldDefs = ev?.custom_fields ?? [];
    const header = [
      "No",
      "Nama",
      "Email",
      "Status",
      "Waktu Check-in",
      ...customFieldDefs.map((f) => f.label || "Field"),
    ];
    const rows = list.map((p, i) => {
      const data = p.custom_data ?? {};
      return [
        i + 1,
        p.name,
        p.email ?? "-",
        p.is_checked_in ? "Hadir" : "Belum Hadir",
        p.check_in_time ? new Date(p.check_in_time).toLocaleString("id-ID") : "-",
        ...customFieldDefs.map((f) => data[f.id] ?? "-"),
      ];
    });
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ev?.name ?? "peserta"}_${new Date().toLocaleDateString("id-ID").replace(/\//g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bd min-h-screen px-4 pt-6 pb-16 md:px-10">
      {/* Header */}
      <header className="mx-auto mb-8 flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>Dashboard Event</p>
          <h1 className="text-2xl font-bold">{ev?.name ?? "Event"}</h1>
        </div>
        <div className="flex items-center gap-3">
          {updated && (
            <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
              Diperbarui {updated.toLocaleTimeString("id-ID")}
            </span>
          )}
          <button onClick={load} className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--outline-variant)" }}>
            <span className="material-symbols-outlined text-base">refresh</span>
            Refresh
          </button>
          <button
            onClick={openEditModal}
            className="flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--outline-variant)" }}
          >
            <span className="material-symbols-outlined text-base">edit</span>
            Edit Event
          </button>
          <button
            onClick={exportCSV}
            disabled={total === 0}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-40"
            style={{ background: "var(--green)", color: "var(--on-green)" }}
          >
            <span className="material-symbols-outlined text-base">download</span>
            Export CSV
          </button>
        </div>
      </header>

      {/* Stat cards */}
      <div className="mx-auto mb-8 grid max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4">
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

      {/* Registrant list */}
      <div className="mx-auto max-w-5xl">
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
                      const fields = ev?.custom_fields ?? [];
                      const chips = fields
                        .filter((f) => data[f.id])
                        .map((f) => ({ id: f.id, label: f.label || "Field", value: data[f.id] }));
                      if (chips.length === 0) return null;
                      return (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {chips.map((c) => (
                            <span
                              key={c.id}
                              className="rounded px-2 py-0.5 text-xs"
                              style={{ background: "var(--surface-container)", color: "var(--on-surface-variant)" }}
                            >
                              {c.label}: {c.value}
                            </span>
                          ))}
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

      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => e.target === e.currentTarget && closeEditModal()}
        >
          <div className="glass w-full max-w-[500px] rounded-2xl p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Event</h2>
              <button
                type="button"
                onClick={closeEditModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10"
                aria-label="Tutup"
              >
                <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)" }}>close</span>
              </button>
            </div>

            {editLoading ? (
              <p className="py-8 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>Memuat data event...</p>
            ) : (
              <div className="flex flex-col gap-5">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
                    Nama Event
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bd-input w-full rounded-lg px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
                    Banner Event
                  </label>
                  {compressingBanner ? (
                    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-low)" }}>
                      <span className="material-symbols-outlined animate-spin text-3xl" style={{ color: "var(--on-surface-variant)" }}>progress_activity</span>
                      <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Memproses gambar...</span>
                    </div>
                  ) : editBannerPreview || editBannerUrl ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-low)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={editBannerPreview ?? editBannerUrl!} alt="Preview banner" className="h-full w-full object-cover" />
                      {editBannerPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            if (editBannerPreview) URL.revokeObjectURL(editBannerPreview);
                            setEditBannerPreview(null);
                            setEditBannerFile(null);
                          }}
                          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border bg-black/60 backdrop-blur-sm"
                          style={{ borderColor: "var(--outline-variant)" }}
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      )}
                    </div>
                  ) : null}
                  <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 transition-colors hover:bg-white/5" style={{ borderColor: "var(--outline-variant)" }}>
                    <span className="material-symbols-outlined text-xl" style={{ color: "var(--on-surface-variant)" }}>image</span>
                    <span className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Pilih gambar banner</span>
                    <input type="file" accept="image/*" onChange={handleEditBannerChange} className="hidden" />
                  </label>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
                    Maksimal Peserta
                    {editQuotaLocked && (
                      <span className="normal-case tracking-normal" style={{ color: "var(--on-surface-variant)", fontSize: "11px" }}>🔒 Tidak bisa diubah</span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={editExpected}
                    onChange={(e) => setEditExpected(e.target.value)}
                    disabled={editQuotaLocked}
                    min={list.length}
                    placeholder="Kosongkan = unlimited"
                    className="bd-input w-full rounded-lg px-4 py-3 disabled:opacity-60"
                  />
                  {!editQuotaLocked && (
                    <p className="mt-1 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      Min: {list.length} (jumlah peserta saat ini)
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
                    Deadline Pendaftaran
                    {editDateFieldsLocked && (
                      <span className="normal-case tracking-normal" style={{ color: "var(--on-surface-variant)", fontSize: "11px" }}>🔒 Tidak bisa diubah</span>
                    )}
                  </label>
                  <input
                    type="datetime-local"
                    value={editRegDeadline}
                    onChange={(e) => setEditRegDeadline(e.target.value)}
                    disabled={editDateFieldsLocked}
                    min={editDateFieldsLocked ? undefined : nowDatetimeLocal()}
                    className="bd-input w-full rounded-lg px-4 py-3 disabled:opacity-60"
                    style={{ colorScheme: "dark" }}
                  />
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
                    Tanggal Event
                    {editDateFieldsLocked && (
                      <span className="normal-case tracking-normal" style={{ color: "var(--on-surface-variant)", fontSize: "11px" }}>🔒 Tidak bisa diubah</span>
                    )}
                  </label>
                  <input
                    type="date"
                    value={editEventDate}
                    onChange={(e) => setEditEventDate(e.target.value)}
                    disabled={editDateFieldsLocked}
                    min={editDateFieldsLocked ? undefined : editRegDeadline ? minEventDateAfterDeadline(editRegDeadline) : undefined}
                    className="bd-input w-full rounded-lg px-4 py-3 disabled:opacity-60"
                    style={{ colorScheme: "dark" }}
                  />
                </div>

                {editError && (
                  <p className="text-sm" style={{ color: "var(--error)" }}>{editError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={editSaving}
                    className="flex-1 rounded-xl border py-3 font-bold disabled:opacity-50"
                    style={{ borderColor: "var(--outline-variant)" }}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleEditSave}
                    disabled={editSaving || compressingBanner}
                    className="flex-1 rounded-xl py-3 font-bold disabled:opacity-50"
                    style={{ background: "var(--green)", color: "var(--on-green)" }}
                  >
                    {editSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
