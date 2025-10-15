// Offline Demo Component - Shows offline capabilities in action
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useOffline } from '@/hooks/useOffline';
import { OfflineContacts } from '@/components/offline-contacts';
import { OfflineStatus } from '@/components/offline-status';
import { 
  Wifi, 
  WifiOff, 
  Database,
  Smartphone,
  CheckCircle,
  Download,
  Monitor,
  Globe,
  Shield
} from 'lucide-react';

export function OfflineDemo() {
  const { status } = useOffline();
  const { toast } = useToast();
  const [simulateOffline, setSimulateOffline] = useState(false);

  // Demo offline simulation
  const toggleOfflineSimulation = () => {
    setSimulateOffline(!simulateOffline);
    toast({
      title: simulateOffline ? "Online Mode" : "Offline Mode",
      description: simulateOffline ? "Simulating online connection" : "Simulating offline mode",
      variant: "default",
    });
  };

  return (
    <div className="space-y-6">
      {/* Demo Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Globe className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">NODE CRM Offline Demo</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Experience our comprehensive offline capabilities. Work without internet and sync when back online.
        </p>
      </div>

      {/* Key Features */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-medium mb-1">Offline Storage</h3>
            <p className="text-sm text-gray-600">IndexedDB with tenant isolation</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-4">
            <Smartphone className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-medium mb-1">PWA Ready</h3>
            <p className="text-sm text-gray-600">Install as mobile app</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-4">
            <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-medium mb-1">Auto Sync</h3>
            <p className="text-sm text-gray-600">Background synchronization</p>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-4">
            <Shield className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <h3 className="font-medium mb-1">Secure</h3>
            <p className="text-sm text-gray-600">Enterprise-grade security</p>
          </CardContent>
        </Card>
      </div>

      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Controls</CardTitle>
          <CardDescription>Test offline functionality and see how it works</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Connection Status</h4>
              <p className="text-sm text-gray-600">
                {status.isOnline ? "Currently online" : "Currently offline"}
              </p>
            </div>
            <Badge variant={status.isOnline ? "default" : "destructive"} className="flex items-center space-x-1">
              {status.isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{status.isOnline ? "Online" : "Offline"}</span>
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Simulate Offline Mode</h4>
              <p className="text-sm text-gray-600">
                Test offline features without disconnecting
              </p>
            </div>
            <Button 
              onClick={toggleOfflineSimulation}
              variant={simulateOffline ? "default" : "outline"}
            >
              {simulateOffline ? (
                <>
                  <Monitor className="w-4 h-4 mr-2" />
                  Stop Simulation
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 mr-2" />
                  Simulate Offline
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Demo Tabs */}
      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">Offline Status</TabsTrigger>
          <TabsTrigger value="contacts">Contacts Demo</TabsTrigger>
          <TabsTrigger value="features">All Features</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <OfflineStatus />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Offline Contacts Management</CardTitle>
              <CardDescription>
                Create, edit, and manage contacts without internet connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OfflineContacts />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Offline Capabilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Create and edit contacts offline</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Manage leads and deals without internet</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Task creation and completion offline</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Appointment scheduling offline</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Search and filter data offline</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sync Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Automatic sync when back online</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Background sync without user interaction</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Conflict resolution for simultaneous edits</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Progress tracking for sync operations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Push notifications for sync status</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-red-600" />
                  <span className="text-sm">Tenant-isolated offline storage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-red-600" />
                  <span className="text-sm">Encrypted offline data storage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-red-600" />
                  <span className="text-sm">Secure sync with authentication</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-red-600" />
                  <span className="text-sm">Data cleanup on logout</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-red-600" />
                  <span className="text-sm">Cross-tenant access prevention</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>PWA Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Install as mobile/desktop app</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Offline-first loading strategy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Service worker background processing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">App shortcuts for quick actions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">Responsive design for all devices</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started with Offline Mode</CardTitle>
          <CardDescription>Follow these steps to enable offline capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium mb-2">1. Download Data</h3>
              <p className="text-sm text-gray-600">
                Click "Download for Offline" to cache your data locally
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Smartphone className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-medium mb-2">2. Install PWA</h3>
              <p className="text-sm text-gray-600">
                Install as an app for the best offline experience
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <WifiOff className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-medium mb-2">3. Work Offline</h3>
              <p className="text-sm text-gray-600">
                Use all CRM features without an internet connection
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}