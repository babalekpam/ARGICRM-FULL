import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { VirtualScroller } from '@/lib/performance';

interface UseVirtualizedListProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualizedList({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: UseVirtualizedListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate visible items
  const visibleItems = useMemo(() => {
    return VirtualScroller.calculateVisibleItems(
      containerHeight,
      itemHeight,
      scrollTop,
      items.length,
      overscan
    );
  }, [containerHeight, itemHeight, scrollTop, items.length, overscan]);

  // Get visible data
  const visibleData = useMemo(() => {
    return items.slice(visibleItems.startIndex, visibleItems.endIndex);
  }, [items, visibleItems.startIndex, visibleItems.endIndex]);

  // Handle scroll with throttling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Scroll to specific item
  const scrollToItem = useCallback((index: number) => {
    if (scrollElementRef.current) {
      const scrollTop = index * itemHeight;
      scrollElementRef.current.scrollTop = scrollTop;
      setScrollTop(scrollTop);
    }
  }, [itemHeight]);

  return {
    scrollElementRef,
    visibleData,
    visibleItems,
    totalHeight: items.length * itemHeight,
    offsetY: visibleItems.offsetY,
    handleScroll,
    scrollToItem,
  };
}

// Hook for infinite scrolling with performance optimization
export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  threshold = 100
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  threshold?: number;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (
          entry.isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          fetchNextPage();
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, threshold]);

  return { sentinelRef };
}

// Hook for optimized search with debouncing
export function useOptimizedSearch(
  initialQuery: string = '',
  searchFn: (query: string) => void,
  debounceMs: number = 300
) {
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedSearch = useCallback(
    (searchQuery: string) => {
      setIsSearching(true);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        searchFn(searchQuery);
        setIsSearching(false);
      }, debounceMs);
    },
    [searchFn, debounceMs]
  );

  useEffect(() => {
    debouncedSearch(query);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, debouncedSearch]);

  return {
    query,
    setQuery,
    isSearching,
  };
}

// Hook for optimized table data
export function useOptimizedTable<T>(
  data: T[],
  pageSize: number = 20
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Memoized sorted data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Memoized paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = useCallback((key: keyof T) => {
    setSortConfig((prevConfig) => {
      if (prevConfig?.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
    setCurrentPage(1); // Reset to first page when sorting
  }, []);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  return {
    paginatedData,
    currentPage,
    setCurrentPage,
    sortConfig,
    handleSort,
    totalPages,
    totalItems: sortedData.length,
  };
}