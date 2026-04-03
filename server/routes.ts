import { Express, Router } from "express";
import { createServer, Server } from "http";
import { z } from "zod";
import { authenticate, requireRole, type AuthRequest } from "./middleware/auth.js";
import * as storage from "./storage.js";
import authRouter from "./routes/auth.js";
import agentRouter from "./routes/agents.js";
import adminRouter from "./routes/admin.js";
import intelligenceRouter from "./routes/intelligence.js";
import healingRouter from "./routes/healing.js";
import seoRouter from "./routes/seo.js";
import ecommerceRouter from "./routes/ecommerce.js";
import financeRouter from "./routes/finance.js";
import operationsRouter from "./routes/operations.js";
import leadgenRouter from "./routes/leadgen.js";
import aiRouter from "./routes/ai.js";
import ariaRouter from "./routes/aria.js";
import publicRouter from "./routes/public.js";
import analyticsRouter from "./routes/analytics.js";
import workflowsRouter from "./routes/workflows.js";
import skillsRouter from "./routes/skills.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // ─── Core Auth ──────────────────────────────────────
  app.use("/api/auth", authRouter);
  // ─── AI Agents ─────────────────────────────────────
  app.use("/api/agents", agentRouter);
  // ─── AI Tools (deal intelligence, email, meeting) ──
  app.use("/api/ai", aiRouter);
  // ─── Analytics ─────────────────────────────────────
  app.use("/api/analytics", analyticsRouter);
  // ─── Workflow Automation ────────────────────────────
  app.use("/api/workflows", workflowsRouter);
  // ─── Skills Library ────────────────────────────────
  app.use("/api/skills", skillsRouter);
  // ─── Lead Intelligence ─────────────────────────────
  app.use("/api/intelligence", intelligenceRouter);
  // ─── Code Healing ──────────────────────────────────
  app.use("/api/healing", healingRouter);
  // ─── SEO Platform ──────────────────────────────────
  app.use("/api/seo", seoRouter);
  // ─── E-commerce ────────────────────────────────────
  app.use("/api/ecommerce", ecommerceRouter);
  // ─── Finance ───────────────────────────────────────
  app.use("/api/finance", financeRouter);
  // ─── Operations (HR, Projects, Marketing, WL) ──────
  app.use("/api/ops", operationsRouter);
  // ─── Autonomous Lead Generation ────────────────────
  app.use("/api/leadgen", leadgenRouter);
  // ─── Super Admin ───────────────────────────────────
  app.use("/api/superadmin", adminRouter);
  // ─── ARIA AI Command Agent ──────────────────────────
  app.use("/api/aria", ariaRouter);
  // ─── Public Storefront API (no auth) ───────────────
  app.use("/api/public", publicRouter);

  // ─── Contacts ─────────────────────────────────────────
  app.get("/api/contacts", authenticate, async (req: AuthRequest, res) => {
    try {
      const { search, status, limit, offset } = req.query;
      const result = await storage.getContacts(req.user!.tenantId, {
        search: search as string,
        status: status as string,
        limit: limit ? Number(limit) : 50,
        offset: offset ? Number(offset) : 0,
      });
      res.json(result);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch contacts" }); }
  });

  app.get("/api/contacts/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const contact = await storage.getContactById(req.params.id, req.user!.tenantId);
      if (!contact) return res.status(404).json({ error: "Contact not found" });
      res.json(contact);
    } catch (err) { res.status(500).json({ error: "Failed to fetch contact" }); }
  });

  app.post("/api/contacts", authenticate, async (req: AuthRequest, res) => {
    try {
      const contact = await storage.createContact({ ...req.body, tenantId: req.user!.tenantId, createdBy: req.user!.id });
      res.status(201).json(contact);
    } catch (err) { res.status(500).json({ error: "Failed to create contact" }); }
  });

  app.put("/api/contacts/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const contact = await storage.updateContact(req.params.id, req.user!.tenantId, req.body);
      res.json(contact);
    } catch (err) { res.status(500).json({ error: "Failed to update contact" }); }
  });

  app.delete("/api/contacts/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      await storage.deleteContact(req.params.id, req.user!.tenantId);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Failed to delete contact" }); }
  });

  // ─── Leads ────────────────────────────────────────────
  app.get("/api/leads", authenticate, async (req: AuthRequest, res) => {
    try {
      const result = await storage.getLeads(req.user!.tenantId, {
        search: req.query.search as string,
        status: req.query.status as string,
        limit: req.query.limit ? Number(req.query.limit) : 50,
      });
      res.json(result);
    } catch (err) { res.status(500).json({ error: "Failed to fetch leads" }); }
  });

  app.post("/api/leads", authenticate, async (req: AuthRequest, res) => {
    try {
      const lead = await storage.createLead({ ...req.body, tenantId: req.user!.tenantId, createdBy: req.user!.id });
      res.status(201).json(lead);
    } catch (err) { res.status(500).json({ error: "Failed to create lead" }); }
  });

  app.put("/api/leads/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const lead = await storage.updateLead(req.params.id, req.user!.tenantId, req.body);
      res.json(lead);
    } catch (err) { res.status(500).json({ error: "Failed to update lead" }); }
  });

  app.delete("/api/leads/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      await storage.deleteLead(req.params.id, req.user!.tenantId);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Failed to delete lead" }); }
  });

  // ─── Deals ────────────────────────────────────────────
  app.get("/api/deals", authenticate, async (req: AuthRequest, res) => {
    try {
      const result = await storage.getDeals(req.user!.tenantId, { stage: req.query.stage as string });
      res.json(result);
    } catch (err) { res.status(500).json({ error: "Failed to fetch deals" }); }
  });

  app.post("/api/deals", authenticate, async (req: AuthRequest, res) => {
    try {
      const deal = await storage.createDeal({ ...req.body, tenantId: req.user!.tenantId, createdBy: req.user!.id });
      res.status(201).json(deal);
    } catch (err) { res.status(500).json({ error: "Failed to create deal" }); }
  });

  app.put("/api/deals/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const deal = await storage.updateDeal(req.params.id, req.user!.tenantId, req.body);
      res.json(deal);
    } catch (err) { res.status(500).json({ error: "Failed to update deal" }); }
  });

  app.delete("/api/deals/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      await storage.deleteDeal(req.params.id, req.user!.tenantId);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Failed to delete deal" }); }
  });

  // ─── Tasks ────────────────────────────────────────────
  app.get("/api/tasks", authenticate, async (req: AuthRequest, res) => {
    try {
      const tasks = await storage.getTasks(req.user!.tenantId, {
        status: req.query.status as string,
        assignedTo: req.query.assignedTo as string,
      });
      res.json(tasks);
    } catch (err) { res.status(500).json({ error: "Failed to fetch tasks" }); }
  });

  app.post("/api/tasks", authenticate, async (req: AuthRequest, res) => {
    try {
      const task = await storage.createTask({ ...req.body, tenantId: req.user!.tenantId, createdBy: req.user!.id });
      res.status(201).json(task);
    } catch (err) { res.status(500).json({ error: "Failed to create task" }); }
  });

  app.put("/api/tasks/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const task = await storage.updateTask(req.params.id, req.user!.tenantId, req.body);
      res.json(task);
    } catch (err) { res.status(500).json({ error: "Failed to update task" }); }
  });

  app.delete("/api/tasks/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      await storage.deleteTask(req.params.id, req.user!.tenantId);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Failed to delete task" }); }
  });

  // ─── Accounts ─────────────────────────────────────────
  app.get("/api/accounts", authenticate, async (req: AuthRequest, res) => {
    try {
      const result = await storage.getAccounts(req.user!.tenantId, { search: req.query.search as string });
      res.json(result);
    } catch (err) { res.status(500).json({ error: "Failed to fetch accounts" }); }
  });

  app.post("/api/accounts", authenticate, async (req: AuthRequest, res) => {
    try {
      const account = await storage.createAccount({ ...req.body, tenantId: req.user!.tenantId, createdBy: req.user!.id });
      res.status(201).json(account);
    } catch (err) { res.status(500).json({ error: "Failed to create account" }); }
  });

  app.put("/api/accounts/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const account = await storage.updateAccount(req.params.id, req.user!.tenantId, req.body);
      res.json(account);
    } catch (err) { res.status(500).json({ error: "Failed to update account" }); }
  });

  app.delete("/api/accounts/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      await storage.deleteAccount(req.params.id, req.user!.tenantId);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Failed to delete account" }); }
  });

  // ─── Activities ────────────────────────────────────────
  app.get("/api/activities", authenticate, async (req: AuthRequest, res) => {
    try {
      const acts = await storage.getActivities(req.user!.tenantId, {
        contactId: req.query.contactId as string,
        dealId: req.query.dealId as string,
      });
      res.json(acts);
    } catch (err) { res.status(500).json({ error: "Failed to fetch activities" }); }
  });

  app.post("/api/activities", authenticate, async (req: AuthRequest, res) => {
    try {
      const activity = await storage.createActivity({ ...req.body, tenantId: req.user!.tenantId, createdBy: req.user!.id });
      res.status(201).json(activity);
    } catch (err) { res.status(500).json({ error: "Failed to create activity" }); }
  });

  // ─── Campaigns ─────────────────────────────────────────
  app.get("/api/campaigns", authenticate, async (req: AuthRequest, res) => {
    try {
      const camps = await storage.getCampaigns(req.user!.tenantId);
      res.json(camps);
    } catch (err) { res.status(500).json({ error: "Failed to fetch campaigns" }); }
  });

  app.post("/api/campaigns", authenticate, async (req: AuthRequest, res) => {
    try {
      const campaign = await storage.createCampaign({ ...req.body, tenantId: req.user!.tenantId });
      res.status(201).json(campaign);
    } catch (err) { res.status(500).json({ error: "Failed to create campaign" }); }
  });

  app.put("/api/campaigns/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const campaign = await storage.updateCampaign(req.params.id, req.user!.tenantId, req.body);
      res.json(campaign);
    } catch (err) { res.status(500).json({ error: "Failed to update campaign" }); }
  });

  app.delete("/api/campaigns/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      await storage.deleteCampaign(req.params.id, req.user!.tenantId);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Failed to delete campaign" }); }
  });

  // ─── Invoices ─────────────────────────────────────────
  app.get("/api/invoices", authenticate, async (req: AuthRequest, res) => {
    try {
      const invs = await storage.getInvoices(req.user!.tenantId);
      res.json(invs);
    } catch (err) { res.status(500).json({ error: "Failed to fetch invoices" }); }
  });

  app.post("/api/invoices", authenticate, async (req: AuthRequest, res) => {
    try {
      const invoice = await storage.createInvoice({ ...req.body, tenantId: req.user!.tenantId, createdBy: req.user!.id });
      res.status(201).json(invoice);
    } catch (err) { res.status(500).json({ error: "Failed to create invoice" }); }
  });

  app.put("/api/invoices/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const invoice = await storage.updateInvoice(req.params.id, req.user!.tenantId, req.body);
      res.json(invoice);
    } catch (err) { res.status(500).json({ error: "Failed to update invoice" }); }
  });

  app.delete("/api/invoices/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      await storage.deleteInvoice(req.params.id, req.user!.tenantId);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Failed to delete invoice" }); }
  });

  // ─── Dashboard ─────────────────────────────────────────
  app.get("/api/dashboard", authenticate, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getDashboardStats(req.user!.tenantId);
      res.json(stats);
    } catch (err) { res.status(500).json({ error: "Failed to fetch dashboard stats" }); }
  });

  // ─── Users (tenant) ────────────────────────────────────
  app.get("/api/users", authenticate, async (req: AuthRequest, res) => {
    try {
      const userList = await storage.getUsersByTenant(req.user!.tenantId);
      res.json(userList.map(u => ({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role, isActive: u.isActive, lastLoginAt: u.lastLoginAt, createdAt: u.createdAt })));
    } catch (err) { res.status(500).json({ error: "Failed to fetch users" }); }
  });

  app.put("/api/users/:id", authenticate, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const { role, isActive, firstName, lastName } = req.body;
      const user = await storage.updateUser(req.params.id, { role, isActive, firstName, lastName });
      res.json({ id: user.id, email: user.email, firstName: user.firstName, role: user.role });
    } catch (err) { res.status(500).json({ error: "Failed to update user" }); }
  });

  app.delete("/api/users/:id", authenticate, requireRole("super_admin"), async (req: AuthRequest, res) => {
    try {
      if (req.params.id === req.user!.id) return res.status(400).json({ error: "Cannot delete yourself" });
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Failed to delete user" }); }
  });

  // ─── Settings ─────────────────────────────────────────
  app.get("/api/settings", authenticate, async (req: AuthRequest, res) => {
    try {
      const tenant = await storage.getTenantById(req.user!.tenantId);
      if (!tenant) return res.status(404).json({ error: "Workspace not found" });
      res.json({ name: tenant.name, domain: tenant.domain, settings: tenant.settings, plan: tenant.subscriptionPlan, trialEndsAt: tenant.trialEndsAt });
    } catch (err) { res.status(500).json({ error: "Failed to fetch settings" }); }
  });

  app.put("/api/settings", authenticate, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const { name, settings } = req.body;
      const tenant = await storage.updateTenant(req.user!.tenantId, { name, settings });
      res.json({ name: tenant.name, settings: tenant.settings });
    } catch (err) { res.status(500).json({ error: "Failed to update settings" }); }
  });

  // ─── SMTP Settings ─────────────────────────────────────
  app.get("/api/settings/smtp", authenticate, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const tenant = await storage.getTenantById(req.user!.tenantId);
      if (!tenant) return res.status(404).json({ error: "Workspace not found" });
      const smtp = (tenant.settings as any)?.smtp || {};
      // Never send password back to frontend — return masked version
      res.json({ ...smtp, pass: smtp.pass ? "••••••••" : "" });
    } catch (err) { res.status(500).json({ error: "Failed to fetch SMTP settings" }); }
  });

  app.put("/api/settings/smtp", authenticate, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const { host, port, secure, user, pass, senderName, senderEmail } = req.body;
      const tenant = await storage.getTenantById(req.user!.tenantId);
      if (!tenant) return res.status(404).json({ error: "Workspace not found" });
      const currentSettings: any = tenant.settings || {};
      const currentSmtp: any = currentSettings.smtp || {};
      // If pass is the masked sentinel, keep existing password
      const finalPass = (pass && pass !== "••••••••") ? pass : currentSmtp.pass;
      const updatedSettings = {
        ...currentSettings,
        smtp: { host, port: Number(port) || 587, secure: Boolean(secure), user, pass: finalPass, senderName, senderEmail },
      };
      await storage.updateTenant(req.user!.tenantId, { settings: updatedSettings });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Failed to save SMTP settings" }); }
  });

  app.post("/api/settings/smtp/test", authenticate, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const { testTenantSmtp } = await import("./services/email");
      const tenant = await storage.getTenantById(req.user!.tenantId);
      if (!tenant) return res.status(404).json({ error: "Workspace not found" });
      const smtp = (tenant.settings as any)?.smtp;
      if (!smtp?.host || !smtp?.user || !smtp?.pass) {
        return res.status(400).json({ error: "SMTP settings are incomplete. Save your settings first." });
      }
      await testTenantSmtp(smtp);
      res.json({ success: true, message: "Connection successful! Your SMTP settings are working." });
    } catch (err: any) {
      res.status(400).json({ error: `Connection failed: ${err.message}` });
    }
  });

  // ─── AI Settings ───────────────────────────────────────
  app.get("/api/settings/ai", authenticate, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const { getTenantAIConfig, PLAN_LIMITS } = await import("./services/tenant-ai.js");
      const config = await getTenantAIConfig(req.user!.tenantId);
      res.json({
        plan: config.plan,
        provider: config.provider,
        hasApiKey: config.hasOwnKey,
        usageCount: config.usageCount,
        usageLimit: config.limit,
      });
    } catch (err) { res.status(500).json({ error: "Failed to fetch AI settings" }); }
  });

  app.put("/api/settings/ai", authenticate, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const { provider, apiKey } = req.body;
      const tenant = await storage.getTenantById(req.user!.tenantId);
      if (!tenant) return res.status(404).json({ error: "Workspace not found" });
      const currentSettings: any = tenant.settings || {};
      const currentAi: any = currentSettings.ai || {};
      const finalKey = (apiKey && apiKey !== "••••••••") ? apiKey : currentAi.apiKey;
      await storage.updateTenant(req.user!.tenantId, {
        settings: {
          ...currentSettings,
          ai: { ...currentAi, provider: provider || null, apiKey: finalKey || null },
        },
      });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Failed to save AI settings" }); }
  });

  app.delete("/api/settings/ai/key", authenticate, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const tenant = await storage.getTenantById(req.user!.tenantId);
      if (!tenant) return res.status(404).json({ error: "Workspace not found" });
      const currentSettings: any = tenant.settings || {};
      const currentAi: any = currentSettings.ai || {};
      await storage.updateTenant(req.user!.tenantId, {
        settings: { ...currentSettings, ai: { ...currentAi, apiKey: null, provider: null } },
      });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: "Failed to remove API key" }); }
  });

  // ─── Profile ──────────────────────────────────────────
  app.put("/api/profile", authenticate, async (req: AuthRequest, res) => {
    try {
      const { firstName, lastName, profileImageUrl, preferredLanguage } = req.body;
      const user = await storage.updateUser(req.user!.id, { firstName, lastName, profileImageUrl, preferredLanguage });
      res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, profileImageUrl: user.profileImageUrl });
    } catch (err) { res.status(500).json({ error: "Failed to update profile" }); }
  });

  // ─── Platform Admin ────────────────────────────────────
  app.get("/api/admin/tenants", authenticate, async (req: AuthRequest, res) => {
    if (req.user!.email !== (process.env.PLATFORM_OWNER_EMAIL || "abel@argilette.com")) {
      return res.status(403).json({ error: "Platform owner access required" });
    }
    try {
      const all = await storage.getAllTenants();
      res.json(all);
    } catch (err) { res.status(500).json({ error: "Failed to fetch tenants" }); }
  });

  // ─── AI Features ──────────────────────────────────────
  app.post("/api/ai/email", authenticate, async (req: AuthRequest, res) => {
    try {
      const { generateEmailCopy } = await import("./services/ai.js");
      const user = await storage.getUserById(req.user!.id);
      const tenant = await storage.getTenantById(req.user!.tenantId);
      const result = await generateEmailCopy({
        ...req.body,
        senderName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.email || "Team",
        senderCompany: tenant?.name || "Our Company",
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "AI generation failed" });
    }
  });

  app.post("/api/ai/score-lead", authenticate, async (req: AuthRequest, res) => {
    try {
      const { scoreLeadWithAI } = await import("./services/ai.js");
      const result = await scoreLeadWithAI(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Lead scoring failed" });
    }
  });

  // ─── AI Provider Status ─────────────────────────────
  app.get("/api/ai/provider", authenticate, async (req: AuthRequest, res) => {
    const { getProviderInfo } = await import("./services/ai-adapter.js");
    res.json(getProviderInfo());
  });

  // ─── Global Search ────────────────────────────────
  app.get("/api/search", authenticate, async (req: AuthRequest, res) => {
    try {
      const q = (req.query.q as string || "").trim().toLowerCase();
      if (!q || q.length < 2) return res.json({ contacts: [], leads: [], deals: [], accounts: [] });
      const tid = req.user!.tenantId;
      const [cts, lds, dls, acts] = await Promise.all([
        storage.getContacts(tid, { search: q, limit: 5 }),
        storage.getLeads(tid, { search: q, limit: 5 }),
        storage.getDeals(tid, { limit: 50 }),
        storage.getAccounts(tid, { search: q, limit: 5 }),
      ]);
      const filteredDeals = dls.filter((d: any) => d.name?.toLowerCase().includes(q) || d.contactName?.toLowerCase().includes(q)).slice(0, 5);
      res.json({ contacts: cts, leads: lds, deals: filteredDeals, accounts: acts });
    } catch (err) { res.status(500).json({ error: "Search failed" }); }
  });

  // ─── Change Password ───────────────────────────────
  app.post("/api/auth/change-password", authenticate, async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) return res.status(400).json({ error: "Both passwords required" });
      if (newPassword.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
      const user = await storage.getUserById(req.user!.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      const { verifyPassword, hashPassword } = await import("./middleware/auth.js");
      const valid = await verifyPassword(currentPassword, user.passwordHash || "");
      if (!valid) return res.status(401).json({ error: "Current password is incorrect" });
      const hash = await hashPassword(newPassword);
      await storage.updateUser(req.user!.id, { passwordHash: hash });
      res.json({ success: true });

      // Send confirmation email (non-blocking)
      const { sendPasswordChangedEmail } = await import("./services/email.js");
      sendPasswordChangedEmail({ to: user.email, firstName: user.firstName || "" })
        .catch(e => console.error("[EMAIL] Password-changed email failed:", e));

    } catch (err) { res.status(500).json({ error: "Failed to change password" }); }
  });

  // ─── Invite Team Member ────────────────────────────
  app.post("/api/team/invite", authenticate, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const { email, firstName, lastName, role } = req.body;
      if (!email) return res.status(400).json({ error: "Email is required" });
      const existing = await storage.getUserByEmailGlobal(email);
      if (existing) return res.status(409).json({ error: "A user with this email already exists" });
      const { hashPassword } = await import("./middleware/auth.js");
      const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
      const hash = await hashPassword(tempPassword);
      const newUser = await storage.createUser({
        email, firstName: firstName || "", lastName: lastName || "",
        role: role || "user", tenantId: req.user!.tenantId,
        passwordHash: hash, isActive: true, emailVerified: false,
      });
      res.status(201).json({ id: newUser.id, email: newUser.email, firstName: newUser.firstName, role: newUser.role, tempPassword });

      // Send invite email (non-blocking)
      const { sendTeamInviteEmail } = await import("./services/email.js");
      const inviterTenant = await storage.getTenantById(req.user!.tenantId).catch(() => null);
      sendTeamInviteEmail({
        to: email,
        firstName: firstName || "",
        invitedBy: `${req.user!.firstName || ""} ${req.user!.lastName || ""}`.trim() || req.user!.email,
        workspaceName: inviterTenant?.name || "Argilette",
        role: role || "user",
        tempPassword,
      }).catch(e => console.error("[EMAIL] Team invite email failed:", e));

    } catch (err: any) { res.status(500).json({ error: err.message || "Failed to invite user" }); }
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), version: "2.0.0" });
  });

  return createServer(app);
}
