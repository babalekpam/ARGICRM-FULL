import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  CreditCard, 
  Users, 
  Database, 
  Mail, 
  MessageSquare, 
  FileText, 
  Zap,
  TrendingUp,
  Calendar,
  Settings,
  Crown,
  Check,
  X,
  AlertTriangle,
  ArrowUp,
  Plus
} from "lucide-react";
import Layout from "@/components/layout";
import { useTranslation } from "@/hooks/useTranslation";
import { saasFeatures, subscriptionPlans } from "@/services/saas-features";

export default function SaaSBillingPage() {
  const { t, formatCurrency, formatDate } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentCanceled, setShowPaymentCanceled] = useState(false);
  
  const currentTenant = saasFeatures.getCurrentTenant();
  const currentPlan = saasFeatures.getCurrentPlan();
  const usageMetrics = saasFeatures.getUsageMetrics();
  const subscriptionStatus = saasFeatures.getSubscriptionStatus();

  const usageItems = [
    { 
      key: 'users' as const, 
      label: t('users', 'Users'), 
      icon: Users, 
      unit: '' 
    },
    { 
      key: 'contacts' as const, 
      label: t('contacts', 'Contacts'), 
      icon: Users, 
      unit: '' 
    },
    { 
      key: 'storage' as const, 
      label: t('storage', 'Storage'), 
      icon: Database, 
      unit: 'GB' 
    },
    { 
      key: 'emailsSent' as const, 
      label: t('emailsSent', 'Emails Sent'), 
      icon: Mail, 
      unit: '/month' 
    },
    { 
      key: 'smsSent' as const, 
      label: t('smsSent', 'SMS Sent'), 
      icon: MessageSquare, 
      unit: '/month' 
    },
    { 
      key: 'formsCreated' as const, 
      label: t('formsCreated', 'Forms Created'), 
      icon: FileText, 
      unit: '/month' 
    }
  ];

  const handleUpgrade = async (planId: string) => {
    try {
      // For paid plans, redirect to Stripe checkout
      const plan = subscriptionPlans.find(p => p.id === planId);
      if (plan && plan.price > 0) {
        // Create checkout session
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: planId,
            planName: plan.name,
            price: plan.price,
            billingCycle: plan.billingCycle
          }),
        });
        
        if (response.ok) {
          const { checkoutUrl } = await response.json();
          window.location.href = checkoutUrl;
        } else {
          throw new Error('Failed to create checkout session');
        }
      } else {
        // Free plan - update locally
        await saasFeatures.changePlan(planId);
        setIsUpgradeDialogOpen(false);
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      // Fallback - show payment form modal
      setSelectedPlan(planId);
    }
  };

  // Handle Stripe return URLs
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setShowPaymentSuccess(true);
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
      setShowPaymentCanceled(true);
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'past_due': return 'bg-red-100 text-red-800';
      case 'canceled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Success/Error Messages */}
        {showPaymentSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Payment Successful!</h3>
                <p className="text-green-700">Your subscription has been activated. Welcome to NODE CRM!</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowPaymentSuccess(false)}
              variant="ghost" 
              size="sm" 
              className="mt-2 text-green-700 hover:text-green-800"
            >
              Dismiss
            </Button>
          </div>
        )}

        {showPaymentCanceled && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <X className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-blue-800">Payment Canceled</h3>
                <p className="text-blue-700">No charges were made. You can continue with your trial or try again anytime.</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowPaymentCanceled(false)}
              variant="ghost" 
              size="sm" 
              className="mt-2 text-blue-700 hover:text-blue-800"
            >
              Dismiss
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('subscriptionManagement', 'Subscription Management')}</h1>
            <p className="text-gray-600">{t('manageSubscriptionDesc', 'Manage your subscription plan and billing')}</p>
          </div>
          <div className="flex space-x-2">
            {subscriptionStatus.status === 'trial' && (
              <Button 
                onClick={() => setIsUpgradeDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            )}
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              {t('billingSettings', 'Billing Settings')}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('currentPlan', 'Current Plan')}</span>
                <Crown className="h-5 w-5 text-yellow-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentPlan && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
                    <p className="text-3xl font-bold text-blue-600">
                      {currentPlan.price === 0 ? 'Free' : formatCurrency(currentPlan.price)}
                      {currentPlan.price > 0 && <span className="text-sm text-gray-600">/{currentPlan.billingCycle}</span>}
                    </p>
                  </div>
                  
                  <Badge className={getStatusColor(subscriptionStatus.status)}>
                    {subscriptionStatus.status.charAt(0).toUpperCase() + subscriptionStatus.status.slice(1)}
                  </Badge>

                  {subscriptionStatus.isTrialExpiring && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">
                          {t('trialExpiring', 'Trial expires in')} {subscriptionStatus.daysRemaining} {t('days', 'days')}
                        </span>
                      </div>
                    </div>
                  )}

                  {subscriptionStatus.nextBillingDate && (
                    <div className="text-sm text-gray-600">
                      {t('nextBilling', 'Next billing')}: {formatDate(subscriptionStatus.nextBillingDate)}
                    </div>
                  )}

                  <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <ArrowUp className="h-4 w-4 mr-2" />
                        {t('upgradePlan', 'Upgrade Plan')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{t('choosePlan', 'Choose Your Plan')}</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {subscriptionPlans.filter(plan => !plan.isTrial).map((plan) => (
                          <Card key={plan.id} className={`${plan.isPopular ? 'border-blue-500 shadow-lg' : ''} ${selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''}`}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle>{plan.name}</CardTitle>
                                {plan.isPopular && <Badge className="bg-blue-600">Popular</Badge>}
                              </div>
                              <div className="text-3xl font-bold">
                                {formatCurrency(plan.price)}
                                <span className="text-sm text-gray-600">/{plan.billingCycle}</span>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {plan.features.map((feature, index) => (
                                  <div key={index} className="flex items-center space-x-2">
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">{feature}</span>
                                  </div>
                                ))}
                              </div>
                              <Button 
                                className="w-full mt-4"
                                onClick={() => handleUpgrade(plan.id)}
                                disabled={currentPlan?.id === plan.id}
                              >
                                {currentPlan?.id === plan.id ? t('currentPlan', 'Current Plan') : t('selectPlan', 'Select Plan')}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Overview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                {t('usageOverview', 'Usage Overview')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {usageItems.map((item) => {
                  const usage = saasFeatures.checkLimit(item.key);
                  const Icon = item.icon;
                  
                  return (
                    <div key={item.key} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{usage.current.toLocaleString()}{item.unit}</span>
                          <span className="text-gray-500">
                            {usage.limit === -1 ? '∞' : `${usage.limit.toLocaleString()}${item.unit}`}
                          </span>
                        </div>
                        {usage.limit !== -1 && (
                          <Progress 
                            value={usage.percentage} 
                            className={`h-2 ${usage.exceeded ? 'bg-red-100' : ''}`}
                          />
                        )}
                        {usage.exceeded && (
                          <span className="text-xs text-red-600">{t('limitExceeded', 'Limit exceeded')}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="features" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">{t('planFeatures', 'Plan Features')}</TabsTrigger>
            <TabsTrigger value="billing">{t('billingHistory', 'Billing History')}</TabsTrigger>
            <TabsTrigger value="usage">{t('detailedUsage', 'Detailed Usage')}</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('availableFeatures', 'Available Features')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentPlan?.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('billingHistory', 'Billing History')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Mock billing history */}
                  {[
                    { date: new Date(2025, 4, 1), amount: 79, status: 'paid', invoice: 'INV-2025-001' },
                    { date: new Date(2025, 3, 1), amount: 79, status: 'paid', invoice: 'INV-2025-002' },
                    { date: new Date(2025, 2, 1), amount: 79, status: 'paid', invoice: 'INV-2025-003' }
                  ].map((billing, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <CreditCard className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium">{billing.invoice}</p>
                          <p className="text-sm text-gray-600">{formatDate(billing.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-medium">{formatCurrency(billing.amount)}</span>
                        <Badge className={billing.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {billing.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          {t('download', 'Download')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {usageItems.map((item) => {
                const usage = saasFeatures.checkLimit(item.key);
                const Icon = item.icon;
                
                return (
                  <Card key={item.key}>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Icon className="h-5 w-5 mr-2" />
                        {item.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold">{usage.current.toLocaleString()}</span>
                          <span className="text-gray-500">
                            / {usage.limit === -1 ? '∞' : usage.limit.toLocaleString()} {item.unit}
                          </span>
                        </div>
                        {usage.limit !== -1 && (
                          <Progress value={usage.percentage} className="h-3" />
                        )}
                        <div className="text-sm text-gray-600">
                          {usage.limit === -1 
                            ? t('unlimited', 'Unlimited') 
                            : `${usage.percentage.toFixed(1)}% ${t('used', 'used')}`
                          }
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}