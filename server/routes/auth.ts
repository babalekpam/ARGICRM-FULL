import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { authenticate, generateToken, hashPassword, verifyPassword, type AuthRequest } from "../middleware/auth.js";
import { issueAuthCookies, clearAuthCookies } from "../middleware/csrf.js";
import { verifyTotpForLogin } from "./totp.js";
import * as storage from "../storage.js";
import { db } from "../db.js";
import { sql } from "drizzle-orm";
import { sendWelcomeEmail, sendTeamInviteEmail, sendPasswordChangedEmail } from "../services/email.js";
import { PLAN_MAP, PLAN_HIERARCHY } from "@shared/plans";
import { seedNewTenantOnboarding } from "../seed-demo.js";

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = req.body?.email || req.ip || "unknown";
    return `${req.ip}:${email}`;
  },
  skip: () => false,
});

const failedAttempts = new Map<string, { count: number; lockedUntil?: Date }>();

const router = Router();

// Read MFA columns (force_password_change + totp_enabled) for a user. If the
// columns haven't been migrated yet, the query simply returns NULL and we
// treat them as defaults (false). Safe across a rolling deploy.
async function readMfaFlags(userId: string): Promise<{
  force_password_change: boolean; totp_enabled: boolean;
}> {
  try {
    const r = await db.execute(sql`
      SELECT force_password_change, totp_enabled FROM users WHERE id = ${userId} LIMIT 1
    `);
    const row = r.rows[0] as any;
    return {
      force_password_change: !!row?.force_password_change,
      totp_enabled: !!row?.totp_enabled,
    };
  } catch {
    return { force_password_change: false, totp_enabled: false };
  }
}

// ─── Register new tenant + admin ─────────────────────
router.post("/register", async (req, res) => {
  try {
    const schema = z.object({
      companyName: z.string().min(2).max(100),
      domain: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, hyphens").optional(),
      firstName: z.string().min(1).max(50),
      lastName: z.string().min(1).max(50),
      email: z.string().email(),
      password: z.string().min(8),
      plan: z.enum(["trial", "starter", "professional", "business", "enterprise"]).optional().default("trial"),
    });

    const parsed = schema.parse(req.body);
    const body = {
      ...parsed,
      domain: parsed.domain || parsed.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50),
    };

    const existing = await storage.getTenantByDomain(`${body.domain}.argilette.org`);
    if (existing) return res.status(409).json({ error: "This domain is already taken. Choose another." });

    const existingUser = await storage.getUserByEmailGlobal(body.email);
    if (existingUser) return res.status(409).json({ error: "An account with this email already exists." });

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const planDef = PLAN_MAP[body.plan] || PLAN_MAP["trial"];

    const tenant = await storage.createTenant({
      name: body.companyName,
      domain: `${body.domain}.argilette.org`,
      subscriptionPlan: body.plan,
      subscriptionStatus: body.plan === "trial" ? "trialing" : "active",
      plan: body.plan,
      trialEndsAt: body.plan === "trial" ? trialEndsAt : null,
      maxUsers: planDef.maxUsers === -1 ? 999999 : planDef.maxUsers,
      isActive: true,
      settings: { timezone: "UTC", currency: "USD", language: "en" },
    });

    const passwordHash = await hashPassword(body.password);
    const user = await storage.createUser({
      tenantId: tenant.id,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      passwordHash,
      role: "super_admin",
      isActive: true,
      emailVerified: true,
    });

    const token = generateToken({
      id: user.id,
      tenantId: tenant.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: [],
    });

    issueAuthCookies(res, token);

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      tenant: { id: tenant.id, name: tenant.name, domain: tenant.domain, plan: tenant.subscriptionPlan, trialEndsAt: tenant.trialEndsAt },
      mustChangePassword: false,
      requiresTotp: false,
    });

    seedNewTenantOnboarding(tenant.id).catch(err =>
      console.error("[SEED] Onboarding seed failed for tenant:", tenant.id, err)
    );

    sendWelcomeEmail({
      to: user.email,
      firstName: user.firstName || "",
      workspaceName: tenant.name,
      workspaceDomain: tenant.domain,
      plan: tenant.subscriptionPlan || "trial",
      trialEndsAt: tenant.trialEndsAt ?? undefined,
    }).catch(err => console.error("[EMAIL] Welcome email failed:", err));

  } catch (err: any) {
    if (err.name === "ZodError") return res.status(400).json({ error: "Validation failed", details: err.errors });
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// ─── Login (with TOTP + force_password_change handling) ───────────────
router.post("/login", loginRateLimit, async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
      totpCode: z.string().regex(/^\d{6}$/).optional(),
      recoveryCode: z.string().min(8).optional(),
    });

    const { email, password, totpCode, recoveryCode } = schema.parse(req.body);

    const attempts = failedAttempts.get(email);
    if (attempts?.lockedUntil && attempts.lockedUntil > new Date()) {
      return res.status(429).json({ error: "Account temporarily locked due to too many failed attempts. Try again in 15 minutes." });
    }

    const user = await storage.getUserByEmailGlobal(email);

    if (!user || !user.isActive) {
      const current = failedAttempts.get(email) || { count: 0 };
      current.count += 1;
      if (current.count >= 5) current.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      failedAttempts.set(email, current);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await verifyPassword(password, user.passwordHash ?? "");
    if (!valid) {
      const current = failedAttempts.get(email) || { count: 0 };
      current.count += 1;
      if (current.count >= 5) current.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      failedAttempts.set(email, current);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    failedAttempts.delete(email);

    // ─── TOTP gate (if enrolled) ──────────────────────────────────
    const flags = await readMfaFlags(user.id);
    if (flags.totp_enabled) {
      if (!totpCode && !recoveryCode) {
        return res.status(200).json({
          requiresTotp: true,
          message: "This account has TOTP enabled. Submit `totpCode` or `recoveryCode` along with email + password.",
        });
      }
      const result = await verifyTotpForLogin(user.id, totpCode, recoveryCode);
      if (!result.ok) {
        return res.status(401).json({ error: "Invalid TOTP or recovery code" });
      }
    }

    const tenant = await storage.getTenantById(user.tenantId);
    if (tenant?.subscriptionStatus === "blocked") return res.status(403).json({ error: "This account has been blocked. Contact support@argilette.com." });
    if (!tenant?.isActive) return res.status(403).json({ error: "Your workspace is suspended. Contact support." });

    await storage.updateUserLastLogin(user.id);

    const token = generateToken({
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: [],
    });

    issueAuthCookies(res, token);

    res.json({
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      tenant: { id: tenant.id, name: tenant.name, domain: tenant.domain, plan: tenant.subscriptionPlan, trialEndsAt: tenant.trialEndsAt },
      mustChangePassword: flags.force_password_change,
      requiresTotp: false,
    });
  } catch (err: any) {
    if (err.name === "ZodError") return res.status(400).json({ error: "Invalid email or password format" });
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// ─── Get current user ──────────────────────────────────
router.get("/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await storage.getUserById(req.user!.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const tenant = await storage.getTenantById(user.tenantId);
    const flags = await readMfaFlags(user.id);

    res.json({
      user: {
        id: user.id, email: user.email,
        firstName: user.firstName, lastName: user.lastName,
        role: user.role, profileImageUrl: user.profileImageUrl,
        mustChangePassword: flags.force_password_change,
        totpEnabled: flags.totp_enabled,
      },
      tenant: tenant ? { id: tenant.id, name: tenant.name, domain: tenant.domain, plan: tenant.subscriptionPlan, trialEndsAt: tenant.trialEndsAt, settings: tenant.settings } : null,
    });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ error: "Failed to get user data" });
  }
});

