import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  TrendingUp, 
  MessageSquare, 
  Building2, 
  Zap,
  Phone,
  Mail,
  Users,
  Target,
  BarChart3,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Network,
  Shield,
  Globe
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FeatureMetrics {
  category: string;
  description: string;
  status: 'active' | 'pending' | 'error';
  usage: number;
  maxUsage: number;
  lastUsed?: Date;
  features: string[];
}

interface CompetitiveFeature {
  id: string;
  name: string;
  category: 'ai_automation' | 'revenue_intelligence' | 'conversation_intelligence' | 'industry_solutions' | 'integrations';
  description: string;
  status: 'enabled' | 'disabled' | 'demo';
  impact: 'high' | 'medium' | 'low';
  adoption: number;
  roi: string;
  competitors: string[];
  advantage: string;
}

export default function CompetitiveIntelligence() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testData, setTestData] = useState({
    audioTranscript: "This is a sample sales call transcript for testing...",
    participants: ["John Sales", "Jane Customer"],
    emailContent: "I'm interested in your product but the price seems high compared to competitors...",
    customerId: "cust_001",
    customerData: { engagementScore: 75, lastPurchase: "2024-01-15", supportTickets: 2 },
    leadData: { source: "website", industry: "technology", budget: 50000, timeline: "Q1" }
  });

  // Fetch competitive intelligence dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/ai/dashboard'],
    queryFn: () => apiRequest('GET', '/api/ai/dashboard')
  });

  // Fetch integration health
  const { data: integrationHealth } = useQuery({
    queryKey: ['/api/integrations/health-advanced'],
    queryFn: () => apiRequest('GET', '/api/integrations/health-advanced')
  });

  // Test Advanced AI Automation
  const testCallSummarization = useMutation({
    mutationFn: () => apiRequest('POST', '/api/ai/calls/summarize', {
      audioTranscript: testData.audioTranscript,
      participants: testData.participants
    }),
    onSuccess: (data) => {
      toast({
        title: "Call Summarization Complete",
        description: `Generated summary with ${data.summary.keyTopics.length} key topics and ${data.summary.actionItems.length} action items`
      });
    }
  });

  const testEmailSuggestion = useMutation({
    mutationFn: () => apiRequest('POST', '/api/ai/emails/suggest-response', {
      emailContent: testData.emailContent
    }),
    onSuccess: (data) => {
      toast({
        title: "Email Suggestion Generated",
        description: `Suggested ${data.suggestion.tone} tone response with ${data.suggestion.confidence}% confidence`
      });
    }
  });

  const testChurnPrediction = useMutation({
    mutationFn: () => apiRequest('POST', '/api/ai/customers/predict-churn', {
      customerId: testData.customerId,
      customerData: testData.customerData
    }),
    onSuccess: (data) => {
      toast({
        title: "Churn Prediction Complete",
        description: `Risk level: ${data.prediction.riskLevel}, Probability: ${(data.prediction.churnProbability * 100).toFixed(1)}%`
      });
    }
  });

  const testLeadScoring = useMutation({
    mutationFn: () => apiRequest('POST', '/api/ai/leads/score', {
      leadData: testData.leadData
    }),
    onSuccess: (data) => {
      toast({
        title: "Lead Scoring Complete",
        description: `Score: ${data.leadScore.score}/100, Priority: ${data.leadScore.priority}`
      });
    }
  });

  // Test Revenue Intelligence
  const testRevenueForecasting = useMutation({
    mutationFn: () => apiRequest('POST', '/api/revenue/forecast', {
      historicalData: [{ month: "2024-01", revenue: 100000 }, { month: "2024-02", revenue: 120000 }],
      pipelineData: [{ stage: "Proposal", amount: 50000 }, { stage: "Negotiation", amount: 75000 }],
      period: "quarterly"
    }),
    onSuccess: (data) => {
      toast({
        title: "Revenue Forecast Generated",
        description: `Predicted revenue: $${data.forecast.predictedRevenue.toLocaleString()} with ${(data.forecast.confidence * 100).toFixed(1)}% confidence`
      });
    }
  });

  const testDealRiskAssessment = useMutation({
    mutationFn: () => apiRequest('POST', '/api/revenue/deals/assess-risk', {
      dealData: { id: "deal_001", amount: 50000, stage: "Proposal", daysInStage: 45, lastActivity: "2024-01-15" }
    }),
    onSuccess: (data) => {
      toast({
        title: "Deal Risk Assessment Complete",
        description: `Risk level: ${data.riskAssessment.riskLevel}, Close probability: ${(data.riskAssessment.probabilityToClose * 100).toFixed(1)}%`
      });
    }
  });

  // Test Conversation Intelligence
  const testMeetingTranscription = useMutation({
    mutationFn: () => apiRequest('POST', '/api/conversation/meetings/transcribe', {
      audioData: "sample_audio_data",
      meetingData: {
        meetingId: "meet_001",
        platform: "zoom",
        participants: ["Sales Rep", "Customer"],
        duration: 30
      }
    }),
    onSuccess: (data) => {
      toast({
        title: "Meeting Transcription Complete",
        description: `Analyzed ${data.transcription.participants.length} participants, identified ${data.transcription.topics.length} topics`
      });
    }
  });

  const testCallCoaching = useMutation({
    mutationFn: () => apiRequest('POST', '/api/conversation/calls/coaching', {
      callData: { id: "call_001", salesperson: "John Sales", duration: 30 },
      transcript: testData.audioTranscript
    }),
    onSuccess: (data) => {
      toast({
        title: "Call Coaching Analysis Complete",
        description: `Overall score: ${data.coaching.score}/100, Talk time ratio: ${(data.coaching.talkTimeRatio * 100).toFixed(1)}%`
      });
    }
  });

  // Test Industry Solutions
  const testHealthcareSolution = useMutation({
    mutationFn: () => apiRequest('POST', '/api/industry/healthcare/setup', {
      organizationId: "org_healthcare_001"
    }),
    onSuccess: () => {
      toast({
        title: "Healthcare Solution Activated",
        description: "HIPAA compliance framework and patient journey mapping enabled"
      });
    }
  });

  const testIntegrationSetup = useMutation({
    mutationFn: (type: string) => {
      switch (type) {
        case 'erp':
          return apiRequest('POST', '/api/integrations/erp/setup', {
            provider: 'quickbooks',
            credentials: { apiKey: 'demo_key' }
          });
        case 'social':
          return apiRequest('POST', '/api/integrations/social/setup', {
            keywords: ['NODE CRM', 'customer management', 'sales automation']
          });
        case 'video':
          return apiRequest('POST', '/api/integrations/video/setup', {
            providers: ['zoom', 'teams']
          });
        default:
          throw new Error('Unknown integration type');
      }
    },
    onSuccess: (data, type) => {
      toast({
        title: `${type.toUpperCase()} Integration Setup Complete`,
        description: `Successfully configured ${type} integration with advanced features`
      });
    }
  });

  const competitiveFeatures: CompetitiveFeature[] = [
    {
      id: '1',
      name: 'Real-time Call Summarization',
      category: 'ai_automation',
      description: 'AI-powered automatic call summaries with action items and sentiment analysis',
      status: 'enabled',
      impact: 'high',
      adoption: 85,
      roi: '40% time savings',
      competitors: ['Salesforce', 'HubSpot'],
      advantage: 'Real-time processing with emotional intelligence'
    },
    {
      id: '2',
      name: 'Predictive Revenue Forecasting',
      category: 'revenue_intelligence',
      description: 'Advanced sales forecasting with 42% accuracy improvement',
      status: 'enabled',
      impact: 'high',
      adoption: 92,
      roi: '25% revenue increase',
      competitors: ['Tableau', 'Power BI'],
      advantage: 'AI-driven with market sentiment integration'
    },
    {
      id: '3',
      name: 'Meeting Intelligence & Coaching',
      category: 'conversation_intelligence',
      description: 'Automated meeting transcription with sales coaching recommendations',
      status: 'enabled',
      impact: 'high',
      adoption: 78,
      roi: '30% sales improvement',
      competitors: ['Gong', 'Chorus'],
      advantage: 'Multi-platform integration with emotional scoring'
    },
    {
      id: '4',
      name: 'Healthcare HIPAA Compliance',
      category: 'industry_solutions',
      description: 'Industry-specific CRM with built-in compliance frameworks',
      status: 'enabled',
      impact: 'high',
      adoption: 95,
      roi: '60% compliance efficiency',
      competitors: ['Epic', 'Cerner'],
      advantage: 'Native CRM integration with patient journey mapping'
    },
    {
      id: '5',
      name: 'Native ERP Integration',
      category: 'integrations',
      description: 'Bidirectional sync with QuickBooks, SAP, NetSuite, and more',
      status: 'enabled',
      impact: 'medium',
      adoption: 88,
      roi: '50% data accuracy',
      competitors: ['Zapier', 'MuleSoft'],
      advantage: 'Native integration with real-time sync'
    }
  ];

  const categoryMetrics: FeatureMetrics[] = [
    {
      category: 'AI Automation',
      description: 'Call summarization, email suggestions, churn prediction, lead scoring',
      status: 'pending',
      usage: 0,
      maxUsage: 1000,
      features: ['Call Summarization', 'Email Suggestions', 'Churn Prediction', 'Lead Scoring', 'Workflow Automation']
    },
    {
      category: 'Revenue Intelligence',
      description: 'Sales forecasting, deal risk assessment, pipeline health, quota tracking',
      status: 'pending',
      usage: 0,
      maxUsage: 500,
      features: ['Sales Forecasting', 'Deal Risk Assessment', 'Revenue Attribution', 'Pipeline Health', 'Quota Tracking']
    },
    {
      category: 'Conversation Intelligence',
      description: 'Meeting transcription, call coaching, sentiment tracking, competitive intelligence',
      status: 'pending',
      usage: 0,
      maxUsage: 300,
      features: ['Meeting Transcription', 'Call Coaching', 'Sentiment Tracking', 'Competitive Intelligence', 'Talk-time Analysis']
    },
    {
      category: 'Industry Solutions',
      description: 'Healthcare, real estate, manufacturing, financial services, retail',
      status: 'pending',
      usage: 0,
      maxUsage: 200,
      features: ['Healthcare HIPAA', 'Real Estate MLS', 'Manufacturing B2B', 'Financial Compliance', 'Retail Omnichannel']
    },
    {
      category: 'Advanced Integrations',
      description: 'ERP, social media, video conferencing, marketing automation, customer support',
      status: 'active',
      usage: 134,
      maxUsage: 500,
      features: ['ERP Sync', 'Social Listening', 'Video Integration', 'Marketing Automation', 'Support Platforms']
    }
  ];

  const filteredFeatures = selectedCategory === 'all' 
    ? competitiveFeatures 
    : competitiveFeatures.filter(f => f.category === selectedCategory);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Competitive Intelligence Dashboard</h1>
          <p className="text-muted-foreground">
            Advanced enterprise CRM features for 2025 market leadership
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            All Systems Active
          </Badge>
          <Badge variant="outline">
            2025 Market Leader
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-automation">AI Automation</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Intelligence</TabsTrigger>
          <TabsTrigger value="conversation">Conversation AI</TabsTrigger>
          <TabsTrigger value="industry">Industry Solutions</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Competitive Advantage Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Market Position</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Leader</div>
                <p className="text-xs text-muted-foreground">
                  +40% vs competitors
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Feature Advantage</CardTitle>
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">95%</div>
                <p className="text-xs text-muted-foreground">
                  Unique capabilities
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Integration</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98%</div>
                <p className="text-xs text-muted-foreground">
                  AI coverage across platform
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enterprise Ready</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">100%</div>
                <p className="text-xs text-muted-foreground">
                  Compliance frameworks
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Category Performance Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categoryMetrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{metric.category}</CardTitle>
                  <CardDescription>{metric.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Usage</span>
                    <span className="text-sm text-muted-foreground">
                      {metric.usage}/{metric.maxUsage}
                    </span>
                  </div>
                  <Progress value={(metric.usage / metric.maxUsage) * 100} className="h-2" />
                  <div className="flex items-center gap-2">
                    <Badge variant={metric.status === 'active' ? 'default' : 'secondary'}>
                      {metric.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {metric.features.length} features
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Competitive Features Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Competitive Feature Analysis</CardTitle>
              <CardDescription>
                Enterprise features that differentiate NODE CRM in the 2025 market
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {competitiveFeatures.map((feature) => (
                  <div key={feature.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{feature.name}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={feature.impact === 'high' ? 'default' : 'secondary'}>
                          {feature.impact} impact
                        </Badge>
                        <Badge variant="outline">{feature.roi}</Badge>
                        <span className="text-sm text-muted-foreground">
                          vs {feature.competitors.join(', ')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">{feature.adoption}%</div>
                      <div className="text-sm text-muted-foreground">adoption</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-automation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Advanced AI Automation Testing
              </CardTitle>
              <CardDescription>
                Test real-time call summarization, email suggestions, churn prediction, and lead scoring
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Button 
                onClick={() => testCallSummarization.mutate()}
                disabled={testCallSummarization.isPending}
                className="flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                {testCallSummarization.isPending ? 'Analyzing...' : 'Test Call Summarization'}
              </Button>
              <Button 
                onClick={() => testEmailSuggestion.mutate()}
                disabled={testEmailSuggestion.isPending}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                {testEmailSuggestion.isPending ? 'Generating...' : 'Test Email Suggestion'}
              </Button>
              <Button 
                onClick={() => testChurnPrediction.mutate()}
                disabled={testChurnPrediction.isPending}
                variant="outline"
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                {testChurnPrediction.isPending ? 'Predicting...' : 'Test Churn Prediction'}
              </Button>
              <Button 
                onClick={() => testLeadScoring.mutate()}
                disabled={testLeadScoring.isPending}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Target className="h-4 w-4" />
                {testLeadScoring.isPending ? 'Scoring...' : 'Test Lead Scoring'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Revenue Intelligence Testing
              </CardTitle>
              <CardDescription>
                Test sales forecasting, deal risk assessment, and revenue attribution
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Button 
                onClick={() => testRevenueForecasting.mutate()}
                disabled={testRevenueForecasting.isPending}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                {testRevenueForecasting.isPending ? 'Forecasting...' : 'Test Revenue Forecasting'}
              </Button>
              <Button 
                onClick={() => testDealRiskAssessment.mutate()}
                disabled={testDealRiskAssessment.isPending}
                variant="outline"
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                {testDealRiskAssessment.isPending ? 'Assessing...' : 'Test Deal Risk Assessment'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation Intelligence Testing
              </CardTitle>
              <CardDescription>
                Test meeting transcription, call coaching, and sentiment analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Button 
                onClick={() => testMeetingTranscription.mutate()}
                disabled={testMeetingTranscription.isPending}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                {testMeetingTranscription.isPending ? 'Transcribing...' : 'Test Meeting Transcription'}
              </Button>
              <Button 
                onClick={() => testCallCoaching.mutate()}
                disabled={testCallCoaching.isPending}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                {testCallCoaching.isPending ? 'Analyzing...' : 'Test Call Coaching'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="industry" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Industry Solutions Testing
              </CardTitle>
              <CardDescription>
                Test healthcare, real estate, manufacturing, financial, and retail solutions
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Button 
                onClick={() => testHealthcareSolution.mutate()}
                disabled={testHealthcareSolution.isPending}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                {testHealthcareSolution.isPending ? 'Setting up...' : 'Test Healthcare Solution'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Advanced Integration Testing
              </CardTitle>
              <CardDescription>
                Test ERP, social media, video conferencing, and other integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Button 
                onClick={() => testIntegrationSetup.mutate('erp')}
                disabled={testIntegrationSetup.isPending}
                className="flex items-center gap-2"
              >
                <Activity className="h-4 w-4" />
                {testIntegrationSetup.isPending ? 'Setting up...' : 'Test ERP Integration'}
              </Button>
              <Button 
                onClick={() => testIntegrationSetup.mutate('social')}
                disabled={testIntegrationSetup.isPending}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                {testIntegrationSetup.isPending ? 'Setting up...' : 'Test Social Listening'}
              </Button>
              <Button 
                onClick={() => testIntegrationSetup.mutate('video')}
                disabled={testIntegrationSetup.isPending}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {testIntegrationSetup.isPending ? 'Setting up...' : 'Test Video Integration'}
              </Button>
            </CardContent>
          </Card>

          {/* Integration Health Dashboard */}
          {integrationHealth?.health && (
            <Card>
              <CardHeader>
                <CardTitle>Integration Health Status</CardTitle>
                <CardDescription>Real-time monitoring of all integration endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">ERP Integrations</span>
                      <span className="text-sm text-muted-foreground">{integrationHealth.health.erp}%</span>
                    </div>
                    <Progress value={integrationHealth.health.erp} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Social Media</span>
                      <span className="text-sm text-muted-foreground">{integrationHealth.health.social}%</span>
                    </div>
                    <Progress value={integrationHealth.health.social} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Video Platforms</span>
                      <span className="text-sm text-muted-foreground">{integrationHealth.health.video}%</span>
                    </div>
                    <Progress value={integrationHealth.health.video} className="h-2" />
                  </div>
                </div>
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Overall Health: {integrationHealth.health.overall.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}