"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import "../../design.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const successMessage = searchParams.get("message");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "Email wajib diisi.";
    else if (!EMAIL_REGEX.test(email.trim())) errors.email = "Format email tidak valid.";
    if (!password) errors.password = "Password wajib diisi.";
    else if (password.length < 8) errors.password = "Password minimal 8 karakter.";
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) {
        const msg = authError.message.toLowerCase();
        if (msg.includes("invalid") || msg.includes("credentials")) setError("Email atau password salah.");
        else if (msg.includes("not confirmed") || msg.includes("not verified")) setError("Email belum diverifikasi. Cek inbox kamu.");
        else setError(authError.message);
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Terjadi kesalahan koneksi. Coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="bd relative flex min-h-screen flex-col items-center px-4 pt-20">
      <button onClick={() => router.push("/")} className="absolute top-6 left-6 flex items-center gap-1 text-sm" style={{ color: "var(--on-surface-variant)" }}><span className="material-symbols-outlined text-base">arrow_back</span>Beranda</button>
      <Link href="/" className="mb-8 text-2xl font-bold" style={{ color: "var(--green)" }}>⬡ bdForms</Link>
      <div className="glass w-full max-w-md rounded-2xl p-8">
        <h1 className="mb-8 text-center text-2xl font-bold">Masuk ke bdForms</h1>
        {successMessage && <p className="mb-4 text-center text-sm" style={{ color: "var(--green)" }}>{successMessage}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }} placeholder="Email" className={`bd-input w-full rounded-lg px-4 py-3${fieldErrors.email ? " !border-[var(--error)]" : ""}`} />
            {fieldErrors.email && <p className="mt-1 text-xs" style={{ color: "var(--error)" }}>{fieldErrors.email}</p>}
          </div>
          <div>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }} placeholder="Password" className={`bd-input w-full rounded-lg px-4 py-3 pr-12${fieldErrors.password ? " !border-[var(--error)]" : ""}`} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute top-1/2 right-3 -translate-y-1/2" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}><span className="material-symbols-outlined text-xl" style={{ color: "var(--on-surface-variant)" }}>{showPassword ? "visibility_off" : "visibility"}</span></button>
            </div>
            {fieldErrors.password && <p className="mt-1 text-xs" style={{ color: "var(--error)" }}>{fieldErrors.password}</p>}
          </div>
          <div className="text-right"><Link href="/auth/forgot-password" className="text-xs" style={{ color: "var(--on-surface-variant)" }}>Lupa password?</Link></div>
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold disabled:opacity-50" style={{ background: "var(--green)", color: "var(--on-green)" }}>
            {loading && <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>}{loading ? "Memproses..." : "Masuk"}
          </button>
          {error && <p className="text-center text-sm" style={{ color: "var(--error)" }}>{error}</p>}
        </form>
        <div className="my-6 flex items-center gap-3"><div className="h-px flex-1" style={{ background: "var(--outline-variant)" }} /><span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>atau</span><div className="h-px flex-1" style={{ background: "var(--outline-variant)" }} /></div>
        <button
          onClick={async () => {
            await supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: `${window.location.origin}/auth/callback`,
              },
            });
          }}
          className="w-full flex items-center justify-center gap-3 rounded-xl border py-3 font-medium transition-colors hover:bg-white/5"
          style={{ borderColor: "var(--outline-variant)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Masuk dengan Google
        </button>
        <p className="mt-6 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>Belum punya akun? <Link href="/auth/signup" className="font-semibold" style={{ color: "var(--green)" }}>Daftar sekarang</Link></p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="bd flex min-h-screen items-center justify-center"><span className="material-symbols-outlined animate-spin text-5xl" style={{ color: "var(--green)" }}>progress_activity</span></div>}><LoginForm /></Suspense>;
}
