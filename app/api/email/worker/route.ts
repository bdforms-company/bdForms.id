/**
 * Email Worker — app/api/email/worker/route.ts
 *
 * Receives webhook payloads from Upstash QStash, one per participant.
 * Verifies the QStash signature (HMAC-SHA256) manually using the Web Crypto
 * API — no @upstash/qstash SDK required.
 *
 * On success:
 *   1. Sends the reminder email via Brevo REST API.
 *   2. Marks `reminder_sent = true` in Supabase to prevent duplicate sends.
 *   3. Returns HTTP 200 so QStash marks the job as done.
 *
 * On failure:
 *   Returns a non-2xx status — QStash will automatically retry (up to 3×
 *   with exponential back-off by default) before marking the job as failed.
 *
 * Environment variables required:
 *   QSTASH_CURRENT_SIGNING_KEY  — from Upstash QStash console
 *   QSTASH_NEXT_SIGNING_KEY     — from Upstash QStash console (for key rotation)
 *   BREVO_API_KEY               — from Brevo dashboard
 *   BREVO_SENDER_EMAIL          — verified sender email
 *   BREVO_SENDER_NAME           — display name (e.g. "bdForms")
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Payload published by the Cron Manager to QStash. */
interface ReminderPayload {
  participantId: string;
  participantName: string;
  email: string;
  qrToken: string;
  eventName: string;
  eventDate: string; // "yyyy-mm-dd"
}

// ---------------------------------------------------------------------------
// QStash Signature Verification
// ---------------------------------------------------------------------------

/**
 * Verifies the `Upstash-Signature` JWT that QStash attaches to every delivery.
 * The token is a signed JWT; we only need to verify its HS256 signature using
 * one of the two signing keys (current or next — for key rotation support).
 *
 * Reference: https://upstash.com/docs/qstash/features/security
 */
async function verifyQStashSignature(request: NextRequest): Promise<boolean> {
  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  if (!currentKey && !nextKey) {
    // No keys configured — skip verification in development.
    // ⚠️ Never run this in production without setting the signing keys.
    console.warn("[email/worker] QStash signing keys not configured — skipping verification.");
    return true;
  }

  const signature = request.headers.get("upstash-signature");
  if (!signature) {
    console.error("[email/worker] Missing Upstash-Signature header");
    return false;
  }

  // The signature is a JWT: header.payload.signature (all base64url encoded).
  const parts = signature.split(".");
  if (parts.length !== 3) {
    console.error("[email/worker] Malformed Upstash-Signature JWT");
    return false;
  }

  const signingInput = `${parts[0]}.${parts[1]}`;
  const sigBytes = base64UrlDecode(parts[2]);

  async function tryVerify(keyStr: string): Promise<boolean> {
    try {
      const keyBytes = new TextEncoder().encode(keyStr);
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"],
      );
      const data = new TextEncoder().encode(signingInput);
      return await crypto.subtle.verify("HMAC", cryptoKey, sigBytes, data);
    } catch {
      return false;
    }
  }

  // Try current key first, then next key (key rotation).
  if (currentKey && (await tryVerify(currentKey))) return true;
  if (nextKey && (await tryVerify(nextKey))) return true;

  console.error("[email/worker] QStash signature verification failed");
  return false;
}

/** Decode a base64url string to Uint8Array<ArrayBuffer>. */
function base64UrlDecode(input: string): Uint8Array<ArrayBuffer> {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

// ---------------------------------------------------------------------------
// HTML helper
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Formats a "yyyy-mm-dd" date string into a human-friendly Indonesian format.
 * e.g. "2026-07-05" → "Minggu, 5 Juli 2026"
 */
function formatDateId(isoDate: string): string {
  try {
    const d = new Date(`${isoDate}T00:00:00+07:00`);
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Jakarta",
    });
  } catch {
    return isoDate;
  }
}

