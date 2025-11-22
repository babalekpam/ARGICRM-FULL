import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
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
  Sparkles,
  Bot,
  Mail,
  Target
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
  const [, setLocation] = useLocation();
  const { currentLanguage, isRTL } = useLanguage();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('✅ User already authenticated, redirecting to dashboard:', user.email);
      // Use window.location for reliable redirect
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 LOGIN ATTEMPT:', { email: loginEmail, hasPassword: !!loginPassword });
    
    if (!loginEmail || !loginPassword) {
      console.log('❌ Missing email or password');
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoginLoading(true);
    try {
      console.log('📡 Calling login function...');
      const result = await login(loginEmail, loginPassword);
      
      console.log('🔍 LOGIN RESULT:', result);
      
      if (result.success) {
        console.log('✅ Landing page login successful, redirecting to dashboard');
        toast({
          title: "Login Successful!",
          description: "Welcome back! Redirecting to dashboard...",
        });
        
        // Use window.location for more reliable redirect
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } else {
        console.log('❌ Login failed:', result.error);
        toast({
          title: "Login Failed",
          description: result.error || "Invalid credentials. Try the Quick Login button instead.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('❌ Landing page login error:', error);
      toast({
        title: "Login Failed",
        description: "Login failed. Try the green Quick Login button instead.",
        variant: "destructive",
      });
    } finally {
      setIsLoginLoading(false);
    }
  };

  const comprehensiveFeatures = [
    {
      icon: Bot,
      title: "AI Employees",
      description: "6 autonomous AI agents for social media, lead qualification, email automation, and sales proposals",
      color: "from-violet-500 to-purple-500",
      image: aiImage,
      altText: "AI employee autonomous agents for CRM automation, social media, and lead qualification"
    },
    {
      icon: Brain,
      title: "AI-Powered CRM",
      description: "Advanced AI insights and automated customer interactions with intelligent predictions",
      color: "from-purple-500 to-pink-500",
      altText: "AI-powered CRM software with artificial intelligence automation and customer relationship management features"
    },
    {
      icon: ShoppingCart,
      title: "E-commerce Builder", 
      description: "Complete online store with inventory, payments, and stunning themes",
      color: "from-blue-500 to-cyan-500",
      image: ecommerceImage,
      altText: "E-commerce online store builder platform with shopping cart and product management system"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time insights and powerful reporting across all your business operations",
      color: "from-green-500 to-emerald-500",
      image: analyticsImage,
      altText: "Business analytics dashboard showing real-time data insights and reporting metrics"
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

  // Comprehensive SEO structured data - memoized for performance
  const structuredData = useMemo(() => ({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "ARGILETTE",
        "alternateName": "Argilette Business Platform",
        "url": "https://argilette.org",
        "logo": "https://argilette.org/assets/colored-logo.png",
        "description": "All-in-one AI-powered business management platform with CRM, e-commerce, SEO tools, and marketing automation for global businesses.",
        "foundingDate": "2024",
        "sameAs": [
          "https://www.linkedin.com/company/argilette",
          "https://twitter.com/argilette",
          "https://www.facebook.com/argilette"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "Customer Service",
          "availableLanguage": ["English", "Spanish", "French", "German", "Italian", "Portuguese", "Chinese", "Japanese", "Arabic", "Hindi"],
          "areaServed": "Worldwide"
        }
      },
      {
        "@type": "SoftwareApplication",
        "name": "ARGILETTE Business Platform",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web, Cloud-based",
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": "USD",
          "lowPrice": "69.99",
          "highPrice": "899.99",
          "offerCount": "4",
          "offers": [
            {
              "@type": "Offer",
              "name": "Starter Plan",
              "price": "69.99",
              "priceCurrency": "USD",
              "priceValidUntil": "2025-12-31",
              "description": "Monthly subscription - Perfect for startups and small businesses - Includes 1,000 AI Employee operations/month"
            },
            {
              "@type": "Offer",
              "name": "Professional Plan",
              "price": "179.99",
              "priceCurrency": "USD",
              "priceValidUntil": "2025-12-31",
              "description": "Monthly subscription - Advanced features for growing businesses - Includes 5,000 AI Employee operations/month"
            },
            {
              "@type": "Offer",
              "name": "Business Plan",
              "price": "349.99",
              "priceCurrency": "USD",
              "priceValidUntil": "2025-12-31",
              "description": "Monthly subscription - Complete solution for established companies - Includes 15,000 AI Employee operations/month"
            },
            {
              "@type": "Offer",
              "name": "Enterprise Plan",
              "price": "899.99",
              "priceCurrency": "USD",
              "priceValidUntil": "2025-12-31",
              "description": "Monthly subscription - Ultimate platform for large enterprises - UNLIMITED AI Employee operations"
            }
          ]
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "reviewCount": "1247",
          "bestRating": "5",
          "worstRating": "1"
        },
        "featureList": [
          "6 AI Employees - Social Media, SDR, Email, Chat, Closer, Lead Scorer",
          "AI-Powered CRM with Intelligent Predictions",
          "Complete E-commerce Store Builder",
          "SEO Tools - Keyword Research & Site Audit",
          "Multi-Platform Search Optimization (11 Platforms)",
          "Email & SMS Marketing Automation",
          "Financial Management & Bookkeeping",
          "Multi-Language Support (20+ Languages)",
          "Multi-Currency Support (54+ African Currencies)",
          "AI Campaign & Funnel Generation",
          "Real-Time Analytics Dashboard",
          "Team Collaboration Tools",
          "White-Label Branding Options"
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is ARGILETTE?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "ARGILETTE is a comprehensive all-in-one business platform that combines CRM, e-commerce, SEO tools, marketing automation, and financial management. It uses AI to help businesses optimize their operations across 11 different search and social platforms."
            }
          },
          {
            "@type": "Question",
            "name": "How many languages does ARGILETTE support?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "ARGILETTE supports 20+ languages including English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Arabic, Hindi, and more. The platform includes automatic translation for global reach."
            }
          },
          {
            "@type": "Question",
            "name": "What platforms does Search Everywhere Optimization track?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "ARGILETTE tracks your brand visibility across 11 platforms: Google, YouTube, Instagram, TikTok, Pinterest, Amazon, ChatGPT, Perplexity AI, Google Gemini, Microsoft Copilot, and Claude AI."
            }
          },
          {
            "@type": "Question",
            "name": "What are the ARGILETTE pricing plans?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "ARGILETTE offers flexible monthly subscription plans with AI Employee automation: $69.99/month for Starter (1,000 AI operations), $179.99/month for Professional (5,000 AI operations), $349.99/month for Business (15,000 AI operations), and $899.99/month for Enterprise (unlimited AI operations). All plans include CRM, SEO, E-commerce, Link Building, 11-platform tracking, and 6 AI Employees. 90% cheaper than buying Semrush + HubSpot + Drift + Copy.ai separately!"
            }
          }
        ]
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://argilette.org"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Features",
            "item": "https://argilette.org/#features"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Pricing",
            "item": "https://argilette.org/pricing"
          }
        ]
      }
    ]
  }), []); // Empty dependency array - structured data is static

  return (
    <PageTranslator context="landing-page">
      <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <SEO
          title="ARGILETTE - AI Business Platform | CRM + 6 AI Employees + E-commerce + SEO"
          description="All-in-one AI-powered business platform with CRM, 6 AI Employees (social media, lead scoring, email automation, chat bot), e-commerce builder, SEO tools, and Link Building. Track your brand across 11 platforms. Monthly subscription from $69.99. 90% cheaper than Semrush + HubSpot + Drift combined."
          keywords="AI employees, autonomous AI agents, AI business platform, CRM software, AI chatbot, lead scoring, social media automation, e-commerce builder, SEO tools, keyword research, site audit, multi-platform optimization, marketing automation, AI campaign generation, business management software"
          canonical="https://argilette.org/"
          structuredData={structuredData}
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
              <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <a href="#benefits" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Benefits
              </a>
              <LanguageSelector />
              <Button asChild size="sm" className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" data-testid="button-get-started">
                <Link href="/signup">Get Started</Link>
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
            alt="Professional business team using ARGILETTE AI-powered CRM and business management platform for collaboration and growth" 
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
                <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI Business Platform:
                </span>{" "}
                CRM Software + SEO Tools + Link Building
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-lg">
                All-in-one CRM software + E-commerce builder + SEO tools + Link Building + 6 AI Employees. Track your brand across 11 platforms. Monthly subscription starting at $69.99.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="text-base bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90" 
                  data-testid="button-start-free-trial"
                >
                  <Link href="/signup">
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
                      <Link href="/forgot-password" className="text-sm text-primary hover:underline" data-testid="link-forgot-password">
                        Forgot password?
                      </Link>
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
                    <Link href="/signup" className="text-primary hover:underline font-medium" data-testid="link-signup">
                      Create one now
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Employee Showcase Section - NEW */}
      <section className="py-24 lg:py-32 bg-gradient-to-b from-violet-500/5 via-purple-500/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
        <div className="container relative mx-auto px-4 lg:px-8">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 px-4 py-2 mb-6">
              <Bot className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-medium bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                AI Autonomous Workforce
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Meet Your{" "}
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI Employees
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-12">
              6 specialized AI agents working 24/7 to automate your CRM operations, social media, lead qualification, and sales—powered by GPT-5
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Social Media Author */}
            <Card className="border-2 border-violet-500/20 hover:border-violet-500/40 transition-all hover:shadow-xl bg-gradient-to-br from-violet-500/5 to-transparent">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-3 shadow-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Social Media Author</CardTitle>
                <CardDescription className="text-sm">
                  Generates platform-specific posts for LinkedIn, Twitter, Facebook & Instagram with engaging hooks and CTAs
                </CardDescription>
              </CardHeader>
            </Card>

            {/* SDR Outreach */}
            <Card className="border-2 border-purple-500/20 hover:border-purple-500/40 transition-all hover:shadow-xl bg-gradient-to-br from-purple-500/5 to-transparent">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3 shadow-lg">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">SDR Outreach Agent</CardTitle>
                <CardDescription className="text-sm">
                  Creates personalized prospecting emails using BANT qualification framework for higher response rates
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Reply Handler */}
            <Card className="border-2 border-pink-500/20 hover:border-pink-500/40 transition-all hover:shadow-xl bg-gradient-to-br from-pink-500/5 to-transparent">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-3 shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Reply Handler</CardTitle>
                <CardDescription className="text-sm">
                  Classifies email intent and generates smart auto-responses for positive replies, objections, and pricing questions
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Closer */}
            <Card className="border-2 border-blue-500/20 hover:border-blue-500/40 transition-all hover:shadow-xl bg-gradient-to-br from-blue-500/5 to-transparent">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3 shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Closer Agent</CardTitle>
                <CardDescription className="text-sm">
                  Drafts winning proposals, meeting recaps, and closing emails to advance deals through your pipeline
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Chat Qualifier */}
            <Card className="border-2 border-green-500/20 hover:border-green-500/40 transition-all hover:shadow-xl bg-gradient-to-br from-green-500/5 to-transparent">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-3 shadow-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Chat Qualifier Bot</CardTitle>
                <CardDescription className="text-sm">
                  Website chat widget with 4-turn qualification flow that identifies hot leads and offers meeting booking
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Lead Scorer */}
            <Card className="border-2 border-orange-500/20 hover:border-orange-500/40 transition-all hover:shadow-xl bg-gradient-to-br from-orange-500/5 to-transparent">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-3 shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">Lead Scorer</CardTitle>
                <CardDescription className="text-sm">
                  AI-powered scoring analyzing fit (40%), engagement (35%), and readiness (25%) to prioritize your hottest leads
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="text-center">
            <div className="inline-flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                <Link href="/signup">
                  Get Your AI Team <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Powered by GPT-5 • Multi-tenant isolated • Privacy-safe logging
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Images and Gradients */}
      <section id="features" className="py-24 lg:py-32 bg-gradient-to-b from-background to-muted/20" aria-label="Platform features">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-600">
              Platform Features
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">
              Complete Business Management:{" "}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                CRM, E-commerce & SEO Tools
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">
              AI-powered features combining customer relationship management, online store builder, SEO analytics, and marketing automation in one platform
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
                        alt={feature.altText || feature.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
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
                    <Link href="/signup">
                      Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-base" data-testid="button-cta-pricing">
                    <Link href="/pricing">
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

      {/* FAQ Section - Optimized for SEO Featured Snippets */}
      <section className="py-24 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4">Frequently Asked Questions</Badge>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Everything You Need to Know About ARGILETTE
              </h2>
              <p className="text-muted-foreground text-lg">
                Get instant answers to common questions about our all-in-one business platform
              </p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What is ARGILETTE?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    ARGILETTE is a comprehensive all-in-one business platform that combines CRM, e-commerce, SEO tools, marketing automation, and financial management. It uses AI to help businesses optimize their operations across 11 different search and social platforms.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How much does ARGILETTE cost?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    ARGILETTE offers flexible monthly subscription plans starting at just $49.99/month for the Starter tier up to $799.99/month for Enterprise. All plans include CRM, SEO, E-commerce, Link Building, and 11-platform tracking. Much more affordable than buying Semrush + HubSpot + Shopify separately!
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What platforms does ARGILETTE track?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    ARGILETTE tracks your brand visibility across 11 platforms: Google, YouTube, Instagram, TikTok, Pinterest, Amazon, ChatGPT, Perplexity AI, Google Gemini, Microsoft Copilot, and Claude AI. This gives you complete visibility into where your brand appears online.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How many languages does ARGILETTE support?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    ARGILETTE supports 20+ languages including English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Arabic, Hindi, and more. The platform includes automatic translation for global reach.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What makes ARGILETTE better than competitors like Semrush or HubSpot?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Unlike competitors that only focus on one area (SEO, CRM, or e-commerce), ARGILETTE combines everything in one platform. You get Semrush-level SEO tools, HubSpot-level CRM, Shopify-level e-commerce, PLUS link building and AI-powered insights - all at a fraction of the cost of buying these tools separately.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Does ARGILETTE include link building tools?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Yes! ARGILETTE includes comprehensive link building features with AI-powered opportunity discovery, competitor backlink analysis, broken link detection, automated outreach campaigns with AI-generated personalized emails, and link health monitoring. This feature alone is worth hundreds of dollars per month from competitors like Ahrefs.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">
                Have more questions?
              </p>
              <Button asChild variant="outline" data-testid="button-contact-support">
                <Link href="/contact">
                  Contact Our Support Team
                </Link>
              </Button>
            </div>
          </div>
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
                <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-primary transition-colors">About</Link></li>
                <li><a href="#contact" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms</Link></li>
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
