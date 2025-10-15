import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Activity, 
  Clock,
  CheckCircle,
  AlertCircle,
  Building
} from 'lucide-react';

interface BankAccount {
  id: number;
  accountName: string;
  bankName: string;
  isActive: boolean;
  lastSync: string;
  balance: number;
}

interface BankFeedControlProps {
  bankAccounts: BankAccount[];
  onSyncToggle: (accountId: number, enabled: boolean) => void;
  onManualSync: (accountId: number) => void;
}

export default function BankFeedControl({ 
  bankAccounts, 
  onSyncToggle, 
  onManualSync 
}: BankFeedControlProps) {
  const [syncStatus, setSyncStatus] = useState<{ [key: number]: boolean }>({});
  const [syncing, setSyncing] = useState<{ [key: number]: boolean }>({});
  const { toast } = useToast();

  // Fetch sync status on component mount
  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/bank-feed/status');
      const status = await response.json();
      
      const statusMap: { [key: number]: boolean } = {};
      status.forEach((account: any) => {
        statusMap[account.id] = account.isActive;
      });
      
      setSyncStatus(statusMap);
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  };

  const handleSyncToggle = async (accountId: number, enabled: boolean) => {
    try {
      const endpoint = enabled 
        ? `/api/bank-feed/start-sync/${accountId}`
        : `/api/bank-feed/stop-sync/${accountId}`;
      
      const response = await fetch(endpoint, { method: 'POST' });
      
      if (response.ok) {
        setSyncStatus(prev => ({ ...prev, [accountId]: enabled }));
        onSyncToggle(accountId, enabled);
        
        toast({
          title: enabled ? 'Sync Started' : 'Sync Stopped',
          description: `Bank feed synchronization ${enabled ? 'activated' : 'deactivated'} for account.`,
        });
      } else {
        throw new Error('Failed to toggle sync');
      }
    } catch (error) {
      console.error('Error toggling sync:', error);
      toast({
        title: 'Error',
        description: 'Failed to toggle bank feed synchronization.',
        variant: 'destructive',
      });
    }
  };

  const handleManualSync = async (accountId: number) => {
    setSyncing(prev => ({ ...prev, [accountId]: true }));
    
    try {
      const response = await fetch(`/api/bank-feed/manual-sync/${accountId}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        onManualSync(accountId);
        toast({
          title: 'Sync Complete',
          description: 'Manual synchronization completed successfully.',
        });
      } else {
        throw new Error('Manual sync failed');
      }
    } catch (error) {
      console.error('Error in manual sync:', error);
      toast({
        title: 'Sync Failed',
        description: 'Manual synchronization failed. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(prev => ({ ...prev, [accountId]: false }));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getLastSyncDisplay = (lastSync: string) => {
    const syncDate = new Date(lastSync);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return syncDate.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Real-time Bank Feed Control
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchSyncStatus}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bankAccounts.map((account) => {
            const isActive = syncStatus[account.id] || false;
            const isSyncing = syncing[account.id] || false;
            
            return (
              <div 
                key={account.id} 
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {isActive ? (
                      <Wifi className="h-5 w-5 text-green-500" />
                    ) : (
                      <WifiOff className="h-5 w-5 text-gray-400" />
                    )}
                    <Building className="h-4 w-4 text-gray-500" />
                  </div>
                  
                  <div>
                    <div className="font-medium">{account.accountName}</div>
                    <div className="text-sm text-gray-500">
                      {account.bankName} • {formatCurrency(account.balance)}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        Last sync: {getLastSyncDisplay(account.lastSync)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                    
                    {isActive && (
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="ml-1 text-xs text-green-600">Live</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={isActive}
                      onCheckedChange={(checked) => handleSyncToggle(account.id, checked)}
                      disabled={isSyncing}
                    />
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManualSync(account.id)}
                      disabled={isSyncing}
                    >
                      {isSyncing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {bankAccounts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No bank accounts configured</p>
              <p className="text-sm">Add bank accounts to enable real-time synchronization</p>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                Real-time Bank Feed Benefits
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-200 mt-2 space-y-1">
                <li>• Automatic transaction import every minute</li>
                <li>• Real-time balance updates and notifications</li>
                <li>• Intelligent transaction categorization</li>
                <li>• Automated reconciliation with existing records</li>
                <li>• Instant fraud detection and alerts</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}