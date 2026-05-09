/**
 * Integration test: webhook signature verifies on the receiver side.
 *
 * The dispatcher in server/services/webhooks.ts signs every payload
 * with HMAC-SHA256 and sets X-Argilette-Signature: sha256=<hex>. This
 * test demonstrates the canonical RECEIVER implementation a customer
 * would write (using crypto.timingSafeEqual to prevent timing attacks)
 * and proves that signatures emitted by signPayload() verify correctly.
 */
import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { signPayload } from "../../services/webhooks.js";

/**
 * Reference implementation a Webhook receiver would deploy. Returns true
 * iff the signature is valid for the given secret + body.
 */
function verifyWebhookSignature(secret: string, body: string, sigHeader: string): boolean {
  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");

  const a = Buffer.from(sigHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

describe("integration: webhook receiver verifies dispatcher signature", () => {
  const secret = "whsec_test_secret_for_unit_test_only";
  const body = JSON.stringify({
    event: "contact.created",
    tenant_id: "t1",
    sent_at: "2026-01-01T00:00:00.000Z",
    data: { id: "contact-x", email: "a@b.com" },
  });

  it("the canonical receiver implementation accepts a valid signature", () => {
    const signature = signPayload(secret, body);
    expect(verifyWebhookSignature(secret, body, signature)).toBe(true);
  });

  it("rejects when the body is tampered", () => {
    const signature = signPayload(secret, body);
    const tamperedBody = body.replace("contact.created", "contact.deleted");
    expect(verifyWebhookSignature(secret, tamperedBody, signature)).toBe(false);
  });

  it("rejects when the signature is tampered", () => {
    const signature = signPayload(secret, body);
    const tamperedSig = signature.slice(0, -2) + "00";
    expect(verifyWebhookSignature(secret, body, tamperedSig)).toBe(false);
  });

  it("rejects when the secret is wrong (replay-from-leaked-payload safety)", () => {
    const signature = signPayload(secret, body);
    expect(verifyWebhookSignature("different-secret", body, signature)).toBe(false);
  });

  it("rejects an empty signature (defends against header-stripping)", () => {
    expect(verifyWebhookSignature(secret, body, "")).toBe(false);
  });
});
