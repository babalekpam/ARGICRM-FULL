import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  Download, 
  Star, 
  Users, 
  Zap, 
  Settings, 
  Search,
  Filter,
  TrendingUp,
  Shield,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Globe,
  Webhook,
  Code,
  Puzzle,
  Plus,
  ExternalLink,
  Play,
  Pause,
  Trash2
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  provider: string;
  logo: string;
  rating: number;
  reviews: number;
  downloads: number;
  price: 'free' | 'paid' | 'freemium';
  status: 'available' | 'installed' | 'premium';
  features: string[];
  permissions: string[];
  version: string;
  lastUpdated: string;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  lastTriggered: string;
  successRate: number;
}

const FEATURED_INTEGRATIONS: Integration[] = [
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect with 5,000+ apps and automate workflows without code',
    category: 'automation',
    provider: 'Zapier',
    logo: '/api/placeholder/40/40',
    rating: 4.8,
    reviews: 15420,
    downloads: 2847592,
    price: 'freemium',
    status: 'available',
    features: ['5000+ app connections', 'Multi-step workflows', 'Advanced filters', 'Team collaboration'],
    permissions: ['Read contacts', 'Manage deals', 'Create tasks', 'Access webhooks'],
    version: '3.2.1',
    lastUpdated: '2024-01-15'
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    description: 'Visual automation platform for complex business processes',
    category: 'automation',
    provider: 'Make',
    logo: '/api/placeholder/40/40',
    rating: 4.6,
    reviews: 8934,
    downloads: 1234567,
    price: 'freemium',
    status: 'installed',
    features: ['Visual workflow builder', 'API connections', 'Data transformation', 'Error handling'],
    permissions: ['Full CRM access', 'Webhook management', 'Data export'],
    version: '2.8.4',
    lastUpdated: '2024-01-10'
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing and automation platform integration',
    category: 'marketing',
    provider: 'Mailchimp',
    logo: '/api/placeholder/40/40',
    rating: 4.5,
    reviews: 12847,
    downloads: 3456789,
    price: 'free',
    status: 'available',
    features: ['Email campaigns', 'Audience sync', 'Analytics tracking', 'A/B testing'],
    permissions: ['Contact synchronization', 'Campaign management', 'Analytics access'],
    version: '4.1.2',
    lastUpdated: '2024-01-12'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication and collaboration integration',
    category: 'communication',
    provider: 'Slack',
    logo: '/api/placeholder/40/40',
    rating: 4.7,
    reviews: 23456,
    downloads: 5678901,
    price: 'free',
    status: 'installed',
    features: ['Real-time notifications', 'Channel integration', 'File sharing', 'Bot commands'],
    permissions: ['Send messages', 'Create channels', 'File uploads'],
    version: '1.9.8',
    lastUpdated: '2024-01-08'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing and subscription management',
    category: 'payments',
    provider: 'Stripe',
    logo: '/api/placeholder/40/40',
    rating: 4.9,
    reviews: 34567,
    downloads: 7890123,
    price: 'free',
    status: 'available',
    features: ['Payment processing', 'Subscription billing', 'Invoice automation', 'Financial reporting'],
    permissions: ['Payment data access', 'Customer billing', 'Transaction history'],
    version: '5.3.7',
    lastUpdated: '2024-01-14'
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Accounting and financial management integration',
    category: 'finance',
    provider: 'Intuit',
    logo: '/api/placeholder/40/40',
    rating: 4.4,
    reviews: 9876,
    downloads: 2345678,
    price: 'paid',
    status: 'premium',
    features: ['Invoice sync', 'Expense tracking', 'Financial reporting', 'Tax preparation'],
    permissions: ['Financial data access', 'Invoice management', 'Expense recording'],
    version: '3.7.2',
    lastUpdated: '2024-01-11'
  }
];

const WEBHOOK_CONFIGS: WebhookConfig[] = [
  {
    id: 'lead-webhook',
    name: 'New Lead Notifications',
    url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/',
    events: ['lead.created', 'lead.updated'],
    status: 'active',
    lastTriggered: '2 hours ago',
    successRate: 98.5
  },
  {
    id: 'deal-webhook',
    name: 'Deal Stage Changes',
    url: 'https://hooks.slack.com/services/T123/B456/xyz789',
    events: ['deal.stage_changed', 'deal.won', 'deal.lost'],
    status: 'active',
    lastTriggered: '15 minutes ago',
    successRate: 99.2
  },
  {
    id: 'customer-webhook',
    name: 'Customer Activity Sync',
    url: 'https://api.mailchimp.com/webhooks/customer-sync',
    events: ['customer.created', 'customer.updated', 'customer.deleted'],
    status: 'inactive',
    lastTriggered: '3 days ago',
    successRate: 85.7
  }
];

