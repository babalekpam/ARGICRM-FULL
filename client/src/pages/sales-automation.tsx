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
  Play, 
  Pause, 
  Settings,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  Users,
  BarChart3,
  MessageSquare,
  Bell,
  Workflow
} from "lucide-react";

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'lead_created' | 'deal_stage_changed' | 'email_opened' | 'form_submitted' | 'time_based';
    conditions: string[];
  };
  actions: {
    type: 'send_email' | 'create_task' | 'update_field' | 'assign_owner' | 'send_sms' | 'schedule_call';
    details: Record<string, any>;
  }[];
  isActive: boolean;
  executionCount: number;
  successRate: number;
  createdAt: string;
  lastRun?: string;
}

interface AutomationSequence {
  id: string;
  name: string;
  description: string;
  steps: {
    id: string;
    order: number;
    type: 'email' | 'sms' | 'task' | 'wait' | 'condition';
    delay: number; // days
    content: string;
    conditions?: string[];
  }[];
  isActive: boolean;
  enrolledContacts: number;
  completionRate: number;
  createdAt: string;
}

export default function SalesAutomation() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [isCreateSequenceOpen, setIsCreateSequenceOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const queryClient = useQueryClient();

  const [ruleFormData, setRuleFormData] = useState({
    name: "",
    description: "",
    triggerType: "lead_created",
    actionType: "send_email",
    isActive: true
  });

  // Mock data for automation rules
  const { data: automationRules = [] } = useQuery({
    queryKey: ["/api/automation-rules"],
    queryFn: () => Promise.resolve([
      {
        id: "rule-1",
        name: "Welcome New Leads",
        description: "Send welcome email to new leads automatically",
        trigger: {
          type: "lead_created" as const,
          conditions: ["source != 'cold_call'"]
        },
        actions: [
          {
            type: "send_email" as const,
            details: {
              template: "welcome_lead",
              subject: "Welcome to ARGILETTE CRM",
              delay: 0
            }
          },
          {
            type: "create_task" as const,
            details: {
              title: "Follow up with new lead",
              assignedTo: "auto",
              dueDate: "+1 day"
            }
          }
        ],
        isActive: true,
        executionCount: 142,
        successRate: 94.2,
        createdAt: "2024-01-15T00:00:00Z",
        lastRun: "2024-06-24T10:30:00Z"
      },
      {
        id: "rule-2",
        name: "Deal Stage Progression",
        description: "Notify manager when deals move to negotiation stage",
        trigger: {
          type: "deal_stage_changed" as const,
          conditions: ["new_stage == 'negotiation'", "deal_value > 10000"]
        },
        actions: [
          {
            type: "send_email" as const,
            details: {
              template: "manager_notification",
              recipient: "manager",
              subject: "High-value deal in negotiation"
            }
          },
          {
            type: "update_field" as const,
            details: {
              field: "priority",
              value: "high"
            }
          }
        ],
        isActive: true,
        executionCount: 67,
        successRate: 98.5,
        createdAt: "2024-02-01T00:00:00Z",
        lastRun: "2024-06-23T15:45:00Z"
      },
      {
        id: "rule-3",
        name: "Email Engagement Follow-up",
        description: "Create follow-up task when email is opened",
        trigger: {
          type: "email_opened" as const,
          conditions: ["campaign_type == 'nurture'"]
        },
        actions: [
          {
            type: "create_task" as const,
            details: {
              title: "Follow up on email engagement",
              assignedTo: "original_sender",
              dueDate: "+2 days"
            }
          }
        ],
        isActive: false,
        executionCount: 23,
        successRate: 87.0,
        createdAt: "2024-03-10T00:00:00Z"
      }
    ])
  });

  // Mock data for automation sequences
  const { data: automationSequences = [] } = useQuery({
    queryKey: ["/api/automation-sequences"],
    queryFn: () => Promise.resolve([
      {
        id: "seq-1",
        name: "Lead Nurturing Campaign",
        description: "5-step email sequence for new leads",
        steps: [
          {
            id: "step-1",
            order: 1,
            type: "email" as const,
            delay: 0,
            content: "Welcome email with company introduction"
          },
          {
            id: "step-2",
            order: 2,
            type: "wait" as const,
            delay: 3,
            content: "Wait 3 days"
          },
          {
            id: "step-3",
            order: 3,
            type: "email" as const,
            delay: 0,
            content: "Educational content about our solutions"
          },
          {
            id: "step-4",
            order: 4,
            type: "task" as const,
            delay: 2,
            content: "Personal follow-up call"
          }
        ],
        isActive: true,
        enrolledContacts: 89,
        completionRate: 73.2,
        createdAt: "2024-01-20T00:00:00Z"
      },
      {
        id: "seq-2",
        name: "Customer Onboarding",
        description: "Welcome sequence for new customers",
        steps: [
          {
            id: "step-1",
            order: 1,
            type: "email" as const,
            delay: 0,
            content: "Welcome and next steps"
          },
          {
            id: "step-2",
            order: 2,
            type: "task" as const,
            delay: 1,
            content: "Schedule onboarding call"
          }
        ],
        isActive: true,
        enrolledContacts: 34,
        completionRate: 91.2,
        createdAt: "2024-02-15T00:00:00Z"
      }
    ])
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/automation-rules", {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation-rules"] });
      setIsCreateRuleOpen(false);
      resetRuleForm();
      toast({
        title: "Automation Rule Created",
        description: "New automation rule has been created successfully.",
      });
    }
  });

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest(`/api/automation-rules/${id}/toggle`, {
        method: "PUT",
        body: JSON.stringify({ isActive })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automation-rules"] });
      toast({
        title: "Rule Updated",
        description: "Automation rule status has been updated.",
      });
    }
  });

  const resetRuleForm = () => {
    setRuleFormData({
      name: "",
      description: "",
      triggerType: "lead_created",
      actionType: "send_email",
      isActive: true
    });
  };

  const handleRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRuleMutation.mutate(ruleFormData);
  };

  const getTriggerLabel = (type: string) => {
    const labels = {
      lead_created: "Lead Created",
      deal_stage_changed: "Deal Stage Changed",
      email_opened: "Email Opened",
      form_submitted: "Form Submitted",
      time_based: "Time-Based"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getActionIcon = (type: string) => {
    const icons = {
      send_email: Mail,
      create_task: CheckCircle,
      update_field: Edit,
      assign_owner: Users,
      send_sms: MessageSquare,
      schedule_call: Phone
    };
    const Icon = icons[type as keyof typeof icons] || Settings;
    return <Icon className="h-4 w-4" />;
  };

  const totalExecutions = automationRules.reduce((sum, rule) => sum + rule.executionCount, 0);
  const avgSuccessRate = automationRules.length > 0 
    ? automationRules.reduce((sum, rule) => sum + rule.successRate, 0) / automationRules.length
    : 0;
  const activeRules = automationRules.filter(rule => rule.isActive).length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Automation</h1>
            <p className="text-gray-600 mt-1">Automate your sales processes and workflows</p>
          </div>
          <div className="flex items-center space-x-3">
            <Dialog open={isCreateSequenceOpen} onOpenChange={setIsCreateSequenceOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Workflow className="mr-2 h-4 w-4" />
                  Create Sequence
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Automation Sequence</DialogTitle>
                  <DialogDescription>
                    Build multi-step automation workflows
                  </DialogDescription>
                </DialogHeader>
                <div className="text-center py-8 text-gray-500">
                  <p>Advanced sequence builder coming soon</p>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateRuleOpen} onOpenChange={setIsCreateRuleOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetRuleForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create Automation Rule</DialogTitle>
                  <DialogDescription>
                    Define triggers and actions for automatic execution
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRuleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Rule Name</Label>
                    <Input
                      id="name"
                      value={ruleFormData.name}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, name: e.target.value })}
                      placeholder="e.g., Welcome New Leads"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={ruleFormData.description}
                      onChange={(e) => setRuleFormData({ ...ruleFormData, description: e.target.value })}
                      placeholder="What does this rule do?"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="triggerType">Trigger</Label>
                    <Select 
                      value={ruleFormData.triggerType} 
                      onValueChange={(value) => setRuleFormData({ ...ruleFormData, triggerType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead_created">Lead Created</SelectItem>
                        <SelectItem value="deal_stage_changed">Deal Stage Changed</SelectItem>
                        <SelectItem value="email_opened">Email Opened</SelectItem>
                        <SelectItem value="form_submitted">Form Submitted</SelectItem>
                        <SelectItem value="time_based">Time-Based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actionType">Action</Label>
                    <Select 
                      value={ruleFormData.actionType} 
                      onValueChange={(value) => setRuleFormData({ ...ruleFormData, actionType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="send_email">Send Email</SelectItem>
                        <SelectItem value="create_task">Create Task</SelectItem>
                        <SelectItem value="update_field">Update Field</SelectItem>
                        <SelectItem value="assign_owner">Assign Owner</SelectItem>
                        <SelectItem value="send_sms">Send SMS</SelectItem>
                        <SelectItem value="schedule_call">Schedule Call</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={ruleFormData.isActive}
                      onCheckedChange={(checked) => setRuleFormData({ ...ruleFormData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Activate immediately</Label>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateRuleOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createRuleMutation.isPending}>
                      Create Rule
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rules">Automation Rules</TabsTrigger>
            <TabsTrigger value="sequences">Sequences</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeRules}</div>
                  <p className="text-xs text-muted-foreground">
                    {automationRules.length} total rules
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
                  <Play className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalExecutions.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgSuccessRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    Average across all rules
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">47h</div>
                  <p className="text-xs text-muted-foreground">
                    Estimated this month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Most Active Rules</CardTitle>
                  <CardDescription>Rules with highest execution count</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {automationRules
                      .sort((a, b) => b.executionCount - a.executionCount)
                      .slice(0, 3)
                      .map((rule) => (
                        <div key={rule.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{rule.name}</p>
                            <p className="text-sm text-gray-600">{getTriggerLabel(rule.trigger.type)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{rule.executionCount} runs</p>
                            <p className="text-sm text-gray-600">{rule.successRate}% success</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest automation executions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {automationRules
                      .filter(rule => rule.lastRun)
                      .sort((a, b) => new Date(b.lastRun!).getTime() - new Date(a.lastRun!).getTime())
                      .slice(0, 3)
                      .map((rule) => (
                        <div key={rule.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <div>
                              <p className="font-medium">{rule.name}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(rule.lastRun!).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-green-600">
                            Success
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automation Rules</CardTitle>
                <CardDescription>
                  Manage your automated workflows and triggers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Actions</TableHead>
                      <TableHead>Executions</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {automationRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{rule.name}</p>
                            <p className="text-sm text-gray-600">{rule.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getTriggerLabel(rule.trigger.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {rule.actions.slice(0, 2).map((action, index) => (
                              <div key={index} className="flex items-center justify-center w-6 h-6 rounded bg-gray-100">
                                {getActionIcon(action.type)}
                              </div>
                            ))}
                            {rule.actions.length > 2 && (
                              <span className="text-sm text-gray-600">+{rule.actions.length - 2}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{rule.executionCount}</TableCell>
                        <TableCell>
                          <Badge 
                            className={rule.successRate >= 90 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                          >
                            {rule.successRate}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={rule.isActive}
                              onCheckedChange={(checked) => 
                                toggleRuleMutation.mutate({ id: rule.id, isActive: checked })
                              }
                            />
                            <span className="text-sm text-gray-600">
                              {rule.isActive ? 'Active' : 'Inactive'}
                            </span>
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

          <TabsContent value="sequences" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {automationSequences.map((sequence) => (
                <Card key={sequence.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{sequence.name}</span>
                      <Badge variant={sequence.isActive ? "default" : "secondary"}>
                        {sequence.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{sequence.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Enrolled Contacts</p>
                        <p className="text-2xl font-bold">{sequence.enrolledContacts}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Completion Rate</p>
                        <p className="text-2xl font-bold">{sequence.completionRate}%</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Sequence Steps</p>
                      <div className="space-y-2">
                        {sequence.steps.slice(0, 3).map((step, index) => (
                          <div key={step.id} className="flex items-center space-x-3 text-sm">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                              {step.order}
                            </div>
                            <span className="text-gray-700">{step.content}</span>
                          </div>
                        ))}
                        {sequence.steps.length > 3 && (
                          <p className="text-sm text-gray-500 ml-9">
                            +{sequence.steps.length - 3} more steps
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Automation Performance</CardTitle>
                <CardDescription>
                  Detailed analytics and insights for your automation workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Advanced Analytics Coming Soon</h3>
                  <p>Detailed performance metrics, conversion tracking, and ROI analysis will be available in the next update.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}