import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Brain, 
  Heart, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Shield, 
  Zap, 
  CheckCircle, 
  Globe,
  ArrowRight,
  Star,
  Building2,
  CreditCard,
  Smartphone,
  Lock
} from "lucide-react";
import Logo from "@/components/logo";
import { SEO } from "@/components/SEO";
import { useConversionTracking } from "@/components/conversion-tracking";

export default function SimpleLanding() {
  const { toast } = useToast();
  const { trackConversion } = useConversionTracking();
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('User already authenticated, redirecting to dashboard:', user.email);
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoginLoading(true);
    try {
      const result = await login(loginEmail, loginPassword);
      
      if (result.success) {
        console.log('✅ Landing page login successful, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        toast({
          title: "Login Failed",
          description: result.error || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Landing page login error:', error);
      toast({
        title: "Login Failed",
        description: "Login failed. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoginLoading(false);
    }
  };

  const comprehensiveFeatures = [
    {
      icon: Brain,
      title: "AI-Powered CRM",
      description: "Advanced AI insights and automated customer interactions"
    },
    {
      icon: Heart,
      title: "E-commerce Builder", 
      description: "Complete online store with inventory and payment processing"
    },
    {
      icon: MessageSquare,
      title: "Email Marketing",
      description: "Professional campaigns with automation and analytics"
    },
    {
      icon: BarChart3,
      title: "Financial Operations",
      description: "Multi-currency invoicing and expense tracking"
    },
    {
      icon: Users,
      title: "Project Management",
      description: "Team collaboration and project tracking tools"
    },
    {
      icon: Globe,
      title: "Global Support",
      description: "195+ countries, 20+ languages supported"
    }
  ];

  const stats = [
    { value: "195+", label: "Countries Supported" },
    { value: "20+", label: "Languages" },
    { value: "99.9%", label: "Uptime SLA" },
    { value: "24/7", label: "Support" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="NODE CRM - Complete AI Business Management Platform"
        description="Revolutionary AI-powered business platform combining CRM, e-commerce, marketing automation, and financial operations. Transform your business with comprehensive automation."
        keywords="AI business management, CRM software, e-commerce platform, email marketing, financial management"
        canonical="https://argilette.org/"
      />
      
      {/* Professional Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="text-xl font-bold">NODE CRM</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
              <Button asChild size="sm" data-testid="button-get-started">
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Professional */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-background to-muted/20">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-slate-700/25" />
        <div className="container relative mx-auto px-4 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI-Powered Business Platform</span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                Complete Business Management Platform
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg">
                Unified platform combining CRM, E-commerce, Marketing, and Financial Operations with AI automation
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-base" data-testid="button-start-free-trial">
                  <Link to="/signup">
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-base" data-testid="button-watch-demo">
                  <a href="#features">
                    Watch Demo
                  </a>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t">
                {stats.map((stat, index) => (
                  <div key={index} className="space-y-1">
                    <div className="text-2xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Login Card */}
            <Card className="max-w-md mx-auto w-full" data-testid="card-login">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
                <CardDescription>
                  Access your intelligent CRM dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={isLoginLoading}
                      data-testid="input-login-email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <a href="#" className="text-sm text-primary hover:underline">
                        Forgot password?
                      </a>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isLoginLoading}
                      data-testid="input-login-password"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoginLoading}
                    data-testid="button-login-submit"
                  >
                    {isLoginLoading ? "Signing in..." : "Sign In"}
                  </Button>
                  <div className="text-center text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-primary hover:underline font-medium" data-testid="link-signup">
                      Create one now
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section - Grid Layout */}
      <section id="features" className="py-24 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything Your Business Needs
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful features designed to streamline your operations and accelerate growth
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {comprehensiveFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-2 hover:border-primary/50 transition-all" data-testid={`card-feature-${index}`}>
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 bg-muted/30 border-y">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <Shield className="h-8 w-8 mx-auto text-primary" />
              <h3 className="font-semibold">Enterprise Security</h3>
              <p className="text-sm text-muted-foreground">Bank-level encryption</p>
            </div>
            <div className="space-y-2">
              <CheckCircle className="h-8 w-8 mx-auto text-primary" />
              <h3 className="font-semibold">99.9% Uptime</h3>
              <p className="text-sm text-muted-foreground">Guaranteed availability</p>
            </div>
            <div className="space-y-2">
              <Lock className="h-8 w-8 mx-auto text-primary" />
              <h3 className="font-semibold">GDPR Compliant</h3>
              <p className="text-sm text-muted-foreground">Data protection</p>
            </div>
            <div className="space-y-2">
              <Smartphone className="h-8 w-8 mx-auto text-primary" />
              <h3 className="font-semibold">Mobile Ready</h3>
              <p className="text-sm text-muted-foreground">Access anywhere</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-12 lg:p-16 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Ready to Transform Your Business?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of businesses using NODE CRM to streamline operations and accelerate growth
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="text-base" data-testid="button-cta-start">
                  <Link to="/signup">
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-base" data-testid="button-cta-pricing">
                  <Link to="/pricing">
                    View Pricing
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Logo size="sm" />
                <span className="font-bold">NODE CRM</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Complete AI Business Management Platform
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
                <li><a href="#" className="hover:text-foreground">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground">About</Link></li>
                <li><a href="#contact" className="hover:text-foreground">Contact</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-foreground">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground">Terms</Link></li>
                <li><a href="#" className="hover:text-foreground">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2025 NODE CRM by Argilette. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
