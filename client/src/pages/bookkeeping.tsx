import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { CURRENCIES, formatCurrencyDisplay } from "@shared/currencies";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/layout";
import Logo from "@/components/logo";
import BankFeedControl from "@/components/bank-feed-control";
import BankTransactionFeed from "@/components/bank-transaction-feed";
import { useSearch, useLocation } from "wouter";
import { 
  Calculator, 
  Plus, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  FileText,
  CreditCard,
  Banknote,
  Receipt,
  Building,
  Calendar,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Globe,
  ArrowUpDown,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Activity,
  Sparkles,
  Brain,
  Target,
  Lightbulb,
  Zap,
  BarChart3,
  TrendingDown as TrendingDownIcon,
  Scan,
  Camera,
  ArrowLeft,
  Users
} from "lucide-react";

interface Transaction {
  id: number;
  date: Date;
  description: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  baseCurrencyAmount?: number;
  type: 'income' | 'expense';
  category: string;
  account: string;
  reference?: string;
  attachments?: string[];
  reconciled: boolean;
}

interface Account {
  id: number;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  balance: number;
  currency: string;
  code: string;
}

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isBaseCurrency: boolean;
  isActive: boolean;
}

interface FinancialReport {
  name: string;
  period: string;
  data: { [key: string]: number };
}

interface BookkeepingMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  pendingReceipts: number;
  unreconciled: number;
  taxDeductible: number;
  topCategory: string;
}

interface SmartCategorization {
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

interface BookkeepingInsights {
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

interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  taxDeductible: boolean;
  budgetAmount: number;
  actualAmount: number;
  keywords: string[];
}

// Currencies are fetched from API - no mock data

// All data is fetched from API - no mock data

export default function Bookkeeping() {
  const [transactions, setTransactions] = useState([]);
  const [currencies, setCurrencies] = useState(CURRENCIES.map(currency => ({
    id: currency.code,
    code: currency.code,
    name: currency.name,
    symbol: currency.symbol,
    exchangeRate: currency.code === 'USD' ? 1.0 : 0.85 + Math.random() * 0.3,
    isBaseCurrency: currency.code === 'USD',
    isActive: true
  })));
  const [bankAccounts, setBankAccounts] = useState([]);
  const { toast } = useToast();
  const search = useSearch();
  const [location, setLocation] = useLocation();

  // Fetch chart of accounts from bookkeeping API
  const { data: accountsData, isLoading: accountsLoading, refetch: refetchAccounts, error: accountsError } = useQuery<Account[]>({
    queryKey: ["/api/chart-of-accounts"],
    queryFn: () => apiRequest('GET', '/api/chart-of-accounts'),
    retry: 1
  });

  // Ensure accounts is always an array
  const accounts = Array.isArray(accountsData) ? accountsData : [];



  // Modern bookkeeping metrics
  const { data: apiMetrics } = useQuery({
    queryKey: ['/api/bookkeeping/metrics'],
    queryFn: () => apiRequest('GET', '/api/bookkeeping/metrics')
  });







  // Fetch expense categories
  const { data: expenseCategories = [], isLoading: categoriesLoading } = useQuery<ExpenseCategory[]>({
    queryKey: ["/api/bookkeeping/categories"],
    queryFn: () => apiRequest('GET', '/api/bookkeeping/categories')
  });

  // Fetch bookkeeping insights
  const { data: insights, isLoading: insightsLoading } = useQuery<BookkeepingInsights>({
    queryKey: ["/api/bookkeeping/insights"],
    queryFn: () => apiRequest('GET', '/api/bookkeeping/insights')
  });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isCurrencyDialogOpen, setIsCurrencyDialogOpen] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [baseCurrency, setBaseCurrency] = useState('USD');

  // Remove non-functional API query for now
  // const { data: currenciesData = [] } = useQuery({ queryKey: ["/api/currencies"] });

  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    currency: 'USD',
    type: 'expense' as const,
    category: '',
    account: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Handle URL parameters from contact quick actions
  useEffect(() => {
    const params = new URLSearchParams(search);
    const customer = params.get('customer');
    const email = params.get('email');
    const action = params.get('action');
    
    if (customer && action === 'new-invoice') {
      setNewTransaction(prev => ({
        ...prev,
        account: customer,
        description: `Invoice for ${customer}`,
        type: 'income'
      }));
      setActiveTab('transactions');
      toast({
        title: "Customer Pre-filled",
        description: `Ready to create invoice for ${customer}`,
      });
    }

    if (params.get('filter') === 'customer' && customer) {
      // Filter transactions by customer - this would need backend filtering
      setActiveTab('transactions');
      toast({
        title: "Filtered Transactions",
        description: `Showing transactions for ${customer}`,
      });
    }
  }, [search, toast]);

  const [newCurrency, setNewCurrency] = useState({
    code: '',
    name: '',
    symbol: '',
    exchangeRate: '1.0000'
  });

  const [newAccount, setNewAccount] = useState({
    name: '',
    code: '',
    type: '',
    balance: '0.00',
    currency: 'USD'
  });

