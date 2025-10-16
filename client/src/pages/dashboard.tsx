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
  
  // Generate SEO data
  const pageSEO = generatePageSEO('dashboard');
  const structuredData = generateStructuredData('organization');
  
  // Define role variables - Updated to include both platform owner emails
  const isPlatformOwner = Boolean(user?.email === 'admin@default.com' || user?.email === 'abel@argilette.com');
  const isDemoAdmin = Boolean(user?.role === 'demo_admin' && !isPlatformOwner);
  const isAdmin = Boolean(user?.role === 'admin' && !isPlatformOwner);

  // Debug logging to check user authentication
  console.log('Dashboard - User data:', user);
  console.log('Dashboard - isPlatformOwner:', isPlatformOwner);
  console.log('Dashboard - User role:', user?.role);
  console.log('Dashboard - User email:', user?.email);
  const isRegularAdmin = isDemoAdmin || isAdmin;
  const isSuperAdmin = isPlatformOwner; // Legacy compatibility
  
  console.log("Current active tab:", activeTab); // Debug log
  console.log("Dashboard roles:", { 
    isPlatformOwner, 
    isDemoAdmin, 
    isAdmin, 
    userRole: user?.role, 
    userEmail: user?.email,
    userIsPlatformOwner: user?.isPlatformOwner,
    fullUser: user
  });
  
  // Fetch data from APIs
  const { data: allContacts = [] } = useQuery<any[]>({ queryKey: ["/api/contacts"] });
  const { data: allAccounts = [] } = useQuery<any[]>({ queryKey: ["/api/accounts"] });
  const { data: allLeads = [] } = useQuery<any[]>({ queryKey: ["/api/leads"] });
  const { data: allDeals = [] } = useQuery<any[]>({ queryKey: ["/api/deals"] });
  const { data: allTasks = [] } = useQuery<any[]>({ queryKey: ["/api/tasks"] });
  const { data: allTickets = [] } = useQuery<any[]>({ queryKey: ["/api/tickets"] });

  // Filter data based on user role - Platform owners see all test data, other users see empty/clean data
  const contacts = isPlatformOwner ? allContacts : []; // Non-platform users see no pre-populated contacts
  const accounts = isPlatformOwner ? allAccounts : []; // Non-platform users see no pre-populated accounts  
  const leads = isPlatformOwner ? allLeads : []; // Non-platform users see no pre-populated leads
  const deals = isPlatformOwner ? allDeals : []; // Non-platform users see no pre-populated deals
  const tasks = isPlatformOwner ? allTasks : []; // Non-platform users see no pre-populated tasks
  const tickets = isPlatformOwner ? allTickets : []; // Non-platform users see no pre-populated tickets

  // Platform Owner gets platform-wide metrics, Regular users get company-specific metrics - ALL COUNTERS RESET TO ZERO
  const stats = isPlatformOwner ? [
    {
      title: "Total Platform Users",
      value: "0", // Platform-wide user count
      change: "0%",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Active Companies",
      value: "0", // Active companies on platform
      change: "0%",
      icon: Building2,
      color: "text-green-600"
    },
    {
      title: "Monthly Revenue",
      value: "$0",
      change: "0%",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Trial Conversions",
      value: "0%",
      change: "0%",
      icon: TrendingUp,
      color: "text-yellow-600"
    },
    {
      title: "Platform Health",
      value: "0%",
      change: "0%",
      icon: Activity,
      color: "text-purple-600"
    },
    {
      title: "Support Tickets",
      value: "0",
      change: "0%",
      icon: Ticket,
      color: "text-red-600"
    }
  ] : [
    {
      title: "My Contacts",
      value: "0",
      change: "0%",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "My Accounts",
      value: "0",
      change: "0%",
      icon: Building2,
      color: "text-green-600"
    },
    {
      title: "My Leads",
      value: "0",
      change: "0%",
      icon: UserCheck,
      color: "text-indigo-600"
    },
    {
      title: "My Deals",
      value: "0",
      change: "0%",
      icon: DollarSign,
      color: "text-yellow-600"
    },
    {
      title: "My Tasks",
      value: "0",
      change: "0%",
      icon: CheckSquare,
      color: "text-purple-600"
    },
    {
      title: "My Tickets",
      value: "0",
      change: "0%",
      icon: Ticket,
      color: "text-red-600"
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Logo size="lg" />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  <CheckCircle className="h-4 w-4 inline mr-1" />
                  Enterprise-Grade Security
                </div>
                <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                  <Brain className="h-4 w-4 inline mr-1" />
                  AI-Powered Intelligence
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isPlatformOwner ? "Platform Command Center" : "AI-Powered CRM Dashboard"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isPlatformOwner 
                  ? "Manage your entire platform with enterprise-grade controls and real-time analytics" 
                  : "Transform customer relationships with AI-driven analytics and predictive insights"}
              </p>
              {!isPlatformOwner && (
                <Badge variant="secondary" className="mt-2">
                  Enterprise-Ready Platform • Built with AI/ML
                </Badge>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            {/* ONLY Platform Owner gets access to Super Admin Dashboard */}
            {isPlatformOwner && (
              <Link to="/super-admin">
                <Button 
                  variant="outline" 
                  className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Platform Admin
                </Button>
              </Link>
            )}
            
            {/* Regular Schedule Meeting for both types */}
            <Link to="/scheduling">
              <Button>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
            </Link>

          </div>
        </div>

        {/* Trial Banner for Demo Users */}
        <TrialBanner />
        
        {/* Trial Warning Banner for Account Locking */}
        {!isPlatformOwner && <TrialWarningBanner />}

        {/* Onboarding Trigger for New Users */}
        <OnboardingTrigger userRole={user?.role} />

        {/* Personalized Welcome Screen - Only mount when user is known and not platform owner */}
        {user && !isPlatformOwner && !user?.isPlatformOwner && user.email !== 'admin@default.com' && user.email !== 'abel@argilette.com' && user.role !== 'platform_owner' && <PersonalizedWelcome />}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {stat.change} from last month
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New lead converted to customer</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Campaign "Q1 Outreach" completed</p>
                    <p className="text-xs text-gray-500">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">High priority ticket assigned</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sales Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["qualification", "proposal", "negotiation", "closed-won"].map((stage) => {
                  const stageDeals = (deals || []).filter((d: any) => d.stage === stage);
                  const totalValue = stageDeals.reduce((sum: number, deal: any) => 
                    sum + (parseFloat(deal.amount || "0")), 0
                  );
                  
                  return (
                    <div key={stage} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{stageDeals.length}</Badge>
                        <span className="text-sm capitalize">{stage.replace("-", " ")}</span>
                      </div>
                      <span className="text-sm font-medium">
                        ${totalValue.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => {
          console.log("Tab change triggered:", value);
          setActiveTab(value);
        }} className="space-y-6">
          <TabsList className={`grid w-full ${isPlatformOwner ? 'grid-cols-7' : 'grid-cols-4'}`}>
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Overview
            </TabsTrigger>
            
            {/* Platform Owner gets advanced tabs, regular users get basic CRM tabs */}
            {isPlatformOwner ? (
              <>
                <TabsTrigger 
                  value="platform-analytics"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Platform Analytics
                </TabsTrigger>
                <TabsTrigger 
                  value="activities"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Activities
                </TabsTrigger>
                <TabsTrigger 
                  value="team"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Team
                </TabsTrigger>
                <TabsTrigger 
                  value="intelligence"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Intelligence
                </TabsTrigger>
                <TabsTrigger 
                  value="reports"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Reports
                </TabsTrigger>
                <TabsTrigger 
                  value="platform-management"
                  className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white"
                >
                  <Crown className="h-4 w-4 mr-1" />
                  Platform
                </TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger 
                  value="analytics"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Analytics
                </TabsTrigger>
                <TabsTrigger 
                  value="activities"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Activities
                </TabsTrigger>
                <TabsTrigger 
                  value="reports"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
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
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">
                        {stat.change} from last month
                      </p>
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

            {/* Predictive Analytics Widgets */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Predictive Intelligence</h3>
                <Badge variant="outline" className="text-xs">
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

          {/* Regular User Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Your CRM Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Your Revenue</span>
                    <span className="text-2xl font-bold text-green-600">$0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Growth Rate</span>
                    <span className="text-lg font-semibold text-blue-600">0%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full w-0"></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Start adding contacts and deals to see your analytics grow
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Owner Analytics Tab */}
          <TabsContent value="platform-analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-yellow-800">
                    <Crown className="mr-2 h-5 w-5" />
                    Platform Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-yellow-800">$307</div>
                    <div className="text-sm text-yellow-600">+23% from last month</div>
                    <div className="w-full bg-yellow-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full w-3/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-800">
                    <Users className="mr-2 h-5 w-5" />
                    Platform Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-green-800">5</div>
                    <div className="text-sm text-green-600">+2 new users this month</div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full w-2/3"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-800">
                    <Building2 className="mr-2 h-5 w-5" />
                    Active Companies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-blue-800">4</div>
                    <div className="text-sm text-blue-600">98.5% uptime</div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full w-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Platform Health Monitor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">System Uptime</span>
                      <span className="text-lg font-semibold text-green-600">99.9%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Active Sessions</span>
                      <span className="text-lg font-semibold text-blue-600">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Trial Conversions</span>
                      <span className="text-lg font-semibold text-yellow-600">75%</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Support Tickets</span>
                      <span className="text-lg font-semibold text-red-600">{(tickets || []).filter((t: any) => t.status === "open").length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Database Health</span>
                      <span className="text-lg font-semibold text-green-600">Optimal</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Storage Used</span>
                      <span className="text-lg font-semibold text-blue-600">45%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border rounded">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">New customer registration</p>
                      <p className="text-xs text-gray-500">Sarah Johnson - 2 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab - Platform Owner Only */}
          {isPlatformOwner && (
            <TabsContent value="team" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    Team Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">JS</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">John Smith</p>
                          <p className="text-xs text-gray-500">Sales Manager</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-green-600">95%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Intelligence Tab - Platform Owner Only */}
          {isPlatformOwner && (
            <TabsContent value="intelligence" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="mr-2 h-5 w-5" />
                    Customer Sentiment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Overall Sentiment</span>
                      <span className="text-lg font-bold text-green-600">Positive</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Positive</span>
                        <span>72%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="reports" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Sales Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600 mb-2">$45,230</div>
                  <button className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                    Generate Report
                  </button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Customer Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 mb-2">1,234</div>
                  <button className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                    Generate Report
                  </button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Platform Management Tab - Only for Platform Owner */}
          <TabsContent value="platform-management" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-800">
                    <Shield className="mr-2 h-5 w-5" />
                    Security Center
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">System Security</span>
                      <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Failed Login Attempts</span>
                      <span className="text-lg font-semibold text-purple-800">2</span>
                    </div>
                    <Link to="/super-admin-dashboard">
                      <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                        Manage Security
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-indigo-200 bg-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-indigo-800">
                    <Users className="mr-2 h-5 w-5" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Users</span>
                      <span className="text-lg font-semibold text-indigo-800">5</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Today</span>
                      <span className="text-lg font-semibold text-indigo-800">3</span>
                    </div>
                    <Link to="/super-admin-dashboard">
                      <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700">
                        Manage Users
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-800">
                    <DollarSign className="mr-2 h-5 w-5" />
                    Revenue Control
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Monthly Revenue</span>
                      <span className="text-lg font-semibold text-orange-800">$307</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Subscriptions</span>
                      <span className="text-lg font-semibold text-orange-800">4</span>
                    </div>
                    <Link to="/super-admin-dashboard">
                      <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
                        Financial Reports
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="mr-2 h-5 w-5 text-yellow-600" />
                  Platform Administration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">System Operations</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 border rounded">
                        <span className="text-sm">Database Status</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800">Operational</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 border rounded">
                        <span className="text-sm">Server Health</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800">99.9% Uptime</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 border rounded">
                        <span className="text-sm">Backup Status</span>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">Last: 2 hours ago</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Quick Actions</h3>
                    <div className="space-y-3">
                      <Link to="/super-admin">
                        <Button className="w-full justify-start" variant="outline">
                          <Shield className="mr-2 h-4 w-4" />
                          Security Dashboard
                        </Button>
                      </Link>
                      <Link to="/super-admin">
                        <Button className="w-full justify-start" variant="outline">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Analytics Dashboard
                        </Button>
                      </Link>
                      <Link to="/super-admin">
                        <Button className="w-full justify-start" variant="outline">
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
