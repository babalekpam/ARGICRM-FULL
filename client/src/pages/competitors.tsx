import { useQuery } from "@tanstack/react-query";
import { Competitor } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CompetitorCard } from "@/components/competitor-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSearch } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface CompetitorsProps {
  projectId?: string;
}

export default function Competitors({ projectId: propProjectId }: CompetitorsProps = {}) {
  const { user } = useAuth();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const urlProjectId = params.get('projectId');
  
  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
    enabled: !!user && !propProjectId && !urlProjectId
  });
  
  const projectId = propProjectId || urlProjectId || (Array.isArray(projects) && projects.length > 0 ? String(projects[0].id) : null);
  const { data: competitors, isLoading } = useQuery<Competitor[]>({
    queryKey: ["/api/competitors", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const res = await fetch(`/api/competitors?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch competitors");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-muted rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="competitors-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Competitor Analysis</h1>
          <p className="text-muted-foreground">Track and compare your competition</p>
        </div>
        <Button data-testid="button-add-competitor">
          <Plus className="mr-2 h-4 w-4" /> Add Competitor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {competitors?.map((competitor) => (
          <CompetitorCard key={competitor.id} {...competitor} />
        ))}
      </div>

      <Card className="hover-elevate">
        <CardHeader>
          <CardTitle>Competitor Comparison</CardTitle>
          <p className="text-sm text-muted-foreground">Side-by-side performance metrics</p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Domain Score</TableHead>
                <TableHead>Est. Traffic</TableHead>
                <TableHead>Common Keywords</TableHead>
                <TableHead>Top Keyword</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitors?.map((competitor) => (
                <TableRow key={competitor.id}>
                  <TableCell className="font-medium">{competitor.domain}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{competitor.domainScore}/100</Badge>
                  </TableCell>
                  <TableCell className="font-mono">{competitor.estimatedTraffic.toLocaleString()}</TableCell>
                  <TableCell className="font-mono">{competitor.commonKeywords}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {competitor.topKeyword || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
