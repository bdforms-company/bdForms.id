# Offline-First QR Scanner Architecture

This document covers the technical implementation of the offline-first QR scanning mechanism, detailing state tracking, synchronization, and the lifecycle of a check-in ticket validation.

---

## 🏗️ State Design & Persistence: `useScannerStore`

The client-side scanner logic utilizes a Zustand store in `store/useScannerStore.ts` backed by **IndexedDB** via the `idb-keyval` storage library. This architecture guarantees that cached lookups and pending check-ins survive browser closures, app restarts, or device power failures during offline execution.

### Persistence Strategy (IndexedDB)
1. **Target States:** Only the `participants` lookup map and the `syncQueue` array are persisted to IndexedDB using Zustand's `persist` middleware.
2. **Selective State Partitioning (`partialize`):** Ephemeral UI and camera states (such as `isReady`, `cameraError`, and `lastScanned`) are excluded from storage and reset on reload.
3. **Disaster Recovery Rehydration (`onRehydrateStorage`):** When the application reloads, the store automatically fetches the cached states from IndexedDB. If any check-ins remain in the `syncQueue` (meaning the device went offline and closed), the store triggers a background `syncToServer()` run immediately upon successful rehydration.

### Store Interface Structure
```typescript
interface ScannerStore {
  // State
  participants: Record<string, Participant>; // Key = qr_token -> lookups in O(1) (Persisted)
  syncQueue: string[];                        // Array of qr_tokens pending sync to server (Persisted)
  cameraError: boolean;                       // Camera access failure flag
  isReady: boolean;                           // Initial database download status
  totalCount: number;                         // Total count tracking indicator
  lastScanned: Participant | null;            // Last analyzed participant record
  hydrated: boolean;                          // Zustand IndexedDB hydration status
  isSyncing: boolean;                         // True if synchronization API request is active
  syncError: string | null;                   // Error message of last sync attempt

  // Actions
  fetchInitialData: (eventId?: string) => Promise<void>;
  validateScan: (qrToken: string) => ScanResult;
  processCheckIn: (qrToken: string) => Participant | null;
  syncToServer: () => Promise<void>;
  setCameraError: (status: boolean) => void;
  setHydrated: (status: boolean) => void;
  reset: () => void;
}
```

---

## 🔄 Lifecycle of a Check-In Scan

The following sequence outlines how a scan resolves from camera frame capture to remote database persistence:

```
[Camera Capture Frame]
          │
          ▼
   [Read QR Token]
          │
          ▼
   validateScan(token) ────► O(1) Look Up in `participants` Cache
          │
          ├───► Not Found ──► UI State: "notfound"
          ├───► Checked In ─► UI State: "duplicate"
          └───► Verified
                    │
                    ▼
            processCheckIn(token)
                    │
                    ├───► 1. Set `is_checked_in = true` and timestamp locally
                    ├───► 2. Push token to local `syncQueue` array
                    └───► 3. Fire-and-forget: syncToServer()
                                    │
                                    ▼
                          [batch_check_in RPC]
                                    │
                         ┌──────────┴──────────┐
                         ▼                     ▼
                [Update Success]         [Update Fail]
                (Remove from Queue)      (Retained in `syncQueue`)
```

### Step 1: Initial Sync & Safe Queue Merge (`fetchInitialData`)
Upon opening the scanner interface and after hydration finishes, the application fetches registered participants for the target event, carefully preserving offline edits.
```typescript
fetchInitialData: async (eventId = EVENT_ID) => {
  try {
    const { data, error } = await supabase
      .from("participants")
      .select("*")
      .eq("event_id", eventId);

    if (error) throw error;

    const map: Record<string, Participant> = {};
    const localQueue = get().syncQueue;
    const localParticipants = get().participants;

    (data ?? []).forEach((p) => {
      const qrToken = p.qr_token;
      if (localQueue.includes(qrToken) && localParticipants[qrToken]) {
        // Keep the local checked-in state if it's in the syncQueue
        map[qrToken] = {
          ...p,
          is_checked_in: true,
          check_in_time: localParticipants[qrToken].check_in_time || p.check_in_time,
        } as Participant;
      } else {
        map[qrToken] = p as Participant;
      }
    });

    set({ participants: map, totalCount: data?.length ?? 0, isReady: true });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { eventId, action: "fetchInitialData" }
    });
    throw err;
  }
}
```
*   **Performance Optimization:** Rather than iterating or searching through arrays, elements are stored in a JavaScript `Record` hashed by the `qr_token` string. This guarantees constant-time $\mathcal{O}(1)$ scanning validation.
*   **Safe Merge Logic:** Before writing fetched database records to the local store state, the function checks if any attendee's check-in timestamp exists inside the local `syncQueue` (e.g. they check in offline, and the operator refreshes the page or fetches fresh records before syncing). If it does, we retain the local checked-in value to prevent data loss.

