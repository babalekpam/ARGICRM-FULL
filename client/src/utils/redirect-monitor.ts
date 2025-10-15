// LANDER REDIRECT MONITORING SYSTEM
// This utility monitors and ensures lander redirects work correctly

export class RedirectMonitor {
  private static instance: RedirectMonitor;
  
  static getInstance(): RedirectMonitor {
    if (!RedirectMonitor.instance) {
      RedirectMonitor.instance = new RedirectMonitor();
    }
    return RedirectMonitor.instance;
  }

  // Check if lander redirect is working
  async checkLanderHealth(): Promise<boolean> {
    try {
      const response = await fetch('/api/lander-health');
      const data = await response.json();
      console.log('✅ Lander redirect health:', data);
      return data.status === 'active';
    } catch (error) {
      console.error('❌ Lander redirect health check failed:', error);
      return false;
    }
  }

  // Monitor for lander URL access and ensure proper redirect
  startMonitoring(): void {
    // Check health on page load
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        this.checkLanderHealth();
      });

      // Monitor for any navigation to lander URLs
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = function(...args) {
        const url = args[2];
        if (url && (url.includes('/lander') || url.includes('lander'))) {
          console.warn('🚨 BLOCKED: Navigation to lander URL detected');
          window.location.replace('/');
          return;
        }
        return originalPushState.apply(history, args);
      };

      history.replaceState = function(...args) {
        const url = args[2];
        if (url && (url.includes('/lander') || url.includes('lander'))) {
          console.warn('🚨 BLOCKED: Replace state to lander URL detected');
          window.location.replace('/');
          return;
        }
        return originalReplaceState.apply(history, args);
      };
    }
  }

  // Emergency redirect function
  emergencyRedirect(): void {
    if (typeof window !== 'undefined' && 
        (window.location.pathname === '/lander' || 
         window.location.pathname.startsWith('/lander/'))) {
      console.log('🆘 EMERGENCY: Executing emergency lander redirect');
      window.location.replace('/');
    }
  }
}

// Initialize monitoring
export const redirectMonitor = RedirectMonitor.getInstance();

// Auto-start monitoring if in browser environment
if (typeof window !== 'undefined') {
  redirectMonitor.startMonitoring();
}