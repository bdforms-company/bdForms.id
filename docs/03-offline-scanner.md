# Offline-First QR Scanner Architecture

This document covers the technical implementation of the offline-first QR scanning mechanism, detailing state tracking, synchronization, and the lifecycle of a check-in ticket validation.

---

## 🏗️ State Design: `useScannerStore`

The client-side scanner logic is built using a Zustand memory store in `store/useScannerStore.ts`. This store acts as a local proxy for the Supabase `participants` database, providing instant lookups and buffering writes when connections fail.

### Store Interface Structure
```typescript
interface ScannerStore {
  // State
  participants: Record<string, Participant>; // Key = qr_token -> lookups in O(1)
  syncQueue: string[];                        // Array of qr_tokens pending sync to server
  cameraError: boolean;                       // Camera access failure flag
  isReady: boolean;                           // Initial database download status
  totalCount: number;                         // Total count tracking indicator
  lastScanned: Participant | null;            // Last analyzed participant record

  // Actions
  fetchInitialData: (eventId?: string) => Promise<void>;
  validateScan: (qrToken: string) => ScanResult;
  processCheckIn: (qrToken: string) => Participant | null;
  syncToServer: () => Promise<void>;
  setCameraError: (status: boolean) => void;
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
                          [Iterate syncQueue]
                                    │
                         ┌──────────┴──────────┐
                         ▼                     ▼
                [Update Success]         [Update Fail]
                (Remove from Queue)      (Retained in `syncQueue`)
```

### Step 1: Initial Sync & Hydration (`fetchInitialData`)
Upon opening the scanner interface, the application attempts to fetch all registered participants for the target event.
```typescript
fetchInitialData: async (eventId = EVENT_ID) => {
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("event_id", eventId);

  if (error) throw error;

  const map: Record<string, Participant> = {};
  (data ?? []).forEach((p) => {
    map[p.qr_token] = p as Participant;
  });

  set({ participants: map, totalCount: data?.length ?? 0, isReady: true });
}
```
*   **Performance Optimization:** Rather than iterating or searching through arrays, elements are stored in a JavaScript `Record` hashed by the `qr_token` string. This guarantees constant-time $\mathcal{O}(1)$ scanning validation.
*   **Offline Fallback:** If the client is offline when the page loads, the fetch fails. The catch block in `app/scan/page.tsx` captures the error, alerts the user that it is using locally stored state, and forces `isReady` to true.

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

### Step 4: Background Reconciliation (`syncToServer`)
The store processes queued modifications in parallel, keeping only failed attempts in the queue.
```typescript
syncToServer: async () => {
  const { syncQueue, participants } = get();
  if (syncQueue.length === 0) return;

  const pending = [...syncQueue];
  const failed: string[] = [];

  await Promise.all(
    pending.map(async (token) => {
      const p = participants[token];
      if (!p) return;
      const { error } = await supabase
        .from("participants")
        .update({
          is_checked_in: true,
          check_in_time: p.check_in_time,
        })
        .eq("qr_token", token);
      if (error) failed.push(token); // failed (offline) -> remains in queue
    })
  ).catch(() => {
    // network fully down: all items stay in queue
    failed.push(...pending.filter((t) => !failed.includes(t)));
  });

  set({ syncQueue: failed });
}
```
*   **Failed Retry Strategy:** If any write requests return error statuses (network failure or timeout), the associated tokens are appended to `failed` and rewritten to `syncQueue`.
*   **Automatic Retries:** In standard operation, subsequent scans invoke `processCheckIn`, which fires `syncToServer()` again, forcing a re-evaluation of all failed items in the queue.

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
