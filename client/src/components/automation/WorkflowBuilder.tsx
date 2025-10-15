import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Workflow, 
  Play, 
  Square, 
  GitBranch, 
  Mail, 
  MessageSquare, 
  Bell, 
  Database, 
  Calculator,
  Timer,
  Zap,
  Plus,
  X,
  ArrowRight,
  Settings,
  Save
} from 'lucide-react';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay';
  title: string;
  description: string;
  icon: any;
  config: any;
  position: { x: number; y: number };
  connections: string[];
}

interface WorkflowBuilderProps {
  onWorkflowCreated: (workflow: any) => void;
}

const nodeTypes = {
  triggers: [
    { type: 'low_stock', title: 'Low Stock Alert', description: 'When inventory falls below threshold', icon: Database },
    { type: 'price_change', title: 'Price Change', description: 'When competitor prices change', icon: Calculator },
    { type: 'new_order', title: 'New Order', description: 'When a new order is placed', icon: Bell },
    { type: 'customer_signup', title: 'Customer Signup', description: 'When new customer registers', icon: Play }
  ],
  conditions: [
    { type: 'if_value', title: 'If Value', description: 'Check if value meets condition', icon: GitBranch },
    { type: 'if_time', title: 'If Time', description: 'Check current time/date', icon: Timer },
    { type: 'if_category', title: 'If Category', description: 'Check product category', icon: Square }
  ],
  actions: [
    { type: 'send_email', title: 'Send Email', description: 'Send notification email', icon: Mail },
    { type: 'update_price', title: 'Update Price', description: 'Adjust product pricing', icon: Calculator },
    { type: 'create_task', title: 'Create Task', description: 'Create task for team', icon: Plus },
    { type: 'send_notification', title: 'Send Notification', description: 'Send push notification', icon: Bell }
  ],
  delays: [
    { type: 'wait', title: 'Wait', description: 'Wait for specified time', icon: Timer }
  ]
};

