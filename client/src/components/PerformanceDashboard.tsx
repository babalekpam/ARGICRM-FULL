import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { usePerformance } from '@/components/PerformanceProvider';
import { Activity, Zap, Clock, AlertTriangle } from 'lucide-react';

interface PerformanceMetrics {
  bundleSize: number;
  loadTime: number;
  renderTime: number;
  apiCalls: number;
  cacheHitRate: number;
  memoryUsage: number;
}

export function PerformanceDashboard() {
  const { monitor } = usePerformance();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    bundleSize: 0,
    loadTime: 0,
    renderTime: 0,
    apiCalls: 0,
    cacheHitRate: 0,
    memoryUsage: 0
  });

  useEffect(() => {
    const updateMetrics = () => {
      const componentMetrics = monitor.getMetrics();
      
      // Calculate performance metrics
      const totalRenderTime = Object.values(componentMetrics).reduce((sum, time) => sum + time, 0);
      const componentCount = Object.keys(componentMetrics).length;
      const avgRenderTime = componentCount > 0 ? totalRenderTime / componentCount : 0;
      
      // Get navigation timing if available
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const loadTime = navigation?.loadEventEnd - navigation?.fetchStart || 0;
        
        // Get memory usage if available
        const memory = (performance as any).memory;
        const memoryUsage = memory ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100 : 0;

        setMetrics({
          bundleSize: 0, // This would need to be calculated from resource entries
          loadTime: loadTime,
          renderTime: avgRenderTime,
          apiCalls: 0, // This would need to be tracked separately
          cacheHitRate: 85, // This would come from React Query metrics
          memoryUsage: memoryUsage
        });
      }
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, [monitor]);

  const getPerformanceStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return { status: 'good', color: 'green' };
    if (value <= thresholds.warning) return { status: 'warning', color: 'yellow' };
    return { status: 'poor', color: 'red' };
  };

  const loadTimeStatus = getPerformanceStatus(metrics.loadTime, { good: 2000, warning: 4000 });
  const renderTimeStatus = getPerformanceStatus(metrics.renderTime, { good: 16, warning: 100 });
  const memoryStatus = getPerformanceStatus(metrics.memoryUsage, { good: 50, warning: 80 });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Load Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.loadTime.toFixed(0)}ms
            </div>
            <Badge 
              variant={loadTimeStatus.status === 'good' ? 'default' : 'destructive'}
              className="mt-2"
            >
              {loadTimeStatus.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Render Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.renderTime.toFixed(1)}ms
            </div>
            <Badge 
              variant={renderTimeStatus.status === 'good' ? 'default' : 'destructive'}
              className="mt-2"
            >
              {renderTimeStatus.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.cacheHitRate}%</div>
            <Progress value={metrics.cacheHitRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.memoryUsage.toFixed(1)}%
            </div>
            <Badge 
              variant={memoryStatus.status === 'good' ? 'default' : 'destructive'}
              className="mt-2"
            >
              {memoryStatus.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Component Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(monitor.getMetrics()).map(([component, time]) => (
              <div key={component} className="flex items-center justify-between">
                <span className="text-sm">{component}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {time.toFixed(2)}ms
                  </span>
                  {time > 100 && (
                    <Badge variant="destructive" className="text-xs">
                      Slow
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Optimize Large Components</p>
                <p className="text-xs text-muted-foreground">
                  Break down components that take more than 100ms to render
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Use Lazy Loading</p>
                <p className="text-xs text-muted-foreground">
                  Implement lazy loading for routes and heavy components
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Optimize Queries</p>
                <p className="text-xs text-muted-foreground">
                  Use proper caching strategies and reduce unnecessary API calls
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}