// BULLETPROOF ANTI-CACHING SYSTEM
// Prevents DNS/CDN caching from serving old parking page

(function() {
  'use strict';
  
  // Monitor for parking page detection
  function detectParkingPage() {
    const html = document.documentElement.innerHTML.toLowerCase();
    const isParkingPage = html.includes('parking-lander') || 
                         html.includes('window.lander_system') ||
                         html.includes('wsimg.com/parking-lander');
    
    if (isParkingPage && window.location.hostname.includes('argilette.org')) {
      console.error('🚨 PARKING PAGE DETECTED: Clearing all caches');
      
      // Clear service worker caches
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }
      
      // Clear browser caches
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
      
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Force reload with cache bypass
      setTimeout(() => {
        window.location.reload(true);
      }, 1000);
      
      return true;
    }
    
    return false;
  }
  
  // Run check immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectParkingPage);
  } else {
    detectParkingPage();
  }
  
  // Monitor for dynamic content changes
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      if (detectParkingPage()) {
        observer.disconnect();
      }
    });
    
    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }
})();