import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Heart, AlertTriangle, TrendingUp, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface EmotionalIntelligenceWidgetProps {
  customerId?: string;
  showFullDashboard?: boolean;
}

export default function EmotionalIntelligenceWidget({ customerId, showFullDashboard = false }: EmotionalIntelligenceWidgetProps) {
  const [emotionalData, setEmotionalData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customerId) {
      loadCustomerEmotionalProfile();
    }
  }, [customerId]);

  const loadCustomerEmotionalProfile = async () => {
    if (!customerId) return;
    
    setLoading(true);
    try {
      const response = await apiRequest("GET", `/api/emotional-intelligence/profile/${customerId}`);
      if (response.success) {
        setEmotionalData(response.data);
      }
    } catch (error) {
      console.error("Failed to load emotional profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE': return 'text-green-600 bg-green-50 border-green-200';
      case 'NEGATIVE': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  if (showFullDashboard) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Brain className="h-5 w-5" />
            Emotional Intelligence Hub
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">AI-Powered</div>
              <div className="text-sm text-gray-600">Emotion Analysis</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">Real-Time</div>
              <div className="text-sm text-gray-600">Sentiment Tracking</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 bg-white rounded-lg border">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="text-sm">Customer Sentiment Analysis</span>
              </div>
              <Badge className="text-green-600 bg-green-50">Active</Badge>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-white rounded-lg border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Churn Risk Prediction</span>
              </div>
              <Badge className="text-green-600 bg-green-50">Active</Badge>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-white rounded-lg border">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Empathetic Response AI</span>
              </div>
              <Badge className="text-green-600 bg-green-50">Active</Badge>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <Button asChild className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
              <Link to="/emotional-intelligence">
                <Brain className="h-4 w-4 mr-2" />
                Open AI Intelligence Hub
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-700 text-lg">
          <Brain className="h-5 w-5" />
          Emotional Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Analyzing emotions...</p>
          </div>
        ) : emotionalData ? (
          <div className="space-y-3">
            {emotionalData.churnPrediction && (
              <div>
                <label className="text-sm font-medium text-gray-700">Churn Risk</label>
                <Badge className={getRiskColor(emotionalData.churnPrediction.riskLevel)}>
                  {emotionalData.churnPrediction.riskLevel} RISK
                </Badge>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-700">Recent Interactions</label>
              <p className="text-sm text-gray-600">{emotionalData.analysisLogs?.length || 0} analyzed</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Emotional Patterns</label>
              <div className="text-xs text-gray-500">
                {emotionalData.emotionalHistory?.length > 0 ? 
                  `${emotionalData.emotionalHistory.length} profiles tracked` : 
                  "No patterns yet"
                }
              </div>
            </div>
          </div>
        ) : customerId ? (
          <div className="text-center py-4">
            <Brain className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No emotional data available</p>
            <Button 
              onClick={loadCustomerEmotionalProfile}
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Analyze Customer
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <Heart className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">AI Emotional Intelligence Ready</p>
            <p className="text-xs text-gray-500 mb-3">Understand customer emotions in real-time</p>
            <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Link to="/emotional-intelligence">Try Now</Link>
            </Button>
          </div>
        )}

        <div className="mt-4 pt-3 border-t">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to="/emotional-intelligence">
              <TrendingUp className="h-4 w-4 mr-2" />
              Full Dashboard
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}