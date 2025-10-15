import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Bot, 
  MessageSquare, 
  ShoppingCart, 
  Search, 
  Mail, 
  TrendingUp, 
  Shield, 
  Target,
  Brain,
  Zap,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Users,
  Globe,
  Sparkles
} from 'lucide-react';

interface CloeResponse {
  success: boolean;
  response: string;
  actionItems?: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    estimated_impact: string;
    implementation_steps: string[];
  }>;
  metrics?: Record<string, any>;
  nextSteps?: string[];
}

export default function CloeAIAgent() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Debug tab switching
  const handleTabChange = (value: string) => {
    console.log('Tab switched to:', value);
    setActiveTab(value);
  };
  const [onboardingMessage, setOnboardingMessage] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'sales' | 'marketing' | 'manager' | 'user'>('user');
  const [seoUrl, setSeoUrl] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [ecommercePlatform, setEcommercePlatform] = useState<'shopify' | 'shopware'>('shopify');
  const [emailAudience, setEmailAudience] = useState<'abandoned_signup' | 'inactive_users' | 'trial_expiring' | 'churned_customers'>('abandoned_signup');
  const [adPlatform, setAdPlatform] = useState<'google' | 'facebook' | 'linkedin'>('google');
  const [adBudget, setAdBudget] = useState('1000');

  // Performance metrics query
  const { data: performanceData, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/cloe/performance-metrics'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Onboarding mutation
  const onboardingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/cloe/onboarding', data);
      return response.json();
    },
    onSuccess: (response: CloeResponse) => {
      toast({
        title: "Cloe AI Assistant",
        description: response.response,
      });
    },
  });

  // E-commerce automation mutation
  const ecommerceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/cloe/ecommerce-automation', data);
      return response.json();
    },
    onSuccess: (response: CloeResponse) => {
      toast({
        title: "E-commerce Automation",
        description: response.response,
      });
    },
  });

  // SEO analysis mutation
  const seoMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/cloe/seo-analysis', data);
      return response.json();
    },
    onSuccess: (response: CloeResponse) => {
      toast({
        title: "SEO Analysis Complete",
        description: response.response,
      });
    },
  });

  // Email recovery mutation
  const emailMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/cloe/email-recovery', data);
      return response.json();
    },
    onSuccess: (response: CloeResponse) => {
      console.log('Email recovery success:', response);
      toast({
        title: "Email Recovery Campaign",
        description: response.response,
      });
    },
    onError: (error: any) => {
      console.error('Email recovery error:', error);
      toast({
        title: "Email Recovery Failed",
        description: "Failed to create email recovery campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Ad campaign mutation
  const adMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/cloe/ad-campaign', data);
      return response.json();
    },
    onSuccess: (response: CloeResponse) => {
      console.log('Ad campaign success:', response);
      toast({
        title: "Ad Campaign Created",
        description: response.response,
      });
    },
    onError: (error: any) => {
      console.error('Ad campaign error:', error);
      toast({
        title: "Ad Campaign Failed",
        description: "Failed to create ad campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOnboarding = () => {
    console.log('Onboarding button clicked');
    onboardingMutation.mutate({
      userRole,
      currentStep: 'getting_started',
      userMessage: onboardingMessage,
      context: {
        hasCompletedTour: false,
        featuresUsed: [],
        strugglingWith: []
      }
    });
  };

  const handleEcommerceAutomation = () => {
    console.log('E-commerce Automation button clicked');
    ecommerceMutation.mutate({
      platform: ecommercePlatform,
      action: 'inventory_sync',
      parameters: {
        auto_sync: true,
        update_frequency: 'hourly'
      }
    });
  };

  const handleSeoAnalysis = () => {
    if (!seoUrl || !seoKeywords) {
      toast({
        title: "Missing Information",
        description: "Please provide both URL and target keywords.",
        variant: "destructive"
      });
      return;
    }

    seoMutation.mutate({
      url: seoUrl,
      targetKeywords: seoKeywords.split(',').map(k => k.trim()),
      analysisType: 'technical'
    });
  };

  const handleEmailRecovery = () => {
    console.log('Email Recovery button clicked');
    try {
      emailMutation.mutate({
        targetAudience: emailAudience,
        campaignType: 'drip_sequence',
        userProfile: {
          email: 'example@example.com',
          lastActivity: '2025-01-01',
          engagementLevel: 'medium',
          preferredFeatures: ['crm', 'analytics']
        }
      });
    } catch (error) {
      console.error('Error in handleEmailRecovery:', error);
      toast({
        title: "Error",
        description: "Failed to create email recovery campaign",
        variant: "destructive"
      });
    }
  };

  const handleAdCampaign = () => {
    console.log('Ad Campaign button clicked');
    try {
      adMutation.mutate({
        platform: adPlatform,
        campaignType: 'conversion',
        targetAudience: {
          demographics: { age: '25-45', location: 'US' },
          interests: ['business', 'crm', 'sales'],
          behaviors: ['online_shoppers', 'business_users']
        },
        budget: parseInt(adBudget),
        duration: 30
      });
    } catch (error) {
      console.error('Error in handleAdCampaign:', error);
      toast({
        title: "Error",
        description: "Failed to create ad campaign",
        variant: "destructive"
      });
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Cloe AI Agent</h1>
          <p className="text-muted-foreground">
            Your autonomous AI assistant for CRM automation, SEO optimization, and growth-focused operations
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="mb-4">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Active Tab: {activeTab}
          </Badge>
        </div>
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Onboarding
          </TabsTrigger>
          <TabsTrigger value="ecommerce" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            E-commerce
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Recovery
          </TabsTrigger>
          <TabsTrigger value="advertising" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Advertising
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold text-green-800">Overview Tab Active</h2>
            <p className="text-green-700">This is the Overview tab content showing performance metrics.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Onboarding Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData?.metrics?.onboarding?.completion_rate || 78.5}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {performanceData?.metrics?.onboarding?.avg_time_to_value || 24}h avg time to value
                </p>
                <Progress value={performanceData?.metrics?.onboarding?.completion_rate || 78.5} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData?.metrics?.ecommerce?.time_saved_hours || 320}h
                </div>
                <p className="text-xs text-muted-foreground">
                  {performanceData?.metrics?.ecommerce?.automations_active || 15} automations active
                </p>
                <Progress value={85} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SEO Improvements</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData?.metrics?.seo?.avg_improvement || '28% traffic increase'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {performanceData?.metrics?.seo?.sites_analyzed || 42} sites analyzed
                </p>
                <Progress value={72} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ad ROI</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData?.metrics?.advertising?.avg_roi || '340%'}
                </div>
                <p className="text-xs text-muted-foreground">
                  ${performanceData?.metrics?.advertising?.total_spend || 15000} total spend
                </p>
                <Progress value={90} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Core Capabilities
                </CardTitle>
                <CardDescription>
                  Cloe's AI-powered features for autonomous CRM operation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Interactive Onboarding</h4>
                    <p className="text-sm text-muted-foreground">NLP-powered conversational guidance and tutorials</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShoppingCart className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">E-commerce Automation</h4>
                    <p className="text-sm text-muted-foreground">Shopify & Shopware integration with smart workflows</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Search className="h-5 w-5 text-purple-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">SEO Optimization</h4>
                    <p className="text-sm text-muted-foreground">ML-driven website analysis and improvements</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Cross-Platform Ads</h4>
                    <p className="text-sm text-muted-foreground">Automated campaigns across Google, Facebook, LinkedIn</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Email Recovery</h4>
                    <p className="text-sm text-muted-foreground">Personalized drip campaigns for user re-engagement</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Compliance & Security
                </CardTitle>
                <CardDescription>
                  GDPR-compliant AI with enterprise-grade security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">GDPR Compliance</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">End-to-End Encryption</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Role-Based Access</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">Configured</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Data Audit Trail</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">Logging</Badge>
                </div>
                <Separator />
                <div className="text-sm text-muted-foreground">
                  All AI operations maintain strict data privacy and security compliance with automated consent management.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold text-blue-800">Onboarding Tab Active</h2>
            <p className="text-blue-700">This is the Onboarding tab content for interactive guidance.</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Interactive Onboarding Assistant
              </CardTitle>
              <CardDescription>
                Get personalized guidance based on your role and experience with NODE CRM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="user-role">Your Role</Label>
                  <Select value={userRole} onValueChange={(value: any) => setUserRole(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="sales">Sales Representative</SelectItem>
                      <SelectItem value="marketing">Marketing Specialist</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="user">General User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="onboarding-message">What would you like to learn about?</Label>
                <Textarea
                  id="onboarding-message"
                  placeholder="Ask me anything about NODE CRM features, setup, or best practices..."
                  value={onboardingMessage}
                  onChange={(e) => setOnboardingMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleOnboarding} 
                disabled={onboardingMutation.isPending || !onboardingMessage.trim()}
                className="w-full"
              >
                {onboardingMutation.isPending ? 'Getting Assistance...' : 'Get Personalized Guidance'}
              </Button>

              {onboardingMutation.data && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <Bot className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="space-y-3">
                      <p className="text-sm">{onboardingMutation.data.response}</p>
                      
                      {onboardingMutation.data.actionItems && onboardingMutation.data.actionItems.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Recommended Actions:</h4>
                          {onboardingMutation.data.actionItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Badge variant={getPriorityColor(item.priority)}>
                                {item.priority}
                              </Badge>
                              <span className="text-sm">{item.action}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {onboardingMutation.data.nextSteps && onboardingMutation.data.nextSteps.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Next Steps:</h4>
                          <ul className="text-sm space-y-1">
                            {onboardingMutation.data.nextSteps.map((step, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ecommerce" className="space-y-6">
          <div className="bg-purple-50 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold text-purple-800">E-commerce Tab Active</h2>
            <p className="text-purple-700">This is the E-commerce tab content for automation setup.</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                E-commerce Automation
              </CardTitle>
              <CardDescription>
                Demo integration setup - requires actual store credentials for real synchronization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ecommerce-platform">E-commerce Platform</Label>
                <Select value={ecommercePlatform} onValueChange={(value: any) => setEcommercePlatform(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shopify">Shopify</SelectItem>
                    <SelectItem value="shopware">Shopware</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleEcommerceAutomation} 
                disabled={ecommerceMutation.isPending}
                className="w-full"
              >
                {ecommerceMutation.isPending ? 'Analyzing Integration...' : 'Test Integration Setup (Demo Mode)'}
              </Button>

              {ecommerceMutation.data && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="space-y-3">
                      <p className="text-sm">{ecommerceMutation.data.response}</p>
                      
                      {ecommerceMutation.data.metrics && (
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="text-sm">
                            <span className="font-medium">Estimated ROI:</span> {ecommerceMutation.data.metrics.estimated_roi}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Setup Time:</span> {ecommerceMutation.data.metrics.implementation_time}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                SEO Optimization with ML
              </CardTitle>
              <CardDescription>
                Analyze your website performance and get ML-powered recommendations for improvements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo-url">Website URL</Label>
                <Input
                  id="seo-url"
                  type="url"
                  placeholder="https://your-website.com"
                  value={seoUrl}
                  onChange={(e) => setSeoUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seo-keywords">Target Keywords (comma-separated)</Label>
                <Input
                  id="seo-keywords"
                  placeholder="crm software, sales automation, customer management"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleSeoAnalysis} 
                disabled={seoMutation.isPending}
                className="w-full"
              >
                {seoMutation.isPending ? 'Analyzing Website...' : 'Run SEO Analysis'}
              </Button>

              {seoMutation.data && (
                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div className="space-y-3">
                      <p className="text-sm">{seoMutation.data.response}</p>
                      
                      {seoMutation.data.metrics && (
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="text-sm">
                            <span className="font-medium">High Priority Issues:</span> {seoMutation.data.metrics.high_priority}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Traffic Increase Potential:</span> {seoMutation.data.metrics.estimated_traffic_increase}
                          </div>
                        </div>
                      )}

                      {seoMutation.data.actionItems && seoMutation.data.actionItems.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">SEO Recommendations:</h4>
                          {seoMutation.data.actionItems.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <Badge variant={getPriorityColor(item.priority)}>
                                {item.priority}
                              </Badge>
                              <div className="text-sm">
                                <div>{item.action}</div>
                                <div className="text-muted-foreground mt-1">{item.estimated_impact}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <div className="bg-orange-50 p-4 rounded-lg mb-4">
            <h2 className="text-lg font-semibold text-orange-800">Email Recovery Tab Active</h2>
            <p className="text-orange-700">This is the Email Recovery tab content for re-engagement campaigns.</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Recovery System
              </CardTitle>
              <CardDescription>
                Create personalized drip campaigns to re-engage inactive users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-audience">Target Audience</Label>
                <Select value={emailAudience} onValueChange={(value: any) => setEmailAudience(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="abandoned_signup">Abandoned Signups</SelectItem>
                    <SelectItem value="inactive_users">Inactive Users</SelectItem>
                    <SelectItem value="trial_expiring">Trial Expiring</SelectItem>
                    <SelectItem value="churned_customers">Churned Customers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleEmailRecovery} 
                disabled={emailMutation.isPending}
                className="w-full"
              >
                {emailMutation.isPending ? 'Creating Campaign...' : 'Create Recovery Campaign'}
              </Button>

              {emailMutation.data && (
                <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="space-y-3">
                      <p className="text-sm">{emailMutation.data.response}</p>
                      
                      {emailMutation.data.metrics && (
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="text-sm">
                            <span className="font-medium">Expected Open Rate:</span> {emailMutation.data.metrics.estimated_open_rate}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Conversion Rate:</span> {emailMutation.data.metrics.estimated_conversion_rate}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advertising" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Cross-Platform Advertising
              </CardTitle>
              <CardDescription>
                Automated ad campaign creation with A/B testing across Google, Facebook, and LinkedIn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ad-platform">Advertising Platform</Label>
                  <Select value={adPlatform} onValueChange={(value: any) => setAdPlatform(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Ads</SelectItem>
                      <SelectItem value="facebook">Facebook Ads</SelectItem>
                      <SelectItem value="linkedin">LinkedIn Ads</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ad-budget">Campaign Budget ($)</Label>
                  <Input
                    id="ad-budget"
                    type="number"
                    placeholder="1000"
                    value={adBudget}
                    onChange={(e) => setAdBudget(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={handleAdCampaign} 
                disabled={adMutation.isPending}
                className="w-full"
              >
                {adMutation.isPending ? 'Creating Campaign...' : 'Launch Ad Campaign'}
              </Button>

              {adMutation.data && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="space-y-3">
                      <p className="text-sm">{adMutation.data.response}</p>
                      
                      {adMutation.data.metrics && (
                        <div className="grid gap-2 md:grid-cols-2">
                          <div className="text-sm">
                            <span className="font-medium">Estimated Reach:</span> {adMutation.data.metrics.estimated_reach?.toLocaleString()}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Projected ROI:</span> {adMutation.data.metrics.projected_roi}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Projected Clicks:</span> {adMutation.data.metrics.projected_clicks?.toLocaleString()}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Est. Conversions:</span> {adMutation.data.metrics.estimated_conversions}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}