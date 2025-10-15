import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { CreditCard, Lock, Unlock, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import Logo from "@/components/logo";

// Conditional Stripe initialization - only load if key is configured
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface TrialStatus {
  isActive: boolean;
  remainingDays: number | null;
  isExpired: boolean;
  trialEndDate: string | null;
  accountLocked: boolean;
  lockReason?: string;
  daysLocked?: number;
}

interface SubscriptionPlan {
  id: string;
  displayName: string;
  description: string;
  price: string;
  features: string[];
}

function PaymentForm({ selectedPlan, onSuccess }: { selectedPlan: SubscriptionPlan; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const unlockAccountMutation = useMutation({
    mutationFn: async ({ paymentMethodId, planId }: { paymentMethodId: string; planId: string }) => {
      const response = await fetch('/api/unlock-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId, planId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unlock account');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Unlocked! 🎉",
        description: "Welcome back to NODE CRM! Your account is now active.",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Unlock Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) return;
    
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setIsProcessing(true);

    try {
      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Unlock account with payment method
      await unlockAccountMutation.mutateAsync({
        paymentMethodId: paymentMethod.id,
        planId: selectedPlan.id
      });

    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-muted/50">
          <h3 className="font-semibold text-sm mb-2">Selected Plan</h3>
          <div className="flex justify-between items-center">
            <span className="font-medium">{selectedPlan.displayName}</span>
            <Badge variant="outline">${selectedPlan.price}/month</Badge>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Payment Information</label>
          <div className="p-3 border rounded-lg">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing || unlockAccountMutation.isPending}
      >
        {isProcessing || unlockAccountMutation.isPending ? (
          <>
            <CreditCard className="w-4 h-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Unlock className="w-4 h-4 mr-2" />
            Unlock Account - ${selectedPlan.price}/month
          </>
        )}
      </Button>
    </form>
  );
}

export default function UnlockAccount() {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: trialStatus } = useQuery<{ trial: TrialStatus }>({
    queryKey: ['/api/trial/status'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  const { data: plans } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription/plans'],
  });

  useEffect(() => {
    // If account is not locked, redirect to dashboard
    if (trialStatus && !trialStatus.trial.accountLocked && !trialStatus.trial.isExpired) {
      setLocation('/dashboard');
    }
  }, [trialStatus, setLocation]);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
  };

  const handleUnlockSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/trial/status'] });
    setLocation('/dashboard');
  };

  if (!trialStatus || !plans) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const trial = trialStatus.trial;
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <Logo size="lg" variant="colored" />
          </div>
          <div className="flex justify-center">
            <div className="p-3 bg-red-100 rounded-full">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Account Access Required</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {trial.accountLocked 
              ? `Your account has been locked for ${trial.daysLocked} days due to ${trial.lockReason?.replace('_', ' ')}. Add payment information to restore full access.`
              : 'Your free trial has expired. Choose a plan to continue using NODE CRM with all its powerful features.'
            }
          </p>
        </div>

        {/* Trial Status Alert */}
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            {trial.isExpired ? (
              <>Trial expired on {new Date(trial.trialEndDate || '').toLocaleDateString()}</>
            ) : (
              <>
                {trial.remainingDays} day{trial.remainingDays !== 1 ? 's' : ''} remaining in trial
              </>
            )}
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Plan Selection */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Choose Your Plan</h2>
            <div className="space-y-3">
              {plans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`cursor-pointer transition-all ${
                    selectedPlanId === plan.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{plan.displayName}</CardTitle>
                        <CardDescription className="mt-1">{plan.description}</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${plan.price}</div>
                        <div className="text-sm text-muted-foreground">/month</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      {plan.features.slice(0, 4).map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 4 && (
                        <li className="text-muted-foreground">
                          +{plan.features.length - 4} more features
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Payment Information</h2>
            {selectedPlan ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Secure Payment
                  </CardTitle>
                  <CardDescription>
                    Your payment information is encrypted and secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Elements stripe={stripePromise}>
                    <PaymentForm 
                      selectedPlan={selectedPlan}
                      onSuccess={handleUnlockSuccess}
                    />
                  </Elements>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a plan to continue with payment</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center text-sm text-muted-foreground">
          <p>🔒 Your payment is secured with 256-bit SSL encryption</p>
          <p>💳 We accept all major credit cards through Stripe</p>
        </div>
      </div>
    </div>
  );
}