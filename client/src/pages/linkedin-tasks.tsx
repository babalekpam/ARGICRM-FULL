import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Linkedin,
  Eye,
  UserPlus,
  MessageSquare,
  ThumbsUp,
  MessageCircle,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  TrendingUp,
  Users,
  Send,
  BarChart3,
  Filter,
  RefreshCw,
  ExternalLink,
  Loader2
} from "lucide-react";
import type { LinkedinAction, Contact } from "@shared/schema";

const ACTION_TYPES = [
  { value: "all", label: "All Actions", icon: Linkedin },
  { value: "profile_view", label: "Profile View", icon: Eye },
  { value: "connect_request", label: "Connection Request", icon: UserPlus },
  { value: "message", label: "Direct Message", icon: MessageSquare },
  { value: "post_like", label: "Post Like", icon: ThumbsUp },
  { value: "post_comment", label: "Post Comment", icon: MessageCircle },
  { value: "inmail", label: "InMail", icon: Mail },
];

const STATUS_BADGES: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: any }> = {
  pending: { variant: "outline", label: "Pending", icon: Clock },
  completed: { variant: "default", label: "Completed", icon: CheckCircle },
  failed: { variant: "destructive", label: "Failed", icon: XCircle },
  rate_limited: { variant: "secondary", label: "Rate Limited", icon: AlertCircle },
};

interface LinkedinActionWithContact extends LinkedinAction {
  contact?: Contact | null;
}

interface StatsData {
  overall: {
    total: number;
    pending: number;
    completed: number;
    failed: number;
    rateLimited: number;
  };
  byType: {
    profileViews: { total: number; completed: number };
    connectRequests: { total: number; completed: number; accepted: number; acceptRate: string };
    messages: { total: number; completed: number; replied: number; replyRate: string };
    postLikes: { total: number };
    postComments: { total: number };
    inmails: { total: number; replied: number; replyRate: string };
  };
  weekly: {
    completedThisWeek: number;
  };
}