// ─── Logout ────────────────────────────────────────────────────────
router.post("/logout", (_req, res) => {
  clearAuthCookies(res);
  res.json({ message: "Logged out successfully" });
});

// ─── Invite user ──────────────────────────────────────────────────
router.post("/invite", authenticate, async (req: AuthRequest, res) => {
  try {
    if (!["super_admin", "admin"].includes(req.user!.role)) {
      return res.status(403).json({ error: "Only admins can invite users" });
    }

    const schema = z.object({
      email: z.string().email(),
      firstName: z.string().min(1),
      lastName: z.string().optional(),
      role: z.enum(["admin", "manager", "user", "viewer"]).default("user"),
      password: z.string().min(8),
    });

    const body = schema.parse(req.body);

    const existing = await storage.getUserByEmail(body.email, req.user!.tenantId);
    if (existing) return res.status(409).json({ error: "A user with this email already exists in your workspace" });

    const tenant = await storage.getTenantById(req.user!.tenantId);
    const currentUsers = await storage.getUsersByTenant(req.user!.tenantId);
    if (currentUsers.length >= (tenant?.maxUsers ?? 3)) {
      return res.status(403).json({ error: `Your plan allows max ${tenant?.maxUsers} users. Upgrade to add more.` });
    }

    const passwordHash = await hashPassword(body.password);
    const user = await storage.createUser({
      tenantId: req.user!.tenantId,
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      passwordHash,
      role: body.role,
      isActive: true,
      emailVerified: true,
    });

    // New invitees must change password on first login.
    await db.execute(sql`UPDATE users SET force_password_change = true WHERE id = ${user.id}`)
      .catch(() => { /* column not migrated yet — skip */ });

    res.status(201).json({ user: { id: user.id, email: user.email, firstName: user.firstName, role: user.role } });

    const inviterTenant = await storage.getTenantById(req.user!.tenantId).catch(() => null);
    sendTeamInviteEmail({
      to: user.email,
      firstName: user.firstName || "",
      invitedBy: `${req.user!.firstName || ""} ${req.user!.lastName || ""}`.trim() || req.user!.email,
      workspaceName: inviterTenant?.name || "Argilette",
      role: user.role,
      tempPassword: body.password,
    }).catch(err => console.error("[EMAIL] Invite email failed:", err));

  } catch (err: any) {
    if (err.name === "ZodError") return res.status(400).json({ error: "Validation failed", details: err.errors });
    console.error("Invite error:", err);
    res.status(500).json({ error: "Failed to invite user" });
  }
});

// ─── PUT /api/auth/password (rate-limited, also clears force_password_change) ───
router.put("/password", loginRateLimit, authenticate, async (req: AuthRequest, res) => {
  try {
    const attempts = failedAttempts.get(req.user!.email);
    if (attempts?.lockedUntil && attempts.lockedUntil > new Date()) {
      return res.status(429).json({ error: "Too many attempts. Account temporarily locked." });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both currentPassword and newPassword are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }

    const user = await storage.getUserById(req.user!.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const valid = await verifyPassword(currentPassword, user.passwordHash || "");
    if (!valid) return res.status(401).json({ error: "Current password is incorrect" });

    const hash = await hashPassword(newPassword);
    await storage.updateUser(req.user!.id, { passwordHash: hash });
    await db.execute(sql`UPDATE users SET force_password_change = false WHERE id = ${req.user!.id}`)
      .catch(() => { /* column not migrated yet */ });
    res.json({ success: true });

    sendPasswordChangedEmail({ to: user.email, firstName: user.firstName || "" })
      .catch(e => console.error("[EMAIL] Password-changed email failed:", e));
  } catch (err: any) {
    console.error("PUT /auth/password error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

export default router;
