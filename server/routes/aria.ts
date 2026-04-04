import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { db } from "../db.js";
import { contacts, leads, deals, tasks, accounts, campaigns } from "@shared/schema";
import { crmProjects } from "@shared/schema";
import { ariaAuditLog } from "@shared/schema-extended";
import { completeForTenant } from "../services/tenant-ai.js";
import { eq, and, desc, sql, lt, lte } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendContractEmail } from "../services/email.js";

const router = Router();

const ARIA_SYSTEM = `You are ARIA, the AI Command Agent embedded inside ArgiCRM — a full CRM and business management platform by ARGILETTE LLC.

Your job is to understand plain-language instructions and execute them across every module of the platform.

CRITICAL: Always respond with ONLY valid JSON — no markdown, no explanation, just the JSON object.

Standard response (no action):
{
  "message": "Your conversational response",
  "module": "crm|contracts|projects|billing|marketing|operations|general",
  "action": null,
  "needsConfirmation": false
}

Action response:
{
  "message": "What you did or are about to do",
  "module": "crm|contracts|projects|billing|marketing|operations",
  "action": {
    "type": "CREATE|READ|UPDATE|DELETE|NAVIGATE|SUMMARIZE|CONVERT|RUN",
    "entity": "contact|lead|deal|task|account|invoice|campaign|project|contract|workflow",
    "data": {}
  },
  "needsConfirmation": false
}

== EXECUTION RULES ==
Set needsConfirmation: true ONLY for: deletes, mass emails, sending contracts to multiple people.
Respond in the SAME language the user writes in (EN or FR).
Be concise and action-oriented — confirm what you DID, not what you will do.
Never invent data — if something doesn't exist, say so.
For unclear instructions, ask exactly ONE clarifying question.

== CONTACTS ==
- CREATE: extract firstName, lastName, email, company, phone
- READ/SUMMARIZE: data.filter = "recent"|"all"|"search", data.query for name/email search
- UPDATE: data.email or data.contactId to identify; fields: firstName, lastName, company, phone, email, notes
- DELETE: data.email or data.contactId — needsConfirmation: true

== LEADS ==
- CREATE: extract firstName, lastName, email, company, source, jobTitle, notes
- READ/SUMMARIZE: data.filter = "recent"|"all"|"new"|"contacted"|"qualified"|"disqualified"
- UPDATE: data.email or data.leadId; fields: status (new|contacted|qualified|disqualified|converted), score, notes, company
- DELETE: data.email or data.leadId — needsConfirmation: true
- CONVERT (lead → contact): type=CONVERT, entity=lead, data.email or data.leadId

== DEALS ==
- CREATE: extract title, value (number), currency (USD default), stage (prospect|qualified|proposal|negotiation|won|lost), contactEmail (to link), notes, expectedCloseDate
- READ/SUMMARIZE: data.filter = "recent"|"all"|"open"|"won"|"lost"|"prospect"|"proposal"|"negotiation"
- UPDATE: data.dealId or data.title (fuzzy match); fields: stage, value, status (open|won|lost), notes, expectedCloseDate
- DELETE: data.dealId — needsConfirmation: true
- Stages in order: prospect → qualified → proposal → negotiation → won|lost

== TASKS ==
- CREATE: extract title, description, dueDate (ISO string or relative like "tomorrow"), priority (low|medium|high|urgent), type (call|email|meeting|follow_up|other)
- READ/SUMMARIZE: data.filter = "pending"|"overdue"|"today"|"completed"|"all"
- UPDATE: data.taskId or data.title (fuzzy); fields: status (pending|in_progress|completed), priority, title, dueDate. For "mark done/complete" → status: "completed"
- DELETE: data.taskId — needsConfirmation: true

== ACCOUNTS ==
- CREATE: extract name, industry, website, phone, email, city, country, accountType (customer|prospect|partner|vendor), annualRevenue, employeeCount, notes
- READ/SUMMARIZE: data.filter = "recent"|"all"|"customer"|"partner"|"prospect"
- UPDATE: data.accountId or data.name (fuzzy); then fields to update
- DELETE: data.accountId — needsConfirmation: true

== INVOICES ==
- CREATE: extract total (number), currency, dueDate (ISO string), notes, items as array [{description, quantity, unitPrice, total}]. Status defaults to draft.
- READ/SUMMARIZE: data.filter = "recent"|"all"|"draft"|"sent"|"paid"|"overdue"
- UPDATE: data.invoiceId or data.number; data.action = "mark_paid" | "mark_sent" | "update_status"; data.status if updating status
- DELETE: data.invoiceId — needsConfirmation: true

== CAMPAIGNS ==
- CREATE: extract name, type (email|social|event|paid|content|sms), budget, startDate, endDate, goals, targetAudience. Status defaults to draft.
- READ/SUMMARIZE: data.filter = "all"|"active"|"draft"|"completed"
- UPDATE: data.campaignId or data.name (fuzzy); fields: status, budget, goals

== PROJECTS ==
- CREATE: extract name, description, status (planning|active|completed), priority (low|medium|high)
- READ/SUMMARIZE: data.filter = "all"|"active"|"planning"|"completed"
- UPDATE: data.projectId or data.name (fuzzy); fields: status, priority, name, description
- DELETE: data.projectId — needsConfirmation: true

== CONTRACTS ==
- CREATE: extract title, contactEmail, contactName, body, notes. If user mentions a template, set data.useTemplate = template name.
- READ/SUMMARIZE: data.filter = "all"|"draft"|"sent"|"signed"|"declined"|"recent"
- UPDATE (send): data.action = "send", data.contractId or data.contractTitle — needsConfirmation: true
- UPDATE (status): data.action = "update_status", data.contractId, data.status
- DELETE: data.contractId — needsConfirmation: true

== NAVIGATION ==
- NAVIGATE: data.path = "/dashboard"|"/contacts"|"/leads"|"/deals"|"/tasks"|"/accounts"|"/invoices"|"/campaigns"|"/contracts"|"/projects"|"/analytics"|"/settings"|"/ai-tools"|"/lead-gen"|"/marketplace"|"/email-tracking"|"/seo-platform"|"/ecommerce"|"/finance"|"/automations"
- For workflows/automations, entity = "workflow"; types: CREATE (name, triggerType, executionMode, actions[]), READ/SUMMARIZE (list with stats), UPDATE (workflowId|name + action=enable|disable OR executionMode=auto|supervised), RUN (workflowId|name — manually trigger), DELETE (workflowId|name)`;

