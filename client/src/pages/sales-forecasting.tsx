import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  Users, 
  Trophy,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Eye,
  Download,
  Filter,
  RefreshCcw
} from "lucide-react";

interface ForecastPeriod {
  period: string;
  target: number;
  predicted: number;
  confidence: number;
  variance: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
}

interface DealForecast {
  dealId: string;
  dealName: string;
  company: string;
  currentValue: number;
  predictedValue: number;
  closeProbability: number;
  predictedCloseDate: string;
  stage: string;
  owner: string;
  riskLevel: 'low' | 'medium' | 'high';
  lastActivity: string;
}

interface ForecastMetrics {
  accuracy: number;
  totalPipeline: number;
  weightedPipeline: number;
  averageDealSize: number;
  conversionRate: number;
  salesCycleLength: number;
  topPerformers: Array<{
    name: string;
    forecast: number;
    achievement: number;
    dealsCount: number;
  }>;
}

export default function SalesForecasting() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPeriod, setSelectedPeriod] = useState("current_quarter");
  const [selectedTerritory, setSelectedTerritory] = useState("all");

  // Mock forecast data
  const { data: forecastPeriods = [] } = useQuery({
    queryKey: ["/api/sales-forecast", selectedPeriod],
    queryFn: () => Promise.resolve([
      {
        period: "Q3 2024",
        target: 2500000,
        predicted: 2730000,
        confidence: 87,
        variance: 9.2,
        trend: "up" as const,
        lastUpdated: "2024-06-24T10:30:00Z"
      },
      {
        period: "Q4 2024",
        target: 2800000,
        predicted: 2650000,
        confidence: 72,
        variance: -5.4,
        trend: "down" as const,
        lastUpdated: "2024-06-24T10:30:00Z"
      },
      {
        period: "Q1 2025",
        target: 3000000,
        predicted: 3150000,
        confidence: 65,
        variance: 5.0,
        trend: "up" as const,
        lastUpdated: "2024-06-24T10:30:00Z"
      }
    ])
  });

  // Mock deal forecasts
  const { data: dealForecasts = [] } = useQuery({
    queryKey: ["/api/deal-forecasts"],
    queryFn: () => Promise.resolve([
      {
        dealId: "deal-1",
        dealName: "Enterprise License - Acme Corp",
        company: "Acme Corp",
        currentValue: 150000,
        predictedValue: 165000,
        closeProbability: 89,
        predictedCloseDate: "2024-07-15",
        stage: "Negotiation",
        owner: "Sarah Johnson",
        riskLevel: "low" as const,
        lastActivity: "2024-06-23T15:30:00Z"
      },
      {
        dealId: "deal-2",
        dealName: "Professional Plan - TechFlow",
        company: "TechFlow Inc",
        currentValue: 75000,
        predictedValue: 72000,
        closeProbability: 45,
        predictedCloseDate: "2024-08-30",
        stage: "Proposal",
        owner: "Mike Chen",
        riskLevel: "high" as const,
        lastActivity: "2024-06-20T11:45:00Z"
      },
      {
        dealId: "deal-3",
        dealName: "Custom Solution - Growth Labs",
        company: "Growth Labs",
        currentValue: 120000,
        predictedValue: 125000,
        closeProbability: 67,
        predictedCloseDate: "2024-07-31",
        stage: "Demo",
        owner: "Emma Rodriguez",
        riskLevel: "medium" as const,
        lastActivity: "2024-06-22T09:20:00Z"
      },
      {
        dealId: "deal-4",
        dealName: "Starter Package - BuildCo",
        company: "BuildCo Ltd",
        currentValue: 25000,
        predictedValue: 28000,
        closeProbability: 78,
        predictedCloseDate: "2024-07-10",
        stage: "Qualification",
        owner: "Alex Kumar",
        riskLevel: "low" as const,
        lastActivity: "2024-06-24T08:15:00Z"
      }
    ])
  });

  // Mock forecast metrics
  const { data: forecastMetrics } = useQuery({
    queryKey: ["/api/forecast-metrics"],
    queryFn: () => Promise.resolve({
      accuracy: 84.5,
      totalPipeline: 4200000,
      weightedPipeline: 2890000,
      averageDealSize: 87500,
      conversionRate: 23.4,
      salesCycleLength: 67,
      topPerformers: [
        { name: "Sarah Johnson", forecast: 485000, achievement: 92, dealsCount: 8 },
        { name: "Mike Chen", forecast: 367000, achievement: 87, dealsCount: 12 },
        { name: "Emma Rodriguez", forecast: 298000, achievement: 95, dealsCount: 6 },
        { name: "Alex Kumar", forecast: 234000, achievement: 78, dealsCount: 15 }
      ]
    })
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    const icons = {
      up: TrendingUp,
      down: TrendingDown,
      stable: Target
    };
    const Icon = icons[trend as keyof typeof icons] || Target;
    return <Icon className="h-4 w-4" />;
  };

  const getTrendColor = (trend: string) => {
    const colors = {
      up: "text-green-600",
      down: "text-red-600",
      stable: "text-gray-600"
    };
    return colors[trend as keyof typeof colors] || "text-gray-600";
  };

  const getRiskColor = (risk: string) => {
    const colors = {
      low: "text-green-600 bg-green-100",
      medium: "text-yellow-600 bg-yellow-100",
      high: "text-red-600 bg-red-100"
    };
    return colors[risk as keyof typeof colors] || "text-gray-600 bg-gray-100";
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const currentQuarter = forecastPeriods.find(p => p.period === "Q3 2024");
  const totalDealsValue = dealForecasts.reduce((sum, deal) => sum + deal.predictedValue, 0);
  const avgCloseProbability = dealForecasts.length > 0 
    ? dealForecasts.reduce((sum, deal) => sum + deal.closeProbability, 0) / dealForecasts.length
    : 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Forecasting</h1>
            <p className="text-gray-600 mt-1">AI-powered revenue predictions and pipeline analysis</p>
          </div>
          <div className="flex items-center space-x-3">
            <Select value={selectedTerritory} onValueChange={setSelectedTerritory}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Territories</SelectItem>
                <SelectItem value="north_america">North America</SelectItem>
                <SelectItem value="europe">Europe</SelectItem>
                <SelectItem value="apac">APAC</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_quarter">Current Quarter</SelectItem>
                <SelectItem value="next_quarter">Next Quarter</SelectItem>
                <SelectItem value="current_year">Current Year</SelectItem>
                <SelectItem value="next_year">Next Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly Forecast</TabsTrigger>
            <TabsTrigger value="deals">Deal Pipeline</TabsTrigger>
            <TabsTrigger value="accuracy">Accuracy Analysis</TabsTrigger>
            <TabsTrigger value="trends">Trends & Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Quarter</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {currentQuarter ? formatCurrency(currentQuarter.predicted) : 'Loading...'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentQuarter ? `${currentQuarter.confidence}% confidence` : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalDealsValue)}</div>
                  <p className="text-xs text-muted-foreground">
                    {dealForecasts.length} active deals
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Close Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgCloseProbability.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    Weighted probability
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Forecast Accuracy</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {forecastMetrics ? `${forecastMetrics.accuracy}%` : 'Loading...'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last 6 months
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quarterly Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Quarterly Forecast Overview</CardTitle>
                <CardDescription>Revenue predictions for upcoming quarters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {forecastPeriods.map((period) => (
                    <div key={period.period} className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${getTrendColor(period.trend)} bg-opacity-10`}>
                            {getTrendIcon(period.trend)({ className: `h-5 w-5 ${getTrendColor(period.trend)}` })}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{period.period}</h3>
                            <p className="text-sm text-gray-600">
                              Last updated: {new Date(period.lastUpdated).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge className={getConfidenceColor(period.confidence)}>
                          {period.confidence}% confidence
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <p className="text-sm text-gray-600">Target</p>
                          <p className="text-2xl font-bold">{formatCurrency(period.target)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Predicted</p>
                          <p className="text-2xl font-bold">{formatCurrency(period.predicted)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Variance</p>
                          <p className={`text-2xl font-bold ${period.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {period.variance >= 0 ? '+' : ''}{period.variance}%
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress to Target</span>
                          <span>{Math.min((period.predicted / period.target) * 100, 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.min((period.predicted / period.target) * 100, 100)} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Reps</CardTitle>
                <CardDescription>Sales representatives with highest forecast achievement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {forecastMetrics?.topPerformers.map((performer, index) => (
                    <div key={performer.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{performer.name}</p>
                          <p className="text-sm text-gray-600">{performer.dealsCount} active deals</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(performer.forecast)}</p>
                        <div className="flex items-center space-x-2">
                          <Badge className={performer.achievement >= 90 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                            {performer.achievement}% achievement
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quarterly" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {forecastPeriods.map((period) => (
                <Card key={period.period}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{period.period}</span>
                      <div className={`p-2 rounded-lg ${getTrendColor(period.trend)} bg-opacity-10`}>
                        {getTrendIcon(period.trend)({ className: `h-4 w-4 ${getTrendColor(period.trend)}` })}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{formatCurrency(period.predicted)}</p>
                      <p className="text-sm text-gray-600">Predicted Revenue</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Target</span>
                        <span className="font-medium">{formatCurrency(period.target)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Variance</span>
                        <span className={`font-medium ${period.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {period.variance >= 0 ? '+' : ''}{period.variance}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Confidence</span>
                        <Badge className={getConfidenceColor(period.confidence)}>
                          {period.confidence}%
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Target Achievement</span>
                        <span>{Math.min((period.predicted / period.target) * 100, 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min((period.predicted / period.target) * 100, 100)} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Forecast Confidence</span>
                        <span>{period.confidence}%</span>
                      </div>
                      <Progress value={period.confidence} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="deals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deal Pipeline Forecast</CardTitle>
                <CardDescription>Individual deal predictions and close probabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dealForecasts.map((deal) => (
                    <div key={deal.dealId} className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{deal.dealName}</h3>
                          <p className="text-gray-600">{deal.company} • {deal.owner}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getRiskColor(deal.riskLevel)}>
                            {deal.riskLevel} risk
                          </Badge>
                          <Badge variant="outline">{deal.stage}</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Current Value</p>
                          <p className="text-xl font-bold">{formatCurrency(deal.currentValue)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Predicted Value</p>
                          <p className="text-xl font-bold">{formatCurrency(deal.predictedValue)}</p>
                          <p className="text-xs text-gray-500">
                            {deal.predictedValue > deal.currentValue ? '+' : ''}{formatCurrency(deal.predictedValue - deal.currentValue)} variance
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Close Probability</p>
                          <p className="text-xl font-bold text-blue-600">{deal.closeProbability}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Predicted Close</p>
                          <p className="text-lg font-semibold">{new Date(deal.predictedCloseDate).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Close Probability</span>
                          <span>{deal.closeProbability}%</span>
                        </div>
                        <Progress value={deal.closeProbability} />
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <p className="text-xs text-gray-500">
                          Last activity: {new Date(deal.lastActivity).toLocaleString()}
                        </p>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                          <Button size="sm">
                            <Zap className="mr-2 h-4 w-4" />
                            Take Action
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accuracy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Forecast Accuracy Analysis</CardTitle>
                <CardDescription>Historical accuracy and prediction model performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Advanced Analytics Coming Soon</h3>
                  <p>Detailed accuracy metrics, model performance, and prediction confidence analysis.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Trends & Insights</CardTitle>
                <CardDescription>AI-powered market analysis and forecasting trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Market Intelligence Dashboard</h3>
                  <p>Advanced trend analysis, market insights, and competitive intelligence coming soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}