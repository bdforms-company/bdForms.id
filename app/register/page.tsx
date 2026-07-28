import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import RegisterClient from "./RegisterClient";

const SITE_URL = "https://www.bdforms.id";

type Props = {
  searchParams: Promise<{ eventId?: string | string[] }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const eventId = typeof params.eventId === "string" ? params.eventId : undefined;

  if (!eventId) {
    return {
      title: "Registrasi Event | bdForms",
      description: "Daftar untuk hadir di acara ini menggunakan bdForms.",
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
      title: "Registrasi Event | bdForms",
      description: "Daftar untuk hadir di acara ini menggunakan bdForms.",
    };
  }

  const title = `${event.name} — Daftar Sekarang | bdForms`;
  const description = `Daftar untuk hadir di ${event.name}. Dapatkan tiket QR digital instan. Powered by bdForms.`;
  const images = event.banner_url
    ? [{ url: event.banner_url, width: 1200, height: 630, alt: event.name }]
    : [{ url: `${SITE_URL}/logo.png`, width: 512, height: 512, alt: "bdForms" }];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/register?eventId=${eventId}`,
      images,
      type: "website",
      siteName: "bdForms",
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
