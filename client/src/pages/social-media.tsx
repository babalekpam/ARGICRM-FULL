import { useQuery, useMutation } from "@tanstack/react-query";
import { SocialAccount, SocialPost, SocialMetric } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Heart, MessageCircle, Share2, Eye, TrendingUp, UserPlus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SocialMediaProps {
  projectId: string;
}

export default function SocialMedia({ projectId }: SocialMediaProps) {
  const { toast } = useToast();
  const [selectedAccount, setSelectedAccount] = useState<string>("");

  const { data: accounts, isLoading: accountsLoading } = useQuery<SocialAccount[]>({
    queryKey: ["/api/projects", projectId, "social-accounts"],
  });

  const { data: posts, isLoading: postsLoading } = useQuery<SocialPost[]>({
    queryKey: ["/api/social-accounts", selectedAccount, "posts"],
    enabled: !!selectedAccount,
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery<SocialMetric[]>({
    queryKey: ["/api/social-accounts", selectedAccount, "metrics"],
    enabled: !!selectedAccount,
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/social-accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "social-accounts"] });
      toast({ title: "Social account disconnected" });
      if (selectedAccount) setSelectedAccount("");
    },
  });

  const isLoading = accountsLoading;

  // Set first account as selected when accounts change or if selected account is not in current list
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const accountExists = accounts.some(acc => acc.id === selectedAccount);
      if (!accountExists) {
        setSelectedAccount(accounts[0].id);
      }
    } else if (accounts && accounts.length === 0) {
      setSelectedAccount("");
    }
  }, [accounts, selectedAccount]);

  // Reset selected account when project changes
  useEffect(() => {
    setSelectedAccount("");
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-muted rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const selectedAccountData = accounts?.find(a => a.id === selectedAccount);
  
  // Calculate totals from metrics
  const totalEngagement = metrics?.reduce((sum, m) => sum + ((m.totalLikes || 0) + (m.totalComments || 0) + (m.totalShares || 0)), 0) || 0;
  const totalPosts = metrics?.reduce((sum, m) => sum + (m.totalPosts || 0), 0) || 0;
  const totalFollowers = selectedAccountData?.followers || 0;

  return (
    <div className="p-6 space-y-6" data-testid="social-media-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Social Media Monitoring</h1>
          <p className="text-muted-foreground">Track social performance and engagement</p>
        </div>
        <Button data-testid="button-connect-account">
          <Plus className="mr-2 h-4 w-4" /> Connect Account
        </Button>
      </div>

      {/* Account Selector */}
      {accounts && accounts.length > 0 && (
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Account:</label>
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-64" data-testid="select-account">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id} data-testid={`option-account-${account.id}`}>
                  {account.platform} - {account.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Key Metrics */}
      {selectedAccountData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="hover-elevate">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Followers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <div className="text-2xl font-bold" data-testid="text-followers">{totalFollowers.toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                <div className="text-2xl font-bold" data-testid="text-engagement">{totalEngagement.toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                <div className="text-2xl font-bold" data-testid="text-total-posts">{totalPosts.toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div className="text-2xl font-bold" data-testid="text-engagement-rate">
                  {(metrics?.[0]?.avgEngagement || 0).toFixed(2)}%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="metrics" data-testid="tab-metrics">
            <TrendingUp className="mr-2 h-4 w-4" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="posts" data-testid="tab-posts">
            <MessageCircle className="mr-2 h-4 w-4" />
            Recent Posts
          </TabsTrigger>
          <TabsTrigger value="accounts" data-testid="tab-accounts">
            <UserPlus className="mr-2 h-4 w-4" />
            Connected Accounts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle>Engagement Trends</CardTitle>
              <p className="text-sm text-muted-foreground">Daily engagement metrics over time</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="totalLikes" stroke="hsl(var(--chart-1))" name="Total Likes" />
                  <Line type="monotone" dataKey="totalComments" stroke="hsl(var(--chart-2))" name="Total Comments" />
                  <Line type="monotone" dataKey="totalShares" stroke="hsl(var(--chart-3))" name="Total Shares" />
                  <Line type="monotone" dataKey="totalPosts" stroke="hsl(var(--chart-4))" name="Total Posts" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="space-y-6">
          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle>Recent Posts</CardTitle>
              <p className="text-sm text-muted-foreground">Latest content and performance</p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead>Likes</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Reach</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts?.map((post) => (
                    <TableRow key={post.id} data-testid={`row-post-${post.id}`}>
                      <TableCell className="max-w-md">
                        <p className="text-sm truncate">{post.content}</p>
                        {post.url && (
                          <a 
                            href={post.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                            data-testid={`link-post-${post.id}`}
                          >
                            View Post
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(post.postedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-red-500" />
                          <span className="font-mono">{post.likes.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3 text-blue-500" />
                          <span className="font-mono">{post.comments.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Share2 className="h-3 w-3 text-green-500" />
                          <span className="font-mono">{post.shares.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-purple-500" />
                          <span className="font-mono">{(post.reach || 0).toLocaleString()}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <p className="text-sm text-muted-foreground">Manage your social media connections</p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Profile URL</TableHead>
                    <TableHead>Followers</TableHead>
                    <TableHead>Connected</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts?.map((account) => (
                    <TableRow key={account.id} data-testid={`row-account-${account.id}`}>
                      <TableCell>
                        <Badge variant="secondary" data-testid={`badge-platform-${account.id}`}>
                          {account.platform}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{account.username}</TableCell>
                      <TableCell>
                        <a 
                          href={account.profileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                          data-testid={`link-profile-${account.id}`}
                        >
                          View Profile
                        </a>
                      </TableCell>
                      <TableCell className="font-mono">{(account.followers || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {account.connectedAt ? new Date(account.connectedAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteAccountMutation.mutate(account.id)}
                          data-testid={`button-disconnect-${account.id}`}
                        >
                          Disconnect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
