"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import "../design.css";

const NAV_ITEMS = [
  { id: "dashboard", label: "Central Dashboard", path: "/dashboard", icon: "dashboard" },
  { id: "analytics", label: "Analytic Event", path: "/dashboard/analytics", icon: "monitoring" },
  { id: "calendar", label: "Kalender Event", path: "/dashboard/calendar", icon: "calendar_today" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null; username: string | null } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    return () => { active = false; };
  }, [user]);

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
      <div className="flex min-h-screen bg-[--background]" style={{ color: "var(--on-background)" }}>
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r border-[--outline-variant] bg-[--surface-container-low] p-6 shrink-0">
          {/* Logo */}
          <Link href="/dashboard" className="mb-10 flex items-center gap-3 text-xl font-bold" style={{ color: "var(--brand-blue)" }}>
            <Image src="/logo.png" alt="bdForms" width={28} height={28} className="h-7 w-auto" />
            <span>bdForms</span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex-1 flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:bg-[--surface-container-high] hover:scale-[1.01]"
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

          {/* Footer (User Profile & Theme Toggle) */}
          <div className="mt-auto border-t border-[--outline-variant] pt-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
            </div>
            
            <div className="flex items-center gap-3 border-t border-[--outline-variant] pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-white shrink-0" style={{ background: "var(--brand-gradient)" }}>
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="Avatar" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate leading-tight">{displayName}</p>
                <p className="text-xs truncate text-[--on-surface-variant] leading-tight" style={{ color: "var(--on-surface-variant)" }}>{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="rounded-lg p-2 text-[--error] hover:bg-red-500/10 shrink-0" style={{ color: "var(--error)" }} title="Keluar">
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Header & Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Top Navbar */}
          <header className="md:hidden sticky top-0 z-40 border-b bg-[--surface-container-low] border-[--outline-variant] px-4 py-3 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold" style={{ color: "var(--brand-blue)" }}>
              <Image src="/logo.png" alt="bdForms" width={24} height={24} className="h-6 w-auto" />
              <span className="text-lg">bdForms</span>
            </Link>

            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="rounded-lg p-2 border border-[--outline-variant]"
              style={{ borderColor: "var(--outline-variant)" }}
            >
              <span className="material-symbols-outlined text-lg">{isMobileMenuOpen ? "close" : "menu"}</span>
            </button>
          </header>

          {/* Mobile Menu Drawer */}
          {isMobileMenuOpen && (
            <div 
              className="md:hidden fixed inset-0 top-[53px] z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <nav 
                className="w-64 h-full bg-[--surface-container-low] border-r border-[--outline-variant] p-6 flex flex-col gap-2"
                onClick={(e) => e.stopPropagation()}
                style={{ borderColor: "var(--outline-variant)" }}
              >
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all"
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

                <div className="mt-auto border-t border-[--outline-variant] pt-6 flex items-center gap-3" style={{ borderColor: "var(--outline-variant)" }}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-white shrink-0" style={{ background: "var(--brand-gradient)" }}>
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar_url} alt="Avatar" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate leading-tight">{displayName}</p>
                    <p className="text-xs truncate text-[--on-surface-variant] leading-tight" style={{ color: "var(--on-surface-variant)" }}>{user?.email}</p>
                  </div>
                  <button onClick={handleLogout} className="rounded-lg p-2 text-[--error] shrink-0" style={{ color: "var(--error)" }} title="Keluar">
                    <span className="material-symbols-outlined text-lg">logout</span>
                  </button>
                </div>
              </nav>
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
