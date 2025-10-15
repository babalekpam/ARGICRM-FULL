import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Heart, AlertTriangle, TrendingUp, MessageSquare, Activity, Users } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface PlatformWideEmotionalIntelligenceProps {
  showInDashboard?: boolean;
  contactId?: string;
}

export default function PlatformWideEmotionalIntelligence({ 
  showInDashboard = false, 
  contactId 
}: PlatformWideEmotionalIntelligenceProps) {
  const { user } = useAuth();
  const [emotionalStats, setEmotionalStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmotionalIntelligenceStats();
  }, [user]);

  const loadEmotionalIntelligenceStats = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await apiRequest("GET", "/api/emotional-intelligence/platform-stats");
      if (response.success) {
        setEmotionalStats(response.data);
      }
    } catch (error) {
      console.error("Failed to load emotional intelligence stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeCustomerEmotion = async (customerId: string, message: string) => {
    try {
      const response = await apiRequest("POST", "/api/emotional-intelligence/analyze", {
        customerId,
        content: message,
        source: "contact_interaction"
      });
      
      if (response.success) {
        // Update emotional stats
        loadEmotionalIntelligenceStats();
        return response.data;
      }
    } catch (error) {
      console.error("Failed to analyze emotion:", error);
    }
  };

  if (showInDashboard) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-700">
              <Brain className="h-5 w-5" />
              AI Emotional Intelligence
            </div>
            <Badge className="bg-purple-100 text-purple-600 text-xs animate-pulse">
              PLATFORM-WIDE
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading intelligence...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-purple-600">
                    {emotionalStats?.totalAnalyses || 0}
                  </div>
                  <div className="text-xs text-gray-600">Emotions Analyzed</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">
                    {emotionalStats?.positiveRatio || '0%'}
                  </div>
                  <div className="text-xs text-gray-600">Positive Sentiment</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-white rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Real-time Analysis</span>
                  </div>
                  <Badge className="text-green-600 bg-green-50 text-xs">ACTIVE</Badge>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-white rounded-lg border">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Churn Prediction</span>
                  </div>
                  <Badge className="text-green-600 bg-green-50 text-xs">MONITORING</Badge>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-white rounded-lg border">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Smart Responses</span>
                  </div>
                  <Badge className="text-blue-600 bg-blue-50 text-xs">AI-POWERED</Badge>
                </div>
              </div>

              <div className="pt-3 border-t">
                <Button asChild className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                  <Link to="/emotional-intelligence">
                    <Brain className="h-4 w-4 mr-2" />
                    Full Intelligence Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Compact version for contact pages
  return (
    <div className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <span className="font-medium text-purple-700">AI Intelligence</span>
        </div>
        <Badge className="bg-purple-600 text-white text-xs">ACTIVE</Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="text-sm font-bold text-purple-600">
            {emotionalStats?.contactAnalyses || 0}
          </div>
          <div className="text-xs text-gray-600">Contacts</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-green-600">
            {emotionalStats?.avgSentiment || 'N/A'}
          </div>
          <div className="text-xs text-gray-600">Sentiment</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-red-600">
            {emotionalStats?.riskAlerts || 0}
          </div>
          <div className="text-xs text-gray-600">Alerts</div>
        </div>
      </div>

      <Button asChild size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
        <Link to="/emotional-intelligence">
          <TrendingUp className="h-4 w-4 mr-2" />
          View Intelligence Hub
        </Link>
      </Button>
    </div>
  );
}

export { analyzeCustomerEmotion };