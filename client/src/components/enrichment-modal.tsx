import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Building2, User, Mail, Phone, Globe, Briefcase, MapPin, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EnrichmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId?: string;
  initialEmail?: string;
  initialDomain?: string;
  onSuccess?: (data: any) => void;
}

export function EnrichmentModal({
  open,
  onOpenChange,
  contactId,
  initialEmail = "",
  initialDomain = "",
  onSuccess,
}: EnrichmentModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [domain, setDomain] = useState(initialDomain);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [enrichmentResult, setEnrichmentResult] = useState<any>(null);
  const [isDemo, setIsDemo] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const enrichMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/enrichment/contact', {
        email: email || undefined,
        domain: domain || undefined,
        linkedinUrl: linkedinUrl || undefined,
        contactId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setEnrichmentResult(data.data);
      if (data.isDemo) {
        setIsDemo(true);
      }
      toast({
        title: data.isDemo ? "Demo: Contact Enriched" : "Contact Enriched",
        description: data.isDemo ? "Showing sample enrichment data" : "Successfully enriched contact data",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enrichment/credits'] });
      onSuccess?.(data);
    },
    onError: (error: any) => {
      toast({
        title: "Enrichment Failed",
        description: error.message || "Failed to enrich contact",
        variant: "destructive",
      });
    },
  });

  const handleEnrich = () => {
    if (!email && !domain && !linkedinUrl) {
      toast({
        title: "Input Required",
        description: "Please enter an email, domain, or LinkedIn URL",
        variant: "destructive",
      });
      return;
    }
    enrichMutation.mutate();
  };

  const resetModal = () => {
    setEnrichmentResult(null);
    setIsDemo(false);
    setEmail(initialEmail);
    setDomain(initialDomain);
    setLinkedinUrl("");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetModal();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl bg-[#11152B] border-[#1E293B] text-[#F8F9FA]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Enrich Contact</DialogTitle>
          <DialogDescription className="text-[#94A3B8]">
            Enter contact details to fetch enriched company and contact information
          </DialogDescription>
        </DialogHeader>

        {!enrichmentResult ? (
          <div className="space-y-6 py-4">
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="bg-[#1A1F3A] border-[#1E293B]">
                <TabsTrigger 
                  value="email" 
                  className="data-[state=active]:bg-[#4C6EF5] data-[state=active]:text-white"
                  data-testid="tab-email"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </TabsTrigger>
                <TabsTrigger 
                  value="domain"
                  className="data-[state=active]:bg-[#4C6EF5] data-[state=active]:text-white"
                  data-testid="tab-domain"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Domain
                </TabsTrigger>
                <TabsTrigger 
                  value="linkedin"
                  className="data-[state=active]:bg-[#4C6EF5] data-[state=active]:text-white"
                  data-testid="tab-linkedin"
                >
                  <User className="w-4 h-4 mr-2" />
                  LinkedIn
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#94A3B8]">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@company.com"
                    className="bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA] focus:ring-[#4C6EF5]"
                    data-testid="input-enrich-email"
                  />
                </div>
              </TabsContent>

              <TabsContent value="domain" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="domain" className="text-[#94A3B8]">Company Domain</Label>
                  <Input
                    id="domain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="company.com"
                    className="bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA] focus:ring-[#4C6EF5]"
                    data-testid="input-enrich-domain"
                  />
                </div>
              </TabsContent>

              <TabsContent value="linkedin" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="text-[#94A3B8]">LinkedIn Profile URL</Label>
                  <Input
                    id="linkedin"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/johndoe"
                    className="bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA] focus:ring-[#4C6EF5]"
                    data-testid="input-enrich-linkedin"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-[#1E293B] text-[#94A3B8] hover:bg-[#1A1F3A]"
                data-testid="button-cancel-enrich"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEnrich}
                disabled={enrichMutation.isPending}
                className="bg-[#4C6EF5] hover:bg-[#3D5DDB] text-white"
                data-testid="button-enrich-contact"
              >
                {enrichMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enriching...
                  </>
                ) : (
                  "Enrich Contact"
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {isDemo && (
              <Alert className="bg-[#F59E0B]/10 border-[#F59E0B]/30" data-testid="alert-demo-mode">
                <Info className="h-4 w-4 text-[#F59E0B]" />
                <AlertTitle className="text-[#F59E0B]">Demo Mode</AlertTitle>
                <AlertDescription className="text-[#94A3B8]">
                  DataForSEO credentials not configured. This is sample data to demonstrate the feature.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-2 text-[#10B981]">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{isDemo ? "Demo Enrichment Complete" : "Enrichment Complete"}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrichmentResult.companyName && (
                <Card className="bg-[#1A1F3A] border-[#1E293B]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Company
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#F8F9FA] font-semibold" data-testid="text-enriched-company">
                      {enrichmentResult.companyName}
                    </p>
                    {enrichmentResult.industry && (
                      <p className="text-[#94A3B8] text-sm">{enrichmentResult.industry}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {(enrichmentResult.firstName || enrichmentResult.lastName) && (
                <Card className="bg-[#1A1F3A] border-[#1E293B]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#F8F9FA] font-semibold" data-testid="text-enriched-name">
                      {enrichmentResult.firstName} {enrichmentResult.lastName}
                    </p>
                    {enrichmentResult.title && (
                      <p className="text-[#94A3B8] text-sm">{enrichmentResult.title}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {enrichmentResult.email && (
                <Card className="bg-[#1A1F3A] border-[#1E293B]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#F8F9FA]" data-testid="text-enriched-email">
                      {enrichmentResult.email}
                    </p>
                  </CardContent>
                </Card>
              )}

              {enrichmentResult.phone && (
                <Card className="bg-[#1A1F3A] border-[#1E293B]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#F8F9FA]" data-testid="text-enriched-phone">
                      {enrichmentResult.phone}
                    </p>
                  </CardContent>
                </Card>
              )}

              {enrichmentResult.website && (
                <Card className="bg-[#1A1F3A] border-[#1E293B]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Website
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#F8F9FA]" data-testid="text-enriched-website">
                      {enrichmentResult.website}
                    </p>
                  </CardContent>
                </Card>
              )}

              {enrichmentResult.location && (
                <Card className="bg-[#1A1F3A] border-[#1E293B]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-[#F8F9FA]" data-testid="text-enriched-location">
                      {[
                        enrichmentResult.location.city,
                        enrichmentResult.location.state,
                        enrichmentResult.location.country
                      ].filter(Boolean).join(", ")}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={resetModal}
                className="border-[#1E293B] text-[#94A3B8] hover:bg-[#1A1F3A]"
                data-testid="button-enrich-another"
              >
                Enrich Another
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-[#4C6EF5] hover:bg-[#3D5DDB] text-white"
                data-testid="button-close-enrichment"
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default EnrichmentModal;
