import { useQuery } from "@tanstack/react-query";
import { Backlink } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricCard } from "@/components/metric-card";
import { Link as LinkIcon, Globe, TrendingUp } from "lucide-react";

interface BacklinksProps {
  projectId: string;
}

export default function Backlinks({ projectId }: BacklinksProps) {
  const { data: backlinks, isLoading } = useQuery<Backlink[]>({
    queryKey: ["/api/backlinks", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/backlinks?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch backlinks");
      return res.json();
    },
  });

  const totalBacklinks = backlinks?.length || 0;
  const uniqueDomains = new Set(backlinks?.map(b => new URL(b.url).hostname)).size;
  const avgDomainScore = backlinks?.length 
    ? Math.round(backlinks.reduce((sum, b) => sum + b.domainScore, 0) / backlinks.length)
    : 0;

  const getDomainScoreColor = (score: number) => {
    if (score >= 70) return "bg-chart-2 text-white";
    if (score >= 40) return "bg-chart-3 text-white";
    return "bg-destructive text-white";
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
    <div className="p-6 space-y-6" data-testid="backlinks-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Backlinks</h1>
          <p className="text-muted-foreground">Monitor your backlink profile and link building</p>
        </div>
        <Button data-testid="button-export-backlinks">
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Backlinks"
          value={totalBacklinks.toLocaleString()}
          icon={LinkIcon}
          trend={{ value: 8, isPositive: true }}
        />
        <MetricCard
          title="Referring Domains"
          value={uniqueDomains}
          icon={Globe}
        />
        <MetricCard
          title="Avg. Domain Score"
          value={avgDomainScore}
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Backlinks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source URL</TableHead>
                <TableHead>Anchor Text</TableHead>
                <TableHead>Domain Score</TableHead>
                <TableHead>Date Found</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backlinks?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No backlinks found
                  </TableCell>
                </TableRow>
              ) : (
                backlinks?.map((backlink) => (
                  <TableRow key={backlink.id} data-testid={`backlink-${backlink.id}`}>
                    <TableCell className="max-w-md">
                      <div className="truncate font-medium">{backlink.url}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {new URL(backlink.url).hostname}
                      </div>
                    </TableCell>
                    <TableCell>
                      {backlink.anchorText ? (
                        <span className="text-sm">{backlink.anchorText}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No anchor text</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getDomainScoreColor(backlink.domainScore)}>
                        {backlink.domainScore}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {backlink.date}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        asChild
                        data-testid={`button-visit-${backlink.id}`}
                      >
                        <a href={backlink.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
