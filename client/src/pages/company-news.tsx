import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Newspaper,
  TrendingUp,
  Users,
  UserPlus,
  Briefcase,
  Building2,
  Rocket,
  DollarSign,
  Calendar,
  ExternalLink,
  Bell,
  BellOff,
  CheckCircle,
  Circle,
  ThumbsUp,
  ThumbsDown,
  Minus,
  RefreshCw,
  Filter,
  Inbox,
} from "lucide-react";

interface CompanyNewsItem {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo?: string;
  eventType: "funding" | "hiring" | "acquisition" | "product_launch" | "leadership";
  title: string;
  description: string;
  sentiment: "positive" | "neutral" | "negative";
  source: string;
  sourceUrl?: string;
  publishedAt: string;
  isRead: boolean;
  isFollowing: boolean;
}

interface CompanyNewsMetrics {
  totalNews: number;
  fundingEvents: number;
  hiringSignals: number;
  leadershipChanges: number;
}

interface CompanyNewsResponse {
  success: boolean;
  news: CompanyNewsItem[];
  metrics: CompanyNewsMetrics;
  total: number;
}

const EVENT_TYPE_CONFIG = {
  funding: {
    label: "Funding",
    icon: DollarSign,
    color: "text-green-400 bg-green-400/10 border-green-400/20",
  },
  hiring: {
    label: "Hiring",
    icon: UserPlus,
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  },
  acquisition: {
    label: "Acquisition",
    icon: Building2,
    color: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  },
  product_launch: {
    label: "Product Launch",
    icon: Rocket,
    color: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  },
  leadership: {
    label: "Leadership",
    icon: Briefcase,
    color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  },
};

const SENTIMENT_CONFIG = {
  positive: { icon: ThumbsUp, color: "text-green-400", label: "Positive" },
  neutral: { icon: Minus, color: "text-muted-foreground", label: "Neutral" },
  negative: { icon: ThumbsDown, color: "text-red-400", label: "Negative" },
};

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
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getEventTypeBadge(eventType: keyof typeof EVENT_TYPE_CONFIG) {
  const config = EVENT_TYPE_CONFIG[eventType];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={config.color}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}

function getSentimentIndicator(sentiment: keyof typeof SENTIMENT_CONFIG) {
  const config = SENTIMENT_CONFIG[sentiment];
  const Icon = config.icon;
  return (
    <div className={`flex items-center gap-1 ${config.color}`} title={config.label}>
      <Icon className="w-4 h-4" />
      <span className="text-xs">{config.label}</span>
    </div>
  );
}

const MOCK_NEWS: CompanyNewsItem[] = [
  {
    id: "1",
    companyId: "c1",
    companyName: "TechCorp Inc.",
    eventType: "funding",
    title: "TechCorp Raises $50M Series C",
    description: "TechCorp Inc. has successfully closed a $50 million Series C funding round led by Sequoia Capital, bringing their total funding to $85 million.",
    sentiment: "positive",
    source: "TechCrunch",
    sourceUrl: "https://techcrunch.com",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    isFollowing: true,
  },
  {
    id: "2",
    companyId: "c2",
    companyName: "DataFlow Systems",
    eventType: "hiring",
    title: "DataFlow Systems Expands Engineering Team by 40%",
    description: "DataFlow Systems announces aggressive hiring plans, adding 120 new engineering positions across their US and European offices.",
    sentiment: "positive",
    source: "LinkedIn",
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    isFollowing: false,
  },
  {
    id: "3",
    companyId: "c3",
    companyName: "CloudBase",
    eventType: "acquisition",
    title: "CloudBase Acquires AI Startup Nexus",
    description: "CloudBase has completed the acquisition of AI startup Nexus for an undisclosed amount, strengthening their machine learning capabilities.",
    sentiment: "positive",
    source: "Bloomberg",
    sourceUrl: "https://bloomberg.com",
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    isFollowing: true,
  },
  {
    id: "4",
    companyId: "c4",
    companyName: "SalesForce Pro",
    eventType: "product_launch",
    title: "SalesForce Pro Launches AI-Powered CRM Suite",
    description: "SalesForce Pro unveils their next-generation CRM platform with integrated AI capabilities for predictive sales analytics.",
    sentiment: "positive",
    source: "Product Hunt",
    publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    isFollowing: false,
  },
  {
    id: "5",
    companyId: "c5",
    companyName: "FinanceHub",
    eventType: "leadership",
    title: "FinanceHub Appoints New CEO from Goldman Sachs",
    description: "FinanceHub announces the appointment of Sarah Chen as their new CEO, bringing 20 years of experience from Goldman Sachs.",
    sentiment: "neutral",
    source: "Wall Street Journal",
    sourceUrl: "https://wsj.com",
    publishedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    isFollowing: true,
  },
];

