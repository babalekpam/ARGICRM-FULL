import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, BarChart3, Search, TrendingUp, Trash2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ContentBrief, ContentScorecard } from "@shared/schema";

interface ContentToolsProps {
  projectId: string;
}

export default function ContentTools({ projectId }: ContentToolsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("briefs");

  // Fetch saved briefs
  const { data: briefs = [], isLoading: briefsLoading } = useQuery<ContentBrief[]>({
    queryKey: ["/api/content/briefs", projectId],
    queryFn: () => fetch(`/api/content/briefs/${projectId}`).then(res => res.json())
  });

  // Fetch saved scorecards
  const { data: scorecards = [], isLoading: scorecardsLoading } = useQuery<ContentScorecard[]>({
    queryKey: ["/api/content/scorecards", projectId],
    queryFn: () => fetch(`/api/content/scorecards/${projectId}`).then(res => res.json())
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Content Intelligence</h1>
        <p className="text-muted-foreground">AI-powered content creation and optimization tools</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="briefs" data-testid="tab-content-briefs">
            <FileText className="h-4 w-4 mr-2" />
            Content Briefs
          </TabsTrigger>
          <TabsTrigger value="scoring" data-testid="tab-content-scoring">
            <BarChart3 className="h-4 w-4 mr-2" />
            Content Scoring
          </TabsTrigger>
          <TabsTrigger value="serp" data-testid="tab-serp-analysis">
            <Search className="h-4 w-4 mr-2" />
            SERP Analysis
          </TabsTrigger>
          <TabsTrigger value="gaps" data-testid="tab-content-gaps">
            <TrendingUp className="h-4 w-4 mr-2" />
            Content Gaps
          </TabsTrigger>
        </TabsList>

        <TabsContent value="briefs" className="space-y-6 mt-6">
          <ContentBriefGenerator projectId={projectId} />
          <SavedBriefs briefs={briefs} isLoading={briefsLoading} projectId={projectId} />
        </TabsContent>

        <TabsContent value="scoring" className="space-y-6 mt-6">
          <ContentScoringTool projectId={projectId} />
          <SavedScorecards scorecards={scorecards} isLoading={scorecardsLoading} projectId={projectId} />
        </TabsContent>

        <TabsContent value="serp" className="space-y-6 mt-6">
          <SerpAnalysisTool />
        </TabsContent>

        <TabsContent value="gaps" className="space-y-6 mt-6">
          <ContentGapAnalysisTool projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ContentBriefGenerator({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [keyword, setKeyword] = useState("");
  const [contentType, setContentType] = useState("blog_post");
  const [wordCount, setWordCount] = useState("1500");

  const generateBriefMutation = useMutation({
    mutationFn: async (data: { targetKeyword: string; contentType: string; wordCountTarget: number; projectId: string }) => {
      return apiRequest("POST", "/api/content/briefs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/briefs", projectId] });
      toast({ title: "Success", description: "Content brief generated successfully" });
      setKeyword("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to generate content brief",
        variant: "destructive" 
      });
    }
  });

  const handleGenerate = () => {
    if (!keyword.trim()) {
      toast({ title: "Error", description: "Please enter a target keyword", variant: "destructive" });
      return;
    }
    generateBriefMutation.mutate({
      targetKeyword: keyword,
      contentType,
      wordCountTarget: parseInt(wordCount),
      projectId
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Content Brief</CardTitle>
        <CardDescription>Create AI-powered content outlines optimized for SEO</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="keyword">Target Keyword</Label>
            <Input
              id="keyword"
              placeholder="e.g., best running shoes 2025"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              data-testid="input-target-keyword"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content-type">Content Type</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger id="content-type" data-testid="select-content-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blog_post">Blog Post</SelectItem>
                <SelectItem value="landing_page">Landing Page</SelectItem>
                <SelectItem value="product_page">Product Page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="word-count">Target Word Count</Label>
            <Input
              id="word-count"
              type="number"
              value={wordCount}
              onChange={(e) => setWordCount(e.target.value)}
              data-testid="input-word-count"
            />
          </div>
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={generateBriefMutation.isPending}
          data-testid="button-generate-brief"
        >
          {generateBriefMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Generate Brief
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function SavedBriefs({ briefs, isLoading, projectId }: { briefs: ContentBrief[], isLoading: boolean, projectId: string }) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/content/briefs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/briefs", projectId] });
      toast({ title: "Success", description: "Content brief deleted" });
    }
  });

  if (isLoading) {
    return <Card><CardContent className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>;
  }

  if (briefs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No content briefs yet. Generate your first one above!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Saved Content Briefs</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {briefs.map((brief) => (
          <Card key={brief.id} data-testid={`card-brief-${brief.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{brief.title}</CardTitle>
                  <CardDescription className="mt-1">
                    Keyword: {brief.targetKeyword} • {brief.wordCountTarget} words
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(brief.id)}
                  data-testid={`button-delete-brief-${brief.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant="secondary">{brief.contentType}</Badge>
                <div className="text-sm text-muted-foreground">
                  {Array.isArray(brief.outline) && brief.outline.length > 0 && (
                    <p>{brief.outline.length} sections outlined</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ContentScoringTool({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");

  const scoreMutation = useMutation({
    mutationFn: async (data: { url: string; content: string; targetKeyword: string; projectId: string }) => {
      return apiRequest("POST", "/api/content/score", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/scorecards", projectId] });
      toast({ title: "Success", description: "Content scored successfully" });
      setUrl("");
      setContent("");
      setTargetKeyword("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to score content",
        variant: "destructive" 
      });
    }
  });

  const handleScore = () => {
    if (!url.trim() || !content.trim() || !targetKeyword.trim()) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    scoreMutation.mutate({ url, content, targetKeyword, projectId });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Content</CardTitle>
        <CardDescription>Analyze existing content for SEO quality and readability</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="score-url">Content URL</Label>
            <Input
              id="score-url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              data-testid="input-score-url"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="score-keyword">Target Keyword</Label>
            <Input
              id="score-keyword"
              placeholder="main keyword"
              value={targetKeyword}
              onChange={(e) => setTargetKeyword(e.target.value)}
              data-testid="input-score-keyword"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="content-text">Content (HTML or Plain Text)</Label>
          <Textarea
            id="content-text"
            placeholder="Paste your content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            data-testid="textarea-content"
          />
        </div>
        <Button 
          onClick={handleScore} 
          disabled={scoreMutation.isPending}
          data-testid="button-score-content"
        >
          {scoreMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <BarChart3 className="mr-2 h-4 w-4" />
              Score Content
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function SavedScorecards({ scorecards, isLoading, projectId }: { scorecards: ContentScorecard[], isLoading: boolean, projectId: string }) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/content/scorecards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/scorecards", projectId] });
      toast({ title: "Success", description: "Scorecard deleted" });
    }
  });

  if (isLoading) {
    return <Card><CardContent className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>;
  }

  if (scorecards.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No content scorecards yet. Analyze your first content above!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Content Analysis History</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {scorecards.map((scorecard) => (
          <Card key={scorecard.id} data-testid={`card-scorecard-${scorecard.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg truncate">{scorecard.url}</CardTitle>
                  <CardDescription className="mt-1">
                    Keyword: {scorecard.targetKeyword}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(scorecard.id)}
                  data-testid={`button-delete-scorecard-${scorecard.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{scorecard.seoScore}</div>
                  <div className="text-xs text-muted-foreground">SEO Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{scorecard.readabilityScore}</div>
                  <div className="text-xs text-muted-foreground">Readability</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold">{scorecard.wordCount}</div>
                  <div className="text-xs text-muted-foreground">Words</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold">{scorecard.keywordDensity.toFixed(2)}%</div>
                  <div className="text-xs text-muted-foreground">Keyword Density</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SerpAnalysisTool() {
  const { toast } = useToast();
  const [keyword, setKeyword] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);

  const analyzeMutation = useMutation({
    mutationFn: async (data: { keyword: string; serpResults: any[] }) => {
      return apiRequest("POST", "/api/content/serp-analysis", data);
    },
    onSuccess: (data) => {
      setAnalysis(data);
      toast({ title: "Success", description: "SERP analysis complete" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to analyze SERP",
        variant: "destructive" 
      });
    }
  });

  const handleAnalyze = () => {
    if (!keyword.trim()) {
      toast({ title: "Error", description: "Please enter a keyword", variant: "destructive" });
      return;
    }
    // Mock SERP data for demo
    const mockSerpResults = Array.from({ length: 10 }, (_, i) => ({
      position: i + 1,
      title: `Result ${i + 1} for ${keyword}`,
      url: `https://example${i + 1}.com`,
      domain: `example${i + 1}.com`,
      snippet: `This is a sample snippet for result ${i + 1} about ${keyword}. It contains relevant information.`
    }));
    
    analyzeMutation.mutate({ keyword, serpResults: mockSerpResults });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>SERP Analysis</CardTitle>
          <CardDescription>Analyze top-ranking pages to identify content opportunities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="serp-keyword">Keyword to Analyze</Label>
              <Input
                id="serp-keyword"
                placeholder="e.g., digital marketing tips"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                data-testid="input-serp-keyword"
              />
            </div>
          </div>
          <Button 
            onClick={handleAnalyze} 
            disabled={analyzeMutation.isPending}
            data-testid="button-analyze-serp"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Analyze SERP
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Insights</h4>
              <p className="text-sm text-muted-foreground">{analysis.insights}</p>
            </div>
            {analysis.contentGaps && analysis.contentGaps.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Content Gaps</h4>
                <ul className="space-y-1">
                  {analysis.contentGaps.map((gap: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h4 className="font-semibold mb-2">Recommended Word Count</h4>
              <p className="text-sm text-muted-foreground">{analysis.recommendedWordCount} words</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ContentGapAnalysisTool({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<string>("");

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/content/gap-analysis", { projectId });
    },
    onSuccess: (data: any) => {
      setAnalysis(data.analysis);
      toast({ title: "Success", description: "Content gap analysis complete" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to analyze content gaps",
        variant: "destructive" 
      });
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Content Gap Analysis</CardTitle>
          <CardDescription>Identify content opportunities based on your keywords and competitors</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => analyzeMutation.mutate()} 
            disabled={analyzeMutation.isPending}
            data-testid="button-analyze-gaps"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Analyze Content Gaps
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Gap Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-sm">{analysis}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
