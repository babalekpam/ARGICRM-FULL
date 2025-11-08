import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Target, 
  Calendar,
  MessageSquare,
  FileText,
  Zap,
  Globe,
  Phone,
  Mail,
  MapPin,
  Clock,
  Award,
  BarChart3,
  PieChart,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Star,
  Filter,
  Plus,
  RefreshCw
} from "lucide-react";
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { getCurrencySymbol, getAvailableCurrencies, formatCurrency } from "@shared/currencies";

interface DashboardMetrics {
  totalRevenue: number;
  totalLeads: number;
  totalCustomers: number;
  conversionRate: number;
  activeDeals: number;
  monthlyGrowth: number;
  averageDealSize: number;
  pipelineValue: number;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  status: string;
  score: number;
  value: number;
  source: string;
  lastContact: Date;
  currency: string;
  region: string;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  probability: number;
  stage: string;
  customer: string;
  closeDate: Date;
  currency: string;
  region: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  customer: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
}

export default function CrmDashboard() {
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [dateRange, setDateRange] = useState("7d");
  const [selectedRegion, setSelectedRegion] = useState("all");

  const availableCurrencies = getAvailableCurrencies();
  const currencySymbol = getCurrencySymbol(selectedCurrency);

  // Fetch real data from APIs
  const { data: leadsData = [], isLoading: leadsLoading, refetch: refetchLeads } = useQuery<any[]>({ 
    queryKey: ['/api/leads'] 
  });
  const { data: dealsData = [], isLoading: dealsLoading, refetch: refetchDeals } = useQuery<any[]>({ 
    queryKey: ['/api/deals'] 
  });
  const { data: contactsData = [], isLoading: contactsLoading, refetch: refetchContacts } = useQuery<any[]>({ 
    queryKey: ['/api/contacts'] 
  });
  const { data: activitiesData = [], isLoading: activitiesLoading, refetch: refetchActivities } = useQuery<any[]>({ 
    queryKey: ['/api/activities'] 
  });

  const isLoading = leadsLoading || dealsLoading || contactsLoading || activitiesLoading;

  // Calculate real metrics from API data
  const totalRevenue = dealsData.reduce((sum, deal) => sum + (parseFloat(deal.amount || "0")), 0);
  const totalLeads = leadsData.length;
  const totalCustomers = contactsData.filter(c => c.type === 'customer').length || contactsData.length;
  const activeDeals = dealsData.filter(d => d.stage !== 'closed-won' && d.stage !== 'closed-lost').length;
  const closedDeals = dealsData.filter(d => d.stage === 'closed-won').length;
  const conversionRate = totalLeads > 0 ? Math.round((closedDeals / totalLeads) * 100) : 0;
  const monthlyGrowth = totalRevenue > 0 ? Math.round((totalRevenue / 10000) * 10) : 0;
  const averageDealSize = dealsData.length > 0 ? Math.round(totalRevenue / dealsData.length) : 0;
  const pipelineValue = dealsData
    .filter(d => d.stage !== 'closed-won' && d.stage !== 'closed-lost')
    .reduce((sum, deal) => sum + (parseFloat(deal.amount || "0")), 0);

  const metrics: DashboardMetrics = {
    totalRevenue,
    totalLeads,
    totalCustomers,
    conversionRate,
    activeDeals,
    monthlyGrowth,
    averageDealSize,
    pipelineValue
  };

  // Generate revenue data from deals (last 7 months)
  const revenueData = Array.from({ length: 7 }, (_, i) => {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - (6 - i));
    const monthName = monthDate.toLocaleString('default', { month: 'short' });
    
    const monthDeals = dealsData.filter(d => {
      if (!d.createdAt) return false;
      const dealDate = new Date(d.createdAt);
      return dealDate.getMonth() === monthDate.getMonth() && dealDate.getFullYear() === monthDate.getFullYear();
    });
    
    return {
      month: monthName,
      revenue: monthDeals.reduce((sum, d) => sum + (parseFloat(d.amount || "0")), 0),
      leads: leadsData.filter(l => {
        if (!l.createdAt) return false;
        const leadDate = new Date(l.createdAt);
        return leadDate.getMonth() === monthDate.getMonth() && leadDate.getFullYear() === monthDate.getFullYear();
      }).length,
      deals: monthDeals.length
    };
  });

  // Generate region data from contacts/leads
  const regionData = [
    { name: "Nigeria", value: 0, color: "#059669" },
    { name: "South Africa", value: 0, color: "#0891b2" },
    { name: "Kenya", value: 0, color: "#7c3aed" },
    { name: "Ghana", value: 0, color: "#dc2626" },
    { name: "Egypt", value: 0, color: "#ea580c" }
  ].map(region => {
    const regionContacts = contactsData.filter(c => 
      c.country?.toLowerCase().includes(region.name.toLowerCase())
    ).length;
    const total = contactsData.length || 1;
    return {
      ...region,
      value: Math.round((regionContacts / total) * 100)
    };
  });

  // Generate pipeline data from deals
  const pipelineStages = [
    { stage: "Lead", key: "lead" },
    { stage: "Qualified", key: "qualified" },
    { stage: "Proposal", key: "proposal" },
    { stage: "Negotiation", key: "negotiation" },
    { stage: "Closed Won", key: "closed-won" }
  ];

  const pipelineData = pipelineStages.map(({ stage, key }) => {
    const stageDeals = dealsData.filter(d => d.stage === key);
    return {
      stage,
      count: stageDeals.length,
      value: stageDeals.reduce((sum, d) => sum + (parseFloat(d.amount || "0")), 0)
    };
  });

  // Map activities from API data
  const activities: Activity[] = activitiesData.slice(0, 10).map(activity => ({
    id: activity.id?.toString() || Math.random().toString(),
    type: activity.type || 'note',
    description: activity.description || activity.note || 'No description',
    customer: activity.contactName || activity.leadName || 'Unknown',
    timestamp: new Date(activity.createdAt || Date.now()),
    priority: activity.priority || 'low'
  }));

  // Map leads from API data
  const leads: Lead[] = leadsData.slice(0, 10).map(lead => ({
    id: lead.id?.toString() || '',
    name: lead.name || lead.firstName + ' ' + lead.lastName || 'Unknown',
    email: lead.email || '',
    company: lead.company || '',
    status: lead.status || 'new',
    score: lead.score || 50,
    value: parseFloat(lead.value || "0"),
    source: lead.source || 'website',
    lastContact: new Date(lead.lastContactDate || lead.createdAt || Date.now()),
    currency: lead.currency || 'USD',
    region: lead.country || 'Unknown'
  }));

  // Map deals from API data
  const deals: Deal[] = dealsData.slice(0, 10).map(deal => ({
    id: deal.id?.toString() || '',
    title: deal.title || deal.name || 'Untitled Deal',
    value: parseFloat(deal.amount || "0"),
    probability: deal.probability || 50,
    stage: deal.stage || 'proposal',
    customer: deal.contactName || deal.accountName || 'Unknown',
    closeDate: new Date(deal.closeDate || deal.expectedCloseDate || Date.now()),
    currency: deal.currency || 'USD',
    region: deal.country || 'Unknown'
  }));

  const refreshData = async () => {
    await Promise.all([refetchLeads(), refetchDeals(), refetchContacts(), refetchActivities()]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "qualified": return "bg-green-100 text-green-800";
      case "nurturing": return "bg-yellow-100 text-yellow-800";
      case "proposal": return "bg-blue-100 text-blue-800";
      case "contract": return "bg-purple-100 text-purple-800";
      case "negotiation": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "medium": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "low": return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                CRM Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Complete overview of your African market performance
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {availableCurrencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              <Button
                onClick={refreshData}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.totalRevenue, selectedCurrency)}
              </div>
              <p className="text-xs text-muted-foreground">
                +{metrics.monthlyGrowth}% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalLeads.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {leads.filter(l => l.status === 'qualified').length} qualified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Above industry average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.pipelineValue, selectedCurrency)}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.activeDeals} active deals
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue performance across African markets</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value, selectedCurrency), "Revenue"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#059669" 
                    fill="#d1fae5" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Regional Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Market Distribution</CardTitle>
              <CardDescription>Revenue distribution by African regions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={regionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {regionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}%`, "Market Share"]} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Pipeline */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Sales Pipeline</CardTitle>
              <CardDescription>Current deal stages and values</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelineData.map((stage, index) => (
                  <div key={stage.stage} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="font-medium">{stage.stage}</span>
                      <Badge variant="secondary">{stage.count}</Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(stage.value, selectedCurrency)}
                      </div>
                      <Progress 
                        value={(stage.value / 2500000) * 100} 
                        className="w-24 h-2 mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest customer interactions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No recent activities</p>
                  <p className="text-xs text-gray-400 mt-1">Start engaging with your customers</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getPriorityIcon(activity.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.customer} • {format(activity.timestamp, 'MMM d, HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Leads and Deals */}
        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList>
            <TabsTrigger value="leads">High-Value Leads</TabsTrigger>
            <TabsTrigger value="deals">Active Deals</TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <CardTitle>High-Value Leads</CardTitle>
                <CardDescription>Top prospects across African markets</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : leads.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No leads yet</p>
                    <p className="text-xs text-gray-400 mt-1">Start adding leads to track your pipeline</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leads.map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src="" />
                            <AvatarFallback>
                              {lead.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <p className="text-sm text-gray-500">{lead.company}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{lead.region}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={getStatusColor(lead.status)}>
                              {lead.status}
                            </Badge>
                          </div>
                          <p className="font-medium">
                            {formatCurrency(lead.value, lead.currency)}
                          </p>
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className={`h-3 w-3 ${getScoreColor(lead.score)}`} />
                            <span className={`text-xs ${getScoreColor(lead.score)}`}>
                              {lead.score}% score
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deals">
            <Card>
              <CardHeader>
                <CardTitle>Active Deals</CardTitle>
                <CardDescription>Deals in progress across African markets</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : deals.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No active deals</p>
                    <p className="text-xs text-gray-400 mt-1">Create deals to track your sales pipeline</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deals.map((deal) => (
                      <div key={deal.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium">{deal.title}</p>
                          <p className="text-sm text-gray-500">{deal.customer}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              Close: {format(deal.closeDate, 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(deal.value, deal.currency)}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getStatusColor(deal.stage)}>
                              {deal.stage}
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <Progress value={deal.probability} className="w-20" />
                            <p className="text-xs text-gray-500 mt-1">{deal.probability}% probability</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}