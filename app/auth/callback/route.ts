import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next") ?? "/dashboard";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
      });

      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          return NextResponse.redirect(new URL(next, requestUrl.origin));
        }
        console.error("Auth callback error during exchangeCodeForSession:", error);
      } catch (err) {
        console.error("Auth callback exception during exchange:", err);
      }
    }
  }

  return NextResponse.redirect(
    new URL("/auth/login?error=Auth_Callback_Failed", requestUrl.origin),
  );
}
