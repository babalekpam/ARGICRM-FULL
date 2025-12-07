import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Plus,
  Mail,
  Linkedin,
  Phone,
  Clock,
  CheckSquare,
  Eye,
  UserPlus,
  MessageSquare,
  Play,
  Pause,
  Trash2,
  Edit,
  MoreVertical,
  GripVertical,
  Users,
  BarChart3,
  TrendingUp,
  ArrowRight,
  Settings,
  Zap,
  Target,
  Send,
  MousePointer,
  Reply,
  AlertCircle,
  ChevronRight,
  Loader2,
  FlaskConical,
  Copy
} from "lucide-react";
import type { SequenceTemplate, SequenceStep, SequenceEnrollment, Contact } from "@shared/schema";

const STEP_TYPES = [
  { value: "email", label: "Email", icon: Mail, color: "bg-blue-500" },
  { value: "linkedin_view", label: "LinkedIn View", icon: Eye, color: "bg-sky-500" },
  { value: "linkedin_connect", label: "LinkedIn Connect", icon: UserPlus, color: "bg-sky-600" },
  { value: "linkedin_message", label: "LinkedIn Message", icon: MessageSquare, color: "bg-sky-700" },
  { value: "call", label: "Phone Call", icon: Phone, color: "bg-green-500" },
  { value: "manual_task", label: "Manual Task", icon: CheckSquare, color: "bg-purple-500" },
  { value: "wait", label: "Wait", icon: Clock, color: "bg-gray-500" },
];

interface SortableStepProps {
  step: SequenceStep;
  onEdit: (step: SequenceStep) => void;
  onDelete: (stepId: string) => void;
}

