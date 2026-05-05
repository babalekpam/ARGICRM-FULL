import { Router } from "express";
import { z } from "zod";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { authenticate, type AuthRequest, verifyPassword } from "../middleware/auth.js";
import { db } from "../db.js";
import { sql } from "drizzle-orm";

const router = Router();
router.use(authenticate);

// ─── Helpers ───────────────────────────────────────────────────────
function generateRecoveryCodes(n = 10): string[] {
  return Array.from({ length: n }, () =>
    crypto.randomBytes(5).toString("hex").match(/.{4}/g)!.join("-") // xxxx-xxxx-xx
  );
}

async function hashRecoveryCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map(c => bcrypt.hash(c, 10)));
}

async function readUserMfaColumns(userId: string) {
  const r = await db.execute(sql`
    SELECT password_hash, totp_secret, totp_enabled, mfa_recovery_codes
    FROM users WHERE id = ${userId} LIMIT 1
  `);
  return (r.rows[0] || null) as null | {
    password_hash: string;
    totp_secret: string | null;
    totp_enabled: boolean | null;
    mfa_recovery_codes: string[] | null;
  };
}

// ─── GET /api/auth/totp/status ───────────────────────────────────
router.get("/status", async (req: AuthRequest, res) => {
  const u = await readUserMfaColumns(req.user!.id);
  if (!u) return res.status(404).json({ error: "User not found" });
  const recoveryCount = Array.isArray(u.mfa_recovery_codes) ? u.mfa_recovery_codes.length : 0;
  res.json({
    enabled: !!u.totp_enabled,
    enrolled: !!u.totp_secret,
    recoveryCodesRemaining: recoveryCount,
  });
});

// ─── POST /api/auth/totp/enroll ───────────────────────────────────
// Generate a new TOTP secret + QR code. The secret is stored but
// totp_enabled stays false until /verify confirms a code.
router.post("/enroll", async (req: AuthRequest, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `Argilette CRM (${req.user!.email})`,
      length: 20,
    });

    // Persist the base32 secret. If the user re-runs enroll before /verify,
    // we overwrite the previous secret (intentional — they're starting over).
    await db.execute(sql`
      UPDATE users SET totp_secret = ${secret.base32}, totp_enabled = false
      WHERE id = ${req.user!.id}
    `);

    const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url || "");
    res.json({
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrDataUrl,
      message: "Scan the QR with your authenticator app, then POST the 6-digit code to /verify.",
    });
  } catch (err: any) {
    console.error("POST /totp/enroll:", err);
    res.status(500).json({ error: "Failed to start TOTP enrollment" });
  }
});

// ─── POST /api/auth/totp/verify ───────────────────────────────────
// Confirms enrollment by checking the user's first TOTP code. On success:
// totp_enabled=true, generates 10 single-use recovery codes, returns them
// to the client (shown ONCE).
router.post("/verify", async (req: AuthRequest, res) => {
  try {
    const schema = z.object({ code: z.string().regex(/^\d{6}$/) });
    const { code } = schema.parse(req.body);

    const u = await readUserMfaColumns(req.user!.id);
    if (!u || !u.totp_secret) {
      return res.status(400).json({ error: "No TOTP enrollment in progress. Call /enroll first." });
    }

    const ok = speakeasy.totp.verify({
      secret: u.totp_secret,
      encoding: "base32",
      token: code,
      window: 1,
    });
    if (!ok) return res.status(401).json({ error: "Invalid TOTP code" });

    const codes = generateRecoveryCodes(10);
    const hashed = await hashRecoveryCodes(codes);

    await db.execute(sql`
      UPDATE users
      SET totp_enabled = true,
          mfa_recovery_codes = ${hashed}::text[],
          totp_enrolled_at = now()
      WHERE id = ${req.user!.id}
    `);

    res.json({
      enabled: true,
      recoveryCodes: codes,
      message: "TOTP enabled. Save these recovery codes — they won't be shown again.",
    });
  } catch (err: any) {
    if (err.name === "ZodError") return res.status(400).json({ error: "Code must be 6 digits" });
    console.error("POST /totp/verify:", err);
    res.status(500).json({ error: "Failed to verify TOTP" });
  }
});

