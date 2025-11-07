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
  Monitor, 
  Laptop, 
  Smartphone, 
  Tablet, 
  Shield, 
  MapPin, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Wifi, 
  Globe, 
  Clock,
  Users,
  Router,
  Shield as Security,
  TrendingUp,
  Filter,
  Search,
  Download,
  Upload,
  Settings
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

export default function DeviceManagement() {
  const [selectedDevice, setSelectedDevice] = useState(null);
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
  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['/api/device-management/devices'],
    queryFn: () => apiRequest('/api/device-management/devices'),
  });

  // Fetch device activity logs
  const { data: activityLogs = [] } = useQuery({
    queryKey: ['/api/device-management/activity-logs'],
    queryFn: () => apiRequest('/api/device-management/activity-logs'),
  });

  // Fetch security policies
  const { data: securityPolicies = [] } = useQuery({
    queryKey: ['/api/device-management/security-policies'],
    queryFn: () => apiRequest('/api/device-management/security-policies'),
  });

  // Add device mutation
  const addDeviceMutation = useMutation({
    mutationFn: (device: any) => fetch('/api/device-management/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-email': 'abel@argilette.com'
      },
      body: JSON.stringify(device),
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/device-management/devices'] });
      setIsAddDeviceOpen(false);
      resetNewDevice();
      toast({
        title: "Device Added",
        description: "Device has been successfully registered.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to register device. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update device mutation
  const updateDeviceMutation = useMutation({
    mutationFn: ({ id, ...device }: any) => fetch(`/api/device-management/devices/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-email': 'abel@argilette.com'
      },
      body: JSON.stringify(device),
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/device-management/devices'] });
      toast({
        title: "Device Updated",
        description: "Device information has been updated.",
      });
    },
  });

  // Delete device mutation
  const deleteDeviceMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/device-management/devices/${id}`, {
      method: 'DELETE',
      headers: {
        'x-auth-email': 'abel@argilette.com'
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/device-management/devices'] });
      toast({
        title: "Device Removed",
        description: "Device has been removed from the system.",
      });
    },
  });

  const resetNewDevice = () => {
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
  };

  const handleAddDevice = () => {
    addDeviceMutation.mutate(newDevice);
  };

  const handleUpdateDevice = (device) => {
    updateDeviceMutation.mutate(device);
  };

  const handleDeleteDevice = (id) => {
    if (window.confirm("Are you sure you want to remove this device?")) {
      deleteDeviceMutation.mutate(id);
    }
  };

  const handleTrustDevice = (device) => {
    handleUpdateDevice({ ...device, isTrusted: !device.isTrusted });
  };

  const handleActivateDevice = (device) => {
    handleUpdateDevice({ ...device, isActive: !device.isActive });
  };

  // Filter devices based on search and filters
  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.ipAddress.includes(searchTerm);
    
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && device.isActive) ||
                         (filterStatus === "inactive" && !device.isActive) ||
                         (filterStatus === "trusted" && device.isTrusted) ||
                         (filterStatus === "untrusted" && !device.isTrusted);
    
    const matchesRisk = filterRisk === "all" || device.riskLevel === filterRisk;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  // Calculate statistics
  const stats = {
    totalDevices: devices.length,
    activeDevices: devices.filter(d => d.isActive).length,
    trustedDevices: devices.filter(d => d.isTrusted).length,
    highRiskDevices: devices.filter(d => d.riskLevel === "high" || d.riskLevel === "critical").length,
    vpnDevices: devices.filter(d => d.vpnDetected).length,
    proxyDevices: devices.filter(d => d.proxyDetected).length,
  };

  const DeviceIcon = ({ type }) => {
    const IconComponent = deviceTypeIcons[type] || Monitor;
    return <IconComponent className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading device management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Device Management</h1>
          <p className="text-gray-600 mt-1">Manage and monitor all company devices</p>
        </div>
        <Dialog open={isAddDeviceOpen} onOpenChange={setIsAddDeviceOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Register Device
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Register New Device</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deviceName">Device Name</Label>
                  <Input
                    id="deviceName"
                    value={newDevice.deviceName}
                    onChange={(e) => setNewDevice({...newDevice, deviceName: e.target.value})}
                    placeholder="John's MacBook Pro"
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
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="operatingSystem">Operating System</Label>
                  <Input
                    id="operatingSystem"
                    value={newDevice.operatingSystem}
                    onChange={(e) => setNewDevice({...newDevice, operatingSystem: e.target.value})}
                    placeholder="macOS 14.0, Windows 11, etc."
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
                    placeholder="00:11:22:33:44:55"
                  />
                </div>
                <div>
                  <Label htmlFor="internalIp">Internal IP</Label>
                  <Input
                    id="internalIp"
                    value={newDevice.internalIp}
                    onChange={(e) => setNewDevice({...newDevice, internalIp: e.target.value})}
                    placeholder="10.0.0.15"
                  />
                </div>
                <div>
                  <Label htmlFor="locationCountry">Country</Label>
                  <Input
                    id="locationCountry"
                    value={newDevice.locationCountry}
                    onChange={(e) => setNewDevice({...newDevice, locationCountry: e.target.value})}
                    placeholder="United States"
                  />
                </div>
                <div>
                  <Label htmlFor="locationRegion">Region/State</Label>
                  <Input
                    id="locationRegion"
                    value={newDevice.locationRegion}
                    onChange={(e) => setNewDevice({...newDevice, locationRegion: e.target.value})}
                    placeholder="California"
                  />
                </div>
                <div>
                  <Label htmlFor="locationCity">City</Label>
                  <Input
                    id="locationCity"
                    value={newDevice.locationCity}
                    onChange={(e) => setNewDevice({...newDevice, locationCity: e.target.value})}
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <Label htmlFor="locationLatitude">Latitude</Label>
                  <Input
                    id="locationLatitude"
                    value={newDevice.locationLatitude}
                    onChange={(e) => setNewDevice({...newDevice, locationLatitude: e.target.value})}
                    placeholder="37.7749"
                  />
                </div>
                <div>
                  <Label htmlFor="locationLongitude">Longitude</Label>
                  <Input
                    id="locationLongitude"
                    value={newDevice.locationLongitude}
                    onChange={(e) => setNewDevice({...newDevice, locationLongitude: e.target.value})}
                    placeholder="-122.4194"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="deviceFingerprint">Device Fingerprint</Label>
                <Textarea
                  id="deviceFingerprint"
                  value={newDevice.deviceFingerprint}
                  onChange={(e) => setNewDevice({...newDevice, deviceFingerprint: e.target.value})}
                  placeholder="Browser/system fingerprint data"
                />
              </div>
              <div className="flex space-x-4">
                <Button 
                  onClick={handleAddDevice}
                  disabled={addDeviceMutation.isPending}
                  className="flex-1"
                >
                  {addDeviceMutation.isPending ? "Registering..." : "Register Device"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDeviceOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Devices</p>
                <p className="text-2xl font-bold">{stats.totalDevices}</p>
              </div>
              <Monitor className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeDevices}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trusted</p>
                <p className="text-2xl font-bold text-blue-600">{stats.trustedDevices}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Risk</p>
                <p className="text-2xl font-bold text-red-600">{stats.highRiskDevices}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">VPN</p>
                <p className="text-2xl font-bold text-orange-600">{stats.vpnDevices}</p>
              </div>
              <Wifi className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Proxy</p>
                <p className="text-2xl font-bold text-purple-600">{stats.proxyDevices}</p>
              </div>
              <Router className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
          <TabsTrigger value="policies">Security Policies</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Device Inventory</CardTitle>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search devices..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
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
                      <SelectItem value="trusted">Trusted</SelectItem>
                      <SelectItem value="untrusted">Untrusted</SelectItem>
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
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Security</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <DeviceIcon type={device.deviceType} />
                          <div>
                            <div className="font-medium">{device.deviceName}</div>
                            <div className="text-sm text-gray-500">{device.operatingSystem}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{device.userEmail}</div>
                          <div className="text-gray-500">{device.deviceType}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{device.ipAddress}</div>
                          <div className="text-gray-500">{device.macAddress}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{device.locationCity}, {device.locationCountry}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <Badge variant={device.isActive ? "default" : "secondary"}>
                            {device.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {device.isTrusted && (
                            <Badge variant="outline" className="text-green-600">
                              Trusted
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge className={riskColors[device.riskLevel]}>
                            {device.riskLevel}
                          </Badge>
                          <span className="text-sm text-gray-500">{device.securityScore}/100</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {device.vpnDetected && (
                            <Badge variant="outline" className="text-orange-600">VPN</Badge>
                          )}
                          {device.proxyDetected && (
                            <Badge variant="outline" className="text-purple-600">Proxy</Badge>
                          )}
                          {device.torDetected && (
                            <Badge variant="outline" className="text-red-600">Tor</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDevice(device);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTrustDevice(device)}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDevice(device.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{log.userEmail}</span>
                        <Badge variant="outline">{log.activityType}</Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{log.activityDescription}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">IP: {log.ipAddress}</span>
                        <span className="text-xs text-gray-500">Location: {log.locationCity}, {log.locationCountry}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {log.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${
                        log.riskScore > 70 ? 'bg-red-100 text-red-800' :
                        log.riskScore > 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        Risk: {log.riskScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityPolicies.map((policy) => (
                  <div key={policy.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{policy.policyName}</h3>
                        <p className="text-sm text-gray-600">{policy.policyType}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={policy.isActive ? "default" : "secondary"}>
                          {policy.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(deviceTypeIcons).map(([type, IconComponent]) => {
                    const count = devices.filter(d => d.deviceType === type).length;
                    const percentage = devices.length > 0 ? (count / devices.length * 100) : 0;
                    
                    return (
                      <div key={type} className="flex items-center space-x-3">
                        <IconComponent className="h-5 w-5 text-gray-600" />
                        <div className="flex-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{type}</span>
                            <span>{count} devices</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{width: `${percentage}%`}}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Security Score</span>
                    <span className="font-medium">
                      {devices.length > 0 ? Math.round(devices.reduce((acc, d) => acc + d.securityScore, 0) / devices.length) : 0}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Devices with VPN</span>
                    <span className="font-medium">{stats.vpnDevices}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Devices with Proxy</span>
                    <span className="font-medium">{stats.proxyDevices}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Trusted Devices</span>
                    <span className="font-medium">{stats.trustedDevices}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Device Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Device Details</DialogTitle>
          </DialogHeader>
          {selectedDevice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Device Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <DeviceIcon type={selectedDevice.deviceType} />
                      <span className="font-medium">{selectedDevice.deviceName}</span>
                    </div>
                    <p className="text-sm text-gray-600">Type: {selectedDevice.deviceType}</p>
                    <p className="text-sm text-gray-600">OS: {selectedDevice.operatingSystem}</p>
                    <p className="text-sm text-gray-600">User: {selectedDevice.userEmail}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-3">Network Information</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">IP Address: {selectedDevice.ipAddress}</p>
                    <p className="text-sm text-gray-600">MAC Address: {selectedDevice.macAddress}</p>
                    <p className="text-sm text-gray-600">Internal IP: {selectedDevice.internalIp}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-3">Location Information</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Country: {selectedDevice.locationCountry}</p>
                    <p className="text-sm text-gray-600">Region: {selectedDevice.locationRegion}</p>
                    <p className="text-sm text-gray-600">City: {selectedDevice.locationCity}</p>
                    <p className="text-sm text-gray-600">Timezone: {selectedDevice.locationTimezone}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-3">Security Status</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Security Score: {selectedDevice.securityScore}/100</p>
                    <p className="text-sm text-gray-600">Risk Level: {selectedDevice.riskLevel}</p>
                    <div className="flex space-x-2">
                      <Badge variant={selectedDevice.isActive ? "default" : "secondary"}>
                        {selectedDevice.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {selectedDevice.isTrusted && (
                        <Badge variant="outline" className="text-green-600">Trusted</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}