"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { generateNotifications } from "@/lib/notifications";
import { useDashboardData, type DashboardEvent } from "@/contexts/DashboardDataContext";

function packageLabel(type?: string) {
  if (type === "starter") return "Starter";
  if (type === "standard") return "Standard";
  if (type === "pro") return "Pro";
  if (type === "enterprise") return "Enterprise";
  return null;
}

function packageStyle(type?: string): CSSProperties {
  if (type === "starter") return { background: "var(--surface-container)", color: "var(--on-surface-variant)" };
  if (type === "standard") return { background: "rgba(0,102,255,0.12)", color: "var(--on-primary-container)" };
  if (type === "pro") return { background: "rgba(0,200,255,0.14)", color: "var(--accent-secondary)" };
  if (type === "enterprise") return { background: "rgba(217,119,6,0.15)", color: "var(--warning)" };
  return {};
}

function EventCard({ ev, past }: { ev: DashboardEvent; past?: boolean }) {
  const dateLabel = ev.event_date
    ? new Date(ev.event_date).toLocaleDateString("id-ID", { dateStyle: "medium" })
    : "Tanggal belum diatur";
  const tier = packageLabel(ev.package_type);
  const pending = ev.package_status === "pending_payment";

  return (
    <div
      className="overflow-hidden rounded-xl border transition-colors hover:border-[--primary]/40"
      style={{
        background: "var(--surface)",
        borderColor: "var(--outline)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {ev.banner_url ? (
        <div className="relative aspect-video w-full border-b" style={{ borderColor: "var(--outline-variant)" }}>
          <Image src={ev.banner_url} alt="" fill className="object-cover" sizes="(max-width:768px) 100vw, 25vw" />
        </div>
      ) : (
        <div
          className="flex aspect-video w-full items-center justify-center border-b"
          style={{
            borderColor: "var(--outline-variant)",
            background: "var(--surface-container)",
            color: "var(--on-surface-variant)",
          }}
        >
          <span className="material-symbols-outlined text-3xl opacity-40">image</span>
        </div>
      )}

      <div className="flex flex-col gap-2 p-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold leading-snug" title={ev.name}>
            {ev.name}
          </h3>
          <p className="mt-0.5 truncate text-xs" style={{ color: "var(--on-surface-variant)" }}>
            {dateLabel}
            {ev.location ? ` · ${ev.location}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: "var(--surface-container)", color: "var(--primary)" }}
          >
            {ev.participant_count ?? 0} peserta
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{
              background: past ? "var(--surface-container)" : "var(--primary-container)",
              color: past ? "var(--on-surface-variant)" : "var(--on-primary-container)",
            }}
          >
            {past ? "Selesai" : "Aktif"}
          </span>
          {tier && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={packageStyle(ev.package_type)}>
              {tier}
            </span>
          )}
          {pending && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: "rgba(217,119,6,0.15)", color: "var(--warning)" }}
            >
              Menunggu Pembayaran
            </span>
          )}
        </div>

        {pending ? (
          <span className="text-xs font-medium" style={{ color: "var(--on-surface-variant)", opacity: 0.7 }}>
            Menunggu Konfirmasi
          </span>
        ) : (
          <Link
            href={`/dashboard/events/${ev.id}`}
            className="inline-flex w-fit items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-[--primary-container] cursor-pointer"
            style={{ borderColor: "var(--outline)", color: "var(--primary)" }}
          >
            Manage Event
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function EmptyActiveState() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center"
      style={{ borderColor: "var(--outline)", background: "var(--surface-container-low)" }}
    >
      <span className="material-symbols-outlined mb-3 text-4xl" style={{ color: "var(--on-surface-variant)" }}>
        event_busy
      </span>
      <p className="mb-1 text-sm font-semibold">Belum ada event aktif</p>
      <p className="mb-4 max-w-xs text-xs" style={{ color: "var(--on-surface-variant)" }}>
        Buat event baru untuk mulai menerima pendaftaran.
      </p>
      <Link
        href="/create/package"
        className="rounded-lg px-4 py-2 text-xs font-bold cursor-pointer"
        style={{ background: "var(--primary)", color: "var(--on-primary)" }}
      >
        Buat Event Baru
      </Link>
    </div>
  );
}

export default function DashboardHomePanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { upcoming, past, loading } = useDashboardData();
  const [profileGreeting, setProfileGreeting] = useState("");
  const [pastOpen, setPastOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [nowMs, setNowMs] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const legacyEventId = searchParams.get("eventId");
    if (legacyEventId) {
      router.replace(`/dashboard/events/${legacyEventId}`);
    }
  }, [searchParams, router]);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || !active) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, username")
        .eq("id", session.user.id)
        .single();

      setProfileGreeting(profile?.full_name || profile?.username || session.user.email || "Organizer");
    };

    void loadProfile();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setReadIds(JSON.parse(localStorage.getItem("bdforms_read_notifications") || "[]"));
    setNowMs(Date.now());
    const onDown = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const notifications = useMemo(
    () => generateNotifications([...upcoming, ...past]).map((n) => ({ ...n, read: readIds.includes(n.id) })),
    [upcoming, past, readIds],
  );
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAllRead = () => {
    const ids = notifications.map((n) => n.id);
    localStorage.setItem("bdforms_read_notifications", JSON.stringify(ids));
    setReadIds(ids);
  };
  const relativeTime = (d: Date) => {
    const h = Math.floor(((nowMs || d.getTime()) - d.getTime()) / 3600000);
    if (h < 1) return "baru saja";
    if (h < 24) return `${h} jam lalu`;
    return `${Math.floor(h / 24)} hari lalu`;
  };

  const totalEvents = upcoming.length + past.length;

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
    <div className="bd px-4 pb-16 pt-6 md:px-10">
      <header
        className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-5"
        style={{ borderColor: "var(--outline-variant)" }}
      >
        <h1 className="text-2xl font-bold">Halo, {profileGreeting}!</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/create/package"
            className="rounded-xl px-5 py-2.5 text-center text-sm font-bold shadow-sm transition hover:-translate-y-0.5 cursor-pointer"
            style={{ background: "var(--primary)", color: "var(--on-primary)" }}
          >
            Buat Event Baru
          </Link>
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border transition hover:bg-[--surface-container] cursor-pointer"
              style={{ borderColor: "var(--outline-variant)" }}
              aria-label="Notifikasi"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500" />}
            </button>
            {notifOpen && (
              <div
                className="absolute right-0 top-full z-50 mt-3 max-h-96 w-80 overflow-y-auto rounded-2xl border p-4 shadow-2xl"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--outline-variant)",
                  boxShadow: "var(--shadow-lg)",
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-bold">Notifikasi</p>
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs cursor-pointer"
                    style={{ color: "var(--primary)" }}
                  >
                    Tandai semua dibaca
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="py-8 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>
                    Tidak ada notifikasi
                  </p>
                ) : (
                  notifications.map((n) => {
                    const color = {
                      success: "var(--success)",
                      warning: "var(--warning)",
                      info: "var(--primary)",
                      error: "var(--error)",
                    }[n.type];
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => n.eventId && router.push(`/dashboard/events/${n.eventId}`)}
                        className="flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-[--surface-container] cursor-pointer"
                      >
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
                        <span className="min-w-0">
                          <span className="block text-sm font-bold">{n.title}</span>
                          <span className="line-clamp-2 block text-xs" style={{ color: "var(--on-surface-variant)" }}>
                            {n.message}
                          </span>
                          <span className="mt-1 block text-[10px]" style={{ color: "var(--on-surface-variant)" }}>
                            {relativeTime(n.createdAt)}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        {totalEvents === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="material-symbols-outlined mb-4 text-6xl" style={{ color: "var(--on-surface-variant)" }}>
              event
            </span>
            <h2 className="mb-2 text-xl font-bold">Belum ada event</h2>
            <p className="mb-6 max-w-sm text-sm" style={{ color: "var(--on-surface-variant)" }}>
              Buat event pertamamu dan mulai terima pendaftaran!
            </p>
            <Link
              href="/create/package"
              className="rounded-xl px-6 py-3 font-bold cursor-pointer"
              style={{ background: "var(--primary)", color: "var(--on-primary)" }}
            >
              Buat Event Baru
            </Link>
          </div>
        ) : (
          <>
            <section className="mb-6">
              <div className="mb-3 flex items-center gap-3 border-b pb-2" style={{ borderColor: "var(--outline-variant)" }}>
                <h2 className="text-base font-bold">Event Aktif</h2>
                <span className="text-xs font-medium" style={{ color: "var(--on-surface-variant)" }}>
                  {upcoming.length}
                </span>
              </div>
              {upcoming.length === 0 ? (
                <EmptyActiveState />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {upcoming.map((ev) => (
                    <EventCard key={ev.id} ev={ev} />
                  ))}
                </div>
              )}
            </section>

            {past.length > 0 && (
              <section>
                <button
                  type="button"
                  onClick={() => setPastOpen((v) => !v)}
                  className="mb-3 flex w-full items-center justify-between border-b pb-2 text-base font-bold cursor-pointer"
                  style={{ borderColor: "var(--outline-variant)" }}
                >
                  <span className="flex items-center gap-3">
                    Event Selesai
                    <span className="text-xs font-medium" style={{ color: "var(--on-surface-variant)" }}>
                      {past.length}
                    </span>
                  </span>
                  <span className="material-symbols-outlined">{pastOpen ? "expand_less" : "expand_more"}</span>
                </button>
                {pastOpen && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {past.map((ev) => (
                      <EventCard key={ev.id} ev={ev} past />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
