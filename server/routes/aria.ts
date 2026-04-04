import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { contacts, leads, deals, stores } from "@shared/schema";
import { crmProjects } from "@shared/schema";
import { ariaAuditLog } from "@shared/schema-extended";
import { completeForTenant } from "../services/tenant-ai.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendContractEmail } from "../services/email.js";

const router = Router();

const ARIA_SYSTEM = `You are ARIA, the AI Command Agent embedded inside ArgiCRM — a CRM and business management platform by ARGILETTE LLC.

Your job is to understand plain-language instructions and execute them across the platform.

CRITICAL: Always respond with ONLY valid JSON — no markdown, no explanation, just the JSON object:

{
  "message": "Your conversational response (concise, action-oriented)",
  "module": "crm|contracts|projects|billing|marketing|settings|general",
  "action": null,
  "needsConfirmation": false
}

OR when you can execute an action:
{
  "message": "Confirmation of what you did or are about to do",
  "module": "crm|contracts|projects|billing|marketing|settings",
  "action": {
    "type": "CREATE|READ|UPDATE|DELETE|NAVIGATE|SUMMARIZE",
    "entity": "contact|lead|deal|product|store|project|task|contract",
    "data": {}
  },
  "needsConfirmation": false
}

For DESTRUCTIVE actions (deleting many records, mass emails, sending contracts to multiple people), set needsConfirmation: true.

Rules:
- Respond in the same language the user writes in (EN or FR)
- Be concise and action-oriented — confirm what you did, not what you will do
- Never make up data — if something doesn't exist, say so clearly
- Always tell the user which module you're acting on
- For unclear instructions, ask exactly ONE clarifying question
- For CREATE contact: extract firstName, lastName, email, company, phone from the message
- For CREATE lead: extract firstName, lastName, email, company, source from the message
- For CREATE project: extract name, description, status (planning|active|completed), priority (low|medium|high)
- For CREATE contract: extract title, contactEmail, contactName, body (the contract text), notes. If the user asks to use a specific template, set data.useTemplate to the template name.
- For READ contracts: set data.filter to "all"|"draft"|"sent"|"signed"|"declined"|"recent"
- For UPDATE contract (send): extract contractId or contractTitle to look up the contract, set data.action to "send"
- For UPDATE contract (status): set data.action to "update_status", data.contractId, data.status
- For NAVIGATE: set data.path to the route (e.g. "/contacts", "/contracts", "/ecommerce", "/finance")
- Account owners and admins can create, send, update, and view contracts`;

