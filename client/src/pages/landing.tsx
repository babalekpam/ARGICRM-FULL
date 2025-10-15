import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, TrendingUp, Search, Sparkles, Shield, Zap, 
  Link as LinkIcon, FileText, Megaphone, MapPin, Share2,
  Code, CheckCircle2, Crown, DollarSign, Infinity, ArrowRight,
  X
} from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const features = [
    {
      icon: Search,
      title: "Keyword Research",
      description: "Find profitable keywords with search volume, difficulty, and ranking opportunities"
    },
    {
      icon: TrendingUp,
      title: "Traffic Analytics",
      description: "Monitor organic traffic trends and identify growth opportunities"
    },
    {
      icon: LinkIcon,
      title: "AI Backlink Analysis",
      description: "Generate 20-100 realistic backlinks instantly - FREE with AI (vs $100/mo APIs)"
    },
    {
      icon: BarChart3,
      title: "Competitor Tracking",
      description: "Monitor up to 3 competitors and discover their ranking strategies"
    },
    {
      icon: FileText,
      title: "Technical SEO Audit",
      description: "Identify and fix critical SEO issues with AI-powered prioritization"
    },
    {
      icon: Sparkles,
      title: "AI Insights & Chat",
      description: "Get personalized SEO recommendations from Claude Sonnet 4"
    },
    {
      icon: MapPin,
      title: "Local SEO (AI-Powered)",
      description: "Generate Google Business Profile metrics, rankings & citations instantly"
    },
    {
      icon: Share2,
      title: "Social Media Monitoring",
      description: "Track performance across Twitter, Facebook, Instagram, LinkedIn, TikTok"
    },
    {
      icon: Megaphone,
      title: "Link Building & Outreach",
      description: "Manage campaigns, find opportunities, and track outreach success"
    },
    {
      icon: FileText,
      title: "Content Intelligence",
      description: "SEO content scoring, optimization briefs, and competitive analysis"
    },
    {
      icon: FileText,
      title: "Automated Reports",
      description: "Generate comprehensive SEO reports on-demand or scheduled"
    },
    {
      icon: Code,
      title: "API Access",
      description: "Programmatic access to all data with usage analytics and docs"
    }
  ];

  const competitorComparison = [
    {
      name: "Ahrefs",
      price: "$99-999",
      period: "/month",
      total: "$1,188-11,988/year",
      features: ["Limited AI", "Expensive APIs", "Monthly fees"],
      color: "text-red-500"
    },
    {
      name: "SEMrush",
      price: "$119-449",
      period: "/month",
      total: "$1,428-5,388/year",
      features: ["Limited AI", "Extra costs", "Monthly fees"],
      color: "text-red-500"
    },
    {
      name: "Ubersuggest",
      price: "$29-99",
      period: "/month",
      total: "$348-1,188/year",
      features: ["Basic features", "Limited data", "Monthly fees"],
      color: "text-red-500"
    },
    {
      name: "ARGILETTE",
      price: "$199-999",
      period: "ONE-TIME",
      total: "Pay once, own forever",
      features: ["AI-First (Free)", "All features", "No recurring fees"],
      color: "text-primary",
      highlight: true
    }
  ];

  const pricingPlans = [
    {
      name: "Individual",
      price: "$199",
      features: ["3 Projects", "500 Keywords", "3 Competitors", "AI Insights", "All Core Features"],
      popular: false
    },
    {
      name: "Business",
      price: "$499",
      features: ["10 Projects", "5,000 Keywords", "10 Competitors", "AI Analysis", "Priority Support", "API Access"],
      popular: true
    },
    {
      name: "Enterprise",
      price: "$999",
      features: ["50 Projects", "Unlimited Keywords", "Unlimited Competitors", "White Label", "Custom Reports", "Dedicated Support"],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <BarChart3 className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">ARGILETTE</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => window.location.href = '#features'} data-testid="link-features">
                Features
              </Button>
              <Button variant="ghost" onClick={() => window.location.href = '#pricing'} data-testid="link-pricing">
                Pricing
              </Button>
              <Button onClick={handleLogin} data-testid="button-login-header">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="py-20 text-center">
          <Badge className="mb-6" variant="outline" data-testid="badge-lifetime">
            <Infinity className="mr-1 h-3 w-3" />
            Lifetime Access - Pay Once, Own Forever
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI-Powered SEO Analytics
            <br />
            Without the Monthly Trap
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Save <span className="font-bold text-primary">$2,000-$5,000/year</span> vs Ahrefs, SEMrush & others.
            <br />
            <span className="font-semibold">One-time payment</span> for lifetime access to 12+ powerful SEO tools.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              onClick={handleLogin}
              className="text-lg px-8 py-6"
              data-testid="button-get-started"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Get Started Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.location.href = '#pricing'}
              className="text-lg px-8 py-6"
              data-testid="button-view-pricing"
            >
              <Crown className="mr-2 h-5 w-5" />
              View Lifetime Plans
            </Button>
          </div>

          {/* Value Props */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>AI-First (Free Backlinks & Local SEO)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>No Recurring Fees</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <span>30-Day Money Back</span>
            </div>
          </div>
        </section>

        {/* Savings Comparison */}
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Stop Paying Monthly Subscriptions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how much you'll save with our one-time lifetime payment
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {competitorComparison.map((competitor, index) => (
              <Card 
                key={index} 
                className={competitor.highlight ? "border-primary shadow-xl" : ""}
                data-testid={`card-competitor-${competitor.name.toLowerCase()}`}
              >
                <CardHeader>
                  {competitor.highlight && (
                    <Badge className="w-fit mb-2" data-testid="badge-best-value">Best Value</Badge>
                  )}
                  <CardTitle className="text-xl">{competitor.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${competitor.color}`}>
                      {competitor.price}
                    </span>
                    <span className="text-sm text-muted-foreground">{competitor.period}</span>
                  </div>
                  <p className="text-sm font-semibold">{competitor.total}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {competitor.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        {competitor.highlight ? (
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-16">
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="outline" data-testid="badge-features-count">
              <Sparkles className="mr-1 h-3 w-3" />
              12+ Powerful Tools
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for SEO Success
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              All features included. No tiers, no limitations, no hidden costs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate" data-testid={`card-feature-${index}`}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg mb-2">{feature.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* AI Benefits */}
        <section className="py-16">
          <Card className="bg-primary text-primary-foreground max-w-4xl mx-auto">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-3xl font-bold mb-4">
                  AI-First Means FREE Tools
                </h3>
                <p className="text-lg mb-6 opacity-90 max-w-2xl mx-auto">
                  While competitors charge $100/month for APIs, we use Claude Sonnet 4 AI to give you:
                </p>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-2xl font-bold mb-2">FREE</div>
                    <div className="text-sm opacity-90">AI Backlink Analysis</div>
                    <div className="text-xs opacity-75">(vs $100/mo DataForSEO)</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold mb-2">FREE</div>
                    <div className="text-sm opacity-90">Local SEO Generation</div>
                    <div className="text-xs opacity-75">(vs expensive directories)</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold mb-2">FREE</div>
                    <div className="text-sm opacity-90">AI SEO Insights</div>
                    <div className="text-xs opacity-75">(vs $500/mo consultants)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16">
          <div className="text-center mb-12">
            <Badge className="mb-4" data-testid="badge-lifetime-pricing">
              <Crown className="mr-1 h-3 w-3" />
              Lifetime Plans
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pay Once, Own Forever
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose your plan and never pay again. 30-day money-back guarantee.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.popular ? 'border-primary shadow-xl' : ''}`}
                data-testid={`card-pricing-${plan.name.toLowerCase()}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" data-testid="badge-most-popular">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">one-time</span>
                  </div>
                  <CardDescription>Lifetime access included</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={handleLogin}
                    data-testid={`button-select-${plan.name.toLowerCase()}`}
                  >
                    <Infinity className="mr-2 h-4 w-4" />
                    Get Lifetime Access
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              All plans include 30-day money-back guarantee. No questions asked.
            </p>
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/pricing'}
              data-testid="button-see-all-plans"
            >
              See All Plans & Features
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Stop Wasting Money on Monthly Fees?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join smart marketers who chose lifetime access over recurring subscriptions
            </p>
            <Button 
              size="lg"
              onClick={handleLogin}
              className="text-lg px-8 py-6"
              data-testid="button-cta-bottom"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Start Your SEO Journey
            </Button>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 ARGILETTE. All rights reserved. Pay once, own forever.</p>
        </div>
      </footer>
    </div>
  );
}
