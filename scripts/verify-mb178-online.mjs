/**
 * Smoke test produksi MB178 (tanpa kredensial).
 * Set MB178_SMOKE_BASE_URL untuk target lain (default: https://mb178.online).
 */
const BASE = (process.env.MB178_SMOKE_BASE_URL || "https://mb178.online").replace(
  /\/$/,
  ""
);

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

async function main() {
  const home = await fetch(`${BASE}/`, { redirect: "manual" });
  if (home.status !== 200) {
    fail(`GET / → expected 200, got ${home.status}`);
  }

  const login = await fetch(`${BASE}/login?mode=customer`, {
    redirect: "manual",
  });
  if (login.status !== 200) {
    fail(`GET /login → expected 200, got ${login.status}`);
  }

  const reg = await fetch(`${BASE}/api/auth/register-customer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    redirect: "manual",
  });
  if (reg.status !== 400) {
    fail(`POST /api/auth/register-customer {} → expected 400, got ${reg.status}`);
  }

  const dash = await fetch(`${BASE}/dashboard`, { redirect: "manual" });
  if (![301, 302, 303, 307, 308].includes(dash.status)) {
    fail(
      `GET /dashboard (no cookie) → expected redirect, got ${dash.status}`
    );
  }
  const loc = dash.headers.get("location") || "";
  if (!loc.includes("/login") || !loc.includes("mode=owner")) {
    fail(`GET /dashboard Location unexpected: ${loc}`);
  }

  console.log(`verify-mb178-online OK — ${BASE}`);
}

await main();