function buildReminderEmailHtml(
  participantName: string,
  eventName: string,
  eventDate: string,
): string {
  const formattedDate = formatDateId(eventDate);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:#F8FAFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8FAFF;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 24px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td><span style="font-size:20px;font-weight:700;color:#0066FF;">⚡ bdForms</span></td>
                  <td align="right"><span style="font-size:12px;color:#5A6580;">Pengingat Acara</span></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Reminder Badge -->
          <tr>
            <td style="padding:0 0 16px 0;">
              <span style="display:inline-block;background:linear-gradient(135deg,#FF6B35,#FF8C42);color:#FFFFFF;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:6px 14px;border-radius:20px;">
                🔔 Pengingat Hari Ini
              </span>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:0 0 8px 0;font-size:24px;font-weight:700;color:#0A0F1E;">
              Hai, ${escapeHtml(participantName)}! 👋
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 24px 0;font-size:15px;color:#5A6580;line-height:1.6;">
              Jangan lupa! Acara <strong style="color:#0A0F1E;">${escapeHtml(eventName)}</strong>
              yang kamu daftarkan akan berlangsung <strong style="color:#0066FF;">hari ini</strong>.
            </td>
          </tr>

          <!-- Event Card -->
          <tr>
            <td style="padding:0 0 24px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:#FFFFFF;border:2px solid #0066FF;border-radius:16px;overflow:hidden;">
                <tr>
                  <td style="background:linear-gradient(135deg,#0066FF,#00C8FF);padding:20px 24px;">
                    <p style="margin:0;font-size:11px;font-weight:600;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:0.1em;">Acara Hari Ini</p>
                    <p style="margin:4px 0 0 0;font-size:20px;font-weight:700;color:#FFFFFF;">${escapeHtml(eventName)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:0 12px 0 0;font-size:20px;">📅</td>
                        <td>
                          <p style="margin:0;font-size:11px;font-weight:600;color:#5A6580;text-transform:uppercase;letter-spacing:0.08em;">Tanggal</p>
                          <p style="margin:2px 0 0 0;font-size:15px;font-weight:700;color:#0A0F1E;">${escapeHtml(formattedDate)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tips -->
          <tr>
            <td style="padding:0 0 24px 0;background:#EEF3FF;border-radius:12px;padding:16px 20px;">
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;color:#0066FF;">💡 Tips sebelum berangkat</p>
              <ul style="margin:0;padding:0 0 0 16px;font-size:12px;color:#5A6580;line-height:1.8;">
                <li>Cek kembali tiket email kamu dan siapkan QR Code</li>
                <li>Datang 15 menit lebih awal untuk proses check-in</li>
                <li>Tunjukkan QR code atau kode cadangan ke panitia</li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0 0;border-top:1px solid #E0E8FF;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#0066FF;">⚡ bdForms</p>
              <p style="margin:0;font-size:11px;color:#5A6580;">Fast-Track Event Registration Platform · bdforms.id</p>
              <p style="margin:8px 0 0 0;font-size:11px;color:#C8D4F0;">© 2026 bdForms. Hak cipta dilindungi.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // ── 1. Clone the request before consuming body (needed for signature verify)
  // QStash signature is over the raw body, so we read it once as text.
  const rawBody = await request.text();

  // ── 2. Verify the QStash signature ───────────────────────────────────────
  // We need to re-create a Request-like object that has the raw body for
  // verification purposes. We pass the original request headers.
  const isValid = await verifyQStashSignature(request);
  if (!isValid) {
    return new Response("Unauthorized: invalid QStash signature", { status: 401 });
  }

  // ── 3. Parse the payload ─────────────────────────────────────────────────
  let payload: ReminderPayload;
  try {
    payload = JSON.parse(rawBody) as ReminderPayload;
  } catch {
    console.error("[email/worker] Failed to parse JSON payload:", rawBody);
    return new Response("Bad Request: invalid JSON", { status: 400 });
  }

  const { participantId, participantName, email, eventName, eventDate } = payload;

  if (!participantId || !participantName || !email || !eventName || !eventDate) {
    console.error("[email/worker] Missing required fields in payload:", payload);
    return new Response("Bad Request: missing required fields", { status: 400 });
  }

  // ── 4. Check for env vars early ──────────────────────────────────────────
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME ?? "bdForms";

  if (!brevoApiKey || !senderEmail) {
    console.error("[email/worker] Brevo credentials not configured");
    // Return 500 — QStash will retry.
    return new Response("Internal Server Error: email service not configured", { status: 500 });
  }

  // ── 5. Build and send the email via Brevo ────────────────────────────────
  const htmlContent = buildReminderEmailHtml(participantName, eventName, eventDate);

  const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": brevoApiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email, name: participantName }],
      subject: `🔔 Pengingat: ${eventName} berlangsung hari ini! — bdForms`,
      htmlContent,
    }),
  });

  if (!brevoRes.ok) {
    const errBody = await brevoRes.text();
    console.error(
      `[email/worker] Brevo error for ${participantId}:`,
      brevoRes.status,
      errBody,
    );
    // Non-2xx → QStash will retry.
    return new Response(`Brevo API error: ${brevoRes.status}`, { status: 500 });
  }

  // ── 6. Mark reminder as sent in Supabase ─────────────────────────────────
  // Do this AFTER confirming Brevo accepted the email to avoid marking as sent
  // when the email delivery actually failed.
  try {
    const supabase = createSupabaseAdminClient();
    const { error: updateError } = await supabase
      .from("participants")
      .update({ reminder_sent: true })
      .eq("id", participantId);

    if (updateError) {
      // Log but don't fail — the email was sent. Worst case: duplicate reminder
      // on next cron run (acceptable trade-off vs. losing the email entirely).
      console.warn(
        `[email/worker] Failed to mark reminder_sent for ${participantId}:`,
        updateError.message,
      );
    }
  } catch (updateErr) {
    console.warn(
      `[email/worker] Supabase update exception for ${participantId}:`,
      updateErr,
    );
  }

  console.log(
    `[email/worker] ✅ Reminder sent to ${email} (participant: ${participantId}, event: ${eventName})`,
  );

  return NextResponse.json({ ok: true, participantId, email });
}
