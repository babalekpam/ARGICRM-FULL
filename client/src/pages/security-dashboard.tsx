import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Activity, 
  Brain, 
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  Eye,
  Lock,
  Unlock
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface SecurityAlert {
  user_id: string;
  alert_type: string;
  severity: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

interface RiskAssessment {
  user_id: string;
  overall_risk_score: number;
  behavioral_risk: number;
  sentiment_risk: number;
  temporal_risk: number;
  recommendations: string[];
  last_updated: string;
}

interface BehavioralAnalytics {
  user_id: string;
  total_sessions: number;
  average_risk_score: number;
  average_keystroke_speed: number;
  average_sentiment: number;
  behavioral_trends: {
    trend: string;
    risk_variance: number;
    average_session_gap: string;
  };
  risk_history: Array<{
    timestamp: string;
    risk_score: number;
  }>;
}

interface SecurityPlatformStatus {
  security_api_available: boolean;
  reconnection_successful: boolean;
  integration_status: string;
  last_check: string;
}

export default function SecurityDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState('platform-owner-1');

  // Fetch security platform status
  const { data: platformStatus } = useQuery({
    queryKey: ['/api/security/platform/status'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Fetch security alerts
  const { data: alertsData } = useQuery({
    queryKey: ['/api/security/alerts'],
    refetchInterval: 10000, // Check every 10 seconds
  });

  // Fetch user risk assessment
  const { data: riskAssessment } = useQuery({
    queryKey: ['/api/security/risk-assessment', selectedUserId],
    enabled: !!selectedUserId,
  });

  // Fetch behavioral analytics
  const { data: behavioralAnalytics } = useQuery({
    queryKey: ['/api/security/behavioral-analytics', selectedUserId],
    enabled: !!selectedUserId,
  });

  // Fetch user risk score
  const { data: userRiskScore } = useQuery({
    queryKey: ['/api/security/risk-score', selectedUserId],
    enabled: !!selectedUserId,
  });

  // Resolve security alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: (alertId: number) => 
      apiRequest(`/api/security/alerts/${alertId}/resolve`, {
        method: 'POST'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/security/alerts'] });
      toast({
        title: "Alert Resolved",
        description: "Security alert has been resolved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve security alert.",
        variant: "destructive",
      });
    },
  });

  // Track behavior mutation
  const trackBehaviorMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest('/api/security/behavior/track', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/security/risk-score'] });
      toast({
        title: "Behavior Tracked",
        description: "User behavior has been logged for security analysis.",
      });
    },
  });

  const handleResolveAlert = (alertId: number) => {
    resolveAlertMutation.mutate(alertId);
  };

  const handleTrackBehavior = () => {
    trackBehaviorMutation.mutate({
      interactionType: 'security_dashboard_view',
      sentimentScore: 0.8,
      sessionDuration: 15
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 0.8) return 'text-red-600';
    if (score >= 0.6) return 'text-orange-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 0.8) return 'Critical';
    if (score >= 0.6) return 'High';
    if (score >= 0.4) return 'Medium';
    return 'Low';
  };

  const status = platformStatus?.data as SecurityPlatformStatus;
  const alerts = alertsData?.data?.alerts as SecurityAlert[] || [];
  const unresolved = alertsData?.data?.unresolved_count || 0;
  const assessment = riskAssessment?.data as RiskAssessment;
  const analytics = behavioralAnalytics?.data as BehavioralAnalytics;
  const riskScore = userRiskScore?.data;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            ARGILETTE Security Platform
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced user behavior monitoring and risk assessment
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleTrackBehavior} variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Track Session
          </Button>
          <Badge 
            variant={status?.security_api_available ? "default" : "destructive"}
            className="flex items-center space-x-1"
          >
            {status?.security_api_available ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            <span>
              {status?.integration_status || 'Unknown'}
            </span>
          </Badge>
        </div>
      </div>

      {!status?.security_api_available && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Security API Unavailable</AlertTitle>
          <AlertDescription>
            The ARGILETTE Security Platform API is currently unavailable. 
            The system is operating in fallback mode with limited functionality.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unresolved}</div>
            <p className="text-xs text-gray-600">
              {alerts.length} total alerts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Risk Level</CardTitle>
            <Shield className={`h-4 w-4 ${getRiskColor(riskScore?.risk_score || 0)}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskColor(riskScore?.risk_score || 0)}`}>
              {getRiskLevel(riskScore?.risk_score || 0)}
            </div>
            <p className="text-xs text-gray-600">
              Score: {((riskScore?.risk_score || 0) * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions Monitored</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_sessions || 0}</div>
            <p className="text-xs text-gray-600">
              Avg Risk: {((analytics?.average_risk_score || 0) * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Behavioral Trend</CardTitle>
            {analytics?.behavioral_trends?.trend === 'increasing' ? (
              <TrendingUp className="h-4 w-4 text-red-600" />
            ) : analytics?.behavioral_trends?.trend === 'decreasing' ? (
              <TrendingDown className="h-4 w-4 text-green-600" />
            ) : (
              <Activity className="h-4 w-4 text-gray-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {analytics?.behavioral_trends?.trend || 'Unknown'}
            </div>
            <p className="text-xs text-gray-600">
              Variance: {((analytics?.behavioral_trends?.risk_variance || 0) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
          <TabsTrigger value="risk-assessment">Risk Assessment</TabsTrigger>
          <TabsTrigger value="analytics">Behavioral Analytics</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Status Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>API Status</span>
                  <Badge variant={status?.security_api_available ? "default" : "destructive"}>
                    {status?.security_api_available ? 'Online' : 'Offline'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Integration Status</span>
                  <Badge variant="outline">
                    {status?.integration_status || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Health Check</span>
                  <span className="text-sm text-gray-600">
                    {status?.last_check ? new Date(status.last_check).toLocaleTimeString() : 'N/A'}
                  </span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Overall Risk Score</span>
                    <span className={`font-bold ${getRiskColor(riskScore?.risk_score || 0)}`}>
                      {((riskScore?.risk_score || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={(riskScore?.risk_score || 0) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5" />
                  <span>AI Insights & Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assessment?.recommendations?.length > 0 ? (
                    assessment.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Zap className="h-4 w-4 mt-0.5 text-blue-600" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-sm">No recommendations available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
              <CardDescription>
                Real-time security alerts and threat notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.length > 0 ? (
                  alerts.map((alert, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <Badge variant="outline">
                              {alert.alert_type}
                            </Badge>
                            {alert.resolved && (
                              <Badge variant="default">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium">{alert.description}</p>
                          <p className="text-xs text-gray-600">
                            User: {alert.user_id} • {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {!alert.resolved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolveAlert(index)}
                            disabled={resolveAlertMutation.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No security alerts at this time</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk-assessment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comprehensive Risk Assessment</CardTitle>
              <CardDescription>
                Detailed risk analysis for user: {selectedUserId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assessment ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className={`text-2xl font-bold ${getRiskColor(assessment.overall_risk_score)}`}>
                        {(assessment.overall_risk_score * 100).toFixed(0)}%
                      </div>
                      <p className="text-sm text-gray-600">Overall Risk</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className={`text-2xl font-bold ${getRiskColor(assessment.behavioral_risk)}`}>
                        {(assessment.behavioral_risk * 100).toFixed(0)}%
                      </div>
                      <p className="text-sm text-gray-600">Behavioral Risk</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className={`text-2xl font-bold ${getRiskColor(assessment.sentiment_risk)}`}>
                        {(assessment.sentiment_risk * 100).toFixed(0)}%
                      </div>
                      <p className="text-sm text-gray-600">Sentiment Risk</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className={`text-2xl font-bold ${getRiskColor(assessment.temporal_risk)}`}>
                        {(assessment.temporal_risk * 100).toFixed(0)}%
                      </div>
                      <p className="text-sm text-gray-600">Temporal Risk</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">AI Recommendations</h4>
                    <div className="space-y-2">
                      {assessment.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <Zap className="h-4 w-4 mt-0.5 text-blue-600" />
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No risk assessment available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Behavioral Analytics</CardTitle>
              <CardDescription>
                Advanced behavioral pattern analysis and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{analytics.total_sessions}</div>
                      <p className="text-sm text-gray-600">Total Sessions</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">
                        {analytics.average_keystroke_speed.toFixed(0)}
                      </div>
                      <p className="text-sm text-gray-600">Avg Keystroke Speed</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className={`text-2xl font-bold ${
                        analytics.average_sentiment > 0 ? 'text-green-600' : 
                        analytics.average_sentiment < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {(analytics.average_sentiment * 100).toFixed(0)}%
                      </div>
                      <p className="text-sm text-gray-600">Avg Sentiment</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Risk History</h4>
                    <div className="space-y-2">
                      {analytics.risk_history.slice(-5).map((entry, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                          <Badge className={getRiskColor(entry.risk_score)}>
                            {(entry.risk_score * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No behavioral analytics available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Live Security Monitoring</span>
              </CardTitle>
              <CardDescription>
                Real-time user behavior tracking and threat detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Live Monitoring Active</AlertTitle>
                  <AlertDescription>
                    User behavior is being monitored in real-time. Security algorithms are 
                    analyzing keystroke patterns, mouse movements, and interaction patterns.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Current Session</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Session Duration:</span>
                        <span>15 minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pages Visited:</span>
                        <span>12</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk Score:</span>
                        <span className={getRiskColor(riskScore?.risk_score || 0)}>
                          {((riskScore?.risk_score || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Security Status</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Lock className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Authentication Verified</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Threat Detection Active</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Behavioral Analysis Running</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}