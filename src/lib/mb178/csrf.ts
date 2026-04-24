import { NextResponse } from "next/server";

/**
 * Validasi CSRF sederhana untuk API routes.
 * Memastikan request berasal dari origin yang sama.
 */
export function validateCsrf(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  // Jika tidak ada origin (misal server-to-server atau alat dev), izinkan jika bukan POST/PATCH/DELETE
  // Tapi untuk keamanan mutlak pada mutasi, kita wajibkan origin match host.
  if (["POST", "PATCH", "DELETE", "PUT"].includes(req.method)) {
    if (!origin || !host) return false;
    
    // Parsing origin untuk mendapatkan hostnya saja
    try {
      const originHost = new URL(origin).host;
      return originHost === host;
    } catch {
      return false;
    }
  }

  return true;
}

export function csrfErrorResponse() {
  return NextResponse.json(
    { error: "Invalid request origin (CSRF validation failed)" },
    { status: 403 }
  );
}
