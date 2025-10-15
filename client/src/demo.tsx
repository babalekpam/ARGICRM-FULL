import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GitBranch, 
  Terminal, 
  Moon, 
  Sun, 
  Monitor, 
  Code, 
  Play,
  Zap,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  Star
} from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import { useTheme } from "@/components/theme-provider";

function ThemeToggleDemo() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={theme === "light" ? "default" : "outline"}
        size="sm"
        onClick={() => setTheme("light")}
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === "dark" ? "default" : "outline"}
        size="sm"
        onClick={() => setTheme("dark")}
      >
        <Moon className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === "system" ? "default" : "outline"}
        size="sm"
        onClick={() => setTheme("system")}
      >
        <Monitor className="h-4 w-4" />
      </Button>
    </div>
  );
}

function PipelinesDemo() {
  const [selectedPipeline, setSelectedPipeline] = useState("saas-full");
  
  const pipelines = [
    {
      id: "saas-full",
      name: "Full SaaS Deployment",
      status: "active",
      stages: [
        { name: "Code Quality", type: "test", status: "success" },
        { name: "Unit Tests", type: "test", status: "success" },
        { name: "Build App", type: "build", status: "running" },
        { name: "Integration Tests", type: "test", status: "pending" },
        { name: "Deploy Staging", type: "deploy", status: "pending" },
        { name: "Deploy Production", type: "deploy", status: "pending" }
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "running": return <Clock className="h-4 w-4 text-blue-500" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <GitBranch className="h-5 w-5" />
          <span>Automated Pipelines</span>
          <Badge variant="secondary">NEW</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pipelines.map(pipeline => (
            <div key={pipeline.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{pipeline.name}</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{pipeline.status}</Badge>
                  <Button size="sm">
                    <Play className="h-4 w-4 mr-1" />
                    Run
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {pipeline.stages.map((stage, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                    {getStatusIcon(stage.status)}
                    <span className="text-sm">{stage.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ApiExplorerDemo() {
  const [selectedEndpoint, setSelectedEndpoint] = useState("/api/contacts");
  const [method, setMethod] = useState("GET");
  
  const endpoints = [
    { method: "GET", path: "/api/contacts", description: "Get all contacts" },
    { method: "POST", path: "/api/contacts", description: "Create new contact" },
    { method: "GET", path: "/api/leads", description: "Get all leads" },
    { method: "POST", path: "/api/leads", description: "Create new lead" }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Terminal className="h-5 w-5" />
          <span>Real-Time API Explorer</span>
          <Badge variant="secondary">NEW</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <select 
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
            <input 
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              className="flex-1 px-3 py-1 border rounded text-sm"
            />
            <Button size="sm">
              <Send className="h-4 w-4 mr-1" />
              Send
            </Button>
            <Button size="sm" variant="outline">
              <Star className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Available Endpoints</h4>
              <div className="space-y-1">
                {endpoints.map((endpoint, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => {
                      setSelectedEndpoint(endpoint.path);
                      setMethod(endpoint.method);
                    }}
                  >
                    <Badge variant="outline" className="text-xs">{endpoint.method}</Badge>
                    <span className="text-sm">{endpoint.path}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Response</h4>
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                <div>Status: 200 OK</div>
                <div>Response Time: 45ms</div>
                <div className="mt-2">
                  {`{
  "data": [...],
  "count": 19,
  "status": "success"
}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeaturesDemo() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b">
        <div className="flex h-14 items-center px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-primary" />
              <span className="font-bold">ARGILETTE CRM</span>
            </div>
          </div>
          
          <div className="ml-auto flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Theme</span>
            </div>
            <ThemeToggleDemo />
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Enterprise CRM Integration Suite</h1>
          <p className="text-muted-foreground">Three Major Features Successfully Implemented</p>
        </div>

        <Tabs defaultValue="pipelines" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pipelines">Automated Pipelines</TabsTrigger>
            <TabsTrigger value="api-explorer">API Explorer</TabsTrigger>
            <TabsTrigger value="dark-mode">Dark Mode</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pipelines">
            <PipelinesDemo />
          </TabsContent>
          
          <TabsContent value="api-explorer">
            <ApiExplorerDemo />
          </TabsContent>
          
          <TabsContent value="dark-mode">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Moon className="h-5 w-5" />
                  <span>Comprehensive Dark Mode</span>
                  <Badge variant="secondary">NEW</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Complete theme switching system with CSS variables and enhanced styling
                  </p>
                  
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold">Choose Theme:</span>
                    <ThemeToggleDemo />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Light Mode</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Clean, bright interface for daytime use</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Dark Mode</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Easy on the eyes for low-light environments</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">System Mode</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Automatically follows your system preference</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function Demo() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="argilette-demo-theme">
      <FeaturesDemo />
    </ThemeProvider>
  );
}