import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Globe, 
  Plus, 
  Settings, 
  ExternalLink, 
  Copy, 
  Check,
  AlertTriangle,
  Users,
  Lock,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Server
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface SecuritySubdomainConfig {
  id: string;
  subdomain: string;
  customDomain?: string;
  organizationName: string;
  organizationId: string;
  tenantId: string;
  isActive: boolean;
  settings: {
    brandingColor: string;
    logoUrl?: string;
    allowedDomains: string[];
    securityLevel: 'basic' | 'standard' | 'premium' | 'enterprise';
    features: {
      behavioralAnalytics: boolean;
      threatIntelligence: boolean;
      complianceReporting: boolean;
      realTimeMonitoring: boolean;
      incidentResponse: boolean;
      userTraining: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

const SecuritySubdomainsPage = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedSubdomain, setSelectedSubdomain] = useState<SecuritySubdomainConfig | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all security subdomains
  const { data: subdomainsData, isLoading } = useQuery({
    queryKey: ['/api/security/subdomains'],
    queryFn: async () => {
      return await apiRequest('GET', '/api/security/subdomains', undefined, {
        'x-auth-email': 'abel@argilette.com',
        'authorization': 'Bearer demo-token'
      });
    }
  });

  // Create subdomain mutation
  const createSubdomain = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/security/subdomains', data, {
        'x-auth-email': 'abel@argilette.com',
        'authorization': 'Bearer demo-token'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/security/subdomains'] });
      setCreateDialogOpen(false);
      toast({
        title: "Security Subdomain Created",
        description: "Your security subdomain has been created successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create security subdomain",
        variant: "destructive"
      });
    }
  });

  // Delete subdomain mutation
  const deleteSubdomain = useMutation({
    mutationFn: async (subdomain: string) => {
      return await apiRequest('DELETE', `/api/security/subdomains/${subdomain}`, undefined, {
        'x-auth-email': 'abel@argilette.com',
        'authorization': 'Bearer demo-token'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/security/subdomains'] });
      toast({
        title: "Subdomain Deleted",
        description: "Security subdomain has been deleted successfully."
      });
    }
  });

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast({
      title: "Copied!",
      description: "Security URL copied to clipboard"
    });
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'basic': return 'bg-gray-100 text-gray-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSecurityUrl = (config: SecuritySubdomainConfig) => {
    return config.customDomain 
      ? `https://${config.customDomain}`
      : `https://${config.subdomain}.argilette-security.com`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Security Subdomains</h1>
            <p className="text-gray-600">Manage security monitoring subdomains</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const subdomains = subdomainsData?.subdomains || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Security Subdomains
          </h1>
          <p className="text-gray-600">Manage security monitoring subdomains for organizations</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Security Subdomain
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Security Subdomain</DialogTitle>
              <DialogDescription>
                Set up a dedicated security monitoring subdomain for an organization
              </DialogDescription>
            </DialogHeader>
            <CreateSubdomainForm 
              onSubmit={createSubdomain.mutate}
              isLoading={createSubdomain.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Security Subdomains Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subdomains.map((config: SecuritySubdomainConfig) => (
          <Card key={config.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{config.organizationName}</CardTitle>
                </div>
                <Badge 
                  variant={config.isActive ? "default" : "secondary"}
                  className={config.isActive ? 'bg-green-100 text-green-800' : ''}
                >
                  {config.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardDescription className="font-mono text-sm">
                {config.subdomain}.argilette-security.com
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Security URL */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Security URL</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={getSecurityUrl(config)}
                    readOnly
                    className="text-sm font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyUrl(getSecurityUrl(config))}
                  >
                    {copiedUrl === getSecurityUrl(config) ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(getSecurityUrl(config), '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Security Level */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Security Level</span>
                <Badge className={getSecurityLevelColor(config.settings.securityLevel)}>
                  {config.settings.securityLevel.charAt(0).toUpperCase() + config.settings.securityLevel.slice(1)}
                </Badge>
              </div>

              {/* Features Summary */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Active Features</Label>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(config.settings.features)
                    .filter(([_, enabled]) => enabled)
                    .map(([feature, _]) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Badge>
                    ))
                  }
                </div>
              </div>

              {/* Allowed Domains */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Allowed Domains</Label>
                <div className="text-sm text-gray-600">
                  {config.settings.allowedDomains.length > 0 
                    ? config.settings.allowedDomains.join(', ')
                    : 'No domain restrictions'
                  }
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedSubdomain(config)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(getSecurityUrl(config), '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteSubdomain.mutate(config.subdomain)}
                  disabled={deleteSubdomain.isPending}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {subdomains.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Security Subdomains</h3>
              <p className="text-gray-600 text-center mb-4">
                Create your first security subdomain to start monitoring organizations
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Security Subdomain
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Subdomain Details Dialog */}
      {selectedSubdomain && (
        <SubdomainDetailsDialog 
          config={selectedSubdomain}
          onClose={() => setSelectedSubdomain(null)}
        />
      )}
    </div>
  );
};

// Create Subdomain Form Component
const CreateSubdomainForm = ({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) => {
  const [formData, setFormData] = useState({
    subdomain: '',
    customDomain: '',
    organizationName: '',
    organizationId: '',
    allowedDomains: '',
    securityLevel: 'standard' as 'basic' | 'standard' | 'premium' | 'enterprise',
    brandingColor: '#3b82f6',
    features: {
      behavioralAnalytics: true,
      threatIntelligence: true,
      complianceReporting: false,
      realTimeMonitoring: true,
      incidentResponse: false,
      userTraining: false
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      settings: {
        brandingColor: formData.brandingColor,
        allowedDomains: formData.allowedDomains.split(',').map(d => d.trim()).filter(d => d),
        securityLevel: formData.securityLevel,
        features: formData.features
      }
    };
    
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="organizationName">Organization Name</Label>
          <Input
            id="organizationName"
            value={formData.organizationName}
            onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="subdomain">Subdomain</Label>
          <Input
            id="subdomain"
            value={formData.subdomain}
            onChange={(e) => setFormData(prev => ({ ...prev, subdomain: e.target.value }))}
            placeholder="company-security"
            required
          />
          <p className="text-xs text-gray-600 mt-1">Will create: {formData.subdomain}.argilette-security.com</p>
        </div>
      </div>

      <div>
        <Label htmlFor="customDomain">Custom Domain (Optional)</Label>
        <Input
          id="customDomain"
          value={formData.customDomain}
          onChange={(e) => setFormData(prev => ({ ...prev, customDomain: e.target.value }))}
          placeholder="security.yourcompany.com"
        />
      </div>

      <div>
        <Label htmlFor="organizationId">Organization ID</Label>
        <Input
          id="organizationId"
          value={formData.organizationId}
          onChange={(e) => setFormData(prev => ({ ...prev, organizationId: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="allowedDomains">Allowed Domains (comma-separated)</Label>
        <Input
          id="allowedDomains"
          value={formData.allowedDomains}
          onChange={(e) => setFormData(prev => ({ ...prev, allowedDomains: e.target.value }))}
          placeholder="company.com, *.company.com"
        />
      </div>

      <div>
        <Label htmlFor="securityLevel">Security Level</Label>
        <Select 
          value={formData.securityLevel} 
          onValueChange={(value: any) => setFormData(prev => ({ ...prev, securityLevel: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">Basic - Essential monitoring</SelectItem>
            <SelectItem value="standard">Standard - Advanced analytics</SelectItem>
            <SelectItem value="premium">Premium - Full threat intelligence</SelectItem>
            <SelectItem value="enterprise">Enterprise - Complete security suite</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Security Features</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {Object.entries(formData.features).map(([feature, enabled]) => (
            <div key={feature} className="flex items-center space-x-2">
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({
                    ...prev,
                    features: { ...prev.features, [feature]: checked }
                  }))
                }
              />
              <Label className="text-sm">
                {feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Security Subdomain'}
        </Button>
      </div>
    </form>
  );
};

// Subdomain Details Dialog Component
const SubdomainDetailsDialog = ({ 
  config, 
  onClose 
}: { 
  config: SecuritySubdomainConfig; 
  onClose: () => void;
}) => {
  return (
    <Dialog open={!!config} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {config.organizationName} - Security Configuration
          </DialogTitle>
          <DialogDescription>
            Security subdomain details and configuration
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="access">Access Control</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Organization Name</Label>
                <Input value={config.organizationName} readOnly />
              </div>
              <div>
                <Label>Subdomain</Label>
                <Input value={config.subdomain} readOnly />
              </div>
              <div>
                <Label>Security Level</Label>
                <Badge className={`w-fit ${getSecurityLevelColor(config.settings.securityLevel)}`}>
                  {config.settings.securityLevel.toUpperCase()}
                </Badge>
              </div>
              <div>
                <Label>Status</Label>
                <Badge variant={config.isActive ? "default" : "secondary"}>
                  {config.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="features" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(config.settings.features).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center justify-between p-3 border rounded">
                  <span>{feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                  <Badge variant={enabled ? "default" : "secondary"}>
                    {enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="access" className="space-y-4">
            <div>
              <Label>Allowed Domains</Label>
              <div className="mt-2 space-y-2">
                {config.settings.allowedDomains.map((domain, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="font-mono text-sm">{domain}</span>
                  </div>
                ))}
                {config.settings.allowedDomains.length === 0 && (
                  <p className="text-gray-500 text-sm">No domain restrictions</p>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="monitoring" className="space-y-4">
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Security monitoring dashboard would appear here</p>
              <Button 
                className="mt-4"
                onClick={() => window.open(`https://${config.subdomain}.argilette-security.com`, '_blank')}
              >
                Open Security Dashboard
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const getSecurityLevelColor = (level: string) => {
  switch (level) {
    case 'basic': return 'bg-gray-100 text-gray-800';
    case 'standard': return 'bg-blue-100 text-blue-800';
    case 'premium': return 'bg-purple-100 text-purple-800';
    case 'enterprise': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default SecuritySubdomainsPage;