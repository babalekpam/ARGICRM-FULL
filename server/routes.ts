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

export async function registerRoutes(app: Express): Promise<Server> {
  // ─── Core Auth ──────────────────────────────────────
  app.use("/api/auth", authRouter);
  // ─── AI Agents ─────────────────────────────────────
  app.use("/api/agents", agentRouter);
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
      const campaign = await storage.createCampaign({ ...req.body, tenantId: req.user!.tenantId, createdBy: req.user!.id });
      res.status(201).json(campaign);
    } catch (err) { res.status(500).json({ error: "Failed to create campaign" }); }
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

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), version: "2.0.0" });
  });

  return createServer(app);
}
