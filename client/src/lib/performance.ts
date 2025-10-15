// Performance optimization utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure component render time
  startMeasure(name: string): void {
    this.metrics.set(`${name}_start`, performance.now());
  }

  endMeasure(name: string): number {
    const start = this.metrics.get(`${name}_start`);
    if (start) {
      const duration = performance.now() - start;
      this.metrics.set(name, duration);
      this.metrics.delete(`${name}_start`);
      
      // Log slow components (> 100ms)
      if (duration > 100) {
        console.warn(`Slow component: ${name} took ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    }
    return 0;
  }

  // Get all metrics
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Debounce utility for API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), wait);
    }
  };
}

// Memoization for expensive calculations
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    
    // Limit cache size
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  }) as T;
}

// Virtual scrolling utility
export class VirtualScroller {
  static calculateVisibleItems(
    containerHeight: number,
    itemHeight: number,
    scrollTop: number,
    totalItems: number,
    overscan: number = 5
  ) {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      totalItems
    );

    return {
      startIndex: Math.max(0, visibleStart - overscan),
      endIndex: Math.min(totalItems, visibleEnd + overscan),
      offsetY: Math.max(0, visibleStart - overscan) * itemHeight
    };
  }
}

// Image lazy loading utility
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  });
}

// Bundle analyzer utility
export function measureBundleSize(): void {
  if (typeof window !== 'undefined' && 'performance' in window) {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const totalLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      
      console.log(`Bundle load time: ${totalLoadTime.toFixed(2)}ms`);
      
      // Measure main resource sizes
      const resources = performance.getEntriesByType('resource');
      const jsSize = resources
        .filter(r => r.name.endsWith('.js'))
        .reduce((sum, r) => sum + (r as PerformanceResourceTiming).transferSize, 0);
      
      const cssSize = resources
        .filter(r => r.name.endsWith('.css'))
        .reduce((sum, r) => sum + (r as PerformanceResourceTiming).transferSize, 0);
      
      console.log(`JS bundle size: ${(jsSize / 1024).toFixed(2)}KB`);
      console.log(`CSS bundle size: ${(cssSize / 1024).toFixed(2)}KB`);
    });
  }
}