export default function MarketplaceIntegrations() {
  const [activeTab, setActiveTab] = useState("marketplace");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Install integration mutation
  const installIntegrationMutation = useMutation({
    mutationFn: (integrationId: string) => 
      fetch("/api/integrations/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId })
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Integration Installed",
        description: "The integration has been successfully installed and configured.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Installation Failed",
        description: error.message || "Failed to install integration",
        variant: "destructive",
      });
    }
  });

  // Create webhook mutation
  const createWebhookMutation = useMutation({
    mutationFn: (webhookData: any) => 
      fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookData)
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Webhook Created",
        description: "Your webhook has been created and is ready to receive events.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
    }
  });

  const filteredIntegrations = FEATURED_INTEGRATIONS.filter(integration => {
    const matchesSearch = !searchQuery || 
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const IntegrationCard = ({ integration }: { integration: Integration }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={integration.logo} />
              <AvatarFallback>{integration.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <CardDescription className="text-sm">by {integration.provider}</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {integration.status === 'installed' && (
              <Badge variant="default" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Installed
              </Badge>
            )}
            {integration.status === 'premium' && (
              <Badge variant="secondary">Premium</Badge>
            )}
            {integration.price === 'free' && (
              <Badge variant="outline">Free</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{integration.description}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>{integration.rating}</span>
              <span>({integration.reviews.toLocaleString()})</span>
            </div>
            <div className="flex items-center space-x-1">
              <Download className="h-4 w-4" />
              <span>{integration.downloads.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-medium mb-2">Key Features</h5>
            <div className="flex flex-wrap gap-1">
              {integration.features.slice(0, 3).map(feature => (
                <Badge key={feature} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
              {integration.features.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{integration.features.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            {integration.status === 'installed' ? (
              <>
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="sm" 
                  onClick={() => installIntegrationMutation.mutate(integration.id)}
                  disabled={installIntegrationMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install
                </Button>
                <Button size="sm" variant="outline">
                  Learn More
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const WebhookCard = ({ webhook }: { webhook: WebhookConfig }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{webhook.name}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant={webhook.status === 'active' ? 'default' : 'secondary'}>
              {webhook.status}
            </Badge>
            <Badge variant="outline">{webhook.successRate}% success</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h5 className="text-sm font-medium mb-1">Endpoint URL</h5>
            <code className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block truncate">
              {webhook.url}
            </code>
          </div>

          <div>
            <h5 className="text-sm font-medium mb-2">Events</h5>
            <div className="flex flex-wrap gap-1">
              {webhook.events.map(event => (
                <Badge key={event} variant="outline" className="text-xs">
                  {event}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Last triggered: {webhook.lastTriggered}</span>
          </div>

          <div className="flex space-x-2 pt-2">
            <Button size="sm" variant="outline">
              {webhook.status === 'active' ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Activate
                </>
              )}
            </Button>
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button size="sm" variant="outline">
              <Trash2 className="h-4 w-4" />
            </Button>
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
            <h1 className="text-3xl font-bold">Marketplace & Integrations</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Connect with 500+ apps and services to extend your CRM capabilities
            </p>
          </div>
          <div className="flex space-x-2">
            <Button>
              <Code className="h-4 w-4 mr-2" />
              API Documentation
            </Button>
            <Button variant="outline">
              <Webhook className="h-4 w-4 mr-2" />
              Create Webhook
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="installed">Installed</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="api">API Platform</TabsTrigger>
            <TabsTrigger value="developers">Developers</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search integrations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Categories</option>
                <option value="automation">Automation</option>
                <option value="marketing">Marketing</option>
                <option value="communication">Communication</option>
                <option value="payments">Payments</option>
                <option value="finance">Finance</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <div className="text-2xl font-bold">500+</div>
                  <p className="text-sm text-gray-600">Available Integrations</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Download className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <div className="text-2xl font-bold">2.8M+</div>
                  <p className="text-sm text-gray-600">Total Downloads</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Star className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                  <div className="text-2xl font-bold">4.7/5</div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Shield className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <div className="text-2xl font-bold">100%</div>
                  <p className="text-sm text-gray-600">Security Verified</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIntegrations.map(integration => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="installed" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Installed Integrations</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Manage and configure your active integrations
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURED_INTEGRATIONS.filter(i => i.status === 'installed').map(integration => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Webhook Management</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Configure real-time data synchronization with external services
                </p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Webhook
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {WEBHOOK_CONFIGS.map(webhook => (
                <WebhookCard key={webhook.id} webhook={webhook} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">API Platform</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Build custom integrations with our comprehensive REST API
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>Manage your API access credentials</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Production Key</div>
                        <div className="text-sm text-gray-600">pk_live_***********</div>
                      </div>
                      <Button size="sm" variant="outline">Regenerate</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Test Key</div>
                        <div className="text-sm text-gray-600">pk_test_***********</div>
                      </div>
                      <Button size="sm" variant="outline">Regenerate</Button>
                    </div>
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Key
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Usage</CardTitle>
                  <CardDescription>Monitor your API consumption</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>This Month</span>
                        <span>75,234 / 100,000 calls</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">99.9%</div>
                        <div className="text-xs text-gray-600">Uptime</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">145ms</div>
                        <div className="text-xs text-gray-600">Avg Response</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Documentation</CardTitle>
                  <CardDescription>API guides and references</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Code className="h-4 w-4 mr-2" />
                      API Reference
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Globe className="h-4 w-4 mr-2" />
                      Getting Started
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Puzzle className="h-4 w-4 mr-2" />
                      Code Examples
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Postman Collection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="developers" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Developer Resources</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Tools and resources for building on our platform
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>SDK Downloads</CardTitle>
                  <CardDescription>Official software development kits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">JavaScript SDK</div>
                        <div className="text-sm text-gray-600">npm install @nodecrm/sdk</div>
                      </div>
                      <Button size="sm">Download</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">Python SDK</div>
                        <div className="text-sm text-gray-600">pip install nodecrm-python</div>
                      </div>
                      <Button size="sm">Download</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">PHP SDK</div>
                        <div className="text-sm text-gray-600">composer require nodecrm/php-sdk</div>
                      </div>
                      <Button size="sm">Download</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Partner Program</CardTitle>
                  <CardDescription>Join our integration partner ecosystem</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">200+</div>
                        <div className="text-xs text-gray-600">Partners</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">$50K</div>
                        <div className="text-xs text-gray-600">Avg Revenue</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">30%</div>
                        <div className="text-xs text-gray-600">Commission</div>
                      </div>
                    </div>
                    <Button className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      Join Partner Program
                    </Button>
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