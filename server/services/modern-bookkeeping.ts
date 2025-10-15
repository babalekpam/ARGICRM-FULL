import { eq, and, desc, asc, sql, gte, lte, like, ilike } from "drizzle-orm";
import { db } from "../db";
import OpenAI from "openai";
import {
  transactions,
  expenseCategories,
  receipts,
  bankReconciliations,
  chartOfAccounts,
  journalEntries,
  journalEntryLineItems,
  type Transaction,
  type ExpenseCategory,
  type Receipt,
  type BankReconciliation,
  type ChartOfAccount,
  type InsertTransaction,
  type InsertExpenseCategory,
  type InsertReceipt,
  type InsertBankReconciliation,
} from "@shared/schema";

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export interface SmartCategorization {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reasoning: string;
  alternativeCategories: Array<{
    categoryId: string;
    categoryName: string;
    confidence: number;
  }>;
}

export interface ReceiptAnalysis {
  vendor: string;
  totalAmount: number;
  date: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    category?: string;
  }>;
  taxes: Array<{
    type: string;
    rate: number;
    amount: number;
  }>;
  confidence: number;
  suggestedCategory: SmartCategorization;
}

export interface BookkeepingInsights {
  monthlySpending: number;
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  unusualTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    reason: string;
  }>;
  taxDeductibleTotal: number;
  budgetAlerts: Array<{
    category: string;
    budgetAmount: number;
    actualAmount: number;
    overBy: number;
  }>;
}

export interface ReconciliationSuggestion {
  bankTransactionId: string;
  bookTransactionId: string;
  matchConfidence: number;
  matchReason: string;
  adjustmentRequired: boolean;
  adjustmentAmount?: number;
}

export class ModernBookkeepingService {
  private static instance: ModernBookkeepingService;

  static getInstance(): ModernBookkeepingService {
    if (!ModernBookkeepingService.instance) {
      ModernBookkeepingService.instance = new ModernBookkeepingService();
    }
    return ModernBookkeepingService.instance;
  }

