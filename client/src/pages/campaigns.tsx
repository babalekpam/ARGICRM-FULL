import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Megaphone, 
  Calendar, 
  DollarSign, 
  Target, 
  Bot, 
  Zap, 
  TrendingUp, 
  Users, 
  Globe,
  Lightbulb,
  CheckCircle,
  Clock,
  BarChart3
} from "lucide-react";
import Layout from "@/components/layout";
import { apiRequest } from "@/lib/queryClient";
import { ensureAuthForCampaigns, getAuthHeaders } from "@/utils/campaignAuthFix";
import type { Campaign } from "@shared/schema";

export default function CampaignsPage() {
  const [showForm, setShowForm] = useState(false);
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [aiCampaignData, setAiCampaignData] = useState({
    campaignType: 'email',
    targetAudience: '',
    businessGoal: '',
    industry: '',
    personalizationFields: ['Company name', 'Industry vertical']
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Initialize authentication on component mount
  useEffect(() => {
    ensureAuthForCampaigns();
  }, []);

  const { data: campaignsResponse, isLoading } = useQuery({
    queryKey: ["/api/campaigns"],
    queryFn: async () => {
      const headers = getAuthHeaders();
      const response = await fetch("/api/campaigns", { headers });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 0,
  });

  const campaigns = campaignsResponse?.campaigns || [];

  // AI Campaign Builder Mutation
  const createAICampaignMutation = useMutation({
    mutationFn: async (data: typeof aiCampaignData) => {
      const headers = getAuthHeaders();
      const response = await fetch("/api/campaigns/create-ai-campaign", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create AI campaign");
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log('AI Campaign Success Response:', data);
      
      // Show detailed success notification with personalization info
      const personalizationInfo = data.campaign.personalization ? 
        ` Personalization fields: ${data.campaign.personalization.join(', ')}.` : '';
      
      toast({
        title: "AI Campaign Generated Successfully!",
        description: `Campaign "${data.campaign.template}" ready! Expected ${data.campaign.expectedMetrics?.openRate || data.campaign.expectedOpenRate} open rate and ${data.campaign.expectedMetrics?.clickRate || data.campaign.expectedCTR} click-through rate.${personalizationInfo}`,
      });
      
      // Reset form and close modal
      setAiCampaignData({
        campaignType: 'email',
        targetAudience: '',
        businessGoal: '',
        industry: '',
        personalizationFields: ['Company name', 'Industry vertical']
      });
      setShowAIBuilder(false);
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
    },
    onError: (error: any) => {
      console.error('AI Campaign Error:', error);
      toast({
        title: "Campaign Generation Failed",
        description: error.message || "Unable to generate AI campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const headers = getAuthHeaders();
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create campaign");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      setShowForm(false);
      toast({
        title: "Campaign Created Successfully!",
        description: "Your new campaign has been created and is ready to launch.",
      });
    },
    onError: (error) => {
      console.error("Campaign creation failed:", error);
      toast({
        title: "Campaign Creation Failed",
        description: error.message || "Unable to create campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "paused": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "draft": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email": return "📧";
      case "social": return "📱";
      case "webinar": return "🎥";
      case "event": return "🎪";
      default: return "📋";
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  // Handle AI Campaign Generation
  const handleAICampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation check
    if (!aiCampaignData.targetAudience || !aiCampaignData.businessGoal) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in Target Audience and Business Goal to generate your campaign.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Submitting AI Campaign with data:', aiCampaignData);
    createAICampaignMutation.mutate(aiCampaignData);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Megaphone className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Smart Campaigns
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">AI-powered campaigns built for global markets - 94.2% higher success rate</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></div>
                AI-Powered
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Global Ready
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                Smart Automation
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button onClick={() => setShowForm(true)} variant="outline" className="bg-white shadow-md border-slate-200">
              <Plus className="h-4 w-4 mr-2" />
              Manual Campaign
            </Button>
            <Button 
              onClick={() => setShowAIBuilder(true)} 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
            >
              <Bot className="h-4 w-4 mr-2" />
              AI Campaign Builder
            </Button>
          </div>
        </div>

        {/* Personalization Feature Highlight */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">🎯 Dynamic Email Personalization Now Available!</h3>
              <p className="text-indigo-100 mb-4">Create personalized campaigns with 10+ dynamic fields including company name, location, and expansion goals.</p>
              <div className="flex gap-4 text-sm text-indigo-200">
                <span>✓ Company Details</span>
                <span>✓ Contact Information</span>
                <span>✓ Geographic Targeting</span>
                <span>✓ Business Goals</span>
              </div>
            </div>
            <Button 
              onClick={() => setShowAIBuilder(true)} 
              className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-6 py-3"
            >
              <Target className="h-4 w-4 mr-2" />
              Try Personalization
            </Button>
          </div>
        </div>

        {/* Tenant Retention Success Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Global Market Reach</p>
                  <p className="text-2xl font-bold">195+ Countries</p>
                  <p className="text-xs text-green-600">+23% expansion</p>
                </div>
                <Globe className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">AI Success Rate</p>
                  <p className="text-2xl font-bold">94.2%</p>
                  <p className="text-xs text-green-600">vs industry 68%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tenant Retention</p>
                  <p className="text-2xl font-bold">89.7%</p>
                  <p className="text-xs text-green-600">+12% this month</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue Impact</p>
                  <p className="text-2xl font-bold">+340%</p>
                  <p className="text-xs text-green-600">ROI improvement</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Campaign Builder Modal */}
        {showAIBuilder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Bot className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold">AI Campaign Builder</h2>
                </div>
                <Button variant="outline" onClick={() => setShowAIBuilder(false)}>
                  ×
                </Button>
              </div>

              <form onSubmit={handleAICampaignSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="campaignType">Campaign Type</Label>
                    <Select 
                      value={aiCampaignData.campaignType} 
                      onValueChange={(value) => setAiCampaignData({...aiCampaignData, campaignType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email Marketing</SelectItem>
                        <SelectItem value="sms">SMS Marketing</SelectItem>
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Select 
                      value={aiCampaignData.industry} 
                      onValueChange={(value) => setAiCampaignData({...aiCampaignData, industry: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agriculture">Agriculture & Agribusiness</SelectItem>
                        <SelectItem value="mining">Mining & Extraction</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="trading">Import/Export Trading</SelectItem>
                        <SelectItem value="fintech">Financial Services</SelectItem>
                        <SelectItem value="logistics">Logistics & Transportation</SelectItem>
                        <SelectItem value="retail">Retail & E-commerce</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="targetAudience">Target Audience *</Label>
                  <Input
                    id="targetAudience"
                    placeholder="e.g., Fortune 500 enterprises globally, SMBs in North America, Tech startups in Europe"
                    value={aiCampaignData.targetAudience}
                    onChange={(e) => setAiCampaignData({...aiCampaignData, targetAudience: e.target.value})}
                    required
                    className={!aiCampaignData.targetAudience ? "border-red-300" : ""}
                  />
                  {!aiCampaignData.targetAudience && (
                    <p className="text-red-500 text-xs mt-1">Target audience is required</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="businessGoal">Business Goal *</Label>
                  <Textarea
                    id="businessGoal"
                    placeholder="Describe what you want to achieve (e.g., increase trial signups, boost product sales, improve customer retention)"
                    value={aiCampaignData.businessGoal}
                    onChange={(e) => setAiCampaignData({...aiCampaignData, businessGoal: e.target.value})}
                    rows={3}
                    required
                    className={!aiCampaignData.businessGoal ? "border-red-300" : ""}
                  />
                  {!aiCampaignData.businessGoal && (
                    <p className="text-red-500 text-xs mt-1">Business goal is required</p>
                  )}
                </div>

                {/* Personalization Fields Selector - Enhanced Visibility */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5 text-purple-600" />
                    <Label className="text-lg font-semibold text-purple-900">Email Personalization Fields</Label>
                  </div>
                  <p className="text-sm text-purple-700 mb-4">
                    Select which dynamic fields to include in your campaign. Each field will create personalized placeholders in your email content.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      'Company name',
                      'Industry vertical', 
                      'Geographic regions',
                      'Business size & revenue',
                      'Current CRM platform',
                      'Expansion goals',
                      'Contact first name',
                      'Contact last name',
                      'Job title',
                      'Department'
                    ].map((field, index) => (
                      <label key={`personalization-${field}-${index}`} className="flex items-center space-x-3 p-3 bg-white rounded-lg border hover:border-purple-300 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiCampaignData.personalizationFields.includes(field)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAiCampaignData({
                                ...aiCampaignData,
                                personalizationFields: [...aiCampaignData.personalizationFields, field]
                              });
                            } else {
                              setAiCampaignData({
                                ...aiCampaignData,
                                personalizationFields: aiCampaignData.personalizationFields.filter(f => f !== field)
                              });
                            }
                          }}
                          className="w-4 h-4 text-purple-600 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">{field}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                    <p className="text-sm text-purple-800 font-medium mb-2">
                      ✓ Selected: {aiCampaignData.personalizationFields.length} fields
                    </p>
                    {aiCampaignData.personalizationFields.length > 0 && (
                      <div className="bg-white p-3 rounded border">
                        <p className="text-xs text-gray-600 mb-2 font-medium">Live Preview - Dynamic Placeholders:</p>
                        <div className="flex flex-wrap gap-1">
                          {aiCampaignData.personalizationFields.map((field, index) => {
                            const placeholder = field.toUpperCase().replace(/\s+/g, '_');
                            return (
                              <span key={`${field}-${index}`} className="inline-block bg-purple-600 text-white text-xs px-2 py-1 rounded">
                                [{placeholder}]
                              </span>
                            );
                          })}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          These placeholders will be automatically replaced with actual customer data in your emails.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">AI Campaign Features:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Cultural optimization for global markets</li>
                        <li>• Multi-currency and multi-language support</li>
                        <li>• Industry-specific templates and messaging</li>
                        <li>• Best send times for all timezones worldwide</li>
                        <li>• International compliance and regulations</li>
                        <li>• Performance predictions and A/B testing suggestions</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900 mb-2">Tenant Success Metrics:</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• 94.2% higher success rate vs competitors</li>
                        <li>• 340% ROI improvement with cultural optimization</li>
                        <li>• 15 minutes vs 4 hours manual campaign creation</li>
                        <li>• 89.7% tenant retention rate</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowAIBuilder(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createAICampaignMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {createAICampaignMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Generate AI Campaign
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign: Campaign, index: number) => (
            <Card key={`campaign-${campaign.id}-${index}`} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center space-x-2 flex-1">
                  <Megaphone className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <span className="text-lg">{getTypeIcon(campaign.type || "")}</span>
                </div>
                <Badge className={getStatusColor(campaign.status || "draft")}>
                  {campaign.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaign.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{campaign.description}</p>
                  )}
                  
                  {campaign.targetAudience && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Target className="h-4 w-4 mr-2" />
                      {campaign.targetAudience}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {campaign.startDate && (
                      <div className="flex items-center text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        Start: {new Date(campaign.startDate).toLocaleDateString()}
                      </div>
                    )}
                    {campaign.endDate && (
                      <div className="flex items-center text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        End: {new Date(campaign.endDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {campaign.budget && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Budget</span>
                        <span>${parseFloat(campaign.budget).toLocaleString()}</span>
                      </div>
                      {campaign.actualCost && (
                        <div className="space-y-1">
                          <Progress 
                            value={(parseFloat(campaign.actualCost) / parseFloat(campaign.budget)) * 100} 
                            className="h-2" 
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Spent: ${parseFloat(campaign.actualCost).toLocaleString()}</span>
                            <span>{Math.round((parseFloat(campaign.actualCost) / parseFloat(campaign.budget)) * 100)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {campaign.expectedRevenue && (
                    <div className="flex items-center text-sm text-green-600">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Expected: ${parseFloat(campaign.expectedRevenue).toLocaleString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {showForm && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Add New Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createMutation.mutate({
                  name: formData.get("name"),
                  type: formData.get("type"),
                  status: formData.get("status"),
                  description: formData.get("description"),
                  targetAudience: formData.get("targetAudience"),
                  startDate: formData.get("startDate") || null,
                  endDate: formData.get("endDate") || null,
                  budget: formData.get("budget") || null,
                  expectedRevenue: formData.get("expectedRevenue") || null,
                });
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="name" placeholder="Campaign Name" required className="px-3 py-2 border rounded-md" />
                  <select name="type" className="px-3 py-2 border rounded-md">
                    <option value="email">Email</option>
                    <option value="social">Social Media</option>
                    <option value="webinar">Webinar</option>
                    <option value="event">Event</option>
                  </select>
                  
                  <select name="status" className="px-3 py-2 border rounded-md">
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                  
                  <input name="targetAudience" placeholder="Target Audience" className="px-3 py-2 border rounded-md" />
                  <input name="startDate" type="date" placeholder="Start Date" className="px-3 py-2 border rounded-md" />
                  <input name="endDate" type="date" placeholder="End Date" className="px-3 py-2 border rounded-md" />
                  <input name="budget" type="number" step="0.01" placeholder="Budget" className="px-3 py-2 border rounded-md" />
                  <input name="expectedRevenue" type="number" step="0.01" placeholder="Expected Revenue" className="px-3 py-2 border rounded-md" />
                </div>
                
                <textarea name="description" placeholder="Campaign Description" rows={3} className="w-full px-3 py-2 border rounded-md" />
                
                <div className="flex space-x-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Campaign"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}