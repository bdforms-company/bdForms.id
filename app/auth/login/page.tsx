import { Suspense } from "react";
import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Masuk — bdForms",
  description: "Masuk ke akun bdForms untuk mengelola event kamu.",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bd flex min-h-screen items-center justify-center">
          <span
            className="material-symbols-outlined animate-spin text-5xl"
            style={{ color: "var(--primary)" }}
          >
            progress_activity
          </span>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
