import { describe, expect, it } from "vitest";
import {
  isMb178CustomerPhoneLocalPart,
  isMb178SeedStaffEmail,
  isMb178SeedStaffLocalPart,
} from "../lib/mb178/staff-account";

describe("staff-account", () => {
  it("detects seed staff emails", () => {
    expect(isMb178SeedStaffEmail("toko06@mb178.online")).toBe(true);
    expect(isMb178SeedStaffEmail("master@mb178.online")).toBe(true);
    expect(isMb178SeedStaffEmail("TOKO01@mb178.online")).toBe(true);
  });

  it("does not treat customer phone synthetic email as staff", () => {
    expect(isMb178SeedStaffEmail("6281211172228@mb178.online")).toBe(false);
  });

  it("local part helpers", () => {
    expect(isMb178SeedStaffLocalPart("toko06")).toBe(true);
    expect(isMb178SeedStaffLocalPart("toko99")).toBe(true);
    expect(isMb178CustomerPhoneLocalPart("6281211172228")).toBe(true);
  });
});
