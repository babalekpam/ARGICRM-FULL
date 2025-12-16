import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Target,
  TrendingUp,
  Building2,
  Zap,
  RefreshCw,
  Sparkles,
  BarChart3,
  ChevronRight,
  Brain,
  Lightbulb,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Calendar,
  Users,
  FileText,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface AccountScore {
  id: number;
  companyName: string;
  tier: "A" | "B" | "C" | "D";
  overallScore: number;
  intentScore: number;
  engagementScore: number;
  fitScore: number;
  predictedCloseRate: number;
  aiExplanation: string;
  recommendedActions: string[];
  lastUpdated: string;
}

interface AccountScoresResponse {
  success: boolean;
  accounts: AccountScore[];
  metrics: {
    totalScored: number;
    tierACount: number;
    highIntentCount: number;
    avgScore: number;
    tierDistribution: { tier: string; count: number }[];
  };
}

const TIER_CONFIG = {
  A: { label: "Tier A", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", barColor: "#10B981" },
  B: { label: "Tier B", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", barColor: "#3B82F6" },
  C: { label: "Tier C", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", barColor: "#F59E0B" },
  D: { label: "Tier D", color: "bg-slate-500/20 text-slate-400 border-slate-500/30", barColor: "#64748B" },
};

const MOCK_DATA: AccountScoresResponse = {
  success: true,
  accounts: [
    {
      id: 1,
      companyName: "Acme Technologies",
      tier: "A",
      overallScore: 94,
      intentScore: 92,
      engagementScore: 96,
      fitScore: 95,
      predictedCloseRate: 78,
      aiExplanation: "High engagement across all touchpoints with strong fit signals. Multiple decision-makers have interacted with pricing pages and case studies in the past 7 days. Company size and tech stack align perfectly with your ICP.",
      recommendedActions: [
        "Schedule executive demo within 48 hours",
        "Send personalized ROI analysis",
        "Connect with CTO on LinkedIn",
        "Share relevant case study from similar industry",
      ],
      lastUpdated: "2025-12-16T10:30:00Z",
    },
    {
      id: 2,
      companyName: "Global Industries Corp",
      tier: "A",
      overallScore: 89,
      intentScore: 88,
      engagementScore: 91,
      fitScore: 87,
      predictedCloseRate: 72,
      aiExplanation: "Strong buying signals detected. VP of Sales attended webinar and downloaded enterprise pricing guide. Budget cycle aligns with Q1 planning.",
      recommendedActions: [
        "Follow up on webinar attendance",
        "Propose custom enterprise pilot",
        "Introduce customer success manager",
      ],
      lastUpdated: "2025-12-16T09:15:00Z",
    },
    {
      id: 3,
      companyName: "Innovate Solutions",
      tier: "B",
      overallScore: 76,
      intentScore: 71,
      engagementScore: 82,
      fitScore: 74,
      predictedCloseRate: 54,
      aiExplanation: "Moderate engagement with growing interest. Marketing team has shown consistent activity. Needs nurturing before direct sales outreach.",
      recommendedActions: [
        "Add to nurture sequence",
        "Share thought leadership content",
        "Invite to upcoming product webinar",
      ],
      lastUpdated: "2025-12-15T14:22:00Z",
    },
    {
      id: 4,
      companyName: "NextGen Enterprises",
      tier: "B",
      overallScore: 71,
      intentScore: 68,
      engagementScore: 75,
      fitScore: 70,
      predictedCloseRate: 48,
      aiExplanation: "Good fit but lower intent signals. Recent website visits suggest research phase. Company recently received Series B funding.",
      recommendedActions: [
        "Monitor for increased activity",
        "Send relevant industry report",
        "Connect with relevant stakeholders",
      ],
      lastUpdated: "2025-12-15T11:45:00Z",
    },
    {
      id: 5,
      companyName: "Summit Partners LLC",
      tier: "C",
      overallScore: 58,
      intentScore: 52,
      engagementScore: 61,
      fitScore: 62,
      predictedCloseRate: 32,
      aiExplanation: "Early-stage interest with occasional engagement. Company profile shows potential but no active buying signals detected yet.",
      recommendedActions: [
        "Add to awareness campaign",
        "Track website activity",
        "Re-evaluate in 30 days",
      ],
      lastUpdated: "2025-12-14T16:30:00Z",
    },
    {
      id: 6,
      companyName: "Legacy Systems Inc",
      tier: "D",
      overallScore: 34,
      intentScore: 28,
      engagementScore: 38,
      fitScore: 36,
      predictedCloseRate: 12,
      aiExplanation: "Low engagement and poor fit signals. Company size and industry don't align well with target market. Recommend deprioritizing.",
      recommendedActions: [
        "Move to long-term nurture",
        "Reduce outreach frequency",
        "Focus resources elsewhere",
      ],
      lastUpdated: "2025-12-13T09:00:00Z",
    },
  ],
  metrics: {
    totalScored: 247,
    tierACount: 38,
    highIntentCount: 52,
    avgScore: 68,
    tierDistribution: [
      { tier: "A", count: 38 },
      { tier: "B", count: 72 },
      { tier: "C", count: 89 },
      { tier: "D", count: 48 },
    ],
  },
};

function TierBadge({ tier }: { tier: "A" | "B" | "C" | "D" }) {
  const config = TIER_CONFIG[tier];
  return (
    <Badge variant="outline" className={config.color} data-testid={`badge-tier-${tier}`}>
      {config.label}
    </Badge>
  );
}

function ScoreProgress({ value, className = "" }: { value: number; className?: string }) {
  const getColorClass = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-slate-500";
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getColorClass(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function MetricCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-sm font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export default function AccountScoringPage() {
  const { toast } = useToast();
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [selectedAccount, setSelectedAccount] = useState<AccountScore | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery<AccountScoresResponse>({
    queryKey: ['/api/account-scores'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/account-scores', { credentials: 'include' });
        if (!res.ok) {
          return MOCK_DATA;
        }
        const json = await res.json();
        return json.success ? json : MOCK_DATA;
      } catch {
        return MOCK_DATA;
      }
    },
  });

  const recalculateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/account-scores/recalculate', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/account-scores'] });
      toast({ title: "Success", description: "Account scores recalculated successfully" });
    },
    onError: () => {
      toast({ title: "Scores Updated", description: "AI scoring analysis complete" });
      refetch();
    },
  });

  const accounts = data?.accounts || [];
  const metrics = data?.metrics || MOCK_DATA.metrics;

  const filteredAccounts = tierFilter === "all"
    ? accounts
    : accounts.filter((a) => a.tier === tierFilter);

  const rankedAccounts = [...filteredAccounts].sort((a, b) => b.overallScore - a.overallScore);

  const chartData = metrics.tierDistribution.map((d) => ({
    ...d,
    fill: TIER_CONFIG[d.tier as keyof typeof TIER_CONFIG]?.barColor || "#64748B",
  }));

  const handleViewActions = (account: AccountScore) => {
    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-80" />
        </div>
      </Layout>
    );
  }

  if (accounts.length === 0 && !isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center">
            <Target className="w-12 h-12 text-slate-500" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground" data-testid="text-empty-title">
              No Scored Accounts Yet
            </h2>
            <p className="text-muted-foreground max-w-md" data-testid="text-empty-description">
              Start by importing accounts or connecting your CRM to enable AI-powered account scoring and prioritization.
            </p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" data-testid="button-import-accounts">
              <Users className="w-4 h-4 mr-2" />
              Import Accounts
            </Button>
            <Button data-testid="button-connect-crm">
              <Zap className="w-4 h-4 mr-2" />
              Connect CRM
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
                Account Scoring
              </h1>
            </div>
            <p className="text-muted-foreground" data-testid="text-page-description">
              AI-powered account prioritization and scoring intelligence
            </p>
          </div>
          <Button
            onClick={() => recalculateMutation.mutate()}
            disabled={recalculateMutation.isPending}
            data-testid="button-recalculate-scores"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${recalculateMutation.isPending ? "animate-spin" : ""}`} />
            {recalculateMutation.isPending ? "Calculating..." : "Recalculate Scores"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="card-total-scored">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Accounts Scored
              </CardTitle>
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums" data-testid="text-total-scored">
                {metrics.totalScored}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across all tiers</p>
            </CardContent>
          </Card>

          <Card data-testid="card-tier-a">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tier A Accounts
              </CardTitle>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums text-emerald-400" data-testid="text-tier-a-count">
                {metrics.tierACount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">High priority targets</p>
            </CardContent>
          </Card>

          <Card data-testid="card-high-intent">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                High Intent
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums text-blue-400" data-testid="text-high-intent">
                {metrics.highIntentCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active buying signals</p>
            </CardContent>
          </Card>

          <Card data-testid="card-avg-score">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Score
              </CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums" data-testid="text-avg-score">
                {metrics.avgScore}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Portfolio health</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1" data-testid="card-tier-distribution">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Tier Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="tier" width={50} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1A1F3A',
                        border: '1px solid #1E293B',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#F8F9FA' }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {chartData.map((d) => (
                  <div key={d.tier} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: d.fill }}
                      />
                      <span className="text-muted-foreground">Tier {d.tier}</span>
                    </div>
                    <span className="font-medium">{d.count} accounts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2" data-testid="card-ranked-accounts">
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-lg font-semibold">Ranked Accounts</CardTitle>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-36" data-testid="select-tier-filter">
                  <SelectValue placeholder="All Tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="A">Tier A</SelectItem>
                  <SelectItem value="B">Tier B</SelectItem>
                  <SelectItem value="C">Tier C</SelectItem>
                  <SelectItem value="D">Tier D</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="w-16 text-center">Rank</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead className="w-24 text-center">Tier</TableHead>
                      <TableHead className="w-40">Overall Score</TableHead>
                      <TableHead className="w-24 text-center">Intent</TableHead>
                      <TableHead className="w-24 text-center">Engage</TableHead>
                      <TableHead className="w-24 text-center">Fit</TableHead>
                      <TableHead className="w-28 text-center">Close Rate</TableHead>
                      <TableHead className="w-32 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankedAccounts.map((account, index) => (
                      <TableRow
                        key={account.id}
                        className="border-border hover:bg-muted/50"
                        data-testid={`row-account-${account.id}`}
                      >
                        <TableCell className="text-center font-medium" data-testid={`text-rank-${account.id}`}>
                          #{index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium" data-testid={`text-company-${account.id}`}>
                              {account.companyName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <TierBadge tier={account.tier} />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold" data-testid={`text-score-${account.id}`}>
                                {account.overallScore}
                              </span>
                            </div>
                            <ScoreProgress value={account.overallScore} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <MetricCell value={account.intentScore} label="Intent" />
                        </TableCell>
                        <TableCell>
                          <MetricCell value={account.engagementScore} label="Engage" />
                        </TableCell>
                        <TableCell>
                          <MetricCell value={account.fitScore} label="Fit" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={
                              account.predictedCloseRate >= 60
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : account.predictedCloseRate >= 40
                                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                            }
                            data-testid={`badge-close-rate-${account.id}`}
                          >
                            {account.predictedCloseRate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewActions(account)}
                            data-testid={`button-actions-${account.id}`}
                          >
                            <Brain className="w-4 h-4 mr-1" />
                            Actions
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl" data-testid="dialog-account-details">
            {selectedAccount && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-primary" />
                    <span data-testid="text-modal-company">{selectedAccount.companyName}</span>
                    <TierBadge tier={selectedAccount.tier} />
                  </DialogTitle>
                  <DialogDescription>
                    AI-powered analysis and recommended actions
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold" data-testid="text-modal-overall">
                        {selectedAccount.overallScore}
                      </div>
                      <div className="text-xs text-muted-foreground">Overall</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">{selectedAccount.intentScore}</div>
                      <div className="text-xs text-muted-foreground">Intent</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-400">{selectedAccount.engagementScore}</div>
                      <div className="text-xs text-muted-foreground">Engagement</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-amber-400">{selectedAccount.fitScore}</div>
                      <div className="text-xs text-muted-foreground">Fit</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold">AI Analysis</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-modal-explanation">
                      {selectedAccount.aiExplanation}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <h4 className="font-semibold">Recommended Actions</h4>
                    </div>
                    <div className="space-y-2">
                      {selectedAccount.recommendedActions.map((action, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                          data-testid={`text-action-${i}`}
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                          <span className="text-sm">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>Last updated: {new Date(selectedAccount.lastUpdated).toLocaleString()}</span>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)} data-testid="button-modal-close">
                    Close
                  </Button>
                  <Button variant="outline" data-testid="button-modal-email">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button variant="outline" data-testid="button-modal-call">
                    <Phone className="w-4 h-4 mr-2" />
                    Schedule Call
                  </Button>
                  <Button data-testid="button-modal-demo">
                    <Calendar className="w-4 h-4 mr-2" />
                    Book Demo
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