### Step 2: Instant Cache Validation (`validateScan`)
When a QR token is read, validation occurs locally against the memory record.
```typescript
validateScan: (qrToken) => {
  const p = get().participants[qrToken];
  if (!p) return "NOT_FOUND";
  return p.is_checked_in ? "DUPLICATE" : "VERIFIED";
}
```
This guarantees response speeds of **less than 10 milliseconds**, removing any network round-trip overhead during peak check-in windows.

### Step 3: Local Mutations & Queueing (`processCheckIn`)
If validated, the record is immediately modified in client memory, and the event token is pushed to `syncQueue`.
```typescript
processCheckIn: (qrToken) => {
  const p = get().participants[qrToken];
  if (!p || p.is_checked_in) {
    set({ lastScanned: p ?? null });
    return p ?? null;
  }

  const updated: Participant = {
    ...p,
    is_checked_in: true,
    check_in_time: new Date().toISOString(),
  };

  set((s) => ({
    participants: { ...s.participants, [qrToken]: updated },
    syncQueue: s.syncQueue.includes(qrToken)
      ? s.syncQueue
      : [...s.syncQueue, qrToken],
    lastScanned: updated,
  }));

  void get().syncToServer();
  return updated;
}
```
`syncToServer` is immediately launched as a fire-and-forget background task.

### Step 4: Transactional Batch Check-In (`syncToServer`)

The store processes queued modifications in a single database RPC execution, preventing duplicate transactions and parallel network requests:

```typescript
syncToServer: async () => {
  const { syncQueue } = get();
  if (syncQueue.length === 0) {
    set({ syncError: null });
    return;
  }

  const pending = Array.from(new Set(syncQueue));

  set((s) => ({
    isSyncing: true,
    syncQueue: s.syncQueue.filter((t) => !pending.includes(t)),
  }));

  try {
    const { error } = await supabase.rpc("batch_check_in", { tokens: pending });
    if (error) {
      console.error("Batch check-in RPC failed:", error);
      Sentry.captureException(new Error(`Batch check-in RPC failed: ${error.message}`), {
        extra: { tokens: pending }
      });
      set((s) => ({
        syncQueue: Array.from(new Set([...s.syncQueue, ...pending])),
        syncError: `Gagal sinkron: ${error.message}`,
        isSyncing: false,
      }));
    } else {
      set({ syncError: null, isSyncing: false });
    }
  } catch (err) {
    console.error("Batch check-in RPC exception:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    Sentry.captureException(err, {
      extra: { tokens: pending }
    });
    set((s) => ({
      syncQueue: Array.from(new Set([...s.syncQueue, ...pending])),
      syncError: `Gagal sinkron: ${message}`,
      isSyncing: false,
    }));
  }
}
```

*   **Idempotency & Deduplication:** If `syncQueue` contains multiple check-in requests for the same token, the queue is deduplicated before execution. The SQL update sets `is_checked_in = true` and retains the earliest timestamp using `coalesce`, ensuring that retry actions are fully idempotent.
*   **Race Condition Mitigation:** By optimistically clearing pending tokens from the queue *before* executing the asynchronous database calls, we ensure that subsequent scans or concurrent network events do not process the same tokens in parallel. If the query fails, the tokens are appended back to `syncQueue` at the end.
*   **Observability Integration:** If synchronization fails, the error details are sent directly to Sentry with context tags mapping the affected participant tokens.
*   **Automatic Retries:** Lingering items are automatically retried upon subsequent scans. During device restart or reload, the `onRehydrateStorage` Zustand hook auto-triggers `syncToServer()` as soon as cache hydration from IndexedDB is complete.

---

## 📷 Viewfinder & Camera Integration

The frontend camera viewfinder in `app/scan/page.tsx` utilizes `html5-qrcode` (`Html5Qrcode` class) with strict timing limits:

1.  **Mounting & Camera Access:** `Html5Qrcode` binds to the container element `#qr-reader`. The scanner starts with target environment camera settings:
    ```typescript
    qr.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 300, height: 300 } },
      (decoded) => handleToken(decoded),
      () => {}
    );
    ```
2.  **Cooldown Lock:** To prevent double scanning of the same QR code on subsequent camera frames, `lockRef.current` is set to `true` upon scan detection.
3.  **Auto-Scan Toast System:** In auto-scan mode, the device displays randomized, non-overlapping toast overlays and flashes the scan container (`flash-green`) upon verification.
4.  **1-Second Delay Interval:** A timer decrements a cooldown counter every 100ms:
    ```typescript
    setCooldown(prev => {
      if (prev <= 0) {
        clearInterval(cooldownTimerRef.current!);
        lockRef.current = false; // unlock scanner
        return 0;
      }
      return prev - 0.1;
    });
    ```
    Once the cooldown reaches 0, scanning unlocks, allowing the user to scan the next attendee.
5.  **Camera State Resume Guard:** To prevent browser runtime errors (such as `Cannot resume, scanner is not paused.`), state-based hooks evaluate the exact sensor status using `.getState()` prior to calling `.resume()`. Action calls are executed only when the scanner state matches `3` (PAUSED).

