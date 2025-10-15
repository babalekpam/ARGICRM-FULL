import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, Heart, Users, TrendingUp, MessageSquare, BarChart3, 
  Shield, Zap, Globe, Calendar, DollarSign, FileText,
  Target, Workflow, Database, Phone, Mail, VideoIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/logo";

const features = [
  {
    category: "AI-Powered Intelligence",
    icon: Brain,
    color: "blue",
    features: [
      {
        name: "Emotional Intelligence Hub",
        description: "Advanced sentiment analysis to understand customer emotions and respond appropriately",
        icon: Heart
      },
      {
        name: "Predictive Analytics", 
        description: "AI-driven insights that predict customer behavior and identify opportunities",
        icon: TrendingUp
      },
      {
        name: "Smart Automation",
        description: "Intelligent workflows that adapt and optimize based on customer interactions",
        icon: Zap
      }
    ]
  },
  {
    category: "Customer Management",
    icon: Users,
    color: "green",
    features: [
      {
        name: "360° Customer View",
        description: "Complete customer profiles with interaction history, preferences, and insights",
        icon: Database
      },
      {
        name: "Lead Scoring",
        description: "AI-powered lead qualification and prioritization for maximum conversion",
        icon: Target
      },
      {
        name: "Multi-Channel Communication",
        description: "Unified messaging across email, SMS, phone, and social media platforms",
        icon: MessageSquare
      }
    ]
  },
  {
    category: "Sales & Marketing",
    icon: TrendingUp,
    color: "purple",
    features: [
      {
        name: "Advanced Pipeline Management",
        description: "Visual sales pipeline with drag-and-drop functionality and stage automation",
        icon: Workflow
      },
      {
        name: "Campaign Management",
        description: "Multi-channel marketing campaigns with A/B testing and performance tracking",
        icon: Mail
      },
      {
        name: "Real-time Analytics",
        description: "Comprehensive dashboards with customizable reports and KPI tracking",
        icon: BarChart3
      }
    ]
  },
  {
    category: "Enterprise Features",
    icon: Shield,
    color: "red",
    features: [
      {
        name: "Multi-Language Support",
        description: "Full platform localization in 20+ languages with real-time translation",
        icon: Globe
      },
      {
        name: "Advanced Security",
        description: "Enterprise-grade security with encryption, audit logs, and compliance",
        icon: Shield
      },
      {
        name: "Team Collaboration",
        description: "Real-time collaboration tools with role-based permissions and workflows",
        icon: Users
      }
    ]
  },
  {
    category: "Business Operations",
    icon: FileText,
    color: "orange",
    features: [
      {
        name: "Financial Management",
        description: "Multi-currency invoicing, bookkeeping, and automated tax calculations",
        icon: DollarSign
      },
      {
        name: "Project Management",
        description: "Integrated project tracking with Gantt charts and resource allocation",
        icon: Calendar
      },
      {
        name: "Document Management",
        description: "Secure document storage with version control and collaboration features",
        icon: FileText
      }
    ]
  },
  {
    category: "Communication Hub",
    icon: Phone,
    color: "teal",
    features: [
      {
        name: "Video Conferencing",
        description: "Built-in video calls with screen sharing and meeting recordings",
        icon: VideoIcon
      },
      {
        name: "Smart Notifications",
        description: "Intelligent alerts and reminders based on customer behavior and preferences",
        icon: MessageSquare
      },
      {
        name: "Mobile Accessibility",
        description: "Full-featured mobile app with offline capabilities for remote work",
        icon: Phone
      }
    ]
  }
];

const getColorClasses = (color: string) => {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200", 
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    red: "bg-red-50 text-red-700 border-red-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    teal: "bg-teal-50 text-teal-700 border-teal-200"
  };
  return colors[color as keyof typeof colors] || colors.blue;
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEO
        title="NODE CRM Features - Complete Customer Relationship Management Solution"
        description="Discover NODE CRM's comprehensive feature set including AI-powered sentiment analysis, automated workflows, multi-language support, and enterprise-grade security. Transform your customer relationships today."
        keywords="CRM features, AI customer management, sentiment analysis, sales pipeline, marketing automation, customer analytics, multi-language CRM, enterprise security"
        canonical="https://argilette.org/features"
      />
      
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Logo size="sm" />
              <Link to="/">
                <span className="text-xl font-bold text-gray-900 cursor-pointer">NODE CRM</span>
              </Link>
            </div>
            <div className="hidden md:flex space-x-8">
              <Link to="/features" className="text-blue-600 font-medium">Features</Link>
              <Link to="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</Link>
              <Link to="/signup" className="text-gray-600 hover:text-blue-600 transition-colors">Sign Up</Link>
              <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">Login</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Powerful Features for
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Modern Businesses
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            NODE CRM combines cutting-edge AI technology with intuitive design to deliver 
            a comprehensive customer relationship management solution.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg">
              Start Free Trial
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="space-y-16">
          {features.map((category, categoryIndex) => (
            <div key={categoryIndex} className="space-y-8">
              <div className="text-center">
                <div className={`inline-flex items-center space-x-3 px-6 py-3 rounded-full border-2 ${getColorClasses(category.color)}`}>
                  <category.icon className="h-6 w-6" />
                  <h2 className="text-2xl font-bold">{category.category}</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {category.features.map((feature, featureIndex) => (
                  <Card key={featureIndex} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <feature.icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle className="text-xl">{feature.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20 py-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of businesses already using NODE CRM to build better customer relationships.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="px-8 py-4 text-lg">
                Start 14-Day Free Trial
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-blue-600">
                View Pricing Plans
              </Button>
            </Link>
          </div>
          <p className="text-sm mt-4 opacity-75">No credit card required • Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}