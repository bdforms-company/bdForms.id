import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!anonKey) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  return createServerClient(url, anonKey, {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({
            name,
            value,
            ...options,
            httpOnly: true,
            maxAge: 31536000, // 1 year
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "development" ? false : true,
          });
        },
        remove(name, options) {
          cookieStore.set({
            name,
            value: "",
            ...options,
            httpOnly: true,
            maxAge: 0,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "development" ? false : true,
          });
        },
      },
    },
  );
}
