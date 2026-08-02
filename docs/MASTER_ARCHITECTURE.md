# Master Architecture - Regesit

## Overview
Regesit is an offline-first event registration and fast-track check-in SaaS. This document serves as the master source of truth for the project infrastructure.

## Technology Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5+
- **Runtime:** Serverless (Vercel) & Edge (Middleware/Instrumentation)
- **BaaS:** Supabase (Auth, DB, Storage, Edge Functions)
- **State Management:** Zustand (Offline Scanner Cache)
- **Observability:** Sentry (Distributed Tracing)

## Core Folder Structure
- `app/`: Routing, API routes, Layouts, Dashboard.
- `components/`: UI components, AuthGuard, SignaturePad.
- `hooks/`: `useAuth.ts` (Secure cookie-based auth session management).
- `lib/`: Supabase client helpers (Server/Admin/Client), Utilities.
- `migrations/`: SQL migration scripts (RPCs, Schema updates).
- `store/`: Zustand stores.

## Data Flow
1. **Auth:** Uses `HTTP-only` cookies via `middleware.ts` + `/api/auth/session` to prevent XSS. Browser client is memory-only.
2. **Registration:** `client` -> `participants` table (Supabase).
3. **Ticketing:** `API route` -> `Supabase Storage` (QR) -> `Brevo` (SMTP Email).
4. **Offline Scanning:** `Zustand` local cache -> `html5-qrcode` -> `syncQueue` (background sync to DB).
5. **Analytics:** `Database RPCs` (e.g., `get_event_summary`) for high-performance aggregations.
