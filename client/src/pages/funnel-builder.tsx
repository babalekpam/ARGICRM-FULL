import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import Layout from "@/components/layout";
import Logo from "@/components/logo";
import LandingPageEditor from "@/components/landing-page-editor";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Sparkles,
  Plus, 
  Edit, 
  Trash2, 
  ArrowDown,
  Users,
  Target,
  DollarSign,
  CheckCircle,
  BarChart3,
  Facebook,
  Linkedin,
  Mail,
  FileText,
  Zap,
  TrendingUp,
  Loader2,
  ExternalLink,
  Globe,
  Send,
  Calendar,
  Clock,
  Copy,
  Download,
  Eye,
  Play,
  Pause,
  BarChart2,
  MousePointerClick,
  CheckCircle2
} from "lucide-react";

// Form validation schema
const generateFunnelSchema = z.object({
  offerName: z.string().min(3, "Offer name must be at least 3 characters"),
  offerDescription: z.string().min(10, "Offer description must be at least 10 characters"),
  targetAudience: z.string().optional(),
  pricePoint: z.string().optional(),
  industryType: z.enum(['ecommerce', 'saas', 'consulting', 'coaching', 'agency', 'local_business', 'other']).default('other'),
  funnelGoal: z.enum(['lead_generation', 'product_sales', 'appointment_booking', 'webinar_signup', 'demo_request']).default('lead_generation'),
});

type GenerateFunnelFormData = z.infer<typeof generateFunnelSchema>;

