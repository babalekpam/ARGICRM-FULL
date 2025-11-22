import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  MessageSquare,
  Mail,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  Share2,
  Users,
  Zap,
  BarChart3,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import Layout from "@/components/layout";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface Stats {
  totalSocialPosts: number;
  leadsScored: number;
  activeChatSessions: number;
  emailThreadsProcessed: number;
}

interface SocialPost {
  id: string;
  platform: string;
  content: string;
  hashtags: string[];
  status: string;
  publishedAt: string | null;
  createdAt: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  jobTitle: string | null;
  leadScore: number;
}

interface AiOperation {
  id: string;
  operationType: string;
  status: string;
  tokensUsed: number | null;
  processingTime: number | null;
  createdAt: string;
}

interface ChatSession {
  id: string;
  sessionId: string;
  status: string;
  leadQuality: number;
  lastMessageAt: string;
  qualificationData: {
    pain?: string;
    goal?: string;
    timeframe?: string;
    budget?: string;
    authority?: string;
  };
}

export default function AIEmployeeDashboard() {
  const [operationTypeFilter, setOperationTypeFilter] = useState<string>("all");

  // Fetch data using TanStack Query
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/ai-employee/stats"],
  });

  const { data: socialPosts, isLoading: socialPostsLoading } = useQuery<SocialPost[]>({
    queryKey: ["/api/ai-employee/social-posts"],
  });

  const { data: leads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ["/api/ai-employee/leads"],
  });

  const { data: operations, isLoading: operationsLoading } = useQuery<AiOperation[]>({
    queryKey: operationTypeFilter === "all" 
      ? ["/api/ai-employee/operations"]
      : ["/api/ai-employee/operations", { type: operationTypeFilter }],
  });

  const { data: chatSessions, isLoading: chatSessionsLoading } = useQuery<ChatSession[]>({
    queryKey: ["/api/ai-employee/chat-sessions"],
  });

  // Helper functions
  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      linkedin: "🔗",
      twitter: "🐦",
      facebook: "📘",
      instagram: "📷",
    };
    return icons[platform.toLowerCase()] || "📱";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "secondary",
      scheduled: "default",
      published: "default",
      failed: "destructive",
      completed: "default",
      pending: "secondary",
      processing: "default",
      active: "default",
      qualified: "default",
      converted: "default",
      abandoned: "secondary",
    };
    return colors[status.toLowerCase()] || "secondary";
  };

  const getRecommendedAction = (score: number) => {
    if (score >= 90) return "High Priority - Contact Immediately";
    if (score >= 80) return "Medium Priority - Follow Up Soon";
    if (score >= 70) return "Low Priority - Monitor";
    return "No Action Required";
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const formatTime = (ms: number | null) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Employee Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitor your AI-powered automation and operations in real-time
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            <Brain className="h-4 w-4 mr-2" />
            AI Powered Operations
          </Badge>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="stat-social-posts">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Social Posts Generated</CardTitle>
              <Share2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalSocialPosts || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total posts created
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="stat-leads-scored">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Scored This Month</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.leadsScored || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI-scored contacts
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="stat-chat-sessions">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Chat Sessions</CardTitle>
              <MessageSquare className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.activeChatSessions || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Currently active
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Threads Processed</CardTitle>
              <Mail className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.emailThreadsProcessed || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI-processed emails
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Social Posts Table */}
        <Card data-testid="table-social-posts">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Share2 className="mr-2 h-5 w-5" />
              Recent Social Posts
            </CardTitle>
            <CardDescription>
              AI-generated social media content across all platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            {socialPostsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !socialPosts || socialPosts.length === 0 ? (
              <div className="text-center py-12">
                <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No social posts generated yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start creating AI-powered social media content
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Platform</TableHead>
                      <TableHead>Content Preview</TableHead>
                      <TableHead>Hashtags</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {socialPosts.slice(0, 10).map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getPlatformIcon(post.platform)}</span>
                            <span className="capitalize">{post.platform}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm">{truncateText(post.content, 100)}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {post.hashtags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                            {post.hashtags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{post.hashtags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(post.status) as any}>
                            {post.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {post.publishedAt
                            ? formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })
                            : "Not published"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="icon" variant="ghost" data-testid={`button-view-${post.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" data-testid={`button-edit-${post.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" data-testid={`button-delete-${post.id}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Scoring Table */}
          <Card data-testid="table-leads">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                Top Scored Leads
              </CardTitle>
              <CardDescription>
                Contacts with AI-calculated lead scores above 70
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leadsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : !leads || leads.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No scored leads yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    AI will score leads as they engage
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leads.slice(0, 5).map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                      data-testid={`lead-${lead.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{lead.name}</p>
                          <Badge variant="outline" className="text-xs">
                            Score: {lead.leadScore}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {lead.company || "No company"} • {lead.jobTitle || "No title"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getRecommendedAction(lead.leadScore)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-4">
                          <div className="text-2xl font-bold text-green-600">{lead.leadScore}</div>
                          <div className="text-xs text-muted-foreground">Lead Score</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Active Chat Sessions
              </CardTitle>
              <CardDescription>
                Real-time AI-powered chat conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chatSessionsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : !chatSessions || chatSessions.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No active chat sessions</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Sessions will appear when visitors engage
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatSessions.slice(0, 5).map((session) => (
                    <div
                      key={session.id}
                      className="p-4 border rounded-lg hover-elevate"
                      data-testid={`chat-${session.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={getStatusColor(session.status) as any}>
                          {session.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(session.lastMessageAt), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">Session {session.sessionId.slice(0, 8)}</p>
                          {session.qualificationData.goal && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Goal: {session.qualificationData.goal}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-purple-600">{session.leadQuality}</div>
                          <div className="text-xs text-muted-foreground">Quality</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Operations Log */}
        <Card data-testid="table-operations">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5" />
                  AI Operations Log
                </CardTitle>
                <CardDescription>
                  Recent AI operations with performance metrics
                </CardDescription>
              </div>
              <Select value={operationTypeFilter} onValueChange={setOperationTypeFilter}>
                <SelectTrigger className="w-[200px]" data-testid="select-operation-type">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operations</SelectItem>
                  <SelectItem value="social_post_generation">Social Posts</SelectItem>
                  <SelectItem value="lead_scoring">Lead Scoring</SelectItem>
                  <SelectItem value="outreach_email_generation">Email Generation</SelectItem>
                  <SelectItem value="proposal_generation">Proposals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {operationsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !operations || operations.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No operations logged yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Operations will be logged as AI processes tasks
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operation Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tokens Used</TableHead>
                      <TableHead>Processing Time</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operations.slice(0, 15).map((operation) => (
                      <TableRow key={operation.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {operation.operationType === "social_post_generation" && <Share2 className="h-4 w-4 text-blue-600" />}
                            {operation.operationType === "lead_scoring" && <TrendingUp className="h-4 w-4 text-green-600" />}
                            {operation.operationType === "outreach_email_generation" && <Mail className="h-4 w-4 text-yellow-600" />}
                            {operation.operationType === "proposal_generation" && <Brain className="h-4 w-4 text-purple-600" />}
                            <span className="text-sm capitalize">
                              {operation.operationType.replace(/_/g, " ")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {operation.status === "completed" && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {operation.status === "failed" && <XCircle className="h-4 w-4 text-red-600" />}
                            {operation.status === "processing" && <Loader className="h-4 w-4 text-blue-600 animate-spin" />}
                            {operation.status === "pending" && <Clock className="h-4 w-4 text-gray-600" />}
                            <Badge variant={getStatusColor(operation.status) as any}>
                              {operation.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {operation.tokensUsed ? operation.tokensUsed.toLocaleString() : "N/A"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatTime(operation.processingTime)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(operation.createdAt), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
