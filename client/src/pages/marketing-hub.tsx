import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Zap, Link, CheckCircle, Globe, Share2, BarChart3, ShoppingCart, Users, Mail, Video, Camera, Edit3, Cloud, RefreshCw, ExternalLink, Brain, Cpu, TrendingUp, AlertTriangle, Crown } from "lucide-react";
import { SiFacebook, SiInstagram, SiLinkedin, SiYoutube, SiGoogle, SiSalesforce, SiHubspot, SiMailchimp, SiAmazon, SiAdobe, SiCanva, SiShopify, SiGithub, SiSlack, SiZoom, SiDropbox, SiNotion, SiTrello, SiAsana } from "react-icons/si";

interface Integration {
  id: string;
  name: string;
  category: string;
  icon: React.ComponentType;
  description: string;
  status: 'connected' | 'available' | 'premium';
  features: string[];
  apiEndpoint?: string;
}

const integrations: Integration[] = [
  // Social Media Platforms
  { id: 'facebook', name: 'Facebook', category: 'social', icon: SiFacebook, description: 'Manage Facebook Pages, create posts, track engagement', status: 'available', features: ['Post Scheduling', 'Analytics', 'Lead Generation', 'Audience Insights'] },
  { id: 'instagram', name: 'Instagram', category: 'social', icon: SiInstagram, description: 'Instagram Business account management and content creation', status: 'available', features: ['Story Scheduling', 'Reels Management', 'Hashtag Analytics', 'Influencer Tracking'] },
  { id: 'linkedin', name: 'LinkedIn', category: 'social', icon: SiLinkedin, description: 'Professional networking and B2B marketing', status: 'connected', features: ['Company Page Management', 'Lead Generation', 'Sales Navigator', 'Content Publishing'] },
  { id: 'twitter', name: 'Twitter/X', category: 'social', icon: Share2, description: 'Real-time engagement and brand monitoring', status: 'available', features: ['Tweet Scheduling', 'Thread Management', 'Trend Analysis', 'Customer Support'] },
  { id: 'tiktok', name: 'TikTok', category: 'social', icon: Video, description: 'Short-form video content and viral marketing', status: 'premium', features: ['Video Scheduling', 'Trend Analytics', 'Creator Partnerships', 'Ad Management'] },
  { id: 'youtube', name: 'YouTube', category: 'social', icon: SiYoutube, description: 'Video marketing and channel management', status: 'available', features: ['Video Upload', 'Analytics Dashboard', 'Community Management', 'Monetization Tracking'] },
  { id: 'pinterest', name: 'Pinterest', category: 'social', icon: Camera, description: 'Visual discovery and e-commerce integration', status: 'available', features: ['Pin Scheduling', 'Board Management', 'Shopping Integration', 'Seasonal Trends'] },
  { id: 'snapchat', name: 'Snapchat', category: 'social', icon: Camera, description: 'Ephemeral content and AR advertising', status: 'premium', features: ['Snap Ads', 'Lens Studio', 'Geofilters', 'Audience Insights'] },
  { id: 'reddit', name: 'Reddit', category: 'social', icon: Users, description: 'Community engagement and discussion monitoring', status: 'available', features: ['Subreddit Monitoring', 'Post Scheduling', 'Comment Management', 'Sentiment Analysis'] },

  // Business & CRM Tools
  { id: 'salesforce', name: 'Salesforce', category: 'crm', icon: SiSalesforce, description: 'Advanced CRM integration and data synchronization', status: 'premium', features: ['Contact Sync', 'Lead Transfer', 'Opportunity Management', 'Custom Fields'] },
  { id: 'hubspot', name: 'HubSpot', category: 'crm', icon: SiHubspot, description: 'Inbound marketing and sales automation', status: 'available', features: ['Contact Import', 'Email Templates', 'Workflow Automation', 'Lead Scoring'] },
  { id: 'mailchimp', name: 'Mailchimp', category: 'email', icon: SiMailchimp, description: 'Email marketing campaigns and automation', status: 'connected', features: ['List Management', 'Campaign Creation', 'A/B Testing', 'Analytics'] },

  // Cloud Platforms
  { id: 'aws', name: 'Amazon AWS', category: 'cloud', icon: SiAmazon, description: 'Cloud infrastructure and data storage', status: 'premium', features: ['S3 Storage', 'Lambda Functions', 'RDS Integration', 'CloudWatch Monitoring'] },
  { id: 'googlecloud', name: 'Google Cloud', category: 'cloud', icon: SiGoogle, description: 'AI/ML services and data analytics', status: 'available', features: ['BigQuery Analytics', 'AI Platform', 'Storage Solutions', 'Compute Engine'] },
  { id: 'azure', name: 'Microsoft Azure', category: 'cloud', icon: Cloud, description: 'Enterprise cloud solutions', status: 'premium', features: ['Active Directory', 'Cognitive Services', 'DevOps Integration', 'Security Center'] },

  // Design & Content Creation
  { id: 'adobe', name: 'Adobe Creative', category: 'design', icon: SiAdobe, description: 'Professional design tools integration', status: 'premium', features: ['Photoshop API', 'Illustrator Integration', 'Stock Photos', 'Brand Assets'] },
  { id: 'canva', name: 'Canva', category: 'design', icon: SiCanva, description: 'Easy graphic design and template creation', status: 'available', features: ['Template Library', 'Brand Kit', 'Team Collaboration', 'Auto-resize'] },

  // E-commerce Platforms
  { id: 'shopify', name: 'Shopify', category: 'ecommerce', icon: SiShopify, description: 'E-commerce store integration and management', status: 'available', features: ['Product Sync', 'Order Management', 'Customer Data', 'Inventory Tracking'] },
  { id: 'amazon', name: 'Amazon Seller', category: 'ecommerce', icon: SiAmazon, description: 'Amazon marketplace management', status: 'premium', features: ['Product Listings', 'Order Fulfillment', 'Advertising', 'Analytics'] },

  // Analytics & Monitoring
  { id: 'googleanalytics', name: 'Google Analytics', category: 'analytics', icon: SiGoogle, description: 'Website traffic and behavior analysis', status: 'connected', features: ['Traffic Reports', 'Conversion Tracking', 'Audience Insights', 'Custom Dashboards'] },
  { id: 'googletag', name: 'Google Workspace', category: 'productivity', icon: SiGoogle, description: 'Productivity suite integration', status: 'available', features: ['Gmail Integration', 'Calendar Sync', 'Drive Storage', 'Docs Collaboration'] },

  // Communication Tools
  { id: 'slack', name: 'Slack', category: 'communication', icon: SiSlack, description: 'Team communication and notifications', status: 'available', features: ['Channel Integration', 'Bot Commands', 'File Sharing', 'Workflow Automation'] },
  { id: 'zoom', name: 'Zoom', category: 'communication', icon: SiZoom, description: 'Video conferencing and webinars', status: 'available', features: ['Meeting Scheduling', 'Webinar Management', 'Recording Integration', 'Contact Sync'] },
  { id: 'whatsapp', name: 'WhatsApp Business', category: 'messaging', icon: Mail, description: 'Direct customer messaging', status: 'premium', features: ['Business API', 'Template Messages', 'Customer Support', 'Broadcast Lists'] },
  { id: 'telegram', name: 'Telegram', category: 'messaging', icon: Mail, description: 'Secure messaging and bot integration', status: 'available', features: ['Bot Commands', 'Channel Management', 'Group Administration', 'File Sharing'] },

  // Project Management
  { id: 'notion', name: 'Notion', category: 'productivity', icon: SiNotion, description: 'All-in-one workspace integration', status: 'available', features: ['Database Sync', 'Content Management', 'Team Collaboration', 'Template Library'] },
  { id: 'trello', name: 'Trello', category: 'productivity', icon: SiTrello, description: 'Visual project management', status: 'available', features: ['Board Integration', 'Card Automation', 'Team Collaboration', 'Progress Tracking'] },
  { id: 'asana', name: 'Asana', category: 'productivity', icon: SiAsana, description: 'Work management and team coordination', status: 'available', features: ['Task Management', 'Project Tracking', 'Team Collaboration', 'Goal Setting'] }
];

