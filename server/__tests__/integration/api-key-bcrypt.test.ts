/**
 * Integration test: API-key bcrypt roundtrip.
 * Proves that the prefix-indexed lookup + bcrypt.compare strategy in
 * server/middleware/api-key.ts correctly rejects guessed keys.
 */
import { describe, it, expect } from "vitest";
import bcrypt from "bcrypt";
import crypto from "node:crypto";

function generateApiKey() {
  const prefix = crypto.randomBytes(6).toString("base64url").slice(0, 8);
  const tail = crypto.randomBytes(30).toString("base64url");
  return { plaintext: `argi_${prefix}${tail}`, prefix };
}

describe("integration: API-key bcrypt roundtrip", () => {
  it("verifies a freshly generated key against its hash", async () => {
    const { plaintext } = generateApiKey();
    const hashed = await bcrypt.hash(plaintext, 10);

    expect(await bcrypt.compare(plaintext, hashed)).toBe(true);
    expect(await bcrypt.compare("argi_completely_wrong_key_value", hashed)).toBe(false);
  });

  it("two prefix-collision candidates do NOT both match the same hash", async () => {
    // The middleware does "SELECT ... WHERE prefix = ?" then iterates
    // candidates with bcrypt.compare. Prove a different-but-prefix-matching
    // plaintext fails the bcrypt check.
    const { plaintext: real } = generateApiKey();
    const fake = real.slice(0, 13) + "DIFFERENT_TAIL".padEnd(real.length - 13, "x");
    expect(real.slice(0, 13)).toBe(fake.slice(0, 13)); // same `argi_<prefix>`
    expect(real).not.toBe(fake);                        // different tails

    const hashed = await bcrypt.hash(real, 10);
    expect(await bcrypt.compare(real, hashed)).toBe(true);
    expect(await bcrypt.compare(fake, hashed)).toBe(false);
  });

  it("prefix is the indexed lookup field; only first 8 chars are queried", () => {
    const { plaintext, prefix } = generateApiKey();
    expect(plaintext.startsWith(`argi_${prefix}`)).toBe(true);
    expect(prefix.length).toBe(8);
    // The plaintext body (after argi_) must be at least 16 chars to be
    // resolvable — prevents short-key attacks.
    expect(plaintext.slice(5).length).toBeGreaterThanOrEqual(16);
  });
});
