import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Activity, 
  Target, 
  Clock, 
  BarChart3,
  Calendar,
  Zap,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { behaviorAnalytics } from "@/services/behavior-analytics";
import { useBehaviorTracking } from "@/hooks/useBehaviorTracking";

export default function BehaviorAnalyticsPage() {
  const [activeTab, setActiveTab] = useState("insights");
  const { getUserInsights, getUserPatterns, getUserActions } = useBehaviorTracking({ 
    userId: 'current_user',
    enableAutoTracking: false 
  });
  
  const [insights, setInsights] = useState(getUserInsights());
  const [patterns, setPatterns] = useState(getUserPatterns());
  const [actions, setActions] = useState(getUserActions(20));

  const refreshData = () => {
    setInsights(getUserInsights());
    setPatterns(getUserPatterns());
    setActions(getUserActions(20));
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'conversion': return <Target className="h-4 w-4" />;
      case 'engagement': return <Activity className="h-4 w-4" />;
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'churn': return <AlertTriangle className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Brain className="mr-3 h-8 w-8 text-purple-600" />
            Behavior Analytics
          </h1>
          <p className="text-gray-600 mt-1">AI-powered insights into user behavior patterns and predictions</p>
        </div>
        <Button onClick={refreshData} variant="outline" className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getInsightIcon(insight.type)}
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                    </div>
                    <Badge className={getImpactColor(insight.impact)}>
                      {insight.impact}
                    </Badge>
                  </div>
                  <CardDescription>{insight.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Confidence</span>
                    <span className="font-medium">{insight.confidence}%</span>
                  </div>
                  <Progress value={insight.confidence} className="h-2" />
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{insight.timeframe}</span>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium text-sm">Recommendations:</h5>
                    {insight.recommendations.slice(0, 2).map((rec, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        <span className="text-xs text-gray-600">{rec}</span>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {insights.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Insights Available</h3>
                <p className="text-gray-500 mb-4">Continue using the platform to generate AI insights</p>
                <Button onClick={refreshData}>Check for Updates</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {patterns.map((pattern) => (
              <Card key={pattern.id}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Behavior Pattern</span>
                  </CardTitle>
                  <CardDescription>
                    Pattern: {pattern.pattern.replace(/_/g, ' ').toUpperCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Frequency</span>
                      <div className="text-2xl font-bold text-blue-600">{pattern.frequency}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Confidence</span>
                      <div className="text-2xl font-bold text-green-600">{pattern.confidence.toFixed(0)}%</div>
                    </div>
                  </div>
                  
                  <Progress value={pattern.confidence} className="h-2" />
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        Last: {new Date(pattern.lastOccurrence).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        Next predicted: {new Date(pattern.predictedNext).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {patterns.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Patterns Detected</h3>
                <p className="text-gray-500">Patterns will appear after more activity data is collected</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-600" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>Your recent actions and interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {actions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Zap className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{action.action.replace(/_/g, ' ').toUpperCase()}</div>
                        {action.context && Object.keys(action.context).length > 0 && (
                          <div className="text-xs text-gray-500">
                            {Object.entries(action.context).map(([key, value]) => (
                              <span key={key}>{key}: {String(value)} </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(action.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>

              {actions.length === 0 && (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No recent activity recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Settings</CardTitle>
              <CardDescription>Configure your behavior analytics preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto-tracking</h4>
                    <p className="text-sm text-gray-500">Automatically track user interactions</p>
                  </div>
                  <Badge variant="outline">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Predictive Insights</h4>
                    <p className="text-sm text-gray-500">Generate AI-powered predictions</p>
                  </div>
                  <Badge variant="outline">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Data Retention</h4>
                    <p className="text-sm text-gray-500">How long to keep analytics data</p>
                  </div>
                  <Badge variant="outline">90 days</Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full">
                  Export Analytics Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}