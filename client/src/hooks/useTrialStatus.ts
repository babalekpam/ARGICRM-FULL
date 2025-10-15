import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function useTrialStatus() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: trialStatus, isLoading } = useQuery({
    queryKey: ["/api/subscription/trial-status"],
    enabled: user?.role === 'demo_admin',
    refetchInterval: 30000, // Check every 30 seconds
    retry: false,
  });

  // Monitor trial expiration
  useEffect(() => {
    if (trialStatus?.trialExpired) {
      // Show notification and redirect to subscription page
      toast({
        title: "Trial Expired",
        description: "Your 15-day trial has ended. Please subscribe to continue.",
        variant: "destructive",
        duration: 5000,
      });

      // Auto-logout after showing message
      setTimeout(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_email');
        window.location.href = '/';
      }, 3000);
    } else if (trialStatus && trialStatus.daysRemaining <= 3 && trialStatus.daysRemaining > 0) {
      // Show warning for last 3 days (only once per session)
      const warningShown = sessionStorage.getItem(`trial-warning-${trialStatus.daysRemaining}`);
      if (!warningShown) {
        toast({
          title: "Trial Ending Soon",
          description: `Only ${trialStatus.daysRemaining} ${trialStatus.daysRemaining === 1 ? 'day' : 'days'} left in your trial. Upgrade now!`,
          variant: "default",
          duration: 8000,
        });
        sessionStorage.setItem(`trial-warning-${trialStatus.daysRemaining}`, 'true');
      }
    }
  }, [trialStatus, toast]);

  return {
    trialStatus,
    isLoading,
    daysRemaining: trialStatus?.daysRemaining || 0,
    trialExpired: trialStatus?.trialExpired || false,
    subscriptionStatus: trialStatus?.subscriptionStatus || 'unknown'
  };
}