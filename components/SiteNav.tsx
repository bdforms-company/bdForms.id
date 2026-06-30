"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { href: "#how-it-works", label: "Cara Kerja" },
  { href: "#features", label: "Fitur" },
  { href: "#pricing", label: "Harga" },
  { href: "#faq", label: "FAQ" },
];

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: "var(--background)",
          borderBottom: "1px solid var(--outline-variant)",
          boxShadow: scrolled ? "var(--shadow-sm)" : "none",
        }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={32} height={32} className="h-8 w-8" />
            <span className="text-lg font-bold" style={{ color: "var(--primary)" }}>bdForms</span>
          </Link>

          {/* Center: Nav Links (hidden on scroll & mobile) */}
          <div
            className="hidden md:flex items-center gap-8 transition-all duration-300"
            style={{
              opacity: scrolled ? 0 : 1,
              pointerEvents: scrolled ? "none" : "auto",
              transform: scrolled ? "translateY(-8px)" : "translateY(0)",
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors hover:text-[var(--primary)]"
                style={{ color: "var(--on-surface-variant)" }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <ThemeToggle />
            </div>
            <Link
              href="/auth/login"
              className="hidden sm:inline-flex text-sm font-medium px-3 py-2 rounded-lg transition-colors hover:bg-[var(--surface-container)]"
              style={{ color: "var(--on-surface-variant)" }}
            >
              Masuk
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg px-4 py-2 text-sm font-bold transition-colors"
              style={{ background: "var(--primary)", color: "var(--on-primary)" }}
            >
              Mulai Sekarang
            </Link>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex md:hidden items-center justify-center rounded-lg p-2 hover:bg-[var(--surface-container)]"
              aria-label="Menu"
            >
              <span className="material-symbols-outlined" style={{ color: "var(--on-surface)" }}>
                {mobileOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden border-t px-4 pb-4"
            style={{ borderColor: "var(--outline-variant)", background: "var(--background)" }}
          >
            <div className="flex flex-col gap-1 pt-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--surface-container)]"
                  style={{ color: "var(--on-surface)" }}
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--surface-container)]"
                style={{ color: "var(--on-surface)" }}
              >
                Masuk
              </Link>
              <div className="flex items-center gap-2 px-3 pt-2">
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
      </nav>
      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}
