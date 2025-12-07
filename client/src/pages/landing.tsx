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
  Target,
  Database,
  Phone,
  Linkedin,
  Search,
  Flame,
  Mic,
  UserCheck,
  MailSearch
} from "lucide-react";
import Logo from "@/components/logo";
import { SEO } from "@/components/SEO";
import { useConversionTracking } from "@/components/conversion-tracking";
import { PageTranslator } from "@/components/PageTranslator";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

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

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('✅ User already authenticated, redirecting to dashboard:', user.email);
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
      icon: Database,
      title: "B2B Prospect Database",
      description: "Access 275M+ verified contacts with 20+ filters - job title, industry, company size, revenue, and more",
      altText: "B2B prospect database with millions of verified business contacts and advanced search filters"
    },
    {
      icon: Mail,
      title: "Email Sequences",
      description: "Multi-step automated campaigns with A/B testing, 7 step types, and drag-drop builder",
      altText: "Email sequence builder with automated campaigns, A/B testing, and performance analytics"
    },
    {
      icon: Bot,
      title: "AI Employees",
      description: "6 autonomous AI agents for social media, lead qualification, email automation, and sales proposals",
      image: aiImage,
      altText: "AI employee autonomous agents for CRM automation, social media, and lead qualification"
    },
    {
      icon: Phone,
      title: "Built-in Dialer",
      description: "Click-to-call with VoIP, call recording, live transcription, and outcome tracking",
      altText: "Built-in sales dialer with VoIP calling, call recording, and transcription features"
    },
    {
      icon: Flame,
      title: "Buyer Intent Signals",
      description: "Track engagement, auto-score leads, and identify hot prospects with AI-powered intent detection",
      altText: "Buyer intent signals dashboard showing lead scoring and engagement tracking"
    },
    {
      icon: Linkedin,
      title: "LinkedIn Integration",
      description: "Automate profile views, connection requests, messages, and track accept rates",
      altText: "LinkedIn automation for connection requests, messaging, and activity tracking"
    },
    {
      icon: MailSearch,
      title: "Email Finder & Enrichment",
      description: "Find emails by name + company, validate deliverability, and auto-enrich contact data",
      altText: "Email finder and validation tool with contact data enrichment"
    },
    {
      icon: Mic,
      title: "Conversation Intelligence",
      description: "AI analysis of calls with sentiment detection, objection tracking, and deal signals",
      altText: "Conversation intelligence with AI-powered call analysis and sentiment detection"
    },
    {
      icon: Brain,
      title: "AI-Powered CRM",
      description: "Advanced AI insights and automated customer interactions with intelligent predictions",
      altText: "AI-powered CRM software with artificial intelligence automation and customer relationship management features"
    },
    {
      icon: ShoppingCart,
      title: "E-commerce Builder", 
      description: "Complete online store with inventory, payments, and stunning themes",
      image: ecommerceImage,
      altText: "E-commerce online store builder platform with shopping cart and product management system"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time insights and powerful reporting across all your business operations",
      image: analyticsImage,
      altText: "Business analytics dashboard showing real-time data insights and reporting metrics"
    },
    {
      icon: CreditCard,
      title: "Financial Operations",
      description: "Multi-currency invoicing, expense tracking, and automated bookkeeping"
    }
  ];

  const stats = [
    { value: "275M+", label: "B2B Contacts", icon: Database },
    { value: "195+", label: "Countries Supported", icon: Globe },
    { value: "20+", label: "Languages", icon: MessageSquare },
    { value: "99.9%", label: "Uptime SLA", icon: CheckCircle }
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
          "275M+ B2B Prospect Database with 20+ Advanced Filters",
          "Email Sequence Builder with A/B Testing & 7 Step Types",
          "Built-in VoIP Dialer with Call Recording & Transcription",
          "Buyer Intent Signals with AI-Powered Lead Scoring",
          "LinkedIn Automation - Views, Connections, Messages",
          "Email Finder & Validation with Data Enrichment",
          "Conversation Intelligence with Sentiment Analysis",
          "6 AI Employees - Social Media, SDR, Email, Chat, Closer, Lead Scorer",
          "AI-Powered CRM with Intelligent Predictions",
          "Complete E-commerce Store Builder",
          "SEO Tools - Keyword Research & Site Audit",
          "Multi-Platform Search Optimization (11 Platforms)",
          "Financial Management & Bookkeeping",
          "Multi-Language Support (20+ Languages)",
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
              "text": "ARGILETTE is a comprehensive sales engagement platform with 275M+ B2B contacts database, email sequences with A/B testing, built-in dialer, LinkedIn automation, buyer intent signals, and conversation intelligence. It also includes CRM, e-commerce, SEO tools, and 6 AI Employees for autonomous sales operations."
            }
          },
          {
            "@type": "Question",
            "name": "How does the B2B Prospect Database work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "ARGILETTE provides access to 275M+ verified B2B contacts with 20+ advanced filters including job title, seniority, department, industry, company size, revenue, technologies, and location. You can save filters, bulk import prospects to your CRM, and use email finder to discover verified email addresses."
            }
          },
          {
            "@type": "Question",
            "name": "What sales engagement features does ARGILETTE include?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "ARGILETTE includes email sequences with A/B testing and 7 step types, built-in VoIP dialer with call recording and transcription, LinkedIn automation for profile views and connection requests, buyer intent signals with AI-powered lead scoring, conversation intelligence with sentiment analysis, and email finder with validation."
            }
          },
          {
            "@type": "Question",
            "name": "How does ARGILETTE compare to Apollo.io?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "ARGILETTE offers full Apollo.io feature parity including prospect database, email sequences, dialer, LinkedIn integration, intent signals, and conversation intelligence - plus CRM, e-commerce, SEO tools, and 6 AI Employees. Starting at $69.99/month, it's 90% cheaper than Apollo + HubSpot + Gong combined."
            }
          },
          {
            "@type": "Question",
            "name": "What are the ARGILETTE pricing plans?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "ARGILETTE offers flexible monthly subscription plans: $69.99/month for Starter (1,000 AI operations), $179.99/month for Professional (5,000 AI operations), $349.99/month for Business (15,000 AI operations), and $899.99/month for Enterprise (unlimited). All plans include full sales engagement suite, CRM, SEO, E-commerce, and 6 AI Employees."
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
  }), []);

  return (
    <PageTranslator context="landing-page">
      <div className={`min-h-screen bg-[hsl(228,47%,10%)] ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <SEO
          title="ARGILETTE - Sales Engagement Platform | 275M+ B2B Contacts + AI Employees + CRM"
          description="All-in-one sales engagement platform with 275M+ B2B prospect database, email sequences with A/B testing, built-in dialer, LinkedIn automation, buyer intent signals, conversation intelligence, and 6 AI Employees. Apollo.io alternative from $69.99/month. 90% cheaper than Apollo + HubSpot + Gong combined."
          keywords="B2B prospect database, sales engagement platform, email sequences, A/B testing, built-in dialer, LinkedIn automation, buyer intent signals, conversation intelligence, AI employees, CRM software, lead scoring, email finder, contact enrichment, Apollo alternative"
          canonical="https://argilette.org/"
          structuredData={structuredData}
        />
      
      <nav className="sticky top-0 z-50 border-b border-[hsl(217,33%,17%)] bg-[hsl(228,47%,10%)]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span className="text-xl font-bold text-[hsl(210,17%,98%)]">
                ARGILETTE
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-[hsl(215,20%,65%)] hover:text-[hsl(210,17%,98%)] transition-colors">
                Features
              </a>
              <Link href="/pricing" className="text-sm font-medium text-[hsl(215,20%,65%)] hover:text-[hsl(210,17%,98%)] transition-colors">
                Pricing
              </Link>
              <a href="#benefits" className="text-sm font-medium text-[hsl(215,20%,65%)] hover:text-[hsl(210,17%,98%)] transition-colors">
                Benefits
              </a>
              <LanguageSelector />
              <Button asChild size="sm" className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white border-0" data-testid="button-get-started">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Professional business team using ARGILETTE AI-powered CRM and business management platform for collaboration and growth" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[hsl(228,47%,10%)/95]" />
        </div>

        <div className="container relative mx-auto px-4 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-[hsl(227,89%,63%)/10] border border-[hsl(227,89%,63%)/30] px-4 py-2">
                <Sparkles className="h-4 w-4 text-[hsl(227,89%,63%)]" />
                <span className="text-sm font-medium text-[hsl(227,89%,63%)]">
                  AI-Powered Business Platform
                </span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-[hsl(210,17%,98%)]">
                <span className="text-[hsl(227,89%,63%)]">AI Business Platform:</span>{" "}
                CRM Software + SEO Tools + Link Building
              </h1>
              
              <p className="text-xl text-[hsl(215,20%,65%)] max-w-lg">
                All-in-one CRM software + E-commerce builder + SEO tools + Link Building + 6 AI Employees. Track your brand across 11 platforms. Monthly subscription starting at $69.99.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="text-base bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white border-0" 
                  data-testid="button-start-free-trial"
                >
                  <Link href="/signup">
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-base border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)] hover:text-[hsl(210,17%,98%)]" data-testid="button-watch-demo">
                  <a href="#features">
                    Explore Features
                  </a>
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="space-y-2 text-center sm:text-left">
                      <Icon className="h-5 w-5 text-[hsl(227,89%,63%)] mb-1" />
                      <div className="text-2xl font-bold text-[hsl(227,89%,63%)]">
                        {stat.value}
                      </div>
                      <div className="text-xs text-[hsl(215,20%,65%)]">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Card className="max-w-md mx-auto w-full bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)]" data-testid="card-login">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-[hsl(210,17%,98%)]">Welcome Back</CardTitle>
                <CardDescription className="text-[hsl(215,20%,65%)]">
                  Sign in to access your intelligent CRM dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[hsl(210,17%,98%)]">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={isLoginLoading}
                      className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)]"
                      data-testid="input-login-email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="password" className="text-[hsl(210,17%,98%)]">Password</Label>
                      <Link href="/forgot-password" className="text-sm text-[hsl(227,89%,63%)] hover:underline" data-testid="link-forgot-password">
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
                      className="bg-[hsl(229,41%,16%)] border-[hsl(217,33%,17%)] text-[hsl(210,17%,98%)] placeholder:text-[hsl(215,16%,47%)]"
                      data-testid="input-login-password"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white border-0" 
                    disabled={isLoginLoading}
                    data-testid="button-login-submit"
                  >
                    {isLoginLoading ? "Signing in..." : "Sign In"}
                  </Button>
                  
                  <div className="text-center text-sm text-[hsl(215,20%,65%)]">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-[hsl(227,89%,63%)] hover:underline font-medium" data-testid="link-signup">
                      Create one now
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32 bg-[hsl(228,47%,10%)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[hsl(229,41%,16%)/20] [mask-image:radial-gradient(white,transparent_85%)]" />
        <div className="container relative mx-auto px-4 lg:px-8">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full bg-[hsl(227,89%,63%)/10] border border-[hsl(227,89%,63%)/30] px-4 py-2 mb-6">
              <Bot className="h-4 w-4 text-[hsl(227,89%,63%)]" />
              <span className="text-sm font-medium text-[hsl(227,89%,63%)]">
                AI Autonomous Workforce
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-[hsl(210,17%,98%)]">
              Meet Your{" "}
              <span className="text-[hsl(227,89%,63%)]">AI Employees</span>
            </h2>
            <p className="text-xl text-[hsl(215,20%,65%)] mb-12">
              6 specialized AI agents working 24/7 to automate your CRM operations, social media, lead qualification, and sales—powered by GPT-5
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] hover:border-[hsl(227,89%,63%)/50] transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-[hsl(229,41%,16%)] flex items-center justify-center mb-3">
                  <MessageSquare className="h-6 w-6 text-[hsl(227,89%,63%)]" />
                </div>
                <CardTitle className="text-lg text-[hsl(210,17%,98%)]">Social Media Author</CardTitle>
                <CardDescription className="text-sm text-[hsl(215,20%,65%)]">
                  Generates platform-specific posts for LinkedIn, Twitter, Facebook & Instagram with engaging hooks and CTAs
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] hover:border-[hsl(227,89%,63%)/50] transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-[hsl(229,41%,16%)] flex items-center justify-center mb-3">
                  <Mail className="h-6 w-6 text-[hsl(227,89%,63%)]" />
                </div>
                <CardTitle className="text-lg text-[hsl(210,17%,98%)]">SDR Outreach Agent</CardTitle>
                <CardDescription className="text-sm text-[hsl(215,20%,65%)]">
                  Creates personalized prospecting emails using BANT qualification framework for higher response rates
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] hover:border-[hsl(227,89%,63%)/50] transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-[hsl(229,41%,16%)] flex items-center justify-center mb-3">
                  <Zap className="h-6 w-6 text-[hsl(227,89%,63%)]" />
                </div>
                <CardTitle className="text-lg text-[hsl(210,17%,98%)]">Reply Handler</CardTitle>
                <CardDescription className="text-sm text-[hsl(215,20%,65%)]">
                  Classifies email intent and generates smart auto-responses for positive replies, objections, and pricing questions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] hover:border-[hsl(227,89%,63%)/50] transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-[hsl(229,41%,16%)] flex items-center justify-center mb-3">
                  <Target className="h-6 w-6 text-[hsl(227,89%,63%)]" />
                </div>
                <CardTitle className="text-lg text-[hsl(210,17%,98%)]">Closer Agent</CardTitle>
                <CardDescription className="text-sm text-[hsl(215,20%,65%)]">
                  Drafts winning proposals, meeting recaps, and closing emails to advance deals through your pipeline
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] hover:border-[hsl(227,89%,63%)/50] transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-[hsl(229,41%,16%)] flex items-center justify-center mb-3">
                  <MessageSquare className="h-6 w-6 text-[hsl(227,89%,63%)]" />
                </div>
                <CardTitle className="text-lg text-[hsl(210,17%,98%)]">Chat Qualifier Bot</CardTitle>
                <CardDescription className="text-sm text-[hsl(215,20%,65%)]">
                  Website chat widget with 4-turn qualification flow that identifies hot leads and offers meeting booking
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] hover:border-[hsl(227,89%,63%)/50] transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-[hsl(229,41%,16%)] flex items-center justify-center mb-3">
                  <TrendingUp className="h-6 w-6 text-[hsl(227,89%,63%)]" />
                </div>
                <CardTitle className="text-lg text-[hsl(210,17%,98%)]">Lead Scorer</CardTitle>
                <CardDescription className="text-sm text-[hsl(215,20%,65%)]">
                  AI-powered scoring analyzing fit (40%), engagement (35%), and readiness (25%) to prioritize your hottest leads
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="text-center">
            <div className="inline-flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button asChild size="lg" className="bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white border-0">
                <Link href="/signup">
                  Get Your AI Team <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-sm text-[hsl(215,20%,65%)]">
                Powered by GPT-5 • Multi-tenant isolated • Privacy-safe logging
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 lg:py-32 bg-[hsl(228,47%,10%)]" aria-label="Platform features">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-[hsl(227,89%,63%)/10] border-[hsl(227,89%,63%)/30] text-[hsl(227,89%,63%)]">
              Platform Features
            </Badge>
            <h2 className="text-3xl lg:text-5xl font-bold mb-4 text-[hsl(210,17%,98%)]">
              Complete Business Management:{" "}
              <span className="text-[hsl(227,89%,63%)]">
                CRM, E-commerce & SEO Tools
              </span>
            </h2>
            <p className="text-lg text-[hsl(215,20%,65%)]">
              AI-powered features combining customer relationship management, online store builder, SEO analytics, and marketing automation in one platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {comprehensiveFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="group bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] hover:border-[hsl(227,89%,63%)/50] transition-all duration-300 overflow-hidden" 
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
                      <div className="absolute inset-0 bg-[hsl(228,47%,10%)/60]" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-[hsl(229,41%,16%)] flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-[hsl(227,89%,63%)]" />
                    </div>
                    <CardTitle className="text-xl text-[hsl(210,17%,98%)] group-hover:text-[hsl(227,89%,63%)] transition-colors">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-base text-[hsl(215,20%,65%)]">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="benefits" className="py-24 lg:py-32 bg-[hsl(228,47%,10%)]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-[hsl(210,17%,98%)]">
              Why Choose ARGILETTE?
            </h2>
            <p className="text-lg text-[hsl(215,20%,65%)]">
              Built with modern technology and designed for the future
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="text-center bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] hover:border-[hsl(227,89%,63%)/50] transition-all">
                  <CardHeader>
                    <div className="h-16 w-16 rounded-full bg-[hsl(229,41%,16%)] flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-[hsl(227,89%,63%)]" />
                    </div>
                    <CardTitle className="text-lg text-[hsl(210,17%,98%)]">{benefit.title}</CardTitle>
                    <CardDescription className="text-sm text-[hsl(215,20%,65%)]">
                      {benefit.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden bg-[hsl(228,47%,10%)]">
        <div className="container relative mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-3 p-6 rounded-lg bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)]">
              <div className="h-12 w-12 rounded-full bg-[hsl(229,41%,16%)] flex items-center justify-center mx-auto">
                <Shield className="h-6 w-6 text-[hsl(142,76%,36%)]" />
              </div>
              <h3 className="font-semibold text-lg text-[hsl(210,17%,98%)]">Enterprise Security</h3>
              <p className="text-sm text-[hsl(215,20%,65%)]">Bank-level encryption & protection</p>
            </div>
            <div className="text-center space-y-3 p-6 rounded-lg bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)]">
              <div className="h-12 w-12 rounded-full bg-[hsl(229,41%,16%)] flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6 text-[hsl(227,89%,63%)]" />
              </div>
              <h3 className="font-semibold text-lg text-[hsl(210,17%,98%)]">99.9% Uptime</h3>
              <p className="text-sm text-[hsl(215,20%,65%)]">Guaranteed availability SLA</p>
            </div>
            <div className="text-center space-y-3 p-6 rounded-lg bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)]">
              <div className="h-12 w-12 rounded-full bg-[hsl(229,41%,16%)] flex items-center justify-center mx-auto">
                <Lock className="h-6 w-6 text-[hsl(227,89%,63%)]" />
              </div>
              <h3 className="font-semibold text-lg text-[hsl(210,17%,98%)]">GDPR Compliant</h3>
              <p className="text-sm text-[hsl(215,20%,65%)]">Full data protection compliance</p>
            </div>
            <div className="text-center space-y-3 p-6 rounded-lg bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)]">
              <div className="h-12 w-12 rounded-full bg-[hsl(229,41%,16%)] flex items-center justify-center mx-auto">
                <Smartphone className="h-6 w-6 text-[hsl(227,89%,63%)]" />
              </div>
              <h3 className="font-semibold text-lg text-[hsl(210,17%,98%)]">Mobile Ready</h3>
              <p className="text-sm text-[hsl(215,20%,65%)]">Access from anywhere, anytime</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-32 bg-[hsl(228,47%,10%)]">
        <div className="container mx-auto px-4 lg:px-8">
          <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)] overflow-hidden relative">
            <CardContent className="relative p-12 lg:p-16 text-center">
              <div className="max-w-3xl mx-auto space-y-6">
                <Badge className="bg-[hsl(227,89%,63%)/10] border-[hsl(227,89%,63%)/30] text-[hsl(227,89%,63%)]">
                  Limited Time Offer
                </Badge>
                <h2 className="text-3xl lg:text-5xl font-bold text-[hsl(210,17%,98%)]">
                  Ready to Transform Your Business?
                </h2>
                <p className="text-lg text-[hsl(215,20%,65%)] max-w-2xl mx-auto">
                  Join thousands of businesses using ARGILETTE to streamline operations, boost productivity, and accelerate growth
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button 
                    asChild 
                    size="lg" 
                    className="text-base bg-[hsl(227,89%,63%)] hover:bg-[hsl(227,89%,55%)] text-white border-0" 
                    data-testid="button-cta-start"
                  >
                    <Link href="/signup">
                      Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-base border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)] hover:text-[hsl(210,17%,98%)]" data-testid="button-cta-pricing">
                    <Link href="/pricing">
                      View Pricing Plans
                    </Link>
                  </Button>
                </div>
                <p className="text-sm text-[hsl(215,20%,65%)] pt-4">
                  <CheckCircle className="inline h-4 w-4 text-[hsl(142,76%,36%)] mr-1" />
                  No credit card required •{" "}
                  <CheckCircle className="inline h-4 w-4 text-[hsl(142,76%,36%)] mr-1" />
                  14-day free trial •{" "}
                  <CheckCircle className="inline h-4 w-4 text-[hsl(142,76%,36%)] mr-1" />
                  Cancel anytime
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-24 lg:py-32 bg-[hsl(229,41%,16%)]">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-[hsl(227,89%,63%)/10] border-[hsl(227,89%,63%)/30] text-[hsl(227,89%,63%)]">Frequently Asked Questions</Badge>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-[hsl(210,17%,98%)]">
                Everything You Need to Know About ARGILETTE
              </h2>
              <p className="text-[hsl(215,20%,65%)] text-lg">
                Get instant answers to common questions about our all-in-one business platform
              </p>
            </div>

            <div className="space-y-4">
              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)]">
                <CardHeader>
                  <CardTitle className="text-lg text-[hsl(210,17%,98%)]">What is ARGILETTE?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[hsl(215,20%,65%)]">
                    ARGILETTE is a comprehensive all-in-one business platform that combines CRM, e-commerce, SEO tools, marketing automation, and financial management. It uses AI to help businesses optimize their operations across 11 different search and social platforms.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)]">
                <CardHeader>
                  <CardTitle className="text-lg text-[hsl(210,17%,98%)]">How much does ARGILETTE cost?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[hsl(215,20%,65%)]">
                    ARGILETTE offers flexible monthly subscription plans with AI Employee automation: $69.99/month for Starter (1,000 AI operations), $179.99/month for Professional (5,000 AI operations), $349.99/month for Business (15,000 AI operations), and $899.99/month for Enterprise (unlimited AI operations). All plans include CRM, SEO, E-commerce, Link Building, 11-platform tracking, and 6 AI Employees. 90% cheaper than buying Semrush + HubSpot + Drift + Copy.ai separately!
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)]">
                <CardHeader>
                  <CardTitle className="text-lg text-[hsl(210,17%,98%)]">What platforms does ARGILETTE track?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[hsl(215,20%,65%)]">
                    ARGILETTE tracks your brand visibility across 11 platforms: Google, YouTube, Instagram, TikTok, Pinterest, Amazon, ChatGPT, Perplexity AI, Google Gemini, Microsoft Copilot, and Claude AI. This gives you complete visibility into where your brand appears online.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)]">
                <CardHeader>
                  <CardTitle className="text-lg text-[hsl(210,17%,98%)]">How many languages does ARGILETTE support?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[hsl(215,20%,65%)]">
                    ARGILETTE supports 20+ languages including English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Arabic, Hindi, and more. The platform includes automatic translation for global reach.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)]">
                <CardHeader>
                  <CardTitle className="text-lg text-[hsl(210,17%,98%)]">What makes ARGILETTE better than competitors like Semrush or HubSpot?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[hsl(215,20%,65%)]">
                    Unlike competitors that only focus on one area (SEO, CRM, or e-commerce), ARGILETTE combines everything in one platform. You get Semrush-level SEO tools, HubSpot-level CRM, Shopify-level e-commerce, PLUS link building and AI-powered insights - all at a fraction of the cost of buying these tools separately.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[hsl(228,47%,12%)] border border-[hsl(217,33%,17%)]">
                <CardHeader>
                  <CardTitle className="text-lg text-[hsl(210,17%,98%)]">Does ARGILETTE include link building tools?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[hsl(215,20%,65%)]">
                    Yes! ARGILETTE includes comprehensive link building features with AI-powered opportunity discovery, competitor backlink analysis, broken link detection, automated outreach campaigns with AI-generated personalized emails, and link health monitoring. This feature alone is worth hundreds of dollars per month from competitors like Ahrefs.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-12">
              <p className="text-[hsl(215,20%,65%)] mb-4">
                Have more questions?
              </p>
              <Button asChild variant="outline" className="border-[hsl(217,33%,17%)] text-[hsl(215,20%,65%)] hover:bg-[hsl(229,41%,16%)] hover:text-[hsl(210,17%,98%)]" data-testid="button-contact-support">
                <Link href="/contact">
                  Contact Our Support Team
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[hsl(217,33%,17%)] bg-[hsl(228,47%,10%)]">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Logo size="sm" />
                <span className="font-bold text-[hsl(210,17%,98%)]">
                  ARGILETTE
                </span>
              </div>
              <p className="text-sm text-[hsl(215,20%,65%)]">
                Complete AI Business Management Platform for the modern enterprise
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[hsl(210,17%,98%)]">Product</h4>
              <ul className="space-y-2 text-sm text-[hsl(215,20%,65%)]">
                <li><a href="#features" className="hover:text-[hsl(227,89%,63%)] transition-colors">Features</a></li>
                <li><Link href="/pricing" className="hover:text-[hsl(227,89%,63%)] transition-colors">Pricing</Link></li>
                <li><a href="#" className="hover:text-[hsl(227,89%,63%)] transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[hsl(210,17%,98%)]">Company</h4>
              <ul className="space-y-2 text-sm text-[hsl(215,20%,65%)]">
                <li><Link href="/about" className="hover:text-[hsl(227,89%,63%)] transition-colors">About</Link></li>
                <li><a href="#contact" className="hover:text-[hsl(227,89%,63%)] transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-[hsl(227,89%,63%)] transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-[hsl(210,17%,98%)]">Legal</h4>
              <ul className="space-y-2 text-sm text-[hsl(215,20%,65%)]">
                <li><Link href="/privacy" className="hover:text-[hsl(227,89%,63%)] transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-[hsl(227,89%,63%)] transition-colors">Terms</Link></li>
                <li><a href="#" className="hover:text-[hsl(227,89%,63%)] transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-[hsl(217,33%,17%)] text-center">
            <p className="text-sm text-[hsl(215,16%,47%)]">
              © 2025 ARGILETTE by Argilette.org. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </PageTranslator>
  );
}
