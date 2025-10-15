// PWA setup for NODE CRM offline capabilities

interface PWAInstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWASetup {
  private deferredPrompt: PWAInstallPrompt | null = null;
  private isInstalled = false;

  constructor() {
    this.initializePWA();
  }

  private async initializePWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('Service Worker registered successfully:', registration.scope);
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available; ask user to reload
                this.showUpdateAvailable();
              }
            });
          }
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SYNC_OFFLINE_CHANGES') {
            // Trigger offline sync in the app
            this.triggerOfflineSync();
          }
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }

    // Handle PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as PWAInstallPrompt;
      this.showInstallButton();
    });

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.hideInstallButton();
      console.log('PWA installed successfully');
    });

    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      console.log('Running as installed PWA');
    }
  }

  // Show PWA install button/prompt
  private showInstallButton() {
    // Create install button if it doesn't exist
    if (!document.getElementById('pwa-install-button')) {
      const button = document.createElement('button');
      button.id = 'pwa-install-button';
      button.innerHTML = '📱 Install App';
      button.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors z-50';
      button.onclick = () => this.installPWA();
      document.body.appendChild(button);
    }
  }

  private hideInstallButton() {
    const button = document.getElementById('pwa-install-button');
    if (button) {
      button.remove();
    }
  }

  // Install PWA
  async installPWA(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('PWA install prompt not available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted PWA install');
        this.hideInstallButton();
        return true;
      } else {
        console.log('User dismissed PWA install');
        return false;
      }
    } catch (error) {
      console.error('PWA install failed:', error);
      return false;
    } finally {
      this.deferredPrompt = null;
    }
  }

  // Show update available notification
  private showUpdateAvailable() {
    // Create update notification
    const notification = document.createElement('div');
    notification.id = 'pwa-update-notification';
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <span>🔄 New version available</span>
        <button onclick="window.location.reload()" class="bg-white text-green-600 px-2 py-1 rounded text-sm font-medium">
          Update
        </button>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
          ✕
        </button>
      </div>
    `;
    
    // Remove after 10 seconds if not clicked
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
    
    document.body.appendChild(notification);
  }

  // Trigger offline sync in the app
  private triggerOfflineSync() {
    // Dispatch custom event that the app can listen to
    window.dispatchEvent(new CustomEvent('offline-sync-requested'));
  }

  // Check if PWA is installed
  isPWAInstalled(): boolean {
    return this.isInstalled;
  }

  // Enable background sync
  async enableBackgroundSync(): Promise<boolean> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-sync');
        console.log('Background sync registered');
        return true;
      } catch (error) {
        console.error('Background sync registration failed:', error);
        return false;
      }
    }
    return false;
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Show offline notification
  showOfflineNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('NODE CRM - Offline Mode', {
        body: 'You are now working offline. Changes will sync when back online.',
        icon: '/assets/colored-logo.png',
        badge: '/assets/transparent-logo.png'
      });
    }
  }

  // Show online notification
  showOnlineNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('NODE CRM - Back Online', {
        body: 'Internet connection restored. Syncing your changes...',
        icon: '/assets/colored-logo.png',
        badge: '/assets/transparent-logo.png'
      });
    }
  }
}

export const pwaSetup = new PWASetup();