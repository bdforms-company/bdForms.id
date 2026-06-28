"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/auth/login");
      } else {
        setAuthed(true);
      }
      setChecking(false);
    });
  }, [router]);

  if (checking) {
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

  if (!authed) return null;
  return <>{children}</>;
}
