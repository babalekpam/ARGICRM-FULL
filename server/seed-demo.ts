/**
 * seed-demo.ts
 * Inserts demo data for the platform owner's tenant if tables are empty.
 * Called once at startup. Safe to re-run — uses per-resource count checks.
 */
import { db } from "./db.js";
import { contacts, leads, deals, tasks, accounts } from "@shared/schema.js";
import { campaigns } from "@shared/schema.js";
import { invoices, transactions } from "@shared/schema-extended";
import { eq, sql } from "drizzle-orm";

const TENANT_ID = "cadbdecb-5886-4b05-a6bb-99a893293ec4"; // ARGILETTE LLC

// ─── Lightweight onboarding seed for new tenant registrations ────────────────
export async function seedNewTenantOnboarding(tenantId: string): Promise<void> {
  console.log("[SEED] Starting onboarding seed for new tenant:", tenantId);
  try {
    await db.insert(contacts).values([
      { tenantId, firstName: "Sarah", lastName: "Johnson", email: `sarah.johnson.${Date.now()}@acmecorp.com`, company: "Acme Corp", status: "active" },
      { tenantId, firstName: "James", lastName: "Osei", email: `james.osei.${Date.now()}@techghanaltd.com`, company: "TechGhana Ltd", status: "active" },
      { tenantId, firstName: "Marie", lastName: "Dupont", email: `marie.dupont.${Date.now()}@paristech.fr`, company: "Paris Technologies", status: "active" },
    ]);
    await db.insert(leads).values([
      { tenantId, firstName: "Sarah", lastName: "Johnson", company: "Acme Corp", value: "5000", stage: "qualified", source: "referral" },
      { tenantId, firstName: "James", lastName: "Osei", company: "TechGhana Ltd", value: "3200", stage: "proposal", source: "website" },
    ] as any);
    await db.insert(deals).values([
      { tenantId, title: "Acme Corp — Q2 Contract", value: "5000", stage: "negotiation", probability: 70 },
    ] as any);
    await db.insert(tasks).values([
      { tenantId, title: "Follow up with Sarah Johnson", priority: "high", status: "pending", dueDate: new Date(Date.now() + 86400000) },
      { tenantId, title: "Send proposal to James Osei", priority: "medium", status: "pending", dueDate: new Date(Date.now() + 3 * 86400000) },
    ] as any);
    console.log("[SEED] Onboarding seed complete for tenant:", tenantId);
  } catch (err) {
    console.error("[SEED] Onboarding seed error (non-critical):", err);
  }
}

async function getCount(table: any, tenantId: string): Promise<number> {
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(table).where(eq(table.tenantId, tenantId));
  return Number(n);
}

