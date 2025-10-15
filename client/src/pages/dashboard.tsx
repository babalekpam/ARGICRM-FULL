import { useQuery } from "@tanstack/react-query";
import { Project, KeywordRanking, TrafficData, Competitor, SeoIssue } from "@shared/schema";
import { MetricCard } from "@/components/metric-card";
import { SeoScoreCard } from "@/components/seo-score-card";
import { KeywordRankingChart } from "@/components/keyword-ranking-chart";
import { TrafficChart } from "@/components/traffic-chart";
import { BacklinksOverview } from "@/components/backlinks-overview";
import { CompetitorCard } from "@/components/competitor-card";
import { SeoIssuesList } from "@/components/seo-issues-list";
import { BarChart3, TrendingUp, Link as LinkIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface DashboardData {
  project: Project;
  keywordRanking: KeywordRanking;
  trafficData: TrafficData[];
  competitors: Competitor[];
  seoIssues: SeoIssue[];
  backlinkGrowth: Array<{ date: string; backlinks: number }>;
}

interface DashboardProps {
  projectId: string;
}

export default function Dashboard({ projectId }: DashboardProps) {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No Project Selected</h2>
          <p className="text-muted-foreground mb-4">Create a project to get started</p>
          <Button data-testid="button-create-project">
            <Plus className="mr-2 h-4 w-4" /> Create Project
          </Button>
        </div>
      </div>
    );
  }

  const { project, keywordRanking, trafficData, competitors, seoIssues, backlinkGrowth } = data;

  return (
    <div className="p-6 space-y-6" data-testid="dashboard-page">
      {/* Project Overview */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
        <p className="text-muted-foreground">{project.domain}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="SEO Score"
          value={project.seoScore}
          icon={BarChart3}
          trend={{ value: 5, isPositive: true }}
        />
        <MetricCard
          title="Organic Traffic"
          value={project.organicTraffic.toLocaleString()}
          icon={TrendingUp}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Total Backlinks"
          value={project.totalBacklinks.toLocaleString()}
          icon={LinkIcon}
          trend={{ value: 8, isPositive: true }}
        />
        <MetricCard
          title="Keywords Tracked"
          value={project.totalKeywords}
          icon={Search}
        />
      </div>

      {/* SEO Health Score */}
      <SeoScoreCard score={project.seoScore} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <KeywordRankingChart data={keywordRanking} />
        <TrafficChart data={trafficData} />
      </div>

      {/* Backlinks Overview */}
      <BacklinksOverview
        totalBacklinks={project.totalBacklinks}
        referringDomains={project.referringDomains}
        growthData={backlinkGrowth}
      />

      {/* SEO Issues */}
      <SeoIssuesList issues={seoIssues} />

      {/* Competitors */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Competitors</h2>
            <p className="text-sm text-muted-foreground">Track up to 3 competitors</p>
          </div>
          <Button variant="outline" data-testid="button-add-competitor">
            <Plus className="mr-2 h-4 w-4" /> Add Competitor
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitors.map((competitor) => (
            <CompetitorCard key={competitor.id} {...competitor} />
          ))}
        </div>
      </div>
    </div>
  );
}
