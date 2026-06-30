import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

const FALLBACK_SENDER = "bdForms <onboarding@resend.dev>";

function getResendFrom(): string {
  const name = process.env.RESEND_SENDER_NAME;
  const email = process.env.RESEND_SENDER_EMAIL;
  if (name && email) {
    return `${name} <${email}>`;
  }
  console.warn(
    "RESEND_SENDER_NAME and/or RESEND_SENDER_EMAIL not set, using fallback sender",
  );
  return FALLBACK_SENDER;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmailHtml(
  eventName: string,
  regLink: string,
  scanLink: string,
  dashLink: string,
) {
  const fontFamily =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
  const monoFamily =
    "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace";

  const sections = [
    {
      emoji: "",
      label: "PENDAFTARAN PESERTA",
      description:
        "Bagikan link ini ke peserta via WhatsApp, email, atau sosmed.",
      link: regLink,
    },
    {
      emoji: "",
      label: "SCANNER PANITIA",
      description:
        "Buka link ini di divice panitia untuk check-in QR di hari-H.",
      link: scanLink,
    },
    {
      emoji: "",
      label: "DASHBOARD PEMANTAUAN",
      description:
        "Pantau real-time siapa sudah daftar, kuota sisa, dan export data.",
      link: dashLink,
    },
  ];

  const linkCards = sections
    .map(
      (s, i) => `
          <tr>
            <td style="padding: 0 0 ${i < sections.length - 1 ? "16px" : "0"} 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f1212; border: 1px solid #1e2a2c; border-radius: 12px;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-family: ${fontFamily}; font-size: 20px; line-height: 1; vertical-align: middle;">
                          <span style="font-size: 20px;">${s.emoji}</span>
                          <span style="margin-left: 8px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #8a9299; vertical-align: middle;">${escapeHtml(s.label)}</span>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 12px 0 0 0; font-family: ${fontFamily}; font-size: 14px; line-height: 1.5; color: #8a9299;">${escapeHtml(s.description)}</p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px;">
                      <tr>
                        <td style="padding: 12px; background-color: #1a1f1f; border-radius: 8px; font-family: ${monoFamily}; font-size: 12px; line-height: 1.5; color: #e8eaed; word-break: break-all;">${escapeHtml(s.link)}</td>
                      </tr>
                    </table>
                    <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px;">
                      <tr>
                        <td style="border-radius: 8px; background-color: #5bffa1;">
                          <a href="${escapeHtml(s.link)}" style="display: inline-block; padding: 12px 20px; font-family: ${fontFamily}; font-size: 14px; font-weight: bold; color: #0a0c0c; text-decoration: none;">Buka Link &rarr;</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
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

          <!-- Hero -->
          <tr>
            <td style="padding: 32px; background-color: #0f1212; border: 1px solid #1e2a2c; border-radius: 16px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family: ${fontFamily}; font-size: 18px; font-weight: bold; color: #5bffa1; vertical-align: middle;">&#11041; bdForms</td>
                  <td align="right" style="font-family: ${fontFamily}; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #5bffa1; vertical-align: middle;">EVENT DIBUAT</td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="height: 24px; line-height: 24px; font-size: 1px;">&nbsp;</td></tr>
              </table>
              <p style="margin: 0; font-family: ${fontFamily}; font-size: 28px; font-weight: bold; line-height: 1.3; color: #e8eaed;">Event kamu siap diluncurkan &#128640;</p>
              <p style="margin: 12px 0 0 0; font-family: ${fontFamily}; font-size: 14px; line-height: 1.5; color: #8a9299;">Mode offline-first sudah aktif. Bagikan link di bawah ke peserta &amp; panitia kamu.</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
                <tr>
                  <td style="padding: 16px 20px; background-color: #1a1f1f; border-radius: 12px; border-left: 3px solid #5bffa1; font-family: ${fontFamily}; font-size: 20px; font-weight: bold; line-height: 1.3; color: #e8eaed;">${escapeHtml(eventName)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Link cards spacer -->
          <tr><td style="height: 16px; line-height: 16px; font-size: 1px;">&nbsp;</td></tr>

          ${linkCards}

          <!-- Tips -->
          <tr>
            <td style="padding: 16px 0 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0a1812; border: 1px solid rgba(91,255,161,0.2); border-radius: 12px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; font-family: ${fontFamily}; font-size: 14px; font-weight: bold; color: #5bffa1;">&#128161; Tips</p>
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding: 0 0 6px 0; font-family: ${fontFamily}; font-size: 13px; line-height: 1.5; color: #8a9299;">&bull;&nbsp; Simpan email ini sebagai backup link</td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 6px 0; font-family: ${fontFamily}; font-size: 13px; line-height: 1.5; color: #8a9299;">&bull;&nbsp; Scanner tetap jalan walaupun sinyal hilang</td>
                      </tr>
                      <tr>
                        <td style="font-family: ${fontFamily}; font-size: 13px; line-height: 1.5; color: #8a9299;">&bull;&nbsp; Bisa edit detail event kapan saja dari dashboard</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
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

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  if (isRateLimited(request)) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
  }
  try {
    const body = await request.json();
    const { email, eventName, regLink, scanLink, dashLink } = body;

    if (!email || !eventName || !regLink || !scanLink || !dashLink) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await resend.emails.send({
      from: getResendFrom(),
      to: email,
      subject: `Link Event "${eventName}" — bdForms`,
      html: buildEmailHtml(eventName, regLink, scanLink, dashLink),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-organizer-links error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
