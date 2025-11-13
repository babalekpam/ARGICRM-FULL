import { 
  type Contact, type InsertContact,
  type Account, type InsertAccount,
  type Lead, type InsertLead,
  type Deal, type InsertDeal,
  type Task, type InsertTask,
  type Campaign, type InsertCampaign,
  type Ticket, type InsertTicket,
  type Project, type InsertProject,
  type Invoice, type InsertInvoice,
  type Employee, type InsertEmployee,
  type Appointment, type InsertAppointment,
  type SentimentAnalysis, type InsertSentimentAnalysis,
  type User, type InsertUser,
  type Tenant, type InsertTenant,
  type TaxRate, type InsertTaxRate,
  type SalesChannel, type InsertSalesChannel,
  type AIContent, type InsertAIContent,
  type AICampaign, type InsertAICampaign,
  type AIUsage, type InsertAIUsage,
  type AbTest, type InsertAbTest,
  type AbVariant, type InsertAbVariant,
  type AbSession, type InsertAbSession,
  type AbEvent, type InsertAbEvent,
  type AbConversion, type InsertAbConversion,
  type AbMetricsCache, type InsertAbMetricsCache,
  type TeamCapacity, type InsertTeamCapacity,
  type EmployeeSkill, type InsertEmployeeSkill,
  type ResourceForecast, type InsertResourceForecast,
  type WorkloadSnapshot, type InsertWorkloadSnapshot,
  type ResourceAllocation, type InsertResourceAllocation,
  type FunnelProject, type InsertFunnelProject,
  type FunnelVersion, type InsertFunnelVersion,
  type FunnelStep, type InsertFunnelStep,
  type LandingPage, type InsertLandingPage,
  type FunnelAd, type InsertFunnelAd,
  type FunnelEmail, type InsertFunnelEmail,
  type FunnelAutomationWorkflow, type InsertFunnelAutomationWorkflow,
  type FunnelPublication, type InsertFunnelPublication,
  type FunnelStepMetric, type InsertFunnelStepMetric,
  type AiGeneration, type InsertAiGeneration,
  leads, contacts, accounts, deals, tasks, employees, appointments, campaigns, tickets, projects, invoices, users, tenants, taxRates, salesChannels,
  aiContents, aiCampaigns, aiUsage,
  abTests, abVariants, abSessions, abEvents, abConversions, abMetricsCache,
  teamCapacity, employeeSkills, resourceForecasts, workloadSnapshots, resourceAllocations,
  clientAccounts, clientPortalUsers, clientPortalSessions,
  aiGenerations, funnelProjects, funnelVersions, funnelSteps, landingPages, funnelAds, funnelEmails,
  funnelAutomationWorkflows, funnelPublications, funnelStepMetrics
} from "@shared/schema";
import {
  type Store, type InsertStore,
  type EcommerceProduct, type InsertEcommerceProduct,
  type EcommerceOrder, type InsertEcommerceOrder,  
  type Customer, type InsertCustomer,
  stores, ecommerceProducts, ecommerceOrders, customers
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import type { IStorage } from "./storage";
import crypto from "crypto";

const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000001'; // Platform owner tenant

export class DatabaseStorage implements IStorage {
  public userEmail: string;
  public tenantId: string;
  public isPlatformOwner: boolean;

  constructor(userEmail: string = '', tenantId: string = '', isPlatformOwner: boolean = false) {
    this.userEmail = userEmail;
    
    // SECURITY: Strict tenantId validation - no default fallbacks allowed
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      throw new Error('Valid tenantId is required for DatabaseStorage');
    }
    
    if (!this.isValidUUID(tenantId)) {
      throw new Error(`Invalid tenantId format: ${tenantId}. Must be a valid UUID.`);
    }
    
    this.tenantId = tenantId;
    this.isPlatformOwner = isPlatformOwner;
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // ================== CONTACT OPERATIONS ==================
  async getContacts(): Promise<Contact[]> {
    if (this.isPlatformOwner && this.userEmail === 'abel@argilette.com') {
      // Platform owner sees all test data
      return db.select().from(contacts).orderBy(desc(contacts.createdAt));
    } else {
      // Regular users only see their own tenant's data (empty for new users)
      return db.select().from(contacts)
        .where(eq(contacts.tenantId, this.tenantId))
        .orderBy(desc(contacts.createdAt));
    }
  }

  async getContact(id: string): Promise<Contact | undefined> {
    let query = db.select().from(contacts).where(eq(contacts.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      query = query.where(eq(contacts.tenantId, this.tenantId));
    }
    
    const [contact] = await query;
    return contact || undefined;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const contactWithTenant = {
      ...contact,
      tenantId: this.tenantId
    };
    
    const [newContact] = await db.insert(contacts).values(contactWithTenant).returning();
    return newContact;
  }

  async updateContact(id: string, contactData: Partial<InsertContact>): Promise<Contact | undefined> {
    let updateQuery = db
      .update(contacts)
      .set({ ...contactData, updatedAt: new Date() })
      .where(eq(contacts.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      updateQuery = updateQuery.where(eq(contacts.tenantId, this.tenantId));
    }
    
    const [updatedContact] = await updateQuery.returning();
    return updatedContact || undefined;
  }

  async deleteContact(id: string): Promise<boolean> {
    let deleteQuery = db.delete(contacts).where(eq(contacts.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      deleteQuery = deleteQuery.where(eq(contacts.tenantId, this.tenantId));
    }
    
    const result = await deleteQuery;
    return result.rowCount > 0;
  }

  // ================== ACCOUNT OPERATIONS ==================
  async getAccounts(): Promise<Account[]> {
    if (this.isPlatformOwner && this.userEmail === 'abel@argilette.com') {
      return db.select().from(accounts).orderBy(desc(accounts.createdAt));
    } else {
      return db.select().from(accounts)
        .where(eq(accounts.tenantId, this.tenantId))
        .orderBy(desc(accounts.createdAt));
    }
  }

  async getAccount(id: string): Promise<Account | undefined> {
    let query = db.select().from(accounts).where(eq(accounts.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      query = query.where(eq(accounts.tenantId, this.tenantId));
    }
    
    const [account] = await query;
    return account || undefined;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const accountWithTenant = {
      ...account,
      tenantId: this.tenantId
    };
    
    const [newAccount] = await db.insert(accounts).values(accountWithTenant).returning();
    return newAccount;
  }

  async updateAccount(id: string, accountData: Partial<InsertAccount>): Promise<Account | undefined> {
    let updateQuery = db
      .update(accounts)
      .set({ ...accountData, updatedAt: new Date() })
      .where(eq(accounts.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      updateQuery = updateQuery.where(eq(accounts.tenantId, this.tenantId));
    }
    
    const [updatedAccount] = await updateQuery.returning();
    return updatedAccount || undefined;
  }

  async deleteAccount(id: string): Promise<boolean> {
    let deleteQuery = db.delete(accounts).where(eq(accounts.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      deleteQuery = deleteQuery.where(eq(accounts.tenantId, this.tenantId));
    }
    
    const result = await deleteQuery;
    return result.rowCount > 0;
  }

  // ================== LEAD OPERATIONS ==================
  async getLeads(): Promise<Lead[]> {
    if (this.isPlatformOwner && this.userEmail === 'abel@argilette.com') {
      return db.select().from(leads).orderBy(desc(leads.createdAt));
    } else {
      return db.select().from(leads)
        .where(eq(leads.tenantId, this.tenantId))
        .orderBy(desc(leads.createdAt));
    }
  }

  async getLead(id: string): Promise<Lead | undefined> {
    let query = db.select().from(leads).where(eq(leads.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      query = query.where(eq(leads.tenantId, this.tenantId));
    }
    
    const [lead] = await query;
    return lead || undefined;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const leadWithTenant = {
      ...lead,
      tenantId: this.tenantId
    };
    
    const [newLead] = await db.insert(leads).values(leadWithTenant).returning();
    return newLead;
  }

  async updateLead(id: string, leadData: Partial<InsertLead>): Promise<Lead | undefined> {
    let updateQuery = db
      .update(leads)
      .set({ ...leadData, updatedAt: new Date() })
      .where(eq(leads.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      updateQuery = updateQuery.where(eq(leads.tenantId, this.tenantId));
    }
    
    const [updatedLead] = await updateQuery.returning();
    return updatedLead || undefined;
  }

  async deleteLead(id: string): Promise<boolean> {
    let deleteQuery = db.delete(leads).where(eq(leads.id, parseInt(id)));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      deleteQuery = deleteQuery.where(eq(leads.tenantId, this.tenantId));
    }
    
    const result = await deleteQuery;
    return result.rowCount > 0;
  }

  // ================== DEAL OPERATIONS ==================
  async getDeals(): Promise<Deal[]> {
    if (this.isPlatformOwner && this.userEmail === 'abel@argilette.com') {
      return db.select().from(deals).orderBy(desc(deals.createdAt));
    } else {
      return db.select().from(deals)
        .where(eq(deals.tenantId, this.tenantId))
        .orderBy(desc(deals.createdAt));
    }
  }

  async getDeal(id: string): Promise<Deal | undefined> {
    let query = db.select().from(deals).where(eq(deals.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      query = query.where(eq(deals.tenantId, this.tenantId));
    }
    
    const [deal] = await query;
    return deal || undefined;
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const dealWithTenant = {
      ...deal,
      tenantId: this.tenantId
    };
    
    const [newDeal] = await db.insert(deals).values(dealWithTenant).returning();
    return newDeal;
  }

  async updateDeal(id: string, dealData: Partial<InsertDeal>): Promise<Deal | undefined> {
    let updateQuery = db
      .update(deals)
      .set({ ...dealData, updatedAt: new Date() })
      .where(eq(deals.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      updateQuery = updateQuery.where(eq(deals.tenantId, this.tenantId));
    }
    
    const [updatedDeal] = await updateQuery.returning();
    return updatedDeal || undefined;
  }

  async deleteDeal(id: string): Promise<boolean> {
    let deleteQuery = db.delete(deals).where(eq(deals.id, parseInt(id)));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      deleteQuery = deleteQuery.where(eq(deals.tenantId, this.tenantId));
    }
    
    const result = await deleteQuery;
    return result.rowCount > 0;
  }

  // ================== TASK OPERATIONS ==================
  async getTasks(): Promise<Task[]> {
    if (this.isPlatformOwner && this.userEmail === 'abel@argilette.com') {
      return db.select().from(tasks).orderBy(desc(tasks.createdAt));
    } else {
      return db.select().from(tasks)
        .where(eq(tasks.tenantId, this.tenantId))
        .orderBy(desc(tasks.createdAt));
    }
  }

  async getTask(id: string): Promise<Task | undefined> {
    let query = db.select().from(tasks).where(eq(tasks.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      query = query.where(eq(tasks.tenantId, this.tenantId));
    }
    
    const [task] = await query;
    return task || undefined;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const taskWithTenant = {
      ...task,
      tenantId: this.tenantId
    };
    
    const [newTask] = await db.insert(tasks).values(taskWithTenant).returning();
    return newTask;
  }

  async updateTask(id: string, taskData: Partial<InsertTask>): Promise<Task | undefined> {
    let updateQuery = db
      .update(tasks)
      .set({ ...taskData, updatedAt: new Date() })
      .where(eq(tasks.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      updateQuery = updateQuery.where(eq(tasks.tenantId, this.tenantId));
    }
    
    const [updatedTask] = await updateQuery.returning();
    return updatedTask || undefined;
  }

  async deleteTask(id: string): Promise<boolean> {
    let deleteQuery = db.delete(tasks).where(eq(tasks.id, parseInt(id)));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      deleteQuery = deleteQuery.where(eq(tasks.tenantId, this.tenantId));
    }
    
    const result = await deleteQuery;
    return result.rowCount > 0;
  }

  // ================== TICKET OPERATIONS ==================
  async getTickets(): Promise<Ticket[]> {
    if (this.isPlatformOwner && this.userEmail === 'abel@argilette.com') {
      return db.select().from(tickets).orderBy(desc(tickets.createdAt));
    } else {
      return db.select().from(tickets)
        .where(eq(tickets.tenantId, this.tenantId))
        .orderBy(desc(tickets.createdAt));
    }
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    let query = db.select().from(tickets).where(eq(tickets.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      query = query.where(eq(tickets.tenantId, this.tenantId));
    }
    
    const [ticket] = await query;
    return ticket || undefined;
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const ticketWithTenant = {
      ...ticket,
      tenantId: this.tenantId
    };
    
    const [newTicket] = await db.insert(tickets).values(ticketWithTenant).returning();
    return newTicket;
  }

  async updateTicket(id: string, ticketData: Partial<InsertTicket>): Promise<Ticket | undefined> {
    let updateQuery = db
      .update(tickets)
      .set({ ...ticketData, updatedAt: new Date() })
      .where(eq(tickets.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      updateQuery = updateQuery.where(eq(tickets.tenantId, this.tenantId));
    }
    
    const [updatedTicket] = await updateQuery.returning();
    return updatedTicket || undefined;
  }

  async deleteTicket(id: string): Promise<boolean> {
    let deleteQuery = db.delete(tickets).where(eq(tickets.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      deleteQuery = deleteQuery.where(eq(tickets.tenantId, this.tenantId));
    }
    
    const result = await deleteQuery;
    return result.rowCount > 0;
  }

  // ================== TENANT OPERATIONS ==================
  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    // Use selective returning to avoid column mismatch errors during schema drift
    try {
      const [newTenant] = await db.insert(tenants).values(tenant).returning();
      return newTenant;
    } catch (error) {
      // Fallback to ID-only returning if column mismatch occurs
      console.warn('⚠️  Tenant creation fallback - using ID-only returning:', error);
      const [tenantWithId] = await db.insert(tenants).values(tenant).returning({ id: tenants.id });
      // Fetch full tenant data after successful insert
      const fullTenant = await db.select().from(tenants).where(eq(tenants.id, tenantWithId.id));
      return fullTenant[0];
    }
  }

  async getTenantByDomain(domain: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.domain, domain));
    return tenant || undefined;
  }

  async getTenantById(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant || undefined;
  }

  async getUserByEmailAndTenant(email: string, tenantId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(and(eq(users.email, email), eq(users.tenantId, tenantId)));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    // CRITICAL FIX: Auto-inject tenantId from storage context
    const userWithTenant = { ...user, tenantId: this.tenantId };
    
    // Guard against missing tenantId (architect's recommendation)
    if (!userWithTenant.tenantId) {
      throw new Error('tenantId missing in createUser');
    }
    
    console.log('🔍 createUser keys:', Object.keys(userWithTenant));
    const [newUser] = await db.insert(users).values(userWithTenant).returning();
    return newUser;
  }

  async updateUserEmailVerification(userId: string, isVerified: boolean): Promise<void> {
    // Apply tenant isolation unless platform owner
    let updateQuery = db.update(users)
      .set({ emailVerified: isVerified })
      .where(eq(users.id, userId));
    
    // Apply tenant filtering for regular users (not platform owner)
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      updateQuery = updateQuery.where(eq(users.tenantId, this.tenantId));
    }
    
    await updateQuery;
  }

  async updateUserSubscriptionStatus(userId: string, status: string): Promise<void> {
    // Apply tenant isolation unless platform owner  
    let updateQuery = db.update(users)
      .set({ subscriptionStatus: status })
      .where(eq(users.id, userId));
    
    // Apply tenant filtering for regular users (not platform owner)
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      updateQuery = updateQuery.where(eq(users.tenantId, this.tenantId));
    }
    
    await updateQuery;
  }

  // Placeholder methods for compatibility (implement as needed)
  async updateTenant(id: string, tenant: any): Promise<any> {
    return null;
  }
  
  async getUserWithPermissions(userId: string): Promise<any> {
    try {
      // Query the actual user from the database using the real user ID
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      
      if (!user) {
        console.log(`User not found in database: ${userId}`);
        return null;
      }
      
      console.log(`Found user in database: ${user.email}, active: ${user.isActive}`);
      
      // Check if this is the platform owner
      if (user.email === 'abel@argilette.com') {
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName || 'Abel',
          lastName: user.lastName || 'Dessalegn',
          role: 'platform_owner',
          tenantId: user.tenantId || '00000000-0000-0000-0000-000000000001',
          isActive: user.isActive,
          permissions: [
            'contacts.read', 'contacts.write', 'accounts.read', 'accounts.write',
            'leads.read', 'leads.write', 'deals.read', 'deals.write',
            'tasks.read', 'tasks.write', 'campaigns.read', 'campaigns.write',
            'platform.admin', 'billing.admin'
          ]
        };
      }
      
      // For regular users, return basic user info
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role || 'user',
        tenantId: user.tenantId,
        isActive: user.isActive,
        permissions: [] // Basic permissions for regular users
      };
      
    } catch (error) {
      console.error('Error getting user with permissions:', error);
      return null;
    }
  }

  // Add other missing methods with basic implementations
  async getCampaigns(): Promise<Campaign[]> {
    if (this.isPlatformOwner && this.userEmail === 'abel@argilette.com') {
      return db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
    } else {
      return db.select().from(campaigns)
        .where(eq(campaigns.tenantId, this.tenantId))
        .orderBy(desc(campaigns.createdAt));
    }
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const campaignWithTenant = {
      ...campaign,
      tenantId: this.tenantId
    };
    
    const [newCampaign] = await db.insert(campaigns).values(campaignWithTenant).returning();
    return newCampaign;
  }

  async getEmployees(): Promise<Employee[]> {
    if (this.isPlatformOwner && this.userEmail === 'abel@argilette.com') {
      return db.select().from(employees).orderBy(desc(employees.createdAt));
    } else {
      return db.select().from(employees)
        .where(eq(employees.tenantId, this.tenantId))
        .orderBy(desc(employees.createdAt));
    }
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const employeeWithTenant = {
      ...employee,
      tenantId: this.tenantId
    };
    
    const [newEmployee] = await db.insert(employees).values(employeeWithTenant).returning();
    return newEmployee;
  }

  // ================== APPOINTMENT OPERATIONS ==================
  async getAppointments(): Promise<Appointment[]> {
    if (this.isPlatformOwner && this.userEmail === 'abel@argilette.com') {
      return db.select().from(appointments).orderBy(desc(appointments.createdAt));
    } else {
      return db.select().from(appointments)
        .where(eq(appointments.tenantId, this.tenantId))
        .orderBy(desc(appointments.createdAt));
    }
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const appointmentWithTenant = {
      ...appointment,
      tenantId: this.tenantId
    };
    
    const [newAppointment] = await db.insert(appointments).values(appointmentWithTenant).returning();
    return newAppointment;
  }

  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db.update(appointments)
      .set(appointment)
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const result = await db.delete(appointments).where(eq(appointments.id, id));
    return result.rowCount > 0;
  }

  async getProjects(): Promise<Project[]> {
    if (this.isPlatformOwner && this.userEmail === 'abel@argilette.com') {
      return db.select().from(projects).orderBy(desc(projects.createdAt));
    } else {
      return db.select().from(projects)
        .where(eq(projects.tenantId, this.tenantId))
        .orderBy(desc(projects.createdAt));
    }
  }

  async createProject(project: InsertProject): Promise<Project> {
    const projectWithTenant = {
      ...project,
      tenantId: this.tenantId
    };
    
    const [newProject] = await db.insert(projects).values(projectWithTenant).returning();
    return newProject;
  }

  async getInvoices(): Promise<Invoice[]> {
    if (this.isPlatformOwner && this.userEmail === 'abel@argilette.com') {
      return db.select().from(invoices).orderBy(desc(invoices.createdAt));
    } else {
      return db.select().from(invoices)
        .where(eq(invoices.tenantId, this.tenantId))
        .orderBy(desc(invoices.createdAt));
    }
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const invoiceWithTenant = {
      ...invoice,
      tenantId: this.tenantId
    };
    
    const [newInvoice] = await db.insert(invoices).values(invoiceWithTenant).returning();
    return newInvoice;
  }

  async getSentimentAnalyses(): Promise<SentimentAnalysis[]> {
    if (this.isPlatformOwner && this.userEmail === 'abel@argilette.com') {
      return [];
    } else {
      return [];
    }
  }

  async createSentimentAnalysis(analysis: InsertSentimentAnalysis): Promise<SentimentAnalysis> {
    throw new Error('Sentiment analysis not implemented in database storage');
  }

  // Chart of Accounts methods
  async getChartOfAccounts(): Promise<any[]> {
    // Return basic chart of accounts for comprehensive bookkeeping functionality
    return [
      { id: 1, name: "Cash", type: "asset", balance: 10000, currency: "USD", code: "1000" },
      { id: 2, name: "Checking Account", type: "asset", balance: 25000, currency: "USD", code: "1010" },
      { id: 3, name: "Savings Account", type: "asset", balance: 50000, currency: "USD", code: "1020" },
      { id: 4, name: "Accounts Receivable", type: "asset", balance: 15000, currency: "USD", code: "1200" },
      { id: 5, name: "Inventory", type: "asset", balance: 30000, currency: "USD", code: "1300" },
      { id: 6, name: "Equipment", type: "asset", balance: 75000, currency: "USD", code: "1500" },
      { id: 7, name: "Accounts Payable", type: "liability", balance: 8000, currency: "USD", code: "2000" },
      { id: 8, name: "Credit Card", type: "liability", balance: 3500, currency: "USD", code: "2100" },
      { id: 9, name: "Bank Loan", type: "liability", balance: 20000, currency: "USD", code: "2200" },
      { id: 10, name: "Owner's Equity", type: "equity", balance: 100000, currency: "USD", code: "3000" },
      { id: 11, name: "Sales Revenue", type: "income", balance: 85000, currency: "USD", code: "4000" },
      { id: 12, name: "Service Revenue", type: "income", balance: 45000, currency: "USD", code: "4100" },
      { id: 13, name: "Cost of Goods Sold", type: "expense", balance: 35000, currency: "USD", code: "5000" },
      { id: 14, name: "Office Rent", type: "expense", balance: 24000, currency: "USD", code: "5100" },
      { id: 15, name: "Utilities", type: "expense", balance: 3600, currency: "USD", code: "5200" },
      { id: 16, name: "Marketing", type: "expense", balance: 12000, currency: "USD", code: "5300" },
      { id: 17, name: "Travel", type: "expense", balance: 5500, currency: "USD", code: "5400" },
      { id: 18, name: "Professional Services", type: "expense", balance: 8500, currency: "USD", code: "5500" }
    ];
  }

  async createChartOfAccount(account: any): Promise<any> {
    // Placeholder - this would normally create a chart of accounts entry
    return account;
  }

  // Bank Account linking methods
  async linkBankAccountToChart(bankAccountId: number, chartAccountId: number): Promise<boolean> {
    // Placeholder - this would normally create a link between bank and chart accounts
    return true;
  }

  async unlinkBankAccount(bankAccountId: number): Promise<boolean> {
    // Placeholder - this would normally remove the link
    return true;
  }

  async getAllBankAccountLinks(): Promise<Map<number, number>> {
    // Placeholder - this would normally return all bank account links
    return new Map();
  }

  // Financial Transaction methods
  async getFinancialTransaction(id: number): Promise<any | undefined> {
    // Placeholder - this would normally fetch a financial transaction by ID
    return undefined;
  }

  // ================== E-COMMERCE OPERATIONS ==================
  
  // Store operations
  async createStore(data: InsertStore): Promise<Store> {
    // Convert empty domain to null to avoid unique constraint issues
    const storeData = {
      ...data,
      tenantId: this.tenantId,
      domain: data.domain === '' ? null : data.domain
    };
    
    // Check if subdomain already exists and generate unique one if needed
    let subdomain = storeData.subdomain;
    let counter = 1;
    
    while (await this.isSubdomainTaken(subdomain)) {
      subdomain = `${storeData.subdomain}-${counter}`;
      counter++;
    }
    
    storeData.subdomain = subdomain;
    
    const [result] = await db.insert(stores).values(storeData).returning();
    return result;
  }
  
  async isSubdomainTaken(subdomain: string): Promise<boolean> {
    const [existing] = await db.select({ count: sql`count(*)` }).from(stores)
      .where(eq(stores.subdomain, subdomain));
    return Number(existing.count) > 0;
  }

  async getStoresByUser(userId: string, tenantId?: string): Promise<Store[]> {
    const targetTenantId = tenantId || this.tenantId;
    return db.select().from(stores)
      .where(and(
        eq(stores.userId, userId),
        eq(stores.tenantId, targetTenantId)
      ))
      .orderBy(desc(stores.createdAt));
  }

  async getStoreById(id: number): Promise<Store | null> {
    const [result] = await db.select().from(stores)
      .where(eq(stores.id, id))
      .limit(1);
    return result || null;
  }

  async updateStore(id: number, data: Partial<InsertStore>): Promise<Store> {
    const [result] = await db.update(stores)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(stores.id, id))
      .returning();
    return result;
  }

  async deleteStore(id: number): Promise<void> {
    await db.delete(stores).where(eq(stores.id, id));
  }

  // Product operations
  async createProduct(data: InsertEcommerceProduct): Promise<EcommerceProduct> {
    const [result] = await db.insert(ecommerceProducts).values({
      ...data,
      tenantId: this.tenantId
    }).returning();
    return result;
  }

  async getProductsByStore(storeId: string): Promise<EcommerceProduct[]> {
    return db.select().from(ecommerceProducts)
      .where(eq(ecommerceProducts.storeId, storeId))
      .orderBy(desc(ecommerceProducts.createdAt));
  }

  async getProductById(id: string): Promise<EcommerceProduct | null> {
    const [result] = await db.select().from(ecommerceProducts)
      .where(eq(ecommerceProducts.id, id))
      .limit(1);
    return result || null;
  }

  async updateProduct(id: string, data: Partial<InsertEcommerceProduct>): Promise<EcommerceProduct> {
    const [result] = await db.update(ecommerceProducts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(ecommerceProducts.id, id))
      .returning();
    return result;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(ecommerceProducts).where(eq(ecommerceProducts.id, id));
  }

  // Category operations
  async createCategory(data: InsertCategory): Promise<Category> {
    const [result] = await db.insert(categories).values({
      ...data,
      tenantId: this.tenantId
    }).returning();
    return result;
  }

  async getCategoriesByStore(storeId: number): Promise<Category[]> {
    return db.select().from(categories)
      .where(eq(categories.storeId, storeId))
      .orderBy(categories.sortOrder);
  }

  async updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category> {
    const [result] = await db.update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return result;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Order operations
  async createOrder(data: InsertOrder): Promise<Order> {
    const [result] = await db.insert(orders).values({
      ...data,
      tenantId: this.tenantId
    }).returning();
    return result;
  }

  async getOrdersByStore(storeId: number): Promise<Order[]> {
    return db.select().from(orders)
      .where(eq(orders.storeId, storeId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: number): Promise<Order | null> {
    const [result] = await db.select().from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    return result || null;
  }

  async updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order> {
    const [result] = await db.update(orders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return result;
  }

  // Customer operations
  async createCustomer(data: InsertCustomer): Promise<Customer> {
    const [result] = await db.insert(customers).values({
      ...data,
      tenantId: this.tenantId
    }).returning();
    return result;
  }

  async getCustomersByStore(storeId: number): Promise<Customer[]> {
    return db.select().from(customers)
      .where(eq(customers.storeId, storeId))
      .orderBy(desc(customers.createdAt));
  }

  async getCustomerById(id: number): Promise<Customer | null> {
    const [result] = await db.select().from(customers)
      .where(eq(customers.id, id))
      .limit(1);
    return result || null;
  }

  async updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<Customer> {
    const [result] = await db.update(customers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return result;
  }

  // Store page operations - placeholder for future implementation
  async createStorePage(data: any): Promise<any> {
    // Store pages functionality to be implemented later
    throw new Error("Store pages not implemented yet");
  }

  async getPagesByStore(storeId: number): Promise<any[]> {
    // Return empty array for now
    return [];
  }

  async updateStorePage(id: number, data: any): Promise<any> {
    throw new Error("Store pages not implemented yet");
  }

  async deleteStorePage(id: number): Promise<void> {
    throw new Error("Store pages not implemented yet");
  }

  // General product operations (for API compatibility) - using sample data for now
  async getProducts(): Promise<any[]> {
    // Return comprehensive sample products for e-commerce platform
    return [
      {
        id: '1',
        name: 'Premium Wireless Headphones',
        basePrice: '299.99',
        currency: 'USD',
        status: 'active',
        category: 'Electronics',
        inventory: { quantity: 50, trackQuantity: true },
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=600&fit=crop'
        ],
        description: 'High-quality wireless headphones with noise cancellation'
      },
      {
        id: '2',
        name: 'Smart Fitness Tracker',
        basePrice: '199.99',
        currency: 'USD',
        status: 'active',
        category: 'Electronics',
        inventory: { quantity: 25, trackQuantity: true },
        images: [
          'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=800&h=600&fit=crop'
        ],
        description: 'Advanced fitness tracking with heart rate monitoring'
      },
      {
        id: '3',
        name: 'Organic Coffee Beans',
        basePrice: '24.99',
        currency: 'USD',
        status: 'active',
        category: 'Food & Beverages',
        inventory: { quantity: 100, trackQuantity: true },
        images: [
          'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&h=600&fit=crop'
        ],
        description: 'Premium organic coffee beans, freshly roasted'
      }
    ];
  }

  async getProduct(id: string): Promise<any | undefined> {
    const products = await this.getProducts();
    return products.find(product => product.id === id);
  }

  // General order operations (for API compatibility) - using sample data for now
  async getOrders(): Promise<any[]> {
    // Return sample orders data
    return [
      {
        id: '1',
        customerName: 'John Smith',
        total: 299.99,
        currency: 'USD',
        status: 'completed',
        createdAt: new Date().toISOString(),
        items: [{ productId: '1', productName: 'Premium Wireless Headphones', quantity: 1, price: 299.99 }]
      }
    ];
  }

  // Review operations (placeholder implementation)
  async getReviews(productId?: number): Promise<any[]> {
    // Return empty array as reviews functionality is not yet implemented
    return [];
  }

  async getReview(id: number): Promise<any | undefined> {
    return undefined;
  }

  async createReview(review: any): Promise<any> {
    throw new Error("Reviews not implemented yet");
  }

  async updateReview(id: number, review: any): Promise<any | undefined> {
    throw new Error("Reviews not implemented yet");
  }

  async deleteReview(id: number): Promise<boolean> {
    return false;
  }

  // Coupon operations (placeholder implementation)
  async getCoupons(storeId?: number): Promise<any[]> {
    return [];
  }

  async getCoupon(id: number): Promise<any | undefined> {
    return undefined;
  }

  async createCoupon(coupon: any): Promise<any> {
    throw new Error("Coupons not implemented yet");
  }

  async updateCoupon(id: number, coupon: any): Promise<any | undefined> {
    throw new Error("Coupons not implemented yet");
  }

  async deleteCoupon(id: number): Promise<boolean> {
    return false;
  }

  static getInstance(): DatabaseStorage {
    return new DatabaseStorage('system@argilette.com', SYSTEM_TENANT_ID, false);
  }

  // ================== TAX RATE OPERATIONS ==================
  async getTaxRates(): Promise<TaxRate[]> {
    return db.select().from(taxRates).orderBy(desc(taxRates.createdAt));
  }

  async getTaxRate(id: number): Promise<TaxRate | undefined> {
    const [taxRate] = await db.select().from(taxRates).where(eq(taxRates.id, id));
    return taxRate || undefined;
  }

  async createTaxRate(insertTaxRate: InsertTaxRate): Promise<TaxRate> {
    const [taxRate] = await db.insert(taxRates).values(insertTaxRate).returning();
    return taxRate;
  }

  async updateTaxRate(id: number, updateData: Partial<InsertTaxRate>): Promise<TaxRate | undefined> {
    const [taxRate] = await db.update(taxRates)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(taxRates.id, id))
      .returning();
    return taxRate || undefined;
  }

  async deleteTaxRate(id: number): Promise<boolean> {
    const result = await db.delete(taxRates).where(eq(taxRates.id, id));
    return result.rowCount > 0;
  }

  // ================== ADDITIONAL STUB METHODS ==================
  // Keep only stubs that don't override real implementations
  
  async updateUser(id: string, user: any): Promise<any> {
    // CRITICAL: Get the target user first to check if they are protected
    const targetUser = await this.getUserById(id);
    if (!targetUser) {
      return null;
    }

    // ACCOUNT PROTECTION: Platform owner is the unique super admin account
    // Use email-based protection (immutable identifier)
    // Only abel@argilette.com is the platform owner - cannot be deactivated OR have role changed
    const isPlatformOwner = targetUser.email === 'abel@argilette.com';

    if (isPlatformOwner) {
      // Block deactivation attempts (strict check to prevent type coercion bypass)
      if (user.isActive !== undefined && user.isActive !== true) {
        throw new Error('Platform owner account cannot be deactivated for security reasons');
      }
      
      // Block role changes (strict check prevents null/empty string bypass)
      if (user.role !== undefined && user.role !== targetUser.role) {
        throw new Error('Platform owner account role cannot be changed for security reasons');
      }
    }

    // Perform the update
    const [updatedUser] = await db
      .update(users)
      .set({
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive !== undefined ? user.isActive : targetUser.isActive
      })
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }
  
  async updateUserLastLogin(id: string): Promise<void> {
    // Stub implementation
  }
  
  async getUsersByTenant(tenantId: string): Promise<any[]> {
    return [];
  }
  
  async getUserCountByTenant(tenantId: string): Promise<number> {
    return 0;
  }
  
  async getContactCountByTenant(tenantId: string): Promise<number> {
    const contacts = await this.getContacts();
    return contacts.length;
  }
  
  async getDealCountByTenant(tenantId: string): Promise<number> {
    const deals = await this.getDeals();
    return deals.length;
  }
  
  async getRecentActivityByTenant(tenantId: string, limit: number): Promise<any[]> {
    return [];
  }
  
  async createDefaultRoles(tenantId: string): Promise<void> {
    // Stub implementation
  }
  
  async getRolesByTenant(tenantId: string): Promise<any[]> {
    return [];
  }
  
  async createRole(role: any): Promise<any> {
    throw new Error("Not implemented yet");
  }
  
  async updateRole(id: string, role: any): Promise<any> {
    throw new Error("Not implemented yet");
  }
  
  async deleteRole(id: string): Promise<boolean> {
    return false;
  }
  
  async getRole(id: string): Promise<any> {
    return undefined;
  }
  
  async getAllPermissions(): Promise<any[]> {
    return [];
  }

  // Financial operations
  async getChartOfAccounts(): Promise<any[]> {
    return [];
  }
  
  async getChartOfAccount(id: number): Promise<any> {
    return undefined;
  }
  
  async createChartOfAccount(account: any): Promise<any> {
    throw new Error("Not implemented yet");
  }
  
  async updateChartOfAccount(id: number, account: any): Promise<any> {
    throw new Error("Not implemented yet");
  }
  
  async deleteChartOfAccount(id: number): Promise<boolean> {
    return false;
  }

  async linkBankAccountToChart(bankAccountId: number, chartAccountId: number): Promise<boolean> {
    return false;
  }
  
  async unlinkBankAccount(bankAccountId: number): Promise<boolean> {
    return false;
  }
  
  async getLinkedChartAccount(bankAccountId: number): Promise<number | null> {
    return null;
  }
  
  async getAllBankAccountLinks(): Promise<Map<number, number>> {
    return new Map();
  }
  
  async getFinancialTransactions(): Promise<any[]> {
    return [];
  }
  
  async getFinancialTransaction(id: number): Promise<any> {
    return undefined;
  }
  
  async createFinancialTransaction(transaction: any): Promise<any> {
    throw new Error("Not implemented yet");
  }
  
  async updateFinancialTransaction(id: number, transaction: any): Promise<any> {
    throw new Error("Not implemented yet");
  }
  
  async deleteFinancialTransaction(id: number): Promise<boolean> {
    return false;
  }
  
  async getFinancialTransactionsByAccount(accountId: number): Promise<any[]> {
    return [];
  }
  
  async getFinancialTransactionsByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    return [];
  }
  
  async getCurrencies(): Promise<any[]> {
    return [];
  }
  
  async getCurrency(id: number): Promise<any> {
    return undefined;
  }
  
  async createCurrency(currency: any): Promise<any> {
    throw new Error("Not implemented yet");
  }
  
  async updateCurrency(id: number, currency: any): Promise<any> {
    throw new Error("Not implemented yet");
  }
  
  async deleteCurrency(id: number): Promise<boolean> {
    return false;
  }

  // Missing core methods implementation (stubbed for now)
  
  async getEmployees(): Promise<any[]> {
    return [];
  }

  async getEmployee(id: number): Promise<any | undefined> {
    return undefined;
  }

  async createEmployee(employee: any): Promise<any> {
    throw new Error("Not implemented yet");
  }

  async updateEmployee(id: number, employee: any): Promise<any | undefined> {
    throw new Error("Not implemented yet");
  }

  async deleteEmployee(id: number): Promise<boolean> {
    return false;
  }

  async getAppointments(): Promise<Appointment[]> {
    if (this.isPlatformOwner && this.userEmail === 'abel@argilette.com') {
      return db.select().from(appointments).orderBy(desc(appointments.createdAt));
    } else {
      return db.select().from(appointments)
        .where(eq(appointments.tenantId, this.tenantId))
        .orderBy(desc(appointments.createdAt));
    }
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const appointmentWithTenant = {
      ...appointmentData,
      tenantId: this.tenantId,
      createdBy: this.userEmail
    };
    
    const [newAppointment] = await db.insert(appointments).values(appointmentWithTenant).returning();
    return newAppointment;
  }

  async updateAppointment(id: number, appointmentData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [updatedAppointment] = await db.update(appointments)
      .set({
        ...appointmentData,
        updatedAt: new Date()
      })
      .where(eq(appointments.id, id))
      .returning();
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const result = await db.delete(appointments).where(eq(appointments.id, id));
    return result.rowCount! > 0;
  }

  async getSentimentAnalyses(): Promise<any[]> {
    return [];
  }

  async getSentimentAnalysis(id: number): Promise<any | undefined> {
    return undefined;
  }

  async createSentimentAnalysis(analysis: any): Promise<any> {
    throw new Error("Not implemented yet");
  }

  async updateSentimentAnalysis(id: number, analysis: any): Promise<any | undefined> {
    throw new Error("Not implemented yet");
  }

  async deleteSentimentAnalysis(id: number): Promise<boolean> {
    return false;
  }

  // ================== E-COMMERCE OPERATIONS ==================
  
  // Store operations
  async getAllStores(): Promise<Store[]> {
    if (this.isPlatformOwner && this.userEmail === 'abel@argilette.com') {
      return db.select().from(stores).orderBy(desc(stores.createdAt));
    } else {
      return db.select().from(stores)
        .where(eq(stores.tenantId, this.tenantId))
        .orderBy(desc(stores.createdAt));
    }
  }

  async getStores(): Promise<Store[]> {
    return this.getAllStores();
  }

  async getStore(id: string): Promise<Store | undefined> {
    let query = db.select().from(stores).where(eq(stores.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      query = query.where(eq(stores.tenantId, this.tenantId));
    }
    
    const [store] = await query;
    return store || undefined;
  }

  async getStoreStats(id: string): Promise<any> {
    const store = await this.getStore(id);
    if (!store) {
      return null;
    }

    // Get basic stats for the store
    const ordersCount = await db.select({ count: sql`count(*)` })
      .from(ecommerceOrders)
      .where(and(eq(ecommerceOrders.storeId, id), eq(ecommerceOrders.tenantId, this.tenantId)));

    const customersCount = await db.select({ count: sql`count(*)` })
      .from(customers)
      .where(and(eq(customers.storeId, id), eq(customers.tenantId, this.tenantId)));

    const productsCount = await db.select({ count: sql`count(*)` })
      .from(ecommerceProducts)
      .where(and(eq(ecommerceProducts.storeId, id), eq(ecommerceProducts.tenantId, this.tenantId)));

    const totalRevenue = await db.select({ sum: sql`sum(${ecommerceOrders.totalAmount})` })
      .from(ecommerceOrders)
      .where(and(
        eq(ecommerceOrders.storeId, id),
        eq(ecommerceOrders.tenantId, this.tenantId),
        eq(ecommerceOrders.financialStatus, 'paid')
      ));

    return {
      ordersCount: ordersCount[0]?.count || 0,
      customersCount: customersCount[0]?.count || 0,
      productsCount: productsCount[0]?.count || 0,
      totalRevenue: totalRevenue[0]?.sum || 0
    };
  }

  async createStore(store: InsertStore): Promise<Store> {
    const storeWithTenant = {
      ...store,
      tenantId: this.tenantId
    };
    
    const [newStore] = await db.insert(stores).values(storeWithTenant).returning();
    return newStore;
  }

  async updateStore(id: string, storeData: Partial<InsertStore>): Promise<Store | undefined> {
    let updateQuery = db
      .update(stores)
      .set({ ...storeData, updatedAt: new Date() })
      .where(eq(stores.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      updateQuery = updateQuery.where(eq(stores.tenantId, this.tenantId));
    }
    
    const [updatedStore] = await updateQuery.returning();
    return updatedStore || undefined;
  }

  async deleteStore(id: string): Promise<boolean> {
    let deleteQuery = db.delete(stores).where(eq(stores.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      deleteQuery = deleteQuery.where(eq(stores.tenantId, this.tenantId));
    }
    
    const result = await deleteQuery;
    return result.rowCount > 0;
  }

  // Order operations  
  async getOrders(filters?: { storeId?: string; status?: string; limit?: number }): Promise<EcommerceOrder[]> {
    let query = db.select().from(ecommerceOrders);
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      query = query.where(eq(ecommerceOrders.tenantId, this.tenantId));
    }

    if (filters?.storeId) {
      query = query.where(eq(ecommerceOrders.storeId, filters.storeId));
    }

    if (filters?.status) {
      query = query.where(eq(ecommerceOrders.status, filters.status));
    }

    query = query.orderBy(desc(ecommerceOrders.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    return await query;
  }

  async getOrder(id: string): Promise<EcommerceOrder | undefined> {
    let query = db.select().from(ecommerceOrders).where(eq(ecommerceOrders.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      query = query.where(eq(ecommerceOrders.tenantId, this.tenantId));
    }
    
    const [order] = await query;
    return order || undefined;
  }

  async createOrder(order: InsertEcommerceOrder): Promise<EcommerceOrder> {
    const orderWithTenant = {
      ...order,
      tenantId: this.tenantId
    };
    
    const [newOrder] = await db.insert(ecommerceOrders).values(orderWithTenant).returning();
    return newOrder;
  }

  async updateOrder(id: string, orderData: Partial<InsertEcommerceOrder>): Promise<EcommerceOrder | undefined> {
    let updateQuery = db
      .update(ecommerceOrders)
      .set({ ...orderData, updatedAt: new Date() })
      .where(eq(ecommerceOrders.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      updateQuery = updateQuery.where(eq(ecommerceOrders.tenantId, this.tenantId));
    }
    
    const [updatedOrder] = await updateQuery.returning();
    return updatedOrder || undefined;
  }

  async deleteOrder(id: string): Promise<boolean> {
    let deleteQuery = db.delete(ecommerceOrders).where(eq(ecommerceOrders.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      deleteQuery = deleteQuery.where(eq(ecommerceOrders.tenantId, this.tenantId));
    }
    
    const result = await deleteQuery;
    return result.rowCount > 0;
  }

  // Customer operations
  async getCustomers(storeId?: string): Promise<Customer[]> {
    let query = db.select().from(customers);
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      query = query.where(eq(customers.tenantId, this.tenantId));
    }

    if (storeId) {
      query = query.where(eq(customers.storeId, storeId));
    }

    return await query.orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    let query = db.select().from(customers).where(eq(customers.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      query = query.where(eq(customers.tenantId, this.tenantId));
    }
    
    const [customer] = await query;
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const customerWithTenant = {
      ...customer,
      tenantId: this.tenantId
    };
    
    const [newCustomer] = await db.insert(customers).values(customerWithTenant).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customerData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    let updateQuery = db
      .update(customers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(eq(customers.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      updateQuery = updateQuery.where(eq(customers.tenantId, this.tenantId));
    }
    
    const [updatedCustomer] = await updateQuery.returning();
    return updatedCustomer || undefined;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    let deleteQuery = db.delete(customers).where(eq(customers.id, id));
    
    if (!this.isPlatformOwner || this.userEmail !== 'abel@argilette.com') {
      deleteQuery = deleteQuery.where(eq(customers.tenantId, this.tenantId));
    }
    
    const result = await deleteQuery;
    return result.rowCount > 0;
  }

  // Category operations (stub implementations)
  async getCategories(storeId?: string): Promise<any[]> {
    return [];
  }

  async getCategory(id: number): Promise<any | undefined> {
    return undefined;
  }

  async createCategory(category: any): Promise<any> {
    throw new Error("Not implemented yet");
  }

  async updateCategory(id: number, category: any): Promise<any | undefined> {
    throw new Error("Not implemented yet");
  }

  async deleteCategory(id: number): Promise<boolean> {
    return false;
  }

  // Review operations (stub implementations)
  async getReviews(productId?: number): Promise<any[]> {
    return [];
  }

  async getReview(id: number): Promise<any | undefined> {
    return undefined;
  }

  async createReview(review: any): Promise<any> {
    throw new Error("Not implemented yet");
  }

  async updateReview(id: number, review: any): Promise<any | undefined> {
    throw new Error("Not implemented yet");
  }

  async deleteReview(id: number): Promise<boolean> {
    return false;
  }

  // Coupon operations (stub implementations)
  async getCoupons(storeId?: number): Promise<any[]> {
    return [];
  }

  async getCoupon(id: number): Promise<any | undefined> {
    return undefined;
  }

  async createCoupon(coupon: any): Promise<any> {
    throw new Error("Not implemented yet");
  }

  async updateCoupon(id: number, coupon: any): Promise<any | undefined> {
    throw new Error("Not implemented yet");
  }

  async deleteCoupon(id: number): Promise<boolean> {
    return false;
  }

  // ================== REGISTRATION SYSTEM METHODS ==================
  // These methods now use persistent database storage instead of in-memory maps

  async getUserByEmail(email: string): Promise<any> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user || null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }

  async createRegisteredUser(userData: any): Promise<any> {
    try {
      // Create user with verification token
      const userToInsert = {
        tenantId: userData.tenantId,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        passwordHash: userData.passwordHash,
        role: userData.role || 'user',
        isActive: true,
        emailVerified: false,
        emailVerificationToken: userData.emailVerificationToken || userData.verificationToken,
        emailVerificationExpires: userData.emailVerificationExpiry ? new Date(userData.emailVerificationExpiry) : null,
        preferredLanguage: 'en',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [newUser] = await db.insert(users).values(userToInsert).returning();
      console.log('✅ Database user created:', newUser.email);
      
      // Return the user in the expected format for compatibility
      return {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        tenantId: newUser.tenantId,
        emailVerificationToken: newUser.emailVerificationToken,
        emailVerificationExpiry: userData.emailVerificationExpiry,
        passwordHash: newUser.passwordHash,
        role: newUser.role,
        isVerified: newUser.emailVerified,
        status: newUser.isActive ? 'active' : 'inactive',
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
        loginCount: 0,
        lastLogin: null,
        ...userData // Include any additional fields
      };
    } catch (error) {
      console.error('Error creating registered user:', error);
      throw error;
    }
  }

  async getUserByVerificationToken(token: string): Promise<any> {
    try {
      const [user] = await db.select().from(users)
        .where(eq(users.emailVerificationToken, token));
      
      if (!user) {
        console.log('❌ No user found with verification token:', token?.substring(0, 15) + '...');
        return null;
      }
      
      console.log('✅ Found user for verification token:', user.email);
      return user;
    } catch (error) {
      console.error('Error fetching user by verification token:', error);
      return null;
    }
  }

  async verifyUser(userId: string): Promise<void> {
    try {
      const [updatedUser] = await db.update(users)
        .set({
          emailVerified: true,
          emailVerificationToken: null, // Clear the token
          emailVerificationExpires: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (updatedUser) {
        console.log('✅ User verified in database:', updatedUser.email);
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      throw error;
    }
  }

  async getAllRegisteredUsers(): Promise<any[]> {
    try {
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      return allUsers.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        tenantId: user.tenantId,
        isVerified: user.emailVerified,
        status: user.isActive ? 'active' : 'inactive',
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLoginAt,
        updatedAt: user.updatedAt
      }));
    } catch (error) {
      console.error('Error fetching all registered users:', error);
      return [];
    }
  }

  // ================== SALES CHANNEL OPERATIONS - TENANT ISOLATED ==================
  async getSalesChannelsByTenant(tenantId: string): Promise<SalesChannel[]> {
    try {
      const channels = await db.select().from(salesChannels)
        .where(eq(salesChannels.tenantId, tenantId))
        .orderBy(desc(salesChannels.createdAt));
      return channels;
    } catch (error) {
      console.error('Error fetching sales channels:', error);
      return [];
    }
  }

  async getSalesChannel(id: string, tenantId: string): Promise<SalesChannel | undefined> {
    try {
      const [channel] = await db.select().from(salesChannels)
        .where(and(eq(salesChannels.id, id), eq(salesChannels.tenantId, tenantId)));
      return channel || undefined;
    } catch (error) {
      console.error('Error fetching sales channel:', error);
      return undefined;
    }
  }

  async createSalesChannel(salesChannel: InsertSalesChannel): Promise<SalesChannel> {
    try {
      const [newChannel] = await db.insert(salesChannels)
        .values(salesChannel)
        .returning();
      return newChannel;
    } catch (error) {
      console.error('Error creating sales channel:', error);
      throw error;
    }
  }

  async updateSalesChannel(id: string, salesChannel: Partial<InsertSalesChannel>): Promise<SalesChannel | undefined> {
    try {
      const [updatedChannel] = await db.update(salesChannels)
        .set({ ...salesChannel, updatedAt: new Date() })
        .where(eq(salesChannels.id, id))
        .returning();
      return updatedChannel || undefined;
    } catch (error) {
      console.error('Error updating sales channel:', error);
      return undefined;
    }
  }

  async deleteSalesChannel(id: string, tenantId: string): Promise<boolean> {
    try {
      const result = await db.delete(salesChannels)
        .where(and(eq(salesChannels.id, id), eq(salesChannels.tenantId, tenantId)))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting sales channel:', error);
      return false;
    }
  }

  // ================== AI CONTENT OPERATIONS ==================
  async getAIContentsByTenant(tenantId: string, filters?: { type?: string; status?: string; channel?: string }): Promise<AIContent[]> {
    try {
      const conditions = [eq(aiContents.tenantId, tenantId)];
      
      if (filters?.type) {
        conditions.push(eq(aiContents.type, filters.type));
      }
      if (filters?.status) {
        conditions.push(eq(aiContents.status, filters.status));
      }
      if (filters?.channel) {
        conditions.push(eq(aiContents.channel, filters.channel));
      }
      
      return await db.select().from(aiContents)
        .where(and(...conditions))
        .orderBy(desc(aiContents.createdAt));
    } catch (error) {
      console.error('Error fetching AI contents:', error);
      return [];
    }
  }

  async getAIContent(id: string, tenantId: string): Promise<AIContent | undefined> {
    try {
      const [content] = await db.select().from(aiContents)
        .where(and(eq(aiContents.id, id), eq(aiContents.tenantId, tenantId)));
      return content || undefined;
    } catch (error) {
      console.error('Error fetching AI content:', error);
      return undefined;
    }
  }

  async createAIContent(content: InsertAIContent): Promise<AIContent> {
    try {
      const [newContent] = await db.insert(aiContents)
        .values(content)
        .returning();
      return newContent;
    } catch (error) {
      console.error('Error creating AI content:', error);
      throw error;
    }
  }

  async updateAIContent(id: string, content: Partial<InsertAIContent>): Promise<AIContent | undefined> {
    try {
      const [updatedContent] = await db.update(aiContents)
        .set({ ...content, updatedAt: new Date() })
        .where(and(eq(aiContents.id, id), eq(aiContents.tenantId, content.tenantId || this.tenantId)))
        .returning();
      return updatedContent || undefined;
    } catch (error) {
      console.error('Error updating AI content:', error);
      return undefined;
    }
  }

  async deleteAIContent(id: string, tenantId: string): Promise<boolean> {
    try {
      const result = await db.delete(aiContents)
        .where(and(eq(aiContents.id, id), eq(aiContents.tenantId, tenantId)))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting AI content:', error);
      return false;
    }
  }

  // ================== AI CAMPAIGN OPERATIONS ==================
  async getAICampaignsByTenant(tenantId: string): Promise<AICampaign[]> {
    try {
      return await db.select().from(aiCampaigns)
        .where(eq(aiCampaigns.tenantId, tenantId))
        .orderBy(desc(aiCampaigns.createdAt));
    } catch (error) {
      console.error('Error fetching AI campaigns:', error);
      return [];
    }
  }

  async getAICampaign(id: string, tenantId: string): Promise<AICampaign | undefined> {
    try {
      const [campaign] = await db.select().from(aiCampaigns)
        .where(and(eq(aiCampaigns.id, id), eq(aiCampaigns.tenantId, tenantId)));
      return campaign || undefined;
    } catch (error) {
      console.error('Error fetching AI campaign:', error);
      return undefined;
    }
  }

  async createAICampaign(campaign: InsertAICampaign): Promise<AICampaign> {
    try {
      const [newCampaign] = await db.insert(aiCampaigns)
        .values(campaign)
        .returning();
      return newCampaign;
    } catch (error) {
      console.error('Error creating AI campaign:', error);
      throw error;
    }
  }

  async updateAICampaign(id: string, campaign: Partial<InsertAICampaign>): Promise<AICampaign | undefined> {
    try {
      const [updatedCampaign] = await db.update(aiCampaigns)
        .set({ ...campaign, updatedAt: new Date() })
        .where(and(eq(aiCampaigns.id, id), eq(aiCampaigns.tenantId, campaign.tenantId || this.tenantId)))
        .returning();
      return updatedCampaign || undefined;
    } catch (error) {
      console.error('Error updating AI campaign:', error);
      return undefined;
    }
  }

  async deleteAICampaign(id: string, tenantId: string): Promise<boolean> {
    try {
      const result = await db.delete(aiCampaigns)
        .where(and(eq(aiCampaigns.id, id), eq(aiCampaigns.tenantId, tenantId)))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting AI campaign:', error);
      return false;
    }
  }

  // ================== AI USAGE TRACKING ==================
  async getAIUsageByTenant(tenantId: string, filters?: { provider?: string; startDate?: Date; endDate?: Date }): Promise<AIUsage[]> {
    try {
      const conditions = [eq(aiUsage.tenantId, tenantId)];
      
      if (filters?.provider) {
        conditions.push(eq(aiUsage.provider, filters.provider));
      }
      
      return await db.select().from(aiUsage)
        .where(and(...conditions))
        .orderBy(desc(aiUsage.createdAt));
    } catch (error) {
      console.error('Error fetching AI usage:', error);
      return [];
    }
  }

  async createAIUsage(usage: InsertAIUsage): Promise<AIUsage> {
    try {
      const [newUsage] = await db.insert(aiUsage)
        .values(usage)
        .returning();
      return newUsage;
    } catch (error) {
      console.error('Error creating AI usage record:', error);
      throw error;
    }
  }

  async getTenantAIUsageStats(tenantId: string): Promise<{ totalCost: number; totalTokens: number; byProvider: Record<string, number> }> {
    try {
      const usages = await this.getAIUsageByTenant(tenantId);
      
      const stats = usages.reduce((acc, usage) => {
        acc.totalCost += usage.costCents || 0;
        acc.totalTokens += (usage.tokensIn || 0) + (usage.tokensOut || 0);
        
        if (usage.provider) {
          acc.byProvider[usage.provider] = (acc.byProvider[usage.provider] || 0) + (usage.costCents || 0);
        }
        
        return acc;
      }, { totalCost: 0, totalTokens: 0, byProvider: {} as Record<string, number> });
      
      return stats;
    } catch (error) {
      console.error('Error calculating AI usage stats:', error);
      return { totalCost: 0, totalTokens: 0, byProvider: {} };
    }
  }

  // ================== STORE OPERATIONS ==================
  async createStore(data: InsertStore): Promise<Store> {
    try {
      const storeWithTenant = {
        ...data,
        tenantId: this.tenantId
      };
      
      const [newStore] = await db.insert(stores)
        .values(storeWithTenant)
        .returning();
      return newStore;
    } catch (error) {
      console.error('Error creating store:', error);
      throw error;
    }
  }

  async getStores(tenantId: string): Promise<Store[]> {
    try {
      return await db.select().from(stores)
        .where(eq(stores.tenantId, tenantId))
        .orderBy(desc(stores.createdAt));
    } catch (error) {
      console.error('Error fetching stores:', error);
      return [];
    }
  }

  async getStoreById(id: string, tenantId: string): Promise<Store | undefined> {
    try {
      const [store] = await db.select().from(stores)
        .where(and(eq(stores.id, id), eq(stores.tenantId, tenantId)));
      return store || undefined;
    } catch (error) {
      console.error('Error fetching store:', error);
      return undefined;
    }
  }

  async updateStore(id: string, tenantId: string, data: Partial<InsertStore>): Promise<Store> {
    try {
      const [updatedStore] = await db.update(stores)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(stores.id, id), eq(stores.tenantId, tenantId)))
        .returning();
      
      if (!updatedStore) {
        throw new Error('Store not found');
      }
      
      return updatedStore;
    } catch (error) {
      console.error('Error updating store:', error);
      throw error;
    }
  }

  async deleteStore(id: string, tenantId: string): Promise<void> {
    try {
      await db.delete(stores)
        .where(and(eq(stores.id, id), eq(stores.tenantId, tenantId)));
    } catch (error) {
      console.error('Error deleting store:', error);
      throw error;
    }
  }

  // ================== ECOMMERCE PRODUCT OPERATIONS ==================
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async ensureUniqueSlug(baseSlug: string, storeId: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const conditions = [
        eq(ecommerceProducts.slug, slug),
        eq(ecommerceProducts.storeId, storeId)
      ];
      
      if (excludeId) {
        conditions.push(sql`${ecommerceProducts.id} != ${excludeId}`);
      }
      
      const [existing] = await db.select().from(ecommerceProducts)
        .where(and(...conditions))
        .limit(1);
      
      if (!existing) {
        return slug;
      }
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async createEcommerceProduct(data: InsertEcommerceProduct): Promise<EcommerceProduct> {
    try {
      const baseSlug = data.slug || this.generateSlug(data.name);
      const uniqueSlug = await this.ensureUniqueSlug(baseSlug, data.storeId);
      
      const productWithTenant = {
        ...data,
        tenantId: this.tenantId,
        slug: uniqueSlug
      };
      
      const [newProduct] = await db.insert(ecommerceProducts)
        .values(productWithTenant)
        .returning();
      return newProduct;
    } catch (error) {
      console.error('Error creating ecommerce product:', error);
      throw error;
    }
  }

  async bulkCreateEcommerceProducts(products: InsertEcommerceProduct[]): Promise<EcommerceProduct[]> {
    try {
      const createdProducts: EcommerceProduct[] = [];
      
      await db.transaction(async (tx) => {
        for (const productData of products) {
          // Defensively force tenantId to prevent caller-controlled tenant assignment
          const safeProduct = {
            ...productData,
            tenantId: this.tenantId, // Always use authenticated tenant
          };
          
          // Generate slug if not provided
          const baseSlug = safeProduct.slug || this.generateSlug(safeProduct.name);
          const uniqueSlug = await this.ensureUniqueSlug(baseSlug, safeProduct.storeId);
          
          const productWithSlug = {
            ...safeProduct,
            slug: uniqueSlug
          };
          
          const [newProduct] = await tx.insert(ecommerceProducts)
            .values(productWithSlug)
            .returning();
          
          createdProducts.push(newProduct);
        }
      });
      
      return createdProducts;
    } catch (error) {
      console.error('Error bulk creating ecommerce products:', error);
      throw error;
    }
  }

  async getEcommerceProducts(tenantId: string, storeId?: string): Promise<EcommerceProduct[]> {
    try {
      const conditions = [eq(ecommerceProducts.tenantId, tenantId)];
      
      if (storeId) {
        conditions.push(eq(ecommerceProducts.storeId, storeId));
      }
      
      return await db.select().from(ecommerceProducts)
        .where(and(...conditions))
        .orderBy(desc(ecommerceProducts.createdAt));
    } catch (error) {
      console.error('Error fetching ecommerce products:', error);
      return [];
    }
  }

  async updateEcommerceProduct(id: string, tenantId: string, data: Partial<InsertEcommerceProduct>): Promise<EcommerceProduct> {
    try {
      let updateData = { ...data };
      
      if (data.name && !data.slug) {
        const [product] = await db.select().from(ecommerceProducts)
          .where(and(eq(ecommerceProducts.id, id), eq(ecommerceProducts.tenantId, tenantId)));
        
        if (product) {
          const baseSlug = this.generateSlug(data.name);
          updateData.slug = await this.ensureUniqueSlug(baseSlug, product.storeId, id);
        }
      }
      
      const [updatedProduct] = await db.update(ecommerceProducts)
        .set({ ...updateData, updatedAt: new Date() })
        .where(and(eq(ecommerceProducts.id, id), eq(ecommerceProducts.tenantId, tenantId)))
        .returning();
      
      if (!updatedProduct) {
        throw new Error('Product not found');
      }
      
      return updatedProduct;
    } catch (error) {
      console.error('Error updating ecommerce product:', error);
      throw error;
    }
  }

  async deleteEcommerceProduct(id: string, tenantId: string): Promise<void> {
    try {
      await db.delete(ecommerceProducts)
        .where(and(eq(ecommerceProducts.id, id), eq(ecommerceProducts.tenantId, tenantId)));
    } catch (error) {
      console.error('Error deleting ecommerce product:', error);
      throw error;
    }
  }

  // ==================== A/B TESTING OPERATIONS ====================

  // A/B Tests CRUD
  async createAbTest(data: InsertAbTest): Promise<AbTest> {
    try {
      const [newTest] = await db.insert(abTests).values(data).returning();
      return newTest;
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  async getAbTests(tenantId: string, filters?: {status?: string, type?: string}): Promise<AbTest[]> {
    try {
      const conditions = [eq(abTests.tenantId, tenantId)];
      
      if (filters?.status) {
        conditions.push(eq(abTests.status, filters.status));
      }
      if (filters?.type) {
        conditions.push(eq(abTests.type, filters.type));
      }
      
      return await db.select().from(abTests)
        .where(and(...conditions))
        .orderBy(desc(abTests.createdAt));
    } catch (error) {
      console.error('Error fetching A/B tests:', error);
      return [];
    }
  }

  async getAbTestById(testId: string, tenantId: string): Promise<AbTest | null> {
    try {
      const [test] = await db.select().from(abTests)
        .where(and(eq(abTests.id, testId), eq(abTests.tenantId, tenantId)));
      return test || null;
    } catch (error) {
      console.error('Error fetching A/B test by ID:', error);
      return null;
    }
  }

  async updateAbTest(testId: string, tenantId: string, data: Partial<AbTest>): Promise<AbTest> {
    try {
      const [updatedTest] = await db.update(abTests)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(abTests.id, testId), eq(abTests.tenantId, tenantId)))
        .returning();
      
      if (!updatedTest) {
        throw new Error('A/B test not found');
      }
      
      return updatedTest;
    } catch (error) {
      console.error('Error updating A/B test:', error);
      throw error;
    }
  }

  async deleteAbTest(testId: string, tenantId: string): Promise<void> {
    try {
      await db.delete(abTests)
        .where(and(eq(abTests.id, testId), eq(abTests.tenantId, tenantId)));
    } catch (error) {
      console.error('Error deleting A/B test:', error);
      throw error;
    }
  }

  // Variants
  async createAbVariant(data: InsertAbVariant): Promise<AbVariant> {
    try {
      const [newVariant] = await db.insert(abVariants).values(data).returning();
      return newVariant;
    } catch (error) {
      console.error('Error creating A/B variant:', error);
      throw error;
    }
  }

  async getAbVariants(testId: string, tenantId: string): Promise<AbVariant[]> {
    try {
      // SECURITY FIX: ALWAYS verify test belongs to this tenant before returning variants
      // tenantId is now MANDATORY - compiler enforces it cannot be omitted
      const [test] = await db.select().from(abTests)
        .where(and(eq(abTests.id, testId), eq(abTests.tenantId, tenantId)))
        .limit(1);
      
      if (!test) {
        throw new Error('Test not found or access denied');
      }
      
      return await db.select().from(abVariants)
        .where(eq(abVariants.testId, testId))
        .orderBy(abVariants.isControl);
    } catch (error) {
      console.error('Error fetching A/B variants:', error);
      throw error;
    }
  }

  async updateAbVariant(variantId: string, tenantId: string, data: Partial<AbVariant>): Promise<AbVariant> {
    try {
      // SECURITY FIX: Join to verify tenant ownership before update
      const [result] = await db.select({ 
        variant: abVariants, 
        test: abTests 
      })
        .from(abVariants)
        .innerJoin(abTests, eq(abVariants.testId, abTests.id))
        .where(and(eq(abVariants.id, variantId), eq(abTests.tenantId, tenantId)))
        .limit(1);
      
      if (!result) {
        throw new Error('Variant not found or access denied');
      }
      
      // Now safe to update
      const [updatedVariant] = await db.update(abVariants)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(abVariants.id, variantId))
        .returning();
      
      return updatedVariant;
    } catch (error) {
      console.error('Error updating A/B variant:', error);
      throw error;
    }
  }

  async deleteAbVariant(variantId: string, tenantId: string): Promise<void> {
    try {
      // SECURITY FIX: Verify tenant ownership before delete
      const [result] = await db.select({ 
        variant: abVariants, 
        test: abTests 
      })
        .from(abVariants)
        .innerJoin(abTests, eq(abVariants.testId, abTests.id))
        .where(and(eq(abVariants.id, variantId), eq(abTests.tenantId, tenantId)))
        .limit(1);
      
      if (!result) {
        throw new Error('Variant not found or access denied');
      }
      
      // Now safe to delete
      await db.delete(abVariants).where(eq(abVariants.id, variantId));
    } catch (error) {
      console.error('Error deleting A/B variant:', error);
      throw error;
    }
  }

  // Session Assignment
  async assignVariant(testId: string, sessionId: string, ipAddress?: string, userAgent?: string): Promise<{variantId: string, variantName: string}> {
    try {
      // Check if session already has an assignment
      const [existingSession] = await db.select().from(abSessions)
        .where(and(eq(abSessions.testId, testId), eq(abSessions.sessionId, sessionId)))
        .limit(1);
      
      if (existingSession) {
        const [variant] = await db.select().from(abVariants)
          .where(eq(abVariants.id, existingSession.variantId));
        return {
          variantId: existingSession.variantId,
          variantName: variant?.name || 'Unknown'
        };
      }
      
      // Get all variants for the test
      const variants = await db.select().from(abVariants)
        .where(eq(abVariants.testId, testId));
      
      if (variants.length === 0) {
        throw new Error('No variants found for test');
      }
      
      // Use traffic allocation to randomly assign variant
      const random = Math.random() * 100;
      let cumulative = 0;
      let selectedVariant = variants[0];
      
      for (const variant of variants) {
        cumulative += variant.trafficAllocation;
        if (random <= cumulative) {
          selectedVariant = variant;
          break;
        }
      }
      
      // Create session assignment
      await db.insert(abSessions).values({
        testId,
        variantId: selectedVariant.id,
        sessionId,
        ipAddress,
        userAgent
      });
      
      return {
        variantId: selectedVariant.id,
        variantName: selectedVariant.name
      };
    } catch (error) {
      console.error('Error assigning variant:', error);
      throw error;
    }
  }

  async getSessionVariant(testId: string, sessionId: string): Promise<AbSession | null> {
    try {
      const [session] = await db.select().from(abSessions)
        .where(and(eq(abSessions.testId, testId), eq(abSessions.sessionId, sessionId)))
        .limit(1);
      return session || null;
    } catch (error) {
      console.error('Error fetching session variant:', error);
      return null;
    }
  }

  // Events & Conversions
  async recordEvent(data: InsertAbEvent, tenantId: string): Promise<void> {
    try {
      // SECURITY FIX: Verify session belongs to tenant's test
      const [session] = await db.select({ session: abSessions, test: abTests })
        .from(abSessions)
        .innerJoin(abTests, eq(abSessions.testId, abTests.id))
        .where(and(
          eq(abSessions.sessionId, data.sessionId),
          eq(abSessions.testId, data.testId),
          eq(abTests.tenantId, tenantId)
        ))
        .limit(1);
      
      if (!session) {
        throw new Error('Session not found or access denied');
      }
      
      await db.insert(abEvents).values(data);
    } catch (error) {
      console.error('Error recording event:', error);
      throw error;
    }
  }

  async recordConversion(data: InsertAbConversion, tenantId: string): Promise<void> {
    try {
      // SECURITY FIX: Verify session belongs to tenant's test
      const [session] = await db.select({ session: abSessions, test: abTests })
        .from(abSessions)
        .innerJoin(abTests, eq(abSessions.testId, abTests.id))
        .where(and(
          eq(abSessions.sessionId, data.sessionId),
          eq(abSessions.testId, data.testId),
          eq(abTests.tenantId, tenantId)
        ))
        .limit(1);
      
      if (!session) {
        throw new Error('Session not found or access denied');
      }
      
      await db.insert(abConversions).values(data);
    } catch (error) {
      console.error('Error recording conversion:', error);
      throw error;
    }
  }

  // Analytics
  async getTestMetrics(testId: string, tenantId: string): Promise<AbMetricsCache[]> {
    try {
      // SECURITY FIX: Verify test ownership before returning metrics
      const [test] = await db.select().from(abTests)
        .where(and(eq(abTests.id, testId), eq(abTests.tenantId, tenantId)))
        .limit(1);
      
      if (!test) {
        throw new Error('Test not found or access denied');
      }
      
      return await db.select().from(abMetricsCache)
        .where(eq(abMetricsCache.testId, testId))
        .orderBy(desc(abMetricsCache.calculatedAt));
    } catch (error) {
      console.error('Error fetching test metrics:', error);
      throw error;
    }
  }

  async calculateTestMetrics(testId: string, tenantId: string): Promise<void> {
    try {
      // SECURITY FIX: Verify test ownership before calculating metrics
      const [test] = await db.select().from(abTests)
        .where(and(eq(abTests.id, testId), eq(abTests.tenantId, tenantId)))
        .limit(1);
      
      if (!test) {
        throw new Error('Test not found or access denied');
      }
      
      // Get all variants for the test
      const variants = await db.select().from(abVariants)
        .where(eq(abVariants.testId, testId));
      
      if (variants.length === 0) {
        return;
      }
      
      // Find control variant
      const controlVariant = variants.find(v => v.isControl);
      let controlMetrics: any = null;
      
      // Calculate metrics for each variant
      for (const variant of variants) {
        // Count impressions (unique sessions)
        const sessionsResult = await db.execute(sql`
          SELECT COUNT(DISTINCT id) as count
          FROM ${abSessions}
          WHERE test_id = ${testId} AND variant_id = ${variant.id}
        `);
        const impressions = Number(sessionsResult.rows[0]?.count || 0);
        
        // Count clicks
        const clicksResult = await db.execute(sql`
          SELECT COUNT(*) as count
          FROM ${abEvents}
          WHERE test_id = ${testId} AND variant_id = ${variant.id}
          AND event_type = 'click'
        `);
        const clicks = Number(clicksResult.rows[0]?.count || 0);
        
        // Count conversions
        const conversionsResult = await db.execute(sql`
          SELECT COUNT(*) as count, COALESCE(SUM(CAST(conversion_value AS DECIMAL)), 0) as revenue
          FROM ${abConversions}
          WHERE test_id = ${testId} AND variant_id = ${variant.id}
        `);
        const conversions = Number(conversionsResult.rows[0]?.count || 0);
        const revenue = Number(conversionsResult.rows[0]?.revenue || 0);
        
        // Calculate conversion rate
        const conversionRate = impressions > 0 ? (conversions / impressions) * 100 : 0;
        
        const metrics = {
          impressions,
          clicks,
          conversions,
          conversionRate,
          revenue
        };
        
        // Store control metrics for uplift calculation
        if (variant.isControl) {
          controlMetrics = metrics;
        }
        
        // Calculate uplift and statistical significance
        let uplift = 0;
        let pValue = 1.0;
        let confidenceLevel = 0;
        
        if (controlMetrics && !variant.isControl && controlMetrics.impressions > 0) {
          // Calculate uplift percentage
          const controlRate = controlMetrics.conversionRate;
          uplift = controlRate > 0 ? ((conversionRate - controlRate) / controlRate) * 100 : 0;
          
          // Calculate statistical significance using z-test
          const p1 = conversionRate / 100;
          const p2 = controlRate / 100;
          const n1 = impressions;
          const n2 = controlMetrics.impressions;
          
          if (n1 > 0 && n2 > 0) {
            const pooledP = ((p1 * n1) + (p2 * n2)) / (n1 + n2);
            const standardError = Math.sqrt(pooledP * (1 - pooledP) * ((1 / n1) + (1 / n2)));
            
            if (standardError > 0) {
              const zScore = Math.abs((p1 - p2) / standardError);
              
              // Approximate p-value from z-score (two-tailed test)
              // This is a simplified calculation
              pValue = 2 * (1 - this.normalCDF(zScore));
              confidenceLevel = (1 - pValue) * 100;
            }
          }
        }
        
        // Upsert metrics cache
        await db.insert(abMetricsCache).values({
          testId,
          variantId: variant.id,
          impressions,
          clicks,
          conversions,
          conversionRate: conversionRate.toString(),
          uplift: uplift.toString(),
          pValue: pValue.toString(),
          confidenceLevel: confidenceLevel.toString(),
          revenue: revenue.toString()
        }).onConflictDoUpdate({
          target: [abMetricsCache.testId, abMetricsCache.variantId],
          set: {
            impressions,
            clicks,
            conversions,
            conversionRate: conversionRate.toString(),
            uplift: uplift.toString(),
            pValue: pValue.toString(),
            confidenceLevel: confidenceLevel.toString(),
            revenue: revenue.toString(),
            calculatedAt: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error calculating test metrics:', error);
      throw error;
    }
  }

  // Helper function for normal CDF approximation
  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  }

  // ==================== CLIENT PORTAL OPERATIONS ====================
  
  async createClientAccount(data: any): Promise<any> {
    const [account] = await db.insert(clientAccounts).values(data).returning();
    return account;
  }

  async getClientAccount(id: string, tenantId: string): Promise<any | null> {
    const [account] = await db
      .select()
      .from(clientAccounts)
      .where(and(eq(clientAccounts.id, id), eq(clientAccounts.tenantId, tenantId)))
      .limit(1);
    return account || null;
  }

  async getClientAccountsByTenant(tenantId: string): Promise<any[]> {
    return db
      .select()
      .from(clientAccounts)
      .where(eq(clientAccounts.tenantId, tenantId))
      .orderBy(desc(clientAccounts.createdAt));
  }

  async updateClientAccount(id: string, tenantId: string, data: any): Promise<any> {
    const [updated] = await db
      .update(clientAccounts)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(clientAccounts.id, id), eq(clientAccounts.tenantId, tenantId)))
      .returning();
    return updated;
  }

  async createClientPortalUser(data: any): Promise<any> {
    // SECURITY: Check if email already exists globally across all tenants
    // Client portal emails are globally unique to prevent cross-tenant access
    const existing = await db.select()
      .from(clientPortalUsers)
      .where(eq(clientPortalUsers.email, data.email.toLowerCase()))
      .limit(1);
    
    if (existing.length > 0) {
      throw new Error('Email already in use by another client');
    }
    
    // Ensure email is stored in lowercase for consistency
    const [user] = await db.insert(clientPortalUsers).values({
      ...data,
      email: data.email.toLowerCase(),
    }).returning();
    return user;
  }

  async getClientPortalUserByEmail(email: string): Promise<any | null> {
    const [user] = await db
      .select()
      .from(clientPortalUsers)
      .where(eq(clientPortalUsers.email, email.toLowerCase()))
      .limit(1);
    return user || null;
  }

  async getClientPortalUsers(clientAccountId: string, tenantId: string): Promise<any[]> {
    return db
      .select()
      .from(clientPortalUsers)
      .where(and(
        eq(clientPortalUsers.clientAccountId, clientAccountId),
        eq(clientPortalUsers.tenantId, tenantId)
      ))
      .orderBy(desc(clientPortalUsers.createdAt));
  }

  async updateClientPortalUser(
    id: string,
    tenantId: string,
    clientAccountId: string,
    data: any
  ): Promise<any> {
    const existing = await db.select().from(clientPortalUsers)
      .where(and(
        eq(clientPortalUsers.id, id),
        eq(clientPortalUsers.tenantId, tenantId),
        eq(clientPortalUsers.clientAccountId, clientAccountId)
      ))
      .limit(1);
    
    if (!existing.length) {
      throw new Error('Client user not found or access denied');
    }
    
    const [updated] = await db
      .update(clientPortalUsers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clientPortalUsers.id, id))
      .returning();
    return updated;
  }

  async createClientSession(data: {clientUserId: string, clientAccountId: string, tenantId: string}): Promise<{sessionId: string, expiresAt: Date}> {
    const user = await db.select().from(clientPortalUsers)
      .where(and(
        eq(clientPortalUsers.id, data.clientUserId),
        eq(clientPortalUsers.clientAccountId, data.clientAccountId),
        eq(clientPortalUsers.tenantId, data.tenantId)
      ))
      .limit(1);
    
    if (!user.length) {
      throw new Error('Invalid client user or account mismatch');
    }
    
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(clientPortalSessions).values({
      id: sessionId,
      clientUserId: data.clientUserId,
      clientAccountId: data.clientAccountId,
      tenantId: data.tenantId,
      expiresAt
    });

    return { sessionId, expiresAt };
  }

  async validateClientSession(sessionId: string): Promise<{clientUserId: string, clientAccountId: string, tenantId: string} | null> {
    const session = await db.select({
      session: clientPortalSessions,
      user: clientPortalUsers,
      account: clientAccounts,
    })
      .from(clientPortalSessions)
      .innerJoin(clientPortalUsers, eq(clientPortalSessions.clientUserId, clientPortalUsers.id))
      .innerJoin(clientAccounts, eq(clientPortalSessions.clientAccountId, clientAccounts.id))
      .where(eq(clientPortalSessions.id, sessionId))
      .limit(1);
    
    if (!session.length) return null;
    
    const { session: s, user, account } = session[0];
    
    if (s.tenantId !== user.tenantId || 
        s.tenantId !== account.tenantId ||
        s.clientAccountId !== user.clientAccountId ||
        s.clientAccountId !== account.id) {
      throw new Error('Session data integrity violation');
    }
    
    if (s.expiresAt < new Date()) {
      await this.deleteClientSession(sessionId);
      return null;
    }

    return {
      clientUserId: s.clientUserId,
      clientAccountId: s.clientAccountId,
      tenantId: s.tenantId
    };
  }

  async deleteClientSession(sessionId: string): Promise<void> {
    await db.delete(clientPortalSessions).where(eq(clientPortalSessions.id, sessionId));
  }

  // ==================== CLIENT DELIVERABLES ====================
  async getClientDeliverables(clientAccountId: string, tenantId: string, projectId?: string): Promise<any[]> {
    const { clientDeliverables } = await import("@shared/schema");
    
    let query = db.select().from(clientDeliverables)
      .where(and(
        eq(clientDeliverables.clientAccountId, clientAccountId),
        eq(clientDeliverables.tenantId, tenantId)
      ))
      .orderBy(desc(clientDeliverables.createdAt));
    
    if (projectId) {
      query = query.where(eq(clientDeliverables.projectId, projectId));
    }
    
    return await query;
  }

  async getClientDeliverable(id: string, clientAccountId: string, tenantId: string): Promise<any | null> {
    const { clientDeliverables } = await import("@shared/schema");
    
    const [deliverable] = await db.select().from(clientDeliverables)
      .where(and(
        eq(clientDeliverables.id, id),
        eq(clientDeliverables.clientAccountId, clientAccountId),
        eq(clientDeliverables.tenantId, tenantId)
      ))
      .limit(1);
    
    return deliverable || null;
  }

  async createClientDeliverable(data: any): Promise<any> {
    const { clientDeliverables } = await import("@shared/schema");
    
    const [deliverable] = await db.insert(clientDeliverables)
      .values(data)
      .returning();
    
    return deliverable;
  }

  async updateClientDeliverable(id: string, clientAccountId: string, tenantId: string, data: any): Promise<any> {
    const { clientDeliverables } = await import("@shared/schema");
    
    const [updated] = await db.update(clientDeliverables)
      .set(data)
      .where(and(
        eq(clientDeliverables.id, id),
        eq(clientDeliverables.clientAccountId, clientAccountId),
        eq(clientDeliverables.tenantId, tenantId)
      ))
      .returning();
    
    return updated;
  }

  // ==================== CLIENT MESSAGES ====================
  async getClientMessages(clientAccountId: string, tenantId: string, threadId?: string): Promise<any[]> {
    const { clientMessages } = await import("@shared/schema");
    
    let query = db.select().from(clientMessages)
      .where(and(
        eq(clientMessages.clientAccountId, clientAccountId),
        eq(clientMessages.tenantId, tenantId)
      ))
      .orderBy(desc(clientMessages.createdAt));
    
    if (threadId) {
      query = query.where(eq(clientMessages.threadId, threadId));
    }
    
    return await query;
  }

  async getClientMessage(id: string, clientAccountId: string, tenantId: string): Promise<any | null> {
    const { clientMessages } = await import("@shared/schema");
    
    const [message] = await db.select().from(clientMessages)
      .where(and(
        eq(clientMessages.id, id),
        eq(clientMessages.clientAccountId, clientAccountId),
        eq(clientMessages.tenantId, tenantId)
      ))
      .limit(1);
    
    return message || null;
  }

  async createClientMessage(data: any): Promise<any> {
    const { clientMessages } = await import("@shared/schema");
    
    const [message] = await db.insert(clientMessages)
      .values(data)
      .returning();
    
    return message;
  }

  async markMessageAsRead(id: string, clientAccountId: string, tenantId: string): Promise<void> {
    const { clientMessages } = await import("@shared/schema");
    
    await db.update(clientMessages)
      .set({ isRead: true, readAt: new Date() })
      .where(and(
        eq(clientMessages.id, id),
        eq(clientMessages.clientAccountId, clientAccountId),
        eq(clientMessages.tenantId, tenantId)
      ));
  }

  // ==================== CLIENT NOTIFICATIONS ====================
  async getClientNotifications(clientUserId: string, tenantId: string): Promise<any[]> {
    const { clientNotifications } = await import("@shared/schema");
    
    return await db.select().from(clientNotifications)
      .where(and(
        eq(clientNotifications.clientUserId, clientUserId),
        eq(clientNotifications.tenantId, tenantId)
      ))
      .orderBy(desc(clientNotifications.isRead), desc(clientNotifications.createdAt));
  }

  async markNotificationAsRead(id: string, clientUserId: string, tenantId: string): Promise<void> {
    const { clientNotifications } = await import("@shared/schema");
    
    await db.update(clientNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(
        eq(clientNotifications.id, id),
        eq(clientNotifications.clientUserId, clientUserId),
        eq(clientNotifications.tenantId, tenantId)
      ));
  }

  async markAllNotificationsAsRead(clientUserId: string, tenantId: string): Promise<void> {
    const { clientNotifications } = await import("@shared/schema");
    
    await db.update(clientNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(
        eq(clientNotifications.clientUserId, clientUserId),
        eq(clientNotifications.tenantId, tenantId),
        eq(clientNotifications.isRead, false)
      ));
  }

  async createClientNotification(data: any): Promise<any> {
    const { clientNotifications } = await import("@shared/schema");
    
    const [notification] = await db.insert(clientNotifications)
      .values(data)
      .returning();
    
    return notification;
  }

  // ==================== CLIENT PROJECT ACCESS ====================
  async getClientProjects(clientAccountId: string, tenantId: string): Promise<any[]> {
    const { clientProjectAccess } = await import("@shared/schema");
    
    const projectAccessList = await db.select({
      project: projects,
      accessLevel: clientProjectAccess.accessLevel,
    })
      .from(clientProjectAccess)
      .innerJoin(projects, eq(clientProjectAccess.projectId, projects.id))
      .where(and(
        eq(clientProjectAccess.clientAccountId, clientAccountId),
        eq(clientProjectAccess.tenantId, tenantId)
      ));
    
    return projectAccessList.map(item => ({
      ...item.project,
      accessLevel: item.accessLevel
    }));
  }

  async getClientProject(projectId: string, clientAccountId: string, tenantId: string): Promise<any | null> {
    const { clientProjectAccess } = await import("@shared/schema");
    
    const [result] = await db.select({
      project: projects,
      accessLevel: clientProjectAccess.accessLevel,
    })
      .from(clientProjectAccess)
      .innerJoin(projects, eq(clientProjectAccess.projectId, projects.id))
      .where(and(
        eq(clientProjectAccess.projectId, projectId),
        eq(clientProjectAccess.clientAccountId, clientAccountId),
        eq(clientProjectAccess.tenantId, tenantId)
      ))
      .limit(1);
    
    if (!result) return null;
    
    return {
      ...result.project,
      accessLevel: result.accessLevel
    };
  }

  // ==================== CLIENT INVOICE ACCESS ====================
  async getClientInvoices(clientAccountId: string, tenantId: string): Promise<any[]> {
    const { clientInvoiceAccess } = await import("@shared/schema");
    
    const invoiceAccessList = await db.select({
      invoice: invoices,
      accessLevel: clientInvoiceAccess.accessLevel,
    })
      .from(clientInvoiceAccess)
      .innerJoin(invoices, eq(clientInvoiceAccess.invoiceId, invoices.id))
      .where(and(
        eq(clientInvoiceAccess.clientAccountId, clientAccountId),
        eq(clientInvoiceAccess.tenantId, tenantId)
      ));
    
    return invoiceAccessList.map(item => ({
      ...item.invoice,
      accessLevel: item.accessLevel
    }));
  }

  async getClientInvoice(invoiceId: string, clientAccountId: string, tenantId: string): Promise<any | null> {
    const { clientInvoiceAccess } = await import("@shared/schema");
    
    const [result] = await db.select({
      invoice: invoices,
      accessLevel: clientInvoiceAccess.accessLevel,
    })
      .from(clientInvoiceAccess)
      .innerJoin(invoices, eq(clientInvoiceAccess.invoiceId, invoices.id))
      .where(and(
        eq(clientInvoiceAccess.invoiceId, invoiceId),
        eq(clientInvoiceAccess.clientAccountId, clientAccountId),
        eq(clientInvoiceAccess.tenantId, tenantId)
      ))
      .limit(1);
    
    if (!result) return null;
    
    return {
      ...result.invoice,
      accessLevel: result.accessLevel
    };
  }

  // ==================== RESOURCE MANAGEMENT - TEAM CAPACITY ====================
  async createTeamCapacity(data: InsertTeamCapacity): Promise<TeamCapacity> {
    const capacityWithTenant = {
      ...data,
      tenantId: this.tenantId
    };
    
    const [newCapacity] = await db.insert(teamCapacity).values(capacityWithTenant).returning();
    return newCapacity;
  }

  async getTeamCapacityByWeek(weekStartDate: string): Promise<TeamCapacity[]> {
    return await db.select().from(teamCapacity)
      .where(and(
        eq(teamCapacity.tenantId, this.tenantId),
        eq(teamCapacity.weekStartDate, weekStartDate)
      ))
      .orderBy(desc(teamCapacity.createdAt));
  }

  async getTeamCapacityByUser(userId: string, startDate?: string, endDate?: string): Promise<TeamCapacity[]> {
    const conditions = [
      eq(teamCapacity.tenantId, this.tenantId),
      eq(teamCapacity.userId, userId)
    ];
    
    if (startDate) {
      conditions.push(sql`${teamCapacity.weekStartDate} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${teamCapacity.weekStartDate} <= ${endDate}`);
    }
    
    return await db.select().from(teamCapacity)
      .where(and(...conditions))
      .orderBy(teamCapacity.weekStartDate);
  }

  async updateTeamCapacity(id: string, data: Partial<InsertTeamCapacity>): Promise<TeamCapacity | undefined> {
    const [updated] = await db.update(teamCapacity)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(teamCapacity.id, id),
        eq(teamCapacity.tenantId, this.tenantId)
      ))
      .returning();
    
    return updated;
  }

  async calculateUtilization(userId: string, weekStartDate: string): Promise<number> {
    const [capacity] = await db.select().from(teamCapacity)
      .where(and(
        eq(teamCapacity.tenantId, this.tenantId),
        eq(teamCapacity.userId, userId),
        eq(teamCapacity.weekStartDate, weekStartDate)
      ))
      .limit(1);
    
    if (!capacity || capacity.availableHours === 0) return 0;
    
    return Math.round((capacity.allocatedHours / capacity.availableHours) * 100);
  }

  // ==================== RESOURCE MANAGEMENT - EMPLOYEE SKILLS ====================
  async createEmployeeSkill(data: InsertEmployeeSkill): Promise<EmployeeSkill> {
    const skillWithTenant = {
      ...data,
      tenantId: this.tenantId
    };
    
    const [newSkill] = await db.insert(employeeSkills).values(skillWithTenant).returning();
    return newSkill;
  }

  async getEmployeeSkills(userId: string): Promise<EmployeeSkill[]> {
    return await db.select().from(employeeSkills)
      .where(and(
        eq(employeeSkills.tenantId, this.tenantId),
        eq(employeeSkills.userId, userId)
      ))
      .orderBy(desc(employeeSkills.proficiencyLevel), employeeSkills.skillName);
  }

  async updateEmployeeSkill(id: string, data: Partial<InsertEmployeeSkill>): Promise<EmployeeSkill | undefined> {
    const [updated] = await db.update(employeeSkills)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(employeeSkills.id, id),
        eq(employeeSkills.tenantId, this.tenantId)
      ))
      .returning();
    
    return updated;
  }

  async searchSkillsByCategory(category: string): Promise<EmployeeSkill[]> {
    return await db.select().from(employeeSkills)
      .where(and(
        eq(employeeSkills.tenantId, this.tenantId),
        eq(employeeSkills.skillCategory, category)
      ))
      .orderBy(employeeSkills.skillName);
  }

  async deleteEmployeeSkill(id: string): Promise<boolean> {
    const result = await db.delete(employeeSkills)
      .where(and(
        eq(employeeSkills.id, id),
        eq(employeeSkills.tenantId, this.tenantId)
      ));
    
    return result.rowCount > 0;
  }

  // ==================== RESOURCE MANAGEMENT - RESOURCE FORECASTS ====================
  async createResourceForecast(data: InsertResourceForecast): Promise<ResourceForecast> {
    const forecastWithTenant = {
      ...data,
      tenantId: this.tenantId
    };
    
    const [newForecast] = await db.insert(resourceForecasts).values(forecastWithTenant).returning();
    return newForecast;
  }

  async getResourceForecasts(filters?: { status?: string }): Promise<ResourceForecast[]> {
    const conditions = [eq(resourceForecasts.tenantId, this.tenantId)];
    
    if (filters?.status) {
      conditions.push(eq(resourceForecasts.status, filters.status));
    }
    
    return await db.select().from(resourceForecasts)
      .where(and(...conditions))
      .orderBy(desc(resourceForecasts.createdAt));
  }

  async getResourceForecast(id: string): Promise<ResourceForecast | undefined> {
    const [forecast] = await db.select().from(resourceForecasts)
      .where(and(
        eq(resourceForecasts.id, id),
        eq(resourceForecasts.tenantId, this.tenantId)
      ))
      .limit(1);
    
    return forecast;
  }

  async updateResourceForecast(id: string, data: Partial<InsertResourceForecast>): Promise<ResourceForecast | undefined> {
    const [updated] = await db.update(resourceForecasts)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(resourceForecasts.id, id),
        eq(resourceForecasts.tenantId, this.tenantId)
      ))
      .returning();
    
    return updated;
  }

  async deleteResourceForecast(id: string): Promise<boolean> {
    const result = await db.delete(resourceForecasts)
      .where(and(
        eq(resourceForecasts.id, id),
        eq(resourceForecasts.tenantId, this.tenantId)
      ));
    
    return result.rowCount > 0;
  }

  // ==================== RESOURCE MANAGEMENT - WORKLOAD SNAPSHOTS ====================
  async createWorkloadSnapshot(data: InsertWorkloadSnapshot): Promise<WorkloadSnapshot> {
    const snapshotWithTenant = {
      ...data,
      tenantId: this.tenantId
    };
    
    const [newSnapshot] = await db.insert(workloadSnapshots).values(snapshotWithTenant).returning();
    return newSnapshot;
  }

  async getWorkloadSnapshots(userId?: string, startDate?: string, endDate?: string): Promise<WorkloadSnapshot[]> {
    const conditions = [eq(workloadSnapshots.tenantId, this.tenantId)];
    
    if (userId) {
      conditions.push(eq(workloadSnapshots.userId, userId));
    }
    if (startDate) {
      conditions.push(sql`${workloadSnapshots.snapshotDate} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${workloadSnapshots.snapshotDate} <= ${endDate}`);
    }
    
    return await db.select().from(workloadSnapshots)
      .where(and(...conditions))
      .orderBy(desc(workloadSnapshots.snapshotDate));
  }

  async getWorkloadTrends(userId: string, days: number = 30): Promise<WorkloadSnapshot[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    return await db.select().from(workloadSnapshots)
      .where(and(
        eq(workloadSnapshots.tenantId, this.tenantId),
        eq(workloadSnapshots.userId, userId),
        sql`${workloadSnapshots.snapshotDate} >= ${startDate.toISOString().split('T')[0]}`
      ))
      .orderBy(workloadSnapshots.snapshotDate);
  }

  // ==================== RESOURCE MANAGEMENT - RESOURCE ALLOCATIONS ====================
  async getResourceAllocations(filters?: { 
    projectId?: string; 
    userId?: string; 
    startDate?: string; 
    endDate?: string; 
  }): Promise<ResourceAllocation[]> {
    const conditions = [eq(resourceAllocations.tenantId, this.tenantId)];
    
    if (filters?.projectId) {
      conditions.push(eq(resourceAllocations.projectId, filters.projectId));
    }
    if (filters?.userId) {
      conditions.push(eq(resourceAllocations.userId, filters.userId));
    }
    if (filters?.startDate) {
      conditions.push(sql`${resourceAllocations.startDate} >= ${filters.startDate}`);
    }
    if (filters?.endDate) {
      conditions.push(sql`${resourceAllocations.endDate} <= ${filters.endDate}`);
    }
    
    return await db.select().from(resourceAllocations)
      .where(and(...conditions))
      .orderBy(desc(resourceAllocations.startDate));
  }

  async createResourceAllocation(data: InsertResourceAllocation): Promise<ResourceAllocation> {
    const allocationWithTenant = {
      ...data,
      tenantId: this.tenantId
    };
    
    const [newAllocation] = await db.insert(resourceAllocations).values(allocationWithTenant).returning();
    return newAllocation;
  }

  async updateResourceAllocation(id: string, data: Partial<InsertResourceAllocation>): Promise<ResourceAllocation | undefined> {
    const [updated] = await db.update(resourceAllocations)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(resourceAllocations.id, id),
        eq(resourceAllocations.tenantId, this.tenantId)
      ))
      .returning();
    
    return updated;
  }

  async deleteResourceAllocation(id: string): Promise<boolean> {
    const result = await db.delete(resourceAllocations)
      .where(and(
        eq(resourceAllocations.id, id),
        eq(resourceAllocations.tenantId, this.tenantId)
      ));
    
    return result.rowCount > 0;
  }

  // ==================== RESOURCE MANAGEMENT - ALL SKILLS ====================
  async getAllSkills(): Promise<EmployeeSkill[]> {
    return await db.select().from(employeeSkills)
      .where(eq(employeeSkills.tenantId, this.tenantId))
      .orderBy(employeeSkills.skillName, desc(employeeSkills.proficiencyLevel));
  }

  // ==================== FUNNEL BUILDER OPERATIONS - TENANT ISOLATED ====================
  
  // AI Generation tracking
  async createAIGeneration(data: InsertAiGeneration): Promise<AiGeneration> {
    const generationWithTenant = {
      ...data,
      tenantId: this.tenantId
    };
    
    const [newGeneration] = await db.insert(aiGenerations).values(generationWithTenant).returning();
    return newGeneration;
  }
  
  // Funnel Project CRUD
  async createFunnelProject(data: InsertFunnelProject): Promise<FunnelProject> {
    const projectWithTenant = {
      ...data,
      tenantId: this.tenantId
    };
    
    const [newProject] = await db.insert(funnelProjects).values(projectWithTenant).returning();
    return newProject;
  }
  
  async getFunnelProjects(): Promise<FunnelProject[]> {
    return await db.select().from(funnelProjects)
      .where(eq(funnelProjects.tenantId, this.tenantId))
      .orderBy(desc(funnelProjects.createdAt));
  }
  
  async getFunnelProject(id: string): Promise<FunnelProject | null> {
    const [project] = await db.select().from(funnelProjects)
      .where(and(
        eq(funnelProjects.id, id),
        eq(funnelProjects.tenantId, this.tenantId)
      ));
    
    return project || null;
  }
  
  async updateFunnelProject(id: string, data: Partial<InsertFunnelProject>): Promise<FunnelProject> {
    const [updated] = await db.update(funnelProjects)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(funnelProjects.id, id),
        eq(funnelProjects.tenantId, this.tenantId)
      ))
      .returning();
    
    return updated;
  }
  
  async deleteFunnelProject(id: string): Promise<void> {
    await db.delete(funnelProjects)
      .where(and(
        eq(funnelProjects.id, id),
        eq(funnelProjects.tenantId, this.tenantId)
      ));
  }
  
  // Funnel Version CRUD
  async createFunnelVersion(data: InsertFunnelVersion): Promise<FunnelVersion> {
    const [newVersion] = await db.insert(funnelVersions).values(data).returning();
    return newVersion;
  }
  
  async getFunnelVersions(funnelId: string): Promise<FunnelVersion[]> {
    return await db.select().from(funnelVersions)
      .where(eq(funnelVersions.funnelId, funnelId))
      .orderBy(desc(funnelVersions.versionNumber));
  }
  
  async getFunnelVersion(id: string): Promise<FunnelVersion | null> {
    const [version] = await db.select().from(funnelVersions)
      .where(eq(funnelVersions.id, id));
    
    return version || null;
  }
  
  // Funnel Steps (bulk operations for efficiency)
  async createFunnelSteps(steps: InsertFunnelStep[]): Promise<FunnelStep[]> {
    if (steps.length === 0) return [];
    return await db.insert(funnelSteps).values(steps).returning();
  }
  
  async getFunnelSteps(versionId: string): Promise<FunnelStep[]> {
    return await db.select().from(funnelSteps)
      .where(eq(funnelSteps.versionId, versionId))
      .orderBy(funnelSteps.orderIndex);
  }
  
  // Landing Pages
  async createLandingPage(data: InsertLandingPage): Promise<LandingPage> {
    const [newPage] = await db.insert(landingPages).values(data).returning();
    return newPage;
  }
  
  async updateLandingPage(id: string, data: Partial<InsertLandingPage>): Promise<LandingPage> {
    const [updated] = await db.update(landingPages)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(landingPages.id, id))
      .returning();
    
    return updated;
  }
  
  async getLandingPage(stepId: string): Promise<LandingPage | null> {
    const [page] = await db.select().from(landingPages)
      .where(eq(landingPages.stepId, stepId));
    
    return page || null;
  }
  
  // Funnel Ads (bulk operations)
  async createFunnelAds(ads: InsertFunnelAd[]): Promise<FunnelAd[]> {
    if (ads.length === 0) return [];
    return await db.insert(funnelAds).values(ads).returning();
  }
  
  async getFunnelAds(versionId: string): Promise<FunnelAd[]> {
    return await db.select().from(funnelAds)
      .where(eq(funnelAds.versionId, versionId));
  }
  
  // Funnel Emails (bulk operations)
  async createFunnelEmails(emails: InsertFunnelEmail[]): Promise<FunnelEmail[]> {
    if (emails.length === 0) return [];
    return await db.insert(funnelEmails).values(emails).returning();
  }
  
  async getFunnelEmails(versionId: string): Promise<FunnelEmail[]> {
    return await db.select().from(funnelEmails)
      .where(eq(funnelEmails.versionId, versionId))
      .orderBy(funnelEmails.sequenceOrder);
  }
  
  // Automation Workflows
  async createAutomationWorkflow(data: InsertFunnelAutomationWorkflow): Promise<FunnelAutomationWorkflow> {
    const [newWorkflow] = await db.insert(funnelAutomationWorkflows).values(data).returning();
    return newWorkflow;
  }
  
  async getAutomationWorkflows(versionId: string): Promise<FunnelAutomationWorkflow[]> {
    return await db.select().from(funnelAutomationWorkflows)
      .where(eq(funnelAutomationWorkflows.versionId, versionId));
  }
  
  // Funnel Publishing
  async publishFunnel(data: InsertFunnelPublication): Promise<FunnelPublication> {
    const [publication] = await db.insert(funnelPublications).values(data).returning();
    return publication;
  }
  
  async getFunnelPublication(funnelId: string): Promise<FunnelPublication | null> {
    const [publication] = await db.select().from(funnelPublications)
      .where(and(
        eq(funnelPublications.funnelId, funnelId),
        eq(funnelPublications.status, 'active')
      ))
      .orderBy(desc(funnelPublications.publishedAt))
      .limit(1);
    
    return publication || null;
  }
  
  async updateFunnelPublication(id: string, data: Partial<InsertFunnelPublication>): Promise<FunnelPublication> {
    const [updated] = await db.update(funnelPublications)
      .set(data)
      .where(eq(funnelPublications.id, id))
      .returning();
    
    return updated;
  }
  
  // Funnel Analytics
  async getFunnelAnalytics(funnelId: string, startDate?: Date, endDate?: Date): Promise<{
    totalVisitors: number;
    totalConversions: number;
    conversionRate: number;
    revenue: number;
    stepMetrics: FunnelStepMetric[];
  }> {
    // Get the active version of the funnel
    const funnel = await this.getFunnelProject(funnelId);
    if (!funnel || !funnel.activeVersionId) {
      return {
        totalVisitors: 0,
        totalConversions: 0,
        conversionRate: 0,
        revenue: 0,
        stepMetrics: []
      };
    }
    
    // Get all steps for the active version
    const steps = await this.getFunnelSteps(funnel.activeVersionId);
    const stepIds = steps.map(s => s.id);
    
    if (stepIds.length === 0) {
      return {
        totalVisitors: 0,
        totalConversions: 0,
        conversionRate: 0,
        revenue: 0,
        stepMetrics: []
      };
    }
    
    // Build query conditions
    const conditions = [
      sql`${funnelStepMetrics.stepId} IN (${sql.join(stepIds.map(id => sql`${id}`), sql`, `)})`,
      eq(funnelStepMetrics.tenantId, this.tenantId)
    ];
    
    if (startDate) {
      conditions.push(sql`${funnelStepMetrics.date} >= ${startDate.toISOString().split('T')[0]}`);
    }
    if (endDate) {
      conditions.push(sql`${funnelStepMetrics.date} <= ${endDate.toISOString().split('T')[0]}`);
    }
    
    // Get metrics
    const metrics = await db.select().from(funnelStepMetrics)
      .where(and(...conditions));
    
    // Calculate totals
    const totalVisitors = metrics.reduce((sum, m) => sum + (m.visitors || 0), 0);
    const totalConversions = metrics.reduce((sum, m) => sum + (m.conversions || 0), 0);
    const revenue = metrics.reduce((sum, m) => sum + parseFloat(m.revenue || '0'), 0);
    const conversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0;
    
    return {
      totalVisitors,
      totalConversions,
      conversionRate,
      revenue,
      stepMetrics: metrics
    };
  }
  
  // Complete funnel with all relations
  async getCompleteFunnel(funnelId: string): Promise<{
    funnel: FunnelProject;
    version: FunnelVersion;
    steps: FunnelStep[];
    landingPages: LandingPage[];
    ads: FunnelAd[];
    emails: FunnelEmail[];
    workflows: FunnelAutomationWorkflow[];
  } | null> {
    // Get funnel project
    const funnel = await this.getFunnelProject(funnelId);
    if (!funnel || !funnel.activeVersionId) {
      return null;
    }
    
    // Get active version
    const version = await this.getFunnelVersion(funnel.activeVersionId);
    if (!version) {
      return null;
    }
    
    // Get all related data in parallel
    const [steps, ads, emails, workflows] = await Promise.all([
      this.getFunnelSteps(version.id),
      this.getFunnelAds(version.id),
      this.getFunnelEmails(version.id),
      this.getAutomationWorkflows(version.id)
    ]);
    
    // Get landing pages for each step
    const landingPages = await Promise.all(
      steps.map(step => this.getLandingPage(step.id))
    ).then(pages => pages.filter(p => p !== null) as LandingPage[]);
    
    return {
      funnel,
      version,
      steps,
      landingPages,
      ads,
      emails,
      workflows
    };
  }
}