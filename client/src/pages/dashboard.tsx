import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Building2, 
  UserCheck, 
  DollarSign, 
  CheckSquare, 
  Ticket,
  TrendingUp,
  Activity,
  BarChart3,
  Brain,
  Crown,
  Shield,
  Calendar,
  CheckCircle
} from "lucide-react";
import Layout from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import Logo from "@/components/logo";
import SEOHead, { generatePageSEO, generateStructuredData } from "@/components/seo-head";
import TrialBanner from "@/components/trial-banner";
import TrialWarningBanner from "@/components/trial-warning-banner";
import { 
  PredictiveBehaviorWidget, 
  PersonalizedPerformanceWidget, 
  OpportunityPredictionWidget, 
  ActivityPredictionWidget 
} from "@/components/predictive-widgets";
import { SubscriptionBadge } from "@/components/subscription-badge";
import PersonalizedWelcome from "@/components/personalized-welcome";
import OnboardingTrigger from "@/components/onboarding-trigger";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  
  const pageSEO = generatePageSEO('dashboard');
  const structuredData = generateStructuredData('organization');
  
  const isPlatformOwner = Boolean(user?.email === 'abel@argilette.com');
  const isDemoAdmin = Boolean(user?.role === 'demo_admin' && !isPlatformOwner);
  const isAdmin = Boolean(user?.role === 'admin' && !isPlatformOwner);

  const isRegularAdmin = isDemoAdmin || isAdmin;
  const isSuperAdmin = isPlatformOwner;
  
  const { data: allContactsData, isLoading: contactsLoading } = useQuery<any[]>({ queryKey: ["/api/contacts"] });
  const { data: allAccountsData, isLoading: accountsLoading } = useQuery<any[]>({ queryKey: ["/api/accounts"] });
  const { data: allLeadsData, isLoading: leadsLoading } = useQuery<any[]>({ queryKey: ["/api/leads"] });
  const { data: allDealsData, isLoading: dealsLoading } = useQuery<any[]>({ queryKey: ["/api/deals"] });
  const { data: allTasksData, isLoading: tasksLoading } = useQuery<any[]>({ queryKey: ["/api/tasks"] });
  const { data: allTicketsData, isLoading: ticketsLoading } = useQuery<any[]>({ queryKey: ["/api/tickets"] });
  
  const allContacts = allContactsData || [];
  const allAccounts = allAccountsData || [];
  const allLeads = allLeadsData || [];
  const allDeals = allDealsData || [];
  const allTasks = allTasksData || [];
  const allTickets = allTicketsData || [];
  
  const isLoading = contactsLoading || accountsLoading || leadsLoading || dealsLoading || tasksLoading || ticketsLoading;

  const contacts = isPlatformOwner ? allContacts : [];
  const accounts = isPlatformOwner ? allAccounts : [];
  const leads = isPlatformOwner ? allLeads : [];
  const deals = isPlatformOwner ? allDeals : [];
  const tasks = isPlatformOwner ? allTasks : [];
  const tickets = isPlatformOwner ? allTickets : [];

  const totalDealsValue = deals.reduce((sum: number, deal: any) => sum + (parseFloat(deal.amount || "0")), 0);
  const openTicketsCount = tickets.filter((t: any) => t.status === "open").length;
  const totalContacts = contacts.length;
  const totalAccounts = accounts.length;
  const totalLeads = leads.length;
  const totalDeals = deals.length;
  const totalTasks = tasks.length;
  const totalTickets = tickets.length;

  const stats = isPlatformOwner ? [
    {
      title: "Total Platform Users",
      value: totalContacts.toLocaleString(),
      change: totalContacts > 0 ? `+${Math.round((totalContacts / 10) * 100)}%` : "0%",
      icon: Users,
      color: "text-[hsl(227,89%,63%)]"
    },
    {
      title: "Active Companies",
      value: totalAccounts.toLocaleString(),
      change: totalAccounts > 0 ? `+${Math.round((totalAccounts / 5) * 100)}%` : "0%",
      icon: Building2,
      color: "text-[hsl(142,76%,36%)]"
    },
    {
      title: "Monthly Revenue",
      value: `$${totalDealsValue.toLocaleString()}`,
      change: totalDealsValue > 0 ? `+${Math.round((totalDealsValue / 1000) * 10)}%` : "0%",
      icon: DollarSign,
      color: "text-[hsl(142,76%,36%)]"
    },
    {
      title: "Trial Conversions",
      value: totalLeads > 0 ? `${Math.round((totalDeals / totalLeads) * 100)}%` : "0%",
      change: "0%",
      icon: TrendingUp,
      color: "text-[hsl(45,93%,47%)]"
    },
    {
      title: "Platform Health",
      value: totalTickets === 0 ? "100%" : `${Math.max(0, 100 - (openTicketsCount * 10))}%`,
      change: "0%",
      icon: Activity,
      color: "text-[hsl(280,65%,60%)]"
    },
    {
      title: "Support Tickets",
      value: openTicketsCount.toLocaleString(),
      change: totalTickets > 0 ? `${totalTickets} total` : "0%",
      icon: Ticket,
      color: "text-[hsl(0,84%,60%)]"
    }
  ] : [
    {
      title: "My Contacts",
      value: totalContacts.toLocaleString(),
      change: totalContacts > 0 ? `${totalContacts} total` : "0%",
      icon: Users,
      color: "text-[hsl(227,89%,63%)]"
    },
    {
      title: "My Accounts",
      value: totalAccounts.toLocaleString(),
      change: totalAccounts > 0 ? `${totalAccounts} companies` : "0%",
      icon: Building2,
      color: "text-[hsl(142,76%,36%)]"
    },
    {
      title: "My Leads",
      value: totalLeads.toLocaleString(),
      change: totalLeads > 0 ? `${leads.filter((l: any) => l.status === "qualified").length} qualified` : "0%",
      icon: UserCheck,
      color: "text-[hsl(230,65%,60%)]"
    },
    {
      title: "My Deals",
      value: `$${totalDealsValue.toLocaleString()}`,
      change: totalDeals > 0 ? `${totalDeals} active deals` : "0%",
      icon: DollarSign,
      color: "text-[hsl(45,93%,47%)]"
    },
    {
      title: "My Tasks",
      value: totalTasks.toLocaleString(),
      change: totalTasks > 0 ? `${tasks.filter((t: any) => t.status === "pending").length} pending` : "0%",
      icon: CheckSquare,
      color: "text-[hsl(280,65%,60%)]"
    },
    {
      title: "My Tickets",
      value: totalTickets.toLocaleString(),
      change: totalTickets > 0 ? `${openTicketsCount} open` : "0%",
      icon: Ticket,
      color: "text-[hsl(0,84%,60%)]"
    }
  ];

  return (
    <>
      <SEOHead 
        title="Dashboard - NODE CRM | AI-Powered Customer Relationship Management"
        description="Access your comprehensive NODE CRM dashboard with AI-powered insights, advanced analytics, and complete customer relationship management tools."
        keywords={["CRM dashboard", "customer management", "AI CRM", "AI-powered analytics", "business analytics"]}
        url="https://nodecrm.com/dashboard"
        structuredData={structuredData}
      />
      <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-4">
            <Logo size="lg" />
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0">
                  <CheckCircle className="h-4 w-4 inline mr-1" />
                  Enterprise-Grade Security
                </Badge>
                <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(280,65%,60%)] border-0">
                  <Brain className="h-4 w-4 inline mr-1" />
                  AI-Powered Intelligence
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-[hsl(210,17%,98%)] tracking-tight">
                {isPlatformOwner ? "Platform Command Center" : "AI-Powered CRM Dashboard"}
              </h1>
              <p className="text-[hsl(215,20%,65%)]">
                {isPlatformOwner 
                  ? "Manage your entire platform with enterprise-grade controls and real-time analytics" 
                  : "Transform customer relationships with AI-driven analytics and predictive insights"}
              </p>
              {!isPlatformOwner && (
                <Badge className="mt-2 bg-[hsl(229,41%,16%)] text-[hsl(215,20%,65%)] border-0">
                  Enterprise-Ready Platform • Built with AI/ML
                </Badge>
              )}
            </div>
          </div>
          <div className="flex space-x-2 gap-2">
            {isPlatformOwner && (
              <Link href="/super-admin">
                <Button 
                  variant="outline" 
                  className="border-[hsl(45,93%,47%)] text-[hsl(45,93%,47%)] hover:bg-[hsl(229,41%,16%)]"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Platform Admin
                </Button>
              </Link>
            )}
            
            <Link href="/scheduling">
              <Button className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
            </Link>

          </div>
        </div>

        <TrialBanner />
        
        {!isPlatformOwner && <TrialWarningBanner />}

        <OnboardingTrigger userRole={user?.role} />

        {user && !isPlatformOwner && !user?.isPlatformOwner && user.email !== 'abel@argilette.com' && user.role !== 'platform_owner' && <PersonalizedWelcome />}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide mb-1">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums">
                        {stat.value}
                      </p>
                      <p className="text-xs text-[hsl(215,16%,47%)] mt-1">
                        {stat.change} from last month
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-[hsl(229,41%,16%)] flex items-center justify-center flex-shrink-0">
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide flex items-center gap-2">
                <Activity className="h-5 w-5 text-[hsl(227,89%,63%)]" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-[hsl(142,76%,36%)] rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[hsl(210,17%,98%)]">New lead converted to customer</p>
                    <p className="text-xs text-[hsl(215,16%,47%)]">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-[hsl(227,89%,63%)] rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[hsl(210,17%,98%)]">Campaign "Q1 Outreach" completed</p>
                    <p className="text-xs text-[hsl(215,16%,47%)]">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-[hsl(45,93%,47%)] rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[hsl(210,17%,98%)]">High priority ticket assigned</p>
                    <p className="text-xs text-[hsl(215,16%,47%)]">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide">
                Sales Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["qualification", "proposal", "negotiation", "closed-won"].map((stage) => {
                  const stageDeals = (deals || []).filter((d: any) => d.stage === stage);
                  const totalValue = stageDeals.reduce((sum: number, deal: any) => 
                    sum + (parseFloat(deal.amount || "0")), 0
                  );
                  
                  return (
                    <div key={stage} className="flex justify-between items-center gap-2">
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0">{stageDeals.length}</Badge>
                        <span className="text-sm capitalize text-[hsl(210,17%,98%)]">{stage.replace("-", " ")}</span>
                      </div>
                      <span className="text-sm font-medium text-[hsl(210,17%,98%)]">
                        ${totalValue.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isPlatformOwner ? 'grid-cols-7' : 'grid-cols-4'} bg-[hsl(229,41%,16%)] border border-[hsl(217,33%,17%)] p-1`}>
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]"
            >
              Overview
            </TabsTrigger>
            
            {isPlatformOwner ? (
              <>
                <TabsTrigger 
                  value="platform-analytics"
                  className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]"
                >
                  Platform Analytics
                </TabsTrigger>
                <TabsTrigger 
                  value="activities"
                  className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]"
                >
                  Activities
                </TabsTrigger>
                <TabsTrigger 
                  value="team"
                  className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]"
                >
                  Team
                </TabsTrigger>
                <TabsTrigger 
                  value="intelligence"
                  className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]"
                >
                  Intelligence
                </TabsTrigger>
                <TabsTrigger 
                  value="reports"
                  className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]"
                >
                  Reports
                </TabsTrigger>
                <TabsTrigger 
                  value="platform-management"
                  className="data-[state=active]:bg-[hsl(45,93%,47%)] data-[state=active]:text-[hsl(228,47%,12%)] text-[hsl(215,20%,65%)]"
                >
                  <Crown className="h-4 w-4 mr-1" />
                  Platform
                </TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger 
                  value="analytics"
                  className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]"
                >
                  Analytics
                </TabsTrigger>
                <TabsTrigger 
                  value="activities"
                  className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]"
                >
                  Activities
                </TabsTrigger>
                <TabsTrigger 
                  value="reports"
                  className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]"
                >
                  Reports
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.title} className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide mb-1">
                            {stat.title}
                          </p>
                          <p className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums">
                            {stat.value}
                          </p>
                          <p className="text-xs text-[hsl(215,16%,47%)] mt-1">
                            {stat.change} from last month
                          </p>
                        </div>
                        <div className="h-12 w-12 rounded-lg bg-[hsl(229,41%,16%)] flex items-center justify-center flex-shrink-0">
                          <Icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="argilette-hover-lift">
                <SubscriptionBadge />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-semibold text-[hsl(210,17%,98%)] tracking-tight">
                    Predictive Intelligence
                  </h2>
                  <p className="text-sm text-[hsl(215,20%,65%)]">
                    AI-powered insights and predictions
                  </p>
                </div>
                <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0 text-xs">
                  <Brain className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="argilette-hover-lift">
                  <PredictiveBehaviorWidget />
                </div>
                <div className="argilette-hover-lift">
                  <PersonalizedPerformanceWidget />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="argilette-hover-lift">
                  <OpportunityPredictionWidget />
                </div>
                <div className="argilette-hover-lift">
                  <ActivityPredictionWidget />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[hsl(227,89%,63%)]" />
                  Your CRM Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm font-medium text-[hsl(215,20%,65%)]">Your Revenue</span>
                    <span className="text-2xl font-bold text-[hsl(142,76%,36%)]">${totalDealsValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm font-medium text-[hsl(215,20%,65%)]">Growth Rate</span>
                    <span className="text-lg font-semibold text-[hsl(227,89%,63%)]">
                      {totalDeals > 0 ? `${Math.round((totalDeals / 10) * 100)}%` : "0%"}
                    </span>
                  </div>
                  <div className="w-full bg-[hsl(229,41%,16%)] rounded-full h-2">
                    <div 
                      className="bg-[hsl(227,89%,63%)] h-2 rounded-full" 
                      style={{ width: `${Math.min(100, (totalDeals / 10) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-[hsl(215,16%,47%)] mt-4">
                    {totalContacts === 0 
                      ? "Start adding contacts and deals to see your analytics grow"
                      : `You have ${totalContacts} contacts and ${totalDeals} active deals`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="platform-analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(45,93%,47%)/30] rounded-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[hsl(45,93%,47%)] uppercase tracking-wide flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    Platform Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums">$307</div>
                    <div className="text-sm text-[hsl(142,76%,36%)]">+23% from last month</div>
                    <div className="w-full bg-[hsl(229,41%,16%)] rounded-full h-2">
                      <div className="bg-[hsl(45,93%,47%)] h-2 rounded-full w-3/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(142,76%,36%)/30] rounded-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[hsl(142,76%,36%)] uppercase tracking-wide flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Platform Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums">5</div>
                    <div className="text-sm text-[hsl(142,76%,36%)]">+2 new users this month</div>
                    <div className="w-full bg-[hsl(229,41%,16%)] rounded-full h-2">
                      <div className="bg-[hsl(142,76%,36%)] h-2 rounded-full w-2/3"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(227,89%,63%)/30] rounded-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[hsl(227,89%,63%)] uppercase tracking-wide flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Active Companies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums">4</div>
                    <div className="text-sm text-[hsl(227,89%,63%)]">98.5% uptime</div>
                    <div className="w-full bg-[hsl(229,41%,16%)] rounded-full h-2">
                      <div className="bg-[hsl(227,89%,63%)] h-2 rounded-full w-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[hsl(227,89%,63%)]" />
                  Platform Health Monitor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm font-medium text-[hsl(215,20%,65%)]">System Uptime</span>
                      <span className="text-lg font-semibold text-[hsl(142,76%,36%)]">99.9%</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm font-medium text-[hsl(215,20%,65%)]">Active Sessions</span>
                      <span className="text-lg font-semibold text-[hsl(227,89%,63%)]">12</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm font-medium text-[hsl(215,20%,65%)]">Trial Conversions</span>
                      <span className="text-lg font-semibold text-[hsl(45,93%,47%)]">75%</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm font-medium text-[hsl(215,20%,65%)]">Support Tickets</span>
                      <span className="text-lg font-semibold text-[hsl(0,84%,60%)]">{(tickets || []).filter((t: any) => t.status === "open").length}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm font-medium text-[hsl(215,20%,65%)]">Database Health</span>
                      <span className="text-lg font-semibold text-[hsl(142,76%,36%)]">Optimal</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm font-medium text-[hsl(215,20%,65%)]">Storage Used</span>
                      <span className="text-lg font-semibold text-[hsl(227,89%,63%)]">45%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[hsl(227,89%,63%)]" />
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border border-[hsl(217,33%,17%)] rounded-lg bg-[hsl(229,41%,16%)]">
                    <div className="w-8 h-8 bg-[hsl(227,89%,63%)/20] rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-[hsl(227,89%,63%)]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-[hsl(210,17%,98%)]">New customer registration</p>
                      <p className="text-xs text-[hsl(215,16%,47%)]">Sarah Johnson - 2 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isPlatformOwner && (
            <TabsContent value="team" className="space-y-4">
              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide flex items-center gap-2">
                    <Users className="h-5 w-5 text-[hsl(227,89%,63%)]" />
                    Team Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 p-3 border border-[hsl(217,33%,17%)] rounded-lg bg-[hsl(229,41%,16%)]">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[hsl(227,89%,63%)/20] rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-[hsl(227,89%,63%)]">JS</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-[hsl(210,17%,98%)]">John Smith</p>
                          <p className="text-xs text-[hsl(215,16%,47%)]">Sales Manager</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-[hsl(142,76%,36%)]">95%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isPlatformOwner && (
            <TabsContent value="intelligence" className="space-y-4">
              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide flex items-center gap-2">
                    <Brain className="h-5 w-5 text-[hsl(280,65%,60%)]" />
                    Customer Sentiment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm font-medium text-[hsl(215,20%,65%)]">Overall Sentiment</span>
                      <span className="text-lg font-bold text-[hsl(142,76%,36%)]">Positive</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[hsl(215,20%,65%)]">Positive</span>
                        <span className="text-[hsl(210,17%,98%)]">72%</span>
                      </div>
                      <div className="w-full bg-[hsl(229,41%,16%)] rounded-full h-2">
                        <div className="bg-[hsl(142,76%,36%)] h-2 rounded-full" style={{ width: '72%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="reports" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg hover-elevate cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[hsl(227,89%,63%)]" />
                    Sales Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[hsl(227,89%,63%)] mb-2 tabular-nums">$45,230</div>
                  <Button className="w-full bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white text-sm">
                    Generate Report
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg hover-elevate cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide flex items-center gap-2">
                    <Users className="h-4 w-4 text-[hsl(142,76%,36%)]" />
                    Customer Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[hsl(142,76%,36%)] mb-2 tabular-nums">{totalContacts.toLocaleString()}</div>
                  <Button className="w-full bg-[hsl(142,76%,36%)] hover:bg-[hsl(142,76%,30%)] text-white text-sm">
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="platform-management" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(280,65%,60%)/30] rounded-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[hsl(280,65%,60%)] uppercase tracking-wide flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Center
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm text-[hsl(215,20%,65%)]">System Security</span>
                      <Badge className="bg-[hsl(142,76%,36%)/20] text-[hsl(142,76%,36%)] border-0">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm text-[hsl(215,20%,65%)]">Failed Login Attempts</span>
                      <span className="text-lg font-semibold text-[hsl(210,17%,98%)]">2</span>
                    </div>
                    <Link href="/super-admin-dashboard">
                      <Button size="sm" className="w-full bg-[hsl(280,65%,60%)] hover:bg-[hsl(280,65%,50%)] text-white">
                        Manage Security
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(230,65%,60%)/30] rounded-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[hsl(230,65%,60%)] uppercase tracking-wide flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm text-[hsl(215,20%,65%)]">Total Users</span>
                      <span className="text-lg font-semibold text-[hsl(210,17%,98%)]">5</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm text-[hsl(215,20%,65%)]">Active Today</span>
                      <span className="text-lg font-semibold text-[hsl(210,17%,98%)]">3</span>
                    </div>
                    <Link href="/super-admin-dashboard">
                      <Button size="sm" className="w-full bg-[hsl(230,65%,60%)] hover:bg-[hsl(230,65%,50%)] text-white">
                        Manage Users
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(25,95%,53%)/30] rounded-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[hsl(25,95%,53%)] uppercase tracking-wide flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Revenue Control
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm text-[hsl(215,20%,65%)]">Monthly Revenue</span>
                      <span className="text-lg font-semibold text-[hsl(210,17%,98%)]">$307</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm text-[hsl(215,20%,65%)]">Subscriptions</span>
                      <span className="text-lg font-semibold text-[hsl(210,17%,98%)]">4</span>
                    </div>
                    <Link href="/super-admin-dashboard">
                      <Button size="sm" className="w-full bg-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,45%)] text-white">
                        Financial Reports
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide flex items-center gap-2">
                  <Crown className="h-5 w-5 text-[hsl(45,93%,47%)]" />
                  Platform Administration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-[hsl(210,17%,98%)]">System Operations</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center gap-2 p-3 border border-[hsl(217,33%,17%)] rounded-lg bg-[hsl(229,41%,16%)]">
                        <span className="text-sm text-[hsl(215,20%,65%)]">Database Status</span>
                        <Badge className="bg-[hsl(142,76%,36%)/20] text-[hsl(142,76%,36%)] border-0">Operational</Badge>
                      </div>
                      <div className="flex justify-between items-center gap-2 p-3 border border-[hsl(217,33%,17%)] rounded-lg bg-[hsl(229,41%,16%)]">
                        <span className="text-sm text-[hsl(215,20%,65%)]">Server Health</span>
                        <Badge className="bg-[hsl(142,76%,36%)/20] text-[hsl(142,76%,36%)] border-0">99.9% Uptime</Badge>
                      </div>
                      <div className="flex justify-between items-center gap-2 p-3 border border-[hsl(217,33%,17%)] rounded-lg bg-[hsl(229,41%,16%)]">
                        <span className="text-sm text-[hsl(215,20%,65%)]">Backup Status</span>
                        <Badge className="bg-[hsl(227,89%,63%)/20] text-[hsl(227,89%,63%)] border-0">Last: 2 hours ago</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-[hsl(210,17%,98%)]">Quick Actions</h3>
                    <div className="space-y-3">
                      <Link href="/super-admin">
                        <Button className="w-full justify-start border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)] bg-transparent" variant="outline">
                          <Shield className="mr-2 h-4 w-4" />
                          Security Dashboard
                        </Button>
                      </Link>
                      <Link href="/super-admin">
                        <Button className="w-full justify-start border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)] bg-transparent" variant="outline">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Analytics Dashboard
                        </Button>
                      </Link>
                      <Link href="/super-admin">
                        <Button className="w-full justify-start border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)] bg-transparent" variant="outline">
                          <Users className="mr-2 h-4 w-4" />
                          User Management
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
    </>
  );
}
