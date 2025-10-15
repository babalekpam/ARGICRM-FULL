import { useQuery, useMutation } from "@tanstack/react-query";
import { Backlink } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, RefreshCw } from "lucide-react";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BacklinksProps {
  projectId: string;
}

export default function Backlinks({ projectId }: BacklinksProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [limit, setLimit] = useState(100);

  const { data: backlinks, isLoading } = useQuery<Backlink[]>({
    queryKey: ["/api/backlinks", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/backlinks?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch backlinks");
      return res.json();
    },
  });

  const fetchBacklinksMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/backlinks/fetch", { 
        domain, 
        projectId, 
        limit 
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/backlinks", projectId] });
      toast({ 
        title: "Backlinks fetched successfully", 
        description: `Found ${data.fetched} backlinks from ${domain}`
      });
      setDialogOpen(false);
      setDomain("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to fetch backlinks", 
        description: error.message || "Please check your API credentials and try again",
        variant: "destructive" 
      });
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
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" data-testid="button-fetch-backlinks">
                <RefreshCw className="mr-2 h-4 w-4" /> Fetch Backlinks
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-fetch-backlinks">
              <DialogHeader>
                <DialogTitle>Fetch Backlinks from DataForSEO</DialogTitle>
                <DialogDescription>
                  Enter the domain you want to analyze for backlinks
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    data-testid="input-domain"
                    placeholder="example.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="limit">Limit (max backlinks to fetch)</Label>
                  <Input
                    id="limit"
                    data-testid="input-limit"
                    type="number"
                    min="1"
                    max="1000"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel-fetch"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => fetchBacklinksMutation.mutate()}
                  disabled={!domain || fetchBacklinksMutation.isPending}
                  data-testid="button-confirm-fetch"
                >
                  {fetchBacklinksMutation.isPending ? "Fetching..." : "Fetch Backlinks"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button data-testid="button-export-backlinks">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
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
