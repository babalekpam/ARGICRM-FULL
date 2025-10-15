import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  Users, 
  Eye, 
  BarChart3, 
  Clock,
  Terminal,
  Monitor, 
  Laptop, 
  Smartphone, 
  Tablet,
  MapPin,
  CheckCircle, 
  XCircle, 
  Plus, 
  Edit, 
  Trash2,
  Wifi, 
  Globe, 
  Router,
  TrendingUp,
  Filter,
  Search,
  Download,
  Upload,
  Settings,
  Lock,
  Brain,
  Zap,

  Database,
  Network,
  Key,
  Fingerprint,
  ShieldCheck,
  AlertCircle,
  Award,
  FileCheck,
  Building2,
  Crown,
  Gauge,
  Target,
  Radar,
  Layers,
  Bug,
  Webhook,
  ShieldAlert,
  UserCheck,
  GitBranch,
  Cpu,
  HardDrive,
  MemoryStick,
  Boxes,
  Cable,
  Server,
  Cloud,
  Scan,
  Timer,
  Bell,
  Mail,
  Phone,
  MessageSquare,
  Slack,

  Wrench
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Device type icons mapping
const deviceTypeIcons = {
  desktop: Monitor,
  laptop: Laptop,
  mobile: Smartphone,
  tablet: Tablet,
};

