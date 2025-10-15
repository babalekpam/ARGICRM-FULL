import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTabManager } from "@/hooks/useTabManager";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@shared/currencies";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  LineChart,
  Target,
  Users,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Settings,
  Brain,
  Zap,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from "lucide-react";

interface AnalyticsMetric {
  name: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  target?: string;
  confidence?: number;
}

interface PredictiveInsight {
  id: string;
  type: 'revenue' | 'churn' | 'conversion' | 'growth';
  title: string;
  prediction: string;
  confidence: number;
  timeframe: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  factors: string[];
}

interface CustomerSegment {
  name: string;
  size: number;
  value: number;
  growth: string;
  characteristics: string[];
  risk: 'low' | 'medium' | 'high';
}

interface DeviceUsage {
  device: string;
  icon: any;
  users: number;
  percentage: number;
  growth: string;
  avgSession: string;
}

const KEY_METRICS: AnalyticsMetric[] = [
  {
    name: 'Total Revenue',
    value: formatCurrency(0, 'USD'),
    change: '0%',
    trend: 'stable',
    target: formatCurrency(0, 'USD'),
    confidence: 0
  },
  {
    name: 'Customer Lifetime Value',
    value: formatCurrency(0, 'USD'),
    change: '0%',
    trend: 'stable',
    target: formatCurrency(0, 'USD'),
    confidence: 0
  },
  {
    name: 'Churn Rate',
    value: '0%',
    change: '0%',
    trend: 'stable',
    target: '0%',
    confidence: 0
  },
  {
    name: 'Conversion Rate',
    value: '0%',
    change: '0%',
    trend: 'stable',
    target: '0%',
    confidence: 0
  },
  {
    name: 'Customer Acquisition Cost',
    value: formatCurrency(0, 'USD'),
    change: '0%',
    trend: 'stable',
    target: formatCurrency(0, 'USD'),
    confidence: 0
  },
  {
    name: 'Monthly Recurring Revenue',
    value: formatCurrency(0, 'USD'),
    change: '0%',
    trend: 'stable',
    target: formatCurrency(0, 'USD'),
    confidence: 0
  }
];

const PREDICTIVE_INSIGHTS: PredictiveInsight[] = [];

const CUSTOMER_SEGMENTS: CustomerSegment[] = [];

const DEVICE_USAGE: DeviceUsage[] = [];

