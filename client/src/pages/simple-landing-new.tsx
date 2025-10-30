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
  Lock,
  ShoppingCart,
  Sparkles
} from "lucide-react";
import Logo from "@/components/logo";
import { SEO } from "@/components/SEO";
import { useConversionTracking } from "@/components/conversion-tracking";
import { PageTranslator } from "@/components/PageTranslator";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

// Import professional stock images
import heroImage from "@assets/stock_images/modern_business_team_a855356a.jpg";
import analyticsImage from "@assets/stock_images/data_analytics_dashb_4a2c4bbb.jpg";
import ecommerceImage from "@assets/stock_images/e-commerce_online_sh_f06b020e.jpg";
import aiImage from "@assets/stock_images/ai_artificial_intell_a05896a2.jpg";

export default function SimpleLanding() {
  const { toast } = useToast();
  const { trackConversion } = useConversionTracking();
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { currentLanguage, isRTL } = useLanguage();

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
      description: "Advanced AI insights and automated customer interactions with intelligent predictions",
      color: "from-purple-500 to-pink-500",
      image: aiImage
    },
    {
      icon: ShoppingCart,
      title: "E-commerce Builder", 
      description: "Complete online store with inventory, payments, and stunning themes",
      color: "from-blue-500 to-cyan-500",
      image: ecommerceImage
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time insights and powerful reporting across all your business operations",
      color: "from-green-500 to-emerald-500",
      image: analyticsImage
    },
    {
      icon: MessageSquare,
      title: "Email Marketing",
      description: "Professional campaigns with automation, segmentation, and detailed analytics",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: CreditCard,
      title: "Financial Operations",
      description: "Multi-currency invoicing, expense tracking, and automated bookkeeping",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: Users,
      title: "Project Management",
      description: "Team collaboration, task tracking, and comprehensive project oversight",
      color: "from-pink-500 to-rose-500"
    }
  ];

  const stats = [
    { value: "195+", label: "Countries Supported", icon: Globe },
    { value: "20+", label: "Languages", icon: MessageSquare },
    { value: "99.9%", label: "Uptime SLA", icon: CheckCircle },
    { value: "24/7", label: "Support", icon: Shield }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Built for speed with modern technology stack"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption and GDPR compliance"
    },
    {
      icon: Sparkles,
      title: "AI Automation",
      description: "Intelligent workflows that work while you sleep"
    },
    {
      icon: Globe,
      title: "Global Ready",
      description: "Multi-language and multi-currency support"
    }
  ];

  return (
    <PageTranslator context="landing-page">
      <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <SEO
          title="ARGILETTE - Complete AI Business Management Platform"
          description="Revolutionary AI-powered business platform combining CRM, e-commerce, marketing automation, and financial operations. Transform your business with comprehensive automation."
          keywords="AI business management, CRM software, e-commerce platform, email marketing, financial management"
          canonical="https://argilette.org/"
        />
      
      {/* Modern Navigation with Glass Effect */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                ARGILETTE
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <a href="#benefits" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Benefits
              </a>
              <LanguageSelector />
              <Button asChild size="sm" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" data-testid="button-get-started">
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <section className="relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Modern business team collaboration" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/80" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        </div>

        <div className="container relative mx-auto px-4 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 px-4 py-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI-Powered Business Platform
                </span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
                Transform Your Business with{" "}
                <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI Excellence
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg">
                Unified platform combining CRM, E-commerce, Marketing, and Financial Operations with cutting-edge AI automation
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="text-base bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" 
                  data-testid="button-start-free-trial"
                >
                  <Link to="/signup">
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-base backdrop-blur-sm" data-testid="button-watch-demo">
                  <a href="#features">
                    Explore Features
                  </a>
                </Button>
              </div>

              {/* Stats with Icons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="space-y-2 text-center sm:text-left">
                      <Icon className="h-5 w-5 text-primary mb-1" />
                      <div className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        {stat.value}
                      </div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Login Card with Modern Design */}
            <Card className="max-w-md mx-auto w-full shadow-2xl border-2 backdrop-blur-sm bg-background/95" data-testid="card-login">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                <CardDescription>
                  Sign in to access your intelligent CRM dashboard
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
                    className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" 
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

      {/* Features Section with Images and Gradients */}
      <section id="features" className="py-24 lg:py-32 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-600">
              Platform Features
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">
              Everything Your Business Needs,{" "}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                All in One Place
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful features designed to streamline your operations and accelerate growth
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {comprehensiveFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl overflow-hidden" 
                  data-testid={`card-feature-${index}`}
                >
                  {feature.image && (
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={feature.image} 
                        alt={feature.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-60`} />
                    </div>
                  )}
                  <CardHeader>
                    <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
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

      {/* Benefits Section with Colorful Cards */}
      <section id="benefits" className="py-24 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Why Choose ARGILETTE?
            </h2>
            <p className="text-lg text-muted-foreground">
              Built with modern technology and designed for the future
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              const gradients = [
                "from-blue-500 to-cyan-500",
                "from-purple-500 to-pink-500",
                "from-green-500 to-emerald-500",
                "from-orange-500 to-red-500"
              ];
              return (
                <Card key={index} className="text-center border-2 hover:border-primary/50 transition-all hover:shadow-xl">
                  <CardHeader>
                    <div className={`h-16 w-16 rounded-full bg-gradient-to-br ${gradients[index]} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {benefit.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Section with Modern Design */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />
        <div className="container relative mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-3 p-6 rounded-lg bg-background/50 backdrop-blur-sm border">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg">Enterprise Security</h3>
              <p className="text-sm text-muted-foreground">Bank-level encryption & protection</p>
            </div>
            <div className="text-center space-y-3 p-6 rounded-lg bg-background/50 backdrop-blur-sm border">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg">99.9% Uptime</h3>
              <p className="text-sm text-muted-foreground">Guaranteed availability SLA</p>
            </div>
            <div className="text-center space-y-3 p-6 rounded-lg bg-background/50 backdrop-blur-sm border">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg">GDPR Compliant</h3>
              <p className="text-sm text-muted-foreground">Full data protection compliance</p>
            </div>
            <div className="text-center space-y-3 p-6 rounded-lg bg-background/50 backdrop-blur-sm border">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg">Mobile Ready</h3>
              <p className="text-sm text-muted-foreground">Access from anywhere, anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Vibrant Gradient */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <Card className="border-2 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20" />
            <CardContent className="relative p-12 lg:p-16 text-center">
              <div className="max-w-3xl mx-auto space-y-6">
                <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-700 dark:text-purple-300">
                  Limited Time Offer
                </Badge>
                <h2 className="text-3xl lg:text-5xl font-bold">
                  Ready to Transform Your Business?
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Join thousands of businesses using ARGILETTE to streamline operations, boost productivity, and accelerate growth
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button 
                    asChild 
                    size="lg" 
                    className="text-base bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg" 
                    data-testid="button-cta-start"
                  >
                    <Link to="/signup">
                      Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-base" data-testid="button-cta-pricing">
                    <Link to="/pricing">
                      View Pricing Plans
                    </Link>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground pt-4">
                  <CheckCircle className="inline h-4 w-4 text-green-500 mr-1" />
                  No credit card required •{" "}
                  <CheckCircle className="inline h-4 w-4 text-green-500 mr-1" />
                  14-day free trial •{" "}
                  <CheckCircle className="inline h-4 w-4 text-green-500 mr-1" />
                  Cancel anytime
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer with Gradient Accent */}
      <footer className="border-t bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Logo size="sm" />
                <span className="font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  ARGILETTE
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Complete AI Business Management Platform for the modern enterprise
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-primary transition-colors">About</Link></li>
                <li><a href="#contact" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 ARGILETTE by Argilette.org. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </PageTranslator>
  );
}
