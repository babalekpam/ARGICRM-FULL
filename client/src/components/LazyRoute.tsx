import React, { Suspense, lazy, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorBoundary from '@/components/error-boundary';

interface LazyRouteProps {
  importFn: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
}

const DefaultLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="space-y-4 p-6 max-w-md w-full">
      <Skeleton className="h-6 w-3/4 mx-auto" />
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  </div>
);

export function LazyRoute({ importFn, fallback = <DefaultLoadingFallback /> }: LazyRouteProps) {
  const LazyComponent = lazy(importFn);
  
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback}>
        <LazyComponent />
      </Suspense>
    </ErrorBoundary>
  );
}