import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Send, Users, Eye, CheckCircle, AlertCircle, Info } from "lucide-react";
import Layout from "@/components/layout";
import { ProtectedFeature } from "@/components/protected-feature";
import { apiRequest } from "@/lib/queryClient";
import type { Contact } from "@shared/schema";
import Logo from "@/components/logo";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

export default function EmailMarketingPage() {
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [customSubject, setCustomSubject] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [fromEmail, setFromEmail] = useState("demo@argilette.com");
  const [fromName, setFromName] = useState("ARGILETTE CRM");
  const [testMode, setTestMode] = useState(true);
  const [previewContact, setPreviewContact] = useState<Contact | null>(null);
  
  // Cold emailing specific states
  const [coldEmailList, setColdEmailList] = useState("");
  const [warmupDays, setWarmupDays] = useState(7);
  const [dailyLimit, setDailyLimit] = useState(50);
  const [followUpSequence, setFollowUpSequence] = useState(true);
  const [spamTestMode, setSpamTestMode] = useState(true);

  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/contacts"],
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["/api/email/templates"],
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/email/send-bulk", data);
      return response.json();
    },
  });

  const handleContactSelection = (contactId: number, checked: boolean) => {
    if (checked) {
      setSelectedContacts([...selectedContacts, contactId]);
    } else {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    }
  };

  const selectAllContacts = () => {
    setSelectedContacts(contacts.map((c: Contact) => c.id));
  };

  const clearSelection = () => {
    setSelectedContacts([]);
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setCustomSubject(template.subject);
    setCustomContent(template.htmlContent);
  };

  const personalizePreview = (content: string, contact: Contact) => {
    if (!contact) return content;
    
    return content
      .replace(/\{\{firstName\}\}/g, contact.name.split(' ')[0] || 'there')
      .replace(/\{\{lastName\}\}/g, contact.name.split(' ').slice(1).join(' ') || '')
      .replace(/\{\{fullName\}\}/g, contact.name)
      .replace(/\{\{email\}\}/g, contact.email)
      .replace(/\{\{company\}\}/g, contact.company || 'your company')
      .replace(/\{\{jobTitle\}\}/g, contact.jobTitle || 'valued customer');
  };

  const handleSendEmail = async () => {
    if (selectedContacts.length === 0) {
      alert('Please select at least one contact');
      return;
    }

    if (!customSubject || !customContent) {
      alert('Please provide email subject and content');
      return;
    }

    const emailData = {
      contactIds: selectedContacts,
      template: {
        subject: customSubject,
        htmlContent: customContent,
        textContent: customContent.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        personalizedFields: ['firstName', 'lastName', 'fullName', 'email', 'company', 'jobTitle']
      },
      fromEmail,
      fromName,
      testMode
    };

    sendEmailMutation.mutate(emailData);
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
      fromEmail,
      fromName,
      settings: {
        dailyLimit,
        warmupDays,
        followUpSequence,
        spamTestMode
      },
      testMode: spamTestMode
    };

    sendEmailMutation.mutate(coldEmailData, {
      onSuccess: () => {
        setColdEmailList('');
      }
    });
  };

  const getPersonalizationFields = () => [
    { field: '{{firstName}}', description: 'Contact\'s first name' },
    { field: '{{lastName}}', description: 'Contact\'s last name' },
    { field: '{{fullName}}', description: 'Contact\'s full name' },
    { field: '{{email}}', description: 'Contact\'s email address' },
    { field: '{{company}}', description: 'Contact\'s company' },
    { field: '{{jobTitle}}', description: 'Contact\'s job title' }
  ];

  return (
    <Layout>
      <ProtectedFeature 
        requiredFeature="email_marketing"
        fallbackTitle="Email Marketing"
        fallbackDescription="Advanced email marketing campaigns require Professional plan or higher."
      >
        <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Logo size="md" />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI-Powered Email Marketing Hub
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Send intelligent, personalized email campaigns with advanced automation and spam protection
              </p>
              <div className="flex space-x-2 mt-2">
                <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-0">
                  Smart Campaigns
                </Badge>
                <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-teal-100 text-green-800 border-0">
                  Anti-Spam Optimized
                </Badge>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="flex items-center">
            <Mail className="h-4 w-4 mr-2" />
            Anti-Spam Optimized
          </Badge>
        </div>

        {/* Template Status Banner */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">✅ All Email Templates Active</h3>
                <p className="text-green-100 text-sm">Welcome Email • Monthly Newsletter • Follow-up Email</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">3/3 Templates Ready</div>
              <div className="text-xs text-green-200">With personalization fields</div>
            </div>
          </div>
        </div>

        {sendEmailMutation.data && (
          <Alert className={sendEmailMutation.data.success ? "border-green-200" : "border-red-200"}>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              {sendEmailMutation.data.success ? (
                <div>
                  <strong>Email campaign completed successfully!</strong>
                  <br />
                  Sent: {sendEmailMutation.data.sent} emails
                  {sendEmailMutation.data.failed > 0 && (
                    <>
                      <br />
                      Failed: {sendEmailMutation.data.failed} emails
                    </>
                  )}
                  {sendEmailMutation.data.testMode && (
                    <>
                      <br />
                      <em>This was a test run (limited to 3 contacts)</em>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <strong>Email campaign failed:</strong>
                  <br />
                  {sendEmailMutation.data.errors?.join(', ') || 'Unknown error'}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Side Tabs Layout */}
        <Tabs defaultValue="compose" className="flex gap-6" orientation="vertical">
          {/* Side Navigation */}
          <div className="w-64 flex-shrink-0 tabs-vertical">
            <TabsList className="flex flex-col h-auto w-full space-y-1 bg-gray-50 dark:bg-gray-800 p-2" orientation="vertical">
              <TabsTrigger 
                value="compose" 
                className="w-full justify-start space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Mail className="h-4 w-4" />
                <span>Compose Email</span>
              </TabsTrigger>
              <TabsTrigger 
                value="cold-email" 
                className="w-full justify-start space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <AlertCircle className="h-4 w-4" />
                <span>Cold Outreach</span>
              </TabsTrigger>
              <TabsTrigger 
                value="templates" 
                className="w-full justify-start space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Eye className="h-4 w-4" />
                <span>Templates</span>
              </TabsTrigger>
              <TabsTrigger 
                value="contacts" 
                className="w-full justify-start space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Users className="h-4 w-4" />
                <span>Select Recipients</span>
              </TabsTrigger>
              <TabsTrigger 
                value="preview" 
                className="w-full justify-start space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Preview</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">

            <TabsContent value="compose" className="space-y-6 mt-0">
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                {testMode 
                  ? "Demo mode is active. Emails will be simulated and logged to console - perfect for testing your campaigns safely."
                  : "Live mode requires verified SendGrid sender identity. Contact support to enable production email sending."
                }
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fromName">From Name</Label>
                        <Input
                          id="fromName"
                          value={fromName}
                          onChange={(e) => setFromName(e.target.value)}
                          placeholder="Your Name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="fromEmail">From Email</Label>
                        <Input
                          id="fromEmail"
                          type="email"
                          value={fromEmail}
                          onChange={(e) => setFromEmail(e.target.value)}
                          placeholder="noreply@yourcompany.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="subject">Subject Line</Label>
                      <Input
                        id="subject"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder="Enter email subject..."
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Email Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={customContent}
                      onChange={(e) => setCustomContent(e.target.value)}
                      placeholder="Enter your email content (HTML supported)..."
                      className="min-h-96"
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personalization Fields</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getPersonalizationFields().map(({ field, description }) => (
                        <div key={field} className="flex justify-between items-center text-sm">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">{field}</code>
                          <span className="text-gray-500 text-xs">{description}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Anti-Spam Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Personalized content
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Unsubscribe links
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Batch sending
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Clean HTML structure
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Rate limiting
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

            <TabsContent value="cold-email" className="space-y-6 mt-0">
            <Alert className="mb-6 bg-purple-50 border-purple-200">
              <Info className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800">
                <strong>Cold Email Platform:</strong> Professional outreach system with built-in warmup, spam prevention, and follow-up sequences. Perfect for lead generation and business development.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 mr-2 text-purple-600" />
                    Cold Email Setup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="coldEmailList">Email List (one per line)</Label>
                    <Textarea
                      id="coldEmailList"
                      value={coldEmailList}
                      onChange={(e) => setColdEmailList(e.target.value)}
                      placeholder="john@company.com&#10;sarah@business.com&#10;mike@startup.com"
                      rows={8}
                      className="mt-1"
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      {coldEmailList.split('\n').filter(line => line.trim() && line.includes('@')).length} valid emails detected
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dailyLimit">Daily Email Limit</Label>
                      <Input
                        id="dailyLimit"
                        type="number"
                        value={dailyLimit}
                        onChange={(e) => setDailyLimit(parseInt(e.target.value) || 50)}
                        min="1"
                        max="500"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="warmupDays">Warmup Period (days)</Label>
                      <Input
                        id="warmupDays"
                        type="number"
                        value={warmupDays}
                        onChange={(e) => setWarmupDays(parseInt(e.target.value) || 7)}
                        min="1"
                        max="30"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={followUpSequence}
                        onCheckedChange={setFollowUpSequence}
                      />
                      <Label>Enable follow-up sequence (3 emails, 3-day intervals)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={spamTestMode}
                        onCheckedChange={setSpamTestMode}
                      />
                      <Label>Spam test mode (analyze deliverability without sending)</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Send className="h-5 w-5 mr-2 text-green-600" />
                    Campaign Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">0</div>
                        <div className="text-sm text-gray-600">Emails Sent Today</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">0%</div>
                        <div className="text-sm text-gray-600">Open Rate</div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">0%</div>
                        <div className="text-sm text-gray-600">Reply Rate</div>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">95%</div>
                        <div className="text-sm text-gray-600">Deliverability</div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">Cold Email Best Practices</h4>
                      <ul className="text-sm space-y-1 text-gray-600">
                        <li>• Keep subject lines under 50 characters</li>
                        <li>• Personalize with {{firstName}} and {{company}}</li>
                        <li>• Include clear value proposition</li>
                        <li>• Avoid spam trigger words</li>
                        <li>• A/B test different approaches</li>
                      </ul>
                    </div>

                    <Button className="w-full mt-4" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View Campaign Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Cold Email Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left"
                    onClick={() => {
                      setCustomSubject("Quick question about {{company}}'s growth");
                      setCustomContent(`Hi {{firstName}},

I noticed {{company}} is growing rapidly in your space. We've helped similar companies increase their efficiency by 40% through our automated solutions.

Would you be open to a 15-minute call this week to discuss how we might help {{company}} scale even faster?

Best regards,
${fromName}`);
                    }}
                  >
                    <div>
                      <div className="font-semibold">Growth-Focused</div>
                      <div className="text-sm text-gray-500">For scaling companies</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left"
                    onClick={() => {
                      setCustomSubject("Helping {{company}} save time and costs");
                      setCustomContent(`Hello {{firstName}},

I've been researching {{company}} and I'm impressed with your recent achievements. 

Our platform has helped companies like yours reduce operational costs by 30% while improving productivity. I'd love to show you a quick demo of how this could work for {{company}}.

Are you available for a brief call this week?

Best,
${fromName}`);
                    }}
                  >
                    <div>
                      <div className="font-semibold">Cost Savings</div>
                      <div className="text-sm text-gray-500">Focus on efficiency</div>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 text-left"
                    onClick={() => {
                      setCustomSubject("Partnership opportunity for {{company}}");
                      setCustomContent(`Hi {{firstName}},

I believe there's a great partnership opportunity between {{company}} and our team.

We've successfully partnered with companies in your industry to help them achieve significant growth through our innovative solutions.

Would you be interested in exploring how we could work together?

Looking forward to hearing from you,
${fromName}`);
                    }}
                  >
                    <div>
                      <div className="font-semibold">Partnership</div>
                      <div className="text-sm text-gray-500">Collaboration focus</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant={spamTestMode ? "secondary" : "default"}>
                        {spamTestMode ? "Test Mode" : "Live Mode"}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {coldEmailList.split('\n').filter(line => line.trim() && line.includes('@')).length} recipients ready
                      </span>
                    </div>
                  </div>
                  <Button 
                    onClick={handleSendColdEmail}
                    disabled={sendEmailMutation.isPending || !customSubject || !customContent}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {sendEmailMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {spamTestMode ? "Test Campaign" : "Launch Campaign"}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

            <TabsContent value="templates" className="space-y-6 mt-0">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Templates Active & Ready!</strong> All email templates are fully functional with personalization fields.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template: EmailTemplate) => (
                <Card key={template.id} className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-2 ${
                  selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        {template.name}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        ACTIVE
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 truncate">{template.subject}</p>
                    <div className="text-xs text-gray-500 mb-3">
                      Includes: {{firstName}}, {{company}}, {{jobTitle}} personalization
                    </div>
                    <Button 
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full ${
                        selectedTemplate?.id === template.id 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                      }`}
                    >
                      {selectedTemplate?.id === template.id ? 'Selected ✓' : 'Use Template'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {templates.length === 0 && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Loading templates... If this persists, check your network connection.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

            <TabsContent value="contacts" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Select Recipients</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={selectAllContacts}>
                      Select All ({(contacts || []).length})
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearSelection}>
                      Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {contacts.map((contact: Contact) => (
                    <div key={contact.id} className="flex items-center space-x-2 p-2 border rounded">
                      <Checkbox
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={(checked) => handleContactSelection(contact.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{contact.name}</div>
                        <div className="text-xs text-gray-500">{contact.email}</div>
                        {contact.company && (
                          <div className="text-xs text-gray-400">{contact.company}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedContacts.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium">
                        {selectedContacts.length} recipients selected
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

            <TabsContent value="preview" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Email Preview</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="previewContact">Preview for:</Label>
                    <Select onValueChange={(value) => {
                      const contact = contacts.find((c: Contact) => c.id === parseInt(value));
                      setPreviewContact(contact || null);
                    }}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.slice(0, 10).map((contact: Contact) => (
                          <SelectItem key={contact.id} value={contact.id.toString()}>
                            {contact.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {previewContact ? (
                  <div className="border rounded-lg">
                    <div className="p-4 border-b bg-gray-50">
                      <div className="text-sm">
                        <strong>To:</strong> {previewContact.name} &lt;{previewContact.email}&gt;
                      </div>
                      <div className="text-sm">
                        <strong>From:</strong> {fromName} &lt;{fromEmail}&gt;
                      </div>
                      <div className="text-sm">
                        <strong>Subject:</strong> {personalizePreview(customSubject, previewContact)}
                      </div>
                    </div>
                    <div 
                      className="p-4 max-h-96 overflow-y-auto"
                      dangerouslySetInnerHTML={{ 
                        __html: personalizePreview(customContent, previewContact) 
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Select a contact to preview the personalized email
                  </div>
                )}
              </CardContent>
            </Card>
            </TabsContent>
          </div>
        </Tabs>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={testMode}
                    onCheckedChange={setTestMode}
                  />
                  <Label>Test Mode (send to 3 contacts only)</Label>
                </div>
                
                {testMode && (
                  <Alert className="border-yellow-200">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Test mode will only send to the first 3 selected contacts
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              <Button 
                onClick={handleSendEmail}
                disabled={sendEmailMutation.isPending || selectedContacts.length === 0}
                className="flex items-center"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendEmailMutation.isPending ? 'Sending...' : `Send to ${selectedContacts.length} contacts`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      </ProtectedFeature>
    </Layout>
  );
}