import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const SITE_URL = "https://www.bdforms.id";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: event } = await supabase
    .from("events")
    .select("name, banner_url")
    .eq("slug", slug)
    .single();

  if (!event?.name) return { title: "bdForms" };

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
      url: `${SITE_URL}/e/${slug}`,
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

export default async function EventSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, status, package_status")
    .eq("slug", slug)
    .single();

  if (!event) {
    notFound();
  }

  if (event.package_status === "pending_payment") {
    return (
      <div className="bd flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="glass w-full max-w-md rounded-2xl p-8">
          <span className="material-symbols-outlined mb-4 text-7xl" style={{ color: "var(--warning)" }}>schedule</span>
          <h1 className="mb-3 text-2xl font-bold">Pendaftaran Belum Dibuka</h1>
          <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
            Penyelenggara sedang mempersiapkan acara ini. Coba lagi nanti.
          </p>
        </div>
      </div>
    );
  }

  if (event.status === "closed") {
    return (
      <div className="bd flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="glass w-full max-w-md rounded-2xl p-8">
          <span className="material-symbols-outlined mb-4 text-7xl" style={{ color: "var(--error)" }}>event_busy</span>
          <h1 className="mb-3 text-2xl font-bold">Pendaftaran Sudah Ditutup</h1>
          <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
            Pendaftaran untuk acara ini sudah ditutup.
          </p>
        </div>
      </div>
    );
  }

  redirect(`/register?eventId=${event.id}`);
}
