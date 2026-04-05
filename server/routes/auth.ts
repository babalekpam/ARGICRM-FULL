import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { authenticate, generateToken, hashPassword, verifyPassword, type AuthRequest } from "../middleware/auth.js";
import * as storage from "../storage.js";
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
    // Rate limit per-email (from body) + IP combo to prevent both brute force AND IP-based attacks
    const email = req.body?.email || req.ip || "unknown";
    return `${req.ip}:${email}`;
  },
  skip: (req) => {
    // Skip rate limiting for the platform owner's own IP during development
    return false;
  },
});

const failedAttempts = new Map<string, { count: number; lockedUntil?: Date }>();

const router = Router();

// ─── Register new tenant + admin ─────────────────────────
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
    // Auto-generate domain from companyName if not provided
    const body = {
      ...parsed,
      domain: parsed.domain || parsed.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50),
    };

    // Check domain availability
    const existing = await storage.getTenantByDomain(`${body.domain}.argilette.org`);
    if (existing) return res.status(409).json({ error: "This domain is already taken. Choose another." });

    // Also check if email exists across ANY tenant to prevent confusion
    const existingUser = await storage.getUserByEmailGlobal(body.email);
    if (existingUser) return res.status(409).json({ error: "An account with this email already exists." });

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

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

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      tenant: { id: tenant.id, name: tenant.name, domain: tenant.domain, plan: tenant.subscriptionPlan, trialEndsAt: tenant.trialEndsAt },
    });

    // Fire-and-forget onboarding seed so new tenant sees sample data
    seedNewTenantOnboarding(tenant.id).catch(err =>
      console.error("[SEED] Onboarding seed failed for tenant:", tenant.id, err)
    );

    // Send welcome email (non-blocking)
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

// ─── Login ───────────────────────────────────────────────
router.post("/login", loginRateLimit, async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    });

    const { email, password } = schema.parse(req.body);

    // Per-account lockout after 5 consecutive wrong password attempts
    const attempts = failedAttempts.get(email);
    if (attempts?.lockedUntil && attempts.lockedUntil > new Date()) {
      return res.status(429).json({ error: "Account temporarily locked due to too many failed attempts. Try again in 15 minutes." });
    }

    const user = await storage.getUserByEmailGlobal(email);

    if (!user || !user.isActive) {
      // Track failed attempt even for non-existent accounts (prevents enumeration via timing)
      const current = failedAttempts.get(email) || { count: 0 };
      current.count += 1;
      if (current.count >= 5) {
        current.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      failedAttempts.set(email, current);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const valid = await verifyPassword(password, user.passwordHash ?? "");
    if (!valid) {
      const current = failedAttempts.get(email) || { count: 0 };
      current.count += 1;
      if (current.count >= 5) {
        current.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      failedAttempts.set(email, current);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Successful login — clear failed attempt counter
    failedAttempts.delete(email);

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

    res.json({
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      tenant: { id: tenant.id, name: tenant.name, domain: tenant.domain, plan: tenant.subscriptionPlan, trialEndsAt: tenant.trialEndsAt },
    });
  } catch (err: any) {
    if (err.name === "ZodError") return res.status(400).json({ error: "Invalid email or password format" });
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// ─── Get current user ─────────────────────────────────────
router.get("/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await storage.getUserById(req.user!.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const tenant = await storage.getTenantById(user.tenantId);

    res.json({
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, profileImageUrl: user.profileImageUrl },
      tenant: tenant ? { id: tenant.id, name: tenant.name, domain: tenant.domain, plan: tenant.subscriptionPlan, trialEndsAt: tenant.trialEndsAt, settings: tenant.settings } : null,
    });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ error: "Failed to get user data" });
  }
});

// ─── Logout (client-side clears token, this is informational) ────────────────
router.post("/logout", (req, res) => {
  res.clearCookie("auth-token");
  res.json({ message: "Logged out successfully" });
});

// ─── Invite user to tenant ────────────────────────────────
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

    res.status(201).json({ user: { id: user.id, email: user.email, firstName: user.firstName, role: user.role } });

    // Send invite email (non-blocking)
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

// ─── PUT /api/auth/password (rate-limited alias for password change) ──────────
router.put("/password", loginRateLimit, authenticate, async (req: AuthRequest, res) => {
  try {
    // Check per-account lockout (same as login)
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
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const hash = await hashPassword(newPassword);
    await storage.updateUser(req.user!.id, { passwordHash: hash });
    res.json({ success: true });

    sendPasswordChangedEmail({ to: user.email, firstName: user.firstName || "" })
      .catch(e => console.error("[EMAIL] Password-changed email failed:", e));
  } catch (err: any) {
    console.error("PUT /auth/password error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

export default router;
