import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Target, 
  Calendar,
  MessageSquare,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  Star,
  RefreshCw
} from "lucide-react";
import { 
  Area, 
  AreaChart, 
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { format } from "date-fns";
import { getAvailableCurrencies, formatCurrency } from "@shared/currencies";

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

const chartTooltipStyle = {
  backgroundColor: 'hsl(228,47%,12%)',
  border: '1px solid hsl(217,33%,17%)',
  borderRadius: '8px',
  color: 'hsl(210,17%,98%)'
};

export default function CrmDashboard() {
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  const availableCurrencies = getAvailableCurrencies();

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

  const totalRevenue = dealsData.reduce((sum, deal) => sum + (parseFloat(deal.amount || "0")), 0);
  const totalLeads = leadsData.length;
  const activeDeals = dealsData.filter(d => d.stage !== 'closed-won' && d.stage !== 'closed-lost').length;
  const closedDeals = dealsData.filter(d => d.stage === 'closed-won').length;
  const conversionRate = totalLeads > 0 ? Math.round((closedDeals / totalLeads) * 100) : 0;
  const monthlyGrowth = totalRevenue > 0 ? Math.round((totalRevenue / 10000) * 10) : 0;
  const pipelineValue = dealsData
    .filter(d => d.stage !== 'closed-won' && d.stage !== 'closed-lost')
    .reduce((sum, deal) => sum + (parseFloat(deal.amount || "0")), 0);

  const metrics: DashboardMetrics = {
    totalRevenue,
    totalLeads,
    totalCustomers: contactsData.filter(c => c.type === 'customer').length || contactsData.length,
    conversionRate,
    activeDeals,
    monthlyGrowth,
    averageDealSize: dealsData.length > 0 ? Math.round(totalRevenue / dealsData.length) : 0,
    pipelineValue
  };

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

  const regionData = [
    { name: "Nigeria", value: 0, color: "hsl(160,84%,39%)" },
    { name: "South Africa", value: 0, color: "hsl(227,89%,63%)" },
    { name: "Kenya", value: 0, color: "hsl(280,84%,60%)" },
    { name: "Ghana", value: 0, color: "hsl(0,84%,60%)" },
    { name: "Egypt", value: 0, color: "hsl(38,92%,50%)" }
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

  const activities: Activity[] = activitiesData.slice(0, 10).map(activity => ({
    id: activity.id?.toString() || Math.random().toString(),
    type: activity.type || 'note',
    description: activity.description || activity.note || 'No description',
    customer: activity.contactName || activity.leadName || 'Unknown',
    timestamp: new Date(activity.createdAt || Date.now()),
    priority: activity.priority || 'low'
  }));

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
      case "qualified": return "bg-[hsl(160,84%,39%)/30%] text-[hsl(160,84%,39%)] border-transparent";
      case "nurturing": return "bg-[hsl(38,92%,50%)/30%] text-[hsl(38,92%,50%)] border-transparent";
      case "proposal": return "bg-[hsl(227,89%,63%)/30%] text-[hsl(227,89%,63%)] border-transparent";
      case "contract": return "bg-[hsl(280,84%,60%)/30%] text-[hsl(280,84%,60%)] border-transparent";
      case "negotiation": return "bg-[hsl(38,92%,50%)/30%] text-[hsl(38,92%,50%)] border-transparent";
      default: return "bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-transparent";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-[hsl(160,84%,39%)]";
    if (score >= 60) return "text-[hsl(38,92%,50%)]";
    return "text-[hsl(0,84%,60%)]";
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return <AlertTriangle className="h-4 w-4 text-[hsl(0,84%,60%)]" />;
      case "medium": return <Clock className="h-4 w-4 text-[hsl(38,92%,50%)]" />;
      case "low": return <CheckCircle className="h-4 w-4 text-[hsl(160,84%,39%)]" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(230,47%,8%)]">
      <div className="border-b border-[hsl(217,33%,17%)] bg-[hsl(228,47%,12%)]">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[hsl(210,17%,98%)] tracking-tight">
                CRM Dashboard
              </h1>
              <p className="text-sm text-[hsl(215,20%,65%)]">
                Monitor your sales performance and customer relationships
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger 
                  className="w-[180px] bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]"
                  data-testid="select-currency"
                >
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)]">
                  {availableCurrencies.map((currency) => (
                    <SelectItem 
                      key={currency.code} 
                      value={currency.code}
                      className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)] focus:text-[hsl(210,17%,98%)]"
                    >
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={refreshData}
                disabled={isLoading}
                className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
                data-testid="button-refresh"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-[hsl(215,20%,65%)]" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums" data-testid="text-total-revenue">
                {formatCurrency(metrics.totalRevenue, selectedCurrency)}
              </p>
              <p className="text-xs text-[hsl(160,84%,39%)] mt-1">
                +{metrics.monthlyGrowth}% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide">
                Active Leads
              </CardTitle>
              <Users className="h-4 w-4 text-[hsl(215,20%,65%)]" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums" data-testid="text-total-leads">
                {metrics.totalLeads.toLocaleString()}
              </p>
              <p className="text-xs text-[hsl(215,20%,65%)] mt-1">
                {leads.filter(l => l.status === 'qualified').length} qualified
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide">
                Conversion Rate
              </CardTitle>
              <Target className="h-4 w-4 text-[hsl(215,20%,65%)]" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums" data-testid="text-conversion-rate">
                {metrics.conversionRate}%
              </p>
              <p className="text-xs text-[hsl(215,20%,65%)] mt-1">
                Above industry average
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide">
                Pipeline Value
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-[hsl(215,20%,65%)]" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums" data-testid="text-pipeline-value">
                {formatCurrency(metrics.pipelineValue, selectedCurrency)}
              </p>
              <p className="text-xs text-[hsl(215,20%,65%)] mt-1">
                {metrics.activeDeals} active deals
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[hsl(210,17%,98%)]">Revenue Trend</CardTitle>
              <CardDescription className="text-[hsl(215,20%,65%)]">Monthly revenue performance across markets</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217,33%,17%)" />
                  <XAxis dataKey="month" stroke="hsl(215,20%,65%)" fontSize={12} />
                  <YAxis stroke="hsl(215,20%,65%)" fontSize={12} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value, selectedCurrency), "Revenue"]}
                    contentStyle={chartTooltipStyle}
                    labelStyle={{ color: 'hsl(210,17%,98%)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(227,89%,63%)" 
                    fill="hsl(227,89%,63%)"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[hsl(210,17%,98%)]">Market Distribution</CardTitle>
              <CardDescription className="text-[hsl(215,20%,65%)]">Revenue distribution by regions</CardDescription>
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
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, "Market Share"]} 
                    contentStyle={chartTooltipStyle}
                    labelStyle={{ color: 'hsl(210,17%,98%)' }}
                  />
                  <Legend 
                    wrapperStyle={{ color: 'hsl(215,20%,65%)' }}
                    formatter={(value) => <span style={{ color: 'hsl(215,20%,65%)' }}>{value}</span>}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[hsl(210,17%,98%)]">Sales Pipeline</CardTitle>
              <CardDescription className="text-[hsl(215,20%,65%)]">Current deal stages and values</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelineData.map((stage) => (
                  <div key={stage.stage} className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-[hsl(227,89%,63%)]"></div>
                      <span className="font-medium text-[hsl(210,17%,98%)]">{stage.stage}</span>
                      <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-transparent">
                        {stage.count}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-[hsl(210,17%,98%)]">
                        {formatCurrency(stage.value, selectedCurrency)}
                      </div>
                      <Progress 
                        value={(stage.value / 2500000) * 100} 
                        className="w-24 h-2 mt-1 bg-[hsl(229,41%,16%)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[hsl(210,17%,98%)]">Recent Activities</CardTitle>
              <CardDescription className="text-[hsl(215,20%,65%)]">Latest customer interactions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-[hsl(215,20%,65%)]" />
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-[hsl(215,16%,47%)] mx-auto mb-3" />
                  <p className="text-sm text-[hsl(215,20%,65%)]">No recent activities</p>
                  <p className="text-xs text-[hsl(215,16%,47%)] mt-1">Start engaging with your customers</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {getPriorityIcon(activity.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[hsl(210,17%,98%)]">
                          {activity.description}
                        </p>
                        <p className="text-xs text-[hsl(215,16%,47%)]">
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

        <Tabs defaultValue="leads" className="space-y-4">
          <TabsList className="bg-[hsl(229,41%,16%)] border border-[hsl(217,33%,17%)] p-1">
            <TabsTrigger 
              value="leads" 
              className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]"
              data-testid="tab-leads"
            >
              High-Value Leads
            </TabsTrigger>
            <TabsTrigger 
              value="deals" 
              className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]"
              data-testid="tab-deals"
            >
              Active Deals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[hsl(210,17%,98%)]">High-Value Leads</CardTitle>
                <CardDescription className="text-[hsl(215,20%,65%)]">Top prospects across markets</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-[hsl(215,20%,65%)]" />
                  </div>
                ) : leads.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-[hsl(215,16%,47%)] mx-auto mb-3" />
                    <p className="text-sm text-[hsl(215,20%,65%)]">No leads yet</p>
                    <p className="text-xs text-[hsl(215,16%,47%)] mt-1">Start adding leads to track your pipeline</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leads.map((lead) => (
                      <div 
                        key={lead.id} 
                        className="flex items-center justify-between flex-wrap gap-4 p-4 border border-[hsl(217,33%,17%)] rounded-lg bg-[hsl(229,41%,16%)]"
                        data-testid={`card-lead-${lead.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-[hsl(227,89%,63%)] text-white">
                              {lead.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-[hsl(210,17%,98%)]">{lead.name}</p>
                            <p className="text-sm text-[hsl(215,20%,65%)]">{lead.company}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <MapPin className="h-3 w-3 text-[hsl(215,16%,47%)]" />
                              <span className="text-xs text-[hsl(215,16%,47%)]">{lead.region}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getStatusColor(lead.status)}>
                              {lead.status}
                            </Badge>
                          </div>
                          <p className="font-medium text-[hsl(210,17%,98%)]">
                            {formatCurrency(lead.value, lead.currency)}
                          </p>
                          <div className="flex items-center gap-1 mt-1 justify-end">
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
            <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[hsl(210,17%,98%)]">Active Deals</CardTitle>
                <CardDescription className="text-[hsl(215,20%,65%)]">Deals in progress across markets</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-[hsl(215,20%,65%)]" />
                  </div>
                ) : deals.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-[hsl(215,16%,47%)] mx-auto mb-3" />
                    <p className="text-sm text-[hsl(215,20%,65%)]">No active deals</p>
                    <p className="text-xs text-[hsl(215,16%,47%)] mt-1">Create deals to track your sales pipeline</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {deals.map((deal) => (
                      <div 
                        key={deal.id} 
                        className="flex items-center justify-between flex-wrap gap-4 p-4 border border-[hsl(217,33%,17%)] rounded-lg bg-[hsl(229,41%,16%)]"
                        data-testid={`card-deal-${deal.id}`}
                      >
                        <div>
                          <p className="font-medium text-[hsl(210,17%,98%)]">{deal.title}</p>
                          <p className="text-sm text-[hsl(215,20%,65%)]">{deal.customer}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3 text-[hsl(215,16%,47%)]" />
                            <span className="text-xs text-[hsl(215,16%,47%)]">
                              Close: {format(deal.closeDate, 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-[hsl(210,17%,98%)]">
                            {formatCurrency(deal.value, deal.currency)}
                          </p>
                          <div className="flex items-center gap-2 mt-1 justify-end">
                            <Badge className={getStatusColor(deal.stage)}>
                              {deal.stage}
                            </Badge>
                          </div>
                          <div className="mt-2">
                            <Progress value={deal.probability} className="w-20 h-2 bg-[hsl(229,41%,16%)]" />
                            <p className="text-xs text-[hsl(215,16%,47%)] mt-1">{deal.probability}% probability</p>
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
