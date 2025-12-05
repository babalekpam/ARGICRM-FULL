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
import { insertFunnelAdSchema, insertFunnelEmailSchema, insertAutomationWorkflowSchema } from "@shared/schema";
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
  CheckCircle2,
  X
} from "lucide-react";

const generateFunnelSchema = z.object({
  offerName: z.string().min(3, "Offer name must be at least 3 characters"),
  offerDescription: z.string().min(10, "Offer description must be at least 10 characters"),
  targetAudience: z.string().optional(),
  pricePoint: z.string().optional(),
  industryType: z.enum(['ecommerce', 'saas', 'consulting', 'coaching', 'agency', 'local_business', 'other']).default('other'),
  funnelGoal: z.enum(['lead_generation', 'product_sales', 'appointment_booking', 'webinar_signup', 'demo_request']).default('lead_generation'),
  websiteUrl: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
});

type GenerateFunnelFormData = z.infer<typeof generateFunnelSchema>;

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
    subjectLine: string;
    previewText: string;
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
  
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
  
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

  const form = useForm<GenerateFunnelFormData>({
    resolver: zodResolver(generateFunnelSchema),
    defaultValues: {
      offerName: '',
      offerDescription: '',
      targetAudience: '',
      pricePoint: '',
      industryType: 'other',
      funnelGoal: 'lead_generation',
      websiteUrl: '',
    },
  });

  const { data: funnelsData, isLoading: isLoadingFunnels } = useQuery({
    queryKey: ['/api/funnels'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/funnels');
      return await response.json();
    },
  });

  const { data: selectedFunnelData, isLoading: isLoadingFunnelDetails } = useQuery({
    queryKey: ['/api/funnels', selectedFunnelId],
    enabled: !!selectedFunnelId,
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/funnels/${selectedFunnelId}`);
      return await response.json();
    },
  });

  const generateFunnelMutation = useMutation({
    mutationFn: async (data: GenerateFunnelFormData) => {
      const response = await apiRequest('POST', '/api/funnels/generate', data);
      return await response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/funnels'] });
      
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
        title: "Funnel Generated Successfully!",
        description: `Your funnel "${data.funnel.name}" has been created with AI-powered content.`,
      });
      setIsGenerateDialogOpen(false);
      form.reset();
      
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

  const publishFunnelMutation = useMutation({
    mutationFn: async (funnelId: string) => {
      return await apiRequest('POST', `/api/funnels/${funnelId}/publish`, {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/funnels'] });
      queryClient.invalidateQueries({ queryKey: ['/api/funnels', selectedFunnelId] });
      toast({
        title: "Funnel Published!",
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

  const updateWorkflowMutation = useMutation({
    mutationFn: async ({ funnelId, workflowId, isActive }: { funnelId: string; workflowId: string; isActive: boolean }) => {
      return await apiRequest('PATCH', `/api/funnels/${funnelId}/workflows/${workflowId}`, { isActive });
    },
    onMutate: async ({ workflowId, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/funnels', selectedFunnelId] });
      
      const previousData = queryClient.getQueryData(['/api/funnels', selectedFunnelId]);
      
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
      
      return { previousData };
    },
    onError: (error: any, variables, context) => {
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
      queryClient.invalidateQueries({ queryKey: ['/api/funnels', selectedFunnelId] });
    },
  });

  const updateAdMutation = useMutation({
    mutationFn: async ({ funnelId, adId, data }: { funnelId: string; adId: string; data: any }) => {
      const response = await apiRequest('PATCH', `/api/funnels/${funnelId}/ads/${adId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/funnels', selectedFunnelId] });
      setEditingAdId(null);
      toast({
        title: "Ad Updated",
        description: "Your changes have been saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update ad.",
        variant: "destructive",
      });
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: async ({ funnelId, emailId, data }: { funnelId: string; emailId: string; data: any }) => {
      const response = await apiRequest('PATCH', `/api/funnels/${funnelId}/emails/${emailId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/funnels', selectedFunnelId] });
      setEditingEmailId(null);
      toast({
        title: "Email Updated",
        description: "Your changes have been saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update email.",
        variant: "destructive",
      });
    },
  });

  const updateWorkflowFullMutation = useMutation({
    mutationFn: async ({ funnelId, workflowId, data }: { funnelId: string; workflowId: string; data: any }) => {
      const response = await apiRequest('PATCH', `/api/funnels/${funnelId}/workflows/${workflowId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/funnels', selectedFunnelId] });
      setEditingWorkflowId(null);
      toast({
        title: "Workflow Updated",
        description: "Your changes have been saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update workflow.",
        variant: "destructive",
      });
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
      case 'active': return 'bg-green-500/20 text-green-400 border-0';
      case 'draft': return 'bg-[hsl(229,41%,16%)] text-[hsl(215,20%,65%)] border-0';
      case 'paused': return 'bg-yellow-500/20 text-yellow-400 border-0';
      default: return 'bg-[hsl(229,41%,16%)] text-[hsl(215,20%,65%)] border-0';
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[hsl(228,47%,8%)] space-y-6 relative z-50 p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Logo size="md" />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-[hsl(210,17%,98%)] tracking-tight">
                AI-Powered Funnel Builder
              </h1>
              <p className="text-sm text-[hsl(215,20%,65%)]">
                Generate complete sales funnels with AI-powered landing pages, ads, and email sequences
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI-Powered
                </Badge>
                <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Smart Analytics
                </Badge>
              </div>
            </div>
          </div>
          
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
                data-testid="button-ai-generate-funnel"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                AI Generate Funnel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)]">
              <DialogHeader>
                <DialogTitle className="flex items-center text-2xl text-[hsl(210,17%,98%)]">
                  <Sparkles className="h-6 w-6 mr-2 text-[hsl(227,89%,63%)]" />
                  Generate Funnel with AI
                </DialogTitle>
                <DialogDescription className="text-[hsl(215,20%,65%)]">
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
                        <FormLabel className="text-[hsl(215,20%,65%)]">Offer Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Social Media Marketing Course" 
                            className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)]"
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
                        <FormLabel className="text-[hsl(215,20%,65%)]">Offer Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your offer in detail: what it includes, the value it provides, who it's for..."
                            rows={4}
                            className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)]"
                            {...field} 
                            data-testid="textarea-offer-description"
                          />
                        </FormControl>
                        <FormDescription className="text-[hsl(215,16%,47%)]">
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
                        <FormLabel className="text-[hsl(215,20%,65%)]">Target Audience</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Small business owners, entrepreneurs" 
                            className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)]"
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
                          <FormLabel className="text-[hsl(215,20%,65%)]">Main Goal *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]" data-testid="select-funnel-goal">
                                <SelectValue placeholder="Select goal" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)]">
                              <SelectItem value="lead_generation" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Lead Generation</SelectItem>
                              <SelectItem value="product_sales" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Product Sales</SelectItem>
                              <SelectItem value="appointment_booking" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Appointment Booking</SelectItem>
                              <SelectItem value="webinar_signup" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Webinar Signup</SelectItem>
                              <SelectItem value="demo_request" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Demo Request</SelectItem>
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
                          <FormLabel className="text-[hsl(215,20%,65%)]">Industry Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]" data-testid="select-industry-type">
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)]">
                              <SelectItem value="ecommerce" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">E-commerce</SelectItem>
                              <SelectItem value="saas" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">SaaS</SelectItem>
                              <SelectItem value="consulting" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Consulting</SelectItem>
                              <SelectItem value="coaching" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Coaching</SelectItem>
                              <SelectItem value="agency" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Agency</SelectItem>
                              <SelectItem value="local_business" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Local Business</SelectItem>
                              <SelectItem value="other" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Other</SelectItem>
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
                        <FormLabel className="text-[hsl(215,20%,65%)]">Price Point (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., $497, Free, $29/month" 
                            className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)]"
                            {...field} 
                            data-testid="input-price-point"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="websiteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-[hsl(215,20%,65%)]">
                          <Globe className="h-4 w-4" />
                          Website URL (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="url"
                            placeholder="https://yourbusiness.com (optional)" 
                            className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)]"
                            {...field} 
                            data-testid="input-website-url"
                          />
                        </FormControl>
                        <FormDescription className="text-[hsl(215,16%,47%)]">
                          We'll extract professional images from your website
                        </FormDescription>
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
                      className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                      data-testid="button-cancel-generate"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={generateFunnelMutation.isPending}
                      className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg font-semibold text-[hsl(210,17%,98%)]">
                  <span>Your Funnels</span>
                  <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0" data-testid="badge-funnel-count">
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
                            <Skeleton className="h-4 w-full bg-[hsl(229,41%,16%)]" />
                            <Skeleton className="h-3 w-2/3 bg-[hsl(229,41%,16%)]" />
                          </div>
                        ))}
                      </>
                    ) : funnels.length === 0 ? (
                      <div className="text-center py-12 px-4" data-testid="empty-state-funnels">
                        <Target className="h-16 w-16 mx-auto mb-4 text-[hsl(215,16%,47%)] opacity-50" />
                        <p className="text-[hsl(210,17%,98%)] font-medium mb-2">No funnels yet</p>
                        <p className="text-sm text-[hsl(215,20%,65%)]">
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
                              ? 'bg-[hsl(227,89%,63%)]/20 border-l-4 border-l-[hsl(227,89%,63%)]' 
                              : 'hover:bg-[hsl(229,41%,16%)]'
                          }`}
                          data-testid={`funnel-item-${funnel.id}`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium text-sm text-[hsl(210,17%,98%)] line-clamp-2">{funnel.name}</span>
                              <Badge 
                                className={getStatusColor(funnel.status)} 
                                data-testid={`badge-status-${funnel.id}`}
                              >
                                {funnel.status}
                              </Badge>
                            </div>
                            {funnel.description && (
                              <p className="text-xs text-[hsl(215,20%,65%)] line-clamp-2">
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
                                className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/20"
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

          <div className="lg:col-span-3">
            {!selectedFunnelId ? (
              <Card className="h-full min-h-[600px] bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                <CardContent className="flex flex-col items-center justify-center h-full py-12">
                  <div className="text-center max-w-md" data-testid="empty-state-no-selection">
                    <div className="bg-[hsl(227,89%,63%)]/20 rounded-full p-6 mx-auto mb-6 w-24 h-24 flex items-center justify-center">
                      <Sparkles className="h-12 w-12 text-[hsl(227,89%,63%)]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[hsl(210,17%,98%)] mb-3">Ready to Build Your Funnel?</h3>
                    <p className="text-[hsl(215,20%,65%)] mb-6">
                      Use AI to generate complete marketing funnels with landing pages, ad copy, and email sequences in seconds.
                    </p>
                    <Button 
                      size="lg"
                      onClick={() => setIsGenerateDialogOpen(true)}
                      className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
                      data-testid="button-get-started-generate"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Get Started with AI
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : isLoadingFunnelDetails ? (
              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                <CardHeader>
                  <Skeleton className="h-8 w-2/3 bg-[hsl(229,41%,16%)]" />
                  <Skeleton className="h-4 w-full mt-2 bg-[hsl(229,41%,16%)]" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-32 w-full bg-[hsl(229,41%,16%)]" />
                  <Skeleton className="h-48 w-full bg-[hsl(229,41%,16%)]" />
                </CardContent>
              </Card>
            ) : selectedFunnel ? (
              <div className="space-y-6">
                <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                  <CardHeader>
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="flex items-center text-2xl text-[hsl(210,17%,98%)]">
                          <Target className="h-6 w-6 mr-2 text-[hsl(227,89%,63%)]" />
                          {selectedFunnel.funnel.name}
                        </CardTitle>
                        <CardDescription className="mt-2 text-[hsl(215,20%,65%)]">
                          {selectedFunnel.funnel.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={getStatusColor(selectedFunnel.funnel.status)} 
                          data-testid="badge-selected-funnel-status"
                        >
                          {selectedFunnel.funnel.status}
                        </Badge>
                        <Button
                          onClick={() => handlePublishFunnel(selectedFunnel.funnel.id)}
                          disabled={publishFunnelMutation.isPending || selectedFunnel.funnel.status === 'active'}
                          className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
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
                      <div className="flex items-center gap-6 text-sm text-[hsl(215,20%,65%)]">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-[hsl(227,89%,63%)]" />
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

                <Tabs defaultValue="landing" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-[hsl(229,41%,16%)] border border-[hsl(217,33%,17%)] p-1" data-testid="tabs-funnel-content">
                    <TabsTrigger value="landing" className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" data-testid="tab-landing-page">
                      <FileText className="h-4 w-4 mr-2" />
                      Landing Page
                    </TabsTrigger>
                    <TabsTrigger value="ads" className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" data-testid="tab-ads">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Ad Copy
                    </TabsTrigger>
                    <TabsTrigger value="emails" className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" data-testid="tab-emails">
                      <Mail className="h-4 w-4 mr-2" />
                      Emails
                    </TabsTrigger>
                    <TabsTrigger value="automations" className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" data-testid="tab-automations">
                      <Zap className="h-4 w-4 mr-2" />
                      Automations
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="landing" className="space-y-4">
                    {selectedFunnel.landingPage ? (
                      <LandingPageEditor
                        landingPage={selectedFunnel.landingPage}
                        funnelId={selectedFunnel.funnel.id}
                      />
                    ) : (
                      <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                        <CardContent className="py-12 text-center" data-testid="empty-state-landing-page">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-[hsl(215,16%,47%)]" />
                          <p className="text-[hsl(215,20%,65%)]">No landing page content available</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

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
                            <Card key={platform} className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg" data-testid={`card-ads-${platform}`}>
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle className="flex items-center capitalize text-lg font-semibold text-[hsl(210,17%,98%)]">
                                    {getPlatformIcon(platform)}
                                    <span className="ml-2">{platform} Ads</span>
                                    <Badge className="ml-2 bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0">{platformAds.length} variants</Badge>
                                  </CardTitle>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => exportAsJSON(platformAds, `${platform}-ads-${selectedFunnel.funnel.name}.json`)}
                                    className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                                    data-testid={`button-export-${platform}-ads`}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {platformAds.map((ad: any, idx: number) => {
                                  const AdEditForm = () => {
                                    const adForm = useForm({
                                      resolver: zodResolver(insertFunnelAdSchema.partial()),
                                      defaultValues: {
                                        headline: ad.headline || '',
                                        bodyText: ad.bodyText || '',
                                        ctaText: ad.ctaText || '',
                                      },
                                    });

                                    const handleSaveAd = (data: any) => {
                                      updateAdMutation.mutate({
                                        funnelId: selectedFunnel.funnel.id,
                                        adId: ad.id,
                                        data,
                                      });
                                    };

                                    const handleCancelEdit = () => {
                                      adForm.reset();
                                      setEditingAdId(null);
                                    };

                                    return (
                                      <Form {...adForm}>
                                        <form onSubmit={adForm.handleSubmit(handleSaveAd)} className="space-y-4">
                                          <FormField
                                            control={adForm.control}
                                            name="headline"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel className="text-[hsl(215,20%,65%)]">Headline</FormLabel>
                                                <FormControl>
                                                  <Input 
                                                    className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)]"
                                                    {...field} 
                                                    data-testid={`input-ad-headline-${idx}`}
                                                  />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          <FormField
                                            control={adForm.control}
                                            name="bodyText"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel className="text-[hsl(215,20%,65%)]">Body Text</FormLabel>
                                                <FormControl>
                                                  <Textarea 
                                                    className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)]"
                                                    {...field} 
                                                    rows={4}
                                                    data-testid={`textarea-ad-body-${idx}`}
                                                  />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          <FormField
                                            control={adForm.control}
                                            name="ctaText"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel className="text-[hsl(215,20%,65%)]">Call to Action</FormLabel>
                                                <FormControl>
                                                  <Input 
                                                    className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)]"
                                                    {...field} 
                                                    data-testid={`input-ad-cta-${idx}`}
                                                  />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />
                                          <div className="flex gap-2 justify-end pt-4">
                                            <Button
                                              type="button"
                                              variant="outline"
                                              onClick={handleCancelEdit}
                                              disabled={updateAdMutation.isPending}
                                              className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                                              data-testid={`button-cancel-ad-${idx}`}
                                            >
                                              <X className="h-4 w-4 mr-2" />
                                              Cancel
                                            </Button>
                                            <Button
                                              type="submit"
                                              disabled={updateAdMutation.isPending}
                                              className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
                                              data-testid={`button-save-ad-${idx}`}
                                            >
                                              {updateAdMutation.isPending ? (
                                                <>
                                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                  Saving...
                                                </>
                                              ) : (
                                                <>
                                                  <CheckCircle className="h-4 w-4 mr-2" />
                                                  Save Changes
                                                </>
                                              )}
                                            </Button>
                                          </div>
                                        </form>
                                      </Form>
                                    );
                                  };

                                  return (
                                    <div 
                                      key={ad.id} 
                                      className="p-4 border border-[hsl(217,33%,17%)] rounded-lg space-y-3 bg-[hsl(229,41%,16%)]"
                                      data-testid={`ad-variant-${platform}-${idx}`}
                                    >
                                      {editingAdId === ad.id ? (
                                        <AdEditForm />
                                      ) : (
                                        <>
                                          <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)]">{ad.variantName}</Badge>
                                            <div className="flex gap-2">
                                              <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => setEditingAdId(ad.id)}
                                                className="text-[hsl(215,20%,65%)] hover:text-[hsl(210,17%,98%)] hover:bg-[hsl(229,41%,16%)]"
                                                data-testid={`button-edit-ad-${idx}`}
                                              >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                              </Button>
                                              <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => copyToClipboard(
                                                  `Headline: ${ad.headline}\n\nBody: ${ad.bodyText}\n\nCTA: ${ad.ctaText}`,
                                                  'Ad copy'
                                                )}
                                                className="text-[hsl(215,20%,65%)] hover:text-[hsl(210,17%,98%)] hover:bg-[hsl(229,41%,16%)]"
                                                data-testid={`button-copy-ad-${idx}`}
                                              >
                                                <Copy className="h-4 w-4 mr-2" />
                                                Copy All
                                              </Button>
                                            </div>
                                          </div>
                                          <div>
                                            <div className="flex items-center justify-between mb-1">
                                              <h4 className="text-sm font-medium text-[hsl(215,16%,47%)]">Headline</h4>
                                              <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => copyToClipboard(ad.headline, 'Headline')}
                                                className="text-[hsl(215,20%,65%)] hover:text-[hsl(210,17%,98%)] hover:bg-[hsl(229,41%,16%)]"
                                                data-testid={`button-copy-headline-${platform}-${idx}`}
                                              >
                                                <Copy className="h-3 w-3" />
                                              </Button>
                                            </div>
                                            <p className="font-semibold text-[hsl(210,17%,98%)]">{ad.headline}</p>
                                          </div>
                                          <div>
                                            <div className="flex items-center justify-between mb-1">
                                              <h4 className="text-sm font-medium text-[hsl(215,16%,47%)]">Body</h4>
                                              <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => copyToClipboard(ad.bodyText, 'Body text')}
                                                className="text-[hsl(215,20%,65%)] hover:text-[hsl(210,17%,98%)] hover:bg-[hsl(229,41%,16%)]"
                                                data-testid={`button-copy-body-${platform}-${idx}`}
                                              >
                                                <Copy className="h-3 w-3" />
                                              </Button>
                                            </div>
                                            <p className="text-sm text-[hsl(215,20%,65%)]">{ad.bodyText}</p>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <div>
                                                <h4 className="text-sm font-medium text-[hsl(215,16%,47%)] mb-1">CTA</h4>
                                                <Badge className="bg-[hsl(227,89%,63%)] text-white border-0">{ad.ctaText}</Badge>
                                              </div>
                                              <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => copyToClipboard(ad.ctaText, 'CTA text')}
                                                className="text-[hsl(215,20%,65%)] hover:text-[hsl(210,17%,98%)] hover:bg-[hsl(229,41%,16%)]"
                                                data-testid={`button-copy-cta-${platform}-${idx}`}
                                              >
                                                <Copy className="h-3 w-3" />
                                              </Button>
                                            </div>
                                            <div className="flex gap-2 text-xs text-[hsl(215,16%,47%)]">
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
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </>
                    ) : (
                      <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                        <CardContent className="py-12 text-center" data-testid="empty-state-ads">
                          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-[hsl(215,16%,47%)]" />
                          <p className="text-[hsl(215,20%,65%)]">No ad copy available</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="emails" className="space-y-4">
                    {selectedFunnel.emails && selectedFunnel.emails.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-sm text-[hsl(215,20%,65%)]">
                            {selectedFunnel.emails.length} email sequence{selectedFunnel.emails.length !== 1 ? 's' : ''}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => exportAsJSON(selectedFunnel.emails, `email-sequences-${selectedFunnel.funnel.name}.json`)}
                            className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                            data-testid="button-export-all-emails"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export All
                          </Button>
                        </div>
                        <div className="space-y-4" data-testid="list-email-sequences">
                          {selectedFunnel.emails
                            .sort((a: any, b: any) => a.sequenceOrder - b.sequenceOrder)
                            .map((email: any, idx: number) => {
                              const EmailEditForm = () => {
                                const emailForm = useForm({
                                  resolver: zodResolver(insertFunnelEmailSchema.partial()),
                                  defaultValues: {
                                    subjectLine: email.subjectLine || '',
                                    previewText: email.previewText || '',
                                    bodyHtml: email.bodyHtml || '',
                                    ctaText: email.ctaText || '',
                                  },
                                });

                                const handleSaveEmail = (data: any) => {
                                  updateEmailMutation.mutate({
                                    funnelId: selectedFunnel.funnel.id,
                                    emailId: email.id,
                                    data,
                                  });
                                };

                                const handleCancelEdit = () => {
                                  emailForm.reset();
                                  setEditingEmailId(null);
                                };

                                return (
                                  <Form {...emailForm}>
                                    <form onSubmit={emailForm.handleSubmit(handleSaveEmail)} className="space-y-4">
                                      <FormField
                                        control={emailForm.control}
                                        name="subjectLine"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-[hsl(215,20%,65%)]">Subject Line</FormLabel>
                                            <FormControl>
                                              <Input 
                                                className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)]"
                                                {...field} 
                                                data-testid={`input-email-subject-${idx}`}
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={emailForm.control}
                                        name="previewText"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-[hsl(215,20%,65%)]">Preview Text (Optional)</FormLabel>
                                            <FormControl>
                                              <Input 
                                                className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)]"
                                                {...field} 
                                                data-testid={`input-email-preheader-${idx}`}
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={emailForm.control}
                                        name="bodyHtml"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-[hsl(215,20%,65%)]">Email Content (HTML)</FormLabel>
                                            <FormControl>
                                              <Textarea 
                                                className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)]"
                                                {...field} 
                                                rows={6}
                                                data-testid={`textarea-email-body-${idx}`}
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={emailForm.control}
                                        name="ctaText"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-[hsl(215,20%,65%)]">Call to Action (Optional)</FormLabel>
                                            <FormControl>
                                              <Input 
                                                className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)]"
                                                {...field} 
                                                data-testid={`input-email-cta-${idx}`}
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <div className="flex gap-2 justify-end pt-4">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          onClick={handleCancelEdit}
                                          disabled={updateEmailMutation.isPending}
                                          className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                                          data-testid={`button-cancel-email-${idx}`}
                                        >
                                          <X className="h-4 w-4 mr-2" />
                                          Cancel
                                        </Button>
                                        <Button
                                          type="submit"
                                          disabled={updateEmailMutation.isPending}
                                          className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
                                          data-testid={`button-save-email-${idx}`}
                                        >
                                          {updateEmailMutation.isPending ? (
                                            <>
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                              Saving...
                                            </>
                                          ) : (
                                            <>
                                              <CheckCircle className="h-4 w-4 mr-2" />
                                              Save Changes
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </form>
                                  </Form>
                                );
                              };

                              return (
                                <Card key={email.id} className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg" data-testid={`card-email-${idx}`}>
                                  <CardHeader>
                                    <div className="flex items-center justify-between">
                                      <CardTitle className="flex items-center text-lg font-semibold text-[hsl(210,17%,98%)]">
                                        <Mail className="h-5 w-5 mr-2 text-[hsl(227,89%,63%)]" />
                                        {email.sequenceName}
                                      </CardTitle>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)]">Day {email.delayDays}</Badge>
                                        <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0">Email #{email.sequenceOrder}</Badge>
                                        {editingEmailId !== email.id && (
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => setEditingEmailId(email.id)}
                                            className="text-[hsl(215,20%,65%)] hover:text-[hsl(210,17%,98%)] hover:bg-[hsl(229,41%,16%)]"
                                            data-testid={`button-edit-email-${idx}`}
                                          >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    {editingEmailId === email.id ? (
                                      <EmailEditForm />
                                    ) : (
                                      <>
                                        <div>
                                          <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-sm font-medium text-[hsl(215,16%,47%)]">Subject Line</h4>
                                            <Button 
                                              variant="ghost" 
                                              size="sm"
                                              onClick={() => copyToClipboard(email.subjectLine, 'Subject line')}
                                              className="text-[hsl(215,20%,65%)] hover:text-[hsl(210,17%,98%)] hover:bg-[hsl(229,41%,16%)]"
                                              data-testid={`button-copy-subject-${idx}`}
                                            >
                                              <Copy className="h-3 w-3" />
                                            </Button>
                                          </div>
                                          <p className="font-semibold text-[hsl(210,17%,98%)]">{email.subjectLine}</p>
                                        </div>
                                        {email.previewText && (
                                          <div>
                                            <div className="flex items-center justify-between mb-1">
                                              <h4 className="text-sm font-medium text-[hsl(215,16%,47%)]">Preview Text</h4>
                                              <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => copyToClipboard(email.previewText, 'Preview text')}
                                                className="text-[hsl(215,20%,65%)] hover:text-[hsl(210,17%,98%)] hover:bg-[hsl(229,41%,16%)]"
                                                data-testid={`button-copy-preheader-${idx}`}
                                              >
                                                <Copy className="h-3 w-3" />
                                              </Button>
                                            </div>
                                            <p className="text-sm text-[hsl(215,20%,65%)]">{email.previewText}</p>
                                          </div>
                                        )}
                                        <div>
                                          <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-sm font-medium text-[hsl(215,16%,47%)]">Email Content</h4>
                                            <div className="flex gap-2">
                                              <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => setEmailPreviewId(email.id)}
                                                className="text-[hsl(215,20%,65%)] hover:text-[hsl(210,17%,98%)] hover:bg-[hsl(229,41%,16%)]"
                                                data-testid={`button-preview-email-${idx}`}
                                              >
                                                <Eye className="h-3 w-3 mr-1" />
                                                Preview
                                              </Button>
                                              <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => copyToClipboard(email.bodyHtml, 'Email content')}
                                                className="text-[hsl(215,20%,65%)] hover:text-[hsl(210,17%,98%)] hover:bg-[hsl(229,41%,16%)]"
                                                data-testid={`button-copy-body-${idx}`}
                                              >
                                                <Copy className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                          <div 
                                            className="prose prose-sm prose-invert max-w-none p-4 bg-[hsl(229,41%,16%)] rounded-lg max-h-40 overflow-hidden relative"
                                            dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                                            data-testid={`email-body-${idx}`}
                                          />
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-[hsl(217,33%,17%)]">
                                          {email.ctaText && (
                                            <div>
                                              <h4 className="text-sm font-medium text-[hsl(215,16%,47%)] mb-2">Call to Action</h4>
                                              <Badge className="bg-[hsl(227,89%,63%)] text-white border-0">{email.ctaText}</Badge>
                                            </div>
                                          )}
                                          <div className="flex gap-3 text-xs text-[hsl(215,16%,47%)]">
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
                                      </>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}
                        </div>
                      </>
                    ) : (
                      <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                        <CardContent className="py-12 text-center" data-testid="empty-state-emails">
                          <Mail className="h-12 w-12 mx-auto mb-4 text-[hsl(215,16%,47%)]" />
                          <p className="text-[hsl(215,20%,65%)]">No email sequences available</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="automations" className="space-y-4">
                    {selectedFunnel.workflows && selectedFunnel.workflows.length > 0 ? (
                      <div className="space-y-4" data-testid="list-workflows">
                        {selectedFunnel.workflows.map((workflow: any, idx: number) => {
                          const WorkflowEditForm = () => {
                            const workflowForm = useForm({
                              resolver: zodResolver(insertAutomationWorkflowSchema.partial()),
                              defaultValues: {
                                name: workflow.name || '',
                                description: workflow.description || '',
                                triggerType: workflow.triggerType || 'form_submission',
                                actions: workflow.actions || [],
                              },
                            });

                            const handleSaveWorkflow = (data: any) => {
                              updateWorkflowFullMutation.mutate({
                                funnelId: selectedFunnel.funnel.id,
                                workflowId: workflow.id,
                                data,
                              });
                            };

                            const handleCancelEdit = () => {
                              workflowForm.reset();
                              setEditingWorkflowId(null);
                            };

                            const actions = workflowForm.watch('actions') || [];

                            const addAction = () => {
                              const currentActions = workflowForm.getValues('actions') || [];
                              workflowForm.setValue('actions', [...currentActions, 'send_email']);
                            };

                            const removeAction = (indexToRemove: number) => {
                              const currentActions = workflowForm.getValues('actions') || [];
                              workflowForm.setValue('actions', currentActions.filter((_: string, i: number) => i !== indexToRemove));
                            };

                            return (
                              <Form {...workflowForm}>
                                <form onSubmit={workflowForm.handleSubmit(handleSaveWorkflow)} className="space-y-4">
                                  <FormField
                                    control={workflowForm.control}
                                    name="name"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-[hsl(215,20%,65%)]">Workflow Name</FormLabel>
                                        <FormControl>
                                          <Input 
                                            className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)]"
                                            {...field} 
                                            data-testid={`input-workflow-name-${idx}`}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={workflowForm.control}
                                    name="description"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-[hsl(215,20%,65%)]">Description (Optional)</FormLabel>
                                        <FormControl>
                                          <Textarea 
                                            className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)]"
                                            {...field} 
                                            rows={3}
                                            data-testid={`textarea-workflow-description-${idx}`}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={workflowForm.control}
                                    name="triggerType"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-[hsl(215,20%,65%)]">Trigger Event</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <FormControl>
                                            <SelectTrigger className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]" data-testid={`select-workflow-trigger-${idx}`}>
                                              <SelectValue placeholder="Select trigger type" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)]">
                                            <SelectItem value="form_submission" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Form Submission</SelectItem>
                                            <SelectItem value="email_opened" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Email Opened</SelectItem>
                                            <SelectItem value="link_clicked" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Link Clicked</SelectItem>
                                            <SelectItem value="page_viewed" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Page Viewed</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <div className="space-y-2">
                                    <FormLabel className="text-[hsl(215,20%,65%)]">Actions</FormLabel>
                                    <div className="flex flex-wrap gap-2">
                                      {actions.map((action: string, actionIdx: number) => (
                                        <Badge 
                                          key={actionIdx} 
                                          className="capitalize flex items-center gap-1 bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0"
                                        >
                                          {action.replace('_', ' ')}
                                          <button
                                            type="button"
                                            onClick={() => removeAction(actionIdx)}
                                            className="ml-1 hover:text-red-400"
                                            data-testid={`button-remove-action-${idx}-${actionIdx}`}
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </Badge>
                                      ))}
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addAction}
                                        className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                                        data-testid={`button-add-action-${idx}`}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Action
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 justify-end pt-4">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={handleCancelEdit}
                                      disabled={updateWorkflowFullMutation.isPending}
                                      className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                                      data-testid={`button-cancel-workflow-${idx}`}
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Cancel
                                    </Button>
                                    <Button
                                      type="submit"
                                      disabled={updateWorkflowFullMutation.isPending}
                                      className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
                                      data-testid={`button-save-workflow-${idx}`}
                                    >
                                      {updateWorkflowFullMutation.isPending ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          Saving...
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Save Changes
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </form>
                              </Form>
                            );
                          };

                          return (
                            <Card key={workflow.id} className="relative bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg" data-testid={`card-workflow-${idx}`}>
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <CardTitle className="flex items-center text-lg font-semibold text-[hsl(210,17%,98%)]">
                                    <Zap className="h-5 w-5 mr-2 text-[hsl(227,89%,63%)]" />
                                    {workflow.name}
                                  </CardTitle>
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-[hsl(215,20%,65%)]">
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
                                    {editingWorkflowId !== workflow.id && (
                                      <>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => setEditingWorkflowId(workflow.id)}
                                          className="text-[hsl(215,20%,65%)] hover:text-[hsl(210,17%,98%)] hover:bg-[hsl(229,41%,16%)]"
                                          data-testid={`button-edit-workflow-${idx}`}
                                        >
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => exportAsJSON(workflow, `workflow-${workflow.name}.json`)}
                                          className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                                          data-testid={`button-export-workflow-${idx}`}
                                        >
                                          <Download className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {editingWorkflowId === workflow.id ? (
                                  <WorkflowEditForm />
                                ) : (
                                  <>
                                    {workflow.description && (
                                      <p className="text-sm text-[hsl(215,20%,65%)]">
                                        {workflow.description}
                                      </p>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-[hsl(215,16%,47%)]">Trigger Event</h4>
                                        <div className="flex items-center gap-2 p-3 bg-[hsl(227,89%,63%)]/20 rounded-lg">
                                          <Play className="h-4 w-4 text-[hsl(227,89%,63%)]" />
                                          <span className="text-sm font-medium text-[hsl(210,17%,98%)] capitalize">
                                            {workflow.triggerType.replace('_', ' ')}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-[hsl(215,16%,47%)]">Actions ({workflow.actions.length})</h4>
                                        <div className="flex flex-wrap gap-2">
                                          {workflow.actions.slice(0, 3).map((action: string, actionIdx: number) => (
                                            <Badge key={actionIdx} className="capitalize bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0">
                                              {action.replace('_', ' ')}
                                            </Badge>
                                          ))}
                                          {workflow.actions.length > 3 && (
                                            <Badge variant="outline" className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)]">+{workflow.actions.length - 3} more</Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <Separator className="bg-[hsl(217,33%,17%)]" />
                                    <div className="flex items-center justify-between text-xs text-[hsl(215,16%,47%)]">
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
                                        className="text-[hsl(215,20%,65%)] hover:text-[hsl(210,17%,98%)] hover:bg-[hsl(229,41%,16%)]"
                                        data-testid={`button-view-workflow-${idx}`}
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        View Flow
                                      </Button>
                                    </div>
                                  </>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                        <CardContent className="py-12 text-center" data-testid="empty-state-automations">
                          <Zap className="h-12 w-12 mx-auto mb-4 text-[hsl(215,16%,47%)]" />
                          <p className="text-[hsl(215,20%,65%)]">No automation workflows available</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : null}
          </div>
        </div>

        <Dialog open={!!emailPreviewId} onOpenChange={(open) => !open && setEmailPreviewId(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)]" data-testid="dialog-email-preview">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl text-[hsl(210,17%,98%)]">
                <Mail className="h-5 w-5 mr-2 text-[hsl(227,89%,63%)]" />
                Email Preview
              </DialogTitle>
              <DialogDescription className="text-[hsl(215,20%,65%)]">
                Full preview of the email content
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[70vh] w-full rounded-md border border-[hsl(217,33%,17%)] p-6 bg-[hsl(229,41%,16%)]">
              {selectedFunnel?.emails?.find((email: any) => email.id === emailPreviewId) && (
                <div className="space-y-4" data-testid="email-preview-content">
                  <div className="border-b border-[hsl(217,33%,17%)] pb-4">
                    <h3 className="text-lg font-semibold text-[hsl(210,17%,98%)] mb-2">
                      {selectedFunnel.emails.find((email: any) => email.id === emailPreviewId).subjectLine}
                    </h3>
                    {selectedFunnel.emails.find((email: any) => email.id === emailPreviewId).previewText && (
                      <p className="text-sm text-[hsl(215,20%,65%)]">
                        {selectedFunnel.emails.find((email: any) => email.id === emailPreviewId).previewText}
                      </p>
                    )}
                  </div>
                  <div 
                    className="prose prose-sm prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: selectedFunnel.emails.find((email: any) => email.id === emailPreviewId).bodyHtml 
                    }}
                  />
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
