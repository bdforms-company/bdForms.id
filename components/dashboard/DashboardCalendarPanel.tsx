"use client";

import { useState } from "react";
import Link from "next/link";
import { useDashboardData } from "@/contexts/DashboardDataContext";

const MAX_VISIBLE_EVENTS = 2;
const DAY_NAMES = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

export default function DashboardCalendarPanel() {
  const { events, loading } = useDashboardData();
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

  const monthName = currentDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const getEventsForDay = (date: Date) =>
    events.filter((ev) => {
      if (!ev.event_date) return false;
      const d = new Date(ev.event_date);
      return (
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
      );
    });

  if (loading) {
    return (
      <div className="bd flex min-h-[50vh] items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-5xl" style={{ color: "var(--primary)" }}>
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="bd min-h-screen px-4 pb-16 pt-6 md:px-10">
      <h1 className="mb-1 text-2xl font-bold">Kalender Event</h1>
      <p className="mb-6 text-sm" style={{ color: "var(--on-surface-variant)" }}>
        Jadwal pelaksanaan seluruh event yang Anda kelola.
      </p>

      <div className="glass rounded-2xl p-3 sm:p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
          <h2 className="text-base font-bold capitalize sm:text-lg" style={{ color: "var(--on-surface)" }}>
            {monthName}
          </h2>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-lg border p-1.5 transition-colors hover:bg-[--surface-container] cursor-pointer"
              style={{ borderColor: "var(--outline)" }}
              aria-label="Bulan sebelumnya"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg border p-1.5 transition-colors hover:bg-[--surface-container] cursor-pointer"
              style={{ borderColor: "var(--outline)" }}
              aria-label="Bulan berikutnya"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>

        <div
          className="mb-1 grid grid-cols-7 gap-px text-center text-[10px] font-semibold tracking-wide sm:text-[11px]"
          style={{ color: "var(--on-surface-variant)" }}
        >
          {DAY_NAMES.map((day) => (
            <div key={day} className="py-1.5">
              {day}
            </div>
          ))}
        </div>

        <div
          className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border"
          style={{ borderColor: "var(--outline)", background: "var(--outline)" }}
        >
          {days.map((date, idx) => {
            if (!date) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[72px] sm:min-h-[96px] md:min-h-[110px]"
                  style={{ background: "var(--surface-container-low)" }}
                />
              );
            }

            const dayEvents = getEventsForDay(date);
            const isToday = new Date().toDateString() === date.toDateString();
            const hasEvents = dayEvents.length > 0;
            const visible = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
            const moreCount = dayEvents.length - visible.length;

            return (
              <div
                key={date.toISOString()}
                className={`flex min-h-[72px] flex-col gap-0.5 p-1 sm:min-h-[96px] sm:p-1.5 md:min-h-[110px] ${
                  hasEvents ? "transition-colors hover:bg-[--primary-container]/40 cursor-default" : ""
                }`}
                style={{
                  background: "var(--surface)",
                }}
              >
                <div className="mb-0.5 flex items-center">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center text-xs font-semibold sm:h-7 sm:w-7 sm:text-sm ${
                      isToday ? "rounded-full text-white" : ""
                    }`}
                    style={
                      isToday
                        ? { background: "var(--primary)", color: "var(--on-primary)" }
                        : { color: "var(--on-surface)" }
                    }
                  >
                    {date.getDate()}
                  </span>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-0.5">
                  {visible.map((ev) => (
                    <Link
                      key={ev.id}
                      href={`/dashboard/events/${ev.id}`}
                      className="block truncate rounded px-1 py-0.5 text-[9px] font-semibold leading-tight transition-opacity hover:opacity-90 sm:text-[10px] cursor-pointer"
                      style={{
                        background: "var(--primary-container)",
                        color: "var(--on-primary-container)",
                      }}
                      title={ev.name}
                    >
                      {ev.name}
                    </Link>
                  ))}
                  {moreCount > 0 && (
                    <span
                      className="px-1 text-[9px] font-medium sm:text-[10px]"
                      style={{ color: "var(--on-surface-variant)" }}
                    >
                      +{moreCount} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
