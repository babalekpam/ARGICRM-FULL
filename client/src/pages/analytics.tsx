import Layout from "@/components/layout";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Calendar, BarChart3, PieChart, LineChart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AnalyticsData {
  salesMetrics: {
    totalRevenue: number;
    forecastedRevenue: number;
    dealsWon: number;
    dealsInPipeline: number;
    averageDealSize: number;
    salesCycleLength: number;
    conversionRate: number;
    revenueGrowth: number;
  };
  pipelineData: Array<{
    stage: string;
    count: number;
    value: number;
  }>;
  forecastData: Array<{
    period: string;
    forecast: number;
    actual: number;
    confidence: number;
  }>;
  topPerformers: Array<{
    name: string;
    deals: number;
    revenue: number;
  }>;
  leadSources: Array<{
    source: string;
    leads: number;
    conversion: number;
  }>;
}

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("month");
  const [chartType, setChartType] = useState("bar");

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics", timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/analytics?timeframe=${timeframe}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json() as Promise<AnalyticsData>;
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI-Powered Sales Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Comprehensive business intelligence with predictive insights and performance optimization
              </p>
            </div>
            <div className="flex space-x-2">
              <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-blue-100 text-green-800 border-0">
                Real-Time Data
              </Badge>
              <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-0">
                AI-Enhanced
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Sales Analytics
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">Track performance and forecast revenue with AI-powered insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live Data
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                AI-Powered
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                Real-time Updates
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-48 bg-white shadow-md border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              <LineChart className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics?.salesMetrics.totalRevenue || 0)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {analytics?.salesMetrics.revenueGrowth && analytics.salesMetrics.revenueGrowth > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                )}
                {formatPercentage(analytics?.salesMetrics.revenueGrowth || 0)} from last period
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deals Won</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.salesMetrics.dealsWon || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analytics?.salesMetrics.dealsInPipeline || 0} in pipeline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics?.salesMetrics.averageDealSize || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {analytics?.salesMetrics.salesCycleLength || 0} days avg cycle
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(analytics?.salesMetrics.conversionRate || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Lead to customer conversion
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pipeline">Sales Pipeline</TabsTrigger>
            <TabsTrigger value="forecast">Revenue Forecast</TabsTrigger>
            <TabsTrigger value="performance">Team Performance</TabsTrigger>
            <TabsTrigger value="sources">Lead Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Pipeline Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.pipelineData.map((stage, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{stage.stage}</h3>
                        <p className="text-sm text-gray-500">{stage.count} deals</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(stage.value)}</p>
                        <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(stage.value / (analytics.salesMetrics.totalRevenue || 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Forecasting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 border rounded-lg">
                      <h3 className="text-lg font-semibold">Forecasted Revenue</h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(analytics?.salesMetrics.forecastedRevenue || 0)}
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <h3 className="text-lg font-semibold">Current Quarter</h3>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(analytics?.salesMetrics.totalRevenue || 0)}
                      </p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <h3 className="text-lg font-semibold">Achievement</h3>
                      <p className="text-2xl font-bold">
                        {formatPercentage(((analytics?.salesMetrics.totalRevenue || 0) / (analytics?.salesMetrics.forecastedRevenue || 1)) * 100)}
                      </p>
                    </div>
                  </div>
                  
                  {analytics?.forecastData.map((forecast, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{forecast.period}</h3>
                        <Badge variant="secondary">
                          {formatPercentage(forecast.confidence)} confidence
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Forecast: {formatCurrency(forecast.forecast)}</p>
                        <p className="font-bold">Actual: {formatCurrency(forecast.actual)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topPerformers.map((performer, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="font-medium">{performer.name}</h3>
                          <p className="text-sm text-gray-500">{performer.deals} deals closed</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(performer.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lead Source Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.leadSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{source.source}</h3>
                        <p className="text-sm text-gray-500">{source.leads} leads generated</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatPercentage(source.conversion)}</p>
                        <p className="text-sm text-gray-500">conversion rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}