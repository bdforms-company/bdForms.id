import { createSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ session: null, error: userError?.message || "Invalid session" }, { status: 400 });
    }
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      return NextResponse.json({ session: null, error: sessionError.message }, { status: 400 });
    }
    return NextResponse.json({ session });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ session: null, error: message }, { status: 500 });
  }
}
