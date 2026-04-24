import { NextResponse } from "next/server";
import { customerPrincipalToSyntheticEmail } from "@/lib/mb178/phone";
import { createMb178Client } from "@/lib/supabase/admin";

interface RegisterBody {
  phone?: string;
  password?: string;
  displayName?: string;
}

/**
 * Daftar pelanggan dengan email sintetis langsung aktif (tanpa konfirmasi email).
 * Membutuhkan SUPABASE_SERVICE_ROLE_KEY di server.
 */
export async function POST(request: Request) {
  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }

  const phoneRaw = typeof body.phone === "string" ? body.phone.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim() : "";

  if (!displayName) {
    return NextResponse.json({ error: "Nama wajib diisi." }, { status: 400 });
  }
  if (!/^\d{6}$/.test(password)) {
    return NextResponse.json(
      { error: "Password harus 6 digit angka." },
      { status: 400 }
    );
  }

  const mapped = customerPrincipalToSyntheticEmail(phoneRaw);
  if ("error" in mapped) {
    return NextResponse.json({ error: mapped.error }, { status: 400 });
  }
  if (mapped.phoneDigits62 === null) {
    return NextResponse.json(
      { error: "Gunakan no. HP (mulai 08…) untuk mendaftar." },
      { status: 400 }
    );
  }

  const admin = createMb178Client();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Pendaftaran instan belum dikonfigurasi. Isi SUPABASE_SERVICE_ROLE_KEY di server, atau nonaktifkan “Confirm email” di Supabase Auth lalu daftar dari aplikasi.",
      },
      { status: 503 }
    );
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: mapped.email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: displayName,
      display_name: displayName,
      phone: mapped.phoneDigits62,
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("already") ||
      msg.includes("registered") ||
      msg.includes("exists")
    ) {
      return NextResponse.json(
        { error: "No. HP ini sudah terdaftar. Silakan masuk." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Gagal membuat akun." },
      { status: 400 }
    );
  }

  if (!data.user) {
    return NextResponse.json({ error: "Gagal membuat akun." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId: data.user.id });
}
