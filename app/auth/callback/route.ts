import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function serializeAuthError(error: unknown) {
  if (!error || typeof error !== "object") {
    return { raw: String(error) };
  }

  const authError = error as {
    message?: string;
    name?: string;
    status?: number;
    code?: string;
    cause?: unknown;
  };

  return {
    message: authError.message,
    name: authError.name,
    status: authError.status,
    code: authError.code,
    cause:
      authError.cause instanceof Error
        ? {
            message: authError.cause.message,
            name: authError.cause.name,
            stack: authError.cause.stack,
          }
        : authError.cause,
    stack: error instanceof Error ? error.stack : undefined,
  };
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next") ?? "/dashboard";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";
  let failureReason = "unknown";

  if (!code) {
    failureReason = "missing_oauth_code";
    console.error("[auth/callback] Redirecting to Auth_Callback_Failed:", {
      failureReason,
      url: requestUrl.toString(),
      searchParams: Object.fromEntries(requestUrl.searchParams.entries()),
    });
    return NextResponse.redirect(
      new URL("/auth/login?error=Auth_Callback_Failed", requestUrl.origin),
    );
  }

  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const requestCookies = cookieStore.getAll();
  const authRelatedCookies = requestCookies
    .map(({ name }) => name)
    .filter((name) => name.includes("auth") || name.startsWith("sb-"));

  if (!supabaseUrl || !supabaseAnonKey) {
    failureReason = "missing_supabase_env";
    console.error("[auth/callback] Redirecting to Auth_Callback_Failed:", {
      failureReason,
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasSupabaseAnonKey: Boolean(supabaseAnonKey),
      authRelatedCookies,
      cookieCount: requestCookies.length,
    });
    return NextResponse.redirect(
      new URL("/auth/login?error=Auth_Callback_Failed", requestUrl.origin),
    );
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: "pkce",
    },
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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    failureReason = "exchange_code_for_session_failed";
    console.error("[auth/callback] Redirecting to Auth_Callback_Failed:", {
      failureReason,
      error: serializeAuthError(error),
      hasSession: Boolean(data?.session),
      authRelatedCookies,
      cookieCount: requestCookies.length,
      codeLength: code.length,
      next,
      origin: requestUrl.origin,
    });
  } catch (err) {
    failureReason = "exchange_code_for_session_threw";
    console.error("[auth/callback] Redirecting to Auth_Callback_Failed:", {
      failureReason,
      error: serializeAuthError(err),
      authRelatedCookies,
      cookieCount: requestCookies.length,
      codeLength: code.length,
      next,
      origin: requestUrl.origin,
    });
  }

  return NextResponse.redirect(
    new URL("/auth/login?error=Auth_Callback_Failed", requestUrl.origin),
  );
}
