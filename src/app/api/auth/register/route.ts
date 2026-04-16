import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isValidIndonesiaMobileNormalized,
  normalizeIndonesiaPhoneForMb178,
  syntheticEmailForMb178LocalPart,
} from "@/lib/mb178/phone";

interface RegisterRequestBody {
  phone: string;
  password: string;
  displayName: string;
}

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "Supabase belum dikonfigurasi (env)." },
      { status: 500 },
    );
  }

  let body: RegisterRequestBody;
  try {
    body = (await req.json()) as RegisterRequestBody;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }

  const phoneRaw = body.phone?.trim() ?? "";
  const password = body.password ?? "";
  const displayName = body.displayName?.trim() ?? "";

  if (!displayName) {
    return NextResponse.json({ error: "Isi nama Anda." }, { status: 400 });
  }
  if (!/^\d{6}$/.test(password)) {
    return NextResponse.json(
      { error: "Password harus 6 digit angka (contoh: 223344)" },
      { status: 400 },
    );
  }

  const phoneDigits62 = normalizeIndonesiaPhoneForMb178(phoneRaw);
  if (!isValidIndonesiaMobileNormalized(phoneDigits62)) {
    return NextResponse.json(
      { error: "No. HP tidak valid. Gunakan format 08… atau +62…." },
      { status: 400 },
    );
  }

  const email = syntheticEmailForMb178LocalPart(phoneDigits62);
  const sb = createClient(url, serviceKey);
  const res = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: displayName,
      display_name: displayName,
      phone: phoneDigits62,
    },
  });

  if (res.error) {
    const msg = res.error.message || "Gagal daftar";
    const isDup = /duplicate|already registered|already exists/i.test(msg);
    return NextResponse.json(
      { error: msg },
      { status: isDup ? 409 : 500 },
    );
  }

  return NextResponse.json({ ok: true, email });
}

