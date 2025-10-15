import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompetitorCardProps {
  domain: string;
  domainScore: number;
  topKeyword: string | null;
  estimatedTraffic: number;
  commonKeywords: number;
}

export function CompetitorCard({ 
  domain, 
  domainScore, 
  topKeyword, 
  estimatedTraffic, 
  commonKeywords 
}: CompetitorCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-chart-2 text-white";
    if (score >= 50) return "bg-chart-3 text-white";
    return "bg-destructive text-white";
  };

  return (
    <Card className="hover-elevate" data-testid={`competitor-${domain}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">{domain}</h3>
            <p className="text-sm text-muted-foreground">Competitor</p>
          </div>
          <Badge className={getScoreColor(domainScore)}>
            {domainScore}/100
          </Badge>
        </div>
        <div className="space-y-3">
          {topKeyword && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Top Keyword:</span>
              <span className="font-medium">{topKeyword}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Est. Traffic:</span>
            <span className="font-medium flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-chart-1" />
              {estimatedTraffic.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Common Keywords:</span>
            <span className="font-medium">{commonKeywords}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full mt-4" data-testid={`button-view-${domain}`}>
          View Details <ExternalLink className="ml-2 h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}
