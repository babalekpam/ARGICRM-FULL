import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Upload, 
  Download, 
  Loader2,
  Zap,
  Users,
  Shield,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  Copy,
  RefreshCw,
  Info
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function EmailFinderPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [domain, setDomain] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [foundEmail, setFoundEmail] = useState<any>(null);
  const [bulkResults, setBulkResults] = useState<any>(null);
  const [isDemo, setIsDemo] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: credits, isLoading: creditsLoading } = useQuery<{ 
    enrichment: { used: number; limit: number; remaining: number }; 
    emailValidation: { used: number; limit: number; remaining: number };
    plan: string;
  }>({
    queryKey: ['/api/enrichment/credits'],
  });

  const { data: validationsHistory } = useQuery<{
    validations: Array<{ id: string; email: string; isValid: boolean; status: string; deliverability: string; isFreeProvider: boolean; isRoleAccount: boolean; validatedAt: string }>;
    pagination: { page: number; limit: number; totalCount: number; totalPages: number };
  }>({
    queryKey: ['/api/enrichment/email/validations'],
  });

  const findEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/enrichment/email/find', {
        firstName,
        lastName,
        company,
        domain: domain || undefined,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setFoundEmail(data);
      if (data.isDemo) {
        setIsDemo(true);
      }
      toast({
        title: data.isDemo ? "Demo: Email Generated" : "Email Found",
        description: `Found potential email: ${data.email}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/enrichment/credits'] });
    },
    onError: (error: any) => {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to find email",
        variant: "destructive",
      });
    },
  });

  const validateEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/enrichment/email/validate', { email: singleEmail });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.isDemo) {
        setIsDemo(true);
      }
      toast({
        title: data.isDemo ? "Demo: Email Validated" : "Email Validated",
        description: `Status: ${data.validation.status}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/enrichment/email/validations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enrichment/credits'] });
    },
    onError: (error: any) => {
      toast({
        title: "Validation Failed",
        description: error.message || "Failed to validate email",
        variant: "destructive",
      });
    },
  });

  const bulkValidateMutation = useMutation({
    mutationFn: async () => {
      const emails = bulkEmails.split('\n').map(e => e.trim()).filter(e => e && e.includes('@'));
      const response = await apiRequest('POST', '/api/enrichment/email/validate/bulk', { emails });
      return response.json();
    },
    onSuccess: (data) => {
      setBulkResults(data);
      if (data.isDemo) {
        setIsDemo(true);
      }
      toast({
        title: data.isDemo ? "Demo: Bulk Validation Complete" : "Bulk Validation Complete",
        description: `Validated ${data.totalProcessed} emails`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/enrichment/email/validations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enrichment/credits'] });
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Validation Failed",
        description: error.message || "Failed to validate emails",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Email copied to clipboard",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-[#10B981] text-white"><CheckCircle2 className="w-3 h-3 mr-1" />Valid</Badge>;
      case 'invalid':
        return <Badge className="bg-[#EF4444] text-white"><XCircle className="w-3 h-3 mr-1" />Invalid</Badge>;
      case 'risky':
        return <Badge className="bg-[#F59E0B] text-white"><AlertTriangle className="w-3 h-3 mr-1" />Risky</Badge>;
      case 'disposable':
        return <Badge className="bg-[#EF4444] text-white"><XCircle className="w-3 h-3 mr-1" />Disposable</Badge>;
      case 'catch_all':
        return <Badge className="bg-[#F59E0B] text-white"><AlertTriangle className="w-3 h-3 mr-1" />Catch-All</Badge>;
      default:
        return <Badge className="bg-[#64748B] text-white">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#F8F9FA]" data-testid="text-page-title">
              Email Finder & Validator
            </h1>
            <p className="text-[#94A3B8] mt-1">
              Find and validate professional email addresses
            </p>
          </div>
        </div>

        {isDemo && (
          <Alert className="bg-[#F59E0B]/10 border-[#F59E0B]/30" data-testid="alert-demo-mode">
            <Info className="h-4 w-4 text-[#F59E0B]" />
            <AlertTitle className="text-[#F59E0B]">Demo Mode</AlertTitle>
            <AlertDescription className="text-[#94A3B8]">
              DataForSEO credentials are not configured. You're seeing sample data to demonstrate how this feature works. 
              Configure your DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables to enable full functionality.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-[#11152B] border-[#1E293B]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#4C6EF5]" />
                Enrichment Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[#F8F9FA] tabular-nums" data-testid="text-enrichment-credits">
                {creditsLoading ? "..." : (credits?.enrichment?.remaining ?? 0)}
              </p>
              <Progress 
                value={creditsLoading ? 0 : ((credits?.enrichment?.used ?? 0) / (credits?.enrichment?.limit ?? 1000)) * 100} 
                className="h-2 mt-2"
              />
              <p className="text-xs text-[#64748B] mt-1">
                {credits?.enrichment?.used ?? 0} / {credits?.enrichment?.limit ?? 1000} used
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#11152B] border-[#1E293B]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#10B981]" />
                Validation Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[#F8F9FA] tabular-nums" data-testid="text-validation-credits">
                {creditsLoading ? "..." : (credits?.emailValidation?.remaining ?? 0)}
              </p>
              <Progress 
                value={creditsLoading ? 0 : ((credits?.emailValidation?.used ?? 0) / (credits?.emailValidation?.limit ?? 5000)) * 100} 
                className="h-2 mt-2"
              />
              <p className="text-xs text-[#64748B] mt-1">
                {credits?.emailValidation?.used ?? 0} / {credits?.emailValidation?.limit ?? 5000} used
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#11152B] border-[#1E293B]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#7048E8]" />
                Emails Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[#F8F9FA] tabular-nums" data-testid="text-emails-found">
                {validationsHistory?.pagination?.totalCount ?? 0}
              </p>
              <p className="text-xs text-[#64748B] mt-1">Total validated</p>
            </CardContent>
          </Card>

          <Card className="bg-[#11152B] border-[#1E293B]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[#94A3B8] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#F59E0B]" />
                Valid Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-[#F8F9FA] tabular-nums" data-testid="text-valid-rate">
                {(validationsHistory?.validations?.length ?? 0) > 0
                  ? Math.round(((validationsHistory?.validations?.filter((v: any) => v.isValid).length ?? 0) / (validationsHistory?.validations?.length ?? 1)) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-[#64748B] mt-1">Deliverable emails</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="find" className="w-full">
          <TabsList className="bg-[#1A1F3A] border-[#1E293B]">
            <TabsTrigger 
              value="find" 
              className="data-[state=active]:bg-[#4C6EF5] data-[state=active]:text-white"
              data-testid="tab-find-email"
            >
              <Search className="w-4 h-4 mr-2" />
              Find Email
            </TabsTrigger>
            <TabsTrigger 
              value="validate"
              className="data-[state=active]:bg-[#4C6EF5] data-[state=active]:text-white"
              data-testid="tab-validate-email"
            >
              <Shield className="w-4 h-4 mr-2" />
              Validate Email
            </TabsTrigger>
            <TabsTrigger 
              value="bulk"
              className="data-[state=active]:bg-[#4C6EF5] data-[state=active]:text-white"
              data-testid="tab-bulk-validate"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Bulk Validate
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="data-[state=active]:bg-[#4C6EF5] data-[state=active]:text-white"
              data-testid="tab-history"
            >
              <Clock className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="find" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#11152B] border-[#1E293B]">
                <CardHeader>
                  <CardTitle className="text-lg text-[#F8F9FA]">Find Email by Name & Company</CardTitle>
                  <CardDescription className="text-[#94A3B8]">
                    Enter a person's name and company to find their professional email
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-[#94A3B8]">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA]"
                        data-testid="input-first-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-[#94A3B8]">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA]"
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-[#94A3B8]">Company Name</Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Acme Inc"
                      className="bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA]"
                      data-testid="input-company"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domain" className="text-[#94A3B8]">Domain (optional)</Label>
                    <Input
                      id="domain"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="acme.com"
                      className="bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA]"
                      data-testid="input-domain"
                    />
                  </div>
                  <Button
                    onClick={() => findEmailMutation.mutate()}
                    disabled={findEmailMutation.isPending || !firstName || !lastName || !company}
                    className="w-full bg-[#4C6EF5] hover:bg-[#3D5DDB] text-white"
                    data-testid="button-find-email"
                  >
                    {findEmailMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Find Email
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-[#11152B] border-[#1E293B]">
                <CardHeader>
                  <CardTitle className="text-lg text-[#F8F9FA]">Results</CardTitle>
                  <CardDescription className="text-[#94A3B8]">
                    Email patterns found for your search
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {foundEmail ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-[#1A1F3A] border border-[#1E293B]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-[#4C6EF5]/20">
                              <Mail className="w-5 h-5 text-[#4C6EF5]" />
                            </div>
                            <div>
                              <p className="font-semibold text-[#F8F9FA]" data-testid="text-found-email">
                                {foundEmail.email}
                              </p>
                              <p className="text-sm text-[#94A3B8]">
                                Confidence: {Math.round((foundEmail.confidence || 0.75) * 100)}%
                              </p>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(foundEmail.email)}
                            className="text-[#94A3B8] hover:text-[#F8F9FA]"
                            data-testid="button-copy-email"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {foundEmail.alternatives?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm text-[#94A3B8]">Alternative patterns:</p>
                          {foundEmail.alternatives.map((alt: string, i: number) => (
                            <div 
                              key={i}
                              className="flex items-center justify-between p-2 rounded bg-[#1A1F3A]/50"
                            >
                              <span className="text-sm text-[#64748B]">{alt}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => copyToClipboard(alt)}
                                className="h-6 w-6 text-[#64748B] hover:text-[#F8F9FA]"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="p-4 rounded-full bg-[#1A1F3A] mb-4">
                        <Search className="w-8 h-8 text-[#64748B]" />
                      </div>
                      <p className="text-[#94A3B8]">Enter a name and company to find their email</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="validate" className="mt-6">
            <Card className="bg-[#11152B] border-[#1E293B] max-w-xl">
              <CardHeader>
                <CardTitle className="text-lg text-[#F8F9FA]">Validate Single Email</CardTitle>
                <CardDescription className="text-[#94A3B8]">
                  Check if an email address is valid and deliverable
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="validateEmail" className="text-[#94A3B8]">Email Address</Label>
                  <Input
                    id="validateEmail"
                    type="email"
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    placeholder="john@company.com"
                    className="bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA]"
                    data-testid="input-validate-email"
                  />
                </div>
                <Button
                  onClick={() => validateEmailMutation.mutate()}
                  disabled={validateEmailMutation.isPending || !singleEmail}
                  className="w-full bg-[#4C6EF5] hover:bg-[#3D5DDB] text-white"
                  data-testid="button-validate-email"
                >
                  {validateEmailMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Validate Email
                    </>
                  )}
                </Button>

                {validateEmailMutation.data && (
                  <div className="p-4 rounded-lg bg-[#1A1F3A] border border-[#1E293B] mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[#F8F9FA] font-medium">
                        {validateEmailMutation.data.validation.email}
                      </span>
                      {getStatusBadge(validateEmailMutation.data.validation.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-[#94A3B8]">Deliverability:</div>
                      <div className="text-[#F8F9FA]">{validateEmailMutation.data.validation.deliverability}</div>
                      <div className="text-[#94A3B8]">Free Provider:</div>
                      <div className="text-[#F8F9FA]">{validateEmailMutation.data.validation.isFreeProvider ? "Yes" : "No"}</div>
                      <div className="text-[#94A3B8]">Role Account:</div>
                      <div className="text-[#F8F9FA]">{validateEmailMutation.data.validation.isRoleAccount ? "Yes" : "No"}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#11152B] border-[#1E293B]">
                <CardHeader>
                  <CardTitle className="text-lg text-[#F8F9FA]">Bulk Email Validation</CardTitle>
                  <CardDescription className="text-[#94A3B8]">
                    Paste multiple emails (one per line) to validate them all
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bulkEmails" className="text-[#94A3B8]">Email Addresses</Label>
                    <Textarea
                      id="bulkEmails"
                      value={bulkEmails}
                      onChange={(e) => setBulkEmails(e.target.value)}
                      placeholder="john@company.com&#10;jane@example.com&#10;support@business.com"
                      rows={8}
                      className="bg-[#1A1F3A] border-[#1E293B] text-[#F8F9FA] font-mono text-sm"
                      data-testid="textarea-bulk-emails"
                    />
                    <p className="text-xs text-[#64748B]">
                      {bulkEmails.split('\n').filter(e => e.trim() && e.includes('@')).length} emails detected
                    </p>
                  </div>
                  <Button
                    onClick={() => bulkValidateMutation.mutate()}
                    disabled={bulkValidateMutation.isPending || !bulkEmails.trim()}
                    className="w-full bg-[#4C6EF5] hover:bg-[#3D5DDB] text-white"
                    data-testid="button-bulk-validate"
                  >
                    {bulkValidateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Validate All Emails
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-[#11152B] border-[#1E293B]">
                <CardHeader>
                  <CardTitle className="text-lg text-[#F8F9FA]">Bulk Results</CardTitle>
                  <CardDescription className="text-[#94A3B8]">
                    Summary of validation results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bulkResults ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-[#10B981]/20 text-center">
                          <p className="text-2xl font-bold text-[#10B981]" data-testid="text-bulk-valid">
                            {bulkResults.stats?.valid || 0}
                          </p>
                          <p className="text-xs text-[#10B981]">Valid</p>
                        </div>
                        <div className="p-3 rounded-lg bg-[#EF4444]/20 text-center">
                          <p className="text-2xl font-bold text-[#EF4444]" data-testid="text-bulk-invalid">
                            {bulkResults.stats?.invalid || 0}
                          </p>
                          <p className="text-xs text-[#EF4444]">Invalid</p>
                        </div>
                        <div className="p-3 rounded-lg bg-[#F59E0B]/20 text-center">
                          <p className="text-2xl font-bold text-[#F59E0B]" data-testid="text-bulk-risky">
                            {bulkResults.stats?.risky || 0}
                          </p>
                          <p className="text-xs text-[#F59E0B]">Risky</p>
                        </div>
                        <div className="p-3 rounded-lg bg-[#64748B]/20 text-center">
                          <p className="text-2xl font-bold text-[#64748B]" data-testid="text-bulk-disposable">
                            {bulkResults.stats?.disposable || 0}
                          </p>
                          <p className="text-xs text-[#64748B]">Disposable</p>
                        </div>
                      </div>

                      <div className="max-h-[300px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-[#1E293B]">
                              <TableHead className="text-[#94A3B8]">Email</TableHead>
                              <TableHead className="text-[#94A3B8]">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bulkResults.results?.map((result: any, i: number) => (
                              <TableRow key={i} className="border-[#1E293B]">
                                <TableCell className="text-[#F8F9FA] font-mono text-sm">
                                  {result.email}
                                </TableCell>
                                <TableCell>{getStatusBadge(result.status)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="p-4 rounded-full bg-[#1A1F3A] mb-4">
                        <FileSpreadsheet className="w-8 h-8 text-[#64748B]" />
                      </div>
                      <p className="text-[#94A3B8]">Paste emails to see validation results</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className="bg-[#11152B] border-[#1E293B]">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-[#F8F9FA]">Validation History</CardTitle>
                  <CardDescription className="text-[#94A3B8]">
                    Recent email validations
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/enrichment/email/validations'] })}
                  className="border-[#1E293B] text-[#94A3B8] hover:bg-[#1A1F3A]"
                  data-testid="button-refresh-history"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#1E293B]">
                      <TableHead className="text-[#94A3B8]">Email</TableHead>
                      <TableHead className="text-[#94A3B8]">Status</TableHead>
                      <TableHead className="text-[#94A3B8]">Deliverability</TableHead>
                      <TableHead className="text-[#94A3B8]">Validated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(validationsHistory?.validations?.length ?? 0) > 0 ? (
                      validationsHistory?.validations?.map((validation: any) => (
                        <TableRow key={validation.id} className="border-[#1E293B]">
                          <TableCell className="text-[#F8F9FA] font-mono text-sm">
                            {validation.email}
                          </TableCell>
                          <TableCell>{getStatusBadge(validation.status)}</TableCell>
                          <TableCell className="text-[#94A3B8]">{validation.deliverability}</TableCell>
                          <TableCell className="text-[#64748B] text-sm">
                            {validation.validatedAt ? new Date(validation.validatedAt).toLocaleDateString() : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-[#64748B] py-8">
                          No validation history yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
