import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, X, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";


interface TrialStatus {
  isActive: boolean;
  remainingDays: number | null;
  isExpired: boolean;
  trialEndDate: string | null;
  accountLocked: boolean;
  lockReason?: string;
  daysLocked?: number;
}

export default function TrialWarningBanner() {
  const [dismissed, setDismissed] = useState(false);

  const { data: trialData } = useQuery<{ trial: TrialStatus }>({
    queryKey: ['/api/trial/status'],
    refetchInterval: 60000, // Check every minute
    retry: false,
  });

  // Reset dismissed state when trial status changes
  useEffect(() => {
    if (trialData?.trial.remainingDays !== null) {
      setDismissed(false);
    }
  }, [trialData?.trial.remainingDays]);

  if (!trialData || dismissed) {
    return null;
  }

  const trial = trialData.trial;

  // Don't show banner if account is locked (user should be redirected to unlock page)
  if (trial.accountLocked) {
    return null;
  }

  // Don't show banner if trial is not active or has plenty of time left
  if (!trial.isActive || (trial.remainingDays !== null && trial.remainingDays > 7)) {
    return null;
  }

  const handleUpgradeClick = () => {
    window.location.href = '/pricing';
  };

  const getBannerConfig = (remainingDays: number | null) => {
    if (remainingDays === null) return null;
    
    if (remainingDays === 0) {
      return {
        variant: "destructive" as const,
        icon: AlertTriangle,
        title: "Trial Expires Today!",
        description: "Your trial expires today. Upgrade now to avoid account restrictions.",
        urgency: "critical"
      };
    } else if (remainingDays === 1) {
      return {
        variant: "destructive" as const,
        icon: AlertTriangle,
        title: "Trial Expires Tomorrow",
        description: "Only 1 day left in your free trial. Upgrade to continue using all features.",
        urgency: "high"
      };
    } else if (remainingDays <= 3) {
      return {
        variant: "default" as const,
        icon: Clock,
        title: `${remainingDays} Days Left`,
        description: `Your trial expires in ${remainingDays} days. Consider upgrading to avoid interruption.`,
        urgency: "medium"
      };
    } else if (remainingDays <= 7) {
      return {
        variant: "default" as const,
        icon: Clock,
        title: `${remainingDays} Days Remaining`,
        description: `You have ${remainingDays} days left in your free trial.`,
        urgency: "low"
      };
    }
    
    return null;
  };

  const config = getBannerConfig(trial.remainingDays);
  
  if (!config) {
    return null;
  }

  const IconComponent = config.icon;

  return (
    <div className="relative">
      <Alert variant={config.variant} className="border-l-4 border-l-amber-500 bg-amber-50 border-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IconComponent className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-semibold text-amber-800">{config.title}</h4>
                <Badge 
                  variant={config.urgency === 'critical' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {trial.remainingDays === 0 ? 'EXPIRES TODAY' : 
                   trial.remainingDays === 1 ? 'EXPIRES TOMORROW' : 
                   `${trial.remainingDays} DAYS LEFT`}
                </Badge>
              </div>
              <AlertDescription className="text-amber-700">
                {config.description}
              </AlertDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleUpgradeClick}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <CreditCard className="w-4 h-4 mr-1" />
              Upgrade Now
            </Button>
            
            {config.urgency !== 'critical' && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setDismissed(true)}
                className="text-amber-600 hover:bg-amber-100"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Alert>
    </div>
  );
}