export function WorkflowBuilder({ onWorkflowCreated }: WorkflowBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNodeType, setDraggedNodeType] = useState<any>(null);
  const [connections, setConnections] = useState<Array<{ from: string; to: string }>>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveWorkflow = useMutation({
    mutationFn: async (workflowData: any) => {
      return await apiRequest('POST', '/api/automation/workflows', workflowData);
    },
    onSuccess: (response) => {
      toast({
        title: "Workflow Saved",
        description: "Your automation workflow has been created successfully"
      });
      onWorkflowCreated(response);
      resetBuilder();
      setIsOpen(false);
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Unable to save workflow. Please try again.",
        variant: "destructive"
      });
    }
  });

  const resetBuilder = () => {
    setWorkflowName('');
    setWorkflowDescription('');
    setNodes([]);
    setSelectedNode(null);
    setConnections([]);
  };

  const handleDragStart = (nodeType: any) => {
    setDraggedNodeType(nodeType);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNodeType) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: getNodeCategory(draggedNodeType.type),
      title: draggedNodeType.title,
      description: draggedNodeType.description,
      icon: draggedNodeType.icon,
      config: {},
      position: { x, y },
      connections: []
    };

    setNodes(prev => [...prev, newNode]);
    setDraggedNodeType(null);
  }, [draggedNodeType]);

  const getNodeCategory = (type: string): 'trigger' | 'condition' | 'action' | 'delay' => {
    if (nodeTypes.triggers.some(t => t.type === type)) return 'trigger';
    if (nodeTypes.conditions.some(t => t.type === type)) return 'condition';
    if (nodeTypes.actions.some(t => t.type === type)) return 'action';
    return 'delay';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const deleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
  };

  const updateNodeConfig = (nodeId: string, config: any) => {
    setNodes(prev => prev.map(n => 
      n.id === nodeId ? { ...n, config: { ...n.config, ...config } } : n
    ));
  };

  const connectNodes = (fromId: string, toId: string) => {
    setConnections(prev => {
      const exists = prev.some(c => c.from === fromId && c.to === toId);
      if (exists) return prev;
      return [...prev, { from: fromId, to: toId }];
    });
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'trigger': return 'bg-green-100 border-green-300 text-green-800';
      case 'condition': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'action': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'delay': return 'bg-purple-100 border-purple-300 text-purple-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const handleSaveWorkflow = () => {
    if (!workflowName.trim()) {
      toast({
        title: "Missing Name",
        description: "Please enter a workflow name",
        variant: "destructive"
      });
      return;
    }

    if (nodes.length === 0) {
      toast({
        title: "Empty Workflow",
        description: "Please add at least one node to your workflow",
        variant: "destructive"
      });
      return;
    }

    const workflowData = {
      name: workflowName,
      description: workflowDescription,
      category: 'custom_workflow',
      triggerType: 'workflow',
      actionType: 'execute_workflow',
      enabled: true,
      workflow: {
        nodes,
        connections
      }
    };

    saveWorkflow.mutate(workflowData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-2 border-dashed">
          <Workflow className="h-4 w-4 mr-2" />
          Workflow Builder
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-blue-500" />
            Drag & Drop Workflow Builder
          </DialogTitle>
          <DialogDescription>
            Create custom automation workflows by dragging and connecting components
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[80vh] gap-4 mt-4">
          {/* Sidebar - Node Palette */}
          <div className="w-64 bg-gray-50 rounded-lg p-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Workflow Info */}
              <div className="space-y-2">
                <Label htmlFor="workflowName">Workflow Name</Label>
                <Input
                  id="workflowName"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="Enter workflow name"
                />
                <Label htmlFor="workflowDescription">Description</Label>
                <Textarea
                  id="workflowDescription"
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  placeholder="Describe your workflow"
                  rows={2}
                />
              </div>

              {/* Triggers */}
              <div>
                <h3 className="font-semibold text-green-700 mb-2">Triggers</h3>
                <div className="space-y-2">
                  {nodeTypes.triggers.map(trigger => {
                    const Icon = trigger.icon;
                    return (
                      <div
                        key={trigger.type}
                        draggable
                        onDragStart={() => handleDragStart(trigger)}
                        className="p-2 bg-green-50 border border-green-200 rounded cursor-move hover:bg-green-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-sm font-medium">{trigger.title}</p>
                            <p className="text-xs text-gray-600">{trigger.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Conditions */}
              <div>
                <h3 className="font-semibold text-yellow-700 mb-2">Conditions</h3>
                <div className="space-y-2">
                  {nodeTypes.conditions.map(condition => {
                    const Icon = condition.icon;
                    return (
                      <div
                        key={condition.type}
                        draggable
                        onDragStart={() => handleDragStart(condition)}
                        className="p-2 bg-yellow-50 border border-yellow-200 rounded cursor-move hover:bg-yellow-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-yellow-600" />
                          <div>
                            <p className="text-sm font-medium">{condition.title}</p>
                            <p className="text-xs text-gray-600">{condition.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div>
                <h3 className="font-semibold text-blue-700 mb-2">Actions</h3>
                <div className="space-y-2">
                  {nodeTypes.actions.map(action => {
                    const Icon = action.icon;
                    return (
                      <div
                        key={action.type}
                        draggable
                        onDragStart={() => handleDragStart(action)}
                        className="p-2 bg-blue-50 border border-blue-200 rounded cursor-move hover:bg-blue-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">{action.title}</p>
                            <p className="text-xs text-gray-600">{action.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delays */}
              <div>
                <h3 className="font-semibold text-purple-700 mb-2">Delays</h3>
                <div className="space-y-2">
                  {nodeTypes.delays.map(delay => {
                    const Icon = delay.icon;
                    return (
                      <div
                        key={delay.type}
                        draggable
                        onDragStart={() => handleDragStart(delay)}
                        className="p-2 bg-purple-50 border border-purple-200 rounded cursor-move hover:bg-purple-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium">{delay.title}</p>
                            <p className="text-xs text-gray-600">{delay.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 bg-white border-2 border-dashed border-gray-300 rounded-lg relative overflow-hidden">
            <div
              className="w-full h-full relative"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {/* Canvas Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="w-full h-full" style={{
                  backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }} />
              </div>

              {/* Instructions when empty */}
              {nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Workflow className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Drag components here to build your workflow</p>
                    <p className="text-sm">Start with a trigger, add conditions and actions</p>
                  </div>
                </div>
              )}

              {/* Render Nodes */}
              {nodes.map(node => {
                const Icon = node.icon;
                return (
                  <div
                    key={node.id}
                    className={`absolute p-3 rounded-lg border-2 cursor-pointer min-w-40 ${getNodeColor(node.type)} ${
                      selectedNode === node.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                    }`}
                    style={{
                      left: node.position.x,
                      top: node.position.y,
                      transform: 'translate(-50%, -50%)'
                    }}
                    onClick={() => setSelectedNode(node.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        <div>
                          <p className="font-medium text-sm">{node.title}</p>
                          <p className="text-xs opacity-80">{node.description}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNode(node.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Connection Points */}
                    <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 bg-white border-2 border-current rounded-full cursor-pointer hover:scale-110 transition-transform" />
                    </div>
                    {node.type !== 'trigger' && (
                      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 bg-white border-2 border-current rounded-full cursor-pointer hover:scale-110 transition-transform" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Render Connections */}
              <svg className="absolute inset-0 pointer-events-none">
                {connections.map((connection, index) => {
                  const fromNode = nodes.find(n => n.id === connection.from);
                  const toNode = nodes.find(n => n.id === connection.to);
                  if (!fromNode || !toNode) return null;

                  const x1 = fromNode.position.x + 20;
                  const y1 = fromNode.position.y;
                  const x2 = toNode.position.x - 20;
                  const y2 = toNode.position.y;

                  return (
                    <line
                      key={index}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                  );
                })}
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="10"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#3b82f6"
                    />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>

          {/* Properties Panel */}
          {selectedNode && (
            <div className="w-64 bg-gray-50 rounded-lg p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4">Node Properties</h3>
              {(() => {
                const node = nodes.find(n => n.id === selectedNode);
                if (!node) return null;

                return (
                  <div className="space-y-4">
                    <div>
                      <Label>Node Type</Label>
                      <Badge variant="outline">{node.type}</Badge>
                    </div>
                    
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={node.title}
                        onChange={(e) => {
                          setNodes(prev => prev.map(n => 
                            n.id === selectedNode ? { ...n, title: e.target.value } : n
                          ));
                        }}
                      />
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={node.description}
                        onChange={(e) => {
                          setNodes(prev => prev.map(n => 
                            n.id === selectedNode ? { ...n, description: e.target.value } : n
                          ));
                        }}
                        rows={2}
                      />
                    </div>

                    {/* Type-specific configuration */}
                    {node.type === 'trigger' && (
                      <div>
                        <Label>Trigger Condition</Label>
                        <Select onValueChange={(value) => updateNodeConfig(node.id, { condition: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">Immediate</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="threshold">Threshold-based</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {node.type === 'action' && (
                      <div>
                        <Label>Action Parameters</Label>
                        <Textarea
                          placeholder="Enter action parameters..."
                          onChange={(e) => updateNodeConfig(node.id, { parameters: e.target.value })}
                          rows={3}
                        />
                      </div>
                    )}

                    {node.type === 'delay' && (
                      <div>
                        <Label>Delay Duration (minutes)</Label>
                        <Input
                          type="number"
                          placeholder="5"
                          onChange={(e) => updateNodeConfig(node.id, { duration: parseInt(e.target.value) })}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            {nodes.length} nodes, {connections.length} connections
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetBuilder}>
              Clear All
            </Button>
            <Button onClick={handleSaveWorkflow} disabled={saveWorkflow.isPending}>
              {saveWorkflow.isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Workflow
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}