import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Zap, 
  Plus, 
  Edit, 
  Trash2, 
  Settings,
  Workflow,
  Database,
  Cloud,
  Code,
  Link,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
  Key,
  Globe,
  Smartphone,
  Mail,
  MessageSquare,
  BarChart3,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Webhook
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  type: 'api' | 'webhook' | 'oauth' | 'database' | 'saas' | 'custom';
  description: string;
  provider: string;
  category: string;
  status: 'active' | 'inactive' | 'error' | 'configuring';
  lastSync: string;
  dataFlow: 'inbound' | 'outbound' | 'bidirectional';
  recordsProcessed: number;
  errorCount: number;
  configuration: Record<string, any>;
  createdAt: string;
}

interface APIEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  description: string;
  authentication: 'none' | 'api_key' | 'oauth' | 'basic' | 'bearer';
  rateLimits: {
    requests: number;
    period: string;
  };
  isActive: boolean;
  lastUsed: string;
  usage: number;
  documentation: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
  lastTriggered: string;
  successCount: number;
  failureCount: number;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
  };
}

export default function AdvancedIntegrations() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isCreateIntegrationOpen, setIsCreateIntegrationOpen] = useState(false);
  const [isCreateAPIOpen, setIsCreateAPIOpen] = useState(false);
  const [isCreateWebhookOpen, setIsCreateWebhookOpen] = useState(false);
  const queryClient = useQueryClient();

  const [integrationFormData, setIntegrationFormData] = useState({
    name: "",
    type: "api",
    provider: "",
    category: "",
    description: ""
  });

  const [apiFormData, setApiFormData] = useState({
    name: "",
    method: "GET",
    endpoint: "",
    description: "",
    authentication: "api_key"
  });

  const [webhookFormData, setWebhookFormData] = useState({
    name: "",
    url: "",
    events: "",
    secret: ""
  });

  // Mock integrations data
  const { data: integrations = [] } = useQuery({
    queryKey: ["/api/integrations"],
    queryFn: () => Promise.resolve([
      {
        id: "int-1",
        name: "Salesforce Sync",
        type: "saas" as const,
        description: "Bidirectional sync with Salesforce CRM",
        provider: "Salesforce",
        category: "CRM",
        status: "active" as const,
        lastSync: "2024-06-24T10:30:00Z",
        dataFlow: "bidirectional" as const,
        recordsProcessed: 1248,
        errorCount: 2,
        configuration: {
          apiVersion: "v59.0",
          environment: "production",
          syncFrequency: "5 minutes"
        },
        createdAt: "2024-01-15T00:00:00Z"
      },
      {
        id: "int-2",
        name: "HubSpot Marketing",
        type: "oauth" as const,
        description: "Marketing automation and lead tracking",
        provider: "HubSpot",
        category: "Marketing",
        status: "active" as const,
        lastSync: "2024-06-24T09:45:00Z",
        dataFlow: "inbound" as const,
        recordsProcessed: 567,
        errorCount: 0,
        configuration: {
          portalId: "12345678",
          scopes: ["contacts", "deals", "marketing"]
        },
        createdAt: "2024-02-01T00:00:00Z"
      },
      {
        id: "int-3",
        name: "Stripe Payments",
        type: "webhook" as const,
        description: "Real-time payment and subscription events",
        provider: "Stripe",
        category: "Finance",
        status: "active" as const,
        lastSync: "2024-06-24T11:15:00Z",
        dataFlow: "inbound" as const,
        recordsProcessed: 234,
        errorCount: 1,
        configuration: {
          webhookSecret: "whsec_...",
          events: ["payment_intent.succeeded", "customer.subscription.updated"]
        },
        createdAt: "2024-01-20T00:00:00Z"
      },
      {
        id: "int-4",
        name: "Slack Notifications",
        type: "api" as const,
        description: "Send alerts and updates to Slack channels",
        provider: "Slack",
        category: "Communication",
        status: "error" as const,
        lastSync: "2024-06-23T16:30:00Z",
        dataFlow: "outbound" as const,
        recordsProcessed: 89,
        errorCount: 15,
        configuration: {
          webhookUrl: "https://hooks.slack.com/...",
          channel: "#sales-alerts"
        },
        createdAt: "2024-03-10T00:00:00Z"
      }
    ])
  });

  // Mock API endpoints
  const { data: apiEndpoints = [] } = useQuery({
    queryKey: ["/api/api-endpoints"],
    queryFn: () => Promise.resolve([
      {
        id: "api-1",
        name: "Get Contacts",
        method: "GET" as const,
        endpoint: "/api/v1/contacts",
        description: "Retrieve all contacts with pagination",
        authentication: "api_key" as const,
        rateLimits: { requests: 1000, period: "hour" },
        isActive: true,
        lastUsed: "2024-06-24T10:30:00Z",
        usage: 245,
        documentation: "https://docs.argilette.com/api/contacts"
      },
      {
        id: "api-2",
        name: "Create Deal",
        method: "POST" as const,
        endpoint: "/api/v1/deals",
        description: "Create a new deal in the pipeline",
        authentication: "oauth" as const,
        rateLimits: { requests: 500, period: "hour" },
        isActive: true,
        lastUsed: "2024-06-24T09:15:00Z",
        usage: 67,
        documentation: "https://docs.argilette.com/api/deals"
      },
      {
        id: "api-3",
        name: "Update Account",
        method: "PUT" as const,
        endpoint: "/api/v1/accounts/{id}",
        description: "Update account information",
        authentication: "bearer" as const,
        rateLimits: { requests: 200, period: "hour" },
        isActive: false,
        lastUsed: "2024-06-20T14:22:00Z",
        usage: 12,
        documentation: "https://docs.argilette.com/api/accounts"
      }
    ])
  });

  // Mock webhooks
  const { data: webhooks = [] } = useQuery({
    queryKey: ["/api/webhooks"],
    queryFn: () => Promise.resolve([
      {
        id: "webhook-1",
        name: "Deal Stage Changed",
        url: "https://external-system.com/webhooks/deal-stage",
        events: ["deal.stage_changed", "deal.won", "deal.lost"],
        isActive: true,
        secret: "whsec_abc123def456",
        lastTriggered: "2024-06-24T10:15:00Z",
        successCount: 89,
        failureCount: 2,
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2 }
      },
      {
        id: "webhook-2",
        name: "New Contact Created",
        url: "https://marketing-automation.com/hooks/contact",
        events: ["contact.created", "contact.updated"],
        isActive: true,
        secret: "whsec_xyz789uvw123",
        lastTriggered: "2024-06-24T09:30:00Z",
        successCount: 156,
        failureCount: 0,
        retryPolicy: { maxRetries: 5, backoffMultiplier: 1.5 }
      }
    ])
  });

  const createIntegrationMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/integrations", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      setIsCreateIntegrationOpen(false);
      resetIntegrationForm();
      toast({
        title: "Integration Created",
        description: "New integration has been configured successfully.",
      });
    }
  });

  const createAPIEndpointMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/api-endpoints", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-endpoints"] });
      setIsCreateAPIOpen(false);
      resetAPIForm();
      toast({
        title: "API Endpoint Created",
        description: "New API endpoint has been configured successfully.",
      });
    }
  });

  const resetIntegrationForm = () => {
    setIntegrationFormData({
      name: "",
      type: "api",
      provider: "",
      category: "",
      description: ""
    });
  };

  const resetAPIForm = () => {
    setApiFormData({
      name: "",
      method: "GET",
      endpoint: "",
      description: "",
      authentication: "api_key"
    });
  };

  const resetWebhookForm = () => {
    setWebhookFormData({
      name: "",
      url: "",
      events: "",
      secret: ""
    });
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      active: CheckCircle,
      inactive: XCircle,
      error: AlertTriangle,
      configuring: Clock
    };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: "text-green-600 bg-green-100",
      inactive: "text-gray-600 bg-gray-100",
      error: "text-red-600 bg-red-100",
      configuring: "text-yellow-600 bg-yellow-100"
    };
    return colors[status as keyof typeof colors] || "text-gray-600 bg-gray-100";
  };

  const getMethodColor = (method: string) => {
    const colors = {
      GET: "text-green-600 bg-green-100",
      POST: "text-blue-600 bg-blue-100",
      PUT: "text-yellow-600 bg-yellow-100",
      DELETE: "text-red-600 bg-red-100",
      PATCH: "text-purple-600 bg-purple-100"
    };
    return colors[method as keyof typeof colors] || "text-gray-600 bg-gray-100";
  };

  const totalRecords = integrations.reduce((sum, int) => sum + int.recordsProcessed, 0);
  const totalErrors = integrations.reduce((sum, int) => sum + int.errorCount, 0);
  const activeIntegrations = integrations.filter(int => int.status === 'active').length;
  const errorRate = totalRecords > 0 ? ((totalErrors / totalRecords) * 100).toFixed(2) : "0";

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Advanced Integrations</h1>
            <p className="text-gray-600 mt-1">Enterprise-grade API management and integration platform</p>
          </div>
          <div className="flex items-center space-x-3">
            <Dialog open={isCreateWebhookOpen} onOpenChange={setIsCreateWebhookOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={resetWebhookForm}>
                  <Webhook className="mr-2 h-4 w-4" />
                  Create Webhook
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Webhook</DialogTitle>
                  <DialogDescription>Configure webhook for real-time event notifications</DialogDescription>
                </DialogHeader>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhookName">Webhook Name</Label>
                    <Input
                      id="webhookName"
                      value={webhookFormData.name}
                      onChange={(e) => setWebhookFormData({ ...webhookFormData, name: e.target.value })}
                      placeholder="Deal Stage Notifications"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">Endpoint URL</Label>
                    <Input
                      id="webhookUrl"
                      value={webhookFormData.url}
                      onChange={(e) => setWebhookFormData({ ...webhookFormData, url: e.target.value })}
                      placeholder="https://your-app.com/webhooks/deals"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhookEvents">Events (comma-separated)</Label>
                    <Input
                      id="webhookEvents"
                      value={webhookFormData.events}
                      onChange={(e) => setWebhookFormData({ ...webhookFormData, events: e.target.value })}
                      placeholder="deal.created, deal.updated, deal.closed"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateWebhookOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Webhook</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateAPIOpen} onOpenChange={setIsCreateAPIOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={resetAPIForm}>
                  <Code className="mr-2 h-4 w-4" />
                  Create API
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create API Endpoint</DialogTitle>
                  <DialogDescription>Define a new API endpoint for external access</DialogDescription>
                </DialogHeader>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiName">Endpoint Name</Label>
                    <Input
                      id="apiName"
                      value={apiFormData.name}
                      onChange={(e) => setApiFormData({ ...apiFormData, name: e.target.value })}
                      placeholder="Get Customer Data"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="apiMethod">HTTP Method</Label>
                      <Select value={apiFormData.method} onValueChange={(value) => setApiFormData({ ...apiFormData, method: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                          <SelectItem value="PATCH">PATCH</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apiAuth">Authentication</Label>
                      <Select value={apiFormData.authentication} onValueChange={(value) => setApiFormData({ ...apiFormData, authentication: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="api_key">API Key</SelectItem>
                          <SelectItem value="oauth">OAuth 2.0</SelectItem>
                          <SelectItem value="bearer">Bearer Token</SelectItem>
                          <SelectItem value="basic">Basic Auth</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiEndpoint">Endpoint Path</Label>
                    <Input
                      id="apiEndpoint"
                      value={apiFormData.endpoint}
                      onChange={(e) => setApiFormData({ ...apiFormData, endpoint: e.target.value })}
                      placeholder="/api/v1/customers"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateAPIOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Endpoint</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateIntegrationOpen} onOpenChange={setIsCreateIntegrationOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetIntegrationForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Integration
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Integration</DialogTitle>
                  <DialogDescription>Connect with external services and platforms</DialogDescription>
                </DialogHeader>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="intName">Integration Name</Label>
                    <Input
                      id="intName"
                      value={integrationFormData.name}
                      onChange={(e) => setIntegrationFormData({ ...integrationFormData, name: e.target.value })}
                      placeholder="Salesforce CRM Sync"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="intType">Type</Label>
                      <Select value={integrationFormData.type} onValueChange={(value) => setIntegrationFormData({ ...integrationFormData, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="api">REST API</SelectItem>
                          <SelectItem value="webhook">Webhook</SelectItem>
                          <SelectItem value="oauth">OAuth 2.0</SelectItem>
                          <SelectItem value="database">Database</SelectItem>
                          <SelectItem value="saas">SaaS Platform</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="intCategory">Category</Label>
                      <Select value={integrationFormData.category} onValueChange={(value) => setIntegrationFormData({ ...integrationFormData, category: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CRM">CRM</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Communication">Communication</SelectItem>
                          <SelectItem value="Analytics">Analytics</SelectItem>
                          <SelectItem value="Support">Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="intProvider">Provider</Label>
                    <Input
                      id="intProvider"
                      value={integrationFormData.provider}
                      onChange={(e) => setIntegrationFormData({ ...integrationFormData, provider: e.target.value })}
                      placeholder="Salesforce, HubSpot, Stripe, etc."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="intDescription">Description</Label>
                    <Textarea
                      id="intDescription"
                      value={integrationFormData.description}
                      onChange={(e) => setIntegrationFormData({ ...integrationFormData, description: e.target.value })}
                      placeholder="What does this integration do?"
                      rows={3}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateIntegrationOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Integration</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="api-endpoints">API Endpoints</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
                  <Link className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeIntegrations}</div>
                  <p className="text-xs text-muted-foreground">
                    {integrations.length} total integrations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Records Processed</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalRecords.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(100 - parseFloat(errorRate)).toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {totalErrors} errors total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">API Endpoints</CardTitle>
                  <Code className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{apiEndpoints.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {apiEndpoints.filter(api => api.isActive).length} active endpoints
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Integration Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Integration Categories</CardTitle>
                <CardDescription>Overview of connected services by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {['CRM', 'Marketing', 'Finance', 'Communication', 'Analytics', 'Support'].map((category) => {
                    const count = integrations.filter(int => int.category === category).length;
                    const icons = {
                      CRM: Users,
                      Marketing: Mail,
                      Finance: DollarSign,
                      Communication: MessageSquare,
                      Analytics: BarChart3,
                      Support: Shield
                    };
                    const Icon = icons[category as keyof typeof icons];
                    return (
                      <div key={category} className="text-center p-4 border rounded-lg">
                        <Icon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                        <p className="font-medium">{category}</p>
                        <p className="text-2xl font-bold text-blue-600">{count}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Integration Activity</CardTitle>
                <CardDescription>Latest sync and event activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrations
                    .sort((a, b) => new Date(b.lastSync).getTime() - new Date(a.lastSync).getTime())
                    .slice(0, 5)
                    .map((integration) => (
                      <div key={integration.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${getStatusColor(integration.status)}`}>
                            {getStatusIcon(integration.status)({ className: "h-4 w-4" })}
                          </div>
                          <div>
                            <p className="font-medium">{integration.name}</p>
                            <p className="text-sm text-gray-600">{integration.provider}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{integration.recordsProcessed} records</p>
                          <p className="text-xs text-gray-500">
                            {new Date(integration.lastSync).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Integrations</CardTitle>
                <CardDescription>Manage your external service connections</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Integration</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Flow</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Last Sync</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {integrations.map((integration) => (
                      <TableRow key={integration.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{integration.name}</p>
                            <p className="text-sm text-gray-600">{integration.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{integration.provider}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{integration.type.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className={`p-1 rounded ${getStatusColor(integration.status)}`}>
                              {getStatusIcon(integration.status)({ className: "h-3 w-3" })}
                            </div>
                            <span className="text-sm capitalize">{integration.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {integration.dataFlow}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{integration.recordsProcessed.toLocaleString()}</p>
                            {integration.errorCount > 0 && (
                              <p className="text-xs text-red-600">{integration.errorCount} errors</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{new Date(integration.lastSync).toLocaleString()}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
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

          <TabsContent value="api-endpoints" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
                <CardDescription>Manage external API access to your CRM data</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Authentication</TableHead>
                      <TableHead>Rate Limits</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiEndpoints.map((endpoint) => (
                      <TableRow key={endpoint.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{endpoint.name}</p>
                            <p className="text-sm text-gray-600 font-mono">{endpoint.endpoint}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getMethodColor(endpoint.method)}>
                            {endpoint.method}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Key className="h-4 w-4 text-gray-400" />
                            <span className="text-sm capitalize">{endpoint.authentication}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {endpoint.rateLimits.requests}/{endpoint.rateLimits.period}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{endpoint.usage}</p>
                            <p className="text-xs text-gray-500">calls this month</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch checked={endpoint.isActive} />
                            <span className="text-sm">{endpoint.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
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

          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Webhooks</CardTitle>
                <CardDescription>Real-time event notifications to external systems</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Webhook</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Last Triggered</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhooks.map((webhook) => (
                      <TableRow key={webhook.id}>
                        <TableCell>
                          <p className="font-medium">{webhook.name}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-mono text-gray-600">{webhook.url}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {webhook.events.slice(0, 2).map((event) => (
                              <Badge key={event} variant="outline" className="text-xs">
                                {event}
                              </Badge>
                            ))}
                            {webhook.events.length > 2 && (
                              <span className="text-xs text-gray-500">+{webhook.events.length - 2}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {webhook.successCount + webhook.failureCount > 0
                                ? Math.round((webhook.successCount / (webhook.successCount + webhook.failureCount)) * 100)
                                : 100}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {webhook.successCount} / {webhook.successCount + webhook.failureCount}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{new Date(webhook.lastTriggered).toLocaleString()}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch checked={webhook.isActive} />
                            <span className="text-sm">{webhook.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
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

          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Monitoring</CardTitle>
                <CardDescription>Real-time health and performance monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Advanced Monitoring Dashboard</h3>
                  <p>Real-time performance metrics, error tracking, and alerts coming soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}