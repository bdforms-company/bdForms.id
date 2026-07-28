"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import "../../design.css";

type EventSummary = {
  id: string;
  name: string;
  event_date: string | null;
};

export default function CalendarPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    if (!user) return;
    let active = true;

    const loadEvents = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("events")
          .select("id, name, event_date")
          .eq("owner_id", user.id);

        if (!error && active) {
          setEvents((data || []) as EventSummary[]);
        }
      } catch (err) {
        console.error("Gagal memuat event untuk kalender:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadEvents();
    return () => { active = false; };
  }, [user]);

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Prev & Next Month handlers
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Calendar dates generation
  const days = [];
  // Empty spaces for previous month's padding
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const monthName = currentDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const getEventsForDay = (date: Date) => {
    return events.filter((ev) => {
      if (!ev.event_date) return false;
      const d = new Date(ev.event_date);
      return (
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
      );
    });
  };

  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

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
      <h1 className="text-2xl font-bold mb-2">Kalender Event</h1>
      <p className="text-sm mb-8" style={{ color: "var(--on-surface-variant)" }}>
        Jadwal pelaksanaan seluruh event yang Anda kelola.
      </p>

      <div className="glass rounded-3xl p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{monthName}</h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="rounded-lg border p-2 hover:bg-white/5" style={{ borderColor: "var(--outline-variant)" }}>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button onClick={nextMonth} className="rounded-lg border p-2 hover:bg-white/5" style={{ borderColor: "var(--outline-variant)" }}>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>
          {dayNames.map((day) => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className="aspect-square bg-white/2 rounded-xl border border-transparent" />;
            }

            const dayEvents = getEventsForDay(date);
            const isToday = new Date().toDateString() === date.toDateString();

            return (
              <div 
                key={date.toISOString()} 
                className="aspect-square rounded-xl border p-2 flex flex-col justify-between hover:bg-white/5 transition-colors"
                style={{ 
                  borderColor: isToday ? "var(--green)" : "var(--outline-variant)",
                  background: isToday ? "rgba(91,255,161,0.05)" : "transparent"
                }}
              >
                <span className={`text-sm font-bold ${isToday ? "text-[--green]" : "text-white"}`}>
                  {date.getDate()}
                </span>
                
                <div className="flex flex-col gap-1 overflow-y-auto max-h-[70%]">
                  {dayEvents.map((ev) => (
                    <Link
                      key={ev.id}
                      href={`/dashboard/events/${ev.id}`}
                      className="text-[10px] leading-tight px-1.5 py-0.5 rounded bg-[--primary-container] text-[--on-primary-container] font-semibold truncate hover:scale-105 transition-transform"
                      title={ev.name}
                    >
                      {ev.name}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
