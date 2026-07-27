"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDashboardData } from "@/contexts/DashboardDataContext";

type SortKey = "name" | "total_participants" | "checked_in_participants" | "rate";
type SortDir = "asc" | "desc";

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border p-4"
      style={{
        background: "var(--surface)",
        borderColor: "var(--outline)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <span className="material-symbols-outlined text-2xl" style={{ color: accent }}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>
          {label}
        </p>
        <p className="text-xl font-bold tabular-nums" style={{ color: "var(--on-surface)" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "center";
}) {
  return (
    <th className={`py-2.5 px-3 ${align === "center" ? "text-center" : "text-left"}`}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer hover:text-[--primary] ${
          align === "center" ? "justify-center" : ""
        }`}
        style={{ color: active ? "var(--primary)" : "var(--on-surface-variant)" }}
      >
        {label}
        <span className="material-symbols-outlined text-sm" style={{ opacity: active ? 1 : 0.35 }}>
          {active ? (dir === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
        </span>
      </button>
    </th>
  );
}

export default function DashboardAnalyticsPanel() {
  const { events, loading } = useDashboardData();
  const [sortKey, setSortKey] = useState<SortKey>("rate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const rows = useMemo(
    () =>
      events.map((ev) => {
        const total = ev.participant_count ?? 0;
        const checkedIn = ev.checked_in_participants ?? 0;
        const rate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
        return {
          id: ev.id,
          name: ev.name || "Tanpa nama",
          total_participants: total,
          checked_in_participants: checkedIn,
          rate,
        };
      }),
    [events],
  );

  const totalEvents = rows.length;
  const totalRegistered = rows.reduce((sum, item) => sum + item.total_participants, 0);
  const totalCheckedIn = rows.reduce((sum, item) => sum + item.checked_in_participants, 0);
  const overallRate = totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0;

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv, "id") : bv.localeCompare(av, "id");
      }
      return sortDir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const chartData = useMemo(
    () =>
      sorted.slice(0, 12).map((r) => ({
        name: r.name.length > 18 ? `${r.name.slice(0, 16)}…` : r.name,
        fullName: r.name,
        Terdaftar: r.total_participants,
        "Check-in": r.checked_in_participants,
      })),
    [sorted],
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  };

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
      <h1 className="mb-1 text-2xl font-bold">Analytic Event</h1>
      <p className="mb-6 text-sm" style={{ color: "var(--on-surface-variant)" }}>
        Seberapa baik kehadiran event Anda — ringkasan di seluruh event.
      </p>

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon="event" label="Total Event" value={totalEvents} accent="var(--primary)" />
          <StatCard icon="groups" label="Total Terdaftar" value={totalRegistered} accent="var(--accent-secondary)" />
          <StatCard icon="task_alt" label="Total Check-in" value={totalCheckedIn} accent="var(--success)" />
          <StatCard icon="trending_up" label="Rasio Kehadiran" value={`${overallRate}%`} accent="var(--warning)" />
        </div>

        {rows.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center"
            style={{ borderColor: "var(--outline)", background: "var(--surface-container-low)" }}
          >
            <span className="material-symbols-outlined mb-3 text-5xl" style={{ color: "var(--on-surface-variant)" }}>
              analytics
            </span>
            <h2 className="mb-1 text-base font-bold">Belum ada data analitik</h2>
            <p className="mb-5 max-w-sm text-sm" style={{ color: "var(--on-surface-variant)" }}>
              Buat event dan terima pendaftaran untuk melihat rasio kehadiran di sini.
            </p>
            <Link
              href="/create/package"
              className="rounded-lg px-4 py-2 text-sm font-bold cursor-pointer"
              style={{ background: "var(--primary)", color: "var(--on-primary)" }}
            >
              Buat Event Baru
            </Link>
          </div>
        ) : (
          <>
            <div
              className="rounded-xl border p-4"
              style={{
                background: "var(--surface)",
                borderColor: "var(--outline)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <h3 className="mb-1 text-sm font-bold" style={{ color: "var(--on-surface)" }}>
                Peserta Terdaftar vs Check-in
              </h3>
              <p className="mb-4 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                Perbandingan kehadiran per event
                {sorted.length > 12 ? " (12 teratas menurut sort aktif)" : ""}.
              </p>
              <div className="h-64 w-full sm:h-72">
                <div style={{ width: '100%', height: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--outline)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "var(--on-surface-variant)", fontSize: 11 }}
                      axisLine={{ stroke: "var(--outline)" }}
                      tickLine={false}
                      interval={0}
                      angle={chartData.length > 5 ? -25 : 0}
                      textAnchor={chartData.length > 5 ? "end" : "middle"}
                      height={chartData.length > 5 ? 60 : 30}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "var(--on-surface-variant)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--surface-container)" }}
                      contentStyle={{
                        background: "var(--surface)",
                        border: "1px solid var(--outline)",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "var(--on-surface)",
                      }}
                      labelFormatter={(_, payload) => {
                        const item = payload?.[0]?.payload as { fullName?: string } | undefined;
                        return item?.fullName ?? "";
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Terdaftar" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="Check-in" fill="var(--success)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              </div>
            </div>

            <div
              className="overflow-hidden rounded-xl border"
              style={{
                background: "var(--surface)",
                borderColor: "var(--outline)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div className="border-b px-4 py-3" style={{ borderColor: "var(--outline-variant)" }}>
                <h3 className="text-sm font-bold" style={{ color: "var(--on-surface)" }}>
                  Breakdown per Event
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--outline-variant)", background: "var(--surface-container-low)" }}>
                      <SortHeader label="Nama Event" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
                      <SortHeader
                        label="Peserta Terdaftar"
                        active={sortKey === "total_participants"}
                        dir={sortDir}
                        onClick={() => toggleSort("total_participants")}
                        align="center"
                      />
                      <SortHeader
                        label="Sudah Check-in"
                        active={sortKey === "checked_in_participants"}
                        dir={sortDir}
                        onClick={() => toggleSort("checked_in_participants")}
                        align="center"
                      />
                      <SortHeader
                        label="Persentase Kehadiran"
                        active={sortKey === "rate"}
                        dir={sortDir}
                        onClick={() => toggleSort("rate")}
                        align="center"
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((item, idx) => (
                      <tr
                        key={item.id}
                        className="border-b transition-colors hover:bg-[--primary-container]/35"
                        style={{
                          borderColor: "var(--outline-variant)",
                          background: idx % 2 === 1 ? "var(--surface-container-low)" : "transparent",
                        }}
                      >
                        <td className="max-w-[240px] truncate px-3 py-2.5 font-semibold" style={{ color: "var(--on-surface)" }} title={item.name}>
                          <Link
                            href={`/dashboard/events/${item.id}`}
                            className="hover:underline cursor-pointer"
                            style={{ color: "inherit" }}
                          >
                            {item.name}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 text-center tabular-nums">{item.total_participants}</td>
                        <td className="px-3 py-2.5 text-center tabular-nums">{item.checked_in_participants}</td>
                        <td className="px-3 py-2.5">
                          <div className="mx-auto flex max-w-[200px] items-center gap-2">
                            <div
                              className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full"
                              style={{ background: "var(--surface-container)" }}
                              role="progressbar"
                              aria-valuenow={item.rate}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="h-full rounded-full transition-[width]"
                                style={{
                                  width: `${item.rate}%`,
                                  background: item.rate >= 70 ? "var(--success)" : item.rate >= 40 ? "var(--warning)" : "var(--primary)",
                                }}
                              />
                            </div>
                            <span className="w-9 shrink-0 text-right font-mono text-xs tabular-nums" style={{ color: "var(--on-surface)" }}>
                              {item.rate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
