import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import { supabase, EVENT_ID } from "@/lib/supabase";
import type { Participant, ScanResult } from "@/lib/types";
import { findParticipant, normalizeQrPayload } from "@/lib/qr-token";
import * as Sentry from "@sentry/nextjs";

interface ScannerStore {
  // State
  participants: Record<string, Participant>; // key = qr_token -> lookup O(1)
  syncQueue: string[];                        // qr_token yang nunggu di-UPDATE ke server
  cameraError: boolean;                       // FR-7 capture
  isReady: boolean;                           // data awal udah ke-fetch?
  totalCount: number;                         // buat indikator "Data Synced: N/N"
  lastScanned: Participant | null;            // dipake Page 3 (Verification screen)
  hydrated: boolean;                          // Zustand rehydration finished?
  isSyncing: boolean;                         // background syncing in progress?
  syncError: string | null;                   // last sync error message
  activeEventId: string | null;               // event currently loaded in cache
  scannerToken: string | null;                // optional scanner link token for API auth

  // Actions
  fetchInitialData: (eventId?: string) => Promise<void>;
  setScannerToken: (token: string | null) => void;
  resolveParticipant: (raw: string) => Participant | undefined;
  validateScan: (raw: string) => ScanResult;
  processCheckIn: (raw: string) => Participant | null;
  syncToServer: () => Promise<void>;
  setCameraError: (status: boolean) => void;
  setHydrated: (status: boolean) => void;
  reset: () => void; // balik ke viewfinder (tap-to-reset)
}

interface PersistedScannerState {
  participants: Record<string, Participant>;
  syncQueue: string[];
  activeEventId: string | null;
}

// Custom storage engine wrapper using idb-keyval (IndexedDB)
const idbStorage = createJSONStorage<PersistedScannerState>(() => ({
  getItem: async (name: string): Promise<string | null> => {
    const value = await idbGet<string>(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await idbDel(name);
  },
}));

async function pushCheckIns(
  tokens: string[],
  scannerToken: string | null,
): Promise<{ ok: boolean; error?: string }> {
  // 1) Prefer server API (service role) — works even if RPC missing / RLS tight
  try {
    const res = await fetch("/api/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokens,
        ...(scannerToken ? { scannerToken } : {}),
      }),
    });
    if (res.ok) {
      console.info("[scanner] check-in via /api/check-in OK", { count: tokens.length });
      return { ok: true };
    }
    const body = await res.json().catch(() => ({}));
    console.warn("[scanner] /api/check-in failed, trying fallbacks:", body);
  } catch (err) {
    console.warn("[scanner] /api/check-in network error, trying fallbacks:", err);
  }

  // 2) Prefer RPC when deployed
  const { error: rpcError } = await supabase.rpc("batch_check_in", { tokens });
  if (!rpcError) {
    console.info("[scanner] check-in via batch_check_in RPC OK", { count: tokens.length });
    return { ok: true };
  }
  console.warn("[scanner] batch_check_in RPC unavailable:", rpcError.message);

  // 3) Direct client update (anon can write while RLS is open)
  const now = new Date().toISOString();
  const { error: updError } = await supabase
    .from("participants")
    .update({ is_checked_in: true, check_in_time: now })
    .in("qr_token", tokens)
    .eq("is_checked_in", false);

  if (updError) {
    console.error("[scanner] direct update failed:", updError);
    return { ok: false, error: updError.message };
  }

  console.info("[scanner] check-in via direct update OK", { count: tokens.length });
  return { ok: true };
}

