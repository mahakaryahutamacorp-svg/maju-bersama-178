import { NextResponse } from "next/server";
import { createMb178ServiceClient } from "@/lib/supabase/admin";
import { hashPassword } from "@/lib/auth/password";
import { hintForSupabaseError } from "@/lib/supabase/error-hints";

function validUserId(v: string) {
  return /^[a-zA-Z0-9._]{3,24}$/.test(v);
}

function validPassword(v: string) {
  return /^\d{6}$/.test(v);
}

export async function POST(request: Request) {
  const supabase = createMb178ServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY belum diisi di server" },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON tidak valid" }, { status: 400 });
  }

  const userId = String(body.userId ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const name = typeof body.name === "string" ? body.name.trim() : null;

  if (!validUserId(userId)) {
    return NextResponse.json(
      { error: "Username tidak valid (3-24 karakter, huruf/angka/._)" },
      { status: 400 }
    );
  }
  if (!validPassword(password)) {
    return NextResponse.json(
      { error: "Password harus 6 digit angka" },
      { status: 400 }
    );
  }

  const { hashBase64, saltBase64 } = hashPassword(password);

  const { data, error } = await supabase
    .from("app_users")
    .insert({
      user_id: userId,
      password_hash: hashBase64,
      password_salt: saltBase64,
      name: name || null,
      role: "customer",
    })
    .select("id, user_id, name, role, created_at")
    .single();

  if (error) {
    const msg = error.message;
    const hint = hintForSupabaseError(msg);
    if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique")) {
      return NextResponse.json(
        { error: "User ID sudah dipakai", hint },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg, hint }, { status: 503 });
  }

  return NextResponse.json({ user: data });
}

