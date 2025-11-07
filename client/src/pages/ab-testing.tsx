import Layout from "@/components/layout";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, TestTube, Play, Pause, Eye, Edit, Trash2, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface AbTest {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  targetUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  winnerVariantId: string | null;
  createdAt: string;
  variantsCount?: number;
  totalVisitors?: number;
  conversionRate?: string;
}

export default function AbTestingPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Fetch tests with filters
  const { data: tests, isLoading } = useQuery<AbTest[]>({
    queryKey: ["/api/ab-testing/tests", statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      
      const response = await fetch(`/api/ab-testing/tests?${params}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch tests");
      return response.json();
    },
  });

  const handleStartTest = async (testId: string) => {
    try {
      await apiRequest("POST", `/api/ab-testing/tests/${testId}/start`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/ab-testing/tests"] });
      toast({
        title: "Test Started",
        description: "The A/B test is now running",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start test",
        variant: "destructive",
      });
    }
  };

  const handlePauseTest = async (testId: string) => {
    try {
      await apiRequest("POST", `/api/ab-testing/tests/${testId}/pause`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/ab-testing/tests"] });
      toast({
        title: "Test Paused",
        description: "The A/B test has been paused",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to pause test",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm("Are you sure you want to delete this test? This action cannot be undone.")) {
      return;
    }

    try {
      await apiRequest("DELETE", `/api/ab-testing/tests/${testId}`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/ab-testing/tests"] });
      toast({
        title: "Test Deleted",
        description: "The A/B test has been deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete test",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "running":
        return "default";
      case "paused":
        return "secondary";
      case "completed":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-blue-600 dark:text-blue-400";
      case "paused":
        return "text-yellow-600 dark:text-yellow-400";
      case "completed":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getTypeLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">A/B Testing</h1>
            <p className="text-muted-foreground">
              Create and manage A/B tests to optimize your marketing campaigns
            </p>
          </div>
          <Link href="/ab-testing/create">
            <Button data-testid="button-create-test">
              <Plus className="mr-2 h-4 w-4" />
              Create New Test
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="w-[200px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[200px]">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger data-testid="select-type-filter">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="landing_page">Landing Page</SelectItem>
                <SelectItem value="email_campaign">Email Campaign</SelectItem>
                <SelectItem value="product_page">Product Page</SelectItem>
                <SelectItem value="form">Form</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tests Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tests && tests.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tests.map((test) => (
              <Card key={test.id} data-testid={`card-test-${test.id}`} className="hover-elevate">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex-1">
                    <CardTitle className="text-base">{test.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {test.description || "No description"}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-actions-${test.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/ab-testing/${test.id}`}>
                        <DropdownMenuItem data-testid={`button-view-${test.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      </Link>
                      {test.status === "draft" && (
                        <DropdownMenuItem
                          onClick={() => handleStartTest(test.id)}
                          data-testid={`button-start-${test.id}`}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Start Test
                        </DropdownMenuItem>
                      )}
                      {test.status === "running" && (
                        <DropdownMenuItem
                          onClick={() => handlePauseTest(test.id)}
                          data-testid={`button-pause-${test.id}`}
                        >
                          <Pause className="mr-2 h-4 w-4" />
                          Pause Test
                        </DropdownMenuItem>
                      )}
                      {test.status === "paused" && (
                        <DropdownMenuItem
                          onClick={() => handleStartTest(test.id)}
                          data-testid={`button-resume-${test.id}`}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Resume Test
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleDeleteTest(test.id)}
                        className="text-destructive"
                        data-testid={`button-delete-${test.id}`}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <span className="text-sm font-medium">{getTypeLabel(test.type)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge
                      variant={getStatusBadgeVariant(test.status)}
                      className={getStatusColor(test.status)}
                      data-testid={`badge-status-${test.status}`}
                    >
                      {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                    </Badge>
                  </div>
                  {test.startDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Started</span>
                      <span className="text-sm">{format(new Date(test.startDate), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <div className="text-center">
                      <div className="text-lg font-bold">{test.variantsCount || 0}</div>
                      <div className="text-xs text-muted-foreground">Variants</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{test.totalVisitors || 0}</div>
                      <div className="text-xs text-muted-foreground">Visitors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{test.conversionRate || '0.00'}%</div>
                      <div className="text-xs text-muted-foreground">Conv. Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="rounded-full bg-muted p-6">
                <TestTube className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No A/B Tests Yet</h3>
                <p className="text-muted-foreground max-w-md">
                  Create your first A/B test to start optimizing your marketing campaigns
                  and improving conversion rates.
                </p>
              </div>
              <Link href="/ab-testing/create">
                <Button data-testid="button-create-first-test">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Test
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
