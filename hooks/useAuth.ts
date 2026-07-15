import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (active) {
        setSession(newSession);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading, user: session?.user ?? null };
}