async function executeAriaAction(
  action: any,
  user: any,
  tenantId: string
): Promise<string> {
  const { type, entity, data } = action;

  // ── CRM: Create Contact ───────────────────────────────────────────
  if (type === "CREATE" && entity === "contact") {
    const insertData: any = { tenantId };
    if (data.firstName) insertData.firstName = data.firstName;
    if (data.lastName) insertData.lastName = data.lastName;
    if (data.email) insertData.email = data.email;
    if (data.company) insertData.company = data.company;
    if (data.phone) insertData.phone = data.phone;
    await db.insert(contacts).values(insertData);
    const name = [data.firstName, data.lastName].filter(Boolean).join(" ") || data.email || "Contact";
    return `Contact "${name}" has been added to your CRM.`;
  }

  // ── CRM: Create Lead ─────────────────────────────────────────────
  if (type === "CREATE" && entity === "lead") {
    const insertData: any = { tenantId, status: "new" };
    if (data.firstName) insertData.firstName = data.firstName;
    if (data.lastName) insertData.lastName = data.lastName;
    if (data.email) insertData.email = data.email;
    if (data.company) insertData.company = data.company;
    if (data.source) insertData.source = data.source;
    await db.insert(leads).values(insertData);
    const name = [data.firstName, data.lastName].filter(Boolean).join(" ") || data.email || "Lead";
    return `Lead "${name}" has been added to your pipeline.`;
  }

  // ── Projects: Create ─────────────────────────────────────────────
  if (type === "CREATE" && entity === "project") {
    const insertData: any = {
      tenantId,
      ownerId: user.id,
      name: data.name || "New Project",
      description: data.description || null,
      status: data.status || "planning",
      priority: data.priority || "medium",
      color: data.color || "#3b82f6",
    };
    await db.insert(crmProjects).values(insertData);
    return `Project "${insertData.name}" has been created in Operations.`;
  }

  // ── CRM: Read Contacts ────────────────────────────────────────────
  if (type === "READ" && entity === "contact") {
    const rows = await db.select().from(contacts).where(eq(contacts.tenantId, tenantId)).orderBy(desc(contacts.createdAt)).limit(5);
    if (!rows.length) return "No contacts found in your CRM.";
    const names = rows.map((c: any) => [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email).join(", ");
    return `Your 5 most recent contacts: ${names}.`;
  }

  // ── Contracts: Create ─────────────────────────────────────────────
  if (type === "CREATE" && entity === "contract") {
    const title = data.title || "New Contract";
    const contactEmail = data.contactEmail;
    if (!contactEmail) return "To create a contract, I need the recipient's email address. Please provide it.";

    let body = data.body || "";

    // Optionally pull a matching template body if useTemplate is set and body is empty
    if (!body && data.useTemplate) {
      const tmplRows = await db.execute(sql`
        SELECT body FROM contract_templates
        WHERE tenant_id = ${tenantId}
          AND is_active = true
          AND LOWER(name) ILIKE ${"%" + data.useTemplate.toLowerCase() + "%"}
        LIMIT 1
      `);
      if (tmplRows.rows.length > 0) {
        body = (tmplRows.rows[0] as any).body || "";
      }
    }

    if (!body) {
      body = `CONTRACT: ${title}\n\nThis contract was created via ARIA AI on ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}.\n\nParties:\n- Provider: [To be completed]\n- Recipient: ${data.contactName || contactEmail}\n\nPlease open the Contracts module to review and complete the contract body before sending.`;
    }

    await db.execute(sql`
      INSERT INTO contracts (id, tenant_id, title, body, contact_name, contact_email, status, notes, created_by, variables, created_at, updated_at)
      VALUES (
        gen_random_uuid()::varchar,
        ${tenantId},
        ${title},
        ${body},
        ${data.contactName || null},
        ${contactEmail},
        'draft',
        ${data.notes || null},
        ${user.id},
        '{}'::jsonb,
        now(),
        now()
      )
    `);

    return `Contract "${title}" has been created as a draft and addressed to ${contactEmail}. You can open it in the Contracts module to review and send it.`;
  }

  // ── Contracts: Read / Summarize ───────────────────────────────────
  if ((type === "READ" || type === "SUMMARIZE") && entity === "contract") {
    const filter = data?.filter || "recent";
    let whereClause = sql`tenant_id = ${tenantId}`;
    if (filter !== "all" && filter !== "recent") {
      whereClause = sql`tenant_id = ${tenantId} AND status = ${filter}`;
    }
    const result = await db.execute(sql`
      SELECT title, status, contact_name, contact_email, created_at, signed_at
      FROM contracts
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT 8
    `);

    const rows = result.rows as any[];
    if (!rows.length) return filter === "recent" ? "You have no contracts yet." : `No ${filter} contracts found.`;

    const counts = await db.execute(sql`
      SELECT status, COUNT(*)::int as n FROM contracts WHERE tenant_id = ${tenantId} GROUP BY status
    `);
    const summary = (counts.rows as any[]).map((r: any) => `${r.n} ${r.status}`).join(", ");

    const list = rows.map((r: any) => {
      const name = r.contact_name || r.contact_email;
      const date = r.signed_at
        ? `signed ${new Date(r.signed_at).toLocaleDateString()}`
        : `created ${new Date(r.created_at).toLocaleDateString()}`;
      return `• "${r.title}" → ${r.status} (${name}, ${date})`;
    }).join("\n");

    return `Contract overview: ${summary}.\n\nRecent contracts:\n${list}`;
  }

  // ── Contracts: Update (send or change status) ─────────────────────
  if (type === "UPDATE" && entity === "contract") {
    const action = data?.action;

    if (action === "send") {
      // Look up the contract by ID or title
      let contractId = data.contractId;
      if (!contractId && data.contractTitle) {
        const found = await db.execute(sql`
          SELECT id, title, contact_email, contact_name FROM contracts
          WHERE tenant_id = ${tenantId}
            AND status IN ('draft','sent','viewed')
            AND LOWER(title) ILIKE ${"%" + data.contractTitle.toLowerCase() + "%"}
          LIMIT 1
        `);
        if (found.rows.length > 0) contractId = (found.rows[0] as any).id;
      }
      if (!contractId) return "I couldn't find that contract. Please check the title or open the Contracts module.";

      const cRows = await db.execute(sql`SELECT * FROM contracts WHERE id = ${contractId} AND tenant_id = ${tenantId} LIMIT 1`);
      if (!cRows.rows.length) return "Contract not found.";
      const contract = cRows.rows[0] as any;

      if (!contract.contact_email) return "This contract has no recipient email — please update it in the Contracts module first.";

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const appUrl = process.env.APP_URL || "https://www.argilette.org";
      const signLink = `${appUrl}/sign/${token}`;

      await db.execute(sql`
        UPDATE contracts SET sign_token = ${token}, token_expires_at = ${expiresAt.toISOString()},
        status = 'sent', sent_at = now(), updated_at = now()
        WHERE id = ${contractId}
      `);

      const senderName = user.firstName
        ? `${user.firstName} ${user.lastName || ""}`.trim()
        : "Your Account Manager";

      await sendContractEmail({
        to: contract.contact_email,
        recipientName: contract.contact_name || contract.contact_email,
        contractTitle: contract.title,
        signLink,
        senderName,
        expiresAt,
      });

      return `Contract "${contract.title}" has been sent to ${contract.contact_email} for e-signature. The signing link is valid for 30 days.`;
    }

    if (action === "update_status" && data.contractId && data.status) {
      await db.execute(sql`
        UPDATE contracts SET status = ${data.status}, updated_at = now()
        WHERE id = ${data.contractId} AND tenant_id = ${tenantId}
      `);
      return `Contract status updated to "${data.status}".`;
    }

    // Generic field update (title, notes, body, contactEmail etc.)
    if (data.contractId) {
      const updates: string[] = [];
      const allowedFields: Record<string, string> = {
        title: "title",
        notes: "notes",
        body: "body",
        contactEmail: "contact_email",
        contactName: "contact_name",
      };
      for (const [jsKey, dbCol] of Object.entries(allowedFields)) {
        if (data[jsKey] !== undefined) {
          updates.push(`${dbCol} = '${String(data[jsKey]).replace(/'/g, "''")}'`);
        }
      }
      if (updates.length) {
        await db.execute(sql`
          UPDATE contracts SET updated_at = now()
          WHERE id = ${data.contractId} AND tenant_id = ${tenantId}
        `);
      }
      return `Contract has been updated.`;
    }

    return "Please specify which contract to update and what to change.";
  }

  // ── Contracts: Delete ─────────────────────────────────────────────
  if (type === "DELETE" && entity === "contract") {
    if (!data.contractId) return "Please provide the contract ID to delete.";
    await db.execute(sql`DELETE FROM contracts WHERE id = ${data.contractId} AND tenant_id = ${tenantId}`);
    return `Contract has been permanently deleted.`;
  }

  // ── Navigate ──────────────────────────────────────────────────────
  if (type === "NAVIGATE") {
    return `NAVIGATE:${data.path || "/dashboard"}`;
  }

  return "Action completed.";
}

router.post("/chat", authenticate, async (req: AuthRequest, res) => {
  try {
    const { message, history = [] } = req.body;
    const user = req.user!;

    const messages = [
      ...history.slice(-10),
      { role: "user" as const, content: message },
    ];

    const raw = await completeForTenant(user.tenantId, {
      messages,
      system:
        ARIA_SYSTEM +
        `\n\nCurrent user: ${user.email} (role: ${user.role})`,
      maxTokens: 1200,
    });

    let parsed: any;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      parsed = {
        message: raw,
        module: "general",
        action: null,
        needsConfirmation: false,
      };
    }

    let finalMessage = parsed.message;
    let navigateTo: string | null = null;

    if (parsed.action && !parsed.needsConfirmation) {
      try {
        const result = await executeAriaAction(parsed.action, user, user.tenantId);
        if (result.startsWith("NAVIGATE:")) {
          navigateTo = result.replace("NAVIGATE:", "");
          finalMessage = `Navigating to ${navigateTo}…`;
        } else {
          finalMessage = result;
        }
      } catch (e: any) {
        finalMessage = `I encountered an issue: ${e.message}`;
      }
    }

    try {
      await db.insert(ariaAuditLog).values({
        tenantId: user.tenantId,
        userId: user.id,
        instruction: message,
        intentModule: parsed.module,
        intentAction: parsed.action?.type,
        result: finalMessage,
        status: "success",
      });
    } catch {}

    res.json({
      response: finalMessage,
      module: parsed.module,
      needsConfirmation: parsed.needsConfirmation || false,
      pendingAction: parsed.needsConfirmation ? parsed.action : null,
      navigateTo,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/confirm", authenticate, async (req: AuthRequest, res) => {
  try {
    const { action } = req.body;
    const user = req.user!;
    const result = await executeAriaAction(action, user, user.tenantId);
    res.json({ response: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
