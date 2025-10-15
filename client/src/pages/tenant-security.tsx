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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
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
  Monitor,
  Database,
  Server,
  MousePointer,
  Keyboard,
  Timer,
  BarChart3,
  UserX,
  AlertCircle,
  Building2,
  Mail,
  Target,
  CheckCircle2 as CheckCircle,
  FileText,
  Calendar,
  Settings,
  Bell
} from 'lucide-react';

interface TenantUserBehavior {
  user_id: string;
  email: string;
  department: string;
  keystroke_speed: number;
  login_time: string;
  sentiment_score: number;
  mouse_patterns: Record<string, number>;
  session_duration?: number;
  risk_score?: number;
  last_activity: string;
}

interface TenantSecurityAlert {
  user_id: string;
  email: string;
  alert_type: string;
  severity: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  department: string;
}

export default function TenantSecurity() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Extract organization domain from user email
  const organizationDomain = user?.email?.split('@')[1] || 'organization.com';
  const organizationName = organizationDomain.split('.')[0].toUpperCase();

  // Mock tenant-specific security data (would come from API filtered by tenant)
  const tenantUsers: TenantUserBehavior[] = [
    {
      user_id: 'emp_001',
      email: `john.doe@${organizationDomain}`,
      department: 'Engineering',
      keystroke_speed: 245,
      login_time: '2025-01-06T08:30:00Z',
      sentiment_score: 0.7,
      mouse_patterns: { click_accuracy: 0.95, movement_speed: 120 },
      session_duration: 420,
      risk_score: 15,
      last_activity: '5 minutes ago'
    },
    {
      user_id: 'emp_002',
      email: `sarah.johnson@${organizationDomain}`,
      department: 'Marketing',
      keystroke_speed: 180,
      login_time: '2025-01-06T09:15:00Z',
      sentiment_score: 0.8,
      mouse_patterns: { click_accuracy: 0.92, movement_speed: 110 },
      session_duration: 380,
      risk_score: 8,
      last_activity: '2 minutes ago'
    },
    {
      user_id: 'emp_003',
      email: `mike.wilson@${organizationDomain}`,
      department: 'Sales',
      keystroke_speed: 320,
      login_time: '2025-01-06T07:45:00Z',
      sentiment_score: 0.3,
      mouse_patterns: { click_accuracy: 0.88, movement_speed: 200 },
      session_duration: 180,
      risk_score: 75,
      last_activity: '1 minute ago'
    }
  ];

  const tenantAlerts: TenantSecurityAlert[] = [
    {
      user_id: 'emp_003',
      email: `mike.wilson@${organizationDomain}`,
      alert_type: 'unusual_activity',
      severity: 'high',
      description: 'Unusual typing speed and mouse patterns detected',
      timestamp: '2025-01-06T14:30:00Z',
      resolved: false,
      department: 'Sales'
    },
    {
      user_id: 'emp_001',
      email: `john.doe@${organizationDomain}`,
      alert_type: 'login_anomaly',
      severity: 'medium',
      description: 'Login from new device detected',
      timestamp: '2025-01-06T08:30:00Z',
      resolved: true,
      department: 'Engineering'
    }
  ];

  // Calculate tenant-specific metrics
  const activeUsers = tenantUsers.length;
  const highRiskUsers = tenantUsers.filter(u => (u.risk_score || 0) > 50).length;
  const averageRiskScore = Math.round(tenantUsers.reduce((sum, u) => sum + (u.risk_score || 0), 0) / tenantUsers.length);
  const unresolvedAlerts = tenantAlerts.filter(a => !a.resolved).length;

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ARGILETTE Security Platform</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive security-as-a-service for <strong>{organizationName}</strong> organization
            </p>
            <div className="flex items-center mt-2 space-x-4">
              <Badge className="bg-purple-100 text-purple-800">Security-as-a-Service</Badge>
              <Badge className="bg-green-100 text-green-800">Full Platform Access</Badge>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium">{organizationDomain}</div>
              <div className="text-xs text-gray-600">Enterprise Security</div>
            </div>
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
            <TabsTrigger value="threats">Threat Detection</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Security Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Security Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Security Score</CardTitle>
                  <Shield className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(100 - averageRiskScore)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Overall security health
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Protected Users</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{activeUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Active monitoring coverage
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Threat Detection</CardTitle>
                  <Eye className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">24/7</div>
                  <p className="text-xs text-muted-foreground">
                    Continuous monitoring
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {unresolvedAlerts}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Requires attention
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
                  <TrendingUp className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {averageRiskScore > 75 ? 'HIGH' : averageRiskScore > 50 ? 'MEDIUM' : 'LOW'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Current threat level
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Security Platform Features */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    ARGILETTE Security Features
                  </CardTitle>
                  <CardDescription>
                    Comprehensive security capabilities for your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Behavioral Analytics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Threat Detection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Compliance Monitoring</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Incident Response</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Advanced Analytics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Risk Assessment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Real-time Monitoring</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">AI-Powered Insights</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Enterprise-Grade Security:</strong> Your organization receives the complete ARGILETTE security platform with all advanced features and customizations.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Security Performance
                  </CardTitle>
                  <CardDescription>
                    Real-time security metrics and trends
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Threat Prevention Rate</span>
                      <span className="font-medium text-green-600">99.7%</span>
                    </div>
                    <Progress value={99.7} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Compliance Score</span>
                      <span className="font-medium text-blue-600">98.2%</span>
                    </div>
                    <Progress value={98.2} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Response Time</span>
                      <span className="font-medium text-purple-600">Under 30s</span>
                    </div>
                    <Progress value={95} className="h-2" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Security Coverage</span>
                      <span className="font-medium text-orange-600">100%</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Excellent Security Posture:</strong> Your organization maintains superior security metrics with continuous monitoring and protection.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            {/* Live Monitoring Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    Real-Time Activity Monitor
                  </CardTitle>
                  <CardDescription>
                    Live security monitoring for {organizationName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tenantUsers.slice(0, 5).map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`w-3 h-3 rounded-full ${(user.risk_score || 0) > 50 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            <div className="absolute -inset-1 bg-current rounded-full animate-ping opacity-20"></div>
                          </div>
                          <div>
                            <div className="font-medium text-sm">{user.email}</div>
                            <div className="text-xs text-muted-foreground">{user.department}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.risk_score && user.risk_score > 50 ? "destructive" : "secondary"}>
                            {user.risk_score || 0}% Risk
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {user.last_activity}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    Live Threat Radar
                  </CardTitle>
                  <CardDescription>
                    Active threat detection system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">ALL CLEAR</div>
                    <p className="text-sm text-green-700">No active threats detected</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Malware Scans</span>
                      <span className="text-green-600">✓ Clean</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Intrusion Detection</span>
                      <span className="text-green-600">✓ Normal</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Anomaly Detection</span>
                      <span className="text-green-600">✓ Baseline</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Network Security</span>
                      <span className="text-green-600">✓ Secured</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="threats" className="space-y-6">
            {/* Advanced Threat Detection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    AI Threat Detection Engine
                  </CardTitle>
                  <CardDescription>
                    Advanced machine learning threat identification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium">Behavioral Analysis</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Monitoring user behavior patterns for anomalies</p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="font-medium">Network Monitoring</span>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">Scanning</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Real-time network traffic analysis and intrusion detection</p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="font-medium">Malware Detection</span>
                        </div>
                        <Badge className="bg-purple-100 text-purple-800">Protected</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Advanced signature and heuristic malware scanning</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-600" />
                    Attack Vector Analysis
                  </CardTitle>
                  <CardDescription>
                    Comprehensive security vulnerability assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">0</div>
                        <p className="text-xs text-green-700">Critical Threats</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-lg font-bold text-yellow-600">2</div>
                        <p className="text-xs text-yellow-700">Medium Risks</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">5</div>
                        <p className="text-xs text-blue-700">Low Risks</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">98%</div>
                        <p className="text-xs text-purple-700">Security Score</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Email Security</span>
                        <span className="text-green-600 font-medium">Excellent</span>
                      </div>
                      <Progress value={98} className="h-2" />
                      
                      <div className="flex justify-between text-sm">
                        <span>Endpoint Protection</span>
                        <span className="text-green-600 font-medium">Strong</span>
                      </div>
                      <Progress value={95} className="h-2" />
                      
                      <div className="flex justify-between text-sm">
                        <span>Web Security</span>
                        <span className="text-blue-600 font-medium">Good</span>
                      </div>
                      <Progress value={87} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            {/* Compliance Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Compliance Status Dashboard
                  </CardTitle>
                  <CardDescription>
                    Real-time compliance monitoring and reporting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-green-50 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-medium">GDPR Compliance</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">100%</div>
                      <p className="text-xs text-muted-foreground">All requirements met</p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">ISO 27001</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">97%</div>
                      <p className="text-xs text-muted-foreground">Nearly compliant</p>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">SOC 2</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">95%</div>
                      <p className="text-xs text-muted-foreground">Minor gaps identified</p>
                    </div>
                    
                    <div className="p-4 bg-orange-50 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">HIPAA</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-600">N/A</div>
                      <p className="text-xs text-muted-foreground">Not applicable</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Recent Compliance Activities</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">Data retention policy updated</span>
                        </div>
                        <span className="text-xs text-muted-foreground">2 hours ago</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm">Security training due</span>
                        </div>
                        <span className="text-xs text-muted-foreground">1 day ago</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Upcoming Audits
                  </CardTitle>
                  <CardDescription>
                    Scheduled compliance reviews
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg border">
                    <div className="font-medium text-sm">ISO 27001 Review</div>
                    <div className="text-xs text-muted-foreground">March 15, 2025</div>
                    <Badge className="mt-2 bg-blue-100 text-blue-800">Scheduled</Badge>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg border">
                    <div className="font-medium text-sm">GDPR Assessment</div>
                    <div className="text-xs text-muted-foreground">April 20, 2025</div>
                    <Badge className="mt-2 bg-green-100 text-green-800">Prepared</Badge>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg border">
                    <div className="font-medium text-sm">SOC 2 Examination</div>
                    <div className="text-xs text-muted-foreground">May 10, 2025</div>
                    <Badge className="mt-2 bg-purple-100 text-purple-800">Planning</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Security Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Security Analytics Reports
                  </CardTitle>
                  <CardDescription>
                    Comprehensive security intelligence and trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full justify-start" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Executive Security Summary
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Threat Intelligence Report
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      User Behavior Analysis
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Activity className="h-4 w-4 mr-2" />
                      Incident Response Report
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Compliance Status Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Automated Reporting
                  </CardTitle>
                  <CardDescription>
                    Scheduled security reports and notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Daily Security Brief</span>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Delivered every morning at 8:00 AM</p>
                    </div>
                    
                    <div className="p-3 bg-purple-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Weekly Risk Assessment</span>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Comprehensive weekly security analysis</p>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Monthly Executive Summary</span>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">High-level security metrics for leadership</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Security Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-600" />
                    Security Configuration
                  </CardTitle>
                  <CardDescription>
                    Customize security settings for your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">Real-time Monitoring</div>
                        <div className="text-xs text-muted-foreground">Continuous threat detection</div>
                      </div>
                      <input type="checkbox" checked readOnly className="rounded" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">Email Alerts</div>
                        <div className="text-xs text-muted-foreground">Receive security notifications</div>
                      </div>
                      <input type="checkbox" checked readOnly className="rounded" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">Behavioral Analytics</div>
                        <div className="text-xs text-muted-foreground">AI-powered user behavior analysis</div>
                      </div>
                      <input type="checkbox" checked readOnly className="rounded" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">Automated Response</div>
                        <div className="text-xs text-muted-foreground">Auto-block suspicious activities</div>
                      </div>
                      <input type="checkbox" checked readOnly className="rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-orange-600" />
                    Alert Preferences
                  </CardTitle>
                  <CardDescription>
                    Configure how you receive security alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Alert Threshold</label>
                      <select className="w-full mt-1 p-2 border rounded-md">
                        <option>High Risk Only</option>
                        <option>Medium and High Risk</option>
                        <option>All Risk Levels</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Notification Methods</label>
                      <div className="mt-2 space-y-2">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked readOnly />
                          <span className="text-sm">Email Notifications</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked readOnly />
                          <span className="text-sm">SMS Alerts</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" />
                          <span className="text-sm">Slack Integration</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full">Save Settings</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            {/* Security Alerts Management */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Organization Security Alerts
                  </CardTitle>
                  <CardDescription>
                    Active security alerts for {organizationName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tenantAlerts.length > 0 ? tenantAlerts.map((alert, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-red-50 to-orange-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className={`h-4 w-4 ${alert.severity === 'high' ? 'text-red-600' : 'text-yellow-600'}`} />
                            <div>
                              <div className="font-medium text-sm">{alert.description}</div>
                              <div className="text-xs text-muted-foreground">{alert.email} • {alert.department}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={alert.severity === 'high' ? "destructive" : "secondary"}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <Badge variant={alert.resolved ? "default" : "outline"}>
                              {alert.resolved ? 'Resolved' : 'Active'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                          {!alert.resolved && (
                            <Button size="sm" variant="outline">
                              Mark Resolved
                            </Button>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="text-center p-8 bg-green-50 rounded-lg">
                        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <div className="font-medium text-green-800">All Clear</div>
                        <p className="text-sm text-green-700">No active security alerts for your organization</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Alert Statistics
                  </CardTitle>
                  <CardDescription>
                    Security alert trends and metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-lg font-bold text-red-600">{tenantAlerts.filter(a => a.severity === 'high').length}</div>
                      <p className="text-xs text-red-700">High Priority</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-lg font-bold text-yellow-600">{tenantAlerts.filter(a => a.severity === 'medium').length}</div>
                      <p className="text-xs text-yellow-700">Medium Priority</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">{tenantAlerts.filter(a => a.resolved).length}</div>
                      <p className="text-xs text-green-700">Resolved</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{tenantAlerts.filter(a => !a.resolved).length}</div>
                      <p className="text-xs text-blue-700">Active</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Response Times</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Average Response</span>
                        <span className="font-medium text-green-600">2.3 min</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Resolution Rate</span>
                        <span className="font-medium text-blue-600">96.8%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>False Positives</span>
                        <span className="font-medium text-purple-600">{'< 2%'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Organization Security Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                    Organization Security Analytics
                  </CardTitle>
                  <CardDescription>
                    Detailed analytics for {organizationName} organization security
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">{Math.round(tenantUsers.reduce((sum, u) => sum + (u.session_duration || 0), 0) / tenantUsers.length / 60)} min</div>
                        <p className="text-xs text-blue-700">Avg Session</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">{tenantAlerts.length}</div>
                        <p className="text-xs text-purple-700">Security Incidents</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">{Math.round((tenantAlerts.filter(a => a.resolved).length / tenantAlerts.length) * 100) || 100}%</div>
                        <p className="text-xs text-green-700">Resolution Rate</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">{Math.round(tenantUsers.reduce((sum, u) => sum + u.keystroke_speed, 0) / tenantUsers.length)} CPM</div>
                        <p className="text-xs text-orange-700">Typing Speed</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    Behavioral Patterns
                  </CardTitle>
                  <CardDescription>
                    User behavior analysis and trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Average Typing Speed</span>
                      <span className="font-medium">{Math.round(tenantUsers.reduce((sum, u) => sum + u.keystroke_speed, 0) / tenantUsers.length)} CPM</span>
                    </div>
                    <Progress value={75} className="h-2" />
                    
                    <div className="flex justify-between text-sm">
                      <span>Mouse Accuracy</span>
                      <span className="font-medium">{Math.round(tenantUsers.reduce((sum, u) => sum + u.mouse_patterns.click_accuracy, 0) / tenantUsers.length * 100)}%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                    
                    <div className="flex justify-between text-sm">
                      <span>Sentiment Score</span>
                      <span className="font-medium">{Math.round(tenantUsers.reduce((sum, u) => sum + u.sentiment_score, 0) / tenantUsers.length * 100)}%</span>
                    </div>
                    <Progress value={92} className="h-2" />
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
                  <span>Organization Security Analytics</span>
                </CardTitle>
                <CardDescription>
                  Detailed analytics for {organizationName} organization security
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Security Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Average Session Duration</span>
                        <span className="text-sm font-medium">{Math.round(tenantUsers.reduce((sum, u) => sum + (u.session_duration || 0), 0) / tenantUsers.length / 60)} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Security Incidents</span>
                        <span className="text-sm font-medium">{tenantAlerts.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Resolution Rate</span>
                        <span className="text-sm font-medium">{Math.round((tenantAlerts.filter(a => a.resolved).length / tenantAlerts.length) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">Behavioral Patterns</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Average Typing Speed</span>
                        <span className="text-sm font-medium">{Math.round(tenantUsers.reduce((sum, u) => sum + u.keystroke_speed, 0) / tenantUsers.length)} CPM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Mouse Accuracy</span>
                        <span className="text-sm font-medium">{Math.round(tenantUsers.reduce((sum, u) => sum + u.mouse_patterns.click_accuracy, 0) / tenantUsers.length * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Sentiment Score</span>
                        <span className="text-sm font-medium">{Math.round(tenantUsers.reduce((sum, u) => sum + u.sentiment_score, 0) / tenantUsers.length * 100)}%</span>
                      </div>
                    </div>
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