export const useScannerStore = create<ScannerStore>()(
  persist(
    (set, get) => ({
      participants: {},
      syncQueue: [],
      cameraError: false,
      isReady: false,
      totalCount: 0,
      lastScanned: null,
      hydrated: false,
      isSyncing: false,
      syncError: null,
      activeEventId: null,
      scannerToken: null,
      setHydrated: (hydrated) => set({ hydrated }),
      setScannerToken: (scannerToken) => set({ scannerToken }),

      // INIT (Online): SELECT * FROM participants -> map by qr_token
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
          const prevEventId = get().activeEventId;

          // Drop stale cache from a different event
          const sameEvent = !prevEventId || prevEventId === eventId;

          (data ?? []).forEach((p) => {
            const qrToken = p.qr_token;
            if (
              sameEvent &&
              localQueue.includes(qrToken) &&
              localParticipants[qrToken]
            ) {
              // Keep the local checked-in state if it's in the syncQueue
              map[qrToken] = {
                ...p,
                is_checked_in: true,
                check_in_time:
                  localParticipants[qrToken].check_in_time || p.check_in_time,
              } as Participant;
            } else {
              map[qrToken] = p as Participant;
            }
          });

          set({
            participants: map,
            totalCount: data?.length ?? 0,
            isReady: true,
            activeEventId: eventId,
            // Drop queue entries that no longer belong to this event's roster
            syncQueue: sameEvent
              ? localQueue.filter((t) => map[t])
              : [],
          });

          console.info("[scanner] loaded participants", {
            eventId,
            count: data?.length ?? 0,
          });
        } catch (err) {
          Sentry.captureException(err, {
            tags: { eventId, action: "fetchInitialData" },
          });
          throw err;
        }
      },

      resolveParticipant: (raw) => findParticipant(get().participants, raw),

      // FR-5 / FR-6: lookup lokal O(1), evaluasi state
      validateScan: (raw) => {
        const p = findParticipant(get().participants, raw);
        if (!p) {
          console.info(
            "[scanner] NOT_FOUND raw=",
            JSON.stringify(raw),
            "normalized=",
            normalizeQrPayload(raw),
          );
          return "NOT_FOUND";
        }
        return p.is_checked_in ? "DUPLICATE" : "VERIFIED";
      },

      // Update state lokal jadi true + masuk antrean sync. NO live fetch.
      processCheckIn: (raw) => {
        const p = findParticipant(get().participants, raw);
        if (!p || p.is_checked_in) {
          set({ lastScanned: p ?? null });
          return p ?? null;
        }

        const qrToken = p.qr_token;
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

        console.info("[scanner] local check-in queued", {
          name: p.name,
          token: qrToken.slice(0, 8),
        });

        // fire-and-forget; aman walau offline (di-catch di dalam)
        void get().syncToServer();
        return updated;
      },

      // Background sync: UPDATE semua token di antrean. Offline-resilient (NFR-2).
      syncToServer: async () => {
        const { syncQueue, scannerToken } = get();
        if (syncQueue.length === 0) {
          set({ syncError: null });
          return;
        }

        const pending = Array.from(new Set(syncQueue));

        // Optimistically clear these processed tokens from the queue
        set((s) => ({
          isSyncing: true,
          syncQueue: s.syncQueue.filter((t) => !pending.includes(t)),
        }));

        try {
          const result = await pushCheckIns(pending, scannerToken);
          if (!result.ok) {
            Sentry.captureException(
              new Error(`Check-in sync failed: ${result.error}`),
              { extra: { tokens: pending } },
            );
            set((s) => ({
              syncQueue: Array.from(new Set([...s.syncQueue, ...pending])),
              syncError: `Gagal sinkron: ${result.error}`,
              isSyncing: false,
            }));
          } else {
            set({ syncError: null, isSyncing: false });
          }
        } catch (err) {
          console.error("[scanner] sync exception:", err);
          const message = err instanceof Error ? err.message : "Unknown error";
          Sentry.captureException(err, { extra: { tokens: pending } });
          set((s) => ({
            syncQueue: Array.from(new Set([...s.syncQueue, ...pending])),
            syncError: `Gagal sinkron: ${message}`,
            isSyncing: false,
          }));
        }
      },

      setCameraError: (status) => set({ cameraError: status }),

      reset: () => set({ lastScanned: null }),
    }),
    {
      name: "scanner-store",
      storage: idbStorage,
      partialize: (state) => ({
        participants: state.participants,
        syncQueue: state.syncQueue,
        activeEventId: state.activeEventId,
      }),
      onRehydrateStorage: () => {
        return (_state, error) => {
          // Always mark hydrated so the UI is never stuck on "Memuat..."
          if (error) {
            console.error("[scanner] rehydrate error:", error);
          }
          useScannerStore.getState().setHydrated(true);
          const current = useScannerStore.getState();
          if (current.syncQueue.length > 0) {
            void current.syncToServer();
          }
        };
      },
    }
  )
);
