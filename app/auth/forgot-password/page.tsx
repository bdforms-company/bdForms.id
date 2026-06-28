"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import "../../design.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setFieldError("Email wajib diisi."); return; }
    if (!EMAIL_REGEX.test(email.trim())) { setFieldError("Format email tidak valid."); return; }
    setFieldError(null);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/reset-password` });
      if (authError) setError("Terjadi kesalahan koneksi. Coba lagi.");
      else setSuccess(true);
    } catch {
      setError("Terjadi kesalahan koneksi. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bd flex min-h-screen flex-col items-center px-4 pt-20">
      <div className="glass w-full max-w-md rounded-2xl p-8">
        <h1 className="mb-8 text-center text-2xl font-bold">Lupa Password</h1>
        {success ? <p className="mb-6 text-center text-sm" style={{ color: "var(--green)" }}>Jika email terdaftar, link reset password sudah dikirim ke email kamu.</p> : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div><input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setFieldError(null); }} placeholder="Email" className={`bd-input w-full rounded-lg px-4 py-3${fieldError ? " !border-[var(--error)]" : ""}`} />{fieldError && <p className="mt-1 text-xs" style={{ color: "var(--error)" }}>{fieldError}</p>}</div>
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold disabled:opacity-50" style={{ background: "var(--green)", color: "var(--on-green)" }}>{loading && <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>}{loading ? "Mengirim..." : "Kirim Link Reset"}</button>
            {error && <p className="text-center text-sm" style={{ color: "var(--error)" }}>{error}</p>}
          </form>
        )}
        <p className="mt-6 text-center text-sm"><Link href="/auth/login" style={{ color: "var(--on-surface-variant)" }}>← Kembali ke login</Link></p>
      </div>
    </div>
  );
}
