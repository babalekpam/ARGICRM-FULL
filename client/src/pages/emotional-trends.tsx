import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Brain, 
  AlertTriangle, 
  Target,
  Calendar,
  BarChart3,
  Users,
  Activity,
  Heart,
  Zap,
  User,
  Clock,
  ArrowUp,
  ArrowDown,
  Eye
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface EmotionalTrend {
  contactId: string;
  contactName: string;
  currentTrend: 'improving' | 'declining' | 'stable';
  trendStrength: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictions: {
    next7Days: PredictionPeriod;
    next30Days: PredictionPeriod;
    next90Days: PredictionPeriod;
  };
  insights: string[];
  recommendations: string[];
  emotionalJourney: EmotionalDataPoint[];
}

interface PredictionPeriod {
  predictedSentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence: number;
  churnRisk: number;
  satisfactionScore: number;
  engagementLevel: number;
  keyFactors: string[];
}

interface EmotionalDataPoint {
  date: Date;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence: number;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  source: string;
}

interface TrendAnalytics {
  totalContacts: number;
  improvingTrends: number;
  decliningTrends: number;
  stableTrends: number;
  highRiskContacts: number;
  averageSatisfaction: number;
  predictedChurnRate: number;
  topRiskFactors: Array<{ factor: string; impact: number }>;
}

