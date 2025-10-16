import { useState } from "react";
import LandingLayout from "@/components/landing-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  ShoppingCart, 
  Heart, 
  GraduationCap, 
  Briefcase, 
  Truck, 
  Home, 
  Zap,
  ArrowRight,
  Calendar,
  Sparkles,
  TrendingUp
} from "lucide-react";

interface Industry {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  badge: string;
  benefits: string[];
  caseStudy: string;
  growth: string;
}

const industries: Industry[] = [
  {
    id: 'healthcare-medical',
    name: "Healthcare & Medical",
    description: "Enhance patient care with comprehensive AI insights",
    icon: Heart,
    category: "Healthcare",
    badge: "High Impact",
    benefits: [
      "Patient satisfaction monitoring",
      "Staff wellness tracking", 
      "Care quality improvement",
      "Compliance management"
    ],
    caseStudy: "450% improvement in patient satisfaction scores",
    growth: "+85% efficiency"
  },
  {
    id: 'financial-services',
    name: "Financial Services",
    description: "Build trust through comprehensive client insights",
    icon: Briefcase,
    category: "Finance",
    badge: "Most Popular",
    benefits: [
      "Client relationship enhancement",
      "Risk assessment improvement",
      "Investment advisory optimization", 
      "Fraud detection assistance"
    ],
    caseStudy: "300% increase in client retention rates",
    growth: "+65% ROI"
  },
  {
    id: 'ecommerce-retail',
    name: "E-commerce & Retail",
    description: "Personalize shopping experiences with emotion analytics",
    icon: ShoppingCart,
    category: "Retail",
    badge: "Fast Growing",
    benefits: [
      "Customer behavior analysis",
      "Personalized recommendations",
      "Conversion optimization",
      "Brand loyalty enhancement"
    ],
    caseStudy: "200% boost in conversion rates",
    growth: "+120% sales"
  },
  {
    id: 'education-training',
    name: "Education & Training",
    description: "Improve learning outcomes through intelligent engagement",
    icon: GraduationCap,
    category: "Education",
    badge: "Innovation",
    benefits: [
      "Student engagement tracking",
      "Learning outcome optimization",
      "Instructor effectiveness",
      "Curriculum improvement"
    ],
    caseStudy: "180% improvement in learning outcomes",
    growth: "+95% engagement"
  },
  {
    id: 'manufacturing-logistics',
    name: "Manufacturing & Logistics",
    description: "Optimize operations with workforce analytics insights",
    icon: Truck,
    category: "Manufacturing",
    badge: "Enterprise",
    benefits: [
      "Employee satisfaction monitoring",
      "Safety compliance improvement", 
      "Productivity optimization",
      "Quality control enhancement"
    ],
    caseStudy: "160% increase in operational efficiency",
    growth: "+75% productivity"
  },
  {
    id: 'real-estate',
    name: "Real Estate",
    description: "Build stronger client relationships in property transactions",
    icon: Home,
    category: "Real Estate",
    badge: "Trending",
    benefits: [
      "Client satisfaction tracking",
      "Market sentiment analysis",
      "Transaction optimization",
      "Relationship management"
    ],
    caseStudy: "220% faster deal closure rates",
    growth: "+140% deals"
  },
  {
    id: 'technology-startups',
    name: "Technology & Startups",
    description: "Scale with AI-driven growth strategies",
    icon: Zap,
    category: "Technology",
    badge: "Disruptive",
    benefits: [
      "User experience optimization",
      "Team performance tracking",
      "Product development insights",
      "Investor relations management"
    ],
    caseStudy: "350% improvement in user retention",
    growth: "+200% growth"
  },
  {
    id: 'professional-services',
    name: "Professional Services",
    description: "Deliver exceptional client experiences with comprehensive insights",
    icon: Building2,
    category: "Services",
    badge: "Proven",
    benefits: [
      "Client satisfaction optimization",
      "Service quality improvement",
      "Team collaboration enhancement",
      "Business development acceleration"
    ],
    caseStudy: "280% increase in client satisfaction",
    growth: "+110% revenue"
  }
];

