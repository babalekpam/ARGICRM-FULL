import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { InsightDetailModal } from "@/components/insight-detail-modal";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  MessageSquare, 
  DollarSign,
  Brain,
  Target,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from "lucide-react";

interface UserBehaviorInsight {
  id: string;
  type: 'pattern' | 'prediction' | 'recommendation' | 'alert';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  data: any;
}

interface PredictiveWidget {
  id: string;
  title: string;
  type: 'behavior' | 'performance' | 'opportunity' | 'risk';
  insights: UserBehaviorInsight[];
  score: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

export function PredictiveBehaviorWidget() {
  const [insights, setInsights] = useState<UserBehaviorInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<UserBehaviorInsight | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // ALL PREDICTIVE INSIGHTS RESET TO EMPTY
    setTimeout(() => {
      setInsights([]);
      setLoading(false);
    }, 1000);
  }, []);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction': return <Brain className="h-4 w-4" />;
      case 'pattern': return <TrendingUp className="h-4 w-4" />;
      case 'recommendation': return <Target className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-600" />
            Predictive Insights
          </CardTitle>
          <CardDescription>AI-powered behavior analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-600" />
            Predictive Insights
          </div>
          <Badge variant="outline" className="text-xs">
            AI Powered
          </Badge>
        </CardTitle>
        <CardDescription>Real-time behavior predictions and patterns</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight) => (
          <div key={insight.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                {getInsightIcon(insight.type)}
                <span className="font-medium text-sm">{insight.title}</span>
              </div>
              <Badge variant={getImpactColor(insight.impact)} className="text-xs">
                {insight.impact} impact
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600">{insight.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">Confidence:</span>
                  <span className="text-xs font-medium">{insight.confidence}%</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{insight.timeframe}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2"
                onClick={() => {
                  setSelectedInsight(insight);
                  setModalOpen(true);
                }}
              >
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            
            <Progress value={insight.confidence} className="h-1" />
          </div>
        ))}
        
        <Button variant="outline" className="w-full" size="sm">
          View All Insights
        </Button>

        <InsightDetailModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          insight={selectedInsight}
        />
      </CardContent>
    </Card>
  );
}

export function PersonalizedPerformanceWidget() {
  const [metrics, setMetrics] = useState({
    conversionRate: 0,
    averageDealSize: 0,
    responseTime: 0,
    customerSatisfaction: 0,
    trends: {
      conversion: 'stable',
      dealSize: 'stable',
      response: 'stable',
      satisfaction: 'stable'
    }
  });

  const formatTrend = (value: number, trend: string) => {
    const icon = trend === 'up' ? <TrendingUp className="h-3 w-3 text-green-600" /> :
                 trend === 'down' ? <TrendingDown className="h-3 w-3 text-red-600" /> :
                 <div className="h-3 w-3"></div>;
    
    return (
      <div className="flex items-center space-x-1">
        <span className="font-semibold">{value}</span>
        {icon}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="h-5 w-5 mr-2 text-green-600" />
          Your Performance
        </CardTitle>
        <CardDescription>Personalized metrics based on your activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Conversion Rate</p>
            {formatTrend(0, metrics.trends.conversion)}
            <p className="text-xs text-gray-400">vs 0% team avg</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Avg Deal Size</p>
            {formatTrend(0, metrics.trends.dealSize)}
            <p className="text-xs text-gray-400">vs $0 team avg</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Response Time</p>
            {formatTrend(0, metrics.trends.response)}
            <p className="text-xs text-gray-400">vs 0h team avg</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Satisfaction</p>
            {formatTrend(0, metrics.trends.satisfaction)}
            <p className="text-xs text-gray-400">vs 0 team avg</p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Performance Insight</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            No performance data available. Start tracking activities to generate insights.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface Opportunity {
  id: number;
  type: string;
  account: string;
  value: number;
  probability: number;
  insight: string;
  action: string;
}

export function OpportunityPredictionWidget() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  const getOpportunityColor = (type: string) => {
    switch (type) {
      case 'upsell': return 'bg-green-100 text-green-800';
      case 'cross-sell': return 'bg-blue-100 text-blue-800';
      case 'renewal': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="h-5 w-5 mr-2 text-yellow-600" />
          Revenue Opportunities
        </CardTitle>
        <CardDescription>AI-identified sales opportunities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {opportunities.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-gray-400 mb-2">
              <DollarSign className="h-8 w-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-500">No revenue opportunities identified</p>
            <p className="text-xs text-gray-400 mt-1">AI will analyze data to identify new opportunities</p>
          </div>
        ) : (
          opportunities.map((opp) => (
            <div key={opp.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{opp.account}</span>
                <Badge className={getOpportunityColor(opp.type)}>
                  {opp.type}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-green-600">
                  ${opp.value.toLocaleString()}
                </span>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">Probability:</span>
                  <span className="text-sm font-medium">{opp.probability}%</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-600">{opp.insight}</p>
              
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" className="text-xs">
                  {opp.action}
                </Button>
                <Progress value={opp.probability} className="w-16 h-1" />
              </div>
            </div>
          ))
        )}
        
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Potential Revenue:</span>
            <span className="font-bold text-green-600">
              ${opportunities.reduce((sum, opp) => sum + opp.value, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ActivityPredictionWidget() {
  const [predictions, setPredictions] = useState({
    nextWeekCalls: 0,
    expectedMeetings: 0,
    likelyDeals: 0,
    recommendedActions: []
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
          Activity Predictions
        </CardTitle>
        <CardDescription>Your upcoming week forecast</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{predictions.nextWeekCalls}</div>
            <div className="text-xs text-gray-500">Predicted Calls</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{predictions.expectedMeetings}</div>
            <div className="text-xs text-gray-500">Expected Meetings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{predictions.likelyDeals}</div>
            <div className="text-xs text-gray-500">Likely Closes</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Recommended Actions</h4>
          {predictions.recommendedActions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-gray-500">No actions recommended</p>
              <p className="text-xs text-gray-400">Complete activities to generate AI recommendations</p>
            </div>
          ) : (
            predictions.recommendedActions.map((action, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                <span className="text-xs text-gray-600">{action}</span>
              </div>
            ))
          )}
        </div>
        
        <Button variant="outline" className="w-full" size="sm">
          View Full Schedule
        </Button>
      </CardContent>
    </Card>
  );
}