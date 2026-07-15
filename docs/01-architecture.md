# System Architecture & Technical Stack

This document details the core frameworks, folder structures, and data flows that govern the **bdForms** application.

---

## 🛠️ Technology Stack

The platform is designed around a modern, typing-strict, and high-performance stack:

1. **Framework:** Next.js 16 (specifically `16.2.6`) utilizing the **App Router** for layout hierarchies, server actions, and route handling.
2. **Runtime & UI Logic:** React 19 (`19.2.4`) paired with TypeScript (`^5`) for component safety.
3. **Styling & Presentation:** Tailwind CSS 4 (`^4` with `@tailwindcss/postcss`) providing compiled, efficient CSS variables alongside a custom design library defined in `app/design.css`.
4. **Backend-as-a-Service:** Supabase (using `@supabase/supabase-js` `^2.106.2` and `@supabase/ssr` `^0.12.0` for cookie-based auth state synchronization between server and client).
5. **State Management:** Zustand (`^5.0.14`) orchestrating the O(1) in-memory scanner lookup cache and offline write queuing.
6. **Error Observability:** Sentry (`@sentry/nextjs` `^10.62.0`) tracing client, server, and edge runtime operations.

---

## 📂 App Router Directory Structure

The project organizes its routing and logic as follows:

```text
bdForms/
├── app/
│   ├── api/
│   │   ├── send-organizer-links/     # Sends onboarding links to organizers via Resend
│   │   └── send-participant-ticket/  # Generates QR, uploads to Storage, sends to Brevo
│   ├── auth/
│   │   ├── callback/                 # OAuth code exchange route handler
│   │   ├── login/                    # Login page
│   │   ├── reset-password/           # Password update screen
│   │   └── signup/                   # Signup flow using Supabase Auth + profile seeding
│   ├── create/
│   │   ├── package/                  # Package verification and checks
│   │   └── page.tsx                  # Event creation dashboard (custom slugs, fields)
│   ├── dashboard/
│   │   ├── events/
│   │   │   └── [eventId]/            # Event management, analytics, settings & export
│   │   └── page.tsx                  # Central organizer dashboard index
│   ├── doc/
│   │   └── [slug]/                   # Redirect handler forwarding shortslugs to assets
│   ├── e/
│   │   └── [slug]/                   # Clean, SEO-friendly custom slugs routing to register
│   ├── register/
│   │   └── page.tsx                  # Event registration form with canvas signature pad
│   ├── scan/
│   │   └── page.tsx                  # Panitia scanner console (HTML5-QR, local Zustand)
│   ├── layout.tsx                    # Root HTML wrapper and metadata defaults
│   ├── globals.css                   # Global styles overriding Tailwind 4 utilities
│   └── design.css                    # Design token classes and theme values
├── components/
│   ├── ui/                           # Primitive components (button, card, input, switch, toast)
│   ├── AuthGuard.tsx                 # Client-side session enforcement component
│   ├── FAQAccordion.tsx              # Dynamic, styling-compliant accordion for landers
│   ├── SiteNav.tsx                   # Main navigation header with context links
│   ├── ThemeToggle.tsx               # Switch for surface light/dark themes
│   └── SignaturePad.tsx              # Native HTML5 2D Canvas digital signature handler
├── store/
│   └── useScannerStore.ts            # Zustand offline sync store
└── lib/
    ├── notifications.ts              # System notification generation logic
    ├── packages.ts                   # Tier constants (Starter, Standard, Pro, Enterprise)
    ├── supabase.ts                   # Client-side Supabase Browser Client wrapper
    ├── supabase-server.ts            # Server-side cookie-based Supabase Client helper
    ├── supabase-admin.ts             # Service role-based Supabase client (bypass RLS)
    └── types.ts                      # Core Type declarations (Participant, FieldConfig, etc.)
```

---

## 🔄 Client-Server Data Flow

```
+───────────────────+       (1) Submit Form        +────────────────────+
│   Registration    ├─────────────────────────────>│   Supabase DB      │
│  Client (/register)│                              │   `participants`   │
+───────────────────+                              +─────────┬──────────+
                                                             │
                                                             │ (2) Trigger Ticket
                                                             ▼
+───────────────────+       (4) SMTP Post          +────────────────────+
│   Brevo API       │<─────────────────────────────│  API Route Handler │
│  (Send Email)     │                              │(/send-participant) │
+───────────────────+                              +─────────┬──────────+
                                                             │
                                                             │ (3) Upload QR
                                                             ▼
                                                   +────────────────────+
                                                   │  Supabase Storage  │
                                                   │    (`qr-temp`)     │
                                                   +────────────────────+
```

