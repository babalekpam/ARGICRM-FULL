import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { debounce, throttle } from '@/lib/performance';

// Hook for optimizing API calls with intelligent caching
export function useOptimizedApiCall<T>(
  queryKey: string[],
  apiCall: () => Promise<T>,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  }
) {
  const { enabled = true, refetchInterval = false, staleTime = 5 * 60 * 1000 } = options || {};

  return useQuery({
    queryKey,
    queryFn: apiCall,
    enabled,
    refetchInterval,
    staleTime,
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// Hook for debounced search functionality
export function useDebouncedSearch(
  searchTerm: string,
  searchFunction: (term: string) => void,
  delay: number = 300
) {
  const debouncedSearch = useMemo(
    () => debounce(searchFunction, delay),
    [searchFunction, delay]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);
}

// Hook for throttled scroll events
export function useThrottledScroll(
  callback: (event: Event) => void,
  delay: number = 100
) {
  const throttledCallback = useMemo(
    () => throttle(callback, delay),
    [callback, delay]
  );

  useEffect(() => {
    window.addEventListener('scroll', throttledCallback);
    return () => window.removeEventListener('scroll', throttledCallback);
  }, [throttledCallback]);
}

// Hook for lazy loading images
export function useLazyImage(src: string, threshold: number = 0.1) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(img);
        }
      },
      { threshold }
    );

    observer.observe(img);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  useEffect(() => {
    if (isInView && !isLoaded) {
      const img = new Image();
      img.onload = () => setIsLoaded(true);
      img.src = src;
    }
  }, [isInView, isLoaded, src]);

  return { imgRef, isLoaded, isInView };
}

// Hook for reducing re-renders
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef<T>(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback(
    ((...args: any[]) => callbackRef.current(...args)) as T,
    []
  );
}

// Hook for monitoring component performance
export function useComponentPerformance(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    startTime.current = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime.current;
      
      if (renderTime > 16) { // Longer than one frame (60fps)
        console.warn(
          `${componentName} took ${renderTime.toFixed(2)}ms to render (render #${renderCount.current})`
        );
      }
    };
  });

  return {
    renderCount: renderCount.current,
    measureRender: () => {
      startTime.current = performance.now();
    }
  };
}

// Hook for efficient data filtering
export function useOptimizedFilter<T>(
  data: T[],
  filterFn: (item: T) => boolean,
  dependencies: any[] = []
) {
  return useMemo(() => {
    return data.filter(filterFn);
  }, [data, ...dependencies]);
}

// Hook for caching expensive calculations
export function useMemoizedCalculation<T>(
  calculation: () => T,
  dependencies: any[]
): T {
  return useMemo(calculation, dependencies);
}

// Hook for batching state updates
export function useBatchedUpdates() {
  const [updates, setUpdates] = useState<(() => void)[]>([]);
  
  const batchUpdate = useCallback((updateFn: () => void) => {
    setUpdates(prev => [...prev, updateFn]);
  }, []);

  useEffect(() => {
    if (updates.length > 0) {
      // Use React's automatic batching (React 18+) or setTimeout for older versions
      const timeoutId = setTimeout(() => {
        updates.forEach(update => update());
        setUpdates([]);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [updates]);

  return batchUpdate;
}