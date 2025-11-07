import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Crown, 
  Check, 
  X, 
  ArrowRight,
  Users,
  Building2,
  Shield,
  Rocket
} from "lucide-react";
import { saasFeatures } from "@/services/saas-features";
import { Link } from "wouter";

interface SubscriptionUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredFeature?: string;
  currentPath?: string;
}

export function SubscriptionUpgradeModal({ 
  isOpen, 
  onClose, 
  requiredFeature,
  currentPath 
}: SubscriptionUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const currentPlan = saasFeatures.getCurrentPlan();
  const allPlans = saasFeatures.getAllPlans();
  
  const getAvailablePlans = () => {
    if (!requiredFeature) return allPlans;
    
    return allPlans.filter(plan => 
      plan.features.includes(requiredFeature) && 
      plan.id !== currentPlan?.id
    );
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter': return Users;
      case 'professional': return Building2;
      case 'enterprise': return Shield;
      case 'unlimited': return Rocket;
      default: return Crown;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'starter': return 'text-gray-600';
      case 'professional': return 'text-blue-600';
      case 'enterprise': return 'text-purple-600';
      case 'unlimited': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      await saasFeatures.changePlan(planId);
      onClose();
      // In a real app, this would redirect to billing or show success
      console.log(`Upgraded to ${planId}`);
    } catch (error) {
      console.error('Upgrade failed:', error);
    }
  };

  const availablePlans = getAvailablePlans();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <Crown className="h-6 w-6 mr-2 text-yellow-600" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            {requiredFeature 
              ? `This feature requires a higher subscription plan. Choose a plan below to unlock this feature.`
              : 'Unlock more features and capabilities with a higher plan.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Plan */}
          {currentPlan && (
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Badge variant="outline" className="mr-2">Current Plan</Badge>
                    {currentPlan.name}
                  </CardTitle>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${currentPlan.price}</div>
                    <div className="text-sm text-gray-500">/user/month</div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Available Upgrade Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePlans.map((plan) => {
              const IconComponent = getPlanIcon(plan.id);
              const isSelected = selectedPlan === plan.id;
              const colorClass = getPlanColor(plan.id);
              
              return (
                <Card 
                  key={plan.id}
                  className={`cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-2 border-blue-500 shadow-lg' 
                      : 'border hover:border-blue-300 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <IconComponent className={`h-6 w-6 mr-2 ${colorClass}`} />
                        <CardTitle>{plan.name}</CardTitle>
                      </div>
                      {plan.isPopular && (
                        <Badge className="bg-blue-600">Popular</Badge>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">${plan.price}</div>
                      <div className="text-sm text-gray-500">/user/month</div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm">
                        <div className="font-medium mb-2">What you get:</div>
                        <div className="space-y-1">
                          {plan.limits.users === -1 ? (
                            <div className="flex items-center text-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Unlimited users
                            </div>
                          ) : (
                            <div className="flex items-center text-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Up to {plan.limits.users} users
                            </div>
                          )}
                          
                          {plan.limits.contacts === -1 ? (
                            <div className="flex items-center text-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Unlimited contacts
                            </div>
                          ) : (
                            <div className="flex items-center text-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              {plan.limits.contacts.toLocaleString()} contacts
                            </div>
                          )}
                          
                          {plan.limits.storage === -1 ? (
                            <div className="flex items-center text-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Unlimited storage
                            </div>
                          ) : (
                            <div className="flex items-center text-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              {plan.limits.storage} GB storage
                            </div>
                          )}

                          {/* Show if this plan has the required feature */}
                          {requiredFeature && plan.features.includes(requiredFeature) && (
                            <div className="flex items-center text-blue-600 font-medium">
                              <Check className="h-3 w-3 mr-1" />
                              Unlocks requested feature
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="text-sm text-gray-500">
              {selectedPlan && (
                <span>
                  Selected: {availablePlans.find(p => p.id === selectedPlan)?.name}
                </span>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              
              <Button asChild variant="outline">
                <Link href="/pricing">
                  View All Plans
                </Link>
              </Button>
              
              {selectedPlan && (
                <Button 
                  onClick={() => handleUpgrade(selectedPlan)}
                  className="flex items-center"
                >
                  Upgrade Now
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}