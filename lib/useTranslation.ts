"use client";

import { useEffect, useState, useCallback } from "react";
import idMessages from "@/messages/id.json";
import enMessages from "@/messages/en.json";

const messages: Record<string, typeof idMessages> = { id: idMessages, en: enMessages };

const getStoredLang = (): "id" | "en" => {
  if (typeof window === "undefined") return "id";
  return (localStorage.getItem("lang") as "id" | "en" | null) || "id";
};

function get(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof current === "string" ? current : path;
}

export function useTranslation() {
  const [lang, setLang] = useState<"id" | "en">(getStoredLang);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as "id" | "en";
      setLang(detail);
    };
    window.addEventListener("langchange", handler);
    return () => window.removeEventListener("langchange", handler);
  }, []);

  const t = useCallback(
    (key: string): string => get(messages[lang] as unknown as Record<string, unknown>, key),
    [lang]
  );

  return { t, lang };
}