import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Rocket, Clock, Users, Target } from "lucide-react";

interface OnboardingTriggerProps {
  userRole?: string;
  onDismiss?: () => void;
}

export default function OnboardingTrigger({ userRole = "demo_admin", onDismiss }: OnboardingTriggerProps) {
  const [location, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding before
    const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
    const hasSeenOnboardingPrompt = localStorage.getItem('onboardingPromptSeen');
    
    // Show onboarding trigger for new users who haven't completed it
    if (!hasCompletedOnboarding && !hasSeenOnboardingPrompt) {
      setIsVisible(true);
    }
  }, []);

  const handleStartOnboarding = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Start onboarding clicked, attempting navigation...');
    
    // Use immediate browser navigation for reliability
    window.location.href = '/onboarding';
  };

  const handleDismiss = () => {
    localStorage.setItem('onboardingPromptSeen', 'true');
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-sm opacity-30"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-2">
                <Rocket className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-lg">Welcome to NODE CRM!</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Let's get your CRM set up in just a few minutes
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">5 minutes</p>
                <p className="text-xs text-gray-500">Quick setup</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Team ready</p>
                <p className="text-xs text-gray-500">Invite your team</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Personalized</p>
                <p className="text-xs text-gray-500">Tailored to your goals</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                New User
              </Badge>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Complete setup to unlock all features
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleDismiss}>
                Maybe Later
              </Button>
              <Button 
                onClick={handleStartOnboarding}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                type="button"
              >
                <Rocket className="mr-2 h-4 w-4" />
                Start Setup
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}