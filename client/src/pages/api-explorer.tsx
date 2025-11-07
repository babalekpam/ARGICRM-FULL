import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Star, Clock, Copy, Download, Plus, X } from "lucide-react";
import Layout from "@/components/layout";

interface ApiCall {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: Record<string, string>;
  body?: string;
  description: string;
  isFavorite: boolean;
  lastUsed: Date;
  responseTime?: number;
  statusCode?: number;
}

const apiEndpoints = [
  { method: 'GET', path: '/api/contacts', description: 'Get all contacts' },
  { method: 'POST', path: '/api/contacts', description: 'Create new contact' },
  { method: 'GET', path: '/api/contacts/:id', description: 'Get contact by ID' },
  { method: 'PUT', path: '/api/contacts/:id', description: 'Update contact' },
  { method: 'DELETE', path: '/api/contacts/:id', description: 'Delete contact' },
  { method: 'GET', path: '/api/leads', description: 'Get all leads' },
  { method: 'POST', path: '/api/leads', description: 'Create new lead' },
  { method: 'GET', path: '/api/deals', description: 'Get all deals' },
  { method: 'POST', path: '/api/deals', description: 'Create new deal' },
  { method: 'GET', path: '/api/accounts', description: 'Get all accounts' },
  { method: 'POST', path: '/api/accounts', description: 'Create new account' },
  { method: 'GET', path: '/api/tasks', description: 'Get all tasks' },
  { method: 'POST', path: '/api/tasks', description: 'Create new task' },
  { method: 'GET', path: '/api/employees', description: 'Get all employees' },
  { method: 'POST', path: '/api/employees', description: 'Create new employee' }
];

export default function ApiExplorerPage() {
  const [selectedMethod, setSelectedMethod] = useState<string>('GET');
  const [url, setUrl] = useState<string>('/api/contacts');
  const [requestBody, setRequestBody] = useState<string>('');
  const [headers, setHeaders] = useState<Record<string, string>>({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer demo-token'
  });
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [favorites, setFavorites] = useState<ApiCall[]>([]);
  const [history, setHistory] = useState<ApiCall[]>([]);
  const [newHeaderKey, setNewHeaderKey] = useState('');
  const [newHeaderValue, setNewHeaderValue] = useState('');

  const baseUrl = window.location.origin;

  const methodColors = {
    GET: 'bg-green-100 text-green-800',
    POST: 'bg-blue-100 text-blue-800',
    PUT: 'bg-orange-100 text-orange-800',
    DELETE: 'bg-red-100 text-red-800',
    PATCH: 'bg-purple-100 text-purple-800'
  };

  const executeRequest = async () => {
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      const requestOptions: RequestInit = {
        method: selectedMethod,
        headers: headers
      };

      if (selectedMethod !== 'GET' && requestBody) {
        requestOptions.body = requestBody;
      }

      const fullUrl = `${baseUrl}${url}`;
      const response = await fetch(fullUrl, requestOptions);
      const responseData = await response.json();
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const result = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        responseTime: responseTime
      };

      setResponse(result);

      // Add to history
      const apiCall: ApiCall = {
        id: Date.now().toString(),
        name: `${selectedMethod} ${url}`,
        method: selectedMethod as any,
        url: url,
        headers: headers,
        body: requestBody || undefined,
        description: `${selectedMethod} request to ${url}`,
        isFavorite: false,
        lastUsed: new Date(),
        responseTime: responseTime,
        statusCode: response.status
      };

      setHistory(prev => [apiCall, ...prev.slice(0, 19)]); // Keep last 20

    } catch (error) {
      setResponse({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        responseTime: Date.now() - startTime
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToFavorites = (call: ApiCall) => {
    const favoriteCall = { ...call, isFavorite: true };
    setFavorites(prev => [favoriteCall, ...prev]);
  };

  const loadCall = (call: ApiCall) => {
    setSelectedMethod(call.method);
    setUrl(call.url);
    setHeaders(call.headers);
    setRequestBody(call.body || '');
  };

  const addHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      setHeaders(prev => ({
        ...prev,
        [newHeaderKey]: newHeaderValue
      }));
      setNewHeaderKey('');
      setNewHeaderValue('');
    }
  };

  const removeHeader = (key: string) => {
    setHeaders(prev => {
      const newHeaders = { ...prev };
      delete newHeaders[key];
      return newHeaders;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportCall = (call: ApiCall) => {
    const exportData = {
      name: call.name,
      method: call.method,
      url: call.url,
      headers: call.headers,
      body: call.body
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${call.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Real-Time API Explorer</h1>
            <p className="text-gray-600 mt-1">Try endpoints on the fly, save your favorite calls</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>API Request Builder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="/api/endpoint"
                    className="flex-1"
                  />
                  <Button onClick={executeRequest} disabled={isLoading} className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    {isLoading ? 'Sending...' : 'Send'}
                  </Button>
                </div>

                <Tabs defaultValue="headers" className="w-full">
                  <TabsList>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="body">Body</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="headers" className="space-y-3">
                    <div className="space-y-2">
                      {Object.entries(headers).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <span className="font-mono text-sm flex-1">{key}: {value}</span>
                          <Button size="sm" variant="ghost" onClick={() => removeHeader(key)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Header key"
                        value={newHeaderKey}
                        onChange={(e) => setNewHeaderKey(e.target.value)}
                      />
                      <Input 
                        placeholder="Header value"
                        value={newHeaderValue}
                        onChange={(e) => setNewHeaderValue(e.target.value)}
                      />
                      <Button onClick={addHeader}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="body">
                    <Textarea 
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder='{"key": "value"}'
                      className="h-32 font-mono"
                      disabled={selectedMethod === 'GET'}
                    />
                  </TabsContent>
                </Tabs>

                {response && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">Response</CardTitle>
                      <div className="flex items-center gap-2">
                        {response.status && (
                          <Badge className={response.status < 400 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {response.status} {response.statusText}
                          </Badge>
                        )}
                        {response.responseTime && (
                          <Badge variant="secondary">
                            {response.responseTime}ms
                          </Badge>
                        )}
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <pre className="text-sm bg-gray-50 p-3 rounded overflow-auto">
                          {JSON.stringify(response, null, 2)}
                        </pre>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Available Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {apiEndpoints.map((endpoint, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => {
                          setSelectedMethod(endpoint.method);
                          setUrl(endpoint.path);
                        }}
                      >
                        <div>
                          <Badge className={methodColors[endpoint.method]} variant="secondary">
                            {endpoint.method}
                          </Badge>
                          <div className="text-sm font-mono mt-1">{endpoint.path}</div>
                          <div className="text-xs text-gray-500">{endpoint.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Favorites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  {favorites.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No favorites yet</p>
                  ) : (
                    <div className="space-y-2">
                      {favorites.map((call) => (
                        <div key={call.id} className="p-2 bg-gray-50 rounded">
                          <div className="flex items-center justify-between">
                            <Badge className={methodColors[call.method]} variant="secondary">
                              {call.method}
                            </Badge>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => loadCall(call)}>
                                Load
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => exportCall(call)}>
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm font-mono mt-1">{call.url}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  {history.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No requests yet</p>
                  ) : (
                    <div className="space-y-2">
                      {history.map((call) => (
                        <div key={call.id} className="p-2 bg-gray-50 rounded">
                          <div className="flex items-center justify-between">
                            <Badge className={methodColors[call.method]} variant="secondary">
                              {call.method}
                            </Badge>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => loadCall(call)}>
                                Load
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => addToFavorites(call)}>
                                <Star className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm font-mono mt-1">{call.url}</div>
                          {call.responseTime && (
                            <div className="text-xs text-gray-500 mt-1">
                              {call.responseTime}ms • {call.statusCode}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}