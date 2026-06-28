"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import "../../design.css";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.updateUser({ password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/auth/login?message=Password berhasil diubah.");
  };

  if (urlError) {
    return (
      <div className="bd flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="material-symbols-outlined text-6xl" style={{ color: "var(--error)" }}>error</span>
        <h1 className="text-2xl font-bold">Link Tidak Valid atau Sudah Expired</h1>
        <p className="max-w-sm text-sm" style={{ color: "var(--on-surface-variant)" }}>
          Link reset password ini sudah tidak berlaku. Silakan minta link baru.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/auth/forgot-password" className="rounded-lg px-6 py-3 font-bold" style={{ background: "var(--green)", color: "var(--on-green)" }}>
            Minta Link Baru
          </Link>
          <Link href="/auth/login" className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bd flex min-h-screen flex-col items-center px-4 pt-20">
      <div className="glass w-full max-w-md rounded-2xl p-8">
        <h1 className="mb-8 text-center text-2xl font-bold">Reset Password</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password Baru"
            required
            minLength={8}
            className="bd-input w-full rounded-lg px-4 py-3"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Konfirmasi Password Baru"
            required
            className="bd-input w-full rounded-lg px-4 py-3"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 font-bold disabled:opacity-50"
            style={{ background: "var(--green)", color: "var(--on-green)" }}
          >
            {loading ? "Menyimpan..." : "Simpan Password"}
          </button>
          {error && <p className="text-center text-sm" style={{ color: "var(--error)" }}>{error}</p>}
        </form>

        <p className="mt-6 text-center text-sm">
          <Link href="/auth/login" style={{ color: "var(--on-surface-variant)" }}>
            ← Kembali ke login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="bd flex min-h-screen items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-5xl" style={{ color: "var(--green)" }}>progress_activity</span>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
