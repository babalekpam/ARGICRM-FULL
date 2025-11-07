import Layout from "@/components/layout";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { ArrowLeft, Play, Pause, CheckCircle, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Variant {
  id: string;
  name: string;
  isControl: boolean;
  trafficAllocation: number;
}

interface TestDetails {
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
  variants: Variant[];
}

interface VariantMetrics {
  variantId: string;
  variantName: string;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  uplift?: number;
  pValue?: number | null;
  confidenceLevel?: number | null;
  isControl: boolean;
}

interface TestMetrics {
  test: TestDetails;
  metrics: VariantMetrics[];
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AbTestingDetailsPage() {
  const { id: testId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedWinner, setSelectedWinner] = useState<string>("");

  // Fetch test details
  const { data: testData, isLoading } = useQuery<TestDetails>({
    queryKey: ["/api/ab-testing/tests", testId],
    queryFn: async () => {
      const response = await fetch(`/api/ab-testing/tests/${testId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch test");
      return response.json();
    },
    enabled: !!testId,
    refetchInterval: 10000, // Poll every 10 seconds for real-time updates
  });

  // Fetch test metrics
  const { data: metricsData } = useQuery<TestMetrics>({
    queryKey: ["/api/ab-testing/tests", testId, "metrics"],
    queryFn: async () => {
      const response = await fetch(`/api/ab-testing/tests/${testId}/metrics`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch metrics");
      return response.json();
    },
    enabled: !!testId,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  const handleStartTest = async () => {
    try {
      await apiRequest(`/api/ab-testing/tests/${testId}/start`, {
        method: "POST",
      });
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

  const handlePauseTest = async () => {
    try {
      await apiRequest(`/api/ab-testing/tests/${testId}/pause`, {
        method: "POST",
      });
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

  const handleCompleteTest = async () => {
    if (!selectedWinner) {
      toast({
        title: "No Winner Selected",
        description: "Please select a winning variant",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiRequest(`/api/ab-testing/tests/${testId}/complete`, {
        method: "POST",
        body: JSON.stringify({ winnerVariantId: selectedWinner }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ab-testing/tests"] });
      toast({
        title: "Test Completed",
        description: "The A/B test has been marked as completed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete test",
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

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!testData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Test Not Found</h2>
          <Link href="/ab-testing">
            <Button className="mt-4">Back to Tests</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const metrics = metricsData?.metrics || [];
  const conversionRateData = metrics.map((m, index) => ({
    name: m.variantName,
    conversionRate: m.conversionRate,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const trafficData = testData.variants.map((v, index) => ({
    name: v.name,
    value: v.trafficAllocation,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const bestVariant = metrics.reduce((best, current) => 
    current.conversionRate > (best?.conversionRate || 0) ? current : best
  , metrics[0]);

  const hasSignificantResult = metrics.some(m => 
    m.confidenceLevel && m.confidenceLevel >= 95 && !m.isControl
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/ab-testing">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{testData.name}</h1>
                <Badge
                  variant={getStatusBadgeVariant(testData.status)}
                  className={getStatusColor(testData.status)}
                  data-testid={`badge-status-${testData.status}`}
                >
                  {testData.status.charAt(0).toUpperCase() + testData.status.slice(1)}
                </Badge>
                {testData.winnerVariantId && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" data-testid="badge-winner">
                    <Trophy className="mr-1 h-3 w-3" />
                    Winner Declared
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                {testData.description || "No description"}
              </p>
              {testData.startDate && (
                <p className="text-sm text-muted-foreground mt-1">
                  Started: {format(new Date(testData.startDate), 'MMM d, yyyy')}
                  {testData.endDate && ` • Ended: ${format(new Date(testData.endDate), 'MMM d, yyyy')}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {testData.status === "draft" && (
              <Button onClick={handleStartTest} data-testid="button-start-test">
                <Play className="mr-2 h-4 w-4" />
                Start Test
              </Button>
            )}
            {testData.status === "running" && (
              <Button onClick={handlePauseTest} variant="outline" data-testid="button-pause-test">
                <Pause className="mr-2 h-4 w-4" />
                Pause Test
              </Button>
            )}
            {(testData.status === "running" || testData.status === "paused") && (
              <div className="flex gap-2">
                <Select value={selectedWinner} onValueChange={setSelectedWinner}>
                  <SelectTrigger className="w-[200px]" data-testid="select-winner">
                    <SelectValue placeholder="Select winner" />
                  </SelectTrigger>
                  <SelectContent>
                    {testData.variants.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleCompleteTest} data-testid="button-complete-test">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Test
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Statistical Significance Alert */}
        {hasSignificantResult && testData.status === "running" && (
          <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Statistical Significance Achieved!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  You can now confidently declare a winner for this test.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Variants Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Variants Performance</CardTitle>
            <CardDescription>
              Detailed metrics for each test variant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table data-testid="table-variants">
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                  <TableHead className="text-right">Conv. Rate</TableHead>
                  <TableHead className="text-right">Uplift</TableHead>
                  <TableHead className="text-right">Confidence</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((metric) => (
                  <TableRow key={metric.variantId} data-testid={`row-variant-${metric.variantId}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {metric.variantName}
                        {metric.isControl && (
                          <Badge variant="secondary" className="text-xs">Control</Badge>
                        )}
                        {testData.winnerVariantId === metric.variantId && (
                          <Trophy className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{metric.impressions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{metric.clicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{metric.conversions.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium">
                      {metric.conversionRate.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {metric.isControl ? (
                        <span className="text-muted-foreground">—</span>
                      ) : metric.uplift !== undefined ? (
                        <span className={metric.uplift > 0 ? "text-green-600" : "text-red-600"}>
                          {metric.uplift > 0 && "+"}
                          {metric.uplift.toFixed(2)}%
                          {metric.uplift > 0 ? (
                            <TrendingUp className="inline ml-1 h-3 w-3" />
                          ) : (
                            <TrendingDown className="inline ml-1 h-3 w-3" />
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {metric.confidenceLevel !== null && metric.confidenceLevel !== undefined ? (
                        <Badge
                          variant={metric.confidenceLevel >= 95 ? "default" : "secondary"}
                          className={metric.confidenceLevel >= 95 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : ""}
                        >
                          {metric.confidenceLevel.toFixed(1)}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {metric === bestVariant && metrics.length > 1 && (
                        <Badge variant="outline" className="text-xs">
                          Best
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Conversion Rate Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Rate Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conversionRateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="conversionRate" name="Conversion Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Traffic Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Traffic Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={trafficData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {trafficData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
