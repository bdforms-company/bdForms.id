import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const ALLOWED_ORIGINS = [
  "https://www.bdforms.id",
  "https://bdforms.id",
  ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000"] : []),
];

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin") ?? request.headers.get("referer") ?? "";
  return ALLOWED_ORIGINS.some((o) => origin.startsWith(o));
}

// Per-instance in-memory rate limiter (5 req/IP/min).
// On Vercel serverless this is per-function-instance only, not cross-instance.
// For production-scale rate limiting, replace with @upstash/ratelimit + Redis.
const ipLimitMap = new Map<string, { count: number; reset: number }>();

function isRateLimited(request: Request): boolean {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const now = Date.now();
  const entry = ipLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    ipLimitMap.set(ip, { count: 1, reset: now + 60_000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

const QR_OPTIONS = {
  width: 300,
  margin: 1,
  color: { dark: "#000000", light: "#FFFFFF" },
} as const;

async function getQrImageSrc(qrToken: string): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const qrBuffer = await QRCode.toBuffer(qrToken, QR_OPTIONS);
  const filename = `${crypto.randomUUID()}.png`;

  try {
    const { error: uploadError } = await supabase.storage
      .from("qr-temp")
      .upload(filename, qrBuffer, { contentType: "image/png", upsert: true });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("qr-temp").getPublicUrl(filename);
    return data.publicUrl;
  } catch (uploadErr) {
    console.warn("QR upload to Supabase failed, falling back to base64:", uploadErr);
    return QRCode.toDataURL(qrToken, QR_OPTIONS);
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmailHtml(
  participantName: string,
  eventName: string,
  qrDataUrl: string,
  backupCode: string,
  bannerUrl?: string,
) {
  const bannerRow = bannerUrl
    ? `<tr>
            <td style="padding:0 0 24px 0;">
              <img src="${escapeHtml(bannerUrl)}" width="600" style="max-width:100%;border-radius:12px;display:block;" alt="${escapeHtml(eventName)}" />
            </td>
          </tr>`
    : "";

  return `<!DOCTYPE html>
<html>
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

          <!-- Header: Logo + Brand -->
          <tr>
            <td style="padding:0 0 24px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-size:20px;font-weight:700;color:#0066FF;">⚡ bdForms</span>
                  </td>
                  <td align="right">
                    <span style="font-size:12px;color:#5A6580;">Tiket Digital</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:0 0 8px 0;font-size:24px;font-weight:700;color:#0A0F1E;">
              Hai, ${escapeHtml(participantName)} 👋
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 24px 0;font-size:15px;color:#5A6580;">
              Pendaftaran kamu untuk <strong style="color:#0A0F1E;">${escapeHtml(eventName)}</strong> berhasil!
            </td>
          </tr>

          <!-- Banner (if exists) -->
          ${bannerRow}

          <!-- Ticket Card -->
          <tr>
            <td style="padding:0 0 24px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:#FFFFFF;border:2px solid #0066FF;border-radius:16px;overflow:hidden;">

                <!-- Ticket Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#0066FF,#00C8FF);padding:20px 24px;">
                    <p style="margin:0;font-size:11px;font-weight:600;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:0.1em;">Tiket Masuk</p>
                    <p style="margin:4px 0 0 0;font-size:18px;font-weight:700;color:#FFFFFF;">${escapeHtml(eventName)}</p>
                  </td>
                </tr>

                <!-- QR Code -->
                <tr>
                  <td align="center" style="padding:32px 24px 16px 24px;">
                    <img src="${escapeHtml(qrDataUrl)}" width="220" height="220"
                      style="display:block;border:1px solid #E0E8FF;border-radius:12px;padding:12px;background:#FFFFFF;"
                      alt="QR Code" />
                  </td>
                </tr>

                <!-- Participant Name -->
                <tr>
                  <td align="center" style="padding:0 24px 8px 24px;">
                    <p style="margin:0;font-size:22px;font-weight:700;color:#0A0F1E;">${escapeHtml(participantName)}</p>
                  </td>
                </tr>

                <!-- Backup Code -->
                <tr>
                  <td align="center" style="padding:0 24px 24px 24px;">
                    <p style="margin:0 0 4px 0;font-size:10px;font-weight:600;color:#5A6580;text-transform:uppercase;letter-spacing:0.15em;">Kode Cadangan</p>
                    <p style="margin:0;font-size:28px;font-weight:700;color:#0066FF;font-family:monospace;letter-spacing:0.2em;">${escapeHtml(backupCode)}</p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding:0 24px;">
                    <hr style="border:none;border-top:1px dashed #E0E8FF;margin:0;" />
                  </td>
                </tr>

                <!-- Footer instruction -->
                <tr>
                  <td align="center" style="padding:16px 24px;background:#F8FAFF;">
                    <p style="margin:0;font-size:13px;color:#5A6580;">
                      Tunjukkan QR ini saat check-in. Screenshot atau simpan email ini sebagai cadangan.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Tips -->
          <tr>
            <td style="padding:0 0 24px 0;background:#EEF3FF;border-radius:12px;padding:16px 20px;">
              <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;color:#0066FF;">💡 Tips</p>
              <ul style="margin:0;padding:0 0 0 16px;font-size:12px;color:#5A6580;line-height:1.6;">
                <li>Screenshot tiket ini sebagai cadangan</li>
                <li>Datang 15 menit sebelum acara dimulai</li>
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

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  if (isRateLimited(request)) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }
  try {
    const body = await request.json();
    const { email, participantName, eventName, qrToken, backupCode, bannerUrl } = body;

    if (!email || !participantName || !eventName || !qrToken || !backupCode) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const qrImageSrc = await getQrImageSrc(qrToken);

    const htmlBody = buildEmailHtml(
      participantName,
      eventName,
      qrImageSrc,
      backupCode,
      bannerUrl,
    );

    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      console.error("BREVO_API_KEY is not set");
      return NextResponse.json({ ok: false, error: "Email service not configured" }, { status: 500 });
    }

    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": brevoApiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME,
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email, name: participantName }],
        subject: `🎟️ Tiket Event ${eventName} — bdForms`,
        htmlContent: htmlBody,
      }),
    });

    if (!brevoRes.ok) {
      const errBody = await brevoRes.text();
      console.error("Brevo error:", brevoRes.status, errBody);
      return NextResponse.json(
        { ok: false, error: `Brevo API error: ${brevoRes.status}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-participant-ticket error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
