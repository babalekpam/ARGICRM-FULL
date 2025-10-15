// Offline-aware data layer that seamlessly works online and offline
import { offlineService } from '@/services/offline-service';

interface DataLayerOptions {
  entityType: string;
  useOfflineFirst?: boolean;
  tenantId?: string;
  userEmail?: string;
}

class OfflineDataLayer {
  private isOnline: boolean = navigator.onLine;

  constructor() {
    // Monitor connection status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.triggerSync();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  // Get data with online/offline fallback
  async getData(options: DataLayerOptions): Promise<any[]> {
    const { entityType, useOfflineFirst = false } = options;

    // If offline-first is enabled, try offline data first
    if (useOfflineFirst || !this.isOnline) {
      try {
        const offlineData = await offlineService.getOfflineData(entityType);
        if (offlineData.length > 0) {
          console.log(`Serving ${entityType} from offline storage`);
          return offlineData;
        }
      } catch (error) {
        console.warn(`Failed to get offline ${entityType}:`, error);
      }
    }

    // Try online data if available
    if (this.isOnline) {
      try {
        const response = await this.fetchFromAPI(`/api/${entityType}`, options);
        if (response.ok) {
          const data = await response.json();
          
          // Store in offline cache for future use
          await offlineService.storeOfflineData(entityType, data);
          console.log(`Serving ${entityType} from server and cached offline`);
          return data;
        }
      } catch (error) {
        console.warn(`Failed to fetch ${entityType} from server:`, error);
      }
    }

    // Fallback to offline data if online fetch failed
    try {
      const offlineData = await offlineService.getOfflineData(entityType);
      console.log(`Serving ${entityType} from offline fallback`);
      return offlineData;
    } catch (error) {
      console.error(`Failed to get ${entityType} from both online and offline:`, error);
      return [];
    }
  }

  // Create new item with offline support
  async createItem(options: DataLayerOptions, data: any): Promise<any> {
    const { entityType } = options;

    // Always save offline first for immediate feedback
    const offlineItem = await offlineService.saveOfflineItem(entityType, data, true);

    // Try to sync to server if online
    if (this.isOnline) {
      try {
        const response = await this.fetchFromAPI(`/api/${entityType}`, options, {
          method: 'POST',
          body: JSON.stringify(data)
        });

        if (response.ok) {
          const serverItem = await response.json();
          // Update offline storage with server response (includes ID, etc.)
          await offlineService.saveOfflineItem(entityType, serverItem, false);
          console.log(`Created ${entityType} on server and updated offline`);
          return serverItem;
        }
      } catch (error) {
        console.warn(`Failed to create ${entityType} on server, keeping offline:`, error);
      }
    }

    console.log(`Created ${entityType} offline only`);
    return offlineItem;
  }

  // Update item with offline support
  async updateItem(options: DataLayerOptions, id: string, data: any): Promise<any> {
    const { entityType } = options;

    // Always save offline first
    const updatedData = { ...data, id };
    const offlineItem = await offlineService.saveOfflineItem(entityType, updatedData, false);

    // Try to sync to server if online
    if (this.isOnline) {
      try {
        const response = await this.fetchFromAPI(`/api/${entityType}/${id}`, options, {
          method: 'PUT',
          body: JSON.stringify(data)
        });

        if (response.ok) {
          const serverItem = await response.json();
          // Update offline storage with server response
          await offlineService.saveOfflineItem(entityType, serverItem, false);
          console.log(`Updated ${entityType} on server and offline`);
          return serverItem;
        }
      } catch (error) {
        console.warn(`Failed to update ${entityType} on server, keeping offline:`, error);
      }
    }

    console.log(`Updated ${entityType} offline only`);
    return offlineItem;
  }

  // Delete item with offline support
  async deleteItem(options: DataLayerOptions, id: string): Promise<boolean> {
    const { entityType } = options;

    // Always mark as deleted offline first
    await offlineService.deleteOfflineItem(entityType, id);

    // Try to delete from server if online
    if (this.isOnline) {
      try {
        const response = await this.fetchFromAPI(`/api/${entityType}/${id}`, options, {
          method: 'DELETE'
        });

        if (response.ok) {
          console.log(`Deleted ${entityType} from server and offline`);
          return true;
        }
      } catch (error) {
        console.warn(`Failed to delete ${entityType} from server, keeping offline deletion:`, error);
      }
    }

    console.log(`Deleted ${entityType} offline only`);
    return true;
  }

  // Get single item by ID
  async getItem(options: DataLayerOptions, id: string): Promise<any | null> {
    const { entityType } = options;

    // Try offline first if not online
    if (!this.isOnline) {
      const offlineData = await offlineService.getOfflineData(entityType);
      return offlineData.find(item => item.id === id) || null;
    }

    // Try server first if online
    try {
      const response = await this.fetchFromAPI(`/api/${entityType}/${id}`, options);
      if (response.ok) {
        const item = await response.json();
        console.log(`Retrieved ${entityType} ${id} from server`);
        return item;
      }
    } catch (error) {
      console.warn(`Failed to get ${entityType} ${id} from server:`, error);
    }

    // Fallback to offline
    const offlineData = await offlineService.getOfflineData(entityType);
    const offlineItem = offlineData.find(item => item.id === id) || null;
    if (offlineItem) {
      console.log(`Retrieved ${entityType} ${id} from offline storage`);
    }
    return offlineItem;
  }

  // Trigger background sync
  async triggerSync(): Promise<void> {
    if (!this.isOnline) return;

    try {
      const result = await offlineService.syncOfflineChanges();
      console.log(`Background sync completed: ${result.success} success, ${result.failed} failed`);
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }

  // Helper method to make API requests with proper headers
  private async fetchFromAPI(
    url: string, 
    options: DataLayerOptions, 
    fetchOptions: RequestInit = {}
  ): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((fetchOptions.headers as Record<string, string>) || {})
    };

    // Add tenant and user context
    if (options.tenantId) {
      headers['x-tenant-id'] = options.tenantId;
    }
    if (options.userEmail) {
      headers['x-user-email'] = options.userEmail;
    }

    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, {
      ...fetchOptions,
      headers
    });
  }

  // Check if data is available (online or offline)
  async isDataAvailable(entityType: string): Promise<boolean> {
    if (this.isOnline) return true;
    
    const offlineData = await offlineService.getOfflineData(entityType);
    return offlineData.length > 0;
  }

  // Get connection status
  getConnectionStatus(): { isOnline: boolean; hasOfflineData: Promise<boolean> } {
    return {
      isOnline: this.isOnline,
      hasOfflineData: offlineService.hasOfflineData()
    };
  }
}

export const offlineDataLayer = new OfflineDataLayer();
export type { DataLayerOptions };