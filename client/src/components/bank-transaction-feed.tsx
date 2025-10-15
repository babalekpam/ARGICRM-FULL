import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react';

interface BankTransaction {
  id: number;
  transactionDate: string;
  description: string;
  amount: number;
  transactionType: 'credit' | 'debit';
  balance: number;
  reference: string;
  category: string;
  reconciliationStatus: 'matched' | 'unmatched' | 'disputed';
  reconciliationDate?: string;
  matchedTransactionId?: number;
}

interface BankTransactionFeedProps {
  bankAccountId: number;
  onTransactionUpdate?: (transaction: BankTransaction) => void;
}

export default function BankTransactionFeed({ 
  bankAccountId, 
  onTransactionUpdate 
}: BankTransactionFeedProps) {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'matched' | 'unmatched' | 'disputed'>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
    
    // Set up WebSocket for real-time updates
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'bank_sync_update' && data.bankAccountId === bankAccountId) {
        // Refresh transactions when new ones are synced
        fetchTransactions();
        
        toast({
          title: 'New Transactions',
          description: `${data.newTransactions} new transaction(s) synced from your bank.`,
        });
      }
    };

    return () => {
      socket.close();
    };
  }, [bankAccountId]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bank-transactions/${bankAccountId}?limit=100`);
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching bank transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch bank transactions.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getReconciliationIcon = (status: string) => {
    switch (status) {
      case 'matched':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'disputed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getReconciliationBadge = (status: string) => {
    switch (status) {
      case 'matched':
        return <Badge variant="default" className="bg-green-500">Matched</Badge>;
      case 'disputed':
        return <Badge variant="destructive">Disputed</Badge>;
      default:
        return <Badge variant="secondary">Unmatched</Badge>;
    }
  };

  const filteredTransactions = transactions.filter(txn => {
    if (filter === 'all') return true;
    return txn.reconciliationStatus === filter;
  });

  const stats = {
    total: transactions.length,
    matched: transactions.filter(t => t.reconciliationStatus === 'matched').length,
    unmatched: transactions.filter(t => t.reconciliationStatus === 'unmatched').length,
    disputed: transactions.filter(t => t.reconciliationStatus === 'disputed').length
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-pulse mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">Loading transactions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Live Bank Transaction Feed
          </div>
          <Button variant="outline" size="sm" onClick={fetchTransactions}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-blue-500">Total Transactions</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-lg font-bold text-green-600">{stats.matched}</div>
            <div className="text-xs text-green-500">Matched</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-lg font-bold text-yellow-600">{stats.unmatched}</div>
            <div className="text-xs text-yellow-500">Unmatched</div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-lg font-bold text-red-600">{stats.disputed}</div>
            <div className="text-xs text-red-500">Disputed</div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex space-x-2 mb-4">
          {['all', 'matched', 'unmatched', 'disputed'].map((filterOption) => (
            <Button
              key={filterOption}
              variant={filter === filterOption ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(filterOption as any)}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </Button>
          ))}
        </div>

        {/* Transaction Feed */}
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No transactions found</p>
                <p className="text-sm">
                  {filter === 'all' 
                    ? 'Bank transactions will appear here as they are synced'
                    : `No ${filter} transactions found`
                  }
                </p>
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {transaction.transactionType === 'credit' ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                      {getReconciliationIcon(transaction.reconciliationStatus)}
                    </div>
                    
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(transaction.transactionDate)} • {transaction.category}
                      </div>
                      <div className="text-xs text-gray-400">
                        Ref: {transaction.reference}
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className={`font-bold ${
                      transaction.transactionType === 'credit' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {transaction.transactionType === 'credit' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Balance: {formatCurrency(transaction.balance)}
                    </div>
                    {getReconciliationBadge(transaction.reconciliationStatus)}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {transactions.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </span>
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live updates active</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}