import { useSearch } from "wouter";
import { AIAssistant } from "@/components/ai-assistant";
import { AIInsightsCard } from "@/components/ai-insights-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AIAssistantPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const projectId = params.get("projectId") || "1";
  const [analysis, setAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const analyzeKeywords = async () => {
    setIsAnalyzing(true);
    try {
      const res = await apiRequest("POST", "/api/ai/analyze-keywords", { projectId });
      const data = await res.json() as { analysis: string };
      setAnalysis(data.analysis);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze keywords",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeCompetitors = async () => {
    setIsAnalyzing(true);
    try {
      const res = await apiRequest("POST", "/api/ai/analyze-competitors", { projectId });
      const data = await res.json() as { analysis: string };
      setAnalysis(data.analysis);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze competitors",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const prioritizeIssues = async () => {
    setIsAnalyzing(true);
    try {
      const res = await apiRequest("POST", "/api/ai/prioritize-issues", { projectId });
      const data = await res.json() as { analysis: string };
      setAnalysis(data.analysis);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to prioritize issues",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI SEO Assistant
        </h1>
        <p className="text-muted-foreground mt-1">
          Get intelligent insights and recommendations powered by advanced AI
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-1">
          <AIInsightsCard projectId={projectId} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">AI Analysis Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              data-testid="button-analyze-keywords"
              variant="outline"
              className="w-full justify-start"
              onClick={analyzeKeywords}
              disabled={isAnalyzing}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Analyze Keywords Strategy
            </Button>
            <Button
              data-testid="button-analyze-competitors"
              variant="outline"
              className="w-full justify-start"
              onClick={analyzeCompetitors}
              disabled={isAnalyzing}
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Analyze Competitors
            </Button>
            <Button
              data-testid="button-prioritize-issues"
              variant="outline"
              className="w-full justify-start"
              onClick={prioritizeIssues}
              disabled={isAnalyzing}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Prioritize SEO Issues
            </Button>
          </CardContent>
        </Card>
      </div>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap" data-testid="text-analysis-result">{analysis}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="h-[500px]">
        <AIAssistant projectId={projectId} variant="full" />
      </div>
    </div>
  );
}
