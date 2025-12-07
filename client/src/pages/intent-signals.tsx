import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Flame, 
  Thermometer, 
  Snowflake,
  Zap,
  Search,
  RefreshCw,
  Eye,
  Mail,
  MousePointer,
  Globe,
  FileText,
  Calendar,
  Users,
  Building2,
  Activity,
  BarChart3,
  Clock
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { IntentScore, Contact, Account, EngagementEvent } from "@shared/schema";

interface IntentScoreWithRelations extends IntentScore {
  contact?: Contact | null;
  account?: Account | null;
  tier: string;
}

interface IntentMetrics {
  cold: number;
  warm: number;
  hot: number;
  sizzling: number;
  averageScore: number;
  trendingUp: number;
}

interface IntentScoresResponse {
  success: boolean;
  scores: IntentScoreWithRelations[];
  total: number;
  metrics: IntentMetrics;
}

interface TrendingResponse {
  success: boolean;
  trending: IntentScoreWithRelations[];
  recentActivity: (EngagementEvent & { contact?: Contact | null })[];
  total: number;
}

const TIER_COLORS = {
  cold: "#3B82F6",
  warm: "#F59E0B", 
  hot: "#EF4444",
  sizzling: "#A855F7",
};

const TIER_CONFIG = {
  cold: { label: "Cold", range: "0-25", icon: Snowflake, color: "text-blue-400 bg-blue-400/10" },
  warm: { label: "Warm", range: "26-50", icon: Thermometer, color: "text-yellow-400 bg-yellow-400/10" },
  hot: { label: "Hot", range: "51-75", icon: Flame, color: "text-red-400 bg-red-400/10" },
  sizzling: { label: "Sizzling", range: "76-100", icon: Zap, color: "text-purple-400 bg-purple-400/10" },
};

const EVENT_ICONS: Record<string, any> = {
  email_open: Mail,
  email_click: MousePointer,
  page_view: Globe,
  website_visit: Globe,
  form_submit: FileText,
  form_submission: FileText,
  content_download: FileText,
  download: FileText,
  demo_request: Calendar,
  meeting_booked: Calendar,
  meeting_scheduled: Calendar,
};

