import { Link } from "wouter";
import SiteNavigation from "@/components/site-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain,
  Users,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  MessageSquare,
  Calendar,
  Mail,
  Phone,
  Building2,
  Globe,
  ArrowRight,
  CheckCircle
} from "lucide-react";

const features = [
  {
    category: "Core CRM",
    items: [
      { name: "Contact Management", description: "Centralized customer database", icon: Users },
      { name: "Deal Pipeline", description: "Visual sales pipeline management", icon: TrendingUp },
      { name: "Task Management", description: "Organized activity tracking", icon: CheckCircle },
      { name: "Calendar Integration", description: "Seamless scheduling", icon: Calendar }
    ]
  },
  {
    category: "Sales Automation",
    items: [
      { name: "Lead Scoring", description: "AI-powered lead qualification", icon: Brain },
      { name: "Sales Forecasting", description: "Predictive revenue analytics", icon: BarChart3 },
      { name: "Email Automation", description: "Personalized email sequences", icon: Mail },
      { name: "Quote Management", description: "Professional proposal generation", icon: Building2 }
    ]
  },
  {
    category: "Communication",
    items: [
      { name: "Unified Inbox", description: "All communications in one place", icon: MessageSquare },
      { name: "SMS Marketing", description: "Bulk SMS campaigns", icon: Phone },
      { name: "Video Conferencing", description: "Integrated meeting platform", icon: Globe },
      { name: "Social Media Integration", description: "Multi-channel engagement", icon: Zap }
    ]
  },
  {
    category: "Intelligence",
    items: [
      { name: "Emotional AI", description: "Sentiment analysis and insights", icon: Brain },
      { name: "Advanced Analytics", description: "Business intelligence dashboard", icon: BarChart3 },
      { name: "Reputation Management", description: "Online review monitoring", icon: Shield },
      { name: "Predictive Insights", description: "AI-powered recommendations", icon: TrendingUp }
    ]
  }
];

const benefits = [
  {
    title: "Increase Sales by 40%",
    description: "Advanced automation and AI insights help close more deals faster",
    stat: "40%"
  },
  {
    title: "Save 15 Hours Weekly",
    description: "Automated workflows eliminate repetitive tasks and manual processes",
    stat: "15h"
  },
  {
    title: "Improve Customer Satisfaction",
    description: "Emotional intelligence features enhance every customer interaction",
    stat: "95%"
  },
  {
    title: "Faster Implementation",
    description: "Get up and running in minutes, not months, with our intuitive setup",
    stat: "10min"
  }
];

export default function OverviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <SiteNavigation />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Complete CRM Overview
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Discover everything ARGILETTE CRM has to offer - from basic contact management to advanced emotional intelligence
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" asChild>
              <Link to="/adaptive-signup">
                Start Free Trial
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600" asChild>
              <Link to="/request-demo">
                Schedule Demo
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose ARGILETTE CRM?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Measurable results that drive your business forward
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {benefit.stat}
                  </div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Complete Feature Set
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage customer relationships effectively
            </p>
          </div>

          <div className="space-y-12">
            {features.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  {category.category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {category.items.map((feature, featureIndex) => {
                    const IconComponent = feature.icon;
                    return (
                      <Card key={featureIndex} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                            <IconComponent className="h-5 w-5 text-blue-600" />
                          </div>
                          <CardTitle className="text-lg">{feature.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 text-sm">{feature.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unique Value Proposition */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white p-12 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold mb-6">
                The World's First Emotional Intelligence CRM
              </h2>
              <p className="text-xl mb-8 opacity-90">
                While other CRMs focus on data, we focus on understanding emotions and building meaningful relationships. Our AI doesn't just track what customers do - it understands how they feel.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div>
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-90" />
                  <h3 className="font-semibold mb-2">Emotional AI</h3>
                  <p className="opacity-80">Understand customer emotions in real-time</p>
                </div>
                <div>
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-90" />
                  <h3 className="font-semibold mb-2">Predictive Insights</h3>
                  <p className="opacity-80">Anticipate customer needs before they ask</p>
                </div>
                <div>
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-90" />
                  <h3 className="font-semibold mb-2">Relationship Intelligence</h3>
                  <p className="opacity-80">Build deeper, more meaningful connections</p>
                </div>
              </div>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Experience the Difference
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Large spacer between content and CTA */}
      <div className="py-32"></div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Customer Relationships?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of businesses using ARGILETTE CRM to build better relationships
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
              <Link to="/adaptive-signup">
                Start Free Trial
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900" asChild>
              <Link to="/request-demo">
                Request Demo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}