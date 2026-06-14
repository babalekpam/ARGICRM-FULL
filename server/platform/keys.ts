/**
 * API key generation + hashing.
 *
 * Keys are high-entropy random tokens, so we store a fast SHA-256 hash (not
 * bcrypt) — lookup is by exact hash. The plaintext key is shown to the user
 * exactly once, at creation time, matching the Twenty / Stripe convention.
 *
 *   Format:  argi_<env>_<43 url-safe chars>
 *   Stored:  sha256(key) + a display prefix + last 4 chars
 */
import { randomBytes, createHash, timingSafeEqual } from "crypto";

const ENV = process.env.NODE_ENV === "production" ? "live" : "test";

export interface GeneratedKey {
  plaintext: string;
  hash: string;
  prefix: string;
  last4: string;
}

export function generateApiKey(): GeneratedKey {
  const random = randomBytes(32).toString("base64url"); // 43 url-safe chars
  const prefix = `argi_${ENV}`;
  const plaintext = `${prefix}_${random}`;
  return {
    plaintext,
    hash: hashApiKey(plaintext),
    prefix,
    last4: plaintext.slice(-4),
  };
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** Constant-time compare of two hex hashes. */
export function safeEqualHash(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
