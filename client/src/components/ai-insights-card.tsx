import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Lightbulb } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface AIInsightsCardProps {
  projectId: string;
}

export function AIInsightsCard({ projectId }: AIInsightsCardProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/ai/insights", { projectId });
      const data = await res.json() as { insights: string[] };

      setInsights(data.insights);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI insights. Please try again.",
        variant: "destructive"
      });
      setInsights([]); // Clear insights on error
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate insights when component mounts or projectId changes
  useEffect(() => {
    generateInsights();
  }, [projectId]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Insights
        </CardTitle>
        <Button
          data-testid="button-generate-insights"
          size="sm"
          variant="ghost"
          onClick={generateInsights}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-4">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No insights available. Click refresh to try again.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {insights.map((insight, idx) => (
              <li key={idx} className="flex gap-2 text-sm">
                <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span data-testid={`text-insight-${idx}`}>{insight}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
