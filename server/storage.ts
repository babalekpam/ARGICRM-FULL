import { eq, and, desc, asc, like, or, count, sum, gte, lte, sql } from "drizzle-orm";
import { db } from "./db.js";
import {
  tenants, users, contacts, leads, deals, tasks, accounts, activities, campaigns,
  type User, type InsertUser,
  type Contact, type InsertContact, type Lead, type InsertLead,
  type Deal, type InsertDeal, type Task, type InsertTask,
  type Account, type InsertAccount, type Activity, type InsertActivity,
  type Campaign, type InsertCampaign,
} from "@shared/schema";
import {
  invoices, pipelines, aiUsage,
  type Invoice, type InsertInvoice,
} from "@shared/schema-extended";

// ═══════════════════════════════════════════════════
// TENANTS
// ═══════════════════════════════════════════════════
export async function getTenantByDomain(domain: string) {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.domain, domain));
  return tenant;
}

export async function getTenantBySlug(slug: string) {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug));
  return tenant;
}

export async function getTenantById(id: string) {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
  return tenant;
}

export async function createTenant(data: InsertTenant): Promise<Tenant> {
  const [tenant] = await db.insert(tenants).values(data).returning();
  return tenant;
}

export async function updateTenant(id: string, data: Partial<InsertTenant>): Promise<Tenant> {
  const [tenant] = await db.update(tenants).set({ ...data, updatedAt: new Date() }).where(eq(tenants.id, id)).returning();
  return tenant;
}

export async function getAllTenants(): Promise<Tenant[]> {
  return db.select().from(tenants).orderBy(desc(tenants.createdAt));
}

// ═══════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════
export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function getUserByEmail(email: string, tenantId: string) {
  const [user] = await db.select().from(users).where(and(eq(users.email, email.toLowerCase()), eq(users.tenantId, tenantId)));
  return user;
}

export async function getUserByEmailGlobal(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
  return user;
}

export async function getUsersByTenant(tenantId: string) {
  return db.select().from(users).where(eq(users.tenantId, tenantId)).orderBy(asc(users.firstName));
}

export async function createUser(data: InsertUser): Promise<User> {
  const [user] = await db.insert(users).values({ ...data, email: data.email.toLowerCase() }).returning();
  return user;
}

export async function updateUser(id: string, data: Partial<InsertUser>): Promise<User> {
  const [user] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning();
  return user;
}

export async function updateUserLastLogin(id: string) {
  return db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id));
}

export async function deleteUser(id: string) {
  return db.delete(users).where(eq(users.id, id));
}

// ═══════════════════════════════════════════════════
// CONTACTS
// ═══════════════════════════════════════════════════
export async function getContacts(tenantId: string, opts: { search?: string; status?: string; limit?: number; offset?: number } = {}) {
  const { search, status, limit = 50, offset = 0 } = opts;
  let query = db.select().from(contacts).where(eq(contacts.tenantId, tenantId));

  const rows = await db.select().from(contacts).where(
    and(
      eq(contacts.tenantId, tenantId),
      status ? eq(contacts.status, status) : undefined,
      search ? or(
        like(contacts.firstName, `%${search}%`),
        like(contacts.lastName, `%${search}%`),
        like(contacts.email, `%${search}%`),
        like(contacts.company, `%${search}%`),
      ) : undefined,
    )
  ).orderBy(desc(contacts.createdAt)).limit(limit).offset(offset);

  const [{ total }] = await db.select({ total: count() }).from(contacts).where(
    and(
      eq(contacts.tenantId, tenantId),
      status ? eq(contacts.status, status) : undefined,
      search ? or(
        like(contacts.firstName, `%${search}%`),
        like(contacts.lastName, `%${search}%`),
        like(contacts.email, `%${search}%`),
        like(contacts.company, `%${search}%`),
      ) : undefined,
    )
  );

  return { data: rows, total: Number(total) };
}

export async function getContactById(id: string, tenantId: string) {
  const [contact] = await db.select().from(contacts).where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)));
  return contact;
}

export async function createContact(data: InsertContact): Promise<Contact> {
  const [contact] = await db.insert(contacts).values(data).returning();
  return contact;
}

export async function updateContact(id: string, tenantId: string, data: Partial<InsertContact>): Promise<Contact> {
  const [contact] = await db.update(contacts).set({ ...data, updatedAt: new Date() }).where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId))).returning();
  return contact;
}

export async function deleteContact(id: string, tenantId: string) {
  return db.delete(contacts).where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)));
}

