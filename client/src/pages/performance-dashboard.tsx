import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Database, 
  Gauge, 
  MemoryStick, 
  Timer, 
  TrendingUp,
  Zap,
  Server,
  RefreshCw,
  BarChart3
} from "lucide-react";
import Layout from "@/components/layout";
import { apiRequest } from "@/lib/queryClient";

interface PerformanceMetrics {
  cacheStats: {
    totalEntries: number;
    hitRate: number;
    averageAccessCount: number;
    memoryUsage: number;
  };
  queryStats: {
    averageResponseTime: number;
    totalQueries: number;
    slowQueries: number;
    errorRate: number;
  };
  systemStats: {
    memoryUsage: number;
    activeConnections: number;
    uptime: number;
  };
}

export default function PerformanceDashboard() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [tenantId, setTenantId] = useState("default-tenant");

  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ["/api/performance/metrics"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/performance/metrics");
      if (!response.ok) throw new Error("Failed to fetch performance metrics");
      const data = await response.json();
      console.log("Performance API response:", data);
      return data.metrics as PerformanceMetrics;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const optimizeMemory = async () => {
    setIsOptimizing(true);
    try {
      await apiRequest("POST", "/api/performance/optimize-memory", {});
      await refetch();
    } catch (error) {
      console.error("Memory optimization failed:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const preloadData = async () => {
    try {
      console.log("Starting data preload for tenant:", tenantId);
      const response = await apiRequest("POST", `/api/performance/preload/${tenantId}`, {});
      console.log("Preload response:", response);
      if (response.ok) {
        const result = await response.json();
        console.log("Preload successful:", result);
        // Refresh metrics after preloading
        await refetch();
      }
    } catch (error) {
      console.error("Data preloading failed:", error);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getPerformanceScore = (): number => {
    if (!metrics) return 0;
    
    let score = 100;
    
    // Deduct points for poor performance
    if (metrics.queryStats.averageResponseTime > 1000) score -= 20;
    if (metrics.cacheStats.hitRate < 50) score -= 15;
    if (metrics.systemStats.memoryUsage > 512) score -= 15;
    if (metrics.queryStats.slowQueries > 5) score -= 10;
    
    return Math.max(0, score);
  };

  const performanceScore = getPerformanceScore();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Performance Dashboard
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Real-time performance optimization and monitoring with intelligent analytics
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                Live Monitoring
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                Real-time Analytics
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                Performance Optimization
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button onClick={preloadData} variant="outline" className="bg-white shadow-md border-slate-200">
              <Zap className="h-4 w-4 mr-2" />
              Preload Data
            </Button>
            <Button onClick={optimizeMemory} disabled={isOptimizing} variant="outline" className="bg-white shadow-md border-slate-200">
              {isOptimizing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MemoryStick className="h-4 w-4 mr-2" />
              )}
              Optimize Memory
            </Button>
            <Button onClick={() => refetch()} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceScore}%</div>
              <div className="flex items-center space-x-2 mt-2">
                <Progress value={performanceScore} className="flex-1" />
                <Badge variant={performanceScore > 80 ? "default" : performanceScore > 60 ? "secondary" : "destructive"}>
                  {performanceScore > 80 ? "Excellent" : performanceScore > 60 ? "Good" : "Needs Attention"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.cacheStats.hitRate ? metrics.cacheStats.hitRate.toFixed(1) : '0'}%</div>
              <Progress value={metrics?.cacheStats.hitRate || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.queryStats.averageResponseTime ? metrics.queryStats.averageResponseTime.toFixed(0) : '0'}ms
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics?.queryStats.slowQueries || 0} slow queries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              <MemoryStick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.systemStats.memoryUsage ? metrics.systemStats.memoryUsage.toFixed(0) : '0'}MB
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cache: {metrics?.cacheStats.memoryUsage ? metrics.cacheStats.memoryUsage.toFixed(1) : '0'}MB
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <Tabs defaultValue="cache" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cache">Cache Performance</TabsTrigger>
            <TabsTrigger value="queries">Query Analytics</TabsTrigger>
            <TabsTrigger value="system">System Resources</TabsTrigger>
            <TabsTrigger value="optimization">Optimization Tips</TabsTrigger>
          </TabsList>

          <TabsContent value="cache" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Cache Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Entries</span>
                    <span className="font-medium">{metrics?.cacheStats.totalEntries || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hit Rate</span>
                    <span className="font-medium">{metrics?.cacheStats.hitRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Access Count</span>
                    <span className="font-medium">{metrics?.cacheStats.averageAccessCount.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory Usage</span>
                    <span className="font-medium">{metrics?.cacheStats.memoryUsage.toFixed(1)}MB</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Cache Efficiency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Hit Rate Efficiency</span>
                        <span>{metrics?.cacheStats.hitRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics?.cacheStats.hitRate || 0} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Memory Efficiency</span>
                        <span>{((metrics?.cacheStats.totalEntries || 0) / Math.max(1, metrics?.cacheStats.memoryUsage || 1) * 10).toFixed(1)}%</span>
                      </div>
                      <Progress value={((metrics?.cacheStats.totalEntries || 0) / Math.max(1, metrics?.cacheStats.memoryUsage || 1) * 10)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="queries" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Query Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Queries</span>
                    <span className="font-medium">{metrics?.queryStats.totalQueries || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Response Time</span>
                    <span className="font-medium">{metrics?.queryStats.averageResponseTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Slow Queries</span>
                    <span className="font-medium text-red-600">{metrics?.queryStats.slowQueries || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Error Rate</span>
                    <span className="font-medium">{metrics?.queryStats.errorRate.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Query Speed</span>
                      <Badge variant={metrics && metrics.queryStats.averageResponseTime < 500 ? "default" : "secondary"}>
                        {metrics && metrics.queryStats.averageResponseTime < 500 ? "Fast" : "Moderate"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Error Rate</span>
                      <Badge variant={metrics && metrics.queryStats.errorRate < 1 ? "default" : "destructive"}>
                        {metrics && metrics.queryStats.errorRate < 1 ? "Low" : "High"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Server className="h-5 w-5 mr-2" />
                    System Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Memory Usage</span>
                    <span className="font-medium">{metrics?.systemStats.memoryUsage.toFixed(0)}MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Connections</span>
                    <span className="font-medium">{metrics?.systemStats.activeConnections || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime</span>
                    <span className="font-medium">{formatUptime(metrics?.systemStats.uptime || 0)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resource Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Memory</span>
                        <span>{((metrics?.systemStats.memoryUsage || 0) / 1024 * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={(metrics?.systemStats.memoryUsage || 0) / 1024 * 100} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Performance Optimization Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics && metrics.cacheStats.hitRate < 50 && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Low Cache Hit Rate</h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Consider increasing cache TTL or optimizing cache keys for better hit rates.
                      </p>
                    </div>
                  )}
                  
                  {metrics && metrics.queryStats.averageResponseTime > 1000 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <h4 className="font-medium text-red-800 dark:text-red-200">Slow Query Performance</h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Review database indexes and consider query optimization techniques.
                      </p>
                    </div>
                  )}
                  
                  {metrics && metrics.systemStats.memoryUsage > 512 && (
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <h4 className="font-medium text-orange-800 dark:text-orange-200">High Memory Usage</h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                        Consider running memory optimization or reducing cache size.
                      </p>
                    </div>
                  )}
                  
                  {performanceScore > 80 && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-medium text-green-800 dark:text-green-200">Excellent Performance</h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Your system is performing optimally. Continue monitoring for sustained performance.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}