import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase/ssr";
import { createMb178Client } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/mb178/rate-limit";
import { validateCsrf, csrfErrorResponse } from "@/lib/mb178/csrf";

export async function PATCH(request: Request) {
  if (!validateCsrf(request)) return csrfErrorResponse();
  
  const ip = getClientIp(request);
  const { success } = rateLimit(`profile_${ip}`, 5, 10 * 60 * 1000);
  
  if (!success) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Silakan tunggu 10 menit." },
      { status: 429 }
    );
  }

  const supabase = await createSupabaseRouteClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { display_name, password } = body;

  const admin = createMb178Client();
  if (!admin) {
    return NextResponse.json({ error: "Admin client not configured" }, { status: 503 });
  }

  /* 1. Update display_name di tabel members */
  if (typeof display_name === "string") {
    const { error: memberErr } = await admin
      .from("members")
      .update({ display_name: display_name.trim() })
      .eq("id", auth.user.id);

    if (memberErr) {
      return NextResponse.json({ error: memberErr.message }, { status: 500 });
    }
  }

  /* 2. Update password (PIN) jika diberikan */
  if (typeof password === "string" && password.length >= 4) {
    const { error: authErr } = await admin.auth.admin.updateUserById(auth.user.id, {
      password: password,
    });

    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
