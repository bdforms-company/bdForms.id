/**
 * Cron Manager — app/api/cron/trigger-reminder/route.ts
 *
 * Triggered by Vercel Cron (see vercel.json or next.config crons section).
 * Queries Supabase for participants whose event is happening today and who
 * have not yet received a reminder, then fans each task out to Upstash QStash.
 *
 * Returns 200 immediately — does NOT wait for emails to be sent —
 * so Vercel's 10-second serverless timeout is never hit.
 *
 * ⚠️  Prerequisites — run once via Supabase SQL Editor before deploying:
 *
 *   ALTER TABLE participants
 *     ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;
 *
 *   ALTER TABLE events
 *     ADD COLUMN IF NOT EXISTS event_date date;
 *
 *   CREATE INDEX IF NOT EXISTS idx_participants_reminder
 *     ON participants(event_id, reminder_sent) WHERE reminder_sent = false;
 *
 * ⚠️  Environment variables required (add to .env.local and Vercel dashboard):
 *   QSTASH_TOKEN            — from Upstash QStash console
 *   CRON_SECRET             — a long random string (e.g. `openssl rand -hex 32`)
 *   NEXT_PUBLIC_APP_URL     — production URL, e.g. https://www.bdforms.id
 *                             (Vercel auto-provides VERCEL_URL in deployment)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of a row returned by the joined Supabase query below. */
interface ParticipantRow {
  id: string;
  name: string;
  email: string;
  qr_token: string;
  event_id: string;
  events: {
    name: string;
    event_date: string; // "yyyy-mm-dd"
  } | null;
}

interface QStashPublishResult {
  participantId: string;
  status: "queued" | "skipped" | "error";
  reason?: string;
}

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

/**
 * Vercel Cron attaches `Authorization: Bearer <CRON_SECRET>` when the secret
 * is configured in vercel.json / Vercel dashboard.
 * If CRON_SECRET is absent the check is bypassed (local dev convenience only).
 */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const qstashToken = process.env.QSTASH_TOKEN;
  if (!qstashToken) {
    console.error("[cron/trigger-reminder] QSTASH_TOKEN is not set");
    return NextResponse.json(
      { ok: false, error: "QStash not configured" },
      { status: 500 },
    );
  }

  // ── 1. Resolve today's date in WIB (Asia/Jakarta, UTC+7) ─────────────────
  // Using Intl ensures correctness even when the serverless runtime runs in UTC.
  const todayWib = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // e.g. "2026-07-05"

  // ── 2. Fetch participants who need a reminder today ───────────────────────
  const supabase = createSupabaseAdminClient();

  const { data: participants, error: dbError } = await supabase
    .from("participants")
    .select(
      `
        id,
        name,
        email,
        qr_token,
        event_id,
        events!inner (
          name,
          event_date
        )
      `,
    )
    .eq("reminder_sent", false)
    .not("email", "is", null)
    .not("email", "eq", "")
    .eq("events.event_date", todayWib)
    .returns<ParticipantRow[]>();

  if (dbError) {
    console.error("[cron/trigger-reminder] Supabase query error:", dbError);
    return NextResponse.json({ ok: false, error: dbError.message }, { status: 500 });
  }

  if (!participants || participants.length === 0) {
    return NextResponse.json({
      ok: true,
      message: "No participants need reminders today.",
      date: todayWib,
      queued: 0,
    });
  }

  // ── 3. Build the absolute URL for the email worker ───────────────────────
  // VERCEL_URL is injected automatically by Vercel in preview / production.
  // Provide NEXT_PUBLIC_APP_URL for production canonical domain if you need it.
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
  const workerUrl = `${baseUrl}/api/email/worker`;

  // ── 4. Fan-out: publish one QStash message per participant ───────────────
  const results: QStashPublishResult[] = [];

  for (const p of participants) {
    if (!p.events) {
      results.push({
        participantId: p.id,
        status: "skipped",
        reason: "event join data missing",
      });
      continue;
    }

    const payload = {
      participantId: p.id,
      participantName: p.name,
      email: p.email,
      qrToken: p.qr_token,
      eventName: p.events.name,
      eventDate: p.events.event_date,
    };

    try {
      const qstashRes = await fetch(
        `https://qstash.upstash.io/v2/publish/${encodeURIComponent(workerUrl)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${qstashToken}`,
            "Content-Type": "application/json",
            // QStash defaults: 3 retries with exponential back-off.
            // Uncomment to override:
            // "Upstash-Retries": "5",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!qstashRes.ok) {
        const errText = await qstashRes.text();
        console.error(
          `[cron/trigger-reminder] QStash publish failed for ${p.id}:`,
          qstashRes.status,
          errText,
        );
        results.push({ participantId: p.id, status: "error", reason: errText });
      } else {
        results.push({ participantId: p.id, status: "queued" });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`[cron/trigger-reminder] Fetch error for ${p.id}:`, message);
      results.push({ participantId: p.id, status: "error", reason: message });
    }
  }

  // ── 5. Summary log and instant 200 response ───────────────────────────────
  const queued = results.filter((r) => r.status === "queued").length;
  const errors = results.filter((r) => r.status === "error").length;
  const skipped = results.filter((r) => r.status === "skipped").length;

  console.log(
    `[cron/trigger-reminder] date=${todayWib} total=${participants.length} queued=${queued} errors=${errors} skipped=${skipped}`,
  );

  return NextResponse.json({
    ok: true,
    date: todayWib,
    total: participants.length,
    queued,
    errors,
    skipped,
    results,
  });
}

// Vercel Cron supports GET; expose POST alias for convenience / manual testing.
export { GET as POST };
