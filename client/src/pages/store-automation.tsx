import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Bot, 
  Zap, 
  TrendingUp, 
  Settings,
  Play,
  Pause,
  Plus,
  Trash2,
  BarChart3,
  Clock,
  DollarSign,
  Users,
  Package,
  Mail,
  Bell,
  Star,
  Target,
  Lightbulb,
  TestTube,
  Activity
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AutomationRule {
  id: string;
  tenantId: string;
  name: string;
  category: 'inventory' | 'pricing' | 'marketing' | 'customer_service' | 'orders' | 'analytics';
  trigger: {
    type: string;
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: string;
    parameters: Record<string, any>;
    delay?: number;
  }>;
  enabled: boolean;
  schedule?: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    time?: string;
    days?: string[];
  };
  aiConfig?: {
    personalityType: 'professional' | 'friendly' | 'casual' | 'luxury';
    responseStyle: 'concise' | 'detailed' | 'conversational';
    brandVoice: string;
  };
  performance: {
    timesTriggered: number;
    successRate: number;
    lastTriggered?: Date;
    avgResponseTime: number;
    revenueImpact: number;
  };
}

export default function StoreAutomation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newRule, setNewRule] = useState({
    name: '',
    category: 'inventory',
    triggerType: 'low_stock',
    actionType: 'notification',
    enabled: true
  });

  // Fetch automation rules
  const { data: rules = [], isLoading: rulesLoading, error: rulesError } = useQuery({
    queryKey: ['/api/automation/rules'],
    queryFn: () => apiRequest('GET', '/api/automation/rules', undefined, {
      'x-tenant-id': 'platform-tenant',
      'x-auth-email': 'abel@argilette.com',
      'authorization': 'Bearer demo-token'
    }),
    retry: false
  });

  // Fetch automation insights
  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/automation/insights'],
    queryFn: () => apiRequest('GET', '/api/automation/insights', undefined, {
      'x-tenant-id': 'platform-tenant',
      'x-auth-email': 'abel@argilette.com',
      'authorization': 'Bearer demo-token'
    })
  });

  // Fetch smart suggestions
  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ['/api/automation/suggestions'],
    queryFn: () => apiRequest('GET', '/api/automation/suggestions', undefined, {
      'x-tenant-id': 'platform-tenant',
      'x-auth-email': 'abel@argilette.com',
      'authorization': 'Bearer demo-token'
    })
  });

  // Fetch rule templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/automation/templates'],
    queryFn: () => apiRequest('GET', '/api/automation/templates', undefined, {
      'x-tenant-id': 'platform-tenant',
      'x-auth-email': 'abel@argilette.com',
      'authorization': 'Bearer demo-token'
    })
  });

  // Create automation rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (ruleData: any) => {
      return await apiRequest('POST', '/api/automation/rules', ruleData, {
        'x-tenant-id': 'platform-tenant',
        'x-auth-email': 'abel@argilette.com',
        'authorization': 'Bearer demo-token'
      });
    },
    onSuccess: () => {
      toast({ title: "Automation Rule Created", description: "Your automation rule is now active" });
      queryClient.invalidateQueries({ queryKey: ['/api/automation/rules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/automation/insights'] });
      setNewRule({ name: '', category: 'inventory', triggerType: 'low_stock', actionType: 'notification', enabled: true });
    },
    onError: (error: any) => {
      toast({
        title: "Rule Creation Failed",
        description: error.message || "Failed to create automation rule",
        variant: "destructive",
      });
    }
  });

  // Toggle rule mutation
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) => {
      return await apiRequest('PATCH', `/api/automation/rules/${ruleId}/toggle`, { enabled }, {
        'x-tenant-id': 'platform-tenant',
        'x-auth-email': 'abel@argilette.com',
        'authorization': 'Bearer demo-token'
      });
    },
    onSuccess: (_, { enabled }) => {
      toast({ 
        title: enabled ? "Rule Enabled" : "Rule Disabled", 
        description: `Automation rule ${enabled ? 'activated' : 'deactivated'} successfully` 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/automation/rules'] });
    }
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      return await apiRequest('DELETE', `/api/automation/rules/${ruleId}`, undefined, {
        'x-tenant-id': 'platform-tenant',
        'x-auth-email': 'abel@argilette.com',
        'authorization': 'Bearer demo-token'
      });
    },
    onSuccess: () => {
      toast({ title: "Rule Deleted", description: "Automation rule removed successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/automation/rules'] });
      queryClient.invalidateQueries({ queryKey: ['/api/automation/insights'] });
    }
  });

  // Test rule mutation
  const testRuleMutation = useMutation({
    mutationFn: async ({ ruleId, testData }: { ruleId: string; testData: any }) => {
      return await apiRequest('POST', `/api/automation/rules/${ruleId}/test`, testData, {
        'x-tenant-id': 'platform-tenant',
        'x-auth-email': 'abel@argilette.com',
        'authorization': 'Bearer demo-token'
      });
    },
    onSuccess: (result) => {
      toast({ 
        title: "Test Completed", 
        description: `Rule test ${result.success ? 'passed' : 'failed'}: ${result.output}` 
      });
    }
  });

  const handleCreateRule = () => {
    if (!newRule.name) {
      toast({ title: "Name Required", description: "Please enter a rule name", variant: "destructive" });
      return;
    }

    const ruleData = {
      name: newRule.name,
      category: newRule.category,
      trigger: {
        type: newRule.triggerType,
        conditions: {}
      },
      actions: [{
        type: newRule.actionType,
        parameters: {}
      }],
      enabled: newRule.enabled
    };

    createRuleMutation.mutate(ruleData);
  };

  const handleToggleRule = (ruleId: string, enabled: boolean) => {
    toggleRuleMutation.mutate({ ruleId, enabled });
  };

  const handleDeleteRule = (ruleId: string) => {
    deleteRuleMutation.mutate(ruleId);
  };

  const handleTestRule = (ruleId: string) => {
    const testData = { testMode: true, mockData: { productName: 'Test Product', stock: 5 } };
    testRuleMutation.mutate({ ruleId, testData });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'inventory': return <Package className="h-4 w-4" />;
      case 'pricing': return <DollarSign className="h-4 w-4" />;
      case 'marketing': return <Mail className="h-4 w-4" />;
      case 'customer_service': return <Users className="h-4 w-4" />;
      case 'orders': return <Activity className="h-4 w-4" />;
      case 'analytics': return <BarChart3 className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'inventory': return 'bg-blue-100 text-blue-800';
      case 'pricing': return 'bg-green-100 text-green-800';
      case 'marketing': return 'bg-purple-100 text-purple-800';
      case 'customer_service': return 'bg-orange-100 text-orange-800';
      case 'orders': return 'bg-red-100 text-red-800';
      case 'analytics': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (rulesLoading || insightsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            Store Automation
          </h1>
          <p className="text-muted-foreground mt-1">
            Automate your store operations with intelligent workflows
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Automation Rule</DialogTitle>
              <DialogDescription>
                Set up a new automation rule for your store
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ruleName">Rule Name</Label>
                <Input
                  id="ruleName"
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Low Stock Alert"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newRule.category} onValueChange={(value) => setNewRule(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="pricing">Pricing</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="customer_service">Customer Service</SelectItem>
                    <SelectItem value="orders">Orders</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="trigger">Trigger Type</Label>
                <Select value={newRule.triggerType} onValueChange={(value) => setNewRule(prev => ({ ...prev, triggerType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="high_demand">High Demand</SelectItem>
                    <SelectItem value="abandoned_cart">Abandoned Cart</SelectItem>
                    <SelectItem value="new_order">New Order</SelectItem>
                    <SelectItem value="customer_review">Customer Review</SelectItem>
                    <SelectItem value="price_change">Price Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="action">Action Type</Label>
                <Select value={newRule.actionType} onValueChange={(value) => setNewRule(prev => ({ ...prev, actionType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notification">Send Notification</SelectItem>
                    <SelectItem value="send_email">Send Email</SelectItem>
                    <SelectItem value="adjust_price">Adjust Price</SelectItem>
                    <SelectItem value="create_coupon">Create Coupon</SelectItem>
                    <SelectItem value="update_inventory">Update Inventory</SelectItem>
                    <SelectItem value="ai_response">AI Response</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={newRule.enabled}
                  onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, enabled: checked }))}
                />
                <Label htmlFor="enabled">Enable immediately</Label>
              </div>
              <Button 
                onClick={handleCreateRule} 
                className="w-full"
                disabled={createRuleMutation.isPending}
              >
                {createRuleMutation.isPending ? 'Creating...' : 'Create Rule'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Rules</p>
                <p className="text-2xl font-bold">{insights.totalRules || 0}</p>
              </div>
              <Bot className="h-8 w-8 text-blue-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold">{insights.activeRules || 0}</p>
              </div>
              <Zap className="h-8 w-8 text-green-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{Math.round(insights.successRate || 0)}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue Impact</p>
                <p className="text-2xl font-bold">${(insights.revenueGenerated || 0).toFixed(0)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Automation Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Active Automation Rules
              </CardTitle>
              <CardDescription>
                Manage your store automation rules and monitor their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No automation rules yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first automation rule to start automating your store operations
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>Create Your First Rule</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create Automation Rule</DialogTitle>
                        <DialogDescription>
                          Set up a new automation rule for your store
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="ruleName">Rule Name</Label>
                          <Input
                            id="ruleName"
                            value={newRule.name}
                            onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Low Stock Alert"
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select value={newRule.category} onValueChange={(value) => setNewRule(prev => ({ ...prev, category: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="inventory">Inventory</SelectItem>
                              <SelectItem value="pricing">Pricing</SelectItem>
                              <SelectItem value="marketing">Marketing</SelectItem>
                              <SelectItem value="customer_service">Customer Service</SelectItem>
                              <SelectItem value="orders">Orders</SelectItem>
                              <SelectItem value="analytics">Analytics</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button 
                          onClick={handleCreateRule} 
                          className="w-full"
                          disabled={createRuleMutation.isPending}
                        >
                          {createRuleMutation.isPending ? 'Creating...' : 'Create Rule'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="space-y-4">
                  {rules.map((rule: AutomationRule) => (
                    <div key={rule.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${getCategoryColor(rule.category)}`}>
                            {getCategoryIcon(rule.category)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{rule.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {rule.trigger.type} → {rule.actions.map(a => a.type).join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={rule.enabled ? "default" : "secondary"}>
                            {rule.enabled ? "Active" : "Inactive"}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleTestRule(rule.id)}
                              disabled={testRuleMutation.isPending}
                            >
                              <TestTube className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleRule(rule.id, !rule.enabled)}
                              disabled={toggleRuleMutation.isPending}
                            >
                              {rule.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteRule(rule.id)}
                              disabled={deleteRuleMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Triggered:</span>
                          <span className="ml-1 font-medium">{rule.performance.timesTriggered || 0} times</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Success Rate:</span>
                          <span className="ml-1 font-medium">{Math.round(rule.performance.successRate || 0)}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Revenue Impact:</span>
                          <span className="ml-1 font-medium">${(rule.performance.revenueImpact || 0).toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Automation Templates
              </CardTitle>
              <CardDescription>
                Quick-start templates for common automation scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((template: any) => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${getCategoryColor(template.category)}`}>
                        {getCategoryIcon(template.category)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                        <p className="text-xs text-green-600 mt-2">
                          {template.estimatedImpact}
                        </p>
                        <Button 
                          size="sm" 
                          className="mt-3"
                          onClick={() => {
                            setNewRule({
                              name: template.name,
                              category: template.category,
                              triggerType: template.trigger.type,
                              actionType: template.actions[0]?.type || 'notification',
                              enabled: true
                            });
                          }}
                        >
                          Use Template
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Suggestions Tab */}
        <TabsContent value="suggestions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                AI-Powered Suggestions
              </CardTitle>
              <CardDescription>
                Intelligent automation recommendations based on your store data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No AI suggestions available</h3>
                  <p className="text-muted-foreground">
                    AI suggestions will appear here based on your store activity and performance data
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion: any) => (
                    <div key={suggestion.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-100 to-blue-100">
                            <Lightbulb className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{suggestion.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {suggestion.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs">
                              <span className="text-green-600">
                                +{suggestion.estimatedImpact.revenueIncrease}% revenue
                              </span>
                              <span className="text-blue-600">
                                {suggestion.estimatedImpact.timesSaved}h saved/week
                              </span>
                              <span className="text-purple-600">
                                {suggestion.complexity} complexity
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm">
                          Implement
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Automation Analytics
              </CardTitle>
              <CardDescription>
                Detailed performance metrics and insights for your automation rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights && insights.totalRules > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Executions</span>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-2xl font-bold mt-2">{insights.totalTriggers || 0}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Average Success Rate</span>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-2xl font-bold mt-2">{Math.round(insights.successRate || 0)}%</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Revenue Impact</span>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-2xl font-bold mt-2">${(insights.revenueGenerated || 0).toFixed(0)}</p>
                    </div>
                  </div>

                  {insights.topPerformingRules && insights.topPerformingRules.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-4">Top Performing Rules</h3>
                      <div className="space-y-3">
                        {insights.topPerformingRules.map((rule: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${getCategoryColor(rule.category)}`}>
                                {getCategoryIcon(rule.category)}
                              </div>
                              <div>
                                <p className="font-medium">{rule.ruleName}</p>
                                <p className="text-sm text-muted-foreground capitalize">{rule.category}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{Math.round(rule.successRate)}% success</p>
                              <p className="text-sm text-muted-foreground">${rule.revenueImpact.toFixed(0)} impact</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {insights.recommendations && insights.recommendations.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-4">Optimization Recommendations</h3>
                      <div className="space-y-3">
                        {insights.recommendations.map((rec: any, index: number) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{rec.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                                <p className="text-sm text-green-600 mt-2">{rec.expectedImpact}</p>
                              </div>
                              <Badge variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}>
                                {rec.priority}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No analytics data yet</h3>
                  <p className="text-muted-foreground">
                    Create and run automation rules to see detailed analytics and performance metrics
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}