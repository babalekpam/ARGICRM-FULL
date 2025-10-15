import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertTriangle, Play, RefreshCw, Shield, Database, Navigation, Lock } from 'lucide-react';
import Layout from '@/components/layout';

interface ValidationResult {
  testName: string;
  category: 'E2E' | 'NAVIGATION' | 'SUBSCRIPTION' | 'ISOLATION';
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
  timestamp: string;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
}

export default function IntegrityDashboard() {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    complete?: any;
    e2e?: any;
    navigation?: any;
    subscription?: any;
    isolation?: any;
  }>({});
  const [loading, setLoading] = useState<{
    complete?: boolean;
    e2e?: boolean;
    navigation?: boolean;
    subscription?: boolean;
    isolation?: boolean;
  }>({});

  // Direct API call function
  const callAPI = async (endpoint: string) => {
    try {
      const response = await fetch(endpoint, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error);
      return null;
    }
  };

  const runTest = async (testType: string) => {
    setActiveTest(testType);
    setLoading(prev => ({ ...prev, [testType]: true }));
    
    try {
      console.log(`Starting ${testType} test...`);
      
      let endpoint = '';
      switch (testType) {
        case 'complete':
          endpoint = '/api/integrity/validate-all';
          break;
        case 'e2e':
          endpoint = '/api/integrity/e2e-tests';
          break;
        case 'navigation':
          endpoint = '/api/integrity/navigation-tests';
          break;
        case 'subscription':
          endpoint = '/api/integrity/subscription-gates';
          break;
        case 'isolation':
          endpoint = '/api/integrity/tenant-isolation';
          break;
      }
      
      const result = await callAPI(endpoint);
      console.log(`${testType} test finished, result:`, result);
      
      if (result) {
        setTestResults(prev => ({ ...prev, [testType]: result }));
      }
      
    } catch (error) {
      console.error(`Error running ${testType} test:`, error);
    } finally {
      setActiveTest(null);
      setLoading(prev => ({ ...prev, [testType]: false }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAIL':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'PASS' ? 'default' : status === 'FAIL' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const calculateSummaryFromData = (data: any) => {
    if (!data) return { total: 0, passed: 0, failed: 0, warnings: 0 };
    
    // Handle different API response structures
    if (data.gates) {
      // Subscription gates data
      const tests = data.gates;
      const total = tests.length;
      const passed = tests.filter((t: any) => t.status === 'PASS').length;
      const failed = tests.filter((t: any) => t.status === 'FAIL').length;
      const warnings = tests.filter((t: any) => t.status === 'WARNING').length;
      return { total, passed, failed, warnings };
    }
    
    if (data.isolation) {
      // Tenant isolation data
      const tests = data.isolation;
      const total = tests.length;
      const passed = tests.filter((t: any) => t.status === 'PASS').length;
      const failed = tests.filter((t: any) => t.status === 'FAIL').length;
      const warnings = tests.filter((t: any) => t.status === 'WARNING').length;
      return { total, passed, failed, warnings };
    }
    
    if (data.summary) {
      // Already has summary (e.g., navigation tests)
      return {
        total: data.summary.pathsTested || data.summary.total || 0,
        passed: data.summary.successful || data.summary.passed || 0,
        failed: data.summary.failed || 0,
        warnings: data.summary.warnings || 0
      };
    }
    
    if (data.tests) {
      // E2E tests data
      const tests = data.tests;
      const total = tests.length;
      const passed = tests.filter((t: any) => t.status === 'PASS').length;
      const failed = tests.filter((t: any) => t.status === 'FAIL').length;
      const warnings = tests.filter((t: any) => t.status === 'WARNING').length;
      return { total, passed, failed, warnings };
    }
    
    return { total: 0, passed: 0, failed: 0, warnings: 0 };
  };

  const calculateProgress = (summary: any) => {
    if (!summary) return 0;
    const total = summary.pathsTested || summary.total || 0;
    const passed = summary.successful || summary.passed || 0;
    if (total === 0) return 0;
    return (passed / total) * 100;
  };

  const TestCard = ({ 
    title, 
    description, 
    icon: Icon, 
    testType, 
    data, 
    isLoading 
  }: {
    title: string;
    description: string;
    icon: any;
    testType: string;
    data: any;
    isLoading: boolean;
  }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => runTest(testType)}
          disabled={isLoading || activeTest === testType}
        >
          {isLoading || activeTest === testType ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Run Test
        </Button>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">{description}</CardDescription>
        
        {(data || isLoading || activeTest === testType) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {isLoading || activeTest === testType ? 'Running Tests...' : 'Test Progress'}
              </span>
              <span className="text-sm text-muted-foreground">
                {(() => {
                  const summary = calculateSummaryFromData(data);
                  return summary.total > 0 ? `${summary.passed}/${summary.total} passed` : 'Preparing...';
                })()}
              </span>
            </div>
            <Progress 
              value={(() => {
                if (isLoading || activeTest === testType) return 50;
                const summary = calculateSummaryFromData(data);
                return summary.total > 0 ? (summary.passed / summary.total) * 100 : 0;
              })()} 
              className="h-2" 
            />
            
            {isLoading || activeTest === testType ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-6 w-6 animate-spin text-primary mr-2" />
                <span className="text-sm text-muted-foreground">Executing validation tests...</span>
              </div>
            ) : null}
            
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>{calculateSummaryFromData(data).passed} Passed</span>
              </div>
              <div className="flex items-center space-x-1">
                <XCircle className="h-3 w-3 text-red-500" />
                <span>{calculateSummaryFromData(data).failed} Failed</span>
              </div>
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                <span>{calculateSummaryFromData(data).warnings} Warnings</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const ResultsTable = ({ results }: { results: ValidationResult[] }) => (
    <div className="space-y-2">
      {results.map((result, index) => (
        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center space-x-3">
            {getStatusIcon(result.status)}
            <div>
              <div className="font-medium">{result.testName}</div>
              <div className="text-sm text-muted-foreground">{result.message}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(result.status)}
            <Badge variant="outline">{result.category}</Badge>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Page Integrity Verification</h1>
          <p className="text-muted-foreground">
            Comprehensive testing suite for multi-tenant platform integrity
          </p>
        </div>
        <Button
          onClick={() => runTest('complete')}
          disabled={loading.complete || activeTest === 'complete'}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {loading.complete || activeTest === 'complete' ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Shield className="h-4 w-4 mr-2" />
          )}
          Run Complete Validation
        </Button>
      </div>

      {testResults.complete?.validation && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Complete Validation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {testResults.complete.validation.summary.total}
                </div>
                <div className="text-sm text-muted-foreground">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {testResults.complete.validation.summary.passed}
                </div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {testResults.complete.validation.summary.failed}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {testResults.complete.validation.summary.warnings}
                </div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Recommendations:</h4>
              {testResults.complete.validation.recommendations.map((rec: string, index: number) => (
                <div key={index} className="flex items-start space-x-2">
                  <Badge variant="outline" className="mt-0.5">
                    {rec.includes('✅') ? 'PASS' : rec.includes('🔴') ? 'CRITICAL' : 'INFO'}
                  </Badge>
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TestCard
          title="End-to-End Tests"
          description="Complete workflow testing: Lead → Contact → Deal → Task"
          icon={Shield}
          testType="e2e"
          data={testResults.e2e}
          isLoading={loading.e2e}
        />
        
        <TestCard
          title="Navigation Validation"
          description="Inter-page navigation and routing verification"
          icon={Navigation}
          testType="navigation"
          data={testResults.navigation}
          isLoading={loading.navigation}
        />
        
        <TestCard
          title="Subscription Gates"
          description="Feature access control and plan enforcement"
          icon={Lock}
          testType="subscription"
          data={testResults.subscription}
          isLoading={loading.subscription}
        />
        
        <TestCard
          title="Tenant Isolation"
          description="Cross-tenant data security and isolation audit"
          icon={Database}
          testType="isolation"
          data={testResults.isolation}
          isLoading={loading.isolation}
        />
      </div>

      <Tabs defaultValue="e2e" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="e2e">E2E Results</TabsTrigger>
          <TabsTrigger value="navigation">Navigation</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="isolation">Isolation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="e2e" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>End-to-End Test Results</CardTitle>
              <CardDescription>
                Complete CRM workflow testing results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.e2e?.tests ? (
                <ResultsTable results={testResults.e2e.tests} />
              ) : (
                <p className="text-muted-foreground">No test results available. Run tests to see results.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="navigation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Navigation Test Results</CardTitle>
              <CardDescription>
                Inter-page navigation validation results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.navigation?.navigation ? (
                <ResultsTable results={testResults.navigation.navigation} />
              ) : (
                <p className="text-muted-foreground">No test results available. Run tests to see results.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Gate Results</CardTitle>
              <CardDescription>
                Feature access control verification results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.subscription?.gates ? (
                <ResultsTable results={testResults.subscription.gates} />
              ) : (
                <p className="text-muted-foreground">No test results available. Run tests to see results.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="isolation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Isolation Results</CardTitle>
              <CardDescription>
                Cross-tenant data security audit results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.isolation?.isolation ? (
                <ResultsTable results={testResults.isolation.isolation} />
              ) : (
                <p className="text-muted-foreground">No test results available. Run tests to see results.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </Layout>
  );
}