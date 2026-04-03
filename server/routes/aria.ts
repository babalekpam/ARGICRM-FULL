import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { contacts, leads, deals, stores } from "@shared/schema";
import { crmProjects } from "@shared/schema";
import { ariaAuditLog } from "@shared/schema-extended";
import { completeForTenant } from "../services/tenant-ai.js";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

const ARIA_SYSTEM = `You are ARIA, the AI Command Agent embedded inside ArgiCRM — a CRM and business management platform by ARGILETTE LLC.

Your job is to understand plain-language instructions and execute them across the platform.

CRITICAL: Always respond with ONLY valid JSON — no markdown, no explanation, just the JSON object:

{
  "message": "Your conversational response (concise, action-oriented)",
  "module": "crm|ecommerce|projects|billing|marketing|settings|general",
  "action": null,
  "needsConfirmation": false
}

OR when you can execute an action:
{
  "message": "Confirmation of what you did or are about to do",
  "module": "crm|ecommerce|projects|billing|marketing|settings",
  "action": {
    "type": "CREATE|READ|UPDATE|DELETE|NAVIGATE|SUMMARIZE",
    "entity": "contact|lead|deal|product|store|project|task",
    "data": {}
  },
  "needsConfirmation": false
}

For DESTRUCTIVE actions (deleting many records, mass emails), set needsConfirmation: true.

Rules:
- Respond in the same language the user writes in (EN or FR)
- Be concise and action-oriented — confirm what you did, not what you will do
- Never make up data — if something doesn't exist, say so clearly
- Always tell the user which module you're acting on
- For unclear instructions, ask exactly ONE clarifying question
- For CREATE contact: extract firstName, lastName, email, company, phone from the message
- For CREATE lead: extract firstName, lastName, email, company, source from the message
- For CREATE project: extract name, description, status (planning|active|completed), priority (low|medium|high)
- For NAVIGATE: set data.path to the route (e.g. "/contacts", "/ecommerce", "/finance")`;

async function executeAriaAction(
  action: any,
  user: any,
  tenantId: string
): Promise<string> {
  const { type, entity, data } = action;

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

  if (type === "READ" && entity === "contact") {
    const rows = await db.select().from(contacts).where(eq(contacts.tenantId, tenantId)).orderBy(desc(contacts.createdAt)).limit(5);
    if (!rows.length) return "No contacts found in your CRM.";
    const names = rows.map((c: any) => [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email).join(", ");
    return `Your 5 most recent contacts: ${names}.`;
  }

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
