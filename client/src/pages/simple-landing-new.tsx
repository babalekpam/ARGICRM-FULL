import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Brain, Heart, TrendingUp, Users, MessageSquare, BarChart3, Shield, Zap, CheckCircle, Play, Globe } from "lucide-react";
import Logo from "@/components/logo";
import { SEO } from "@/components/SEO";
import { useConversionTracking } from "@/components/conversion-tracking";
import aiCrmSoftwareImage from "@assets/image_1760534282689.png";

export default function SimpleLanding() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const { trackConversion } = useConversionTracking();
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // /lander redirects now handled by server-side Express routes
  
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
      // Use the proper authentication flow from useAuth
      const result = await login(loginEmail, loginPassword);
      
      if (result.success) {
        console.log('✅ Landing page login successful, redirecting to dashboard');
        // The useEffect above will handle the navigation when user state updates
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
      title: "Emotional Intelligence CRM",
      description: "World's first AI-powered sentiment analysis that understands customer emotions in real-time across all interactions"
    },
    {
      icon: Heart,
      title: "E-commerce Store Builder", 
      description: "Complete online store creation with AI recommendations, inventory management, and seamless payment integration"
    },
    {
      icon: TrendingUp,
      title: "Advanced Business Analytics",
      description: "Predictive insights, customer behavior analysis, and comprehensive reporting across all business operations"
    },
    {
      icon: Users,
      title: "Project & HR Management",
      description: "Unified workspace for team collaboration, project tracking, employee management, and performance monitoring"
    },
    {
      icon: MessageSquare,
      title: "Email & SMS Marketing",
      description: "Professional bulk email campaigns, SMS marketing automation, and personalized communication strategies"
    },
    {
      icon: BarChart3,
      title: "Financial Management",
      description: "Multi-currency invoicing, expense tracking, financial reporting, and automated tax calculations for global operations"
    },
    {
      icon: Shield,
      title: "Enterprise Security & Compliance",
      description: "Bank-level security with complete data protection, GDPR compliance, and audit-ready documentation"
    },
    {
      icon: Zap,
      title: "AI Automation & Workflows",
      description: "Intelligent process automation, lead scoring, deal prediction, and adaptive workflows that optimize business performance"
    },
    {
      icon: Globe,
      title: "Global Multi-Language Support",
      description: "Complete localization for 195+ countries with 20+ languages, multi-currency support, and cultural adaptation"
    },
    {
      icon: CheckCircle,
      title: "Offline & White-Label Ready",
      description: "Full offline capabilities for remote operations and white-label customization for agencies and resellers"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEO
        title="NODE CRM - Complete AI Business Management Platform | E-commerce, Marketing & CRM"
        description="Revolutionary AI-powered business platform combining Emotional Intelligence CRM, e-commerce store builder, email marketing automation, project management, and global multi-currency support. Transform your business operations with comprehensive automation across 195+ countries. Start free 14-day trial."
        keywords="AI business management platform, emotional intelligence CRM, e-commerce store builder, email marketing automation, project management software, multi-currency business platform, global CRM software, AI sales automation, customer sentiment analysis, business intelligence platform, white-label CRM, offline business management"
        canonical="https://argilette.org/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "NODE CRM",
          "description": "Complete AI-Powered Business Management Platform with Emotional Intelligence CRM, E-commerce Builder, Marketing Automation, and Global Operations Support",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "offers": {
            "@type": "Offer",
            "price": "99",
            "priceCurrency": "USD",
            "description": "Starting at $99/month with 14-day free trial"
          },
          "provider": {
            "@type": "Organization",
            "name": "Argilette",
            "url": "https://argilette.org",
            "foundingDate": "2024",
            "description": "Leading provider of AI-powered business management solutions"
          },
          "featureList": [
            "Emotional Intelligence CRM with AI Sentiment Analysis",
            "Complete E-commerce Store Builder",
            "Email & SMS Marketing Automation", 
            "Project & HR Management",
            "Financial Management & Multi-Currency Support",
            "Global Operations (195+ Countries, 20+ Languages)",
            "Offline Business Management",
            "White-Label & Agency Solutions",
            "Advanced Business Analytics & Reporting",
            "Enterprise Security & Compliance"
          ],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "1247"
          }
        }}
      />
      
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Logo size="sm" />
              <span className="text-xl font-bold text-gray-900">NODE CRM</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <Link to="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</Link>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Image */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative w-full max-w-lg">
              <img 
                src={aiCrmSoftwareImage} 
                alt="AI-Powered Smart CRM Software - NODE CRM Dashboard Features" 
                className="w-full h-auto object-contain rounded-xl shadow-2xl bg-white p-4"
                style={{ maxHeight: '500px' }}
              />
            </div>
          </div>

          {/* Right Side - Content and Login */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Complete AI Business <br />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Management Platform
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                NODE CRM combines Emotional Intelligence CRM, E-commerce Store Builder, Email Marketing, 
                Project Management, and Financial Operations in one powerful platform. Build, manage, and grow 
                your business with AI automation across 195+ countries and 20+ languages.
              </p>
              
              <div className="flex flex-wrap gap-3 mb-8">
                <Badge variant="secondary" className="text-sm px-3 py-1">✨ AI-Powered CRM</Badge>
                <Badge variant="secondary" className="text-sm px-3 py-1">🛒 E-commerce Builder</Badge>
                <Badge variant="secondary" className="text-sm px-3 py-1">📧 Email Marketing</Badge>
                <Badge variant="secondary" className="text-sm px-3 py-1">💰 Financial Management</Badge>
                <Badge variant="secondary" className="text-sm px-3 py-1">🌍 195+ Countries</Badge>
              </div>
            </div>

            {/* Login Form */}
            <div className="max-w-md mx-auto lg:mx-0">
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-center">Sign In to NODE CRM</CardTitle>
                  <CardDescription className="text-center">
                    Access your intelligent CRM dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="mt-1"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={isLoginLoading}
                    >
                      {isLoginLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                  
                  <div className="mt-6 text-center space-y-4">
                    <p className="text-sm text-gray-600">
                      Don't have an account?{' '}
                      <Link to="/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                        Start Free 14-Day Trial
                      </Link>
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Payment method required</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>Cancel anytime</span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              AI-Powered Business Management Suite
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your business with comprehensive CRM, e-commerce, marketing, and operational tools in one platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {comprehensiveFeatures.slice(0, 8).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="bg-white/60 backdrop-blur-sm border border-gray-200 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="mb-4">
                      <Icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Statistics Section */}
        <div className="py-16 bg-white/50 rounded-3xl mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by Growing Businesses Worldwide
            </h2>
            <p className="text-lg text-gray-600">
              Join the revolution of emotional intelligence in business relationships
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">195+</div>
              <div className="text-sm text-gray-600">Countries Supported</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">20+</div>
              <div className="text-sm text-gray-600">Languages Available</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
              <div className="text-sm text-gray-600">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-sm text-gray-600">Customer Support</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Customer Relationships?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of businesses already using NODE CRM's emotional intelligence 
            to build deeper connections and drive growth across global markets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="px-8 py-4 text-lg shadow-xl">
                Start Your 14-Day Free Trial
              </Button>
            </Link>
            <Link to="/features">
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-blue-600">
                Explore All Features
              </Button>
            </Link>
          </div>
          <p className="text-sm mt-4 opacity-75">Payment method required for trial abuse prevention • Cancel anytime</p>
        </div>
      </div>

      {/* All-in-One Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything Your Business Needs in One Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stop paying for multiple tools. NODE CRM includes CRM, e-commerce, marketing, project management, and more
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Heart className="w-8 h-8 text-red-500 mr-3" />
                  <h3 className="text-xl font-semibold">E-commerce Store Builder</h3>
                </div>
                <p className="text-gray-600 mb-4">Complete online store with AI recommendations, inventory management, payment processing</p>
                <div className="text-sm text-blue-600">• Drag & drop builder • Payment integration • Inventory tracking</div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <MessageSquare className="w-8 h-8 text-blue-500 mr-3" />
                  <h3 className="text-xl font-semibold">Email & SMS Marketing</h3>
                </div>
                <p className="text-gray-600 mb-4">Professional bulk email campaigns, SMS automation, and personalized messaging</p>
                <div className="text-sm text-blue-600">• Bulk email campaigns • SMS automation • Template library</div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <BarChart3 className="w-8 h-8 text-green-500 mr-3" />
                  <h3 className="text-xl font-semibold">Financial Management</h3>
                </div>
                <p className="text-gray-600 mb-4">Multi-currency invoicing, expense tracking, financial reporting, tax calculations</p>
                <div className="text-sm text-blue-600">• Invoice generation • Multi-currency • Financial reports</div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Users className="w-8 h-8 text-purple-500 mr-3" />
                  <h3 className="text-xl font-semibold">Project & HR Management</h3>
                </div>
                <p className="text-gray-600 mb-4">Complete project tracking, team collaboration, employee management, performance monitoring</p>
                <div className="text-sm text-blue-600">• Project tracking • Team collaboration • HR tools</div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Globe className="w-8 h-8 text-orange-500 mr-3" />
                  <h3 className="text-xl font-semibold">Global Operations</h3>
                </div>
                <p className="text-gray-600 mb-4">195+ countries, 20+ languages, multi-currency support, cultural adaptation</p>
                <div className="text-sm text-blue-600">• 195+ countries • 20+ languages • Multi-currency</div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Zap className="w-8 h-8 text-yellow-500 mr-3" />
                  <h3 className="text-xl font-semibold">AI Automation</h3>
                </div>
                <p className="text-gray-600 mb-4">Intelligent workflows, lead scoring, deal prediction, emotional intelligence analysis</p>
                <div className="text-sm text-blue-600">• AI workflows • Lead scoring • Sentiment analysis</div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Missing Services */}
          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Globe className="w-8 h-8 text-teal-500 mr-3" />
                  <h3 className="text-xl font-semibold">Landing Page Builder</h3>
                </div>
                <p className="text-gray-600 mb-4">Drag-and-drop landing page creation with AI recommendations and professional templates</p>
                <div className="text-sm text-blue-600">• Drag & drop editor • AI recommendations • Template library</div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <TrendingUp className="w-8 h-8 text-indigo-500 mr-3" />
                  <h3 className="text-xl font-semibold">SEO Management</h3>
                </div>
                <p className="text-gray-600 mb-4">Complete SEO optimization tools, keyword tracking, and search engine performance monitoring</p>
                <div className="text-sm text-blue-600">• SEO optimization • Keyword tracking • Performance monitoring</div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Shield className="w-8 h-8 text-pink-500 mr-3" />
                  <h3 className="text-xl font-semibold">Reputation Management</h3>
                </div>
                <p className="text-gray-600 mb-4">Multi-platform monitoring, review management, and predictive reputation scoring</p>
                <div className="text-sm text-blue-600">• Multi-platform monitoring • Review management • Predictive scores</div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <BarChart3 className="w-8 h-8 text-cyan-500 mr-3" />
                  <h3 className="text-xl font-semibold">Document Management</h3>
                </div>
                <p className="text-gray-600 mb-4">Centralized document storage, version control, and collaborative editing capabilities</p>
                <div className="text-sm text-blue-600">• Document storage • Version control • Collaborative editing</div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Users className="w-8 h-8 text-emerald-500 mr-3" />
                  <h3 className="text-xl font-semibold">Video Conferencing</h3>
                </div>
                <p className="text-gray-600 mb-4">Integrated video meetings, screen sharing, and real-time collaboration tools</p>
                <div className="text-sm text-blue-600">• Video meetings • Screen sharing • Real-time collaboration</div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="w-8 h-8 text-violet-500 mr-3" />
                  <h3 className="text-xl font-semibold">White-Label Solutions</h3>
                </div>
                <p className="text-gray-600 mb-4">Complete white-label customization for agencies and resellers with custom branding</p>
                <div className="text-sm text-blue-600">• Custom branding • Agency solutions • Reseller tools</div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              12+ Complete Business Solutions in One Platform
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Stop paying for multiple tools. NODE CRM includes everything you need to run your entire business - 
              from customer management to e-commerce, marketing to financial operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/pricing">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 text-lg">
                  See All Features & Pricing
                </Button>
              </Link>
              <Link to="/services-comprehensive">
                <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-blue-600 text-blue-600 hover:bg-blue-50">
                  Explore All Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Get in Touch</h2>
            <p className="text-xl text-gray-300">
              Reach out to the right department for personalized assistance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* General Contact */}
            <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800 transition-colors">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">General Inquiries</h3>
                <div className="space-y-2">
                  <a href="mailto:info@argilette.org" className="text-blue-400 hover:text-blue-300 transition-colors block text-sm">
                    info@argilette.org
                  </a>
                  <a href="mailto:hello@argilette.org" className="text-blue-400 hover:text-blue-300 transition-colors block text-sm">
                    hello@argilette.org
                  </a>
                  <a href="mailto:contact@argilette.org" className="text-blue-400 hover:text-blue-300 transition-colors block text-sm">
                    contact@argilette.org
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800 transition-colors">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Customer Support</h3>
                <div className="space-y-2">
                  <a href="mailto:support@argilette.org" className="text-blue-400 hover:text-blue-300 transition-colors block text-sm">
                    support@argilette.org
                  </a>
                  <a href="mailto:help@argilette.org" className="text-blue-400 hover:text-blue-300 transition-colors block text-sm">
                    help@argilette.org
                  </a>
                  <a href="mailto:service@argilette.org" className="text-blue-400 hover:text-blue-300 transition-colors block text-sm">
                    service@argilette.org
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Sales */}
            <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800 transition-colors">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Sales & Business</h3>
                <div className="space-y-2">
                  <a href="mailto:sales@argilette.org" className="text-blue-400 hover:text-blue-300 transition-colors block text-sm">
                    sales@argilette.org
                  </a>
                  <a href="mailto:business@argilette.org" className="text-blue-400 hover:text-blue-300 transition-colors block text-sm">
                    business@argilette.org
                  </a>
                  <a href="mailto:demo@argilette.org" className="text-blue-400 hover:text-blue-300 transition-colors block text-sm">
                    demo@argilette.org
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Billing */}
            <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800 transition-colors">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Billing & Accounts</h3>
                <div className="space-y-2">
                  <a href="mailto:billing@argilette.org" className="text-blue-400 hover:text-blue-300 transition-colors block text-sm">
                    billing@argilette.org
                  </a>
                  <a href="mailto:accounts@argilette.org" className="text-blue-400 hover:text-blue-300 transition-colors block text-sm">
                    accounts@argilette.org
                  </a>
                  <a href="mailto:finance@argilette.org" className="text-blue-400 hover:text-blue-300 transition-colors block text-sm">
                    finance@argilette.org
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Partnerships */}
            <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800 transition-colors">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Partnerships & Media</h3>
                <div className="space-y-2">
                  <a href="mailto:partnerships@argilette.org" className="text-blue-400 hover:text-blue-300 transition-colors block text-sm">
                    partnerships@argilette.org
                  </a>
                  <a href="mailto:marketing@argilette.org" className="text-blue-400 hover:text-blue-300 transition-colors block text-sm">
                    marketing@argilette.org
                  </a>
                  <a href="mailto:press@argilette.org" className="text-blue-400 hover:text-blue-300 transition-colors block text-sm">
                    press@argilette.org
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Technical */}
            <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800 transition-colors">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Technical Support</h3>
                <div className="space-y-2">
                  <a href="mailto:tech@argilette.org" className="text-blue-400 hover:text-blue-300 transition-colors block text-sm">
                    tech@argilette.org
                  </a>
                  <a href="mailto:api@argilette.org" className="text-blue-400 hover:text-blue-300 transition-colors block text-sm">
                    api@argilette.org
                  </a>
                  <a href="mailto:developers@argilette.org" className="text-blue-400 hover:text-blue-300 transition-colors block text-sm">
                    developers@argilette.org
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-gray-400 mb-4">Available 24/7 for your convenience</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 px-4 py-2">
                📧 Email Support
              </Badge>
              <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 px-4 py-2">
                📞 Phone Support
              </Badge>
              <Badge variant="secondary" className="bg-green-600/20 text-green-300 px-4 py-2">
                💬 Live Chat
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <span className="text-xl font-bold">NODE CRM</span>
            </div>
            <p className="text-gray-400 mb-6">
              The future of customer relationship management
            </p>
            <div className="flex justify-center space-x-6 mb-6">
              <Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">
                Pricing
              </Link>
              <a href="#features" className="text-gray-400 hover:text-white transition-colors">
                Features
              </a>
              <a href="#contact" className="text-gray-400 hover:text-white transition-colors">
                Contact
              </a>
              <Link to="/support" className="text-gray-400 hover:text-white transition-colors">
                Support
              </Link>
            </div>
            <div className="text-sm text-gray-500 space-y-1">
              <p>© 2025 NODE CRM. All rights reserved.</p>
              <p className="text-xs">Contact: info@argilette.org | Support: support@argilette.org | Sales: sales@argilette.org</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}