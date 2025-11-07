import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3, 
  MessageSquare,
  ArrowRight,
  CheckCircle,
  Star
} from "lucide-react";

export default function Welcome() {
  const features = [
    {
      icon: Brain,
      title: "Advanced AI Insights",
      description: "Understand customer behavior and sentiment in real-time",
      badge: "AI-Powered"
    },
    {
      icon: Users,
      title: "Complete CRM Suite",
      description: "Manage contacts, deals, leads, and customer relationships",
      badge: "Core"
    },
    {
      icon: TrendingUp,
      title: "Advanced Analytics",
      description: "Revenue forecasting and business intelligence dashboard",
      badge: "Analytics"
    },
    {
      icon: MessageSquare,
      title: "Unified Communications",
      description: "Email, SMS, chat, and call management in one place",
      badge: "Marketing"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Role-based permissions and data encryption",
      badge: "Security"
    },
    {
      icon: Zap,
      title: "Workflow Automation",
      description: "Automate repetitive tasks and business processes",
      badge: "Automation"
    }
  ];

  const benefits = [
    "40+ integrated CRM features",
    "Multi-tenant company isolation",
    "Real-time sentiment analysis",
    "Advanced reporting & forecasting",
    "Email & SMS marketing automation",
    "Team collaboration tools",
    "Financial management suite",
    "Role-based access control"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">NODE CRM</h1>

            </div>
            <Link href="/">
              <Button>
                Login to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <span className="text-sm text-gray-600 ml-2">The only CRM that understands emotions</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            The Future of 
            <span className="text-blue-600 block">Customer Relationships</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            ARGILETTE CRM combines advanced customer relationship management with 
            AI-powered insights to help you understand not just what your customers do, 
            but their complete behavior patterns.
          </p>

          <div className="flex justify-center space-x-4">
            <Link href="/">
              <Button size="lg" className="px-8">
                Try Demo Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/setup">
              <Button size="lg" variant="outline" className="px-8">
                Create Company Account
              </Button>
            </Link>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            Demo: Try the platform with sample data • No signup required
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-lg text-gray-600">
              Powerful features designed for modern businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Icon className="h-8 w-8 text-blue-600" />
                      <Badge variant="outline">{feature.badge}</Badge>
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Choose ARGILETTE CRM?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We've built the most comprehensive CRM platform that combines traditional 
                customer management with cutting-edge AI-powered analytics.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-blue-100 mb-6">
                Experience the power of AI-driven insights in customer relationships. 
                Create your demo account and explore all features instantly.
              </p>
              
              <div className="space-y-4">
                <Link href="/demo-signup">
                  <Button size="lg" variant="secondary" className="w-full">
                    Start Free Demo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                <Link href="/">
                  <Button size="lg" variant="outline" className="w-full text-white border-white hover:bg-white hover:text-blue-600">
                    Admin Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">NODE CRM</h3>
            <p className="text-gray-400 mb-6">
              Powered by Argilette Lab
            </p>
            <div className="flex justify-center space-x-8">
              <Link href="/">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/setup">
                <Button variant="ghost" size="sm">Create Account</Button>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}