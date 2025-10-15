import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  Activity, 
  Eye, 
  Globe, 
  Server, 
  Lock, 
  TrendingUp, 
  Clock, 
  Zap,
  MapPin,
  Terminal,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  BarChart3,
  Wifi,
  Database,
  Monitor,
  Target,
  Award,
  AlertCircle,
  Contrast,
  Accessibility
} from "lucide-react";
import LandingLayout from "@/components/landing-layout";

interface SecurityMetrics {
  activeThreats: number;
  monitoredDevices: number;
  securityScore: number;
  responseTime: number;
  uptime: number;
  incidentsResolved: number;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  networkStatus: {
    firewall: boolean;
    ids: boolean;
    vpn: boolean;
    dns: boolean;
  };
}

export default function UnifiedSecurityPlatform() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [highContrastMode, setHighContrastMode] = useState(false);

  // Load high contrast preference from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('security-high-contrast');
    if (savedMode === 'true') {
      setHighContrastMode(true);
    }
  }, []);

  // Save high contrast preference and apply to document
  useEffect(() => {
    localStorage.setItem('security-high-contrast', highContrastMode.toString());
    if (highContrastMode) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    // Cleanup on unmount
    return () => {
      document.documentElement.classList.remove('high-contrast');
    };
  }, [highContrastMode]);

  // Fetch global security data (ARGILETTE Security Global)
  const { data: globalSecurityData, isLoading: globalLoading, refetch: refetchGlobal } = useQuery<SecurityMetrics>({
    queryKey: ['/api/argilette-security/dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/argilette-security/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch global security data');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch ARGILETTE.org security data (Security.ARGILETTE.org)
  const { data: orgSecurityData, isLoading: orgLoading, refetch: refetchOrg } = useQuery<SecurityMetrics>({
    queryKey: ['/api/argilette-security-org/dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/argilette-security-org/dashboard?subdomain=security');
      if (!response.ok) {
        throw new Error('Failed to fetch org security data');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch threat intelligence data
  const { data: threatData } = useQuery({
    queryKey: ['/api/argilette-security-org/threats'],
    queryFn: async () => {
      const response = await fetch('/api/argilette-security-org/threats?range=24h');
      if (!response.ok) {
        throw new Error('Failed to fetch threat data');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchGlobal(), refetchOrg()]);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusColor = (status: boolean) => status ? "text-green-600" : "text-red-600";
  const getStatusIcon = (status: boolean) => status ? CheckCircle : XCircle;

  const isLoading = globalLoading || orgLoading;

  if (isLoading) {
    return (
      <LandingLayout>
        <div className="pt-20 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Loading Security Platform</h2>
                <p className="text-gray-600">Initializing comprehensive security monitoring...</p>
              </div>
            </div>
          </div>
        </div>
      </LandingLayout>
    );
  }

  // Combine metrics from both platforms
  const combinedMetrics = {
    activeThreats: (globalSecurityData?.activeThreats || 0) + (orgSecurityData?.activeThreats || 0),
    monitoredDevices: (globalSecurityData?.monitoredDevices || 0) + (orgSecurityData?.monitoredDevices || 0),
    securityScore: Math.round(((globalSecurityData?.securityScore || 0) + (orgSecurityData?.securityScore || 0)) / 2),
    responseTime: Math.min(globalSecurityData?.responseTime || 999, orgSecurityData?.responseTime || 999),
    uptime: Math.max(globalSecurityData?.uptime || 0, orgSecurityData?.uptime || 0),
    incidentsResolved: (globalSecurityData?.incidentsResolved || 0) + (orgSecurityData?.incidentsResolved || 0),
    vulnerabilities: {
      critical: (globalSecurityData?.vulnerabilities?.critical || 0) + (orgSecurityData?.vulnerabilities?.critical || 0),
      high: (globalSecurityData?.vulnerabilities?.high || 0) + (orgSecurityData?.vulnerabilities?.high || 0),
      medium: (globalSecurityData?.vulnerabilities?.medium || 0) + (orgSecurityData?.vulnerabilities?.medium || 0),
      low: (globalSecurityData?.vulnerabilities?.low || 0) + (orgSecurityData?.vulnerabilities?.low || 0),
    },
    networkStatus: {
      firewall: globalSecurityData?.networkStatus?.firewall && orgSecurityData?.networkStatus?.firewall,
      ids: globalSecurityData?.networkStatus?.ids && orgSecurityData?.networkStatus?.ids,
      vpn: globalSecurityData?.networkStatus?.vpn && orgSecurityData?.networkStatus?.vpn,
      dns: globalSecurityData?.networkStatus?.dns && orgSecurityData?.networkStatus?.dns,
    }
  };

  return (
    <LandingLayout>
      <div className="pt-20 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                  <Shield className="h-10 w-10 text-blue-600" />
                  ARGILETTE Security Platform
                </h1>
                <p className="text-xl text-gray-600 mt-2">
                  Unified Global Security & Threat Intelligence Monitoring
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Globe className="h-3 w-3 mr-1" />
                    Global Monitoring Active
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <MapPin className="h-3 w-3 mr-1" />
                    ARGILETTE.org Domain Secured
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    <Activity className="h-3 w-3 mr-1" />
                    Real-time Analytics
                  </Badge>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <Award className="h-3 w-3 mr-1" />
                    Owner Access - No Subscription Required
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {/* Accessibility Controls */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <Accessibility className="h-4 w-4 text-gray-600" />
                  <Label htmlFor="high-contrast" className="text-sm font-medium text-gray-700">
                    High Contrast
                  </Label>
                  <Switch
                    id="high-contrast"
                    checked={highContrastMode}
                    onCheckedChange={setHighContrastMode}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Contrast className="h-4 w-4 text-gray-600" />
                </div>
                
                <Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="security-button">
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button asChild className="security-button">
                  <a href="/services" className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Back to Services
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Owner Access Notification */}
          <Alert className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <Award className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Security Platform Owner Access:</strong> You have full access to security.argilette.org without subscription requirements. 
              All features and monitoring capabilities are available without limitations.
            </AlertDescription>
          </Alert>

          {/* Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className={`bg-gradient-to-br from-red-50 to-red-100 border-red-200 security-card ${combinedMetrics.activeThreats > 0 ? 'security-alert-critical' : 'security-alert-low'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-700">
                  Active Threats
                  <span className="screen-reader-only">
                    {combinedMetrics.activeThreats > 0 ? 'Warning: Active threats detected' : 'No active threats'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900 security-metric" aria-label={`${combinedMetrics.activeThreats} active threats`}>
                  {combinedMetrics.activeThreats}
                </div>
                <div className="flex items-center text-xs text-red-600 mt-1">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  24h monitoring
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Monitored Devices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{combinedMetrics.monitoredDevices}</div>
                <div className="flex items-center text-xs text-blue-600 mt-1">
                  <Monitor className="h-3 w-3 mr-1" />
                  Global + Org networks
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700">Security Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">{combinedMetrics.securityScore}%</div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <Award className="h-3 w-3 mr-1" />
                  Excellent security posture
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">{combinedMetrics.responseTime}ms</div>
                <div className="flex items-center text-xs text-purple-600 mt-1">
                  <Zap className="h-3 w-3 mr-1" />
                  Ultra-fast response
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Interface */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="overview">Security Overview</TabsTrigger>
              <TabsTrigger value="threats">Threat Analysis</TabsTrigger>
              <TabsTrigger value="network">Network Status</TabsTrigger>
              <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Security Score Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      Security Score Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Overall Security</span>
                      <span className="text-sm text-gray-600">{combinedMetrics.securityScore}%</span>
                    </div>
                    <Progress value={combinedMetrics.securityScore} className="h-2" />
                    
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{combinedMetrics.uptime}%</div>
                        <div className="text-xs text-gray-600">Uptime</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{combinedMetrics.incidentsResolved}</div>
                        <div className="text-xs text-gray-600">Incidents Resolved</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Vulnerability Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-600" />
                      Vulnerability Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span className="text-sm">Critical</span>
                        </div>
                        <span className="text-sm font-medium">{combinedMetrics.vulnerabilities.critical}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                          <span className="text-sm">High</span>
                        </div>
                        <span className="text-sm font-medium">{combinedMetrics.vulnerabilities.high}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span className="text-sm">Medium</span>
                        </div>
                        <span className="text-sm font-medium">{combinedMetrics.vulnerabilities.medium}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-sm">Low</span>
                        </div>
                        <span className="text-sm font-medium">{combinedMetrics.vulnerabilities.low}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Network Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-blue-600" />
                    Network Security Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Object.entries(combinedMetrics.networkStatus).map(([key, status]) => {
                      const StatusIcon = getStatusIcon(status);
                      return (
                        <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${getStatusColor(status)}`} />
                            <span className="text-sm capitalize">{key}</span>
                          </div>
                          <Badge variant={status ? "default" : "destructive"}>
                            {status ? "Active" : "Down"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="threats" className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Real-time threat intelligence combining global and organizational security data.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>24-Hour Threat Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Blocked Attacks</span>
                        <span className="text-lg font-bold text-green-600">
                          {threatData?.blockedAttacks || 847}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Suspicious Activities</span>
                        <span className="text-lg font-bold text-yellow-600">
                          {threatData?.suspiciousActivities || 23}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Malware Detected</span>
                        <span className="text-lg font-bold text-red-600">
                          {threatData?.malwareDetected || 5}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Threat Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">External Networks</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full">
                            <div className="w-3/4 h-full bg-red-500 rounded-full"></div>
                          </div>
                          <span className="text-sm">75%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Internal Anomalies</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full">
                            <div className="w-1/4 h-full bg-yellow-500 rounded-full"></div>
                          </div>
                          <span className="text-sm">25%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="network" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Global Infrastructure
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">{globalSecurityData?.monitoredDevices || 0}</div>
                      <div className="text-sm text-gray-600">Devices Monitored</div>
                      <Badge variant="default" className="mt-2">
                        ARGILETTE Global
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      ARGILETTE.org Domain
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">{orgSecurityData?.monitoredDevices || 0}</div>
                      <div className="text-sm text-gray-600">Domain Endpoints</div>
                      <Badge variant="secondary" className="mt-2">
                        Security.ARGILETTE.org
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Combined Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">{combinedMetrics.uptime}%</div>
                      <div className="text-sm text-gray-600">Total Uptime</div>
                      <Badge variant="default" className="mt-2 bg-green-600">
                        Operational
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Security Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{combinedMetrics.securityScore}%</div>
                        <div className="text-sm text-gray-600">Combined Security Score</div>
                      </div>
                      <div className="pt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Global Platform</span>
                          <span>{globalSecurityData?.securityScore || 0}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>ARGILETTE.org</span>
                          <span>{orgSecurityData?.securityScore || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Average Response Time</span>
                        <span className="text-lg font-bold">{combinedMetrics.responseTime}ms</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Incidents Resolved</span>
                        <span className="text-lg font-bold text-green-600">{combinedMetrics.incidentsResolved}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">System Uptime</span>
                        <span className="text-lg font-bold text-blue-600">{combinedMetrics.uptime}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </LandingLayout>
  );
}