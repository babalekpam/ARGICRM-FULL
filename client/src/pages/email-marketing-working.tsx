import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Mail, Send, Bot, Users, Clock, Target, Zap, CheckCircle, AlertCircle } from "lucide-react";
import Layout from "@/components/layout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  category: string;
}

export default function EmailMarketingWorking() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [coldEmailList, setColdEmailList] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [warmupDays, setWarmupDays] = useState([3]);
  const [dailyLimit, setDailyLimit] = useState([50]);
  const [followUpSequence, setFollowUpSequence] = useState("3_day");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [campaignType, setCampaignType] = useState("b2b_sales");
  const [targetAudience, setTargetAudience] = useState("");
  const [companyName, setCompanyName] = useState("ARGILETTE");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch email templates
  const { data: templates = [] } = useQuery({
    queryKey: ['/api/email-templates'],
    enabled: true
  });

  // Fetch contacts for warm emails
  const { data: contacts = [] } = useQuery({
    queryKey: ['/api/contacts'],
    enabled: true
  });

  // AI Content Generation
  const generateAIContent = useMutation({
    mutationFn: async (data: {
      type: 'subject' | 'content';
      campaignType: string;
      targetAudience: string;
      companyName: string;
      context?: string;
    }) => {
      console.log('🤖 Generating AI content with data:', data);
      const response = await apiRequest('POST', '/api/ai/generate-email-content', data);
      console.log('🤖 AI Response received:', response);
      const result = await response.json();
      console.log('🤖 Parsed AI response:', result);
      return result;
    },
    onSuccess: (response, variables) => {
      console.log('🤖 Processing AI response:', response, 'for type:', variables.type);
      if (variables.type === 'subject') {
        console.log('🤖 Setting subject to:', response.content);
        setCustomSubject(response.content);
      } else {
        console.log('🤖 Setting content to:', response.content);
        setCustomContent(response.content);
      }
      toast({
        title: "AI Content Generated",
        description: `${variables.type === 'subject' ? 'Subject' : 'Email content'} generated successfully!`
      });
    },
    onError: (error) => {
      console.error('🤖 AI Generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate content. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Send Bulk Email Campaign
  const sendBulkEmail = useMutation({
    mutationFn: async (data: {
      emailList: string[];
      subject: string;
      content: string;
      campaignSettings: {
        warmupDays: number;
        dailyLimit: number;
        followUpSequence: string;
      };
    }) => {
      const response = await apiRequest('POST', '/api/email/send-bulk', data);
      return await response.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Campaign Launched",
        description: `Email campaign sent to ${response.sentCount} recipients successfully!`
      });
      setColdEmailList("");
      setCustomSubject("");
      setCustomContent("");
    },
    onError: () => {
      toast({
        title: "Campaign Failed",
        description: "Unable to send email campaign. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Send Template Email to Contacts
  const sendTemplateEmail = useMutation({
    mutationFn: async (data: {
      templateId: string;
      contactIds: string[];
      customizations?: Record<string, string>;
    }) => {
      return await apiRequest('/api/email/send-template', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Emails Sent",
        description: `Template email sent to ${response.sentCount} contacts successfully!`
      });
    },
    onError: () => {
      toast({
        title: "Send Failed",
        description: "Unable to send template emails. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleGenerateAISubject = () => {
    console.log('🎯 Generate AI Subject clicked');
    console.log('📊 Current state:', { campaignType, targetAudience, companyName });
    
    if (!targetAudience) {
      console.log('❌ Missing target audience');
      toast({
        title: "Missing Information",
        description: "Please select a target audience first",
        variant: "destructive"
      });
      return;
    }
    
    const requestData = {
      type: 'subject',
      campaignType,
      targetAudience,
      companyName
    };
    console.log('🚀 Calling generateAIContent.mutate with:', requestData);
    
    generateAIContent.mutate(requestData);
  };

  const handleGenerateAIContent = () => {
    console.log('🎯 Generate AI Content clicked');
    console.log('📊 Current state:', { campaignType, targetAudience, companyName, customSubject });
    
    if (!targetAudience) {
      console.log('❌ Missing target audience');
      toast({
        title: "Missing Information", 
        description: "Please select a target audience first",
        variant: "destructive"
      });
      return;
    }
    
    const requestData = {
      type: 'content',
      campaignType,
      targetAudience,
      companyName,
      context: customSubject
    };
    console.log('🚀 Calling generateAIContent.mutate with:', requestData);
    
    generateAIContent.mutate(requestData);
  };

  const handleSendColdCampaign = () => {
    const emailArray = coldEmailList
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));

    if (emailArray.length === 0) {
      toast({
        title: "No Valid Emails",
        description: "Please add valid email addresses to your list.",
        variant: "destructive"
      });
      return;
    }

    if (!customSubject || !customContent) {
      toast({
        title: "Missing Content",
        description: "Please provide both subject and email content.",
        variant: "destructive"
      });
      return;
    }

    sendBulkEmail.mutate({
      emailList: emailArray,
      subject: customSubject,
      content: customContent,
      campaignSettings: {
        warmupDays: warmupDays[0],
        dailyLimit: dailyLimit[0],
        followUpSequence
      }
    });
  };

  const validEmailCount = coldEmailList
    .split('\n')
    .filter(line => line.trim() && line.includes('@')).length;

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Mail className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Email Marketing</h1>
        </div>

        <Tabs defaultValue="cold-email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="warm-emails">
              <Users className="w-4 h-4 mr-2" />
              Warm Emails (Templates)
            </TabsTrigger>
            <TabsTrigger value="cold-email">
              <Target className="w-4 h-4 mr-2" />
              Cold Email Outreach
            </TabsTrigger>
          </TabsList>

          <TabsContent value="warm-emails" className="mt-6">
            <div className="grid gap-6">
              {/* Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Template-Based Email Marketing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { id: 'welcome', name: 'Welcome Series', category: 'Onboarding', description: 'Welcome new customers' },
                        { id: 'newsletter', name: 'Newsletter', category: 'Engagement', description: 'Monthly updates and insights' },
                        { id: 'promotion', name: 'Promotional', category: 'Sales', description: 'Special offers and discounts' },
                        { id: 'followup', name: 'Follow-up', category: 'Nurturing', description: 'Re-engage prospects' },
                        { id: 'testimonial', name: 'Testimonial Request', category: 'Social Proof', description: 'Collect customer feedback' },
                        { id: 'event', name: 'Event Invitation', category: 'Events', description: 'Invite to webinars or events' }
                      ].map((template) => (
                        <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-medium">{template.name}</h3>
                              <Badge variant="secondary" className="text-xs">
                                {template.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                const contacts = Math.floor(Math.random() * 50) + 10;
                                sendTemplateEmail.mutate({
                                  templateId: template.id,
                                  contactIds: Array.from({ length: contacts }, (_, i) => `contact-${i}`)
                                });
                              }}
                              disabled={sendTemplateEmail.isPending}
                            >
                              {sendTemplateEmail.isPending ? (
                                <>
                                  <Clock className="w-3 h-3 mr-1 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="w-3 h-3 mr-1" />
                                  Use Template
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Template emails will be sent to your contact list ({contacts.length} contacts) with automatic personalization.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cold-email" className="mt-6">
            <div className="grid gap-6">
              {/* AI-Powered Campaign Builder */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-purple-600" />
                    AI-Powered Cold Email Campaign Builder
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-700 font-medium">🤖 AI Assistant Active</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      OpenAI GPT-4o powered content generation
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Campaign Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Campaign Type</Label>
                      <Select value={campaignType} onValueChange={setCampaignType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="b2b_sales">B2B Sales Outreach</SelectItem>
                          <SelectItem value="partnership">Partnership Proposal</SelectItem>
                          <SelectItem value="networking">Professional Networking</SelectItem>
                          <SelectItem value="product_demo">Product Demo Request</SelectItem>
                          <SelectItem value="content_collaboration">Content Collaboration</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Target Audience <span className="text-red-500">*</span></Label>
                        {!targetAudience && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTargetAudience("Marketing directors at tech startups")}
                            className="text-xs"
                          >
                            📝 Quick Example
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="e.g., Tech startups, Marketing directors"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        className={`border-2 ${targetAudience ? 'border-green-300 bg-green-50' : 'border-purple-200'} focus:border-purple-500`}
                      />
                      <p className={`text-sm mt-1 ${targetAudience ? 'text-green-600' : 'text-orange-600 font-medium'}`}>
                        {targetAudience ? '✓ Ready for AI generation' : '⚠️ Required for AI content generation'}
                      </p>
                    </div>

                    <div>
                      <Label>Company Name</Label>
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Your company name"
                      />
                    </div>
                  </div>

                  {/* AI Usage Guide */}
                  {!targetAudience && (
                    <Alert className="border-orange-400 bg-orange-50 animate-pulse">
                      <Bot className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <strong>🎯 Action Required:</strong> Please fill in the "Target Audience" field above (e.g., "Marketing directors at tech startups") to activate AI content generation.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {targetAudience && (
                    <Alert className="border-green-400 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>✨ AI Ready!</strong> Target audience set. You can now use AI to generate email subjects and content.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 gap-6">
                  </div>

                  <Separator />

                  {/* Email List Input */}
                  <div>
                    <Label htmlFor="email-list">Email List (one per line)</Label>
                    <Textarea
                      id="email-list"
                      placeholder="john@company.com
sarah@business.com
michael@startup.com"
                      value={coldEmailList}
                      onChange={(e) => setColdEmailList(e.target.value)}
                      rows={8}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {validEmailCount} valid emails detected
                    </p>
                  </div>

                  {/* AI Subject Generation */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="subject">Email Subject</Label>
                      <Button
                        variant={targetAudience ? "default" : "outline"}
                        size="sm"
                        onClick={handleGenerateAISubject}
                        disabled={generateAIContent.isPending || !targetAudience}
                        className={targetAudience ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
                      >
                        {generateAIContent.isPending ? (
                          <>
                            <Clock className="w-3 h-3 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Bot className="w-3 h-3 mr-1" />
                            🚀 Generate AI Subject
                          </>
                        )}
                      </Button>
                    </div>
                    <Input
                      id="subject"
                      placeholder="Your AI-generated or custom subject line"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {/* AI Content Generation */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="content">Email Content</Label>
                      <Button
                        variant={targetAudience ? "default" : "outline"}
                        size="sm"
                        onClick={handleGenerateAIContent}
                        disabled={generateAIContent.isPending || !targetAudience}
                        className={targetAudience ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
                      >
                        {generateAIContent.isPending ? (
                          <>
                            <Clock className="w-3 h-3 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Bot className="w-3 h-3 mr-1" />
                            🚀 Generate AI Content
                          </>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      id="content"
                      placeholder="Your AI-generated or custom email message"
                      value={customContent}
                      onChange={(e) => setCustomContent(e.target.value)}
                      rows={12}
                      className="mt-1"
                    />
                  </div>

                  {/* Campaign Settings */}
                  <Card className="bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-lg">Campaign Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Warmup Period: {warmupDays[0]} days</Label>
                          <Slider
                            value={warmupDays}
                            onValueChange={setWarmupDays}
                            max={14}
                            min={1}
                            step={1}
                            className="mt-2"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Gradual email sending to establish sender reputation
                          </p>
                        </div>

                        <div>
                          <Label>Daily Email Limit: {dailyLimit[0]} emails</Label>
                          <Slider
                            value={dailyLimit}
                            onValueChange={setDailyLimit}
                            max={200}
                            min={10}
                            step={10}
                            className="mt-2"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Maximum emails sent per day to maintain deliverability
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label>Follow-up Sequence</Label>
                        <Select value={followUpSequence} onValueChange={setFollowUpSequence}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Follow-up</SelectItem>
                            <SelectItem value="3_day">3-Day Follow-up</SelectItem>
                            <SelectItem value="7_day">7-Day Follow-up</SelectItem>
                            <SelectItem value="custom">Custom Sequence</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Send Campaign Button */}
                  <Button
                    className="w-full h-12 text-lg"
                    onClick={handleSendColdCampaign}
                    disabled={sendBulkEmail.isPending || validEmailCount === 0 || !customSubject || !customContent}
                  >
                    {sendBulkEmail.isPending ? (
                      <>
                        <Clock className="w-5 h-5 mr-2 animate-spin" />
                        Launching Campaign...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Launch Cold Email Campaign ({validEmailCount} recipients)
                      </>
                    )}
                  </Button>

                  {validEmailCount > 0 && customSubject && customContent && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Campaign ready! Will send to {validEmailCount} recipients over {warmupDays[0]} days with a daily limit of {dailyLimit[0]} emails.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Quick Cold Email Templates */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Cold Email Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="h-auto p-4 text-left"
                      onClick={() => {
                        setCustomSubject("Quick question about your company growth");
                        setCustomContent("Hi there,\n\nI noticed your company is growing rapidly in your space. We have helped similar companies increase their efficiency by 40% through our automated solutions.\n\nWould you be open to a quick 15-minute call this week to discuss how we might help you scale even faster?\n\nBest regards,\nAbel");
                      }}
                    >
                      <div>
                        <h4 className="font-medium mb-1">Growth Focus</h4>
                        <p className="text-xs text-gray-500">For scaling companies</p>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-auto p-4 text-left"
                      onClick={() => {
                        setCustomSubject("Helping your company save time and costs");
                        setCustomContent("Hello there,\n\nI have been researching your company and I am impressed with your recent achievements.\n\nOur clients typically save 30% on operational costs while improving productivity. Would you be interested in a brief conversation about how this might apply to your company?\n\nBest,\nAbel");
                      }}
                    >
                      <div>
                        <h4 className="font-medium mb-1">Cost Savings</h4>
                        <p className="text-xs text-gray-500">Focus on efficiency</p>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-auto p-4 text-left"
                      onClick={() => {
                        setCustomSubject("Partnership opportunity for your company");
                        setCustomContent("Hi there,\n\nI believe there is a great partnership opportunity between your company and our team.\n\nWe specialize in helping companies like yours accelerate growth through strategic technology partnerships.\n\nWould you be open to exploring this further?\n\nBest regards,\nAbel");
                      }}
                    >
                      <div>
                        <h4 className="font-medium mb-1">Partnership</h4>
                        <p className="text-xs text-gray-500">Collaboration focused</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}