// Type definitions for API responses
interface FunnelProject {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface CompleteFunnel {
  funnel: FunnelProject;
  version: {
    id: string;
    versionNumber: number;
  };
  steps: Array<{
    id: string;
    name: string;
    stepType: string;
    orderIndex: number;
  }>;
  landingPage?: {
    id: string;
    headline: string;
    subheadline: string;
    heroContent: string;
    benefits: Array<{ title: string; description: string }>;
    testimonials: Array<{ quote: string; author: string; role: string }>;
    ctaText: string;
    faqs: Array<{ question: string; answer: string }>;
  };
  ads: Array<{
    id: string;
    platform: string;
    variantName: string;
    headline: string;
    bodyText: string;
    ctaText: string;
  }>;
  emails: Array<{
    id: string;
    sequenceName: string;
    subject: string;
    preheader: string;
    bodyHtml: string;
    ctaText: string;
    sequenceOrder: number;
    delayDays: number;
  }>;
  workflows: Array<{
    id: string;
    name: string;
    triggerType: string;
    actions: string[];
  }>;
  aiGeneration?: {
    id: string;
    provider: string;
    tokensUsed: number;
    durationMs: number;
  };
}

export default function FunnelBuilderPage() {
  const { toast } = useToast();
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [emailPreviewId, setEmailPreviewId] = useState<string | null>(null);
  
  // Utility: Copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };
  
  // Utility: Export as JSON
  const exportAsJSON = (data: any, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Exported!",
      description: `${filename} downloaded successfully`,
    });
  };

  // Form for AI generation
  const form = useForm<GenerateFunnelFormData>({
    resolver: zodResolver(generateFunnelSchema),
    defaultValues: {
      offerName: '',
      offerDescription: '',
      targetAudience: '',
      pricePoint: '',
      industryType: 'other',
      funnelGoal: 'lead_generation',
    },
  });

  // Fetch funnels list
  const { data: funnelsData, isLoading: isLoadingFunnels } = useQuery({
    queryKey: ['/api/funnels'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/funnels');
      return await response.json();
    },
  });

  // Fetch complete funnel details when selected
  const { data: selectedFunnelData, isLoading: isLoadingFunnelDetails } = useQuery({
    queryKey: ['/api/funnels', selectedFunnelId],
    enabled: !!selectedFunnelId,
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/funnels/${selectedFunnelId}`);
      return await response.json();
    },
  });

  // AI Generate funnel mutation
  const generateFunnelMutation = useMutation({
    mutationFn: async (data: GenerateFunnelFormData) => {
      const response = await apiRequest('POST', '/api/funnels/generate', data);
      return await response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/funnels'] });
      
      // Check if response has the expected structure
      if (!data || !data.funnel || !data.funnel.name) {
        console.error('Unexpected response structure:', data);
        toast({
          title: "Generation Completed",
          description: "Funnel generated, but response structure was unexpected. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "✨ Funnel Generated Successfully!",
        description: `Your funnel "${data.funnel.name}" has been created with AI-powered content.`,
      });
      setIsGenerateDialogOpen(false);
      form.reset();
      
      // Auto-select the newly created funnel
      if (data.funnel?.id) {
        setSelectedFunnelId(data.funnel.id);
      }
    },
    onError: (error: any) => {
      console.error('Funnel generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate funnel. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete funnel mutation
  const deleteFunnelMutation = useMutation({
    mutationFn: async (funnelId: string) => {
      return await apiRequest('DELETE', `/api/funnels/${funnelId}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/funnels'] });
      toast({
        title: "Funnel Deleted",
        description: "The funnel has been successfully deleted.",
      });
      if (selectedFunnelId) {
        setSelectedFunnelId(null);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete funnel.",
        variant: "destructive",
      });
    },
  });

  // Publish funnel mutation
  const publishFunnelMutation = useMutation({
    mutationFn: async (funnelId: string) => {
      return await apiRequest('POST', `/api/funnels/${funnelId}/publish`, {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/funnels'] });
      queryClient.invalidateQueries({ queryKey: ['/api/funnels', selectedFunnelId] });
      toast({
        title: "🚀 Funnel Published!",
        description: data?.publishedUrl ? `Your funnel is now live at: ${data.publishedUrl}` : "Your funnel has been published successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Publish Failed",
        description: error.message || "Failed to publish funnel.",
        variant: "destructive",
      });
    },
  });

  // Update workflow active state mutation
  const updateWorkflowMutation = useMutation({
    mutationFn: async ({ funnelId, workflowId, isActive }: { funnelId: string; workflowId: string; isActive: boolean }) => {
      return await apiRequest('PATCH', `/api/funnels/${funnelId}/workflows/${workflowId}`, { isActive });
    },
    onMutate: async ({ workflowId, isActive }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/funnels', selectedFunnelId] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['/api/funnels', selectedFunnelId]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['/api/funnels', selectedFunnelId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          workflows: old.workflows?.map((workflow: any) =>
            workflow.id === workflowId
              ? { ...workflow, isActive }
              : workflow
          ),
        };
      });
      
      // Return a context object with the snapshotted value
      return { previousData };
    },
    onError: (error: any, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        queryClient.setQueryData(['/api/funnels', selectedFunnelId], context.previousData);
      }
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update workflow status.",
        variant: "destructive",
      });
    },
    onSuccess: (data: any, { isActive }) => {
      toast({
        title: isActive ? "Workflow Activated" : "Workflow Deactivated",
        description: `The workflow is now ${isActive ? 'active' : 'inactive'}`,
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['/api/funnels', selectedFunnelId] });
    },
  });

  const handleGenerateFunnel = (data: GenerateFunnelFormData) => {
    generateFunnelMutation.mutate(data);
  };

  const handleDeleteFunnel = (funnelId: string, funnelName: string) => {
    if (confirm(`Are you sure you want to delete the funnel "${funnelName}"?`)) {
      deleteFunnelMutation.mutate(funnelId);
    }
  };

  const handlePublishFunnel = (funnelId: string) => {
    publishFunnelMutation.mutate(funnelId);
  };

  const funnels = funnelsData?.funnels || [];
  const selectedFunnel = selectedFunnelData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <Layout>
      <div className="space-y-6 relative z-50">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Logo size="md" />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                AI-Powered Funnel Builder
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Generate complete sales funnels with AI-powered landing pages, ads, and email sequences
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary" className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 text-orange-800 dark:text-orange-400 border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Powered
                </Badge>
                <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-800 dark:text-blue-400 border-0">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Smart Analytics
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Primary CTA - AI Generate Funnel */}
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                data-testid="button-ai-generate-funnel"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                AI Generate Funnel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center text-2xl">
                  <Sparkles className="h-6 w-6 mr-2 text-orange-600" />
                  Generate Funnel with AI
                </DialogTitle>
                <DialogDescription>
                  Provide details about your offer and let AI create a complete marketing funnel with landing pages, ad copy, and email sequences.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleGenerateFunnel)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="offerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offer Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Social Media Marketing Course" 
                            {...field} 
                            data-testid="input-offer-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="offerDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offer Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your offer in detail: what it includes, the value it provides, who it's for..."
                            rows={4}
                            {...field} 
                            data-testid="textarea-offer-description"
                          />
                        </FormControl>
                        <FormDescription>
                          Be specific - this helps AI create better content
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Audience</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Small business owners, entrepreneurs" 
                            {...field} 
                            data-testid="input-target-audience"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="funnelGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Main Goal *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-funnel-goal">
                                <SelectValue placeholder="Select goal" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="lead_generation">Lead Generation</SelectItem>
                              <SelectItem value="product_sales">Product Sales</SelectItem>
                              <SelectItem value="appointment_booking">Appointment Booking</SelectItem>
                              <SelectItem value="webinar_signup">Webinar Signup</SelectItem>
                              <SelectItem value="demo_request">Demo Request</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="industryType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-industry-type">
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ecommerce">E-commerce</SelectItem>
                              <SelectItem value="saas">SaaS</SelectItem>
                              <SelectItem value="consulting">Consulting</SelectItem>
                              <SelectItem value="coaching">Coaching</SelectItem>
                              <SelectItem value="agency">Agency</SelectItem>
                              <SelectItem value="local_business">Local Business</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="pricePoint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Point (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., $497, Free, $29/month" 
                            {...field} 
                            data-testid="input-price-point"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsGenerateDialogOpen(false)}
                      disabled={generateFunnelMutation.isPending}
                      data-testid="button-cancel-generate"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={generateFunnelMutation.isPending}
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                      data-testid="button-submit-generate"
                    >
                      {generateFunnelMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Funnel
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Funnel List Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Your Funnels</span>
                  <Badge variant="secondary" data-testid="badge-funnel-count">
                    {funnels.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px] overflow-y-auto">
                  <div className="space-y-1 p-4">
                    {isLoadingFunnels ? (
                      <>
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-4 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                          </div>
                        ))}
                      </>
                    ) : funnels.length === 0 ? (
                      <div className="text-center py-12 px-4" data-testid="empty-state-funnels">
                        <Target className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
                        <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">No funnels yet</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Click "AI Generate Funnel" to create your first conversion funnel
                        </p>
                      </div>
                    ) : (
                      funnels.map((funnel: FunnelProject) => (
                        <div
                          key={funnel.id}
                          onClick={() => {
                            console.log('Clicked funnel:', funnel.id, funnel.name);
                            setSelectedFunnelId(funnel.id);
                          }}
                          className={`p-4 cursor-pointer rounded-lg transition-colors ${
                            selectedFunnelId === funnel.id 
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                          data-testid={`funnel-item-${funnel.id}`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium text-sm line-clamp-2">{funnel.name}</span>
                              <Badge 
                                className={getStatusColor(funnel.status)} 
                                variant="secondary"
                                data-testid={`badge-status-${funnel.id}`}
                              >
                                {funnel.status}
                              </Badge>
                            </div>
                            {funnel.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                {funnel.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-2 pt-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFunnel(funnel.id, funnel.name);
                                }}
                                className="h-7 px-2 text-red-600 hover:text-red-700 dark:text-red-400"
                                disabled={deleteFunnelMutation.isPending}
                                data-testid={`button-delete-${funnel.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Funnel Details - Main Content Area */}
          <div className="lg:col-span-3">
            {!selectedFunnelId ? (
              <Card className="h-full min-h-[600px]">
                <CardContent className="flex flex-col items-center justify-center h-full py-12">
                  <div className="text-center max-w-md" data-testid="empty-state-no-selection">
                    <div className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-full p-6 mx-auto mb-6 w-24 h-24 flex items-center justify-center">
                      <Sparkles className="h-12 w-12 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Ready to Build Your Funnel?</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Use AI to generate complete marketing funnels with landing pages, ad copy, and email sequences in seconds.
                    </p>
                    <Button 
                      size="lg"
                      onClick={() => setIsGenerateDialogOpen(true)}
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                      data-testid="button-get-started-generate"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Get Started with AI
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : isLoadingFunnelDetails ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-8 w-2/3" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-48 w-full" />
                </CardContent>
              </Card>
            ) : selectedFunnel ? (
              <div className="space-y-6">
                {/* Funnel Header */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="flex items-center text-2xl">
                          <Target className="h-6 w-6 mr-2 text-orange-600" />
                          {selectedFunnel.funnel.name}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {selectedFunnel.funnel.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={getStatusColor(selectedFunnel.funnel.status)} 
                          variant="secondary"
                          data-testid="badge-selected-funnel-status"
                        >
                          {selectedFunnel.funnel.status}
                        </Badge>
                        <Button
                          variant="default"
                          onClick={() => handlePublishFunnel(selectedFunnel.funnel.id)}
                          disabled={publishFunnelMutation.isPending || selectedFunnel.funnel.status === 'active'}
                          data-testid="button-publish-funnel"
                        >
                          {publishFunnelMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <Globe className="h-4 w-4 mr-2" />
                              {selectedFunnel.funnel.status === 'active' ? 'Published' : 'Publish'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {selectedFunnel.aiGeneration && (
                    <CardContent>
                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-orange-600" />
                          <span>AI Provider: {selectedFunnel.aiGeneration.provider}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          <span>Tokens: {selectedFunnel.aiGeneration.tokensUsed.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Generated in {(selectedFunnel.aiGeneration.durationMs / 1000).toFixed(1)}s</span>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* Tabbed Content */}
                <Tabs defaultValue="landing" className="w-full">
                  <TabsList className="grid w-full grid-cols-4" data-testid="tabs-funnel-content">
                    <TabsTrigger value="landing" data-testid="tab-landing-page">
                      <FileText className="h-4 w-4 mr-2" />
                      Landing Page
                    </TabsTrigger>
                    <TabsTrigger value="ads" data-testid="tab-ads">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Ad Copy
                    </TabsTrigger>
                    <TabsTrigger value="emails" data-testid="tab-emails">
                      <Mail className="h-4 w-4 mr-2" />
                      Emails
                    </TabsTrigger>
                    <TabsTrigger value="automations" data-testid="tab-automations">
                      <Zap className="h-4 w-4 mr-2" />
                      Automations
                    </TabsTrigger>
                  </TabsList>

                  {/* Landing Page Tab */}
                  <TabsContent value="landing" className="space-y-4">
                    {selectedFunnel.landingPage ? (
                      <LandingPageEditor
                        landingPage={selectedFunnel.landingPage}
                        funnelId={selectedFunnel.funnel.id}
                      />
                    ) : (
                      <Card>
                        <CardContent className="py-12 text-center" data-testid="empty-state-landing-page">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600 dark:text-gray-400">No landing page content available</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Ads Tab */}
                  <TabsContent value="ads" className="space-y-4">
                    {selectedFunnel.ads && selectedFunnel.ads.length > 0 ? (
                      <>
                        {['facebook', 'google', 'linkedin'].map((platform) => {
                          const platformAds = selectedFunnel.ads.filter((ad: any) => ad.platform === platform);
                          if (platformAds.length === 0) return null;

                          const getPlatformIcon = (platform: string) => {
                            switch (platform) {
                              case 'facebook': return <Facebook className="h-5 w-5" />;
                              case 'linkedin': return <Linkedin className="h-5 w-5" />;
                              default: return <TrendingUp className="h-5 w-5" />;
                            }
                          };

                          return (
                            <Card key={platform} data-testid={`card-ads-${platform}`}>
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle className="flex items-center capitalize">
                                    {getPlatformIcon(platform)}
                                    <span className="ml-2">{platform} Ads</span>
                                    <Badge className="ml-2" variant="secondary">{platformAds.length} variants</Badge>
                                  </CardTitle>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => exportAsJSON(platformAds, `${platform}-ads-${selectedFunnel.funnel.name}.json`)}
                                    data-testid={`button-export-${platform}-ads`}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {platformAds.map((ad: any, idx: number) => (
                                  <div 
                                    key={ad.id} 
                                    className="p-4 border rounded-lg space-y-3 bg-gray-50 dark:bg-gray-900"
                                    data-testid={`ad-variant-${platform}-${idx}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <Badge variant="outline">{ad.variantName}</Badge>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => copyToClipboard(
                                          `Headline: ${ad.headline}\n\nBody: ${ad.bodyText}\n\nCTA: ${ad.ctaText}`,
                                          'Ad copy'
                                        )}
                                        data-testid={`button-copy-ad-${idx}`}
                                      >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy All
                                      </Button>
                                    </div>
                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Headline</h4>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => copyToClipboard(ad.headline, 'Headline')}
                                          data-testid={`button-copy-headline-${platform}-${idx}`}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      <p className="font-semibold">{ad.headline}</p>
                                    </div>
                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Body</h4>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => copyToClipboard(ad.bodyText, 'Body text')}
                                          data-testid={`button-copy-body-${platform}-${idx}`}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      <p className="text-sm text-gray-700 dark:text-gray-300">{ad.bodyText}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div>
                                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">CTA</h4>
                                          <Badge variant="default">{ad.ctaText}</Badge>
                                        </div>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => copyToClipboard(ad.ctaText, 'CTA text')}
                                          data-testid={`button-copy-cta-${platform}-${idx}`}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      <div className="flex gap-2 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                          <MousePointerClick className="h-3 w-3" />
                                          <span>0 clicks</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Eye className="h-3 w-3" />
                                          <span>0 views</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </>
                    ) : (
                      <Card>
                        <CardContent className="py-12 text-center" data-testid="empty-state-ads">
                          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600 dark:text-gray-400">No ad copy available</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Emails Tab */}
                  <TabsContent value="emails" className="space-y-4">
                    {selectedFunnel.emails && selectedFunnel.emails.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedFunnel.emails.length} email sequence{selectedFunnel.emails.length !== 1 ? 's' : ''}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => exportAsJSON(selectedFunnel.emails, `email-sequences-${selectedFunnel.funnel.name}.json`)}
                            data-testid="button-export-all-emails"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export All
                          </Button>
                        </div>
                        <div className="space-y-4" data-testid="list-email-sequences">
                          {selectedFunnel.emails
                            .sort((a: any, b: any) => a.sequenceOrder - b.sequenceOrder)
                            .map((email: any, idx: number) => (
                              <Card key={email.id} data-testid={`card-email-${idx}`}>
                                <CardHeader>
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center">
                                      <Mail className="h-5 w-5 mr-2 text-blue-600" />
                                      {email.sequenceName}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">Day {email.delayDays}</Badge>
                                      <Badge variant="secondary">Email #{email.sequenceOrder}</Badge>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Subject Line</h4>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => copyToClipboard(email.subject, 'Subject line')}
                                        data-testid={`button-copy-subject-${idx}`}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <p className="font-semibold">{email.subject}</p>
                                  </div>
                                  {email.preheader && (
                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Preview Text</h4>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => copyToClipboard(email.preheader, 'Preview text')}
                                          data-testid={`button-copy-preheader-${idx}`}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">{email.preheader}</p>
                                    </div>
                                  )}
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Content</h4>
                                      <div className="flex gap-2">
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => setEmailPreviewId(email.id)}
                                          data-testid={`button-preview-email-${idx}`}
                                        >
                                          <Eye className="h-3 w-3 mr-1" />
                                          Preview
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => copyToClipboard(email.bodyHtml, 'Email content')}
                                          data-testid={`button-copy-body-${idx}`}
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    <div 
                                      className="prose prose-sm dark:prose-invert max-w-none p-4 bg-gray-50 dark:bg-gray-900 rounded-lg max-h-40 overflow-hidden relative"
                                      dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                                      data-testid={`email-body-${idx}`}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between pt-2 border-t">
                                    {email.ctaText && (
                                      <div>
                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Call to Action</h4>
                                        <Badge variant="default">{email.ctaText}</Badge>
                                      </div>
                                    )}
                                    <div className="flex gap-3 text-xs text-gray-500">
                                      <div className="flex items-center gap-1">
                                        <Send className="h-3 w-3" />
                                        <span>0 sent</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Eye className="h-3 w-3" />
                                        <span>0% open rate</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <MousePointerClick className="h-3 w-3" />
                                        <span>0% click rate</span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </>
                    ) : (
                      <Card>
                        <CardContent className="py-12 text-center" data-testid="empty-state-emails">
                          <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600 dark:text-gray-400">No email sequences available</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Automations Tab */}
                  <TabsContent value="automations" className="space-y-4">
                    {selectedFunnel.workflows && selectedFunnel.workflows.length > 0 ? (
                      <div className="space-y-4" data-testid="list-workflows">
                        {selectedFunnel.workflows.map((workflow: any, idx: number) => (
                          <Card key={workflow.id} data-testid={`card-workflow-${idx}`} className="relative">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center">
                                  <Zap className="h-5 w-5 mr-2 text-purple-600" />
                                  {workflow.name}
                                </CardTitle>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {workflow.isActive !== false ? 'Active' : 'Inactive'}
                                    </span>
                                    <Switch 
                                      checked={workflow.isActive !== false}
                                      onCheckedChange={(checked) => {
                                        updateWorkflowMutation.mutate({
                                          funnelId: selectedFunnel.funnel.id,
                                          workflowId: workflow.id,
                                          isActive: checked,
                                        });
                                      }}
                                      disabled={updateWorkflowMutation.isPending}
                                      data-testid={`switch-workflow-active-${idx}`}
                                    />
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => exportAsJSON(workflow, `workflow-${workflow.name}.json`)}
                                    data-testid={`button-export-workflow-${idx}`}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Trigger Event</h4>
                                  <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <Play className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-medium capitalize">
                                      {workflow.triggerType.replace('_', ' ')}
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Actions ({workflow.actions.length})</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {workflow.actions.slice(0, 3).map((action: string, actionIdx: number) => (
                                      <Badge key={actionIdx} variant="secondary" className="capitalize">
                                        {action.replace('_', ' ')}
                                      </Badge>
                                    ))}
                                    {workflow.actions.length > 3 && (
                                      <Badge variant="outline">+{workflow.actions.length - 3} more</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Separator />
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex gap-4">
                                  <div className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>0 completed</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <BarChart2 className="h-3 w-3" />
                                    <span>0% success rate</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>Last run: Never</span>
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    toast({
                                      title: "Workflow Details",
                                      description: "Full workflow visualization coming soon",
                                    });
                                  }}
                                  data-testid={`button-view-workflow-${idx}`}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Flow
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="py-12 text-center" data-testid="empty-state-automations">
                          <Zap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600 dark:text-gray-400">No automation workflows available</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : null}
          </div>
        </div>

        {/* Email Preview Dialog */}
        <Dialog open={!!emailPreviewId} onOpenChange={(open) => !open && setEmailPreviewId(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="dialog-email-preview">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl">
                <Mail className="h-5 w-5 mr-2 text-blue-600" />
                Email Preview
              </DialogTitle>
              <DialogDescription>
                Full preview of the email content
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[70vh] w-full rounded-md border p-6">
              {selectedFunnel?.emails?.find((email: any) => email.id === emailPreviewId) && (
                <div className="space-y-4" data-testid="email-preview-content">
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold mb-2">
                      {selectedFunnel.emails.find((email: any) => email.id === emailPreviewId).subject}
                    </h3>
                    {selectedFunnel.emails.find((email: any) => email.id === emailPreviewId).preheader && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedFunnel.emails.find((email: any) => email.id === emailPreviewId).preheader}
                      </p>
                    )}
                  </div>
                  <div 
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: selectedFunnel.emails.find((email: any) => email.id === emailPreviewId).bodyHtml 
                    }}
                    data-testid="email-preview-body"
                  />
                </div>
              )}
            </ScrollArea>
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                variant="outline"
                onClick={() => setEmailPreviewId(null)}
                data-testid="button-close-preview"
              >
                Close
              </Button>
              {selectedFunnel?.emails?.find((email: any) => email.id === emailPreviewId) && (
                <Button 
                  onClick={() => {
                    const email = selectedFunnel.emails.find((email: any) => email.id === emailPreviewId);
                    copyToClipboard(email.bodyHtml, 'Email content');
                  }}
                  data-testid="button-copy-preview"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy HTML
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
