import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
if (!supabaseAnonKey) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");

// NOTE: Do NOT pass `auth: { persistSession: false }` here.
// That option suppresses PKCE code_verifier cookie storage in @supabase/ssr,
// which breaks Google OAuth — the callback route gets AuthPKCECodeVerifierMissingError
// because the verifier was never written before the redirect to Google.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: "pkce",
  },
});

export const EVENT_ID = process.env.NEXT_PUBLIC_EVENT_ID ?? "";
