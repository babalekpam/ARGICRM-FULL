import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import OnboardingWizard from "@/components/onboarding-wizard";
import { useToast } from "@/hooks/use-toast";

interface OnboardingData {
  personalInfo: {
    firstName: string;
    lastName: string;
    jobTitle: string;
    phone: string;
  };
  companyInfo: {
    companyName: string;
    industry: string;
    companySize: string;
    website: string;
    address: string;
  };
  businessGoals: {
    primaryGoals: string[];
    expectedUsers: string;
    currentChallenges: string;
    timeline: string;
  };
  teamSetup: {
    inviteTeam: boolean;
    teamMembers: Array<{
      name: string;
      email: string;
      role: string;
    }>;
  };
  preferences: {
    timezone: string;
    currency: string;
    language: string;
    notifications: {
      email: boolean;
      sms: boolean;
      browser: boolean;
    };
  };
}

export default function OnboardingPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Check if user has already completed onboarding
  const { data: progress } = useQuery({
    queryKey: ['/api/onboarding/progress'],
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      return apiRequest('POST', '/api/onboarding/complete', { data });
    },
    onSuccess: async (response: Response) => {
      const result = await response.json();
      console.log('Onboarding completed:', result);
      
      toast({
        title: "Welcome to NODE CRM!",
        description: `Setup complete! ${result.result?.teamInvitesSent > 0 ? `${result.result.teamInvitesSent} team invitations sent.` : 'Redirecting to dashboard...'}`,
      });

      localStorage.setItem('onboardingCompleted', 'true');

      // Immediate redirect to dashboard using both methods for reliability
      console.log('Redirecting to dashboard...');
      window.location.href = '/dashboard';
      setLocation('/dashboard');
    },
    onError: (error) => {
      console.error('Onboarding completion error:', error);
      toast({
        title: "Setup Error",
        description: "There was an issue completing your setup. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Save progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async ({ step, data }: { step: number; data: Partial<OnboardingData> }) => {
      return apiRequest('POST', '/api/onboarding/save-progress', { step, data });
    },
    onSuccess: () => {
      console.log('Progress saved successfully');
    },
    onError: (error) => {
      console.error('Save progress error:', error);
    }
  });

  const handleComplete = (data: OnboardingData) => {
    completeOnboardingMutation.mutate(data);
  };

  const handleSkip = () => {
    toast({
      title: "Setup Skipped",
      description: "You can complete the setup later from your dashboard settings.",
    });
    setLocation('/dashboard');
  };

  // Auto-save progress as user navigates through steps
  const handleStepChange = (step: number, stepData: Partial<OnboardingData>) => {
    saveProgressMutation.mutate({ step, data: stepData });
  };

  // Redirect if already completed
  useEffect(() => {
    // progress is undefined since we removed the query
    // We'll check localStorage instead
    const isCompleted = localStorage.getItem('onboardingCompleted') === 'true';
    if (isCompleted) {
      setLocation('/dashboard');
    }
  }, [setLocation]);

  return (
    <div className="min-h-screen">
      <OnboardingWizard 
        onComplete={handleComplete}
        onSkip={handleSkip}
      />
    </div>
  );
}