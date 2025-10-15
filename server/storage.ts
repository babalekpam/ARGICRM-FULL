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
  type ChartOfAccount, type InsertChartOfAccount,
  type FinancialTransaction, type InsertFinancialTransaction,
  type Currency, type InsertCurrency,
  type Budget, type InsertBudget,
  type InvoiceGeneration, type InsertInvoiceGeneration,
  type InvoiceLineItem, type InsertInvoiceLineItem,
  type FinancialReport, type InsertFinancialReport,
  type BankAccount, type InsertBankAccount,
  type BankStatement, type InsertBankStatement,
  type BankTransaction, type InsertBankTransaction,
  type TaxCategory, type InsertTaxCategory,
  type TaxReturn, type InsertTaxReturn,
  type TaxDeduction, type InsertTaxDeduction,
  type TaxCompliance, type InsertTaxCompliance,
  type TaxRate, type InsertTaxRate,
  type Tenant, type InsertTenant,
  type TenantSubscription, type InsertTenantSubscription,
  type SystemMetric, type InsertSystemMetric,
  type Product, type InsertProduct,
  type SalesChannel, type InsertSalesChannel,
  type AIContent, type InsertAIContent,
  type AICampaign, type InsertAICampaign,
  type AIUsage, type InsertAIUsage,
  leads, contacts, accounts, deals, tasks, employees, campaigns, tickets, projects, invoices,
  tenants, users, tenantSubscriptions, auditLogs, systemMetrics, salesChannels,
  aiContents, aiCampaigns, aiUsage,
  customerJourneyStages, customerJourneyEvents, customerJourneyMilestones, customerJourneyProgress, journeyAnalytics
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Contact operations
  getContacts(): Promise<Contact[]>;
  getContact(id: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: string): Promise<boolean>;
  
  // Multi-tenant operations
  getTenantByDomain(domain: string): Promise<any>;
  createTenant(tenant: any): Promise<any>;
  updateTenant(id: string, tenant: any): Promise<any>;
  getUserByEmailAndTenant(email: string, tenantId: string): Promise<any>;
  getUserWithPermissions(userId: string): Promise<any>;
  createUser(user: any): Promise<any>;
  updateUser(id: string, user: any): Promise<any>;
  updateUserLastLogin(id: string): Promise<void>;
  
  // Registration system methods
  getUserByEmail(email: string): Promise<any>;
  createRegisteredUser(user: any): Promise<any>;
  getUserByVerificationToken(token: string): Promise<any>;
  verifyUser(userId: string): Promise<void>;
  getAllRegisteredUsers(): Promise<any[]>;
  
  getUsersByTenant(tenantId: string): Promise<any[]>;
  getUserCountByTenant(tenantId: string): Promise<number>;
  getContactCountByTenant(tenantId: string): Promise<number>;
  getDealCountByTenant(tenantId: string): Promise<number>;
  getRecentActivityByTenant(tenantId: string, limit: number): Promise<any[]>;
  createDefaultRoles(tenantId: string): Promise<void>;
  getRolesByTenant(tenantId: string): Promise<any[]>;
  createRole(role: any): Promise<any>;
  updateRole(id: string, role: any): Promise<any>;
  deleteRole(id: string): Promise<boolean>;
  getRole(id: string): Promise<any>;
  getAllPermissions(): Promise<any[]>;

  // Account operations
  getAccounts(): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;

  // Lead operations
  getLeads(): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  convertLead(id: number, contactData?: any, accountData?: any, dealData?: any): Promise<any>;

  // Deal operations
  getDeals(): Promise<Deal[]>;
  getDeal(id: number): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: number, deal: Partial<InsertDeal>): Promise<Deal | undefined>;
  deleteDeal(id: number): Promise<boolean>;

  // Task operations
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;

  // Campaign operations
  getCampaigns(): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: number): Promise<boolean>;

  // Ticket operations
  getTickets(): Promise<Ticket[]>;
  getTicket(id: number): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, ticket: Partial<InsertTicket>): Promise<Ticket | undefined>;
  deleteTicket(id: number): Promise<boolean>;

  // Project operations
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Invoice operations
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;

  // Employee operations
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;

  // Sales Channel operations - TENANT ISOLATED
  getSalesChannelsByTenant(tenantId: string): Promise<SalesChannel[]>;
  getSalesChannel(id: string, tenantId: string): Promise<SalesChannel | undefined>;
  createSalesChannel(salesChannel: InsertSalesChannel): Promise<SalesChannel>;
  updateSalesChannel(id: string, salesChannel: Partial<InsertSalesChannel>): Promise<SalesChannel | undefined>;
  deleteSalesChannel(id: string, tenantId: string): Promise<boolean>;

  // AI Content operations - TENANT ISOLATED
  getAIContentsByTenant(tenantId: string, filters?: { type?: string; status?: string; channel?: string }): Promise<AIContent[]>;
  getAIContent(id: string, tenantId: string): Promise<AIContent | undefined>;
  createAIContent(content: InsertAIContent): Promise<AIContent>;
  updateAIContent(id: string, content: Partial<InsertAIContent>): Promise<AIContent | undefined>;
  deleteAIContent(id: string, tenantId: string): Promise<boolean>;

  // AI Campaign operations - TENANT ISOLATED
  getAICampaignsByTenant(tenantId: string): Promise<AICampaign[]>;
  getAICampaign(id: string, tenantId: string): Promise<AICampaign | undefined>;
  createAICampaign(campaign: InsertAICampaign): Promise<AICampaign>;
  updateAICampaign(id: string, campaign: Partial<InsertAICampaign>): Promise<AICampaign | undefined>;
  deleteAICampaign(id: string, tenantId: string): Promise<boolean>;

  // AI Usage tracking - TENANT ISOLATED
  getAIUsageByTenant(tenantId: string, filters?: { provider?: string; startDate?: Date; endDate?: Date }): Promise<AIUsage[]>;
  createAIUsage(usage: InsertAIUsage): Promise<AIUsage>;
  getTenantAIUsageStats(tenantId: string): Promise<{ totalCost: number; totalTokens: number; byProvider: Record<string, number> }>;

  // Appointment operations
  getAppointments(): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;

  // Sentiment Analysis operations
  getSentimentAnalyses(): Promise<SentimentAnalysis[]>;
  getSentimentAnalysis(id: number): Promise<SentimentAnalysis | undefined>;
  createSentimentAnalysis(analysis: InsertSentimentAnalysis): Promise<SentimentAnalysis>;
  updateSentimentAnalysis(id: number, analysis: Partial<InsertSentimentAnalysis>): Promise<SentimentAnalysis | undefined>;
  deleteSentimentAnalysis(id: number): Promise<boolean>;

  // Financial operations
  getChartOfAccounts(): Promise<ChartOfAccount[]>;
  getChartOfAccount(id: number): Promise<ChartOfAccount | undefined>;
  createChartOfAccount(account: InsertChartOfAccount): Promise<ChartOfAccount>;
  updateChartOfAccount(id: number, account: Partial<InsertChartOfAccount>): Promise<ChartOfAccount | undefined>;
  deleteChartOfAccount(id: number): Promise<boolean>;
  
  // Bank account linking operations
  linkBankAccountToChart(bankAccountId: number, chartAccountId: number): Promise<boolean>;
  unlinkBankAccount(bankAccountId: number): Promise<boolean>;
  getLinkedChartAccount(bankAccountId: number): Promise<number | null>;
  getAllBankAccountLinks(): Promise<Map<number, number>>;
  
  getFinancialTransactions(): Promise<FinancialTransaction[]>;
  getFinancialTransaction(id: number): Promise<FinancialTransaction | undefined>;
  createFinancialTransaction(transaction: InsertFinancialTransaction): Promise<FinancialTransaction>;
  updateFinancialTransaction(id: number, transaction: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction | undefined>;
  deleteFinancialTransaction(id: number): Promise<boolean>;
  getFinancialTransactionsByAccount(accountId: number): Promise<FinancialTransaction[]>;
  getFinancialTransactionsByDateRange(startDate: Date, endDate: Date): Promise<FinancialTransaction[]>;
  
  getCurrencies(): Promise<Currency[]>;
  getCurrency(id: number): Promise<Currency | undefined>;
  createCurrency(currency: InsertCurrency): Promise<Currency>;
  updateCurrency(id: number, currency: Partial<InsertCurrency>): Promise<Currency | undefined>;
  deleteCurrency(id: number): Promise<boolean>;

  // Tax Rate operations (using generic types for compatibility)
  getTaxRates(): Promise<any[]>;
  getTaxRate(id: number): Promise<any>;
  createTaxRate(taxRate: any): Promise<any>;
  updateTaxRate(id: number, taxRate: any): Promise<any>;
  deleteTaxRate(id: number): Promise<boolean>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Order operations
  getOrders(filters?: { storeId?: string; status?: string; limit?: number }): Promise<any[]>;
  getOrder(id: string): Promise<any | undefined>;
  createOrder(order: any): Promise<any>;
  updateOrder(id: string, order: any): Promise<any | undefined>;
  deleteOrder(id: string): Promise<boolean>;

  // Customer operations
  getCustomers(storeId?: string): Promise<any[]>;
  getCustomer(id: string): Promise<any | undefined>;
  createCustomer(customer: any): Promise<any>;
  updateCustomer(id: string, customer: any): Promise<any | undefined>;
  deleteCustomer(id: string): Promise<boolean>;

  // Store operations
  getAllStores(): Promise<any[]>;
  getStores(): Promise<any[]>;
  getStore(id: string): Promise<any | undefined>;
  getStoreStats(id: string): Promise<any>;
  createStore(store: any): Promise<any>;
  updateStore(id: string, store: any): Promise<any | undefined>;
  deleteStore(id: string): Promise<boolean>;

  // Category operations
  getCategories(storeId?: number): Promise<any[]>;
  getCategory(id: number): Promise<any | undefined>;
  createCategory(category: any): Promise<any>;
  updateCategory(id: number, category: any): Promise<any | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Review operations
  getReviews(productId?: number): Promise<any[]>;
  getReview(id: number): Promise<any | undefined>;
  createReview(review: any): Promise<any>;
  updateReview(id: number, review: any): Promise<any | undefined>;
  deleteReview(id: number): Promise<boolean>;

  // Coupon operations
  getCoupons(storeId?: number): Promise<any[]>;
  getCoupon(id: number): Promise<any | undefined>;
  createCoupon(coupon: any): Promise<any>;
  updateCoupon(id: number, coupon: any): Promise<any | undefined>;
  deleteCoupon(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  // Core data maps with string IDs for multi-tenant
  private contacts: Map<string, Contact>;
  private accounts: Map<string, Account>;
  private leads: Map<string, Lead>;
  private deals: Map<string, Deal>;
  private tasks: Map<string, Task>;
  private campaigns: Map<string, Campaign>;
  private tickets: Map<string, Ticket>;
  
  // Multi-tenant data maps
  private tenants: Map<string, any> = new Map();
  private users: Map<string, any> = new Map();
  private registeredUsers: Map<string, any> = new Map();
  private verificationTokens: Map<string, string> = new Map(); // token -> userId
  private roles: Map<string, any> = new Map();
  private userRoles: Map<string, any> = new Map();
  private permissions: Map<string, any> = new Map();
  private projects: Map<number, Project>;
  private invoices: Map<number, Invoice>;
  public employees: Map<number, Employee>;
  private appointments: Map<number, Appointment>;
  private sentimentAnalyses: Map<number, SentimentAnalysis>;

  // Financial data maps
  private chartOfAccountsMap: Map<number, ChartOfAccount>;
  private financialTransactionsMap: Map<number, FinancialTransaction>;
  private currenciesMap: Map<number, Currency>;
  private taxRatesMap: Map<number, any>;
  private bankAccountLinks: Map<number, number>;

  // ID counters
  private currentContactId: number;
  private currentAccountId: number;
  private currentLeadId: number;
  private currentDealId: number;
  private currentTaskId: number;
  private currentCampaignId: number;
  private currentTicketId: number;
  private currentProjectId: number;
  private currentInvoiceId: number;
  private currentEmployeeId: number;
  private currentAppointmentId: number;
  private currentAnalysisId: number;
  private currentChartAccountId: number;
  private currentFinancialTransactionId: number;
  private currentCurrencyId: number;
  private currentTaxRateId: number;

  constructor() {
    console.log('MemStorage constructor called');
    // Initialize core data maps
    this.contacts = new Map();
    this.accounts = new Map();
    this.leads = new Map();
    this.deals = new Map();
    this.tasks = new Map();
    this.campaigns = new Map();
    this.tickets = new Map();
    this.projects = new Map();
    this.invoices = new Map();
    this.employees = new Map();
    this.appointments = new Map();
    this.sentimentAnalyses = new Map();

    // Initialize financial data maps
    this.chartOfAccountsMap = new Map();
    this.financialTransactionsMap = new Map();
    this.currenciesMap = new Map();
    this.taxRatesMap = new Map();
    this.bankAccountLinks = new Map();
    this.bankAccountLinks = new Map();



    // Initialize ID counters
    this.currentContactId = 1;
    this.currentAccountId = 1;
    this.currentLeadId = 1;
    this.currentDealId = 1;
    this.currentTaskId = 1;
    this.currentCampaignId = 1;
    this.currentTicketId = 1;
    this.currentProjectId = 1;
    this.currentInvoiceId = 1;
    this.currentEmployeeId = 1;
    this.currentAppointmentId = 1;
    this.currentAnalysisId = 1;
    this.currentChartAccountId = 1;
    this.currentFinancialTransactionId = 1;
    this.currentCurrencyId = 1;
    this.currentTaxRateId = 1;

    // Create test users for login functionality
    this.users.set('admin@default.com', {
      id: '1',
      email: 'admin@default.com',
      password: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      tenantId: 'default-tenant',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    this.users.set('user@test.com', {
      id: '2',
      email: 'user@test.com',
      password: 'password',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      isActive: true,
      tenantId: 'default-tenant',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Platform owner account
    this.users.set('abel@argilette.com', {
      id: '3',
      email: 'abel@argilette.com',
      password: 'Serrega1208@',
      firstName: 'Abel',
      lastName: 'Platform Owner',
      role: 'platform_owner',
      isActive: true,
      tenantId: 'default-tenant',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Initialize with default data
    this.initializeChartOfAccounts();
    this.initializeDefaultCurrencies();
  }

  private initializeChartOfAccounts() {
    // Initialize empty chart of accounts - users should create their own accounts
    console.log('Initialized empty chart of accounts');
  }

  private initializeDefaultCurrencies(): void {
    const CURRENCIES = [
      { code: 'USD', name: 'US Dollar', symbol: '$', region: 'North America' },
      { code: 'EUR', name: 'Euro', symbol: '€', region: 'Europe' },
      { code: 'GBP', name: 'British Pound', symbol: '£', region: 'Europe' },
      { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', region: 'Africa' },
      { code: 'ZAR', name: 'South African Rand', symbol: 'R', region: 'Africa' }
    ];
    const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
      USD: 1.0, EUR: 0.85, GBP: 0.73, NGN: 411.0, ZAR: 15.0
    };
    
    CURRENCIES.forEach((currencyInfo: any) => {
      const exchangeRate = DEFAULT_EXCHANGE_RATES[currencyInfo.code] || 1.0;
      const newCurrency: Currency = {
        id: this.currentCurrencyId++,
        code: currencyInfo.code,
        name: currencyInfo.name,
        symbol: currencyInfo.symbol,
        exchangeRate: exchangeRate.toString(),
        isBaseCurrency: currencyInfo.code === "USD",
        isActive: true,
        lastUpdated: new Date(),
        createdAt: new Date(),
      };
      this.currenciesMap.set(newCurrency.id, newCurrency);
    });
  }

  // Contact operations
  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getContact(id: string): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = `contact_${this.currentContactId++}`;
    const contact: Contact = {
      id,
      name: insertContact.name,
      email: insertContact.email,
      phone: insertContact.phone || null,
      company: insertContact.company || null,
      jobTitle: insertContact.jobTitle || null,
      leadSource: insertContact.leadSource || null,
      status: insertContact.status || 'active',
      tags: (insertContact.tags && Array.isArray(insertContact.tags)) ? insertContact.tags as string[] : null,
      assignedTo: insertContact.assignedTo || null,
      tenantId: insertContact.tenantId || 'default-tenant',
      createdBy: insertContact.createdBy || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.contacts.set(id, contact);
    console.log('Contact created successfully:', contact);
    return contact;
  }

  async updateContact(id: string, updateData: Partial<InsertContact>): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    if (!contact) return undefined;
    
    const updatedContact: Contact = { 
      ...contact, 
      name: updateData.name || contact.name,
      email: updateData.email || contact.email,
      phone: updateData.phone !== undefined ? updateData.phone : contact.phone,
      company: updateData.company !== undefined ? updateData.company : contact.company,
      jobTitle: updateData.jobTitle !== undefined ? updateData.jobTitle : contact.jobTitle,
      leadSource: updateData.leadSource !== undefined ? updateData.leadSource : contact.leadSource,
      status: updateData.status !== undefined ? updateData.status : contact.status,
      tags: updateData.tags !== undefined ? ((updateData.tags && Array.isArray(updateData.tags)) ? updateData.tags as string[] : null) : contact.tags,
      assignedTo: updateData.assignedTo !== undefined ? updateData.assignedTo : contact.assignedTo,
      updatedAt: new Date() 
    };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteContact(id: string): Promise<boolean> {
    return this.contacts.delete(id);
  }

  // Financial operations
  async getChartOfAccounts(): Promise<ChartOfAccount[]> {
    return Array.from(this.chartOfAccountsMap.values());
  }

  async getChartOfAccount(id: number): Promise<ChartOfAccount | undefined> {
    return this.chartOfAccountsMap.get(id);
  }

  async createChartOfAccount(insertAccount: InsertChartOfAccount): Promise<ChartOfAccount> {
    const account: ChartOfAccount = {
      id: this.currentChartAccountId++,
      code: insertAccount.code,
      name: insertAccount.name,
      type: insertAccount.type,
      balance: insertAccount.balance || "0.00",
      currency: insertAccount.currency || "USD",
      parentAccountId: insertAccount.parentAccountId || null,
      isActive: insertAccount.isActive ?? true,
      description: insertAccount.description || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.chartOfAccountsMap.set(account.id, account);
    return account;
  }

  async updateChartOfAccount(id: number, updateData: Partial<InsertChartOfAccount>): Promise<ChartOfAccount | undefined> {
    const existingAccount = this.chartOfAccountsMap.get(id);
    if (!existingAccount) return undefined;

    const updatedAccount = { 
      ...existingAccount, 
      ...updateData, 
      updatedAt: new Date() 
    };
    this.chartOfAccountsMap.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteChartOfAccount(id: number): Promise<boolean> {
    return this.chartOfAccountsMap.delete(id);
  }

  // Bank account linking operations
  async linkBankAccountToChart(bankAccountId: number, chartAccountId: number): Promise<boolean> {
    try {
      // Validate that the chart account exists
      const chartAccount = this.chartOfAccountsMap.get(chartAccountId);
      if (!chartAccount) {
        console.error(`Chart account with ID ${chartAccountId} not found`);
        return false;
      }
      
      // Validate that it's an asset account (bank accounts should link to asset accounts)
      if (chartAccount.type !== 'asset') {
        console.error(`Chart account ${chartAccountId} is not an asset account`);
        return false;
      }
      
      // Store the linking relationship
      this.bankAccountLinks.set(bankAccountId, chartAccountId);
      
      console.log(`Successfully linked bank account ${bankAccountId} to chart account ${chartAccountId} (${chartAccount.name})`);
      return true;
    } catch (error) {
      console.error('Error linking bank account:', error);
      return false;
    }
  }

  async unlinkBankAccount(bankAccountId: number): Promise<boolean> {
    try {
      const wasLinked = this.bankAccountLinks.has(bankAccountId);
      if (wasLinked) {
        this.bankAccountLinks.delete(bankAccountId);
        console.log(`Successfully unlinked bank account ${bankAccountId}`);
        return true;
      }
      console.warn(`Bank account ${bankAccountId} was not linked`);
      return false;
    } catch (error) {
      console.error('Error unlinking bank account:', error);
      return false;
    }
  }

  // Get linked account for a bank account
  async getLinkedChartAccount(bankAccountId: number): Promise<number | null> {
    return this.bankAccountLinks.get(bankAccountId) || null;
  }

  // Get all bank account links
  async getAllBankAccountLinks(): Promise<Map<number, number>> {
    return new Map(this.bankAccountLinks);
  }

  // Financial Transaction operations
  async getFinancialTransactions(): Promise<FinancialTransaction[]> {
    return Array.from(this.financialTransactionsMap.values());
  }

  async getFinancialTransaction(id: number): Promise<FinancialTransaction | undefined> {
    return this.financialTransactionsMap.get(id);
  }

  async createFinancialTransaction(insertTransaction: InsertFinancialTransaction): Promise<FinancialTransaction> {
    const transaction: FinancialTransaction = {
      id: this.currentFinancialTransactionId++,
      accountId: insertTransaction.accountId,
      amount: insertTransaction.amount,
      currency: insertTransaction.currency || "USD",
      exchangeRate: insertTransaction.exchangeRate || "1.0",
      baseCurrencyAmount: insertTransaction.baseCurrencyAmount || insertTransaction.amount,
      type: insertTransaction.type,
      category: insertTransaction.category || null,
      description: insertTransaction.description,
      reference: insertTransaction.reference || null,
      reconciled: insertTransaction.reconciled || false,
      attachments: insertTransaction.attachments || [],
      date: insertTransaction.date || new Date().toISOString().split('T')[0],
      notes: insertTransaction.notes || null,
      reconciledDate: insertTransaction.reconciledDate || null,
      taxDeductible: insertTransaction.taxDeductible || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.financialTransactionsMap.set(transaction.id, transaction);
    return transaction;
  }

  async updateFinancialTransaction(id: number, updateData: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction | undefined> {
    const existingTransaction = this.financialTransactionsMap.get(id);
    if (!existingTransaction) return undefined;

    const updatedTransaction = { 
      ...existingTransaction, 
      ...updateData, 
      updatedAt: new Date() 
    };
    this.financialTransactionsMap.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteFinancialTransaction(id: number): Promise<boolean> {
    return this.financialTransactionsMap.delete(id);
  }

  async getFinancialTransactionsByAccount(accountId: number): Promise<FinancialTransaction[]> {
    return Array.from(this.financialTransactionsMap.values())
      .filter(t => t.accountId === accountId);
  }

  async getFinancialTransactionsByDateRange(startDate: Date, endDate: Date): Promise<FinancialTransaction[]> {
    return Array.from(this.financialTransactionsMap.values())
      .filter(t => t.createdAt && t.createdAt >= startDate && t.createdAt <= endDate);
  }

  // Currency operations
  async getCurrencies(): Promise<Currency[]> {
    return Array.from(this.currenciesMap.values());
  }

  async getCurrency(id: number): Promise<Currency | undefined> {
    return this.currenciesMap.get(id);
  }

  async createCurrency(insertCurrency: InsertCurrency): Promise<Currency> {
    const currency: Currency = {
      id: this.currentCurrencyId++,
      code: insertCurrency.code,
      name: insertCurrency.name,
      symbol: insertCurrency.symbol,
      exchangeRate: insertCurrency.exchangeRate,
      isBaseCurrency: insertCurrency.isBaseCurrency || false,
      isActive: insertCurrency.isActive ?? true,
      lastUpdated: new Date(),
      createdAt: new Date(),
    };

    this.currenciesMap.set(currency.id, currency);
    return currency;
  }

  async updateCurrency(id: number, updateData: Partial<InsertCurrency>): Promise<Currency | undefined> {
    const existingCurrency = this.currenciesMap.get(id);
    if (!existingCurrency) return undefined;

    const updatedCurrency: Currency = { 
      ...existingCurrency, 
      code: updateData.code || existingCurrency.code,
      name: updateData.name || existingCurrency.name,
      symbol: updateData.symbol || existingCurrency.symbol,
      exchangeRate: updateData.exchangeRate || existingCurrency.exchangeRate,
      isBaseCurrency: updateData.isBaseCurrency !== undefined ? updateData.isBaseCurrency : existingCurrency.isBaseCurrency,
      isActive: updateData.isActive !== undefined ? updateData.isActive : existingCurrency.isActive,
      lastUpdated: updateData.lastUpdated || existingCurrency.lastUpdated,
      createdAt: existingCurrency.createdAt
    };
    this.currenciesMap.set(id, updatedCurrency);
    return updatedCurrency;
  }

  async deleteCurrency(id: number): Promise<boolean> {
    return this.currenciesMap.delete(id);
  }

  // Account operations (CRM accounts, not bookkeeping accounts)
  async getAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id.toString());
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const id = this.currentAccountId++;
    const newAccount: Account = {
      id: id.toString(),
      tenantId: account.tenantId || 'default-tenant',
      name: account.name,
      email: account.email || null,
      phone: account.phone || null,
      industry: account.industry || null,
      website: account.website || null,
      annualRevenue: account.annualRevenue || null,
      accountType: account.accountType || null,
      parentAccountId: account.parentAccountId || null,
      employees: account.employees || null,
      billingAddress: account.billingAddress || null,
      shippingAddress: account.shippingAddress || null,
      ownerId: account.ownerId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.accounts.set(id.toString(), newAccount);
    console.log('Account created successfully:', newAccount);
    console.log('Accounts map size:', this.accounts.size);
    return newAccount;
  }

  async updateAccount(id: number, updateData: Partial<InsertAccount>): Promise<Account | undefined> {
    const existingAccount = this.accounts.get(id.toString());
    if (!existingAccount) return undefined;

    const updatedAccount: Account = {
      ...existingAccount,
      ...updateData,
      id: existingAccount.id,
      updatedAt: new Date()
    };

    this.accounts.set(id.toString(), updatedAccount);
    return updatedAccount;
  }
  async deleteAccount(id: number): Promise<boolean> {
    return this.accounts.delete(id.toString());
  }

  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }
  async getLead(id: number): Promise<Lead | undefined> {
    return this.leads.get(id.toString());
  }
  async createLead(lead: InsertLead): Promise<Lead> {
    const newLead: Lead = {
      id: this.currentLeadId++,
      email: lead.email,
      firstName: lead.firstName || null,
      lastName: lead.lastName || null,
      phone: lead.phone || null,
      company: lead.company || null,
      jobTitle: lead.jobTitle || null,
      leadSource: lead.leadSource || null,
      status: lead.status || "new",
      assignedTo: lead.assignedTo || null,
      score: lead.score || 0,
      convertedAccountId: lead.convertedAccountId || null,
      convertedContactId: lead.convertedContactId || null,
      convertedDealId: lead.convertedDealId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.leads.set(newLead.id.toString(), newLead);
    console.log('Lead created successfully:', newLead);
    return newLead;
  }
  async updateLead(id: number, updateData: Partial<InsertLead>): Promise<Lead | undefined> {
    const existingLead = this.leads.get(id.toString());
    if (!existingLead) return undefined;

    const updatedLead: Lead = {
      ...existingLead,
      ...updateData,
      id: existingLead.id,
      updatedAt: new Date()
    };

    this.leads.set(id.toString(), updatedLead);
    console.log('Lead updated successfully:', updatedLead);
    return updatedLead;
  }

  async deleteLead(id: number): Promise<boolean> {
    return this.leads.delete(id.toString());
  }

  async convertLead(id: number, contactData?: any, accountData?: any, dealData?: any): Promise<any> {
    const lead = await this.getLead(id);
    if (!lead) {
      throw new Error('Lead not found');
    }

    const result: any = { convertedLead: lead };

    try {
      // Create contact from lead
      if (contactData || !contactData) {
        const newContact = await this.createContact({
          name: contactData?.name || `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || lead.email.split('@')[0],
          email: contactData?.email || lead.email,
          phone: contactData?.phone || lead.phone,
          company: contactData?.company || lead.company,
          jobTitle: contactData?.jobTitle || lead.jobTitle,
          leadSource: lead.leadSource,
          status: 'active',
          tenantId: 'default-tenant'
        });
        result.contact = newContact;
      }

      // Create account if account data provided
      if (accountData || lead.company) {
        const newAccount = await this.createAccount({
          name: accountData?.name || lead.company || `${lead.firstName} ${lead.lastName} Account`,
          email: accountData?.email || lead.email,
          phone: accountData?.phone || lead.phone,
          industry: accountData?.industry,
          website: accountData?.website,
          accountType: accountData?.accountType || 'customer',
          tenantId: 'default-tenant'
        });
        result.account = newAccount;
      }

      // Create deal if deal data provided
      if (dealData) {
        const newDeal = await this.createDeal({
          name: dealData?.name || `${lead.company || lead.email} Deal`,
          accountId: result.account?.id,
          contactId: result.contact?.id,
          amount: dealData?.amount,
          stage: dealData?.stage || 'prospecting',
          probability: dealData?.probability || 25,
          closeDate: dealData?.closeDate,
          tenantId: 'default-tenant'
        });
        result.deal = newDeal;
      }

      // Update lead to mark as converted
      await this.updateLead(id, {
        status: 'converted',
        convertedAccountId: result.account?.id,
        convertedContactId: result.contact?.id,
        convertedDealId: result.deal?.id
      });

      console.log('Lead converted successfully:', result);
      return result;

    } catch (error) {
      console.error('Lead conversion error:', error);
      throw new Error(`Failed to convert lead: ${error.message}`);
    }
  }

  async getDeals(): Promise<Deal[]> {
    return Array.from(this.deals.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }
  async getDeal(id: number): Promise<Deal | undefined> {
    return this.deals.get(id);
  }
  async createDeal(deal: InsertDeal): Promise<Deal> {
    const newDeal: Deal = {
      id: this.currentDealId++,
      name: deal.name,
      ownerId: deal.ownerId || null,
      accountId: deal.accountId || null,
      contactId: deal.contactId || null,
      amount: deal.amount || null,
      stage: deal.stage || "prospecting",
      probability: deal.probability || null,
      closeDate: deal.closeDate || null,
      nextStep: deal.nextStep || null,
      description: deal.description || null,
      source: deal.source || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.deals.set(newDeal.id, newDeal);
    return newDeal;
  }
  async updateDeal(id: number, updateData: Partial<InsertDeal>): Promise<Deal | undefined> {
    const existingDeal = this.deals.get(id);
    if (!existingDeal) return undefined;

    const updatedDeal: Deal = {
      ...existingDeal,
      ...updateData,
      id: existingDeal.id,
      updatedAt: new Date()
    };

    this.deals.set(id, updatedDeal);
    return updatedDeal;
  }

  async deleteDeal(id: number): Promise<boolean> {
    return this.deals.delete(id);
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  async createTask(task: InsertTask): Promise<Task> {
    const newTask: Task = {
      id: this.currentTaskId++,
      title: task.title,
      description: task.description || null,
      priority: task.priority || "medium",
      status: task.status || "pending",
      type: task.type || null,
      dueDate: task.dueDate || null,
      assignedTo: task.assignedTo || null,
      relatedTo: task.relatedTo || null,
      relatedId: task.relatedId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tasks.set(newTask.id, newTask);
    return newTask;
  }
  async updateTask(id: number, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;

    const updatedTask: Task = {
      ...existingTask,
      ...updateData,
      id: existingTask.id,
      updatedAt: new Date()
    };

    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async getCampaigns(): Promise<Campaign[]> { 
    return Array.from(this.campaigns.values()); 
  }
  async getCampaign(id: number): Promise<Campaign | undefined> { 
    return this.campaigns.get(id); 
  }
  async createCampaign(campaign: InsertCampaign): Promise<Campaign> { 
    const newCampaign = { 
      id: this.currentCampaignId++,
      name: campaign.name,
      status: campaign.status || null,
      type: campaign.type || null,
      ownerId: campaign.ownerId || null,
      description: campaign.description || null,
      startDate: campaign.startDate || null,
      endDate: campaign.endDate || null,
      budget: campaign.budget || null,
      actualCost: campaign.actualCost || null,
      expectedRevenue: campaign.expectedRevenue || null,
      targetAudience: campaign.targetAudience || null,
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.campaigns.set(newCampaign.id, newCampaign);
    return newCampaign;
  }
  async updateCampaign(id: number, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined> { 
    const existing = this.campaigns.get(id);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      ...campaign, 
      updatedAt: new Date() 
    };
    this.campaigns.set(id, updated);
    return updated;
  }
  async deleteCampaign(id: number): Promise<boolean> { 
    return this.campaigns.delete(id); 
  }

  async getTickets(): Promise<Ticket[]> { 
    return Array.from(this.tickets.values()); 
  }
  async getTicket(id: number): Promise<Ticket | undefined> { 
    return this.tickets.get(id); 
  }
  async createTicket(ticket: InsertTicket): Promise<Ticket> { 
    const newTicket = { 
      id: this.currentTicketId++,
      subject: ticket.subject,
      status: ticket.status || null,
      assignedTo: ticket.assignedTo || null,
      accountId: ticket.accountId || null,
      contactId: ticket.contactId || null,
      description: ticket.description || null,
      priority: ticket.priority || null,
      dueDate: ticket.dueDate || null,
      category: ticket.category || null,
      subCategory: ticket.subCategory || null,
      resolvedAt: ticket.resolvedAt || null,
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.tickets.set(newTicket.id, newTicket);
    return newTicket;
  }
  async updateTicket(id: number, ticket: Partial<InsertTicket>): Promise<Ticket | undefined> { 
    const existing = this.tickets.get(id);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      ...ticket, 
      updatedAt: new Date() 
    };
    this.tickets.set(id, updated);
    return updated;
  }
  async deleteTicket(id: number): Promise<boolean> { 
    return this.tickets.delete(id); 
  }

  async getProjects(): Promise<Project[]> { 
    return Array.from(this.projects.values()); 
  }
  async getProject(id: number): Promise<Project | undefined> { 
    return this.projects.get(id); 
  }
  async createProject(project: InsertProject): Promise<Project> { 
    const newProject = { 
      id: this.currentProjectId++,
      name: project.name,
      status: project.status || null,
      accountId: project.accountId || null,
      description: project.description || null,
      priority: project.priority || null,
      startDate: project.startDate || null,
      endDate: project.endDate || null,
      budget: project.budget || null,
      actualCost: project.actualCost || null,
      progress: project.progress || null,
      managerId: project.managerId || null,
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.projects.set(newProject.id, newProject);
    return newProject;
  }
  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> { 
    const existing = this.projects.get(id);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      ...project, 
      updatedAt: new Date() 
    };
    this.projects.set(id, updated);
    return updated;
  }
  async deleteProject(id: number): Promise<boolean> { 
    return this.projects.delete(id); 
  }

  async getInvoices(): Promise<Invoice[]> { 
    return Array.from(this.invoices.values()); 
  }
  async getInvoice(id: number): Promise<Invoice | undefined> { 
    return this.invoices.get(id); 
  }
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> { 
    const newInvoice = { 
      id: this.currentInvoiceId++,
      accountId: invoice.accountId,
      contactId: invoice.contactId || null,
      amount: invoice.amount,
      dueDate: invoice.dueDate || null,
      status: invoice.status || null,
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      tax: invoice.tax || null,
      discount: invoice.discount || null,
      items: invoice.items || null,
      notes: invoice.notes || null,
      paidDate: invoice.paidDate || null,
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.invoices.set(newInvoice.id, newInvoice);
    return newInvoice;
  }
  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> { 
    const existing = this.invoices.get(id);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      ...invoice, 
      updatedAt: new Date() 
    };
    this.invoices.set(id, updated);
    return updated;
  }
  async deleteInvoice(id: number): Promise<boolean> { 
    return this.invoices.delete(id); 
  }

  // E-commerce storage methods
  private orders: Map<number, any> = new Map();
  private customers: Map<number, any> = new Map();
  private stores: Map<number, any> = new Map();
  private categories: Map<number, any> = new Map();
  private reviews: Map<number, any> = new Map();
  private coupons: Map<number, any> = new Map();
  private currentOrderId = 1;
  private currentCustomerId = 1;
  private currentStoreId = 1;
  private currentCategoryId = 1;
  private currentReviewId = 1;
  private currentCouponId = 1;

  // Order operations
  async getOrders(filters?: { storeId?: number; status?: string; limit?: number }): Promise<any[]> {
    let orders = Array.from(this.orders.values());
    
    if (filters?.storeId) {
      orders = orders.filter(order => order.storeId === filters.storeId);
    }
    
    if (filters?.status) {
      orders = orders.filter(order => order.status === filters.status);
    }
    
    if (filters?.limit) {
      orders = orders.slice(0, filters.limit);
    }
    
    return orders;
  }

  async getOrder(id: number): Promise<any | undefined> {
    return this.orders.get(id);
  }

  async createOrder(order: any): Promise<any> {
    const newOrder = {
      id: this.currentOrderId++,
      ...order,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.orders.set(newOrder.id, newOrder);
    return newOrder;
  }

  async updateOrder(id: number, order: any): Promise<any | undefined> {
    const existing = this.orders.get(id);
    if (!existing) return undefined;
    
    const updated = {
      ...existing,
      ...order,
      updatedAt: new Date()
    };
    this.orders.set(id, updated);
    return updated;
  }

  async deleteOrder(id: number): Promise<boolean> {
    return this.orders.delete(id);
  }

  // Customer operations
  async getCustomers(storeId?: number): Promise<any[]> {
    let customers = Array.from(this.customers.values());
    
    if (storeId) {
      customers = customers.filter(customer => customer.storeId === storeId);
    }
    
    return customers;
  }

  async getCustomer(id: number): Promise<any | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(customer: any): Promise<any> {
    const newCustomer = {
      id: this.currentCustomerId++,
      ...customer,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.customers.set(newCustomer.id, newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: number, customer: any): Promise<any | undefined> {
    const existing = this.customers.get(id);
    if (!existing) return undefined;
    
    const updated = {
      ...existing,
      ...customer,
      updatedAt: new Date()
    };
    this.customers.set(id, updated);
    return updated;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Store operations
  async getStores(): Promise<any[]> {
    return Array.from(this.stores.values());
  }

  async getStore(id: number): Promise<any | undefined> {
    return this.stores.get(id);
  }

  async createStore(store: any): Promise<any> {
    const newStore = {
      id: this.currentStoreId++,
      ...store,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.stores.set(newStore.id, newStore);
    return newStore;
  }

  async updateStore(id: number, store: any): Promise<any | undefined> {
    const existing = this.stores.get(id);
    if (!existing) return undefined;
    
    const updated = {
      ...existing,
      ...store,
      updatedAt: new Date()
    };
    this.stores.set(id, updated);
    return updated;
  }

  async deleteStore(id: number): Promise<boolean> {
    return this.stores.delete(id);
  }

  // Category operations
  async getCategories(storeId?: number): Promise<any[]> {
    let categories = Array.from(this.categories.values());
    
    if (storeId) {
      categories = categories.filter(category => category.storeId === storeId);
    }
    
    return categories;
  }

  async getCategory(id: number): Promise<any | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: any): Promise<any> {
    const newCategory = {
      id: this.currentCategoryId++,
      ...category,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.categories.set(newCategory.id, newCategory);
    return newCategory;
  }

  async updateCategory(id: number, category: any): Promise<any | undefined> {
    const existing = this.categories.get(id);
    if (!existing) return undefined;
    
    const updated = {
      ...existing,
      ...category,
      updatedAt: new Date()
    };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Review operations
  async getReviews(productId?: number): Promise<any[]> {
    let reviews = Array.from(this.reviews.values());
    
    if (productId) {
      reviews = reviews.filter(review => review.productId === productId);
    }
    
    return reviews;
  }

  async getReview(id: number): Promise<any | undefined> {
    return this.reviews.get(id);
  }

  async createReview(review: any): Promise<any> {
    const newReview = {
      id: this.currentReviewId++,
      ...review,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.reviews.set(newReview.id, newReview);
    return newReview;
  }

  async updateReview(id: number, review: any): Promise<any | undefined> {
    const existing = this.reviews.get(id);
    if (!existing) return undefined;
    
    const updated = {
      ...existing,
      ...review,
      updatedAt: new Date()
    };
    this.reviews.set(id, updated);
    return updated;
  }

  async deleteReview(id: number): Promise<boolean> {
    return this.reviews.delete(id);
  }

  // Coupon operations
  async getCoupons(storeId?: number): Promise<any[]> {
    let coupons = Array.from(this.coupons.values());
    
    if (storeId) {
      coupons = coupons.filter(coupon => coupon.storeId === storeId);
    }
    
    return coupons;
  }

  async getCoupon(id: number): Promise<any | undefined> {
    return this.coupons.get(id);
  }

  async createCoupon(coupon: any): Promise<any> {
    const newCoupon = {
      id: this.currentCouponId++,
      ...coupon,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.coupons.set(newCoupon.id, newCoupon);
    return newCoupon;
  }

  async updateCoupon(id: number, coupon: any): Promise<any | undefined> {
    const existing = this.coupons.get(id);
    if (!existing) return undefined;
    
    const updated = {
      ...existing,
      ...coupon,
      updatedAt: new Date()
    };
    this.coupons.set(id, updated);
    return updated;
  }

  async deleteCoupon(id: number): Promise<boolean> {
    return this.coupons.delete(id);
  }

  async getEmployees(): Promise<Employee[]> { 
    console.log(`Getting employees - map size: ${this.employees.size}`);
    const employees = Array.from(this.employees.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
    console.log(`Returning employees: ${JSON.stringify(employees)}`);
    return employees;
  }
  async getEmployee(id: number): Promise<Employee | undefined> { 
    return this.employees.get(id); 
  }
  async createEmployee(employee: InsertEmployee): Promise<Employee> { 
    const newEmployee: Employee = { 
      id: this.currentEmployeeId++,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      phone: employee.phone || null,
      status: employee.status || null,
      employeeId: employee.employeeId || null,
      position: employee.position || null,
      department: employee.department || null,
      hireDate: employee.hireDate || null,
      salary: employee.salary || null,
      manager: employee.manager || null,
      address: employee.address || null,
      dateOfBirth: employee.dateOfBirth || null,
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.employees.set(newEmployee.id, newEmployee);
    console.log(`Employee created: ${newEmployee.firstName} ${newEmployee.lastName} (ID: ${newEmployee.id})`);
    console.log(`Employees map size: ${this.employees.size}`);
    console.log(`All employees: ${JSON.stringify(Array.from(this.employees.values()))}`);
    return newEmployee;
  }
  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined> { 
    const existing = this.employees.get(id);
    if (!existing) return undefined;
    
    const updated: Employee = { 
      ...existing, 
      ...employee, 
      updatedAt: new Date() 
    };
    this.employees.set(id, updated);
    return updated;
  }
  async deleteEmployee(id: number): Promise<boolean> { 
    return this.employees.delete(id); 
  }

  // Appointment operations
  async getAppointments(): Promise<Appointment[]> { 
    return Array.from(this.appointments.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getAppointment(id: number): Promise<Appointment | undefined> { 
    return this.appointments.get(id); 
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> { 
    const newAppointment: Appointment = { 
      id: this.currentAppointmentId++,
      tenantId: appointment.tenantId,
      title: appointment.title,
      description: appointment.description || null,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      location: appointment.location || null,
      attendeeEmail: appointment.attendeeEmail || null,
      attendeeName: appointment.attendeeName || null,
      attendeePhone: appointment.attendeePhone || null,
      status: appointment.status || 'scheduled',
      meetingLink: appointment.meetingLink || null,
      notes: appointment.notes || null,
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.appointments.set(newAppointment.id, newAppointment);
    return newAppointment;
  }

  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> { 
    const existing = this.appointments.get(id);
    if (!existing) return undefined;
    
    const updated: Appointment = { 
      ...existing, 
      ...appointment, 
      updatedAt: new Date() 
    };
    this.appointments.set(id, updated);
    return updated;
  }

  async deleteAppointment(id: number): Promise<boolean> { 
    return this.appointments.delete(id); 
  }

  async getSentimentAnalyses(): Promise<SentimentAnalysis[]> { 
    return Array.from(this.sentimentAnalyses.values()); 
  }
  async getSentimentAnalysis(id: number): Promise<SentimentAnalysis | undefined> { 
    return this.sentimentAnalyses.get(id); 
  }
  async createSentimentAnalysis(analysis: InsertSentimentAnalysis): Promise<SentimentAnalysis> { 
    const newAnalysis = { 
      id: this.currentAnalysisId++,
      contactId: analysis.contactId,
      message: analysis.message,
      sentiment: analysis.sentiment,
      score: analysis.score,
      keywords: analysis.keywords || null,
      emotionalTone: analysis.emotionalTone || null,
      urgencyLevel: analysis.urgencyLevel || null,
      createdAt: new Date()
    };
    this.sentimentAnalyses.set(newAnalysis.id, newAnalysis);
    return newAnalysis;
  }
  async updateSentimentAnalysis(id: number, analysis: Partial<InsertSentimentAnalysis>): Promise<SentimentAnalysis | undefined> { return undefined; }
  async deleteSentimentAnalysis(id: number): Promise<boolean> { return false; }

  async getTaxRates(): Promise<any[]> { 
    return Array.from(this.taxRatesMap.values()); 
  }
  async getTaxRate(id: number): Promise<any> { 
    return this.taxRatesMap.get(id); 
  }
  async createTaxRate(taxRate: any): Promise<any> { 
    const newTaxRate = { 
      id: this.currentTaxRateId++,
      name: taxRate.name,
      rate: taxRate.rate,
      type: taxRate.type,
      jurisdiction: taxRate.jurisdiction,
      region: taxRate.region || null,
      city: taxRate.city || null,
      zipCode: taxRate.zipCode || null,
      isActive: taxRate.isActive ?? true,
      effectiveDate: taxRate.effectiveDate || new Date(),
      expiryDate: taxRate.expiryDate || null,
      description: taxRate.description || null,
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.taxRatesMap.set(newTaxRate.id, newTaxRate);
    return newTaxRate;
  }
  async updateTaxRate(id: number, taxRate: any): Promise<any> { 
    const existing = this.taxRatesMap.get(id);
    if (!existing) return undefined;
    
    const updated = { 
      ...existing, 
      ...taxRate, 
      updatedAt: new Date() 
    };
    this.taxRatesMap.set(id, updated);
    return updated;
  }
  async deleteTaxRate(id: number): Promise<boolean> { 
    return this.taxRatesMap.delete(id); 
  }

  // Bank Transactions operations
  private bankTransactions: any[] = [];

  async getBankTransactions(bankAccountId: number, limit: number = 50): Promise<any[]> {
    return this.bankTransactions
      .filter(txn => txn.bankAccountId === bankAccountId)
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, limit);
  }

  async createBankTransaction(transaction: any): Promise<any> {
    const newTransaction = {
      id: Date.now(),
      ...transaction,
      createdAt: new Date()
    };
    this.bankTransactions.push(newTransaction);
    return newTransaction;
  }

  async updateBankTransaction(id: number, transaction: any): Promise<any> {
    const index = this.bankTransactions.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Bank transaction not found');
    
    this.bankTransactions[index] = { ...this.bankTransactions[index], ...transaction };
    return this.bankTransactions[index];
  }

  async getBankAccountTransactions(accountId: number): Promise<any[]> {
    return this.bankTransactions.filter(txn => txn.bankAccountId === accountId);
  }

  // Registration system methods
  async getUserByEmail(email: string): Promise<any> {
    for (const user of this.registeredUsers.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async createRegisteredUser(userData: any): Promise<any> {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const user = {
      id: userId,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
      loginCount: 0,
      lastLogin: null
    };
    
    this.registeredUsers.set(userId, user);
    
    // Verification token is already stored directly on the user object
    // No need for separate mapping that gets lost on server restart
    
    console.log('✅ Registered user created:', user.email);
    return user;
  }

  async getUserByVerificationToken(token: string): Promise<any> {
    console.log(`🔍 DEBUG: Searching for token: ${token.substring(0, 15)}...`);
    console.log(`🔍 DEBUG: Total registered users: ${this.registeredUsers.size}`);
    
    // Search through registered users directly by their verification token
    for (const user of this.registeredUsers.values()) {
      console.log(`🔍 DEBUG: Checking user ${user.email}, verificationToken: ${user.verificationToken?.substring(0, 15) || 'NULL'}..., emailVerificationToken: ${user.emailVerificationToken?.substring(0, 15) || 'NULL'}...`);
      
      // CRITICAL FIX: Check both field names for compatibility
      if (user.verificationToken === token || user.emailVerificationToken === token) {
        console.log(`✅ DEBUG: FOUND MATCHING USER: ${user.email}`);
        return user;
      }
    }
    console.log(`❌ DEBUG: No user found with token: ${token.substring(0, 15)}...`);
    return null;
  }

  async verifyUser(userId: string): Promise<void> {
    const user = this.registeredUsers.get(userId);
    if (user) {
      user.isVerified = true;
      user.status = 'active';
      user.verifiedAt = new Date();
      user.updatedAt = new Date();
      
      // Remove verification token as it's no longer needed
      if (user.verificationToken) {
        user.verificationToken = null;
      }
      
      this.registeredUsers.set(userId, user);
    }
  }

  async getAllRegisteredUsers(): Promise<any[]> {
    return Array.from(this.registeredUsers.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updateUserEmailVerification(userId: string, isVerified: boolean): Promise<void> {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      this.users[userIndex].emailVerified = isVerified;
      
      // Also update in registered users collection
      const regUser = this.registeredUsers.get(userId);
      if (regUser) {
        regUser.isVerified = isVerified;
        this.registeredUsers.set(userId, regUser);
      }
    }
  }

  async updateUserSubscriptionStatus(userId: string, status: string): Promise<void> {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      this.users[userIndex].subscriptionStatus = status;
      
      // Also update in registered users collection
      const regUser = this.registeredUsers.get(userId);
      if (regUser) {
        regUser.status = status;
        this.registeredUsers.set(userId, regUser);
      }
    }
  }

  // REMOVED: Duplicate getUserByEmail method that was overriding the correct one

  // CRITICAL FIX: Add missing tenant-related methods to implement IStorage interface
  async getTenantByDomain(domain: string): Promise<any> {
    // Default tenant for MemStorage - always returns active default tenant
    return {
      id: 'default-tenant',
      domain: domain,
      name: 'Default Tenant',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async createTenant(tenant: any): Promise<any> {
    const newTenant = {
      id: `tenant_${Date.now()}`,
      ...tenant,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tenants.set(newTenant.id, newTenant);
    return newTenant;
  }

  async updateTenant(id: string, tenant: any): Promise<any> {
    const existing = this.tenants.get(id);
    if (!existing) return null;
    
    const updated = {
      ...existing,
      ...tenant,
      updatedAt: new Date()
    };
    this.tenants.set(id, updated);
    return updated;
  }

  async getUserByEmailAndTenant(email: string, tenantId: string): Promise<any> {
    // Find user by email in registered users
    for (const user of this.registeredUsers.values()) {
      if (user.email === email && (user.tenantId === tenantId || tenantId === 'default-tenant')) {
        return user;
      }
    }
    return null;
  }

  async getUserWithPermissions(userId: string): Promise<any> {
    // Handle platform owner specially (same logic as DatabaseStorage)
    // Check for both 'platform-owner-1' and '3' (JWT contains id: '3' for abel@argilette.com)
    if (userId === 'platform-owner-1' || userId === '3') {
      return {
        id: userId, // Use the actual JWT id 
        email: 'abel@argilette.com',
        firstName: 'Abel',
        lastName: 'Dessalegn',
        role: 'platform_owner',
        tenantId: '00000000-0000-0000-0000-000000000001',
        isActive: true,
        permissions: [
          'contacts.read', 'contacts.write', 'accounts.read', 'accounts.write',
          'leads.read', 'leads.write', 'deals.read', 'deals.write',
          'tasks.read', 'tasks.write', 'campaigns.read', 'campaigns.write',
          'platform.admin', 'billing.admin'
        ]
      };
    }
    
    const user = this.registeredUsers.get(userId);
    if (!user) return null;
    
    // Add default permissions for MemStorage
    return {
      ...user,
      permissions: ['read', 'write', 'delete'], // Default permissions
      roles: ['user'] // Default role
    };
  }

  async createUser(user: any): Promise<any> {
    return this.createRegisteredUser(user);
  }

  async updateUser(id: string, user: any): Promise<any> {
    const existing = this.registeredUsers.get(id);
    if (!existing) return null;
    
    const updated = {
      ...existing,
      ...user,
      updatedAt: new Date()
    };
    this.registeredUsers.set(id, updated);
    return updated;
  }

  async updateUserLastLogin(id: string): Promise<void> {
    const user = this.registeredUsers.get(id);
    if (user) {
      user.lastLogin = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      user.updatedAt = new Date();
      this.registeredUsers.set(id, user);
    }
  }

  // Additional tenant methods for completeness
  async getUsersByTenant(tenantId: string): Promise<any[]> {
    return Array.from(this.registeredUsers.values()).filter(user => 
      user.tenantId === tenantId || tenantId === 'default-tenant'
    );
  }

  async getUserCountByTenant(tenantId: string): Promise<number> {
    return Array.from(this.registeredUsers.values()).filter(user => 
      user.tenantId === tenantId || tenantId === 'default-tenant'
    ).length;
  }

  async getContactCountByTenant(tenantId: string): Promise<number> {
    return Array.from(this.contacts.values()).filter(contact => 
      contact.tenantId === tenantId || tenantId === 'default-tenant'
    ).length;
  }

  async getDealCountByTenant(tenantId: string): Promise<number> {
    return Array.from(this.deals.values()).filter(deal => 
      deal.tenantId === tenantId || tenantId === 'default-tenant'
    ).length;
  }

  async getRecentActivityByTenant(tenantId: string, limit: number): Promise<any[]> {
    // Mock recent activity for MemStorage
    return [];
  }

  async createDefaultRoles(tenantId: string): Promise<void> {
    // Create default roles for tenant
    const defaultRoles = [
      { id: `role_admin_${tenantId}`, name: 'admin', tenantId, permissions: ['*'] },
      { id: `role_user_${tenantId}`, name: 'user', tenantId, permissions: ['read', 'write'] },
      { id: `role_viewer_${tenantId}`, name: 'viewer', tenantId, permissions: ['read'] }
    ];
    
    defaultRoles.forEach(role => {
      this.roles.set(role.id, role);
    });
  }

  async getRolesByTenant(tenantId: string): Promise<any[]> {
    return Array.from(this.roles.values()).filter(role => role.tenantId === tenantId);
  }

  async createRole(role: any): Promise<any> {
    const newRole = {
      id: `role_${Date.now()}`,
      ...role,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.roles.set(newRole.id, newRole);
    return newRole;
  }

  async updateRole(id: string, role: any): Promise<any> {
    const existing = this.roles.get(id);
    if (!existing) return null;
    
    const updated = {
      ...existing,
      ...role,
      updatedAt: new Date()
    };
    this.roles.set(id, updated);
    return updated;
  }

  async deleteRole(id: string): Promise<boolean> {
    return this.roles.delete(id);
  }

  async getRole(id: string): Promise<any> {
    return this.roles.get(id) || null;
  }

  async getAllPermissions(): Promise<any[]> {
    // Return default permissions list
    return [
      { id: 'read', name: 'Read', description: 'Read access' },
      { id: 'write', name: 'Write', description: 'Write access' },
      { id: 'delete', name: 'Delete', description: 'Delete access' },
      { id: 'admin', name: 'Admin', description: 'Admin access' }
    ];
  }

  // Product operations for completeness
  async getProducts(): Promise<Product[]> {
    // Mock implementation for interface compliance
    return [];
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    throw new Error('Product operations not implemented in MemStorage');
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    return undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return false;
  }

  // Store operations compatibility fixes
  async getAllStores(): Promise<any[]> {
    return this.getStores();
  }

  async getStoreStats(id: string): Promise<any> {
    return {
      id,
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      totalCustomers: 0
    };
  }

  // Fix Order operations type mismatch
  async getOrders(filters?: { storeId?: string; status?: string; limit?: number }): Promise<any[]> {
    let orders = Array.from(this.orders.values());
    
    if (filters?.storeId) {
      orders = orders.filter(order => order.storeId === filters.storeId);
    }
    
    if (filters?.status) {
      orders = orders.filter(order => order.status === filters.status);
    }
    
    if (filters?.limit) {
      orders = orders.slice(0, filters.limit);
    }
    
    return orders;
  }

  async getOrder(id: string): Promise<any | undefined> {
    const numId = parseInt(id);
    return this.orders.get(numId);
  }

  async updateOrder(id: string, order: any): Promise<any | undefined> {
    const numId = parseInt(id);
    return this.updateOrder(numId, order);
  }

  async deleteOrder(id: string): Promise<boolean> {
    const numId = parseInt(id);
    return this.orders.delete(numId);
  }

  // Fix Customer operations type mismatch
  async getCustomer(id: string): Promise<any | undefined> {
    const numId = parseInt(id);
    return this.customers.get(numId);
  }

  async updateCustomer(id: string, customer: any): Promise<any | undefined> {
    const numId = parseInt(id);
    return this.updateCustomer(numId, customer);
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const numId = parseInt(id);
    return this.customers.delete(numId);
  }

  // Fix Store operations type mismatch  
  async getStore(id: string): Promise<any | undefined> {
    const numId = parseInt(id);
    return this.stores.get(numId);
  }

  async updateStore(id: string, store: any): Promise<any | undefined> {
    const numId = parseInt(id);
    return this.updateStore(numId, store);
  }

  async deleteStore(id: string): Promise<boolean> {
    const numId = parseInt(id);
    return this.stores.delete(numId);
  }
}

// Create a global storage instance that persists across module reloads  
import { DatabaseStorage } from "./database-storage"; // FIXED: Use database storage for authentication

export const storage = new DatabaseStorage(); // FIXED: Use database storage where real users exist