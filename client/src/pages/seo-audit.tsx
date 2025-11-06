import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { SeoIssue } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, AlertTriangle, Info, RefreshCw, Plus, Globe } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Layout from "@/components/layout";
import { useSearch } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import SeoLayout from "@/components/seo-layout";

interface SeoAuditProps {
  projectId?: string;
}

export default function SeoAudit({ projectId: propProjectId }: SeoAuditProps = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const urlProjectId = params.get('projectId');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [fixIssueDialogOpen, setFixIssueDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<SeoIssue | null>(null);
  
  // Load user's available SEO projects
  const { data: projectsData } = useQuery<any[]>({
    queryKey: ['/api/seo/projects'],
    enabled: !!user && !propProjectId && !urlProjectId
  });
  const projects = projectsData || [];
  
  // Use propProjectId, then URL param, then selectedProject, then first available project, or null
  const projectId = propProjectId || urlProjectId || selectedProjectId || (projects.length > 0 ? String(projects[0].id) : null);
  
  // Fetch latest audit scan results
  const { data: auditScan, isLoading } = useQuery<any>({
    queryKey: ["/api/seo/technical-audit/latest", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/seo/technical-audit/latest/${projectId}`, {
        credentials: 'include'
      });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch audit results");
      }
      return res.json();
    },
    enabled: !!projectId
  });
  
  // Convert audit scan data to issues format for display
  const issues: SeoIssue[] = auditScan ? [
    {
      id: `perf-${auditScan.id}`,
      title: `Performance Score: ${auditScan.performanceScore}/100`,
      description: `Overall website performance rating`,
      severity: auditScan.performanceScore < 50 ? "critical" : auditScan.performanceScore < 80 ? "warning" : "info",
      affectedUrls: [],
      recommendedAction: auditScan.performanceScore < 80 ? "Optimize images, reduce JavaScript, enable caching" : "Performance is good!",
      category: "performance"
    },
    {
      id: `seo-${auditScan.id}`,
      title: `SEO Score: ${auditScan.seoScore}/100`,
      description: `Search engine optimization rating`,
      severity: auditScan.seoScore < 50 ? "critical" : auditScan.seoScore < 80 ? "warning" : "info",
      affectedUrls: [],
      recommendedAction: auditScan.seoScore < 80 ? "Improve meta tags, headings, and content structure" : "SEO is good!",
      category: "seo"
    },
    {
      id: `access-${auditScan.id}`,
      title: `Accessibility Score: ${auditScan.accessibilityScore}/100`,
      description: `Website accessibility for users with disabilities`,
      severity: auditScan.accessibilityScore < 50 ? "critical" : auditScan.accessibilityScore < 80 ? "warning" : "info",
      affectedUrls: [],
      recommendedAction: auditScan.accessibilityScore < 80 ? "Add alt text to images, improve color contrast, add ARIA labels" : "Accessibility is good!",
      category: "accessibility"
    }
  ] : [];
  
  // Run audit mutation
  const runAuditMutation = useMutation({
    mutationFn: async ({ projectId, url }: { projectId: string, url: string }) => {
      const response = await apiRequest("POST", "/api/seo/technical-audit/start", {
        projectId,
        urls: [url]
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Audit Completed",
        description: `Successfully analyzed your website with performance score: ${data.performanceScore}/100`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/seo/technical-audit/latest", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/seo/projects"] });
      setDialogOpen(false);
      setWebsiteUrl("");
    },
    onError: (error: any) => {
      toast({
        title: "Audit Failed",
        description: error.message || "Failed to start website audit",
        variant: "destructive",
      });
    },
  });

  const criticalIssues = issues?.filter(i => i.severity === "critical").length || 0;
  const warningIssues = issues?.filter(i => i.severity === "warning").length || 0;
  const infoIssues = issues?.filter(i => i.severity === "info").length || 0;
  const totalIssues = criticalIssues + warningIssues + infoIssues;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-chart-3" />;
      default:
        return <Info className="h-5 w-5 text-chart-1" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "warning":
        return <Badge className="bg-chart-3 text-white">Warning</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-muted rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  const handleRunAudit = () => {
    if (!websiteUrl) {
      toast({
        title: "URL Required",
        description: "Please enter a website URL to audit",
        variant: "destructive",
      });
      return;
    }
    
    // If no project selected and no existing projects, create a default one
    const targetProjectId = projectId || "default-project";
    runAuditMutation.mutate({ projectId: targetProjectId, url: websiteUrl });
  };

  return (
    <SeoLayout title="SEO Audit">
      <div className="p-6 space-y-6" data-testid="seo-audit-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">SEO Audit</h1>
          <p className="text-muted-foreground">Comprehensive website health analysis</p>
        </div>
        <div className="flex gap-2">
          {projects && projects.length > 1 && (
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-[200px]" data-testid="select-project">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project: any) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.name || project.domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-run-audit">
                <Plus className="mr-2 h-4 w-4" /> Run New Audit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]" data-testid="dialog-run-audit">
              <DialogHeader>
                <DialogTitle>Run SEO Audit</DialogTitle>
                <DialogDescription>
                  Enter your website URL to perform a comprehensive SEO analysis
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="website-url">Website URL</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website-url"
                      data-testid="input-website-url"
                      type="url"
                      placeholder="https://example.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll analyze your website's performance, SEO, accessibility, and best practices
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel-audit"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRunAudit}
                  disabled={runAuditMutation.isPending || !websiteUrl}
                  data-testid="button-start-audit"
                >
                  {runAuditMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Running Audit...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Start Audit
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-destructive" data-testid="critical-issues">{criticalIssues}</div>
            <p className="text-xs text-muted-foreground mt-2">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-chart-3" data-testid="warning-issues">{warningIssues}</div>
            <p className="text-xs text-muted-foreground mt-2">Should be addressed soon</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Info</CardTitle>
            <Info className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-chart-1" data-testid="info-issues">{infoIssues}</div>
            <p className="text-xs text-muted-foreground mt-2">Optional improvements</p>
          </CardContent>
        </Card>
      </div>

      <Card className="hover-elevate">
        <CardHeader>
          <CardTitle>Site Health Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Health</span>
              <span className="text-2xl font-bold font-mono">
                {Math.max(0, 100 - (criticalIssues * 10 + warningIssues * 3 + infoIssues))}/100
              </span>
            </div>
            <Progress value={Math.max(0, 100 - (criticalIssues * 10 + warningIssues * 3 + infoIssues))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Issues Found ({totalIssues})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {issues?.map((issue) => (
              <div 
                key={issue.id} 
                className="flex items-start gap-4 p-4 rounded-lg border border-border hover-elevate"
                data-testid={`issue-${issue.id}`}
              >
                <div className="mt-1">{getSeverityIcon(issue.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{issue.title}</h3>
                    {getSeverityBadge(issue.severity)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Affects {issue.affectedPages} {issue.affectedPages === 1 ? 'page' : 'pages'}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  data-testid={`button-fix-${issue.id}`}
                  onClick={() => {
                    setSelectedIssue(issue);
                    setFixIssueDialogOpen(true);
                  }}
                >
                  Fix Issue
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fix Issue Dialog */}
      <Dialog open={fixIssueDialogOpen} onOpenChange={setFixIssueDialogOpen}>
        <DialogContent className="sm:max-w-[600px]" data-testid="dialog-fix-issue">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIssue && getSeverityIcon(selectedIssue.severity)}
              Fix Issue
            </DialogTitle>
            <DialogDescription>
              Follow these recommendations to resolve this issue
            </DialogDescription>
          </DialogHeader>
          {selectedIssue && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-semibold mb-2">{selectedIssue.title}</h4>
                <p className="text-sm text-muted-foreground mb-4">{selectedIssue.description}</p>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <h5 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Recommended Action
                </h5>
                <p className="text-sm">{selectedIssue.recommendedAction}</p>
              </div>

              {selectedIssue.affectedUrls && selectedIssue.affectedUrls.length > 0 && (
                <div>
                  <h5 className="font-semibold mb-2">Affected URLs</h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedIssue.affectedUrls.map((url, idx) => (
                      <div key={idx} className="text-xs bg-muted/30 p-2 rounded border border-border">
                        {url}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFixIssueDialogOpen(false)}
              data-testid="button-close-fix-dialog"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Issue Noted",
                  description: "Follow the recommended actions to fix this issue on your website",
                });
                setFixIssueDialogOpen(false);
              }}
              data-testid="button-mark-understood"
            >
              Mark as Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </SeoLayout>
  );
}
