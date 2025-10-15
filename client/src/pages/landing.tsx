import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Brain, Heart, TrendingUp, Users, MessageSquare, BarChart3, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/logo";
import { redirectToDashboard } from "@/lib/dashboard-routing";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
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
        redirectToDashboard(email);
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
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
    // Check if user has auth token and redirect accordingly
    const token = localStorage.getItem('auth_token');
    console.log('Landing useEffect - token:', !!token, 'authLoading:', authLoading, 'isAuthenticated:', isAuthenticated, 'user:', authData);
    
    if (token && !authLoading && isAuthenticated && authData) {
      console.log('Redirecting to dashboard...');
      const userEmail = localStorage.getItem('user_email') || authData.email;
      setTimeout(() => {
        redirectToDashboard(userEmail);
      }, 100);
    }
  }, [isAuthenticated, authLoading, authData]);

  // If we have a token but still loading, show loading
  if (localStorage.getItem('auth_token') && authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If authenticated, redirect to dashboard
  if (isAuthenticated && authData) {
    console.log('User has token, redirecting to dashboard');
    setTimeout(() => {
      const userEmail = localStorage.getItem('user_email') || authData.email;
      redirectToDashboard(userEmail);
    }, 100);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  console.log('Landing page rendering, authLoading:', authLoading, 'isAuthenticated:', isAuthenticated);

  // Debug: Always render landing page content for now
  console.log('Rendering landing page with email state:', email);

  const features = [
    {
      icon: Brain,
      title: "Emotional Intelligence",
      description: "AI-powered sentiment analysis understands customer emotions in every interaction"
    },
    {
      icon: Heart,
      title: "Relationship Building",
      description: "Build deeper connections with personalized communication strategies"
    },
    {
      icon: TrendingUp,
      title: "Predictive Analytics",
      description: "Anticipate customer needs with advanced behavioral analysis"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Unified workspace for seamless customer relationship management"
    },
    {
      icon: MessageSquare,
      title: "Smart Communications",
      description: "Multi-channel messaging with emotional context awareness"
    },
    {
      icon: BarChart3,
      title: "Advanced Reporting",
      description: "Comprehensive insights into customer sentiment and engagement"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Logo size="2xl" variant="colored" />
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            The Future of<br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Customer Relationships
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            ARGILETTE CRM combines advanced customer relationship management with emotional intelligence 
            to help you understand not just what your customers do, but how they feel.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Login Form */}
          <div className="order-2 lg:order-1">
            <Card className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-semibold text-gray-900">Login to Dashboard</CardTitle>
                <CardDescription className="text-gray-600">
                  The only CRM that understands emotions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                    disabled={isLoginLoading}
                  >
                    {isLoginLoading ? "Signing In..." : "Access Dashboard"}
                  </Button>
                </form>
                <div className="mt-4 text-center">
                  <Link to="/demo-signup">
                    <Button variant="outline" size="sm" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50">
                      Create Company Account
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="order-1 lg:order-2">
            <div className="grid gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="bg-white/60 backdrop-blur-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <feature.icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Security Badge */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 bg-green-50 border border-green-200 rounded-full px-4 py-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">Enterprise-Grade Security</span>
          </div>
        </div>
      </div>

      {/* Custom Software Solutions Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h2 className="text-4xl font-bold mb-6">
                Transform Your Business with
                <span className="block text-cyan-400">Custom Software Solutions</span>
              </h2>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Our AI-powered CRM platform delivers custom software solutions that adapt to your unique business needs. 
                Experience the future of customer relationship management with intelligent automation and emotional insights.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400">195+</div>
                  <div className="text-blue-200">Countries Supported</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400">99.9%</div>
                  <div className="text-blue-200">Uptime Guarantee</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/assets/custom-software-hero.png" 
                alt="Ways custom software can help your business" 
                className="w-full h-auto rounded-lg shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Growth Section */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="/assets/business-growth-presentation.png" 
                alt="10 Ways to Grow Your Business with Custom Software Development" 
                className="w-full h-auto rounded-lg shadow-2xl"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Drive Growth with
                <span className="block bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Data-Driven Insights
                </span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Unlock your business potential with our comprehensive analytics and reporting tools. 
                Make informed decisions based on real customer emotions and behavioral patterns.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Real-time performance dashboards</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Predictive analytics and forecasting</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-gray-700">Automated reporting and insights</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CRM Benefits Section */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Why Choose NODE CRM?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the comprehensive benefits of our emotional intelligence CRM platform 
              designed to transform your customer relationships.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="/assets/crm-benefits-diagram.png" 
                alt="CRM Benefits: Better Alignment, Satisfaction, Contact Management, Improved Productivity, Activity Logging, Free Time, Less Time Learning, User Adoption, Ease of Scheduling Meetings" 
                className="w-full h-auto rounded-lg shadow-xl"
              />
            </div>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md border border-blue-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Enhanced Productivity</h3>
                <p className="text-gray-600">Streamline workflows and automate routine tasks to focus on what matters most - building meaningful customer relationships.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border border-purple-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Better Customer Satisfaction</h3>
                <p className="text-gray-600">Understand customer emotions and deliver personalized experiences that increase satisfaction and loyalty.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border border-green-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Seamless User Adoption</h3>
                <p className="text-gray-600">Intuitive interface and powerful features ensure your team can get up and running quickly with minimal training.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Customer Relationships?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using NODE CRM to build deeper, more meaningful customer connections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/demo-signup">
              <Button size="lg" className="bg-white text-purple-900 hover:bg-gray-100 font-semibold px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-900 font-semibold px-8 py-3">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}