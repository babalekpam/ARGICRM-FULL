import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Clock, AlertTriangle } from "lucide-react";
import { useTrial } from "@/hooks/use-trial";

export default function TrialBanner() {
  const { isTrialActive, daysRemaining, trialData } = useTrial();
  const [isVisible, setIsVisible] = useState(true);

  if (!isTrialActive || !isVisible || !trialData) {
    return null;
  }

  const urgencyLevel = daysRemaining <= 3 ? 'high' : daysRemaining <= 7 ? 'medium' : 'low';
  
  const getBannerColor = () => {
    switch (urgencyLevel) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const getIcon = () => {
    switch (urgencyLevel) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getMessage = () => {
    if (daysRemaining === 0) {
      return "Your trial expires today! Upgrade now to continue using ARGILETTE CRM.";
    } else if (daysRemaining === 1) {
      return "Your trial expires tomorrow! Upgrade now to avoid service interruption.";
    } else if (urgencyLevel === 'high') {
      return `Only ${daysRemaining} days left in your trial! Upgrade now to continue.`;
    } else {
      return `${daysRemaining} days remaining in your free trial.`;
    }
  };

  return (
    <Alert className={`${getBannerColor()} border-l-4`}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <AlertDescription className="font-medium">
            {getMessage()}
          </AlertDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            className="h-8"
            onClick={() => window.location.href = '/pricing'}
          >
            Upgrade Now
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}