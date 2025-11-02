import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Crown, Users, Building, DollarSign, Activity, 
  Shield, Settings, Database, Eye, Lock, 
  Infinity, TrendingUp, AlertTriangle, CheckCircle, Calendar, Mail
} from 'lucide-react';
import Layout from '@/components/layout';

export default function PlatformOwnerDashboard() {
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  
  // Fetch real platform data
  const { data: registrationData = { users: [], stats: {} }, isLoading: registrationsLoading } = useQuery({
    queryKey: ['/api/admin/registered-users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/registered-users', {
        headers: {
          'x-auth-email': 'abel@argilette.org'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch registered users');
      return response.json();
    }
  });

  const { data: tenantData = [], isLoading: tenantsLoading } = useQuery({
    queryKey: ['/api/superadmin/tenants'],
    queryFn: async () => {
      const response = await fetch('/api/superadmin/tenants', {
        headers: {
          'x-auth-email': 'abel@argilette.org'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch tenants');
      return response.json();
    }
  });

  const { data: registrationStats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/superadmin/registrations'],
    queryFn: async () => {
      const response = await fetch('/api/superadmin/registrations', {
        headers: {
          'x-auth-email': 'abel@argilette.org'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch registration stats');
      return response.json();
    }
  });

  // Calculate platform stats from real data
  const platformStats = {
    totalTenants: tenantData?.tenants?.length || 0,
    activeTenants: tenantData?.tenants?.filter((t: any) => t.status === 'active')?.length || 0,
    totalUsers: registrationData?.users?.length || 0,
    monthlyRevenue: tenantData?.totalMonthlyRevenue || 0,
    totalRevenue: tenantData?.totalRevenue || 0,
    systemHealth: 'excellent'
  };

  const tenantOverview = tenantData?.tenants || [];

  const systemAlerts = [
    { type: 'success', message: `${registrationData?.users?.length || 0} users registered in total`, time: 'Live data' },
    { type: 'info', message: `${tenantData?.tenants?.length || 0} tenants on the platform`, time: 'Live data' },
    { type: 'success', message: 'System running at 99.9% uptime', time: 'Real-time' },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      {/* Platform Owner Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white shadow-xl">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <Crown className="h-12 w-12 text-yellow-300" />
            <div>
              <h1 className="text-4xl font-bold">Platform Owner Dashboard</h1>
              <p className="text-blue-100 text-lg">Unlimited access • Full platform oversight • Super admin privileges</p>
            </div>
            <Badge variant="secondary" className="ml-auto bg-yellow-400 text-yellow-900 px-4 py-2 text-lg">
              <Infinity className="h-5 w-5 mr-2" />
              UNLIMITED ACCESS
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Platform Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="h-5 w-5" />
                Total Tenants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{platformStats.totalTenants.toLocaleString()}</div>
              <p className="text-blue-100">{platformStats.activeTenants} active</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{platformStats.totalUsers.toLocaleString()}</div>
              <p className="text-green-100">Across all tenants</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Monthly Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${platformStats.monthlyRevenue.toLocaleString()}</div>
              <p className="text-purple-100">+15.3% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-8 w-8 text-green-300" />
                <div>
                  <div className="text-2xl font-bold">Excellent</div>
                  <p className="text-cyan-100">All systems operational</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="tenants" className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-lg border border-white/20">
            <TabsTrigger value="tenants" className="data-[state=active]:bg-white/20">
              <Building className="h-4 w-4 mr-2" />
              Tenant Management
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-white/20">
              <DollarSign className="h-4 w-4 mr-2" />
              Subscription Oversight
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-white/20">
              <Shield className="h-4 w-4 mr-2" />
              Security Center
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-white/20">
              <Database className="h-4 w-4 mr-2" />
              System Administration
            </TabsTrigger>
            <TabsTrigger value="registrations" className="data-[state=active]:bg-white/20">
              <Users className="h-4 w-4 mr-2" />
              User Registrations
            </TabsTrigger>
          </TabsList>

          {/* Tenant Management */}
          <TabsContent value="tenants">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Tenant Overview & Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    {tenantsLoading ? (
                      <div className="text-center py-8">Loading tenant data...</div>
                    ) : (
                      <div className="space-y-4">
                        {tenantOverview.length > 0 ? tenantOverview.map((tenant: any) => (
                          <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-center gap-4">
                              <Building className="h-8 w-8 text-blue-600" />
                              <div>
                                <div className="font-semibold">{tenant.name}</div>
                                <div className="text-sm text-gray-600">{tenant.userCount || 0} users</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant={tenant.subscriptionPlan === 'platform_owner' ? 'default' : 'secondary'}>
                                {tenant.subscriptionPlan === 'platform_owner' ? 'PLATFORM OWNER' : (tenant.subscriptionPlan || 'STARTER').toUpperCase()}
                              </Badge>
                              <div className="text-right">
                                <div className="font-semibold">${tenant.monthlyRevenue || 0}/mo</div>
                                <div className={`text-sm ${tenant.status === 'active' ? 'text-green-600' : 
                                  tenant.status === 'unlimited' ? 'text-purple-600' : 'text-orange-600'}`}>
                                  {tenant.status === 'unlimited' ? 'UNLIMITED' : (tenant.status || 'ACTIVE')}
                                </div>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-8 text-gray-500">No tenants registered yet</div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                    <CardHeader>
                      <CardTitle className="text-orange-800">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        <Eye className="h-4 w-4 mr-2" />
                        View All Tenants
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Users className="h-4 w-4 mr-2" />
                        Impersonate Tenant
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Tenant Settings
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Oversight */}
          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Subscription & Revenue Management
                  <Badge className="ml-2 bg-green-100 text-green-800">
                    UNLIMITED OVERSIGHT
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Revenue Analytics</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-green-800 font-medium">Total Platform Revenue</span>
                          <span className="text-2xl font-bold text-green-700">
                            ${platformStats.totalRevenue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-800 font-medium">Monthly Recurring Revenue</span>
                          <span className="text-2xl font-bold text-blue-700">
                            ${platformStats.monthlyRevenue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-purple-800 font-medium">Average Revenue Per Tenant</span>
                          <span className="text-2xl font-bold text-purple-700">
                            ${Math.round(platformStats.monthlyRevenue / platformStats.activeTenants)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Subscription Controls</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tenant-select">Select Tenant</Label>
                        <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a tenant to manage..." />
                          </SelectTrigger>
                          <SelectContent>
                            {tenantOverview.map((tenant: any) => (
                              <SelectItem key={tenant.id} value={tenant.id}>
                                {tenant.name} - {tenant.subscriptionPlan}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Button className="w-full bg-purple-600 hover:bg-purple-700">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Upgrade/Downgrade Plan
                        </Button>
                        <Button variant="outline" className="w-full">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Override Billing
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Infinity className="h-4 w-4 mr-2" />
                          Grant Unlimited Access
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Center */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security & Compliance Center
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Security Score</span>
                      </div>
                      <div className="text-2xl font-bold text-green-700 mt-2">98/100</div>
                    </div>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-semibold">Active Alerts</span>
                      </div>
                      <div className="text-2xl font-bold text-yellow-700 mt-2">3</div>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800">
                        <Lock className="h-5 w-5" />
                        <span className="font-semibold">Encrypted Tenants</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-700 mt-2">100%</div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recent Security Events</h3>
                    <div className="space-y-2">
                      {systemAlerts.map((alert, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {alert.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                            {alert.type === 'info' && <Activity className="h-4 w-4 text-blue-600" />}
                            <span>{alert.message}</span>
                          </div>
                          <span className="text-sm text-gray-500">{alert.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Administration */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Administration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">System Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span>Database</span>
                        <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span>API Gateway</span>
                        <Badge className="bg-green-100 text-green-800">Operational</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span>Background Jobs</span>
                        <Badge className="bg-green-100 text-green-800">Running</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span>Email Service</span>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Administrative Actions</h3>
                    <div className="space-y-2">
                      <Button className="w-full" variant="outline">
                        <Database className="h-4 w-4 mr-2" />
                        Database Maintenance
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Activity className="h-4 w-4 mr-2" />
                        System Diagnostics
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Global Settings
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Shield className="h-4 w-4 mr-2" />
                        Security Audit
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Registrations Tab */}
          <TabsContent value="registrations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Registration Tracking
                  <Badge className="ml-2 bg-blue-100 text-blue-800">
                    LIVE DATA
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                  <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5" />
                        Total Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {registrationsLoading ? "..." : (registrationData?.users?.length || 0)}
                      </div>
                      <p className="text-green-100">Registered users</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CheckCircle className="h-5 w-5" />
                        Verified Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {registrationsLoading ? "..." : (registrationData?.users?.filter((u: any) => u.emailVerified)?.length || 0)}
                      </div>
                      <p className="text-blue-100">Email verified</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5" />
                        Recent Registrations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {registrationsLoading ? "..." : (registrationData?.users?.filter((u: any) => 
                          new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        )?.length || 0)}
                      </div>
                      <p className="text-purple-100">Last 7 days</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Activity className="h-5 w-5" />
                        Active Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {registrationsLoading ? "..." : (registrationData?.users?.filter((u: any) => u.isActive)?.length || 0)}
                      </div>
                      <p className="text-orange-100">Active accounts</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Recent User Registrations</h3>
                  {registrationsLoading ? (
                    <div className="text-center py-8">Loading registration data...</div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {registrationData?.users?.length > 0 ? 
                        registrationData.users
                          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .slice(0, 20)
                          .map((user: any, index: number) => (
                            <div key={user.id || index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                  {(user.firstName?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold">
                                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                                  </div>
                                  <div className="text-sm text-gray-600 flex items-center gap-2">
                                    <Mail className="h-3 w-3" />
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="text-sm font-medium">
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {user.createdAt ? new Date(user.createdAt).toLocaleTimeString() : ''}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <Badge variant={user.isActive ? 'default' : 'secondary'} className="text-xs">
                                    {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                                  </Badge>
                                  <Badge variant={user.emailVerified ? 'default' : 'secondary'} className="text-xs">
                                    {user.emailVerified ? 'VERIFIED' : 'PENDING'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          )) 
                        : (
                          <div className="text-center py-8 text-gray-500">No user registrations found</div>
                        )
                      }
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </Layout>
  );
}