const categories = [
  { id: 'all', name: 'All Platforms', icon: Globe },
  { id: 'social', name: 'Social Media', icon: Share2 },
  { id: 'crm', name: 'CRM & Sales', icon: Users },
  { id: 'email', name: 'Email Marketing', icon: Mail },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  { id: 'ecommerce', name: 'E-commerce', icon: ShoppingCart },
  { id: 'design', name: 'Design & Content', icon: Camera },
  { id: 'cloud', name: 'Cloud Services', icon: Cloud },
  { id: 'communication', name: 'Communication', icon: Video },
  { id: 'productivity', name: 'Productivity', icon: Edit3 }
];

export default function MarketingHub() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConnected, setShowConnected] = useState(false);
  const [connectionDialog, setConnectionDialog] = useState({ open: false, integration: null });
  const [configDialog, setConfigDialog] = useState({ open: false, integration: null });
  const [connectionsState, setConnectionsState] = useState(integrations.reduce((acc, integration) => {
    // Platform owner gets all integrations as connected
    const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('user_email');
    const isPlatformOwner = userEmail === 'abel@argilette.com';
    
    acc[integration.id] = isPlatformOwner ? 'connected' : integration.status;
    return acc;
  }, {}));
  const { toast } = useToast();

  // Fetch AI usage data for hybrid approach
  const { data: aiUsage, refetch: refetchAI } = useQuery({
    queryKey: ['/api/ai/usage'],
    queryFn: () => apiRequest('/api/ai/usage'),
  });

  // Fetch AI failover status for QWEN integration
  const { data: aiFailoverStatus, refetch: refetchFailoverStatus } = useQuery({
    queryKey: ['/api/ai-failover/status'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Initialize AI for new users
  const initializeAI = async (tier = 'trial') => {
    try {
      await apiRequest('/api/ai/initialize', {
        method: 'POST',
        body: { subscriptionTier: tier }
      });
      refetchAI();
      toast({
        title: "AI Features Activated",
        description: `Your ${tier} AI integrations are now active with automatic limits.`,
        variant: "default"
      });
    } catch (error) {
      console.error('AI initialization failed:', error);
    }
  };

  const filteredIntegrations = integrations.filter(integration => {
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !showConnected || integration.status === 'connected';
    
    return matchesCategory && matchesSearch && matchesStatus;
  });

  const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('user_email');
  const isPlatformOwner = userEmail === 'abel@argilette.com';
  
  const connectedCount = isPlatformOwner ? integrations.length : integrations.filter(i => i.status === 'connected').length;
  const availableCount = isPlatformOwner ? 0 : integrations.filter(i => i.status === 'available').length;
  const premiumCount = isPlatformOwner ? 0 : integrations.filter(i => i.status === 'premium').length;

  const handleConnect = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration) return;

    if (integration.status === 'premium') {
      toast({
        title: "Premium Feature",
        description: `${integration.name} integration requires a premium subscription. Contact support to upgrade.`,
        variant: "default"
      });
      return;
    }

    setConnectionDialog({ open: true, integration });
  };

  const handleActualConnect = async (integrationId: string, credentials: any) => {
    try {
      const response = await apiRequest(`/api/integrations/connect/${integrationId}`, {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      if (response.success) {
        setConnectionsState(prev => ({ ...prev, [integrationId]: 'connected' }));
        setConnectionDialog({ open: false, integration: null });
        toast({
          title: "Successfully Connected",
          description: `${integrations.find(i => i.id === integrationId)?.name} has been connected to your CRM.`,
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to the platform. Please check your credentials and try again.",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      const response = await apiRequest(`/api/integrations/${integrationId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        setConnectionsState(prev => ({ ...prev, [integrationId]: 'available' }));
        toast({
          title: "Successfully Disconnected",
          description: `${integrations.find(i => i.id === integrationId)?.name} has been disconnected.`,
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect from the platform. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleConfigure = (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    setConfigDialog({ open: true, integration });
  };

  const handleSync = async (integrationId: string) => {
    try {
      const response = await apiRequest('POST', `/api/integrations/${integrationId}/sync`);
      const data = await response.json();

      if (data.success) {
        toast({
          title: "Sync Successful",
          description: `Successfully synced ${integrations.find(i => i.id === integrationId)?.name} data. ${data.message || 'Sync completed successfully.'}`,
          variant: "default"
        });
      } else {
        throw new Error(data.message || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: `Failed to sync ${integrations.find(i => i.id === integrationId)?.name} data. Please try again.`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 md:space-y-8">
      {/* Professional header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Share2 className="h-8 w-8 text-violet-600" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Marketing Hub
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Connect to all major platforms and create a unified marketing ecosystem
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-violet-100 text-violet-800 border-violet-200">
              <div className="w-2 h-2 bg-violet-500 rounded-full mr-2 animate-pulse"></div>
              25+ Integrations
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              AI-Powered
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
              Real-time Sync
            </Badge>
          </div>
        </div>
        
        {/* Professional status badges */}
        <div className="flex flex-wrap justify-center md:justify-end gap-2 md:space-x-3">
          <Badge variant="outline" className="px-3 py-2 bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
            {connectedCount} Connected
          </Badge>
          <Badge variant="outline" className="px-3 py-2 bg-blue-50 text-blue-700 border-blue-200">
            <Zap className="w-4 h-4 mr-2 text-blue-600" />
            {availableCount} Available
          </Badge>
          <Badge variant="outline" className="px-3 py-2 bg-purple-50 text-purple-700 border-purple-200">
            <Crown className="w-4 h-4 mr-2 text-purple-600" />
            {premiumCount} Premium
          </Badge>
        </div>
      </div>

      {/* AI Integration Status - Hybrid Approach */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle className="text-lg">AI-Powered Marketing</CardTitle>
                <CardDescription className="text-sm">
                  {aiUsage?.subscriptionTier === 'trial' ? 'Trial AI Features Active' : 
                   aiUsage?.subscriptionTier === 'enterprise' || aiUsage?.subscriptionTier === 'ultimate' ? 'Enterprise AI Unlimited' :
                   'Professional AI Features'}
                </CardDescription>
              </div>
            </div>
            <Badge variant={aiUsage?.usage ? "default" : "outline"} className="px-3 py-1">
              <Cpu className="w-3 h-3 mr-1" />
              {aiUsage?.usage ? `${Object.keys(aiUsage.usage).length} AI Services` : 'Activate AI'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Failover Status */}
          {aiFailoverStatus && (
            <div className="border rounded-lg p-3 bg-white/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center text-sm">
                  <Cpu className="w-4 h-4 mr-2 text-blue-600" />
                  AI Failover System
                </h4>
                <Badge variant="default" className="text-xs">
                  {Object.keys(aiFailoverStatus.providers).length} Active Providers
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(aiFailoverStatus.providers).map(([key, provider]) => {
                  const circuitBreaker = aiFailoverStatus.circuitBreakers[key];
                  const isAvailable = provider.isAvailable && !circuitBreaker?.isOpen;
                  return (
                    <div key={key} className="text-center p-2 rounded border bg-muted/30">
                      <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${
                        isAvailable ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div className="text-xs font-medium">{provider.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(provider.averageResponseTime)}ms avg
                      </div>
                      {key === 'qwen' && isAvailable && (
                        <Badge variant="outline" className="text-xs mt-1">
                          QWEN Ready
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {aiUsage?.usage && Object.keys(aiUsage.usage).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(aiUsage.usage).map(([provider, stats]) => (
                <div key={provider} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium capitalize">{provider} AI</Label>
                    <span className="text-xs text-muted-foreground">
                      {stats.limit === -1 ? 'Unlimited' : `${stats.used}/${stats.limit}`}
                    </span>
                  </div>
                  <Progress 
                    value={stats.percentage} 
                    className="h-2" 
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className={stats.provider === 'custom' ? 'text-green-600' : 'text-blue-600'}>
                      {stats.provider === 'custom' ? 'Custom Keys' : 'Platform Provided'}
                    </span>
                    {stats.percentage > 80 && (
                      <span className="text-amber-600 flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        High Usage
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-blue-100 rounded-full">
                    <Brain className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Activate AI Marketing Features</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get instant access to AI-powered content generation, sentiment analysis, and automation
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button onClick={() => initializeAI('trial')} size="sm" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Start Trial (50 requests/month)
                  </Button>
                  <Button onClick={() => initializeAI('professional')} variant="outline" size="sm" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Professional (1000 requests/month)
                  </Button>
                  <Button onClick={() => initializeAI('enterprise')} variant="outline" size="sm" className="text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Enterprise (Unlimited)
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* QWEN AI Activation Section */}
          <div className="border rounded-lg p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold flex items-center text-sm">
                <Brain className="w-4 h-4 mr-2 text-purple-600" />
                QWEN AI Integration
              </h4>
              <Badge variant={aiFailoverStatus?.providers?.qwen ? "default" : "outline"} className="text-xs">
                {aiFailoverStatus?.providers?.qwen ? "Active" : "Available"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Alibaba Cloud's QWEN AI provides enhanced multilingual capabilities with intelligent failover.
            </p>
            {aiFailoverStatus?.providers?.qwen ? (
              <div className="flex items-center text-xs text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                QWEN AI active in failover rotation
              </div>
            ) : (
              <div className="flex items-center text-xs text-blue-600">
                <Zap className="w-3 h-3 mr-1" />
                Ready for activation with API key
              </div>
            )}
          </div>

          {aiUsage?.recommendations && aiUsage.recommendations.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">AI Recommendations</h4>
              <div className="space-y-2">
                {aiUsage.recommendations.slice(0, 2).map((rec, index) => (
                  <div key={index} className="text-xs p-2 bg-amber-50 border border-amber-200 rounded">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-amber-800">{rec.suggestion}</p>
                        <p className="text-amber-700 mt-1">{rec.action}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile-first quick filters */}
      <div className="block md:hidden">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Quick Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Search platforms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <div className="flex items-center space-x-2">
              <Switch
                checked={showConnected}
                onCheckedChange={setShowConnected}
              />
              <Label className="text-sm">Connected only</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="text-xs h-8"
                >
                  <category.icon className="w-3 h-3 mr-1" />
                  {category.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search">Search Platforms</Label>
              <Input
                id="search"
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="connected-only"
                checked={showConnected}
                onCheckedChange={setShowConnected}
              />
              <Label htmlFor="connected-only" className="text-sm">
                Show connected only
              </Label>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Categories</Label>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <category.icon className="w-4 h-4 mr-2" />
                  {category.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {filteredIntegrations.map((integration) => {
              const IconComponent = integration.icon;
              return (
                <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="p-3 rounded-lg bg-muted flex-shrink-0">
                          <IconComponent className="w-6 h-6 md:w-7 md:h-7" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base md:text-lg truncate">{integration.name}</CardTitle>
                          <Badge 
                            variant={
                              connectionsState[integration.id] === 'connected' ? 'default' :
                              connectionsState[integration.id] === 'premium' ? 'secondary' : 'outline'
                            }
                            className="text-xs mt-1"
                          >
                            {connectionsState[integration.id]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-sm leading-relaxed">
                      {integration.description}
                    </CardDescription>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        KEY FEATURES
                      </Label>
                      <div className="flex flex-wrap gap-1">
                        {integration.features.slice(0, 2).map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {integration.features.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{integration.features.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Mobile-optimized buttons */}
                    <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                      {connectionsState[integration.id] === 'connected' ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleConfigure(integration.id)}
                            className="w-full md:w-auto text-xs py-2"
                          >
                            <Settings className="w-3 h-3 mr-1" />
                            Configure
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleSync(integration.id)}
                            className="w-full md:w-auto text-xs py-2"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Sync
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDisconnect(integration.id)}
                            className="w-full md:w-auto text-xs py-2"
                          >
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button 
                          size="default"
                          onClick={() => handleConnect(integration.id)}
                          disabled={connectionsState[integration.id] === 'premium'}
                          className="w-full py-3 text-sm font-medium"
                        >
                          <Link className="w-4 h-4 mr-2" />
                          {connectionsState[integration.id] === 'premium' ? 'Upgrade Required' : 'Connect Now'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredIntegrations.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <CardTitle className="mb-2">No integrations found</CardTitle>
                <CardDescription>
                  Try adjusting your search or filter criteria
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Mobile-optimized Connection Dialog */}
      <Dialog open={connectionDialog.open} onOpenChange={(open) => setConnectionDialog({ open, integration: null })}>
        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Connect to {connectionDialog.integration?.name}</DialogTitle>
            <DialogDescription className="text-sm">
              Enter your credentials to connect {connectionDialog.integration?.name} to your CRM
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="api-key" className="text-sm font-medium">API Key</Label>
              <Input
                id="api-key"
                placeholder="Enter your API key"
                type="password"
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret" className="text-sm font-medium">Secret (if required)</Label>
              <Input
                id="secret"
                placeholder="Enter secret key"
                type="password"
                className="h-12 text-base"
              />
            </div>
            <div className="flex flex-col-reverse md:flex-row justify-end space-y-2 space-y-reverse md:space-y-0 md:space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setConnectionDialog({ open: false, integration: null })}
                className="w-full md:w-auto h-12 md:h-10"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  const apiKey = (document.getElementById('api-key') as HTMLInputElement)?.value;
                  const secret = (document.getElementById('secret') as HTMLInputElement)?.value;
                  if (connectionDialog.integration) {
                    handleActualConnect(connectionDialog.integration.id, { apiKey, secret });
                  }
                }}
                className="w-full md:w-auto h-12 md:h-10"
              >
                Connect Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile-optimized Configuration Dialog */}
      <Dialog open={configDialog.open} onOpenChange={(open) => setConfigDialog({ open, integration: null })}>
        <DialogContent className="w-[95vw] max-w-[500px] mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Configure {configDialog.integration?.name}</DialogTitle>
            <DialogDescription className="text-sm">
              Manage your {configDialog.integration?.name} integration settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sync Frequency</Label>
                <select className="w-full h-12 p-3 border rounded-md text-base">
                  <option>Every 15 minutes</option>
                  <option>Every hour</option>
                  <option>Every 6 hours</option>
                  <option>Daily</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data Fields</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" id="contacts" defaultChecked className="w-4 h-4" />
                    <Label htmlFor="contacts" className="text-sm">Contacts</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" id="campaigns" defaultChecked className="w-4 h-4" />
                    <Label htmlFor="campaigns" className="text-sm">Campaigns</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input type="checkbox" id="analytics" className="w-4 h-4" />
                    <Label htmlFor="analytics" className="text-sm">Analytics</Label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse md:flex-row justify-end space-y-2 space-y-reverse md:space-y-0 md:space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setConfigDialog({ open: false, integration: null })}
                className="w-full md:w-auto h-12 md:h-10"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setConfigDialog({ open: false, integration: null });
                  toast({
                    title: "Settings Updated",
                    description: `${configDialog.integration?.name} configuration has been saved.`,
                    variant: "default"
                  });
                }}
                className="w-full md:w-auto h-12 md:h-10"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}