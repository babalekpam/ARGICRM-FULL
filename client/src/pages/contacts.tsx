import ContactList from "@/components/contact-list";
import ContactForm from "@/components/contact-form";
import Layout from "@/components/layout";
import { useState, useMemo } from "react";
import { useTabManager } from "@/hooks/useTabManager";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Upload, FileText, Download, CheckCircle, AlertCircle, Eye, Edit, Trash2, Save, Users, BarChart3, Filter, FileSpreadsheet, Brain, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { ProtectedButton } from "@/components/protected-button";
import { ProtectedSection } from "@/components/protected-section";
import EmotionalIntelligenceWidget from "@/components/emotional-intelligence-widget";
import type { Contact } from "@shared/schema";

export default function ContactsPage() {
  const { user } = useAuth();
  const [showContactForm, setShowContactForm] = useState(false);

  // Fetch contacts data from API
  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery<Contact[]>({
    queryKey: ['/api/contacts'],
  });

  // Enhanced tab management with persistence and query invalidation
  const { activeTab, setActiveTab } = useTabManager({
    defaultTab: "list",
    queryInvalidationKeys: [
      ["/api/contacts"],
      ["/api/contacts/analytics"],
      ["/api/contacts/segments"]
    ],
    persistKey: "contacts-page"
  });

  // Calculate real statistics from API data
  const statistics = useMemo(() => {
    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return {
        totalContacts: 0,
        activeContacts: 0,
        newThisMonth: 0,
        conversionRate: 0,
      };
    }

    const totalContacts = contacts.length;
    const activeContacts = contacts.filter(c => c.status === 'active').length;
    
    // Calculate new contacts this month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const newThisMonth = contacts.filter(c => {
      if (!c.createdAt) return false;
      const created = new Date(c.createdAt);
      return created.getMonth() === currentMonth && created.getFullYear() === currentYear;
    }).length;

    // Calculate conversion rate (active contacts / total contacts)
    const conversionRate = totalContacts > 0 
      ? ((activeContacts / totalContacts) * 100).toFixed(1)
      : 0;

    return {
      totalContacts,
      activeContacts,
      newThisMonth,
      conversionRate,
    };
  }, [contacts]);

  // Check if user is platform owner - ONLY abel@argilette.com
  const isPlatformOwner = user?.email === 'abel@argilette.com';
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [processingImport, setProcessingImport] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    const ext = file.name.toLowerCase().split('.').pop();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(`.${ext}`)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or Excel file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setImportResult(null);
    setPreviewData(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Get auth token for Authorization header (same as queryClient pattern)
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/contacts/import/preview', {
        method: 'POST',
        headers,
        credentials: 'include', // IMPORTANT: Include httpOnly cookie authentication
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setPreviewData(result);
        setShowPreview(true);
        toast({
          title: "File Parsed Successfully",
          description: `Found ${result.stats.total} contacts. Review the preview before importing.`,
        });
      } else {
        toast({
          title: "Parse Failed",
          description: result.error || "Failed to parse file",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleImportConfirm = async () => {
    if (!previewData) return;

    setProcessingImport(true);

    try {
      // Get auth token for Authorization header (same as queryClient pattern)
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        headers,
        credentials: 'include', // IMPORTANT: Include httpOnly cookie authentication
        body: JSON.stringify({
          contacts: previewData.preview
        }),
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        toast({
          title: "Import Successful",
          description: `${result.imported} contacts imported successfully`,
        });
        setShowPreview(false);
        setPreviewData(null);
        // Refresh contact list
        window.location.reload();
      } else {
        toast({
          title: "Import Failed",
          description: result.errors?.[0] || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import Error",
        description: "Failed to import contacts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingImport(false);
    }
  };

  const handleEditContact = (index: number, field: string, value: string) => {
    if (!previewData) return;
    
    const updatedPreview = { ...previewData };
    updatedPreview.preview[index].mappedData[field] = value;
    
    // Re-validate the contact
    const contact = updatedPreview.preview[index];
    const validation = validateContactData(contact.mappedData);
    contact.isValid = validation.valid;
    contact.errors = validation.errors;
    
    setPreviewData(updatedPreview);
  };

  const validateContactData = (contact: any) => {
    const errors: string[] = [];
    
    if (!contact.name && !contact.email) {
      errors.push('Contact must have either name or email');
    }
    
    if (contact.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact.email)) {
        errors.push('Invalid email format');
      }
    }
    
    return { valid: errors.length === 0, errors };
  };

  const toggleContactInclude = (index: number) => {
    if (!previewData) return;
    
    const updatedPreview = { ...previewData };
    updatedPreview.preview[index].isValid = !updatedPreview.preview[index].isValid;
    setPreviewData(updatedPreview);
  };

  const downloadTemplate = () => {
    const csvContent = `name,email,phone,company,job title,location,bio,linkedin,company website,number of employees,lead source,status
John Doe,john@example.com,+1-555-0123,ACME Corp,Sales Manager,"New York, NY","Experienced sales professional",https://linkedin.com/in/johndoe,https://acme.com,500,Website,active
Jane Smith,jane@company.com,+1-555-0456,Tech Solutions,Marketing Director,"San Francisco, CA","Digital marketing expert",https://linkedin.com/in/janesmith,https://techsolutions.com,150,Referral,active`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Apollo-style Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[hsl(210,17%,98%)] tracking-tight">
                Contacts
              </h1>
              {!isPlatformOwner && (
                <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0">
                  Clean Data View
                </Badge>
              )}
            </div>
            <p className="text-sm text-[hsl(215,20%,65%)]">
              Manage your contacts and relationships
            </p>
            <div className="flex items-center gap-3 mt-3">
              <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0">
                <div className="w-2 h-2 bg-[hsl(227,89%,63%)] rounded-full mr-2 animate-pulse"></div>
                Smart CRM
              </Badge>
              <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(142,71%,45%)] border-0">
                Data Synced
              </Badge>
              <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(270,60%,70%)] border-0">
                AI Enhanced
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ProtectedButton 
              permission="analytics.read"
              variant="outline" 
              className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
              data-testid="button-contact-analytics"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Contact Analytics
            </ProtectedButton>
            <ProtectedButton 
              permission="contacts.create"
              onClick={() => setShowContactForm(true)} 
              className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
              hideIfNoPermission
              data-testid="button-add-contact"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </ProtectedButton>
          </div>
        </div>

        {/* Apollo-style Tabs Layout */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[hsl(229,41%,16%)] border border-[hsl(217,33%,17%)] p-1 w-auto inline-flex">
            <TabsTrigger 
              value="list" 
              className="gap-2 data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" 
              data-testid="tab-list"
            >
              <Users className="h-4 w-4" />
              Contact List
            </TabsTrigger>
            <TabsTrigger 
              value="import" 
              className="gap-2 data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" 
              data-testid="tab-import"
            >
              <Upload className="h-4 w-4" />
              Bulk Import
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="gap-2 data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" 
              data-testid="tab-analytics"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="segments" 
              className="gap-2 data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" 
              data-testid="tab-segments"
            >
              <Filter className="h-4 w-4" />
              Segments
            </TabsTrigger>
            <TabsTrigger 
              value="export" 
              className="gap-2 data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" 
              data-testid="tab-export"
            >
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger 
              value="emotional-intelligence" 
              className="gap-2 data-[state=active]:bg-[hsl(227,89%,63%)] data-[state=active]:text-white text-[hsl(215,20%,65%)]" 
              data-testid="tab-ai"
            >
              <Brain className="h-4 w-4" />
              AI Intelligence
              <Badge className="ml-1 bg-[hsl(270,60%,50%)] text-white text-xs border-0">NEW</Badge>
            </TabsTrigger>
          </TabsList>

          <div>
            <TabsContent value="list" className="space-y-6 mt-0">
              <ContactList />
              
              {showContactForm && (
                <ContactForm onClose={() => setShowContactForm(false)} />
              )}
            </TabsContent>

            <TabsContent value="import" className="space-y-6 mt-0">
              <ProtectedSection 
                permission="contacts.import"
                fallback={
                  <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)]">
                    <CardHeader>
                      <CardTitle className="text-[hsl(210,17%,98%)]">Import Not Available</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[hsl(215,20%,65%)]">You don't have permission to import contacts.</p>
                    </CardContent>
                  </Card>
                }
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)]">
                    <CardHeader>
                      <CardTitle className="flex items-center text-[hsl(210,17%,98%)]">
                        <Upload className="h-5 w-5 mr-2 text-[hsl(227,89%,63%)]" />
                        Upload Contacts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-[hsl(215,20%,65%)] mb-4">
                          Upload a CSV or Excel file to import multiple contacts at once. 
                          The system will automatically map columns to contact fields.
                        </p>
                        
                        <div className="border-2 border-dashed border-[hsl(217,33%,17%)] rounded-lg p-6 text-center bg-[hsl(229,41%,16%)]">
                          <Upload className="h-12 w-12 text-[hsl(215,16%,47%)] mx-auto mb-4" />
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-[hsl(210,17%,98%)]">Choose file to upload</p>
                            <p className="text-xs text-[hsl(215,16%,47%)]">CSV, XLS, or XLSX files up to 10MB</p>
                          </div>
                          <input
                            type="file"
                            accept=".csv,.xls,.xlsx"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="mt-4 block w-full text-sm text-[hsl(215,20%,65%)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[hsl(227,89%,63%)] file:text-white hover:file:bg-[hsl(227,89%,55%)]"
                          />
                        </div>

                        {uploading && (
                          <div className="mt-4">
                            <Progress value={50} className="h-2 bg-[hsl(229,41%,16%)]" />
                            <p className="text-sm text-[hsl(215,16%,47%)] mt-2">Processing file...</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={downloadTemplate} 
                          size="sm"
                          className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)]">
                    <CardHeader>
                      <CardTitle className="flex items-center text-[hsl(210,17%,98%)]">
                        <FileText className="h-5 w-5 mr-2 text-[hsl(227,89%,63%)]" />
                        Import Guidelines
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2 text-[hsl(210,17%,98%)]">Supported Columns</h4>
                          <div className="text-sm text-[hsl(215,20%,65%)] space-y-1">
                            <p><strong className="text-[hsl(210,17%,98%)]">Name:</strong> name, full name, contact name, first name</p>
                            <p><strong className="text-[hsl(210,17%,98%)]">Email:</strong> email, email address, e-mail, mail</p>
                            <p><strong className="text-[hsl(210,17%,98%)]">Phone:</strong> phone, phone number, telephone, mobile</p>
                            <p><strong className="text-[hsl(210,17%,98%)]">Company:</strong> company, organization, business, firm</p>
                            <p><strong className="text-[hsl(210,17%,98%)]">Job Title:</strong> job title, title, position, role</p>
                            <p><strong className="text-[hsl(210,17%,98%)]">Location:</strong> location, address, city, region, area</p>
                            <p><strong className="text-[hsl(210,17%,98%)]">Bio:</strong> bio, biography, description, about, notes</p>
                            <p><strong className="text-[hsl(210,17%,98%)]">LinkedIn:</strong> linkedin, linkedin profile, linkedin url</p>
                            <p><strong className="text-[hsl(210,17%,98%)]">Company Website:</strong> company website, website, company url</p>
                            <p><strong className="text-[hsl(210,17%,98%)]">Number of Employees:</strong> number of employees, employees, employee count</p>
                            <p><strong className="text-[hsl(210,17%,98%)]">Lead Source:</strong> lead source, source, origin, channel</p>
                            <p><strong className="text-[hsl(210,17%,98%)]">Status:</strong> status, lead status, contact status</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2 text-[hsl(210,17%,98%)]">Requirements</h4>
                          <ul className="text-sm text-[hsl(215,20%,65%)] space-y-1">
                            <li>Each contact must have either a name or email</li>
                            <li>Email addresses must be valid format</li>
                            <li>Duplicate emails will be skipped</li>
                            <li>Maximum 10MB file size</li>
                            <li>First row should contain column headers</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Preview Section */}
                {showPreview && previewData && (
                  <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)]">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center text-[hsl(210,17%,98%)]">
                          <Eye className="h-5 w-5 mr-2 text-[hsl(227,89%,63%)]" />
                          Import Preview
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowPreview(false)}
                            className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)]"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleImportConfirm}
                            disabled={processingImport || previewData.stats.valid === 0}
                            className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white"
                          >
                            {processingImport ? "Importing..." : `Import ${previewData.stats.valid} Contacts`}
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Stats Summary */}
                        <div className="grid grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-[hsl(229,41%,16%)] rounded-lg">
                            <div className="text-2xl font-bold text-[hsl(210,17%,98%)] tabular-nums">{previewData.stats.total}</div>
                            <div className="text-sm text-[hsl(215,16%,47%)]">Total</div>
                          </div>
                          <div className="text-center p-4 bg-[hsl(229,41%,16%)] rounded-lg">
                            <div className="text-2xl font-bold text-[hsl(142,71%,45%)] tabular-nums">{previewData.stats.valid}</div>
                            <div className="text-sm text-[hsl(215,16%,47%)]">Valid</div>
                          </div>
                          <div className="text-center p-4 bg-[hsl(229,41%,16%)] rounded-lg">
                            <div className="text-2xl font-bold text-[hsl(0,84%,60%)] tabular-nums">{previewData.stats.invalid}</div>
                            <div className="text-sm text-[hsl(215,16%,47%)]">Invalid</div>
                          </div>
                          <div className="text-center p-4 bg-[hsl(229,41%,16%)] rounded-lg">
                            <div className="text-2xl font-bold text-[hsl(38,92%,50%)] tabular-nums">{previewData.stats.duplicates}</div>
                            <div className="text-sm text-[hsl(215,16%,47%)]">Duplicates</div>
                          </div>
                        </div>

                        {/* Preview Table */}
                        <div className="max-h-96 overflow-y-auto border border-[hsl(217,33%,17%)] rounded-lg">
                          <table className="w-full text-sm">
                            <thead className="bg-[hsl(229,41%,16%)] sticky top-0">
                              <tr>
                                <th className="p-3 text-left text-[hsl(210,17%,98%)] font-medium">Include</th>
                                <th className="p-3 text-left text-[hsl(210,17%,98%)] font-medium">Row</th>
                                <th className="p-3 text-left text-[hsl(210,17%,98%)] font-medium">Name</th>
                                <th className="p-3 text-left text-[hsl(210,17%,98%)] font-medium">Email</th>
                                <th className="p-3 text-left text-[hsl(210,17%,98%)] font-medium">Company</th>
                                <th className="p-3 text-left text-[hsl(210,17%,98%)] font-medium">Status</th>
                                <th className="p-3 text-left text-[hsl(210,17%,98%)] font-medium">Issues</th>
                              </tr>
                            </thead>
                            <tbody>
                              {previewData.preview.map((contact: any, index: number) => (
                                <tr 
                                  key={index} 
                                  className={`border-t border-[hsl(217,33%,17%)] ${!contact.isValid || contact.isDuplicate ? 'bg-[hsl(0,30%,15%)]' : 'bg-[hsl(228,47%,12%)] hover:bg-[hsl(229,41%,16%)]'}`}
                                >
                                  <td className="p-3">
                                    <Checkbox
                                      checked={contact.isValid && !contact.isDuplicate}
                                      onCheckedChange={() => toggleContactInclude(index)}
                                      disabled={contact.isDuplicate}
                                    />
                                  </td>
                                  <td className="p-3 text-[hsl(215,20%,65%)]">{contact.rowNumber}</td>
                                  <td className="p-3">
                                    {editingRow === index ? (
                                      <Input
                                        value={contact.mappedData.name}
                                        onChange={(e) => handleEditContact(index, 'name', e.target.value)}
                                        className="h-7 text-xs bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]"
                                        onBlur={() => setEditingRow(null)}
                                        autoFocus
                                      />
                                    ) : (
                                      <div 
                                        className="cursor-pointer hover:bg-[hsl(229,41%,16%)] p-1 rounded text-[hsl(210,17%,98%)]"
                                        onClick={() => setEditingRow(index)}
                                      >
                                        {contact.mappedData.name || '-'}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {editingRow === index ? (
                                      <Input
                                        value={contact.mappedData.email}
                                        onChange={(e) => handleEditContact(index, 'email', e.target.value)}
                                        className="h-7 text-xs bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)]"
                                        onBlur={() => setEditingRow(null)}
                                      />
                                    ) : (
                                      <div 
                                        className="cursor-pointer hover:bg-[hsl(229,41%,16%)] p-1 rounded text-[hsl(215,20%,65%)]"
                                        onClick={() => setEditingRow(index)}
                                      >
                                        {contact.mappedData.email || '-'}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 text-[hsl(215,20%,65%)]">{contact.mappedData.company || '-'}</td>
                                  <td className="p-3">
                                    {contact.isDuplicate ? (
                                      <Badge className="bg-[hsl(38,30%,20%)] text-[hsl(38,92%,50%)] border-0">Duplicate</Badge>
                                    ) : contact.isValid ? (
                                      <Badge className="bg-[hsl(142,30%,20%)] text-[hsl(142,71%,45%)] border-0">Valid</Badge>
                                    ) : (
                                      <Badge className="bg-[hsl(0,30%,20%)] text-[hsl(0,84%,60%)] border-0">Invalid</Badge>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {contact.errors?.length > 0 && (
                                      <div className="text-xs text-[hsl(0,84%,60%)]">
                                        {contact.errors.slice(0, 2).join(', ')}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {processingImport && (
                          <div className="mt-4">
                            <Progress value={50} className="h-2 bg-[hsl(229,41%,16%)]" />
                            <p className="text-sm text-[hsl(215,16%,47%)] mt-2">Importing contacts...</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {importResult && (
                  <Alert className={`bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] ${importResult.success ? 'border-l-4 border-l-[hsl(142,71%,45%)]' : 'border-l-4 border-l-[hsl(0,84%,60%)]'}`}>
                    {importResult.success ? (
                      <CheckCircle className="h-4 w-4 text-[hsl(142,71%,45%)]" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-[hsl(0,84%,60%)]" />
                    )}
                    <AlertDescription className="text-[hsl(215,20%,65%)]">
                      {importResult.success ? (
                        <div>
                          <strong className="text-[hsl(210,17%,98%)]">Import completed successfully!</strong>
                          <div className="mt-2 text-sm">
                            <p className="text-[hsl(142,71%,45%)]">{importResult.imported} contacts imported</p>
                            {importResult.duplicates > 0 && (
                              <p className="text-[hsl(38,92%,50%)]">{importResult.duplicates} duplicates skipped</p>
                            )}
                            {importResult.failed > 0 && (
                              <p className="text-[hsl(0,84%,60%)]">{importResult.failed} contacts failed</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <strong className="text-[hsl(210,17%,98%)]">Import failed:</strong>
                          <div className="mt-2 text-sm text-[hsl(0,84%,60%)]">
                            {importResult.errors?.map((error: string, index: number) => (
                              <p key={index}>{error}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </ProtectedSection>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide">
                        Total Contacts
                      </p>
                      <Users className="h-4 w-4 text-[hsl(215,16%,47%)]" />
                    </div>
                    <p className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums" data-testid="stat-total-contacts">
                      {isLoadingContacts ? '...' : statistics.totalContacts}
                    </p>
                    <p className="text-xs text-[hsl(215,16%,47%)] mt-1">All contacts</p>
                  </CardContent>
                </Card>

                <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide">
                        Active Contacts
                      </p>
                      <CheckCircle className="h-4 w-4 text-[hsl(215,16%,47%)]" />
                    </div>
                    <p className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums" data-testid="stat-active-contacts">
                      {isLoadingContacts ? '...' : statistics.activeContacts}
                    </p>
                    <p className="text-xs text-[hsl(215,16%,47%)] mt-1">Engaged contacts</p>
                  </CardContent>
                </Card>

                <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide">
                        New This Month
                      </p>
                      <Plus className="h-4 w-4 text-[hsl(215,16%,47%)]" />
                    </div>
                    <p className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums" data-testid="stat-new-month">
                      {isLoadingContacts ? '...' : statistics.newThisMonth}
                    </p>
                    <p className="text-xs text-[hsl(215,16%,47%)] mt-1">
                      {statistics.totalContacts > 0 
                        ? `${((statistics.newThisMonth / statistics.totalContacts) * 100).toFixed(1)}% of total`
                        : 'No data yet'
                      }
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] rounded-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-[hsl(215,20%,65%)] uppercase tracking-wide">
                        Conversion Rate
                      </p>
                      <BarChart3 className="h-4 w-4 text-[hsl(215,16%,47%)]" />
                    </div>
                    <p className="text-3xl font-bold text-[hsl(210,17%,98%)] tabular-nums" data-testid="stat-conversion-rate">
                      {isLoadingContacts ? '...' : `${statistics.conversionRate}%`}
                    </p>
                    <p className="text-xs text-[hsl(215,16%,47%)] mt-1">Contact to active rate</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="segments" className="space-y-6 mt-0">
              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)]">
                <CardHeader>
                  <CardTitle className="text-[hsl(210,17%,98%)]">Contact Segments</CardTitle>
                  <p className="text-sm text-[hsl(215,20%,65%)]">Organize contacts into meaningful segments</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 border border-[hsl(217,33%,17%)] rounded-lg hover:bg-[hsl(229,41%,16%)] cursor-pointer transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-[hsl(210,17%,98%)]">High-Value Customers</h3>
                        <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0">89</Badge>
                      </div>
                      <p className="text-sm text-[hsl(215,20%,65%)]">Customers with high lifetime value</p>
                    </div>
                    <div className="p-4 border border-[hsl(217,33%,17%)] rounded-lg hover:bg-[hsl(229,41%,16%)] cursor-pointer transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-[hsl(210,17%,98%)]">New Prospects</h3>
                        <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0">156</Badge>
                      </div>
                      <p className="text-sm text-[hsl(215,20%,65%)]">Recently added prospects</p>
                    </div>
                    <div className="p-4 border border-[hsl(217,33%,17%)] rounded-lg hover:bg-[hsl(229,41%,16%)] cursor-pointer transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-[hsl(210,17%,98%)]">Enterprise Clients</h3>
                        <Badge className="bg-[hsl(229,41%,16%)] text-[hsl(227,89%,63%)] border-0">34</Badge>
                      </div>
                      <p className="text-sm text-[hsl(215,20%,65%)]">Large enterprise accounts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-6 mt-0">
              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)]">
                <CardHeader>
                  <CardTitle className="text-[hsl(210,17%,98%)]">Export Contacts</CardTitle>
                  <p className="text-sm text-[hsl(215,20%,65%)]">Export your contact data in various formats</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium text-[hsl(210,17%,98%)]">Export Options</h3>
                      <div className="space-y-2">
                        <Button 
                          className="w-full justify-start border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)] bg-transparent" 
                          variant="outline"
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Export as CSV
                        </Button>
                        <Button 
                          className="w-full justify-start border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)] bg-transparent" 
                          variant="outline"
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Export as Excel
                        </Button>
                        <Button 
                          className="w-full justify-start border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)] bg-transparent" 
                          variant="outline"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export as PDF Report
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-medium text-[hsl(210,17%,98%)]">Export Statistics</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between p-2 bg-[hsl(229,41%,16%)] rounded">
                          <span className="text-[hsl(215,20%,65%)]">Total Contacts:</span>
                          <span className="font-medium text-[hsl(210,17%,98%)] tabular-nums" data-testid="export-stat-total">
                            {isLoadingContacts ? '...' : statistics.totalContacts}
                          </span>
                        </div>
                        <div className="flex justify-between p-2 bg-[hsl(229,41%,16%)] rounded">
                          <span className="text-[hsl(215,20%,65%)]">Active Contacts:</span>
                          <span className="font-medium text-[hsl(210,17%,98%)] tabular-nums" data-testid="export-stat-active">
                            {isLoadingContacts ? '...' : statistics.activeContacts}
                          </span>
                        </div>
                        <div className="flex justify-between p-2 bg-[hsl(229,41%,16%)] rounded">
                          <span className="text-[hsl(215,20%,65%)]">Last Export:</span>
                          <span className="font-medium text-[hsl(210,17%,98%)]">Never</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="emotional-intelligence" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <EmotionalIntelligenceWidget showFullDashboard={true} />
                </div>
                <div className="space-y-4">
                  <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-[hsl(270,60%,70%)]">
                        <Heart className="h-5 w-5" />
                        Customer Sentiment Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-[hsl(142,30%,15%)] rounded-lg border border-[hsl(142,30%,25%)]">
                          <span className="text-sm font-medium text-[hsl(210,17%,98%)]">Positive Sentiment</span>
                          <Badge className="bg-[hsl(142,30%,20%)] text-[hsl(142,71%,45%)] border-0">Active</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[hsl(38,30%,15%)] rounded-lg border border-[hsl(38,30%,25%)]">
                          <span className="text-sm font-medium text-[hsl(210,17%,98%)]">Neutral Sentiment</span>
                          <Badge className="bg-[hsl(38,30%,20%)] text-[hsl(38,92%,50%)] border-0">Monitoring</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[hsl(0,30%,15%)] rounded-lg border border-[hsl(0,30%,25%)]">
                          <span className="text-sm font-medium text-[hsl(210,17%,98%)]">Negative Sentiment</span>
                          <Badge className="bg-[hsl(0,30%,20%)] text-[hsl(0,84%,60%)] border-0">Alert</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </Layout>
  );
}
