import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Key, Plus, Trash2, Eye, EyeOff, Activity, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  permissions: string[];
  rateLimit: number;
  isActive: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  apiKey?: string; // Only present on creation
}

interface ApiUsage {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number | null;
  requestedAt: string;
}

export default function ApiAccess() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(["read"]);
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(1000);
  const [showNewKey, setShowNewKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKey | null>(null);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);

  const { data: apiKeys, isLoading: keysLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/keys"],
  });

  const { data: apiUsage } = useQuery<ApiUsage[]>({
    queryKey: ["/api/keys", selectedKeyId, "usage"],
    queryFn: () => fetch(`/api/keys/${selectedKeyId}/usage`).then(res => res.json()),
    enabled: !!selectedKeyId,
  });

  const createKeyMutation = useMutation({
    mutationFn: (data: { name: string; permissions: string[]; rateLimit: number }) => 
      apiRequest("POST", "/api/keys", data) as Promise<ApiKey>,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      setNewlyCreatedKey(data);
      setShowNewKey(true);
      setCreateDialogOpen(false);
      setNewKeyName("");
      setNewKeyPermissions(["read"]);
      setNewKeyRateLimit(1000);
      toast({
        title: "API key created",
        description: "Your new API key has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest("DELETE", `/api/keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      toast({
        title: "API key deleted",
        description: "The API key has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    },
  });

  const toggleKeyStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: number }) => 
      apiRequest("PATCH", `/api/keys/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/keys"] });
      toast({
        title: "API key updated",
        description: "The API key status has been updated.",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard",
    });
  };

  const handleCreateKey = () => {
    createKeyMutation.mutate({
      name: newKeyName,
      permissions: newKeyPermissions,
      rateLimit: newKeyRateLimit,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">API Access</h1>
          <p className="text-muted-foreground mt-1">
            Manage API keys and monitor usage for programmatic access
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-key">
          <Plus className="h-4 w-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {newlyCreatedKey && showNewKey && (
        <Alert data-testid="alert-new-key">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Your new API key (save this now - it won't be shown again):</p>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm font-mono" data-testid="text-api-key">
                  {newlyCreatedKey.apiKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(newlyCreatedKey.apiKey!)}
                  data-testid="button-copy-key"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewKey(false)}
                  data-testid="button-close-key-alert"
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="keys" className="w-full">
        <TabsList>
          <TabsTrigger value="keys" data-testid="tab-keys">API Keys</TabsTrigger>
          <TabsTrigger value="usage" data-testid="tab-usage">Usage Statistics</TabsTrigger>
          <TabsTrigger value="docs" data-testid="tab-docs">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          {keysLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Loading API keys...</p>
              </CardContent>
            </Card>
          ) : apiKeys && apiKeys.length > 0 ? (
            <div className="grid gap-4">
              {apiKeys.map((key) => (
                <Card key={key.id} data-testid={`card-api-key-${key.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg" data-testid={`text-key-name-${key.id}`}>{key.name}</CardTitle>
                        <CardDescription>
                          <code className="text-xs" data-testid={`text-key-preview-${key.id}`}>{key.keyPreview}</code>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={key.isActive ? "default" : "secondary"} data-testid={`badge-key-status-${key.id}`}>
                          {key.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Permissions:</span>
                        <div className="flex gap-1">
                          {key.permissions.map((perm) => (
                            <Badge key={perm} variant="outline" data-testid={`badge-permission-${perm}-${key.id}`}>
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Rate Limit:</span>
                        <span data-testid={`text-rate-limit-${key.id}`}>{key.rateLimit.toLocaleString()} req/hour</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Used:</span>
                        <span data-testid={`text-last-used-${key.id}`}>
                          {key.lastUsedAt ? format(new Date(key.lastUsedAt), "PPp") : "Never"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Created:</span>
                        <span data-testid={`text-created-${key.id}`}>{format(new Date(key.createdAt), "PPp")}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleKeyStatusMutation.mutate({ id: key.id, isActive: key.isActive ? 0 : 1 })}
                          data-testid={`button-toggle-status-${key.id}`}
                        >
                          {key.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteKeyMutation.mutate(key.id)}
                          data-testid={`button-delete-${key.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <Key className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">No API keys yet</p>
                  <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-key">
                    Create your first API key
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API Usage Statistics</CardTitle>
                  <CardDescription>Monitor your API consumption and performance</CardDescription>
                </div>
                <div className="w-64">
                  <Label htmlFor="key-select" className="mb-2 block text-sm">Select API Key</Label>
                  <Select value={selectedKeyId || undefined} onValueChange={setSelectedKeyId}>
                    <SelectTrigger id="key-select" data-testid="select-usage-key">
                      <SelectValue placeholder="Choose a key..." />
                    </SelectTrigger>
                    <SelectContent>
                      {apiKeys?.map((key) => (
                        <SelectItem key={key.id} value={key.id} data-testid={`select-key-${key.id}`}>
                          {key.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedKeyId ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Select an API key to view its usage statistics</p>
                </div>
              ) : apiUsage && apiUsage.length > 0 ? (
                <div className="space-y-2">
                  {apiUsage.slice(0, 20).map((usage) => (
                    <div key={usage.id} className="flex items-center justify-between p-3 border rounded-lg" data-testid={`usage-log-${usage.id}`}>
                      <div className="flex items-center gap-3">
                        <Badge variant={usage.statusCode < 400 ? "default" : "destructive"} data-testid={`badge-status-${usage.id}`}>
                          {usage.statusCode}
                        </Badge>
                        <span className="font-mono text-sm" data-testid={`text-method-${usage.id}`}>{usage.method}</span>
                        <span className="text-sm text-muted-foreground" data-testid={`text-endpoint-${usage.id}`}>{usage.endpoint}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span data-testid={`text-response-time-${usage.id}`}>{usage.responseTime}ms</span>
                        <span data-testid={`text-timestamp-${usage.id}`}>{format(new Date(usage.requestedAt), "PPp")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No API usage data for this key yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>Learn how to integrate ARGILETTE into your applications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Authentication</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Include your API key in the request headers:
                </p>
                <pre className="p-4 bg-muted rounded-lg text-sm">
                  <code>Authorization: Bearer YOUR_API_KEY</code>
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Base URL</h3>
                <pre className="p-4 bg-muted rounded-lg text-sm">
                  <code>{window.location.origin}/api</code>
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Available Endpoints</h3>
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>GET</Badge>
                      <code className="text-sm">/api/projects</code>
                    </div>
                    <p className="text-sm text-muted-foreground">Get all projects</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>GET</Badge>
                      <code className="text-sm">/api/keywords</code>
                    </div>
                    <p className="text-sm text-muted-foreground">Get keywords for a project</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>GET</Badge>
                      <code className="text-sm">/api/backlinks</code>
                    </div>
                    <p className="text-sm text-muted-foreground">Get backlinks data</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>GET</Badge>
                      <code className="text-sm">/api/seo-issues</code>
                    </div>
                    <p className="text-sm text-muted-foreground">Get SEO issues</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Example Request</h3>
                <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                  <code>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  ${window.location.origin}/api/projects`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent data-testid="dialog-create-key">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for programmatic access to your SEO data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Key Name</Label>
              <Input
                id="key-name"
                placeholder="e.g., Production API Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                data-testid="input-key-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="permissions">Permissions</Label>
              <Select
                value={newKeyPermissions.join(",")}
                onValueChange={(value) => setNewKeyPermissions(value.split(","))}
              >
                <SelectTrigger data-testid="select-permissions">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Read Only</SelectItem>
                  <SelectItem value="read,write">Read & Write</SelectItem>
                  <SelectItem value="read,write,delete">Full Access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate-limit">Rate Limit (requests/hour)</Label>
              <Input
                id="rate-limit"
                type="number"
                value={newKeyRateLimit}
                onChange={(e) => setNewKeyRateLimit(parseInt(e.target.value))}
                data-testid="input-rate-limit"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleCreateKey}
              disabled={!newKeyName || createKeyMutation.isPending}
              data-testid="button-submit-create"
            >
              {createKeyMutation.isPending ? "Creating..." : "Create Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
