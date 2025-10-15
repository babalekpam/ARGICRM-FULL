import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface SeoScoreCardProps {
  score: number;
}

export function SeoScoreCard({ score }: SeoScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-chart-2";
    if (score >= 50) return "text-chart-3";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return "Good";
    if (score >= 50) return "Needs Improvement";
    return "Poor";
  };

  const percentage = score;
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="hover-elevate">
      <CardHeader>
        <CardTitle>SEO Health Score</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="relative">
            <svg className="h-32 w-32 -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="64"
                cy="64"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className={getScoreColor(score)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold font-mono ${getScoreColor(score)}`} data-testid="seo-score">
                {score}
              </span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
          <div>
            <p className="text-lg font-semibold">{getScoreLabel(score)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your website's overall SEO health
            </p>
            <Link href="/seo-audit">
              <Button className="mt-4" data-testid="button-improve-score">
                Improve Score <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
