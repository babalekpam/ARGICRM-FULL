import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Link2, 
  Mail, 
  Target, 
  Users, 
  TrendingUp, 
  Search,
  Plus,
  ExternalLink,
  Check,
  X,
  Clock,
  AlertCircle,
  Sparkles
} from "lucide-react";
import type { 
  BacklinkOpportunity, 
  OutreachCampaign, 
  OutreachContact,
  BacklinkGap 
} from "@shared/schema";

interface LinkBuildingPageProps {
  selectedProjectId: string;
}

export default function LinkBuildingPage({ selectedProjectId }: LinkBuildingPageProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("opportunities");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [aiRecommendations, setAIRecommendations] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Fetch data
  const { data: opportunities = [], isLoading: loadingOpportunities } = useQuery<BacklinkOpportunity[]>({
    queryKey: ['/api/link-building/opportunities', selectedProjectId],
  });

  const { data: campaigns = [], isLoading: loadingCampaigns } = useQuery<OutreachCampaign[]>({
    queryKey: ['/api/link-building/campaigns', selectedProjectId],
  });

  const { data: gaps = [], isLoading: loadingGaps } = useQuery<BacklinkGap[]>({
    queryKey: ['/api/link-building/gaps', selectedProjectId],
  });

  const { data: contacts = [] } = useQuery<OutreachContact[]>({
    queryKey: ['/api/link-building/contacts', selectedCampaignId],
    enabled: !!selectedCampaignId,
  });

  // Mutations
  const updateOpportunityMutation = useMutation({
    mutationFn: (data: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/link-building/opportunities/${data.id}`, { status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/link-building/opportunities', selectedProjectId] });
      toast({ title: "Opportunity updated successfully" });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: (data: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/link-building/contacts/${data.id}`, { status: data.status }),
    onSuccess: () => {
      if (selectedCampaignId) {
        queryClient.invalidateQueries({ queryKey: ['/api/link-building/contacts', selectedCampaignId] });
      }
      toast({ title: "Contact updated successfully" });
    },
  });

  // Filter opportunities by search
  const filteredOpportunities = opportunities.filter(opp =>
    opp.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'secured':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'rejected':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      identified: { label: 'Identified', className: 'bg-gray-100 text-gray-800' },
      contacted: { label: 'Contacted', className: 'bg-blue-100 text-blue-800' },
      negotiating: { label: 'Negotiating', className: 'bg-yellow-100 text-yellow-800' },
      secured: { label: 'Secured', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
    };
    const variant = variants[status] || variants.identified;
    return <Badge className={variant.className} data-testid={`badge-status-${status}`}>{variant.label}</Badge>;
  };

  const fetchAIRecommendations = async () => {
    setLoadingAI(true);
    setShowAIRecommendations(false);
    try {
      const response = await apiRequest("POST", "/api/ai/recommend-backlinks", { projectId: selectedProjectId });
      const data = await response.json();
      setAIRecommendations(data.recommendations);
      setShowAIRecommendations(true);
    } catch (error: any) {
      const errorMessage = error?.message || "";
      const is500Error = errorMessage.startsWith("500:");
      
      toast({ 
        title: "Failed to generate AI recommendations", 
        description: is500Error
          ? "Anthropic API key is not configured. Please contact your administrator to set up the ANTHROPIC_API_KEY." 
          : "An unexpected error occurred. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-link-building">Link Building</h1>
          <p className="text-muted-foreground">Build high-quality backlinks to boost your SEO</p>
        </div>
        <div className="flex gap-2">
          <CreateOpportunityDialog projectId={selectedProjectId} />
          <CreateCampaignDialog projectId={selectedProjectId} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-total-opportunities">{opportunities.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-active-campaigns">
              {campaigns.filter(c => c.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Secured Links</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="metric-secured-links">
              {opportunities.filter(o => o.status === 'secured').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-success-rate">
              {opportunities.length > 0
                ? Math.round((opportunities.filter(o => o.status === 'secured').length / opportunities.length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {showAIRecommendations && aiRecommendations && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <CardTitle>AI-Powered Link Building Recommendations</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIRecommendations(false)}
                data-testid="button-close-ai-recommendations"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-sm whitespace-pre-wrap" data-testid="text-ai-recommendations">
              {aiRecommendations}
            </div>
          </CardContent>
        </Card>
      )}

      {!showAIRecommendations && (
        <Button
          onClick={fetchAIRecommendations}
          disabled={loadingAI}
          className="w-full"
          data-testid="button-get-ai-recommendations"
        >
          {loadingAI ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Generating AI Recommendations...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Get AI-Powered Link Building Recommendations
            </>
          )}
        </Button>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="opportunities" data-testid="tab-opportunities">
            <Target className="h-4 w-4 mr-2" />
            Opportunities
          </TabsTrigger>
          <TabsTrigger value="campaigns" data-testid="tab-campaigns">
            <Mail className="h-4 w-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="gaps" data-testid="tab-gaps">
            <TrendingUp className="h-4 w-4 mr-2" />
            Gap Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Backlink Opportunities</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search opportunities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                      data-testid="input-search-opportunities"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingOpportunities ? (
                <div className="text-center py-8">Loading opportunities...</div>
              ) : filteredOpportunities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No opportunities found. Create your first opportunity to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>DA</TableHead>
                      <TableHead>Relevance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOpportunities.map((opp) => (
                      <TableRow key={opp.id} data-testid={`row-opportunity-${opp.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://${opp.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                              data-testid={`link-domain-${opp.id}`}
                            >
                              {opp.domain}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {opp.contactEmail ? (
                              <div className="font-medium">{opp.contactEmail}</div>
                            ) : (
                              <div className="text-muted-foreground">No contact</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" data-testid={`badge-da-${opp.id}`}>{opp.domainAuthority}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${opp.relevanceScore}%` }}
                              />
                            </div>
                            <span className="text-sm">{opp.relevanceScore}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(opp.status)}</TableCell>
                        <TableCell>
                          <Select
                            value={opp.status}
                            onValueChange={(value) => updateOpportunityMutation.mutate({ id: opp.id, status: value })}
                          >
                            <SelectTrigger className="w-32" data-testid={`select-status-${opp.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="responded">Responded</SelectItem>
                              <SelectItem value="negotiating">Negotiating</SelectItem>
                              <SelectItem value="secured">Secured</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid gap-4">
            {loadingCampaigns ? (
              <Card>
                <CardContent className="py-8 text-center">Loading campaigns...</CardContent>
              </Card>
            ) : campaigns.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No campaigns yet. Create your first campaign to start outreach.
                </CardContent>
              </Card>
            ) : (
              campaigns.map((campaign) => (
                <Card key={campaign.id} data-testid={`card-campaign-${campaign.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{campaign.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Subject: {campaign.subject}</p>
                      </div>
                      <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3 mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Total Sent</div>
                        <div className="text-2xl font-bold text-blue-600" data-testid={`metric-total-sent-${campaign.id}`}>
                          {campaign.totalSent}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Replies</div>
                        <div className="text-2xl font-bold text-purple-600">{campaign.totalReplies}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Links Acquired</div>
                        <div className="text-2xl font-bold text-green-600">{campaign.successfulLinks}</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedCampaignId(campaign.id)}
                      data-testid={`button-view-contacts-${campaign.id}`}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      View Contacts
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Backlink Gaps</CardTitle>
              <p className="text-sm text-muted-foreground">
                Discover backlink opportunities where competitors have links but you don't
              </p>
            </CardHeader>
            <CardContent>
              {loadingGaps ? (
                <div className="text-center py-8">Loading gap analysis...</div>
              ) : gaps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No gap analysis data available yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Linking Domain</TableHead>
                      <TableHead>Competitor</TableHead>
                      <TableHead>DA</TableHead>
                      <TableHead>Anchor Text</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gaps.map((gap) => (
                      <TableRow key={gap.id} data-testid={`row-gap-${gap.id}`}>
                        <TableCell>
                          <a
                            href={`https://${gap.linkingDomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {gap.linkingDomain}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                        <TableCell>{gap.competitorDomain}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{gap.domainAuthority}</Badge>
                        </TableCell>
                        <TableCell>{gap.anchorText || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              gap.priority === 'high'
                                ? 'bg-red-100 text-red-800'
                                : gap.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }
                          >
                            {gap.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" data-testid={`button-pursue-${gap.id}`}>
                            Pursue Opportunity
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedCampaignId && (
        <CampaignContactsDialog
          campaignId={selectedCampaignId}
          contacts={contacts}
          onClose={() => setSelectedCampaignId(null)}
          onUpdateContact={updateContactMutation.mutate}
        />
      )}
    </div>
  );
}

function CreateOpportunityDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    domain: "",
    contactName: "",
    contactEmail: "",
    domainAuthority: 50,
    pageAuthority: 40,
    relevanceScore: 70,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/link-building/opportunities", { 
        ...data, 
        projectId, 
        status: 'discovered',
        url: `https://${data.domain}`,
        discoveredDate: new Date().toISOString().split('T')[0]
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/link-building/opportunities', projectId] });
      toast({ title: "Opportunity created successfully" });
      setOpen(false);
      setFormData({
        domain: "",
        contactName: "",
        contactEmail: "",
        domainAuthority: 50,
        pageAuthority: 40,
        relevanceScore: 70,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-opportunity">
          <Plus className="h-4 w-4 mr-2" />
          Add Opportunity
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Backlink Opportunity</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              placeholder="example.com"
              data-testid="input-opportunity-domain"
            />
          </div>
          <div>
            <Label htmlFor="contactName">Contact Name</Label>
            <Input
              id="contactName"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              placeholder="John Doe"
              data-testid="input-opportunity-contact-name"
            />
          </div>
          <div>
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="john@example.com"
              data-testid="input-opportunity-contact-email"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="da">Domain Authority (1-100)</Label>
              <Input
                id="da"
                type="number"
                min="1"
                max="100"
                value={formData.domainAuthority}
                onChange={(e) => setFormData({ ...formData, domainAuthority: parseInt(e.target.value) })}
                data-testid="input-opportunity-da"
              />
            </div>
            <div>
              <Label htmlFor="relevance">Relevance Score (1-100)</Label>
              <Input
                id="relevance"
                type="number"
                min="1"
                max="100"
                value={formData.relevanceScore}
                onChange={(e) => setFormData({ ...formData, relevanceScore: parseInt(e.target.value) })}
                data-testid="input-opportunity-relevance"
              />
            </div>
          </div>
          <Button
            onClick={() => createMutation.mutate(formData)}
            disabled={!formData.domain || createMutation.isPending}
            className="w-full"
            data-testid="button-submit-opportunity"
          >
            {createMutation.isPending ? "Creating..." : "Create Opportunity"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateCampaignDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    emailTemplate: "",
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/link-building/campaigns", {
        name: data.name,
        subject: data.name, // Use name as subject for simplicity
        emailTemplate: data.emailTemplate,
        projectId,
        status: 'active',
        totalSent: 0,
        totalReplies: 0,
        successfulLinks: 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/link-building/campaigns', projectId] });
      toast({ title: "Campaign created successfully" });
      setOpen(false);
      setFormData({ name: "", description: "", emailTemplate: "" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-create-campaign">
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Outreach Campaign</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Guest Post Outreach Q1"
              data-testid="input-campaign-name"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your outreach campaign..."
              data-testid="textarea-campaign-description"
            />
          </div>
          <div>
            <Label htmlFor="template">Email Template</Label>
            <Textarea
              id="template"
              value={formData.emailTemplate}
              onChange={(e) => setFormData({ ...formData, emailTemplate: e.target.value })}
              placeholder="Hi {name}, I noticed your article on..."
              rows={6}
              data-testid="textarea-campaign-template"
            />
          </div>
          <Button
            onClick={() => createMutation.mutate(formData)}
            disabled={!formData.name || createMutation.isPending}
            className="w-full"
            data-testid="button-submit-campaign"
          >
            {createMutation.isPending ? "Creating..." : "Create Campaign"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CampaignContactsDialog({
  campaignId,
  contacts,
  onClose,
  onUpdateContact,
}: {
  campaignId: string;
  contacts: OutreachContact[];
  onClose: () => void;
  onUpdateContact: (data: any) => void;
}) {
  return (
    <Dialog open={!!campaignId} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Campaign Contacts</DialogTitle>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent Date</TableHead>
                <TableHead>Replied Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No contacts in this campaign yet.
                  </TableCell>
                </TableRow>
              ) : (
                contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell>
                      <Badge variant={contact.status === 'accepted' ? 'default' : 'secondary'}>
                        {contact.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contact.sentDate
                        ? new Date(contact.sentDate).toLocaleDateString()
                        : 'Not sent'}
                    </TableCell>
                    <TableCell>
                      {contact.repliedDate
                        ? new Date(contact.repliedDate).toLocaleDateString()
                        : 'No reply'}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={contact.status}
                        onValueChange={(value) =>
                          onUpdateContact({
                            id: contact.id,
                            status: value,
                          })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="replied">Replied</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
