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
  leads, contacts, accounts, deals, tasks, employees, appointments, campaigns, tickets, projects, invoices, users, tenants, taxRates, salesChannels,
  aiContents, aiCampaigns, aiUsage
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

export class DatabaseStorage implements IStorage {
  public userEmail: string;
  public tenantId: string;
  public isPlatformOwner: boolean;

  constructor(userEmail: string = '', tenantId: string = '', isPlatformOwner: boolean = false) {
    this.userEmail = userEmail;
    // Validate and correct tenant ID format
    if (tenantId && !this.isValidUUID(tenantId)) {
      console.log(`Invalid tenantId format: ${tenantId}, using fallback UUID`);
      this.tenantId = isPlatformOwner ? '00000000-0000-0000-0000-000000000001' : '00000000-0000-0000-0000-000000000002';
    } else {
      this.tenantId = tenantId || '00000000-0000-0000-0000-000000000002';
    }
    this.isPlatformOwner = isPlatformOwner;
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // ================== CONTACT OPERATIONS ==================
  async getContacts(): Promise<Contact[]> {
    if (this.isPlatformOwner && (this.userEmail === 'admin@default.com' || this.userEmail === 'abel@argilette.org')) {
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
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
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
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
      updateQuery = updateQuery.where(eq(contacts.tenantId, this.tenantId));
    }
    
    const [updatedContact] = await updateQuery.returning();
    return updatedContact || undefined;
  }

  async deleteContact(id: string): Promise<boolean> {
    let deleteQuery = db.delete(contacts).where(eq(contacts.id, id));
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
      deleteQuery = deleteQuery.where(eq(contacts.tenantId, this.tenantId));
    }
    
    const result = await deleteQuery;
    return result.rowCount > 0;
  }

  // ================== ACCOUNT OPERATIONS ==================
  async getAccounts(): Promise<Account[]> {
    if (this.isPlatformOwner && (this.userEmail === 'admin@default.com' || this.userEmail === 'abel@argilette.org')) {
      return db.select().from(accounts).orderBy(desc(accounts.createdAt));
    } else {
      return db.select().from(accounts)
        .where(eq(accounts.tenantId, this.tenantId))
        .orderBy(desc(accounts.createdAt));
    }
  }

  async getAccount(id: string): Promise<Account | undefined> {
    let query = db.select().from(accounts).where(eq(accounts.id, id));
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
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
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
      updateQuery = updateQuery.where(eq(accounts.tenantId, this.tenantId));
    }
    
