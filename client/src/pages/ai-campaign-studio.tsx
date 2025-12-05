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

  const [websiteUrl, setWebsiteUrl] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [adPlatform, setAdPlatform] = useState("facebook");

  const [campaignName, setCampaignName] = useState("");
  const [emailSubjectTemplate, setEmailSubjectTemplate] = useState("");
  const [emailGoal, setEmailGoal] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [uploadedContacts, setUploadedContacts] = useState<Contact[]>([]);
  const [senderEmail, setSenderEmail] = useState("noreply@argilette.org");
  const [senderName, setSenderName] = useState("NODE CRM");

  const [generatedAd, setGeneratedAd] = useState<any>(null);
  const [generatedEmails, setGeneratedEmails] = useState<any[]>([]);
  const [generatedEmailContentId, setGeneratedEmailContentId] = useState<string | null>(null);

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
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

  const { data: contactsData } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
    enabled: activeTab === "emails",
  });
  const contacts = contactsData || [];

  const { data: contentLibrary = [] } = useQuery<GeneratedContent[]>({
    queryKey: ["/api/ai-campaigns/contents"],
  });

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

  const generateEmailsMutation = useMutation({
    mutationFn: async () => {
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
      const aiEmails = data.emails || [];
      
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

  const sendEmailsMutation = useMutation({
    mutationFn: async () => {
      if (!generatedEmailContentId) {
        throw new Error('No email content to send');
      }
      
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
    <div className="flex min-h-screen bg-[hsl(228,47%,8%)]">
      <Navigation />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[hsl(210,17%,98%)] tracking-tight">
                AI Campaign Studio
              </h1>
              <p className="text-sm text-[hsl(215,20%,65%)]">
                Generate AI-powered ads and email campaigns
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-[hsl(229,41%,16%)] border border-[hsl(217,33%,17%)] p-1 w-full max-w-md grid grid-cols-3 mb-6">
              <TabsTrigger 
                value="ads" 
                data-testid="tab-ads"
                className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Ad Generator
              </TabsTrigger>
              <TabsTrigger 
                value="emails" 
                data-testid="tab-emails"
                className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Campaigns
              </TabsTrigger>
              <TabsTrigger 
                value="library" 
                data-testid="tab-library"
                className="data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]"
              >
                Content Library
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ads" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg" data-testid="card-ad-generator">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-[hsl(210,17%,98%)]">Create AI-Powered Ads</CardTitle>
                    <CardDescription className="text-[hsl(215,20%,65%)]">
                      Enter your product details and let AI generate optimized ad copy
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="website-url" className="text-[hsl(215,20%,65%)]">Website URL (Optional)</Label>
                      <Input
                        id="website-url"
                        data-testid="input-website-url"
                        placeholder="https://yourwebsite.com"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)] focus:ring-[hsl(227,89%,63%)]"
                      />
                      <p className="text-xs text-[hsl(215,16%,47%)]">AI will analyze your website for context</p>
                    </div>

                    <Separator className="bg-[hsl(217,33%,17%)]" />

                    <div className="space-y-2">
                      <Label htmlFor="product-name" className="text-[hsl(215,20%,65%)]">Product/Service Name *</Label>
                      <Input
                        id="product-name"
                        data-testid="input-product-name"
                        placeholder="Premium CRM Software"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)] focus:ring-[hsl(227,89%,63%)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product-description" className="text-[hsl(215,20%,65%)]">Description *</Label>
                      <Textarea
                        id="product-description"
                        data-testid="textarea-product-description"
                        placeholder="Describe your product features, benefits, and unique selling points..."
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        rows={4}
                        className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="target-audience" className="text-[hsl(215,20%,65%)]">Target Audience</Label>
                      <Input
                        id="target-audience"
                        data-testid="input-target-audience"
                        placeholder="Small business owners, entrepreneurs..."
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)] focus:ring-[hsl(227,89%,63%)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ad-platform" className="text-[hsl(215,20%,65%)]">Platform</Label>
                      <Select value={adPlatform} onValueChange={setAdPlatform}>
                        <SelectTrigger id="ad-platform" data-testid="select-ad-platform" className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[hsl(228,47%,12%)] border-[hsl(217,33%,17%)]">
                          <SelectItem value="facebook" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Facebook/Instagram</SelectItem>
                          <SelectItem value="google" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Google Ads</SelectItem>
                          <SelectItem value="linkedin" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">LinkedIn</SelectItem>
                          <SelectItem value="twitter" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">Twitter/X</SelectItem>
                          <SelectItem value="tiktok" className="text-[hsl(210,17%,98%)] focus:bg-[hsl(229,41%,16%)]">TikTok</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      data-testid="button-generate-ad"
                      onClick={handleGenerateAd}
                      disabled={generateAdMutation.isPending}
                      className="w-full bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
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

                <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg" data-testid="card-ad-preview">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-[hsl(210,17%,98%)]">Generated Ad Variants</CardTitle>
                    <CardDescription className="text-[hsl(215,20%,65%)]">
                      {generatedAd ? "Review and use your AI-generated ads" : "Your ads will appear here"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {generatedAd ? (
                      <div className="space-y-4">
                        {generatedAd.variants?.map((variant: any, index: number) => (
                          <div key={index} className="p-4 border border-[hsl(217,33%,17%)] rounded-lg space-y-3 bg-[hsl(229,41%,16%)]">
                            <div className="flex items-start justify-between gap-2">
                              <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0">Variant {index + 1}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(`${variant.headline}\n\n${variant.body}\n\n${variant.cta}`)}
                                data-testid={`button-copy-ad-${index}`}
                                className="text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <div>
                              <h4 className="font-bold text-lg mb-2 text-[hsl(210,17%,98%)]">{variant.headline}</h4>
                              <p className="text-sm text-[hsl(215,20%,65%)] mb-3">{variant.body}</p>
                              <Button size="sm" className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white">
                                {variant.cta}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-[hsl(215,20%,65%)]">
                        <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Fill in the form and generate your first AI ad</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="emails" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg" data-testid="card-email-generator">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-[hsl(210,17%,98%)]">AI Email Campaigns</CardTitle>
                    <CardDescription className="text-[hsl(215,20%,65%)]">
                      Generate personalized emails for your contacts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="campaign-name" className="text-[hsl(215,20%,65%)]">Campaign Name *</Label>
                      <Input
                        id="campaign-name"
                        data-testid="input-campaign-name"
                        placeholder="Product Launch Q4 2025"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)] focus:ring-[hsl(227,89%,63%)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email-goal" className="text-[hsl(215,20%,65%)]">Email Goal *</Label>
                      <Textarea
                        id="email-goal"
                        data-testid="textarea-email-goal"
                        placeholder="Introduce our new product and schedule demos..."
                        value={emailGoal}
                        onChange={(e) => setEmailGoal(e.target.value)}
                        rows={3}
                        className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject-template" className="text-[hsl(215,20%,65%)]">Subject Line Template</Label>
                      <Input
                        id="subject-template"
                        data-testid="input-subject-template"
                        placeholder="{{name}}, exclusive offer just for you"
                        value={emailSubjectTemplate}
                        onChange={(e) => setEmailSubjectTemplate(e.target.value)}
                        className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)] focus:ring-[hsl(227,89%,63%)]"
                      />
                      <p className="text-xs text-[hsl(215,16%,47%)]">Use {"{"}&#123;name&#125;{"}"}, {"{"}&#123;company&#125;{"}"} for personalization</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="sender-email" className="text-[hsl(215,20%,65%)]">Sender Email *</Label>
                        <Input
                          id="sender-email"
                          data-testid="input-sender-email"
                          type="email"
                          placeholder="support@argilette.org"
                          value={senderEmail}
                          onChange={(e) => setSenderEmail(e.target.value)}
                          className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)] focus:ring-[hsl(227,89%,63%)]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sender-name" className="text-[hsl(215,20%,65%)]">Sender Name *</Label>
                        <Input
                          id="sender-name"
                          data-testid="input-sender-name"
                          placeholder="NODE CRM Team"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)] focus:ring-[hsl(227,89%,63%)]"
                        />
                      </div>
                    </div>

                    <div className="bg-[hsl(229,41%,16%)] border border-[hsl(217,33%,17%)] rounded-lg p-3">
                      <p className="text-xs text-[hsl(227,89%,63%)] font-semibold mb-2">Professional Email Suggestions:</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                          onClick={() => {
                            setSenderEmail("support@argilette.org");
                            setSenderName("NODE CRM Support");
                          }}
                        >
                          support@argilette.org
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                          onClick={() => {
                            setSenderEmail("hello@argilette.org");
                            setSenderName("NODE CRM Team");
                          }}
                        >
                          hello@argilette.org
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                          onClick={() => {
                            setSenderEmail("sales@argilette.org");
                            setSenderName("NODE CRM Sales");
                          }}
                        >
                          sales@argilette.org
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                          onClick={() => {
                            setSenderEmail("marketing@argilette.org");
                            setSenderName("NODE CRM Marketing");
                          }}
                        >
                          marketing@argilette.org
                        </Button>
                      </div>
                    </div>

                    <Separator className="bg-[hsl(217,33%,17%)]" />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <Label className="text-[hsl(215,20%,65%)]">Select Contacts ({selectedContactIds.length} selected)</Label>
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
                            className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                          >
                            Upload CSV
                          </Button>
                        </div>
                      </div>
                      <div className="border border-[hsl(217,33%,17%)] rounded-lg max-h-64 overflow-y-auto p-4 space-y-2 bg-[hsl(229,41%,16%)]">
                        {contacts.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-[hsl(215,16%,47%)] uppercase">From CRM</p>
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
                                className="border-[hsl(217,33%,17%)] data-[state=checked]:bg-[hsl(227,89%,63%)]"
                              />
                              <label
                                htmlFor={`contact-${contact.id}`}
                                className="text-sm flex-1 cursor-pointer text-[hsl(210,17%,98%)]"
                              >
                                <span className="font-medium">{contact.name}</span>
                                <span className="text-[hsl(215,20%,65%)] ml-2">{contact.email}</span>
                                {contact.company && (
                                  <span className="text-[hsl(215,16%,47%)] ml-2">• {contact.company}</span>
                                )}
                              </label>
                            </div>
                          ))}
                          </div>
                        )}
                        
                        {uploadedContacts.length > 0 && (
                          <div className="space-y-2 mt-4">
                            <p className="text-xs font-semibold text-[hsl(142,71%,45%)] uppercase">From CSV Upload</p>
                            {uploadedContacts.map((contact) => (
                            <div key={contact.id} className="flex items-center space-x-2 bg-[hsl(142,71%,45%)/10%] p-2 rounded border border-[hsl(142,71%,45%)/20%]">
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
                                className="border-[hsl(217,33%,17%)] data-[state=checked]:bg-[hsl(227,89%,63%)]"
                              />
                              <label
                                htmlFor={`contact-${contact.id}`}
                                className="text-sm flex-1 cursor-pointer text-[hsl(210,17%,98%)]"
                              >
                                <span className="font-medium">{contact.name}</span>
                                <span className="text-[hsl(215,20%,65%)] ml-2">{contact.email}</span>
                                {contact.company && (
                                  <span className="text-[hsl(215,16%,47%)] ml-2">• {contact.company}</span>
                                )}
                              </label>
                            </div>
                          ))}
                          </div>
                        )}
                        
                        {contacts.length === 0 && uploadedContacts.length === 0 && (
                          <div className="text-center py-6 text-[hsl(215,20%,65%)]">
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
                      className="w-full bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
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

                <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg" data-testid="card-email-preview">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-[hsl(210,17%,98%)]">Generated Emails</CardTitle>
                    <CardDescription className="text-[hsl(215,20%,65%)]">
                      {generatedEmails.length > 0 ? `${generatedEmails.length} personalized emails ready` : "Your emails will appear here"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {generatedEmails.length > 0 ? (
                      <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {generatedEmails.map((email, index) => (
                          <div key={index} className="p-4 border border-[hsl(217,33%,17%)] rounded-lg space-y-3 bg-[hsl(229,41%,16%)]">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className="bg-[hsl(227,89%,63%)/20%] text-[hsl(227,89%,63%)] border-0">
                                    #{index + 1}
                                  </Badge>
                                  <p className="text-sm font-medium text-[hsl(210,17%,98%)]">
                                    {email.recipientName}
                                  </p>
                                </div>
                                <p className="text-xs text-[hsl(215,16%,47%)] mt-1">{email.recipientEmail}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(`Subject: ${email.subject}\n\n${email.body}`)}
                                data-testid={`button-copy-email-${index}`}
                                className="text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {email.personalizationNotes && (
                              <div className="bg-[hsl(271,81%,56%)/10%] border border-[hsl(271,81%,56%)/20%] rounded p-2">
                                <p className="text-xs text-[hsl(271,81%,76%)]">
                                  <Sparkles className="h-3 w-3 inline mr-1" />
                                  AI Analysis: {email.personalizationNotes}
                                </p>
                              </div>
                            )}
                            
                            <div>
                              <p className="text-sm font-semibold mb-2 flex items-center gap-2 text-[hsl(210,17%,98%)]">
                                <Mail className="h-4 w-4 text-[hsl(227,89%,63%)]" />
                                Subject: {email.subject}
                              </p>
                              <pre className="bg-[hsl(229,41%,16%)] p-4 rounded-lg border border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] overflow-x-auto text-sm whitespace-pre-wrap">
                                {email.body}
                              </pre>
                            </div>
                          </div>
                        ))}
                        
                        <div className="pt-4 border-t border-[hsl(217,33%,17%)]">
                          <Button
                            data-testid="button-send-emails"
                            onClick={() => sendEmailsMutation.mutate()}
                            disabled={sendEmailsMutation.isPending}
                            className="w-full bg-[hsl(142,71%,45%)] hover:bg-[hsl(142,71%,40%)] text-white"
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
                      <div className="text-center py-12 text-[hsl(215,20%,65%)]">
                        <Mail className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Configure your campaign and generate personalized emails</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="library" className="space-y-6">
              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg" data-testid="card-content-library">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-[hsl(210,17%,98%)]">Your AI-Generated Content</CardTitle>
                  <CardDescription className="text-[hsl(215,20%,65%)]">
                    View and manage all your AI-generated ads and emails
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {contentLibrary && contentLibrary.length > 0 ? (
                    <div className="space-y-3">
                      {contentLibrary.map((content) => (
                        <div
                          key={content.id}
                          className="p-4 border border-[hsl(217,33%,17%)] rounded-lg hover:bg-[hsl(229,41%,16%)] transition-colors bg-[hsl(228,47%,12%)]"
                          data-testid={`content-item-${content.id}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge className={content.contentType === 'ad' ? 'bg-[hsl(227,89%,63%)] text-white border-0' : 'bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0'}>
                                  {content.contentType === 'ad' ? 'Ad' : 'Email'}
                                </Badge>
                                {content.platform && (
                                  <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(215,20%,65%)] border border-[hsl(217,33%,17%)]">{content.platform}</Badge>
                                )}
                                <span className="text-xs text-[hsl(215,16%,47%)]">
                                  {new Date(content.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <h4 className="font-semibold mb-1 text-[hsl(210,17%,98%)]">{content.title}</h4>
                              <p className="text-sm text-[hsl(215,20%,65%)] line-clamp-2">
                                {content.content.substring(0, 150)}...
                              </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(content.content)}
                                className="text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-[hsl(215,20%,65%)]">
                      <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No content generated yet</p>
                      <p className="text-sm text-[hsl(215,16%,47%)]">Create your first AI campaign to see it here</p>
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
