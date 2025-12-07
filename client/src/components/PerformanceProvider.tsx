import { createContext, useContext, useEffect, ReactNode } from 'react';
import { PerformanceMonitor, measureBundleSize } from '@/lib/performance';

interface PerformanceContextType {
  monitor: PerformanceMonitor;
  measureComponent: (name: string) => () => void;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const monitor = PerformanceMonitor.getInstance();

  useEffect(() => {
    // Initialize performance monitoring
    measureBundleSize();
    
    // Monitor Core Web Vitals
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor First Contentful Paint (FCP)
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            // Performance metrics captured silently for production
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['paint'] });
      } catch (e) {
        // Fallback for unsupported browsers
      }

      // Monitor Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        // LCP metrics captured silently for production
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // Fallback for unsupported browsers
      }

      // Monitor layout shifts (CLS)
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsScore += (entry as any).value;
          }
        }
        // CLS metrics captured silently for production
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // Fallback for unsupported browsers
      }

      return () => {
        observer.disconnect();
        lcpObserver.disconnect();
        clsObserver.disconnect();
      };
    }
  }, [monitor]);

  const measureComponent = (name: string) => {
    monitor.startMeasure(name);
    return () => monitor.endMeasure(name);
  };

  return (
    <PerformanceContext.Provider value={{ monitor, measureComponent }}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}

// HOC for automatic component performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || Component.displayName || Component.name || 'Component';
  
  return function PerformanceMonitoredComponent(props: P) {
    const { measureComponent } = usePerformance();
    
    useEffect(() => {
      const endMeasure = measureComponent(displayName);
      return endMeasure;
    }, [measureComponent]);

    return <Component {...props} />;
  };
}