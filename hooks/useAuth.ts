import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Clear legacy local storage tokens if they exist
    if (typeof window !== "undefined") {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("sb-")) {
            localStorage.removeItem(key);
            i--; // Adjust index since we removed an item
          }
        }
      } catch (e) {
        console.error("Failed to clean up legacy tokens:", e);
      }
    }

    async function checkSession() {
      // First check memory (in case it was already set)
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        if (active) {
          setSession(currentSession);
          setLoading(false);
        }
        return;
      }

      // If not in memory, fetch it from the secure server endpoint
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const { session: serverSession } = await res.json();
          if (serverSession) {
            await supabase.auth.setSession({
              access_token: serverSession.access_token,
              refresh_token: serverSession.refresh_token,
            });
            if (active) setSession(serverSession);
          } else {
            if (active) setSession(null);
          }
        } else {
          if (active) setSession(null);
        }
      } catch (error) {
        console.error("Failed to load secure session:", error);
        if (active) setSession(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    checkSession();

    // Listen for auth state changes to update local state/memory
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (active) {
        setSession(newSession);
      }
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && newSession) {
        try {
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session: newSession }),
          });
        } catch (error) {
          console.error("Failed to sync session cookie:", error);
        }
      } else if (event === "SIGNED_OUT") {
        try {
          await fetch("/api/auth/signout", { method: "POST" });
        } catch (error) {
          console.error("Failed to clear session cookie:", error);
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading, user: session?.user ?? null };
}