const EmotionalTrendsPage: React.FC = () => {
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'7days' | '30days' | '90days'>('30days');

  // Fetch emotional trends data
  const { data: trendsData, isLoading: trendsLoading, error: trendsError } = useQuery<any>({
    queryKey: ['/api/emotional-trends/trends'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch analytics data
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery<any>({
    queryKey: ['/api/emotional-trends/analytics'],
    refetchInterval: 30000,
  });

  // Fetch contacts data for debugging
  const { data: contactsData, isLoading: contactsLoading, error: contactsError } = useQuery<any>({
    queryKey: ['/api/contacts'],
  });

  // Debug logging
  console.log("Emotional Trends Page Debug:");
  console.log("- Trends data:", trendsData);
  console.log("- Trends loading:", trendsLoading);
  console.log("- Trends error:", trendsError);
  console.log("- Analytics data:", analyticsData);
  console.log("- Analytics loading:", analyticsLoading);
  console.log("- Analytics error:", analyticsError);
  console.log("- Contacts data:", contactsData);
  console.log("- Contacts loading:", contactsLoading);
  console.log("- Contacts error:", contactsError);
  console.log("- Contacts length:", Array.isArray(contactsData) ? contactsData.length : "Not an array");

  const trends: EmotionalTrend[] = (trendsData as any)?.trends || [];
  const analytics: TrendAnalytics = (analyticsData as any)?.analytics || {
    totalContacts: 0,
    improvingTrends: 0,
    decliningTrends: 0,
    stableTrends: 0,
    highRiskContacts: 0,
    averageSatisfaction: 0,
    predictedChurnRate: 0,
    topRiskFactors: []
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE': return '#22c55e';
      case 'NEGATIVE': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const prepareTimeSeriesData = (journey: EmotionalDataPoint[]) => {
    return journey.map((point, index) => ({
      date: new Date(point.date).toLocaleDateString(),
      sentiment: point.sentiment === 'POSITIVE' ? 1 : point.sentiment === 'NEGATIVE' ? -1 : 0,
      confidence: point.confidence,
      urgency: point.urgencyLevel === 'HIGH' ? 3 : point.urgencyLevel === 'MEDIUM' ? 2 : 1,
      rawSentiment: point.sentiment
    }));
  };

  const preparePredictionData = (predictions: any) => {
    return [
      {
        period: '7 Days',
        satisfaction: predictions.next7Days.satisfactionScore,
        churnRisk: predictions.next7Days.churnRisk,
        engagement: predictions.next7Days.engagementLevel,
        confidence: predictions.next7Days.confidence
      },
      {
        period: '30 Days',
        satisfaction: predictions.next30Days.satisfactionScore,
        churnRisk: predictions.next30Days.churnRisk,
        engagement: predictions.next30Days.engagementLevel,
        confidence: predictions.next30Days.confidence
      },
      {
        period: '90 Days',
        satisfaction: predictions.next90Days.satisfactionScore,
        churnRisk: predictions.next90Days.churnRisk,
        engagement: predictions.next90Days.engagementLevel,
        confidence: predictions.next90Days.confidence
      }
    ];
  };

  const trendDistributionData = [
    { name: 'Improving', value: analytics.improvingTrends, color: '#22c55e' },
    { name: 'Declining', value: analytics.decliningTrends, color: '#ef4444' },
    { name: 'Stable', value: analytics.stableTrends, color: '#6b7280' }
  ];

  if (trendsLoading || analyticsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <Brain className="h-8 w-8 mr-3 text-purple-600" />
              Predictive Emotional Trends
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              AI-powered customer emotional intelligence with predictive analytics
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant={timeframe === '7days' ? 'default' : 'outline'}
              onClick={() => setTimeframe('7days')}
              size="sm"
            >
              7 Days
            </Button>
            <Button 
              variant={timeframe === '30days' ? 'default' : 'outline'}
              onClick={() => setTimeframe('30days')}
              size="sm"
            >
              30 Days
            </Button>
            <Button 
              variant={timeframe === '90days' ? 'default' : 'outline'}
              onClick={() => setTimeframe('90days')}
              size="sm"
            >
              90 Days
            </Button>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalContacts}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.improvingTrends} improving trends
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
              <Heart className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.averageSatisfaction}%</div>
              <Progress value={analytics.averageSatisfaction} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk Contacts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{analytics.highRiskContacts}</div>
              <p className="text-xs text-muted-foreground">
                {((analytics.highRiskContacts / analytics.totalContacts) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Predicted Churn</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{analytics.predictedChurnRate}%</div>
              <Progress value={analytics.predictedChurnRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Customer Trends</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trend Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Trend Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={trendDistributionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {trendDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Risk Factors */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Top Risk Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topRiskFactors.map((factor, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{factor.factor}</span>
                          <span className="font-medium">{factor.impact}%</span>
                        </div>
                        <Progress value={factor.impact} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Customer List */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Customer Trends
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    {trends.map((trend) => (
                      <div 
                        key={trend.contactId}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          selectedContact === trend.contactId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        onClick={() => setSelectedContact(trend.contactId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getTrendIcon(trend.currentTrend)}
                            <span className="font-medium">{trend.contactName}</span>
                          </div>
                          <Badge variant={getRiskColor(trend.riskLevel) as any}>
                            {trend.riskLevel}
                          </Badge>
                        </div>
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          Strength: {trend.trendStrength}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Selected Customer Details */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    {selectedContact ? 
                      trends.find(t => t.contactId === selectedContact)?.contactName : 
                      'Select a customer'
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedContact ? (
                    <div className="space-y-6">
                      {(() => {
                        const trend = trends.find(t => t.contactId === selectedContact);
                        if (!trend) return null;

                        const timeSeriesData = prepareTimeSeriesData(trend.emotionalJourney);
                        
                        return (
                          <>
                            {/* Emotional Journey Chart */}
                            <div>
                              <h4 className="font-medium mb-3">Emotional Journey</h4>
                              <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={timeSeriesData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" />
                                  <YAxis domain={[-1, 1]} />
                                  <Tooltip 
                                    formatter={(value: any) => [
                                      value === 1 ? 'Positive' : value === -1 ? 'Negative' : 'Neutral',
                                      'Sentiment'
                                    ]}
                                  />
                                  <Area 
                                    type="monotone" 
                                    dataKey="sentiment" 
                                    stroke="#8884d8" 
                                    fill="#8884d8" 
                                    fillOpacity={0.3} 
                                  />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>

                            {/* Insights & Recommendations */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2 flex items-center">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Insights
                                </h4>
                                <ul className="space-y-2 text-sm">
                                  {trend.insights.map((insight, index) => (
                                    <li key={index} className="flex items-start">
                                      <ArrowUp className="h-3 w-3 mr-2 mt-1 text-blue-500" />
                                      {insight}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2 flex items-center">
                                  <Zap className="h-4 w-4 mr-2" />
                                  Recommendations
                                </h4>
                                <ul className="space-y-2 text-sm">
                                  {trend.recommendations.map((rec, index) => (
                                    <li key={index} className="flex items-start">
                                      <ArrowDown className="h-3 w-3 mr-2 mt-1 text-green-500" />
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-12">
                      Select a customer from the list to view their emotional trend details
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6">
            {selectedContact ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(() => {
                  const trend = trends.find(t => t.contactId === selectedContact);
                  if (!trend) return null;

                  const predictionData = preparePredictionData(trend.predictions);

                  return (
                    <>
                      {/* Prediction Charts */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <BarChart3 className="h-5 w-5 mr-2" />
                            Satisfaction Prediction
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={predictionData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="period" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="satisfaction" fill="#22c55e" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            Churn Risk Prediction
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={predictionData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="period" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="churnRisk" fill="#ef4444" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Prediction Details */}
                      <Card className="lg:col-span-2">
                        <CardHeader>
                          <CardTitle>Detailed Predictions</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                              { key: 'next7Days', label: '7 Days' },
                              { key: 'next30Days', label: '30 Days' },
                              { key: 'next90Days', label: '90 Days' }
                            ].map(({ key, label }) => {
                              const prediction = trend.predictions[key as keyof typeof trend.predictions];
                              return (
                                <div key={key} className="space-y-4">
                                  <h4 className="font-medium text-lg">{label}</h4>
                                  <div className="space-y-3">
                                    <div className="flex justify-between">
                                      <span className="text-sm">Predicted Sentiment:</span>
                                      <Badge 
                                        style={{ 
                                          backgroundColor: getSentimentColor(prediction.predictedSentiment),
                                          color: 'white'
                                        }}
                                      >
                                        {prediction.predictedSentiment}
                                      </Badge>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span>Satisfaction:</span>
                                        <span>{prediction.satisfactionScore}%</span>
                                      </div>
                                      <Progress value={prediction.satisfactionScore} />
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span>Churn Risk:</span>
                                        <span className="text-red-600">{prediction.churnRisk}%</span>
                                      </div>
                                      <Progress value={prediction.churnRisk} />
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span>Confidence:</span>
                                        <span>{prediction.confidence}%</span>
                                      </div>
                                      <Progress value={prediction.confidence} />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Brain className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a Customer
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose a customer from the Trends tab to view their predictive analytics
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trend Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Trend Analysis Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{analytics.improvingTrends}</div>
                      <div className="text-sm text-green-700 dark:text-green-300">Improving</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{analytics.decliningTrends}</div>
                      <div className="text-sm text-red-700 dark:text-red-300">Declining</div>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{analytics.stableTrends}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">Stable</div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>High Risk Contacts:</span>
                      <span className="font-medium">{analytics.highRiskContacts}</span>
                    </div>
                    <Progress value={(analytics.highRiskContacts / analytics.totalContacts) * 100} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Predicted Churn Rate:</span>
                      <span className="font-medium text-red-600">{analytics.predictedChurnRate}%</span>
                    </div>
                    <Progress value={analytics.predictedChurnRate} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Average Satisfaction:</span>
                      <span className="font-medium text-green-600">{analytics.averageSatisfaction}%</span>
                    </div>
                    <Progress value={analytics.averageSatisfaction} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EmotionalTrendsPage;