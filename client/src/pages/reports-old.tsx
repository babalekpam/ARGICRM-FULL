import * as React from "react";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, BarChart3, PieChart, LineChart, Table, Download, Eye, Edit, Trash2, Upload, FileSpreadsheet } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Report {
  id: number;
  name: string;
  description: string;
  reportType: string;
  status: string;
  createdAt: string;
  lastRun: string;
  accounts?: string[];
}

interface Account {
  id: number;
  name: string;
  type: string;
  industry: string;
}

const reportTypes = [
  { value: "sales", label: "Sales Performance", icon: BarChart3 },
  { value: "revenue", label: "Revenue Analysis", icon: LineChart },
  { value: "customer", label: "Customer Analytics", icon: PieChart },
  { value: "activity", label: "Activity Summary", icon: Table },
  { value: "forecast", label: "Sales Forecast", icon: BarChart3 },
  { value: "pipeline", label: "Pipeline Analysis", icon: LineChart }
];

const ReportsPage = () => {
  const [showReportForm, setShowReportForm] = React.useState(false);
  const [showImportDialog, setShowImportDialog] = React.useState(false);
  const [showViewDialog, setShowViewDialog] = React.useState(false);
  const [selectedReport, setSelectedReport] = React.useState<Report | null>(null);
  const [reportData, setReportData] = React.useState<any[]>([]);
  const [selectedAccounts, setSelectedAccounts] = React.useState<number[]>([]);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    reportType: "",
    accountId: null as number | null,
    dateRange: "last_30_days",
    includeMetrics: {
      revenue: true,
      deals: true,
      activities: true,
      contacts: true
    }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check for URL parameters to pre-select account
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accountId = urlParams.get('accountId');
    const accountName = urlParams.get('accountName');
    
    if (accountId && accountName) {
      setFormData(prev => ({
        ...prev,
        accountId: parseInt(accountId),
        name: `${decodeURIComponent(accountName)} Report`
      }));
      setShowReportForm(true);
    }
  }, []);

  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ["/api/reports"],
    queryFn: async () => {
      const response = await fetch("/api/reports");
      if (!response.ok) throw new Error("Failed to fetch reports");
      return response.json();
    }
  });

  const { data: accounts } = useQuery({
    queryKey: ["/api/accounts"],
    queryFn: async () => {
      const response = await fetch("/api/accounts");
      if (!response.ok) throw new Error("Failed to fetch accounts");
      return response.json();
    }
  });

  const createReportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData)
      });
      if (!response.ok) throw new Error("Failed to create report");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setShowReportForm(false);
      setFormData({
        name: "",
        description: "",
        reportType: "",
        accountId: null,
        dateRange: "last_30_days",
        includeMetrics: {
          revenue: true,
          deals: true,
          activities: true,
          contacts: true
        }
      });
      toast({
        title: "Success",
        description: "Report created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create report",
        variant: "destructive"
      });
    }
  });

  const viewReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const response = await fetch(`/api/reports/${reportId}/data`);
      if (!response.ok) throw new Error("Failed to fetch report data");
      return response.json();
    },
    onSuccess: (data) => {
      setReportData(data);
      setShowViewDialog(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to load report data",
        variant: "destructive"
      });
    }
  });

  const importReportMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch("/api/reports/import", {
        method: "POST",
        body: formData
      });
      if (!response.ok) throw new Error("Failed to import report");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setShowImportDialog(false);
      setImportFile(null);
      toast({
        title: "Success",
        description: "Report imported successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import report",
        variant: "destructive"
      });
    }
  });

  const exportReportMutation = useMutation({
    mutationFn: async ({ reportId, format }: { reportId: number, format: string }) => {
      const response = await fetch(`/api/reports/${reportId}/export?format=${format}`);
      if (!response.ok) throw new Error("Failed to export report");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to export report",
        variant: "destructive"
      });
    }
  });

  const handleCreateReport = () => {
    if (!formData.name || !formData.reportType) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    createReportMutation.mutate({
      ...formData,
      accounts: selectedAccounts.length > 0 ? selectedAccounts : (formData.accountId ? [formData.accountId] : [])
    });
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    viewReportMutation.mutate(report.id);
  };

  const handleExportReport = (reportId: number, format: string = 'csv') => {
    exportReportMutation.mutate({ reportId, format });
  };

  const handleImportReport = () => {
    if (!importFile) {
      toast({
        title: "Error",
        description: "Please select a file to import",
        variant: "destructive"
      });
      return;
    }
    importReportMutation.mutate(importFile);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "running": return "bg-blue-100 text-blue-800";
      case "scheduled": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getReportIcon = (type: string) => {
    const reportType = reportTypes.find(t => t.value === type);
    const Icon = reportType?.icon || BarChart3;
    return <Icon className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center bg-gradient-to-r from-white to-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-3 text-lg">Generate and manage comprehensive business reports with advanced insights</p>
          </div>
          <div className="flex space-x-3">
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm px-6 py-2.5">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Report
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Report</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file">Select Report File</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Supported formats: CSV, Excel (.xlsx, .xls)
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleImportReport}
                      disabled={!importFile || importReportMutation.isPending}
                    >
                      {importReportMutation.isPending ? "Importing..." : "Import"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={showReportForm} onOpenChange={setShowReportForm}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="name">Report Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter report name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter report description"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="reportType">Report Type *</Label>
                    <Select
                      value={formData.reportType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, reportType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        {reportTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center">
                              <type.icon className="h-4 w-4 mr-2" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dateRange">Date Range</Label>
                    <Select
                      value={formData.dateRange}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, dateRange: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                        <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                        <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                        <SelectItem value="last_year">Last Year</SelectItem>
                        <SelectItem value="ytd">Year to Date</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {accounts && accounts.length > 0 && (
                    <div>
                      <Label>Select Accounts (Optional)</Label>
                      <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
                        {accounts.map((account: Account) => (
                          <div key={account.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`account-${account.id}`}
                              checked={selectedAccounts.includes(account.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedAccounts(prev => [...prev, account.id]);
                                } else {
                                  setSelectedAccounts(prev => prev.filter(id => id !== account.id));
                                }
                              }}
                            />
                            <Label htmlFor={`account-${account.id}`} className="text-sm">
                              {account.name} ({account.type})
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Include Metrics</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {Object.entries(formData.includeMetrics).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={key}
                            checked={value}
                            onCheckedChange={(checked) => 
                              setFormData(prev => ({
                                ...prev,
                                includeMetrics: { ...prev.includeMetrics, [key]: checked }
                              }))
                            }
                          />
                          <Label htmlFor={key} className="text-sm capitalize">
                            {key}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowReportForm(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateReport}
                    disabled={createReportMutation.isPending}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {createReportMutation.isPending ? "Creating..." : "Create Report"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Total Reports</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{reports?.length || 0}</p>
                </div>
                <div className="bg-blue-500 rounded-full p-3">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 uppercase tracking-wide">Completed</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">
                    {reports?.filter((r: Report) => r.status === 'completed').length || 0}
                  </p>
                </div>
                <div className="bg-green-500 rounded-full p-3">
                  <LineChart className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600 uppercase tracking-wide">Scheduled</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-2">
                    {reports?.filter((r: Report) => r.status === 'scheduled').length || 0}
                  </p>
                </div>
                <div className="bg-yellow-500 rounded-full p-3">
                  <PieChart className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 uppercase tracking-wide">Running</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">
                    {reports?.filter((r: Report) => r.status === 'running').length || 0}
                  </p>
                </div>
                <div className="bg-purple-500 rounded-full p-3">
                  <Table className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reports && reports.map((report: Report) => (
            <Card key={report.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-white">
              <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white rounded-full p-2 shadow-sm">
                      {getReportIcon(report.reportType)}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {report.name}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{report.description || 'No description'}</p>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(report.status)} font-medium px-3 py-1`}>
                    {report.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-500 font-medium">Type</span>
                      <span className="capitalize text-gray-900 mt-1">{report.reportType}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 font-medium">Created</span>
                      <span className="text-gray-900 mt-1">{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-500 font-medium">Last Run</span>
                      <span className="text-gray-900 mt-1">{new Date(report.lastRun).toLocaleDateString()}</span>
                    </div>
                    {report.accounts && report.accounts.length > 0 && (
                      <div className="flex flex-col">
                        <span className="text-gray-500 font-medium">Accounts</span>
                        <span className="text-gray-900 mt-1">{report.accounts.length} selected</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-gray-100 mt-6 pt-4">
                  <div className="flex justify-between space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewReport(report)}
                      disabled={viewReportMutation.isPending}
                      className="flex-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExportReport(report.id)}
                      disabled={exportReportMutation.isPending}
                      className="flex-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1 bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!reports || reports.length === 0) && (
          <Card className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 border-0 shadow-lg">
            <CardContent>
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Reports Yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">Create your first report to get started with comprehensive analytics and data visualization</p>
              <Button 
                onClick={() => setShowReportForm(true)} 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-5 w-5 mr-3" />
                Create Your First Report
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Report View Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <FileSpreadsheet className="h-5 w-5 mr-2" />
                {selectedReport?.name} - Data View
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedReport && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Report Type:</span>
                    <p className="capitalize">{selectedReport.reportType}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Created:</span>
                    <p>{new Date(selectedReport.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Last Run:</span>
                    <p>{new Date(selectedReport.lastRun).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <Badge className={getStatusColor(selectedReport.status)}>
                      {selectedReport.status}
                    </Badge>
                  </div>
                </div>
              )}
              
              {reportData.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(reportData[0]).map((header) => (
                            <th
                              key={header}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {Object.values(row).map((value: any, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                              >
                                {typeof value === 'number' && value > 1000 
                                  ? value.toLocaleString() 
                                  : String(value)
                                }
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {viewReportMutation.isPending ? "Loading report data..." : "No data available for this report"}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => handleExportReport(selectedReport?.id || 0)}
                  disabled={!selectedReport || exportReportMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage;