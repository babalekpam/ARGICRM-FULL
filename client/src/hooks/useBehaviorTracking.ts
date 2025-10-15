import { useEffect, useCallback } from 'react';
import { behaviorAnalytics } from '@/services/behavior-analytics';

interface UseBehaviorTrackingOptions {
  userId: string;
  enableAutoTracking?: boolean;
  trackPageViews?: boolean;
  trackClicks?: boolean;
  trackFormSubmissions?: boolean;
}

export function useBehaviorTracking({
  userId,
  enableAutoTracking = true,
  trackPageViews = true,
  trackClicks = true,
  trackFormSubmissions = true
}: UseBehaviorTrackingOptions) {
  
  // Manual tracking function
  const trackAction = useCallback((action: string, context?: Record<string, any>) => {
    behaviorAnalytics.trackAction(userId, action, context);
  }, [userId]);

  // Track page views
  useEffect(() => {
    if (enableAutoTracking && trackPageViews) {
      const path = window.location.pathname;
      trackAction('page_view', { path });
    }
  }, [enableAutoTracking, trackPageViews, trackAction]);

  // Set up click tracking
  useEffect(() => {
    if (!enableAutoTracking || !trackClicks) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const className = target.className;
      const id = target.id;
      
      // Track button clicks
      if (tagName === 'button' || target.closest('button')) {
        const button = target.closest('button') || target;
        const buttonText = button.textContent?.trim() || 'unknown';
        trackAction('button_click', { 
          buttonText, 
          className: button.className,
          id: button.id 
        });
      }
      
      // Track link clicks
      if (tagName === 'a' || target.closest('a')) {
        const link = target.closest('a') || target;
        trackAction('link_click', { 
          href: (link as HTMLAnchorElement).href,
          text: link.textContent?.trim() 
        });
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [enableAutoTracking, trackClicks, trackAction]);

  // Set up form submission tracking
  useEffect(() => {
    if (!enableAutoTracking || !trackFormSubmissions) return;

    const handleSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement;
      const formName = form.name || form.id || 'unnamed_form';
      const formData = new FormData(form);
      const fields = Array.from(formData.keys());
      
      trackAction('form_submit', { 
        formName, 
        fields,
        fieldCount: fields.length 
      });
    };

    document.addEventListener('submit', handleSubmit);
    return () => document.removeEventListener('submit', handleSubmit);
  }, [enableAutoTracking, trackFormSubmissions, trackAction]);

  // Initialize sample data for demo purposes
  useEffect(() => {
    behaviorAnalytics.initializeSampleData(userId);
  }, [userId]);

  return {
    trackAction,
    getUserInsights: () => behaviorAnalytics.getUserInsights(userId),
    getUserPatterns: () => behaviorAnalytics.getUserPatterns(userId),
    getUserActions: (limit?: number) => behaviorAnalytics.getUserActions(userId, limit)
  };
}

// Specialized hooks for common tracking scenarios
export function useFormTracking(userId: string, formName: string) {
  const { trackAction } = useBehaviorTracking({ userId, enableAutoTracking: false });
  
  const trackFormStart = useCallback(() => {
    trackAction('form_start', { formName });
  }, [trackAction, formName]);
  
  const trackFormFieldFocus = useCallback((fieldName: string) => {
    trackAction('form_field_focus', { formName, fieldName });
  }, [trackAction, formName]);
  
  const trackFormFieldComplete = useCallback((fieldName: string, value?: any) => {
    trackAction('form_field_complete', { formName, fieldName, hasValue: !!value });
  }, [trackAction, formName]);
  
  const trackFormValidationError = useCallback((fieldName: string, error: string) => {
    trackAction('form_validation_error', { formName, fieldName, error });
  }, [trackAction, formName]);
  
  const trackFormSubmit = useCallback((success: boolean, data?: Record<string, any>) => {
    trackAction('form_submit', { formName, success, ...data });
  }, [trackAction, formName]);
  
  return {
    trackFormStart,
    trackFormFieldFocus,
    trackFormFieldComplete,
    trackFormValidationError,
    trackFormSubmit
  };
}

export function useFeatureTracking(userId: string) {
  const { trackAction } = useBehaviorTracking({ userId, enableAutoTracking: false });
  
  const trackFeatureUsage = useCallback((featureName: string, context?: Record<string, any>) => {
    trackAction(`feature_use_${featureName}`, context);
  }, [trackAction]);
  
  const trackFeatureDiscovery = useCallback((featureName: string) => {
    trackAction(`feature_discover_${featureName}`);
  }, [trackAction]);
  
  const trackFeatureSuccess = useCallback((featureName: string, outcome?: string) => {
    trackAction(`feature_success_${featureName}`, { outcome });
  }, [trackAction]);
  
  const trackFeatureAbandonment = useCallback((featureName: string, reason?: string) => {
    trackAction(`feature_abandon_${featureName}`, { reason });
  }, [trackAction]);
  
  return {
    trackFeatureUsage,
    trackFeatureDiscovery,
    trackFeatureSuccess,
    trackFeatureAbandonment
  };
}