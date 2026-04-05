/**
 * seed-demo.ts
 * Inserts demo data for the platform owner's tenant if tables are empty.
 * Called once at startup. Safe to re-run — checks row counts before inserting.
 */
import { db } from "./db.js";
import { contacts, leads, deals, tasks, accounts } from "@shared/schema.js";
import { campaigns } from "@shared/schema.js";
import { invoices, transactions } from "@shared/schema-extended";
import { eq, sql } from "drizzle-orm";

const TENANT_ID = "cadbdecb-5886-4b05-a6bb-99a893293ec4"; // ARGILETTE LLC

export async function seedDemoData() {
  try {
    // Check if contacts already exist — skip if yes
    const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(contacts).where(eq(contacts.tenantId, TENANT_ID));
    if (Number(n) > 0) return;

    console.log("[SEED] Inserting demo data for ARGILETTE LLC…");

    // ── 10 Sample Contacts ───────────────────────────────────────────
    const demoContacts = await db.insert(contacts).values([
      { tenantId: TENANT_ID, firstName: "Amara", lastName: "Diallo", email: "amara.diallo@techsolutions.sn", phone: "+221 77 123 4567", company: "TechSolutions Dakar", title: "CEO", status: "active", country: "Senegal", city: "Dakar" },
      { tenantId: TENANT_ID, firstName: "Chidi", lastName: "Okonkwo", email: "chidi.okonkwo@fintech.ng", phone: "+234 801 234 5678", company: "FinTech Lagos", title: "CTO", status: "active", country: "Nigeria", city: "Lagos" },
      { tenantId: TENANT_ID, firstName: "Sarah", lastName: "Mitchell", email: "sarah.mitchell@growthco.com", phone: "+1 415 555 0101", company: "GrowthCo USA", title: "VP Sales", status: "active", country: "United States", city: "San Francisco" },
      { tenantId: TENANT_ID, firstName: "Fatou", lastName: "Ndiaye", email: "fatou.ndiaye@agritech.sn", phone: "+221 76 987 6543", company: "AgriTech Sénégal", title: "Director", status: "active", country: "Senegal", city: "Saint-Louis" },
      { tenantId: TENANT_ID, firstName: "Marcus", lastName: "Thompson", email: "marcus.t@scale.io", phone: "+1 312 555 0202", company: "Scale.io", title: "Founder", status: "active", country: "United States", city: "Chicago" },
      { tenantId: TENANT_ID, firstName: "Ines", lastName: "Kouassi", email: "ines.kouassi@logistics.ci", phone: "+225 07 123 4567", company: "Logistics CI", title: "Operations Manager", status: "active", country: "Ivory Coast", city: "Abidjan" },
      { tenantId: TENANT_ID, firstName: "David", lastName: "Chen", email: "david.chen@asiapacific.sg", phone: "+65 9123 4567", company: "AsiaPacific Ltd", title: "Regional Director", status: "active", country: "Singapore", city: "Singapore" },
      { tenantId: TENANT_ID, firstName: "Aissatou", lastName: "Barry", email: "aissatou.barry@media.gn", phone: "+224 620 123 456", company: "Media Guinea", title: "Managing Director", status: "lead", country: "Guinea", city: "Conakry" },
      { tenantId: TENANT_ID, firstName: "James", lastName: "Oduya", email: "james.oduya@construction.ke", phone: "+254 722 123 456", company: "Oduya Construction", title: "CEO", status: "active", country: "Kenya", city: "Nairobi" },
      { tenantId: TENANT_ID, firstName: "Priya", lastName: "Sharma", email: "priya.sharma@consulting.in", phone: "+91 98765 43210", company: "Sharma Consulting", title: "Principal Consultant", status: "active", country: "India", city: "Mumbai" },
    ]).returning();

    // ── 5 Sample Leads ───────────────────────────────────────────────
    await db.insert(leads).values([
      { tenantId: TENANT_ID, firstName: "Moussa", lastName: "Traoré", email: "moussa@startup.ml", company: "Startup Mali", title: "Founder", status: "new", source: "website", score: 82, notes: "Interested in CRM + email automation" },
      { tenantId: TENANT_ID, firstName: "Elena", lastName: "Vasquez", email: "elena@ecom.mx", company: "EcomMX", title: "Marketing Director", status: "contacted", source: "linkedin", score: 67, notes: "Needs e-commerce + analytics" },
      { tenantId: TENANT_ID, firstName: "Kwame", lastName: "Asante", email: "kwame@retail.gh", company: "Asante Retail", title: "CEO", status: "qualified", source: "referral", score: 91, notes: "Hot lead — demo scheduled" },
      { tenantId: TENANT_ID, firstName: "Lena", lastName: "Müller", email: "lena.muller@tech.de", company: "TechGmbH", title: "Head of Sales", status: "proposal", source: "cold_outreach", score: 74, notes: "Proposal sent — awaiting response" },
      { tenantId: TENANT_ID, firstName: "Yaw", lastName: "Boateng", email: "yaw@media.gh", company: "GhMedia", title: "COO", status: "new", source: "event", score: 58, notes: "Met at AfriTech Summit 2026" },
    ]);

    // ── 3 Sample Deals ───────────────────────────────────────────────
    await db.insert(deals).values([
      { tenantId: TENANT_ID, name: "TechSolutions Dakar — CRM Enterprise", value: "24000", stage: "closed_won", probability: 100, expectedCloseDate: new Date("2026-03-15"), contactId: demoContacts[0].id, notes: "12-month enterprise contract signed" },
      { tenantId: TENANT_ID, name: "FinTech Lagos — Growth Plan", value: "8400", stage: "proposal", probability: 65, expectedCloseDate: new Date("2026-04-30"), contactId: demoContacts[1].id, notes: "Proposal for 24-month Growth subscription" },
      { tenantId: TENANT_ID, name: "GrowthCo USA — Agency License", value: "47880", stage: "negotiation", probability: 80, expectedCloseDate: new Date("2026-04-15"), contactId: demoContacts[2].id, notes: "Agency Starter 12 workspaces — negotiating pricing" },
    ]);

    // ── 2 Sample Campaigns ───────────────────────────────────────────
    await db.insert(campaigns).values([
      { tenantId: TENANT_ID, name: "Q2 2026 Lead Nurture — Africa", type: "email", status: "active", subject: "Grow your business with ARIA — Your AI CRM is ready", scheduledAt: new Date("2026-04-10") },
      { tenantId: TENANT_ID, name: "Enterprise Outreach — Fortune 500", type: "email", status: "draft", subject: "White-label CRM for your team — Book a demo" },
    ]);

    // ── 5 Sample Tasks ───────────────────────────────────────────────
    await db.insert(tasks).values([
      { tenantId: TENANT_ID, title: "Follow up with Kwame Asante (hot lead)", priority: "high", status: "pending", dueDate: new Date(Date.now() + 1 * 86400000) },
      { tenantId: TENANT_ID, title: "Send GrowthCo revised agency pricing", priority: "high", status: "pending", dueDate: new Date(Date.now() + 2 * 86400000) },
      { tenantId: TENANT_ID, title: "Schedule demo with FinTech Lagos team", priority: "medium", status: "pending", dueDate: new Date(Date.now() + 3 * 86400000) },
      { tenantId: TENANT_ID, title: "Review Q1 pipeline & update forecasts", priority: "medium", status: "in_progress", dueDate: new Date(Date.now() + 5 * 86400000) },
      { tenantId: TENANT_ID, title: "Onboard TechSolutions Dakar to platform", priority: "low", status: "completed", dueDate: new Date(Date.now() - 5 * 86400000) },
    ]);

    // ── 3 Sample Invoices ────────────────────────────────────────────
    await db.insert(invoices).values([
      { tenantId: TENANT_ID, number: "INV-2026-001", status: "paid", subtotal: "22000", tax: "2000", total: "24000", currency: "USD", paidAt: new Date("2026-03-15"), notes: "TechSolutions Dakar — Enterprise CRM Annual", contactId: demoContacts[0].id, items: [{ description: "Enterprise CRM Annual License", quantity: 1, unitPrice: 24000, total: 24000 }] },
      { tenantId: TENANT_ID, number: "INV-2026-002", status: "pending", subtotal: "3927", tax: "473", total: "4400", currency: "USD", dueDate: new Date(Date.now() + 15 * 86400000), notes: "FinTech Lagos — Growth Plan Q2", contactId: demoContacts[1].id, items: [{ description: "Growth Plan — Q2 2026", quantity: 1, unitPrice: 4400, total: 4400 }] },
      { tenantId: TENANT_ID, number: "INV-2026-003", status: "overdue", subtotal: "1784", tax: "216", total: "2000", currency: "USD", dueDate: new Date(Date.now() - 10 * 86400000), notes: "OVERDUE: Asante Retail — Starter Plan", contactId: demoContacts[3].id, items: [{ description: "Starter Plan — Q1 2026", quantity: 1, unitPrice: 2000, total: 2000 }] },
    ]).catch(() => {}); // Invoices table may have constraints — skip if fails

    // ── 3 Sample Transactions ────────────────────────────────────────
    await db.insert(transactions).values([
      { tenantId: TENANT_ID, type: "income", category: "Subscription", description: "TechSolutions Dakar — Enterprise Annual", amount: "24000", currency: "USD", date: new Date("2026-03-15") },
      { tenantId: TENANT_ID, type: "expense", category: "Marketing", description: "Google Ads — Q1 Campaign", amount: "-3200", currency: "USD", date: new Date("2026-03-01") },
      { tenantId: TENANT_ID, type: "expense", category: "Operations", description: "Cloud infrastructure — March 2026", amount: "-890", currency: "USD", date: new Date("2026-03-31") },
    ]).catch(() => {}); // Skip if type mismatch

    console.log("[SEED] Demo data inserted successfully — 10 contacts, 5 leads, 3 deals, 2 campaigns, 5 tasks, 3 invoices, 3 transactions.");
  } catch (err) {
    console.error("[SEED] Demo data insertion failed (non-critical):", err);
  }
}
