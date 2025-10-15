import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  Target,
  BarChart3,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from "lucide-react";

interface WorkflowMetrics {
  id: number;
  name: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  lastExecution: string;
  status: 'active' | 'inactive' | 'error';
  efficiency: number;
  totalTimeSaved: number;
  costSavings: number;
}

interface PerformanceOverview {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  totalTimeSaved: number;
  costSavings: number;
  efficiencyScore: number;
}

interface ExecutionTrend {
  date: string;
  executions: number;
  successRate: number;
  averageTime: number;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export default function WorkflowPerformancePage() {
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedWorkflow, setSelectedWorkflow] = useState("all");

  // Fetch performance overview
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["/api/workflow-performance/overview", timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/workflow-performance/overview?range=${timeRange}`);
      if (!response.ok) throw new Error("Failed to fetch overview");
      return response.json() as Promise<PerformanceOverview>;
    },
  });

  // Fetch workflow metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/workflow-performance/metrics", timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/workflow-performance/metrics?range=${timeRange}`);
      if (!response.ok) throw new Error("Failed to fetch metrics");
      return response.json() as Promise<WorkflowMetrics[]>;
    },
  });

  // Fetch execution trends
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ["/api/workflow-performance/trends", timeRange, selectedWorkflow],
    queryFn: async () => {
      const response = await fetch(`/api/workflow-performance/trends?range=${timeRange}&workflow=${selectedWorkflow}`);
      if (!response.ok) throw new Error("Failed to fetch trends");
      return response.json() as Promise<ExecutionTrend[]>;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive': return <Badge variant="secondary">Inactive</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (overviewLoading || metricsLoading || trendsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Workflow Performance</h1>
            <p className="text-gray-600 dark:text-gray-400">Monitor and analyze workflow efficiency metrics</p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last Day</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.totalExecutions?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +12% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.successRate?.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +2.3% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(overview?.averageExecutionTime || 0)}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingDown className="h-3 w-3 inline mr-1" />
                -15% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(overview?.costSavings || 0)}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +18% from last period
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trends">Execution Trends</TabsTrigger>
            <TabsTrigger value="performance">Workflow Performance</TabsTrigger>
            <TabsTrigger value="efficiency">Efficiency Analysis</TabsTrigger>
            <TabsTrigger value="errors">Error Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Execution Trends</CardTitle>
                <CardDescription>Track workflow execution patterns over time</CardDescription>
                <div className="flex gap-2">
                  <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Workflows</SelectItem>
                      {metrics?.map(metric => (
                        <SelectItem key={metric.id} value={metric.id.toString()}>
                          {metric.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="executions" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.6} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Success Rate Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="successRate" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Average Execution Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="averageTime" 
                        stroke="#ffc658" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Performance Metrics</CardTitle>
                <CardDescription>Detailed performance analysis for each workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.map((metric) => (
                    <div key={metric.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{metric.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(metric.status)}
                            <span className="text-sm text-gray-500">
                              Last run: {new Date(metric.lastExecution).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {metric.efficiency}%
                          </div>
                          <div className="text-sm text-gray-500">Efficiency</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <div className="text-sm text-gray-500">Total Executions</div>
                          <div className="font-semibold">{metric.totalExecutions.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Success Rate</div>
                          <div className="font-semibold">{metric.successRate.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Avg Time</div>
                          <div className="font-semibold">{formatDuration(metric.averageExecutionTime)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Time Saved</div>
                          <div className="font-semibold">{formatDuration(metric.totalTimeSaved)}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Success Rate</span>
                          <span>{metric.successRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={metric.successRate} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="efficiency" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Efficiency Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={metrics?.map(m => ({ name: m.name, value: m.efficiency }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {metrics?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cost Savings by Workflow</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={metrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="costSavings" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Workflows</CardTitle>
                <CardDescription>Workflows ranked by efficiency and cost savings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics
                    ?.sort((a, b) => b.efficiency - a.efficiency)
                    ?.slice(0, 5)
                    ?.map((metric, index) => (
                      <div key={metric.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold">{metric.name}</div>
                            <div className="text-sm text-gray-500">
                              {metric.totalExecutions} executions
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">{metric.efficiency}%</div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(metric.costSavings)} saved
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Error Analysis</CardTitle>
                <CardDescription>Identify and analyze workflow failures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics
                    ?.filter(m => m.failedExecutions > 0)
                    ?.map((metric) => (
                      <div key={metric.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">{metric.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              <span className="text-sm text-red-600">
                                {metric.failedExecutions} failures
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-600">
                              {((metric.failedExecutions / metric.totalExecutions) * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500">Failure Rate</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm text-gray-500">Total Executions</div>
                            <div className="font-semibold">{metric.totalExecutions}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Failed</div>
                            <div className="font-semibold text-red-600">{metric.failedExecutions}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Successful</div>
                            <div className="font-semibold text-green-600">{metric.successfulExecutions}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}