import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Package, 
  Server, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Zap,
  RefreshCw,
  Bell,
  Eye
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface HealthDashboardData {
  overallHealth: {
    score: number;
    status: 'healthy' | 'warning' | 'critical';
    lastUpdated: string;
  };
  metrics: {
    sales: {
      totalRevenue: number;
      orderCount: number;
      averageOrderValue: number;
      conversionRate: number;
      trend: 'up' | 'down' | 'stable';
    };
    performance: {
      uptime: number;
      averageLoadTime: number;
      errorRate: number;
      responseTime: number;
      trend: 'up' | 'down' | 'stable';
    };
    inventory: {
      totalProducts: number;
      lowStockProducts: number;
      outOfStockProducts: number;
      stockTurnover: number;
      trend: 'up' | 'down' | 'stable';
    };
    customers: {
      totalCustomers: number;
      newCustomers: number;
      returningCustomers: number;
      customerSatisfaction: number;
      trend: 'up' | 'down' | 'stable';
    };
  };
  alerts: Array<{
    id: string;
    alertType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    status: string;
    createdAt: string;
    metadata?: {
      threshold?: number;
      actualValue?: number;
      impact?: string;
      recommendation?: string;
    };
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  systemComponents: Array<{
    name: string;
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    lastChecked: string;
  }>;
}

export default function EcommerceHealthDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  // Fetch health dashboard data
  const { data: healthData, isLoading, refetch } = useQuery({
    queryKey: ['/api/ecommerce/health/dashboard', selectedTimeRange],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/ecommerce/health/dashboard?timeRange=${selectedTimeRange}`);
      return response.json();
    },
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds if auto-refresh is enabled
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await apiRequest('POST', `/api/ecommerce/health/alerts/${alertId}/acknowledge`);
      toast({
        title: "Alert Acknowledged",
        description: "The alert has been acknowledged successfully.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to acknowledge alert. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No health data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">E-commerce Health Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of your e-commerce platform performance and health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh: {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Overall Health Score */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Overall Platform Health
          </CardTitle>
          <CardDescription>
            Comprehensive health score based on all system metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-primary">
                {healthData.overallHealth.score}%
              </div>
              <Badge variant={getStatusBadgeVariant(healthData.overallHealth.status)}>
                {healthData.overallHealth.status.toUpperCase()}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Last Updated</div>
              <div className="text-sm font-medium">
                {new Date(healthData.overallHealth.lastUpdated).toLocaleString()}
              </div>
            </div>
          </div>
          <Progress value={healthData.overallHealth.score} className="mt-4" />
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Performance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${healthData.metrics.sales.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon(healthData.metrics.sales.trend)}
              <span>{healthData.metrics.sales.orderCount} orders</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Performance</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthData.metrics.performance.uptime}%
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon(healthData.metrics.performance.trend)}
              <span>{healthData.metrics.performance.averageLoadTime}s avg load</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Status</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthData.metrics.inventory.totalProducts}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon(healthData.metrics.inventory.trend)}
              <span>{healthData.metrics.inventory.lowStockProducts} low stock</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Activity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthData.metrics.customers.totalCustomers}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon(healthData.metrics.customers.trend)}
              <span>{healthData.metrics.customers.newCustomers} new today</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and System Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts
            </CardTitle>
            <CardDescription>
              {healthData.alerts.length} active alert(s) requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthData.alerts.length === 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">No active alerts</span>
                </div>
              ) : (
                healthData.alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start justify-between border-l-4 border-l-yellow-400 pl-4 py-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{alert.title}</span>
                        <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Components
            </CardTitle>
            <CardDescription>
              Real-time status of all system components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthData.systemComponents.map((component) => (
                <div key={component.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(component.status)}`} />
                    <span className="font-medium">{component.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{component.uptime}% uptime</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(component.lastChecked).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest system events and activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {healthData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 border-l-2 border-l-blue-200 pl-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getSeverityColor(activity.severity)}>
                      {activity.type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{activity.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}