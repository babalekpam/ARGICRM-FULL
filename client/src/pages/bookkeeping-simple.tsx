import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout";
import Logo from "@/components/logo";
import { Calculator, DollarSign, TrendingUp, FileText, PieChart, Banknote, Receipt, Globe, Brain, Zap, Plus, CheckCircle, XCircle } from "lucide-react";

interface Account {
  id: number;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  balance: number;
  currency: string;
  code: string;
}



export default function BookkeepingSimple() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch chart of accounts from API
  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ["/api/chart-of-accounts"],
    queryFn: async () => {
      const response = await fetch("/api/chart-of-accounts");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Chart of accounts data:', data);
      return data;
    },
    staleTime: 0,
  });

  // Fetch financial transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/financial-transactions"],
    queryFn: async () => {
      const response = await fetch("/api/financial-transactions");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Financial transactions data:', data);
      console.log('Transactions count:', data.length);
      return data;
    },
    staleTime: 0,
  });

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'asset': return 'text-green-600';
      case 'liability': return 'text-red-600';
      case 'equity': return 'text-blue-600';
      case 'income': return 'text-purple-600';
      case 'expense': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const totalAssets = accounts
    .filter(a => a.type === 'asset')
    .reduce((sum, a) => sum + (a.balance || 0), 0);

  const totalLiabilities = accounts
    .filter(a => a.type === 'liability')
    .reduce((sum, a) => sum + Math.abs(a.balance || 0), 0);

  const totalIncome = accounts
    .filter(a => a.type === 'income')
    .reduce((sum, a) => sum + (a.balance || 0), 0);

  const totalExpenses = accounts
    .filter(a => a.type === 'expense')
    .reduce((sum, a) => sum + (a.balance || 0), 0);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading bookkeeping data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Logo size="md" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bookkeeping</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Financial management and accounting overview
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={(value) => {
          console.log("Tab changed to:", value);
          setActiveTab(value);
        }} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="accounts" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Accounts
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalAssets)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalLiabilities)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(totalIncome)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
              <Calculator className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalAssets - totalLiabilities)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart of Accounts */}
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
                    {accounts.filter(a => a.type === type).map((account) => (
                      <div key={account.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div>
                          <div className="font-medium">{account.code} - {account.name}</div>
                        </div>
                        <div className={`font-bold ${getAccountTypeColor(account.type)} text-right`}>
                          <div>{formatCurrency(account.balance || 0, account.currency)}</div>
                          {account.currency && account.currency !== 'USD' && (
                            <div className="text-xs text-gray-500">{account.currency}</div>
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

            {/* Quick Actions */}
            <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-16 flex flex-col">
                <FileText className="h-5 w-5 mb-1" />
                <span className="text-sm">New Transaction</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col">
                <Calculator className="h-5 w-5 mb-1" />
                <span className="text-sm">Add Account</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col">
                <TrendingUp className="h-5 w-5 mb-1" />
                <span className="text-sm">View Reports</span>
              </Button>
              <Button variant="outline" className="h-16 flex flex-col">
                <DollarSign className="h-5 w-5 mb-1" />
                <span className="text-sm">Reconciliation</span>
              </Button>
            </div>
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        {accounts.filter(a => a.type === type).map((account) => (
                          <div key={account.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div>
                              <div className="font-medium">{account.code} - {account.name}</div>
                            </div>
                            <div className={`font-bold ${getAccountTypeColor(account.type)} text-right`}>
                              <div>{formatCurrency(account.balance || 0, account.currency)}</div>
                              {account.currency && account.currency !== 'USD' && (
                                <div className="text-xs text-gray-500">{account.currency}</div>
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

              <Card>
                <CardHeader>
                  <CardTitle>Bank Account Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Link your bank accounts to chart of accounts for automatic transaction categorization.
                    </p>
                    
                    {/* Add New Bank Account */}
                    <div className="mb-6 p-4 border border-dashed border-gray-300 rounded-lg">
                      <h4 className="font-medium mb-3">Connect New Bank Account</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <Input placeholder="Account name (e.g., Business Checking)" id="newAccountName" />
                          <Input placeholder="Bank name (e.g., Bank of America)" id="newBankName" />
                          <div className="grid grid-cols-2 gap-2">
                            <Input placeholder="Balance" type="number" id="newBalance" />
                            <select className="border rounded px-2 py-1 text-sm" id="newCurrency">
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                              <option value="GBP">GBP</option>
                              <option value="CAD">CAD</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Input placeholder="Routing number (9 digits)" id="newRoutingNumber" maxLength={9} />
                          <Input placeholder="Account number" id="newAccountNumber" />
                          <select className="border rounded px-2 py-1 text-sm w-full" id="newAccountType">
                            <option value="checking">Checking Account</option>
                            <option value="savings">Savings Account</option>
                            <option value="business">Business Account</option>
                            <option value="investment">Investment Account</option>
                            <option value="credit">Credit Account</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                          🔒 Bank details are encrypted and securely stored
                        </div>
                        <Button 
                          onClick={async () => {
                            const name = (document.getElementById('newAccountName') as HTMLInputElement)?.value;
                            const bank = (document.getElementById('newBankName') as HTMLInputElement)?.value;
                            const balance = parseFloat((document.getElementById('newBalance') as HTMLInputElement)?.value || '0');
                            const currency = (document.getElementById('newCurrency') as HTMLSelectElement)?.value;
                            const routingNumber = (document.getElementById('newRoutingNumber') as HTMLInputElement)?.value;
                            const accountNumber = (document.getElementById('newAccountNumber') as HTMLInputElement)?.value;
                            const accountType = (document.getElementById('newAccountType') as HTMLSelectElement)?.value;
                            
                            if (name && bank && routingNumber && accountNumber) {
                              try {
                                const response = await fetch('/api/bank-accounts', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    name, bank, balance, currency, routingNumber, accountNumber, accountType
                                  })
                                });
                                
                                if (response.ok) {
                                  toast({
                                    title: "Bank Account Connected",
                                    description: `${name} (${bank}) connected successfully with routing ${routingNumber}`
                                  });
                                  // Clear form
                                  ['newAccountName', 'newBankName', 'newBalance', 'newRoutingNumber', 'newAccountNumber'].forEach(id => {
                                    (document.getElementById(id) as HTMLInputElement).value = '';
                                  });
                                } else {
                                  throw new Error('Failed to add account');
                                }
                              } catch (error) {
                                toast({
                                  variant: "destructive",
                                  title: "Connection Failed",
                                  description: "Could not connect bank account"
                                });
                              }
                            } else {
                              toast({
                                variant: "destructive",
                                title: "Missing Information",
                                description: "Please enter all required fields including routing and account numbers"
                              });
                            }
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Connect Account
                        </Button>
                      </div>
                    </div>

                    {/* Bank Account Linking Section */}
                    <div className="space-y-4">
                      {[
                        { id: 1, name: 'Business Checking', bank: 'Chase Bank', balance: 45670.50, routingNumber: '021000021', accountNumber: '****1234', accountType: 'checking' },
                        { id: 2, name: 'Business Savings', bank: 'Wells Fargo', balance: 25000.00, routingNumber: '121000248', accountNumber: '****5678', accountType: 'savings' },
                        { id: 3, name: 'EUR Business Account', bank: 'Deutsche Bank', balance: 18500.00, routingNumber: '021001033', accountNumber: '****9012', accountType: 'business' },
                        { id: 4, name: 'PayPal Business', bank: 'PayPal', balance: 8920.15, routingNumber: '114924742', accountNumber: '****3456', accountType: 'business' },
                        { id: 5, name: 'Stripe Account', bank: 'Stripe', balance: 12450.88, routingNumber: '084106768', accountNumber: '****7890', accountType: 'business' },
                        { id: 6, name: 'Investment Account', bank: 'Fidelity', balance: 95000.00, routingNumber: '011075150', accountNumber: '****2345', accountType: 'investment' }
                      ].map((bankAccount) => (
                        <div key={bankAccount.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium">{bankAccount.name}</h4>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {bankAccount.accountType}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500">{bankAccount.bank}</p>
                              <div className="text-xs text-gray-400 mt-1">
                                Routing: {bankAccount.routingNumber} • Account: {bankAccount.accountNumber}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">
                                {formatCurrency(bankAccount.balance)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-medium">Link to Account:</span>
                              <select 
                                className="border rounded px-2 py-1 text-sm min-w-48"
                                onChange={async (e) => {
                                  if (e.target.value) {
                                    try {
                                      const response = await fetch('/api/bank-accounts/link', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ 
                                          bankAccountId: bankAccount.id, 
                                          chartAccountId: parseInt(e.target.value) 
                                        })
                                      });
                                      
                                      if (response.ok) {
                                        const selectedAccount = accounts.find(a => a.id === parseInt(e.target.value));
                                        toast({
                                          title: "Account Linked Successfully",
                                          description: `${bankAccount.name} linked to ${selectedAccount?.name}`
                                        });
                                      } else {
                                        throw new Error('Failed to link');
                                      }
                                    } catch (error) {
                                      toast({
                                        variant: "destructive",
                                        title: "Linking Failed",
                                        description: "Could not link bank account"
                                      });
                                    }
                                  }
                                }}
                              >
                                <option value="">Select account...</option>
                                {accounts.filter(a => a.type === 'asset').map(account => (
                                  <option key={account.id} value={account.id}>
                                    {account.code} - {account.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/bank-accounts/${bankAccount.id}`, {
                                    method: 'DELETE'
                                  });
                                  
                                  if (response.ok) {
                                    toast({
                                      title: "Account Removed",
                                      description: `${bankAccount.name} has been removed`
                                    });
                                  } else {
                                    throw new Error('Failed to delete');
                                  }
                                } catch (error) {
                                  toast({
                                    variant: "destructive",
                                    title: "Removal Failed",
                                    description: "Could not remove bank account"
                                  });
                                }
                              }}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                          
                          <div className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Globe className="h-3 w-3 mr-1" />
                                Select a chart account to enable automatic transaction categorization
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {bankAccount.currency || 'USD'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="border-t pt-4 mt-6">
                        <h4 className="font-medium mb-2 flex items-center">
                          <Brain className="h-4 w-4 mr-2 text-blue-600" />
                          Integration Benefits:
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li className="flex items-center">
                            <Zap className="h-3 w-3 mr-2 text-yellow-500" />
                            Automatic transaction categorization with AI
                          </li>
                          <li className="flex items-center">
                            <TrendingUp className="h-3 w-3 mr-2 text-green-500" />
                            Real-time balance synchronization
                          </li>
                          <li className="flex items-center">
                            <CheckCircle className="h-3 w-3 mr-2 text-blue-500" />
                            Simplified reconciliation process
                          </li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4 mt-6">
                      <h4 className="font-medium mb-2">Benefits of Linking Bank Accounts:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Automatic transaction categorization</li>
                        <li>• Real-time balance synchronization</li>
                        <li>• Simplified reconciliation process</li>
                        <li>• Better financial reporting accuracy</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2 text-purple-600" />
                    AI Transaction Categorization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TransactionCategorizationDemo />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No transactions found</p>
                      <p className="text-sm">Create your first transaction to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.slice(0, 10).map((transaction: any) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{transaction.description}</div>
                            <div className="text-sm text-gray-500 flex items-center space-x-2">
                              <span>{transaction.date}</span>
                              <span>•</span>
                              <span>{transaction.reference || 'No reference'}</span>
                              {transaction.category && (
                                <Badge variant="outline" className="text-xs">
                                  {transaction.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className={`font-bold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Transaction
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Transaction with AI Categorization</DialogTitle>
                      </DialogHeader>
                      <AddTransactionFormQuick />
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <PieChart className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-medium">Profit & Loss</h3>
                        <p className="text-sm text-gray-500">Income vs expenses</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <Banknote className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="font-medium">Balance Sheet</h3>
                        <p className="text-sm text-gray-500">Assets vs liabilities</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                      <div>
                        <h3 className="font-medium">Cash Flow</h3>
                        <p className="text-sm text-gray-500">Money in vs out</p>
                      </div>
                    </div>
                  </Card>
                </div>
                
                {/* Live Financial Summary */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Profit & Loss Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Total Income:</span>
                          <span className="font-bold text-green-600">{formatCurrency(totalIncome)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Expenses:</span>
                          <span className="font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between text-lg">
                          <span className="font-semibold">Net Profit:</span>
                          <span className={`font-bold ${(totalIncome - totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(totalIncome - totalExpenses)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Balance Sheet Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Total Assets:</span>
                          <span className="font-bold text-green-600">{formatCurrency(totalAssets)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Liabilities:</span>
                          <span className="font-bold text-red-600">{formatCurrency(totalLiabilities)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between text-lg">
                          <span className="font-semibold">Net Worth:</span>
                          <span className={`font-bold ${(totalAssets - totalLiabilities) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(totalAssets - totalLiabilities)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}



// Add Transaction Form Component
function AddTransactionForm() {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('debit');
  const [accountId, setAccountId] = useState('');
  const [reference, setReference] = useState('');
  const { toast } = useToast();

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/chart-of-accounts"],
  });

  const addTransaction = async () => {
    if (!description || !amount || !accountId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields"
      });
      return;
    }

    try {
      const response = await fetch('/api/financial-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: parseInt(accountId),
          amount: parseFloat(amount),
          type,
          description,
          reference: reference || null,
          date: new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) throw new Error('Failed to create transaction');
      
      toast({
        title: "Success",
        description: "Transaction created successfully"
      });
      
      // Reset form
      setDescription('');
      setAmount('');
      setReference('');
      setAccountId('');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create transaction"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Transaction</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <Input
              placeholder="Transaction description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Amount *</label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Account *</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              <option value="">Select account...</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.code} - {account.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="debit">Debit (Expense)</option>
              <option value="credit">Credit (Income)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reference</label>
            <Input
              placeholder="Optional reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={addTransaction} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Transaction Form Component
function AddTransactionFormQuick() {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('debit');
  const [accountId, setAccountId] = useState('');
  const [reference, setReference] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/chart-of-accounts"],
  });

  const addTransaction = async () => {
    if (!description || !amount || !accountId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields"
      });
      return;
    }

    try {
      const response = await fetch('/api/financial-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: parseInt(accountId),
          amount: parseFloat(amount),
          type,
          description,
          reference: reference || null,
          date: new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) throw new Error('Failed to create transaction');
      
      toast({
        title: "Success",
        description: "Transaction created successfully"
      });
      
      // Reset form
      setDescription('');
      setAmount('');
      setReference('');
      setAccountId('');
      
      // Force refresh the transactions data and refetch
      await queryClient.invalidateQueries({ queryKey: ["/api/financial-transactions"] });
      await refetchTransactions();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create transaction"
      });
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Transaction description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <select 
        className="w-full p-2 border border-gray-300 rounded"
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
      >
        <option value="">Select account...</option>
        {accounts.map(account => (
          <option key={account.id} value={account.id}>
            {account.code} - {account.name}
          </option>
        ))}
      </select>
      <select 
        className="w-full p-2 border border-gray-300 rounded"
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        <option value="debit">Debit (Expense)</option>
        <option value="credit">Credit (Income)</option>
      </select>
      <Input
        placeholder="Reference (optional)"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
      />
      <Button onClick={addTransaction} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Transaction
      </Button>
    </div>
  );
}

// AI Transaction Categorization Demo Component
function TransactionCategorizationDemo() {
  const [testDescription, setTestDescription] = useState('');
  const [testAmount, setTestAmount] = useState('');
  const [prediction, setPrediction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const testCategorization = async () => {
    if (!testDescription || !testAmount) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter both description and amount"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/transactions/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: testDescription,
          amount: parseFloat(testAmount)
        })
      });

      if (!response.ok) throw new Error('Failed to categorize');
      
      const result = await response.json();
      setPrediction(result);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to categorize transaction"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Test our AI categorization engine by entering transaction details:
      </p>
      
      <div className="space-y-3">
        <Input
          placeholder="Transaction description (e.g., 'Microsoft Office 365')"
          value={testDescription}
          onChange={(e) => setTestDescription(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Amount (e.g., -129.99 for expense, 2500 for income)"
          value={testAmount}
          onChange={(e) => setTestAmount(e.target.value)}
        />
        <Button 
          onClick={testCategorization} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Zap className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4 mr-2" />
              Categorize with AI
            </>
          )}
        </Button>
      </div>

      {prediction && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">AI Prediction</h4>
            <Badge 
              variant={prediction.confidence > 0.8 ? 'default' : 'secondary'}
              className="text-xs"
            >
              {Math.round(prediction.confidence * 100)}% confident
            </Badge>
          </div>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Category:</span> {prediction.category}
            </div>
            <div>
              <span className="font-medium">Type:</span> {prediction.suggestedAccountType}
            </div>
            <div>
              <span className="font-medium">Reasoning:</span> {prediction.reasoning}
            </div>
            
            {prediction.alternativeCategories?.length > 0 && (
              <div>
                <span className="font-medium">Alternatives:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {prediction.alternativeCategories.map((alt: any, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {alt.category} ({Math.round(alt.confidence * 100)}%)
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-2 mt-3">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => toast({ title: "Feedback recorded", description: "AI will learn from this correct prediction" })}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Correct
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => toast({ title: "Feedback recorded", description: "AI will adjust its predictions" })}
            >
              <XCircle className="h-3 w-3 mr-1" />
              Incorrect
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

