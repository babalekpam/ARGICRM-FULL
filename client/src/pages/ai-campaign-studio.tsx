import { useState } from "react";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Sparkles, Mail, ExternalLink, Loader2, Copy, Send, Check, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

// Type definitions
interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  jobTitle?: string;
  phone?: string;
  type?: string;
  tenantId?: string;
}

interface GeneratedContent {
  id: string;
  contentType: string;
  title: string;
  content: string;
  platform?: string;
  status: string;
  createdAt: string;
}

export default function AICampaignStudio() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("ads");

  // Ad Generator State
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [adPlatform, setAdPlatform] = useState("facebook");

  // Email Generator State
  const [campaignName, setCampaignName] = useState("");
  const [emailSubjectTemplate, setEmailSubjectTemplate] = useState("");
  const [emailGoal, setEmailGoal] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [uploadedContacts, setUploadedContacts] = useState<Contact[]>([]);
  const [senderEmail, setSenderEmail] = useState("noreply@argilette.com");
  const [senderName, setSenderName] = useState("NODE CRM");

  // Generated content preview
  const [generatedAd, setGeneratedAd] = useState<any>(null);
  const [generatedEmails, setGeneratedEmails] = useState<any[]>([]);
  const [generatedEmailContentId, setGeneratedEmailContentId] = useState<string | null>(null);

  // CSV Upload Handler
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Parse CSV (simple comma-separated parsing)
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const newContacts: Contact[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const contact: any = {
          id: `csv-${Date.now()}-${i}`,
          type: 'lead',
        };
        
        headers.forEach((header, index) => {
          if (header.includes('name') || header === 'contact') {
            contact.name = values[index];
          } else if (header.includes('email')) {
            contact.email = values[index];
          } else if (header.includes('company') || header.includes('organization')) {
            contact.company = values[index];
          } else if (header.includes('job') || header.includes('title') || header.includes('role') || header.includes('position')) {
            contact.jobTitle = values[index];
          } else if (header.includes('phone') || header.includes('mobile')) {
            contact.phone = values[index];
          }
        });
        
        if (contact.email) {
          newContacts.push(contact as Contact);
        }
      }
      
      setUploadedContacts(newContacts);
      setSelectedContactIds(prev => [...prev, ...newContacts.map(c => c.id)]);
      toast({
        title: "Contacts Imported!",
        description: `Successfully imported ${newContacts.length} contacts from CSV`,
      });
    };
    
    reader.readAsText(file);
  };

  // Fetch contacts for email generation
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    enabled: activeTab === "emails",
  });

  // Fetch generated content library
  const { data: contentLibrary = [] } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/ai-campaigns/contents"],
  });

  // Generate Ad Mutation
  const generateAdMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai-campaigns/generate-ad", {
        url: websiteUrl || `https://example.com/product/${productName.toLowerCase().replace(/\s+/g, '-')}`,
        channel: adPlatform === 'facebook' ? 'facebook' : adPlatform === 'google' ? 'google_ads' : adPlatform as any,
        audience: targetAudience || `People interested in ${productName}`,
        tone: 'professional',
        objective: 'awareness',
        numVariants: 3,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedAd(data.content);
      queryClient.invalidateQueries({ queryKey: ["/api/ai-campaigns/contents"] });
      toast({
        title: "Ad Generated!",
        description: `Created ${data.variants?.length || 1} ad variants using ${data.provider}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate ad content",
        variant: "destructive",
      });
    },
  });

  // Generate Emails Mutation
  const generateEmailsMutation = useMutation({
    mutationFn: async () => {
      // Separate CRM contacts (IDs only) and CSV contacts (full objects)
      const allContacts = [...contacts, ...uploadedContacts];
      const crmContactIds = selectedContactIds.filter(id => !id.startsWith('csv-'));
      const csvContacts = allContacts.filter(c => selectedContactIds.includes(c.id) && c.id.startsWith('csv-'));
      
      console.log('[AI Campaign] Selected IDs:', selectedContactIds);
      console.log('[AI Campaign] CRM contacts:', contacts.length, 'Uploaded:', uploadedContacts.length);
      console.log('[AI Campaign] CRM IDs:', crmContactIds.length, 'CSV contacts:', csvContacts.length);
      
      const payload = {
        ...(crmContactIds.length > 0 && { contactIds: crmContactIds }),
        ...(csvContacts.length > 0 && { 
          contacts: csvContacts.map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            company: c.company,
            jobTitle: c.jobTitle,
            phone: c.phone,
          }))
        }),
        objective: `Campaign: ${campaignName}. Goal: ${emailGoal}${emailSubjectTemplate ? `. Subject template: ${emailSubjectTemplate}` : ''}`,
        tone: 'professional',
        numVariants: 1,
      };
      
      console.log('[AI Campaign] Sending payload:', JSON.stringify(payload, null, 2));
      
      const response = await apiRequest("POST", "/api/ai-campaigns/generate-emails", payload);
      return await response.json();
    },
    onSuccess: (data) => {
      // Extract individual emails from AI response
      const aiEmails = data.emails || [];
      
      // Map AI-generated emails to display format
      const personalizedEmails = aiEmails.map((email: any) => {
        const allContacts = [...contacts, ...uploadedContacts];
        const contact = allContacts.find((c) => c.id === email.contactId);
        return {
          recipientName: email.contactName || contact?.name || 'Valued Customer',
          recipientEmail: contact?.email || '',
          subject: email.subject || 'Important Message',
          body: email.body || '',
          personalizationNotes: email.personalizationNotes || '',
        };
      });
      
      setGeneratedEmails(personalizedEmails);
      setGeneratedEmailContentId(data.content?.id || null);
      queryClient.invalidateQueries({ queryKey: ["/api/ai-campaigns/contents"] });
      toast({
        title: "AI Analysis Complete!",
        description: `Generated ${personalizedEmails.length} unique emails tailored to each contact using ${data.content?.modelUsed || 'AI'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate email content",
        variant: "destructive",
      });
    },
  });

  // Send Personalized Emails Mutation
  const sendEmailsMutation = useMutation({
    mutationFn: async () => {
      if (!generatedEmailContentId) {
        throw new Error('No email content to send');
      }
      
      // Separate CRM contacts (IDs only) and CSV contacts (full objects)
      const allContacts = [...contacts, ...uploadedContacts];
      const crmContactIds = selectedContactIds.filter(id => !id.startsWith('csv-'));
      const csvContacts = allContacts.filter(c => selectedContactIds.includes(c.id) && c.id.startsWith('csv-'));
      
      const response = await apiRequest("POST", "/api/ai-campaigns/send-personalized-emails", {
        contentId: generatedEmailContentId,
        contactIds: crmContactIds.length > 0 ? crmContactIds : undefined,
        contacts: csvContacts.length > 0 ? csvContacts.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          company: c.company,
          jobTitle: c.jobTitle,
          phone: c.phone,
        })) : undefined,
        fromEmail: senderEmail,
        fromName: senderName,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-campaigns/contents"] });
      toast({
        title: "Emails Sent Successfully!",
        description: `${data.sent} emails delivered${data.failed > 0 ? `, ${data.failed} failed` : ''}`,
      });
      // Clear generated emails after sending
      setGeneratedEmails([]);
      setGeneratedEmailContentId(null);
      setSelectedContactIds([]);
      setCampaignName('');
      setEmailGoal('');
    },
    onError: (error: any) => {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send emails",
        variant: "destructive",
      });
    },
  });

  const handleGenerateAd = () => {
    if (!websiteUrl && !productName) {
      toast({
        title: "Missing Information",
        description: "Please provide a website URL or product name",
        variant: "destructive",
      });
      return;
    }
    generateAdMutation.mutate();
  };

  const handleGenerateEmails = () => {
    if (selectedContactIds.length === 0) {
      toast({
        title: "No Contacts Selected",
        description: "Please select at least one contact",
        variant: "destructive",
      });
      return;
    }
    if (!campaignName || !emailGoal) {
      toast({
        title: "Missing Information",
        description: "Please provide campaign name and email goal",
        variant: "destructive",
      });
      return;
    }
    generateEmailsMutation.mutate();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  AI Campaign Studio
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Generate high-converting ads and personalized emails with AI
                </p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
              <TabsTrigger value="ads" data-testid="tab-ads">
                <Sparkles className="h-4 w-4 mr-2" />
                Ad Generator
              </TabsTrigger>
              <TabsTrigger value="emails" data-testid="tab-emails">
                <Mail className="h-4 w-4 mr-2" />
                Email Campaigns
              </TabsTrigger>
              <TabsTrigger value="library" data-testid="tab-library">
                Content Library
              </TabsTrigger>
            </TabsList>

            {/* Ad Generator Tab */}
            <TabsContent value="ads" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Form */}
                <Card data-testid="card-ad-generator">
                  <CardHeader>
                    <CardTitle>Create AI-Powered Ads</CardTitle>
                    <CardDescription>
                      Enter your product details and let AI generate optimized ad copy
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="website-url">Website URL (Optional)</Label>
                      <Input
                        id="website-url"
                        data-testid="input-website-url"
                        placeholder="https://yourwebsite.com"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">AI will analyze your website for context</p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="product-name">Product/Service Name *</Label>
                      <Input
                        id="product-name"
                        data-testid="input-product-name"
                        placeholder="Premium CRM Software"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product-description">Description *</Label>
                      <Textarea
                        id="product-description"
                        data-testid="textarea-product-description"
                        placeholder="Describe your product features, benefits, and unique selling points..."
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="target-audience">Target Audience</Label>
                      <Input
                        id="target-audience"
                        data-testid="input-target-audience"
                        placeholder="Small business owners, entrepreneurs..."
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ad-platform">Platform</Label>
                      <Select value={adPlatform} onValueChange={setAdPlatform}>
                        <SelectTrigger id="ad-platform" data-testid="select-ad-platform">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="facebook">Facebook/Instagram</SelectItem>
                          <SelectItem value="google">Google Ads</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="twitter">Twitter/X</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      data-testid="button-generate-ad"
                      onClick={handleGenerateAd}
                      disabled={generateAdMutation.isPending}
                      className="w-full"
                    >
                      {generateAdMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Ad Variants
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Preview Panel */}
                <Card data-testid="card-ad-preview">
                  <CardHeader>
                    <CardTitle>Generated Ad Variants</CardTitle>
                    <CardDescription>
                      {generatedAd ? "Review and use your AI-generated ads" : "Your ads will appear here"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {generatedAd ? (
                      <div className="space-y-4">
                        {generatedAd.variants?.map((variant: any, index: number) => (
                          <div key={index} className="p-4 border rounded-lg space-y-3">
                            <div className="flex items-start justify-between">
                              <Badge variant="secondary">Variant {index + 1}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(`${variant.headline}\n\n${variant.body}\n\n${variant.cta}`)}
                                data-testid={`button-copy-ad-${index}`}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <div>
                              <h4 className="font-bold text-lg mb-2">{variant.headline}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{variant.body}</p>
                              <Button size="sm" variant="default">
                                {variant.cta}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Fill in the form and generate your first AI ad</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Email Campaign Tab */}
            <TabsContent value="emails" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Email Form */}
                <Card data-testid="card-email-generator">
                  <CardHeader>
                    <CardTitle>AI Email Campaigns</CardTitle>
                    <CardDescription>
                      Generate personalized emails for your contacts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="campaign-name">Campaign Name *</Label>
                      <Input
                        id="campaign-name"
                        data-testid="input-campaign-name"
                        placeholder="Product Launch Q4 2025"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email-goal">Email Goal *</Label>
                      <Textarea
                        id="email-goal"
                        data-testid="textarea-email-goal"
                        placeholder="Introduce our new product and schedule demos..."
                        value={emailGoal}
                        onChange={(e) => setEmailGoal(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject-template">Subject Line Template</Label>
                      <Input
                        id="subject-template"
                        data-testid="input-subject-template"
                        placeholder="{{name}}, exclusive offer just for you"
                        value={emailSubjectTemplate}
                        onChange={(e) => setEmailSubjectTemplate(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Use {"{"}&#123;name&#125;{"}"}, {"{"}&#123;company&#125;{"}"} for personalization</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="sender-email">Sender Email *</Label>
                        <Input
                          id="sender-email"
                          data-testid="input-sender-email"
                          type="email"
                          placeholder="support@argilette.com"
                          value={senderEmail}
                          onChange={(e) => setSenderEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sender-name">Sender Name *</Label>
                        <Input
                          id="sender-name"
                          data-testid="input-sender-name"
                          placeholder="NODE CRM Team"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold mb-2">💡 Professional Email Suggestions:</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => {
                            setSenderEmail("support@argilette.com");
                            setSenderName("NODE CRM Support");
                          }}
                        >
                          support@argilette.com
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => {
                            setSenderEmail("hello@argilette.com");
                            setSenderName("NODE CRM Team");
                          }}
                        >
                          hello@argilette.com
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => {
                            setSenderEmail("sales@argilette.com");
                            setSenderName("NODE CRM Sales");
                          }}
                        >
                          sales@argilette.com
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => {
                            setSenderEmail("marketing@argilette.com");
                            setSenderName("NODE CRM Marketing");
                          }}
                        >
                          marketing@argilette.com
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <Label>Select Contacts ({selectedContactIds.length} selected)</Label>
                        <div className="flex gap-2">
                          <input
                            type="file"
                            id="csv-upload"
                            accept=".csv"
                            className="hidden"
                            onChange={handleCSVUpload}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('csv-upload')?.click()}
                            data-testid="button-upload-csv"
                          >
                            📁 Upload CSV
                          </Button>
                        </div>
                      </div>
                      <div className="border rounded-lg max-h-64 overflow-y-auto p-4 space-y-2">
                        {/* Database Contacts */}
                        {contacts.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase">From CRM</p>
                            {contacts.map((contact) => (
                            <div key={contact.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`contact-${contact.id}`}
                                data-testid={`checkbox-contact-${contact.id}`}
                                checked={selectedContactIds.includes(contact.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedContactIds([...selectedContactIds, contact.id]);
                                  } else {
                                    setSelectedContactIds(selectedContactIds.filter(id => id !== contact.id));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`contact-${contact.id}`}
                                className="text-sm flex-1 cursor-pointer"
                              >
                                <span className="font-medium">{contact.name}</span>
                                <span className="text-gray-500 ml-2">{contact.email}</span>
                                {contact.company && (
                                  <span className="text-gray-400 ml-2">• {contact.company}</span>
                                )}
                              </label>
                            </div>
                          ))}
                          </div>
                        )}
                        
                        {/* Uploaded CSV Contacts */}
                        {uploadedContacts.length > 0 && (
                          <div className="space-y-2 mt-4">
                            <p className="text-xs font-semibold text-green-600 uppercase">From CSV Upload</p>
                            {uploadedContacts.map((contact) => (
                            <div key={contact.id} className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                              <Checkbox
                                id={`contact-${contact.id}`}
                                data-testid={`checkbox-contact-${contact.id}`}
                                checked={selectedContactIds.includes(contact.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedContactIds([...selectedContactIds, contact.id]);
                                  } else {
                                    setSelectedContactIds(selectedContactIds.filter(id => id !== contact.id));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`contact-${contact.id}`}
                                className="text-sm flex-1 cursor-pointer"
                              >
                                <span className="font-medium">{contact.name}</span>
                                <span className="text-gray-500 ml-2">{contact.email}</span>
                                {contact.company && (
                                  <span className="text-gray-400 ml-2">• {contact.company}</span>
                                )}
                              </label>
                            </div>
                          ))}
                          </div>
                        )}
                        
                        {contacts.length === 0 && uploadedContacts.length === 0 && (
                          <div className="text-center py-6 text-gray-500">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No contacts found. Upload a CSV or add contacts in CRM.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      data-testid="button-generate-emails"
                      onClick={handleGenerateEmails}
                      disabled={generateEmailsMutation.isPending}
                      className="w-full"
                    >
                      {generateEmailsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Generate Personalized Emails
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Email Preview */}
                <Card data-testid="card-email-preview">
                  <CardHeader>
                    <CardTitle>Generated Emails</CardTitle>
                    <CardDescription>
                      {generatedEmails.length > 0 ? `${generatedEmails.length} personalized emails ready` : "Your emails will appear here"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {generatedEmails.length > 0 ? (
                      <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {generatedEmails.map((email, index) => (
                          <div key={index} className="p-4 border rounded-lg space-y-3 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                                    #{index + 1}
                                  </Badge>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {email.recipientName}
                                  </p>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{email.recipientEmail}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(`Subject: ${email.subject}\n\n${email.body}`)}
                                data-testid={`button-copy-email-${index}`}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {email.personalizationNotes && (
                              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded p-2">
                                <p className="text-xs text-purple-700 dark:text-purple-300">
                                  <Sparkles className="h-3 w-3 inline mr-1" />
                                  AI Analysis: {email.personalizationNotes}
                                </p>
                              </div>
                            )}
                            
                            <div>
                              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <Mail className="h-4 w-4 text-blue-600" />
                                Subject: {email.subject}
                              </p>
                              <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-white dark:bg-gray-800 p-3 rounded border">
                                {email.body}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Send Emails Button */}
                        <div className="pt-4 border-t">
                          <Button
                            data-testid="button-send-emails"
                            onClick={() => sendEmailsMutation.mutate()}
                            disabled={sendEmailsMutation.isPending}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          >
                            {sendEmailsMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending Emails...
                              </>
                            ) : (
                              <>
                                <Send className="mr-2 h-4 w-4" />
                                Send {generatedEmails.length} Personalized Email{generatedEmails.length > 1 ? 's' : ''}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Mail className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Configure your campaign and generate personalized emails</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Content Library Tab */}
            <TabsContent value="library" className="space-y-6">
              <Card data-testid="card-content-library">
                <CardHeader>
                  <CardTitle>Your AI-Generated Content</CardTitle>
                  <CardDescription>
                    View and manage all your AI-generated ads and emails
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {contentLibrary && contentLibrary.length > 0 ? (
                    <div className="space-y-3">
                      {contentLibrary.map((content) => (
                        <div
                          key={content.id}
                          className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          data-testid={`content-item-${content.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={content.contentType === 'ad' ? 'default' : 'secondary'}>
                                  {content.contentType === 'ad' ? 'Ad' : 'Email'}
                                </Badge>
                                {content.platform && (
                                  <Badge variant="outline">{content.platform}</Badge>
                                )}
                                <span className="text-xs text-gray-500">
                                  {new Date(content.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <h4 className="font-semibold mb-1">{content.title}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {content.content.substring(0, 150)}...
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(content.content)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No content generated yet</p>
                      <p className="text-sm">Create your first AI campaign to see it here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
