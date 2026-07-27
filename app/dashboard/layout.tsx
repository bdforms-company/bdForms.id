"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import DashboardTabPanels from "@/components/dashboard/DashboardTabPanels";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "../design.css";

const NAV_ITEMS = [
  { id: "dashboard", label: "Central Dashboard", path: "/dashboard", icon: "dashboard" },
  { id: "analytics", label: "Analytic Event", path: "/dashboard/analytics", icon: "monitoring" },
  { id: "calendar", label: "Kalender Event", path: "/dashboard/calendar", icon: "calendar_today" },
];

const TAB_ROUTES = new Set(["/dashboard", "/dashboard/analytics", "/dashboard/calendar"]);

function ProfileMenu({
  displayName,
  email,
  avatarUrl,
  initials,
  onLogout,
  menuOpen,
  setMenuOpen,
  align = "left",
}: {
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
  initials: string;
  onLogout: () => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  align?: "left" | "right";
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, setMenuOpen]);

  return (
    <div className="relative flex items-center gap-2" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1.5 py-1.5 text-left transition-colors hover:bg-[--surface-container-high] cursor-pointer"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title="Profil & pengaturan"
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white"
          style={{ background: "var(--brand-gradient)" }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight">{displayName}</p>
          <p className="truncate text-xs leading-tight" style={{ color: "var(--on-surface-variant)" }}>
            {email}
          </p>
        </div>
        <span
          className="material-symbols-outlined shrink-0 text-base"
          style={{ color: "var(--on-surface-variant)" }}
        >
          {menuOpen ? "expand_more" : "expand_less"}
        </span>
      </button>

      <button
        type="button"
        onClick={onLogout}
        className="shrink-0 rounded-lg p-2 transition-colors hover:bg-red-500/10 cursor-pointer"
        style={{ color: "var(--error)" }}
        title="Keluar"
        aria-label="Keluar"
      >
        <span className="material-symbols-outlined text-lg">logout</span>
      </button>

      {menuOpen && (
        <div
          role="menu"
          className={`absolute bottom-full z-[60] mb-2 w-52 overflow-hidden rounded-xl border py-1 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
          style={{
            background: "var(--surface)",
            borderColor: "var(--outline)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[--surface-container] cursor-pointer"
            style={{ color: "var(--on-surface)" }}
          >
            <span className="material-symbols-outlined text-lg" style={{ color: "var(--on-surface-variant)" }}>
              settings
            </span>
            Settings
          </Link>
          <div className="mx-2 my-1 h-px" style={{ background: "var(--outline-variant)" }} />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-red-500/10 cursor-pointer"
            style={{ color: "var(--error)" }}
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null; username: string | null } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [desktopProfileOpen, setDesktopProfileOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);

  const isTabRoute = TAB_ROUTES.has(pathname);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("profiles")
      .select("full_name, avatar_url, username")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (active && data) {
          setProfile(data);
        }
      });
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    setDesktopProfileOpen(false);
    setMobileProfileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } catch (err) {
      console.error("Server-side signout failed:", err);
    }
    await supabase.auth.signOut();
    router.push("/");
  };

  const displayName = profile?.full_name || profile?.username || user?.email || "Organizer";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <AuthGuard>
      <div
        className="bd bg-[--background]"
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          color: "var(--on-background)",
        }}
      >
        {/* Desktop Sidebar — nav scrolls; footer stays overflow-visible so menu isn't clipped */}
        <aside
          className="hidden md:flex w-64 shrink-0 flex-col border-r border-[--outline-variant] bg-[--surface-container-low] p-6"
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
          }}
        >
          <Link href="/dashboard" className="mb-10 flex items-center gap-3 text-xl font-bold" style={{ color: "var(--brand-blue)" }}>
            <Image src="/logo.png" alt="Regesit" width={28} height={28} className="h-7 w-auto" />
            <span>Regesit</span>
          </Link>

          <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  prefetch
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:bg-[--surface-container-high] hover:scale-[1.01] cursor-pointer"
                  style={{
                    background: isActive ? "var(--primary-container)" : "transparent",
                    color: isActive ? "var(--on-primary-container)" : "var(--on-surface-variant)",
                  }}
                >
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div
            className="mt-auto shrink-0 border-t border-[--outline-variant] pt-4"
            style={{ overflow: "visible" }}
          >
            <ProfileMenu
              displayName={displayName}
              email={user?.email}
              avatarUrl={profile?.avatar_url}
              initials={initials}
              onLogout={handleLogout}
              menuOpen={desktopProfileOpen}
              setMenuOpen={setDesktopProfileOpen}
            />
          </div>
        </aside>

        <div
          className="flex min-w-0 flex-1 flex-col"
          style={{
            flex: 1,
            height: "100vh",
            overflow: "hidden",
          }}
        >
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-[--outline-variant] bg-[--surface-container-low] px-4 py-3 md:hidden">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold" style={{ color: "var(--brand-blue)" }}>
              <Image src="/logo.png" alt="Regesit" width={24} height={24} className="h-6 w-auto" />
              <span className="text-lg">Regesit</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg border border-[--outline-variant] p-2 cursor-pointer"
              style={{ borderColor: "var(--outline-variant)" }}
              aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"}
            >
              <span className="material-symbols-outlined text-lg">{isMobileMenuOpen ? "close" : "menu"}</span>
            </button>
          </header>

          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 top-[53px] z-50 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setMobileProfileOpen(false);
              }}
            >
              <nav
                className="flex h-full w-64 flex-col gap-2 border-r border-[--outline-variant] bg-[--surface-container-low] p-6"
                onClick={(e) => e.stopPropagation()}
                style={{ borderColor: "var(--outline-variant)", overflow: "visible" }}
              >
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                  {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
                    return (
                      <Link
                        key={item.id}
                        href={item.path}
                        prefetch
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all cursor-pointer"
                        style={{
                          background: isActive ? "var(--primary-container)" : "transparent",
                          color: isActive ? "var(--on-primary-container)" : "var(--on-surface-variant)",
                        }}
                      >
                        <span className="material-symbols-outlined text-lg">{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-auto shrink-0 border-t border-[--outline-variant] pt-4" style={{ borderColor: "var(--outline-variant)" }}>
                  <ProfileMenu
                    displayName={displayName}
                    email={user?.email}
                    avatarUrl={profile?.avatar_url}
                    initials={initials}
                    onLogout={handleLogout}
                    menuOpen={mobileProfileOpen}
                    setMenuOpen={setMobileProfileOpen}
                  />
                </div>
              </nav>
            </div>
          )}

          <main
            style={{
              flex: 1,
              overflowY: "auto",
              height: "100vh",
            }}
          >
            <ErrorBoundary>
              {isTabRoute ? <DashboardTabPanels /> : children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