export async function seedDemoData() {
  try {
    const [
      contactCount,
      leadCount,
      dealCount,
      taskCount,
      campaignCount,
      invoiceCount,
    ] = await Promise.all([
      getCount(contacts, TENANT_ID),
      getCount(leads, TENANT_ID),
      getCount(deals, TENANT_ID),
      getCount(tasks, TENANT_ID),
      getCount(campaigns, TENANT_ID),
      getCount(invoices, TENANT_ID),
    ]);

    const needsSeed = contactCount < 10 || leadCount < 5 || dealCount < 3 || taskCount < 5 || campaignCount < 2 || invoiceCount < 3;
    if (!needsSeed) return;

    console.log("[SEED] Per-resource seed starting for ARGILETTE LLC…");

    // ── 10 Sample Contacts ───────────────────────────────────────────
    let demoContacts: any[] = [];
    if (contactCount < 10) {
      demoContacts = await db.insert(contacts).values([
        { tenantId: TENANT_ID, firstName: "Amara", lastName: "Diallo", email: "amara.diallo@techsolutions.sn", phone: "+221 77 123 4567", company: "TechSolutions Dakar", jobTitle: "CEO", status: "active", country: "Senegal", city: "Dakar" },
        { tenantId: TENANT_ID, firstName: "Chidi", lastName: "Okonkwo", email: "chidi.okonkwo@fintech.ng", phone: "+234 801 234 5678", company: "FinTech Lagos", jobTitle: "CTO", status: "active", country: "Nigeria", city: "Lagos" },
        { tenantId: TENANT_ID, firstName: "Sarah", lastName: "Mitchell", email: "sarah.mitchell@growthco.com", phone: "+1 415 555 0101", company: "GrowthCo USA", jobTitle: "VP Sales", status: "active", country: "United States", city: "San Francisco" },
        { tenantId: TENANT_ID, firstName: "Fatou", lastName: "Ndiaye", email: "fatou.ndiaye@agritech.sn", phone: "+221 76 987 6543", company: "AgriTech Sénégal", jobTitle: "Director", status: "active", country: "Senegal", city: "Saint-Louis" },
        { tenantId: TENANT_ID, firstName: "Marcus", lastName: "Thompson", email: "marcus.t@scale.io", phone: "+1 312 555 0202", company: "Scale.io", jobTitle: "Founder", status: "active", country: "United States", city: "Chicago" },
        { tenantId: TENANT_ID, firstName: "Ines", lastName: "Kouassi", email: "ines.kouassi@logistics.ci", phone: "+225 07 123 4567", company: "Logistics CI", jobTitle: "Operations Manager", status: "active", country: "Ivory Coast", city: "Abidjan" },
        { tenantId: TENANT_ID, firstName: "David", lastName: "Chen", email: "david.chen@asiapacific.sg", phone: "+65 9123 4567", company: "AsiaPacific Ltd", jobTitle: "Regional Director", status: "active", country: "Singapore", city: "Singapore" },
        { tenantId: TENANT_ID, firstName: "Aissatou", lastName: "Barry", email: "aissatou.barry@media.gn", phone: "+224 620 123 456", company: "Media Guinea", jobTitle: "Managing Director", status: "lead", country: "Guinea", city: "Conakry" },
        { tenantId: TENANT_ID, firstName: "James", lastName: "Oduya", email: "james.oduya@construction.ke", phone: "+254 722 123 456", company: "Oduya Construction", jobTitle: "CEO", status: "active", country: "Kenya", city: "Nairobi" },
        { tenantId: TENANT_ID, firstName: "Priya", lastName: "Sharma", email: "priya.sharma@consulting.in", phone: "+91 98765 43210", company: "Sharma Consulting", jobTitle: "Principal Consultant", status: "active", country: "India", city: "Mumbai" },
      ]).returning();
    } else {
      // Already have contacts — fetch first few for FK references in deals/invoices
      demoContacts = await db.select().from(contacts).where(eq(contacts.tenantId, TENANT_ID)).limit(10);
    }

    // ── 5 Sample Leads ───────────────────────────────────────────────
    if (leadCount < 5) {
      await db.insert(leads).values([
        { tenantId: TENANT_ID, firstName: "Moussa", lastName: "Traoré", email: "moussa@startup.ml", company: "Startup Mali", jobTitle: "Founder", status: "new", source: "website", score: 82, notes: "Interested in CRM + email automation" },
        { tenantId: TENANT_ID, firstName: "Elena", lastName: "Vasquez", email: "elena@ecom.mx", company: "EcomMX", jobTitle: "Marketing Director", status: "contacted", source: "linkedin", score: 67, notes: "Needs e-commerce + analytics" },
        { tenantId: TENANT_ID, firstName: "Kwame", lastName: "Asante", email: "kwame@retail.gh", company: "Asante Retail", jobTitle: "CEO", status: "qualified", source: "referral", score: 91, notes: "Hot lead — demo scheduled" },
        { tenantId: TENANT_ID, firstName: "Lena", lastName: "Müller", email: "lena.muller@tech.de", company: "TechGmbH", jobTitle: "Head of Sales", status: "proposal", source: "cold_outreach", score: 74, notes: "Proposal sent — awaiting response" },
        { tenantId: TENANT_ID, firstName: "Yaw", lastName: "Boateng", email: "yaw@media.gh", company: "GhMedia", jobTitle: "COO", status: "new", source: "event", score: 58, notes: "Met at AfriTech Summit 2026" },
      ]).onConflictDoNothing();
    }

    // ── 3 Sample Deals ───────────────────────────────────────────────
    if (dealCount < 3) {
      await db.insert(deals).values([
        { tenantId: TENANT_ID, title: "TechSolutions Dakar — CRM Enterprise", value: "24000", stage: "closed_won", probability: 100, expectedCloseDate: "2026-03-15", contactId: demoContacts[0]?.id ?? null, notes: "12-month enterprise contract signed" },
        { tenantId: TENANT_ID, title: "FinTech Lagos — Growth Plan", value: "8400", stage: "proposal", probability: 65, expectedCloseDate: "2026-04-30", contactId: demoContacts[1]?.id ?? null, notes: "Proposal for 24-month Growth subscription" },
        { tenantId: TENANT_ID, title: "GrowthCo USA — Agency License", value: "47880", stage: "negotiation", probability: 80, expectedCloseDate: "2026-04-15", contactId: demoContacts[2]?.id ?? null, notes: "Agency Starter 12 workspaces — negotiating pricing" },
      ]);
    }

    // ── 2 Sample Campaigns ───────────────────────────────────────────
    if (campaignCount < 2) {
      await db.insert(campaigns).values([
        { tenantId: TENANT_ID, name: "Q2 2026 Lead Nurture — Africa", type: "email", status: "active", goals: "Grow your business with ARIA — Your AI CRM is ready", startDate: new Date("2026-04-10") },
        { tenantId: TENANT_ID, name: "Enterprise Outreach — Fortune 500", type: "email", status: "draft", goals: "White-label CRM for your team — Book a demo" },
      ]).onConflictDoNothing();
    }

    // ── 5 Sample Tasks ───────────────────────────────────────────────
    if (taskCount < 5) {
      await db.insert(tasks).values([
        { tenantId: TENANT_ID, title: "Follow up with Kwame Asante (hot lead)", priority: "high", status: "pending", dueDate: new Date(Date.now() + 1 * 86400000) },
        { tenantId: TENANT_ID, title: "Send GrowthCo revised agency pricing", priority: "high", status: "pending", dueDate: new Date(Date.now() + 2 * 86400000) },
        { tenantId: TENANT_ID, title: "Schedule demo with FinTech Lagos team", priority: "medium", status: "pending", dueDate: new Date(Date.now() + 3 * 86400000) },
        { tenantId: TENANT_ID, title: "Review Q1 pipeline & update forecasts", priority: "medium", status: "in_progress", dueDate: new Date(Date.now() + 5 * 86400000) },
        { tenantId: TENANT_ID, title: "Onboard TechSolutions Dakar to platform", priority: "low", status: "completed", dueDate: new Date(Date.now() - 5 * 86400000) },
      ]);
    }

    // ── 3 Sample Invoices ────────────────────────────────────────────
    if (invoiceCount < 3) {
      await db.insert(invoices).values([
        { tenantId: TENANT_ID, number: "INV-2026-001", status: "paid", subtotal: "22000", tax: "2000", total: "24000", currency: "USD", paidAt: new Date("2026-03-15"), notes: "TechSolutions Dakar — Enterprise CRM Annual", contactId: demoContacts[0]?.id ?? null, items: [{ description: "Enterprise CRM Annual License", quantity: 1, unitPrice: 24000, total: 24000 }] },
        { tenantId: TENANT_ID, number: "INV-2026-002", status: "pending", subtotal: "3927", tax: "473", total: "4400", currency: "USD", dueDate: new Date(Date.now() + 15 * 86400000), notes: "FinTech Lagos — Growth Plan Q2", contactId: demoContacts[1]?.id ?? null, items: [{ description: "Growth Plan — Q2 2026", quantity: 1, unitPrice: 4400, total: 4400 }] },
        { tenantId: TENANT_ID, number: "INV-2026-003", status: "overdue", subtotal: "1784", tax: "216", total: "2000", currency: "USD", dueDate: new Date(Date.now() - 10 * 86400000), notes: "OVERDUE: Asante Retail — Starter Plan", contactId: demoContacts[3]?.id ?? null, items: [{ description: "Starter Plan — Q1 2026", quantity: 1, unitPrice: 2000, total: 2000 }] },
      ]).catch(() => {}); // Skip on constraint errors
    }

    // ── 3 Sample Transactions ────────────────────────────────────────
    await db.insert(transactions).values([
      { tenantId: TENANT_ID, type: "income", category: "Subscription", description: "TechSolutions Dakar — Enterprise Annual", amount: "24000", currency: "USD", date: new Date("2026-03-15") },
      { tenantId: TENANT_ID, type: "expense", category: "Marketing", description: "Google Ads — Q1 Campaign", amount: "-3200", currency: "USD", date: new Date("2026-03-01") },
      { tenantId: TENANT_ID, type: "expense", category: "Operations", description: "Cloud infrastructure — March 2026", amount: "-890", currency: "USD", date: new Date("2026-03-31") },
    ]).catch(() => {}); // Skip if type mismatch

    console.log("[SEED] Per-resource seed complete for ARGILETTE LLC:", { contactCount, leadCount, dealCount, taskCount, campaignCount, invoiceCount });
  } catch (err) {
    console.error("[SEED] Demo data insertion failed (non-critical):", err);
  }
}
