import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Settings, Lock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout';

interface FeatureToggle {
  id: number;
  tenantId: string;
  name: string;
  description: string;
  category: string;
  feature: string;
  enabled: boolean;
  configuration: any;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface AccessControlRule {
  id: number;
  tenantId: string;
  name: string;
  description: string;
  ruleType: string;
  conditions: any;
  actions: any;
  priority: number;
  enabled: boolean;
  lastTriggered: string | null;
  triggerCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function SecurityDashboard() {
  const { toast } = useToast();

  // Fetch feature toggles
  const { data: togglesData, isLoading: togglesLoading } = useQuery({
    queryKey: ['/api/security/feature-toggles'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/security/feature-toggles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.json();
    }
  });

  // Fetch access control rules
  const { data: rulesData, isLoading: rulesLoading } = useQuery({
    queryKey: ['/api/security/access-control/rules'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/security/access-control/rules', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.json();
    }
  });

  // Fetch health status
  const { data: healthData } = useQuery({
    queryKey: ['/api/security/health'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/security/health', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.json();
    }
  });

  const toggles = togglesData?.toggles || [];
  const rules = rulesData?.rules || [];
  const health = healthData?.health || {};

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'authentication': return 'bg-blue-100 text-blue-800';
      case 'authorization': return 'bg-purple-100 text-purple-800';
      case 'audit': return 'bg-green-100 text-green-800';
      case 'encryption': return 'bg-red-100 text-red-800';
      case 'compliance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRuleTypeColor = (ruleType: string) => {
    switch (ruleType) {
      case 'access_control': return 'bg-purple-100 text-purple-800';
      case 'rate_limit': return 'bg-orange-100 text-orange-800';
      case 'ip_whitelist': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
        </div>

        {/* Security Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Feature Toggles</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{toggles.length}</div>
              <p className="text-xs text-muted-foreground">
                {toggles.filter((t: FeatureToggle) => t.enabled).length} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Access Rules</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rules.length}</div>
              <p className="text-xs text-muted-foreground">
                {rules.filter((r: AccessControlRule) => r.enabled).length} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Security Score</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {health?.securityScore || 85}%
              </div>
              <p className="text-xs text-muted-foreground">Good</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No threats detected</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="toggles" className="space-y-6">
          <TabsList>
            <TabsTrigger value="toggles">Feature Toggles</TabsTrigger>
            <TabsTrigger value="rules">Access Control Rules</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="toggles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Feature Toggles</CardTitle>
                <CardDescription>
                  Manage security features and their configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {togglesLoading ? (
                  <div>Loading toggles...</div>
                ) : toggles.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No feature toggles</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating your first toggle.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {toggles.map((toggle: FeatureToggle) => (
                      <Card key={toggle.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{toggle.name}</h3>
                              <Badge className={getCategoryColor(toggle.category)}>
                                {toggle.category}
                              </Badge>
                            </div>
                            <Switch
                              checked={toggle.enabled}
                              onCheckedChange={(checked) => {
                                toast({
                                  title: "Feature toggle updated",
                                  description: `${toggle.name} is now ${checked ? 'enabled' : 'disabled'}`
                                });
                              }}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">{toggle.description}</p>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Created:</span> {formatDate(toggle.createdAt)}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Updated:</span> {formatDate(toggle.updatedAt)}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Category:</span> {toggle.category}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Modified by:</span> {toggle.lastModifiedBy}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Access Control Rules</CardTitle>
                <CardDescription>
                  Security rules that control access to resources and actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rulesLoading ? (
                  <div>Loading rules...</div>
                ) : rules.length === 0 ? (
                  <div className="text-center py-8">
                    <Lock className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No access control rules</h3>
                    <p className="mt-1 text-sm text-gray-500">Create your first rule to manage permissions.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {rules.map((rule: AccessControlRule) => (
                      <Card key={rule.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{rule.name}</h3>
                              <Badge className={getRuleTypeColor(rule.ruleType)}>
                                {rule.ruleType}
                              </Badge>
                              <Badge variant={rule.enabled ? "default" : "secondary"}>
                                {rule.enabled ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Priority: {rule.priority}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Created:</span> {formatDate(rule.createdAt)}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Updated:</span> {formatDate(rule.updatedAt)}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Created by:</span> {rule.createdBy}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Trigger count:</span> {rule.triggerCount}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>
                  Security-related events and configuration changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No audit logs</h3>
                  <p className="mt-1 text-sm text-gray-500">Security events will appear here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}