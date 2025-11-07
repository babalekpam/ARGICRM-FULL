import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Brain, 
  Users, 
  TrendingUp, 
  ShoppingCart, 
  Mail, 
  Search, 
  BarChart3,
  Globe,
  Sparkles,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  DollarSign,
  Briefcase,
  Link as LinkIcon,
  Star,
  ClipboardList,
  MessageSquare,
  Bot,
  Radar,
  Check,
  Target,
  UserPlus,
  LineChart,
  FolderKanban
} from "lucide-react";
import { Link } from "wouter";
import Logo from "@/components/logo";
import { redirectToDashboard } from "@/lib/dashboard-routing";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, loading: authLoading, user: authData } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoginLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_email', email);
        console.log('✅ Secure authentication successful for:', email);
        console.log('✅ Landing page login successful, redirecting to dashboard');
        redirectToDashboard(email);
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('❌ Authentication failed:', error.message);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoginLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    
    if (token && !authLoading && isAuthenticated && authData) {
      const userEmail = localStorage.getItem('user_email') || authData.email;
      setTimeout(() => {
        redirectToDashboard(userEmail);
      }, 100);
    }
  }, [isAuthenticated, authLoading, authData]);

  if (localStorage.getItem('auth_token') && authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && authData) {
    setTimeout(() => {
      const userEmail = localStorage.getItem('user_email') || authData.email;
      redirectToDashboard(userEmail);
    }, 100);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const platformFeatures = [
    { name: "CRM", icon: Users, path: "/contacts" },
    { name: "Marketing", icon: Mail, path: "/simple-messaging" },
    { name: "E-commerce", icon: ShoppingCart, path: "/e-commerce-dashboard" },
    { name: "SEO", icon: Search, path: "/argilette-seo/audit" },
    { name: "AI Tools", icon: Brain, path: "/ai-campaign-studio" },
    { name: "Analytics", icon: BarChart3, path: "/dashboard" },
    { name: "Multi-Platform", icon: Globe, path: "/multi-platform-search" },
  ];

  const keyFeatures = [
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      description: "Advanced AI tools for campaigns, SEO insights, and sentiment analysis"
    },
    {
      icon: Users,
      title: "Complete CRM Suite",
      description: "Manage contacts, leads, deals, and accounts in one unified platform"
    },
    {
      icon: ShoppingCart,
      title: "E-commerce Ready",
      description: "Full-featured online store with global currency support"
    },
    {
      icon: Search,
      title: "SEO Optimization",
      description: "Comprehensive SEO tools including audits, keywords, and rank tracking"
    },
    {
      icon: Globe,
      title: "Multi-Platform Search",
      description: "Track brand visibility across AI platforms and social search"
    },
    {
      icon: Mail,
      title: "Marketing Automation",
      description: "Email, SMS, and multi-channel campaign management"
    },
    {
      icon: TrendingUp,
      title: "Advanced Analytics",
      description: "Real-time insights and predictive analytics for data-driven decisions"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security with role-based access and data encryption"
    },
    {
      icon: DollarSign,
      title: "Financial Management",
      description: "Multi-currency bookkeeping, invoicing, bank feeds, and automated tax calculation"
    },
    {
      icon: Briefcase,
      title: "HR & Projects",
      description: "Employee management, Gantt charts, and document management"
    },
    {
      icon: LinkIcon,
      title: "Link Building",
      description: "AI-powered backlink analysis, competitor research, and automated outreach"
    },
    {
      icon: Star,
      title: "Reputation Management",
      description: "Monitor and manage your online reputation across platforms"
    },
    {
      icon: ClipboardList,
      title: "Forms & Surveys",
      description: "Create and manage forms for data collection and feedback"
    },
    {
      icon: MessageSquare,
      title: "Unified Communications",
      description: "Centralized messaging across all channels"
    },
    {
      icon: Bot,
      title: "Cloe AI Agent",
      description: "Intelligent virtual assistant for automated support"
    },
    {
      icon: Radar,
      title: "11-Platform Search",
      description: "Track visibility across AI platforms, social search, and traditional SEO"
    }
  ];

  const benefits = [
    "Multi-tenant architecture for enterprise scalability",
    "54 African currencies + global currency support",
    "AI-powered campaign generation and optimization",
    "Comprehensive SEO analytics and tracking",
    "Real-time collaboration and team management",
    "Offline-first capabilities for unstable connections"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Logo size="sm" variant="colored" />
              <span className="text-lg font-bold text-foreground">NODE CRM</span>
            </div>

            {/* Desktop Navigation - Features */}
            <div className="hidden lg:flex items-center space-x-1">
              {platformFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link 
                    key={feature.name} 
                    href={feature.path}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all-smooth cursor-pointer"
                    data-testid={`nav-${feature.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{feature.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center space-x-3">
              <Link href="/demo-signup">
                <Button variant="outline" size="sm" data-testid="button-signup">
                  Get Started
                </Button>
              </Link>
              <Button size="sm" onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })} data-testid="button-login">
                Sign In
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-md text-foreground hover:bg-accent"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 space-y-2 border-t border-border">
              {platformFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link 
                    key={feature.name} 
                    href={feature.path}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all-smooth cursor-pointer"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`mobile-nav-${feature.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{feature.name}</span>
                  </Link>
                );
              })}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Link href="/demo-signup">
                  <Button variant="outline" className="w-full" data-testid="mobile-button-signup">
                    Get Started
                  </Button>
                </Link>
                <Button 
                  className="w-full" 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  data-testid="mobile-button-login"
                >
                  Sign In
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-subtle">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20" data-testid="badge-ai-powered">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered Platform
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              The Complete Business
              <br />
              <span className="text-primary">Management Platform</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              CRM, Marketing, E-commerce, SEO, and AI tools in one unified platform. 
              Built for global markets with multi-currency support and offline capabilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo-signup">
                <Button size="lg" className="shadow-card hover:shadow-card-hover" data-testid="button-hero-start">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="button-hero-login"
              >
                Sign In to Dashboard
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">195+</div>
              <div className="text-sm text-muted-foreground">Countries Supported</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">54</div>
              <div className="text-sm text-muted-foreground">African Currencies</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">AI Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Everything You Need</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive suite of tools to manage and grow your business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {keyFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover-lift shadow-card hover:shadow-card-hover transition-all-smooth" data-testid={`feature-card-${index}`}>
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enterprise Features - New in 2025 */}
      <section className="py-20 px-4 bg-gradient-subtle">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20" data-testid="badge-enterprise">
              New Enterprise Features
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">Advanced Capabilities for Growing Teams</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional tools designed for conversion optimization and team efficiency
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-card hover:shadow-card-hover transition-all-smooth" data-testid="enterprise-card-ab-testing">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">A/B Testing</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Optimize conversion rates with built-in split testing for pages and campaigns
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-card hover:shadow-card-hover transition-all-smooth" data-testid="enterprise-card-client-portal">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <UserPlus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Client Portal</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  White-labeled client access with project tracking and deliverables
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-card hover:shadow-card-hover transition-all-smooth" data-testid="enterprise-card-unified-analytics">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Unified Analytics</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Cross-platform insights combining CRM, marketing, and e-commerce data
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-card hover:shadow-card-hover transition-all-smooth" data-testid="enterprise-card-resource-management">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FolderKanban className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Resource Management</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Team scheduling, workload balancing, and capacity planning tools
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-accent/30">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Built for Global Business
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                NODE CRM is designed from the ground up to support businesses operating across borders, 
                with comprehensive multi-currency support, offline capabilities, and AI-powered insights.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle2 className="h-6 w-6 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <Zap className="h-8 w-8 text-primary mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Lightning Fast</h3>
                  <p className="text-muted-foreground">
                    Optimized performance with offline-first architecture for seamless work anywhere
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <Shield className="h-8 w-8 text-primary mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Enterprise Security</h3>
                  <p className="text-muted-foreground">
                    Bank-level encryption, role-based access, and comprehensive audit logging
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <Brain className="h-8 w-8 text-primary mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">AI-Powered</h3>
                  <p className="text-muted-foreground">
                    Intelligent automation, sentiment analysis, and predictive insights
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your business needs. All plans include 14-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Starter Plan */}
            <Card className="shadow-card hover:shadow-card-hover transition-all-smooth" data-testid="pricing-starter">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">Starter</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">$49.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Basic CRM & Contact Management</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">SEO Tools & Analytics</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">E-commerce Store</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Up to 1,000 contacts</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Email support</span>
                  </li>
                </ul>
                <Link href="/demo-signup">
                  <Button variant="outline" className="w-full" data-testid="button-pricing-starter">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Professional Plan */}
            <Card className="shadow-card hover:shadow-card-hover transition-all-smooth border-2 border-primary relative" data-testid="pricing-professional">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground" data-testid="badge-most-popular">
                Most Popular
              </Badge>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">Professional</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">$149.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Everything in Starter</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Marketing Automation</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">AI Campaign Studio</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Up to 10,000 contacts</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Priority support</span>
                  </li>
                </ul>
                <Link href="/demo-signup">
                  <Button className="w-full" data-testid="button-pricing-professional">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Business Plan */}
            <Card className="shadow-card hover:shadow-card-hover transition-all-smooth" data-testid="pricing-business">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">Business</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">$299.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Everything in Professional</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Advanced Analytics</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Link Building Tools</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Unlimited contacts</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">24/7 phone support</span>
                  </li>
                </ul>
                <Link href="/demo-signup">
                  <Button variant="outline" className="w-full" data-testid="button-pricing-business">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="shadow-card hover:shadow-card-hover transition-all-smooth" data-testid="pricing-enterprise">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">Enterprise</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">$799.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Everything in Business</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">White-label options</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Custom integrations</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">Dedicated account manager</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">SLA guarantee</span>
                  </li>
                </ul>
                <Link href="/demo-signup">
                  <Button variant="outline" className="w-full" data-testid="button-pricing-enterprise">
                    Contact Sales
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Cost Comparison Section */}
      <section className="py-20 px-4 bg-gradient-subtle">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Save Thousands Every Year</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Why pay $950-1,200/month for multiple separate tools when NODE CRM offers everything in one platform?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-card bg-accent/50" data-testid="comparison-traditional">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-foreground mb-6 text-center">Traditional Approach</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">Semrush (SEO)</span>
                    <span className="font-semibold text-foreground">$229.95/mo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">HubSpot (CRM + Marketing)</span>
                    <span className="font-semibold text-foreground">$450/mo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">Shopify Plus (E-commerce)</span>
                    <span className="font-semibold text-foreground">$299/mo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">Additional Tools</span>
                    <span className="font-semibold text-foreground">$171+/mo</span>
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-foreground">Total Monthly Cost</span>
                    <span className="text-2xl font-bold text-destructive">$1,149.95+</span>
                  </div>
                  <div className="text-center mt-4">
                    <span className="text-sm text-muted-foreground">$13,799/year</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card bg-primary/5 border-2 border-primary" data-testid="comparison-nodecrm">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-foreground mb-6 text-center">NODE CRM Platform</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">Complete CRM Suite</span>
                    <Check className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">Full Marketing Automation</span>
                    <Check className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">E-commerce Platform</span>
                    <Check className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">Advanced SEO Tools</span>
                    <Check className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">AI-Powered Features</span>
                    <Check className="h-5 w-5 text-success" />
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-foreground">Total Monthly Cost</span>
                    <span className="text-2xl font-bold text-success">$49.99-$799.99</span>
                  </div>
                  <div className="text-center mt-4">
                    <Badge className="bg-success text-success-foreground">Save up to 93%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Comparison Table */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Feature Comparison</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See exactly what's included in each plan
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse" data-testid="features-comparison-table">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold text-foreground">Feature</th>
                  <th className="text-center p-4 font-semibold text-foreground">Starter</th>
                  <th className="text-center p-4 font-semibold text-foreground">Professional</th>
                  <th className="text-center p-4 font-semibold text-foreground">Business</th>
                  <th className="text-center p-4 font-semibold text-foreground">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border hover:bg-accent/30">
                  <td className="p-4 text-foreground">CRM & Contact Management</td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
                <tr className="border-b border-border hover:bg-accent/30">
                  <td className="p-4 text-foreground">SEO Tools & Analytics</td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
                <tr className="border-b border-border hover:bg-accent/30">
                  <td className="p-4 text-foreground">E-commerce Platform</td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
                <tr className="border-b border-border hover:bg-accent/30">
                  <td className="p-4 text-foreground">Marketing Automation</td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
                <tr className="border-b border-border hover:bg-accent/30">
                  <td className="p-4 text-foreground">AI Campaign Studio</td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
                <tr className="border-b border-border hover:bg-accent/30">
                  <td className="p-4 text-foreground">Advanced Analytics</td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
                <tr className="border-b border-border hover:bg-accent/30">
                  <td className="p-4 text-foreground">Link Building Tools</td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
                <tr className="border-b border-border hover:bg-accent/30">
                  <td className="p-4 text-foreground">A/B Testing</td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
                <tr className="border-b border-border hover:bg-accent/30">
                  <td className="p-4 text-foreground">White-label Options</td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
                <tr className="border-b border-border hover:bg-accent/30">
                  <td className="p-4 text-foreground">Custom Integrations</td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
                <tr className="border-b border-border hover:bg-accent/30">
                  <td className="p-4 text-foreground">Dedicated Account Manager</td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-5 w-5 text-success mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-gradient-subtle">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Trusted by Businesses Worldwide</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what our customers have to say about NODE CRM
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="shadow-card" data-testid="testimonial-1">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-foreground mb-4 leading-relaxed">
                  "NODE CRM has transformed our business operations. We consolidated 5 different tools into one platform and saved over $800/month. The AI features are incredible!"
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Sarah Martinez</p>
                    <p className="text-sm text-muted-foreground">CEO, TechVentures Inc.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card" data-testid="testimonial-2">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-foreground mb-4 leading-relaxed">
                  "The multi-currency support and offline capabilities were game-changers for our international operations. Best investment we've made in years."
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Michael Chen</p>
                    <p className="text-sm text-muted-foreground">Operations Director, GlobalTrade Co.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card" data-testid="testimonial-3">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-foreground mb-4 leading-relaxed">
                  "Switching from HubSpot and Semrush to NODE CRM was seamless. We're now saving thousands while getting even more features. The SEO tools are outstanding!"
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Emily Rodriguez</p>
                    <p className="text-sm text-muted-foreground">Marketing Manager, GrowthLabs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Login Section */}
      <section id="login-section" className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-md">
          <Card className="shadow-card">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h2>
                <p className="text-muted-foreground">Sign in to access your dashboard</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-testid="input-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full shadow-card hover:shadow-card-hover"
                  disabled={isLoginLoading}
                  data-testid="button-submit-login"
                >
                  {isLoginLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">Don't have an account?</p>
                <Link href="/demo-signup">
                  <Button variant="outline" className="w-full" data-testid="button-create-account">
                    Create Company Account
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of businesses worldwide using NODE CRM to streamline operations and drive growth
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo-signup">
              <Button size="lg" variant="secondary" className="shadow-card hover:shadow-card-hover" data-testid="button-cta-trial">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
              data-testid="button-cta-signin"
            >
              Sign In Now
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Logo size="sm" variant="colored" />
                <span className="font-bold text-foreground">NODE CRM</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The complete business management platform for global enterprises
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Platform</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>CRM</li>
                <li>Marketing</li>
                <li>E-commerce</li>
                <li>SEO Tools</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About Us</li>
                <li>Pricing</li>
                <li>Contact</li>
                <li>Support</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Security</li>
                <li>Compliance</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} NODE CRM by Argilette. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
