import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, FolderKanban, Hash, Link as LinkIcon, Activity, TrendingUp } from "lucide-react";
import { format } from "date-fns";

type PlatformStats = {
  totalUsers: number;
  totalTenants: number;
  totalProjects: number;
  totalKeywords: number;
  totalBacklinks: number;
  activeTenants: number;
  tenantsByPlan: { plan: string; count: number }[];
};

type User = {
  id: string;
  email: string;
  fullName: string | null;
  profilePictureUrl: string | null;
  tenantId: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

type Tenant = {
  id: string;
  name: string;
  plan: string | null;
  subscriptionStatus: string | null;
  lifetimePayment: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: tenants, isLoading: tenantsLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/admin/tenants"],
  });

  // Get recent users (last 10)
  const recentUsers = users
    ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10) || [];

  // Get recent tenants (last 10)
  const recentTenants = tenants
    ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10) || [];

  if (statsLoading || usersLoading || tenantsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform-wide analytics and management</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-admin-title">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform-wide analytics and management</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-users">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-tenants">{stats?.totalTenants || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-tenants">{stats?.activeTenants || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-projects">{stats?.totalProjects || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keywords</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-keywords">{stats?.totalKeywords || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backlinks</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-backlinks">{stats?.totalBacklinks || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants by Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Tenants by Plan</CardTitle>
          <CardDescription>Distribution of subscription plans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {stats?.tenantsByPlan.map(({ plan, count }) => (
              <div key={plan} className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm" data-testid={`badge-plan-${plan}`}>
                  {plan}
                </Badge>
                <span className="text-sm text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>Last 10 registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0" data-testid={`row-user-${user.id}`}>
                <div className="flex-1">
                  <div className="font-medium" data-testid={`text-user-email-${user.id}`}>{user.email}</div>
                  {user.fullName && (
                    <div className="text-sm text-muted-foreground">{user.fullName}</div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Joined {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.isAdmin && (
                    <Badge variant="default" data-testid={`badge-admin-${user.id}`}>Admin</Badge>
                  )}
                  <Badge variant="outline" className="text-xs" data-testid={`badge-tenant-${user.id}`}>
                    {user.tenantId.slice(0, 8)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Tenants */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tenants</CardTitle>
          <CardDescription>Last 10 created tenants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTenants.map((tenant) => (
              <div key={tenant.id} className="flex items-center justify-between gap-4 border-b pb-3 last:border-0 last:pb-0" data-testid={`row-tenant-${tenant.id}`}>
                <div className="flex-1">
                  <div className="font-medium" data-testid={`text-tenant-name-${tenant.id}`}>{tenant.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Created {format(new Date(tenant.createdAt), "MMM d, yyyy")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {tenant.lifetimePayment && (
                    <Badge variant="default" data-testid={`badge-lifetime-${tenant.id}`}>
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Lifetime
                    </Badge>
                  )}
                  <Badge 
                    variant={tenant.subscriptionStatus === 'active' ? 'default' : 'outline'}
                    data-testid={`badge-status-${tenant.id}`}
                  >
                    {tenant.subscriptionStatus || 'inactive'}
                  </Badge>
                  <Badge variant="outline" className="text-xs" data-testid={`badge-plan-${tenant.id}`}>
                    {tenant.plan || 'free'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
