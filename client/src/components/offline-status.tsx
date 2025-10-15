import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useOffline } from '@/hooks/useOffline';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  Upload, 
  RefreshCw, 
  Database,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

export function OfflineStatus() {
  const { status, downloadForOffline, syncOfflineChanges, clearOfflineData } = useOffline();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleDownloadForOffline = async () => {
    setIsDownloading(true);
    const success = await downloadForOffline();
    
    if (success) {
      toast({
        title: "Offline Data Downloaded",
        description: "Your data is now available offline. You can work without an internet connection.",
        variant: "default",
      });
    } else {
      toast({
        title: "Download Failed",
        description: "Failed to download data for offline use. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsDownloading(false);
  };

  const handleSyncChanges = async () => {
    setIsSyncing(true);
    const result = await syncOfflineChanges();
    
    if (result.success > 0) {
      toast({
        title: "Sync Completed",
        description: `Successfully synced ${result.success} changes. ${result.failed} failed.`,
        variant: "default",
      });
    } else if (result.failed > 0) {
      toast({
        title: "Sync Failed",
        description: `Failed to sync ${result.failed} changes. Please try again.`,
        variant: "destructive",
      });
    }
    
    setIsSyncing(false);
  };

  const handleClearOfflineData = async () => {
    await clearOfflineData();
    toast({
      title: "Offline Data Cleared",
      description: "All offline data has been removed from this device.",
      variant: "default",
    });
  };

  if (!status.isInitialized) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm text-gray-600">Initializing offline service...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {status.isOnline ? (
            <Wifi className="w-5 h-5 text-green-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-600" />
          )}
          <span>Connection Status</span>
        </CardTitle>
        <CardDescription>
          Manage offline capabilities and data synchronization
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Internet Connection</span>
          <Badge variant={status.isOnline ? "default" : "destructive"}>
            {status.isOnline ? "Online" : "Offline"}
          </Badge>
        </div>

        {/* Offline Data Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Offline Data Available</span>
          <Badge variant={status.hasOfflineData ? "default" : "secondary"}>
            {status.hasOfflineData ? "Yes" : "No"}
          </Badge>
        </div>

        {/* Pending Changes */}
        {status.pendingChanges > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Pending Sync</span>
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
              <Clock className="w-3 h-3 mr-1" />
              {status.pendingChanges} changes
            </Badge>
          </div>
        )}

        {/* Sync Status */}
        {status.syncInProgress && (
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Synchronizing...</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-4 border-t">
          {/* Download for Offline */}
          {status.isOnline && (
            <Button
              onClick={handleDownloadForOffline}
              disabled={isDownloading}
              className="w-full"
              variant="outline"
            >
              {isDownloading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {status.hasOfflineData ? "Update Offline Data" : "Download for Offline"}
            </Button>
          )}

          {/* Sync Changes */}
          {status.isOnline && status.pendingChanges > 0 && (
            <Button
              onClick={handleSyncChanges}
              disabled={isSyncing}
              className="w-full"
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Sync {status.pendingChanges} Changes
            </Button>
          )}

          {/* Clear Offline Data */}
          {status.hasOfflineData && (
            <Button
              onClick={handleClearOfflineData}
              variant="outline"
              className="w-full text-red-600 hover:text-red-700"
            >
              <Database className="w-4 h-4 mr-2" />
              Clear Offline Data
            </Button>
          )}
        </div>

        {/* Status Messages */}
        <div className="space-y-2 pt-4 border-t">
          {!status.isOnline && !status.hasOfflineData && (
            <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 p-3 rounded">
              <AlertCircle className="w-4 h-4" />
              <span>You're offline and no data is available. Connect to internet to download data.</span>
            </div>
          )}

          {!status.isOnline && status.hasOfflineData && (
            <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 p-3 rounded">
              <CheckCircle className="w-4 h-4" />
              <span>You're working offline. Changes will sync when you're back online.</span>
            </div>
          )}

          {status.isOnline && status.hasOfflineData && status.pendingChanges === 0 && (
            <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 p-3 rounded">
              <CheckCircle className="w-4 h-4" />
              <span>You're online and all data is synchronized.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}