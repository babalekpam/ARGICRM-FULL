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
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Smartphone,
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

  const getPlatformIcon = (platform: string) => {
    const iconClass = "h-5 w-5 text-[hsl(227,89%,63%)]";
    switch (platform.toLowerCase()) {
      case "linkedin":
        return <Linkedin className={iconClass} />;
      case "twitter":
        return <Twitter className={iconClass} />;
      case "facebook":
        return <Facebook className={iconClass} />;
      case "instagram":
        return <Instagram className={iconClass} />;
      default:
        return <Smartphone className={iconClass} />;
    }
  };

  const getStatusBadgeClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case "draft":
      case "pending":
      case "abandoned":
        return "bg-[hsl(229,41%,16%)] text-[hsl(215,20%,65%)] border-transparent";
      case "published":
      case "completed":
      case "active":
      case "qualified":
      case "converted":
        return "bg-[hsl(160,84%,39%)/30%] text-[hsl(160,84%,39%)] border-transparent";
      case "failed":
        return "bg-[hsl(0,84%,60%)/30%] text-[hsl(0,84%,60%)] border-transparent";
      case "scheduled":
      case "processing":
        return "bg-[hsl(227,89%,63%)/30%] text-[hsl(227,89%,63%)] border-transparent";
      default:
        return "bg-[hsl(229,41%,16%)] text-[hsl(215,20%,65%)] border-transparent";
    }
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[hsl(210,17%,98%)] tracking-tight">
              AI Employees
            </h1>
            <p className="text-sm text-[hsl(215,20%,65%)]">
              Monitor your AI-powered automation and operations in real-time
            </p>
          </div>
          <Badge className="bg-[hsl(227,89%,63%)/30%] text-[hsl(227,89%,63%)] border-transparent">
            <Brain className="h-4 w-4 mr-2" />
            AI Powered Operations
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg" data-testid="stat-social-posts">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide mb-1">
                    Social Posts Generated
                  </p>
                  {statsLoading ? (
                    <Skeleton className="h-9 w-20 bg-[hsl(229,41%,16%)]" />
                  ) : (
                    <p className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums">
                      {stats?.totalSocialPosts || 0}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-lg bg-[hsl(229,41%,16%)] flex items-center justify-center">
                  <Share2 className="h-6 w-6 text-[hsl(227,89%,63%)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg" data-testid="stat-leads-scored">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide mb-1">
                    Leads Scored This Month
                  </p>
                  {statsLoading ? (
                    <Skeleton className="h-9 w-20 bg-[hsl(229,41%,16%)]" />
                  ) : (
                    <p className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums">
                      {stats?.leadsScored || 0}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-lg bg-[hsl(229,41%,16%)] flex items-center justify-center">
                  <Users className="h-6 w-6 text-[hsl(160,84%,39%)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg" data-testid="stat-chat-sessions">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide mb-1">
                    Active Chat Sessions
                  </p>
                  {statsLoading ? (
                    <Skeleton className="h-9 w-20 bg-[hsl(229,41%,16%)]" />
                  ) : (
                    <p className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums">
                      {stats?.activeChatSessions || 0}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-lg bg-[hsl(229,41%,16%)] flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-[hsl(280,84%,60%)]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg" data-testid="stat-emails">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide mb-1">
                    Email Threads Processed
                  </p>
                  {statsLoading ? (
                    <Skeleton className="h-9 w-20 bg-[hsl(229,41%,16%)]" />
                  ) : (
                    <p className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums">
                      {stats?.emailThreadsProcessed || 0}
                    </p>
                  )}
                </div>
                <div className="h-12 w-12 rounded-lg bg-[hsl(229,41%,16%)] flex items-center justify-center">
                  <Mail className="h-6 w-6 text-[hsl(45,93%,47%)]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg" data-testid="table-social-posts">
          <CardHeader className="border-b border-[hsl(217,33%,17%)]">
            <CardTitle className="text-lg font-semibold text-[hsl(210,17%,98%)] flex items-center">
              <Share2 className="mr-2 h-5 w-5 text-[hsl(227,89%,63%)]" />
              Recent Social Posts
            </CardTitle>
            <CardDescription className="text-[hsl(215,20%,65%)]">
              AI-generated social media content across all platforms
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {socialPostsLoading ? (
              <div className="space-y-2 p-6">
                <Skeleton className="h-12 w-full bg-[hsl(229,41%,16%)]" />
                <Skeleton className="h-12 w-full bg-[hsl(229,41%,16%)]" />
                <Skeleton className="h-12 w-full bg-[hsl(229,41%,16%)]" />
              </div>
            ) : !socialPosts || socialPosts.length === 0 ? (
              <div className="text-center py-12">
                <Share2 className="h-12 w-12 text-[hsl(215,16%,47%)] mx-auto mb-4" />
                <p className="text-[hsl(215,20%,65%)]">No social posts generated yet</p>
                <p className="text-sm text-[hsl(215,16%,47%)] mt-2">
                  Start creating AI-powered social media content
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <Table>
                  <TableHeader className="bg-[hsl(229,41%,16%)]">
                    <TableRow className="border-b border-[hsl(217,33%,17%)] hover:bg-transparent">
                      <TableHead className="text-[hsl(215,20%,65%)] text-xs font-medium uppercase tracking-wide">Platform</TableHead>
                      <TableHead className="text-[hsl(215,20%,65%)] text-xs font-medium uppercase tracking-wide">Content Preview</TableHead>
                      <TableHead className="text-[hsl(215,20%,65%)] text-xs font-medium uppercase tracking-wide">Hashtags</TableHead>
                      <TableHead className="text-[hsl(215,20%,65%)] text-xs font-medium uppercase tracking-wide">Status</TableHead>
                      <TableHead className="text-[hsl(215,20%,65%)] text-xs font-medium uppercase tracking-wide">Published</TableHead>
                      <TableHead className="text-[hsl(215,20%,65%)] text-xs font-medium uppercase tracking-wide text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {socialPosts.slice(0, 10).map((post) => (
                      <TableRow key={post.id} className="border-b border-[hsl(217,33%,17%)] hover:bg-[hsl(229,41%,16%)]">
                        <TableCell className="text-[hsl(210,17%,98%)]">
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(post.platform)}
                            <span className="capitalize">{post.platform}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md text-[hsl(210,17%,98%)]">
                          <p className="text-sm">{truncateText(post.content, 100)}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {post.hashtags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} className="text-xs bg-[hsl(229,41%,16%)] text-[hsl(215,20%,65%)] border-transparent">
                                #{tag}
                              </Badge>
                            ))}
                            {post.hashtags.length > 3 && (
                              <Badge className="text-xs border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] bg-transparent">
                                +{post.hashtags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeClasses(post.status)}>
                            {post.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-[hsl(215,20%,65%)]">
                          {post.publishedAt
                            ? formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })
                            : "Not published"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" className="text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)] hover:text-[hsl(210,17%,98%)]" data-testid={`button-view-${post.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)] hover:text-[hsl(210,17%,98%)]" data-testid={`button-edit-${post.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)] hover:text-[hsl(210,17%,98%)]" data-testid={`button-delete-${post.id}`}>
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
          <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg" data-testid="table-leads">
            <CardHeader className="border-b border-[hsl(217,33%,17%)]">
              <CardTitle className="text-lg font-semibold text-[hsl(210,17%,98%)] flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-[hsl(160,84%,39%)]" />
                Top Scored Leads
              </CardTitle>
              <CardDescription className="text-[hsl(215,20%,65%)]">
                Contacts with AI-calculated lead scores above 70
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {leadsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full bg-[hsl(229,41%,16%)]" />
                  <Skeleton className="h-20 w-full bg-[hsl(229,41%,16%)]" />
                  <Skeleton className="h-20 w-full bg-[hsl(229,41%,16%)]" />
                </div>
              ) : !leads || leads.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 text-[hsl(215,16%,47%)] mx-auto mb-3" />
                  <p className="text-[hsl(215,20%,65%)]">No scored leads yet</p>
                  <p className="text-sm text-[hsl(215,16%,47%)] mt-2">
                    AI will score leads as they engage
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leads.slice(0, 5).map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between gap-4 p-4 border border-[hsl(217,33%,17%)] rounded-lg bg-[hsl(229,41%,16%)] hover:bg-[hsl(229,41%,20%)] transition-colors"
                      data-testid={`lead-${lead.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium text-[hsl(210,17%,98%)]">{lead.name}</p>
                          <Badge className="text-xs bg-[hsl(227,89%,63%)/30%] text-[hsl(227,89%,63%)] border-transparent">
                            Score: {lead.leadScore}
                          </Badge>
                        </div>
                        <p className="text-sm text-[hsl(215,20%,65%)]">
                          {lead.company || "No company"} • {lead.jobTitle || "No title"}
                        </p>
                        <p className="text-xs text-[hsl(215,16%,47%)] mt-1">
                          {getRecommendedAction(lead.leadScore)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold text-[hsl(160,84%,39%)] tabular-nums">{lead.leadScore}</div>
                        <div className="text-xs text-[hsl(215,20%,65%)]">Lead Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg" data-testid="table-chat-sessions">
            <CardHeader className="border-b border-[hsl(217,33%,17%)]">
              <CardTitle className="text-lg font-semibold text-[hsl(210,17%,98%)] flex items-center">
                <MessageSquare className="mr-2 h-5 w-5 text-[hsl(280,84%,60%)]" />
                Active Chat Sessions
              </CardTitle>
              <CardDescription className="text-[hsl(215,20%,65%)]">
                Real-time AI-powered chat conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {chatSessionsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full bg-[hsl(229,41%,16%)]" />
                  <Skeleton className="h-20 w-full bg-[hsl(229,41%,16%)]" />
                  <Skeleton className="h-20 w-full bg-[hsl(229,41%,16%)]" />
                </div>
              ) : !chatSessions || chatSessions.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-10 w-10 text-[hsl(215,16%,47%)] mx-auto mb-3" />
                  <p className="text-[hsl(215,20%,65%)]">No active chat sessions</p>
                  <p className="text-sm text-[hsl(215,16%,47%)] mt-2">
                    Sessions will appear when visitors engage
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatSessions.slice(0, 5).map((session) => (
                    <div
                      key={session.id}
                      className="p-4 border border-[hsl(217,33%,17%)] rounded-lg bg-[hsl(229,41%,16%)] hover:bg-[hsl(229,41%,20%)] transition-colors"
                      data-testid={`chat-${session.id}`}
                    >
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <Badge className={getStatusBadgeClasses(session.status)}>
                          {session.status}
                        </Badge>
                        <span className="text-xs text-[hsl(215,16%,47%)]">
                          {formatDistanceToNow(new Date(session.lastMessageAt), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[hsl(210,17%,98%)]">Session {session.sessionId.slice(0, 8)}</p>
                          {session.qualificationData.goal && (
                            <p className="text-xs text-[hsl(215,20%,65%)] mt-1 truncate">
                              Goal: {session.qualificationData.goal}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-[hsl(280,84%,60%)] tabular-nums">{session.leadQuality}</div>
                          <div className="text-xs text-[hsl(215,20%,65%)]">Quality</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg" data-testid="table-operations">
          <CardHeader className="border-b border-[hsl(217,33%,17%)]">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-lg font-semibold text-[hsl(210,17%,98%)] flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-[hsl(45,93%,47%)]" />
                  AI Operations Log
                </CardTitle>
                <CardDescription className="text-[hsl(215,20%,65%)]">
                  Recent AI operations with performance metrics
                </CardDescription>
              </div>
              <Select value={operationTypeFilter} onValueChange={setOperationTypeFilter}>
                <SelectTrigger className="w-48 bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]" data-testid="select-operation-type">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)]">
                  <SelectItem value="all" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)] focus:text-[hsl(210,17%,98%)]">All Operations</SelectItem>
                  <SelectItem value="social_post_generation" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)] focus:text-[hsl(210,17%,98%)]">Social Posts</SelectItem>
                  <SelectItem value="lead_scoring" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)] focus:text-[hsl(210,17%,98%)]">Lead Scoring</SelectItem>
                  <SelectItem value="outreach_email_generation" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)] focus:text-[hsl(210,17%,98%)]">Email Generation</SelectItem>
                  <SelectItem value="proposal_generation" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)] focus:text-[hsl(210,17%,98%)]">Proposals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {operationsLoading ? (
              <div className="space-y-2 p-6">
                <Skeleton className="h-12 w-full bg-[hsl(229,41%,16%)]" />
                <Skeleton className="h-12 w-full bg-[hsl(229,41%,16%)]" />
                <Skeleton className="h-12 w-full bg-[hsl(229,41%,16%)]" />
              </div>
            ) : !operations || operations.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-[hsl(215,16%,47%)] mx-auto mb-4" />
                <p className="text-[hsl(215,20%,65%)]">No operations logged yet</p>
                <p className="text-sm text-[hsl(215,16%,47%)] mt-2">
                  Operations will be logged as AI processes tasks
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <Table>
                  <TableHeader className="bg-[hsl(229,41%,16%)]">
                    <TableRow className="border-b border-[hsl(217,33%,17%)] hover:bg-transparent">
                      <TableHead className="text-[hsl(215,20%,65%)] text-xs font-medium uppercase tracking-wide">Operation Type</TableHead>
                      <TableHead className="text-[hsl(215,20%,65%)] text-xs font-medium uppercase tracking-wide">Status</TableHead>
                      <TableHead className="text-[hsl(215,20%,65%)] text-xs font-medium uppercase tracking-wide">Tokens Used</TableHead>
                      <TableHead className="text-[hsl(215,20%,65%)] text-xs font-medium uppercase tracking-wide">Processing Time</TableHead>
                      <TableHead className="text-[hsl(215,20%,65%)] text-xs font-medium uppercase tracking-wide">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operations.slice(0, 15).map((operation) => (
                      <TableRow key={operation.id} className="border-b border-[hsl(217,33%,17%)] hover:bg-[hsl(229,41%,16%)]">
                        <TableCell className="text-[hsl(210,17%,98%)]">
                          <div className="flex items-center gap-2">
                            {operation.operationType === "social_post_generation" && <Share2 className="h-4 w-4 text-[hsl(227,89%,63%)]" />}
                            {operation.operationType === "lead_scoring" && <TrendingUp className="h-4 w-4 text-[hsl(160,84%,39%)]" />}
                            {operation.operationType === "outreach_email_generation" && <Mail className="h-4 w-4 text-[hsl(45,93%,47%)]" />}
                            {operation.operationType === "proposal_generation" && <Brain className="h-4 w-4 text-[hsl(280,84%,60%)]" />}
                            <span className="text-sm capitalize">
                              {operation.operationType.replace(/_/g, " ")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {operation.status === "completed" && <CheckCircle className="h-4 w-4 text-[hsl(160,84%,39%)]" />}
                            {operation.status === "failed" && <XCircle className="h-4 w-4 text-[hsl(0,84%,60%)]" />}
                            {operation.status === "processing" && <Loader className="h-4 w-4 text-[hsl(227,89%,63%)] animate-spin" />}
                            {operation.status === "pending" && <Clock className="h-4 w-4 text-[hsl(215,16%,47%)]" />}
                            <Badge className={getStatusBadgeClasses(operation.status)}>
                              {operation.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-[hsl(210,17%,98%)] tabular-nums">
                          {operation.tokensUsed ? operation.tokensUsed.toLocaleString() : "N/A"}
                        </TableCell>
                        <TableCell className="text-sm text-[hsl(210,17%,98%)] tabular-nums">
                          {formatTime(operation.processingTime)}
                        </TableCell>
                        <TableCell className="text-sm text-[hsl(215,20%,65%)]">
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
