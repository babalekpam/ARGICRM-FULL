import { useQuery, useMutation } from "@tanstack/react-query";
import { LocalRanking, GoogleBusinessProfile, LocalCitation } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Store, ExternalLink, TrendingUp, TrendingDown, Sparkles, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LocalSEOProps {
  projectId: string;
}

export default function LocalSEO({ projectId }: LocalSEOProps) {
  const { toast } = useToast();
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [locations, setLocations] = useState("");
  const [numCitations, setNumCitations] = useState("20");

  const { data: localRankings, isLoading: rankingsLoading } = useQuery<LocalRanking[]>({
    queryKey: ["/api/projects", projectId, "local-rankings"],
  });

  const { data: googleProfile, isLoading: profileLoading } = useQuery<GoogleBusinessProfile>({
    queryKey: ["/api/projects", projectId, "google-business-profile"],
  });

  const { data: citations, isLoading: citationsLoading } = useQuery<LocalCitation[]>({
    queryKey: ["/api/projects", projectId, "local-citations"],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const locationArray = locations.split(',').map(l => l.trim()).filter(Boolean);
      return await apiRequest("POST", `/api/projects/${projectId}/local-seo/generate`, {
        businessName,
        locations: locationArray,
        numCitations: parseInt(numCitations) || 20
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "local-rankings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "google-business-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "local-citations"] });
      toast({ 
        title: "Local SEO data generated with AI!", 
        description: `Created ${data.rankings} rankings and ${data.citations} citations`
      });
      setIsGenerateDialogOpen(false);
      setBusinessName("");
      setLocations("");
      setNumCitations("20");
    },
  });

  const deleteRankingMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/local-rankings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "local-rankings"] });
      toast({ title: "Local ranking deleted" });
    },
  });

  const deleteCitationMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/local-citations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "local-citations"] });
      toast({ title: "Citation deleted" });
    },
  });

  const isLoading = rankingsLoading || profileLoading || citationsLoading;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-muted rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="local-seo-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Local SEO</h1>
          <p className="text-muted-foreground">Track local rankings and manage citations</p>
        </div>
        <Button onClick={() => setIsGenerateDialogOpen(true)} data-testid="button-generate-local-seo">
          <Sparkles className="mr-2 h-4 w-4" /> Generate with AI
        </Button>
      </div>

      {/* Google Business Profile Summary */}
      {googleProfile && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="hover-elevate">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Profile Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-profile-views">{(googleProfile.views || 0).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Discovery Searches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-search-queries">{(googleProfile.searches || 0).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Website Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-website-clicks">{(googleProfile.websiteClicks || 0).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-avg-rating">{(googleProfile.rating || 0).toFixed(1)} ⭐</div>
              <p className="text-xs text-muted-foreground mt-1">{googleProfile.reviewCount || 0} reviews</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="rankings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rankings" data-testid="tab-rankings">
            <MapPin className="mr-2 h-4 w-4" />
            Local Rankings
          </TabsTrigger>
          <TabsTrigger value="citations" data-testid="tab-citations">
            <Store className="mr-2 h-4 w-4" />
            Citations ({citations?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rankings" className="space-y-6">
          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle>Location-Based Rankings</CardTitle>
              <p className="text-sm text-muted-foreground">Track your local search rankings by location</p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Last Checked</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localRankings?.map((ranking) => (
                    <TableRow key={ranking.id} data-testid={`row-ranking-${ranking.id}`}>
                      <TableCell className="font-medium">{ranking.keyword}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{ranking.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ranking.position && ranking.position <= 3 ? "default" : "secondary"} data-testid={`badge-position-${ranking.id}`}>
                          #{ranking.position || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ranking.localPackRank && (
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary">Local Pack #{ranking.localPackRank}</Badge>
                          </div>
                        )}
                        {!ranking.localPackRank && (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ranking.checkedAt ? new Date(ranking.checkedAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteRankingMutation.mutate(ranking.id)}
                          data-testid={`button-delete-ranking-${ranking.id}`}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="citations" className="space-y-6">
          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle>Local Citations</CardTitle>
              <p className="text-sm text-muted-foreground">Monitor your business listings across directories</p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Directory</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>NAP Consistency</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Last Checked</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {citations?.map((citation) => (
                    <TableRow key={citation.id} data-testid={`row-citation-${citation.id}`}>
                      <TableCell className="font-medium">{citation.source}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={citation.status === "active" ? "default" : citation.status === "pending" ? "secondary" : "destructive"}
                          data-testid={`badge-status-${citation.id}`}
                        >
                          {citation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={citation.isConsistent === 1 ? "default" : "destructive"}>
                              {citation.isConsistent === 1 ? "Consistent" : "Inconsistent"}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {citation.url ? (
                          <a 
                            href={citation.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover-elevate"
                            data-testid={`link-citation-url-${citation.id}`}
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {citation.lastChecked ? new Date(citation.lastChecked).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteCitationMutation.mutate(citation.id)}
                          data-testid={`button-delete-citation-${citation.id}`}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Generation Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate Local SEO Data with AI
            </DialogTitle>
            <DialogDescription>
              Use AI to generate realistic Google Business Profile metrics, local rankings, and citations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                placeholder="e.g., Joe's Pizza"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                data-testid="input-business-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="locations">Target Locations (comma-separated)</Label>
              <Input
                id="locations"
                placeholder="e.g., New York NY, Brooklyn NY, Queens NY"
                value={locations}
                onChange={(e) => setLocations(e.target.value)}
                data-testid="input-locations"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple locations with commas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="num-citations">Number of Citations</Label>
              <Input
                id="num-citations"
                type="number"
                min="5"
                max="50"
                placeholder="20"
                value={numCitations}
                onChange={(e) => setNumCitations(e.target.value)}
                data-testid="input-num-citations"
              />
              <p className="text-xs text-muted-foreground">
                Generate 5-50 business directory citations
              </p>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-primary">AI-Powered Generation (Free)</p>
                  <p className="text-muted-foreground mt-1">
                    Creates realistic local SEO data based on your business and target locations
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsGenerateDialogOpen(false)}
              data-testid="button-cancel-generate"
            >
              Cancel
            </Button>
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={!businessName || !locations || generateMutation.isPending}
              data-testid="button-confirm-generate"
            >
              {generateMutation.isPending ? (
                <>Processing...</>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate with AI
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
