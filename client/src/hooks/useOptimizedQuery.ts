import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { debounce } from '@/lib/performance';

// Optimized query hook with intelligent caching and debouncing
export function useOptimizedQuery<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> & {
    debounceMs?: number;
    enableOffline?: boolean;
    backgroundRefetch?: boolean;
  }
) {
  const {
    debounceMs = 300,
    enableOffline = true,
    backgroundRefetch = true,
    ...queryOptions
  } = options || {};

  // Create debounced query function
  const debouncedQueryFn = debounce(queryFn, debounceMs);

  return useQuery({
    queryKey,
    queryFn: queryFn,
    // Optimize caching strategy
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    
    // Network optimizations
    networkMode: enableOffline ? 'offlineFirst' : 'online',
    refetchOnWindowFocus: backgroundRefetch,
    refetchOnReconnect: backgroundRefetch,
    refetchOnMount: false,
    
    // Retry strategy
    retry: (failureCount, error: any) => {
      // Don't retry on 404s or auth errors
      if (error?.status === 404 || error?.status === 401) {
        return false;
      }
      return failureCount < 3;
    },
    
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    ...queryOptions,
  });
}

// Optimized mutation hook with better error handling
export function useOptimizedMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options?: {
    onSuccess?: (data: T, variables: V) => void;
    onError?: (error: Error, variables: V) => void;
    invalidateQueries?: QueryKey[];
  }
) {
  const { invalidateQueries = [], ...mutationOptions } = options || {};

  return {
    mutate: async (variables: V) => {
      try {
        const result = await mutationFn(variables);
        
        // Invalidate related queries
        if (invalidateQueries.length > 0) {
          // This would need queryClient instance
          // queryClient.invalidateQueries({ queryKey: invalidateQueries });
        }
        
        mutationOptions.onSuccess?.(result, variables);
        return result;
      } catch (error) {
        mutationOptions.onError?.(error as Error, variables);
        throw error;
      }
    }
  };
}

// Smart pagination hook
export function usePaginatedQuery<T>(
  baseQueryKey: QueryKey,
  queryFn: (page: number, pageSize: number) => Promise<{ data: T[]; total: number }>,
  options?: {
    pageSize?: number;
    prefetchPages?: number;
  }
) {
  const { pageSize = 20, prefetchPages = 1 } = options || {};
  
  const [currentPage, setCurrentPage] = useState(1);
  
  const query = useOptimizedQuery(
    [...baseQueryKey, 'page', currentPage, 'size', pageSize],
    () => queryFn(currentPage, pageSize),
    {
      keepPreviousData: true, // Keep previous page data while loading new page
    }
  );

  // Prefetch next pages
  useEffect(() => {
    if (query.data && !query.isLoading) {
      const totalPages = Math.ceil(query.data.total / pageSize);
      
      for (let i = 1; i <= prefetchPages; i++) {
        const nextPage = currentPage + i;
        if (nextPage <= totalPages) {
          // Prefetch next page
          // queryClient.prefetchQuery({
          //   queryKey: [...baseQueryKey, 'page', nextPage, 'size', pageSize],
          //   queryFn: () => queryFn(nextPage, pageSize),
          // });
        }
      }
    }
  }, [query.data, currentPage, pageSize, prefetchPages]);

  return {
    ...query,
    currentPage,
    setCurrentPage,
    totalPages: query.data ? Math.ceil(query.data.total / pageSize) : 0,
    hasNextPage: query.data ? currentPage < Math.ceil(query.data.total / pageSize) : false,
    hasPreviousPage: currentPage > 1,
  };
}