import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/layout";
import { 
  Activity,
  AlertTriangle,
  CheckCircle2,
  Users,
  Building2,
  UserCheck,
  DollarSign,
  Mail,
  Phone,
  Copy,
  Clock,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Database,
  TrendingUp,
  Shield
} from "lucide-react";

interface DataHealthScore {
  overall: number;
  contacts: number;
  accounts: number;
  leads: number;
  deals: number;
}

interface DataHealthMetrics {
  totalRecords: number;
  missingEmails: number;
  missingPhones: number;
  duplicateRecords: number;
  staleRecords: number;
  enrichmentOpportunities: number;
}

interface DataHealthSuggestion {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  impact: string;
  actionLabel: string;
}

interface DataHealthData {
  scores: DataHealthScore;
  metrics: DataHealthMetrics;
  suggestions: DataHealthSuggestion[];
  lastAuditDate: string | null;
  isNewAccount: boolean;
}

function CircularProgress({ value, size = 200, strokeWidth = 12 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  const getColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };
  
  return (
    <div className="relative inline-flex items-center justify-center" data-testid="circular-progress">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`transition-all duration-1000 ease-out ${getColor(value)}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold tracking-tight" data-testid="text-overall-score">{value}</span>
        <span className="text-sm text-muted-foreground font-medium">out of 100</span>
      </div>
    </div>
  );
}

function ScoreCard({ 
  title, 
  score, 
  icon: Icon, 
  testId 
}: { 
  title: string; 
  score: number; 
  icon: React.ElementType;
  testId: string;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <Card data-testid={testId}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted/50">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className={`text-2xl font-bold ${getScoreColor(score)}`} data-testid={`${testId}-value`}>
                {score}%
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-muted/30 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor(score)}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  variant = "default",
  testId 
}: { 
  title: string; 
  value: number; 
  icon: React.ElementType;
  variant?: "default" | "warning" | "danger";
  testId: string;
}) {
  const variantStyles = {
    default: "text-foreground",
    warning: "text-amber-500",
    danger: "text-red-500"
  };

  return (
    <Card data-testid={testId}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted/50">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold tabular-nums ${variantStyles[variant]}`} data-testid={`${testId}-value`}>
              {value.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SuggestionCard({ suggestion, onAction }: { suggestion: DataHealthSuggestion; onAction: () => void }) {
  const priorityStyles = {
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    low: "bg-blue-500/10 text-blue-500 border-blue-500/20"
  };

  return (
    <Card data-testid={`suggestion-card-${suggestion.id}`} className="hover-elevate">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h4 className="font-semibold text-foreground">{suggestion.title}</h4>
              <Badge 
                variant="outline" 
                className={priorityStyles[suggestion.priority]}
                data-testid={`badge-priority-${suggestion.id}`}
              >
                {suggestion.priority}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Impact: {suggestion.impact}</span>
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={onAction}
            data-testid={`button-action-${suggestion.id}`}
          >
            {suggestion.actionLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center" data-testid="empty-state">
      <div className="p-4 rounded-full bg-muted/50 mb-6">
        <Database className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No Data to Analyze Yet</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        Start by importing your contacts, leads, and accounts to get insights into your data quality and receive actionable recommendations.
      </p>
      <div className="flex gap-3">
        <Button data-testid="button-import-data">
          Import Data
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="outline" data-testid="button-learn-more">
          Learn More
        </Button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8" data-testid="loading-skeleton">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-shrink-0">
          <Skeleton className="w-[200px] h-[200px] rounded-full" />
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[120px]" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-[100px]" />
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[120px]" />
        ))}
      </div>
    </div>
  );
}

