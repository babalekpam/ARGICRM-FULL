import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Mic, 
  Video, 
  Phone, 
  Calendar, 
  Clock, 
  User, 
  Users, 
  MessageSquare, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Brain,
  Sparkles,
  Play,
  FileText,
  BarChart3,
  Filter,
  RefreshCw,
  ChevronRight,
  Building2,
  Loader2
} from "lucide-react";
import type { ConversationIntelligence } from "@shared/schema";

interface ConversationStats {
  totalConversations: number;
  totalAnalyzed: number;
  sentimentCounts: { positive: number; neutral: number; negative: number };
  avgSentimentScore: number;
  commonTopics: { topic: string; count: number }[];
  topCompetitors: { competitor: string; count: number }[];
  typeCounts: { call: number; meeting: number; video_call: number };
}

function getSentimentColor(sentiment: string | null) {
  switch (sentiment) {
    case "positive": return "text-green-400";
    case "negative": return "text-red-400";
    default: return "text-yellow-400";
  }
}

function getSentimentBadgeVariant(sentiment: string | null): "default" | "secondary" | "destructive" | "outline" {
  switch (sentiment) {
    case "positive": return "default";
    case "negative": return "destructive";
    default: return "secondary";
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case "call": return <Phone className="w-4 h-4" />;
    case "video_call": return <Video className="w-4 h-4" />;
    case "meeting": return <Users className="w-4 h-4" />;
    default: return <Mic className="w-4 h-4" />;
  }
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function ConversationIntelligencePage() {
  const [selectedConversation, setSelectedConversation] = useState<ConversationIntelligence | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const { toast } = useToast();

  const { data: conversationsData, isLoading: isLoadingConversations } = useQuery<{
    success: boolean;
    data: ConversationIntelligence[];
    pagination: any;
  }>({
    queryKey: ["/api/conversations", typeFilter, sentimentFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (sentimentFilter !== "all") params.append("sentiment", sentimentFilter);
      const response = await fetch(`/api/conversations?${params.toString()}`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      return response.json();
    }
  });

  const { data: statsData, isLoading: isLoadingStats } = useQuery<{
    success: boolean;
    data: ConversationStats;
  }>({
    queryKey: ["/api/conversations/stats"]
  });

  const analyzeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/conversations/${id}/analyze`, { method: "POST" });
    },
    onSuccess: () => {
      toast({ title: "Analysis Complete", description: "Conversation has been analyzed by AI" });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations/stats"] });
    },
    onError: () => {
      toast({ title: "Analysis Failed", description: "Failed to analyze conversation", variant: "destructive" });
    }
  });

  const conversations = conversationsData?.data || [];
  const stats = statsData?.data;

  const handleViewDetails = (conversation: ConversationIntelligence) => {
    setSelectedConversation(conversation);
    setIsDetailOpen(true);
  };

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-6" data-testid="conversation-intelligence-page">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Conversation Intelligence</h1>
            <p className="text-muted-foreground mt-1">AI-powered analysis of your calls and meetings</p>
          </div>
          <Button variant="outline" size="sm" data-testid="button-refresh">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="stat-total">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Conversations</p>
                  <p className="text-4xl font-bold tabular-nums">{stats?.totalConversations || 0}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-analyzed">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Analyzed</p>
                  <p className="text-4xl font-bold tabular-nums">{stats?.totalAnalyzed || 0}</p>
                </div>
                <Brain className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-sentiment">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Avg Sentiment</p>
                  <p className="text-4xl font-bold tabular-nums">{((stats?.avgSentimentScore || 0) * 100).toFixed(0)}%</p>
                </div>
                {(stats?.avgSentimentScore || 0) >= 0 ? (
                  <TrendingUp className="w-8 h-8 text-green-500/50" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-500/50" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-positive">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Positive Rate</p>
                  <p className="text-4xl font-bold tabular-nums">
                    {stats?.totalConversations 
                      ? Math.round((stats.sentimentCounts.positive / stats.totalConversations) * 100) 
                      : 0}%
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list" data-testid="tab-list">Conversations</TabsTrigger>
            <TabsTrigger value="insights" data-testid="tab-insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <CardTitle className="text-lg">Recent Conversations</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[140px]" data-testid="filter-type">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="call">Calls</SelectItem>
                        <SelectItem value="meeting">Meetings</SelectItem>
                        <SelectItem value="video_call">Video Calls</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                      <SelectTrigger className="w-[140px]" data-testid="filter-sentiment">
                        <SelectValue placeholder="Sentiment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sentiment</SelectItem>
                        <SelectItem value="positive">Positive</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="negative">Negative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingConversations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-12">
                    <Mic className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Conversations Yet</h3>
                    <p className="text-muted-foreground">Start recording calls and meetings to see AI-powered insights</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleViewDetails(conv)}
                        data-testid={`conversation-item-${conv.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                            {getTypeIcon(conv.conversationType)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{conv.summary?.slice(0, 60) || "Untitled Conversation"}...</p>
                              {conv.analyzedAt ? (
                                <Badge variant="outline" className="text-xs">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Analyzed
                                </Badge>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(conv.occurredAt).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(conv.duration)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {(conv.participants as any[])?.length || 0} participants
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {conv.sentiment && (
                            <Badge variant={getSentimentBadgeVariant(conv.sentiment)}>
                              {conv.sentiment}
                            </Badge>
                          )}
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Common Topics
                  </CardTitle>
                  <CardDescription>Most discussed topics across conversations</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats?.commonTopics?.length ? (
                    <div className="space-y-3">
                      {stats.commonTopics.slice(0, 8).map((topic, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm">{topic.topic}</span>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={(topic.count / (stats.commonTopics[0]?.count || 1)) * 100} 
                              className="w-24 h-2" 
                            />
                            <span className="text-xs text-muted-foreground w-8">{topic.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No topics data available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Competitor Mentions
                  </CardTitle>
                  <CardDescription>Competitors mentioned in conversations</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats?.topCompetitors?.length ? (
                    <div className="space-y-3">
                      {stats.topCompetitors.map((comp, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm">{comp.competitor}</span>
                          <Badge variant="outline">{comp.count} mentions</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No competitor mentions found</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Conversation Types
                  </CardTitle>
                  <CardDescription>Breakdown by conversation type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">Calls</span>
                      </div>
                      <span className="font-medium">{stats?.typeCounts?.call || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Meetings</span>
                      </div>
                      <span className="font-medium">{stats?.typeCounts?.meeting || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-purple-500" />
                        <span className="text-sm">Video Calls</span>
                      </div>
                      <span className="font-medium">{stats?.typeCounts?.video_call || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Sentiment Distribution
                  </CardTitle>
                  <CardDescription>Overall sentiment across conversations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm">Positive</span>
                      </div>
                      <span className="font-medium">{stats?.sentimentCounts?.positive || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="text-sm">Neutral</span>
                      </div>
                      <span className="font-medium">{stats?.sentimentCounts?.neutral || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-sm">Negative</span>
                      </div>
                      <span className="font-medium">{stats?.sentimentCounts?.negative || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedConversation && getTypeIcon(selectedConversation.conversationType)}
                Conversation Details
              </DialogTitle>
              <DialogDescription>
                {selectedConversation?.occurredAt && new Date(selectedConversation.occurredAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              {selectedConversation && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {selectedConversation.sentiment && (
                        <Badge variant={getSentimentBadgeVariant(selectedConversation.sentiment)} className="capitalize">
                          {selectedConversation.sentiment}
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        Duration: {formatDuration(selectedConversation.duration)}
                      </span>
                    </div>
                    {!selectedConversation.analyzedAt && selectedConversation.transcription && (
                      <Button 
                        onClick={() => analyzeMutation.mutate(selectedConversation.id)}
                        disabled={analyzeMutation.isPending}
                        data-testid="button-analyze"
                      >
                        {analyzeMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Brain className="w-4 h-4 mr-2" />
                        )}
                        Analyze with AI
                      </Button>
                    )}
                  </div>

                  {selectedConversation.recordingUrl && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Play className="w-4 h-4" />
                          Recording
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <audio controls className="w-full">
                          <source src={selectedConversation.recordingUrl} type="audio/mpeg" />
                        </audio>
                      </CardContent>
                    </Card>
                  )}

                  {selectedConversation.summary && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          AI Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{selectedConversation.summary}</p>
                      </CardContent>
                    </Card>
                  )}

                  {(selectedConversation.participants as any[])?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Participants
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {(selectedConversation.participants as any[]).map((p: any, i: number) => (
                            <Badge key={i} variant="outline">
                              <User className="w-3 h-3 mr-1" />
                              {p.name} ({p.role})
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {(selectedConversation.topics as any[])?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Key Topics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {(selectedConversation.topics as any[]).map((t: any, i: number) => (
                            <Badge key={i} variant="secondary">
                              {typeof t === "string" ? t : t.topic}
                              {t.confidence && <span className="ml-1 text-xs opacity-70">({Math.round(t.confidence * 100)}%)</span>}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {(selectedConversation.actionItems as any[])?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Action Items
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {(selectedConversation.actionItems as any[]).map((item: any, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                              <div>
                                <p>{typeof item === "string" ? item : item.item}</p>
                                {item.assignee && (
                                  <span className="text-xs text-muted-foreground">Assigned to: {item.assignee}</span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {(selectedConversation.objections as any[])?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Objections Raised
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {(selectedConversation.objections as any[]).map((obj: any, i: number) => (
                            <div key={i} className="border-l-2 border-yellow-500 pl-3">
                              <p className="text-sm font-medium">{obj.objection}</p>
                              {obj.response && (
                                <p className="text-sm text-muted-foreground mt-1">Response: {obj.response}</p>
                              )}
                              <Badge variant={obj.handled ? "default" : "destructive"} className="mt-1">
                                {obj.handled ? "Handled" : "Unaddressed"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedConversation.dealSignals && Object.keys(selectedConversation.dealSignals as any).length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Deal Signals
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {(selectedConversation.dealSignals as any).buyingIntent && (
                            <div>
                              <span className="text-muted-foreground">Buying Intent:</span>
                              <p className="font-medium">{(selectedConversation.dealSignals as any).buyingIntent}</p>
                            </div>
                          )}
                          {(selectedConversation.dealSignals as any).budgetDiscussed && (
                            <div>
                              <span className="text-muted-foreground">Budget:</span>
                              <Badge variant="outline">Discussed</Badge>
                            </div>
                          )}
                          {(selectedConversation.dealSignals as any).timelineDiscussed && (
                            <div>
                              <span className="text-muted-foreground">Timeline:</span>
                              <Badge variant="outline">Discussed</Badge>
                            </div>
                          )}
                          {(selectedConversation.dealSignals as any).decisionMakers?.length > 0 && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Decision Makers:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(selectedConversation.dealSignals as any).decisionMakers.map((dm: string, i: number) => (
                                  <Badge key={i} variant="secondary">{dm}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {(selectedConversation.dealSignals as any).painPoints?.length > 0 && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Pain Points:</span>
                              <ul className="mt-1 space-y-1">
                                {(selectedConversation.dealSignals as any).painPoints.map((pp: string, i: number) => (
                                  <li key={i} className="text-sm">• {pp}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {(selectedConversation.competitorMentions as string[])?.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Competitor Mentions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {(selectedConversation.competitorMentions as string[]).map((comp, i) => (
                            <Badge key={i} variant="outline">{comp}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedConversation.transcription && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Transcription
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                          {selectedConversation.transcription}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