// Risk level colors
const riskColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function ArgilletteSecurity() {
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRisk, setFilterRisk] = useState("all");
  const [newDevice, setNewDevice] = useState({
    deviceName: "",
    deviceType: "",
    userEmail: "",
    operatingSystem: "",
    ipAddress: "",
    macAddress: "",
    internalIp: "",
    locationCountry: "",
    locationRegion: "",
    locationCity: "",
    locationLatitude: "",
    locationLongitude: "",
    locationTimezone: "",
    isTrusted: false,
    isActive: true,
    deviceFingerprint: "",
    vpnDetected: false,
    proxyDetected: false,
    torDetected: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch devices
  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ['/api/device-management/devices'],
    queryFn: () => apiRequest('/api/device-management/devices'),
  });

  // Fetch device activity logs
  const { data: activityLogs = [] } = useQuery({
    queryKey: ['/api/device-management/activity-logs'],
    queryFn: () => apiRequest('/api/device-management/activity-logs'),
  });

  // Fetch security analytics data
  const { data: securityAnalytics = {}, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/security/analytics'],
    queryFn: () => apiRequest('/api/security/analytics'),
  });

  // Create device mutation
  const createDeviceMutation = useMutation({
    mutationFn: (deviceData: any) => apiRequest('/api/device-management/devices', {
      method: 'POST',
      body: JSON.stringify(deviceData),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/device-management/devices'] });
      setIsAddDeviceOpen(false);
      setNewDevice({
        deviceName: "",
        deviceType: "",
        userEmail: "",
        operatingSystem: "",
        ipAddress: "",
        macAddress: "",
        internalIp: "",
        locationCountry: "",
        locationRegion: "",
        locationCity: "",
        locationLatitude: "",
        locationLongitude: "",
        locationTimezone: "",
        isTrusted: false,
        isActive: true,
        deviceFingerprint: "",
        vpnDetected: false,
        proxyDetected: false,
        torDetected: false,
      });
      toast({
        title: "Device Added",
        description: "Device has been successfully registered in the system.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add device",
        variant: "destructive",
      });
    },
  });

  // Filter devices based on search and filters
  const filteredDevices = devices.filter((device: any) => {
    const matchesSearch = device.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.ipAddress?.includes(searchTerm);
    
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && device.isActive) ||
                         (filterStatus === "inactive" && !device.isActive);
    
    const matchesRisk = filterRisk === "all" || device.riskLevel === filterRisk;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const handleAddDevice = () => {
    createDeviceMutation.mutate(newDevice);
  };

  const handleDeviceDetail = (device: any) => {
    setSelectedDevice(device);
    setIsDetailOpen(true);
  };

  // Security Dashboard Content
  const SecurityDashboard = () => (
    <div className="space-y-6">
      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityAnalytics.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{securityAnalytics.newUsersToday || 0} from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityAnalytics.activeSessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {securityAnalytics.sessionGrowth || 0}% from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityAnalytics.securityAlerts || 0}</div>
            <p className="text-xs text-muted-foreground">
              {securityAnalytics.criticalAlerts || 0} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityAnalytics.averageRiskScore || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Platform security status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              AI Security Intelligence
            </CardTitle>
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
                <span className="text-sm">Anomaly Detection</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Risk Assessment</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-purple-600" />
              Security Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Real-time Monitoring</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Compliance Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Incident Response</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Audit Logging</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Device Management Content
  const DeviceManagement = () => (
    <div className="space-y-6">
      {/* Device Management Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Device Management</h2>
          <p className="text-muted-foreground">Monitor and manage organizational devices</p>
        </div>
        <Dialog open={isAddDeviceOpen} onOpenChange={setIsAddDeviceOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Register New Device</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deviceName">Device Name</Label>
                <Input
                  id="deviceName"
                  value={newDevice.deviceName}
                  onChange={(e) => setNewDevice({...newDevice, deviceName: e.target.value})}
                  placeholder="Enter device name"
                />
              </div>
              <div>
                <Label htmlFor="deviceType">Device Type</Label>
                <Select value={newDevice.deviceType} onValueChange={(value) => setNewDevice({...newDevice, deviceType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="userEmail">User Email</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={newDevice.userEmail}
                  onChange={(e) => setNewDevice({...newDevice, userEmail: e.target.value})}
                  placeholder="user@company.com"
                />
              </div>
              <div>
                <Label htmlFor="operatingSystem">Operating System</Label>
                <Input
                  id="operatingSystem"
                  value={newDevice.operatingSystem}
                  onChange={(e) => setNewDevice({...newDevice, operatingSystem: e.target.value})}
                  placeholder="Windows 11, macOS, etc."
                />
              </div>
              <div>
                <Label htmlFor="ipAddress">IP Address</Label>
                <Input
                  id="ipAddress"
                  value={newDevice.ipAddress}
                  onChange={(e) => setNewDevice({...newDevice, ipAddress: e.target.value})}
                  placeholder="192.168.1.100"
                />
              </div>
              <div>
                <Label htmlFor="macAddress">MAC Address</Label>
                <Input
                  id="macAddress"
                  value={newDevice.macAddress}
                  onChange={(e) => setNewDevice({...newDevice, macAddress: e.target.value})}
                  placeholder="00:1B:44:11:3A:B7"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddDeviceOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDevice} disabled={createDeviceMutation.isPending}>
                {createDeviceMutation.isPending ? "Adding..." : "Add Device"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Device Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRisk} onValueChange={setFilterRisk}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Devices ({filteredDevices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {devicesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-8">
              <Terminal className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No devices found</h3>
              <p className="text-muted-foreground">Add your first device to start monitoring</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevices.map((device: any) => {
                  const DeviceIcon = deviceTypeIcons[device.deviceType as keyof typeof deviceTypeIcons] || Monitor;
                  return (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DeviceIcon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{device.deviceName}</div>
                            <div className="text-sm text-muted-foreground">{device.operatingSystem}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{device.userEmail}</TableCell>
                      <TableCell className="capitalize">{device.deviceType}</TableCell>
                      <TableCell>{device.ipAddress}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {device.locationCity}, {device.locationCountry}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={riskColors[device.riskLevel as keyof typeof riskColors] || riskColors.low}>
                          {device.riskLevel || 'low'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={device.isActive ? "default" : "secondary"}>
                          {device.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeviceDetail(device)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-blue-600" />
          ARGILETTE Security Platform
        </h1>
        <p className="text-muted-foreground">
          Comprehensive security monitoring and device management for your organization
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Security Dashboard
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Device Management
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Live Monitoring
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="threat-intel" className="flex items-center gap-2">
            <Radar className="h-4 w-4" />
            Threat Intelligence
          </TabsTrigger>
          <TabsTrigger value="hardening" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Security Hardening
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="devices" className="mt-6">
          <DeviceManagement />
        </TabsContent>

        <TabsContent value="monitoring" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Security Monitoring</CardTitle>
              <p className="text-muted-foreground">Real-time security events and user behavior analysis</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Live Monitoring Dashboard</h3>
                <p className="text-muted-foreground">Real-time security monitoring interface</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Analytics</CardTitle>
              <p className="text-muted-foreground">Comprehensive security insights and behavioral analysis</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Analytics Dashboard</h3>
                <p className="text-muted-foreground">Advanced security analytics and reporting</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">SOC 2 Compliance</CardTitle>
                  <Award className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">98%</div>
                  <p className="text-xs text-muted-foreground">Compliance Score</p>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">ISO 27001</CardTitle>
                  <Shield className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">95%</div>
                  <p className="text-xs text-muted-foreground">Compliance Score</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">GDPR Compliance</CardTitle>
                  <Database className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">100%</div>
                  <p className="text-xs text-muted-foreground">Data Protection</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">PCI DSS</CardTitle>
                  <Lock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">92%</div>
                  <p className="text-xs text-muted-foreground">Payment Security</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-green-600" />
                    Compliance Frameworks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">SOC 2 Type II</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Certified</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">ISO 27001:2022</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Certified</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">NIST Cybersecurity Framework</span>
                      <Badge variant="default" className="bg-blue-100 text-blue-800">Implemented</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">HIPAA Compliance</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Compliant</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">FedRAMP Moderate</span>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Regulatory Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">GDPR (EU)</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Compliant</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">CCPA (California)</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Compliant</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">SOX Compliance</span>
                      <Badge variant="default" className="bg-blue-100 text-blue-800">Monitored</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">PCI DSS Level 1</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Certified</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">FISMA Compliance</span>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Assessment</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-purple-600" />
                  Compliance Dashboard
                </CardTitle>
                <p className="text-muted-foreground">Real-time compliance monitoring and automated reporting</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <Gauge className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">96.2%</div>
                    <p className="text-sm text-muted-foreground">Overall Compliance Score</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">15</div>
                    <p className="text-sm text-muted-foreground">Active Frameworks</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-600">2</div>
                    <p className="text-sm text-muted-foreground">Pending Audits</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threat-intel" className="mt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">3</div>
                  <p className="text-xs text-muted-foreground">Critical Threats Detected</p>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Threat Intelligence</CardTitle>
                  <Radar className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">1,247</div>
                  <p className="text-xs text-muted-foreground">IOCs Monitored</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Threat Feeds</CardTitle>
                  <Network className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">24</div>
                  <p className="text-xs text-muted-foreground">Active Feeds</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Blocked Attacks</CardTitle>
                  <ShieldCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">8,392</div>
                  <p className="text-xs text-muted-foreground">Last 24 Hours</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Active Threat Campaigns
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">APT29 - Cozy Bear</div>
                        <div className="text-xs text-muted-foreground">Nation-state phishing campaign</div>
                      </div>
                      <Badge variant="destructive">Critical</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">Ransomware - LockBit 3.0</div>
                        <div className="text-xs text-muted-foreground">Financial sector targeting</div>
                      </div>
                      <Badge variant="destructive">High</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">Supply Chain Attack</div>
                        <div className="text-xs text-muted-foreground">SolarWinds-style compromise</div>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800">Medium</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    AI-Powered Threat Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Behavioral Anomaly Detection</span>
                        <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Machine learning models analyzing user behavior patterns
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Predictive Threat Modeling</span>
                        <Badge variant="default" className="bg-blue-100 text-blue-800">Learning</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        AI predicting potential attack vectors and vulnerabilities
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Automated Response</span>
                        <Badge variant="default" className="bg-purple-100 text-purple-800">Enabled</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Intelligent automated incident response and containment
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Global Threat Intelligence
                </CardTitle>
                <p className="text-muted-foreground">Real-time threat intelligence from premium sources</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold text-blue-600">250K+</div>
                    <p className="text-sm text-muted-foreground">Malware Signatures</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold text-red-600">50K+</div>
                    <p className="text-sm text-muted-foreground">Malicious IPs</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold text-yellow-600">15K+</div>
                    <p className="text-sm text-muted-foreground">Phishing Domains</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold text-green-600">99.8%</div>
                    <p className="text-sm text-muted-foreground">Detection Accuracy</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hardening" className="mt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Security Score</CardTitle>
                  <Gauge className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">94%</div>
                  <p className="text-xs text-muted-foreground">Security Hardening</p>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
                  <Bug className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">7</div>
                  <p className="text-xs text-muted-foreground">Open Issues</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Patches Applied</CardTitle>
                  <Wrench className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">147</div>
                  <p className="text-xs text-muted-foreground">This Month</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Hardening Rules</CardTitle>
                  <Layers className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">89</div>
                  <p className="text-xs text-muted-foreground">Active Rules</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-blue-600" />
                    System Hardening
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Operating System Hardening</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Network Security</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Configured</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Firewall Rules</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Access Controls</span>
                      <Badge variant="default" className="bg-blue-100 text-blue-800">Enforced</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Endpoint Protection</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Deployed</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-purple-600" />
                    Cloud Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Cloud Configuration</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Secured</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Data Encryption</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">AES-256</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Identity Management</span>
                      <Badge variant="default" className="bg-blue-100 text-blue-800">SSO Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Backup Security</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Zero Trust Network</span>
                      <Badge variant="default" className="bg-purple-100 text-purple-800">Implemented</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scan className="h-5 w-5 text-green-600" />
                    Vulnerability Scanning
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold text-green-600">99.2%</div>
                    <p className="text-sm text-muted-foreground">Systems Scanned</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Critical</span>
                      <span className="text-red-600 font-medium">0</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>High</span>
                      <span className="text-orange-600 font-medium">2</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Medium</span>
                      <span className="text-yellow-600 font-medium">5</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Low</span>
                      <span className="text-blue-600 font-medium">12</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-blue-600" />
                    Patch Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold text-blue-600">98.7%</div>
                    <p className="text-sm text-muted-foreground">Patch Compliance</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Critical Patches</span>
                      <span className="text-green-600 font-medium">Updated</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Security Patches</span>
                      <span className="text-green-600 font-medium">Current</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Feature Updates</span>
                      <span className="text-yellow-600 font-medium">Pending</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Next Scan</span>
                      <span className="text-blue-600 font-medium">4 hours</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Fingerprint className="h-5 w-5 text-purple-600" />
                    Access Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-lg font-bold text-purple-600">100%</div>
                    <p className="text-sm text-muted-foreground">MFA Enabled</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>SSO Integration</span>
                      <span className="text-green-600 font-medium">Active</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Privileged Access</span>
                      <span className="text-blue-600 font-medium">Managed</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Password Policy</span>
                      <span className="text-green-600 font-medium">Enforced</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Session Timeout</span>
                      <span className="text-blue-600 font-medium">15 min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Device Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Device Details</DialogTitle>
          </DialogHeader>
          {selectedDevice && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Device Information</h3>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {selectedDevice.deviceName}</p>
                  <p><strong>Type:</strong> {selectedDevice.deviceType}</p>
                  <p><strong>User:</strong> {selectedDevice.userEmail}</p>
                  <p><strong>OS:</strong> {selectedDevice.operatingSystem}</p>
                  <p><strong>IP Address:</strong> {selectedDevice.ipAddress}</p>
                  <p><strong>MAC Address:</strong> {selectedDevice.macAddress}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Security Status</h3>
                <div className="space-y-2">
                  <p><strong>Risk Level:</strong> 
                    <Badge className={`ml-2 ${riskColors[selectedDevice.riskLevel as keyof typeof riskColors] || riskColors.low}`}>
                      {selectedDevice.riskLevel || 'low'}
                    </Badge>
                  </p>
                  <p><strong>Status:</strong> 
                    <Badge className="ml-2" variant={selectedDevice.isActive ? "default" : "secondary"}>
                      {selectedDevice.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </p>
                  <p><strong>Trusted:</strong> {selectedDevice.isTrusted ? "Yes" : "No"}</p>
                  <p><strong>Location:</strong> {selectedDevice.locationCity}, {selectedDevice.locationCountry}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}