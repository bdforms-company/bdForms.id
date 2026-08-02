"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import "../../design.css";

type EventSummary = {
  id: string;
  name: string;
  total_participants: number;
  checked_in_participants: number;
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EventSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch user's events
        const { data: events, error: eventsError } = await supabase
          .from("events")
          .select("id, name")
          .eq("owner_id", user.id);

        if (eventsError) throw eventsError;

        const summaries: EventSummary[] = [];

        // For each event, count participants and check-ins
        for (const ev of events || []) {
          const { count: totalCount, error: countError } = await supabase
            .from("participants")
            .select("id", { count: "exact", head: true })
            .eq("event_id", ev.id);

          const { count: checkedInCount, error: checkedInError } = await supabase
            .from("participants")
            .select("id", { count: "exact", head: true })
            .eq("event_id", ev.id)
            .eq("is_checked_in", true);

          if (!countError && !checkedInError) {
            summaries.push({
              id: ev.id,
              name: ev.name,
              total_participants: totalCount || 0,
              checked_in_participants: checkedInCount || 0,
            });
          }
        }

        if (active) setData(summaries);
      } catch (err) {
        console.error("Gagal memuat analitik:", err);
        if (active) setError("Gagal mengambil data analitik dari server.");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadData();
    return () => { active = false; };
  }, [user]);

  const totalEvents = data.length;
  const totalRegistered = data.reduce((sum, item) => sum + item.total_participants, 0);
  const totalCheckedIn = data.reduce((sum, item) => sum + item.checked_in_participants, 0);
  const overallRate = totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0;

  if (loading) {
    return (
      <div className="bd flex min-h-screen items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-5xl" style={{ color: "var(--primary)" }}>
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="bd min-h-screen px-4 pt-6 pb-16 md:px-10">
      <h1 className="text-2xl font-bold mb-2">Analytic Event</h1>
      <p className="text-sm mb-8" style={{ color: "var(--on-surface-variant)" }}>
        Ringkasan data analitik kehadiran peserta di seluruh event Anda.
      </p>

      {error ? (
        <div className="glass rounded-2xl p-8 text-center" style={{ color: "var(--error)" }}>
          {error}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Event", value: totalEvents, icon: "event", color: "var(--primary)" },
              { label: "Total Terdaftar", value: totalRegistered, icon: "groups", color: "var(--cyan)" },
              { label: "Total Check-in", value: totalCheckedIn, icon: "task_alt", color: "var(--green)" },
              { label: "Rasio Kehadiran", value: `${overallRate}%`, icon: "trending_up", color: "var(--warning)" },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-3xl p-8 flex flex-col gap-3 transition-transform hover:-translate-y-1">
                <span className="material-symbols-outlined text-4xl" style={{ color: stat.color }}>{stat.icon}</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>{stat.label}</p>
                  <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed breakdown list */}
          <div className="glass rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-6 text-white">Breakdown per Event</h3>
            {data.length === 0 ? (
              <p className="text-center text-sm py-8" style={{ color: "var(--on-surface-variant)" }}>Belum ada event yang dibuat.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--outline-variant)", color: "var(--on-surface-variant)" }}>
                      <th className="py-3 px-4 font-bold">Nama Event</th>
                      <th className="py-3 px-4 font-bold text-center">Peserta Terdaftar</th>
                      <th className="py-3 px-4 font-bold text-center">Sudah Check-in</th>
                      <th className="py-3 px-4 font-bold text-center">Persentase Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item) => {
                      const rate = item.total_participants > 0 ? Math.round((item.checked_in_participants / item.total_participants) * 100) : 0;
                      return (
                        <tr key={item.id} className="border-b hover:bg-white/5" style={{ borderColor: "var(--outline-variant)" }}>
                          <td className="py-3 px-4 font-semibold text-white">{item.name}</td>
                          <td className="py-3 px-4 text-center">{item.total_participants}</td>
                          <td className="py-3 px-4 text-center">{item.checked_in_participants}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-24 bg-white/10 h-2 rounded-full overflow-hidden shrink-0">
                                <div className="h-full" style={{ width: `${rate}%`, background: "var(--green)" }} />
                              </div>
                              <span className="font-mono text-xs w-8 text-white">{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
