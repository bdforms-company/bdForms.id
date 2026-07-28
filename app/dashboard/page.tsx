"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/lib/supabase";
import { generateNotifications } from "@/lib/notifications";
import "../design.css";

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
};

type EventRow = {
  id: string;
  name: string;
  event_date: string | null;
  location: string | null;
  banner_url: string | null;
  status: "active" | "closed";
  participant_count?: number;
  package_type?: string;
  package_status?: string;
  expected_participants?: number | null;
  registration_deadline?: string | null;
  created_at?: string | null;
};

function EventCard({ ev, past }: { ev: EventRow; past?: boolean }) {
  const dateLabel = ev.event_date
    ? new Date(ev.event_date).toLocaleDateString("id-ID", { dateStyle: "long" })
    : "Tanggal belum diatur";

  return (
    <div className="glass overflow-hidden rounded-2xl shadow-md transition hover:-translate-y-1 hover:shadow-lg">
      {ev.banner_url && (
        <div className="relative aspect-video w-full">
          <Image src={ev.banner_url} alt={ev.name} fill className="object-cover" />
        </div>
      )}
      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold">{ev.name}</h3>
          <span className="shrink-0 text-xs">{past ? "⚫" : "🟢"}</span>
        </div>
        <p className="mb-1 text-sm" style={{ color: "var(--on-surface-variant)" }}>{dateLabel}</p>
        {ev.location && (
          <p className="mb-3 text-sm" style={{ color: "var(--on-surface-variant)" }}>{ev.location}</p>
        )}
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ background: "var(--surface-container)", color: "var(--primary)" }}
          >
            {ev.participant_count ?? 0} peserta
          </span>
          <span className="text-xs" style={{ color: "var(--on-surface-variant)" }}>
            {past ? "Selesai" : "Aktif"}
          </span>
          {ev.package_type && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                background: ev.package_type === 'starter' ? 'var(--surface-container)' : ev.package_type === 'standard' ? 'rgba(0,102,255,0.12)' : ev.package_type === 'pro' ? 'rgba(0,200,255,0.14)' : 'rgba(217,119,6,0.15)',
                color: ev.package_type === 'starter' ? 'var(--on-surface-variant)' : ev.package_type === 'standard' ? 'var(--on-primary-container)' : ev.package_type === 'pro' ? 'var(--accent-secondary)' : 'var(--warning)'
              }}
            >
              {ev.package_type === 'starter' ? 'Starter' : ev.package_type === 'standard' ? 'Standard' : ev.package_type === 'pro' ? 'Pro' : 'Enterprise'}
            </span>
          )}
          {ev.package_status === 'pending_payment' && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ background: 'rgba(217,119,6,0.15)', color: 'var(--warning)' }}
            >
              ⏳ Menunggu Pembayaran
            </span>
          )}
        </div>
        {ev.package_status === 'pending_payment' ? (
          <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--on-surface-variant)', opacity: 0.6 }}>
            Menunggu Konfirmasi
          </span>
        ) : (
          <Link
            href={`/dashboard/events/${ev.id}`}
            className="inline-flex items-center gap-1 text-sm font-semibold"
            style={{ color: "var(--primary)" }}
          >
            Manage Event →
          </Link>
        )}
      </div>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profileGreeting, setProfileGreeting] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileFullName, setProfileFullName] = useState<string | null>(null);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [upcoming, setUpcoming] = useState<EventRow[]>([]);
  const [past, setPast] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pastOpen, setPastOpen] = useState(true);
  const [email, setEmail] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [nowMs, setNowMs] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const legacyEventId = searchParams.get("eventId");
    if (legacyEventId) {
      router.replace(`/dashboard/events/${legacyEventId}`);
    }
  }, [searchParams, router]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !active) return;

      setEmail(session.user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, username")
        .eq("id", session.user.id)
        .single<Profile>();

      setProfileGreeting(profile?.full_name || profile?.username || session.user.email || "Organizer");
      setAvatarUrl(profile?.avatar_url ?? null);
      setProfileFullName(profile?.full_name ?? null);
      setProfileUsername(profile?.username ?? null);

      const { data: events } = await supabase
        .from("events")
        .select("id, name, event_date, location, banner_url, status, package_type, package_status, expected_participants, registration_deadline, created_at")
        .eq("owner_id", session.user.id)
        .order("event_date", { ascending: false });

      if (!events || !active) {
        setLoading(false);
        return;
      }

      const withCounts = await Promise.all(
        events.map(async (ev) => {
          const { count } = await supabase
            .from("participants")
            .select("*", { count: "exact", head: true })
            .eq("event_id", ev.id);
          return { ...ev, status: (ev.status ?? "active") as "active" | "closed", participant_count: count ?? 0 };
        }),
      );

      if (!active) return;
      setUpcoming(withCounts.filter((e) => e.status === "active"));
      setPast(withCounts.filter((e) => e.status === "closed"));
      setLoading(false);
    };

    load();
    return () => { active = false; };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch (err) {
      console.error("Server-side signout failed:", err);
    }
    await supabase.auth.signOut();
    router.push("/");
  };

  useEffect(() => {
    window.setTimeout(() => {
      setReadIds(JSON.parse(localStorage.getItem("bdforms_read_notifications") || "[]"));
      setNowMs(new Date().getTime());
    }, 0);
    const onDown = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const notifications = useMemo(() => generateNotifications([...upcoming, ...past]).map((n) => ({ ...n, read: readIds.includes(n.id) })), [upcoming, past, readIds]);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAllRead = () => { const ids = notifications.map((n) => n.id); localStorage.setItem("bdforms_read_notifications", JSON.stringify(ids)); setReadIds(ids); };
  const initials = (profileFullName || profileUsername || email || "U").trim().charAt(0).toUpperCase();
  const relativeTime = (d: Date) => { const h = Math.floor(((nowMs || d.getTime()) - d.getTime()) / 3600000); if (h < 1) return "baru saja"; if (h < 24) return `${h} jam lalu`; return `${Math.floor(h / 24)} hari lalu`; };

  const totalEvents = upcoming.length + past.length;

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
    <div className="bd min-h-screen pb-16 px-4 md:px-10 pt-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-6" style={{ borderColor: "var(--outline-variant)" }}>
        <h1 className="text-2xl font-bold">Halo, {profileGreeting}! 👋</h1>
        <div className="flex items-center gap-3">
          <Link href="/create/package" className="rounded-xl px-5 py-2.5 text-center text-sm font-bold shadow-sm transition hover:-translate-y-0.5" style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
            Buat Event Baru
          </Link>
          <div className="relative" ref={notifRef}>
            <button onClick={() => setNotifOpen((v) => !v)} className="relative flex h-10 w-10 items-center justify-center rounded-full border transition hover:bg-[--surface-container]" style={{ borderColor: "var(--outline-variant)" }} aria-label="Notifikasi">
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500" />}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-3 z-50 max-h-96 w-80 overflow-y-auto rounded-2xl border p-4 shadow-2xl" style={{ background: "var(--surface)", borderColor: "var(--outline-variant)", boxShadow: "var(--shadow-lg)" }}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-bold">Notifikasi</p>
                  <button onClick={markAllRead} className="text-xs" style={{ color: "var(--primary)" }}>Tandai semua dibaca</button>
                </div>
                {notifications.length === 0 ? (
                  <p className="py-8 text-center text-sm" style={{ color: "var(--on-surface-variant)" }}>Tidak ada notifikasi</p>
                ) : notifications.map((n) => {
                  const color = { success: "var(--success)", warning: "var(--warning)", info: "var(--primary)", error: "var(--error)" }[n.type];
                  return (
                    <button key={n.id} onClick={() => n.eventId && router.push(`/dashboard/events/${n.eventId}`)} className="flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-[--surface-container]">
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold">{n.title}</span>
                        <span className="line-clamp-2 block text-xs" style={{ color: "var(--on-surface-variant)" }}>{n.message}</span>
                        <span className="mt-1 block text-[10px]" style={{ color: "var(--on-surface-variant)" }}>{relativeTime(n.createdAt)}</span>
                      </span>
                    </button>
                  );
                })}
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
              href="/create"
              className="rounded-xl px-6 py-3 font-bold"
              style={{ background: "var(--primary)", color: "var(--on-primary)" }}
            >
              Buat Event Sekarang
            </Link>
          </div>
        ) : (
          <>
            <section className="mb-10">
              <h2 className="mb-4 text-lg font-bold">Event Aktif</h2>
              {upcoming.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>Belum ada event aktif.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
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
                  className="mb-4 flex w-full items-center justify-between text-lg font-bold"
                >
                  Event Selesai
                  <span className="material-symbols-outlined">{pastOpen ? "expand_less" : "expand_more"}</span>
                </button>
                {pastOpen && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
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

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="bd flex min-h-screen items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-5xl" style={{ color: "var(--primary)" }}>progress_activity</span>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
