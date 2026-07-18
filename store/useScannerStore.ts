import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import { supabase, EVENT_ID } from "@/lib/supabase";
import type { Participant, ScanResult } from "@/lib/types";
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

  // Actions
  fetchInitialData: (eventId?: string) => Promise<void>;
  validateScan: (qrToken: string) => ScanResult;
  processCheckIn: (qrToken: string) => Participant | null;
  syncToServer: () => Promise<void>;
  setCameraError: (status: boolean) => void;
  setHydrated: (status: boolean) => void;
  reset: () => void; // balik ke viewfinder (tap-to-reset)
}

interface PersistedScannerState {
  participants: Record<string, Participant>;
  syncQueue: string[];
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
      setHydrated: (hydrated) => set({ hydrated }),

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
      },

      // FR-5 / FR-6: lookup lokal O(1), evaluasi state
      validateScan: (qrToken) => {
        const p = get().participants[qrToken];
        if (!p) return "NOT_FOUND";
        return p.is_checked_in ? "DUPLICATE" : "VERIFIED";
      },

      // Update state lokal jadi true + masuk antrean sync. NO live fetch.
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

        // fire-and-forget; aman walau offline (di-catch di dalam)
        void get().syncToServer();
        return updated;
      },

      // Background sync: UPDATE semua token di antrean. Offline-resilient (NFR-2).
      // Refactored to guarantee idempotency and concurrency safety.
      syncToServer: async () => {
        const { syncQueue } = get();
        if (syncQueue.length === 0) {
          set({ syncError: null });
          return;
        }

        // Deduplicate key values in the queue
        const pending = Array.from(new Set(syncQueue));

        // Optimistically clear these processed tokens from the queue
        // preventing concurrent calls from double-processing them
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
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (!error && state) {
            state.setHydrated(true);
            // Trigger automatic sync for lingering items in syncQueue upon rehydration
            if (state.syncQueue.length > 0) {
              void state.syncToServer();
            }
          }
        };
      },
    }
  )
);
