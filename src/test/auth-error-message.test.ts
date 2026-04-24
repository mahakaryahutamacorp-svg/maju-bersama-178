import { describe, expect, it } from "vitest";
import { mb178SupabaseAuthMessage } from "../lib/mb178/auth-error-message";

describe("mb178SupabaseAuthMessage", () => {
  it("maps disabled email logins to setup instructions", () => {
    const out = mb178SupabaseAuthMessage(
      "Email logins are disabled",
      "customer_login"
    );
    expect(out).toContain("Supabase");
    expect(out).toContain("@mb178.online");
  });

  it("maps invalid credentials for owner", () => {
    expect(
      mb178SupabaseAuthMessage("Invalid login credentials", "owner_login")
    ).toBe("Username atau password salah.");
  });
});