// ─── POST /api/auth/totp/disable ──────────────────────────────────
// Requires current password + a valid TOTP code (anti-takeover).
router.post("/disable", async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      password: z.string().min(1),
      code: z.string().regex(/^\d{6}$/),
    });
    const { password, code } = schema.parse(req.body);

    const u = await readUserMfaColumns(req.user!.id);
    if (!u) return res.status(404).json({ error: "User not found" });
    if (!u.totp_enabled || !u.totp_secret) {
      return res.status(400).json({ error: "TOTP is not currently enabled" });
    }

    const passwordOk = await verifyPassword(password, u.password_hash);
    if (!passwordOk) return res.status(401).json({ error: "Incorrect password" });

    const totpOk = speakeasy.totp.verify({
      secret: u.totp_secret, encoding: "base32", token: code, window: 1,
    });
    if (!totpOk) return res.status(401).json({ error: "Invalid TOTP code" });

    await db.execute(sql`
      UPDATE users
      SET totp_enabled = false,
          totp_secret = null,
          mfa_recovery_codes = null,
          totp_enrolled_at = null
      WHERE id = ${req.user!.id}
    `);
    res.json({ enabled: false });
  } catch (err: any) {
    if (err.name === "ZodError") return res.status(400).json({ error: "Validation failed", details: err.errors });
    console.error("POST /totp/disable:", err);
    res.status(500).json({ error: "Failed to disable TOTP" });
  }
});

// ─── POST /api/auth/totp/regenerate-recovery-codes ───────────────────
router.post("/regenerate-recovery-codes", async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      password: z.string().min(1),
      code: z.string().regex(/^\d{6}$/),
    });
    const { password, code } = schema.parse(req.body);

    const u = await readUserMfaColumns(req.user!.id);
    if (!u) return res.status(404).json({ error: "User not found" });
    if (!u.totp_enabled || !u.totp_secret) {
      return res.status(400).json({ error: "TOTP is not currently enabled" });
    }
    const passwordOk = await verifyPassword(password, u.password_hash);
    if (!passwordOk) return res.status(401).json({ error: "Incorrect password" });
    const totpOk = speakeasy.totp.verify({
      secret: u.totp_secret, encoding: "base32", token: code, window: 1,
    });
    if (!totpOk) return res.status(401).json({ error: "Invalid TOTP code" });

    const codes = generateRecoveryCodes(10);
    const hashed = await hashRecoveryCodes(codes);
    await db.execute(sql`
      UPDATE users SET mfa_recovery_codes = ${hashed}::text[] WHERE id = ${req.user!.id}
    `);
    res.json({
      recoveryCodes: codes,
      message: "New recovery codes generated. Previous codes are invalidated.",
    });
  } catch (err: any) {
    if (err.name === "ZodError") return res.status(400).json({ error: "Validation failed", details: err.errors });
    console.error("POST /totp/regenerate-recovery-codes:", err);
    res.status(500).json({ error: "Failed to regenerate recovery codes" });
  }
});

/**
 * Helper used by /api/auth/login to verify a TOTP/recovery code mid-login.
 * Not mounted as a route. Returns true if accepted; consumes a recovery
 * code if one was used.
 */
export async function verifyTotpForLogin(
  userId: string,
  totpCode?: string,
  recoveryCode?: string,
): Promise<{ ok: boolean; usedRecovery?: boolean }> {
  if (!totpCode && !recoveryCode) return { ok: false };

  const u = await readUserMfaColumns(userId);
  if (!u || !u.totp_secret || !u.totp_enabled) return { ok: false };

  if (totpCode) {
    const ok = speakeasy.totp.verify({
      secret: u.totp_secret, encoding: "base32", token: totpCode, window: 1,
    });
    return { ok };
  }

  // Recovery code path — check against hashed list, consume on match.
  const codes = u.mfa_recovery_codes || [];
  for (let i = 0; i < codes.length; i++) {
    const match = await bcrypt.compare(recoveryCode!, codes[i]);
    if (match) {
      const remaining = codes.filter((_, idx) => idx !== i);
      await db.execute(sql`
        UPDATE users SET mfa_recovery_codes = ${remaining}::text[] WHERE id = ${userId}
      `);
      return { ok: true, usedRecovery: true };
    }
  }
  return { ok: false };
}

export default router;
