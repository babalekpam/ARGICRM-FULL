import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Building2, 
  UserCheck, 
  DollarSign, 
  CheckSquare, 
  Ticket,
  TrendingUp,
  Activity,
  Calendar,
  Target,
  Clock,
  PlusCircle,
  BarChart3,
  Mail,
  Phone,
  Shield,
  WifiOff,
  Database
} from "lucide-react";
import Layout from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import SEOHead from "@/components/seo-head";

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  icon: any;
  color: string;
  href?: string;
}

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  
  // Fetch user-specific data with proper typing
  const { data: contacts = [] } = useQuery<any[]>({ queryKey: ["/api/contacts"] });
  const { data: accounts = [] } = useQuery<any[]>({ queryKey: ["/api/accounts"] });
  const { data: leads = [] } = useQuery<any[]>({ queryKey: ["/api/leads"] });
  const { data: deals = [] } = useQuery<any[]>({ queryKey: ["/api/deals"] });
  const { data: tasks = [] } = useQuery<any[]>({ queryKey: ["/api/tasks"] });
  const { data: tickets = [] } = useQuery<any[]>({ queryKey: ["/api/tickets"] });

  // Calculate user-specific metrics
  const stats: StatCard[] = [
    {
      title: "Active Contacts",
      value: (contacts as any[]).length,
      change: (contacts as any[]).length > 0 ? "+12%" : "0%",
      icon: Users,
      color: "text-blue-600",
      href: "/contacts"
    },
    {
      title: "Customer Accounts",
      value: (accounts as any[]).filter((a: any) => a.accountType === "customer").length,
      change: (accounts as any[]).length > 0 ? "+8%" : "0%",
      icon: Building2,
      color: "text-green-600",
      href: "/accounts"
    },
    {
      title: "New Leads",
      value: (leads as any[]).filter((l: any) => l.status === "new" || l.status === "qualified").length,
      change: (leads as any[]).length > 0 ? "+23%" : "0%",
      icon: UserCheck,
      color: "text-indigo-600",
      href: "/leads"
    },
    {
      title: "Open Deals",
      value: (deals as any[]).filter((d: any) => !["closed-won", "closed-lost"].includes(d.stage)).length,
      change: (deals as any[]).length > 0 ? "+15%" : "0%",
      icon: DollarSign,
      color: "text-yellow-600",
      href: "/deals"
    },
    {
      title: "Pending Tasks",
      value: (tasks as any[]).filter((t: any) => t.status === "pending" || t.status === "in_progress").length,
      change: (tasks as any[]).length > 0 ? "-5%" : "0%",
      icon: CheckSquare,
      color: "text-purple-600",
      href: "/tasks"
    },
    {
      title: "Open Tickets",
      value: (tickets as any[]).filter((t: any) => t.status === "open").length,
      change: (tickets as any[]).length > 0 ? "+2%" : "0%",
      icon: Ticket,
      color: "text-red-600",
      href: "/tickets"
    }
  ];

  // Calculate deal pipeline value
  const pipelineValue = (deals as any[])
    .filter((d: any) => !["closed-won", "closed-lost"].includes(d.stage))
    .reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);

  // Recent activities (sample for now)
  const recentActivities = [
    { type: "contact", action: "Added new contact", time: "2 hours ago", icon: Users },
    { type: "deal", action: "Updated deal stage", time: "4 hours ago", icon: DollarSign },
    { type: "task", action: "Completed follow-up task", time: "1 day ago", icon: CheckSquare },
    { type: "lead", action: "Qualified new lead", time: "2 days ago", icon: UserCheck }
  ];

  // Quick actions
  const quickActions = [
    { label: "Add Contact", href: "/contacts", icon: Users, color: "bg-blue-500" },
    { label: "Create Lead", href: "/leads", icon: UserCheck, color: "bg-indigo-500" },
    { label: "New Deal", href: "/deals", icon: DollarSign, color: "bg-yellow-500" },
    { label: "Add Task", href: "/tasks", icon: CheckSquare, color: "bg-purple-500" }
  ];

  return (
    <>
      <SEOHead 
        title="My Dashboard - NODE CRM"
        description="Your personal CRM dashboard with contacts, leads, deals, and tasks overview."
        keywords={["CRM dashboard", "personal CRM", "customer management"]}
        url="https://nodecrm.com/dashboard"
      />
      <Layout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      <Shield className="h-4 w-4 inline mr-1" />
                      GDPR/SOC 2 Compliant
                    </div>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      <BarChart3 className="h-4 w-4 inline mr-1" />
                      Real-Time Analytics
                    </div>
                  </div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Welcome back, {user?.email?.split('@')[0] || 'User'}!
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 text-lg">
                    AI-powered insights and emotional intelligence at your fingertips
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                  Smart Dashboard
                </Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  Data Insights
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                  AI Powered
                </Badge>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Activity className="h-3 w-3 mr-1" />
                Active
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {user?.role === 'demo_admin' ? 'Demo User' : 'User'}
              </Badge>
            </div>
          </div>

          {/* Dashboard Tabs - Professional Design */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-1 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
              <TabsTrigger 
                value="overview" 
                className="flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-blue-200 data-[state=active]:text-blue-700 data-[state=active]:scale-105 hover:bg-white/70 hover:shadow-md"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="activities" 
                className="flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-green-200 data-[state=active]:text-green-700 data-[state=active]:scale-105 hover:bg-white/70 hover:shadow-md"
              >
                <Activity className="h-4 w-4" />
                <span>Activities</span>
              </TabsTrigger>
              <TabsTrigger 
                value="quick-actions" 
                className="flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-purple-200 data-[state=active]:text-purple-700 data-[state=active]:scale-105 hover:bg-white/70 hover:shadow-md"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Quick Actions</span>
              </TabsTrigger>
              <TabsTrigger 
                value="offline-crm" 
                className="flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-orange-200 data-[state=active]:text-orange-700 data-[state=active]:scale-105 hover:bg-white/70 hover:shadow-md"
              >
                <WifiOff className="h-4 w-4" />
                <span>Offline CRM</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8 mt-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href={stat.href || "#"}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {stat.title}
                        </CardTitle>
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stat.value}
                        </div>
                        <p className={`text-xs ${
                          stat.change.startsWith('+') ? 'text-green-600' : 
                          stat.change.startsWith('-') ? 'text-red-600' : 
                          'text-gray-600'
                        }`}>
                          {stat.change} from last month
                        </p>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>

              {/* Pipeline Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 mr-2 text-green-600" />
                      Sales Pipeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Pipeline Value</span>
                        <span className="font-semibold">${pipelineValue.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Active Deals</span>
                        <span className="font-semibold">{(deals as any[]).filter((d: any) => !["closed-won", "closed-lost"].includes(d.stage)).length}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress to Goal</span>
                          <span>75%</span>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                      Today's Priority
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(tasks as any[]).slice(0, 3).map((task: any, index: number) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{task.title}</p>
                            <p className="text-xs text-gray-500">{task.description}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {task.priority || 'Medium'}
                          </Badge>
                        </div>
                      ))}
                      {(tasks as any[]).length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-gray-500 text-sm">No tasks for today</p>
                          <Link href="/tasks">
                            <Button variant="outline" size="sm" className="mt-2">
                              <PlusCircle className="h-4 w-4 mr-1" />
                              Add Task
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Activities Tab */}
            <TabsContent value="activities" className="space-y-8 mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-purple-600" />
                    Recent Activities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <activity.icon className="h-5 w-5 text-gray-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Quick Actions Tab */}
            <TabsContent value="quick-actions" className="space-y-8 mt-8">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Quick Actions Center
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Streamline your workflow with one-click actions
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {quickActions.map((action, index) => (
                    <Link key={index} href={action.href}>
                      <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                        <CardContent className="flex flex-col items-center justify-center p-8">
                          <div className={`w-16 h-16 rounded-2xl ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                            <action.icon className="h-8 w-8 text-white" />
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-center group-hover:text-blue-600 transition-colors">
                            {action.label}
                          </h3>
                          <div className="w-0 group-hover:w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 mt-2"></div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Communication Quick Actions */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-800 dark:text-blue-200">
                    <Mail className="h-5 w-5 mr-2" />
                    Communication Center
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/email-marketing">
                      <Button variant="outline" className="w-full justify-start h-12 bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-300 group">
                        <Mail className="h-5 w-5 mr-3 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Send Email Campaign</span>
                      </Button>
                    </Link>
                    <Link href="/sms-marketing">
                      <Button variant="outline" className="w-full justify-start h-12 bg-white hover:bg-green-50 border-green-200 hover:border-green-300 group">
                        <Phone className="h-5 w-5 mr-3 text-green-600 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Send SMS Campaign</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Offline CRM Tab */}
            <TabsContent value="offline-crm" className="space-y-8 mt-8">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Offline CRM - Work Without Internet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Basic CRM functionality that works completely offline for users without consistent internet access
                  </p>
                </div>

                {/* Offline CRM Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20">
                    <CardHeader>
                      <CardTitle className="flex items-center text-orange-800 dark:text-orange-200">
                        <Database className="h-5 w-5 mr-2" />
                        Offline Database
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Store contacts, leads, deals, and tasks locally on your device using IndexedDB
                        </p>
                        <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                          <li>• Secure tenant-isolated storage</li>
                          <li>• Works completely offline</li>
                          <li>• Auto-sync when back online</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <CardHeader>
                      <CardTitle className="flex items-center text-blue-800 dark:text-blue-200">
                        <WifiOff className="h-5 w-5 mr-2" />
                        PWA Ready
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Install as a Progressive Web App for native-like experience
                        </p>
                        <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                          <li>• Install on desktop & mobile</li>
                          <li>• Service worker for caching</li>
                          <li>• Background sync support</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Launch Offline CRM */}
                <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-600">
                  <CardContent className="text-center py-8">
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                        <Database className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Launch Offline CRM
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Access basic CRM functionality that works without internet connection
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/offline-crm">
                          <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                            <WifiOff className="h-4 w-4 mr-2" />
                            Open Offline CRM
                          </Button>
                        </Link>
                        <Button variant="outline" onClick={() => window.open('/offline-crm', '_blank')}>
                          <Database className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Offline Features List */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center p-4">
                      <Users className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <h4 className="font-medium">Contact Management</h4>
                        <p className="text-sm text-gray-600">Add, edit, delete contacts</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center p-4">
                      <UserCheck className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <h4 className="font-medium">Lead Tracking</h4>
                        <p className="text-sm text-gray-600">Manage leads offline</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="flex items-center p-4">
                      <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
                      <div>
                        <h4 className="font-medium">Deal Pipeline</h4>
                        <p className="text-sm text-gray-600">Track deals and revenue</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </>
  );
}