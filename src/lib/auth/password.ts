import crypto from "crypto";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEYLEN = 32;

export function hashPassword(password: string, saltBase64?: string) {
  const salt = saltBase64
    ? Buffer.from(saltBase64, "base64")
    : crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return {
    hashBase64: derived.toString("base64"),
    saltBase64: salt.toString("base64"),
  };
}

export function verifyPassword(password: string, saltBase64: string, hashBase64: string) {
  const { hashBase64: next } = hashPassword(password, saltBase64);
  const a = Buffer.from(next, "base64");
  const b = Buffer.from(hashBase64, "base64");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

