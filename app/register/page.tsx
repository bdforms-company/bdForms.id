import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import RegisterClient from "./RegisterClient";

const SITE_URL = "https://www.regesit.com";

type Props = {
  searchParams: Promise<{ eventId?: string | string[] }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const eventId = typeof params.eventId === "string" ? params.eventId : undefined;

  if (!eventId) {
    return {
      title: "Registrasi Event | Regesit",
      description: "Daftar untuk hadir di acara ini menggunakan Regesit.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: event } = await supabase
    .from("events")
    .select("name, banner_url")
    .eq("id", eventId)
    .single();

  if (!event?.name) {
    return {
      title: "Registrasi Event | Regesit",
      description: "Daftar untuk hadir di acara ini menggunakan Regesit.",
    };
  }

  const title = `${event.name} — Daftar Sekarang | Regesit`;
  const description = `Daftar untuk hadir di ${event.name}. Dapatkan tiket QR digital instan. Powered by Regesit.`;
  const images = event.banner_url
    ? [{ url: event.banner_url, width: 1200, height: 630, alt: event.name }]
    : [{ url: `${SITE_URL}/logo.png`, width: 512, height: 512, alt: "Regesit" }];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/register?eventId=${eventId}`,
      images,
      type: "website",
      siteName: "Regesit",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export default function RegisterPage() {
  return <RegisterClient />;
}
