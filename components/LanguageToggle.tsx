"use client";

import { useState } from "react";

const getStoredLang = (): "id" | "en" => {
  if (typeof window === "undefined") return "id";
  return (localStorage.getItem("lang") as "id" | "en" | null) || "id";
};

export default function LanguageToggle() {
  const [lang, setLang] = useState<"id" | "en">(getStoredLang);

  const toggle = () => {
    const next = lang === "id" ? "en" : "id";
    setLang(next);
    localStorage.setItem("lang", next);
    window.dispatchEvent(new CustomEvent("langchange", { detail: next }));
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center justify-center rounded-full border px-2.5 text-xs font-bold transition-colors hover:bg-[var(--surface-container)]"
      style={{
        height: 36,
        borderColor: "var(--outline)",
        color: "var(--on-surface-variant)",
      }}
      aria-label={`Switch language to ${lang === "id" ? "English" : "Indonesian"}`}
    >
      {lang.toUpperCase()}
    </button>
  );
}