import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Workflow, 
  Zap, 
  Plus, 
  Play, 
  Pause, 
  Save, 
  Copy, 
  Trash2, 
  Settings,
  ArrowRight,
  Mail,
  Phone,
  Calendar,
  Users,
  Target,
  Database,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from "lucide-react";

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay';
  title: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[];
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  isActive: boolean;
  timesUsed: number;
  successRate: number;
}

const TRIGGER_TYPES = [
  { value: 'lead_created', label: 'New Lead Created', icon: Users },
  { value: 'deal_updated', label: 'Deal Stage Changed', icon: Target },
  { value: 'email_opened', label: 'Email Opened', icon: Mail },
  { value: 'form_submitted', label: 'Form Submitted', icon: Database },
  { value: 'website_visit', label: 'Website Visit', icon: BarChart3 },
  { value: 'support_ticket', label: 'Support Ticket Created', icon: MessageSquare },
  { value: 'inactivity', label: 'Customer Inactivity', icon: Clock },
  { value: 'high_value', label: 'High-Value Opportunity', icon: Target }
];

const ACTION_TYPES = [
  { value: 'send_email', label: 'Send Email', icon: Mail },
  { value: 'create_task', label: 'Create Task', icon: CheckCircle },
  { value: 'schedule_call', label: 'Schedule Call', icon: Phone },
  { value: 'update_deal', label: 'Update Deal', icon: Target },
  { value: 'assign_owner', label: 'Assign Owner', icon: Users },
  { value: 'send_sms', label: 'Send SMS', icon: MessageSquare },
  { value: 'create_meeting', label: 'Create Meeting', icon: Calendar },
  { value: 'escalate', label: 'Escalate to Manager', icon: AlertTriangle },
  { value: 'ai_outreach', label: 'AI Personalized Outreach', icon: Zap }
];