const categories = [
  'All Industries',
  'Healthcare',
  'Finance',
  'Retail',
  'Education',
  'Manufacturing',
  'Real Estate',
  'Technology',
  'Services'
];

export default function IndustriesPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Industries');

  const filteredIndustries = selectedCategory === 'All Industries' 
    ? industries 
    : industries.filter(industry => industry.category === selectedCategory);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const getIndustryIcon = (IconComponent: any) => {
    return <IconComponent className="h-6 w-6" />;
  };

  const handleLearnMore = () => {
    window.location.href = '/request-demo';
  };

  const handleGetAnalysis = () => {
    window.location.href = '/#signup';
  };

  return (
    <LandingLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white py-16 relative overflow-hidden">
          {/* Background Technology Image */}
          <div className="absolute inset-0 opacity-15">
            <img 
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=400&fit=crop&crop=center" 
              alt="Modern business skyscrapers and corporate cityscape" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Industries We Transform
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                AI-Powered Insights • Industry Expertise • Proven Results
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge className="bg-purple-600/20 text-purple-100 px-4 py-2 text-sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  8+ Industries
                </Badge>
                <Badge className="bg-blue-600/20 text-blue-100 px-4 py-2 text-sm">
                  <Building2 className="h-4 w-4 mr-2" />
                  1,000+ Companies
                </Badge>
                <Badge className="bg-indigo-600/20 text-indigo-100 px-4 py-2 text-sm">
                  <Heart className="h-4 w-4 mr-2" />
                  Proven Success
                </Badge>
              </div>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-3"
                onClick={handleGetAnalysis}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Get Industry Analysis
              </Button>
            </div>
          </div>
        </div>

        {/* Industry Categories */}
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
                  {category === 'All Industries' 
                    ? industries.length 
                    : industries.filter(i => i.category === category).length
                  }
                </Badge>
              </button>
            ))}
          </div>

          {/* Featured Industries Showcase */}
          <div className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Transforming Industries with AI-Powered Insights
                </h3>
                <p className="text-gray-600 mb-6">
                  From healthcare to finance, our CRM platform is revolutionizing how businesses understand and connect with their customers across every major industry.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">8+</div>
                    <div className="text-sm text-gray-600">Industries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">1,000+</div>
                    <div className="text-sm text-gray-600">Companies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">300%</div>
                    <div className="text-sm text-gray-600">Avg ROI</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">98%</div>
                    <div className="text-sm text-gray-600">Satisfaction</div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop&crop=center" 
                  alt="Professional business team collaboration" 
                  className="rounded-lg shadow-xl w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent rounded-lg"></div>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
                    <div className="text-xs font-semibold text-gray-800">Industry Leaders</div>
                    <div className="text-xs text-gray-600">Driving transformation</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Industries Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredIndustries.map((industry) => (
              <Card key={industry.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                      {getIndustryIcon(industry.icon)}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="bg-purple-100 text-purple-700"
                    >
                      {industry.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                    {industry.name}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {industry.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">Success Rate</span>
                      <span className="font-semibold text-green-600">{industry.growth}</span>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-500 mb-2 block">Key Benefits</span>
                      <div className="space-y-1">
                        {industry.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 flex-shrink-0"></div>
                            {benefit}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 block">Case Study Result</span>
                      <span className="text-sm text-purple-600 font-semibold">{industry.caseStudy}</span>
                    </div>

                    <div className="flex space-x-2 pt-4">
                      <Button 
                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all"
                        onClick={handleGetAnalysis}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Get Analysis
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 hover:bg-purple-50 transition-colors"
                        onClick={handleLearnMore}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Learn More
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
                <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Industry?</h3>
                <p className="text-lg mb-6 text-purple-100">
                  Join industry leaders who've revolutionized their business with AI-powered insights
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    className="bg-white text-purple-600 hover:bg-gray-100"
                    onClick={handleGetAnalysis}
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Get Free Industry Analysis
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white/10"
                    onClick={handleLearnMore}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Schedule Consultation
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