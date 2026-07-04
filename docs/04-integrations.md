# Integrations & Native APIs

This document records the configuration and logic flow of third-party integrations (Resend, Brevo, Sentry) and native browser integrations (Canvas API).

---

## 📧 Transactional Email Pipelines

To optimize deliverability and separation of duties, **bdForms** uses two distinct email pipelines: **Resend** for organizer management notices and **Brevo** for attendee ticketing.

Both endpoints employ security measures:
1.  **CORS Restriction:** Only requests coming from `https://www.bdforms.id`, `https://bdforms.id`, and `http://localhost:3000` (in development mode) are allowed.
2.  **Rate Limiting:** IP tracking map enforces a maximum of 5 requests per IP address per minute:
    ```typescript
    const ipLimitMap = new Map<string, { count: number; reset: number }>();
    ```

---

### 1. Resend (Organizer Onboarding Links)
*   **Endpoint:** `/app/api/send-organizer-links/route.ts`
*   **Initialization:** Mapped via the `@resend` client library.
    ```typescript
    import { Resend } from "resend";
    const resend = new Resend(process.env.RESEND_API_KEY);
    ```
*   **Workflow:**
    1.  Receives request containing: `email`, `eventName`, `regLink`, `scanLink`, and `dashLink`.
    2.  Pulls sender credentials from environment (`RESEND_SENDER_NAME` and `RESEND_SENDER_EMAIL`) with fallback to `"bdForms <onboarding@resend.dev>"`.
    3.  Transmits custom dark-themed email using `resend.emails.send()`.

---

### 2. Brevo (Participant QR Tickets)
*   **Endpoint:** `/app/api/send-participant-ticket/route.ts`
*   **Integration Method:** Direct REST HTTP requests to Brevo SMTP API v3 using `fetch`.
*   **Workflow:**
    1.  Receives participant token, email, and event description data.
    2.  **QR Generation:** Converts `qr_token` to an image buffer using `qrcode` library.
    3.  **Supabase Upload:** Generates a random file path and uploads the buffer to `qr-temp` bucket:
        ```typescript
        const qrBuffer = await QRCode.toBuffer(qrToken, QR_OPTIONS);
        const { error: uploadError } = await supabase.storage
          .from("qr-temp")
          .upload(filename, qrBuffer, { contentType: "image/png", upsert: true });
        ```
    4.  **Fallback:** If the storage upload fails, the system converts the QR code directly to a base64 Data URL.
    5.  **SMTP Payload Delivery:** Sends a POST request to `https://api.brevo.com/v3/smtp/email` with header API key `BREVO_API_KEY`.
        ```typescript
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
        ```

---

## 🛡️ Sentry Error Monitoring

Sentry is integrated directly into Next.js.

### 1. Initialization Config Files
Configuration files in the root folder setup Sentry across environments using the same DSN:
`https://3acc4be1916a581037976ba2b8c8636b@o4511642152468480.ingest.us.sentry.io/4511642160463872`

-   **`sentry.server.config.ts`:** Handles server-side errors.
-   **`sentry.edge.config.ts`:** Captures edge runtime errors (e.g. middleware, edge API routing).
-   **`instrumentation-client.ts`:** Initializes Sentry client configurations to catch browser errors.

```typescript
// Example config schema used across configurations
Sentry.init({
  dsn: "https://3acc4be1916a581037976ba2b8c8636b@o4511642152468480.ingest.us.sentry.io/4511642160463872",
  tracesSampleRate: 1,      // Logs 100% of transaction performance data
  enableLogs: true,         // Allows debugging output in development consoles
  sendDefaultPii: true,     // Transmits user information to identify failing profiles
});
```

### 2. Runtime Hooking (`instrumentation.ts`)
Next.js `register()` hook dynamically imports server or edge configs depending on runtime type:
```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
export const onRequestError = Sentry.captureRequestError;
```
For client-side routing transitions, `instrumentation-client.ts` exports:
```typescript
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
```

---

## ✍️ Canvas Digital Signature Pad

A digital signature is captured client-side using `components/SignaturePad.tsx`. It provides a native HTML5 2D Canvas context wrapper.

### Technical Implementation

```
[Pointer Event: onPointerDown] ─► getPos(e) ─► beginPath() ─► moveTo(x, y) ─► setPointerCapture()
                                                                                     │
[Pointer Event: onPointerMove] ──────────────────────────────────────────────────────┴──► lineTo(x, y) ─► stroke() ─► set dirty=true
                                                                                     │
[Pointer Event: onPointerUp] ────────────────────────────────────────────────────────┴──► drawing=false
```

1.  **Fixed Internal Resolution:** The canvas has internal drawing coordinates set to $600 \times 200$ pixels:
    ```typescript
    const W = 600;
    const H = 200;
    ```
    This resolution remains constant while CSS properties scale the element responsively (`width: "100%", height: "auto"`).
2.  **Coordinate Scaling:** Dynamic client bounding coordinates are translated to match internal dimensions:
    ```typescript
    const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (W / rect.width),
        y: (e.clientY - rect.top) * (H / rect.height),
      };
    };
    ```
3.  **JPEG Compatibility Fill:** The canvas fills its background with `#ffffff` on mount. This prevents transparency rendering as transparent black (default behavior) in JPEG format:
    ```typescript
    const fillWhite = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
    };
    ```
4.  **Compression Output:** The component exposes handlers via `useImperativeHandle`. `toJPEG` applies a quality factor of `0.3` to produce a highly-compressed Base64 JPEG data URL:
    ```typescript
    useImperativeHandle(ref, () => ({
      toJPEG: (quality = 0.3) => canvasRef.current!.toDataURL("image/jpeg", quality),
      clear: () => {
        const ctx = canvasRef.current!.getContext("2d")!;
        fillWhite(ctx);
        dirty.current = false;
      },
      isEmpty: () => !dirty.current,
    }));
    ```
    This compressed string is saved directly as a text block in the `participants.signature_url` column, bypassing the need for storage buckets.
