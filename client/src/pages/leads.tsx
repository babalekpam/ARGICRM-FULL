import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, UserCheck, Star, ArrowRight, Edit, Trash2, Save, FileText, Target, Users, Briefcase, Globe, Eye, Rocket } from "lucide-react";
import Layout from "@/components/layout";
import { apiRequest } from "@/lib/queryClient";
import type { Lead } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface LeadTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[];
  }>;
  defaultValues: Record<string, any>;
  scoring: {
    baseScore: number;
    factors: Record<string, number | Record<string, number>>;
  };
}

const leadTemplates: LeadTemplate[] = [
  {
    id: 'website-inquiry',
    name: 'Website Inquiry',
    description: 'General inquiries from website visitors',
    category: 'Digital Marketing',
    fields: [
      { name: 'firstName', label: 'First Name', type: 'text', required: true },
      { name: 'lastName', label: 'Last Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone', type: 'tel', required: false },
      { name: 'company', label: 'Company', type: 'text', required: false },
      { name: 'inquiryType', label: 'Inquiry Type', type: 'select', required: true, 
        options: ['Product Demo', 'Pricing Information', 'Technical Support', 'Partnership', 'General Question'] },
      { name: 'message', label: 'Message', type: 'textarea', required: false }
    ],
    defaultValues: {
      leadSource: 'Website',
      status: 'new'
    },
    scoring: {
      baseScore: 60,
      factors: {
        hasPhone: 10,
        hasCompany: 15,
        inquiryType: { 'Product Demo': 20, 'Pricing Information': 15, 'Partnership': 25 } as Record<string, number>
      }
    }
  },
  {
    id: 'trade-show',
    name: 'Trade Show Lead',
    description: 'Leads captured at trade shows and events',
    category: 'Events',
    fields: [
      { name: 'firstName', label: 'First Name', type: 'text', required: true },
      { name: 'lastName', label: 'Last Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone', type: 'tel', required: true },
      { name: 'company', label: 'Company', type: 'text', required: true },
      { name: 'jobTitle', label: 'Job Title', type: 'text', required: true },
      { name: 'eventName', label: 'Event Name', type: 'text', required: true },
      { name: 'interest', label: 'Interest Level', type: 'select', required: true,
        options: ['High', 'Medium', 'Low'] },
      { name: 'budget', label: 'Budget Range', type: 'select', required: false,
        options: ['Under $10K', '$10K-$50K', '$50K-$100K', '$100K+'] }
    ],
    defaultValues: {
      leadSource: 'Trade Show',
      status: 'contacted'
    },
    scoring: {
      baseScore: 80,
      factors: {
        interest: { 'High': 20, 'Medium': 10, 'Low': 0 } as Record<string, number>,
        budget: { 'Under $10K': 5, '$10K-$50K': 10, '$50K-$100K': 15, '$100K+': 20 } as Record<string, number>
      }
    }
  },
  {
    id: 'referral',
    name: 'Referral Lead',
    description: 'Leads referred by existing customers or partners',
    category: 'Referrals',
    fields: [
      { name: 'firstName', label: 'First Name', type: 'text', required: true },
      { name: 'lastName', label: 'Last Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone', type: 'tel', required: true },
      { name: 'company', label: 'Company', type: 'text', required: true },
      { name: 'referredBy', label: 'Referred By', type: 'text', required: true },
      { name: 'relationshipToReferrer', label: 'Relationship to Referrer', type: 'select', required: true,
        options: ['Customer', 'Partner', 'Employee', 'Friend', 'Other'] },
      { name: 'urgency', label: 'Urgency', type: 'select', required: true,
        options: ['Immediate', 'This Month', 'Next Quarter', 'Future'] }
    ],
    defaultValues: {
      leadSource: 'Referral',
      status: 'qualified'
    },
    scoring: {
      baseScore: 90,
      factors: {
        relationshipToReferrer: { 'Customer': 20, 'Partner': 15, 'Employee': 10 } as Record<string, number>,
        urgency: { 'Immediate': 20, 'This Month': 15, 'Next Quarter': 10, 'Future': 5 } as Record<string, number>
      }
    }
  },
  {
    id: 'cold-outreach',
    name: 'Cold Outreach',
    description: 'Prospects contacted through cold outreach campaigns',
    category: 'Outbound Sales',
    fields: [
      { name: 'firstName', label: 'First Name', type: 'text', required: true },
      { name: 'lastName', label: 'Last Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone', type: 'tel', required: false },
      { name: 'company', label: 'Company', type: 'text', required: true },
      { name: 'jobTitle', label: 'Job Title', type: 'text', required: true },
      { name: 'campaignType', label: 'Campaign Type', type: 'select', required: true,
        options: ['Email Campaign', 'LinkedIn Outreach', 'Cold Calling', 'Direct Mail'] },
      { name: 'responseType', label: 'Response Type', type: 'select', required: true,
        options: ['Interested', 'Not Now', 'Not Interested', 'Request Info'] }
    ],
    defaultValues: {
      leadSource: 'Cold Outreach',
      status: 'contacted'
    },
    scoring: {
      baseScore: 40,
      factors: {
        responseType: { 'Interested': 30, 'Request Info': 25, 'Not Now': 10, 'Not Interested': 0 } as Record<string, number>,
        hasPhone: 10
      }
    }
  }
];

