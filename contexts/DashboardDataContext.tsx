"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export type DashboardEvent = {
  id: string;
  name: string;
  event_date: string | null;
  location: string | null;
  banner_url: string | null;
  status: "active" | "closed";
  package_type?: string;
  package_status?: string;
  expected_participants?: number | null;
  registration_deadline?: string | null;
  created_at?: string | null;
  participant_count: number;
  checked_in_participants: number;
};

type DashboardDataContextValue = {
  events: DashboardEvent[];
  loading: boolean;
  upcoming: DashboardEvent[];
  past: DashboardEvent[];
  participants: any[];
  eventName: string;
  error: string | null;
};

const DashboardDataContext = createContext<DashboardDataContextValue | null>(null);

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const upcoming = useMemo(() => events.filter((e) => e.status === "active"), [events]);
  const past = useMemo(() => events.filter((e) => e.status === "closed"), [events]);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<any[]>([]);
  const [eventName, setEventName] = useState("");

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Implement your data fetching logic here using supabase
        // const { data, error } = await supabase.from('...').select('...');
        // if (error) throw error;
        // ... setEvents, setParticipants, setEventName
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError("Gagal memuat data dashboard.");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [user]);

  const value = useMemo(
    () => ({ events, loading, upcoming, past, participants, eventName, error }),
    [events, loading, upcoming, past, participants, eventName, error],
  );

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) {
    throw new Error("useDashboardData must be used within DashboardDataProvider");
  }
  return ctx;
}
