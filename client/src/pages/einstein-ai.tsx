import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Users, 
  DollarSign, 
  Mail, 
  Phone, 
  Calendar,
  Lightbulb,
  Zap,
  BarChart3,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trophy,
  Rocket,
  Eye
} from "lucide-react";

interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  category: string;
  data: Record<string, any>;
  createdAt: string;
}

interface LeadScore {
  leadId: string;
  leadName: string;
  company: string;
  score: number;
  reasons: string[];
  conversionProbability: number;
  recommendedActions: string[];
  lastActivity: string;
}

interface DealPrediction {
  dealId: string;
  dealName: string;
  currentValue: number;
  predictedValue: number;
  closeProbability: number;
  predictedCloseDate: string;
  riskFactors: string[];
  successFactors: string[];
  recommendedActions: string[];
}

export default function EinsteinAI() {
  const [activeTab, setActiveTab] = useState("overview");

  // Google AI-powered insights
  const { data: aiInsights = [] } = useQuery({
    queryKey: ["/api/ai-insights"],
    queryFn: async () => {
      // Try to get real AI insights, fallback to mock data
      try {
        const response = await fetch('/api/ai/predict-behavior', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            interactions: 20,
            lastContactDays: 2,
            responseRate: 0.85,
            purchaseHistory: 3,
            supportTickets: 0
          }),
        });
        
        if (response.ok) {
          const prediction = await response.json();
          return [
            {
              id: "insight-ai-1",
              type: "prediction" as const,
              title: "AI Customer Behavior Analysis",
              description: `${prediction.nextBestAction} - Engagement score: ${Math.round(prediction.engagementScore * 100)}%`,
              confidence: Math.round(prediction.confidence * 100),
              impact: "high" as const,
              category: "Google AI Prediction",
              data: prediction,
              createdAt: new Date().toISOString()
            }
          ];
        }
      } catch (error) {
        console.log('Using fallback insights');
      }
      
      return [
      {
        id: "insight-1",
        type: "opportunity" as const,
        title: "High-Value Lead Identified",
        description: "Acme Corp shows strong buying signals with 87% conversion probability",
        confidence: 87,
        impact: "high" as const,
        category: "Lead Scoring",
        data: { leadId: "lead-123", company: "Acme Corp", value: 150000 },
        createdAt: "2024-06-24T09:30:00Z"
      },
      {
        id: "insight-2",
        type: "risk" as const,
        title: "Deal at Risk",
        description: "TechStart deal showing declining engagement - intervention needed",
        confidence: 78,
        impact: "high" as const,
        category: "Deal Management",
        data: { dealId: "deal-456", company: "TechStart", value: 75000 },
        createdAt: "2024-06-24T08:15:00Z"
      },
      {
        id: "insight-3",
        type: "prediction" as const,
        title: "Revenue Forecast Updated",
        description: "Q3 revenue likely to exceed target by 12% based on current pipeline",
        confidence: 82,
        impact: "medium" as const,
        category: "Forecasting",
        data: { quarter: "Q3", variance: "+12%", amount: 2640000 },
        createdAt: "2024-06-24T07:45:00Z"
      },
      {
        id: "insight-4",
        type: "recommendation" as const,
        title: "Optimize Email Timing",
        description: "Send emails to Enterprise leads on Tuesday 10AM for 23% higher open rates",
        confidence: 91,
        impact: "medium" as const,
        category: "Marketing",
        data: { segment: "Enterprise", day: "Tuesday", time: "10:00 AM", improvement: "23%" },
        createdAt: "2024-06-24T06:20:00Z"
      },
      {
        id: "insight-5",
        type: "recommendation" as const,
        title: "Urgent: Follow up on Hot Leads",
        description: "3 high-value leads haven't been contacted in 72+ hours - immediate action required",
        confidence: 95,
        impact: "high" as const,
        category: "Lead Management",
        data: { urgentLeads: 3, averageValue: 125000, hoursOverdue: 76 },
        createdAt: "2024-06-24T05:15:00Z"
      }
    ];
    }
  });

  // Mock lead scores
  const { data: leadScores = [] } = useQuery({
    queryKey: ["/api/ai-lead-scores"],
    queryFn: () => Promise.resolve([
      {
        leadId: "lead-1",
        leadName: "Sarah Johnson",
        company: "Acme Corp",
        score: 94,
        reasons: [
          "Multiple webpage visits",
          "Downloaded pricing sheet",
          "Company size matches ICP",
          "Budget authority confirmed"
        ],
        conversionProbability: 87,
        recommendedActions: [
          "Schedule demo within 24 hours",
          "Send enterprise case study",
          "Connect with decision maker"
        ],
        lastActivity: "2024-06-24T10:30:00Z"
      },
      {
        leadId: "lead-2",
        leadName: "Mike Chen",
        company: "TechFlow Inc",
        score: 76,
        reasons: [
          "Attended webinar",
          "High email engagement",
          "Technology company (target segment)"
        ],
        conversionProbability: 64,
        recommendedActions: [
          "Send technical whitepaper",
          "Invite to product demo",
          "Follow up on specific use case"
        ],
        lastActivity: "2024-06-23T15:45:00Z"
      },
      {
        leadId: "lead-3",
        leadName: "Emma Rodriguez",
        company: "Growth Labs",
        score: 58,
        reasons: [
          "Organic website visit",
          "Signed up for newsletter",
          "SMB segment potential"
        ],
        conversionProbability: 34,
        recommendedActions: [
          "Nurture with educational content",
          "Qualify budget and timeline",
          "Identify pain points"
        ],
        lastActivity: "2024-06-22T11:20:00Z"
      }
    ])
  });

  // Mock deal predictions
  const { data: dealPredictions = [] } = useQuery({
    queryKey: ["/api/ai-deal-predictions"],
    queryFn: () => Promise.resolve([
      {
        dealId: "deal-1",
        dealName: "Acme Corp - Enterprise License",
        currentValue: 150000,
        predictedValue: 165000,
        closeProbability: 89,
        predictedCloseDate: "2024-07-15",
        riskFactors: [],
        successFactors: [
          "Strong champion identified",
          "Budget approved",
          "Technical requirements met",
          "Timeline matches urgency"
        ],
        recommendedActions: [
          "Prepare contract for signature",
          "Schedule final stakeholder meeting",
          "Confirm implementation timeline"
        ]
      },
      {
        dealId: "deal-2",
        dealName: "TechStart - Professional Plan",
        currentValue: 75000,
        predictedValue: 72000,
        closeProbability: 45,
        predictedCloseDate: "2024-08-30",
        riskFactors: [
          "Budget concerns raised",
          "Competitor evaluation ongoing",
          "Decision delayed twice"
        ],
        successFactors: [
          "Product demo well received",
          "Technical team engaged"
        ],
        recommendedActions: [
          "Address budget concerns with ROI analysis",
          "Competitive battle card review",
          "Executive sponsor engagement"
        ]
      }
    ])
  });

  const getInsightIcon = (type: string) => {
    const icons = {
      opportunity: Trophy,
      risk: AlertTriangle,
      prediction: Crystal,
      recommendation: Lightbulb
    };
    return icons[type as keyof typeof icons] || Brain;
  };

  const getInsightColor = (type: string) => {
    const colors = {
      opportunity: "text-green-600 bg-green-100",
      risk: "text-red-600 bg-red-100",
      prediction: "text-blue-600 bg-blue-100",
      recommendation: "text-purple-600 bg-purple-100"
    };
    return colors[type as keyof typeof colors] || "text-gray-600 bg-gray-100";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Brain className="mr-3 h-8 w-8 text-blue-600" />
              Einstein AI
            </h1>
            <p className="text-gray-600 mt-1">AI-powered insights and predictions for your sales process</p>
          </div>
          <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <Zap className="mr-1 h-4 w-4" />
            AI Powered
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="lead-scoring">Lead Scoring</TabsTrigger>
            <TabsTrigger value="deal-predictions">Deal Predictions</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* AI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Insights</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{aiInsights.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Generated today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">High Score Leads</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {leadScores.filter(lead => lead.score >= 80).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Score 80+ leads
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Predicted Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(dealPredictions.reduce((sum, deal) => sum + deal.predictedValue, 0))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This quarter
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Win Probability</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dealPredictions.length > 0 
                      ? Math.round(dealPredictions.reduce((sum, deal) => sum + deal.closeProbability, 0) / dealPredictions.length)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average across deals
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Latest AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Latest AI Insights</CardTitle>
                <CardDescription>Most recent AI-generated insights and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiInsights.slice(0, 4).map((insight) => {
                    const IconComponent = getInsightIcon(insight.type);
                    return (
                      <div key={insight.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                        <div className={`p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{insight.title}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {insight.confidence}% confidence
                              </Badge>
                              <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
                                {insight.impact} impact
                              </Badge>
                            </div>
                          </div>
                          <p className="text-gray-600">{insight.description}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {insight.category} • {new Date(insight.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Scoring Leads */}
            <Card>
              <CardHeader>
                <CardTitle>Top Scoring Leads</CardTitle>
                <CardDescription>Leads with highest AI-generated scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leadScores.slice(0, 3).map((lead) => (
                    <div key={lead.leadId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {lead.score}
                        </div>
                        <div>
                          <p className="font-medium">{lead.leadName}</p>
                          <p className="text-sm text-gray-600">{lead.company}</p>
                          <p className="text-xs text-gray-500">
                            {lead.conversionProbability}% conversion probability
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Button size="sm" className="mb-2">
                          <Mail className="mr-2 h-4 w-4" />
                          Contact
                        </Button>
                        <p className="text-xs text-gray-500">
                          Last activity: {new Date(lead.lastActivity).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {aiInsights.map((insight) => {
                const IconComponent = getInsightIcon(insight.type);
                return (
                  <Card key={insight.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <span>{insight.title}</span>
                      </CardTitle>
                      <CardDescription>{insight.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-700">{insight.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Confidence</p>
                          <div className="flex items-center space-x-2">
                            <Progress value={insight.confidence} className="w-20" />
                            <span className="text-sm font-medium">{insight.confidence}%</span>
                          </div>
                        </div>
                        <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
                          {insight.impact} impact
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <p className="text-xs text-gray-500">
                          {new Date(insight.createdAt).toLocaleString()}
                        </p>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="lead-scoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Lead Scoring</CardTitle>
                <CardDescription>
                  Machine learning-powered lead qualification and prioritization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {leadScores.map((lead) => (
                    <div key={lead.leadId} className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg ${getScoreColor(lead.score)} bg-gradient-to-r from-blue-500 to-purple-500`}>
                            {lead.score}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{lead.leadName}</h3>
                            <p className="text-gray-600">{lead.company}</p>
                            <Badge className="mt-1">
                              {lead.conversionProbability}% conversion probability
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <Button className="mb-2">
                            <Phone className="mr-2 h-4 w-4" />
                            Call Now
                          </Button>
                          <p className="text-xs text-gray-500">
                            Last activity: {new Date(lead.lastActivity).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3">Scoring Factors</h4>
                          <div className="space-y-2">
                            {lead.reasons.map((reason, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">{reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-3">Recommended Actions</h4>
                          <div className="space-y-2">
                            {lead.recommendedActions.map((action, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Rocket className="h-4 w-4 text-blue-600" />
                                <span className="text-sm">{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deal-predictions" className="space-y-6">
            <div className="space-y-6">
              {dealPredictions.map((deal) => (
                <Card key={deal.dealId}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{deal.dealName}</span>
                      <Badge className={deal.closeProbability >= 70 ? "bg-green-100 text-green-800" : deal.closeProbability >= 40 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                        {deal.closeProbability}% close probability
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-gray-600">Current Value</p>
                        <p className="text-2xl font-bold">{formatCurrency(deal.currentValue)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Predicted Value</p>
                        <p className="text-2xl font-bold">{formatCurrency(deal.predictedValue)}</p>
                        <p className="text-xs text-gray-500">
                          {deal.predictedValue > deal.currentValue ? '+' : ''}{formatCurrency(deal.predictedValue - deal.currentValue)} variance
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Predicted Close Date</p>
                        <p className="text-lg font-semibold">{new Date(deal.predictedCloseDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {deal.riskFactors.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3 text-red-600">Risk Factors</h4>
                          <div className="space-y-2">
                            {deal.riskFactors.map((factor, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <span className="text-sm">{factor}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium mb-3 text-green-600">Success Factors</h4>
                        <div className="space-y-2">
                          {deal.successFactors.map((factor, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm">{factor}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3 text-blue-600">Recommended Actions</h4>
                        <div className="space-y-2">
                          {deal.recommendedActions.map((action, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <Lightbulb className="h-4 w-4 text-blue-600" />
                              <span className="text-sm">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
                <CardDescription>
                  Personalized suggestions to improve your sales performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiInsights
                    .filter(insight => insight.type === 'recommendation')
                    .map((recommendation) => (
                      <div key={recommendation.id} className="border rounded-lg p-6">
                        <div className="flex items-start space-x-4">
                          <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                            <Lightbulb className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">{recommendation.title}</h3>
                            <p className="text-gray-600 mb-4">{recommendation.description}</p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <Badge variant="outline">
                                  {recommendation.confidence}% confidence
                                </Badge>
                                <Badge variant={recommendation.impact === 'high' ? 'destructive' : recommendation.impact === 'medium' ? 'default' : 'secondary'}>
                                  {recommendation.impact} impact
                                </Badge>
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Button>
                                <Button size="sm">
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Apply
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// Crystal icon component for predictions
function Crystal({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55.47.98.97 1.21C11.62 18.75 12 19.24 12 20s-.38 1.25-1.03 1.79c-.5.23-.97.56-.97 1.21" />
      <path d="M14 14.66V17c0 .55-.47.98-.97 1.21C12.38 18.75 12 19.24 12 20s.38 1.25 1.03 1.79c.5.23.97.56.97 1.21" />
      <path d="M18 2H6l-2 7h16l-2-7Z" />
    </svg>
  );
}