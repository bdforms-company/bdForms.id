import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

/**
 * Reliable check-in endpoint (service role).
 * Used by the offline scanner when the batch_check_in RPC is unavailable
 * or when client-side updates are blocked by RLS.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tokens: unknown = body?.tokens;
    const scannerToken: unknown = body?.scannerToken;

    if (!Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json({ error: "tokens required" }, { status: 400 });
    }

    const cleanTokens = tokens
      .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
      .map((t) => t.trim());

    if (cleanTokens.length === 0) {
      return NextResponse.json({ error: "tokens required" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    // Optional: bind updates to a valid scanner session when provided
    if (typeof scannerToken === "string" && scannerToken.trim()) {
      const { data: ev, error: evErr } = await admin
        .from("events")
        .select("id")
        .eq("scanner_token", scannerToken.trim())
        .gt("scanner_token_expires_at", new Date().toISOString())
        .eq("status", "active")
        .maybeSingle();

      if (evErr || !ev?.id) {
        return NextResponse.json({ error: "Invalid or expired scanner token" }, { status: 403 });
      }

      const { data, error } = await admin
        .from("participants")
        .update({
          is_checked_in: true,
          check_in_time: new Date().toISOString(),
        })
        .in("qr_token", cleanTokens)
        .eq("event_id", ev.id)
        .eq("is_checked_in", false)
        .select("qr_token, is_checked_in, check_in_time");

      if (error) {
        console.error("[check-in] update failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ updated: data?.length ?? 0, rows: data ?? [] });
    }

    // Without scanner token: update any matching unchecked tokens
    // (preserves first check-in time by only touching unchecked rows)
    const { data, error } = await admin
      .from("participants")
      .update({
        is_checked_in: true,
        check_in_time: new Date().toISOString(),
      })
      .in("qr_token", cleanTokens)
      .eq("is_checked_in", false)
      .select("qr_token, is_checked_in, check_in_time");

    if (error) {
      console.error("[check-in] update failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ updated: data?.length ?? 0, rows: data ?? [] });
  } catch (err) {
    console.error("[check-in] exception:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