// ── Helper: fuzzy date parsing ─────────────────────────────────────────────
function parseDueDate(raw: string | undefined): Date | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const now = new Date();
  if (lower === "today") return now;
  if (lower === "tomorrow") { now.setDate(now.getDate() + 1); return now; }
  if (lower === "next week") { now.setDate(now.getDate() + 7); return now; }
  if (lower === "next month") { now.setMonth(now.getMonth() + 1); return now; }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

// ── Helper: generate next invoice number ──────────────────────────────────
async function nextInvoiceNumber(tenantId: string): Promise<string> {
  const r = await db.execute(sql`
    SELECT number FROM invoices WHERE tenant_id::text = ${tenantId}
    ORDER BY created_at DESC LIMIT 1
  `);
  if (!r.rows.length) return "INV-0001";
  const last = ((r.rows[0] as any).number || "INV-0000").replace(/\D/g, "");
  const n = (parseInt(last, 10) || 0) + 1;
  return `INV-${String(n).padStart(4, "0")}`;
}

async function executeAriaAction(
  action: any,
  user: any,
  tenantId: string
): Promise<string> {
  const { type, entity, data } = action;

  // ──────────────────────────────────────────────────────────────────────────
  // CONTACTS
  // ──────────────────────────────────────────────────────────────────────────
  if (type === "CREATE" && entity === "contact") {
    const row: any = { tenantId };
    if (data.firstName)  row.firstName = data.firstName;
    if (data.lastName)   row.lastName  = data.lastName;
    if (data.email)      row.email     = data.email;
    if (data.company)    row.company   = data.company;
    if (data.phone)      row.phone     = data.phone;
    if (data.notes)      row.notes     = data.notes;
    await db.insert(contacts).values(row);
    const name = [data.firstName, data.lastName].filter(Boolean).join(" ") || data.email || "Contact";
    return `Contact "${name}" has been added to your CRM.`;
  }

  if ((type === "READ" || type === "SUMMARIZE") && entity === "contact") {
    let rows;
    if (data?.query) {
      rows = await db.select().from(contacts)
        .where(and(eq(contacts.tenantId, tenantId),
          sql`(LOWER(first_name || ' ' || COALESCE(last_name,'')) LIKE ${"%" + data.query.toLowerCase() + "%"} OR LOWER(COALESCE(email,'')) LIKE ${"%" + data.query.toLowerCase() + "%"})`
        ))
        .orderBy(desc(contacts.createdAt)).limit(8);
    } else {
      rows = await db.select().from(contacts).where(eq(contacts.tenantId, tenantId))
        .orderBy(desc(contacts.createdAt)).limit(8);
    }
    if (!rows.length) return data?.query ? `No contacts matching "${data.query}" found.` : "No contacts in your CRM yet.";
    const total = await db.execute(sql`SELECT COUNT(*) FROM contacts WHERE tenant_id = ${tenantId}`);
    const count = (total.rows[0] as any).count;
    const list = rows.map((c: any) => `• ${[c.firstName, c.lastName].filter(Boolean).join(" ") || "(no name)"} — ${c.email || ""} ${c.company ? `· ${c.company}` : ""}`).join("\n");
    return `${count} total contacts. Recent:\n${list}`;
  }

  if (type === "UPDATE" && entity === "contact") {
    let id = data.contactId;
    if (!id && data.email) {
      const r = await db.select().from(contacts).where(and(eq(contacts.tenantId, tenantId), eq(contacts.email, data.email))).limit(1);
      if (r.length) id = r[0].id;
    }
    if (!id) return "I couldn't find that contact. Please provide their email address or ID.";
    const upd: any = { updatedAt: new Date() };
    if (data.firstName !== undefined) upd.firstName = data.firstName;
    if (data.lastName  !== undefined) upd.lastName  = data.lastName;
    if (data.company   !== undefined) upd.company   = data.company;
    if (data.phone     !== undefined) upd.phone     = data.phone;
    if (data.email     !== undefined) upd.email     = data.email;
    if (data.notes     !== undefined) upd.notes     = data.notes;
    await db.update(contacts).set(upd).where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)));
    return `Contact has been updated.`;
  }

  if (type === "DELETE" && entity === "contact") {
    let id = data.contactId;
    if (!id && data.email) {
      const r = await db.select().from(contacts).where(and(eq(contacts.tenantId, tenantId), eq(contacts.email, data.email))).limit(1);
      if (r.length) id = r[0].id;
    }
    if (!id) return "Contact not found. Please provide their email or ID.";
    await db.delete(contacts).where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)));
    return `Contact has been permanently deleted.`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // LEADS
  // ──────────────────────────────────────────────────────────────────────────
  if (type === "CREATE" && entity === "lead") {
    const row: any = { tenantId, status: "new" };
    if (data.firstName) row.firstName = data.firstName;
    if (data.lastName)  row.lastName  = data.lastName;
    if (data.email)     row.email     = data.email;
    if (data.company)   row.company   = data.company;
    if (data.source)    row.source    = data.source;
    if (data.jobTitle)  row.jobTitle  = data.jobTitle;
    if (data.notes)     row.notes     = data.notes;
    await db.insert(leads).values(row);
    const name = [data.firstName, data.lastName].filter(Boolean).join(" ") || data.email || "Lead";
    return `Lead "${name}" has been added to your pipeline.`;
  }

  if ((type === "READ" || type === "SUMMARIZE") && entity === "lead") {
    const filter = data?.filter || "recent";
    let rows;
    if (filter === "all" || filter === "recent") {
      rows = await db.select().from(leads).where(eq(leads.tenantId, tenantId)).orderBy(desc(leads.createdAt)).limit(8);
    } else {
      rows = await db.select().from(leads).where(and(eq(leads.tenantId, tenantId), eq(leads.status, filter))).orderBy(desc(leads.createdAt)).limit(8);
    }
    const counts = await db.execute(sql`SELECT status, COUNT(*)::int as n FROM leads WHERE tenant_id = ${tenantId} GROUP BY status`);
    const summary = (counts.rows as any[]).map((r: any) => `${r.n} ${r.status}`).join(", ");
    if (!rows.length) return `No ${filter === "recent" ? "" : filter + " "}leads found.`;
    const list = rows.map((l: any) => `• ${[l.firstName, l.lastName].filter(Boolean).join(" ") || l.email || "(no name)"} — ${l.status} ${l.company ? `· ${l.company}` : ""}`).join("\n");
    return `Pipeline: ${summary || "empty"}.\n\n${filter === "recent" ? "Recent" : filter} leads:\n${list}`;
  }

  if (type === "UPDATE" && entity === "lead") {
    let id = data.leadId;
    if (!id && data.email) {
      const r = await db.select().from(leads).where(and(eq(leads.tenantId, tenantId), eq(leads.email, data.email))).limit(1);
      if (r.length) id = r[0].id;
    }
    if (!id) return "I couldn't find that lead. Please provide their email or ID.";
    const upd: any = { updatedAt: new Date() };
    if (data.status  !== undefined) upd.status  = data.status;
    if (data.notes   !== undefined) upd.notes   = data.notes;
    if (data.score   !== undefined) upd.score   = data.score;
    if (data.company !== undefined) upd.company = data.company;
    await db.update(leads).set(upd).where(and(eq(leads.id, id), eq(leads.tenantId, tenantId)));
    return `Lead has been updated${data.status ? ` — status: ${data.status}` : ""}.`;
  }

  if (type === "DELETE" && entity === "lead") {
    let id = data.leadId;
    if (!id && data.email) {
      const r = await db.select().from(leads).where(and(eq(leads.tenantId, tenantId), eq(leads.email, data.email))).limit(1);
      if (r.length) id = r[0].id;
    }
    if (!id) return "Lead not found. Please provide their email or ID.";
    await db.delete(leads).where(and(eq(leads.id, id), eq(leads.tenantId, tenantId)));
    return `Lead has been permanently deleted.`;
  }

  if (type === "CONVERT" && entity === "lead") {
    let id = data.leadId;
    if (!id && data.email) {
      const r = await db.select().from(leads).where(and(eq(leads.tenantId, tenantId), eq(leads.email, data.email))).limit(1);
      if (r.length) id = r[0].id;
    }
    if (!id) return "Lead not found. Please provide their email or ID.";
    const lead = (await db.select().from(leads).where(eq(leads.id, id)).limit(1))[0] as any;
    if (!lead) return "Lead not found.";
    const [contact] = await db.insert(contacts).values({
      tenantId,
      firstName: lead.firstName,
      lastName:  lead.lastName,
      email:     lead.email,
      company:   lead.company,
      phone:     lead.phone,
    }).returning();
    await db.update(leads).set({ status: "converted", convertedToContactId: contact.id, convertedAt: new Date() })
      .where(eq(leads.id, id));
    const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.email || "Lead";
    return `Lead "${name}" has been converted to a contact and added to your CRM.`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DEALS
  // ──────────────────────────────────────────────────────────────────────────
  if (type === "CREATE" && entity === "deal") {
    let contactId: string | null = null;
    if (data.contactEmail) {
      const r = await db.select().from(contacts).where(and(eq(contacts.tenantId, tenantId), eq(contacts.email, data.contactEmail))).limit(1);
      if (r.length) contactId = r[0].id;
    }
    const row: any = {
      tenantId,
      title:    data.title || "New Deal",
      value:    data.value ? String(data.value) : null,
      amount:   data.value ? String(data.value) : null,
      currency: data.currency || "USD",
      stage:    data.stage || "prospect",
      status:   "open",
      notes:    data.notes || null,
      ownerId:  user.id,
      createdBy: user.id,
    };
    if (contactId) row.contactId = contactId;
    if (data.expectedCloseDate) row.expectedCloseDate = parseDueDate(data.expectedCloseDate);
    await db.insert(deals).values(row);
    return `Deal "${row.title}" created${data.value ? ` for ${data.currency || "USD"} ${data.value}` : ""} at stage "${row.stage}".`;
  }

  if ((type === "READ" || type === "SUMMARIZE") && entity === "deal") {
    const filter = data?.filter || "recent";
    let rows;
    const base = eq(deals.tenantId, tenantId);
    if (filter === "open") {
      rows = await db.select().from(deals).where(and(base, eq(deals.status, "open"))).orderBy(desc(deals.createdAt)).limit(8);
    } else if (filter === "won") {
      rows = await db.select().from(deals).where(and(base, eq(deals.status, "won"))).orderBy(desc(deals.createdAt)).limit(8);
    } else if (filter === "lost") {
      rows = await db.select().from(deals).where(and(base, eq(deals.status, "lost"))).orderBy(desc(deals.createdAt)).limit(8);
    } else if (["prospect","qualified","proposal","negotiation"].includes(filter)) {
      rows = await db.select().from(deals).where(and(base, eq(deals.stage, filter))).orderBy(desc(deals.createdAt)).limit(8);
    } else {
      rows = await db.select().from(deals).where(base).orderBy(desc(deals.createdAt)).limit(8);
    }
    const counts = await db.execute(sql`SELECT stage, status, COUNT(*)::int as n, SUM(COALESCE(value,0))::numeric as total FROM deals WHERE tenant_id = ${tenantId} GROUP BY stage, status`);
    const wonTotal = (counts.rows as any[]).filter((r:any) => r.status === "won").reduce((a:number,r:any)=>a+parseFloat(r.total||0),0);
    const openCount = (counts.rows as any[]).filter((r:any) => r.status === "open").reduce((a:number,r:any)=>a+r.n,0);
    if (!rows.length) return `No ${filter} deals found.`;
    const list = rows.map((d: any) => `• "${d.title}" — ${d.stage} / ${d.status}${d.value ? ` · ${d.currency} ${parseFloat(d.value).toLocaleString()}` : ""}`).join("\n");
    return `Pipeline: ${openCount} open deals, ${wonTotal.toLocaleString()} total won.\n\n${filter} deals:\n${list}`;
  }

  if (type === "UPDATE" && entity === "deal") {
    let id = data.dealId;
    if (!id && data.title) {
      const r = await db.execute(sql`SELECT id FROM deals WHERE tenant_id = ${tenantId} AND LOWER(title) ILIKE ${"%" + data.title.toLowerCase() + "%"} LIMIT 1`);
      if (r.rows.length) id = (r.rows[0] as any).id;
    }
    if (!id) return "I couldn't find that deal. Please provide the deal title or ID.";
    const upd: any = { updatedAt: new Date() };
    if (data.stage    !== undefined) upd.stage  = data.stage;
    if (data.status   !== undefined) upd.status = data.status;
    if (data.value    !== undefined) { upd.value = String(data.value); upd.amount = String(data.value); }
    if (data.notes    !== undefined) upd.notes  = data.notes;
    if (data.expectedCloseDate) upd.expectedCloseDate = parseDueDate(data.expectedCloseDate);
    await db.update(deals).set(upd).where(and(eq(deals.id, id), eq(deals.tenantId, tenantId)));
    return `Deal updated${data.stage ? ` — now at "${data.stage}" stage` : ""}${data.status ? ` (${data.status})` : ""}.`;
  }

  if (type === "DELETE" && entity === "deal") {
    if (!data.dealId) return "Please provide the deal ID to delete.";
    await db.delete(deals).where(and(eq(deals.id, data.dealId), eq(deals.tenantId, tenantId)));
    return `Deal has been permanently deleted.`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TASKS
  // ──────────────────────────────────────────────────────────────────────────
  if (type === "CREATE" && entity === "task") {
    const due = parseDueDate(data.dueDate);
    await db.insert(tasks).values({
      tenantId,
      userId:    user.id,
      createdBy: user.id,
      title:     data.title || "New Task",
      description: data.description || null,
      dueDate:   due,
      priority:  data.priority || "medium",
      status:    "pending",
      type:      data.type || "other",
      assignedTo: data.assignedTo || user.id,
    });
    return `Task "${data.title || "New Task"}" created${data.priority ? ` with ${data.priority} priority` : ""}${due ? ` — due ${due.toLocaleDateString()}` : ""}.`;
  }

  if ((type === "READ" || type === "SUMMARIZE") && entity === "task") {
    const filter = data?.filter || "pending";
    let rows;
    const base = eq(tasks.tenantId, tenantId);
    const now = new Date();
    if (filter === "overdue") {
      rows = await db.select().from(tasks).where(and(base, eq(tasks.status, "pending"), lte(tasks.dueDate, now))).orderBy(tasks.dueDate).limit(10);
    } else if (filter === "today") {
      const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
      rows = await db.execute(sql`SELECT * FROM tasks WHERE tenant_id = ${tenantId} AND status != 'completed' AND due_date::date = CURRENT_DATE ORDER BY due_date LIMIT 10`);
      rows = (rows as any).rows || rows;
    } else if (filter === "completed") {
      rows = await db.select().from(tasks).where(and(base, eq(tasks.status, "completed"))).orderBy(desc(tasks.completedAt)).limit(8);
    } else if (filter === "all") {
      rows = await db.select().from(tasks).where(base).orderBy(desc(tasks.createdAt)).limit(10);
    } else {
      rows = await db.select().from(tasks).where(and(base, eq(tasks.status, "pending"))).orderBy(tasks.dueDate).limit(10);
    }
    const counts = await db.execute(sql`SELECT status, COUNT(*)::int as n FROM tasks WHERE tenant_id = ${tenantId} GROUP BY status`);
    const summary = (counts.rows as any[]).map((r: any) => `${r.n} ${r.status}`).join(", ");
    if (!Array.isArray(rows) || !rows.length) return `No ${filter} tasks found.`;
    const list = rows.map((t: any) => `• ${t.title} [${t.priority||"medium"}] ${t.due_date||t.dueDate ? `— due ${new Date(t.due_date||t.dueDate).toLocaleDateString()}` : ""}`).join("\n");
    return `Tasks: ${summary || "none"}.\n\n${filter} tasks:\n${list}`;
  }

  if (type === "UPDATE" && entity === "task") {
    let id = data.taskId;
    if (!id && data.title) {
      const r = await db.execute(sql`SELECT id FROM tasks WHERE tenant_id = ${tenantId} AND LOWER(title) ILIKE ${"%" + data.title.toLowerCase() + "%"} LIMIT 1`);
      if (r.rows.length) id = (r.rows[0] as any).id;
    }
    if (!id) return "I couldn't find that task. Please provide the task title or ID.";
    const upd: any = { updatedAt: new Date() };
    if (data.status   !== undefined) { upd.status = data.status; if (data.status === "completed") upd.completedAt = new Date(); }
    if (data.priority !== undefined) upd.priority = data.priority;
    if (data.title    !== undefined) upd.title    = data.title;
    if (data.dueDate  !== undefined) upd.dueDate  = parseDueDate(data.dueDate);
    await db.update(tasks).set(upd).where(and(eq(tasks.id, id), eq(tasks.tenantId, tenantId)));
    return `Task ${data.status === "completed" ? "marked as completed" : "updated"}.`;
  }

  if (type === "DELETE" && entity === "task") {
    if (!data.taskId) return "Please provide the task ID to delete.";
    await db.delete(tasks).where(and(eq(tasks.id, data.taskId), eq(tasks.tenantId, tenantId)));
    return `Task has been permanently deleted.`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ACCOUNTS
  // ──────────────────────────────────────────────────────────────────────────
  if (type === "CREATE" && entity === "account") {
    const row: any = { tenantId, name: data.name || "New Account", ownerId: user.id, createdBy: user.id };
    ["industry","website","phone","email","city","country","accountType","notes"].forEach(f => { if (data[f]) row[f] = data[f]; });
    if (data.annualRevenue) row.annualRevenue = String(data.annualRevenue);
    if (data.employeeCount) row.employeeCount = parseInt(data.employeeCount);
    await db.insert(accounts).values(row);
    return `Account "${row.name}" has been created${data.industry ? ` in ${data.industry}` : ""}.`;
  }

  if ((type === "READ" || type === "SUMMARIZE") && entity === "account") {
    const filter = data?.filter || "recent";
    let rows;
    const base = eq(accounts.tenantId, tenantId);
    if (["customer","partner","prospect","vendor"].includes(filter)) {
      rows = await db.select().from(accounts).where(and(base, eq(accounts.accountType, filter))).orderBy(desc(accounts.createdAt)).limit(8);
    } else {
      rows = await db.select().from(accounts).where(base).orderBy(desc(accounts.createdAt)).limit(8);
    }
    if (!rows.length) return "No accounts found.";
    const total = await db.execute(sql`SELECT COUNT(*) FROM accounts WHERE tenant_id = ${tenantId}`);
    const list = rows.map((a: any) => `• ${a.name}${a.industry ? ` (${a.industry})` : ""} — ${a.accountType || "account"}${a.website ? ` · ${a.website}` : ""}`).join("\n");
    return `${(total.rows[0] as any).count} total accounts.\n\nRecent:\n${list}`;
  }

  if (type === "UPDATE" && entity === "account") {
    let id = data.accountId;
    if (!id && data.name) {
      const r = await db.execute(sql`SELECT id FROM accounts WHERE tenant_id = ${tenantId} AND LOWER(name) ILIKE ${"%" + data.name.toLowerCase() + "%"} LIMIT 1`);
      if (r.rows.length) id = (r.rows[0] as any).id;
    }
    if (!id) return "I couldn't find that account. Please provide the account name or ID.";
    const upd: any = { updatedAt: new Date() };
    ["industry","website","phone","email","city","country","accountType","notes","status"].forEach(f => { if (data[f] !== undefined) upd[f] = data[f]; });
    if (data.annualRevenue !== undefined) upd.annualRevenue = String(data.annualRevenue);
    await db.update(accounts).set(upd).where(and(eq(accounts.id, id), eq(accounts.tenantId, tenantId)));
    return `Account has been updated.`;
  }

  if (type === "DELETE" && entity === "account") {
    if (!data.accountId) return "Please provide the account ID to delete.";
    await db.delete(accounts).where(and(eq(accounts.id, data.accountId), eq(accounts.tenantId, tenantId)));
    return `Account has been permanently deleted.`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // INVOICES (raw SQL — table uses UUID foreign keys)
  // ──────────────────────────────────────────────────────────────────────────
  if (type === "CREATE" && entity === "invoice") {
    const number = await nextInvoiceNumber(tenantId);
    const items = data.items || [];
    const total = data.total || items.reduce((s: number, i: any) => s + (i.total || 0), 0);
    const dueDate = parseDueDate(data.dueDate);
    await db.execute(sql`
      INSERT INTO invoices (id, tenant_id, number, status, total, currency, due_date, notes, items, created_by, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        ${tenantId}::uuid,
        ${number},
        'draft',
        ${String(total)},
        ${data.currency || "USD"},
        ${dueDate ? dueDate.toISOString() : null},
        ${data.notes || null},
        ${JSON.stringify(items)}::jsonb,
        ${user.id}::uuid,
        now(), now()
      )
    `);
    return `Invoice ${number} created for ${data.currency || "USD"} ${total}${dueDate ? ` — due ${dueDate.toLocaleDateString()}` : ""}.`;
  }

  if ((type === "READ" || type === "SUMMARIZE") && entity === "invoice") {
    const filter = data?.filter || "recent";
    let whereExtra = "";
    if (filter === "paid") whereExtra = "AND status = 'paid'";
    else if (filter === "draft") whereExtra = "AND status = 'draft'";
    else if (filter === "sent") whereExtra = "AND status = 'sent'";
    else if (filter === "overdue") whereExtra = "AND status != 'paid' AND due_date < NOW()";
    const r = await db.execute(sql`
      SELECT number, status, total, currency, due_date, paid_at
      FROM invoices WHERE tenant_id::text = ${tenantId} ${sql.raw(whereExtra)}
      ORDER BY created_at DESC LIMIT 8
    `);
    const counts = await db.execute(sql`SELECT status, COUNT(*)::int as n, SUM(total)::numeric as total FROM invoices WHERE tenant_id::text = ${tenantId} GROUP BY status`);
    const summary = (counts.rows as any[]).map((c: any) => `${c.n} ${c.status} (${parseFloat(c.total||0).toLocaleString()})`).join(", ");
    if (!r.rows.length) return `No ${filter} invoices found.`;
    const list = (r.rows as any[]).map((i: any) => `• ${i.number} — ${i.status} · ${i.currency} ${parseFloat(i.total||0).toLocaleString()}${i.due_date ? ` · due ${new Date(i.due_date).toLocaleDateString()}` : ""}`).join("\n");
    return `Invoices: ${summary || "none"}.\n\nRecent:\n${list}`;
  }

  if (type === "UPDATE" && entity === "invoice") {
    let id = data.invoiceId;
    if (!id && data.number) {
      const r = await db.execute(sql`SELECT id FROM invoices WHERE tenant_id::text = ${tenantId} AND number = ${data.number} LIMIT 1`);
      if (r.rows.length) id = (r.rows[0] as any).id;
    }
    if (!id) return "Invoice not found. Please provide the invoice number or ID.";
    if (data.action === "mark_paid") {
      await db.execute(sql`UPDATE invoices SET status = 'paid', paid_at = now(), updated_at = now() WHERE id::text = ${id}`);
      return `Invoice marked as paid.`;
    }
    if (data.action === "mark_sent") {
      await db.execute(sql`UPDATE invoices SET status = 'sent', updated_at = now() WHERE id::text = ${id}`);
      return `Invoice marked as sent.`;
    }
    if (data.status) {
      await db.execute(sql`UPDATE invoices SET status = ${data.status}, updated_at = now() WHERE id::text = ${id}`);
      return `Invoice status updated to "${data.status}".`;
    }
    return "Please specify what to update on the invoice (mark paid, mark sent, or a specific status).";
  }

  if (type === "DELETE" && entity === "invoice") {
    if (!data.invoiceId) return "Please provide the invoice ID to delete.";
    await db.execute(sql`DELETE FROM invoices WHERE id::text = ${data.invoiceId} AND tenant_id::text = ${tenantId}`);
    return `Invoice has been permanently deleted.`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CAMPAIGNS
  // ──────────────────────────────────────────────────────────────────────────
  if (type === "CREATE" && entity === "campaign") {
    const row: any = {
      tenantId,
      name:   data.name || "New Campaign",
      type:   data.type || "email",
      status: "draft",
    };
    if (data.budget)         row.budget         = String(data.budget);
    if (data.goals)          row.goals          = data.goals;
    if (data.targetAudience) row.targetAudience = data.targetAudience;
    if (data.startDate)      row.startDate      = parseDueDate(data.startDate);
    if (data.endDate)        row.endDate        = parseDueDate(data.endDate);
    await db.insert(campaigns).values(row);
    return `Campaign "${row.name}" (${row.type}) created as a draft.`;
  }

  if ((type === "READ" || type === "SUMMARIZE") && entity === "campaign") {
    const filter = data?.filter || "all";
    let rows;
    const base = eq(campaigns.tenantId, tenantId);
    if (["active","draft","completed"].includes(filter)) {
      rows = await db.select().from(campaigns).where(and(base, eq(campaigns.status, filter))).orderBy(desc(campaigns.createdAt)).limit(8);
    } else {
      rows = await db.select().from(campaigns).where(base).orderBy(desc(campaigns.createdAt)).limit(8);
    }
    if (!rows.length) return `No ${filter} campaigns found.`;
    const list = rows.map((c: any) => `• "${c.name}" — ${c.type} / ${c.status}${c.budget ? ` · budget ${parseFloat(c.budget).toLocaleString()}` : ""}`).join("\n");
    return `${filter} campaigns:\n${list}`;
  }

  if (type === "UPDATE" && entity === "campaign") {
    let id = data.campaignId;
    if (!id && data.name) {
      const r = await db.execute(sql`SELECT id FROM campaigns WHERE tenant_id = ${tenantId} AND LOWER(name) ILIKE ${"%" + data.name.toLowerCase() + "%"} LIMIT 1`);
      if (r.rows.length) id = (r.rows[0] as any).id;
    }
    if (!id) return "I couldn't find that campaign. Please provide the name or ID.";
    const upd: any = { updatedAt: new Date() };
    if (data.status !== undefined) upd.status = data.status;
    if (data.budget !== undefined) upd.budget = String(data.budget);
    if (data.goals  !== undefined) upd.goals  = data.goals;
    await db.update(campaigns).set(upd).where(and(eq(campaigns.id, id), eq(campaigns.tenantId, tenantId)));
    return `Campaign updated.`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PROJECTS
  // ──────────────────────────────────────────────────────────────────────────
  if (type === "CREATE" && entity === "project") {
    await db.insert(crmProjects).values({
      tenantId,
      ownerId:     user.id,
      name:        data.name || "New Project",
      description: data.description || null,
      status:      data.status   || "planning",
      priority:    data.priority || "medium",
      color:       data.color    || "#3b82f6",
    });
    return `Project "${data.name || "New Project"}" has been created.`;
  }

  if ((type === "READ" || type === "SUMMARIZE") && entity === "project") {
    const filter = data?.filter || "all";
    let rows;
    const base = eq(crmProjects.tenantId, tenantId);
    if (["active","planning","completed"].includes(filter)) {
      rows = await db.select().from(crmProjects).where(and(base, eq(crmProjects.status, filter))).orderBy(desc(crmProjects.createdAt)).limit(8);
    } else {
      rows = await db.select().from(crmProjects).where(base).orderBy(desc(crmProjects.createdAt)).limit(8);
    }
    if (!rows.length) return `No ${filter} projects found.`;
    const list = rows.map((p: any) => `• "${p.name}" — ${p.status} / ${p.priority} priority`).join("\n");
    return `${filter} projects:\n${list}`;
  }

  if (type === "UPDATE" && entity === "project") {
    let id = data.projectId;
    if (!id && data.name) {
      const r = await db.execute(sql`SELECT id FROM crm_projects WHERE tenant_id = ${tenantId} AND LOWER(name) ILIKE ${"%" + data.name.toLowerCase() + "%"} LIMIT 1`);
      if (r.rows.length) id = (r.rows[0] as any).id;
    }
    if (!id) return "I couldn't find that project. Please provide the name or ID.";
    const upd: any = { updatedAt: new Date() };
    if (data.status      !== undefined) upd.status      = data.status;
    if (data.priority    !== undefined) upd.priority    = data.priority;
    if (data.name        !== undefined) upd.name        = data.name;
    if (data.description !== undefined) upd.description = data.description;
    await db.update(crmProjects).set(upd).where(and(eq(crmProjects.id, id), eq(crmProjects.tenantId, tenantId)));
    return `Project updated${data.status ? ` — status: ${data.status}` : ""}.`;
  }

  if (type === "DELETE" && entity === "project") {
    let id = data.projectId;
    if (!id && data.name) {
      const r = await db.execute(sql`SELECT id FROM crm_projects WHERE tenant_id = ${tenantId} AND LOWER(name) ILIKE ${"%" + data.name.toLowerCase() + "%"} LIMIT 1`);
      if (r.rows.length) id = (r.rows[0] as any).id;
    }
    if (!id) return "Project not found. Please provide the name or ID.";
    await db.delete(crmProjects).where(and(eq(crmProjects.id, id), eq(crmProjects.tenantId, tenantId)));
    return `Project has been permanently deleted.`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CONTRACTS (unchanged from previous)
  // ──────────────────────────────────────────────────────────────────────────
  if (type === "CREATE" && entity === "contract") {
    const title = data.title || "New Contract";
    const contactEmail = data.contactEmail;
    if (!contactEmail) return "To create a contract, I need the recipient's email address. Please provide it.";
    let body = data.body || "";
    if (!body && data.useTemplate) {
      const tmplRows = await db.execute(sql`
        SELECT body FROM contract_templates
        WHERE tenant_id = ${tenantId} AND is_active = true
          AND LOWER(name) ILIKE ${"%" + data.useTemplate.toLowerCase() + "%"}
        LIMIT 1
      `);
      if (tmplRows.rows.length > 0) body = (tmplRows.rows[0] as any).body || "";
    }
    if (!body) {
      body = `CONTRACT: ${title}\n\nThis contract was created via ARIA AI on ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}.\n\nParties:\n- Provider: [To be completed]\n- Recipient: ${data.contactName || contactEmail}\n\nPlease open the Contracts module to review and complete the contract body before sending.`;
    }
    await db.execute(sql`
      INSERT INTO contracts (id, tenant_id, title, body, contact_name, contact_email, status, notes, created_by, variables, created_at, updated_at)
      VALUES (gen_random_uuid()::varchar, ${tenantId}, ${title}, ${body}, ${data.contactName || null}, ${contactEmail}, 'draft', ${data.notes || null}, ${user.id}, '{}'::jsonb, now(), now())
    `);
    return `Contract "${title}" created as draft for ${contactEmail}. Open the Contracts module to review and send.`;
  }

  if ((type === "READ" || type === "SUMMARIZE") && entity === "contract") {
    const filter = data?.filter || "recent";
    let whereClause = sql`tenant_id = ${tenantId}`;
    if (filter !== "all" && filter !== "recent") whereClause = sql`tenant_id = ${tenantId} AND status = ${filter}`;
    const result = await db.execute(sql`SELECT title, status, contact_name, contact_email, created_at, signed_at FROM contracts WHERE ${whereClause} ORDER BY created_at DESC LIMIT 8`);
    const rows = result.rows as any[];
    if (!rows.length) return filter === "recent" ? "No contracts yet." : `No ${filter} contracts found.`;
    const counts = await db.execute(sql`SELECT status, COUNT(*)::int as n FROM contracts WHERE tenant_id = ${tenantId} GROUP BY status`);
    const summary = (counts.rows as any[]).map((r: any) => `${r.n} ${r.status}`).join(", ");
    const list = rows.map((r: any) => `• "${r.title}" → ${r.status} (${r.contact_name || r.contact_email}, ${r.signed_at ? "signed " + new Date(r.signed_at).toLocaleDateString() : "created " + new Date(r.created_at).toLocaleDateString()})`).join("\n");
    return `Contracts: ${summary}.\n\n${list}`;
  }

  if (type === "UPDATE" && entity === "contract") {
    const cAction = data?.action;
    if (cAction === "send") {
      let contractId = data.contractId;
      if (!contractId && data.contractTitle) {
        const found = await db.execute(sql`SELECT id, title, contact_email, contact_name FROM contracts WHERE tenant_id = ${tenantId} AND status IN ('draft','sent','viewed') AND LOWER(title) ILIKE ${"%" + data.contractTitle.toLowerCase() + "%"} LIMIT 1`);
        if (found.rows.length > 0) contractId = (found.rows[0] as any).id;
      }
      if (!contractId) return "I couldn't find that contract. Check the title or open the Contracts module.";
      const cRows = await db.execute(sql`SELECT * FROM contracts WHERE id = ${contractId} AND tenant_id = ${tenantId} LIMIT 1`);
      if (!cRows.rows.length) return "Contract not found.";
      const contract = cRows.rows[0] as any;
      if (!contract.contact_email) return "This contract has no recipient email — please update it first.";
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const appUrl = process.env.APP_URL || "https://www.argilette.org";
      await db.execute(sql`UPDATE contracts SET sign_token = ${token}, token_expires_at = ${expiresAt.toISOString()}, status = 'sent', sent_at = now(), updated_at = now() WHERE id = ${contractId}`);
      const senderName = user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Your Account Manager";
      await sendContractEmail({ to: contract.contact_email, recipientName: contract.contact_name || contract.contact_email, contractTitle: contract.title, signLink: `${appUrl}/sign/${token}`, senderName, expiresAt });
      return `Contract "${contract.title}" sent to ${contract.contact_email} for e-signature. Link valid for 30 days.`;
    }
    if (cAction === "update_status" && data.contractId && data.status) {
      await db.execute(sql`UPDATE contracts SET status = ${data.status}, updated_at = now() WHERE id = ${data.contractId} AND tenant_id = ${tenantId}`);
      return `Contract status updated to "${data.status}".`;
    }
    return "Please specify what to update on the contract.";
  }

  if (type === "DELETE" && entity === "contract") {
    if (!data.contractId) return "Please provide the contract ID to delete.";
    await db.execute(sql`DELETE FROM contracts WHERE id = ${data.contractId} AND tenant_id = ${tenantId}`);
    return `Contract has been permanently deleted.`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // WORKFLOWS / AUTOMATIONS
  // ──────────────────────────────────────────────────────────────────────────
  if (type === "CREATE" && entity === "workflow") {
    const wfName       = data.name         || "New Workflow";
    const triggerType  = data.triggerType  || "manual";
    const execMode     = data.executionMode || "auto";
    const wfActions    = Array.isArray(data.actions) ? data.actions : [];
    await db.execute(sql`
      INSERT INTO crm_workflows
        (tenant_id, name, description, trigger_type, execution_mode, actions, conditions, is_active, created_by)
      VALUES
        (${tenantId}, ${wfName}, ${data.description || null}, ${triggerType},
         ${execMode}, ${JSON.stringify(wfActions)}::jsonb, '[]'::jsonb, true, ${user.id})
    `);
    return `Workflow "${wfName}" created in ${execMode} mode with trigger "${triggerType}". Open Automations to add actions and activate it.`;
  }

  if ((type === "READ" || type === "SUMMARIZE") && entity === "workflow") {
    const wfFilter = data?.filter || "all";
    const wfRows = await db.execute(sql`
      SELECT id, name, trigger_type, execution_mode, is_active, run_count, last_run_at
      FROM crm_workflows WHERE tenant_id = ${tenantId}
      ORDER BY created_at DESC LIMIT 10
    `);
    if (!wfRows.rows.length) return "No workflows yet. Open Automations to create one.";
    const activeWf = (wfRows.rows as any[]).filter((r:any) => r.is_active).length;
    const pendingQ = await db.execute(sql`SELECT COUNT(*) FROM crm_workflow_approvals WHERE tenant_id = ${tenantId} AND status = 'pending'`);
    const pending = parseInt((pendingQ.rows[0] as any).count || "0");
    const list = (wfRows.rows as any[]).map((w:any) =>
      `• "${w.name}" — ${w.is_active ? "active" : "inactive"} / ${w.execution_mode} / trigger: ${w.trigger_type} (${w.run_count||0} runs)`
    ).join("\n");
    return `${(wfRows.rows as any[]).length} workflows (${activeWf} active, ${pending} pending approvals).\n\n${list}`;
  }

  if (type === "UPDATE" && entity === "workflow") {
    let wfId = data.workflowId;
    if (!wfId && data.name) {
      const r = await db.execute(sql`SELECT id FROM crm_workflows WHERE tenant_id = ${tenantId} AND LOWER(name) ILIKE ${"%" + data.name.toLowerCase() + "%"} LIMIT 1`);
      if (r.rows.length) wfId = (r.rows[0] as any).id;
    }
    if (!wfId) return "I couldn't find that workflow. Please provide the name or ID.";
    if (data.action === "enable") {
      await db.execute(sql`UPDATE crm_workflows SET is_active = true, updated_at = now() WHERE id = ${wfId} AND tenant_id = ${tenantId}`);
      return "Workflow enabled and now listening for triggers.";
    }
    if (data.action === "disable") {
      await db.execute(sql`UPDATE crm_workflows SET is_active = false, updated_at = now() WHERE id = ${wfId} AND tenant_id = ${tenantId}`);
      return "Workflow disabled.";
    }
    if (data.executionMode) {
      await db.execute(sql`UPDATE crm_workflows SET execution_mode = ${data.executionMode}, updated_at = now() WHERE id = ${wfId} AND tenant_id = ${tenantId}`);
      return `Workflow switched to ${data.executionMode} mode.`;
    }
    return "Workflow updated. Open Automations for detailed editing.";
  }

  if (type === "RUN" && entity === "workflow") {
    let wfId = data.workflowId;
    if (!wfId && data.name) {
      const r = await db.execute(sql`SELECT id FROM crm_workflows WHERE tenant_id = ${tenantId} AND LOWER(name) ILIKE ${"%" + data.name.toLowerCase() + "%"} LIMIT 1`);
      if (r.rows.length) wfId = (r.rows[0] as any).id;
    }
    if (!wfId) return "I couldn't find that workflow. Please provide the name or ID.";
    const wfR = await db.execute(sql`SELECT name, execution_mode, actions FROM crm_workflows WHERE id = ${wfId} AND tenant_id = ${tenantId} LIMIT 1`);
    if (!wfR.rows.length) return "Workflow not found.";
    const wfData = wfR.rows[0] as any;
    const wfActs = typeof wfData.actions === "string" ? JSON.parse(wfData.actions) : (wfData.actions || []);
    await db.execute(sql`UPDATE crm_workflows SET run_count = run_count + 1, last_run_at = now() WHERE id = ${wfId}`);
    return wfData.execution_mode === "supervised"
      ? `Workflow "${wfData.name}" triggered. ${wfActs.length} action(s) are waiting for your approval in Automations → Pending Approvals.`
      : `Workflow "${wfData.name}" triggered. ${wfActs.length} action(s) are executing. Open Automations to monitor.`;
  }

  if (type === "DELETE" && entity === "workflow") {
    let wfId = data.workflowId;
    if (!wfId && data.name) {
      const r = await db.execute(sql`SELECT id FROM crm_workflows WHERE tenant_id = ${tenantId} AND LOWER(name) ILIKE ${"%" + data.name.toLowerCase() + "%"} LIMIT 1`);
      if (r.rows.length) wfId = (r.rows[0] as any).id;
    }
    if (!wfId) return "Workflow not found. Please provide the name or ID.";
    await db.execute(sql`DELETE FROM crm_workflows WHERE id = ${wfId} AND tenant_id = ${tenantId}`);
    return "Workflow has been permanently deleted.";
  }

  // ──────────────────────────────────────────────────────────────────────────
  // NAVIGATE
  // ──────────────────────────────────────────────────────────────────────────
  if (type === "NAVIGATE") {
    return `NAVIGATE:${data.path || "/dashboard"}`;
  }

  return "I received your request but couldn't match it to a specific action. Could you rephrase or give me more details?";
}

router.post("/chat", authenticate, async (req: AuthRequest, res) => {
  try {
    const { message, history = [] } = req.body;
    const user = req.user!;
    const messages = [
      ...history.slice(-12),
      { role: "user" as const, content: message },
    ];
    const raw = await completeForTenant(user.tenantId, {
      messages,
      system: ARIA_SYSTEM + `\n\nCurrent user: ${user.email} (role: ${user.role})`,
      maxTokens: 1400,
    });
    let parsed: any;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      parsed = { message: raw, module: "general", action: null, needsConfirmation: false };
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
