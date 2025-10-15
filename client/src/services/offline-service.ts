// Offline Service for NODE CRM Platform
// Provides comprehensive offline capabilities with secure tenant isolation

interface OfflineData {
  contacts: any[];
  leads: any[];
  deals: any[];
  accounts: any[];
  tasks: any[];
  appointments: any[];
  campaigns: any[];
  projects: any[];
  lastSync: number;
  tenantId: string;
  userEmail: string;
}

interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: number;
  tenantId: string;
}

class OfflineService {
  private dbName: string;
  private db: IDBDatabase | null = null;
  private tenantId: string = '';
  private userEmail: string = '';
  private syncQueue: SyncQueueItem[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.dbName = 'NODE_CRM_OFFLINE';
    this.initializeEventListeners();
  }

  // Initialize the offline service with tenant context
  async initialize(tenantId: string, userEmail: string): Promise<void> {
    this.tenantId = tenantId;
    this.userEmail = userEmail;
    await this.initializeDatabase();
    await this.loadSyncQueue();
    console.log(`Offline service initialized for tenant: ${tenantId}`);
  }

  // Initialize IndexedDB with tenant-specific stores
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(`${this.dbName}_${this.tenantId}`, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for each entity type
        const stores = ['contacts', 'leads', 'deals', 'accounts', 'tasks', 
                       'appointments', 'campaigns', 'projects', 'syncQueue', 'metadata'];
        
        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            store.createIndex('updatedAt', 'updatedAt', { unique: false });
            store.createIndex('tenantId', 'tenantId', { unique: false });
          }
        });
      };
    });
  }

  // Store data offline with tenant isolation
  async storeOfflineData(entityType: string, data: any[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([entityType], 'readwrite');
    const store = transaction.objectStore(entityType);
    
    // Clear existing data for this tenant
    await this.clearTenantData(entityType);
    
    // Store new data with tenant ID validation
    for (const item of data) {
      const itemWithTenant = {
        ...item,
        tenantId: this.tenantId,
        offlineStored: true,
        lastOfflineUpdate: Date.now()
      };
      await store.put(itemWithTenant);
    }

    console.log(`Stored ${data.length} ${entityType} records offline for tenant ${this.tenantId}`);
  }

  // Retrieve offline data with tenant filtering
  async getOfflineData(entityType: string): Promise<any[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([entityType], 'readonly');
      const store = transaction.objectStore(entityType);
      const index = store.index('tenantId');
      const request = index.getAll(this.tenantId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Add item to sync queue for later upload
  async addToSyncQueue(action: 'create' | 'update' | 'delete', entity: string, data: any): Promise<void> {
    const queueItem: SyncQueueItem = {
      id: crypto.randomUUID(),
      action,
      entity,
      data: { ...data, tenantId: this.tenantId },
      timestamp: Date.now(),
      tenantId: this.tenantId
    };

    this.syncQueue.push(queueItem);
    await this.saveSyncQueue();
    console.log(`Added ${action} ${entity} to sync queue`);
  }

  // Create/Update data offline
  async saveOfflineItem(entityType: string, item: any, isNew: boolean = false): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    const itemWithMetadata = {
      ...item,
      id: item.id || crypto.randomUUID(),
      tenantId: this.tenantId,
      updatedAt: new Date().toISOString(),
      offlineModified: true,
      lastOfflineUpdate: Date.now()
    };

    const transaction = this.db.transaction([entityType], 'readwrite');
    const store = transaction.objectStore(entityType);
    await store.put(itemWithMetadata);

    // Add to sync queue
    await this.addToSyncQueue(isNew ? 'create' : 'update', entityType, itemWithMetadata);

    return itemWithMetadata;
  }

  // Delete data offline
  async deleteOfflineItem(entityType: string, id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction([entityType], 'readwrite');
    const store = transaction.objectStore(entityType);
    
    // Get the item first to add to sync queue
    const getRequest = store.get(id);
    getRequest.onsuccess = async () => {
      if (getRequest.result) {
        await this.addToSyncQueue('delete', entityType, { id, tenantId: this.tenantId });
        await store.delete(id);
        console.log(`Deleted ${entityType} ${id} offline`);
      }
    };
  }

  // Sync offline changes when online
  async syncOfflineChanges(): Promise<{ success: number; failed: number }> {
    if (!this.isOnline) {
      console.log('Cannot sync: offline');
      return { success: 0, failed: 0 };
    }

    let success = 0;
    let failed = 0;

    for (const item of this.syncQueue) {
      try {
        await this.syncSingleItem(item);
        success++;
      } catch (error) {
        console.error(`Failed to sync item:`, error);
        failed++;
      }
    }

    // Clear successfully synced items
    if (success > 0) {
      this.syncQueue = this.syncQueue.slice(success);
      await this.saveSyncQueue();
    }

    console.log(`Sync completed: ${success} success, ${failed} failed`);
    return { success, failed };
  }

  // Sync single item to server
  private async syncSingleItem(item: SyncQueueItem): Promise<void> {
    const url = `/api/${item.entity}${item.action !== 'create' ? `/${item.data.id}` : ''}`;
    const method = item.action === 'create' ? 'POST' : 
                   item.action === 'update' ? 'PUT' : 'DELETE';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': this.userEmail,
        'x-tenant-id': this.tenantId,
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: item.action !== 'delete' ? JSON.stringify(item.data) : undefined
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
  }

  // Download data for offline use
  async downloadForOffline(): Promise<void> {
    if (!this.isOnline) {
      console.log('Cannot download: offline');
      return;
    }

    const entities = ['contacts', 'leads', 'deals', 'accounts', 'tasks', 
                     'appointments', 'campaigns', 'projects'];

    for (const entity of entities) {
      try {
        const response = await fetch(`/api/${entity}`, {
          headers: {
            'x-user-email': this.userEmail,
            'x-tenant-id': this.tenantId,
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          await this.storeOfflineData(entity, data);
        }
      } catch (error) {
        console.error(`Failed to download ${entity}:`, error);
      }
    }

    // Update last sync timestamp
    await this.updateLastSync();
    console.log('Offline download completed');
  }

  // Check if data exists offline
  async hasOfflineData(): Promise<boolean> {
    if (!this.db) return false;
    
    const contacts = await this.getOfflineData('contacts');
    return contacts.length > 0;
  }

  // Get offline status information
  getOfflineStatus(): { isOnline: boolean; hasOfflineData: boolean; lastSync?: number } {
    return {
      isOnline: this.isOnline,
      hasOfflineData: this.db !== null,
      lastSync: this.getLastSyncTime()
    };
  }

  // Clear all tenant data (for security/logout)
  async clearTenantData(entityType?: string): Promise<void> {
    if (!this.db) return;

    const entities = entityType ? [entityType] : 
      ['contacts', 'leads', 'deals', 'accounts', 'tasks', 
       'appointments', 'campaigns', 'projects'];

    for (const entity of entities) {
      const transaction = this.db.transaction([entity], 'readwrite');
      const store = transaction.objectStore(entity);
      const index = store.index('tenantId');
      const request = index.getAllKeys(this.tenantId);

      request.onsuccess = () => {
        const keys = request.result;
        keys.forEach(key => store.delete(key));
      };
    }

    console.log(`Cleared offline data for tenant ${this.tenantId}`);
  }

  // Private helper methods
  private async loadSyncQueue(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['syncQueue'], 'readonly');
    const store = transaction.objectStore('syncQueue');
    const index = store.index('tenantId');
    const request = index.getAll(this.tenantId);

    request.onsuccess = () => {
      this.syncQueue = request.result || [];
    };
  }

  private async saveSyncQueue(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    // Clear existing queue items for this tenant
    const index = store.index('tenantId');
    const clearRequest = index.getAllKeys(this.tenantId);
    clearRequest.onsuccess = () => {
      clearRequest.result.forEach(key => store.delete(key));
      
      // Add current queue items
      this.syncQueue.forEach(item => store.put(item));
    };
  }

  private async updateLastSync(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(['metadata'], 'readwrite');
    const store = transaction.objectStore('metadata');
    await store.put({
      id: 'lastSync',
      tenantId: this.tenantId,
      timestamp: Date.now()
    });
  }

  private getLastSyncTime(): number | undefined {
    // This would be implemented to retrieve from IndexedDB
    return undefined;
  }

  private initializeEventListeners(): void {
    // Online/offline event listeners
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Back online - triggering sync');
      this.syncOfflineChanges();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Gone offline - switching to offline mode');
    });

    // Background sync on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncOfflineChanges();
      }
    });
  }
}

export const offlineService = new OfflineService();
export type { OfflineData, SyncQueueItem };