export default function LeadsPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<LeadTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('leads');
  const queryClient = useQueryClient();

  // Check if user is platform owner
  const isPlatformOwner = user?.email === 'abel@argilette.com';

  const calculateLeadScore = (template: LeadTemplate, formData: Record<string, any>) => {
    let score = template.scoring.baseScore;
    
    Object.entries(template.scoring.factors).forEach(([factor, value]) => {
      if (typeof value === 'number') {
        // Simple boolean factors
        if (factor === 'hasPhone' && formData.phone) score += value;
        if (factor === 'hasCompany' && formData.company) score += value;
      } else if (typeof value === 'object') {
        // Select field scoring
        const fieldValue = formData[factor];
        if (fieldValue && value[fieldValue]) {
          score += value[fieldValue];
        }
      }
    });
    
    return Math.min(100, Math.max(0, score));
  };

  const createLeadFromTemplate = useMutation({
    mutationFn: async ({ template, formData }: { template: LeadTemplate, formData: Record<string, any> }) => {
      const score = calculateLeadScore(template, formData);
      const leadData = {
        ...formData,
        ...template.defaultValues,
        score,
        tenantId: 'default-tenant',
        createdBy: 'system'
      };
      const response = await apiRequest("POST", "/api/leads", leadData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setSelectedTemplate(null);
      refetch();
    },
  });

  const { data: allLeadsData, isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    queryFn: async () => {
      const response = await fetch("/api/leads");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Leads API response:", data);
      return data;
    },
    staleTime: 0,
  });
  const allLeads = allLeadsData || [];

  // Filter data based on user role - Platform owners see all data, other users see empty/clean data
  const leads = isPlatformOwner ? allLeads : []; // Non-platform users see no pre-populated leads

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/leads", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      refetch();
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      setIsSaving(true);
      const response = await apiRequest("PUT", `/api/leads/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setEditingLead(null);
      setIsSaving(false);
      refetch();
    },
    onError: () => {
      setIsSaving(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/leads/${id}`, null);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      refetch();
    },
  });

  const convertMutation = useMutation({
    mutationFn: async ({ leadId, contactData, accountData, dealData }: { 
      leadId: number, 
      contactData?: any, 
      accountData?: any, 
      dealData?: any 
    }) => {
      console.log('Converting lead:', leadId, { contactData, accountData, dealData });
      const response = await apiRequest("POST", `/api/leads/${leadId}/convert`, { 
        contactData, 
        accountData, 
        dealData 
      });
      const result = await response.json();
      console.log('Convert result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Lead conversion successful:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      refetch();
    },
    onError: (error) => {
      console.error('Lead conversion failed:', error);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-[hsl(217,91%,60%)/30%] text-[hsl(217,91%,60%)] border-0";
      case "contacted": return "bg-[hsl(38,92%,50%)/30%] text-[hsl(38,92%,50%)] border-0";
      case "qualified": return "bg-[hsl(160,84%,39%)/30%] text-[hsl(160,84%,39%)] border-0";
      case "unqualified": return "bg-[hsl(0,84%,60%)/30%] text-[hsl(0,84%,60%)] border-0";
      default: return "bg-[hsl(229,41%,16%)] text-[hsl(215,20%,65%)] border-0";
    }
  };

  const inputStyles = "px-3 py-2 bg-[hsl(229,41%,16%)] border border-[hsl(217,33%,17%)] rounded-md text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)] focus:border-[hsl(227,89%,63%)] focus:outline-none focus:ring-1 focus:ring-[hsl(227,89%,63%)]";

  const renderField = (field: any, value: any = '') => {
    const commonProps = {
      name: field.name,
      placeholder: field.label,
      required: field.required,
      className: inputStyles,
      defaultValue: value
    };

    switch (field.type) {
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select {field.label}</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'textarea':
        return <textarea {...commonProps} rows={3} />;
      case 'tel':
        return (
          <input 
            {...commonProps}
            type="tel" 
            maxLength={10}
            pattern="[0-9]{10}"
            title="Please enter exactly 10 digits"
            onInput={(e) => {
              const value = e.currentTarget.value.replace(/\D/g, '');
              e.currentTarget.value = value.substring(0, 10);
            }}
          />
        );
      default:
        return <input {...commonProps} type={field.type} />;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-[hsl(227,89%,63%)] border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Apollo-style Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[hsl(210,17%,98%)] tracking-tight">
                Leads
              </h1>
              {!isPlatformOwner && (
                <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0">
                  Clean Data View
                </Badge>
              )}
            </div>
            <p className="text-sm text-[hsl(215,20%,65%)]">
              Track and manage your sales leads
            </p>
            <div className="flex items-center gap-3 mt-3">
              <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0">
                <div className="w-2 h-2 bg-[hsl(227,89%,63%)] rounded-full mr-2 animate-pulse"></div>
                Lead Pipeline
              </Badge>
              <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(142,71%,45%)] border-0">
                Template Ready
              </Badge>
              <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(270,60%,70%)] border-0">
                AI Scoring
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setActiveTab('templates')} 
              variant="outline" 
              className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
            >
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button 
              onClick={() => setShowForm(true)} 
              className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Apollo-style Tabs Layout */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[hsl(229,41%,16%)] border border-[hsl(217,33%,17%)] p-1 w-auto inline-flex">
            <TabsTrigger 
              value="leads" 
              className="gap-2 data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" 
              data-testid="tab-leads"
            >
              <Users className="h-4 w-4" />
              All Leads ({(leads || []).length})
            </TabsTrigger>
            <TabsTrigger 
              value="templates" 
              className="gap-2 data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" 
              data-testid="tab-templates"
            >
              <FileText className="h-4 w-4" />
              Templates ({(leadTemplates || []).length})
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="gap-2 data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" 
              data-testid="tab-analytics"
            >
              <Target className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="scoring" 
              className="gap-2 data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" 
              data-testid="tab-scoring"
            >
              <Star className="h-4 w-4" />
              Scoring
            </TabsTrigger>
            <TabsTrigger 
              value="landing-pages" 
              className="gap-2 data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" 
              data-testid="tab-landing-pages"
            >
              <Globe className="h-4 w-4" />
              Landing Pages
            </TabsTrigger>
          </TabsList>

          <div>

            <TabsContent value="leads" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(leads || []).map((lead: Lead) => (
                <Card key={lead.id} className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg hover:border-[hsl(227,89%,63%)/50%] transition-colors">
                  <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                    <div className="flex items-center space-x-2 flex-1">
                      <UserCheck className="h-5 w-5 text-[hsl(227,89%,63%)]" />
                      <CardTitle className="text-lg text-[hsl(210,17%,98%)]">{lead.firstName} {lead.lastName}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(lead.status || "new")}>
                      {lead.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-[hsl(215,20%,65%)]">{lead.email}</p>
                      {lead.company && (
                        <p className="text-sm font-medium text-[hsl(210,17%,98%)]">{lead.company}</p>
                      )}
                      {lead.jobTitle && (
                        <p className="text-sm text-[hsl(215,16%,47%)]">{lead.jobTitle}</p>
                      )}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center text-sm text-[hsl(38,92%,50%)]">
                          <Star className="h-4 w-4 mr-1 fill-current" />
                          Score: {lead.score || 0}
                        </div>
                        {lead.status !== "converted" && (
                          <Button 
                            variant="outline"
                            size="sm" 
                            className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                            onClick={() => {
                              console.log('Convert button clicked for lead:', lead.id);
                              convertMutation.mutate({ 
                                leadId: lead.id, 
                                contactData: { 
                                  name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
                                  status: "prospect" 
                                },
                                accountData: {
                                  name: lead.company || `${lead.firstName} ${lead.lastName} Account`
                                },
                                dealData: {
                                  name: `${lead.company || lead.email} Deal`,
                                  amount: 5000
                                }
                              });
                            }}
                            disabled={convertMutation.isPending}
                          >
                            {convertMutation.isPending ? (
                              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-1" />
                            ) : (
                              <ArrowRight className="h-4 w-4 mr-1" />
                            )}
                            {convertMutation.isPending ? 'Converting...' : 'Convert'}
                          </Button>
                        )}
                      </div>
                      <div className="flex space-x-2 pt-4 border-t border-[hsl(217,33%,17%)]">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                          onClick={() => setEditingLead(lead)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1 bg-[hsl(0,84%,60%)/30%] text-[hsl(0,84%,60%)] hover:bg-[hsl(0,84%,60%)/40%] border-0"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${lead.firstName} ${lead.lastName}? This action cannot be undone.`)) {
                              deleteMutation.mutate(lead.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(leadTemplates || []).map((template) => (
                <Card 
                  key={template.id} 
                  className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg hover:border-[hsl(227,89%,63%)/50%] transition-colors cursor-pointer" 
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg text-[hsl(210,17%,98%)]">{template.name}</CardTitle>
                      <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0">{template.category}</Badge>
                    </div>
                    <p className="text-sm text-[hsl(215,20%,65%)]">{template.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[hsl(215,20%,65%)]">Base Score:</span>
                        <Badge className="bg-[hsl(217,91%,60%)/30%] text-[hsl(217,91%,60%)] border-0">{template.scoring.baseScore}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[hsl(215,20%,65%)]">Fields:</span>
                        <span className="text-sm text-[hsl(215,16%,47%)]">{template.fields.length} fields</span>
                      </div>
                      <Button 
                        className="w-full mt-4 bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplate(template);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide">Total Leads</CardTitle>
                  <Users className="h-4 w-4 text-[hsl(215,16%,47%)]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums">{(leads || []).length}</div>
                  <p className="text-xs text-[hsl(215,16%,47%)]">
                    Active lead records
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide">Qualified Leads</CardTitle>
                  <Target className="h-4 w-4 text-[hsl(215,16%,47%)]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[hsl(160,84%,39%)] tabular-nums">{(leads || []).filter(lead => lead.status === 'qualified').length}</div>
                  <p className="text-xs text-[hsl(215,16%,47%)]">
                    Ready for conversion
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide">Average Score</CardTitle>
                  <Star className="h-4 w-4 text-[hsl(215,16%,47%)]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[hsl(38,92%,50%)] tabular-nums">
                    {(leads || []).length > 0 ? Math.round((leads || []).reduce((sum, lead) => sum + (lead.score || 0), 0) / (leads || []).length) : 0}
                  </div>
                  <p className="text-xs text-[hsl(215,16%,47%)]">
                    Lead quality metric
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide">Conversion Rate</CardTitle>
                  <ArrowRight className="h-4 w-4 text-[hsl(215,16%,47%)]" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[hsl(227,89%,63%)] tabular-nums">
                    {(leads || []).length > 0 ? Math.round(((leads || []).filter(lead => lead.status === 'converted').length / (leads || []).length) * 100) : 0}%
                  </div>
                  <p className="text-xs text-[hsl(215,16%,47%)]">
                    Leads to customers
                  </p>
                </CardContent>
              </Card>
              </div>
            </TabsContent>

            <TabsContent value="scoring" className="space-y-6 mt-0">
              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
              <CardHeader>
                <CardTitle className="text-[hsl(210,17%,98%)]">Lead Scoring System</CardTitle>
                <p className="text-sm text-[hsl(215,20%,65%)]">
                  Understanding how lead scores are calculated based on different templates and factors
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {(leadTemplates || []).map((template) => (
                    <div key={template.id} className="border border-[hsl(217,33%,17%)] rounded-lg p-4 bg-[hsl(229,41%,16%)]">
                      <h3 className="text-lg font-semibold mb-2 text-[hsl(210,17%,98%)]">{template.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2 text-[hsl(210,17%,98%)]">Base Score: <span className="text-[hsl(227,89%,63%)]">{template.scoring.baseScore}</span></h4>
                          <p className="text-sm text-[hsl(215,20%,65%)] mb-3">{template.description}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2 text-[hsl(210,17%,98%)]">Scoring Factors:</h4>
                          <div className="space-y-1">
                            {Object.entries(template.scoring.factors).map(([factor, value]) => (
                              <div key={factor} className="flex justify-between text-sm">
                                <span className="capitalize text-[hsl(215,20%,65%)]">{factor.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <span className="font-medium text-[hsl(142,71%,45%)]">
                                  {typeof value === 'number' ? `+${value}` : 'Variable'}
                                </span>
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

            <TabsContent value="landing-pages" className="space-y-6 mt-0">
              <div className="grid gap-6">
              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[hsl(210,17%,98%)]">
                    <Globe className="h-5 w-5 text-[hsl(227,89%,63%)]" />
                    Lead Generation Landing Pages
                  </CardTitle>
                  <p className="text-[hsl(215,20%,65%)]">
                    Professional landing page templates optimized for lead capture and conversion
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      {
                        id: 'lead-generation',
                        title: 'Lead Generation Template',
                        description: 'Perfect for capturing leads with contact forms and compelling headlines',
                        features: ['Contact Forms', 'Call-to-Action', 'Social Proof', 'Mobile Optimized'],
                        conversionRate: '12-18%',
                        color: 'bg-[hsl(217,91%,60%)]'
                      },
                      {
                        id: 'b2b-lead',
                        title: 'B2B Enterprise Template',
                        description: 'Designed for B2B companies targeting enterprise clients',
                        features: ['Lead Qualification', 'Enterprise Focus', 'Professional Design', 'Trust Indicators'],
                        conversionRate: '8-15%',
                        color: 'bg-[hsl(160,84%,39%)]'
                      },
                      {
                        id: 'saas-trial',
                        title: 'SaaS Trial Template',
                        description: 'Convert visitors into trial users with compelling signup forms',
                        features: ['Free Trial Signup', 'Feature Highlights', 'Pricing Display', 'User Testimonials'],
                        conversionRate: '15-25%',
                        color: 'bg-[hsl(270,60%,70%)]'
                      },
                      {
                        id: 'consultation',
                        title: 'Consultation Booking',
                        description: 'Schedule consultations and strategy sessions with ease',
                        features: ['Booking Calendar', 'Service Details', 'Expert Profiles', 'Case Studies'],
                        conversionRate: '10-20%',
                        color: 'bg-[hsl(38,92%,50%)]'
                      },
                      {
                        id: 'product-launch',
                        title: 'Product Launch Template',
                        description: 'Announce new products with countdown timers and pre-orders',
                        features: ['Countdown Timer', 'Pre-order Forms', 'Product Gallery', 'Launch Updates'],
                        conversionRate: '18-28%',
                        color: 'bg-[hsl(0,84%,60%)]'
                      },
                      {
                        id: 'event-registration',
                        title: 'Event Registration',
                        description: 'Drive event signups with compelling event details',
                        features: ['Event Details', 'Registration Forms', 'Speaker Profiles', 'Schedule Display'],
                        conversionRate: '20-30%',
                        color: 'bg-[hsl(227,89%,63%)]'
                      }
                    ].map((template) => (
                      <Card key={template.id} className="bg-[hsl(229,41%,16%)] border border-[hsl(217,33%,17%)] rounded-lg hover:border-[hsl(227,89%,63%)/50%] transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className={`w-3 h-3 rounded-full ${template.color}`}></div>
                            <Badge className="bg-[hsl(228,47%,12%)] text-[hsl(215,20%,65%)] border-0 text-xs">
                              {template.conversionRate} conversion
                            </Badge>
                          </div>
                          <CardTitle className="text-lg text-[hsl(210,17%,98%)]">{template.title}</CardTitle>
                          <p className="text-sm text-[hsl(215,20%,65%)]">
                            {template.description}
                          </p>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-1">
                              {template.features.map((feature, idx) => (
                                <Badge key={idx} className="bg-[hsl(228,47%,12%)] text-[hsl(215,16%,47%)] border border-[hsl(217,33%,17%)] text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => window.open(`/template/${template.id}`, '_blank')}
                                className="flex-1 bg-[hsl(160,84%,39%)] hover:bg-[hsl(160,84%,35%)] text-white"
                                size="sm"
                              >
                                <Rocket className="h-4 w-4 mr-1" />
                                Use Template
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                                onClick={() => window.open(`/template/${template.id}`, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="mt-8 p-6 bg-[hsl(229,41%,16%)] rounded-lg border border-[hsl(217,33%,17%)]">
                    <h3 className="text-lg font-semibold mb-2 text-[hsl(210,17%,98%)]">How Lead Generation Templates Work</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-[hsl(217,91%,60%)/30%] rounded-full flex items-center justify-center text-[hsl(217,91%,60%)] text-xs font-bold">1</div>
                        <div>
                          <div className="font-medium text-[hsl(210,17%,98%)]">Choose Template</div>
                          <div className="text-[hsl(215,20%,65%)]">Select a template that matches your business needs</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-[hsl(270,60%,70%)/30%] rounded-full flex items-center justify-center text-[hsl(270,60%,70%)] text-xs font-bold">2</div>
                        <div>
                          <div className="font-medium text-[hsl(210,17%,98%)]">Capture Leads</div>
                          <div className="text-[hsl(215,20%,65%)]">Visitors fill out forms on your landing page</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-[hsl(160,84%,39%)/30%] rounded-full flex items-center justify-center text-[hsl(160,84%,39%)] text-xs font-bold">3</div>
                        <div>
                          <div className="font-medium text-[hsl(210,17%,98%)]">Auto-Import</div>
                          <div className="text-[hsl(215,20%,65%)]">Leads automatically appear in your CRM system</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {selectedTemplate && (
          <Card className="mt-6 bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
            <CardHeader>
              <CardTitle className="text-[hsl(210,17%,98%)]">Create Lead: {selectedTemplate.name}</CardTitle>
              <p className="text-sm text-[hsl(215,20%,65%)]">{selectedTemplate.description}</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data: Record<string, any> = {};
                
                selectedTemplate.fields.forEach(field => {
                  const value = formData.get(field.name);
                  if (value) data[field.name] = value;
                });
                
                createLeadFromTemplate.mutate({ template: selectedTemplate, formData: data });
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTemplate.fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium mb-1 text-[hsl(215,20%,65%)]">
                        {field.label} {field.required && <span className="text-[hsl(0,84%,60%)]">*</span>}
                      </label>
                      {renderField(field)}
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2 pt-4 border-t border-[hsl(217,33%,17%)]">
                  <Button 
                    type="submit" 
                    disabled={createLeadFromTemplate.isPending}
                    className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
                  >
                    {createLeadFromTemplate.isPending ? "Creating..." : "Create Lead"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setSelectedTemplate(null)}
                    className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {showForm && (
          <Card className="mt-6 bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
            <CardHeader>
              <CardTitle className="text-[hsl(210,17%,98%)]">Add New Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createMutation.mutate({
                  firstName: formData.get("firstName"),
                  lastName: formData.get("lastName"),
                  email: formData.get("email"),
                  phone: formData.get("phone"),
                  company: formData.get("company"),
                  jobTitle: formData.get("jobTitle"),
                  leadSource: formData.get("leadSource"),
                  status: formData.get("status"),
                });
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="firstName" placeholder="First Name" required className={inputStyles} />
                  <input name="lastName" placeholder="Last Name" required className={inputStyles} />
                  <input name="email" type="email" placeholder="Email" required className={inputStyles} />
                  <input 
                    name="phone" 
                    type="tel"
                    placeholder="Phone (10 digits)" 
                    className={inputStyles}
                    maxLength={10}
                    pattern="[0-9]{10}"
                    title="Please enter exactly 10 digits"
                    onInput={(e) => {
                      const value = e.currentTarget.value.replace(/\D/g, '');
                      e.currentTarget.value = value.substring(0, 10);
                    }}
                  />
                  <input name="company" placeholder="Company" className={inputStyles} />
                  <input name="jobTitle" placeholder="Job Title" className={inputStyles} />
                  <input name="leadSource" placeholder="Lead Source" className={inputStyles} />
                  <select name="status" className={inputStyles}>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="unqualified">Unqualified</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Lead"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
                    className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {editingLead && (
          <Card className="mt-6 bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
            <CardHeader>
              <CardTitle className="text-[hsl(210,17%,98%)]">Edit Lead: {editingLead.firstName} {editingLead.lastName}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateMutation.mutate({
                  id: editingLead.id,
                  data: {
                    firstName: formData.get("firstName"),
                    lastName: formData.get("lastName"),
                    email: formData.get("email"),
                    phone: formData.get("phone"),
                    company: formData.get("company"),
                    jobTitle: formData.get("jobTitle"),
                    leadSource: formData.get("leadSource"),
                    status: formData.get("status"),
                  }
                });
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    name="firstName" 
                    placeholder="First Name" 
                    defaultValue={editingLead.firstName || ''} 
                    required 
                    className={inputStyles}
                  />
                  <input 
                    name="lastName" 
                    placeholder="Last Name" 
                    defaultValue={editingLead.lastName || ''} 
                    required 
                    className={inputStyles}
                  />
                  <input 
                    name="email" 
                    type="email" 
                    placeholder="Email" 
                    defaultValue={editingLead.email || ''} 
                    required 
                    className={inputStyles}
                  />
                  <input 
                    name="phone" 
                    type="tel"
                    placeholder="Phone (10 digits)" 
                    defaultValue={editingLead.phone || ''}
                    className={inputStyles}
                    maxLength={10}
                    pattern="[0-9]{10}"
                    title="Please enter exactly 10 digits"
                    onInput={(e) => {
                      const value = e.currentTarget.value.replace(/\D/g, '');
                      e.currentTarget.value = value.substring(0, 10);
                    }}
                  />
                  <input 
                    name="company" 
                    placeholder="Company" 
                    defaultValue={editingLead.company || ''} 
                    className={inputStyles}
                  />
                  <input 
                    name="jobTitle" 
                    placeholder="Job Title" 
                    defaultValue={editingLead.jobTitle || ''} 
                    className={inputStyles}
                  />
                  <input 
                    name="leadSource" 
                    placeholder="Lead Source" 
                    defaultValue={editingLead.leadSource || ''} 
                    className={inputStyles}
                  />
                  <select name="status" defaultValue={editingLead.status || 'new'} className={inputStyles}>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="unqualified">Unqualified</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    type="submit" 
                    disabled={isSaving}
                    className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingLead(null)}
                    className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                  >
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