  // Smart Transaction Categorization
  async categorizeTransaction(
    tenantId: string,
    description: string,
    amount: number,
    vendor?: string,
    merchantCategory?: string
  ): Promise<SmartCategorization> {
    try {
      // Get existing categories for this tenant
      const categories = await this.getExpenseCategories(tenantId);
      
      // Prepare category context for AI
      const categoryContext = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        keywords: cat.keywords || [],
        patterns: cat.patterns || [],
        vendors: cat.vendors || [],
      }));

      let aiResult = null;
      if (openai && categoryContext.length > 0) {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [
              {
                role: "system",
                content: `You are an intelligent bookkeeping assistant. Categorize transactions based on description, amount, vendor, and available categories. Return JSON with categoryId, confidence (0-100), reasoning, and up to 3 alternatives.`
              },
              {
                role: "user",
                content: `Categorize this transaction:
Description: ${description}
Amount: $${amount}
Vendor: ${vendor || 'Unknown'}
Merchant Category: ${merchantCategory || 'Unknown'}

Available Categories:
${JSON.stringify(categoryContext, null, 2)}`
              }
            ],
            response_format: { type: "json_object" },
            max_tokens: 800
          });

          aiResult = JSON.parse(response.choices[0].message.content || '{}');
        } catch (aiError) {
          console.warn('AI categorization failed, using fallback:', aiError);
        }
      }

      // Fallback rule-based categorization
      if (!aiResult || !aiResult.categoryId) {
        const fallbackResult = this.fallbackCategorization(description, amount, vendor, categories);
        return fallbackResult;
      }

      // Find the selected category
      const selectedCategory = categories.find(cat => cat.id === aiResult.categoryId);
      const alternatives = (aiResult.alternatives || [])
        .filter((alt: any) => alt.categoryId !== aiResult.categoryId)
        .slice(0, 3);

      return {
        categoryId: aiResult.categoryId,
        categoryName: selectedCategory?.name || 'Uncategorized',
        confidence: Math.min(100, Math.max(0, aiResult.confidence || 75)),
        reasoning: aiResult.reasoning || 'AI-powered categorization based on transaction details',
        alternativeCategories: alternatives.map((alt: any) => ({
          categoryId: alt.categoryId,
          categoryName: categories.find(cat => cat.id === alt.categoryId)?.name || 'Unknown',
          confidence: Math.min(100, Math.max(0, alt.confidence || 50)),
        })),
      };

    } catch (error) {
      console.error('Transaction categorization error:', error);
      
      // Return default categorization
      return {
        categoryId: 'default-expense',
        categoryName: 'General Expense',
        confidence: 30,
        reasoning: 'Default categorization due to system error',
        alternativeCategories: [],
      };
    }
  }

  private fallbackCategorization(
    description: string,
    amount: number,
    vendor: string | undefined,
    categories: ExpenseCategory[]
  ): SmartCategorization {
    const desc = description.toLowerCase();
    const vendorLower = vendor?.toLowerCase() || '';
    
    // Rule-based matching
    const rules = [
      { keywords: ['uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking'], category: 'travel', confidence: 85 },
      { keywords: ['restaurant', 'food', 'lunch', 'dinner', 'coffee', 'starbucks'], category: 'meals', confidence: 80 },
      { keywords: ['office', 'supplies', 'staples', 'amazon', 'equipment'], category: 'office-supplies', confidence: 75 },
      { keywords: ['software', 'subscription', 'saas', 'hosting'], category: 'software', confidence: 85 },
      { keywords: ['rent', 'lease', 'utilities', 'electric', 'water', 'internet'], category: 'facilities', confidence: 90 },
      { keywords: ['advertising', 'marketing', 'google ads', 'facebook'], category: 'marketing', confidence: 80 },
    ];

    for (const rule of rules) {
      if (rule.keywords.some(keyword => desc.includes(keyword) || vendorLower.includes(keyword))) {
        const matchingCategory = categories.find(cat => 
          cat.name.toLowerCase().includes(rule.category) ||
          (cat.keywords && cat.keywords.some((k: string) => k.toLowerCase().includes(rule.category)))
        );

        if (matchingCategory) {
          return {
            categoryId: matchingCategory.id,
            categoryName: matchingCategory.name,
            confidence: rule.confidence,
            reasoning: `Matched keywords: ${rule.keywords.filter(k => desc.includes(k) || vendorLower.includes(k)).join(', ')}`,
            alternativeCategories: [],
          };
        }
      }
    }

    // Default fallback
    const defaultCategory = categories.find(cat => cat.name.toLowerCase().includes('general')) || categories[0];
    return {
      categoryId: defaultCategory?.id || 'uncategorized',
      categoryName: defaultCategory?.name || 'Uncategorized',
      confidence: 40,
      reasoning: 'No specific rules matched, using default category',
      alternativeCategories: [],
    };
  }

  // Receipt Processing with OCR and AI
  async processReceipt(
    tenantId: string,
    fileUrl: string,
    fileName: string,
    uploadedBy: string
  ): Promise<ReceiptAnalysis> {
    try {
      let aiAnalysis = null;

      if (openai) {
        try {
          // In a real implementation, you would extract text from the image first
          // For now, we'll simulate the OCR process
          const mockOcrText = `
            Receipt from Tech Supplies Inc.
            Date: 2025-01-08
            
            Items:
            - Office Chair x1 - $299.99
            - Desk Lamp x2 - $49.99 each
            - Notebook Pack x5 - $12.99 each
            
            Subtotal: $464.92
            Tax (8.5%): $39.52
            Total: $504.44
          `;

          const response = await openai.chat.completions.create({
            model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages: [
              {
                role: "system",
                content: `Extract structured data from receipt text. Return JSON with vendor, totalAmount, date, items array with (description, quantity, unitPrice, totalPrice), taxes array, and confidence score.`
              },
              {
                role: "user",
                content: `Extract data from this receipt text:\n\n${mockOcrText}`
              }
            ],
            response_format: { type: "json_object" },
            max_tokens: 1000
          });

          aiAnalysis = JSON.parse(response.choices[0].message.content || '{}');
        } catch (aiError) {
          console.warn('AI receipt analysis failed, using fallback:', aiError);
        }
      }

      // Fallback analysis
      const fallbackAnalysis = {
        vendor: 'Unknown Vendor',
        totalAmount: 0,
        date: new Date().toISOString().split('T')[0],
        items: [],
        taxes: [],
        confidence: 50,
      };

      const analysis = aiAnalysis || fallbackAnalysis;

      // Get smart categorization for the receipt
      const categorization = await this.categorizeTransaction(
        tenantId,
        `Receipt from ${analysis.vendor}`,
        analysis.totalAmount,
        analysis.vendor,
        'receipt'
      );

      return {
        ...analysis,
        suggestedCategory: categorization,
      };

    } catch (error) {
      console.error('Receipt processing error:', error);
      
      return {
        vendor: 'Unknown Vendor',
        totalAmount: 0,
        date: new Date().toISOString().split('T')[0],
        items: [],
        taxes: [],
        confidence: 30,
        suggestedCategory: {
          categoryId: 'default-expense',
          categoryName: 'General Expense',
          confidence: 30,
          reasoning: 'Default due to processing error',
          alternativeCategories: [],
        },
      };
    }
  }

  // Expense Category Management
  async createExpenseCategory(data: InsertExpenseCategory): Promise<ExpenseCategory> {
    const [category] = await db.insert(expenseCategories).values(data).returning();
    return category;
  }

  async getExpenseCategories(tenantId: string): Promise<ExpenseCategory[]> {
    return await db
      .select()
      .from(expenseCategories)
      .where(and(eq(expenseCategories.tenantId, tenantId), eq(expenseCategories.isActive, true)))
      .orderBy(asc(expenseCategories.sortOrder), asc(expenseCategories.name));
  }

  async updateExpenseCategory(
    id: string,
    tenantId: string,
    data: Partial<ExpenseCategory>
  ): Promise<ExpenseCategory> {
    const [category] = await db
      .update(expenseCategories)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(expenseCategories.id, id), eq(expenseCategories.tenantId, tenantId)))
      .returning();
    return category;
  }

  // Smart Bank Reconciliation
  async suggestReconciliation(
    tenantId: string,
    bankAccountId: string,
    statementDate: string
  ): Promise<ReconciliationSuggestion[]> {
    try {
      // Get unreconciled bank transactions and book transactions around the statement date
      const dateRange = {
        start: new Date(statementDate),
        end: new Date(statementDate),
      };
      dateRange.start.setDate(dateRange.start.getDate() - 7); // 7 days before
      dateRange.end.setDate(dateRange.end.getDate() + 7); // 7 days after

      // Get book transactions in the date range
      const bookTransactions = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.tenantId, tenantId),
            gte(transactions.date, dateRange.start.toISOString().split('T')[0]),
            lte(transactions.date, dateRange.end.toISOString().split('T')[0])
          )
        );

      // Mock bank transactions (in reality, these would come from bank feeds)
      const mockBankTransactions = [
        { id: 'bank-1', description: 'Office Supplies Inc', amount: -299.99, date: statementDate },
        { id: 'bank-2', description: 'Gas Station', amount: -45.67, date: statementDate },
        { id: 'bank-3', description: 'Client Payment', amount: 1500.00, date: statementDate },
      ];

      const suggestions: ReconciliationSuggestion[] = [];

      // Simple matching algorithm
      for (const bankTx of mockBankTransactions) {
        for (const bookTx of bookTransactions) {
          const amountMatch = Math.abs(Number(bookTx.amount) - Math.abs(bankTx.amount)) < 0.01;
          const dateMatch = bookTx.date === bankTx.date;
          const descMatch = this.calculateDescriptionSimilarity(bookTx.description, bankTx.description) > 0.7;

          if (amountMatch && (dateMatch || descMatch)) {
            suggestions.push({
              bankTransactionId: bankTx.id,
              bookTransactionId: bookTx.id,
              matchConfidence: dateMatch && descMatch ? 95 : (dateMatch || descMatch ? 80 : 60),
              matchReason: `Matched on ${amountMatch ? 'amount' : ''}${dateMatch ? ', date' : ''}${descMatch ? ', description' : ''}`,
              adjustmentRequired: !amountMatch,
              adjustmentAmount: amountMatch ? undefined : Math.abs(Number(bookTx.amount) - Math.abs(bankTx.amount)),
            });
          }
        }
      }

      return suggestions.sort((a, b) => b.matchConfidence - a.matchConfidence);

    } catch (error) {
      console.error('Reconciliation suggestion error:', error);
      return [];
    }
  }

  private calculateDescriptionSimilarity(desc1: string, desc2: string): number {
    // Simple similarity calculation using common words
    const words1 = desc1.toLowerCase().split(/\s+/);
    const words2 = desc2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return commonWords.length / totalWords;
  }

  // Bookkeeping Insights and Analytics
  async getBookkeepingInsights(tenantId: string, periodStart: string, periodEnd: string): Promise<BookkeepingInsights> {
    try {
      // Get transactions for the period
      const periodTransactions = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.tenantId, tenantId),
            gte(transactions.date, periodStart),
            lte(transactions.date, periodEnd)
          )
        );

      // Calculate monthly spending
      const expenses = periodTransactions.filter(tx => Number(tx.amount) < 0);
      const monthlySpending = expenses.reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);

      // Get category spending
      const categorySpending = new Map<string, number>();
      for (const tx of expenses) {
        const category = tx.category || 'Uncategorized';
        categorySpending.set(category, (categorySpending.get(category) || 0) + Math.abs(Number(tx.amount)));
      }

      const topCategories = Array.from(categorySpending.entries())
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: (amount / monthlySpending) * 100,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Identify unusual transactions (amounts significantly above average)
      const amounts = expenses.map(tx => Math.abs(Number(tx.amount)));
      const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      const stdDev = Math.sqrt(amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length);
      
      const unusualTransactions = expenses
        .filter(tx => Math.abs(Number(tx.amount)) > avgAmount + (2 * stdDev))
        .map(tx => ({
          id: tx.id.toString(),
          description: tx.description,
          amount: Math.abs(Number(tx.amount)),
          reason: 'Amount significantly above average',
        }))
        .slice(0, 5);

      // Calculate tax-deductible total
      const taxDeductibleTotal = expenses
        .filter(tx => tx.taxDeductible)
        .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);

      // Check budget alerts (mock implementation)
      const categories = await this.getExpenseCategories(tenantId);
      const budgetAlerts = categories
        .filter(cat => Number(cat.budgetAmount) > 0)
        .map(cat => {
          const actualAmount = categorySpending.get(cat.name) || 0;
          const budgetAmount = Number(cat.budgetAmount);
          return {
            category: cat.name,
            budgetAmount,
            actualAmount,
            overBy: actualAmount - budgetAmount,
          };
        })
        .filter(alert => alert.overBy > 0)
        .sort((a, b) => b.overBy - a.overBy);

      return {
        monthlySpending,
        topCategories,
        unusualTransactions,
        taxDeductibleTotal,
        budgetAlerts,
      };

    } catch (error) {
      console.error('Bookkeeping insights error:', error);
      return {
        monthlySpending: 0,
        topCategories: [],
        unusualTransactions: [],
        taxDeductibleTotal: 0,
        budgetAlerts: [],
      };
    }
  }

  // Receipt Management
  async createReceipt(data: InsertReceipt): Promise<Receipt> {
    const [receipt] = await db.insert(receipts).values(data).returning();
    return receipt;
  }

  async getReceipts(tenantId: string, filters?: {
    startDate?: string;
    endDate?: string;
    vendor?: string;
    categoryId?: string;
    minAmount?: number;
    maxAmount?: number;
  }): Promise<Receipt[]> {
    let query = db.select().from(receipts).where(eq(receipts.tenantId, tenantId));

    if (filters?.startDate) {
      query = query.where(gte(receipts.receiptDate, filters.startDate));
    }
    if (filters?.endDate) {
      query = query.where(lte(receipts.receiptDate, filters.endDate));
    }
    if (filters?.vendor) {
      query = query.where(ilike(receipts.vendor, `%${filters.vendor}%`));
    }
    if (filters?.categoryId) {
      query = query.where(eq(receipts.categoryId, filters.categoryId));
    }
    if (filters?.minAmount) {
      query = query.where(gte(receipts.totalAmount, filters.minAmount.toString()));
    }
    if (filters?.maxAmount) {
      query = query.where(lte(receipts.totalAmount, filters.maxAmount.toString()));
    }

    return await query.orderBy(desc(receipts.receiptDate));
  }

  async updateReceipt(id: string, tenantId: string, data: Partial<Receipt>): Promise<Receipt> {
    const [receipt] = await db
      .update(receipts)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(receipts.id, id), eq(receipts.tenantId, tenantId)))
      .returning();
    return receipt;
  }

  // Bank Reconciliation
  async createBankReconciliation(data: InsertBankReconciliation): Promise<BankReconciliation> {
    const [reconciliation] = await db.insert(bankReconciliations).values(data).returning();
    return reconciliation;
  }

  async getBankReconciliations(tenantId: string, bankAccountId?: string): Promise<BankReconciliation[]> {
    let query = db.select().from(bankReconciliations).where(eq(bankReconciliations.tenantId, tenantId));

    if (bankAccountId) {
      query = query.where(eq(bankReconciliations.bankAccountId, bankAccountId));
    }

    return await query.orderBy(desc(bankReconciliations.reconciliationDate));
  }

  // Dashboard Metrics
  async getBookkeepingMetrics(tenantId: string): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    pendingReceipts: number;
    unreconciled: number;
    taxDeductible: number;
    topCategory: string;
  }> {
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const monthlyTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.tenantId, tenantId),
          gte(transactions.date, startOfMonth.toISOString().split('T')[0]),
          lte(transactions.date, endOfMonth.toISOString().split('T')[0])
        )
      );

    const revenue = monthlyTransactions
      .filter(tx => Number(tx.amount) > 0)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const expenses = monthlyTransactions
      .filter(tx => Number(tx.amount) < 0)
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);

    const pendingReceiptsCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(receipts)
      .where(
        and(
          eq(receipts.tenantId, tenantId),
          eq(receipts.processingStatus, 'pending')
        )
      );

    const taxDeductible = monthlyTransactions
      .filter(tx => tx.taxDeductible && Number(tx.amount) < 0)
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);

    // Calculate top spending category
    const categorySpending = new Map<string, number>();
    monthlyTransactions
      .filter(tx => Number(tx.amount) < 0)
      .forEach(tx => {
        const category = tx.category || 'Uncategorized';
        categorySpending.set(category, (categorySpending.get(category) || 0) + Math.abs(Number(tx.amount)));
      });

    const topCategory = Array.from(categorySpending.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'No expenses';

    return {
      totalRevenue: revenue,
      totalExpenses: expenses,
      netIncome: revenue - expenses,
      pendingReceipts: Number(pendingReceiptsCount[0]?.count) || 0,
      unreconciled: 3, // Mock value - would calculate from actual reconciliation data
      taxDeductible,
      topCategory,
    };
  }
}

export const modernBookkeepingService = ModernBookkeepingService.getInstance();