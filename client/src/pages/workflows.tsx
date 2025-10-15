import Layout from "@/components/layout";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Plus, Play, Pause, Edit, Trash2, Zap, Mail, Phone, Calendar, User, Settings, BarChart3 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Workflow {
  id: number;
  name: string;
  description: string;
  triggerType: string;
  triggerConditions: string;
  actions: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowFormData {
  name: string;
  description: string;
  triggerType: string;
  triggerConditions: any;
  actions: any[];
}

const triggerTypes = [
  { value: "contact_created", label: "Contact Created", icon: User },
  { value: "deal_won", label: "Deal Won", icon: Zap },
  { value: "deal_lost", label: "Deal Lost", icon: Zap },
  { value: "email_opened", label: "Email Opened", icon: Mail },
  { value: "form_submitted", label: "Form Submitted", icon: Calendar },
  { value: "lead_scored", label: "Lead Scored", icon: User },
];

const actionTypes = [
  { value: "send_email", label: "Send Email", icon: Mail },
  { value: "create_task", label: "Create Task", icon: Calendar },
  { value: "update_field", label: "Update Field", icon: Edit },
  { value: "assign_to_user", label: "Assign to User", icon: User },
  { value: "send_sms", label: "Send SMS", icon: Phone },
  { value: "add_to_sequence", label: "Add to Email Sequence", icon: Mail },
];

export default function WorkflowsPage() {
  const [showWorkflowForm, setShowWorkflowForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: "",
    description: "",
    triggerType: "",
    triggerConditions: {},
    actions: []
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workflows, isLoading } = useQuery({
    queryKey: ["/api/workflows"],
    queryFn: async () => {
      const response = await fetch("/api/workflows");
      if (!response.ok) throw new Error("Failed to fetch workflows");
      return response.json() as Promise<Workflow[]>;
    },
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async (data: WorkflowFormData) => {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          triggerConditions: JSON.stringify(data.triggerConditions),
          actions: JSON.stringify(data.actions)
        }),
      });
      if (!response.ok) throw new Error("Failed to create workflow");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      setShowWorkflowForm(false);
      setFormData({ name: "", description: "", triggerType: "", triggerConditions: {}, actions: [] });
      toast({ title: "Workflow created successfully" });
    },
  });

  const toggleWorkflowMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error("Failed to update workflow");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({ title: "Workflow updated successfully" });
    },
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/workflows/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete workflow");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({ title: "Workflow deleted successfully" });
    },
  });

  const addAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { type: "", config: {} }]
    }));
  };

  const updateAction = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, [field]: value } : action
      )
    }));
  };

  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWorkflowMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Workflow Automation</h1>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Zap className="h-8 w-8 text-cyan-600" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Workflow Automation
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Automate your business processes with intelligent smart workflows
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 border-cyan-200">
                <div className="w-2 h-2 bg-cyan-500 rounded-full mr-2 animate-pulse"></div>
                Smart Automation
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                AI-Powered
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                No-Code Builder
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button variant="outline" className="bg-white shadow-md border-slate-200">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Dialog open={showWorkflowForm} onOpenChange={setShowWorkflowForm}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Workflow</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="trigger" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="trigger">Trigger</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="trigger" className="space-y-4">
                    <div>
                      <Label htmlFor="name">Workflow Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter workflow name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe what this workflow does"
                      />
                    </div>
                    <div>
                      <Label htmlFor="trigger">Trigger Event</Label>
                      <Select 
                        value={formData.triggerType} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, triggerType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a trigger event" />
                        </SelectTrigger>
                        <SelectContent>
                          {triggerTypes.map(trigger => (
                            <SelectItem key={trigger.value} value={trigger.value}>
                              <div className="flex items-center">
                                <trigger.icon className="h-4 w-4 mr-2" />
                                {trigger.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="actions" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Workflow Actions</h3>
                      <Button type="button" onClick={addAction} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Action
                      </Button>
                    </div>
                    
                    {formData.actions.map((action, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium">Action {index + 1}</h4>
                          <Button 
                            type="button" 
                            onClick={() => removeAction(index)} 
                            variant="ghost" 
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label>Action Type</Label>
                            <Select 
                              value={action.type} 
                              onValueChange={(value) => updateAction(index, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select action type" />
                              </SelectTrigger>
                              <SelectContent>
                                {actionTypes.map(actionType => (
                                  <SelectItem key={actionType.value} value={actionType.value}>
                                    <div className="flex items-center">
                                      <actionType.icon className="h-4 w-4 mr-2" />
                                      {actionType.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {action.type === 'send_email' && (
                            <div className="space-y-2">
                              <Input
                                placeholder="Email subject"
                                value={action.config?.subject || ''}
                                onChange={(e) => updateAction(index, 'config', { 
                                  ...action.config, 
                                  subject: e.target.value 
                                })}
                              />
                              <Textarea
                                placeholder="Email content"
                                value={action.config?.content || ''}
                                onChange={(e) => updateAction(index, 'config', { 
                                  ...action.config, 
                                  content: e.target.value 
                                })}
                              />
                            </div>
                          )}
                          
                          {action.type === 'create_task' && (
                            <div className="space-y-2">
                              <Input
                                placeholder="Task title"
                                value={action.config?.title || ''}
                                onChange={(e) => updateAction(index, 'config', { 
                                  ...action.config, 
                                  title: e.target.value 
                                })}
                              />
                              <Textarea
                                placeholder="Task description"
                                value={action.config?.description || ''}
                                onChange={(e) => updateAction(index, 'config', { 
                                  ...action.config, 
                                  description: e.target.value 
                                })}
                              />
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                    
                    {formData.actions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No actions added yet. Click "Add Action" to get started.
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="settings" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Active Workflow</h3>
                        <p className="text-sm text-gray-500">Enable this workflow to start automation</p>
                      </div>
                      <Switch 
                        checked={true}
                        onCheckedChange={() => {}}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowWorkflowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createWorkflowMutation.isPending}>
                    {createWorkflowMutation.isPending ? "Creating..." : "Create Workflow"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {workflows?.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      {workflow.name}
                      <Badge 
                        variant={workflow.isActive ? "default" : "secondary"} 
                        className="ml-2"
                      >
                        {workflow.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {workflow.description}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleWorkflowMutation.mutate({
                        id: workflow.id,
                        isActive: !workflow.isActive
                      })}
                    >
                      {workflow.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingWorkflow(workflow)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteWorkflowMutation.mutate(workflow.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 mr-1" />
                    Trigger: {triggerTypes.find(t => t.value === workflow.triggerType)?.label || workflow.triggerType}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Created: {new Date(workflow.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Edit className="h-4 w-4 mr-1" />
                    {JSON.parse(workflow.actions || '[]').length} actions
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {workflows?.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No workflows created yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first workflow to automate repetitive tasks and improve efficiency.
                </p>
                <Button onClick={() => setShowWorkflowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Workflow
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}