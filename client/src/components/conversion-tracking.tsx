import { useEffect } from 'react';
import { trackCrmSignupAction, trackBusinessAction } from './tracking-scripts';

interface ConversionTrackingProps {
  eventType: 'page_view' | 'form_start' | 'form_complete' | 'demo_request' | 'pricing_view';
  eventData?: Record<string, any>;
  value?: number;
}

export const ConversionTracking = ({ eventType, eventData, value }: ConversionTrackingProps) => {
  useEffect(() => {
    const trackEvent = () => {
      switch (eventType) {
        case 'page_view':
          // Page view tracking is handled automatically by TrackingScripts
          break;
        case 'form_start':
          trackBusinessAction('FormStarted', eventData);
          break;
        case 'form_complete':
          trackCrmSignupAction('trial_signup', value);
          trackBusinessAction('FormCompleted', eventData);
          break;
        case 'demo_request':
          trackCrmSignupAction('demo_request', value || 200);
          trackBusinessAction('DemoRequested', eventData);
          break;
        case 'pricing_view':
          trackBusinessAction('PricingViewed', eventData);
          break;
      }
    };

    // Small delay to ensure tracking scripts are loaded
    setTimeout(trackEvent, 500);
  }, [eventType, eventData, value]);

  return null;
};

// Hook for programmatic tracking
export const useConversionTracking = () => {
  const trackConversion = (eventType: string, eventData?: Record<string, any>, value?: number) => {
    setTimeout(() => {
      switch (eventType) {
        case 'signup_completed':
          trackCrmSignupAction('trial_signup', value);
          break;
        case 'demo_requested':
          trackCrmSignupAction('demo_request', value || 200);
          break;
        case 'consultation_booked':
          trackCrmSignupAction('consultation_request', value || 300);
          break;
        case 'enterprise_inquiry':
          trackCrmSignupAction('enterprise_inquiry', value || 1000);
          break;
        default:
          trackBusinessAction(eventType, eventData);
      }
    }, 100);
  };

  return { trackConversion };
};

export default ConversionTracking;