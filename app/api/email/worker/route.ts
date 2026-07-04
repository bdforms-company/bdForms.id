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
// HTML helpers  (dark-mode design system — matches send-organizer-links)
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

/**
 * Builds the "Day of Event" morning reminder email.
 *
 * Design system cloned from send-organizer-links/route.ts:
 *   bg        #0a0c0c  (outer)
 *   card      #0f1212  (inner containers)
 *   border    #1e2a2c
 *   accent    #5bffa1  (neon green)
 *   text-hi   #e8eaed
 *   text-lo   #8a9299  (muted)
 *   cta-bg    #5bffa1  → ink #0a0c0c
 *
 * @param participantName  Recipient's name
 * @param eventName        Name of the event
 * @param eventDate        ISO date string "yyyy-mm-dd"
 * @param qrToken          QR token used to generate the check-in QR code URL
 */
function buildReminderEmailHtml(
  participantName: string,
  eventName: string,
  eventDate: string,
  qrToken: string,
): string {
  const formattedDate = formatDateId(eventDate);
  const fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

  // Generate a QR code image URL via the free Google Charts QR API so the
  // email client can render the code inline without needing a Supabase bucket.
  const qrSize = 220;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrToken)}&format=png&margin=10`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0c0c;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0a0c0c;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">

          <!-- ═══════════════════════ HERO ═══════════════════════ -->
          <tr>
            <td style="padding: 32px; background-color: #0f1212; border: 1px solid #1e2a2c; border-radius: 16px;">

              <!-- Logo row -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family: ${fontFamily}; font-size: 18px; font-weight: bold; color: #5bffa1; vertical-align: middle;">&#11041; bdForms</td>
                  <td align="right" style="font-family: ${fontFamily}; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #5bffa1; vertical-align: middle;">HARI-H EVENT</td>
                </tr>
              </table>

              <!-- Spacer -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="height: 24px; line-height: 24px; font-size: 1px;">&nbsp;</td></tr>
              </table>

              <!-- Hero heading -->
              <p style="margin: 0; font-family: ${fontFamily}; font-size: 28px; font-weight: bold; line-height: 1.3; color: #e8eaed;">Hari Ini Harinya! &#128640;</p>

              <!-- Body copy -->
              <p style="margin: 12px 0 0 0; font-family: ${fontFamily}; font-size: 14px; line-height: 1.6; color: #8a9299;">Halo <strong style="color: #e8eaed;">${escapeHtml(participantName)}</strong>, bersiaplah! Event <strong style="color: #5bffa1;">${escapeHtml(eventName)}</strong> berlangsung hari ini. Jangan sampai telat dan siapkan QR Code tiketmu di bawah ini untuk check-in.</p>

              <!-- Event name pill -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
                <tr>
                  <td style="padding: 16px 20px; background-color: #1a1f1f; border-radius: 12px; border-left: 3px solid #5bffa1; font-family: ${fontFamily}; font-size: 20px; font-weight: bold; line-height: 1.3; color: #e8eaed;">${escapeHtml(eventName)}</td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height: 16px; line-height: 16px; font-size: 1px;">&nbsp;</td></tr>

          <!-- ═══════════════════════ DATE CARD ══════════════════ -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f1212; border: 1px solid #1e2a2c; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family: ${fontFamily}; font-size: 20px; line-height: 1; vertical-align: middle;">
                          <span style="font-size: 20px;">&#128197;</span>
                          <span style="margin-left: 8px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #8a9299; vertical-align: middle;">TANGGAL ACARA</span>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 12px 0 0 0; font-family: ${fontFamily}; font-size: 18px; font-weight: bold; line-height: 1.4; color: #e8eaed;">${escapeHtml(formattedDate)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height: 16px; line-height: 16px; font-size: 1px;">&nbsp;</td></tr>

          <!-- ═══════════════════════ QR CODE CARD ═══════════════ -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f1212; border: 1px solid #1e2a2c; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px;">

                    <!-- Section label -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family: ${fontFamily}; font-size: 20px; line-height: 1; vertical-align: middle;">
                          <span style="font-size: 20px;">&#128248;</span>
                          <span style="margin-left: 8px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #8a9299; vertical-align: middle;">QR CODE CHECK-IN</span>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 12px 0 0 0; font-family: ${fontFamily}; font-size: 14px; line-height: 1.5; color: #8a9299;">Tunjukkan QR code ini ke panitia saat tiba di lokasi acara.</p>

                    <!-- QR image -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
                      <tr>
                        <td align="center">
                          <table cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; padding: 16px; display: inline-block;">
                            <tr>
                              <td align="center" style="padding: 16px;">
                                <img src="${escapeHtml(qrUrl)}" width="${qrSize}" height="${qrSize}" alt="QR Code Check-in" style="display: block; border: 0;" />
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA button -->
                    <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
                      <tr>
                        <td style="border-radius: 8px; background-color: #5bffa1;">
                          <span style="display: inline-block; padding: 12px 24px; font-family: ${fontFamily}; font-size: 14px; font-weight: bold; color: #0a0c0c; text-decoration: none;">&#9989; Siap Check-in!</span>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height: 16px; line-height: 16px; font-size: 1px;">&nbsp;</td></tr>

          <!-- ═══════════════════════ TIPS ═══════════════════════ -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0a1812; border: 1px solid rgba(91,255,161,0.2); border-radius: 12px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; font-family: ${fontFamily}; font-size: 14px; font-weight: bold; color: #5bffa1;">&#128161; Tips hari-H</p>
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding: 0 0 6px 0; font-family: ${fontFamily}; font-size: 13px; line-height: 1.5; color: #8a9299;">&bull;&nbsp; Datang 15 menit lebih awal untuk check-in lancar</td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 6px 0; font-family: ${fontFamily}; font-size: 13px; line-height: 1.5; color: #8a9299;">&bull;&nbsp; Screenshot QR ini sebagai cadangan jika sinyal lemah</td>
                      </tr>
                      <tr>
                        <td style="font-family: ${fontFamily}; font-size: 13px; line-height: 1.5; color: #8a9299;">&bull;&nbsp; Jika QR error, tunjukkan kode pendaftaran ke panitia</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══════════════════════ FOOTER ════════════════════ -->
          <tr>
            <td style="padding: 32px 0 0 0; border-top: 1px solid #1e2a2c; text-align: center;">
              <p style="margin: 0 0 12px 0; font-family: ${fontFamily}; font-size: 14px; font-weight: bold; color: #5bffa1;">&#11041; bdForms</p>
              <p style="margin: 0 0 8px 0; font-family: ${fontFamily}; font-size: 12px; line-height: 1.5; color: #8a9299;">Powered by bdForms &mdash; Fast-Track Event Registration</p>
              <p style="margin: 0 0 12px 0; font-family: ${fontFamily}; font-size: 12px; line-height: 1.5;">
                <a href="https://bdforms.id" style="color: #5bffa1; text-decoration: none;">bdforms.id</a>
              </p>
              <p style="margin: 0; font-family: ${fontFamily}; font-size: 11px; line-height: 1.5; color: #8a9299;">&copy; 2026 bdForms. Built for speed.</p>
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
  const htmlContent = buildReminderEmailHtml(participantName, eventName, eventDate, payload.qrToken);

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
      subject: `🚀 Hari Ini Harinya! ${eventName} — bdForms`,
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
