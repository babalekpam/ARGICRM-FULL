import { WebSocket } from 'ws';
import { db } from './db';
import { bankAccounts, bankTransactions, transactions } from '../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

// Bank API Integration Service
export class BankFeedService {
  private static instance: BankFeedService;
  private wsConnections: Set<WebSocket> = new Set();
  private syncIntervals: Map<number, NodeJS.Timeout> = new Map();
  private readonly syncFrequency = 60000; // 1 minute for demo, typically 15-30 minutes

  static getInstance(): BankFeedService {
    if (!BankFeedService.instance) {
      BankFeedService.instance = new BankFeedService();
    }
    return BankFeedService.instance;
  }

  // Add WebSocket connection for real-time updates
  addConnection(ws: WebSocket) {
    this.wsConnections.add(ws);
    ws.on('close', () => {
      this.wsConnections.delete(ws);
    });
  }

  // Broadcast real-time updates to all connected clients
  private broadcast(data: any) {
    const message = JSON.stringify(data);
    this.wsConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  // Start real-time synchronization for a bank account
  async startSync(bankAccountId: number): Promise<void> {
    // Stop existing sync if any
    this.stopSync(bankAccountId);

    // Start new sync interval
    const interval = setInterval(async () => {
      await this.syncBankAccount(bankAccountId);
    }, this.syncFrequency);

    this.syncIntervals.set(bankAccountId, interval);

    // Initial sync
    await this.syncBankAccount(bankAccountId);
  }

  // Stop synchronization for a bank account
  stopSync(bankAccountId: number): void {
    const interval = this.syncIntervals.get(bankAccountId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(bankAccountId);
    }
  }

  // Sync bank account transactions
  private async syncBankAccount(bankAccountId: number): Promise<void> {
    try {
      
      // Fetch bank account details
      const account = await db
        .select()
        .from(bankAccounts)
        .where(eq(bankAccounts.id, bankAccountId))
        .limit(1);

      if (!account.length) {
        console.error(`Bank account ${bankAccountId} not found`);
        return;
      }

      const bankAccount = account[0];

      // Simulate bank API call - in production, this would connect to actual bank APIs
      const newTransactions = await this.fetchBankTransactions(bankAccount);

      if (newTransactions.length > 0) {
        // Process and store new transactions
        await this.processNewTransactions(bankAccountId, newTransactions);

        // Update account balance
        const latestBalance = newTransactions[0]?.balance || bankAccount.currentBalance;
        await db
          .update(bankAccounts)
          .set({ 
            currentBalance: latestBalance,
            updatedAt: new Date()
          })
          .where(eq(bankAccounts.id, bankAccountId));

        // Broadcast real-time update
        this.broadcast({
          type: 'bank_sync_update',
          bankAccountId,
          newTransactions: newTransactions.length,
          newBalance: latestBalance,
          timestamp: new Date().toISOString()
        });

      }

    } catch (error) {
      console.error(`Error syncing bank account ${bankAccountId}:`, error);
      this.broadcast({
        type: 'bank_sync_error',
        bankAccountId,
        error: 'Failed to sync bank account',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Simulate fetching transactions from bank API
  private async fetchBankTransactions(bankAccount: any): Promise<any[]> {
    // In production, this would connect to bank APIs like Plaid, Yodlee, or Open Banking
    // For demo, we'll simulate realistic bank transactions
    
    const transactionTemplates = [
      { description: 'ACH Credit - Customer Payment', type: 'credit', category: 'Revenue' },
      { description: 'Wire Transfer - Invoice Payment', type: 'credit', category: 'Revenue' },
      { description: 'Card Payment - Office Supplies', type: 'debit', category: 'Office Expenses' },
      { description: 'ACH Debit - Utilities Payment', type: 'debit', category: 'Utilities' },
      { description: 'Check Deposit - Client Payment', type: 'credit', category: 'Revenue' },
      { description: 'Online Transfer - Marketing Campaign', type: 'debit', category: 'Marketing' },
      { description: 'Direct Deposit - Refund', type: 'credit', category: 'Other Income' },
      { description: 'Monthly Service Fee', type: 'debit', category: 'Bank Fees' }
    ];

    // Generate 0-3 random transactions per sync (simulating real bank activity)
    const numTransactions = Math.floor(Math.random() * 4);
    const newTransactions = [];

    let currentBalance = parseFloat(bankAccount.currentBalance || '0');

    for (let i = 0; i < numTransactions; i++) {
      const template = transactionTemplates[Math.floor(Math.random() * transactionTemplates.length)];
      const amount = parseFloat((Math.random() * 2000 + 50).toFixed(2));
      const finalAmount = template.type === 'debit' ? -amount : amount;
      
      currentBalance += finalAmount;

      newTransactions.push({
        transactionDate: new Date().toISOString().split('T')[0],
        description: template.description,
        amount: finalAmount.toFixed(2),
        transactionType: template.type,
        balance: currentBalance.toFixed(2),
        reference: `TXN-${Date.now()}-${i}`,
        category: template.category,
        reconciliationStatus: 'unmatched'
      });
    }

    return newTransactions;
  }

  // Process and store new bank transactions
  private async processNewTransactions(bankAccountId: number, transactions: any[]): Promise<void> {
    for (const txn of transactions) {
      try {
        // Insert bank transaction
        await db.insert(bankTransactions).values({
          bankAccountId,
          transactionDate: txn.transactionDate,
          description: txn.description,
          amount: txn.amount,
          transactionType: txn.transactionType,
          balance: txn.balance,
          reference: txn.reference,
          category: txn.category,
          reconciliationStatus: txn.reconciliationStatus
        });

        // Auto-match with existing transactions
        await this.attemptAutoMatch(txn, bankAccountId);

      } catch (error) {
        console.error('Error inserting bank transaction:', error);
      }
    }
  }

  // Attempt to automatically match bank transactions with existing transactions
  private async attemptAutoMatch(bankTxn: any, bankAccountId: number): Promise<void> {
    try {
      // Simple matching logic - in production, this would be more sophisticated
      const matchingTransactions = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.description, bankTxn.description),
            eq(transactions.amount, Math.abs(parseFloat(bankTxn.amount)))
          )
        )
        .limit(1);

      if (matchingTransactions.length > 0) {
        // Update bank transaction as matched
        await db
          .update(bankTransactions)
          .set({
            matchedTransactionId: matchingTransactions[0].id,
            reconciliationStatus: 'matched',
            reconciliationDate: new Date()
          })
          .where(
            and(
              eq(bankTransactions.bankAccountId, bankAccountId),
              eq(bankTransactions.reference, bankTxn.reference)
            )
          );

      }
    } catch (error) {
      console.error('Error in auto-matching:', error);
    }
  }

  // Get sync status for all bank accounts
  async getSyncStatus(): Promise<any[]> {
    const accounts = await db.select().from(bankAccounts).where(eq(bankAccounts.isActive, true));
    
    return accounts.map(account => ({
      id: account.id,
      accountName: account.accountName,
      bankName: account.bankName,
      isActive: this.syncIntervals.has(account.id),
      lastSync: account.updatedAt,
      balance: account.currentBalance
    }));
  }

  // Manual sync trigger
  async triggerManualSync(bankAccountId: number): Promise<void> {
    await this.syncBankAccount(bankAccountId);
    
    this.broadcast({
      type: 'manual_sync_complete',
      bankAccountId,
      timestamp: new Date().toISOString()
    });
  }

  // Cleanup - stop all syncs
  cleanup(): void {
    this.syncIntervals.forEach((interval, accountId) => {
      clearInterval(interval);
    });
    this.syncIntervals.clear();
    this.wsConnections.clear();
  }
}

// Export singleton instance
export const bankFeedService = BankFeedService.getInstance();