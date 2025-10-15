import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout";
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar, 
  Download, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Save,
  Filter,
  Search,
  FileText,
  Users,
  DollarSign,
  Target,
  Activity,
  Clock,
  AlertCircle
} from "lucide-react";

interface Report {
  id: number;
  name: string;
  reportType: string;
  description: string;
  filters: any;
  schedule: string;
  lastRun?: string;
  status: 'active' | 'draft' | 'archived';
  createdBy: string;
  createdAt: string;
  tenantId: string;
}

interface ReportData {
  labels: string[];
  values: number[];
  totalRecords: number;
  summary: {
    total: number;
    growth: number;
    trend: 'up' | 'down' | 'stable';
  };
}

const reportTypes = [
  { value: 'sales', label: 'Sales Performance', icon: DollarSign },
  { value: 'leads', label: 'Lead Generation', icon: Target },
  { value: 'contacts', label: 'Contact Activity', icon: Users },
  { value: 'pipeline', label: 'Pipeline Analysis', icon: BarChart3 },
  { value: 'revenue', label: 'Revenue Tracking', icon: TrendingUp },
  { value: 'activity', label: 'User Activity', icon: Activity }
];

export default function ReportsEnhanced() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [newReport, setNewReport] = useState({
    name: '',
    reportType: '',
    description: '',
    filters: '{}',
    schedule: 'manual'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reports
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['/api/reports'],
    queryFn: async () => {
      const response = await fetch('/api/reports');
      if (!response.ok) throw new Error('Failed to fetch reports');
      return response.json();
    }
  });

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create report');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      setIsCreateDialogOpen(false);
      setNewReport({ name: '', reportType: '', description: '', filters: '{}', schedule: 'manual' });
      toast({ title: "Success", description: "Report created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create report", variant: "destructive" });
    }
  });

  // Generate report data mutation
  const generateReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const response = await fetch(`/api/reports/${reportId}/generate`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to generate report');
      return response.json();
    },
    onSuccess: (data) => {
      setReportData(data);
      setIsViewDialogOpen(true);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate report", variant: "destructive" });
    }
  });

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete report');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({ title: "Success", description: "Report deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete report", variant: "destructive" });
    }
  });

  const handleCreateReport = () => {
    if (!newReport.name || !newReport.reportType) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    createReportMutation.mutate({
      ...newReport,
      filters: JSON.parse(newReport.filters || '{}')
    });
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    generateReportMutation.mutate(report.id);
  };

  const handleDeleteReport = (reportId: number) => {
    if (confirm('Are you sure you want to delete this report?')) {
      deleteReportMutation.mutate(reportId);
    }
  };

  const getReportIcon = (reportType: string) => {
    const type = reportTypes.find(t => t.value === reportType);
    const IconComponent = type?.icon || FileText;
    return <IconComponent className="h-5 w-5" />;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'active': 'bg-green-100 text-green-700',
      'draft': 'bg-yellow-100 text-yellow-700',
      'archived': 'bg-gray-100 text-gray-700'
    };
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-700'}>
        {status}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enhanced Reports</h1>
            <p className="text-gray-600 mt-2">Create and manage custom reports with PostgreSQL persistence</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        {/* Reports Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reports</p>
                  <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Reports</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter(r => r.status === 'active').length}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Scheduled Reports</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter(r => r.schedule !== 'manual').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Draft Reports</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reports.filter(r => r.status === 'draft').length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Custom Reports
            </CardTitle>
            <CardDescription>
              Manage your custom reports with advanced filtering and scheduling
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading reports...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No reports created yet</p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="mt-4"
                  variant="outline"
                >
                  Create Your First Report
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report: Report) => (
                  <div key={report.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          {getReportIcon(report.reportType)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{report.name}</h3>
                          <p className="text-sm text-gray-600">{report.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            {getStatusBadge(report.status)}
                            <Badge variant="outline" className="text-xs">
                              {reportTypes.find(t => t.value === report.reportType)?.label || report.reportType}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {report.schedule}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewReport(report)}
                          disabled={generateReportMutation.isPending}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteReport(report.id)}
                          disabled={deleteReportMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Report Dialog */}
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
            <DialogDescription>
              Configure your custom report with filters and scheduling options
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Report Name</label>
              <Input
                value={newReport.name}
                onChange={(e) => setNewReport(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter report name"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Report Type</label>
              <Select 
                value={newReport.reportType} 
                onValueChange={(value) => setNewReport(prev => ({ ...prev, reportType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
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
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newReport.description}
                onChange={(e) => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this report will show"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Schedule</label>
              <Select 
                value={newReport.schedule} 
                onValueChange={(value) => setNewReport(prev => ({ ...prev, schedule: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Filters (JSON)</label>
              <Textarea
                value={newReport.filters}
                onChange={(e) => setNewReport(prev => ({ ...prev, filters: e.target.value }))}
                placeholder='{"dateRange": "30d", "status": "active"}'
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateReport}
              disabled={createReportMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </div>
        </DialogContent>

        {/* View Report Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                {selectedReport?.name}
              </DialogTitle>
              <DialogDescription>
                Generated report data with analytics and insights
              </DialogDescription>
            </DialogHeader>
            
            {reportData && (
              <div className="space-y-6">
                {/* Report Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600">{reportData.summary.total}</p>
                      <p className="text-sm text-gray-600">Total Records</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className={`text-2xl font-bold ${reportData.summary.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {reportData.summary.growth >= 0 ? '+' : ''}{reportData.summary.growth}%
                      </p>
                      <p className="text-sm text-gray-600">Growth Rate</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center">
                        <TrendingUp className={`h-6 w-6 ${
                          reportData.summary.trend === 'up' ? 'text-green-600' : 
                          reportData.summary.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Trend</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Report Data Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Report Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Category</th>
                            <th className="text-right p-2">Value</th>
                            <th className="text-right p-2">Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.labels.map((label, index) => (
                            <tr key={index} className="border-b">
                              <td className="p-2">{label}</td>
                              <td className="text-right p-2">{reportData.values[index]}</td>
                              <td className="text-right p-2">
                                {((reportData.values[index] / reportData.summary.total) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}