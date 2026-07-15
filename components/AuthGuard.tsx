"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading && !session) {
      router.push("/auth/login");
    }
  }, [loading, session, router]);

  if (loading) {
    return (
      <div className="bd flex min-h-screen items-center justify-center">
        <span
          className="material-symbols-outlined animate-spin text-5xl"
          style={{ color: "var(--green)" }}
        >
          progress_activity
        </span>
      </div>
    );
  }

  if (!session) return null;
  return <>{children}</>;
}