### 1. Participant Registration Flow
1. **Input Submission:** A participant visits `/e/[slug]` (which redirects to `/register?eventId=[uuid]`). They enter their details, sign using the Canvas pad, and click Register.
2. **Database Record Creation:** The client-side form invokes a direct client query on the Supabase `participants` table. This creates a new participant record with:
   - Form fields maps (e.g., `name`, `email`).
   - Signature converted to a Base64-compressed JPEG string stored directly in the `signature_url` column.
   - Dynamic Custom Questionnaire maps saved under `custom_data`.
   - Preset inputs (e.g., `phone`, `institution`) saved under `extra_data`.
3. **Auth User Linking:** If the participant is currently authenticated during submission, `user_id` is back-populated to link the participant profile to their account.

### 2. Transactional Ticketing Flow
1. **API Trigger:** After a successful insert response, the client requests the API endpoint `/api/send-participant-ticket` with the new registration parameters.
2. **QR Upload to Storage:**
   - The API uses `createSupabaseAdminClient` to bypass public restrictions.
   - It generates a QR Code image buffer representing the unique `qr_token` of the participant.
   - It uploads this PNG buffer to the `qr-temp` Supabase storage bucket under a random UUID name.
   - It retrieves the public URL for inclusion in the ticket email template.
3. **Mailing via Brevo:** The handler triggers a `POST` to Brevo SMTP (`https://api.brevo.com/v3/smtp/email`) with the custom HTML email template including the generated QR Code image and the backup code.

### 3. Check-In Validating & Syncing Flow
1. **Initialization:** Panitia logs into `/scan?eventId=[uuid]` or `/scan?token=[scanner_token]`. The client fetches **all** participant rows matching `event_id` into the local Zustand store using `fetchInitialData`.
2. **Scanning:**
   - The device camera captures a QR code via `html5-qrcode`.
   - The client invokes `validateScan(qrToken)` in Zustand.
   - Lookups are checked in $\mathcal{O}(1)$ time against the client-side `participants` record map.
3. **Local Check-In:** If verified, `processCheckIn(qrToken)` immediately marks the participant `is_checked_in = true` and updates `check_in_time` locally. This ensures zero delay for the operator.
4. **Queue Processing:** The participant's `qr_token` is appended to the Zustand `syncQueue` array. `syncToServer()` is invoked in a fire-and-forget fashion.
5. **Server Reconciliation:** `syncToServer` iterates over queued items, executing Supabase updates. Successful synchronizations are removed from `syncQueue`. Failed requests (e.g., due to local signal drop) remain in the queue and retry on subsequent scans.

### 4. Persistent Login & XSS Mitigation Flow

To protect organizer accounts and prevent session theft through Cross-Site Scripting (XSS), the authentication strategy is built on secure, server-managed state:

1. **HTTP-Only Session Cookies:**
   - On the server, `createSupabaseServerClient` and the Next.js `middleware.ts` configure authentication cookies with `httpOnly: true`, `secure: true`, `sameSite: "lax"`, and a lifespan of 1 year (`maxAge: 31536000`).
   - This prevents browser-side scripts from reading, modifying, or exporting the session JWTs, securing them against XSS.
2. **In-Memory Browser Client:**
   - The browser-side Supabase client (`lib/supabase.ts`) is initialized with `auth.persistSession = false`, completely preventing write operations to `localStorage` or `sessionStorage`.
3. **Session Rehydration & Hooks:**
   - On application load, the custom `useAuth` hook triggers a secure server request to `/api/auth/session` which reads the `httpOnly` session cookies.
   - If an active session is returned, the hook updates the browser client memory via `supabase.auth.setSession(...)`.
   - Subsequent client-side database reads/writes fetch the session directly from memory without writing to disk.
4. **Invalidation & Sign Out:**
   - When an organizer logs out, the client triggers a POST request to `/api/auth/signout`. The server-side client performs the sign-out operation, instructing the browser to immediately clear all authentication cookies (setting `maxAge: 0` and clearing values).