// ═══════════════════════════════════════════════════
// LEADS
// ═══════════════════════════════════════════════════
export async function getLeads(tenantId: string, opts: { search?: string; status?: string; limit?: number; offset?: number } = {}) {
  const { search, status, limit = 50, offset = 0 } = opts;
  const rows = await db.select().from(leads).where(
    and(
      eq(leads.tenantId, tenantId),
      status ? eq(leads.status, status) : undefined,
      search ? or(
        like(leads.firstName, `%${search}%`),
        like(leads.email, `%${search}%`),
        like(leads.company, `%${search}%`),
      ) : undefined,
    )
  ).orderBy(desc(leads.createdAt)).limit(limit).offset(offset);

  const [{ total }] = await db.select({ total: count() }).from(leads).where(
    and(eq(leads.tenantId, tenantId), status ? eq(leads.status, status) : undefined)
  );

  return { data: rows, total: Number(total) };
}

export async function getLeadById(id: string, tenantId: string) {
  const [lead] = await db.select().from(leads).where(and(eq(leads.id, id), eq(leads.tenantId, tenantId)));
  return lead;
}

export async function createLead(data: InsertLead): Promise<Lead> {
  const [lead] = await db.insert(leads).values(data).returning();
  return lead;
}

export async function updateLead(id: string, tenantId: string, data: Partial<InsertLead>): Promise<Lead> {
  const [lead] = await db.update(leads).set({ ...data, updatedAt: new Date() }).where(and(eq(leads.id, id), eq(leads.tenantId, tenantId))).returning();
  return lead;
}

export async function deleteLead(id: string, tenantId: string) {
  return db.delete(leads).where(and(eq(leads.id, id), eq(leads.tenantId, tenantId)));
}

// ═══════════════════════════════════════════════════
// DEALS
// ═══════════════════════════════════════════════════
export async function getDeals(tenantId: string, opts: { stage?: string; limit?: number } = {}) {
  const { stage, limit = 100 } = opts;
  const rows = await db.select().from(deals).where(
    and(eq(deals.tenantId, tenantId), stage ? eq(deals.stage, stage) : undefined)
  ).orderBy(desc(deals.createdAt)).limit(limit);

  const pipeline = await db.select({
    stage: deals.stage,
    count: count(),
    total: sum(deals.value),
  }).from(deals).where(eq(deals.tenantId, tenantId)).groupBy(deals.stage);

  return { data: rows, pipeline };
}

export async function getDealById(id: string, tenantId: string) {
  const [deal] = await db.select().from(deals).where(and(eq(deals.id, id), eq(deals.tenantId, tenantId)));
  return deal;
}

export async function createDeal(data: InsertDeal): Promise<Deal> {
  const [deal] = await db.insert(deals).values(data).returning();
  return deal;
}

export async function updateDeal(id: string, tenantId: string, data: Partial<InsertDeal>): Promise<Deal> {
  const [deal] = await db.update(deals).set({ ...data, updatedAt: new Date() }).where(and(eq(deals.id, id), eq(deals.tenantId, tenantId))).returning();
  return deal;
}

export async function deleteDeal(id: string, tenantId: string) {
  return db.delete(deals).where(and(eq(deals.id, id), eq(deals.tenantId, tenantId)));
}

// ═══════════════════════════════════════════════════
// TASKS
// ═══════════════════════════════════════════════════
export async function getTasks(tenantId: string, opts: { status?: string; assignedTo?: string; limit?: number } = {}) {
  const { status, assignedTo, limit = 100 } = opts;
  return db.select().from(tasks).where(
    and(
      eq(tasks.tenantId, tenantId),
      status ? eq(tasks.status, status) : undefined,
      assignedTo ? eq(tasks.assignedTo, assignedTo) : undefined,
    )
  ).orderBy(asc(tasks.dueDate), desc(tasks.createdAt)).limit(limit);
}

export async function getTaskById(id: string, tenantId: string) {
  const [task] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.tenantId, tenantId)));
  return task;
}

export async function createTask(data: InsertTask): Promise<Task> {
  const [task] = await db.insert(tasks).values(data).returning();
  return task;
}

export async function updateTask(id: string, tenantId: string, data: Partial<InsertTask>): Promise<Task> {
  const [task] = await db.update(tasks).set({ ...data, updatedAt: new Date() }).where(and(eq(tasks.id, id), eq(tasks.tenantId, tenantId))).returning();
  return task;
}

export async function deleteTask(id: string, tenantId: string) {
  return db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.tenantId, tenantId)));
}

// ═══════════════════════════════════════════════════
// ACCOUNTS
// ═══════════════════════════════════════════════════
export async function getAccounts(tenantId: string, opts: { search?: string; limit?: number } = {}) {
  const { search, limit = 50 } = opts;
  const rows = await db.select().from(accounts).where(
    and(
      eq(accounts.tenantId, tenantId),
      search ? like(accounts.name, `%${search}%`) : undefined,
    )
  ).orderBy(desc(accounts.createdAt)).limit(limit);

  const [{ total }] = await db.select({ total: count() }).from(accounts).where(eq(accounts.tenantId, tenantId));
  return { data: rows, total: Number(total) };
}

