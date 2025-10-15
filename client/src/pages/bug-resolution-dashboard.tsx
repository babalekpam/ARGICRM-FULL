import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Bug, CheckCircle, Clock, Activity, TrendingUp, Shield, Database } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'security' | 'performance' | 'functionality' | 'ui' | 'api';
  status: 'open' | 'in_progress' | 'resolved' | 'deferred';
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
  affectedModules: string[];
  reproducibleSteps: string[];
  expectedBehavior: string;
  actualBehavior: string;
  environment: string;
}

interface SystemDiagnostic {
  category: string;
  tests: DiagnosticTest[];
  overallHealth: 'healthy' | 'warning' | 'critical';
  lastChecked: string;
}

interface DiagnosticTest {
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'skipped';
  message: string;
  executionTime: number;
  details?: any;
}

interface SystemHealth {
  overallStatus: 'healthy' | 'warning' | 'critical';
  criticalBugs: number;
  highPriorityBugs: number;
  totalBugs: number;
  resolvedBugs: number;
  systemUptime: string;
  lastDiagnostic: string;
}

interface ResolutionPlan {
  immediatePriority: BugReport[];
  shortTerm: BugReport[];
  longTerm: BugReport[];
  recommendations: string[];
}

export default function BugResolutionDashboard() {
  const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
  const [newBugDialog, setNewBugDialog] = useState(false);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const queryClient = useQueryClient();

  // Fetch system health
  const { data: health, isLoading: healthLoading, error: healthError } = useQuery({
    queryKey: ["/api/bugs/health"],
    queryFn: async () => {
      console.log("Fetching system health...");
      const response = await apiRequest("GET", "/api/bugs/health");
      console.log("Health response:", response.status, response.ok);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Health API error:", errorText);
        throw new Error(`Failed to fetch system health: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      console.log("Health data:", data);
      return data.health as SystemHealth;
    },
    refetchInterval: 30000,
  });

  // Fetch all bugs
  const { data: bugsData, isLoading: bugsLoading } = useQuery({
    queryKey: ["/api/bugs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/bugs");
      if (!response.ok) throw new Error("Failed to fetch bugs");
      const data = await response.json();
      return data.bugs as BugReport[];
    },
  });

  // Fetch diagnostics
  const { data: diagnostics, isLoading: diagnosticsLoading, refetch: refetchDiagnostics } = useQuery({
    queryKey: ["/api/bugs/diagnostics"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/bugs/diagnostics");
      if (!response.ok) throw new Error("Failed to fetch diagnostics");
      const data = await response.json();
      return data.diagnostics as SystemDiagnostic[];
    },
    enabled: false, // Only run when manually triggered
  });

  // Fetch resolution plan
  const { data: resolutionPlan, isLoading: planLoading } = useQuery({
    queryKey: ["/api/bugs/resolution-plan"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/bugs/resolution-plan");
      if (!response.ok) throw new Error("Failed to fetch resolution plan");
      const data = await response.json();
      return data.plan as ResolutionPlan;
    },
  });

  // Update bug status mutation
  const updateBugMutation = useMutation({
    mutationFn: async ({ bugId, status }: { bugId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/bugs/${bugId}`, { status });
      if (!response.ok) throw new Error("Failed to update bug");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bugs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bugs/health"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bugs/resolution-plan"] });
    },
  });

  // Create new bug mutation
  const createBugMutation = useMutation({
    mutationFn: async (bugData: any) => {
      const response = await apiRequest("POST", "/api/bugs", bugData);
      if (!response.ok) throw new Error("Failed to create bug");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bugs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bugs/health"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bugs/resolution-plan"] });
      setNewBugDialog(false);
    },
  });

  const runDiagnostics = async () => {
    setRunningDiagnostics(true);
    try {
      await refetchDiagnostics();
    } finally {
      setRunningDiagnostics(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in_progress': return 'default';
      case 'resolved': return 'default';
      case 'deferred': return 'secondary';
      default: return 'secondary';
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (healthLoading || bugsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading bug resolution dashboard...</p>
            {healthError && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
                <p className="font-semibold">Health API Error:</p>
                <p className="text-sm">{healthError.message}</p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bug Resolution Dashboard</h1>
            <p className="text-muted-foreground">
              Section 3: Critical Bug Resolution - Systematic issue tracking and resolution
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={runDiagnostics}
              disabled={runningDiagnostics}
              variant="outline"
            >
              {runningDiagnostics ? (
                <Activity className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              Run Diagnostics
            </Button>
            <Button onClick={() => setNewBugDialog(true)}>
              <Bug className="h-4 w-4 mr-2" />
              Report Bug
            </Button>
          </div>
        </div>

        {/* System Health Overview */}
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Shield className={`h-4 w-4 ${getHealthColor(health.overallStatus)}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getHealthColor(health.overallStatus)}`}>
                  {health.overallStatus.toUpperCase()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Uptime: {health.systemUptime}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{health.criticalBugs}</div>
                <p className="text-xs text-muted-foreground">
                  {health.highPriorityBugs} high priority
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bugs</CardTitle>
                <Bug className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{health.totalBugs}</div>
                <p className="text-xs text-muted-foreground">
                  {health.resolvedBugs} resolved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((health.resolvedBugs / health.totalBugs) * 100)}%
                </div>
                <Progress 
                  value={(health.resolvedBugs / health.totalBugs) * 100} 
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="bugs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="bugs">Bug Reports</TabsTrigger>
            <TabsTrigger value="diagnostics">System Diagnostics</TabsTrigger>
            <TabsTrigger value="resolution">Resolution Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="bugs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Bug Reports</CardTitle>
                <CardDescription>
                  Track and manage platform issues systematically
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bugsData && bugsData.length > 0 ? (
                  <div className="space-y-4">
                    {bugsData.map((bug) => (
                      <div
                        key={bug.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedBug(bug)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getSeverityColor(bug.severity)}>
                              {bug.severity}
                            </Badge>
                            <Badge variant={getStatusColor(bug.status)}>
                              {bug.status}
                            </Badge>
                            <Badge variant="outline">{bug.category}</Badge>
                          </div>
                          <h3 className="font-semibold">{bug.title}</h3>
                          <p className="text-sm text-muted-foreground">{bug.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Reported by: {bug.reportedBy}</span>
                            <span>Modules: {bug.affectedModules.join(', ')}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={bug.status}
                            onValueChange={(status) => 
                              updateBugMutation.mutate({ bugId: bug.id, status })
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="deferred">Deferred</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bug className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-muted-foreground">No bugs found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagnostics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Diagnostics</CardTitle>
                <CardDescription>
                  Comprehensive system health checks and issue detection
                </CardDescription>
              </CardHeader>
              <CardContent>
                {diagnosticsLoading ? (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Running system diagnostics...</p>
                  </div>
                ) : diagnostics ? (
                  <div className="space-y-4">
                    {diagnostics.map((diagnostic) => (
                      <div key={diagnostic.category} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold capitalize">
                            {diagnostic.category.replace('_', ' ')}
                          </h3>
                          <Badge 
                            variant={diagnostic.overallHealth === 'healthy' ? 'default' : 'destructive'}
                          >
                            {diagnostic.overallHealth}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {diagnostic.tests.map((test, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <div className="font-medium">{test.name}</div>
                                <div className="text-sm text-muted-foreground">{test.message}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs">{test.executionTime}ms</span>
                                <Badge 
                                  variant={test.status === 'pass' ? 'default' : 'destructive'}
                                >
                                  {test.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-muted-foreground">Click "Run Diagnostics" to check system health</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resolution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bug Resolution Plan</CardTitle>
                <CardDescription>
                  Prioritized roadmap for systematic issue resolution
                </CardDescription>
              </CardHeader>
              <CardContent>
                {planLoading ? (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Generating resolution plan...</p>
                  </div>
                ) : resolutionPlan ? (
                  <div className="space-y-6">
                    {/* Immediate Priority */}
                    <div>
                      <h3 className="font-semibold text-red-600 mb-2">Immediate Priority (Critical)</h3>
                      {resolutionPlan.immediatePriority.length > 0 ? (
                        <div className="space-y-2">
                          {resolutionPlan.immediatePriority.map((bug) => (
                            <Alert key={bug.id}>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                <strong>{bug.title}</strong> - {bug.description}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      ) : (
                        <p className="text-green-600">No critical issues found!</p>
                      )}
                    </div>

                    {/* Short Term */}
                    <div>
                      <h3 className="font-semibold text-orange-600 mb-2">Short Term (High Priority)</h3>
                      {resolutionPlan.shortTerm.length > 0 ? (
                        <div className="space-y-2">
                          {resolutionPlan.shortTerm.map((bug) => (
                            <div key={bug.id} className="p-3 bg-orange-50 rounded border-l-4 border-orange-400">
                              <strong>{bug.title}</strong> - {bug.description}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-green-600">No high priority issues found!</p>
                      )}
                    </div>

                    {/* Long Term */}
                    <div>
                      <h3 className="font-semibold text-blue-600 mb-2">Long Term (Medium/Low Priority)</h3>
                      {resolutionPlan.longTerm.length > 0 ? (
                        <div className="space-y-2">
                          {resolutionPlan.longTerm.map((bug) => (
                            <div key={bug.id} className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                              <strong>{bug.title}</strong> - {bug.description}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-green-600">No low priority issues found!</p>
                      )}
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h3 className="font-semibold mb-2">Recommendations</h3>
                      <ul className="space-y-2">
                        {resolutionPlan.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-muted-foreground">Unable to load resolution plan</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* New Bug Report Dialog */}
        <Dialog open={newBugDialog} onOpenChange={setNewBugDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Report New Bug</DialogTitle>
              <DialogDescription>
                Provide detailed information about the issue you've encountered
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const bugData = {
                  title: formData.get('title'),
                  description: formData.get('description'),
                  severity: formData.get('severity'),
                  category: formData.get('category'),
                  affectedModules: (formData.get('modules') as string)?.split(',').map(m => m.trim()) || [],
                  reproducibleSteps: (formData.get('steps') as string)?.split('\n') || [],
                  expectedBehavior: formData.get('expected'),
                  actualBehavior: formData.get('actual'),
                  environment: 'development',
                  status: 'open'
                };
                createBugMutation.mutate(bugData);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input name="title" required />
                </div>
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select name="severity" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="functionality">Functionality</SelectItem>
                      <SelectItem value="ui">UI/UX</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="modules">Affected Modules (comma-separated)</Label>
                  <Input name="modules" placeholder="e.g. dashboard, authentication" />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea name="description" required />
              </div>

              <div>
                <Label htmlFor="steps">Reproducible Steps (one per line)</Label>
                <Textarea name="steps" placeholder="1. Navigate to..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expected">Expected Behavior</Label>
                  <Textarea name="expected" />
                </div>
                <div>
                  <Label htmlFor="actual">Actual Behavior</Label>
                  <Textarea name="actual" />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setNewBugDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createBugMutation.isPending}>
                  {createBugMutation.isPending ? "Creating..." : "Create Bug Report"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}