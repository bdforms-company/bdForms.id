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
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

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
  const year = currentDate ? currentDate.getFullYear() : new Date().getFullYear();
  const month = currentDate ? currentDate.getMonth() : new Date().getMonth();

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

  const monthName = currentDate ? currentDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" }) : "";

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

  if (loading || !currentDate) {
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

      <div className="glass rounded-3xl p-8">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white tracking-tight">{monthName}</h2>
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
            <button onClick={prevMonth} className="rounded-lg p-2 hover:bg-white/10 transition-colors" aria-label="Bulan sebelumnya">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button onClick={nextMonth} className="rounded-lg p-2 hover:bg-white/10 transition-colors" aria-label="Bulan berikutnya">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-4 mb-4 text-center text-xs font-bold uppercase tracking-widest" style={{ color: "var(--on-surface-variant)" }}>
          {dayNames.map((day) => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className="aspect-square rounded-2xl" />;
            }

            const dayEvents = getEventsForDay(date);
            const isToday = new Date().toDateString() === date.toDateString();

            return (
              <div 
                key={date.toISOString()} 
                className={`aspect-square rounded-2xl p-3 flex flex-col gap-2 border transition-all ${isToday ? "bg-[--primary-container]" : "hover:bg-white/5"}`}
                style={{ 
                  borderColor: isToday ? "var(--primary)" : "var(--outline-variant)",
                }}
              >
                <span className={`text-sm font-bold ${isToday ? "text-[--on-primary-container]" : "text-white"}`}>
                  {date.getDate()}
                </span>
                
                <div className="flex flex-col gap-1 overflow-y-auto">
                  {dayEvents.map((ev) => (
                    <Link
                      key={ev.id}
                      href={`/dashboard/events/${ev.id}`}
                      className="text-[10px] leading-tight px-2 py-1 rounded-md bg-[--surface-variant] text-[--on-surface-variant] font-semibold truncate hover:bg-[--primary] hover:text-[--on-primary] transition-colors"
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