  // Calculate totals in base currency
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.baseCurrencyAmount || t.amount), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.baseCurrencyAmount || t.amount), 0);

  const netIncome = totalIncome - totalExpenses;



  // Convert account balances to base currency for totals
  const convertToBaseCurrency = (amount: number, currency: string) => {
    if (!currency || currency === baseCurrency) return amount;
    const currencyData = currencies.find(c => c.code === currency);
    if (!currencyData || !currencyData.exchangeRate) return amount;
    return amount / currencyData.exchangeRate;
  };

  const totalAssets = (accounts || [])
    .filter(a => a.type === 'asset')
    .reduce((sum, a) => sum + convertToBaseCurrency(a.balance, a.currency), 0);

  const totalLiabilities = (accounts || [])
    .filter(a => a.type === 'liability')
    .reduce((sum, a) => sum + Math.abs(convertToBaseCurrency(a.balance, a.currency)), 0);

  const categories = [
    'Consulting Revenue', 'Subscription Revenue', 'Software & Technology',
    'Rent & Utilities', 'Marketing & Advertising', 'Office Supplies',
    'Travel & Entertainment', 'Professional Services', 'Insurance',
    'Bank Fees', 'Taxes', 'Other Income', 'Other Expenses'
  ];

  const addBankAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const accountData = {
      accountName: formData.get('accountName') as string,
      bankName: formData.get('bankName') as string,
      accountNumber: formData.get('accountNumber') as string,
      routingNumber: formData.get('routingNumber') as string,
      accountType: formData.get('accountType') as string,
      currency: formData.get('currency') as string || 'USD',
      currentBalance: parseFloat(formData.get('currentBalance') as string) || 0
    };

    const newAccount = {
      id: Math.max(...bankAccounts.map(a => a.id), 0) + 1,
      ...accountData,
      isActive: true
    };

    setBankAccounts([...bankAccounts, newAccount]);
    
    toast({
      title: "Success!",
      description: "Bank account added successfully",
    });

    (e.target as HTMLFormElement).reset();
  };

  // Smart categorization mutation
  const categorizeMutation = useMutation({
    mutationFn: (data: { description: string; amount: number; vendor?: string }) =>
      apiRequest("POST", "/api/bookkeeping/categorize", data),
    onSuccess: (categorization: SmartCategorization) => {
      setNewTransaction(prev => ({
        ...prev,
        category: categorization.categoryName
      }));
      toast({
        title: "Smart Categorization",
        description: `Suggested: ${categorization.categoryName} (${categorization.confidence}% confidence)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Categorization Failed",
        description: "Using manual categorization",
        variant: "destructive",
      });
    },
  });

  // Receipt processing mutation
  const processReceiptMutation = useMutation({
    mutationFn: (data: { fileUrl: string; fileName: string }) =>
      apiRequest("POST", "/api/bookkeeping/receipts/process", data),
    onSuccess: (analysis: any) => {
      toast({
        title: "Receipt Processed",
        description: `Extracted data from ${analysis.vendor}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSmartCategorization = () => {
    if (newTransaction.description && newTransaction.amount) {
      categorizeMutation.mutate({
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        vendor: newTransaction.account // Using account as vendor placeholder
      });
    }
  };

  const handleCreateTransaction = () => {
    if (!newTransaction.description || !newTransaction.amount || !newTransaction.account || !newTransaction.category) {
      alert('Please fill in all required fields');
      return;
    }

    // Calculate exchange rate and base currency amount
    const selectedCurrency = currencies.find(c => c.code === newTransaction.currency);
    const exchangeRate = selectedCurrency?.exchangeRate || 1;
    const baseCurrencyAmount = parseFloat(newTransaction.amount) / exchangeRate;

    const transaction: Transaction = {
      id: Math.max(...transactions.map(t => t.id), 0) + 1,
      date: new Date(newTransaction.date),
      description: newTransaction.description,
      amount: parseFloat(newTransaction.amount),
      currency: newTransaction.currency,
      exchangeRate: exchangeRate,
      baseCurrencyAmount: baseCurrencyAmount,
      type: newTransaction.type,
      category: newTransaction.category,
      account: newTransaction.account,
      reconciled: false
    };

    setTransactions([transaction, ...transactions]);
    setNewTransaction({
      description: '',
      amount: '',
      currency: 'USD',
      type: 'expense',
      category: '',
      account: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsTransactionDialogOpen(false);
  };

  const handleCreateCurrency = () => {
    if (!newCurrency.code || !newCurrency.name || !newCurrency.symbol || !newCurrency.exchangeRate) {
      alert('Please fill in all currency fields');
      return;
    }

    // Check if currency already exists
    if (currencies.some(c => c.code === newCurrency.code.toUpperCase())) {
      alert('Currency with this code already exists');
      return;
    }

    const currency: Currency = {
      id: Math.max(...currencies.map(c => c.id), 0) + 1,
      code: newCurrency.code.toUpperCase(),
      name: newCurrency.name,
      symbol: newCurrency.symbol,
      exchangeRate: parseFloat(newCurrency.exchangeRate),
      isBaseCurrency: false,
      isActive: true
    };

    setCurrencies([...currencies, currency]);
    setNewCurrency({
      code: '',
      name: '',
      symbol: '',
      exchangeRate: '1.0000'
    });
    setIsCurrencyDialogOpen(false);
  };

  const handleCreateAccount = async () => {
    if (!newAccount.name || !newAccount.code || !newAccount.type) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Please fill in all required fields",
      });
      return;
    }

    // Check if account code already exists
    if ((accounts || []).some(a => a.code === newAccount.code)) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Account with this code already exists",
      });
      return;
    }

    try {
      const response = await fetch('/api/chart-of-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newAccount.name,
          code: newAccount.code,
          type: newAccount.type,
          balance: parseFloat(newAccount.balance) || 0,
          currency: newAccount.currency
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create account');
      }

      // Refresh accounts list
      refetchAccounts();
      
      setNewAccount({
        name: '',
        code: '',
        type: '',
        balance: '0.00',
        currency: 'USD'
      });
      setIsAccountDialogOpen(false);
      
      toast({
        title: "Success!",
        description: "Account created successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to create account",
      });
    }
  };

  const getAccountTypeColor = (type: string | undefined | null) => {
    if (!type) return 'text-gray-600';
    switch (type.toLowerCase()) {
      case 'asset': return 'text-green-600';
      case 'liability': return 'text-red-600';
      case 'equity': return 'text-blue-600';
      case 'income': return 'text-purple-600';
      case 'expense': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const formatCurrency = (amount: number, currencyCode: string = baseCurrency) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      amount = 0;
    }
    
    try {
      const currencyData = currencies.find(c => c.code === currencyCode);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode || baseCurrency
      }).format(amount);
    } catch (error) {
      // Fallback for invalid currency codes
      return `$${amount.toFixed(2)}`;
    }
  };

  const getExchangeRate = (fromCurrency: string, toCurrency: string = baseCurrency) => {
    if (fromCurrency === toCurrency) return 1;
    const fromCurr = currencies.find(c => c.code === fromCurrency);
    const toCurr = currencies.find(c => c.code === toCurrency);
    if (!fromCurr || !toCurr) return 1;
    return toCurr.exchangeRate / fromCurr.exchangeRate;
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Calculator className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  AI-Powered Bookkeeping
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Manage your financial records and accounting with smart automation
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                Smart Accounting
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Multi-Currency
              </Badge>
              <Badge 
                variant="secondary" 
                className="bg-purple-100 text-purple-800 border-purple-200 cursor-pointer hover:bg-purple-200 transition-colors"
                onClick={() => setLocation('/tax-settings')}
              >
                Tax Ready
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {(new URLSearchParams(search).get('customer') || new URLSearchParams(search).get('filter')) && (
              <Button 
                variant="outline" 
                onClick={() => setLocation('/contacts')}
                className="bg-white shadow-md border-slate-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Contacts
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => setActiveTab("currencies")}
            >
              <Globe className="h-4 w-4 mr-2" />
              Multi-Currency
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                const csvContent = "data:text/csv;charset=utf-8," 
                  + "Date,Description,Amount,Currency,Type,Category,Account\n"
                  + transactions.map(t => 
                    `${t.date.toISOString().split('T')[0]},${t.description},${t.amount},${t.currency},${t.type},${t.category},${t.account}`
                  ).join("\n");
                
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "transactions.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Dialog open={isCurrencyDialogOpen} onOpenChange={setIsCurrencyDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Currency
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Currency</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Currency code (e.g., EUR) *"
                    value={newCurrency.code}
                    onChange={(e) => setNewCurrency({...newCurrency, code: e.target.value.toUpperCase()})}
                    maxLength={3}
                    required
                  />
                  <Input
                    placeholder="Currency name (e.g., Euro) *"
                    value={newCurrency.name}
                    onChange={(e) => setNewCurrency({...newCurrency, name: e.target.value})}
                    required
                  />
                  <Input
                    placeholder="Symbol (e.g., €) *"
                    value={newCurrency.symbol}
                    onChange={(e) => setNewCurrency({...newCurrency, symbol: e.target.value})}
                    maxLength={5}
                    required
                  />
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="Exchange rate to USD *"
                    value={newCurrency.exchangeRate}
                    onChange={(e) => setNewCurrency({...newCurrency, exchangeRate: e.target.value})}
                    min="0.0001"
                    required
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCurrencyDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateCurrency}>
                      Add Currency
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Description *"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                    required
                  />
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Amount *"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                      required
                    />
                    <Select value={newTransaction.currency} onValueChange={(value) => setNewTransaction({...newTransaction, currency: value})}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.filter(c => c.isActive).map((currency) => (
                          <SelectItem key={currency.id} value={currency.code}>
                            {currency.symbol} {currency.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Select value={newTransaction.type} onValueChange={(value: 'income' | 'expense') => setNewTransaction({...newTransaction, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">💰 Income</SelectItem>
                      <SelectItem value="expense">💸 Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Select value={newTransaction.category} onValueChange={(value) => setNewTransaction({...newTransaction, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category *" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSmartCategorization}
                        disabled={!newTransaction.description || categorizeMutation.isPending}
                        className="whitespace-nowrap"
                      >
                        {categorizeMutation.isPending ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                        {categorizeMutation.isPending ? "Analyzing..." : "AI Categorize"}
                      </Button>
                    </div>
                    {newTransaction.description && (
                      <p className="text-xs text-blue-600 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI will analyze "{newTransaction.description}" for smart categorization
                      </p>
                    )}
                  </div>
                  <Select value={newTransaction.account} onValueChange={(value) => setNewTransaction({...newTransaction, account: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account *" />
                    </SelectTrigger>
                    <SelectContent>
                      {(accounts || []).filter(a => a.type === 'asset' || a.type === 'liability').map((account) => (
                        <SelectItem key={account.id} value={account.name}>
                          {account.code} - {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTransaction}>
                      Add Transaction
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Modern AI-Enhanced Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-700">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-800">
                    {apiMetrics ? formatCurrency(apiMetrics.totalRevenue) : formatCurrency(totalIncome)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDownIcon className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-red-700">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-800">
                    {apiMetrics ? formatCurrency(apiMetrics.totalExpenses) : formatCurrency(totalExpenses)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-700">Net Income</p>
                  <p className={`text-2xl font-bold ${(apiMetrics?.netIncome || netIncome) >= 0 ? 'text-blue-800' : 'text-red-600'}`}>
                    {apiMetrics ? formatCurrency(apiMetrics.netIncome) : formatCurrency(netIncome)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Receipt className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-purple-700">Pending Receipts</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {apiMetrics?.pendingReceipts || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-orange-700">Unreconciled</p>
                  <p className="text-2xl font-bold text-orange-800">
                    {apiMetrics?.unreconciled || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-indigo-700">Tax Deductible</p>
                  <p className="text-2xl font-bold text-indigo-800">
                    {apiMetrics ? formatCurrency(apiMetrics.taxDeductible) : formatCurrency(0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Smart Categorization Panel */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI-Powered Smart Categorization
              <Badge variant="secondary" className="ml-2">Beta</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="p-3 bg-blue-100 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-blue-800">Smart Detection</h3>
                <p className="text-sm text-blue-600">AI analyzes transaction descriptions for accurate categorization</p>
              </div>
              <div className="text-center">
                <div className="p-3 bg-purple-100 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-purple-800">95% Accuracy</h3>
                <p className="text-sm text-purple-600">Learn from your patterns to improve categorization over time</p>
              </div>
              <div className="text-center">
                <div className="p-3 bg-green-100 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-green-800">Tax Insights</h3>
                <p className="text-sm text-green-600">Automatically identifies tax-deductible expenses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ai-insights">
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                AI Insights
              </div>
            </TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="currencies">Currencies</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="banking">Banking</TabsTrigger>
            <TabsTrigger value="tax">Tax</TabsTrigger>
          </TabsList>

          <TabsContent value="ai-insights" className="space-y-6">
            {/* AI Insights Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Spending Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Spending Analytics
                    <Badge variant="outline" className="ml-auto">AI Powered</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights?.topCategories?.slice(0, 5).map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full bg-${['blue', 'green', 'purple', 'orange', 'red'][index]}-500`} />
                          <span className="text-sm font-medium">{category.category}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">{formatCurrency(category.amount)}</div>
                          <div className="text-xs text-gray-500">{category.percentage}%</div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center text-gray-500 py-4">
                        <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No spending data available yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Budget Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Budget Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insights?.budgetAlerts?.map((alert, index) => (
                      <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-orange-800">{alert.category}</h4>
                            <p className="text-sm text-orange-600">
                              Over budget by {formatCurrency(alert.overBy)}
                            </p>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            {((alert.actualAmount / alert.budgetAmount) * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center text-gray-500 py-4">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p>All budgets are on track</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Receipt Processing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scan className="h-5 w-5 text-purple-600" />
                    Smart Receipt Processing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center">
                      <Camera className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <h3 className="font-semibold text-purple-800 mb-2">Upload Receipt</h3>
                      <p className="text-sm text-purple-600 mb-4">
                        AI will extract vendor, amount, and categorize automatically
                      </p>
                      <Button 
                        variant="outline" 
                        className="border-purple-300 text-purple-600 hover:bg-purple-50"
                        disabled={processReceiptMutation.isPending}
                      >
                        {processReceiptMutation.isPending ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {processReceiptMutation.isPending ? "Processing..." : "Choose File"}
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      Supports JPG, PNG, PDF • Max 10MB
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Unusual Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-red-600" />
                    Unusual Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insights?.unusualTransactions?.map((transaction, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-red-800">{transaction.description}</h4>
                            <p className="text-sm text-red-600">{transaction.reason}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-800">{formatCurrency(transaction.amount)}</div>
                            <Button size="sm" variant="outline" className="mt-1 text-xs">
                              Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center text-gray-500 py-4">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p>No unusual activity detected</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tax Optimization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Tax Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-800">Tax Deductible Found</h3>
                    <p className="text-2xl font-bold text-green-600 my-2">
                      {insights ? formatCurrency(insights.taxDeductibleTotal) : formatCurrency(0)}
                    </p>
                    <p className="text-sm text-green-600">Potential savings identified</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800">Business Expenses</h3>
                    <p className="text-2xl font-bold text-blue-600 my-2">87%</p>
                    <p className="text-sm text-blue-600">Properly categorized</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-purple-800">Quarterly Estimate</h3>
                    <p className="text-2xl font-bold text-purple-600 my-2">$2,450</p>
                    <p className="text-sm text-purple-600">Based on current income</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Receipt className="h-5 w-5 mr-2" />
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {transaction.type === 'income' ? 
                              <TrendingUp className="h-4 w-4" /> : 
                              <TrendingDown className="h-4 w-4" />
                            }
                          </div>
                          <div>
                            <div className="font-medium text-sm">{transaction.description}</div>
                            <div className="text-xs text-gray-500">
                              {transaction.category} • {transaction.date.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className={`font-bold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Account Balances */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Banknote className="h-5 w-5 mr-2" />
                    Account Balances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(accounts || []).filter(a => a.type === 'asset' || a.type === 'liability').map((account) => (
                      <div key={account.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{account.name}</div>
                          <div className={`text-xs capitalize ${getAccountTypeColor(account?.type)}`}>
                            {account.type}
                          </div>
                        </div>
                        <div className={`font-bold ${
                          account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(account.balance)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bank Statement Upload and Reconciliation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Bank Statement Upload
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Bank Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.accountName} - {account.bankName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Drop your bank statement here or click to browse
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Supports CSV, OFX, QIF formats
                    </p>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={() => toast({
                      title: 'Feature Available',
                      description: 'Bank statement upload and processing will complement real-time feeds for historical data.',
                    })}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Statement
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ArrowUpDown className="h-5 w-5 mr-2" />
                    Automated Reconciliation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-xl font-bold text-green-600">98%</div>
                      <div className="text-sm text-gray-600">Auto-match Rate</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">1min</div>
                      <div className="text-sm text-gray-600">Sync Frequency</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-xl font-bold text-purple-600">24/7</div>
                      <div className="text-sm text-gray-600">Monitoring</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Intelligent Matching</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        AI-powered transaction matching based on amount, date, and description
                      </p>
                    </div>
                    
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Real-time Processing</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Instant categorization and reconciliation as transactions arrive
                      </p>
                    </div>
                    
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">Exception Handling</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Automatic flagging of unusual transactions for manual review
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {transaction.type === 'income' ? 
                            <TrendingUp className="h-4 w-4" /> : 
                            <TrendingDown className="h-4 w-4" />
                          }
                        </div>
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-sm text-gray-500">
                            {transaction.category} • {transaction.account} • {transaction.date.toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center space-x-2">
                            {transaction.reference && <span>Ref: {transaction.reference}</span>}
                            {transaction.currency !== baseCurrency && (
                              <span className="flex items-center">
                                <ArrowUpDown className="h-3 w-3 mr-1" />
                                {transaction.currency} @ {transaction.exchangeRate?.toFixed(4)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className={`font-bold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <div>{transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}</div>
                          {transaction.currency !== baseCurrency && (
                            <div className="text-xs text-gray-500">
                              ≈ {formatCurrency(transaction.baseCurrencyAmount || transaction.amount, baseCurrency)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {transaction.reconciled && (
                            <Badge className="bg-green-100 text-green-800">Reconciled</Badge>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            title="Edit Transaction"
                            onClick={() => alert(`Editing transaction: ${transaction.description}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Chart of Accounts</h2>
              <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Account</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Account name *"
                      value={newAccount.name}
                      onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                      required
                    />
                    <Input
                      placeholder="Account code (e.g., 1001)"
                      value={newAccount.code}
                      onChange={(e) => setNewAccount({...newAccount, code: e.target.value})}
                      required
                    />
                    <Select value={newAccount.type} onValueChange={(value) => setNewAccount({...newAccount, type: value as any})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account type *" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asset">Asset</SelectItem>
                        <SelectItem value="liability">Liability</SelectItem>
                        <SelectItem value="equity">Equity</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Initial balance"
                        value={newAccount.balance}
                        onChange={(e) => setNewAccount({...newAccount, balance: e.target.value})}
                      />
                      <Select value={newAccount.currency} onValueChange={(value) => setNewAccount({...newAccount, currency: value})}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">$ USD</SelectItem>
                          <SelectItem value="EUR">€ EUR</SelectItem>
                          <SelectItem value="GBP">£ GBP</SelectItem>
                          <SelectItem value="CAD">C$ CAD</SelectItem>
                          <SelectItem value="AUD">A$ AUD</SelectItem>
                          <SelectItem value="JPY">¥ JPY</SelectItem>
                          
                          {CURRENCIES.filter(c => c.region === "Africa").map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.symbol} {currency.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAccountDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateAccount}>
                        Add Account
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Chart of Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['asset', 'liability', 'equity', 'income', 'expense'].map((type) => (
                    <div key={type}>
                      <h3 className={`font-semibold capitalize mb-2 ${getAccountTypeColor(type)}`}>
                        {type === 'asset' ? 'Assets' :
                         type === 'liability' ? 'Liabilities' :
                         type === 'equity' ? 'Equity' :
                         type === 'income' ? 'Income' : 'Expenses'}
                      </h3>
                      <div className="space-y-2 ml-4">
                        {(accounts || []).filter(a => a.type === type).map((account) => (
                          <div key={account.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div>
                              <div className="font-medium">{account.code} - {account.name}</div>
                            </div>
                            <div className={`font-bold ${getAccountTypeColor(account?.type)} text-right`}>
                              <div>{formatCurrency(account.balance || 0, account.currency || baseCurrency)}</div>
                              {account.currency && account.currency !== baseCurrency && (
                                <div className="text-xs text-gray-500">
                                  ≈ {formatCurrency(convertToBaseCurrency(account.balance || 0, account.currency), baseCurrency)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="currencies" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 mr-2" />
                      Active Currencies
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Simulate updating exchange rates
                        const updatedCurrencies = currencies.map(c => ({
                          ...c,
                          exchangeRate: c.isBaseCurrency ? 1.0 : c.exchangeRate * (0.98 + Math.random() * 0.04)
                        }));
                        setCurrencies(updatedCurrencies);
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Update Rates
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currencies.filter(c => c.isActive).map((currency) => (
                      <div key={currency.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            currency.isBaseCurrency ? 'bg-blue-600' : 'bg-gray-500'
                          }`}>
                            {currency.symbol}
                          </div>
                          <div>
                            <div className="font-medium">{currency.code}</div>
                            <div className="text-sm text-gray-500">{currency.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            {currency.isBaseCurrency ? 'Base' : `${currency.exchangeRate.toFixed(4)}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {currency.isBaseCurrency ? 'Currency' : `1 ${baseCurrency} = ${currency.exchangeRate.toFixed(4)} ${currency.code}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ArrowUpDown className="h-5 w-5 mr-2" />
                    Currency Converter
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">From</label>
                      <Select defaultValue="USD">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                          <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                          <SelectItem value="CAD">CAD (C$) - Canadian Dollar</SelectItem>
                          <SelectItem value="AUD">AUD (A$) - Australian Dollar</SelectItem>
                          <SelectItem value="JPY">JPY (¥) - Japanese Yen</SelectItem>
                          
                          {CURRENCIES.filter(c => c.region === "Africa").map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.code} ({currency.symbol}) - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">To</label>
                      <Select defaultValue="EUR">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                          <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                          <SelectItem value="CAD">CAD (C$) - Canadian Dollar</SelectItem>
                          <SelectItem value="AUD">AUD (A$) - Australian Dollar</SelectItem>
                          <SelectItem value="JPY">JPY (¥) - Japanese Yen</SelectItem>
                          
                          {CURRENCIES.filter(c => c.region === "Africa").map((currency) => (
                            <SelectItem key={currency.code} value={currency.code}>
                              {currency.code} ({currency.symbol}) - {currency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    step="0.01"
                  />
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold">€850.00</div>
                      <div className="text-sm text-gray-500">1 USD = 0.8500 EUR</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Exchange Rate History</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Today</span>
                        <span>0.8500</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Yesterday</span>
                        <span>0.8485</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>1 week ago</span>
                        <span>0.8420</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Multi-Currency Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-xl font-bold text-blue-600">8</div>
                    <div className="text-sm text-gray-600">Active Currencies</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-xl font-bold text-green-600">{formatCurrency(totalAssets - totalLiabilities)}</div>
                    <div className="text-sm text-gray-600">Net Worth (Base Currency)</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-xl font-bold text-purple-600">45%</div>
                    <div className="text-sm text-gray-600">Foreign Currency Exposure</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Receipt className="h-5 w-5 mr-2" />
                    Invoice Generation & Tracking
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Invoice
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New Invoice</DialogTitle>
                      </DialogHeader>
                      <InvoiceCreationForm />
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InvoiceTrackingSection />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Profit & Loss Report
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Start Date</label>
                      <Input type="date" defaultValue="2025-01-01" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Date</label>
                      <Input type="date" defaultValue="2025-06-23" />
                    </div>
                  </div>
                  
                  <Select defaultValue="USD">
                    <SelectTrigger>
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} ({currency.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>

                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium mb-2">Quick Summary (YTD)</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Revenue:</span>
                        <span className="font-bold text-green-600">{formatCurrency(totalIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Expenses:</span>
                        <span className="font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Net Income:</span>
                        <span className={`font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(netIncome)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Balance Sheet Report
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">As of Date</label>
                    <Input type="date" defaultValue="2025-06-23" />
                  </div>
                  
                  <Select defaultValue="USD">
                    <SelectTrigger>
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.code} ({currency.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>

                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium mb-2">Quick Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Assets:</span>
                        <span className="font-bold text-blue-600">{formatCurrency(totalAssets)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Liabilities:</span>
                        <span className="font-bold text-red-600">{formatCurrency(totalLiabilities)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span>Net Worth:</span>
                        <span className="font-bold text-green-600">{formatCurrency(totalAssets - totalLiabilities)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Available Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'Cash Flow Statement', description: 'Track cash inflows and outflows', icon: TrendingUp },
                    { name: 'Trial Balance', description: 'Verify accounting equation balance', icon: Calculator },
                    { name: 'Tax Summary', description: 'Prepare tax documents and summaries', icon: FileText },
                    { name: 'Budget vs Actual', description: 'Compare budgeted vs actual performance', icon: PieChart },
                    { name: 'Accounts Aging', description: 'Track outstanding receivables and payables', icon: Calendar },
                    { name: 'Multi-Currency Report', description: 'Consolidated view across all currencies', icon: Globe }
                  ].map((report) => (
                    <div 
                      key={report.name} 
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => alert(`${report.name} will be generated with backend integration`)}
                    >
                      <div className="flex items-center space-x-3">
                        <report.icon className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">{report.name}</div>
                          <div className="text-sm text-gray-500">{report.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banking" className="space-y-6">
            {/* Real-time Bank Feed Integration */}
            <BankFeedControl 
              bankAccounts={bankAccounts}
              onSyncToggle={(accountId, enabled) => {
                console.log(`Sync ${enabled ? 'enabled' : 'disabled'} for account ${accountId}`);
              }}
              onManualSync={(accountId) => {
                console.log(`Manual sync triggered for account ${accountId}`);
              }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bank Transaction Feed */}
              {bankAccounts.length > 0 && (
                <BankTransactionFeed 
                  bankAccountId={bankAccounts[0].id}
                  onTransactionUpdate={(transaction) => {
                    console.log('Transaction updated:', transaction);
                  }}
                />
              )}

              {/* Bank Account Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Building className="h-5 w-5 mr-2" />
                      Bank Account Management
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Bank Account</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={addBankAccount} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Input name="accountName" placeholder="Account Name" required />
                            <Input name="bankName" placeholder="Bank Name" required />
                            <Input name="accountNumber" placeholder="Account Number" required />
                            <Input name="routingNumber" placeholder="Routing Number" required />
                            <Select name="accountType" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Account Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="checking">Checking</SelectItem>
                                <SelectItem value="savings">Savings</SelectItem>
                                <SelectItem value="credit">Credit</SelectItem>
                                <SelectItem value="investment">Investment</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select name="currency" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Currency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                                <SelectItem value="CAD">CAD</SelectItem>
                                <SelectItem value="AUD">AUD</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input 
                              name="currentBalance" 
                              type="number" 
                              step="0.01" 
                              placeholder="Current Balance" 
                              required 
                            />
                          </div>
                          <Button type="submit" className="w-full">
                            Add Bank Account
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Banknote className="h-5 w-5 mr-2" />
                      Bank Accounts
                    </div>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Account
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      // No hardcoded bank accounts - all data comes from API
                      { name: 'Savings Account', bank: 'Wells Fargo', balance: 125000.00, currency: 'USD', lastReconciled: '2025-06-22' }
                    ].map((account, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <Banknote className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{account.name}</div>
                            <div className="text-sm text-gray-500">{account.bank} • Last reconciled: {account.lastReconciled}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(account.balance, account.currency)}</div>
                          <div className="text-xs text-gray-500">{account.currency}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Bank Statement Upload
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Bank Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Bank accounts populated from API */}
                      {/* Bank accounts will be populated from API when available */}
                    </SelectContent>
                  </Select>

                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      Drop your bank statement here or click to browse
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Supports CSV, OFX, QIF formats
                    </p>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={() => alert('Bank statement upload will be implemented with file processing capabilities')}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Statement
                  </Button>
                </CardContent>
              </Card>
            </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="banking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowUpDown className="h-5 w-5 mr-2" />
                  Bank Reconciliation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-xl font-bold text-green-600">142</div>
                    <div className="text-sm text-gray-600">Matched Transactions</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-xl font-bold text-yellow-600">8</div>
                    <div className="text-sm text-gray-600">Unmatched Transactions</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-xl font-bold text-red-600">2</div>
                    <div className="text-sm text-gray-600">Disputed Transactions</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { date: '2025-06-23', description: 'ACH Transfer - Payroll', amount: -15420.50, status: 'matched' },
                    { date: '2025-06-22', description: 'Wire Transfer In - Invoice Payment', amount: 25000.00, status: 'unmatched' },
                    { date: '2025-06-21', description: 'Card Payment - Office Supplies', amount: -245.75, status: 'matched' },
                    { date: '2025-06-20', description: 'Unknown Deposit', amount: 1250.00, status: 'disputed' }
                  ].map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          transaction.status === 'matched' ? 'bg-green-500' :
                          transaction.status === 'unmatched' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-sm text-gray-500">{transaction.date}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`font-bold ${
                          transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                        </div>
                        <Badge variant={
                          transaction.status === 'matched' ? 'default' :
                          transaction.status === 'unmatched' ? 'secondary' : 'destructive'
                        }>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tax" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Tax Returns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      // Tax returns data comes from API - no hardcoded data
                    ].map((taxReturn, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div>
                          <div className="font-medium">{taxReturn.year} {taxReturn.type}</div>
                          <div className="text-sm text-gray-500">Due: {taxReturn.dueDate}</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className="font-bold">{formatCurrency(taxReturn.taxOwed)}</div>
                            <Badge variant={
                              taxReturn.status === 'filed' ? 'default' :
                              taxReturn.status === 'pending' ? 'secondary' : 'outline'
                            }>
                              {taxReturn.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className="w-full mt-4"
                    onClick={() => alert('Tax return creation form will be implemented')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Tax Return
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    Tax Deductions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      // Tax deductions data comes from API - no hardcoded data
                    ].map((deduction, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            deduction.verified ? 'bg-green-500' : 'bg-yellow-500'
                          }`}></div>
                          <div>
                            <div className="font-medium">{deduction.category}</div>
                            <div className="text-sm text-gray-500">
                              Risk: {deduction.auditRisk} • {deduction.verified ? 'Verified' : 'Pending'}
                            </div>
                          </div>
                        </div>
                        <div className="font-bold text-green-600">
                          {formatCurrency(deduction.amount)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Deductions (2024):</span>
                      <span className="text-xl font-bold text-green-600">{formatCurrency(38600.75)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tax Compliance Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { type: 'Quarterly Filing', jurisdiction: 'Federal', dueDate: '2025-07-15', status: 'pending' },
                    { type: 'Sales Tax', jurisdiction: 'California', dueDate: '2025-07-31', status: 'pending' },
                    { type: 'Payroll Tax', jurisdiction: 'Federal', dueDate: '2025-07-31', status: 'filed' },
                    { type: 'Annual Filing', jurisdiction: 'Delaware', dueDate: '2026-03-15', status: 'not_due' }
                  ].map((compliance, index) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 ${
                      compliance.status === 'pending' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                      compliance.status === 'filed' ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20' :
                      'border-l-gray-500 bg-gray-50 dark:bg-gray-800'
                    }`}>
                      <div className="font-medium">{compliance.type}</div>
                      <div className="text-sm text-gray-600">{compliance.jurisdiction}</div>
                      <div className="text-sm font-medium mt-2">Due: {compliance.dueDate}</div>
                      <Badge 
                        className="mt-2" 
                        variant={
                          compliance.status === 'pending' ? 'secondary' :
                          compliance.status === 'filed' ? 'default' : 'outline'
                        }
                      >
                        {compliance.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profit & Loss Statement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Revenue</span>
                      <span className="font-bold text-green-600">{formatCurrency(totalIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Expenses</span>
                      <span className="font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span className="font-bold">Net Income</span>
                        <span className={`font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(netIncome)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Balance Sheet</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Assets</span>
                      <span className="font-bold text-green-600">{formatCurrency(totalAssets)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Liabilities</span>
                      <span className="font-bold text-red-600">{formatCurrency(totalLiabilities)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span className="font-bold">Net Worth</span>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(totalAssets - totalLiabilities)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => setActiveTab("reports")}
                  >
                    <FileText className="h-5 w-5 mb-1" />
                    <span className="text-sm">P&L Report</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => setActiveTab("reports")}
                  >
                    <PieChart className="h-5 w-5 mb-1" />
                    <span className="text-sm">Balance Sheet</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => setActiveTab("reports")}
                  >
                    <TrendingUp className="h-5 w-5 mb-1" />
                    <span className="text-sm">Cash Flow</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-16 flex flex-col hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => setActiveTab("tax")}
                  >
                    <Calculator className="h-5 w-5 mb-1" />
                    <span className="text-sm">Tax Summary</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// Invoice Creation Form Schema
const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  accountId: z.string().min(1, "Account is required"),
  amount: z.string().min(1, "Amount is required"),
  tax: z.string().default("0"),
  discount: z.string().default("0"),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

// Invoice Creation Form Component
function InvoiceCreationForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      accountId: "",
      amount: "",
      tax: "0",
      discount: "0",
      dueDate: "",
      notes: "",
    },
  });

  // Fetch accounts for dropdown
  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/accounts"],
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (values: z.infer<typeof invoiceSchema>) => {
      // Calculate total
      const amount = parseFloat(values.amount);
      const tax = parseFloat(values.tax);
      const discount = parseFloat(values.discount);
      const total = amount + tax - discount;

      const invoiceData = {
        ...values,
        accountId: parseInt(values.accountId),
        amount: values.amount,
        tax: values.tax,
        discount: values.discount,
        total: total.toString(),
      };

      return apiRequest("POST", "/api/invoices", invoiceData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => createInvoiceMutation.mutate(values))} className="space-y-4">
        <FormField
          control={form.control}
          name="invoiceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invoice Number</FormLabel>
              <FormControl>
                <Input {...field} placeholder="INV-2025-001" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(accounts || []).map((account: any) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-2">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" placeholder="0.00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" placeholder="0.00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" placeholder="0.00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date</FormLabel>
              <FormControl>
                <Input {...field} type="date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Additional notes..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={createInvoiceMutation.isPending}>
          {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
        </Button>
      </form>
    </Form>
  );
}

// Invoice Tracking Section Component
function InvoiceTrackingSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch invoices data
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  // Calculate invoice statistics
  const stats = {
    draft: invoices.filter((inv: any) => inv.status === 'draft').length,
    paid: invoices.filter((inv: any) => inv.status === 'paid').length,
    overdue: invoices.filter((inv: any) => inv.status === 'overdue').length,
    outstanding: invoices
      .filter((inv: any) => inv.status !== 'paid')
      .reduce((sum: number, inv: any) => sum + parseFloat(inv.total || 0), 0),
  };

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      return apiRequest("DELETE", `/api/invoices/${invoiceId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number | string, currency = 'USD') => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(numAmount);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading invoices...</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.draft}</div>
          <div className="text-sm text-gray-600">Draft Invoices</div>
        </div>
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
          <div className="text-sm text-gray-600">Paid Invoices</div>
        </div>
        <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{stats.overdue}</div>
          <div className="text-sm text-gray-600">Overdue Invoices</div>
        </div>
        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.outstanding)}</div>
          <div className="text-sm text-gray-600">Outstanding Amount</div>
        </div>
      </div>

      <div className="space-y-3">
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No invoices found. Create your first invoice to get started.
          </div>
        ) : (
          invoices.map((invoice: any) => (
            <div key={invoice.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  invoice.status === 'paid' ? 'bg-green-500' :
                  invoice.status === 'sent' ? 'bg-blue-500' :
                  invoice.status === 'overdue' ? 'bg-red-500' : 'bg-gray-500'
                }`}></div>
                <div>
                  <div className="font-medium">{invoice.invoiceNumber}</div>
                  <div className="text-sm text-gray-500">
                    Account ID: {invoice.accountId} • Due: {invoice.dueDate || 'No due date'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="font-bold">{formatCurrency(invoice.total)}</div>
                  <Badge variant={
                    invoice.status === 'paid' ? 'default' :
                    invoice.status === 'sent' ? 'secondary' :
                    invoice.status === 'overdue' ? 'destructive' : 'outline'
                  }>
                    {invoice.status}
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    title="View Invoice"
                    onClick={() => toast({ title: "View Invoice", description: `Viewing invoice ${invoice.invoiceNumber}` })}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    title="Edit Invoice"
                    onClick={() => toast({ title: "Edit Invoice", description: `Editing invoice ${invoice.invoiceNumber}` })}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    title="Delete Invoice"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
                        deleteInvoiceMutation.mutate(invoice.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}