export async function createAccount(data: InsertAccount): Promise<Account> {
  const [account] = await db.insert(accounts).values(data).returning();
  return account;
}

export async function updateAccount(id: string, tenantId: string, data: Partial<InsertAccount>): Promise<Account> {
  const [account] = await db.update(accounts).set({ ...data, updatedAt: new Date() }).where(and(eq(accounts.id, id), eq(accounts.tenantId, tenantId))).returning();
  return account;
}

export async function deleteAccount(id: string, tenantId: string) {
  return db.delete(accounts).where(and(eq(accounts.id, id), eq(accounts.tenantId, tenantId)));
}

// ═══════════════════════════════════════════════════
// ACTIVITIES
// ═══════════════════════════════════════════════════
export async function getActivities(tenantId: string, opts: { contactId?: string; dealId?: string; limit?: number } = {}) {
  const { contactId, dealId, limit = 50 } = opts;
  return db.select().from(activities).where(
    and(
      eq(activities.tenantId, tenantId),
      contactId ? eq(activities.contactId, contactId) : undefined,
      dealId ? eq(activities.dealId, dealId) : undefined,
    )
  ).orderBy(desc(activities.createdAt)).limit(limit);
}

export async function createActivity(data: InsertActivity): Promise<Activity> {
  const [activity] = await db.insert(activities).values(data).returning();
  return activity;
}

// ═══════════════════════════════════════════════════
// CAMPAIGNS
// ═══════════════════════════════════════════════════
export async function getCampaigns(tenantId: string) {
  return db.select().from(campaigns).where(eq(campaigns.tenantId, tenantId)).orderBy(desc(campaigns.createdAt));
}

export async function createCampaign(data: InsertCampaign): Promise<Campaign> {
  const [campaign] = await db.insert(campaigns).values(data).returning();
  return campaign;
}

export async function updateCampaign(id: string, tenantId: string, data: Partial<InsertCampaign>) {
  const [campaign] = await db.update(campaigns).set({ ...data, updatedAt: new Date() }).where(and(eq(campaigns.id, id), eq(campaigns.tenantId, tenantId))).returning();
  return campaign;
}

// ═══════════════════════════════════════════════════
// INVOICES
// ═══════════════════════════════════════════════════
export async function getInvoices(tenantId: string) {
  return db.select().from(invoices).where(eq(invoices.tenantId, tenantId)).orderBy(desc(invoices.createdAt));
}

export async function createInvoice(data: InsertInvoice): Promise<Invoice> {
  const [invoice] = await db.insert(invoices).values(data).returning();
  return invoice;
}

export async function updateInvoice(id: string, tenantId: string, data: Partial<InsertInvoice>) {
  const [invoice] = await db.update(invoices).set({ ...data, updatedAt: new Date() }).where(and(eq(invoices.id, id), eq(invoices.tenantId, tenantId))).returning();
  return invoice;
}

// ═══════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════
export async function getDashboardStats(tenantId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

  const [contactsCount] = await db.select({ total: count() }).from(contacts).where(eq(contacts.tenantId, tenantId));
  const [leadsCount] = await db.select({ total: count() }).from(leads).where(eq(leads.tenantId, tenantId));
  const [activeDeals] = await db.select({ total: count(), value: sum(deals.value) }).from(deals).where(and(eq(deals.tenantId, tenantId), sql`stage NOT IN ('closed_won', 'closed_lost')`));
  const [wonDeals] = await db.select({ total: count(), value: sum(deals.value) }).from(deals).where(and(eq(deals.tenantId, tenantId), eq(deals.stage, "closed_won")));
  const [openTasks] = await db.select({ total: count() }).from(tasks).where(and(eq(tasks.tenantId, tenantId), eq(tasks.status, "todo")));
  const [overdueTasks] = await db.select({ total: count() }).from(tasks).where(and(eq(tasks.tenantId, tenantId), eq(tasks.status, "todo"), sql`due_date < NOW()`));
  const newContacts = await db.select({ total: count() }).from(contacts).where(and(eq(contacts.tenantId, tenantId), gte(contacts.createdAt, thirtyDaysAgo)));
  const recentActivities = await db.select().from(activities).where(eq(activities.tenantId, tenantId)).orderBy(desc(activities.createdAt)).limit(10);

  return {
    contacts: { total: Number(contactsCount.total), new30d: Number(newContacts[0]?.total ?? 0) },
    leads: { total: Number(leadsCount.total) },
    deals: {
      active: Number(activeDeals.total),
      activeValue: Number(activeDeals.value ?? 0),
      won: Number(wonDeals.total),
      wonValue: Number(wonDeals.value ?? 0),
    },
    tasks: {
      open: Number(openTasks.total),
      overdue: Number(overdueTasks.total),
    },
    recentActivities,
  };
}
