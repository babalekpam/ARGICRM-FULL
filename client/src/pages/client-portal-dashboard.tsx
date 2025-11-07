import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Folder, Receipt, TrendingUp } from 'lucide-react';
import { useClientPortal } from '@/contexts/client-portal-context';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function ClientPortalDashboard() {
  const { clientUser, clientAccount } = useClientPortal();

  const { data: projects, isLoading: projectsLoading } = useQuery<any[]>({
    queryKey: ['/api/client-portal/projects'],
  });

  const { data: deliverables, isLoading: deliverablesLoading } = useQuery<any[]>({
    queryKey: ['/api/client-portal/deliverables'],
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery<any[]>({
    queryKey: ['/api/client-portal/invoices'],
  });

  const activeProjects = projects?.filter((p: any) => p.status === 'active').length || 0;
  const pendingDeliverables = deliverables?.filter((d: any) => d.status === 'available').length || 0;
  const outstandingInvoices = invoices?.filter((i: any) => i.status === 'pending' || i.status === 'overdue').length || 0;
  const totalRevenue = invoices?.reduce((sum: number, inv: any) => sum + (parseFloat(inv.total) || 0), 0) || 0;

  const stats = [
    {
      title: 'Active Projects',
      value: activeProjects,
      icon: Folder,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/client-portal/projects',
      testId: 'stat-active-projects',
    },
    {
      title: 'Pending Deliverables',
      value: pendingDeliverables,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/client-portal/deliverables',
      testId: 'stat-pending-deliverables',
    },
    {
      title: 'Outstanding Invoices',
      value: outstandingInvoices,
      icon: Receipt,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/client-portal/invoices',
      testId: 'stat-outstanding-invoices',
    },
    {
      title: 'Total Value',
      value: `$${totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      testId: 'stat-total-value',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-welcome">
          Welcome back, {clientUser?.firstName || clientUser?.email}
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your account with {clientAccount?.accountName}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isLoading = projectsLoading || deliverablesLoading || invoicesLoading;

          return (
            <Card key={stat.title} className="hover-elevate" data-testid={stat.testId}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold" data-testid={`value-${stat.testId}`}>
                    {stat.value}
                  </div>
                )}
                {stat.href && (
                  <Link href={stat.href}>
                    <Button variant="link" className="mt-2 h-auto p-0" data-testid={`link-${stat.testId}`}>
                      View all →
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates on your projects and deliverables</CardDescription>
        </CardHeader>
        <CardContent>
          {(projectsLoading || deliverablesLoading) ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {projects?.slice(0, 3).map((project: any) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                  data-testid={`activity-project-${project.id}`}
                >
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </div>
                  <Badge data-testid={`badge-status-${project.id}`}>
                    {project.status}
                  </Badge>
                </div>
              ))}

              {(!projects || projects.length === 0) && (
                <p className="text-center text-muted-foreground" data-testid="text-no-activity">
                  No recent activity
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
