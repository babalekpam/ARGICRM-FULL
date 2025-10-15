import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Globe,
  Database,
  FileText,
  Settings,
  Download,
  Upload,
  Zap,
  Activity,
  UserCheck,
  Ban,
  Fingerprint,
  Smartphone,
  Monitor,
  Server,
  CloudLightning
} from "lucide-react";

interface SecurityMetric {
  name: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
  description: string;
  trend: string;
}

interface SecurityEvent {
  id: string;
  type: 'login' | 'access' | 'data' | 'admin' | 'threat';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  ip: string;
  location: string;
  resolved: boolean;
}

interface ComplianceStandard {
  id: string;
  name: string;
  description: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  coverage: number;
  lastAudit: string;
  requirements: string[];
  gaps: string[];
}

const SECURITY_METRICS: SecurityMetric[] = [
  {
    name: 'Security Score',
    value: '96/100',
    status: 'good',
    description: 'Overall security posture',
    trend: '+2 points this month'
  },
  {
    name: 'Failed Login Attempts',
    value: '12',
    status: 'warning',
    description: 'Last 24 hours',
    trend: '+3 from yesterday'
  },
  {
    name: 'Active Sessions',
    value: '247',
    status: 'good',
    description: 'Current user sessions',
    trend: 'Normal activity'
  },
  {
    name: 'Data Encryption',
    value: '100%',
    status: 'good',
    description: 'Encrypted data at rest',
    trend: 'Fully compliant'
  },
  {
    name: 'Vulnerability Scan',
    value: '0 Critical',
    status: 'good',
    description: 'Last scan 2 hours ago',
    trend: '3 resolved this week'
  },
  {
    name: 'Compliance Score',
    value: '94%',
    status: 'good',
    description: 'Regulatory compliance',
    trend: '+1% this quarter'
  }
];

const SECURITY_EVENTS: SecurityEvent[] = [
  {
    id: '1',
    type: 'threat',
    severity: 'high',
    title: 'Suspicious Login Pattern Detected',
    description: 'Multiple failed login attempts from unusual location',
    timestamp: '5 minutes ago',
    user: 'john.doe@company.com',
    ip: '192.168.1.100',
    location: 'Lagos, Nigeria',
    resolved: false
  },
  {
    id: '2',
    type: 'access',
    severity: 'medium',
    title: 'Privilege Escalation Request',
    description: 'User requested admin access to customer data',
    timestamp: '2 hours ago',
    user: 'sarah.admin@company.com',
    ip: '10.0.0.15',
    location: 'Nairobi, Kenya',
    resolved: true
  },
  {
    id: '3',
    type: 'data',
    severity: 'low',
    title: 'Large Data Export',
    description: 'User exported 10,000+ customer records',
    timestamp: '4 hours ago',
    user: 'manager@company.com',
    ip: '172.16.0.5',
    location: 'Cape Town, South Africa',
    resolved: true
  },
  {
    id: '4',
    type: 'login',
    severity: 'critical',
    title: 'Brute Force Attack Blocked',
    description: 'Automated login attempts blocked by security system',
    timestamp: '6 hours ago',
    user: 'Unknown',
    ip: '203.0.113.45',
    location: 'Unknown',
    resolved: true
  }
];

const COMPLIANCE_STANDARDS: ComplianceStandard[] = [
  {
    id: 'gdpr',
    name: 'GDPR (General Data Protection Regulation)',
    description: 'EU data protection and privacy regulation',
    status: 'compliant',
    coverage: 98,
    lastAudit: '2024-01-10',
    requirements: ['Data encryption', 'Right to be forgotten', 'Consent management', 'Data portability'],
    gaps: ['Enhanced audit logging']
  },
  {
    id: 'iso27001',
    name: 'ISO 27001',
    description: 'Information security management system standard',
    status: 'compliant',
    coverage: 95,
    lastAudit: '2024-01-08',
    requirements: ['Risk management', 'Security controls', 'Incident response', 'Business continuity'],
    gaps: ['Physical security documentation', 'Vendor assessment updates']
  },
  {
    id: 'soc2',
    name: 'SOC 2 Type II',
    description: 'Service organization controls for security and availability',
    status: 'partial',
    coverage: 87,
    lastAudit: '2024-01-05',
    requirements: ['Security controls', 'Availability monitoring', 'Processing integrity', 'Confidentiality'],
    gaps: ['Automated monitoring alerts', 'Quarterly security reviews', 'Vendor management']
  },
  {
    id: 'pci-dss',
    name: 'PCI DSS',
    description: 'Payment card industry data security standard',
    status: 'compliant',
    coverage: 100,
    lastAudit: '2024-01-12',
    requirements: ['Secure network', 'Cardholder data protection', 'Vulnerability management', 'Access control'],
    gaps: []
  }
];

