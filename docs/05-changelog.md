# Changelog

All notable changes to the **bdForms** platform will be documented in this file.

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
