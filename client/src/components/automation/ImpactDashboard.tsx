import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Users, 
  Target, 
  Zap, 
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RefreshCw
} from 'lucide-react';

interface ImpactDashboardProps {
  automationRules: any[];
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

export function ImpactDashboard({ automationRules }: ImpactDashboardProps) {
  const [realTimeData, setRealTimeData] = useState({
    activeRules: 0,
    totalExecutions: 0,
    successRate: 0,
    avgResponseTime: 0,
    totalSavings: 0,
    errorsToday: 0
  });

  const [liveMetrics, setLiveMetrics] = useState<any[]>([]);
  const [isLive, setIsLive] = useState(true);

  // Fetch real-time automation metrics
  const { data: impactData, refetch } = useQuery({
    queryKey: ['/api/automation/impact'],
    refetchInterval: isLive ? 5000 : false, // Refresh every 5 seconds when live
    retry: false
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (isLive) {
        const now = new Date();
        const newMetric = {
          timestamp: now.toLocaleTimeString(),
          executions: Math.floor(Math.random() * 20) + 5,
          success: Math.floor(Math.random() * 18) + 15,
          errors: Math.floor(Math.random() * 3),
          savings: Math.floor(Math.random() * 500) + 100,
          responseTime: Math.floor(Math.random() * 200) + 50
        };

        setLiveMetrics(prev => {
          const updated = [...prev, newMetric];
          return updated.slice(-20); // Keep last 20 data points
        });

        // Update real-time summary data
        setRealTimeData(prev => ({
          activeRules: automationRules?.length || 0,
          totalExecutions: prev.totalExecutions + newMetric.executions,
          successRate: Math.min(98, Math.max(85, prev.successRate + (Math.random() - 0.5) * 2)),
          avgResponseTime: newMetric.responseTime,
          totalSavings: prev.totalSavings + newMetric.savings,
          errorsToday: prev.errorsToday + newMetric.errors
        }));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive, automationRules]);

  const statusData = [
    { name: 'Active', value: realTimeData.activeRules, color: '#10b981' },
    { name: 'Paused', value: 2, color: '#f59e0b' },
    { name: 'Error', value: 1, color: '#ef4444' }
  ];

  const categoryPerformance = [
    { category: 'Inventory', executions: 145, success: 98, savings: 1200 },
    { category: 'Pricing', executions: 89, success: 95, savings: 2100 },
    { category: 'Marketing', executions: 234, success: 92, savings: 800 },
    { category: 'Customer Service', executions: 67, success: 99, savings: 600 },
    { category: 'Analytics', executions: 156, success: 96, savings: 400 }
  ];

  const recentActivities = [
    {
      id: 1,
      rule: 'Low Stock Alert - Electronics',
      action: 'Notification sent to purchasing team',
      timestamp: '2 minutes ago',
      status: 'success',
      impact: '$1,200 potential stockout prevented'
    },
    {
      id: 2,
      rule: 'Price Match - Competitor Analysis',
      action: 'Updated 15 product prices',
      timestamp: '5 minutes ago',
      status: 'success',
      impact: '3.2% margin improvement'
    },
    {
      id: 3,
      rule: 'Customer Feedback - Negative Review',
      action: 'Support ticket created automatically',
      timestamp: '8 minutes ago',
      status: 'success',
      impact: 'Customer retention improved'
    },
    {
      id: 4,
      rule: 'Marketing Campaign - High Engagement',
      action: 'Budget increased by 20%',
      timestamp: '12 minutes ago',
      status: 'success',
      impact: '$500 additional revenue projected'
    },
    {
      id: 5,
      rule: 'Order Processing - Express Shipping',
      action: 'Failed to update shipping method',
      timestamp: '15 minutes ago',
      status: 'error',
      impact: 'Manual intervention required'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-time Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Real-time Impact Dashboard</h2>
          <p className="text-muted-foreground">Live automation performance and impact tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isLive ? "default" : "outline"}
            size="sm"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isLive ? 'Live' : 'Paused'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold">{realTimeData.activeRules}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Executions</p>
                <p className="text-2xl font-bold">{realTimeData.totalExecutions.toLocaleString()}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{realTimeData.successRate.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{realTimeData.avgResponseTime}ms</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Savings</p>
                <p className="text-2xl font-bold">${realTimeData.totalSavings.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Errors Today</p>
                <p className="text-2xl font-bold">{realTimeData.errorsToday}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Execution Timeline
            </CardTitle>
            <CardDescription>Real-time automation executions and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={liveMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="executions" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Executions" />
                <Area type="monotone" dataKey="success" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Successful" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rule Status Distribution</CardTitle>
            <CardDescription>Current status of all automation rules</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Category</CardTitle>
          <CardDescription>Execution statistics and impact by automation category</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={categoryPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="executions" fill="#3b82f6" name="Executions" />
              <Bar yAxisId="left" dataKey="success" fill="#10b981" name="Success Rate %" />
              <Bar yAxisId="right" dataKey="savings" fill="#f59e0b" name="Savings ($)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Automation Activities
          </CardTitle>
          <CardDescription>Live feed of automation executions and their impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(activity.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">{activity.rule}</h4>
                    <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{activity.action}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={activity.status === 'success' ? 'default' : activity.status === 'error' ? 'destructive' : 'secondary'}>
                      {activity.status}
                    </Badge>
                    <span className="text-xs text-green-600 font-medium">{activity.impact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Impact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Cost Savings</span>
              <span className="font-semibold text-green-600">${realTimeData.totalSavings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Time Saved</span>
              <span className="font-semibold">24.5 hours</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Tasks Automated</span>
              <span className="font-semibold">{realTimeData.totalExecutions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Error Rate</span>
              <span className="font-semibold text-red-600">{((100 - realTimeData.successRate)).toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">CPU Usage</span>
                <span className="text-sm font-medium">34%</span>
              </div>
              <Progress value={34} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Memory Usage</span>
                <span className="text-sm font-medium">67%</span>
              </div>
              <Progress value={67} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Queue Health</span>
                <span className="text-sm font-medium">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">API Response</span>
                <span className="text-sm font-medium">98%</span>
              </div>
              <Progress value={98} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Optimization Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">High Performer</p>
                <p className="text-xs text-muted-foreground">Customer Service automation at 99% success</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Optimization Opportunity</p>
                <p className="text-xs text-muted-foreground">Add 2 more inventory rules for $3K savings</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Attention Needed</p>
                <p className="text-xs text-muted-foreground">Marketing automation response time increasing</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-purple-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Quick Win</p>
                <p className="text-xs text-muted-foreground">Enable price alerts for 15% revenue boost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}