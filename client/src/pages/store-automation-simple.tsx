import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

// Import advanced automation components
import { PerformanceVisualization } from '@/components/automation/PerformanceVisualization';
import { AITemplateGenerator } from '@/components/automation/AITemplateGenerator';
import { WorkflowBuilder } from '@/components/automation/WorkflowBuilder';
import { ImpactDashboard } from '@/components/automation/ImpactDashboard';
import { AICoaching } from '@/components/automation/AICoaching';

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
  Sparkles,
  Workflow,
  Activity,
  Brain,
  TestTube
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function StoreAutomation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    category: 'inventory',
    triggerType: 'low_stock',
    actionType: 'notification',
    enabled: true
  });

  // Fetch automation rules
  const { data: rulesResponse, isLoading: rulesLoading } = useQuery({
    queryKey: ['/api/automation/rules'],
    retry: false
  });

  const rules = rulesResponse?.rules || [];

  // Create automation rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (ruleData: any) => {
      return await apiRequest('POST', '/api/automation/rules', ruleData);
    },
    onSuccess: (response: any) => {
      toast({ 
        title: "Automation Rule Created", 
        description: response?.message || "Your automation rule is now active" 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/automation/rules'] });
      setIsCreateDialogOpen(false);
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

  const handleCreateRule = () => {
    if (!newRule.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a rule name",
        variant: "destructive",
      });
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

  // Handler functions for advanced features
  const handleTemplateCreated = (template: any) => {
    toast({
      title: "Template Created",
      description: `Successfully created automation template: ${template.name}`,
    });
    queryClient.invalidateQueries({ queryKey: ["/api/automation/rules"] });
  };

  const handleWorkflowCreated = (workflow: any) => {
    toast({
      title: "Workflow Created",
      description: `Successfully created workflow: ${workflow.name}`,
    });
    queryClient.invalidateQueries({ queryKey: ["/api/automation/rules"] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Store Automation</h1>
          <p className="text-muted-foreground mt-2">
            Automate your e-commerce operations with AI-powered rules and workflows
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Automation Rule</DialogTitle>
              <DialogDescription>
                Set up a new automation rule to streamline your store operations
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Low Stock Alert"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={newRule.category} onValueChange={(value) => setNewRule({ ...newRule, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="customer_service">Customer Service</SelectItem>
                    <SelectItem value="pricing">Pricing</SelectItem>
                    <SelectItem value="orders">Orders</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="trigger">Trigger Type</Label>
                <Select value={newRule.triggerType} onValueChange={(value) => setNewRule({ ...newRule, triggerType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="price_change">Price Change</SelectItem>
                    <SelectItem value="new_order">New Order</SelectItem>
                    <SelectItem value="customer_inactive">Customer Inactive</SelectItem>
                    <SelectItem value="high_demand">High Demand</SelectItem>
                    <SelectItem value="review_received">Review Received</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="action">Action Type</Label>
                <Select value={newRule.actionType} onValueChange={(value) => setNewRule({ ...newRule, actionType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notification">Send Notification</SelectItem>
                    <SelectItem value="email">Send Email</SelectItem>
                    <SelectItem value="reorder">Auto Reorder</SelectItem>
                    <SelectItem value="price_update">Update Pricing</SelectItem>
                    <SelectItem value="campaign_create">Create Campaign</SelectItem>
                    <SelectItem value="assign_agent">Assign Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={newRule.enabled}
                  onCheckedChange={(checked) => setNewRule({ ...newRule, enabled: checked })}
                />
                <Label htmlFor="enabled">Enable rule immediately</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateRule}
                disabled={createRuleMutation.isPending}
              >
                {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Automated</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+18% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45hrs</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,340</div>
            <p className="text-xs text-muted-foreground">+12% increase</p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Automation Features */}
      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Templates
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <Workflow className="h-4 w-4" />
            Workflow Builder
          </TabsTrigger>
          <TabsTrigger value="impact" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Impact Dashboard
          </TabsTrigger>
          <TabsTrigger value="coaching" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Coach
          </TabsTrigger>
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
              {rulesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading automation rules...</p>
                </div>
              ) : rules && rules.length > 0 ? (
                <div className="space-y-4">
                  {rules.map((rule: any) => (
                    <div key={rule.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{rule.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={rule.enabled ? "default" : "secondary"}>
                            {rule.enabled ? "Active" : "Inactive"}
                          </Badge>
                          <Switch checked={rule.enabled} />
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        <Badge variant="outline" className="mr-2">
                          {rule.category?.replace('_', ' ') || 'General'}
                        </Badge>
                        Trigger: {rule.trigger?.type?.replace('_', ' ') || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Actions: {rule.actions?.map((action: any) => action.type).join(', ') || 'None'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No automation rules yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first automation rule to start automating your store operations
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>Create Your First Rule</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Analytics Tab */}
        <TabsContent value="performance" className="space-y-6">
          <PerformanceVisualization 
            automationMetrics={{ rules: rules || [], performance: { totalExecutions: 1234, successRate: 96.8, timeSaved: 45 } }}
            insights={{ trends: [], recommendations: [] }}
          />
        </TabsContent>

        {/* AI Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <AITemplateGenerator onTemplateCreated={handleTemplateCreated} />
        </TabsContent>

        {/* Workflow Builder Tab */}
        <TabsContent value="workflow" className="space-y-6">
          <WorkflowBuilder onWorkflowCreated={handleWorkflowCreated} />
        </TabsContent>

        {/* Impact Dashboard Tab */}
        <TabsContent value="impact" className="space-y-6">
          <ImpactDashboard automationRules={rules || []} />
        </TabsContent>

        {/* AI Coaching Tab */}
        <TabsContent value="coaching" className="space-y-6">
          <AICoaching 
            automationData={{ rules: rules || [], performance: { totalExecutions: 1234, successRate: 96.8, timeSaved: 45 } }}
            businessMetrics={{ revenue: 2340, efficiency: 78, customerSatisfaction: 92 }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}