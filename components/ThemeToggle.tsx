"use client";

import { useEffect, useState } from "react";

const getStoredTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem("theme") as "light" | "dark" | null) || "light";
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(getStoredTheme);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.dataset.theme = "dark";
    } else {
      delete document.documentElement.dataset.theme;
    }
  }, [theme]);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    if (next === "dark") {
      document.documentElement.dataset.theme = "dark";
    } else {
      delete document.documentElement.dataset.theme;
    }
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center justify-center rounded-full border transition-colors hover:bg-[var(--surface-container)]"
      style={{
        width: 36,
        height: 36,
        borderColor: "var(--outline)",
      }}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      <span className="material-symbols-outlined text-lg" style={{ color: "var(--on-surface-variant)", fontSize: 18 }}>
        {theme === "light" ? "dark_mode" : "light_mode"}
      </span>
    </button>
  );
}