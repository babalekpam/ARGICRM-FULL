import { useState } from "react";
import LandingLayout from "@/components/landing-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  TrendingUp, 
  Shield, 
  Zap, 
  Heart, 
  ArrowRight, 
  Sparkles,
  Calendar
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  badge: string;
  pricing: string;
  features: string[];
}

const products: Product[] = [
  {
    id: 'bit-crm-professional',
    name: "NODE CRM Professional",
    description: "Complete customer relationship management with AI-powered insights",
    icon: Users,
    category: "CRM Solutions",
    badge: "Most Popular",
    pricing: "Starting at $59.99/month",
    features: [
      "Advanced Analytics Dashboard",
      "Advanced Contact Management",
      "Smart Deal Pipeline",
      "Sentiment Analysis",
      "Automated Workflows",
      "Real-time Collaboration"
    ]
  },
  {
    id: 'bit-analytics-suite',
    name: "NODE Analytics Suite",
    description: "Business intelligence with predictive AI insights",
    icon: TrendingUp,
    category: "Analytics & AI",
    badge: "AI-Powered",
    pricing: "Starting at $119.99/month",
    features: [
      "Predictive Analytics",
      "Advanced Trend Analysis",
      "Customer Journey Mapping",
      "ROI Optimization",
      "Custom Dashboards",
      "Automated Reporting"
    ]
  },
  {
    id: 'bit-automation-engine',
    name: "NODE Automation Engine",
    description: "Intelligent workflow automation with smart triggers",
    icon: Zap,
    category: "Automation Tools",
    badge: "Innovation",
    pricing: "Starting at $199.99/month",
    features: [
      "Smart Workflow Triggers",
      "Smart Process Automation",
      "Intelligent Task Management",
      "Adaptive Decision Making",
      "Integration Hub",
      "Performance Optimization"
    ]
  },
  {
    id: 'navimed-emr-ehr',
    name: "NAVIMED EMR/EHR System",
    description: "Electronic Medical Records with comprehensive patient care insights",
    icon: Heart,
    category: "Healthcare Solutions",
    badge: "Healthcare",
    pricing: "Contact for Quote",
    features: [
      "Patient Care Profiling",
      "HIPAA-Compliant Data Management",
      "Clinical Decision Support",
      "Care Team Collaboration",
      "Prescription Management",
      "Telehealth Integration"
    ]
  }
];

const categories = [
  'All Products',
  'CRM Solutions',
  'Analytics & AI',
  'Automation Tools',
  'Healthcare Solutions'
];

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Products');

  const filteredProducts = selectedCategory === 'All Products' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const getProductIcon = (IconComponent: any) => {
    return <IconComponent className="h-6 w-6" />;
  };

  const handleStartTrial = () => {
    window.location.href = '/#signup';
  };

  const handleScheduleDemo = () => {
    window.location.href = '/request-demo';
  };

  return (
    <LandingLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white py-16 relative overflow-hidden">
          {/* Background Technology Image */}
          <div className="absolute inset-0 opacity-15">
            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=400&fit=crop&crop=center" 
              alt="Dynamic CRM analytics dashboard with charts and data visualizations" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                NODE CRM Product Suite
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                Revolutionary CRM • AI-Powered Analytics • Advanced Insights
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge className="bg-purple-600/20 text-purple-100 px-4 py-2 text-sm">
                  <Users className="h-4 w-4 mr-2" />
                  CRM Innovation
                </Badge>
                <Badge className="bg-blue-600/20 text-blue-100 px-4 py-2 text-sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  AI Analytics
                </Badge>
                <Badge className="bg-indigo-600/20 text-indigo-100 px-4 py-2 text-sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Enterprise Security
                </Badge>
              </div>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-3"
                onClick={handleStartTrial}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>

        {/* Product Categories */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {category}
                <Badge variant="secondary" className="ml-2">
                  {category === 'All Products' 
                    ? products.length 
                    : products.filter(p => p.category === category).length
                  }
                </Badge>
              </button>
            ))}
          </div>

          {/* Featured Technology Showcase */}
          <div className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Cutting-Edge CRM Technology
                </h3>
                <p className="text-gray-600 mb-6">
                  Experience the future of customer relationship management with our AI-powered platform that combines advanced insights, comprehensive analytics, and seamless automation.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    AI-Powered Insights
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Real-time Analytics
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Cloud-Native Platform
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                    Advanced Security
                  </div>
                </div>
              </div>
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop&crop=center" 
                  alt="Modern CRM Dashboard with Analytics" 
                  className="rounded-lg shadow-2xl w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent rounded-lg"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-sm font-semibold text-gray-800">Live CRM Dashboard</div>
                    <div className="text-xs text-gray-600">Real-time analytics & insights</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                      {getProductIcon(product.icon)}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="bg-purple-100 text-purple-700"
                    >
                      {product.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                    {product.name}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Pricing</span>
                      <span className="font-semibold text-purple-600">{product.pricing}</span>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-500 mb-2 block">Key Features</span>
                      <div className="space-y-1">
                        {product.features.slice(0, 4).map((feature, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 flex-shrink-0"></div>
                            {feature}
                          </div>
                        ))}
                        {product.features.length > 4 && (
                          <div className="text-sm text-purple-600 font-medium">
                            +{product.features.length - 4} more features
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-4">
                      <Button 
                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all"
                        onClick={handleStartTrial}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Start Trial
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 hover:bg-purple-50 transition-colors"
                        onClick={handleScheduleDemo}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Demo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to Action Section */}
          <div className="mt-16 text-center">
            <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
              <CardContent className="py-12">
                <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Business?</h3>
                <p className="text-lg mb-6 text-purple-100">
                  Join 1,000+ companies already using NODE CRM to revolutionize their customer relationships
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    className="bg-white text-purple-600 hover:bg-gray-100"
                    onClick={handleStartTrial}
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Start 15-Day Free Trial
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white/10"
                    onClick={handleScheduleDemo}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Schedule Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LandingLayout>
  );
}