import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Play, Pause, Settings, GitBranch, CheckCircle, Clock, XCircle } from "lucide-react";
import Layout from "@/components/layout";
import { apiRequest } from "@/lib/queryClient";

interface Pipeline {
  id: string;
  name: string;
  description: string;
  stages: PipelineStage[];
  status: 'active' | 'paused' | 'draft';
  trigger: 'manual' | 'push' | 'schedule' | 'webhook';
  created: Date;
  lastRun?: Date;
  runCount: number;
}

interface PipelineStage {
  id: string;
  name: string;
  type: 'build' | 'test' | 'deploy' | 'notify' | 'custom';
  config: Record<string, any>;
  status: 'pending' | 'running' | 'success' | 'failed';
  duration?: number;
}

const prebuiltTemplates = [
  {
    id: 'saas-full',
    name: 'Full SaaS Deployment',
    description: 'Complete CI/CD pipeline for SaaS applications',
    stages: [
      { name: 'Code Quality', type: 'test', config: { checks: ['lint', 'format', 'security'] }},
      { name: 'Unit Tests', type: 'test', config: { framework: 'jest', coverage: 80 }},
      { name: 'Build App', type: 'build', config: { target: 'production', optimize: true }},
      { name: 'Integration Tests', type: 'test', config: { type: 'e2e', browser: 'chrome' }},
      { name: 'Deploy Staging', type: 'deploy', config: { environment: 'staging', health_check: true }},
      { name: 'Deploy Production', type: 'deploy', config: { environment: 'production', approval: true }},
      { name: 'Notify Team', type: 'notify', config: { channels: ['slack', 'email'], on: 'success' }}
    ]
  },
  {
    id: 'api-only',
    name: 'API Development',
    description: 'Backend API testing and deployment pipeline',
    stages: [
      { name: 'API Tests', type: 'test', config: { type: 'api', postman: true }},
      { name: 'Build API', type: 'build', config: { containerize: true, registry: 'docker' }},
      { name: 'Deploy API', type: 'deploy', config: { platform: 'kubernetes', replicas: 3 }},
      { name: 'Health Check', type: 'test', config: { endpoint: '/health', timeout: 30 }}
    ]
  },
  {
    id: 'frontend-spa',
    name: 'Frontend SPA',
    description: 'Single Page Application deployment pipeline',
    stages: [
      { name: 'Install Dependencies', type: 'build', config: { manager: 'npm', cache: true }},
      { name: 'Component Tests', type: 'test', config: { framework: 'react-testing-library' }},
      { name: 'Build Assets', type: 'build', config: { bundler: 'vite', minify: true }},
      { name: 'Deploy CDN', type: 'deploy', config: { provider: 'cloudflare', cache_ttl: 3600 }}
    ]
  }
];

export default function PipelinesPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [newPipeline, setNewPipeline] = useState({
    name: '',
    description: '',
    trigger: 'manual' as const
  });

  const queryClient = useQueryClient();

  // Mock data for demonstration
  const pipelines: Pipeline[] = [
    {
      id: 'pipeline-1',
      name: 'NODE CRM',
      description: 'Main development pipeline for CRM platform',
      stages: [
        { id: 'stage-1', name: 'Code Quality', type: 'test', config: {}, status: 'success', duration: 45 },
        { id: 'stage-2', name: 'Unit Tests', type: 'test', config: {}, status: 'success', duration: 120 },
        { id: 'stage-3', name: 'Build App', type: 'build', config: {}, status: 'running' },
        { id: 'stage-4', name: 'Deploy Staging', type: 'deploy', config: {}, status: 'pending' }
      ],
      status: 'active',
      trigger: 'push',
      created: new Date('2025-01-01'),
      lastRun: new Date(),
      runCount: 42
    },
    {
      id: 'pipeline-2',
      name: 'API Documentation',
      description: 'Automated API docs generation and deployment',
      stages: [
        { id: 'stage-5', name: 'Generate Docs', type: 'build', config: {}, status: 'success', duration: 30 },
        { id: 'stage-6', name: 'Deploy Docs', type: 'deploy', config: {}, status: 'success', duration: 15 }
      ],
      status: 'active',
      trigger: 'schedule',
      created: new Date('2024-12-15'),
      lastRun: new Date(Date.now() - 3600000),
      runCount: 15
    }
  ];

  const createPipelineMutation = useMutation({
    mutationFn: async (pipelineData: any) => {
      return apiRequest('POST', '/api/pipelines', pipelineData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pipelines'] });
      setShowForm(false);
      setNewPipeline({ name: '', description: '', trigger: 'manual' });
      setSelectedTemplate('');
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'running': return <Clock className="h-4 w-4 animate-spin" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleCreateFromTemplate = (templateId: string) => {
    const template = prebuiltTemplates.find(t => t.id === templateId);
    if (template) {
      setNewPipeline({
        name: template.name,
        description: template.description,
        trigger: 'manual'
      });
      setSelectedTemplate(templateId);
      setShowForm(true);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <GitBranch className="h-8 w-8 text-emerald-600" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  AI-Driven Pipelines
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Pre-built stages for SaaS development workflows with intelligent automation
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                Automated CI/CD
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                Multi-Stage
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
                SaaS Ready
              </Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button variant="outline" className="bg-white shadow-md border-slate-200">
              <Settings className="w-4 h-4 mr-2" />
              Templates
            </Button>
            <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Pipeline
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pipeline Name</Label>
                  <Input 
                    value={newPipeline.name}
                    onChange={(e) => setNewPipeline({...newPipeline, name: e.target.value})}
                    placeholder="My SaaS Pipeline"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trigger Type</Label>
                  <Select value={newPipeline.trigger} onValueChange={(value: any) => setNewPipeline({...newPipeline, trigger: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="push">Git Push</SelectItem>
                      <SelectItem value="schedule">Scheduled</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={newPipeline.description}
                  onChange={(e) => setNewPipeline({...newPipeline, description: e.target.value})}
                  placeholder="Describe your pipeline..."
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => createPipelineMutation.mutate({...newPipeline, templateId: selectedTemplate})}
                  disabled={createPipelineMutation.isPending}
                >
                  Create Pipeline
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Active Pipelines</h2>
            <div className="space-y-4">
              {pipelines.map((pipeline) => (
                <Card key={pipeline.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <GitBranch className="h-5 w-5" />
                          {pipeline.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{pipeline.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={pipeline.status === 'active' ? 'default' : 'secondary'}>
                          {pipeline.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Play className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{pipeline.runCount}</div>
                        <div className="text-xs text-gray-500">Total Runs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{pipeline.stages.filter(s => s.status === 'success').length}</div>
                        <div className="text-xs text-gray-500">Successful</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{pipeline.stages.filter(s => s.status === 'running').length}</div>
                        <div className="text-xs text-gray-500">Running</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">{pipeline.stages.filter(s => s.status === 'pending').length}</div>
                        <div className="text-xs text-gray-500">Pending</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Pipeline Stages</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {pipeline.stages.map((stage) => (
                          <div key={stage.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(stage.status)}
                              <span className="text-sm font-medium">{stage.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(stage.status)} variant="secondary">
                                {stage.status}
                              </Badge>
                              {stage.duration && (
                                <span className="text-xs text-gray-500">{stage.duration}s</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Pre-built Templates</h2>
            <div className="space-y-3">
              {prebuiltTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="text-xs text-gray-500 mb-3">
                      {template.stages.length} stages
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleCreateFromTemplate(template.id)}
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}