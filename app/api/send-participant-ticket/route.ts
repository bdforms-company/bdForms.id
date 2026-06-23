import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";

const QR_OPTIONS = {
  width: 300,
  margin: 1,
  color: { dark: "#000000", light: "#FFFFFF" },
} as const;

async function getQrImageSrc(qrToken: string): Promise<string> {
  const qrBuffer = await QRCode.toBuffer(qrToken, QR_OPTIONS);
  const filename = `${qrToken}.png`;

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
            <td style="padding: 0 0 24px 0;">
              <img src="${escapeHtml(bannerUrl)}" alt="${escapeHtml(eventName)}" width="100%" style="max-width: 100%; border-radius: 12px; display: block;" />
            </td>
          </tr>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0a0c0c;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0a0c0c;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <tr>
            <td style="padding: 0 0 24px 0; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; color: #5bffa1;">⬡ bdForms</td>
          </tr>
          <tr>
            <td style="padding: 0 0 8px 0; font-family: Arial, sans-serif; font-size: 20px; font-weight: bold; color: #e8eaed;">Hai, ${escapeHtml(participantName)} 👋</td>
          </tr>
          <tr>
            <td style="padding: 0 0 24px 0; font-family: Arial, sans-serif; font-size: 16px; color: #8a9299;">Pendaftaran kamu untuk <span style="color: #e8eaed; font-weight: bold;">${escapeHtml(eventName)}</span> berhasil!</td>
          </tr>
          ${bannerRow}
          <tr>
            <td style="padding: 0 0 24px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f1212; border: 1px solid #1e2a2c; border-radius: 16px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <img src="${qrDataUrl}" width="240" alt="QR Code" style="display: block; margin: 0 auto 20px auto;" />
                    <p style="margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 22px; font-weight: bold; color: #e8eaed;">${escapeHtml(participantName)}</p>
                    <p style="margin: 0 0 4px 0; font-family: Arial, sans-serif; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #8a9299;">KODE CADANGAN</p>
                    <p style="margin: 0 0 24px 0; font-family: monospace; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #5bffa1;">${escapeHtml(backupCode)}</p>
                    <p style="margin: 0; font-family: Arial, sans-serif; font-size: 13px; color: #8a9299;">Tunjukkan QR ini saat check-in. Screenshot atau download email ini sebagai cadangan.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 0 0 0; border-top: 1px solid #1e2a2c; font-family: Arial, sans-serif; font-size: 12px; color: #8a9299; text-align: center;">
              Powered by <span style="color: #5bffa1;">bdForms</span>
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

    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY!,
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
