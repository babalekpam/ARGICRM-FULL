import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Layout from "@/components/layout";
import Logo from "@/components/logo";
import { 
  TrendingDown, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  ArrowDown,
  Users,
  Target,
  DollarSign,
  CheckCircle,
  BarChart3
} from "lucide-react";

interface FunnelStep {
  id: number;
  name: string;
  type: 'landing' | 'email' | 'phone' | 'meeting' | 'close';
  description: string;
  conversionRate: number;
  visitors: number;
  converted: number;
}

interface Funnel {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'paused';
  steps: FunnelStep[];
  totalVisitors: number;
  totalConversions: number;
  conversionRate: number;
  revenue: number;
  createdAt: Date;
}

const mockFunnels: Funnel[] = [];

export default function FunnelBuilderPage() {
  const [funnels, setFunnels] = useState(mockFunnels);
  const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewFunnelDialogOpen, setIsNewFunnelDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<FunnelStep | null>(null);
  const [newFunnelData, setNewFunnelData] = useState({
    name: '',
    description: ''
  });

  const [newStep, setNewStep] = useState({
    name: '',
    type: 'landing' as const,
    description: '',
    conversionRate: 0,
    visitors: 0
  });

  // Action handlers for funnels
  const handleViewFunnel = (funnel: Funnel) => {
    alert(`Viewing funnel: ${funnel.name}\n\nDescription: ${funnel.description}\n\nStatus: ${funnel.status}\nTotal Visitors: ${funnel.totalVisitors}\nConversions: ${funnel.totalConversions}\nRevenue: $${funnel.revenue.toLocaleString()}`);
  };

  const handleEditFunnel = (funnel: Funnel) => {
    const newName = prompt('Edit funnel name:', funnel.name);
    if (newName && newName !== funnel.name) {
      const updatedFunnel = { ...funnel, name: newName };
      setFunnels(funnels.map(f => f.id === funnel.id ? updatedFunnel : f));
      if (selectedFunnel?.id === funnel.id) {
        setSelectedFunnel(updatedFunnel);
      }
    }
  };

  const handleDeleteFunnel = (funnel: Funnel) => {
    if (confirm(`Are you sure you want to delete the funnel "${funnel.name}"?`)) {
      setFunnels(funnels.filter(f => f.id !== funnel.id));
      if (selectedFunnel?.id === funnel.id) {
        setSelectedFunnel(null);
      }
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'landing': return <Target className="h-4 w-4" />;
      case 'email': return <Users className="h-4 w-4" />;
      case 'phone': return <Users className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      case 'close': return <DollarSign className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getStepColor = (type: string) => {
    switch (type) {
      case 'landing': return 'bg-blue-100 text-blue-800';
      case 'email': return 'bg-green-100 text-green-800';
      case 'phone': return 'bg-orange-100 text-orange-800';
      case 'meeting': return 'bg-purple-100 text-purple-800';
      case 'close': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddStep = () => {
    if (!selectedFunnel || !newStep.name.trim()) return;

    const step: FunnelStep = {
      id: Date.now(),
      name: newStep.name,
      type: newStep.type,
      description: newStep.description,
      conversionRate: newStep.conversionRate,
      visitors: newStep.visitors,
      converted: Math.round(newStep.visitors * (newStep.conversionRate / 100))
    };

    const updatedFunnel = {
      ...selectedFunnel,
      steps: [...selectedFunnel.steps, step]
    };

    setFunnels(funnels.map(f => f.id === selectedFunnel.id ? updatedFunnel : f));
    setSelectedFunnel(updatedFunnel);
    setNewStep({ name: '', type: 'landing', description: '', conversionRate: 0, visitors: 0 });
    setIsDialogOpen(false);
  };

  const handleCreateFunnel = () => {
    if (!newFunnelData.name.trim()) return;

    const newFunnel: Funnel = {
      id: Date.now(),
      name: newFunnelData.name,
      description: newFunnelData.description,
      status: 'draft',
      totalVisitors: 0,
      totalConversions: 0,
      conversionRate: 0,
      revenue: 0,
      createdAt: new Date(),
      steps: [
        {
          id: Date.now() + 1,
          name: "Landing Page",
          type: 'landing',
          description: "Initial visitor entry point",
          conversionRate: 0,
          visitors: 0,
          converted: 0
        }
      ]
    };

    setFunnels([...funnels, newFunnel]);
    setSelectedFunnel(newFunnel);
    setNewFunnelData({ name: '', description: '' });
    setIsNewFunnelDialogOpen(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Logo size="md" />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                AI-Powered Funnel Builder
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Design, optimize, and automate high-converting sales funnels with AI insights
              </p>
              <div className="flex space-x-2 mt-2">
                <Badge variant="secondary" className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-0">
                  Conversion Optimization
                </Badge>
                <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-0">
                  Smart Analytics
                </Badge>
              </div>
            </div>
          </div>
          
          <Dialog open={isNewFunnelDialogOpen} onOpenChange={setIsNewFunnelDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Funnel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Funnel</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Funnel Name</label>
                  <Input
                    value={newFunnelData.name}
                    onChange={(e) => setNewFunnelData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter funnel name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newFunnelData.description}
                    onChange={(e) => setNewFunnelData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your funnel purpose"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsNewFunnelDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateFunnel} disabled={!newFunnelData.name.trim()}>
                    Create Funnel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Funnel List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Your Funnels</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {funnels.map((funnel) => (
                    <div
                      key={funnel.id}
                      onClick={() => setSelectedFunnel(funnel)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        selectedFunnel?.id === funnel.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-4 border-r-blue-500' : ''
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{funnel.name}</span>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(funnel.status)} variant="secondary">
                              {funnel.status}
                            </Badge>
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewFunnel(funnel);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditFunnel(funnel);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFunnel(funnel);
                                }}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          <div>{funnel.totalVisitors.toLocaleString()} visitors</div>
                          <div>{funnel.conversionRate.toFixed(1)}% conversion</div>
                          <div>${funnel.revenue.toLocaleString()} revenue</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {funnels.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No funnels created yet</p>
                      <p className="text-sm">Build your first funnel to track conversions</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Funnel Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-gray-400">
                    $0
                  </div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded">
                    <div className="text-lg font-bold text-gray-400">
                      0
                    </div>
                    <div className="text-xs text-gray-500">Total Visitors</div>
                  </div>
                  <div className="text-center p-3 border border-gray-200 dark:border-gray-700 rounded">
                    <div className="text-lg font-bold text-gray-400">
                      {funnels.length > 0 ? (funnels.reduce((sum, f) => sum + f.conversionRate, 0) / funnels.length).toFixed(1) : 0}%
                    </div>
                    <div className="text-xs text-gray-500">Avg Conversion</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Funnel Details */}
          <div className="lg:col-span-3">
            {selectedFunnel ? (
              <div className="space-y-6">
                {/* Funnel Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          <TrendingDown className="h-5 w-5 mr-2" />
                          {selectedFunnel.name}
                        </CardTitle>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {selectedFunnel.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(selectedFunnel.status)} variant="secondary">
                          {selectedFunnel.status}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => handleEditFunnel(selectedFunnel)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleViewFunnel(selectedFunnel)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedFunnel.totalVisitors.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">Total Visitors</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedFunnel.totalConversions}
                        </div>
                        <div className="text-sm text-gray-500">Conversions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {selectedFunnel.conversionRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Conversion Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          ${selectedFunnel.revenue.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">Revenue</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Funnel Steps */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Funnel Steps</CardTitle>
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Step
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Funnel Step</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              placeholder="Step name"
                              value={newStep.name}
                              onChange={(e) => setNewStep({...newStep, name: e.target.value})}
                            />
                            <Select value={newStep.type} onValueChange={(value: any) => setNewStep({...newStep, type: value})}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="landing">Landing Page</SelectItem>
                                <SelectItem value="email">Email/Form</SelectItem>
                                <SelectItem value="phone">Phone Call</SelectItem>
                                <SelectItem value="meeting">Meeting</SelectItem>
                                <SelectItem value="close">Close/Purchase</SelectItem>
                              </SelectContent>
                            </Select>
                            <Textarea
                              placeholder="Step description"
                              value={newStep.description}
                              onChange={(e) => setNewStep({...newStep, description: e.target.value})}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="number"
                                placeholder="Visitors"
                                value={newStep.visitors}
                                onChange={(e) => setNewStep({...newStep, visitors: parseInt(e.target.value) || 0})}
                              />
                              <Input
                                type="number"
                                placeholder="Conversion %"
                                value={newStep.conversionRate}
                                onChange={(e) => setNewStep({...newStep, conversionRate: parseFloat(e.target.value) || 0})}
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleAddStep}>
                                Add Step
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedFunnel.steps.map((step, index) => (
                        <div key={step.id}>
                          <div className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${getStepColor(step.type).replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                                {getStepIcon(step.type)}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{step.name}</div>
                                <div className="text-sm text-gray-500">{step.description}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-6 text-sm">
                              <div className="text-center">
                                <div className="font-bold">{step.visitors.toLocaleString()}</div>
                                <div className="text-gray-500">Visitors</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-green-600">{step.converted}</div>
                                <div className="text-gray-500">Converted</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-blue-600">{step.conversionRate.toFixed(1)}%</div>
                                <div className="text-gray-500">Rate</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {index < selectedFunnel.steps.length - 1 && (
                            <div className="flex justify-center py-2">
                              <ArrowDown className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No funnel selected</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Select a funnel from the list to view and edit
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}