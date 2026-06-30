import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function DocSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("events")
    .select("doc_url")
    .eq("doc_slug", slug)
    .single();

  if (data?.doc_url) {
    redirect(data.doc_url);
  }

  return (
    <div className="bd flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <span className="material-symbols-outlined text-6xl" style={{ color: "var(--error)" }}>
        article
      </span>
      <h1 className="text-2xl font-bold">Dokumen tidak ditemukan</h1>
      <p className="max-w-sm text-sm" style={{ color: "var(--on-surface-variant)" }}>
        Link dokumen ini tidak valid atau materi sudah tidak tersedia.
      </p>
    </div>
  );
}