export default function EnterpriseSecurity() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  // Fetch real-time security data
  const { data: securityData, isLoading } = useQuery({
    queryKey: ["/api/security/monitoring"],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': case 'compliant': return 'text-green-600';
      case 'warning': case 'partial': return 'text-yellow-600';
      case 'critical': case 'non-compliant': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const SecurityMetricCard = ({ metric }: { metric: SecurityMetric }) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
          {metric.status === 'good' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : metric.status === 'warning' ? (
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
            {metric.value}
          </div>
          <p className="text-sm text-gray-600">{metric.description}</p>
          <p className="text-xs text-gray-500">{metric.trend}</p>
        </div>
      </CardContent>
    </Card>
  );

  const SecurityEventCard = ({ event }: { event: SecurityEvent }) => (
    <Card className={`cursor-pointer transition-colors ${
      selectedEvent?.id === event.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
    }`} onClick={() => setSelectedEvent(event)}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className={`p-1 rounded-full ${
            event.type === 'threat' ? 'bg-red-100 dark:bg-red-900' :
            event.type === 'access' ? 'bg-yellow-100 dark:bg-yellow-900' :
            event.type === 'data' ? 'bg-blue-100 dark:bg-blue-900' :
            event.type === 'admin' ? 'bg-purple-100 dark:bg-purple-900' :
            'bg-gray-100 dark:bg-gray-900'
          }`}>
            {event.type === 'threat' && <Shield className="h-4 w-4 text-red-600" />}
            {event.type === 'access' && <Key className="h-4 w-4 text-yellow-600" />}
            {event.type === 'data' && <Database className="h-4 w-4 text-blue-600" />}
            {event.type === 'admin' && <Settings className="h-4 w-4 text-purple-600" />}
            {event.type === 'login' && <UserCheck className="h-4 w-4 text-gray-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium truncate">{event.title}</h4>
              <div className="flex items-center space-x-2">
                <Badge className={getSeverityColor(event.severity)}>
                  {event.severity}
                </Badge>
                {event.resolved && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 truncate mt-1">{event.description}</p>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>{event.timestamp}</span>
              <span>{event.location}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ComplianceCard = ({ standard }: { standard: ComplianceStandard }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{standard.name}</CardTitle>
          <Badge variant={
            standard.status === 'compliant' ? 'default' :
            standard.status === 'partial' ? 'secondary' : 'destructive'
          }>
            {standard.status}
          </Badge>
        </div>
        <CardDescription>{standard.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Coverage</span>
              <span>{standard.coverage}%</span>
            </div>
            <Progress value={standard.coverage} className="h-2" />
          </div>

          <div>
            <h5 className="text-sm font-medium mb-2">Requirements Met</h5>
            <div className="space-y-1">
              {standard.requirements.map(req => (
                <div key={req} className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>

          {standard.gaps.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2">Gaps to Address</h5>
              <div className="space-y-1">
                {standard.gaps.map(gap => (
                  <div key={gap} className="flex items-center space-x-2 text-sm">
                    <AlertTriangle className="h-3 w-3 text-yellow-600" />
                    <span>{gap}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t text-sm text-gray-600">
            <span>Last audit: {standard.lastAudit}</span>
            <Button size="sm" variant="outline">View Report</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Enterprise Security</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Advanced security monitoring, compliance management, and threat protection
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Security Report
            </Button>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Security Settings
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="access">Access Control</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="threats">Threat Protection</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SECURITY_METRICS.map(metric => (
                <SecurityMetricCard key={metric.name} metric={metric} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Status Overview</CardTitle>
                  <CardDescription>Current security posture and key indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-green-600" />
                        <span>Firewall Protection</span>
                      </div>
                      <Badge variant="default" className="text-green-600">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Lock className="h-5 w-5 text-green-600" />
                        <span>SSL/TLS Encryption</span>
                      </div>
                      <Badge variant="default" className="text-green-600">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Fingerprint className="h-5 w-5 text-green-600" />
                        <span>2FA Enforcement</span>
                      </div>
                      <Badge variant="default" className="text-green-600">87% Users</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-5 w-5 text-green-600" />
                        <span>Activity Monitoring</span>
                      </div>
                      <Badge variant="default" className="text-green-600">Real-time</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Database className="h-5 w-5 text-green-600" />
                        <span>Data Backup</span>
                      </div>
                      <Badge variant="default" className="text-green-600">Daily</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Security Events</CardTitle>
                  <CardDescription>Latest security incidents and alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {SECURITY_EVENTS.slice(0, 4).map(event => (
                      <div key={event.id} className="flex items-center space-x-3 p-2 border rounded">
                        <div className={`w-2 h-2 rounded-full ${
                          event.severity === 'critical' ? 'bg-red-600' :
                          event.severity === 'high' ? 'bg-orange-600' :
                          event.severity === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <p className="text-xs text-gray-600">{event.timestamp}</p>
                        </div>
                        {event.resolved && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    View All Events
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-semibold">Security Events</h2>
                {SECURITY_EVENTS.map(event => (
                  <SecurityEventCard key={event.id} event={event} />
                ))}
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Critical Events</span>
                        <span className="font-medium text-red-600">2</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">High Priority</span>
                        <span className="font-medium text-orange-600">5</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Medium Priority</span>
                        <span className="font-medium text-yellow-600">12</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Low Priority</span>
                        <span className="font-medium text-blue-600">28</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {selectedEvent && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Event Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium">{selectedEvent.title}</h5>
                          <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium">User:</span>
                            <p>{selectedEvent.user}</p>
                          </div>
                          <div>
                            <span className="font-medium">IP:</span>
                            <p>{selectedEvent.ip}</p>
                          </div>
                          <div>
                            <span className="font-medium">Location:</span>
                            <p>{selectedEvent.location}</p>
                          </div>
                          <div>
                            <span className="font-medium">Time:</span>
                            <p>{selectedEvent.timestamp}</p>
                          </div>
                        </div>
                        <div className="pt-3 border-t">
                          <Button size="sm" className="w-full">
                            Investigate
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Compliance Standards</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Monitor compliance with industry standards and regulations
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {COMPLIANCE_STANDARDS.map(standard => (
                <ComplianceCard key={standard.id} standard={standard} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="access" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Access Control Management</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Manage user permissions, roles, and access policies
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-3xl font-bold">247</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Active Sessions</span>
                        <span>247</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Mobile Users</span>
                        <span>156 (63%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Desktop Users</span>
                        <span>91 (37%)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Permission Groups</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Administrators</span>
                      <Badge variant="outline">12 users</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Sales Managers</span>
                      <Badge variant="outline">45 users</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Sales Reps</span>
                      <Badge variant="outline">128 users</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Support Team</span>
                      <Badge variant="outline">62 users</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2FA Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-3xl font-bold text-green-600">87%</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Enabled</span>
                        <span>215 users</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Pending</span>
                        <span>23 users</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Disabled</span>
                        <span>9 users</span>
                      </div>
                    </div>
                    <Button size="sm" className="w-full">
                      Enforce 2FA
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Audit Logs</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Comprehensive logging and audit trail for compliance and security
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <div className="text-2xl font-bold">2.8M</div>
                  <p className="text-sm text-gray-600">Log Entries</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Activity className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <div className="text-2xl font-bold">99.9%</div>
                  <p className="text-sm text-gray-600">Uptime Logged</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <div className="text-2xl font-bold">7 Years</div>
                  <p className="text-sm text-gray-600">Retention Period</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Download className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-sm text-gray-600">Export Failures</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="threats" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Threat Protection</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Advanced threat detection, prevention, and response capabilities
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>DDoS Protection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <CloudLightning className="h-8 w-8 text-blue-600" />
                    <Badge variant="default" className="text-green-600">Active</Badge>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-sm text-gray-600">Attacks blocked today</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Malware Scanning</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Shield className="h-8 w-8 text-green-600" />
                    <Badge variant="default" className="text-green-600">Clean</Badge>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-bold">15,234</div>
                    <p className="text-sm text-gray-600">Files scanned today</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Intrusion Detection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Eye className="h-8 w-8 text-purple-600" />
                    <Badge variant="default" className="text-green-600">Monitoring</Badge>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-bold">3</div>
                    <p className="text-sm text-gray-600">Alerts investigated</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vulnerability Scan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Zap className="h-8 w-8 text-yellow-600" />
                    <Badge variant="default" className="text-green-600">Scheduled</Badge>
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-sm text-gray-600">Critical vulnerabilities</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}