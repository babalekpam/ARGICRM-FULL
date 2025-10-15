import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Shield, 
  Activity, 
  Users, 
  AlertTriangle, 
  Clock, 
  Monitor,
  CheckCircle,
  XCircle,
  Globe,
  Server,
  Wifi,
  Lock,
  Eye,
  BarChart3,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  FileText,
  AlertOctagon,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface SecurityMetrics {
  activeThreats: number;
  monitoredDevices: number;
  securityScore: number;
  responseTime: string;
  uptime: string;
  lastUpdate: string;
}

interface SecurityAlert {
  id: number;
  type: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
  status: 'investigating' | 'contained' | 'resolved';
}

interface ThreatIntelligence {
  blockedAttacks: number;
  quarantinedFiles: number;
  suspiciousIPs: number;
  malwareDetected: number;
}

interface NetworkStatus {
  firewall: string;
  intrusion_detection: string;
  vpn_gateway: string;
  dns_security: string;
}

interface DashboardData {
  organization: {
    name: string;
    domain: string;
    level: string;
    status: string;
  };
  metrics: SecurityMetrics;
  features: any;
  alerts: SecurityAlert[];
  threatIntelligence: ThreatIntelligence;
  networkStatus: NetworkStatus;
}

const ArgiletteSecurityOrg: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [refreshing, setRefreshing] = useState(false);

  const { data: dashboardData, isLoading, refetch } = useQuery<DashboardData>({
    queryKey: ['/api/argilette-security-org/dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/argilette-security-org/dashboard?subdomain=security');
      if (!response.ok) {
        throw new Error('Failed to fetch security dashboard data');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

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
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'high':
        return <AlertOctagon className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'investigating':
        return 'bg-red-100 text-red-800';
      case 'contained':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNetworkStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'monitoring':
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Globe className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Security.ARGILETTE.org</h1>
              <p className="text-sm text-gray-600">
                {dashboardData?.organization.name || 'ARGILETTE Security Platform'}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Activity className="h-3 w-3 mr-1" />
            {dashboardData?.organization.status || 'Active'}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dashboardData?.metrics.activeThreats || 0}
            </div>
            <p className="text-xs text-gray-600">Real-time detection</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitored Devices</CardTitle>
            <Monitor className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData?.metrics.monitoredDevices || 0}
            </div>
            <p className="text-xs text-gray-600">Endpoints protected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardData?.metrics.securityScore || 0}%
            </div>
            <Progress 
              value={dashboardData?.metrics.securityScore || 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {dashboardData?.metrics.responseTime || 'N/A'}
            </div>
            <p className="text-xs text-gray-600">Average detection</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Overview</TabsTrigger>
          <TabsTrigger value="threats">Threat Analysis</TabsTrigger>
          <TabsTrigger value="network">Network Status</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Recent Security Alerts
                </CardTitle>
                <CardDescription>Latest security incidents and responses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.alerts.map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {alert.title}
                          </p>
                          <Badge className={getStatusColor(alert.status)}>
                            {alert.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Threat Intelligence */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Threat Intelligence
                </CardTitle>
                <CardDescription>Security metrics and blocked threats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Blocked Attacks</span>
                    <span className="font-medium text-green-600">
                      {dashboardData?.threatIntelligence.blockedAttacks || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Quarantined Files</span>
                    <span className="font-medium text-yellow-600">
                      {dashboardData?.threatIntelligence.quarantinedFiles || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Suspicious IPs</span>
                    <span className="font-medium text-red-600">
                      {dashboardData?.threatIntelligence.suspiciousIPs || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Malware Detected</span>
                    <span className="font-medium text-red-600">
                      {dashboardData?.threatIntelligence.malwareDetected || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Threat Analysis Dashboard
              </CardTitle>
              <CardDescription>24-hour threat detection and response metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {threatData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{threatData.summary.total_threats}</div>
                      <div className="text-sm text-gray-600">Total Threats</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{threatData.summary.blocked_threats}</div>
                      <div className="text-sm text-gray-600">Blocked</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{threatData.summary.success_rate}%</div>
                      <div className="text-sm text-gray-600">Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{threatData.summary.avg_response_time}</div>
                      <div className="text-sm text-gray-600">Avg Response</div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="text-lg font-medium mb-4">Threat Distribution</h4>
                    <div className="space-y-3">
                      {threatData.distribution.map((threat: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{threat.name}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${threat.value}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-12 text-right">{threat.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Loading threat analysis data...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="h-5 w-5 mr-2" />
                Network Security Status
              </CardTitle>
              <CardDescription>Real-time network infrastructure monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dashboardData?.networkStatus && Object.entries(dashboardData.networkStatus).map(([key, status]) => (
                  <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getNetworkStatusIcon(status)}
                      <div>
                        <p className="font-medium capitalize">
                          {key.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">{status}</p>
                      </div>
                    </div>
                    <Badge variant={status === 'active' || status === 'monitoring' || status === 'connected' ? 'default' : 'destructive'}>
                      {status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Security Reports
              </CardTitle>
              <CardDescription>Generate and download security reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Daily Security Report</div>
                    <div className="text-sm text-gray-600">24-hour security summary</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Incident Analysis</div>
                    <div className="text-sm text-gray-600">Detailed incident breakdown</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Compliance Report</div>
                    <div className="text-sm text-gray-600">Regulatory compliance status</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 pt-6 border-t">
        <p>Last updated: {dashboardData?.metrics.lastUpdate ? new Date(dashboardData.metrics.lastUpdate).toLocaleString() : 'Never'}</p>
        <p>System uptime: {dashboardData?.metrics.uptime || 'N/A'} | Security platform version 2.1.0</p>
      </div>
    </div>
  );
};

export default ArgiletteSecurityOrg;