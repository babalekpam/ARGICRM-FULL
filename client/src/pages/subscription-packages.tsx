import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  XCircle, 
  Star, 
  Users, 
  Mail, 
  MessageSquare, 
  BarChart3, 
  Zap,
  Crown,
  Rocket,
  TrendingUp
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  price: string;
  billingCycle: string;
  features: string[];
  limits: {
    users: number;
    contacts: number;
    storage: number;
    emails: number;
    sms: number;
    forms: number;
    apiCalls: number;
  };
  isActive: boolean;
  sortOrder: number;
}

interface UserSubscriptionDetails {
  subscription?: any;
  plan?: SubscriptionPlan;
  features?: any[];
  limits?: any;
  usage?: Record<string, any>;
}

export default function SubscriptionPackagesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  // Fetch all subscription plans
  const { data: plans = [], isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription/plans"],
  });

  // Fetch user's current subscription details
  const { data: userDetails, isLoading: userLoading } = useQuery<UserSubscriptionDetails>({
    queryKey: ["/api/subscription/user/details"],
  });

  // Change plan mutation
  const changePlanMutation = useMutation({
    mutationFn: async (newPlanId: string) => {
      return apiRequest("PATCH", "/api/subscription/change-plan", { newPlanId });
    },
    onSuccess: () => {
      toast({
        title: "Plan Updated!",
        description: "Your subscription plan has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/user/details"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update subscription plan",
        variant: "destructive",
      });
    },
  });

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter': return <Rocket className="h-6 w-6" />;
      case 'professional': return <TrendingUp className="h-6 w-6" />;
      case 'enterprise': return <Star className="h-6 w-6" />;
      case 'ultimate': return <Crown className="h-6 w-6" />;
      default: return <Zap className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'starter': return 'bg-green-500';
      case 'professional': return 'bg-blue-500';
      case 'enterprise': return 'bg-purple-500';
      case 'ultimate': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getPlanBadge = (planId: string) => {
    switch (planId) {
      case 'starter': return { text: 'Getting Started', color: 'bg-green-100 text-green-700' };
      case 'professional': return { text: 'Most Popular', color: 'bg-blue-100 text-blue-700' };
      case 'enterprise': return { text: 'Best Value', color: 'bg-purple-100 text-purple-700' };
      case 'ultimate': return { text: 'Premium', color: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700' };
      default: return { text: '', color: '' };
    }
  };

  const formatLimit = (value: number, unit: string) => {
    if (value === -1) return 'Unlimited';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M ${unit}`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K ${unit}`;
    return `${value} ${unit}`;
  };

  const getUsagePercentage = (usage: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((usage / limit) * 100, 100);
  };

  const handlePlanChange = (planId: string) => {
    if (userDetails?.plan?.id === planId) {
      toast({
        title: "Current Plan",
        description: "You're already on this plan.",
      });
      return;
    }

    changePlanMutation.mutate(planId);
  };

  if (plansLoading || userLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Subscription Packages
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan for your business needs. All plans include our core CRM features with varying limits and advanced capabilities.
          </p>
        </div>

        {/* Current Plan Overview */}
        {userDetails && (
          <Card className="mb-8 border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`p-2 rounded-lg text-white ${getPlanColor(userDetails.plan?.id || 'starter')}`}>
                  {getPlanIcon(userDetails.plan?.id || 'starter')}
                </div>
                <div>
                  <div className="text-xl font-bold">Current Plan: {userDetails.plan?.displayName}</div>
                  <div className="text-sm text-gray-600">${userDetails.plan?.price}/month</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Usage Statistics */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Usage This Month</h3>
                  {Object.entries(userDetails.usage || {}).map(([metric, data]: [string, any]) => (
                    <div key={metric} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{metric}</span>
                        <span>{data.usage} / {formatLimit(data.limit, '')}</span>
                      </div>
                      <Progress 
                        value={getUsagePercentage(data.usage, data.limit)} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>

                {/* Plan Limits */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800">Plan Limits</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Users:</span>
                      <span>{formatLimit(userDetails.limits?.users || 0, 'users')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contacts:</span>
                      <span>{formatLimit(userDetails.limits?.contacts || 0, 'contacts')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Storage:</span>
                      <span>{formatLimit(userDetails.limits?.storage || 0, 'GB')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Emails:</span>
                      <span>{formatLimit(userDetails.limits?.emails || 0, 'emails')}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button className="w-full" variant="outline">
                      View Billing History
                    </Button>
                    <Button className="w-full" variant="outline">
                      Manage Payment Method
                    </Button>
                    <Button className="w-full" variant="outline">
                      Download Invoice
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan: SubscriptionPlan) => {
            const badge = getPlanBadge(plan.id);
            const isCurrentPlan = userDetails?.plan?.id === plan.id;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-300 hover:shadow-xl ${
                  isCurrentPlan ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-lg'
                } ${plan.id === 'professional' ? 'scale-105 ring-2 ring-blue-200' : ''}`}
              >
                {badge.text && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className={badge.color}>
                      {badge.text}
                    </Badge>
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-green-100 text-green-700">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto p-3 rounded-lg text-white ${getPlanColor(plan.id)} mb-4`}>
                    {getPlanIcon(plan.id)}
                  </div>
                  <CardTitle className="text-2xl font-bold">
                    {plan.displayName}
                  </CardTitle>
                  <div className="text-3xl font-bold text-gray-900">
                    ${plan.price}
                    <span className="text-base font-normal text-gray-600">/month</span>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Key Limits */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>Users</span>
                      </div>
                      <span className="font-medium">{formatLimit(plan.limits.users, '')}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-gray-500" />
                        <span>Contacts</span>
                      </div>
                      <span className="font-medium">{formatLimit(plan.limits.contacts, '')}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>Monthly Emails</span>
                      </div>
                      <span className="font-medium">{formatLimit(plan.limits.emails, '')}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                        <span>Monthly SMS</span>
                      </div>
                      <span className="font-medium">{formatLimit(plan.limits.sms, '')}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-gray-800">Key Features:</h4>
                    <div className="space-y-1">
                      {plan.features.slice(0, 4).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {plan.features.length > 4 && (
                        <div className="text-xs text-gray-500 mt-1">
                          +{plan.features.length - 4} more features
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    className={`w-full ${
                      isCurrentPlan 
                        ? 'bg-gray-100 text-gray-600 cursor-default' 
                        : plan.id === 'professional'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                          : ''
                    }`}
                    onClick={() => handlePlanChange(plan.id)}
                    disabled={isCurrentPlan || changePlanMutation.isPending}
                  >
                    {changePlanMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Updating...
                      </div>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : userDetails?.plan?.id && userDetails.plan && plans.findIndex((p: SubscriptionPlan) => p.id === userDetails.plan.id) < plans.findIndex((p: SubscriptionPlan) => p.id === plan.id) ? (
                      'Upgrade Plan'
                    ) : (
                      'Select Plan'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                Detailed Feature Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Features</th>
                      {plans.map((plan: SubscriptionPlan) => (
                        <th key={plan.id} className="text-center p-4 font-semibold">
                          {plan.displayName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Users', key: 'users' },
                      { name: 'Contacts', key: 'contacts' },
                      { name: 'Storage (GB)', key: 'storage' },
                      { name: 'Monthly Emails', key: 'emails' },
                      { name: 'Monthly SMS', key: 'sms' },
                      { name: 'Forms', key: 'forms' },
                      { name: 'API Calls/Month', key: 'apiCalls' },
                    ].map((feature) => (
                      <tr key={feature.key} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{feature.name}</td>
                        {plans.map((plan: SubscriptionPlan) => (
                          <td key={plan.id} className="text-center p-4">
                            {formatLimit(plan.limits[feature.key as keyof typeof plan.limits], '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}