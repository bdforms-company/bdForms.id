import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import RegisterClient from "./RegisterClient";

const GENERIC_TITLE = "Registrasi | bdForms";

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

type Props = {
  searchParams: Promise<{ eventId?: string | string[] }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const eventId = typeof params.eventId === "string" ? params.eventId : undefined;

  if (!eventId) {
    return { title: GENERIC_TITLE };
  }

  const { data } = await supabase
    .from("events")
    .select("name, banner_url")
    .eq("id", eventId)
    .single();

  if (!data?.name) {
    return {
      title: 'Registrasi Event — bdForms',
      description: 'Daftar untuk hadir di event. Isi form dan dapatkan QR tiket instan.'
    };
  }

  const eventName = data.name;
  const title = `${eventName} — Daftar Sekarang | bdForms`;
  const description = `Daftar untuk hadir di ${eventName}. Isi form dan dapatkan QR tiket instan.`;
  const imageUrl = data.banner_url || `${getBaseUrl()}/og-default.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${getBaseUrl()}/register?eventId=${eventId}`,
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function RegisterPage() {
  return <RegisterClient />;
}
