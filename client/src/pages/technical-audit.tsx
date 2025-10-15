import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Play, Clock, CheckCircle2, AlertCircle, Gauge, Smartphone, Shield, Code } from "lucide-react";
import type { AuditScan, PageMetric } from "@shared/schema";

interface TechnicalAuditProps {
  projectId: string;
}

export default function TechnicalAudit({ projectId }: TechnicalAuditProps) {
  const { toast } = useToast();
  const [urls, setUrls] = useState("");
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  const { data: scans = [], isLoading: scansLoading } = useQuery<AuditScan[]>({
    queryKey: ["/api/technical-audit/scans", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/technical-audit/scans/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch audit scans');
      return res.json();
    },
    enabled: !!projectId,
  });

  const { data: latestScan } = useQuery<AuditScan | null>({
    queryKey: ["/api/technical-audit/latest", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/technical-audit/latest/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch latest audit scan');
      return res.json();
    },
    enabled: !!projectId,
  });

  const { data: pageMetrics = [], isLoading: metricsLoading } = useQuery<PageMetric[]>({
    queryKey: ["/api/technical-audit/metrics", selectedScanId],
    queryFn: async () => {
      const res = await fetch(`/api/technical-audit/metrics/${selectedScanId}`);
      if (!res.ok) throw new Error('Failed to fetch page metrics');
      return res.json();
    },
    enabled: !!selectedScanId,
  });

  const startAuditMutation = useMutation({
    mutationFn: async (urlList: string[]) => {
      const res = await apiRequest("POST", "/api/technical-audit/start", { projectId, urls: urlList });
      return res.json();
    },
    onSuccess: (data: AuditScan) => {
      toast({ title: "Audit completed", description: "Technical SEO audit has finished successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/technical-audit/scans", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/technical-audit/latest", projectId] });
      setUrls("");
      setSelectedScanId(data.id); // Automatically select the new scan
    },
    onError: (error: Error) => {
      toast({ 
        title: "Audit failed", 
        description: error.message || "Failed to run technical audit", 
        variant: "destructive" 
      });
    },
  });

  const handleStartAudit = () => {
    const urlList = urls.split("\n").map(u => u.trim()).filter(u => u.length > 0);
    if (urlList.length === 0) {
      toast({ title: "No URLs", description: "Please enter at least one URL to audit", variant: "destructive" });
      return;
    }
    startAuditMutation.mutate(urlList);
  };

  const getScoreColor = (score: number | null | undefined): string => {
    if (!score) return "text-muted-foreground";
    if (score >= 90) return "text-green-600 dark:text-green-500";
    if (score >= 70) return "text-orange-600 dark:text-orange-500";
    return "text-red-600 dark:text-red-500";
  };

  const getVitalRating = (rating: string | null | undefined) => {
    if (rating === 'good') return <Badge className="bg-green-600" data-testid={`rating-${rating}`}>Good</Badge>;
    if (rating === 'needs-improvement') return <Badge className="bg-orange-600" data-testid={`rating-${rating}`}>Needs Work</Badge>;
    return <Badge variant="destructive" data-testid={`rating-${rating}`}>Poor</Badge>;
  };

  const activeScan = selectedScanId ? scans.find(s => s.id === selectedScanId) : latestScan;

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-technical-audit">Technical SEO Audit</h1>
          <p className="text-muted-foreground">Analyze your website's technical performance and SEO health</p>
        </div>
      </div>

      {latestScan && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(latestScan.performanceScore)}`} data-testid="score-performance">
                {latestScan.performanceScore || 0}
              </div>
              <p className="text-xs text-muted-foreground">Page speed and loading</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SEO Score</CardTitle>
              <Code className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(latestScan.seoScore)}`} data-testid="score-seo">
                {latestScan.seoScore || 0}
              </div>
              <p className="text-xs text-muted-foreground">Search optimization</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accessibility</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(latestScan.accessibilityScore)}`} data-testid="score-accessibility">
                {latestScan.accessibilityScore || 0}
              </div>
              <p className="text-xs text-muted-foreground">User accessibility</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Best Practices</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(latestScan.bestPracticesScore)}`} data-testid="score-best-practices">
                {latestScan.bestPracticesScore || 0}
              </div>
              <p className="text-xs text-muted-foreground">Web standards</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit" data-testid="tab-audit">Run Audit</TabsTrigger>
          <TabsTrigger value="results" data-testid="tab-results">Audit Results</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">Audit History</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Start Technical Audit</CardTitle>
              <CardDescription>Enter URLs to analyze (one per line, up to 10 URLs)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="urls">URLs to Audit</Label>
                <textarea
                  id="urls"
                  placeholder="https://example.com&#10;https://example.com/about&#10;https://example.com/contact"
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  className="w-full min-h-[200px] p-3 rounded-md border bg-background"
                  data-testid="input-urls"
                />
              </div>
              <Button 
                onClick={handleStartAudit} 
                disabled={startAuditMutation.isPending}
                data-testid="button-start-audit"
              >
                {startAuditMutation.isPending ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Running Audit...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Audit
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {!activeScan && (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No audit results available. Run your first audit to see results.</p>
              </CardContent>
            </Card>
          )}

          {activeScan && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Scan Overview</CardTitle>
                  <CardDescription>
                    Scanned {activeScan.pagesScanned} pages, found {activeScan.issuesFound} issues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Scan Status</p>
                      <Badge variant={activeScan.status === 'completed' ? 'default' : 'secondary'} data-testid="status-scan">
                        {activeScan.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Completed</p>
                      <p className="text-sm text-muted-foreground" data-testid="text-completed-at">
                        {activeScan.completedAt ? new Date(activeScan.completedAt).toLocaleString() : 'In progress'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedScanId && pageMetrics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Page Metrics</CardTitle>
                    <CardDescription>Detailed performance metrics for each audited page</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>URL</TableHead>
                          <TableHead>Performance</TableHead>
                          <TableHead>Load Time</TableHead>
                          <TableHead>Page Size</TableHead>
                          <TableHead>Mobile</TableHead>
                          <TableHead>Issues</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pageMetrics.map((metric) => (
                          <TableRow key={metric.id} data-testid={`row-page-${metric.id}`}>
                            <TableCell className="font-medium max-w-[300px] truncate" data-testid="text-url">
                              {metric.url}
                            </TableCell>
                            <TableCell>
                              <span className={getScoreColor(metric.performanceScore)} data-testid="text-performance-score">
                                {metric.performanceScore || 0}
                              </span>
                            </TableCell>
                            <TableCell data-testid="text-load-time">
                              {metric.loadTime ? `${metric.loadTime.toFixed(2)}s` : 'N/A'}
                            </TableCell>
                            <TableCell data-testid="text-page-size">
                              {metric.pageSize ? `${(metric.pageSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={metric.mobileUsable === 'yes' ? 'default' : 'secondary'}
                                data-testid="badge-mobile"
                              >
                                {metric.mobileUsable}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid="text-issues">
                              {(metric.brokenLinks || 0) + (metric.imagesWithoutAlt || 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {scansLoading && <p>Loading audit history...</p>}
          
          {!scansLoading && scans.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No audit history available</p>
              </CardContent>
            </Card>
          )}

          {!scansLoading && scans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Previous Audits</CardTitle>
                <CardDescription>View past audit scans and results</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pages</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>SEO</TableHead>
                      <TableHead>Issues</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scans.map((scan) => (
                      <TableRow key={scan.id} data-testid={`row-scan-${scan.id}`}>
                        <TableCell data-testid="text-scan-date">
                          {new Date(scan.startedAt!).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={scan.status === 'completed' ? 'default' : 'secondary'}
                            data-testid="badge-scan-status"
                          >
                            {scan.status}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid="text-pages-scanned">{scan.pagesScanned}</TableCell>
                        <TableCell className={getScoreColor(scan.performanceScore)} data-testid="text-scan-performance">
                          {scan.performanceScore || 0}
                        </TableCell>
                        <TableCell className={getScoreColor(scan.seoScore)} data-testid="text-scan-seo">
                          {scan.seoScore || 0}
                        </TableCell>
                        <TableCell data-testid="text-scan-issues">{scan.issuesFound}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedScanId(scan.id)}
                            data-testid={`button-view-scan-${scan.id}`}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