function SortableStep({ step, onEdit, onDelete }: SortableStepProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const stepType = STEP_TYPES.find(t => t.value === step.stepType);
  const StepIcon = stepType?.icon || Mail;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-[#1A1F3A] border border-[#1E293B] rounded-lg mb-2 group"
      data-testid={`step-item-${step.id}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-[#64748B] hover:text-[#94A3B8]"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      
      <div className={`w-10 h-10 rounded-lg ${stepType?.color || 'bg-gray-500'} flex items-center justify-center`}>
        <StepIcon className="w-5 h-5 text-white" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#64748B] uppercase tracking-wide">
            Step {step.stepNumber}
          </span>
          {step.abTestEnabled && (
            <Badge variant="outline" className="text-xs border-purple-500 text-purple-400">
              <FlaskConical className="w-3 h-3 mr-1" />
              A/B Test
            </Badge>
          )}
        </div>
        <p className="text-sm font-medium text-[#F8F9FA] truncate">
          {step.name || step.subject || stepType?.label || 'Untitled Step'}
        </p>
        <p className="text-xs text-[#64748B]">
          {step.delayDays || 0}d {step.delayHours || 0}h delay
        </p>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onEdit(step)}
          className="h-8 w-8"
          data-testid={`button-edit-step-${step.id}`}
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onDelete(step.id)}
          className="h-8 w-8 text-red-400 hover:text-red-300"
          data-testid={`button-delete-step-${step.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function MetricCard({ label, value, subValue, icon: Icon, trend }: { 
  label: string; 
  value: string | number; 
  subValue?: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card className="bg-[#11152B] border-[#1E293B]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold text-[#F8F9FA] tabular-nums mt-1">{value}</p>
            {subValue && (
              <p className="text-sm text-[#94A3B8] mt-1">{subValue}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            trend === 'up' ? 'bg-green-500/10 text-green-400' :
            trend === 'down' ? 'bg-red-500/10 text-red-400' :
            'bg-[#1A1F3A] text-[#94A3B8]'
          }`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SequencesPage() {
  const [selectedSequence, setSelectedSequence] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [editingStep, setEditingStep] = useState<SequenceStep | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const { toast } = useToast();
  const queryClientInstance = useQueryClient();

  // Form state for new sequence
  const [newSequence, setNewSequence] = useState({
    name: "",
    description: "",
    category: "outreach",
  });

  // Form state for new/edit step
  const [stepForm, setStepForm] = useState({
    stepType: "email",
    name: "",
    delayDays: 1,
    delayHours: 0,
    subject: "",
    body: "",
    abTestEnabled: false,
    variantA: { subject: "", body: "" },
    variantB: { subject: "", body: "" },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Fetch all sequences
  const { data: sequencesData, isLoading: sequencesLoading } = useQuery({
    queryKey: ['/api/sequences'],
  });

  // Fetch selected sequence details
  const { data: sequenceDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['/api/sequences', selectedSequence],
    enabled: !!selectedSequence,
  });

  // Fetch sequence stats
  const { data: sequenceStats } = useQuery({
    queryKey: ['/api/sequences', selectedSequence, 'stats'],
    enabled: !!selectedSequence,
  });

  const sequences = sequencesData?.sequences || [];
  const currentSequence = sequenceDetails?.sequence;
  const steps = currentSequence?.steps || [];
  const stats = sequenceStats?.stats;

  // Mutations
  const createSequenceMutation = useMutation({
    mutationFn: async (data: typeof newSequence) => {
      return apiRequest('/api/sequences', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: (data) => {
      toast({ title: "Sequence created", description: "Your sequence has been created successfully." });
      queryClientInstance.invalidateQueries({ queryKey: ['/api/sequences'] });
      setShowCreateDialog(false);
      setNewSequence({ name: "", description: "", category: "outreach" });
      if (data?.sequence?.id) {
        setSelectedSequence(data.sequence.id);
        setActiveTab("builder");
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteSequenceMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/sequences/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({ title: "Sequence deleted" });
      queryClientInstance.invalidateQueries({ queryKey: ['/api/sequences'] });
      setSelectedSequence(null);
      setActiveTab("list");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const addStepMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/sequences/${selectedSequence}/steps`, { 
        method: 'POST', 
        body: JSON.stringify(data) 
      });
    },
    onSuccess: () => {
      toast({ title: "Step added" });
      queryClientInstance.invalidateQueries({ queryKey: ['/api/sequences', selectedSequence] });
      setShowStepDialog(false);
      resetStepForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateStepMutation = useMutation({
    mutationFn: async ({ stepId, data }: { stepId: string; data: any }) => {
      return apiRequest(`/api/sequences/${selectedSequence}/steps/${stepId}`, { 
        method: 'PUT', 
        body: JSON.stringify(data) 
      });
    },
    onSuccess: () => {
      toast({ title: "Step updated" });
      queryClientInstance.invalidateQueries({ queryKey: ['/api/sequences', selectedSequence] });
      setShowStepDialog(false);
      setEditingStep(null);
      resetStepForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteStepMutation = useMutation({
    mutationFn: async (stepId: string) => {
      return apiRequest(`/api/sequences/${selectedSequence}/steps/${stepId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({ title: "Step deleted" });
      queryClientInstance.invalidateQueries({ queryKey: ['/api/sequences', selectedSequence] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const reorderStepsMutation = useMutation({
    mutationFn: async (stepOrder: string[]) => {
      return apiRequest(`/api/sequences/${selectedSequence}/steps/reorder`, { 
        method: 'PUT', 
        body: JSON.stringify({ stepOrder }) 
      });
    },
    onSuccess: () => {
      queryClientInstance.invalidateQueries({ queryKey: ['/api/sequences', selectedSequence] });
    }
  });

  const pauseEnrollmentsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/sequences/${selectedSequence}/pause`, { 
        method: 'POST',
        body: JSON.stringify({})
      });
    },
    onSuccess: (data) => {
      toast({ title: "Enrollments paused", description: `${data.paused} enrollments paused` });
      queryClientInstance.invalidateQueries({ queryKey: ['/api/sequences', selectedSequence] });
    }
  });

  const resumeEnrollmentsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/sequences/${selectedSequence}/resume`, { 
        method: 'POST',
        body: JSON.stringify({})
      });
    },
    onSuccess: (data) => {
      toast({ title: "Enrollments resumed", description: `${data.resumed} enrollments resumed` });
      queryClientInstance.invalidateQueries({ queryKey: ['/api/sequences', selectedSequence] });
    }
  });

  const resetStepForm = () => {
    setStepForm({
      stepType: "email",
      name: "",
      delayDays: 1,
      delayHours: 0,
      subject: "",
      body: "",
      abTestEnabled: false,
      variantA: { subject: "", body: "" },
      variantB: { subject: "", body: "" },
    });
  };

  const handleEditStep = (step: SequenceStep) => {
    setEditingStep(step);
    setStepForm({
      stepType: step.stepType,
      name: step.name || "",
      delayDays: step.delayDays || 1,
      delayHours: step.delayHours || 0,
      subject: step.subject || "",
      body: step.body || "",
      abTestEnabled: step.abTestEnabled || false,
      variantA: step.variantA || { subject: "", body: "" },
      variantB: step.variantB || { subject: "", body: "" },
    });
    setShowStepDialog(true);
  };

  const handleSaveStep = () => {
    const data = {
      stepType: stepForm.stepType,
      name: stepForm.name,
      delayDays: stepForm.delayDays,
      delayHours: stepForm.delayHours,
      subject: stepForm.subject,
      body: stepForm.body,
      abTestEnabled: stepForm.abTestEnabled,
      variantA: stepForm.abTestEnabled ? stepForm.variantA : null,
      variantB: stepForm.abTestEnabled ? stepForm.variantB : null,
    };

    if (editingStep) {
      updateStepMutation.mutate({ stepId: editingStep.id, data });
    } else {
      addStepMutation.mutate(data);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex((s: SequenceStep) => s.id === active.id);
    const newIndex = steps.findIndex((s: SequenceStep) => s.id === over.id);
    const newOrder = arrayMove(steps, oldIndex, newIndex);
    
    reorderStepsMutation.mutate(newOrder.map((s: SequenceStep) => s.id));
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-500/10 text-green-400 border-green-500/20",
      paused: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      completed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      bounced: "bg-red-500/10 text-red-400 border-red-500/20",
    };
    return styles[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
  };

  if (sequencesLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#4C6EF5]" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#0B0D17] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#F8F9FA] tracking-tight">Sequences</h1>
              <p className="text-[#94A3B8] mt-1">Build and manage automated email sequences</p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#4C6EF5] hover:bg-[#3D5DDB]" data-testid="button-create-sequence">
                  <Plus className="w-4 h-4 mr-2" />
                  New Sequence
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#11152B] border-[#1E293B]">
                <DialogHeader>
                  <DialogTitle className="text-[#F8F9FA]">Create New Sequence</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-[#94A3B8]">Sequence Name</Label>
                    <Input
                      placeholder="e.g., Cold Outreach Campaign"
                      value={newSequence.name}
                      onChange={(e) => setNewSequence({ ...newSequence, name: e.target.value })}
                      className="bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA]"
                      data-testid="input-sequence-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#94A3B8]">Description</Label>
                    <Textarea
                      placeholder="Describe what this sequence does..."
                      value={newSequence.description}
                      onChange={(e) => setNewSequence({ ...newSequence, description: e.target.value })}
                      className="bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA] resize-none"
                      data-testid="input-sequence-description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#94A3B8]">Category</Label>
                    <Select
                      value={newSequence.category}
                      onValueChange={(value) => setNewSequence({ ...newSequence, category: value })}
                    >
                      <SelectTrigger className="bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA]" data-testid="select-sequence-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#11152B] border-[#1E293B]">
                        <SelectItem value="outreach">Outreach</SelectItem>
                        <SelectItem value="nurture">Nurture</SelectItem>
                        <SelectItem value="follow-up">Follow-up</SelectItem>
                        <SelectItem value="re-engagement">Re-engagement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                  <Button 
                    onClick={() => createSequenceMutation.mutate(newSequence)}
                    disabled={!newSequence.name || createSequenceMutation.isPending}
                    className="bg-[#4C6EF5] hover:bg-[#3D5DDB]"
                    data-testid="button-confirm-create-sequence"
                  >
                    {createSequenceMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Sequence
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-[#11152B] border border-[#1E293B]">
              <TabsTrigger value="list" className="data-[state=active]:bg-[#1A1F3A]" data-testid="tab-sequences-list">
                <BarChart3 className="w-4 h-4 mr-2" />
                All Sequences
              </TabsTrigger>
              <TabsTrigger 
                value="builder" 
                disabled={!selectedSequence}
                className="data-[state=active]:bg-[#1A1F3A]"
                data-testid="tab-sequence-builder"
              >
                <Settings className="w-4 h-4 mr-2" />
                Builder
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                disabled={!selectedSequence}
                className="data-[state=active]:bg-[#1A1F3A]"
                data-testid="tab-sequence-analytics"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="enrollments" 
                disabled={!selectedSequence}
                className="data-[state=active]:bg-[#1A1F3A]"
                data-testid="tab-sequence-enrollments"
              >
                <Users className="w-4 h-4 mr-2" />
                Enrollments
              </TabsTrigger>
            </TabsList>

            {/* Sequences List */}
            <TabsContent value="list" className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  label="Total Sequences"
                  value={sequences.length}
                  icon={Zap}
                />
                <MetricCard
                  label="Active Sequences"
                  value={sequences.filter((s: any) => s.isActive).length}
                  icon={Play}
                  trend="up"
                />
                <MetricCard
                  label="Total Enrolled"
                  value={sequences.reduce((acc: number, s: any) => acc + (s.enrollmentStats?.total || 0), 0)}
                  icon={Users}
                />
                <MetricCard
                  label="Avg. Open Rate"
                  value={`${sequences.length > 0 ? 
                    (sequences.reduce((acc: number, s: any) => acc + (s.stats?.openRate || 0), 0) / sequences.length).toFixed(1) : 0}%`}
                  icon={Eye}
                  trend="up"
                />
              </div>

              {/* Sequences Grid */}
              {sequences.length === 0 ? (
                <Card className="bg-[#11152B] border-[#1E293B]">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 rounded-full bg-[#1A1F3A] flex items-center justify-center mb-4">
                      <Mail className="w-8 h-8 text-[#64748B]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#F8F9FA] mb-2">No sequences yet</h3>
                    <p className="text-[#94A3B8] text-center max-w-md mb-6">
                      Create your first email sequence to start automating your outreach and follow-ups.
                    </p>
                    <Button 
                      onClick={() => setShowCreateDialog(true)}
                      className="bg-[#4C6EF5] hover:bg-[#3D5DDB]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Sequence
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {sequences.map((sequence: any) => (
                    <Card 
                      key={sequence.id}
                      className="bg-[#11152B] border-[#1E293B] hover-elevate cursor-pointer transition-all"
                      onClick={() => {
                        setSelectedSequence(sequence.id);
                        setActiveTab("builder");
                      }}
                      data-testid={`card-sequence-${sequence.id}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold text-[#F8F9FA] truncate">
                              {sequence.name}
                            </CardTitle>
                            <p className="text-sm text-[#64748B] mt-1 line-clamp-2">
                              {sequence.description || 'No description'}
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={sequence.isActive ? 
                              "border-green-500/20 bg-green-500/10 text-green-400" : 
                              "border-gray-500/20 bg-gray-500/10 text-gray-400"
                            }
                          >
                            {sequence.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-[#94A3B8] mb-4">
                          <span className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            {sequence.stepCount} steps
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {sequence.enrollmentStats?.total || 0} enrolled
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#1E293B]">
                          <div className="text-center">
                            <p className="text-xl font-bold text-[#F8F9FA] tabular-nums">
                              {sequence.stats?.openRate?.toFixed(1) || 0}%
                            </p>
                            <p className="text-xs text-[#64748B]">Open Rate</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-bold text-[#F8F9FA] tabular-nums">
                              {sequence.stats?.clickRate?.toFixed(1) || 0}%
                            </p>
                            <p className="text-xs text-[#64748B]">Click Rate</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-bold text-[#F8F9FA] tabular-nums">
                              {sequence.stats?.replyRate?.toFixed(1) || 0}%
                            </p>
                            <p className="text-xs text-[#64748B]">Reply Rate</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Sequence Builder */}
            <TabsContent value="builder" className="space-y-6">
              {currentSequence && (
                <>
                  {/* Sequence Header */}
                  <Card className="bg-[#11152B] border-[#1E293B]">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-semibold text-[#F8F9FA]">{currentSequence.name}</h2>
                          <p className="text-[#94A3B8] mt-1">{currentSequence.description || 'No description'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {currentSequence.category || 'outreach'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSequenceMutation.mutate(currentSequence.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            data-testid="button-delete-sequence"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Steps List */}
                    <div className="lg:col-span-2">
                      <Card className="bg-[#11152B] border-[#1E293B]">
                        <CardHeader className="flex flex-row items-center justify-between gap-2">
                          <CardTitle className="text-lg font-semibold text-[#F8F9FA]">
                            Sequence Steps
                          </CardTitle>
                          <Dialog open={showStepDialog} onOpenChange={(open) => {
                            setShowStepDialog(open);
                            if (!open) {
                              setEditingStep(null);
                              resetStepForm();
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button size="sm" className="bg-[#4C6EF5] hover:bg-[#3D5DDB]" data-testid="button-add-step">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Step
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#11152B] border-[#1E293B] max-w-2xl max-h-[85vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="text-[#F8F9FA]">
                                  {editingStep ? 'Edit Step' : 'Add New Step'}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label className="text-[#94A3B8]">Step Type</Label>
                                  <Select
                                    value={stepForm.stepType}
                                    onValueChange={(value) => setStepForm({ ...stepForm, stepType: value })}
                                  >
                                    <SelectTrigger className="bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA]" data-testid="select-step-type">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#11152B] border-[#1E293B]">
                                      {STEP_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                          <div className="flex items-center gap-2">
                                            <type.icon className="w-4 h-4" />
                                            {type.label}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-[#94A3B8]">Step Name</Label>
                                  <Input
                                    placeholder="e.g., Initial outreach"
                                    value={stepForm.name}
                                    onChange={(e) => setStepForm({ ...stepForm, name: e.target.value })}
                                    className="bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA]"
                                    data-testid="input-step-name"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-[#94A3B8]">Delay (Days)</Label>
                                    <Input
                                      type="number"
                                      min={0}
                                      value={stepForm.delayDays}
                                      onChange={(e) => setStepForm({ ...stepForm, delayDays: parseInt(e.target.value) || 0 })}
                                      className="bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA]"
                                      data-testid="input-step-delay-days"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-[#94A3B8]">Delay (Hours)</Label>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={23}
                                      value={stepForm.delayHours}
                                      onChange={(e) => setStepForm({ ...stepForm, delayHours: parseInt(e.target.value) || 0 })}
                                      className="bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA]"
                                      data-testid="input-step-delay-hours"
                                    />
                                  </div>
                                </div>

                                {stepForm.stepType === 'email' && (
                                  <>
                                    <Separator className="bg-[#1E293B]" />
                                    
                                    <div className="flex items-center justify-between">
                                      <div className="space-y-1">
                                        <Label className="text-[#F8F9FA]">A/B Testing</Label>
                                        <p className="text-xs text-[#64748B]">Test different subject lines and content</p>
                                      </div>
                                      <Switch
                                        checked={stepForm.abTestEnabled}
                                        onCheckedChange={(checked) => setStepForm({ ...stepForm, abTestEnabled: checked })}
                                        data-testid="switch-ab-testing"
                                      />
                                    </div>

                                    {!stepForm.abTestEnabled ? (
                                      <>
                                        <div className="space-y-2">
                                          <Label className="text-[#94A3B8]">Subject Line</Label>
                                          <Input
                                            placeholder="Enter email subject..."
                                            value={stepForm.subject}
                                            onChange={(e) => setStepForm({ ...stepForm, subject: e.target.value })}
                                            className="bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA]"
                                            data-testid="input-step-subject"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-[#94A3B8]">Email Body</Label>
                                          <Textarea
                                            placeholder="Write your email content... Use {{firstName}}, {{company}} for personalization"
                                            value={stepForm.body}
                                            onChange={(e) => setStepForm({ ...stepForm, body: e.target.value })}
                                            className="bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA] min-h-[150px] resize-none"
                                            data-testid="input-step-body"
                                          />
                                        </div>
                                      </>
                                    ) : (
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-4 p-4 bg-[#1A1F3A] rounded-lg border border-[#1E293B]">
                                          <div className="flex items-center gap-2">
                                            <Badge className="bg-blue-500">A</Badge>
                                            <span className="text-sm font-medium text-[#F8F9FA]">Variant A</span>
                                          </div>
                                          <div className="space-y-2">
                                            <Label className="text-[#94A3B8] text-xs">Subject</Label>
                                            <Input
                                              placeholder="Subject A..."
                                              value={stepForm.variantA.subject}
                                              onChange={(e) => setStepForm({ 
                                                ...stepForm, 
                                                variantA: { ...stepForm.variantA, subject: e.target.value } 
                                              })}
                                              className="bg-[#11152B] border-[#1E293B] text-[#F8F9FA]"
                                              data-testid="input-variant-a-subject"
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label className="text-[#94A3B8] text-xs">Body</Label>
                                            <Textarea
                                              placeholder="Email content A..."
                                              value={stepForm.variantA.body}
                                              onChange={(e) => setStepForm({ 
                                                ...stepForm, 
                                                variantA: { ...stepForm.variantA, body: e.target.value } 
                                              })}
                                              className="bg-[#11152B] border-[#1E293B] text-[#F8F9FA] min-h-[100px] resize-none"
                                              data-testid="input-variant-a-body"
                                            />
                                          </div>
                                        </div>
                                        <div className="space-y-4 p-4 bg-[#1A1F3A] rounded-lg border border-[#1E293B]">
                                          <div className="flex items-center gap-2">
                                            <Badge className="bg-purple-500">B</Badge>
                                            <span className="text-sm font-medium text-[#F8F9FA]">Variant B</span>
                                          </div>
                                          <div className="space-y-2">
                                            <Label className="text-[#94A3B8] text-xs">Subject</Label>
                                            <Input
                                              placeholder="Subject B..."
                                              value={stepForm.variantB.subject}
                                              onChange={(e) => setStepForm({ 
                                                ...stepForm, 
                                                variantB: { ...stepForm.variantB, subject: e.target.value } 
                                              })}
                                              className="bg-[#11152B] border-[#1E293B] text-[#F8F9FA]"
                                              data-testid="input-variant-b-subject"
                                            />
                                          </div>
                                          <div className="space-y-2">
                                            <Label className="text-[#94A3B8] text-xs">Body</Label>
                                            <Textarea
                                              placeholder="Email content B..."
                                              value={stepForm.variantB.body}
                                              onChange={(e) => setStepForm({ 
                                                ...stepForm, 
                                                variantB: { ...stepForm.variantB, body: e.target.value } 
                                              })}
                                              className="bg-[#11152B] border-[#1E293B] text-[#F8F9FA] min-h-[100px] resize-none"
                                              data-testid="input-variant-b-body"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setShowStepDialog(false)}>Cancel</Button>
                                <Button 
                                  onClick={handleSaveStep}
                                  disabled={addStepMutation.isPending || updateStepMutation.isPending}
                                  className="bg-[#4C6EF5] hover:bg-[#3D5DDB]"
                                  data-testid="button-save-step"
                                >
                                  {(addStepMutation.isPending || updateStepMutation.isPending) && (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  )}
                                  {editingStep ? 'Update Step' : 'Add Step'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </CardHeader>
                        <CardContent>
                          {steps.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="w-12 h-12 rounded-full bg-[#1A1F3A] flex items-center justify-center mx-auto mb-4">
                                <ArrowRight className="w-6 h-6 text-[#64748B]" />
                              </div>
                              <p className="text-[#94A3B8]">No steps yet. Add your first step to get started.</p>
                            </div>
                          ) : (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={handleDragEnd}
                            >
                              <SortableContext
                                items={steps.map((s: SequenceStep) => s.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                {steps.map((step: SequenceStep) => (
                                  <SortableStep
                                    key={step.id}
                                    step={step}
                                    onEdit={handleEditStep}
                                    onDelete={(stepId) => deleteStepMutation.mutate(stepId)}
                                  />
                                ))}
                              </SortableContext>
                            </DndContext>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Quick Stats Sidebar */}
                    <div className="space-y-6">
                      <Card className="bg-[#11152B] border-[#1E293B]">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold text-[#F8F9FA]">Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[#94A3B8]">Total Steps</span>
                            <span className="text-[#F8F9FA] font-semibold">{steps.length}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#94A3B8]">Active Enrollments</span>
                            <span className="text-[#F8F9FA] font-semibold">
                              {currentSequence?.enrollments?.filter((e: any) => e.status === 'active').length || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#94A3B8]">Completed</span>
                            <span className="text-[#F8F9FA] font-semibold">
                              {currentSequence?.enrollments?.filter((e: any) => e.status === 'completed').length || 0}
                            </span>
                          </div>
                          <Separator className="bg-[#1E293B]" />
                          <div className="space-y-2">
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => pauseEnrollmentsMutation.mutate()}
                              disabled={pauseEnrollmentsMutation.isPending}
                              data-testid="button-pause-all"
                            >
                              <Pause className="w-4 h-4 mr-2" />
                              Pause All
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => resumeEnrollmentsMutation.mutate()}
                              disabled={resumeEnrollmentsMutation.isPending}
                              data-testid="button-resume-all"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Resume All
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-[#11152B] border-[#1E293B]">
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold text-[#F8F9FA]">Step Types</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {STEP_TYPES.map((type) => (
                            <div 
                              key={type.value}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1A1F3A] cursor-pointer"
                              onClick={() => {
                                setStepForm({ ...stepForm, stepType: type.value });
                                setShowStepDialog(true);
                              }}
                            >
                              <div className={`w-8 h-8 rounded-lg ${type.color} flex items-center justify-center`}>
                                <type.icon className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-sm text-[#F8F9FA]">{type.label}</span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              {stats && (
                <>
                  {/* Email Performance */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                      label="Emails Sent"
                      value={stats.emails?.sent || 0}
                      icon={Send}
                    />
                    <MetricCard
                      label="Open Rate"
                      value={`${stats.emails?.openRate || 0}%`}
                      subValue={`${stats.emails?.opened || 0} opened`}
                      icon={Eye}
                      trend="up"
                    />
                    <MetricCard
                      label="Click Rate"
                      value={`${stats.emails?.clickRate || 0}%`}
                      subValue={`${stats.emails?.clicked || 0} clicked`}
                      icon={MousePointer}
                    />
                    <MetricCard
                      label="Reply Rate"
                      value={`${stats.emails?.replyRate || 0}%`}
                      subValue={`${stats.emails?.replied || 0} replied`}
                      icon={Reply}
                      trend="up"
                    />
                  </div>

                  {/* Step Performance */}
                  <Card className="bg-[#11152B] border-[#1E293B]">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-[#F8F9FA]">Step Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {stats.stepPerformance?.map((step: any) => {
                          const stepType = STEP_TYPES.find(t => t.value === step.stepType);
                          const StepIcon = stepType?.icon || Mail;
                          
                          return (
                            <div key={step.stepId} className="flex items-center gap-4 p-4 bg-[#1A1F3A] rounded-lg">
                              <div className={`w-10 h-10 rounded-lg ${stepType?.color || 'bg-gray-500'} flex items-center justify-center`}>
                                <StepIcon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-[#F8F9FA]">
                                  Step {step.stepNumber}: {step.name || stepType?.label}
                                </p>
                                <p className="text-xs text-[#64748B]">{step.sent} sent</p>
                              </div>
                              <div className="grid grid-cols-3 gap-6 text-center">
                                <div>
                                  <p className="text-lg font-bold text-[#F8F9FA]">{step.openRate}%</p>
                                  <p className="text-xs text-[#64748B]">Opens</p>
                                </div>
                                <div>
                                  <p className="text-lg font-bold text-[#F8F9FA]">{step.clickRate}%</p>
                                  <p className="text-xs text-[#64748B]">Clicks</p>
                                </div>
                                <div>
                                  <p className="text-lg font-bold text-[#F8F9FA]">{step.replyRate}%</p>
                                  <p className="text-xs text-[#64748B]">Replies</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {(!stats.stepPerformance || stats.stepPerformance.length === 0) && (
                          <div className="text-center py-8 text-[#94A3B8]">
                            No step performance data yet
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Enrollments Tab */}
            <TabsContent value="enrollments" className="space-y-6">
              {currentSequence && (
                <>
                  {/* Enrollment Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {['total', 'active', 'paused', 'completed', 'bounced', 'replied', 'unsubscribed'].map((status) => (
                      <Card key={status} className="bg-[#11152B] border-[#1E293B]">
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-[#F8F9FA] tabular-nums">
                            {stats?.enrollments?.[status] || 0}
                          </p>
                          <p className="text-xs text-[#64748B] capitalize">{status}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Enrollments List */}
                  <Card className="bg-[#11152B] border-[#1E293B]">
                    <CardHeader className="flex flex-row items-center justify-between gap-2">
                      <CardTitle className="text-lg font-semibold text-[#F8F9FA]">
                        Enrolled Contacts
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => pauseEnrollmentsMutation.mutate()}
                          disabled={pauseEnrollmentsMutation.isPending}
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Pause All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resumeEnrollmentsMutation.mutate()}
                          disabled={resumeEnrollmentsMutation.isPending}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Resume All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        {currentSequence.enrollments?.length > 0 ? (
                          <div className="space-y-2">
                            {currentSequence.enrollments.map((enrollment: any) => (
                              <div 
                                key={enrollment.id}
                                className="flex items-center gap-4 p-4 bg-[#1A1F3A] rounded-lg"
                                data-testid={`enrollment-item-${enrollment.id}`}
                              >
                                <div className="w-10 h-10 rounded-full bg-[#4C6EF5] flex items-center justify-center text-white font-medium">
                                  {enrollment.contact?.firstName?.[0] || enrollment.contact?.email?.[0] || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-[#F8F9FA] truncate">
                                    {enrollment.contact?.firstName} {enrollment.contact?.lastName}
                                  </p>
                                  <p className="text-xs text-[#64748B] truncate">
                                    {enrollment.contact?.email}
                                  </p>
                                </div>
                                <div className="text-center">
                                  <p className="text-sm text-[#F8F9FA]">Step {enrollment.currentStepNumber}</p>
                                  <p className="text-xs text-[#64748B]">Current</p>
                                </div>
                                <Badge variant="outline" className={getStatusBadge(enrollment.status)}>
                                  {enrollment.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <Users className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                            <p className="text-[#94A3B8]">No contacts enrolled yet</p>
                            <p className="text-sm text-[#64748B] mt-1">
                              Enroll contacts from the Contacts page to start the sequence
                            </p>
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
