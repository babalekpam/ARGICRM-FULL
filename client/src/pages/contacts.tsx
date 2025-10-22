import ContactList from "@/components/contact-list";
import ContactForm from "@/components/contact-form";
import Layout from "@/components/layout";
import { useState } from "react";
import { useTabManager } from "@/hooks/useTabManager";
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
import EmotionalIntelligenceWidget from "@/components/emotional-intelligence-widget";

export default function ContactsPage() {
  const { user } = useAuth();
  const [showContactForm, setShowContactForm] = useState(false);

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

  // Check if user is platform owner - ONLY abel@argilette.com and admin@default.com
  const isPlatformOwner = user?.email === 'admin@default.com' || user?.email === 'abel@argilette.com';
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
    const csvContent = `name,email,phone,company,job title,lead source,status
John Doe,john@example.com,+1-555-0123,ACME Corp,Sales Manager,Website,active
Jane Smith,jane@company.com,+1-555-0456,Tech Solutions,Marketing Director,Referral,active`;
    
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Contact Management
                  </h1>
                  {!isPlatformOwner && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                      Clean Data View
                    </Badge>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-lg">Manage your customer contacts and relationships with AI intelligence</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                Smart CRM
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Data Synced
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                AI Enhanced
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button variant="outline" className="bg-white shadow-md border-slate-200">
              <BarChart3 className="w-4 h-4 mr-2" />
              Contact Analytics
            </Button>
            <Button onClick={() => setShowContactForm(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Tabs Layout */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full justify-start bg-gray-100 dark:bg-gray-800 p-1">
            <TabsTrigger value="list" className="gap-2" data-testid="tab-list">
              <Users className="h-4 w-4" />
              Contact List
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2" data-testid="tab-import">
              <Upload className="h-4 w-4" />
              Bulk Import
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2" data-testid="tab-analytics">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="segments" className="gap-2" data-testid="tab-segments">
              <Filter className="h-4 w-4" />
              Segments
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2" data-testid="tab-export">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="emotional-intelligence" className="gap-2" data-testid="tab-ai">
              <Brain className="h-4 w-4" />
              AI Intelligence
              <Badge className="ml-1 bg-purple-100 text-purple-600 text-xs">NEW</Badge>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Upload a CSV or Excel file to import multiple contacts at once. 
                      The system will automatically map columns to contact fields.
                    </p>
                    
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Choose file to upload</p>
                        <p className="text-xs text-gray-500">CSV, XLS, or XLSX files up to 10MB</p>
                      </div>
                      <input
                        type="file"
                        accept=".csv,.xls,.xlsx"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                    </div>

                    {uploading && (
                      <div className="mt-4">
                        <Progress value={50} className="h-2" />
                        <p className="text-sm text-gray-500 mt-2">Processing file...</p>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={downloadTemplate} size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Import Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Supported Columns</h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p><strong>Name:</strong> name, full name, contact name, first name</p>
                        <p><strong>Email:</strong> email, email address, e-mail, mail</p>
                        <p><strong>Phone:</strong> phone, phone number, telephone, mobile</p>
                        <p><strong>Company:</strong> company, organization, business, firm</p>
                        <p><strong>Job Title:</strong> job title, title, position, role</p>
                        <p><strong>Lead Source:</strong> lead source, source, origin, channel</p>
                        <p><strong>Status:</strong> status, lead status, contact status</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Requirements</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• Each contact must have either a name or email</li>
                        <li>• Email addresses must be valid format</li>
                        <li>• Duplicate emails will be skipped</li>
                        <li>• Maximum 10MB file size</li>
                        <li>• First row should contain column headers</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Section */}
            {showPreview && previewData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Eye className="h-5 w-5 mr-2" />
                      Import Preview
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={() => setShowPreview(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleImportConfirm}
                        disabled={processingImport || previewData.stats.valid === 0}
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
                      <div className="text-center">
                        <div className="text-2xl font-bold">{previewData.stats.total}</div>
                        <div className="text-sm text-gray-500">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{previewData.stats.valid}</div>
                        <div className="text-sm text-gray-500">Valid</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{previewData.stats.invalid}</div>
                        <div className="text-sm text-gray-500">Invalid</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{previewData.stats.duplicates}</div>
                        <div className="text-sm text-gray-500">Duplicates</div>
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div className="max-h-96 overflow-y-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="p-2 text-left">Include</th>
                            <th className="p-2 text-left">Row</th>
                            <th className="p-2 text-left">Name</th>
                            <th className="p-2 text-left">Email</th>
                            <th className="p-2 text-left">Company</th>
                            <th className="p-2 text-left">Status</th>
                            <th className="p-2 text-left">Issues</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.preview.map((contact: any, index: number) => (
                            <tr key={index} className={`border-t ${!contact.isValid || contact.isDuplicate ? 'bg-red-50' : 'bg-white'}`}>
                              <td className="p-2">
                                <Checkbox
                                  checked={contact.isValid && !contact.isDuplicate}
                                  onCheckedChange={() => toggleContactInclude(index)}
                                  disabled={contact.isDuplicate}
                                />
                              </td>
                              <td className="p-2">{contact.rowNumber}</td>
                              <td className="p-2">
                                {editingRow === index ? (
                                  <Input
                                    value={contact.mappedData.name}
                                    onChange={(e) => handleEditContact(index, 'name', e.target.value)}
                                    className="h-6 text-xs"
                                    onBlur={() => setEditingRow(null)}
                                    autoFocus
                                  />
                                ) : (
                                  <div 
                                    className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                                    onClick={() => setEditingRow(index)}
                                  >
                                    {contact.mappedData.name || '-'}
                                  </div>
                                )}
                              </td>
                              <td className="p-2">
                                {editingRow === index ? (
                                  <Input
                                    value={contact.mappedData.email}
                                    onChange={(e) => handleEditContact(index, 'email', e.target.value)}
                                    className="h-6 text-xs"
                                    onBlur={() => setEditingRow(null)}
                                  />
                                ) : (
                                  <div 
                                    className="cursor-pointer hover:bg-gray-100 p-1 rounded"
                                    onClick={() => setEditingRow(index)}
                                  >
                                    {contact.mappedData.email || '-'}
                                  </div>
                                )}
                              </td>
                              <td className="p-2">{contact.mappedData.company || '-'}</td>
                              <td className="p-2">
                                {contact.isDuplicate ? (
                                  <Badge variant="secondary">Duplicate</Badge>
                                ) : contact.isValid ? (
                                  <Badge className="bg-green-100 text-green-800">Valid</Badge>
                                ) : (
                                  <Badge variant="destructive">Invalid</Badge>
                                )}
                              </td>
                              <td className="p-2">
                                {contact.errors?.length > 0 && (
                                  <div className="text-xs text-red-600">
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
                        <Progress value={50} className="h-2" />
                        <p className="text-sm text-gray-500 mt-2">Importing contacts...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {importResult && (
              <Alert className={importResult.success ? "border-green-200" : "border-red-200"}>
                {importResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {importResult.success ? (
                    <div>
                      <strong>Import completed successfully!</strong>
                      <div className="mt-2 text-sm">
                        <p>✓ {importResult.imported} contacts imported</p>
                        {importResult.duplicates > 0 && (
                          <p>⚠ {importResult.duplicates} duplicates skipped</p>
                        )}
                        {importResult.failed > 0 && (
                          <p>✗ {importResult.failed} contacts failed</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <strong>Import failed:</strong>
                      <div className="mt-2 text-sm">
                        {importResult.errors?.map((error: string, index: number) => (
                          <p key={index}>• {error}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">530</div>
                    <p className="text-xs text-muted-foreground">All contacts</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Contacts</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">487</div>
                    <p className="text-xs text-muted-foreground">Engaged contacts</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">43</div>
                    <p className="text-xs text-muted-foreground">+12% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">18.5%</div>
                    <p className="text-xs text-muted-foreground">Contact to lead rate</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="segments" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Segments</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Organize contacts into meaningful segments</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">High-Value Customers</h3>
                        <Badge>89</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Customers with high lifetime value</p>
                    </div>
                    <div className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">New Prospects</h3>
                        <Badge>156</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Recently added prospects</p>
                    </div>
                    <div className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Enterprise Clients</h3>
                        <Badge>34</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Large enterprise accounts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Export Contacts</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Export your contact data in various formats</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Export Options</h3>
                      <div className="space-y-2">
                        <Button className="w-full justify-start" variant="outline">
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Export as CSV
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Export as Excel
                        </Button>
                        <Button className="w-full justify-start" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Export as PDF Report
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-medium">Export Statistics</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Contacts:</span>
                          <span className="font-medium">530</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Contacts:</span>
                          <span className="font-medium">487</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Export:</span>
                          <span className="font-medium">Never</span>
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-purple-700">
                        <Heart className="h-5 w-5" />
                        Customer Sentiment Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border">
                          <span className="text-sm font-medium">Positive Sentiment</span>
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border">
                          <span className="text-sm font-medium">Neutral Sentiment</span>
                          <Badge className="bg-yellow-100 text-yellow-700">Monitoring</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border">
                          <span className="text-sm font-medium">Negative Sentiment</span>
                          <Badge className="bg-red-100 text-red-700">Alert</Badge>
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