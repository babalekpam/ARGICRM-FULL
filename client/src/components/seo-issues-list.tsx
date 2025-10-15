import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface SeoIssue {
  id: string;
  severity: string;
  title: string;
  description: string;
  affectedPages: number;
}

interface SeoIssuesListProps {
  issues: SeoIssue[];
}

export function SeoIssuesList({ issues }: SeoIssuesListProps) {
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-chart-3" />;
      default:
        return <Info className="h-4 w-4 text-chart-1" />;
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

  const topIssues = issues.slice(0, 5);

  return (
    <Card className="hover-elevate">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>SEO Issues</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Top priority items</p>
        </div>
        <Link href="/seo-audit">
          <Button variant="outline" size="sm" data-testid="button-view-all-issues">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topIssues.map((issue) => (
            <div 
              key={issue.id} 
              className="flex items-start gap-3 p-3 rounded-md border border-border hover-elevate"
              data-testid={`issue-${issue.id}`}
            >
              <div className="mt-0.5">{getSeverityIcon(issue.severity)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{issue.title}</h4>
                  {getSeverityBadge(issue.severity)}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{issue.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {issue.affectedPages} {issue.affectedPages === 1 ? 'page' : 'pages'} affected
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