export default function CompanyNewsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  const { data, isLoading, refetch } = useQuery<CompanyNewsResponse>({
    queryKey: ["/api/company-news"],
    queryFn: async () => {
      const metrics: CompanyNewsMetrics = {
        totalNews: MOCK_NEWS.length,
        fundingEvents: MOCK_NEWS.filter(n => n.eventType === "funding").length,
        hiringSignals: MOCK_NEWS.filter(n => n.eventType === "hiring").length,
        leadershipChanges: MOCK_NEWS.filter(n => n.eventType === "leadership").length,
      };
      return {
        success: true,
        news: MOCK_NEWS,
        metrics,
        total: MOCK_NEWS.length,
      };
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (newsId: string) => {
      return apiRequest("PATCH", `/api/company-news/${newsId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-news"] });
      toast({ title: "Marked as read" });
    },
    onError: () => {
      toast({ title: "Failed to update", variant: "destructive" });
    },
  });

  const toggleFollowMutation = useMutation({
    mutationFn: async ({ companyId, follow }: { companyId: string; follow: boolean }) => {
      return apiRequest("POST", `/api/companies/${companyId}/follow`, { follow });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-news"] });
      toast({ title: variables.follow ? "Now following company" : "Unfollowed company" });
    },
    onError: () => {
      toast({ title: "Failed to update", variant: "destructive" });
    },
  });

  const news = data?.news || [];
  const metrics = data?.metrics || { totalNews: 0, fundingEvents: 0, hiringSignals: 0, leadershipChanges: 0 };

  const filteredNews = activeTab === "all"
    ? news
    : news.filter(item => item.eventType === activeTab);

  const handleMarkAsRead = (newsId: string) => {
    const item = news.find(n => n.id === newsId);
    if (item && !item.isRead) {
      markAsReadMutation.mutate(newsId);
    }
  };

  const handleToggleFollow = (companyId: string, currentlyFollowing: boolean) => {
    toggleFollowMutation.mutate({ companyId, follow: !currentlyFollowing });
  };

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
              Company News & Alerts
            </h1>
            <p className="text-muted-foreground">
              Real-time company news, funding rounds, and hiring signals
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              data-testid="button-refresh-news"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" data-testid="button-filter-news">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card data-testid="card-stat-total-news">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total News Items
              </CardTitle>
              <Newspaper className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold tabular-nums" data-testid="text-stat-total-news">
                  {metrics.totalNews}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-stat-funding">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Funding Events
              </CardTitle>
              <DollarSign className="w-4 h-4 text-green-400" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold tabular-nums text-green-400" data-testid="text-stat-funding">
                  {metrics.fundingEvents}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-stat-hiring">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Hiring Signals
              </CardTitle>
              <UserPlus className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold tabular-nums text-blue-400" data-testid="text-stat-hiring">
                  {metrics.hiringSignals}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-stat-leadership">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Leadership Changes
              </CardTitle>
              <Briefcase className="w-4 h-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold tabular-nums text-yellow-400" data-testid="text-stat-leadership">
                  {metrics.leadershipChanges}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50" data-testid="tabs-filter">
            <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
            <TabsTrigger value="funding" data-testid="tab-funding">Funding</TabsTrigger>
            <TabsTrigger value="hiring" data-testid="tab-hiring">Hiring</TabsTrigger>
            <TabsTrigger value="acquisition" data-testid="tab-acquisition">Acquisitions</TabsTrigger>
            <TabsTrigger value="product_launch" data-testid="tab-product-launch">Product Launches</TabsTrigger>
            <TabsTrigger value="leadership" data-testid="tab-leadership">Leadership</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredNews.length === 0 ? (
              <Card data-testid="card-empty-state">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Inbox className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No news found</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    {activeTab === "all"
                      ? "There are no company news items to display. News will appear here as companies you follow make announcements."
                      : `No ${EVENT_TYPE_CONFIG[activeTab as keyof typeof EVENT_TYPE_CONFIG]?.label || activeTab} events found.`}
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => refetch()} data-testid="button-empty-refresh">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh News
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredNews.map(item => (
                  <Card
                    key={item.id}
                    className={`transition-colors ${item.isRead ? "opacity-75" : ""}`}
                    data-testid={`card-news-${item.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div
                            className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center"
                            data-testid={`img-company-logo-${item.id}`}
                          >
                            <Building2 className="w-6 h-6 text-muted-foreground" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            {getEventTypeBadge(item.eventType)}
                            {!item.isRead && (
                              <Badge variant="secondary" className="bg-primary/10 text-primary">
                                New
                              </Badge>
                            )}
                          </div>

                          <h3
                            className="text-lg font-semibold mb-1 line-clamp-1"
                            data-testid={`text-news-title-${item.id}`}
                          >
                            {item.title}
                          </h3>

                          <p
                            className="text-sm text-muted-foreground mb-3 line-clamp-2"
                            data-testid={`text-news-description-${item.id}`}
                          >
                            {item.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Building2 className="w-4 h-4" />
                              <span data-testid={`text-company-name-${item.id}`}>
                                {item.companyName}
                              </span>
                            </div>

                            {getSentimentIndicator(item.sentiment)}

                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span data-testid={`text-news-date-${item.id}`}>
                                {formatTimeAgo(item.publishedAt)}
                              </span>
                            </div>

                            {item.sourceUrl ? (
                              <a
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline"
                                data-testid={`link-source-${item.id}`}
                              >
                                <ExternalLink className="w-4 h-4" />
                                {item.source}
                              </a>
                            ) : (
                              <span className="text-muted-foreground" data-testid={`text-source-${item.id}`}>
                                {item.source}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {item.isFollowing ? "Following" : "Follow"}
                            </span>
                            <Switch
                              checked={item.isFollowing}
                              onCheckedChange={() => handleToggleFollow(item.companyId, item.isFollowing)}
                              data-testid={`switch-follow-${item.id}`}
                            />
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(item.id)}
                            disabled={item.isRead}
                            className={item.isRead ? "text-muted-foreground" : ""}
                            data-testid={`button-mark-read-${item.id}`}
                          >
                            {item.isRead ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Read
                              </>
                            ) : (
                              <>
                                <Circle className="w-4 h-4 mr-1" />
                                Mark as Read
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
