import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { RefreshCw, AlertCircle, CheckCircle, Activity, Settings, TestTube, Trash2 } from 'lucide-react';

interface AIProvider {
  name: string;
  priority: number;
  isAvailable: boolean;
  lastError?: string;
  lastErrorTime?: number;
  requestCount: number;
  successCount: number;
  failureCount: number;
  averageResponseTime: number;
  rateLimit?: {
    requestsPerMinute: number;
    requestsRemaining: number;
    resetTime: number;
  };
}

interface CircuitBreaker {
  isOpen: boolean;
  failures: number;
  lastFailure: number;
}

interface AIFailoverStatus {
  providers: Record<string, AIProvider>;
  circuitBreakers: Record<string, CircuitBreaker>;
  timestamp: string;
}

export default function AIFailoverMonitor() {
  const [testPrompt, setTestPrompt] = useState('Translate "Hello, world!" to Spanish');
  const [testSystemPrompt, setTestSystemPrompt] = useState('You are a helpful translation assistant.');
  const [testResponseFormat, setTestResponseFormat] = useState('text');
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch AI failover status
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/ai-failover/status'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Test AI failover mutation
  const testMutation = useMutation({
    mutationFn: async (params: { prompt: string; systemPrompt?: string; responseFormat?: string }) => {
      const response = await apiRequest('POST', '/api/ai-failover/test', params);
      return response;
    },
    onSuccess: (data) => {
      setTestResult(data);
      toast({
        title: "Test Successful",
        description: `AI request completed with ${data.provider} in ${data.responseTime}ms`,
      });
    },
    onError: (error) => {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset provider mutation
  const resetProviderMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest('POST', `/api/ai-failover/reset/${provider}`, {});
      return response;
    },
    onSuccess: (data, provider) => {
      toast({
        title: "Provider Reset",
        description: `${provider} has been reset successfully`,
      });
      refetchStatus();
    },
    onError: (error) => {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Clear cache mutation
  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/ai-failover/cache', {});
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Cache Cleared",
        description: "AI failover cache has been cleared successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Cache Clear Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTest = () => {
    testMutation.mutate({
      prompt: testPrompt,
      systemPrompt: testSystemPrompt,
      responseFormat: testResponseFormat,
    });
  };

  const handleResetProvider = (provider: string) => {
    resetProviderMutation.mutate(provider);
  };

  const getStatusBadge = (provider: AIProvider, circuitBreaker?: CircuitBreaker) => {
    if (circuitBreaker?.isOpen) {
      return <Badge variant="destructive">Circuit Open</Badge>;
    }
    if (!provider.isAvailable) {
      return <Badge variant="destructive">Unavailable</Badge>;
    }
    return <Badge variant="default">Available</Badge>;
  };

  const getSuccessRate = (provider: AIProvider) => {
    if (provider.requestCount === 0) return 100;
    return Math.round((provider.successCount / provider.requestCount) * 100);
  };

  const formatLastError = (timestamp?: number) => {
    if (!timestamp) return 'None';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Failover Monitor</h1>
          <p className="text-muted-foreground">
            Monitor and manage AI provider failover system
          </p>
        </div>
        <Button
          onClick={() => refetchStatus()}
          disabled={statusLoading}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${statusLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Provider Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {status?.providers && Object.entries(status.providers).map(([key, provider]) => {
          const circuitBreaker = status.circuitBreakers[key];
          return (
            <Card key={key} className="relative">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {provider.name}
                </CardTitle>
                {getStatusBadge(provider, circuitBreaker)}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Priority:</span>
                    <span className="font-semibold">#{provider.priority}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Success Rate:</span>
                    <span className="font-semibold">{getSuccessRate(provider)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Requests:</span>
                    <span className="font-semibold">{provider.requestCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Response:</span>
                    <span className="font-semibold">{Math.round(provider.averageResponseTime)}ms</span>
                  </div>
                  {circuitBreaker?.failures > 0 && (
                    <div className="flex justify-between text-sm text-destructive">
                      <span>Failures:</span>
                      <span className="font-semibold">{circuitBreaker.failures}</span>
                    </div>
                  )}
                  {provider.lastError && (
                    <div className="text-xs text-muted-foreground">
                      <span>Last Error: {formatLastError(provider.lastErrorTime)}</span>
                    </div>
                  )}
                  {circuitBreaker?.isOpen && (
                    <Button
                      size="sm"
                      onClick={() => handleResetProvider(key)}
                      disabled={resetProviderMutation.isPending}
                      className="w-full mt-2"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Reset Provider
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Test Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Test AI Failover
          </CardTitle>
          <CardDescription>
            Test the AI failover system with a custom request
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-prompt">Test Prompt</Label>
              <Textarea
                id="test-prompt"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Enter your test prompt..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="system-prompt">System Prompt (Optional)</Label>
              <Textarea
                id="system-prompt"
                value={testSystemPrompt}
                onChange={(e) => setTestSystemPrompt(e.target.value)}
                placeholder="Enter system prompt..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="response-format">Response Format</Label>
              <Select value={testResponseFormat} onValueChange={setTestResponseFormat}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleTest}
              disabled={testMutation.isPending || !testPrompt.trim()}
              className="mt-7"
            >
              {testMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4 mr-2" />
              )}
              Run Test
            </Button>
          </div>
          
          {testResult && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Test Result:</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Provider:</strong> {testResult.provider}</div>
                <div><strong>Response Time:</strong> {testResult.responseTime}ms</div>
                <div><strong>Confidence:</strong> {(testResult.confidence * 100).toFixed(1)}%</div>
                <div><strong>From Cache:</strong> {testResult.fromCache ? 'Yes' : 'No'}</div>
                <div className="mt-2">
                  <strong>Response:</strong>
                  <pre className="mt-1 p-2 bg-background rounded border text-xs whitespace-pre-wrap">
                    {typeof testResult.content === 'string' 
                      ? testResult.content 
                      : JSON.stringify(testResult.content, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Management Actions
          </CardTitle>
          <CardDescription>
            Manage the AI failover system cache and configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              onClick={() => clearCacheMutation.mutate()}
              disabled={clearCacheMutation.isPending}
              variant="outline"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Information */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date(status.timestamp).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}