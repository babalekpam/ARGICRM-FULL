import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { sql, eq, and, desc } from "drizzle-orm";
import { pgTable, varchar, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { randomBytes } from "crypto";
import { sendContractEmail } from "../services/email.js";

const router = Router();

// ── Inline table definitions ────────────────────────────────────
const contractTemplates = pgTable("contract_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  body: text("body").notNull(),
  variables: jsonb("variables").default([]),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  templateId: varchar("template_id"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  status: text("status").default("draft"),
  contactId: varchar("contact_id"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email").notNull(),
  signerName: text("signer_name"),
  signerIp: text("signer_ip"),
  signerUserAgent: text("signer_user_agent"),
  signatureData: text("signature_data"),
  signToken: varchar("sign_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  sentAt: timestamp("sent_at"),
  viewedAt: timestamp("viewed_at"),
  signedAt: timestamp("signed_at"),
  declinedAt: timestamp("declined_at"),
  variables: jsonb("variables").default({}),
  notes: text("notes"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// ── Helper: fill variables in body ─────────────────────────────
function fillVariables(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
}

// ── Templates ──────────────────────────────────────────────────
router.get("/templates", authenticate, async (req: AuthRequest, res) => {
  const rows = await db.select().from(contractTemplates)
    .where(and(eq(contractTemplates.tenantId, req.user!.tenantId), eq(contractTemplates.isActive, true)))
    .orderBy(desc(contractTemplates.createdAt));
  res.json(rows);
});

router.post("/templates", authenticate, async (req: AuthRequest, res) => {
  const { name, description, body, variables } = req.body;
  if (!name || !body) return res.status(400).json({ error: "name and body are required" });
  const [row] = await db.insert(contractTemplates).values({
    tenantId: req.user!.tenantId, name, description, body,
    variables: variables || [],
    createdBy: req.user!.id,
  }).returning();
  res.status(201).json(row);
});

router.put("/templates/:id", authenticate, async (req: AuthRequest, res) => {
  const [row] = await db.update(contractTemplates)
    .set({ ...req.body, updatedAt: new Date() })
    .where(and(eq(contractTemplates.id, req.params.id), eq(contractTemplates.tenantId, req.user!.tenantId)))
    .returning();
  res.json(row);
});

router.delete("/templates/:id", authenticate, async (req: AuthRequest, res) => {
  await db.update(contractTemplates)
    .set({ isActive: false })
    .where(and(eq(contractTemplates.id, req.params.id), eq(contractTemplates.tenantId, req.user!.tenantId)));
  res.json({ success: true });
});

// ── Contracts ──────────────────────────────────────────────────
router.get("/", authenticate, async (req: AuthRequest, res) => {
  const rows = await db.select().from(contracts)
    .where(eq(contracts.tenantId, req.user!.tenantId))
    .orderBy(desc(contracts.createdAt));
  res.json(rows);
});

router.get("/:id", authenticate, async (req: AuthRequest, res) => {
  const [row] = await db.select().from(contracts)
    .where(and(eq(contracts.id, req.params.id), eq(contracts.tenantId, req.user!.tenantId)));
  if (!row) return res.status(404).json({ error: "Contract not found" });
  res.json(row);
});

router.post("/", authenticate, async (req: AuthRequest, res) => {
  const { title, body, contactId, contactName, contactEmail, templateId, variables, notes } = req.body;
  if (!title || !contactEmail) return res.status(400).json({ error: "title and contactEmail are required" });
  const resolvedBody = variables ? fillVariables(body || "", variables) : (body || "");
  const [row] = await db.insert(contracts).values({
    tenantId: req.user!.tenantId, title, body: resolvedBody,
    contactId, contactName, contactEmail, templateId,
    variables: variables || {}, notes,
    status: "draft", createdBy: req.user!.id,
  }).returning();
  res.status(201).json(row);
});

router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  const [row] = await db.update(contracts)
    .set({ ...req.body, updatedAt: new Date() })
    .where(and(eq(contracts.id, req.params.id), eq(contracts.tenantId, req.user!.tenantId)))
    .returning();
  res.json(row);
});

router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  await db.delete(contracts)
    .where(and(eq(contracts.id, req.params.id), eq(contracts.tenantId, req.user!.tenantId)));
  res.json({ success: true });
});

// ── Send contract ──────────────────────────────────────────────
router.post("/:id/send", authenticate, async (req: AuthRequest, res) => {
  try {
    const [contract] = await db.select().from(contracts)
      .where(and(eq(contracts.id, req.params.id), eq(contracts.tenantId, req.user!.tenantId)));
    if (!contract) return res.status(404).json({ error: "Contract not found" });
    if (!contract.contactEmail) return res.status(400).json({ error: "Contract has no recipient email" });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const appUrl = process.env.APP_URL || "https://www.argilette.org";
    const signLink = `${appUrl}/sign/${token}`;

    await db.update(contracts).set({
      signToken: token,
      tokenExpiresAt: expiresAt,
      status: "sent",
      sentAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(contracts.id, contract.id));

    await sendContractEmail({
      to: contract.contactEmail,
      recipientName: contract.contactName || contract.contactEmail,
      contractTitle: contract.title,
      signLink,
      senderName: req.user!.firstName ? `${req.user!.firstName} ${req.user!.lastName || ""}`.trim() : "Your Account Manager",
      expiresAt,
    });

    res.json({ success: true, signLink });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Public: view contract for signing (no auth) ────────────────
router.get("/sign/:token", async (req, res) => {
  const [contract] = await db.select({
    id: contracts.id,
    title: contracts.title,
    body: contracts.body,
    status: contracts.status,
    contactName: contracts.contactName,
    contactEmail: contracts.contactEmail,
    tokenExpiresAt: contracts.tokenExpiresAt,
    signedAt: contracts.signedAt,
    declinedAt: contracts.declinedAt,
  }).from(contracts).where(eq(contracts.signToken, req.params.token));

  if (!contract) return res.status(404).json({ error: "Contract not found or link is invalid" });
  if (contract.tokenExpiresAt && new Date() > contract.tokenExpiresAt)
    return res.status(410).json({ error: "This signing link has expired" });

  // Mark as viewed if first time
  if (contract.status === "sent") {
    await db.update(contracts).set({ status: "viewed", viewedAt: new Date() })
      .where(eq(contracts.id, contract.id));
  }

  res.json(contract);
});

// ── Public: submit signature (no auth) ─────────────────────────
router.post("/sign/:token", async (req, res) => {
  try {
    const { signerName, signatureData, action } = req.body;
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "";
    const ua = req.headers["user-agent"] || "";

    const [contract] = await db.select().from(contracts).where(eq(contracts.signToken, req.params.token));
    if (!contract) return res.status(404).json({ error: "Contract not found" });
    if (contract.tokenExpiresAt && new Date() > contract.tokenExpiresAt)
      return res.status(410).json({ error: "This signing link has expired" });
    if (contract.status === "signed") return res.status(409).json({ error: "Contract already signed" });
    if (contract.status === "declined") return res.status(409).json({ error: "Contract was declined" });

    if (action === "decline") {
      await db.update(contracts).set({ status: "declined", declinedAt: new Date(), signerIp: ip, signerUserAgent: ua, updatedAt: new Date() })
        .where(eq(contracts.id, contract.id));
      return res.json({ success: true, status: "declined" });
    }

    if (!signerName || !signatureData) return res.status(400).json({ error: "signerName and signatureData are required" });

    await db.update(contracts).set({
      status: "signed",
      signerName, signatureData,
      signerIp: ip,
      signerUserAgent: ua,
      signedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(contracts.id, contract.id));

    res.json({ success: true, status: "signed", signedAt: new Date() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
