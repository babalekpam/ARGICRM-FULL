import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout';
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
  Unlock,
  Monitor,
  Globe,
  Database,
  Server,
  MousePointer,
  Keyboard,
  Timer,
  BarChart3,
  UserX,
  AlertCircle
} from 'lucide-react';

interface UserBehavior {
  user_id: string;
  keystroke_speed: number;
  login_time: string;
  sentiment_score: number;
  mouse_patterns: Record<string, number>;
  session_duration?: number;
  page_navigation_pattern?: string[];
  risk_score?: number;
}

interface SecurityAlert {
  user_id: string;
  alert_type: string;
  severity: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

interface DashboardMetrics {
  total_users: number;
  active_sessions: number;
  high_risk_users: number;
  alerts_count: number;
  average_risk_score: number;
  behavioral_anomalies: number;
}

export default function ArgiletteSecurityPlatform() {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardMetrics>({
    total_users: 1247,
    active_sessions: 89,
    high_risk_users: 12,
    alerts_count: 8,
    average_risk_score: 0.23,
    behavioral_anomalies: 5
  });

  const [userBehavior, setUserBehavior] = useState<UserBehavior>({
    user_id: '',
    keystroke_speed: 0,
    login_time: '',
    sentiment_score: 0,
    mouse_patterns: {}
  });

  const [recentAlerts] = useState<SecurityAlert[]>([
    {
      user_id: 'user_892',
      alert_type: 'suspicious_behavior',
      severity: 'high',
      description: 'Unusual keystroke patterns detected during sensitive operations',
      timestamp: new Date().toISOString(),
      resolved: false
    },
    {
      user_id: 'user_445',
      alert_type: 'anomaly_detected',
      severity: 'medium',
      description: 'Mouse movement patterns inconsistent with user baseline',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      resolved: false
    },
    {
      user_id: 'user_223',
      alert_type: 'high_risk',
      severity: 'critical',
      description: 'Multiple behavioral indicators suggest potential account compromise',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      resolved: true
    }
  ]);

  const handleBehaviorSubmit = () => {
    // Simulate behavior logging
    setDashboardData(prev => ({
      ...prev,
      total_users: prev.total_users + 1,
      active_sessions: prev.active_sessions + 1
    }));

    toast({
      title: "Behavior Logged",
      description: "User behavior data has been recorded and analyzed."
    });

    // Reset form
    setUserBehavior({
      user_id: '',
      keystroke_speed: 0,
      login_time: '',
      sentiment_score: 0,
      mouse_patterns: {}
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

  const getRiskLevel = (score: number) => {
    if (score >= 0.8) return { level: 'Critical', color: 'text-red-600' };
    if (score >= 0.6) return { level: 'High', color: 'text-orange-600' };
    if (score >= 0.4) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Low', color: 'text-green-600' };
  };

  const riskInfo = getRiskLevel(dashboardData.average_risk_score);

  return (
    <Layout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              ARGILETTE Security Platform
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Advanced behavioral analytics and threat detection system
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={isOnline ? "default" : "destructive"}
              className="flex items-center space-x-1"
            >
              {isOnline ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              <span>
                {isOnline ? 'Platform Online' : 'Offline'}
              </span>
            </Badge>
          </div>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.total_users.toLocaleString()}</div>
              <p className="text-xs text-gray-600">Monitored accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.active_sessions}</div>
              <p className="text-xs text-gray-600">Currently online</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risk Users</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.high_risk_users}</div>
              <p className="text-xs text-gray-600">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.alerts_count}</div>
              <p className="text-xs text-gray-600">Unresolved alerts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
              <Shield className={`h-4 w-4 ${riskInfo.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${riskInfo.color}`}>
                {(dashboardData.average_risk_score * 100).toFixed(0)}%
              </div>
              <p className="text-xs text-gray-600">{riskInfo.level} risk</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Anomalies</CardTitle>
              <Brain className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.behavioral_anomalies}</div>
              <p className="text-xs text-gray-600">Detected today</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
            <TabsTrigger value="behavior-log">Behavior Log</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Risk Assessment Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Risk Level</span>
                      <Badge className={getSeverityColor(riskInfo.level.toLowerCase())}>
                        {riskInfo.level}
                      </Badge>
                    </div>
                    <Progress value={dashboardData.average_risk_score * 100} className="w-full" />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Behavioral Risk</div>
                        <div className="text-gray-600">18%</div>
                      </div>
                      <div>
                        <div className="font-medium">Temporal Risk</div>
                        <div className="text-gray-600">31%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span>Real-time Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Normal login pattern detected</span>
                      </div>
                      <span className="text-xs text-gray-600">2 min ago</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm">Unusual mouse velocity detected</span>
                      </div>
                      <span className="text-xs text-gray-600">5 min ago</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <div className="flex items-center space-x-2">
                        <Brain className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">AI model updated successfully</span>
                      </div>
                      <span className="text-xs text-gray-600">12 min ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Monitor className="h-5 w-5 text-purple-600" />
                    <span>Live User Sessions</span>
                  </CardTitle>
                  <CardDescription>
                    Real-time active user monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {[
                      { id: 'user_001', email: 'john.doe@company.com', location: 'New York, USA', status: 'active', risk: 'low', activity: 'Dashboard viewing' },
                      { id: 'user_047', email: 'sarah.wilson@corp.org', location: 'London, UK', status: 'active', risk: 'medium', activity: 'File upload' },
                      { id: 'user_123', email: 'mike.chen@startup.io', location: 'San Francisco, USA', status: 'idle', risk: 'low', activity: 'Report generation' },
                      { id: 'user_089', email: 'anna.kowalski@tech.pl', location: 'Warsaw, Poland', status: 'active', risk: 'high', activity: 'Data export' },
                      { id: 'user_156', email: 'carlos.rivera@biz.es', location: 'Madrid, Spain', status: 'active', risk: 'low', activity: 'Email compose' },
                      { id: 'user_204', email: 'lisa.zhang@global.cn', location: 'Beijing, China', status: 'active', risk: 'medium', activity: 'Settings access' },
                      { id: 'user_298', email: 'david.smith@enterprise.au', location: 'Sydney, Australia', status: 'idle', risk: 'low', activity: 'Contact management' }
                    ].map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          <div>
                            <div className="font-medium text-sm">{user.email}</div>
                            <div className="text-xs text-gray-600">{user.location}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`text-xs ${user.risk === 'high' ? 'bg-red-100 text-red-800' : user.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {user.risk}
                          </Badge>
                          <div className="text-xs text-gray-600 mt-1">{user.activity}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Keyboard className="h-5 w-5 text-blue-600" />
                    <span>Keystroke Analysis</span>
                  </CardTitle>
                  <CardDescription>
                    Real-time typing pattern detection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">247</div>
                      <div className="text-sm text-gray-600">Average CPM</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Rhythm Consistency</span>
                        <span className="text-sm font-medium">94%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Typing Speed Variance</span>
                        <span className="text-sm font-medium">±15 CPM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Anomaly Detection</span>
                        <Badge className="bg-green-100 text-green-800">Normal</Badge>
                      </div>
                    </div>
                    <div className="pt-3 border-t">
                      <div className="text-sm font-medium mb-2">Recent Anomalies</div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600">• Unusual speed spike detected (user_089)</div>
                        <div className="text-xs text-gray-600">• Pattern change identified (user_047)</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MousePointer className="h-5 w-5 text-green-600" />
                    <span>Mouse Behavior</span>
                  </CardTitle>
                  <CardDescription>
                    Movement pattern analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">1.2s</div>
                        <div className="text-xs text-gray-600">Avg Click Time</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">847px</div>
                        <div className="text-xs text-gray-600">Movement Range</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Click Accuracy</span>
                        <span className="text-sm font-medium">97.3%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Scroll Patterns</span>
                        <Badge className="bg-blue-100 text-blue-800">Normal</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Idle Time</span>
                        <span className="text-sm font-medium">3.4 min avg</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t">
                      <div className="text-sm font-medium mb-2">Suspicious Activity</div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                          <div className="text-xs text-gray-600">Rapid clicking detected</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                          <div className="text-xs text-gray-600">Automation suspected</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-orange-600" />
                    <span>Real-Time Activity Feed</span>
                  </CardTitle>
                  <CardDescription>
                    Live monitoring of user actions and system events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {[
                      { time: '14:32:15', user: 'user_089', action: 'Attempted data export', risk: 'high', status: 'blocked' },
                      { time: '14:31:48', user: 'user_156', action: 'Logged in from new device', risk: 'medium', status: 'flagged' },
                      { time: '14:31:22', user: 'user_047', action: 'Uploaded large file', risk: 'medium', status: 'scanning' },
                      { time: '14:30:55', user: 'user_001', action: 'Dashboard access', risk: 'low', status: 'allowed' },
                      { time: '14:30:31', user: 'user_204', action: 'Changed password', risk: 'low', status: 'verified' },
                      { time: '14:29:17', user: 'user_123', action: 'Generated report', risk: 'low', status: 'completed' },
                      { time: '14:28:44', user: 'user_298', action: 'Bulk contact import', risk: 'medium', status: 'processing' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="text-xs text-gray-500 w-16">{activity.time}</div>
                          <div>
                            <div className="text-sm font-medium">{activity.action}</div>
                            <div className="text-xs text-gray-600">{activity.user}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`text-xs ${
                            activity.risk === 'high' ? 'bg-red-100 text-red-800' : 
                            activity.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-green-100 text-green-800'
                          }`}>
                            {activity.risk}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${
                            activity.status === 'blocked' ? 'border-red-500 text-red-600' :
                            activity.status === 'flagged' ? 'border-yellow-500 text-yellow-600' :
                            'border-green-500 text-green-600'
                          }`}>
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Timer className="h-5 w-5 text-purple-600" />
                    <span>Session Analytics</span>
                  </CardTitle>
                  <CardDescription>
                    Current session statistics and patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">24.7</div>
                        <div className="text-sm text-gray-600">Avg Session (min)</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">89</div>
                        <div className="text-sm text-gray-600">Active Now</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Geographic Distribution</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">North America</span>
                          <span className="text-xs font-medium">34%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">Europe</span>
                          <span className="text-xs font-medium">28%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">Asia Pacific</span>
                          <span className="text-xs font-medium">23%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">Others</span>
                          <span className="text-xs font-medium">15%</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <div className="text-sm font-medium mb-2">Real-Time Threats</div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-3 w-3 text-red-600" />
                            <span className="text-xs">Brute force attempt</span>
                          </div>
                          <Badge className="bg-red-100 text-red-800 text-xs">Critical</Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-3 w-3 text-yellow-600" />
                            <span className="text-xs">Unusual access pattern</span>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">Medium</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  <span>Behavioral Analytics</span>
                </CardTitle>
                <CardDescription>
                  Advanced statistical analysis of user behavior patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Threat Detection Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">False Positive Rate</span>
                        <span className="text-sm font-medium">2.3%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Detection Accuracy</span>
                        <span className="text-sm font-medium">97.8%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Response Time</span>
                        <span className="text-sm font-medium">1.2s avg</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">AI Model Performance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Model Accuracy</span>
                        <span className="text-sm font-medium">94.7%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Learning Rate</span>
                        <span className="text-sm font-medium">0.001</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Last Training</span>
                        <span className="text-sm font-medium">2 hours ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span>Security Alerts</span>
                </CardTitle>
                <CardDescription>
                  Recent security alerts and threat notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAlerts.map((alert, index) => (
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
                          <Button size="sm" variant="outline">
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="behavior-log" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-green-600" />
                  <span>Log User Behavior</span>
                </CardTitle>
                <CardDescription>
                  Manually log user behavior data for analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="user_id">User ID</Label>
                      <Input
                        id="user_id"
                        value={userBehavior.user_id}
                        onChange={(e) => setUserBehavior(prev => ({ ...prev, user_id: e.target.value }))}
                        placeholder="Enter user ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="keystroke_speed">Keystroke Speed (CPM)</Label>
                      <Input
                        id="keystroke_speed"
                        type="number"
                        value={userBehavior.keystroke_speed}
                        onChange={(e) => setUserBehavior(prev => ({ ...prev, keystroke_speed: Number(e.target.value) }))}
                        placeholder="Characters per minute"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sentiment_score">Sentiment Score (-1 to 1)</Label>
                      <Input
                        id="sentiment_score"
                        type="number"
                        step="0.1"
                        min="-1"
                        max="1"
                        value={userBehavior.sentiment_score}
                        onChange={(e) => setUserBehavior(prev => ({ ...prev, sentiment_score: Number(e.target.value) }))}
                        placeholder="Sentiment score"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login_time">Login Time</Label>
                      <Input
                        id="login_time"
                        type="datetime-local"
                        value={userBehavior.login_time}
                        onChange={(e) => setUserBehavior(prev => ({ ...prev, login_time: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session_duration">Session Duration (minutes)</Label>
                      <Input
                        id="session_duration"
                        type="number"
                        value={userBehavior.session_duration || ''}
                        onChange={(e) => setUserBehavior(prev => ({ ...prev, session_duration: Number(e.target.value) }))}
                        placeholder="Session duration"
                      />
                    </div>
                    <Button onClick={handleBehaviorSubmit} className="w-full">
                      <Database className="h-4 w-4 mr-2" />
                      Log Behavior Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}