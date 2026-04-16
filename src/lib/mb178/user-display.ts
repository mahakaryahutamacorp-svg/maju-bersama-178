/** Bagian lokal email sintetis MB178, mis. `yayan12` dari `yayan12@local.mb178`. */
export function mb178UsernameFromEmail(email: string | undefined | null): string {
  if (!email || typeof email !== "string") return "";
  const at = email.indexOf("@");
  const local = at > 0 ? email.slice(0, at) : email;
  const t = local.trim();
  if (!t) return email.trim();
  if (/^628\d{8,12}$/.test(t)) {
    return `0${t.slice(2)}`;
  }
  return t;
}

/** Nama yang ditampilkan: `members.display_name` / metadata, lalu fallback username. */
export function resolveMb178DisplayLabel(
  user: {
    email?: string | null;
    user_metadata?: Record<string, unknown> | null;
  } | null,
  memberDisplayName: string | null | undefined
): string {
  if (!user) return "";
  const fromMember = memberDisplayName?.trim();
  if (fromMember) return fromMember;
  const meta = user.user_metadata ?? {};
  const dn = meta.display_name;
  const fn = meta.full_name;
  if (typeof dn === "string" && dn.trim()) return dn.trim();
  if (typeof fn === "string" && fn.trim()) return fn.trim();
  return mb178UsernameFromEmail(user.email ?? null);
}