function StatCard({ 
  label, 
  value, 
  subValue, 
  icon: Icon, 
  trend 
}: { 
  label: string; 
  value: string | number; 
  subValue?: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card className="bg-[#11152B] border-[#1E293B]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold text-[#F8F9FA] tabular-nums mt-1">{value}</p>
            {subValue && (
              <p className="text-sm text-[#94A3B8] mt-1">{subValue}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            trend === 'up' ? 'bg-green-500/10 text-green-400' :
            trend === 'down' ? 'bg-red-500/10 text-red-400' :
            'bg-[#1A1F3A] text-[#94A3B8]'
          }`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskCard({ 
  action, 
  onComplete, 
  isCompleting 
}: { 
  action: LinkedinActionWithContact; 
  onComplete: (id: string, response?: string) => void;
  isCompleting: boolean;
}) {
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [response, setResponse] = useState("");

  const actionType = ACTION_TYPES.find(t => t.value === action.actionType);
  const ActionIcon = actionType?.icon || Linkedin;
  const statusInfo = STATUS_BADGES[action.status || 'pending'];
  const StatusIcon = statusInfo?.icon || Clock;

  const handleComplete = () => {
    onComplete(action.id, response || undefined);
    setShowCompleteDialog(false);
    setResponse("");
  };

  return (
    <>
      <div 
        className="flex items-start gap-4 p-4 bg-[#1A1F3A] border border-[#1E293B] rounded-lg hover-elevate transition-all"
        data-testid={`linkedin-task-${action.id}`}
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          action.actionType === 'connect_request' ? 'bg-sky-600' :
          action.actionType === 'message' ? 'bg-sky-700' :
          action.actionType === 'profile_view' ? 'bg-sky-500' :
          action.actionType === 'inmail' ? 'bg-purple-600' :
          action.actionType === 'post_like' ? 'bg-pink-500' :
          action.actionType === 'post_comment' ? 'bg-orange-500' :
          'bg-[#4C6EF5]'
        }`}>
          <ActionIcon className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-[#F8F9FA]">
              {actionType?.label || action.actionType}
            </span>
            <Badge variant={statusInfo?.variant || "outline"} className="text-xs">
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo?.label || action.status}
            </Badge>
            {action.response && (
              <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                {action.response}
              </Badge>
            )}
          </div>
          
          {action.contact && (
            <div className="mt-2">
              <p className="text-sm text-[#F8F9FA] font-medium">
                {action.contact.name}
              </p>
              <p className="text-xs text-[#64748B]">
                {action.contact.jobTitle} {action.contact.company && `at ${action.contact.company}`}
              </p>
            </div>
          )}
          
          {action.linkedinProfileUrl && (
            <a 
              href={action.linkedinProfileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#4C6EF5] hover:underline mt-2"
            >
              <ExternalLink className="w-3 h-3" />
              View Profile
            </a>
          )}
          
          {action.messageContent && (
            <p className="text-xs text-[#94A3B8] mt-2 line-clamp-2">
              {action.messageContent}
            </p>
          )}
          
          {action.connectionNote && (
            <p className="text-xs text-[#94A3B8] mt-2 italic">
              Note: {action.connectionNote}
            </p>
          )}
          
          <div className="flex items-center gap-4 mt-3 text-xs text-[#64748B]">
            {action.scheduledFor && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Scheduled: {new Date(action.scheduledFor).toLocaleDateString()}
              </span>
            )}
            {action.createdAt && (
              <span>
                Created: {new Date(action.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {action.status === 'pending' && (
            <Button
              size="sm"
              onClick={() => setShowCompleteDialog(true)}
              disabled={isCompleting}
              data-testid={`button-complete-${action.id}`}
            >
              {isCompleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Complete
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="bg-[#11152B] border-[#1E293B]">
          <DialogHeader>
            <DialogTitle className="text-[#F8F9FA]">Mark as Completed</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-[#94A3B8]">
              Mark this {actionType?.label.toLowerCase()} as completed. 
              Optionally add a response status.
            </p>
            {(action.actionType === 'connect_request' || action.actionType === 'message' || action.actionType === 'inmail') && (
              <div>
                <Select value={response} onValueChange={setResponse}>
                  <SelectTrigger className="bg-[#1A1F3A] border-[#1E293B]">
                    <SelectValue placeholder="Select response status (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#11152B] border-[#1E293B]">
                    {action.actionType === 'connect_request' && (
                      <>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="ignored">Ignored</SelectItem>
                      </>
                    )}
                    {(action.actionType === 'message' || action.actionType === 'inmail') && (
                      <>
                        <SelectItem value="replied">Replied</SelectItem>
                        <SelectItem value="no_reply">No Reply</SelectItem>
                        <SelectItem value="interested">Interested</SelectItem>
                        <SelectItem value="not_interested">Not Interested</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={isCompleting}>
              {isCompleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function LinkedinTasksPage() {
  const [activeTab, setActiveTab] = useState("tasks");
  const [actionTypeFilter, setActionTypeFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery<{ success: boolean; tasks: LinkedinActionWithContact[] }>({
    queryKey: ['/api/linkedin/tasks'],
  });

  // Fetch all actions (for history)
  const { data: actionsData, isLoading: actionsLoading } = useQuery<{ success: boolean; actions: LinkedinActionWithContact[] }>({
    queryKey: ['/api/linkedin/actions'],
  });

  // Fetch history
  const { data: historyData, isLoading: historyLoading } = useQuery<{ success: boolean; history: LinkedinActionWithContact[] }>({
    queryKey: ['/api/linkedin/history'],
  });

  // Fetch stats
  const { data: statsData, isLoading: statsLoading } = useQuery<{ success: boolean; stats: StatsData }>({
    queryKey: ['/api/linkedin/stats'],
  });

  // Complete action mutation
  const completeMutation = useMutation({
    mutationFn: async ({ id, response }: { id: string; response?: string }) => {
      return apiRequest('POST', `/api/linkedin/actions/${id}/complete`, { response });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/linkedin/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/linkedin/actions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/linkedin/history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/linkedin/stats'] });
      toast({
        title: "Action Completed",
        description: "LinkedIn action has been marked as completed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete action",
        variant: "destructive",
      });
    },
  });

  const handleComplete = (id: string, response?: string) => {
    completeMutation.mutate({ id, response });
  };

  // Filter tasks by action type
  const filteredTasks = useMemo(() => {
    const tasks = tasksData?.tasks || [];
    if (actionTypeFilter === 'all') return tasks;
    return tasks.filter(t => t.actionType === actionTypeFilter);
  }, [tasksData?.tasks, actionTypeFilter]);

  // Filter history by action type
  const filteredHistory = useMemo(() => {
    const history = historyData?.history || [];
    if (actionTypeFilter === 'all') return history;
    return history.filter(h => h.actionType === actionTypeFilter);
  }, [historyData?.history, actionTypeFilter]);

  const stats = statsData?.stats;

  return (
    <Layout>
      <div className="min-h-screen bg-[#0B0D17] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#F8F9FA] tracking-tight flex items-center gap-3">
                <Linkedin className="w-8 h-8 text-[#0A66C2]" />
                LinkedIn Tasks
              </h1>
              <p className="text-[#94A3B8] mt-1">
                Manage your LinkedIn outreach tasks and track engagement
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/linkedin'] });
                }}
                data-testid="button-refresh-linkedin"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsLoading ? (
              Array(4).fill(0).map((_, i) => (
                <Card key={i} className="bg-[#11152B] border-[#1E293B]">
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 bg-[#1A1F3A]" />
                    <Skeleton className="h-8 w-16 mt-2 bg-[#1A1F3A]" />
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <StatCard
                  label="Connections Sent"
                  value={stats?.byType.connectRequests.completed || 0}
                  subValue={`${stats?.byType.connectRequests.acceptRate || 0}% accepted`}
                  icon={UserPlus}
                  trend={Number(stats?.byType.connectRequests.acceptRate || 0) > 30 ? 'up' : 'neutral'}
                />
                <StatCard
                  label="Messages Sent"
                  value={stats?.byType.messages.completed || 0}
                  subValue={`${stats?.byType.messages.replyRate || 0}% reply rate`}
                  icon={MessageSquare}
                  trend={Number(stats?.byType.messages.replyRate || 0) > 20 ? 'up' : 'neutral'}
                />
                <StatCard
                  label="Profile Views"
                  value={stats?.byType.profileViews.completed || 0}
                  subValue="Completed"
                  icon={Eye}
                />
                <StatCard
                  label="Weekly Activity"
                  value={stats?.weekly.completedThisWeek || 0}
                  subValue="Actions this week"
                  icon={TrendingUp}
                  trend="up"
                />
              </>
            )}
          </div>

          {/* Filter */}
          <Card className="bg-[#11152B] border-[#1E293B]">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#64748B]" />
                  <span className="text-sm text-[#94A3B8]">Filter by type:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ACTION_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <Button
                        key={type.value}
                        variant={actionTypeFilter === type.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActionTypeFilter(type.value)}
                        className="gap-2"
                        data-testid={`filter-${type.value}`}
                      >
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-[#11152B] border border-[#1E293B]">
              <TabsTrigger 
                value="tasks" 
                className="data-[state=active]:bg-[#1A1F3A]"
                data-testid="tab-tasks"
              >
                <Clock className="w-4 h-4 mr-2" />
                Pending Tasks
                {filteredTasks.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {filteredTasks.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="data-[state=active]:bg-[#1A1F3A]"
                data-testid="tab-history"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Activity History
              </TabsTrigger>
              <TabsTrigger 
                value="stats" 
                className="data-[state=active]:bg-[#1A1F3A]"
                data-testid="tab-stats"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Detailed Stats
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="mt-6">
              <Card className="bg-[#11152B] border-[#1E293B]">
                <CardHeader>
                  <CardTitle className="text-[#F8F9FA] flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Task Queue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tasksLoading ? (
                    <div className="space-y-4">
                      {Array(3).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-24 bg-[#1A1F3A]" />
                      ))}
                    </div>
                  ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-12">
                      <Linkedin className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                      <p className="text-[#94A3B8]">No pending LinkedIn tasks</p>
                      <p className="text-sm text-[#64748B] mt-2">
                        Tasks from sequences will appear here
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[600px]">
                      <div className="space-y-4">
                        {filteredTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            action={task}
                            onComplete={handleComplete}
                            isCompleting={completeMutation.isPending}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <Card className="bg-[#11152B] border-[#1E293B]">
                <CardHeader>
                  <CardTitle className="text-[#F8F9FA] flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Completed Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="space-y-4">
                      {Array(3).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-24 bg-[#1A1F3A]" />
                      ))}
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                      <p className="text-[#94A3B8]">No completed actions yet</p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-[600px]">
                      <div className="space-y-4">
                        {filteredHistory.map((action) => (
                          <TaskCard
                            key={action.id}
                            action={action}
                            onComplete={handleComplete}
                            isCompleting={false}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Connection Stats */}
                <Card className="bg-[#11152B] border-[#1E293B]">
                  <CardHeader>
                    <CardTitle className="text-[#F8F9FA] flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-sky-500" />
                      Connection Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[#94A3B8]">Total Sent</span>
                        <span className="text-2xl font-bold text-[#F8F9FA] tabular-nums">
                          {stats?.byType.connectRequests.completed || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#94A3B8]">Accepted</span>
                        <span className="text-xl font-semibold text-green-400 tabular-nums">
                          {stats?.byType.connectRequests.accepted || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#94A3B8]">Accept Rate</span>
                        <span className="text-xl font-semibold text-[#4C6EF5] tabular-nums">
                          {stats?.byType.connectRequests.acceptRate || 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Message Stats */}
                <Card className="bg-[#11152B] border-[#1E293B]">
                  <CardHeader>
                    <CardTitle className="text-[#F8F9FA] flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-sky-600" />
                      Direct Messages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[#94A3B8]">Total Sent</span>
                        <span className="text-2xl font-bold text-[#F8F9FA] tabular-nums">
                          {stats?.byType.messages.completed || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#94A3B8]">Replied</span>
                        <span className="text-xl font-semibold text-green-400 tabular-nums">
                          {stats?.byType.messages.replied || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#94A3B8]">Reply Rate</span>
                        <span className="text-xl font-semibold text-[#4C6EF5] tabular-nums">
                          {stats?.byType.messages.replyRate || 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* InMail Stats */}
                <Card className="bg-[#11152B] border-[#1E293B]">
                  <CardHeader>
                    <CardTitle className="text-[#F8F9FA] flex items-center gap-2">
                      <Mail className="w-5 h-5 text-purple-500" />
                      InMail
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[#94A3B8]">Total Sent</span>
                        <span className="text-2xl font-bold text-[#F8F9FA] tabular-nums">
                          {stats?.byType.inmails.total || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#94A3B8]">Replied</span>
                        <span className="text-xl font-semibold text-green-400 tabular-nums">
                          {stats?.byType.inmails.replied || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#94A3B8]">Reply Rate</span>
                        <span className="text-xl font-semibold text-[#4C6EF5] tabular-nums">
                          {stats?.byType.inmails.replyRate || 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Overall Stats */}
                <Card className="bg-[#11152B] border-[#1E293B]">
                  <CardHeader>
                    <CardTitle className="text-[#F8F9FA] flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-[#4C6EF5]" />
                      Overall Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[#94A3B8]">Total Actions</span>
                        <span className="text-2xl font-bold text-[#F8F9FA] tabular-nums">
                          {stats?.overall.total || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#94A3B8]">Pending</span>
                        <span className="text-xl font-semibold text-yellow-400 tabular-nums">
                          {stats?.overall.pending || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#94A3B8]">Profile Views</span>
                        <span className="text-xl font-semibold text-[#94A3B8] tabular-nums">
                          {stats?.byType.profileViews.completed || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#94A3B8]">Post Engagements</span>
                        <span className="text-xl font-semibold text-[#94A3B8] tabular-nums">
                          {(stats?.byType.postLikes.total || 0) + (stats?.byType.postComments.total || 0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
