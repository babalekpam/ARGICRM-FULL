import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TestTube, 
  Rocket, 
  Shield, 
  Gauge, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Play,
  Database,
  Server,
  Globe,
  Lock,
  Monitor,
  Zap
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TestResult {
  id: string;
  name: string;
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security';
  status: 'passed' | 'failed' | 'running' | 'pending';
  duration: number;
  coverage?: number;
  error?: string;
  timestamp: Date;
}

interface DeploymentCheck {
  id: string;
  name: string;
  category: 'database' | 'api' | 'frontend' | 'security' | 'performance';
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

interface TestingMetrics {
  testResults: TestResult[];
  deploymentChecks: DeploymentCheck[];
  overallStatus: 'ready' | 'needs_attention' | 'not_ready';
  coverageStats: {
    overall: number;
    unit: number;
    integration: number;
    e2e: number;
  };
  performanceMetrics: {
    loadTime: number;
    throughput: number;
    errorRate: number;
    uptime: number;
  };
}

export default function TestingDeploymentDashboard() {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isValidatingDeployment, setIsValidatingDeployment] = useState(false);

  const { data: testingData, isLoading, refetch } = useQuery({
    queryKey: ["/api/testing/metrics"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/testing/metrics");
      if (!response.ok) throw new Error("Failed to fetch testing metrics");
      const data = await response.json();
      return data.metrics as TestingMetrics;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const runTestSuite = async (type: string) => {
    setIsRunningTests(true);
    setActiveTest(type);
    try {
      await apiRequest("POST", "/api/testing/run-tests", { type });
      await refetch();
    } catch (error) {
      console.error("Test suite failed:", error);
    } finally {
      setIsRunningTests(false);
      setActiveTest(null);
    }
  };

  const validateDeployment = async () => {
    setIsValidatingDeployment(true);
    try {
      await apiRequest("POST", "/api/testing/validate-deployment", {});
      await refetch();
    } catch (error) {
      console.error("Deployment validation failed:", error);
    } finally {
      setIsValidatingDeployment(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
      case 'pass':
      case 'ready':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">✓ Passed</Badge>;
      case 'failed':
      case 'fail':
      case 'not_ready':
        return <Badge variant="destructive">✗ Failed</Badge>;
      case 'warning':
      case 'needs_attention':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">⚠ Warning</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">⟳ Running</Badge>;
      case 'pending':
        return <Badge variant="outline">⏸ Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOverallReadiness = () => {
    if (!testingData) return 0;
    
    const passedTests = testingData.testResults.filter(t => t.status === 'passed').length;
    const totalTests = testingData.testResults.length;
    const passedChecks = testingData.deploymentChecks.filter(c => c.status === 'pass').length;
    const totalChecks = testingData.deploymentChecks.length;
    
    const testScore = totalTests > 0 ? (passedTests / totalTests) * 50 : 0;
    const checkScore = totalChecks > 0 ? (passedChecks / totalChecks) * 50 : 0;
    
    return Math.round(testScore + checkScore);
  };

  const readinessScore = getOverallReadiness();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Testing & Deployment Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Section 6: Comprehensive testing and deployment readiness validation
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={validateDeployment} disabled={isValidatingDeployment}>
              {isValidatingDeployment ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Validate Deployment
            </Button>
            <Button onClick={() => runTestSuite('all')} disabled={isRunningTests}>
              {isRunningTests ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run All Tests
            </Button>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deployment Readiness</CardTitle>
              <Rocket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{readinessScore}%</div>
              <div className="flex items-center space-x-2 mt-2">
                <Progress value={readinessScore} className="flex-1" />
                {getStatusBadge(testingData?.overallStatus || 'pending')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Test Coverage</CardTitle>
              <TestTube className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{testingData?.coverageStats?.overall || 0}%</div>
              <Progress value={testingData?.coverageStats?.overall || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{testingData?.performanceMetrics?.loadTime || 0}ms</div>
              <p className="text-xs text-muted-foreground mt-1">
                {testingData?.performanceMetrics?.throughput || 0} req/s
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{testingData?.performanceMetrics?.uptime?.toFixed(1) || 0}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Error Rate: {testingData?.performanceMetrics?.errorRate || 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Testing and Deployment */}
        <Tabs defaultValue="tests" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tests">Test Results</TabsTrigger>
            <TabsTrigger value="deployment">Deployment Checks</TabsTrigger>
            <TabsTrigger value="performance">Performance Testing</TabsTrigger>
            <TabsTrigger value="security">Security Validation</TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TestTube className="h-5 w-5 mr-2" />
                    Automated Test Suite
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Unit Tests</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{testingData?.coverageStats?.unit || 0}%</span>
                        <Button size="sm" onClick={() => runTestSuite('unit')} disabled={isRunningTests}>
                          {activeTest === 'unit' ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Integration Tests</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{testingData?.coverageStats?.integration || 0}%</span>
                        <Button size="sm" onClick={() => runTestSuite('integration')} disabled={isRunningTests}>
                          {activeTest === 'integration' ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>End-to-End Tests</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{testingData?.coverageStats?.e2e || 0}%</span>
                        <Button size="sm" onClick={() => runTestSuite('e2e')} disabled={isRunningTests}>
                          {activeTest === 'e2e' ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Recent Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {testingData?.testResults?.slice(0, 5).map((test) => (
                      <div key={test.id} className="flex justify-between items-center p-2 rounded border">
                        <div>
                          <div className="font-medium text-sm">{test.name}</div>
                          <div className="text-xs text-muted-foreground">{test.type} • {test.duration}ms</div>
                        </div>
                        {getStatusBadge(test.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="deployment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Rocket className="h-5 w-5 mr-2" />
                  Deployment Readiness Checks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {testingData?.deploymentChecks?.map((check) => (
                    <div key={check.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium flex items-center">
                            {check.category === 'database' && <Database className="h-4 w-4 mr-1" />}
                            {check.category === 'api' && <Server className="h-4 w-4 mr-1" />}
                            {check.category === 'frontend' && <Globe className="h-4 w-4 mr-1" />}
                            {check.category === 'security' && <Lock className="h-4 w-4 mr-1" />}
                            {check.category === 'performance' && <Zap className="h-4 w-4 mr-1" />}
                            {check.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">{check.message}</p>
                        </div>
                        {getStatusBadge(check.status)}
                      </div>
                      {check.details && (
                        <div className="text-xs text-muted-foreground mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          {check.details}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gauge className="h-5 w-5 mr-2" />
                  Performance Benchmarks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{testingData?.performanceMetrics?.loadTime || 0}ms</div>
                    <div className="text-sm text-muted-foreground">Average Load Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{testingData?.performanceMetrics?.throughput || 0}</div>
                    <div className="text-sm text-muted-foreground">Requests/Second</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{testingData?.performanceMetrics?.uptime?.toFixed(1) || 0}%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{testingData?.performanceMetrics?.errorRate || 0}%</div>
                    <div className="text-sm text-muted-foreground">Error Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Validation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Vulnerability Scan</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Critical</span>
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">0</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">High</span>
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">1</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Medium</span>
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">3</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Low</span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">7</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Security Compliance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">HTTPS/TLS</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Authentication</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Authorization</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Data Encryption</span>
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}