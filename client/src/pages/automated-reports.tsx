import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Trash2, Plus, Calendar, Clock, FileJson } from "lucide-react";
import type { ReportConfig, GeneratedReport } from "@shared/schema";

interface AutomatedReportsProps {
  projectId: string;
}

export default function AutomatedReports({ projectId }: AutomatedReportsProps) {
  const { toast } = useToast();
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ReportConfig | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    reportType: "full",
    frequency: "weekly",
    format: "json",
    recipients: [] as string[],
    includeKeywords: true,
    includeTraffic: true,
    includeBacklinks: true,
    includeTechnicalAudit: true,
    includeCompetitors: true,
    isActive: true,
  });

  const { data: configs = [], isLoading: configsLoading } = useQuery<ReportConfig[]>({
    queryKey: ['/api/reports/configs', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/reports/configs/${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch report configs');
      return response.json();
    },
    enabled: !!projectId,
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery<GeneratedReport[]>({
    queryKey: ['/api/reports/generated', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/reports/generated/${projectId}`);
      if (!response.ok) throw new Error('Failed to fetch generated reports');
      return response.json();
    },
    enabled: !!projectId,
  });

  const createConfigMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/reports/configs', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports/configs', projectId] });
      setConfigDialogOpen(false);
      resetForm();
      toast({ title: "Report config created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create report config", variant: "destructive" });
    }
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => apiRequest(`/api/reports/configs/${id}`, 'PATCH', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports/configs', projectId] });
      setConfigDialogOpen(false);
      setEditingConfig(null);
      resetForm();
      toast({ title: "Report config updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update report config", variant: "destructive" });
    }
  });

  const deleteConfigMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/reports/configs/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports/configs', projectId] });
      toast({ title: "Report config deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete report config", variant: "destructive" });
    }
  });

  const generateReportMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/reports/generate', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports/generated', projectId] });
      toast({ title: "Report generated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to generate report", variant: "destructive" });
    }
  });

  const deleteReportMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/reports/generated/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports/generated', projectId] });
      toast({ title: "Report deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete report", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      reportType: "full",
      frequency: "weekly",
      format: "json",
      recipients: [],
      includeKeywords: true,
      includeTraffic: true,
      includeBacklinks: true,
      includeTechnicalAudit: true,
      includeCompetitors: true,
      isActive: true,
    });
  };

  const handleSaveConfig = () => {
    if (!formData.name.trim()) {
      toast({ title: "Report name is required", variant: "destructive" });
      return;
    }

    const payload = {
      projectId,
      ...formData,
      includeKeywords: formData.includeKeywords ? 1 : 0,
      includeTraffic: formData.includeTraffic ? 1 : 0,
      includeBacklinks: formData.includeBacklinks ? 1 : 0,
      includeTechnicalAudit: formData.includeTechnicalAudit ? 1 : 0,
      includeCompetitors: formData.includeCompetitors ? 1 : 0,
      isActive: formData.isActive ? 1 : 0,
    };

    if (editingConfig) {
      updateConfigMutation.mutate({ id: editingConfig.id, data: payload });
    } else {
      createConfigMutation.mutate(payload);
    }
  };

  const handleEditConfig = (config: ReportConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      reportType: config.reportType || "full",
      frequency: config.frequency || "weekly",
      format: config.format || "json",
      recipients: config.recipients || [],
      includeKeywords: !!config.includeKeywords,
      includeTraffic: !!config.includeTraffic,
      includeBacklinks: !!config.includeBacklinks,
      includeTechnicalAudit: !!config.includeTechnicalAudit,
      includeCompetitors: !!config.includeCompetitors,
      isActive: !!config.isActive,
    });
    setConfigDialogOpen(true);
  };

  const handleGenerateReport = (configId: string) => {
    generateReportMutation.mutate({ configId, projectId });
  };

  const handleDownloadReport = (report: GeneratedReport) => {
    const blob = new Blob([JSON.stringify(report.reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${report.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automated Reporting</h1>
          <p className="text-muted-foreground mt-1">Configure and generate comprehensive SEO reports</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Dialog open={configDialogOpen} onOpenChange={(open) => {
            setConfigDialogOpen(open);
            if (!open) {
              setEditingConfig(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-config">
                <Plus className="h-4 w-4 mr-2" />
                New Report Config
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingConfig ? "Edit Report Config" : "Create Report Config"}</DialogTitle>
                <DialogDescription>Configure automated report generation settings</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Report Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Weekly SEO Report"
                    data-testid="input-report-name"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="reportType">Report Type</Label>
                    <Select value={formData.reportType} onValueChange={(value) => setFormData({ ...formData, reportType: value })}>
                      <SelectTrigger data-testid="select-report-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Report</SelectItem>
                        <SelectItem value="keywords">Keywords Only</SelectItem>
                        <SelectItem value="traffic">Traffic Only</SelectItem>
                        <SelectItem value="technical">Technical Only</SelectItem>
                        <SelectItem value="backlinks">Backlinks Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                      <SelectTrigger data-testid="select-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="manual">Manual Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="format">Format</Label>
                    <Select value={formData.format} onValueChange={(value) => setFormData({ ...formData, format: value })}>
                      <SelectTrigger data-testid="select-format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3 border rounded-lg p-4">
                  <Label>Include Sections</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeKeywords" className="cursor-pointer">Keywords</Label>
                      <Switch
                        id="includeKeywords"
                        checked={formData.includeKeywords}
                        onCheckedChange={(checked) => setFormData({ ...formData, includeKeywords: checked })}
                        data-testid="switch-include-keywords"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeTraffic" className="cursor-pointer">Traffic</Label>
                      <Switch
                        id="includeTraffic"
                        checked={formData.includeTraffic}
                        onCheckedChange={(checked) => setFormData({ ...formData, includeTraffic: checked })}
                        data-testid="switch-include-traffic"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeBacklinks" className="cursor-pointer">Backlinks</Label>
                      <Switch
                        id="includeBacklinks"
                        checked={formData.includeBacklinks}
                        onCheckedChange={(checked) => setFormData({ ...formData, includeBacklinks: checked })}
                        data-testid="switch-include-backlinks"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeTechnicalAudit" className="cursor-pointer">Technical Audit</Label>
                      <Switch
                        id="includeTechnicalAudit"
                        checked={formData.includeTechnicalAudit}
                        onCheckedChange={(checked) => setFormData({ ...formData, includeTechnicalAudit: checked })}
                        data-testid="switch-include-technical"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeCompetitors" className="cursor-pointer">Competitors</Label>
                      <Switch
                        id="includeCompetitors"
                        checked={formData.includeCompetitors}
                        onCheckedChange={(checked) => setFormData({ ...formData, includeCompetitors: checked })}
                        data-testid="switch-include-competitors"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        data-testid="switch-is-active"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setConfigDialogOpen(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveConfig} data-testid="button-save-config">
                    {editingConfig ? "Update" : "Create"} Config
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Configurations</CardTitle>
              <CardDescription>Manage automated report generation settings</CardDescription>
            </CardHeader>
            <CardContent>
              {configsLoading ? (
                <p className="text-muted-foreground">Loading configurations...</p>
              ) : configs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No report configurations yet. Create one to get started.</p>
              ) : (
                <div className="space-y-3">
                  {configs.map((config) => (
                    <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`config-${config.id}`}>
                      <div className="flex-1">
                        <h3 className="font-medium" data-testid={`config-name-${config.id}`}>{config.name}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {config.reportType}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {config.frequency}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileJson className="h-3 w-3" />
                            {config.format}
                          </span>
                          <span className={config.isActive ? "text-green-600" : "text-red-600"}>
                            {config.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleGenerateReport(config.id)}
                          disabled={generateReportMutation.isPending}
                          data-testid={`button-generate-${config.id}`}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Generate Now
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEditConfig(config)} data-testid={`button-edit-${config.id}`}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteConfigMutation.mutate(config.id)}
                          disabled={deleteConfigMutation.isPending}
                          data-testid={`button-delete-config-${config.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>View and download previously generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <p className="text-muted-foreground">Loading reports...</p>
              ) : reports.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No reports generated yet. Generate a report from a configuration above.</p>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => {
                    const config = configs.find(c => c.id === report.configId);
                    return (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`report-${report.id}`}>
                        <div>
                          <h3 className="font-medium" data-testid={`report-config-${report.id}`}>{config?.name || 'Unknown Config'}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Generated {new Date(report.generatedAt!).toLocaleString()} • {report.format.toUpperCase()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadReport(report)}
                            data-testid={`button-download-${report.id}`}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteReportMutation.mutate(report.id)}
                            disabled={deleteReportMutation.isPending}
                            data-testid={`button-delete-report-${report.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
