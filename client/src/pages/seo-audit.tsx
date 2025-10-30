import { useQuery } from "@tanstack/react-query";
import { SeoIssue } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Info, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Layout from "@/components/layout";
import { useSearch } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface SeoAuditProps {
  projectId?: string;
}

export default function SeoAudit({ projectId: propProjectId }: SeoAuditProps = {}) {
  const { user } = useAuth();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const urlProjectId = params.get('projectId');
  
  // Load user's available projects if no projectId is provided
  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
    enabled: !!user && !propProjectId && !urlProjectId
  });
  
  // Use propProjectId, then URL param, then first available project, or null
  const projectId = propProjectId || urlProjectId || (Array.isArray(projects) && projects.length > 0 ? String(projects[0].id) : null);
  const { data: issues, isLoading } = useQuery<SeoIssue[]>({
    queryKey: ["/api/seo-issues", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/seo-issues?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch SEO issues");
      return res.json();
    },
    enabled: !!projectId
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

  return (
    <div className="p-6 space-y-6" data-testid="seo-audit-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">SEO Audit</h1>
          <p className="text-muted-foreground">Comprehensive website health analysis</p>
        </div>
        <Button data-testid="button-run-audit">
          <RefreshCw className="mr-2 h-4 w-4" /> Run Audit
        </Button>
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
                <Button variant="outline" size="sm" data-testid={`button-fix-${issue.id}`}>
                  Fix Issue
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
