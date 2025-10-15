import { useState, useEffect } from "react";
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
import { Plus, BarChart3, PieChart, LineChart, Table, Download, Eye, Edit, Trash2, Upload, FileSpreadsheet, Filter, SortAsc } from "lucide-react";
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
  { value: "sales", label: "Sales Performance", icon: BarChart3, color: "blue" },
  { value: "revenue", label: "Revenue Analysis", icon: LineChart, color: "green" },
  { value: "customer", label: "Customer Analytics", icon: PieChart, color: "purple" },
  { value: "activity", label: "Activity Summary", icon: Table, color: "orange" },
  { value: "forecast", label: "Sales Forecast", icon: BarChart3, color: "indigo" },
  { value: "pipeline", label: "Pipeline Analysis", icon: LineChart, color: "pink" }
];

const ReportsPage = () => {
  const [showReportForm, setShowReportForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [sortBy, setSortBy] = useState("name");
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
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
  useEffect(() => {
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

  const { data: reports, isLoading } = useQuery({
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
      resetForm();
      toast({
        title: "Success",
        description: "Report created successfully"
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
    }
  });

  const resetForm = () => {
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
    setSelectedAccounts([]);
  };

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
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "running": return "bg-blue-100 text-blue-800 border-blue-200";
      case "scheduled": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getReportTypeConfig = (type: string) => {
    return reportTypes.find(t => t.value === type) || reportTypes[0];
  };

  const getReportIcon = (type: string) => {
    const config = getReportTypeConfig(type);
    const Icon = config.icon;
    return <Icon className="h-5 w-5" />;
  };

  // Filter and sort reports
  const filteredReports = reports?.filter((report: Report) => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || report.reportType === filterType;
    return matchesSearch && matchesFilter;
  }).sort((a: Report, b: Report) => {
    switch (sortBy) {
      case "name": return a.name.localeCompare(b.name);
      case "type": return a.reportType.localeCompare(b.reportType);
      case "created": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "status": return a.status.localeCompare(b.status);
      default: return 0;
    }
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="grid gap-6 md:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="p-8 space-y-8">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
              <div className="space-y-2">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Reports & Analytics
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl">
                  Generate comprehensive business reports with advanced insights and data visualization
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 text-lg font-medium">
                      <Upload className="h-5 w-5 mr-2" />
                      Import Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
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
                          className="mt-2"
                        />
                        <p className="text-sm text-gray-500 mt-2">
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
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                      <Plus className="h-5 w-5 mr-2" />
                      Create Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">Create New Report</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <Label htmlFor="name">Report Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter report name"
                            className="mt-2"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="reportType">Report Type *</Label>
                          <Select
                            value={formData.reportType}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, reportType: value }))}
                          >
                            <SelectTrigger className="mt-2">
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
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter report description"
                          rows={3}
                          className="mt-2"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="dateRange">Date Range</Label>
                        <Select
                          value={formData.dateRange}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, dateRange: value }))}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                            <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                            <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                            <SelectItem value="last_year">Last Year</SelectItem>
                            <SelectItem value="ytd">Year to Date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {accounts && accounts.length > 0 && (
                        <div>
                          <Label>Select Accounts (Optional)</Label>
                          <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg p-4 space-y-3">
                            {accounts.map((account: Account) => (
                              <div key={account.id} className="flex items-center space-x-3">
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
                                <Label htmlFor={`account-${account.id}`} className="text-sm font-medium">
                                  {account.name} ({account.type})
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end space-x-3 pt-4 border-t">
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
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Reports", value: reports?.length || 0, icon: BarChart3, color: "blue", bg: "from-blue-500 to-blue-600" },
              { label: "Completed", value: reports?.filter((r: Report) => r.status === 'completed').length || 0, icon: LineChart, color: "green", bg: "from-green-500 to-green-600" },
              { label: "Scheduled", value: reports?.filter((r: Report) => r.status === 'scheduled').length || 0, icon: PieChart, color: "yellow", bg: "from-yellow-500 to-yellow-600" },
              { label: "Running", value: reports?.filter((r: Report) => r.status === 'running').length || 0, icon: Table, color: "purple", bg: "from-purple-500 to-purple-600" }
            ].map((stat, index) => (
              <Card key={index} className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`bg-gradient-to-r ${stat.bg} rounded-2xl p-4 shadow-lg`}>
                      <stat.icon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filter and Search Controls */}
          <Card className="bg-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="flex-1">
                    <Input
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full sm:w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {reportTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SortAsc className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                      <SelectItem value="created">Created Date</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports Grid */}
          {filteredReports && filteredReports.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredReports.map((report: Report) => {
                const typeConfig = getReportTypeConfig(report.reportType);
                return (
                  <Card key={report.id} className="group bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                    <CardHeader className={`bg-gradient-to-r from-${typeConfig.color}-50 to-${typeConfig.color}-100 rounded-t-lg p-6`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`bg-gradient-to-r from-${typeConfig.color}-500 to-${typeConfig.color}-600 rounded-xl p-3 shadow-lg`}>
                            {getReportIcon(report.reportType)}
                            <span className="text-white">{/* Icon color */}</span>
                          </div>
                          <div className="space-y-2">
                            <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                              {report.name}
                            </CardTitle>
                            <p className="text-sm text-gray-600">{report.description || 'No description'}</p>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(report.status)} font-semibold px-3 py-1.5 border`}>
                          {report.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</span>
                          <p className="capitalize text-gray-900 font-medium">{typeConfig.label}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</span>
                          <p className="text-gray-900 font-medium">{new Date(report.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Run</span>
                          <p className="text-gray-900 font-medium">{new Date(report.lastRun).toLocaleDateString()}</p>
                        </div>
                        {report.accounts && report.accounts.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Accounts</span>
                            <p className="text-gray-900 font-medium">{report.accounts.length} selected</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="border-t pt-6">
                        <div className="grid grid-cols-3 gap-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewReport(report)}
                            disabled={viewReportMutation.isPending}
                            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 font-medium"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExportReport(report.id)}
                            disabled={exportReportMutation.isPending}
                            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 font-medium"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Export
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 font-medium"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-white border-0 shadow-xl">
              <CardContent className="text-center py-20">
                <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8">
                  <BarChart3 className="h-16 w-16 text-purple-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">No Reports Found</h3>
                <p className="text-xl text-gray-600 mb-10 max-w-lg mx-auto">
                  {searchTerm || filterType !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Create your first report to get started with comprehensive analytics and data visualization"
                  }
                </p>
                <Button 
                  onClick={() => setShowReportForm(true)} 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-10 py-4 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="h-6 w-6 mr-3" />
                  Create Your First Report
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Report View Dialog */}
          <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center text-2xl">
                  <FileSpreadsheet className="h-6 w-6 mr-3" />
                  {selectedReport?.name} - Data View
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {selectedReport && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-gray-50 rounded-xl">
                    <div className="space-y-1">
                      <span className="text-sm font-semibold text-gray-500">Report Type</span>
                      <p className="capitalize font-medium">{selectedReport.reportType}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-semibold text-gray-500">Created</span>
                      <p className="font-medium">{new Date(selectedReport.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-semibold text-gray-500">Last Run</span>
                      <p className="font-medium">{new Date(selectedReport.lastRun).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-semibold text-gray-500">Status</span>
                      <Badge className={getStatusColor(selectedReport.status)}>
                        {selectedReport.status}
                      </Badge>
                    </div>
                  </div>
                )}
                
                {reportData.length > 0 ? (
                  <div className="border rounded-xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(reportData[0]).map((header) => (
                              <th
                                key={header}
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
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
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                    <p className="text-xl text-gray-500">
                      {viewReportMutation.isPending ? "Loading report data..." : "No data available for this report"}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button 
                    variant="outline"
                    onClick={() => handleExportReport(selectedReport?.id || 0)}
                    disabled={!selectedReport || exportReportMutation.isPending}
                    className="px-6"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={() => setShowViewDialog(false)} className="px-6">
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