function getTrendIcon(trend: string | null | undefined) {
  if (trend === "rising") return <TrendingUp className="w-4 h-4 text-green-400" />;
  if (trend === "declining") return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

function getTierBadge(tier: string) {
  const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.cold;
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={config.color}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}

function formatTimeAgo(dateStr: string | Date | null | undefined) {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function IntentSignalsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [trendFilter, setTrendFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScore, setSelectedScore] = useState<IntentScoreWithRelations | null>(null);
  const { toast } = useToast();

  const { data: scoresData, isLoading: isLoadingScores, refetch: refetchScores } = useQuery<IntentScoresResponse>({
    queryKey: ['/api/intent/scores', tierFilter, trendFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (tierFilter !== "all") params.append("tier", tierFilter);
      if (trendFilter !== "all") params.append("trend", trendFilter);
      const res = await fetch(`/api/intent/scores?${params}`, { credentials: 'include' });
      return res.json();
    },
  });

  const { data: trendingData, isLoading: isLoadingTrending } = useQuery<TrendingResponse>({
    queryKey: ['/api/intent/trending'],
  });

  const batchCalculateMutation = useMutation({
    mutationFn: async () => {
      const contactIds = scoresData?.scores
        .filter(s => s.contactId)
        .map(s => s.contactId)
        .slice(0, 50);
      return apiRequest('POST', '/api/intent/calculate-batch', { contactIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/intent/scores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/intent/trending'] });
      toast({ title: "Success", description: "Intent scores recalculated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const metrics = scoresData?.metrics || { cold: 0, warm: 0, hot: 0, sizzling: 0, averageScore: 0, trendingUp: 0 };
  const scores = scoresData?.scores || [];
  const trending = trendingData?.trending || [];
  const recentActivity = trendingData?.recentActivity || [];

  const filteredScores = scores.filter(s => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const contactName = (s.contact?.name || '').toLowerCase();
    const accountName = (s.account?.name || '').toLowerCase();
    return contactName.includes(query) || accountName.includes(query);
  });

  const heatmapData = [
    { name: "Cold", value: metrics.cold, color: TIER_COLORS.cold },
    { name: "Warm", value: metrics.warm, color: TIER_COLORS.warm },
    { name: "Hot", value: metrics.hot, color: TIER_COLORS.hot },
    { name: "Sizzling", value: metrics.sizzling, color: TIER_COLORS.sizzling },
  ];

  const breakdownData = Object.entries(
    scores.reduce((acc, s) => {
      const breakdown = s.scoreBreakdown || {};
      Object.entries(breakdown).forEach(([key, val]) => {
        acc[key] = (acc[key] || 0) + (val as number);
      });
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name: name.replace(/([A-Z])/g, ' $1').trim(),
    value,
  }));

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Intent Signals</h1>
            <p className="text-muted-foreground">Track buyer intent and engagement signals across your accounts</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => refetchScores()}
              data-testid="button-refresh"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => batchCalculateMutation.mutate()}
              disabled={batchCalculateMutation.isPending}
              data-testid="button-recalculate"
            >
              {batchCalculateMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Activity className="w-4 h-4 mr-2" />
              )}
              Recalculate Scores
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hot Leads</p>
                  <p className="text-4xl font-bold tabular-nums mt-1" data-testid="text-hot-leads">
                    {isLoadingScores ? <Skeleton className="h-10 w-16" /> : metrics.hot + metrics.sizzling}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-400/10">
                  <Flame className="w-6 h-6 text-red-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Score 51+</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Trending Up</p>
                  <p className="text-4xl font-bold tabular-nums mt-1" data-testid="text-trending-up">
                    {isLoadingScores ? <Skeleton className="h-10 w-16" /> : metrics.trendingUp}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-400/10">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Rising engagement</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Average Score</p>
                  <p className="text-4xl font-bold tabular-nums mt-1" data-testid="text-avg-score">
                    {isLoadingScores ? <Skeleton className="h-10 w-16" /> : metrics.averageScore}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Across all accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Tracked</p>
                  <p className="text-4xl font-bold tabular-nums mt-1" data-testid="text-total-tracked">
                    {isLoadingScores ? <Skeleton className="h-10 w-16" /> : scoresData?.total || 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-400/10">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Contacts & accounts</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Intent Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={heatmapData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {heatmapData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#11152B', 
                        border: '1px solid #1E293B',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {Object.entries(TIER_CONFIG).map(([tier, config]) => (
                  <div 
                    key={tier} 
                    className={`p-3 rounded-lg ${config.color} cursor-pointer hover-elevate`}
                    onClick={() => setTierFilter(tier)}
                    data-testid={`button-filter-${tier}`}
                  >
                    <div className="flex items-center gap-2">
                      <config.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{config.label}</span>
                    </div>
                    <p className="text-xs opacity-70 mt-1">{config.range} points</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakdownData} layout="vertical">
                    <XAxis type="number" stroke="#64748B" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={12} width={120} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#11152B', 
                        border: '1px solid #1E293B',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" fill="#4C6EF5" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="overview" data-testid="tab-overview">All Scores</TabsTrigger>
              <TabsTrigger value="trending" data-testid="tab-trending">Trending</TabsTrigger>
              <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts or accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                  data-testid="input-search"
                />
              </div>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-32" data-testid="select-tier">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="sizzling">Sizzling</SelectItem>
                </SelectContent>
              </Select>
              <Select value={trendFilter} onValueChange={setTrendFilter}>
                <SelectTrigger className="w-32" data-testid="select-trend">
                  <SelectValue placeholder="Trend" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trends</SelectItem>
                  <SelectItem value="rising">Rising</SelectItem>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="declining">Declining</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="overview">
            <Card>
              <CardContent className="p-0">
                {isLoadingScores ? (
                  <div className="p-6 space-y-4">
                    {[1,2,3,4,5].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredScores.length === 0 ? (
                  <div className="p-12 text-center">
                    <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Intent Scores Found</h3>
                    <p className="text-muted-foreground mt-1">Start tracking engagement to see intent signals</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredScores.map((score) => (
                      <div 
                        key={score.id}
                        className="px-6 py-4 flex items-center justify-between hover-elevate cursor-pointer"
                        onClick={() => setSelectedScore(score)}
                        data-testid={`row-score-${score.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            {score.contact ? (
                              <Users className="w-5 h-5 text-primary" />
                            ) : (
                              <Building2 className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {score.contact 
                                ? score.contact.name || 'Unknown Contact'
                                : score.account?.name || 'Unknown Account'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {score.contact?.email || score.account?.industry || 'No details'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold tabular-nums">{score.overallScore || 0}</span>
                              {getTrendIcon(score.trend)}
                            </div>
                            <p className="text-xs text-muted-foreground">{score.signalCount || 0} signals</p>
                          </div>
                          {getTierBadge(score.tier)}
                          <Button variant="ghost" size="icon" data-testid={`button-view-${score.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trending">
            <Card>
              <CardContent className="p-0">
                {isLoadingTrending ? (
                  <div className="p-6 space-y-4">
                    {[1,2,3,4,5].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : trending.length === 0 ? (
                  <div className="p-12 text-center">
                    <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Trending Accounts</h3>
                    <p className="text-muted-foreground mt-1">Accounts with rising engagement will appear here</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {trending.map((score) => (
                      <div 
                        key={score.id}
                        className="px-6 py-4 flex items-center justify-between hover-elevate cursor-pointer"
                        data-testid={`row-trending-${score.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-green-400/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {score.contact 
                                ? score.contact.name || 'Unknown Contact'
                                : score.account?.name || 'Unknown Account'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {score.contact?.company || score.account?.industry || 'No details'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold tabular-nums text-green-400">{score.overallScore || 0}</span>
                              <TrendingUp className="w-4 h-4 text-green-400" />
                            </div>
                            <p className="text-xs text-muted-foreground">{score.signalCount || 0} signals</p>
                          </div>
                          {getTierBadge(score.tier)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Recent Signals</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingTrending ? (
                  <div className="space-y-4">
                    {[1,2,3,4,5].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="p-12 text-center">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No Recent Activity</h3>
                    <p className="text-muted-foreground mt-1">Engagement events will appear here</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
                    <div className="space-y-6">
                      {recentActivity.map((event, idx) => {
                        const Icon = EVENT_ICONS[event.eventType] || Activity;
                        return (
                          <div key={event.id || idx} className="relative flex items-start gap-4 pl-12" data-testid={`timeline-event-${idx}`}>
                            <div className="absolute left-4 w-5 h-5 rounded-full bg-card border-2 border-primary flex items-center justify-center">
                              <Icon className="w-3 h-3 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium">
                                  {event.eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {formatTimeAgo(event.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {event.contact 
                                  ? event.contact.name || 'Unknown contact'
                                  : 'Unknown contact'}
                              </p>
                              {event.metadata && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {(event.metadata as any)?.url || (event.metadata as any)?.pageTitle || ''}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="shrink-0">
                              +{event.score || 1} pts
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
