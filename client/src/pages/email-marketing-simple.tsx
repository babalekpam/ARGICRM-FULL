import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle, Send, Users } from "lucide-react";
import Layout from "@/components/layout";
import { apiRequest } from "@/lib/queryClient";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

export default function EmailMarketingSimple() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  
  // Cold Email States
  const [coldEmailList, setColdEmailList] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [warmupDays, setWarmupDays] = useState(7);
  const [dailyLimit, setDailyLimit] = useState(50);
  const [followUpSequence, setFollowUpSequence] = useState(true);
  const [spamTestMode, setSpamTestMode] = useState(true);

  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ["/api/email/templates"],
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/contacts"],
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/email/send-bulk", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
    },
  });

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
  };

  const handleSendColdEmail = async () => {
    const validEmails = coldEmailList.split('\n').filter(line => line.trim() && line.includes('@'));
    
    if (validEmails.length === 0) {
      alert('Please provide at least one valid email address');
      return;
    }

    if (!customSubject || !customContent) {
      alert('Please provide email subject and content');
      return;
    }

    const coldEmailData = {
      emailList: validEmails,
      template: {
        subject: customSubject,
        htmlContent: customContent,
        textContent: customContent.replace(/<[^>]*>/g, ''),
        personalizedFields: ['firstName', 'company']
      },
      warmupSettings: {
        warmupDays,
        dailyLimit,
        followUpSequence
      },
      testMode: spamTestMode
    };

    sendEmailMutation.mutate(coldEmailData, {
      onSuccess: () => {
        setColdEmailList('');
        setCustomSubject('');
        setCustomContent('');
        alert('Cold email campaign started successfully!');
      }
    });
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Marketing</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Send personalized bulk emails without spam filtering
            </p>
          </div>
          <Badge variant="outline" className="flex items-center">
            <Mail className="h-4 w-4 mr-2" />
            Anti-Spam Optimized
          </Badge>
        </div>

        {/* Active Templates Banner */}
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>✅ All Email Templates Active!</strong> Welcome Email • Monthly Newsletter • Follow-up Email
          </AlertDescription>
        </Alert>

        {/* Email Campaign Tabs */}
        <Tabs defaultValue="warm-emails" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="warm-emails" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Warm Emails (Templates)
            </TabsTrigger>
            <TabsTrigger value="cold-emails" className="flex items-center">
              <Send className="h-4 w-4 mr-2" />
              Cold Email Outreach
            </TabsTrigger>
          </TabsList>

          {/* Warm Email Templates Tab */}
          <TabsContent value="warm-emails" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template: EmailTemplate) => (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer transition-all duration-200 border-2 ${
                    selectedTemplate?.id === template.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        {template.name}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        ACTIVE
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{template.subject}</p>
                    <div className="text-xs text-gray-500 mb-3">
                      Includes personalization fields
                    </div>
                    <Button 
                      onClick={() => handleTemplateSelect(template)}
                      className="w-full"
                    >
                      {selectedTemplate?.id === template.id ? 'Selected ✓' : 'Use Template'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Selected Template Preview */}
            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle>Template Preview: {selectedTemplate.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Subject:</label>
                      <p className="text-sm text-gray-600">{selectedTemplate.subject}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Content Preview:</label>
                      <div 
                        className="mt-2 p-4 bg-gray-50 rounded border text-sm"
                        dangerouslySetInnerHTML={{ __html: selectedTemplate.htmlContent }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {templates.length === 0 && (
              <Alert>
                <AlertDescription>
                  Loading templates...
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Cold Email Outreach Tab */}
          <TabsContent value="cold-emails" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Email List and Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Send className="h-5 w-5 mr-2" />
                    Cold Email Campaign
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      {coldEmailList.split('\n').filter(line => line.trim() && line.includes('@')).length} valid emails
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Quick question about your company growth"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Email Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Hi {{firstName}},&#10;&#10;I noticed {{company}} is growing rapidly in your space..."
                      value={customContent}
                      onChange={(e) => setCustomContent(e.target.value)}
                      rows={8}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use {{firstName}} and {{company}} for personalization
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="warmup-days">Warmup Days</Label>
                      <Input
                        id="warmup-days"
                        type="number"
                        value={warmupDays}
                        onChange={(e) => setWarmupDays(Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="daily-limit">Daily Limit</Label>
                      <Input
                        id="daily-limit"
                        type="number"
                        value={dailyLimit}
                        onChange={(e) => setDailyLimit(Number(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Follow-up Sequence</Label>
                      <input
                        type="checkbox"
                        checked={followUpSequence}
                        onChange={(e) => setFollowUpSequence(e.target.checked)}
                        className="rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Spam Test Mode</Label>
                      <input
                        type="checkbox"
                        checked={spamTestMode}
                        onChange={(e) => setSpamTestMode(e.target.checked)}
                        className="rounded"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      onClick={handleSendColdEmail}
                      className="w-full"
                      disabled={sendEmailMutation.isPending}
                    >
                      {sendEmailMutation.isPending ? "Sending..." : "Start Cold Email Campaign"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Templates for Cold Emails */}
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
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}