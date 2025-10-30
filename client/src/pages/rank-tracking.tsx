import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KeywordRankHistory, CompetitorRankSnapshot, Keyword } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSearch } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface RankTrackingProps {
  projectId?: string;
}

export default function RankTracking({ projectId: propProjectId }: RankTrackingProps = {}) {
  const { user } = useAuth();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const urlProjectId = params.get('projectId');
  
  const { data: projects } = useQuery({
    queryKey: ['/api/projects'],
    enabled: !!user && !propProjectId && !urlProjectId
  });
  
  const projectId = propProjectId || urlProjectId || (Array.isArray(projects) && projects.length > 0 ? String(projects[0].id) : null);
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);

  const { data: keywords } = useQuery<Keyword[]>({
    queryKey: ["/api/keywords", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const res = await fetch(`/api/keywords?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch keywords");
      return res.json();
    },
  });

  const { data: rankHistory, isLoading: isLoadingHistory } = useQuery<KeywordRankHistory[]>({
    queryKey: ["/api/rank-tracking/history", projectId, selectedKeywordId],
    enabled: !!projectId,
    queryFn: async () => {
      const url = selectedKeywordId
        ? `/api/rank-tracking/history?projectId=${projectId}&keywordId=${selectedKeywordId}`
        : `/api/rank-tracking/history?projectId=${projectId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch rank history");
      return res.json();
    },
  });

  const { data: competitorRanks } = useQuery<CompetitorRankSnapshot[]>({
    queryKey: ["/api/rank-tracking/competitor-ranks", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const res = await fetch(`/api/rank-tracking/competitor-ranks?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch competitor ranks");
      return res.json();
    },
  });

  const getPositionChange = (history: KeywordRankHistory[]) => {
    if (!history || history.length < 2) return 0;
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    return previous.position - latest.position;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-4 w-4 text-chart-2" data-testid="icon-rank-up" />;
    if (change < 0) return <ArrowDown className="h-4 w-4 text-destructive" data-testid="icon-rank-down" />;
    return <Minus className="h-4 w-4 text-muted-foreground" data-testid="icon-rank-stable" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-chart-2";
    if (change < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const groupedRankHistory = rankHistory?.reduce((acc, item) => {
    if (!acc[item.keywordId]) {
      acc[item.keywordId] = [];
    }
    acc[item.keywordId].push(item);
    return acc;
  }, {} as Record<string, KeywordRankHistory[]>);

  const keywordsWithChanges = keywords?.map(keyword => {
    const history = groupedRankHistory?.[keyword.id] || [];
    const change = getPositionChange(history);
    return { ...keyword, change, history };
  }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  const topMovers = keywordsWithChanges?.slice(0, 5) || [];

  const averagePosition = keywords && keywords.length > 0
    ? keywords.reduce((sum, k) => sum + (k.position || 100), 0) / keywords.length
    : 0;

  const chartData = selectedKeywordId && groupedRankHistory?.[selectedKeywordId]
    ? groupedRankHistory[selectedKeywordId].map(item => ({
        date: item.date.substring(5), // Format: MM-DD
        position: item.position,
      }))
    : [];

  if (isLoadingHistory) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-32 bg-muted rounded-lg" />
          </div>
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="rank-tracking-page">
      <div>
        <h1 className="text-3xl font-bold mb-2">Rank Tracking</h1>
        <p className="text-muted-foreground">Monitor your keyword rankings and track position changes over time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="metric-total-keywords">{keywords?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Keywords tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="metric-avg-position">
              {averagePosition ? Math.round(averagePosition) : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all keywords</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top 10 Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono" data-testid="metric-top-10">
              {keywords?.filter(k => k.position && k.position <= 10).length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ranking in top 10</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords" data-testid="tab-keywords">Keyword Rankings</TabsTrigger>
          <TabsTrigger value="competitors" data-testid="tab-competitors">Competitor Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Biggest Movers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Current Position</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>Search Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topMovers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No ranking data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    topMovers.map((keyword) => (
                      <TableRow key={keyword.id} data-testid={`mover-${keyword.id}`}>
                        <TableCell className="font-medium">{keyword.keyword}</TableCell>
                        <TableCell>
                          {keyword.position ? (
                            <Badge variant="secondary" data-testid={`position-${keyword.id}`}>#{keyword.position}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1 ${getChangeColor(keyword.change)}`}>
                            {getChangeIcon(keyword.change)}
                            <span className="font-mono" data-testid={`change-${keyword.id}`}>
                              {keyword.change > 0 ? `+${keyword.change}` : keyword.change}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">{keyword.searchVolume.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ranking History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Keyword</label>
                <select
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  value={selectedKeywordId || ""}
                  onChange={(e) => setSelectedKeywordId(e.target.value || null)}
                  data-testid="select-keyword"
                >
                  <option value="">All Keywords</option>
                  {keywords?.map((keyword) => (
                    <option key={keyword.id} value={keyword.id}>
                      {keyword.keyword}
                    </option>
                  ))}
                </select>
              </div>

              {chartData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis reversed domain={[1, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="position"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  {selectedKeywordId ? "No ranking data available for this keyword" : "Select a keyword to view ranking history"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Competitor</TableHead>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!competitorRanks || competitorRanks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No competitor ranking data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    competitorRanks.slice(0, 10).map((rank) => (
                      <TableRow key={rank.id} data-testid={`competitor-rank-${rank.id}`}>
                        <TableCell className="font-medium">{rank.competitorId}</TableCell>
                        <TableCell>{rank.keywordId}</TableCell>
                        <TableCell>
                          <Badge variant="outline" data-testid={`competitor-position-${rank.id}`}>#{rank.position}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{rank.date}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
