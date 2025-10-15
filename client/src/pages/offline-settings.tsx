// Comprehensive offline settings and management page
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useOffline } from '@/hooks/useOffline';
import { pwaSetup } from '@/lib/pwa-setup';
import { 
  Settings,
  Wifi, 
  WifiOff, 
  Download, 
  Upload, 
  RefreshCw, 
  Database,
  CheckCircle,
  AlertCircle,
  Clock,
  HardDrive,
  Shield,
  Smartphone,
  Cloud,
  Trash2,
  Bell,
  Lock
} from 'lucide-react';

export default function OfflineSettingsPage() {
  const { status, downloadForOffline, syncOfflineChanges, clearOfflineData } = useOffline();
  const { toast } = useToast();
  
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);
  const [autoDownload, setAutoDownload] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  useEffect(() => {
    checkPWAStatus();
    checkStorageUsage();
    checkNotificationStatus();
  }, []);

  const checkPWAStatus = () => {
    setIsPWAInstalled(pwaSetup.isPWAInstalled());
  };

  const checkStorageUsage = async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        setStorageUsed(quota > 0 ? (used / quota) * 100 : 0);
      } catch (error) {
        console.error('Failed to get storage estimate:', error);
      }
    }
  };

  const checkNotificationStatus = () => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  };

  const handleDownloadForOffline = async () => {
    setDownloadProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    const success = await downloadForOffline();
    clearInterval(progressInterval);
    setDownloadProgress(100);
    
    setTimeout(() => setDownloadProgress(0), 2000);
    
    if (success) {
      toast({
        title: "Offline Download Complete",
        description: "All your data is now available offline",
        variant: "default",
      });
    }
  };

  const handleSyncChanges = async () => {
    setSyncProgress(0);
    
    const progressInterval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 15;
      });
    }, 100);

    const result = await syncOfflineChanges();
    clearInterval(progressInterval);
    setSyncProgress(100);
    
    setTimeout(() => setSyncProgress(0), 2000);
    
    if (result.success > 0) {
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${result.success} changes`,
        variant: "default",
      });
    }
  };

  const handleClearOfflineData = async () => {
    await clearOfflineData();
    checkStorageUsage();
    toast({
      title: "Offline Data Cleared",
      description: "All offline data has been removed",
      variant: "default",
    });
  };

  const handleInstallPWA = async () => {
    const installed = await pwaSetup.installPWA();
    if (installed) {
      setIsPWAInstalled(true);
      toast({
        title: "App Installed",
        description: "NODE CRM has been installed as a Progressive Web App",
        variant: "default",
      });
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await pwaSetup.requestNotificationPermission();
    setNotificationsEnabled(granted);
    if (granted) {
      toast({
        title: "Notifications Enabled",
        description: "You'll receive offline sync notifications",
        variant: "default",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Settings className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offline Settings</h1>
          <p className="text-gray-600">Manage your offline capabilities and data synchronization</p>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {status.isOnline ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600" />
            )}
            <span>Connection Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                {status.isOnline ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">Internet</span>
              </div>
              <Badge variant={status.isOnline ? "default" : "destructive"}>
                {status.isOnline ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Offline Data</span>
              </div>
              <Badge variant={status.hasOfflineData ? "default" : "secondary"}>
                {status.hasOfflineData ? "Available" : "Not Available"}
              </Badge>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="font-medium">Pending Sync</span>
              </div>
              <Badge variant={status.pendingChanges > 0 ? "outline" : "secondary"}>
                {status.pendingChanges} changes
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download & Sync Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Download for Offline</span>
            </CardTitle>
            <CardDescription>
              Download your data to work without internet connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {downloadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Downloading...</span>
                  <span>{downloadProgress}%</span>
                </div>
                <Progress value={downloadProgress} />
              </div>
            )}
            
            <Button 
              onClick={handleDownloadForOffline}
              disabled={!status.isOnline || downloadProgress > 0}
              className="w-full"
            >
              {downloadProgress > 0 ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {status.hasOfflineData ? "Update Offline Data" : "Download for Offline"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Sync Changes</span>
            </CardTitle>
            <CardDescription>
              Upload your offline changes to the server
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {syncProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Syncing...</span>
                  <span>{syncProgress}%</span>
                </div>
                <Progress value={syncProgress} />
              </div>
            )}
            
            <Button 
              onClick={handleSyncChanges}
              disabled={!status.isOnline || status.pendingChanges === 0 || syncProgress > 0}
              className="w-full"
            >
              {syncProgress > 0 ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Sync {status.pendingChanges} Changes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* PWA Installation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5" />
            <span>Progressive Web App</span>
          </CardTitle>
          <CardDescription>
            Install NODE CRM as a mobile app for better offline experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">PWA Status</h4>
              <p className="text-sm text-gray-600">
                {isPWAInstalled ? "Installed and ready to use" : "Not installed"}
              </p>
            </div>
            <Badge variant={isPWAInstalled ? "default" : "secondary"}>
              {isPWAInstalled ? "Installed" : "Not Installed"}
            </Badge>
          </div>
          
          {!isPWAInstalled && (
            <Button onClick={handleInstallPWA} className="w-full">
              <Smartphone className="w-4 h-4 mr-2" />
              Install as App
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Offline Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium">Auto Download</Label>
              <p className="text-sm text-gray-600">
                Automatically download data when online
              </p>
            </div>
            <Switch 
              checked={autoDownload}
              onCheckedChange={setAutoDownload}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium">Notifications</Label>
              <p className="text-sm text-gray-600">
                Get notified about sync status
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={notificationsEnabled}
                onCheckedChange={handleEnableNotifications}
              />
              {notificationsEnabled && <Bell className="w-4 h-4 text-green-600" />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HardDrive className="w-5 h-5" />
            <span>Storage Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Storage Used</span>
              <span>{storageUsed.toFixed(1)}%</span>
            </div>
            <Progress value={storageUsed} />
          </div>
          
          {status.hasOfflineData && (
            <Button 
              onClick={handleClearOfflineData}
              variant="outline"
              className="w-full text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Offline Data
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Security & Privacy</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3 text-sm">
            <Lock className="w-4 h-4 text-green-600" />
            <span>Offline data is encrypted and isolated per tenant</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Data syncs securely with end-to-end encryption</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <Database className="w-4 h-4 text-green-600" />
            <span>Local storage cleared on logout for security</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}