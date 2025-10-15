import { Suspense, lazy, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PerformanceMonitor } from '@/lib/performance';

interface LazyComponentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  name?: string;
}

// Default loading fallback
const DefaultFallback = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-32 w-full" />
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  </div>
);

// Lazy component wrapper with simplified loading
export function LazyComponentWrapper({ 
  children, 
  fallback = <DefaultFallback />,
  name = 'component'
}: LazyComponentWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

// HOC for creating lazy components with error boundaries
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  name: string,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return function WrappedComponent(props: P) {
    return (
      <LazyComponentWrapper name={name} fallback={fallback}>
        <LazyComponent {...props} />
      </LazyComponentWrapper>
    );
  };
}

// Performance-optimized card skeleton
export const CardSkeleton = () => (
  <div className="rounded-lg border p-4 space-y-3">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-8 w-full" />
  </div>
);

// Dashboard-specific loading skeleton
export const DashboardSkeleton = () => (
  <div className="space-y-6 p-6">
    {/* Header skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    
    {/* Stats grid skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
    
    {/* Chart area skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-lg border p-4">
        <Skeleton className="h-4 w-1/4 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="rounded-lg border p-4">
        <Skeleton className="h-4 w-1/4 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  </div>
);

// Table skeleton for data tables
export const TableSkeleton = ({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="space-y-3">
    {/* Table header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
    
    {/* Table rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-8 w-full" />
        ))}
      </div>
    ))}
  </div>
);