export default function DataHealthDashboard() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<DataHealthData>({
    queryKey: ['/api/data-health'],
  });

  const runAuditMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/data-health/audit', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to run audit');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/data-health'] });
    }
  });

  const mockData: DataHealthData = {
    scores: {
      overall: 73,
      contacts: 82,
      accounts: 68,
      leads: 75,
      deals: 65
    },
    metrics: {
      totalRecords: 12450,
      missingEmails: 234,
      missingPhones: 892,
      duplicateRecords: 156,
      staleRecords: 423,
      enrichmentOpportunities: 1247
    },
    suggestions: [
      {
        id: "1",
        title: "Update Missing Email Addresses",
        description: "234 contacts are missing email addresses, limiting your outreach capabilities.",
        priority: "high",
        impact: "+12% email reach",
        actionLabel: "Enrich Now"
      },
      {
        id: "2",
        title: "Merge Duplicate Records",
        description: "156 potential duplicate records detected. Consolidate for cleaner data.",
        priority: "medium",
        impact: "Improved accuracy",
        actionLabel: "Review"
      },
      {
        id: "3",
        title: "Re-engage Stale Contacts",
        description: "423 contacts haven't been contacted in over 90 days.",
        priority: "low",
        impact: "Potential reactivation",
        actionLabel: "Create Campaign"
      }
    ],
    lastAuditDate: new Date().toISOString(),
    isNewAccount: false
  };

  const healthData = data || mockData;

  const handleSuggestionAction = (suggestionId: string) => {
    console.log('Action for suggestion:', suggestionId);
  };

  return (
    <Layout>
      <div className="space-y-8" data-testid="page-data-health">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
              Data Health Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor and improve the quality of your CRM data
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {healthData.lastAuditDate && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Last audit: {new Date(healthData.lastAuditDate).toLocaleDateString()}
              </span>
            )}
            <Button 
              onClick={() => runAuditMutation.mutate()}
              disabled={runAuditMutation.isPending}
              data-testid="button-run-audit"
            >
              {runAuditMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Activity className="mr-2 h-4 w-4" />
                  Run Data Audit
                </>
              )}
            </Button>
          </div>
        </div>

        {isLoading && <LoadingSkeleton />}

        {error && (
          <Card className="border-destructive" data-testid="error-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <p>Error loading data health metrics. Please try again.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && healthData.isNewAccount && <EmptyState />}

        {!isLoading && !error && !healthData.isNewAccount && (
          <>
            <div className="flex flex-col lg:flex-row gap-8">
              <Card className="flex-shrink-0" data-testid="card-overall-score">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Overall Data Health
                  </CardTitle>
                  <CardDescription>
                    Combined quality score across all data types
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center pb-8">
                  <CircularProgress value={healthData.scores.overall} />
                </CardContent>
              </Card>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ScoreCard 
                  title="Contacts Score" 
                  score={healthData.scores.contacts} 
                  icon={Users}
                  testId="card-contacts-score"
                />
                <ScoreCard 
                  title="Accounts Score" 
                  score={healthData.scores.accounts} 
                  icon={Building2}
                  testId="card-accounts-score"
                />
                <ScoreCard 
                  title="Leads Score" 
                  score={healthData.scores.leads} 
                  icon={UserCheck}
                  testId="card-leads-score"
                />
                <ScoreCard 
                  title="Deals Score" 
                  score={healthData.scores.deals} 
                  icon={DollarSign}
                  testId="card-deals-score"
                />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4" data-testid="text-section-metrics">
                Key Metrics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <MetricCard 
                  title="Total Records" 
                  value={healthData.metrics.totalRecords} 
                  icon={Database}
                  testId="metric-total-records"
                />
                <MetricCard 
                  title="Missing Emails" 
                  value={healthData.metrics.missingEmails} 
                  icon={Mail}
                  variant="warning"
                  testId="metric-missing-emails"
                />
                <MetricCard 
                  title="Missing Phones" 
                  value={healthData.metrics.missingPhones} 
                  icon={Phone}
                  variant="warning"
                  testId="metric-missing-phones"
                />
                <MetricCard 
                  title="Duplicates" 
                  value={healthData.metrics.duplicateRecords} 
                  icon={Copy}
                  variant="danger"
                  testId="metric-duplicates"
                />
                <MetricCard 
                  title="Stale Records" 
                  value={healthData.metrics.staleRecords} 
                  icon={Clock}
                  variant="warning"
                  testId="metric-stale-records"
                />
                <Card data-testid="metric-enrichment">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Sparkles className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Enrichment Opportunities</p>
                        <p className="text-2xl font-bold tabular-nums text-primary" data-testid="metric-enrichment-value">
                          {healthData.metrics.enrichmentOpportunities.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold" data-testid="text-section-suggestions">
                  Recommendations
                </h2>
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {healthData.suggestions.length} actions available
                </Badge>
              </div>
              <div className="space-y-4">
                {healthData.suggestions.map((suggestion) => (
                  <SuggestionCard 
                    key={suggestion.id} 
                    suggestion={suggestion} 
                    onAction={() => handleSuggestionAction(suggestion.id)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
