import { Express, Router } from "express";
import { createServer, Server } from "http";
import { z } from "zod";
import multer from "multer";
import * as XLSX from "xlsx";
import { authenticate, requireRole, type AuthRequest } from "./middleware/auth.js";
import { aiRateLimit } from "./middleware/ai-rate-limit.js";
import rateLimit from "express-rate-limit";
import * as storage from "./storage.js";
import { db } from "./db.js";
import { contacts, tenants, users, leads, deals } from "@shared/schema.js";
import { agentSessions, agentMessages } from "@shared/schema-extended.js";
import { eq, and, sql as rawSql, gte, desc as descOp } from "drizzle-orm";
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
import marketplaceRouter from "./routes/marketplace.js";
import emailTrackingRouter from "./routes/email-tracking.js";
import aiRouter from "./routes/ai.js";
import ariaRouter from "./routes/aria.js";
import publicRouter from "./routes/public.js";
import analyticsRouter from "./routes/analytics.js";
import workflowsRouter from "./routes/workflows.js";
import skillsRouter from "./routes/skills.js";
import contractsRouter from "./routes/contracts.js";
import developerRouter from "./routes/developer.js";
import v1Router from "./routes/v1.js";
import { ensurePlatformTables } from "./platform/schema-init.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // ─── Platform tables (API keys, webhooks, metadata, custom fields) ──
  await ensurePlatformTables();

  // ─── Core Auth ──────────────────────────────────────
  app.use("/api/auth", authRouter);

  // ─── Developer settings: API keys + webhooks ────────
  app.use("/api/developer", developerRouter);

  // ─── Public Developer API (API-key auth) ────────────
  app.use("/api/v1", v1Router);

  // ─── Profile (alias for /api/auth/me so all clients agree) ────
  app.get("/api/me", authenticate, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      const tenant = await storage.getTenantById(user.tenantId);
      const { passwordHash, ...safeUser } = user as any;
      res.json({
        user: safeUser,
        tenant: tenant ? { id: tenant.id, name: tenant.name, domain: tenant.domain, plan: tenant.subscriptionPlan, trialEndsAt: tenant.trialEndsAt, settings: tenant.settings } : null,
      });
    } catch (err) {
      console.error("GET /api/me error:", err);
      res.status(500).json({ error: "Failed to load profile" });
    }
  });
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
  // ─── Data Marketplace ──────────────────────────────
  app.use("/api/marketplace", marketplaceRouter);
  app.use("/api/email", emailTrackingRouter);
  // ─── Super Admin ───────────────────────────────────
  app.use("/api/superadmin", adminRouter);
  // ─── ARIA AI Command Agent (auth first, then rate-limit per plan) ──
  app.use("/api/aria", authenticate, aiRateLimit, ariaRouter);
  // ─── Public Storefront API (no auth) ───────────────
  app.use("/api/public", publicRouter);
  // ─── Contracts & e-Signing ─────────────────────────
  app.use("/api/contracts", contractsRouter);
  // Public signing endpoints (no auth prefix so they share the router)
  app.get("/api/sign/:token", (req, res, next) => {
    req.url = `/sign/${req.params.token}`;
    (contractsRouter as any)(req, res, next);
  });
  app.post("/api/sign/:token", (req, res, next) => {
    req.url = `/sign/${req.params.token}`;
    (contractsRouter as any)(req, res, next);
  });

  // ─── Contacts ─────────────────────────────────────────
  app.get("/api/contacts", authenticate, async (req: AuthRequest, res) => {
    try {
      const { search, status, region, limit, offset } = req.query;
      const result = await storage.getContacts(req.user!.tenantId, {
        search: search as string,
        status: status as string,
        region: region as string,
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
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch contact" }); }
  });

  app.post("/api/contacts", authenticate, async (req: AuthRequest, res) => {
    try {
      const contact = await storage.createContact({ ...req.body, tenantId: req.user!.tenantId, createdBy: req.user!.id });
      res.status(201).json(contact);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to create contact" }); }
  });

  app.put("/api/contacts/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const contact = await storage.updateContact(req.params.id, req.user!.tenantId, req.body);
      res.json(contact);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to update contact" }); }
  });

  app.delete("/api/contacts/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      await storage.deleteContact(req.params.id, req.user!.tenantId);
      res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to delete contact" }); }
  });

  // Promote contact → lead
  app.post("/api/contacts/:id/to-lead", authenticate, async (req: AuthRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const rows = await db.select().from(contacts).where(and(eq(contacts.id, req.params.id), eq(contacts.tenantId, tenantId))).limit(1);
      if (!rows.length) return res.status(404).json({ error: "Contact not found" });
      const c = rows[0];
      // Check if lead with same email already exists
      if (c.email) {
        const existing = await db.select({ id: leads.id }).from(leads)
          .where(and(eq(leads.tenantId, tenantId), eq(leads.email, c.email))).limit(1);
        if (existing.length) return res.json({ leadId: existing[0].id, alreadyExisted: true });
      }
      const { randomUUID } = await import("crypto");
      const leadId = randomUUID();
      await db.insert(leads).values({
        id: leadId, tenantId,
        firstName: c.firstName, lastName: c.lastName || "",
        email: c.email || "", phone: c.phone || "",
        company: c.company || "", jobTitle: c.jobTitle || "",
        status: "new", source: c.source || "other",
        score: 50, notes: c.notes || "",
        createdBy: req.user!.id, createdAt: new Date(), updatedAt: new Date(),
      });
      res.json({ leadId, alreadyExisted: false });
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to promote contact to lead" }); }
  });

  // ─── CSV / Excel Import ───────────────────────────────
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

  // Column aliases: maps common spreadsheet headers → our field names
  const FIELD_ALIASES: Record<string, string> = {
    "first name": "firstName", "firstname": "firstName", "first": "firstName", "prénom": "firstName",
    "last name": "lastName", "lastname": "lastName", "last": "lastName", "nom": "lastName", "surname": "lastName",
    "full name": "fullName", "fullname": "fullName", "name": "fullName", "nom complet": "fullName",
    "email": "email", "e-mail": "email", "email address": "email", "courriel": "email",
    "phone": "phone", "phone number": "phone", "mobile": "phone", "tel": "phone", "téléphone": "phone",
    "company": "company", "company name": "company", "organisation": "company", "organization": "company", "entreprise": "company",
    "job title": "jobTitle", "title": "jobTitle", "position": "jobTitle", "role": "jobTitle", "poste": "jobTitle",
    "industry": "industry", "secteur": "industry",
    "city": "city", "ville": "city",
    "state": "state", "province": "state",
    "country": "country", "pays": "country",
    "website": "website", "url": "website", "site": "website",
    "notes": "notes", "note": "notes", "comments": "notes",
    "status": "status", "statut": "status",
    "source": "source",
    "linkedin": "linkedin", "linkedin url": "linkedin",
    "tags": "tags",
  };

  function detectField(header: string): string {
    return FIELD_ALIASES[header.toLowerCase().trim()] || header;
  }

  app.post("/api/contacts/import", authenticate, upload.single("file"), async (req: AuthRequest, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const ext = (req.file.originalname || "").split(".").pop()?.toLowerCase();
      if (!["csv", "xlsx", "xls"].includes(ext || "")) {
        return res.status(400).json({ error: "Only CSV and Excel files (.csv, .xlsx, .xls) are supported" });
      }

      // Parse file into rows
      const wb = XLSX.read(req.file.buffer, { type: "buffer", raw: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

      if (raw.length < 2) return res.status(400).json({ error: "File is empty or has no data rows" });

      const headerRow: string[] = (raw[0] as any[]).map(h => String(h || "").trim());
      const fieldMap = headerRow.map(detectField);
      const dataRows = raw.slice(1).filter(row => row.some((c: any) => String(c).trim()));

      if (dataRows.length === 0) return res.status(400).json({ error: "No data rows found in file" });

      const tenantId = req.user!.tenantId;

      // Load existing emails + phones for dedup
      const existing = await db.select({ email: contacts.email, phone: contacts.phone }).from(contacts).where(eq(contacts.tenantId, tenantId));
      const existingEmails = new Set(existing.map(c => c.email?.trim().toLowerCase()).filter(Boolean));
      const existingPhones = new Set(existing.map(c => c.phone?.replace(/\D/g, "")).filter(Boolean));

      let imported = 0, duplicates = 0, errors = 0;
      const errorDetails: string[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const rec: Record<string, string> = {};
        fieldMap.forEach((field, idx) => { rec[field] = String(row[idx] ?? "").trim(); });

        // Handle "Full Name" → split into first/last
        if (rec.fullName && !rec.firstName) {
          const parts = rec.fullName.trim().split(/\s+/);
          rec.firstName = parts[0] || "";
          rec.lastName  = parts.slice(1).join(" ") || "";
        }

        const emailKey = rec.email?.toLowerCase();
        const phoneKey = rec.phone?.replace(/\D/g, "");

        // Dedup check
        if ((emailKey && existingEmails.has(emailKey)) || (phoneKey && existingPhones.has(phoneKey))) {
          duplicates++;
          continue;
        }

        if (!rec.firstName && !rec.fullName && !rec.company && !rec.email && !rec.phone) {
          continue; // Skip truly blank rows silently
        }

        try {
          await db.insert(contacts).values({
            tenantId,
            firstName:  rec.firstName  || rec.fullName?.split(" ")[0] || "Unknown",
            lastName:   rec.lastName   || rec.fullName?.split(" ").slice(1).join(" ") || "",
            email:      rec.email      || null,
            phone:      rec.phone      || null,
            company:    rec.company    || null,
            jobTitle:   rec.jobTitle   || null,
            industry:   rec.industry   || null,
            city:       rec.city       || null,
            state:      rec.state      || null,
            country:    rec.country    || null,
            website:    rec.website    || null,
            notes:      rec.notes      || null,
            status:     rec.status     || "new",
            source:     rec.source     || null,
            linkedin:   rec.linkedin   || null,
            tags:       rec.tags ? [rec.tags] : [],
            leadSource: "import_file",
          } as any);

          if (emailKey) existingEmails.add(emailKey);
          if (phoneKey) existingPhones.add(phoneKey);
          imported++;
        } catch (e: any) {
          errors++;
          if (errorDetails.length < 5) errorDetails.push(`Row ${i + 2}: ${e.message}`);
        }
      }

      res.json({ imported, duplicates, errors, total: dataRows.length, errorDetails });
    } catch (err: any) {
      console.error("[contacts/import]", err.message);
      res.status(500).json({ error: `Import failed: ${err.message}` });
    }
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
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch leads" }); }
  });

  app.post("/api/leads", authenticate, async (req: AuthRequest, res) => {
    try {
      const lead = await storage.createLead({ ...req.body, tenantId: req.user!.tenantId, createdBy: req.user!.id });
      res.status(201).json(lead);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to create lead" }); }
  });

  app.put("/api/leads/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const lead = await storage.updateLead(req.params.id, req.user!.tenantId, req.body);
      res.json(lead);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to update lead" }); }
  });

  app.delete("/api/leads/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      await storage.deleteLead(req.params.id, req.user!.tenantId);
      res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to delete lead" }); }
  });

  // Convert lead → contact
  app.post("/api/leads/:id/convert", authenticate, async (req: AuthRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const leadRows = await db.select().from(leads).where(and(eq(leads.id, req.params.id), eq(leads.tenantId, tenantId))).limit(1);
      if (!leadRows.length) return res.status(404).json({ error: "Lead not found" });
      const lead = leadRows[0];
      // Check if contact with same email already exists
      if (lead.email) {
        const existing = await db.select({ id: contacts.id }).from(contacts)
          .where(and(eq(contacts.tenantId, tenantId), eq(contacts.email, lead.email))).limit(1);
        if (existing.length) {
          // Already exists — just mark lead converted
          await db.update(leads).set({ status: "converted", updatedAt: new Date() }).where(eq(leads.id, lead.id));
          return res.json({ contactId: existing[0].id, alreadyExisted: true });
        }
      }
      const { randomUUID } = await import("crypto");
      const contactId = randomUUID();
      await db.insert(contacts).values({
        id: contactId, tenantId,
        firstName: lead.firstName, lastName: lead.lastName || "",
        email: lead.email || "", phone: lead.phone || "",
        company: lead.company || "", jobTitle: lead.jobTitle || "",
        status: "active", source: lead.source || "other",
        notes: lead.notes || "", createdBy: req.user!.id,
        createdAt: new Date(), updatedAt: new Date(),
      });
      await db.update(leads).set({ status: "converted", updatedAt: new Date() }).where(eq(leads.id, lead.id));
      res.json({ contactId, alreadyExisted: false });
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to convert lead" }); }
  });

  // ─── Deals ────────────────────────────────────────────
  app.get("/api/deals", authenticate, async (req: AuthRequest, res) => {
    try {
      const result = await storage.getDeals(req.user!.tenantId, { stage: req.query.stage as string });
      res.json(result);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch deals" }); }
  });

  app.post("/api/deals", authenticate, async (req: AuthRequest, res) => {
    try {
      const body = req.body;
      const deal = await storage.createDeal({
        ...body,
        title: body.name || body.title || "New Deal",
        tenantId: req.user!.tenantId,
        createdBy: req.user!.id,
      });
      res.status(201).json(deal);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to create deal" }); }
  });

  app.put("/api/deals/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const deal = await storage.updateDeal(req.params.id, req.user!.tenantId, req.body);
      res.json(deal);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to update deal" }); }
  });

  app.delete("/api/deals/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      await storage.deleteDeal(req.params.id, req.user!.tenantId);
      res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to delete deal" }); }
  });

  // ─── Tasks ────────────────────────────────────────────
  app.get("/api/tasks", authenticate, async (req: AuthRequest, res) => {
    try {
      const tasks = await storage.getTasks(req.user!.tenantId, {
        status: req.query.status as string,
        assignedTo: req.query.assignedTo as string,
      });
      res.json(tasks);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch tasks" }); }
  });

  app.post("/api/tasks", authenticate, async (req: AuthRequest, res) => {
    try {
      const task = await storage.createTask({
        ...req.body,
        tenantId: req.user!.tenantId,
        createdBy: req.user!.id,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      });
      res.status(201).json(task);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to create task" }); }
  });

  app.put("/api/tasks/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const task = await storage.updateTask(req.params.id, req.user!.tenantId, req.body);
      res.json(task);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to update task" }); }
  });

  app.delete("/api/tasks/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      await storage.deleteTask(req.params.id, req.user!.tenantId);
      res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to delete task" }); }
  });

  // ─── Accounts ─────────────────────────────────────────
  app.get("/api/accounts", authenticate, async (req: AuthRequest, res) => {
    try {
      const result = await storage.getAccounts(req.user!.tenantId, { search: req.query.search as string });
      res.json(result);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch accounts" }); }
  });

  app.post("/api/accounts", authenticate, async (req: AuthRequest, res) => {
    try {
      const account = await storage.createAccount({ ...req.body, tenantId: req.user!.tenantId, createdBy: req.user!.id });
      res.status(201).json(account);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to create account" }); }
  });

  app.put("/api/accounts/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const account = await storage.updateAccount(req.params.id, req.user!.tenantId, req.body);
      res.json(account);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to update account" }); }
  });

  app.delete("/api/accounts/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      await storage.deleteAccount(req.params.id, req.user!.tenantId);
      res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to delete account" }); }
  });

  // ─── Activities ────────────────────────────────────────
  app.get("/api/activities", authenticate, async (req: AuthRequest, res) => {
    try {
      const acts = await storage.getActivities(req.user!.tenantId, {
        contactId: req.query.contactId as string,
        dealId: req.query.dealId as string,
      });
      res.json(acts);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch activities" }); }
  });

  app.post("/api/activities", authenticate, async (req: AuthRequest, res) => {
    try {
      const activity = await storage.createActivity({
        tenantId: req.user!.tenantId,
        createdBy: req.user!.id,
        type:      req.body.type      || "note",
        channel:   req.body.channel   || "other",
        direction: req.body.direction || "outbound",
        content:   req.body.content   || req.body.note || req.body.description || "",
        contactId: req.body.contactId || req.body.entityId || null,
        dealId:    req.body.dealId    || null,
        meta:      req.body.meta      || {},
      });
      res.status(201).json(activity);
    } catch (err) { console.error("POST /activities error:", err); res.status(500).json({ error: "Failed to create activity" }); }
  });

  // ─── Campaigns ─────────────────────────────────────────
  app.get("/api/campaigns", authenticate, async (req: AuthRequest, res) => {
    try {
      const camps = await storage.getCampaigns(req.user!.tenantId);
      res.json(camps);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch campaigns" }); }
  });

  app.post("/api/campaigns", authenticate, async (req: AuthRequest, res) => {
    try {
      const campaign = await storage.createCampaign({ ...req.body, tenantId: req.user!.tenantId });
      res.status(201).json(campaign);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to create campaign" }); }
  });

  app.put("/api/campaigns/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const campaign = await storage.updateCampaign(req.params.id, req.user!.tenantId, req.body);
      res.json(campaign);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to update campaign" }); }
  });

  app.delete("/api/campaigns/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      await storage.deleteCampaign(req.params.id, req.user!.tenantId);
      res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to delete campaign" }); }
  });

  // ─── Invoices ─────────────────────────────────────────
  app.get("/api/invoices", authenticate, async (req: AuthRequest, res) => {
    try {
      const invs = await storage.getInvoices(req.user!.tenantId);
      res.json(invs);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch invoices" }); }
  });

  app.post("/api/invoices", authenticate, async (req: AuthRequest, res) => {
    try {
      const body = req.body;
      // Accept both naming conventions: clientName/client/name + amount/total
      const clientName = body.clientName || body.client || body.name || "";
      const total      = body.total      || body.amount || 0;
      const invoiceNumber = body.number || body.invoiceNumber || `INV-${Date.now()}`;
      const status     = body.status  || "pending";
      const dueDate    = body.dueDate ? new Date(body.dueDate) : null;

      if (!clientName) {
        return res.status(400).json({
          error: "Validation failed",
          required: ["clientName (or client)", "amount (or total)"],
          optional: ["number", "status", "dueDate"],
        });
      }

      const invoice = await storage.createInvoice({
        tenantId: req.user!.tenantId,
        createdBy: req.user!.id as any,
        number: invoiceNumber,
        total: String(total),
        notes: clientName,
        status,
        dueDate,
      } as any);
      res.status(201).json(invoice);
    } catch (err) { console.error("POST /invoices error:", err); res.status(500).json({ error: "Failed to create invoice" }); }
  });

  app.put("/api/invoices/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const invoice = await storage.updateInvoice(req.params.id, req.user!.tenantId, req.body);
      res.json(invoice);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to update invoice" }); }
  });

  app.delete("/api/invoices/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      await storage.deleteInvoice(req.params.id, req.user!.tenantId);
      res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to delete invoice" }); }
  });

  // ─── Dashboard ─────────────────────────────────────────
  app.get("/api/dashboard", authenticate, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getDashboardStats(req.user!.tenantId);
      res.json(stats);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch dashboard stats" }); }
  });

  // ─── Users (tenant) ────────────────────────────────────
  app.get("/api/users", authenticate, async (req: AuthRequest, res) => {
    try {
      const userList = await storage.getUsersByTenant(req.user!.tenantId);
      res.json(userList.map(u => ({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role, isActive: u.isActive, lastLoginAt: u.lastLoginAt, createdAt: u.createdAt })));
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch users" }); }
  });

  app.put("/api/users/:id", authenticate, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const { role, isActive, firstName, lastName } = req.body;
      const user = await storage.updateUser(req.params.id, { role, isActive, firstName, lastName });
      res.json({ id: user.id, email: user.email, firstName: user.firstName, role: user.role });
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to update user" }); }
  });

  app.delete("/api/users/:id", authenticate, requireRole("super_admin"), async (req: AuthRequest, res) => {
    try {
      if (req.params.id === req.user!.id) return res.status(400).json({ error: "Cannot delete yourself" });
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to delete user" }); }
  });

  // ─── Settings ─────────────────────────────────────────
  app.get("/api/settings", authenticate, async (req: AuthRequest, res) => {
    try {
      const tenant = await storage.getTenantById(req.user!.tenantId);
      if (!tenant) return res.status(404).json({ error: "Workspace not found" });
      res.json({ name: tenant.name, domain: tenant.domain, settings: tenant.settings, plan: tenant.subscriptionPlan, trialEndsAt: tenant.trialEndsAt });
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch settings" }); }
  });

  app.put("/api/settings", authenticate, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const { name, settings } = req.body;
      const tenant = await storage.updateTenant(req.user!.tenantId, { name, settings });
      res.json({ name: tenant.name, settings: tenant.settings });
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to update settings" }); }
  });

  // ─── SMTP Settings ─────────────────────────────────────
  app.get("/api/settings/smtp", authenticate, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const tenant = await storage.getTenantById(req.user!.tenantId);
      if (!tenant) return res.status(404).json({ error: "Workspace not found" });
      const smtp = (tenant.settings as any)?.smtp || {};
      // Never send password back to frontend — return masked version
      res.json({ ...smtp, pass: smtp.pass ? "••••••••" : "" });
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch SMTP settings" }); }
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
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to save SMTP settings" }); }
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
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch AI settings" }); }
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
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to save AI settings" }); }
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
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to remove API key" }); }
  });

  // ─── Profile ──────────────────────────────────────────
  app.put("/api/profile", authenticate, async (req: AuthRequest, res) => {
    try {
      const { firstName, lastName, profileImageUrl, preferredLanguage } = req.body;
      const user = await storage.updateUser(req.user!.id, { firstName, lastName, profileImageUrl, preferredLanguage });
      res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, profileImageUrl: user.profileImageUrl });
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to update profile" }); }
  });

  // ─── Platform Admin ────────────────────────────────────
  const OWNER_EMAIL = process.env.PLATFORM_OWNER_EMAIL || "abel@argilette.com";
  function requirePlatformOwner(req: AuthRequest, res: any, next: any) {
    if (req.user?.email !== OWNER_EMAIL && req.user?.role !== "platform_owner" && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Platform owner access required" });
    }
    next();
  }

  app.get("/api/admin/tenants", authenticate, requirePlatformOwner, async (req: AuthRequest, res) => {
    try {
      const all = await storage.getAllTenants();
      res.json(all);
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch tenants" }); }
  });

  app.get("/api/admin/stats", authenticate, requirePlatformOwner, async (req: AuthRequest, res) => {
    try {
      const [tenantCount] = await db.select({ n: rawSql<number>`count(*)` }).from(tenants);
      const [userCount] = await db.select({ n: rawSql<number>`count(*)` }).from(users);
      const [contactCount] = await db.select({ n: rawSql<number>`count(*)` }).from(contacts);
      const [leadCount] = await db.select({ n: rawSql<number>`count(*)` }).from(leads);
      const [dealStats] = await db.select({ count: rawSql<number>`count(*)`, revenue: rawSql<number>`coalesce(sum(value::numeric),0)` }).from(deals).where(eq(deals.stage, "closed_won"));
      const [sessionCount] = await db.select({ n: rawSql<number>`count(*)` }).from(agentSessions);
      const [messageCount] = await db.select({ n: rawSql<number>`count(*)` }).from(agentMessages);
      const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const [newTenants] = await db.select({ n: rawSql<number>`count(*)` }).from(tenants).where(gte(tenants.createdAt, thirtyDaysAgo));
      const planDist = await db.select({ plan: tenants.subscriptionPlan, count: rawSql<number>`count(*)` }).from(tenants).groupBy(tenants.subscriptionPlan);
      res.json({
        tenants: { total: Number(tenantCount.n), new30d: Number(newTenants.n) },
        users: Number(userCount.n),
        contacts: Number(contactCount.n),
        leads: Number(leadCount.n),
        deals: { won: Number(dealStats.count), revenue: Number(dealStats.revenue) },
        agents: { sessions: Number(sessionCount.n), messages: Number(messageCount.n) },
        plans: planDist.map(p => ({ plan: p.plan, count: Number(p.count) })),
      });
    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to fetch admin stats" }); }
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

  // ─── AI Provider Info (alias for /provider) ──────────
  app.get("/api/ai/provider-info", authenticate, async (req: AuthRequest, res) => {
    const { getProviderInfo } = await import("./services/ai-adapter.js");
    res.json(getProviderInfo());
  });

  // ─── AI Usage Dashboard ──────────────────────────────
  app.get("/api/ai/usage", authenticate, async (req: AuthRequest, res) => {
    try {
      const { getUsageDashboard } = await import("./services/ai-credits.js");
      const data = await getUsageDashboard(req.user!.tenantId);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
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
      const dealsList = Array.isArray(dls) ? dls : (dls as any).data || [];
      const filteredDeals = dealsList.filter((d: any) => d.name?.toLowerCase().includes(q) || d.contactName?.toLowerCase().includes(q)).slice(0, 5);
      res.json({ contacts: cts, leads: lds, deals: filteredDeals, accounts: acts });
    } catch (err) {
      console.error("GET /api/search error:", err);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // ─── Change Password (rate-limited: 10/15min to prevent brute-force) ──
  const changePwRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: "Too many password change attempts, please try again later" } });
  app.post("/api/auth/change-password", changePwRateLimit, authenticate, async (req: AuthRequest, res) => {
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

    } catch (err) { console.error(err); res.status(500).json({ error: "Failed to change password" }); }
  });

  // ─── Invite Team Member ────────────────────────────
  app.post("/api/team/invite", authenticate, requireRole("super_admin", "admin"), async (req: AuthRequest, res) => {
    try {
      const { email, lastName, role } = req.body;
      const firstName = req.body.firstName || email.split("@")[0];
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
