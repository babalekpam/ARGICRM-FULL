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

  // Check if user is platform owner - admin@default.com or abel@argilette.com
  const isPlatformOwner = user?.email === 'admin@default.com' || user?.email === 'abel@argilette.com';

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

  const { data: allLeads = [], isLoading, refetch } = useQuery<Lead[]>({
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
      case "new": return "bg-blue-100 text-blue-800";
      case "contacted": return "bg-yellow-100 text-yellow-800";
      case "qualified": return "bg-green-100 text-green-800";
      case "unqualified": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const renderField = (field: any, value: any = '') => {
    const commonProps = {
      name: field.name,
      placeholder: field.label,
      required: field.required,
      className: "px-3 py-2 border rounded-md",
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
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8 text-orange-600" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    AI-Powered Lead Management
                  </h1>
                  {!isPlatformOwner && (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      Clean Data View
                    </Badge>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-lg">Manage leads and use templates for efficient lead capture and qualification</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></div>
                Lead Pipeline
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Template Ready
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                AI Scoring
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button onClick={() => setActiveTab('templates')} variant="outline" className="bg-white shadow-md border-slate-200">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Tabs Layout */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full justify-start bg-gray-100 dark:bg-gray-800 p-1">
            <TabsTrigger value="leads" className="gap-2" data-testid="tab-leads">
              <Users className="h-4 w-4" />
              All Leads ({(leads || []).length})
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2" data-testid="tab-templates">
              <FileText className="h-4 w-4" />
              Templates ({(leadTemplates || []).length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2" data-testid="tab-analytics">
              <Target className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="scoring" className="gap-2" data-testid="tab-scoring">
              <Star className="h-4 w-4" />
              Scoring
            </TabsTrigger>
            <TabsTrigger value="landing-pages" className="gap-2" data-testid="tab-landing-pages">
              <Globe className="h-4 w-4" />
              Landing Pages
            </TabsTrigger>
          </TabsList>

          <div>

            <TabsContent value="leads" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(leads || []).map((lead: Lead) => (
                <Card key={lead.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <div className="flex items-center space-x-2 flex-1">
                      <UserCheck className="h-5 w-5 text-indigo-600" />
                      <CardTitle className="text-lg">{lead.firstName} {lead.lastName}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(lead.status || "new")}>
                      {lead.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{lead.email}</p>
                      {lead.company && (
                        <p className="text-sm font-medium">{lead.company}</p>
                      )}
                      {lead.jobTitle && (
                        <p className="text-sm text-gray-500">{lead.jobTitle}</p>
                      )}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center text-sm text-yellow-600">
                          <Star className="h-4 w-4 mr-1 fill-current" />
                          Score: {lead.score || 0}
                        </div>
                        {lead.status !== "converted" && (
                          <Button 
                            variant="outline"
                            size="sm" 
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
                      <div className="flex space-x-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setEditingLead(lead)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
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
                <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedTemplate(template)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Base Score:</span>
                        <Badge className="bg-blue-100 text-blue-800">{template.scoring.baseScore}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Fields:</span>
                        <span className="text-sm text-gray-600">{template.fields.length} fields</span>
                      </div>
                      <Button className="w-full mt-4" onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTemplate(template);
                      }}>
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(leads || []).length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active lead records
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(leads || []).filter(lead => lead.status === 'qualified').length}</div>
                  <p className="text-xs text-muted-foreground">
                    Ready for conversion
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(leads || []).length > 0 ? Math.round((leads || []).reduce((sum, lead) => sum + (lead.score || 0), 0) / (leads || []).length) : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Lead quality metric
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(leads || []).length > 0 ? Math.round(((leads || []).filter(lead => lead.status === 'converted').length / (leads || []).length) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leads to customers
                  </p>
                </CardContent>
              </Card>
              </div>
            </TabsContent>

            <TabsContent value="scoring" className="space-y-6 mt-0">
              <Card>
              <CardHeader>
                <CardTitle>Lead Scoring System</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Understanding how lead scores are calculated based on different templates and factors
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {(leadTemplates || []).map((template) => (
                    <div key={template.id} className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-2">{template.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Base Score: {template.scoring.baseScore}</h4>
                          <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Scoring Factors:</h4>
                          <div className="space-y-1">
                            {Object.entries(template.scoring.factors).map(([factor, value]) => (
                              <div key={factor} className="flex justify-between text-sm">
                                <span className="capitalize">{factor.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <span className="font-medium">
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Lead Generation Landing Pages
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-400">
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
                        color: 'bg-blue-500'
                      },
                      {
                        id: 'b2b-lead',
                        title: 'B2B Enterprise Template',
                        description: 'Designed for B2B companies targeting enterprise clients',
                        features: ['Lead Qualification', 'Enterprise Focus', 'Professional Design', 'Trust Indicators'],
                        conversionRate: '8-15%',
                        color: 'bg-green-500'
                      },
                      {
                        id: 'saas-trial',
                        title: 'SaaS Trial Template',
                        description: 'Convert visitors into trial users with compelling signup forms',
                        features: ['Free Trial Signup', 'Feature Highlights', 'Pricing Display', 'User Testimonials'],
                        conversionRate: '15-25%',
                        color: 'bg-purple-500'
                      },
                      {
                        id: 'consultation',
                        title: 'Consultation Booking',
                        description: 'Schedule consultations and strategy sessions with ease',
                        features: ['Booking Calendar', 'Service Details', 'Expert Profiles', 'Case Studies'],
                        conversionRate: '10-20%',
                        color: 'bg-orange-500'
                      },
                      {
                        id: 'product-launch',
                        title: 'Product Launch Template',
                        description: 'Announce new products with countdown timers and pre-orders',
                        features: ['Countdown Timer', 'Pre-order Forms', 'Product Gallery', 'Launch Updates'],
                        conversionRate: '18-28%',
                        color: 'bg-red-500'
                      },
                      {
                        id: 'event-registration',
                        title: 'Event Registration',
                        description: 'Drive event signups with compelling event details',
                        features: ['Event Details', 'Registration Forms', 'Speaker Profiles', 'Schedule Display'],
                        conversionRate: '20-30%',
                        color: 'bg-indigo-500'
                      }
                    ].map((template) => (
                      <Card key={template.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className={`w-3 h-3 rounded-full ${template.color}`}></div>
                            <Badge variant="secondary" className="text-xs">
                              {template.conversionRate} conversion
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{template.title}</CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {template.description}
                          </p>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-1">
                              {template.features.map((feature, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => window.open(`/template/${template.id}`, '_blank')}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                size="sm"
                              >
                                <Rocket className="h-4 w-4 mr-1" />
                                Use Template
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
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
                  
                  <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-2">How Lead Generation Templates Work</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold">1</div>
                        <div>
                          <div className="font-medium">Choose Template</div>
                          <div className="text-gray-600 dark:text-gray-400">Select a template that matches your business needs</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 text-xs font-bold">2</div>
                        <div>
                          <div className="font-medium">Capture Leads</div>
                          <div className="text-gray-600 dark:text-gray-400">Visitors fill out forms on your landing page</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 text-xs font-bold">3</div>
                        <div>
                          <div className="font-medium">Auto-Import</div>
                          <div className="text-gray-600 dark:text-gray-400">Leads automatically appear in your CRM system</div>
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
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Create Lead: {selectedTemplate.name}</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTemplate.description}</p>
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
                      <label className="block text-sm font-medium mb-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {renderField(field)}
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2 pt-4 border-t">
                  <Button type="submit" disabled={createLeadFromTemplate.isPending}>
                    {createLeadFromTemplate.isPending ? "Creating..." : "Create Lead"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setSelectedTemplate(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {showForm && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Add New Lead</CardTitle>
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
                  <input name="firstName" placeholder="First Name" required className="px-3 py-2 border rounded-md" />
                  <input name="lastName" placeholder="Last Name" required className="px-3 py-2 border rounded-md" />
                  <input name="email" type="email" placeholder="Email" required className="px-3 py-2 border rounded-md" />
                  <input 
                    name="phone" 
                    type="tel"
                    placeholder="Phone (10 digits)" 
                    className="px-3 py-2 border rounded-md"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    title="Please enter exactly 10 digits"
                    onInput={(e) => {
                      const value = e.currentTarget.value.replace(/\D/g, '');
                      e.currentTarget.value = value.substring(0, 10);
                    }}
                  />
                  <input name="company" placeholder="Company" className="px-3 py-2 border rounded-md" />
                  <input name="jobTitle" placeholder="Job Title" className="px-3 py-2 border rounded-md" />
                  <input name="leadSource" placeholder="Lead Source" className="px-3 py-2 border rounded-md" />
                  <select name="status" className="px-3 py-2 border rounded-md">
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="unqualified">Unqualified</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Lead"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {editingLead && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Edit Lead: {editingLead.firstName} {editingLead.lastName}</CardTitle>
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
                    className="px-3 py-2 border rounded-md" 
                  />
                  <input 
                    name="lastName" 
                    placeholder="Last Name" 
                    defaultValue={editingLead.lastName || ''} 
                    required 
                    className="px-3 py-2 border rounded-md" 
                  />
                  <input 
                    name="email" 
                    type="email" 
                    placeholder="Email" 
                    defaultValue={editingLead.email || ''} 
                    required 
                    className="px-3 py-2 border rounded-md" 
                  />
                  <input 
                    name="phone" 
                    type="tel"
                    placeholder="Phone (10 digits)" 
                    defaultValue={editingLead.phone || ''}
                    className="px-3 py-2 border rounded-md"
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
                    className="px-3 py-2 border rounded-md" 
                  />
                  <input 
                    name="jobTitle" 
                    placeholder="Job Title" 
                    defaultValue={editingLead.jobTitle || ''} 
                    className="px-3 py-2 border rounded-md" 
                  />
                  <input 
                    name="leadSource" 
                    placeholder="Lead Source" 
                    defaultValue={editingLead.leadSource || ''} 
                    className="px-3 py-2 border rounded-md" 
                  />
                  <select name="status" defaultValue={editingLead.status || 'new'} className="px-3 py-2 border rounded-md">
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="unqualified">Unqualified</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" disabled={isSaving}>
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingLead(null)}>
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