    const [updatedAccount] = await updateQuery.returning();
    return updatedAccount || undefined;
  }

  async deleteAccount(id: string): Promise<boolean> {
    let deleteQuery = db.delete(accounts).where(eq(accounts.id, id));
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
      deleteQuery = deleteQuery.where(eq(accounts.tenantId, this.tenantId));
    }
    
    const result = await deleteQuery;
    return result.rowCount > 0;
  }

  // ================== LEAD OPERATIONS ==================
  async getLeads(): Promise<Lead[]> {
    if (this.isPlatformOwner && (this.userEmail === 'admin@default.com' || this.userEmail === 'abel@argilette.org')) {
      return db.select().from(leads).orderBy(desc(leads.createdAt));
    } else {
      return db.select().from(leads)
        .where(eq(leads.tenantId, this.tenantId))
        .orderBy(desc(leads.createdAt));
    }
  }

  async getLead(id: string): Promise<Lead | undefined> {
    let query = db.select().from(leads).where(eq(leads.id, id));
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
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
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
      updateQuery = updateQuery.where(eq(leads.tenantId, this.tenantId));
    }
    
    const [updatedLead] = await updateQuery.returning();
    return updatedLead || undefined;
  }

  async deleteLead(id: string): Promise<boolean> {
    let deleteQuery = db.delete(leads).where(eq(leads.id, parseInt(id)));
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
      deleteQuery = deleteQuery.where(eq(leads.tenantId, this.tenantId));
    }
    
    const result = await deleteQuery;
    return result.rowCount > 0;
  }

  // ================== DEAL OPERATIONS ==================
  async getDeals(): Promise<Deal[]> {
    if (this.isPlatformOwner && (this.userEmail === 'admin@default.com' || this.userEmail === 'abel@argilette.org')) {
      return db.select().from(deals).orderBy(desc(deals.createdAt));
    } else {
      return db.select().from(deals)
        .where(eq(deals.tenantId, this.tenantId))
        .orderBy(desc(deals.createdAt));
    }
  }

  async getDeal(id: string): Promise<Deal | undefined> {
    let query = db.select().from(deals).where(eq(deals.id, id));
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
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
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
      updateQuery = updateQuery.where(eq(deals.tenantId, this.tenantId));
    }
    
    const [updatedDeal] = await updateQuery.returning();
    return updatedDeal || undefined;
  }

  async deleteDeal(id: string): Promise<boolean> {
    let deleteQuery = db.delete(deals).where(eq(deals.id, parseInt(id)));
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
      deleteQuery = deleteQuery.where(eq(deals.tenantId, this.tenantId));
    }
    
    const result = await deleteQuery;
    return result.rowCount > 0;
  }

  // ================== TASK OPERATIONS ==================
  async getTasks(): Promise<Task[]> {
    if (this.isPlatformOwner && (this.userEmail === 'admin@default.com' || this.userEmail === 'abel@argilette.org')) {
      return db.select().from(tasks).orderBy(desc(tasks.createdAt));
    } else {
      return db.select().from(tasks)
        .where(eq(tasks.tenantId, this.tenantId))
        .orderBy(desc(tasks.createdAt));
    }
  }

  async getTask(id: string): Promise<Task | undefined> {
    let query = db.select().from(tasks).where(eq(tasks.id, id));
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
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
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
      updateQuery = updateQuery.where(eq(tasks.tenantId, this.tenantId));
    }
    
    const [updatedTask] = await updateQuery.returning();
    return updatedTask || undefined;
  }

  async deleteTask(id: string): Promise<boolean> {
    let deleteQuery = db.delete(tasks).where(eq(tasks.id, parseInt(id)));
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
      deleteQuery = deleteQuery.where(eq(tasks.tenantId, this.tenantId));
    }
    
    const result = await deleteQuery;
    return result.rowCount > 0;
  }

  // ================== TICKET OPERATIONS ==================
  async getTickets(): Promise<Ticket[]> {
    if (this.isPlatformOwner && (this.userEmail === 'admin@default.com' || this.userEmail === 'abel@argilette.org')) {
      return db.select().from(tickets).orderBy(desc(tickets.createdAt));
    } else {
      return db.select().from(tickets)
        .where(eq(tickets.tenantId, this.tenantId))
        .orderBy(desc(tickets.createdAt));
    }
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    let query = db.select().from(tickets).where(eq(tickets.id, id));
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
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
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
      updateQuery = updateQuery.where(eq(tickets.tenantId, this.tenantId));
    }
    
    const [updatedTicket] = await updateQuery.returning();
    return updatedTicket || undefined;
  }

  async deleteTicket(id: string): Promise<boolean> {
    let deleteQuery = db.delete(tickets).where(eq(tickets.id, id));
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
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
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
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
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
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
      if (user.email === 'abel@argilette.org') {
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
    if (this.isPlatformOwner && (this.userEmail === 'admin@default.com' || this.userEmail === 'abel@argilette.org')) {
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
    if (this.isPlatformOwner && (this.userEmail === 'admin@default.com' || this.userEmail === 'abel@argilette.org')) {
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
    if (this.isPlatformOwner && (this.userEmail === 'admin@default.com' || this.userEmail === 'abel@argilette.org')) {
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
    if (this.isPlatformOwner && (this.userEmail === 'admin@default.com' || this.userEmail === 'abel@argilette.org')) {
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
    if (this.isPlatformOwner && (this.userEmail === 'admin@default.com' || this.userEmail === 'abel@argilette.org')) {
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
    if (this.isPlatformOwner && (this.userEmail === 'admin@default.com' || this.userEmail === 'abel@argilette.org')) {
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
    return new DatabaseStorage();
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
    throw new Error("Not implemented yet");
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
    if (this.isPlatformOwner && (this.userEmail === 'admin@default.com' || this.userEmail === 'abel@argilette.org')) {
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
    if (this.isPlatformOwner && (this.userEmail === 'admin@default.com' || this.userEmail === 'abel@argilette.org')) {
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
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
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
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
      updateQuery = updateQuery.where(eq(stores.tenantId, this.tenantId));
    }
    
    const [updatedStore] = await updateQuery.returning();
    return updatedStore || undefined;
  }

  async deleteStore(id: string): Promise<boolean> {
    let deleteQuery = db.delete(stores).where(eq(stores.id, id));
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
      deleteQuery = deleteQuery.where(eq(stores.tenantId, this.tenantId));
    }
    
    const result = await deleteQuery;
    return result.rowCount > 0;
  }

  // Order operations  
  async getOrders(filters?: { storeId?: string; status?: string; limit?: number }): Promise<EcommerceOrder[]> {
    let query = db.select().from(ecommerceOrders);
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
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
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
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
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
      updateQuery = updateQuery.where(eq(ecommerceOrders.tenantId, this.tenantId));
    }
    
    const [updatedOrder] = await updateQuery.returning();
    return updatedOrder || undefined;
  }

  async deleteOrder(id: string): Promise<boolean> {
    let deleteQuery = db.delete(ecommerceOrders).where(eq(ecommerceOrders.id, id));
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
      deleteQuery = deleteQuery.where(eq(ecommerceOrders.tenantId, this.tenantId));
    }
    
    const result = await deleteQuery;
    return result.rowCount > 0;
  }

  // Customer operations
  async getCustomers(storeId?: string): Promise<Customer[]> {
    let query = db.select().from(customers);
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
      query = query.where(eq(customers.tenantId, this.tenantId));
    }

    if (storeId) {
      query = query.where(eq(customers.storeId, storeId));
    }

    return await query.orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    let query = db.select().from(customers).where(eq(customers.id, id));
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
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
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
      updateQuery = updateQuery.where(eq(customers.tenantId, this.tenantId));
    }
    
    const [updatedCustomer] = await updateQuery.returning();
    return updatedCustomer || undefined;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    let deleteQuery = db.delete(customers).where(eq(customers.id, id));
    
    if (!this.isPlatformOwner || (this.userEmail !== 'admin@default.com' && this.userEmail !== 'abel@argilette.org')) {
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
}