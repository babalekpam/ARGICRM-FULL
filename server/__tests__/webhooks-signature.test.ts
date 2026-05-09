import { describe, it, expect } from "vitest";
import { signPayload, generateWebhookSecret } from "../services/webhooks.js";
import crypto from "node:crypto";

describe("services/webhooks", () => {
  describe("signPayload", () => {
    it("produces a stable HMAC-SHA256 signature", () => {
      const a = signPayload("secret", "hello");
      const b = signPayload("secret", "hello");
      expect(a).toBe(b);
      expect(a).toMatch(/^sha256=[a-f0-9]{64}$/);
    });

    it("changes when the secret changes", () => {
      const a = signPayload("secret-1", "hello");
      const b = signPayload("secret-2", "hello");
      expect(a).not.toBe(b);
    });

    it("changes when the payload changes", () => {
      const a = signPayload("secret", "hello");
      const b = signPayload("secret", "world");
      expect(a).not.toBe(b);
    });

    it("matches an independent HMAC computation (proves correctness)", () => {
      const expected = "sha256=" + crypto.createHmac("sha256", "k").update("v").digest("hex");
      expect(signPayload("k", "v")).toBe(expected);
    });
  });

  describe("generateWebhookSecret", () => {
    it("produces unique whsec_-prefixed secrets", () => {
      const a = generateWebhookSecret();
      const b = generateWebhookSecret();
      expect(a).toMatch(/^whsec_[A-Za-z0-9_-]+$/);
      expect(a).not.toBe(b);
      expect(a.length).toBeGreaterThan(40);
    });
  });
});
