import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabDebugger } from "@/utils/tabDebugger";
import { AlertTriangle, CheckCircle, RefreshCw, Bug, Activity } from "lucide-react";

interface TabIssue {
  componentName: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export default function TabDiagnostic() {
  const [debugReport, setDebugReport] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [tabIssues, setTabIssues] = useState<TabIssue[]>([]);

  const runDiagnostic = async () => {
    setIsRunning(true);
    
    try {
      // Get debug report from TabDebugger
      const tabDebugger = TabDebugger.getInstance();
      const report = tabDebugger.getReport();
      setDebugReport(report);

      // Analyze common tab issues
      const issues: TabIssue[] = [];

      // Check for error patterns
      report.errorCounts.forEach((count, errorKey) => {
        const [componentName, error] = errorKey.split(':');
        if (count > 2) {
          issues.push({
            componentName,
            issue: error,
            severity: count > 5 ? 'high' : 'medium',
            suggestion: getSuggestionForError(error)
          });
        }
      });

      // Check for missing tab activity
      if (report.logs.length === 0) {
        issues.push({
          componentName: 'Global',
          issue: 'No tab activity detected',
          severity: 'medium',
          suggestion: 'Tabs may not be properly initialized or debugger not attached'
        });
      }

      // Check for rapid tab switching (potential performance issue)
      const recentLogs = report.logs.slice(-20);
      const tabChanges = recentLogs.filter(log => log.includes('Tab changed'));
      if (tabChanges.length > 10) {
        issues.push({
          componentName: 'Performance',
          issue: 'Rapid tab switching detected',
          severity: 'low',
          suggestion: 'Consider debouncing tab changes or optimizing render cycles'
        });
      }

      setTabIssues(issues);
    } catch (error) {
      console.error('Diagnostic failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearDiagnostic = () => {
    const tabDebugger = TabDebugger.getInstance();
    tabDebugger.clear();
    setDebugReport(null);
    setTabIssues([]);
  };

  const getSuggestionForError = (error: string): string => {
    if (error.includes('Active tab')) {
      return 'Ensure the activeTab value matches one of the TabsTrigger values';
    }
    if (error.includes('onValueChange')) {
      return 'Add onValueChange={setActiveTab} to the Tabs component';
    }
    if (error.includes('TabsContent')) {
      return 'Ensure each TabsTrigger has a corresponding TabsContent with matching value';
    }
    if (error.includes('Render error')) {
      return 'Check for React hooks violations or component state issues';
    }
    return 'Check component implementation and ensure proper tab structure';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  useEffect(() => {
    // Auto-run diagnostic on component mount
    runDiagnostic();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tab Functionality Diagnostic</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Analyze and troubleshoot tab-related issues across the application
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={runDiagnostic} disabled={isRunning}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running...' : 'Run Diagnostic'}
          </Button>
          <Button variant="outline" onClick={clearDiagnostic}>
            Clear Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="issues" className="space-y-4">
        <TabsList>
          <TabsTrigger value="issues">
            <Bug className="h-4 w-4 mr-2" />
            Issues ({tabIssues.length})
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-4">
          {tabIssues.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                No critical tab issues detected. All tab functionality appears to be working correctly.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {tabIssues.map((issue, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                        {issue.componentName}
                      </CardTitle>
                      <Badge variant={getSeverityColor(issue.severity) as any}>
                        {issue.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium mb-2">{issue.issue}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <strong>Suggestion:</strong> {issue.suggestion}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tab Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              {debugReport?.logs.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {debugReport.logs.slice(-50).reverse().map((log: string, index: number) => (
                    <div key={index} className="text-sm font-mono p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  No activity logs available. Tab interactions will appear here.
                </p>
              )}
            </CardContent>
          </Card>

          {debugReport?.errorCounts && debugReport.errorCounts.size > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Error Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from(debugReport.errorCounts.entries()).map(([errorKey, count]) => (
                    <div key={errorKey} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{errorKey}</span>
                      <Badge variant="destructive">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}