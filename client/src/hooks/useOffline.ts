// React hook for offline functionality and PWA features
import { useState, useEffect, useCallback } from 'react';
import { offlineService } from '@/services/offline-service';

interface OfflineStatus {
  isOnline: boolean;
  isInitialized: boolean;
  hasOfflineData: boolean;
  pendingChanges: number;
  lastSync?: Date;
}

export function useOffline() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: navigator.onLine,
    isInitialized: false,
    hasOfflineData: false,
    pendingChanges: 0
  });

  // Initialize offline service
  useEffect(() => {
    const initializeOffline = async () => {
      try {
        // Get user context from localStorage or auth
        const userEmail = localStorage.getItem('user_email') || 'default@argilette.com';
        const tenantId = localStorage.getItem('tenant_id') || 'default-tenant';
        
        await offlineService.initialize(tenantId, userEmail);
        
        const hasData = await offlineService.hasOfflineData();
        
        setStatus(prev => ({
          ...prev,
          isInitialized: true,
          hasOfflineData: hasData
        }));
      } catch (error) {
        console.error('Failed to initialize offline service:', error);
      }
    };

    initializeOffline();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      // Auto-sync when coming back online
      if (status.pendingChanges > 0) {
        syncOfflineChanges();
      }
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [status.pendingChanges]);

  // Download data for offline use
  const downloadForOffline = useCallback(async (): Promise<boolean> => {
    if (!status.isOnline) return false;
    
    try {
      await offlineService.downloadForOffline();
      const hasData = await offlineService.hasOfflineData();
      
      setStatus(prev => ({
        ...prev,
        hasOfflineData: hasData,
        lastSync: new Date()
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to download for offline:', error);
      return false;
    }
  }, [status.isOnline]);

  // Sync offline changes
  const syncOfflineChanges = useCallback(async () => {
    if (!status.isOnline) {
      return { success: 0, failed: 0 };
    }
    
    try {
      const result = await offlineService.syncOfflineChanges();
      
      setStatus(prev => ({
        ...prev,
        pendingChanges: Math.max(0, prev.pendingChanges - result.success),
        lastSync: new Date()
      }));
      
      return result;
    } catch (error) {
      console.error('Failed to sync offline changes:', error);
      return { success: 0, failed: 0 };
    }
  }, [status.isOnline]);

  // Clear offline data (for logout)
  const clearOfflineData = useCallback(async () => {
    try {
      await offlineService.clearTenantData();
      setStatus(prev => ({
        ...prev,
        hasOfflineData: false,
        pendingChanges: 0
      }));
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }, []);

  // Get offline capabilities
  const getOfflineCapabilities = useCallback(() => {
    return {
      canWorkOffline: status.hasOfflineData || !status.isOnline,
      canSync: status.isOnline && status.pendingChanges > 0,
      canDownload: status.isOnline,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      pushNotificationsSupported: 'Notification' in window,
      backgroundSyncSupported: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
    };
  }, [status]);

  // Install PWA prompt
  const installPWA = useCallback(async () => {
    // This will be handled by the service worker installation prompt
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // Trigger install prompt if available
        window.dispatchEvent(new CustomEvent('pwa-install-prompt'));
        return true;
      } catch (error) {
        console.error('PWA install failed:', error);
        return false;
      }
    }
    return false;
  }, []);

  return {
    status,
    downloadForOffline,
    syncOfflineChanges,
    clearOfflineData,
    getOfflineCapabilities,
    installPWA
  };
}