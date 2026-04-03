import { Router } from "express";
import { z } from "zod";
import { authenticate, generateToken, hashPassword, verifyPassword, type AuthRequest } from "../middleware/auth.js";
import * as storage from "../storage.js";
import { sendWelcomeEmail, sendTeamInviteEmail, sendPasswordChangedEmail } from "../services/email.js";

const router = Router();

// ─── Register new tenant + admin ─────────────────────────
router.post("/register", async (req, res) => {
  try {
    const schema = z.object({
      companyName: z.string().min(2).max(100),
      domain: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, hyphens"),
      firstName: z.string().min(1).max(50),
      lastName: z.string().min(1).max(50),
      email: z.string().email(),
      password: z.string().min(8),
      plan: z.enum(["trial", "starter", "pro", "business"]).optional().default("trial"),
    });

    const body = schema.parse(req.body);

    // Check domain availability
    const existing = await storage.getTenantByDomain(`${body.domain}.argilette.org`);
    if (existing) return res.status(409).json({ error: "This domain is already taken. Choose another." });

    // Also check if email exists across ANY tenant to prevent confusion
    const existingUser = await storage.getUserByEmailGlobal(body.email);
    if (existingUser) return res.status(409).json({ error: "An account with this email already exists." });

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

    const tenant = await storage.createTenant({
      name: body.companyName,
      domain: `${body.domain}.argilette.org`,
      subscriptionPlan: body.plan,
      subscriptionStatus: "trialing",
      plan: body.plan === "trial" ? "free" : body.plan,
      trialEndsAt,
      maxUsers: 3,
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
router.post("/login", async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    });

    const { email, password } = schema.parse(req.body);
    const user = await storage.getUserByEmailGlobal(email);

    if (!user || !user.isActive) return res.status(401).json({ error: "Invalid email or password" });

    const valid = await verifyPassword(password, user.passwordHash ?? "");
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

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

export default router;
