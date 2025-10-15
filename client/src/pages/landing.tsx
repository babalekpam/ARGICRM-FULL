import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp, Search, Sparkles, Shield, Zap } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">ARGILETTE</span>
          </div>
          <Button data-testid="button-login-header" onClick={handleLogin} size="lg">
            Sign In
          </Button>
        </div>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            AI-Powered SEO Analytics
            <br />
            <span className="text-primary">Made Simple</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Track keywords, analyze competitors, monitor backlinks, and get AI-powered insights 
            to skyrocket your search rankings.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              data-testid="button-login-hero"
              size="lg" 
              onClick={handleLogin}
              className="text-lg px-8 py-6"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Get Started Free
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Keyword Research</h3>
                <p className="text-sm text-muted-foreground">
                  Discover high-value keywords with search volume, difficulty scores, and ranking opportunities.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Traffic Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor organic traffic trends and identify growth opportunities with detailed analytics.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">AI Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Get personalized SEO recommendations powered by advanced AI that understands your data.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="max-w-3xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Multi-Tenant Security</h3>
                <p className="text-sm text-muted-foreground">
                  Your data is completely isolated and secure with enterprise-grade multi-tenant architecture.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Instant Setup</h3>
                <p className="text-sm text-muted-foreground">
                  Sign in with Google, GitHub, or email and start tracking your SEO performance in seconds.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="pt-6 pb-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-3">
                  Ready to improve your SEO?
                </h3>
                <p className="mb-6 opacity-90">
                  Join thousands of marketers using AI-powered analytics to grow their organic traffic.
                </p>
                <Button 
                  data-testid="button-login-cta"
                  size="lg" 
                  variant="secondary"
                  onClick={handleLogin}
                  className="text-lg px-8"
                >
                  Sign In with Replit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
