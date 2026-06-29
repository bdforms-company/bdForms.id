"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/lib/supabase";
import "../design.css";

function ProfileContent() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);
      setEmail(session.user.email ?? "");
      const { data } = await supabase
        .from("profiles")
        .select("full_name, username, avatar_url")
        .eq("id", session.user.id)
        .single();
      setFullName(data?.full_name ?? "");
      setUsername(data?.username ?? "");
      setAvatarUrl(data?.avatar_url ?? null);
    });
  }, []);

  const ok = (t: string) => {
    setMessage(t);
    setError(null);
    setTimeout(() => setMessage(null), 3500);
  };
  const fail = (t: string) => {
    setError(t);
    setMessage(null);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return fail("Format file tidak didukung. Gunakan JPEG, PNG, WebP, atau GIF.");
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return fail("Ukuran file maksimal 2MB.");
    }

    setUploading(true);

    try {
      // Create a unique file name
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${userId}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        setUploading(false);
        return fail("Gagal upload foto: " + uploadError.message);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Add cache-busting query param
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (updateError) {
        setUploading(false);
        return fail("Gagal menyimpan URL avatar: " + updateError.message);
      }

      setAvatarUrl(urlWithCacheBust);
      ok("Foto profil berhasil diperbarui ✅");
    } catch {
      fail("Terjadi kesalahan saat upload foto.");
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const save = async () => {
    const clean = username.trim().toLowerCase();
    if (clean.length < 3 || /\s/.test(clean) || clean !== username.trim())
      return fail(
        "Username harus lowercase, tanpa spasi, minimal 3 karakter"
      );
    setSaving(true);
    const { data: ex } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", clean)
      .neq("id", userId)
      .maybeSingle();
    if (ex) {
      setSaving(false);
      return fail("Username sudah dipakai");
    }
    const { error: e } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), username: clean })
      .eq("id", userId);
    setSaving(false);
    if (e) fail(e.message);
    else ok("Profil berhasil disimpan ✅");
  };

  const reset = async () => {
    const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (e) fail(e.message);
    else ok("Link ganti password dikirim ke email kamu");
  };

  const remove = async () => {
    await supabase.rpc("delete_user");
    setDeleteOpen(false);
    ok("Fitur ini akan segera tersedia");
  };

  const initial = (fullName || email || "U").trim()[0]?.toUpperCase();

  return (
    <div className="bd min-h-screen px-4 pt-8 pb-16">
      <main className="mx-auto max-w-2xl">
        <header className="mb-8">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex text-sm"
            style={{ color: "var(--on-surface-variant)" }}
          >
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Profil & Pengaturan</h1>
        </header>

        {(message || error) && (
          <div
            className="mb-4 rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: error
                ? "var(--error)"
                : "rgba(91,255,161,.4)",
              color: error ? "var(--error)" : "var(--green)",
              background: "var(--surface-low)",
            }}
          >
            {error || message}
          </div>
        )}

        <section className="glass mb-6 rounded-2xl p-6">
          <h2 className="mb-6 text-xl font-bold">Profil Kamu</h2>

          {/* Avatar Section */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              {avatarUrl ? (
                <div className="relative h-20 w-20 overflow-hidden rounded-full">
                  <Image
                    src={avatarUrl}
                    alt="Foto Profil"
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized
                  />
                </div>
              ) : (
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold"
                  style={{
                    background: "var(--green)",
                    color: "var(--on-green)",
                  }}
                >
                  {initial}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-black/20 transition-opacity disabled:opacity-50"
                style={{ background: "var(--surface-container)" }}
                title="Ganti foto profil"
              >
                {uploading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <span className="material-symbols-outlined text-base">
                    photo_camera
                  </span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>
          <p
            className="mb-6 text-center text-xs"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Klik ikon kamera untuk unggah foto (maks. 2MB)
          </p>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm">Nama Lengkap</span>
              <input
                className="bd-input w-full rounded-lg px-4 py-3"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm">Username</span>
              <div className="flex rounded-lg bd-input">
                <span
                  className="px-4 py-3"
                  style={{ color: "var(--on-surface-variant)" }}
                >
                  @
                </span>
                <input
                  className="w-full bg-transparent py-3 pr-4 outline-none"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm">Email</span>
              <div
                className="flex items-center gap-2 rounded-lg px-4 py-3"
                style={{
                  background: "var(--surface-container)",
                  color: "var(--on-surface-variant)",
                }}
              >
                <span className="material-symbols-outlined text-base">
                  lock
                </span>
                {email}
              </div>
            </label>
            <button
              onClick={save}
              disabled={saving}
              className="w-full rounded-xl py-3 font-bold disabled:opacity-50"
              style={{
                background: "var(--green)",
                color: "var(--on-green)",
              }}
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </section>

        <section className="glass mb-6 rounded-2xl p-6">
          <h2 className="mb-4 text-xl font-bold">Password & Keamanan</h2>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">Ganti Password</p>
              <p
                className="text-sm"
                style={{ color: "var(--on-surface-variant)" }}
              >
                Perbarui password akun kamu
              </p>
            </div>
            <button
              onClick={reset}
              className="rounded-xl border px-4 py-2 font-semibold"
              style={{ borderColor: "var(--outline-variant)" }}
            >
              Ganti Password
            </button>
          </div>
        </section>

        <section className="glass rounded-2xl p-6">
          <h2
            className="mb-3 text-xl font-bold"
            style={{ color: "var(--error)" }}
          >
            Hapus Akun
          </h2>
          <p
            className="mb-4 text-sm"
            style={{ color: "var(--on-surface-variant)" }}
          >
            Tindakan ini tidak dapat dibatalkan. Semua data event dan akunmu
            akan dihapus permanen.
          </p>
          <button
            onClick={() => setDeleteOpen(true)}
            className="rounded-xl border px-4 py-2 font-semibold"
            style={{ borderColor: "var(--error)", color: "var(--error)" }}
          >
            Hapus Akun Saya
          </button>
        </section>
      </main>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="glass w-full max-w-md rounded-2xl p-6">
            <h3 className="mb-4 text-xl font-bold">
              Hapus akun secara permanen?
            </h3>
            <input
              className="bd-input mb-4 w-full rounded-lg px-4 py-3"
              placeholder="Ketik DELETE untuk konfirmasi"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-xl border py-3"
                onClick={() => setDeleteOpen(false)}
                style={{ borderColor: "var(--outline-variant)" }}
              >
                Cancel
              </button>
              <button
                disabled={deleteText !== "DELETE"}
                onClick={remove}
                className="flex-1 rounded-xl py-3 font-bold disabled:opacity-50"
                style={{
                  background: "var(--error)",
                  color: "var(--on-error)",
                }}
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}