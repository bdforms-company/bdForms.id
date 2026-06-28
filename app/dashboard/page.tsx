"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/lib/supabase";
import "../design.css";

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
};

function EventCard({ ev, past }: { ev: EventRow; past?: boolean }) {
  const dateLabel = ev.event_date
    ? new Date(ev.event_date).toLocaleDateString("id-ID", { dateStyle: "long" })
    : "Tanggal belum diatur";

  return (
    <div className="glass overflow-hidden rounded-2xl">
      {ev.banner_url && (
        <div className="relative aspect-video w-full">
          <Image src={ev.banner_url} alt={ev.name} fill className="object-cover" unoptimized />
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
                background: ev.package_type === 'starter' ? 'var(--surface-container)' : ev.package_type === 'standard' ? 'rgba(0,150,255,0.15)' : ev.package_type === 'pro' ? 'rgba(91,255,161,0.15)' : 'rgba(255,191,0,0.15)',
                color: ev.package_type === 'starter' ? 'var(--on-surface-variant)' : ev.package_type === 'standard' ? '#0096ff' : ev.package_type === 'pro' ? 'var(--green)' : '#ffbf00'
              }}
            >
              {ev.package_type === 'starter' ? 'Starter' : ev.package_type === 'standard' ? 'Standard' : ev.package_type === 'pro' ? 'Pro' : 'Enterprise'}
            </span>
          )}
          {ev.package_status === 'pending_payment' && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ background: 'rgba(255,191,0,0.15)', color: '#ffbf00' }}
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
            style={{ color: "var(--green)" }}
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
  const [greeting, setGreeting] = useState("");
  const [upcoming, setUpcoming] = useState<EventRow[]>([]);
  const [past, setPast] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pastOpen, setPastOpen] = useState(true);

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

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();

      setGreeting(profile?.full_name || session.user.email || "Organizer");

      const { data: events } = await supabase
        .from("events")
        .select("id, name, event_date, location, banner_url, status, package_type, package_status")
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
    await supabase.auth.signOut();
    router.push("/");
  };

  const totalEvents = upcoming.length + past.length;

  if (loading) {
    return (
      <div className="bd flex min-h-screen items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-5xl" style={{ color: "var(--green)" }}>
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="bd min-h-screen px-4 pt-6 pb-16 md:px-10">
      <header className="mx-auto mb-10 flex max-w-5xl flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Halo, {greeting}! 👋</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/create/package"
            className="rounded-xl px-5 py-2.5 text-sm font-bold"
            style={{ background: "var(--green)", color: "var(--on-green)" }}
          >
            Buat Event Baru
          </Link>
          <button
            onClick={handleLogout}
            className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-white/5"
            style={{ borderColor: "var(--outline-variant)" }}
            aria-label="Logout"
          >
            <span className="material-symbols-outlined" style={{ color: "var(--on-surface-variant)" }}>logout</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl">
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
              style={{ background: "var(--green)", color: "var(--on-green)" }}
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {past.map((ev) => (
                      <EventCard key={ev.id} ev={ev} past />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Suspense fallback={
        <div className="bd flex min-h-screen items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-5xl" style={{ color: "var(--green)" }}>progress_activity</span>
        </div>
      }>
        <DashboardContent />
      </Suspense>
    </AuthGuard>
  );
}