export default function NoCodeWorkflowBuilder() {
  const [activeTab, setActiveTab] = useState("builder");
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch workflow templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/workflow-templates"],
    enabled: activeTab === "templates"
  });

  // Fetch active workflows
  const { data: activeWorkflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ["/api/active-workflows"],
    enabled: activeTab === "active"
  });

  // Create workflow mutation
  const createWorkflowMutation = useMutation({
    mutationFn: (workflowData: any) => 
      fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflowData)
      }).then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Workflow Created",
        description: "Your workflow has been successfully created and activated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/active-workflows"] });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create workflow",
        variant: "destructive",
      });
    }
  });

  const addNode = (type: WorkflowNode['type']) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      title: `New ${type}`,
      config: {},
      position: { x: 100 + workflowNodes.length * 200, y: 100 },
      connections: []
    };
    setWorkflowNodes([...workflowNodes, newNode]);
  };

  const updateNodeConfig = (nodeId: string, config: Record<string, any>) => {
    setWorkflowNodes(nodes => 
      nodes.map(node => 
        node.id === nodeId ? { ...node, config: { ...node.config, ...config } } : node
      )
    );
  };

  const removeNode = (nodeId: string) => {
    setWorkflowNodes(nodes => nodes.filter(node => node.id !== nodeId));
  };

  const saveWorkflow = () => {
    if (workflowNodes.length === 0) {
      toast({
        title: "No Workflow to Save",
        description: "Please add some nodes to your workflow first.",
        variant: "destructive",
      });
      return;
    }

    const workflowData = {
      name: `Custom Workflow ${Date.now()}`,
      nodes: workflowNodes,
      isActive: true,
      category: 'custom'
    };

    createWorkflowMutation.mutate(workflowData);
  };

  const WorkflowCanvas = () => (
    <div className="min-h-[600px] bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 relative overflow-auto">
      {workflowNodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <Workflow className="h-16 w-16 mb-4" />
          <h3 className="text-lg font-medium mb-2">Start Building Your Workflow</h3>
          <p className="text-sm text-center mb-4">Drag and drop nodes to create automated workflows</p>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => addNode('trigger')} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Trigger
            </Button>
            <Button onClick={() => addNode('action')} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Action
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {workflowNodes.map((node, index) => (
            <div key={node.id} className="flex items-center space-x-4">
              <NodeEditor 
                node={node} 
                onUpdate={(config) => updateNodeConfig(node.id, config)}
                onRemove={() => removeNode(node.id)}
              />
              {index < workflowNodes.length - 1 && (
                <ArrowRight className="h-6 w-6 text-gray-400" />
              )}
            </div>
          ))}
          <div className="flex justify-center">
            <Button onClick={() => addNode('action')} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Next Step
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const NodeEditor = ({ node, onUpdate, onRemove }: {
    node: WorkflowNode;
    onUpdate: (config: Record<string, any>) => void;
    onRemove: () => void;
  }) => (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {node.type === 'trigger' && <Zap className="h-4 w-4" />}
            {node.type === 'action' && <Settings className="h-4 w-4" />}
            {node.type === 'condition' && <AlertTriangle className="h-4 w-4" />}
            {node.type === 'delay' && <Clock className="h-4 w-4" />}
            <CardTitle className="text-sm">{node.title}</CardTitle>
          </div>
          <Button onClick={onRemove} variant="ghost" size="sm">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {node.type === 'trigger' && (
          <div className="space-y-2">
            <Label>Trigger Type</Label>
            <Select onValueChange={(value) => onUpdate({ triggerType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select trigger..." />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_TYPES.map(trigger => (
                  <SelectItem key={trigger.value} value={trigger.value}>
                    {trigger.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {node.type === 'action' && (
          <div className="space-y-2">
            <Label>Action Type</Label>
            <Select onValueChange={(value) => onUpdate({ actionType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select action..." />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map(action => (
                  <SelectItem key={action.value} value={action.value}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {node.config.actionType === 'send_email' && (
              <div className="space-y-2">
                <Input 
                  placeholder="Email subject..." 
                  onChange={(e) => onUpdate({ emailSubject: e.target.value })}
                />
                <Textarea 
                  placeholder="Email content..." 
                  onChange={(e) => onUpdate({ emailContent: e.target.value })}
                />
              </div>
            )}

            {node.config.actionType === 'create_task' && (
              <div className="space-y-2">
                <Input 
                  placeholder="Task title..." 
                  onChange={(e) => onUpdate({ taskTitle: e.target.value })}
                />
                <Select onValueChange={(value) => onUpdate({ priority: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {node.type === 'delay' && (
          <div className="space-y-2">
            <Label>Delay Duration</Label>
            <div className="flex space-x-2">
              <Input 
                type="number" 
                placeholder="Amount"
                onChange={(e) => onUpdate({ delayAmount: parseInt(e.target.value) })}
              />
              <Select onValueChange={(value) => onUpdate({ delayUnit: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const PrebuiltTemplates = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        {
          id: 'lead-nurture',
          name: 'Lead Nurturing Sequence',
          description: 'Automated email sequence for new leads',
          category: 'Sales',
          steps: 5,
          successRate: 68
        },
        {
          id: 'deal-progression',
          name: 'Deal Progression Alerts',
          description: 'Notify team when deals stagnate',
          category: 'Sales',
          steps: 3,
          successRate: 84
        },
        {
          id: 'customer-onboarding',
          name: 'Customer Onboarding',
          description: 'Welcome new customers with tasks and emails',
          category: 'Customer Success',
          steps: 7,
          successRate: 92
        },
        {
          id: 'support-escalation',
          name: 'Support Ticket Escalation',
          description: 'Auto-escalate high-priority tickets',
          category: 'Support',
          steps: 4,
          successRate: 96
        },
        {
          id: 'renewal-reminders',
          name: 'Contract Renewal Reminders',
          description: 'Automated renewal notifications',
          category: 'Account Management',
          steps: 6,
          successRate: 78
        },
        {
          id: 'inactive-reengagement',
          name: 'Inactive Customer Re-engagement',
          description: 'Win back inactive customers',
          category: 'Marketing',
          steps: 4,
          successRate: 45
        }
      ].map(template => (
        <Card key={template.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <Badge variant="outline">{template.category}</Badge>
            </div>
            <CardDescription>{template.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
              <span>{template.steps} steps</span>
              <span className="text-green-600">{template.successRate}% success rate</span>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Use Template
              </Button>
              <Button size="sm" variant="outline">
                Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">No-Code Workflow Builder</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create powerful automation workflows without writing code
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={saveWorkflow} disabled={createWorkflowMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save Workflow
            </Button>
            <Button onClick={() => setIsPreviewMode(!isPreviewMode)} variant="outline">
              <Play className="h-4 w-4 mr-2" />
              {isPreviewMode ? 'Edit Mode' : 'Preview Mode'}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="builder">Workflow Builder</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="active">Active Workflows</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Visual Workflow Designer</h2>
              <div className="flex space-x-2">
                <Button onClick={() => addNode('trigger')} variant="outline" size="sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Add Trigger
                </Button>
                <Button onClick={() => addNode('condition')} variant="outline" size="sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
                <Button onClick={() => addNode('action')} variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Add Action
                </Button>
                <Button onClick={() => addNode('delay')} variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Add Delay
                </Button>
              </div>
            </div>
            <WorkflowCanvas />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Pre-built Workflow Templates</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start with proven workflows and customize them for your needs
              </p>
            </div>
            <PrebuiltTemplates />
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Active Workflows</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Monitor and manage your running automation workflows
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Active workflows will be populated from API */}
              <Card>
                <CardHeader>
                  <CardTitle>Lead Follow-up Sequence</CardTitle>
                  <CardDescription>Automatically follows up with new leads</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-green-600">Active</Badge>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Pause className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Workflow Analytics</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Track performance and optimization opportunities
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Executions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">2,847</div>
                  <p className="text-sm text-gray-600">This month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">94.2%</div>
                  <p className="text-sm text-gray-600">Average across all workflows</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Time Saved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">156hrs</div>
                  <p className="text-sm text-gray-600">This month</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}