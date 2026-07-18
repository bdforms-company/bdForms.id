# Changelog

All notable changes to the **bdForms** platform will be documented in this file.

---

## [2026-07-19]

### Added
- **Persistent Dashboard Sidebar Shell**:
  - Implemented client layout in [layout.tsx](file:///home/nblauliadka/02_Work/Today/bdForms.id/app/dashboard/layout.tsx) containing collapsible side navigation.
  - Wrapped all subpages under `/dashboard` (Central Dashboard, Analytic Event, Kalender Event) inside a single parent [AuthGuard](file:///home/nblauliadka/02_Work/Today/bdForms.id/components/AuthGuard.tsx) wrapper.
  - Created subpages: [analytics](file:///home/nblauliadka/02_Work/Today/bdForms.id/app/dashboard/analytics/page.tsx) (aggregated stats cards and event overview) and [calendar](file:///home/nblauliadka/02_Work/Today/bdForms.id/app/dashboard/calendar/page.tsx) (visual calendar schedule).
- **Postgres Grouping Summary RPC**:
  - Added [get_event_summary](file:///home/nblauliadka/02_Work/Today/bdForms.id/migrations/add_summarize_analytics_rpc.sql) RPC function to group and aggregate registrations and check-ins by dynamic question fields or preset columns (e.g. Instansi) in DB.
  - Implemented dropdown selector and summary tables on event dashboard [page.tsx](file:///home/nblauliadka/02_Work/Today/bdForms.id/app/dashboard/events/[eventId]/page.tsx) displaying attendance ratio progress bars.
- **Observed Sentry Integration**:
  - Added Sentry exception logging on scanner check-in batch failure in [useScannerStore.ts](file:///home/nblauliadka/02_Work/Today/bdForms.id/store/useScannerStore.ts).
  - Wired Sentry capture to registration catch block in [RegisterClient.tsx](file:///home/nblauliadka/02_Work/Today/bdForms.id/app/register/RegisterClient.tsx) and auth login catch block in [LoginClient.tsx](file:///home/nblauliadka/02_Work/Today/bdForms.id/app/auth/login/LoginClient.tsx).

### Changed
- **Auth Cookie Synchronization**:
  - Updated [useAuth.ts](file:///home/nblauliadka/02_Work/Today/bdForms.id/hooks/useAuth.ts) to clear legacy local storage `sb-` tokens on load and sync `SIGNED_IN` / `TOKEN_REFRESHED` states directly to `/api/auth/session` to update HTTP-only cookies.
- **Durable Scanner Hydration UX**:
  - Tracked `hydrated` and synchronization states in [useScannerStore.ts](file:///home/nblauliadka/02_Work/Today/bdForms.id/store/useScannerStore.ts), stalling initialization until Zustand cache is rehydrated.
  - Upgraded [page.tsx](file:///home/nblauliadka/02_Work/Today/bdForms.id/app/scan/page.tsx) to prevent overwriting local scans with staler fetched server data, and render sync count/failure messages.
  - Added a state guard checking `.getState() === 3` before calling `.resume()` in the scanner, resolving browser exceptions.
- **Improved Mobile QR Ticket Downloads**:
  - Upgraded [RegisterClient.tsx](file:///home/nblauliadka/02_Work/Today/bdForms.id/app/register/RegisterClient.tsx) to render QR tickets as an `<img>` tag converted dynamically from canvas, enabling long-press manual saving.
  - Custom filename downloads formatted as `Tiket_QR_${safeName}.png` with input sanitization.

---

## [2026-07-12]

### Added
- **Persistent HTTP-Only Session Cookies:**
  - Implemented secure, long-lived authentication cookies (max-age: 1 year / 31,536,000 seconds) in `middleware.ts` and `lib/supabase-server.ts`.
  - Added Server-Side protected route enforcement redirects for `/dashboard`, `/create`, and `/profile`.
  - Configured client-side Supabase client with `persistSession: false` to mitigate XSS vulnerabilities by removing JWT storage from `localStorage`.
  - Created `/api/auth/session` endpoint for client-side rehydration and session synchronization.
  - Created `/api/auth/signout` endpoint for complete server-side session termination and cookie clearing.
  - Added a custom React `useAuth` hook and integrated it into the `AuthGuard` component for seamless session population.
- **Immortal Offline Zustand Persistence:**
  - Integrated Zustand `persist` middleware inside `store/useScannerStore.ts` utilizing `idb-keyval` (IndexedDB) as a custom storage engine for disaster mitigation.
  - Partitioned state persistence via `partialize` to selectively keep `participants` (lookups) and `syncQueue` (check-ins) across device restarts, browser tab closures, or power cuts.
  - Added automated background synchronization via `onRehydrateStorage` callback to push lingering offline check-ins from `syncQueue` immediately upon rehydration.
  - Refactored `syncToServer()` to guarantee idempotency and concurrency protection through optimistic deduplication and lock-free processing.
- **D-Day Mitigation Batch (10,000+ Concurrent Attendees):**
  - Created a database migration function `batch_check_in(tokens text[])` in `migrations/add_batch_checkin_rpc.sql` to execute batch check-in updates in a single transaction.
  - Refactored `syncToServer()` in `store/useScannerStore.ts` to utilize the new batch check-in RPC, avoiding connection pool exhaustion and parallel request overhead.
  - Added **Standby Mode / Pause Camera** in `app/scan/page.tsx` using `html5-qrcode` pause/resume controls to prevent thermal throttling and device battery drain.
  - Added **Manual Check-in** input below the active camera feed, allowing O(1) lookups by token or fallback name searches.
  - Implemented a **Post-Registration QR Download Modal** in `app/register/RegisterClient.tsx` that forces attendees to download their ticket QR code to their local device (`tiket-bdforms.png`) immediately after registering, eliminating D-Day email bottleneck issues.
