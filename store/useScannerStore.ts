import { create } from "zustand";
import { supabase, EVENT_ID } from "@/lib/supabase";
import type { Participant, ScanResult } from "@/lib/types";

interface ScannerStore {
  // State
  participants: Record<string, Participant>; // key = qr_token -> lookup O(1)
  syncQueue: string[];                        // qr_token yang nunggu di-UPDATE ke server
  cameraError: boolean;                       // FR-7 capture
  isReady: boolean;                           // data awal udah ke-fetch?
  totalCount: number;                         // buat indikator "Data Synced: N/N"
  lastScanned: Participant | null;            // dipake Page 3 (Verification screen)

  // Actions
  fetchInitialData: (eventId?: string) => Promise<void>;
  validateScan: (qrToken: string) => ScanResult;
  processCheckIn: (qrToken: string) => Participant | null;
  syncToServer: () => Promise<void>;
  setCameraError: (status: boolean) => void;
  reset: () => void; // balik ke viewfinder (tap-to-reset)
}

export const useScannerStore = create<ScannerStore>((set, get) => ({
  participants: {},
  syncQueue: [],
  cameraError: false,
  isReady: false,
  totalCount: 0,
  lastScanned: null,

  // INIT (Online): SELECT * FROM participants -> map by qr_token
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
        if (error) failed.push(token); // gagal (offline) -> tetep di antrean
      })
    ).catch(() => {
      // network mati total: semua tetep antre
      failed.push(...pending.filter((t) => !failed.includes(t)));
    });

    set({ syncQueue: failed });
  },

  setCameraError: (status) => set({ cameraError: status }),

  reset: () => set({ lastScanned: null }),
}));