export default function AdvancedAnalytics() {
  const { activeTab, setActiveTab } = useTabManager({
    defaultTab: "overview",
    queryInvalidationKeys: [
      ["/api/analytics/real-time"],
      ["/api/analytics/predictive"],
      ["/api/analytics/segments"],
      ["/api/analytics/mobile"],
      ["/api/analytics/roi"],
      ["/api/analytics/forecasting"]
    ],
    persistKey: "advanced-analytics"
  });
  
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch real-time analytics
  const { data: realTimeData, isLoading: realTimeLoading } = useQuery({
    queryKey: ["/api/analytics/real-time", timeRange],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch predictive analytics
  const { data: predictiveData, isLoading: predictiveLoading } = useQuery({
    queryKey: ["/api/analytics/predictive"],
    enabled: activeTab === "predictive"
  });

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidate and refetch all analytics queries
      await queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      await queryClient.refetchQueries({ queryKey: ["/api/analytics/real-time"] });
      await queryClient.refetchQueries({ queryKey: ["/api/analytics/predictive"] });
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const MetricCard = ({ metric }: { metric: AnalyticsMetric }) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
          {metric.trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : metric.trend === 'down' ? (
            <TrendingDown className="h-4 w-4 text-red-600" />
          ) : (
            <Target className="h-4 w-4 text-gray-600" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold">{metric.value}</div>
          <div className="flex items-center justify-between">
            <div className={`text-sm flex items-center ${
              metric.change.startsWith('+') ? 'text-green-600' : 
              metric.change.startsWith('-') && metric.name.includes('Cost') ? 'text-green-600' :
              metric.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
            }`}>
              {metric.change} vs last period
            </div>
            {metric.confidence && (
              <Badge variant="outline" className="text-xs">
                {metric.confidence}% confidence
              </Badge>
            )}
          </div>
          {metric.target && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Target: {metric.target}</span>
                <span>{Math.round((parseFloat(metric.value.replace(/[^0-9.-]/g, '')) / parseFloat(metric.target.replace(/[^0-9.-]/g, ''))) * 100)}%</span>
              </div>
              <Progress 
                value={Math.min((parseFloat(metric.value.replace(/[^0-9.-]/g, '')) / parseFloat(metric.target.replace(/[^0-9.-]/g, ''))) * 100, 100)} 
                className="h-2"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const PredictiveInsightCard = ({ insight }: { insight: PredictiveInsight }) => (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">{insight.title}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
              {insight.impact} impact
            </Badge>
            <Badge variant="outline">{insight.confidence}% confidence</Badge>
          </div>
        </div>
        <CardDescription>{insight.timeframe}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Prediction</h4>
            <p className="text-sm text-gray-600">{insight.prediction}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Recommendation</h4>
            <p className="text-sm text-gray-600">{insight.recommendation}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Key Factors</h4>
            <div className="flex flex-wrap gap-1">
              {insight.factors.map(factor => (
                <Badge key={factor} variant="secondary" className="text-xs">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex space-x-2 pt-2">
            <Button size="sm">View Details</Button>
            <Button size="sm" variant="outline">Set Alert</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const CustomerSegmentCard = ({ segment }: { segment: CustomerSegment }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{segment.name}</CardTitle>
          <Badge variant={segment.risk === 'low' ? 'default' : segment.risk === 'medium' ? 'secondary' : 'destructive'}>
            {segment.risk} risk
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold">{segment.size}</div>
              <p className="text-sm text-gray-600">Customers</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{formatCurrency(segment.value, 'USD')}</div>
              <p className="text-sm text-gray-600">Total Value</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Growth</span>
            <span className="text-sm text-green-600">{segment.growth}</span>
          </div>
          <div>
            <h5 className="text-sm font-medium mb-2">Characteristics</h5>
            <div className="space-y-1">
              {segment.characteristics.map(char => (
                <div key={char} className="text-xs text-gray-600">• {char}</div>
              ))}
            </div>
          </div>
          <Button size="sm" className="w-full">View Segment</Button>
        </div>
      </CardContent>
    </Card>
  );

  const MobileAnalyticsCard = ({ device }: { device: DeviceUsage }) => {
    const IconComponent = device.icon;
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <IconComponent className="h-6 w-6 text-blue-600" />
              <CardTitle>{device.device}</CardTitle>
            </div>
            <Badge variant="outline" className={device.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
              {device.growth}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-3xl font-bold">{device.users.toLocaleString()}</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Market Share</span>
                <span className="font-medium">{device.percentage}%</span>
              </div>
              <Progress value={device.percentage} className="h-2" />
            </div>
            <div className="flex justify-between text-sm">
              <span>Avg Session</span>
              <span className="font-medium">{device.avgSession}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Advanced Analytics & Insights</h1>
            <p className="text-gray-600 dark:text-gray-400">
              AI-powered analytics with predictive insights and real-time intelligence
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="90d">90 days</SelectItem>
                <SelectItem value="1y">1 year</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="predictive">Predictive AI</TabsTrigger>
            <TabsTrigger value="segments">Customer Segments</TabsTrigger>
            <TabsTrigger value="mobile">Mobile Analytics</TabsTrigger>
            <TabsTrigger value="roi">ROI Tracking</TabsTrigger>
            <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {KEY_METRICS.map(metric => (
                <MetricCard key={metric.name} metric={metric} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend Analysis</CardTitle>
                  <CardDescription>Monthly revenue progression with forecasting</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <LineChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Revenue Trend Chart</p>
                      <p className="text-sm text-gray-500">Interactive chart with AI predictions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Dashboard</CardTitle>
                  <CardDescription>Real-time KPI monitoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sales Target Achievement</span>
                      <span className="text-sm font-medium">0%</span>
                    </div>
                    <Progress value={0} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Customer Satisfaction</span>
                      <span className="text-sm font-medium">0%</span>
                    </div>
                    <Progress value={0} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Market Share Growth</span>
                      <span className="text-sm font-medium">0%</span>
                    </div>
                    <Progress value={0} className="h-2" />
                    
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-400">0%</div>
                        <div className="text-xs text-gray-600">Growth Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-400">0/5</div>
                        <div className="text-xs text-gray-600">NPS Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-400">0%</div>
                        <div className="text-xs text-gray-600">Retention</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="predictive" className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold">AI-Powered Predictive Insights</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Machine learning algorithms analyze patterns to predict future outcomes and recommend actions
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {PREDICTIVE_INSIGHTS.map(insight => (
                <PredictiveInsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="segments" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Customer Segmentation Analysis</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                AI-driven customer segmentation with behavior patterns and value analysis
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {CUSTOMER_SEGMENTS.map(segment => (
                <CustomerSegmentCard key={segment.name} segment={segment} />
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Segment Performance Comparison</CardTitle>
                <CardDescription>Revenue contribution and growth metrics by customer segment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Segment Analysis Chart</p>
                    <p className="text-sm text-gray-500">Interactive segmentation visualization</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mobile" className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Smartphone className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Mobile-First Analytics</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Device usage patterns and mobile experience optimization insights
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DEVICE_USAGE.map(device => (
                <MobileAnalyticsCard key={device.device} device={device} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mobile User Journey</CardTitle>
                  <CardDescription>Touch points and conversion funnel on mobile devices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <Eye className="h-5 w-5 text-gray-400" />
                        <span>App Launch</span>
                      </div>
                      <span className="font-medium">0 users</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-gray-400" />
                        <span>Feature Engagement</span>
                      </div>
                      <span className="font-medium">0 users (0%)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <Target className="h-5 w-5 text-gray-400" />
                        <span>Conversion</span>
                      </div>
                      <span className="font-medium">0 users (0%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mobile Performance Metrics</CardTitle>
                  <CardDescription>Key performance indicators for mobile experience</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold">0s</div>
                        <p className="text-sm text-gray-600">Avg Load Time</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">0%</div>
                        <p className="text-sm text-gray-600">Uptime</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold">0/5</div>
                        <p className="text-sm text-gray-600">App Store Rating</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">0%</div>
                        <p className="text-sm text-gray-600">User Satisfaction</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <Button className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Optimize Mobile Experience
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="roi" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">ROI Tracking Across Channels</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Comprehensive return on investment analysis for all marketing and sales activities
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Marketing ROI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-400">0%</div>
                  <p className="text-sm text-gray-600">Campaign returns</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Sales ROI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-400">0%</div>
                  <p className="text-sm text-gray-600">Sales team efficiency</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Technology ROI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-400">0%</div>
                  <p className="text-sm text-gray-600">Platform investment</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Overall ROI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-400">0%</div>
                  <p className="text-sm text-gray-600">Total return</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="forecasting" className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Sales Forecasting</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                AI-powered sales predictions with scenario modeling and confidence intervals
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Q2 2024 Forecast</CardTitle>
                  <CardDescription>Conservative estimate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(0, 'USD')}</div>
                  <div className="text-sm text-gray-600 mt-2">0% confidence</div>
                  <Progress value={0} className="h-2 mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Q2 2024 Forecast</CardTitle>
                  <CardDescription>Optimistic estimate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(0, 'USD')}</div>
                  <div className="text-sm text-gray-600 mt-2">0% confidence</div>
                  <Progress value={0} className="h-2 mt-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Q2 2024 Forecast</CardTitle>
                  <CardDescription>Most likely estimate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-400">{formatCurrency(0, 'USD')}</div>
                  <div className="text-sm text-gray-600 mt-2">0% confidence</div>
                  <Progress value={0} className="h-2 mt-2" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}