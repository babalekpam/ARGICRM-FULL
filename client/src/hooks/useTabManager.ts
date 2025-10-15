import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseTabManagerOptions {
  defaultTab: string;
  queryInvalidationKeys?: string[][];
  onTabChange?: (tab: string) => void;
  persistKey?: string; // For persisting tab state in localStorage
}

export function useTabManager(options: UseTabManagerOptions) {
  const { defaultTab, queryInvalidationKeys = [], onTabChange, persistKey } = options;
  const queryClient = useQueryClient();

  // Initialize tab state with persistence support
  const [activeTab, setActiveTabState] = useState(() => {
    if (persistKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`tab-${persistKey}`);
      return saved || defaultTab;
    }
    return defaultTab;
  });

  // Enhanced tab change handler
  const setActiveTab = useCallback((newTab: string) => {
    setActiveTabState(newTab);
    
    // Persist tab state if key provided
    if (persistKey && typeof window !== 'undefined') {
      localStorage.setItem(`tab-${persistKey}`, newTab);
    }
    
    // Invalidate relevant queries when tab changes
    if (queryInvalidationKeys.length > 0) {
      queryInvalidationKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
    }
    
    // Call custom handler if provided
    if (onTabChange) {
      onTabChange(newTab);
    }
  }, [queryClient, queryInvalidationKeys, onTabChange, persistKey]);

  // Reset to default tab
  const resetTab = useCallback(() => {
    setActiveTab(defaultTab);
  }, [defaultTab, setActiveTab]);

  // Clear persistence
  const clearPersistence = useCallback(() => {
    if (persistKey && typeof window !== 'undefined') {
      localStorage.removeItem(`tab-${persistKey}`);
    }
  }, [persistKey]);

  return {
    activeTab,
    setActiveTab,
    resetTab,
    clearPersistence
  };
}