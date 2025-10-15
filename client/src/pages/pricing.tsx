import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Building2, Infinity } from "lucide-react";
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from "@shared/subscription-plans";
import { useLocation } from "wouter";

const planIcons: Record<SubscriptionPlan, any> = {
  free: Zap,
  individual: Zap,
  business: Building2,
  enterprise: Building2,
  lifetime: Crown,
};

const planColors: Record<SubscriptionPlan, string> = {
  free: "default",
  individual: "default",
  business: "default", 
  enterprise: "default",
  lifetime: "default",
};

export default function Pricing() {
  const [, setLocation] = useLocation();

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan === 'free') {
      setLocation('/');
    } else {
      setLocation(`/subscribe?plan=${plan}`);
    }
  };

  const plans: SubscriptionPlan[] = ['individual', 'business', 'enterprise', 'lifetime'];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Unlock powerful SEO analytics and AI-powered insights to grow your organic traffic
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {plans.map((planKey) => {
          const plan = SUBSCRIPTION_PLANS[planKey];
          const Icon = planIcons[planKey];
          const isLifetime = plan.billingCycle === 'lifetime';
          const isMostPopular = planKey === 'business';

          return (
            <Card 
              key={planKey} 
              className={`relative flex flex-col ${isMostPopular ? 'border-primary shadow-lg' : ''}`}
              data-testid={`card-plan-${planKey}`}
            >
              {isMostPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" data-testid="badge-popular">
                  Most Popular
                </Badge>
              )}
              {isLifetime && (
                <div className="absolute -top-3 right-4">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle data-testid={`text-plan-name-${planKey}`}>{plan.displayName}</CardTitle>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold" data-testid={`text-price-${planKey}`}>
                    ${plan.price}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {isLifetime ? 'one-time' : '/year'}
                  </span>
                </div>
                <CardDescription>
                  {isLifetime && 'Pay once, use forever'}
                  {planKey === 'individual' && 'Perfect for solo marketers'}
                  {planKey === 'business' && 'For growing teams'}
                  {planKey === 'enterprise' && 'Advanced SEO at scale'}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{plan.features.maxProjects === 9999 ? 'Unlimited' : plan.features.maxProjects} Projects</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{plan.features.maxKeywords === 9999 ? 'Unlimited' : plan.features.maxKeywords} Keywords</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{plan.features.maxCompetitors === 9999 ? 'Unlimited' : plan.features.maxCompetitors} Competitors</span>
                  </li>
                  {plan.features.aiInsights && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">AI Insights</span>
                    </li>
                  )}
                  {plan.features.aiAnalysis && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">AI Analysis Tools</span>
                    </li>
                  )}
                  {plan.features.seoAudit && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">SEO Audit</span>
                    </li>
                  )}
                  {plan.features.backlinks && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">Backlink Monitoring</span>
                    </li>
                  )}
                  {plan.features.prioritySupport && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">Priority Support</span>
                    </li>
                  )}
                  {plan.features.customReports && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">Custom Reports</span>
                    </li>
                  )}
                  {plan.features.apiAccess && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">API Access</span>
                    </li>
                  )}
                </ul>
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={isMostPopular ? "default" : "outline"}
                  onClick={() => handleSelectPlan(planKey)}
                  data-testid={`button-select-${planKey}`}
                >
                  {isLifetime ? (
                    <>
                      <Infinity className="mr-2 h-4 w-4" />
                      Get Lifetime Access
                    </>
                  ) : (
                    'Get Started'
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          All plans include 30-day money-back guarantee. No questions asked.
        </p>
      </div>
    </div>
  );
}
