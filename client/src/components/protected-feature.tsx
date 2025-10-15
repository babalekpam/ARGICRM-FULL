import { useState, ReactNode } from "react";
import { saasFeatures } from "@/services/saas-features";
import { SubscriptionUpgradeModal } from "@/components/subscription-upgrade-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { isPlatformOwner } from "@/utils/permissions";
import { 
  Lock, 
  Crown, 
  ArrowRight,
  Zap
} from "lucide-react";

interface ProtectedFeatureProps {
  children: ReactNode;
  requiredFeature: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  showUpgradeButton?: boolean;
}

export function ProtectedFeature({ 
  children, 
  requiredFeature, 
  fallbackTitle,
  fallbackDescription,
  showUpgradeButton = true
}: ProtectedFeatureProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { user } = useAuth();
  
  // Platform owners have access to all features
  if (isPlatformOwner(user)) {
    return <>{children}</>;
  }
  
  const hasFeature = saasFeatures.hasFeature(requiredFeature);
  const currentPlan = saasFeatures.getCurrentPlan();
  
  if (hasFeature) {
    return <>{children}</>;
  }

  // Get which plans have this feature
  const availablePlans = saasFeatures.getAllPlans()
    .filter(plan => plan.features.includes(requiredFeature))
    .map(plan => plan.name);

  return (
    <>
      <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-yellow-100">
              <Lock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <CardTitle className="flex items-center justify-center">
            <Crown className="h-5 w-5 mr-2 text-yellow-600" />
            {fallbackTitle || 'Premium Feature'}
          </CardTitle>
          
          <div className="space-y-2">
            <p className="text-gray-600">
              {fallbackDescription || 'This feature requires a higher subscription plan.'}
            </p>
            
            {availablePlans.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-sm text-gray-500">Available in:</span>
                {availablePlans.map((planName, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {planName}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        
        {showUpgradeButton && (
          <CardContent className="text-center">
            <div className="space-y-3">
              <div className="text-sm text-gray-500">
                Current plan: <Badge variant="outline">{currentPlan?.name || 'Unknown'}</Badge>
              </div>
              
              <Button 
                onClick={() => setShowUpgradeModal(true)}
                className="flex items-center mx-auto"
              >
                <Zap className="h-4 w-4 mr-2" />
                Upgrade to Unlock
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <SubscriptionUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        requiredFeature={requiredFeature}
      />
    </>
  );
}

// Higher-order component version
export function withFeatureProtection<T extends object>(
  Component: React.ComponentType<T>,
  requiredFeature: string,
  fallbackProps?: {
    title?: string;
    description?: string;
    showUpgradeButton?: boolean;
  }
) {
  return function ProtectedComponent(props: T) {
    return (
      <ProtectedFeature 
        requiredFeature={requiredFeature}
        fallbackTitle={fallbackProps?.title}
        fallbackDescription={fallbackProps?.description}
        showUpgradeButton={fallbackProps?.showUpgradeButton}
      >
        <Component {...props} />
      </ProtectedFeature>
    );
  };
}