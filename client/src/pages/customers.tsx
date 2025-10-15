import { useState } from "react";
import LandingLayout from "@/components/landing-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  Star, 
  TrendingUp, 
  ArrowRight, 
  Calendar,
  Sparkles,
  Quote,
  Award,
  Heart
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  company: string;
  industry: string;
  icon: any;
  category: string;
  badge: string;
  testimonial: string;
  results: string[];
  improvement: string;
  rating: number;
}

const customers: Customer[] = [
  {
    id: 'techcorp-innovations',
    name: "Sarah Chen",
    company: "TechCorp Innovations",
    industry: "Technology",
    icon: Building2,
    category: "Enterprise",
    badge: "Fortune 500",
    testimonial: "NODE CRM's emotional intelligence transformed how we understand our customers. Our satisfaction scores increased by 340% in just 6 months.",
    results: [
      "340% increase in customer satisfaction",
      "85% faster issue resolution",
      "200% improvement in retention rates",
      "150% boost in team productivity"
    ],
    improvement: "+340% satisfaction",
    rating: 5
  },
  {
    id: 'healthplus-medical',
    name: "Dr. Michael Rodriguez",
    company: "HealthPlus Medical Center",
    industry: "Healthcare",
    icon: Heart,
    category: "Healthcare",
    badge: "Leading Provider",
    testimonial: "The emotional insights help us provide better patient care. We've seen remarkable improvements in patient outcomes and staff satisfaction.",
    results: [
      "450% improvement in patient satisfaction",
      "60% reduction in readmission rates",
      "90% increase in staff engagement",
      "120% faster diagnosis accuracy"
    ],
    improvement: "+450% patient care",
    rating: 5
  },
  {
    id: 'global-finance-solutions',
    name: "Emma Thompson",
    company: "Global Finance Solutions",
    industry: "Financial Services",
    icon: TrendingUp,
    category: "Finance",
    badge: "Top Rated",
    testimonial: "Understanding client emotions revolutionized our advisory services. We've built stronger relationships and achieved better investment outcomes.",
    results: [
      "300% increase in client retention",
      "250% growth in assets under management",
      "180% improvement in advisor efficiency",
      "95% client satisfaction score"
    ],
    improvement: "+300% retention",
    rating: 5
  },
  {
    id: 'retail-dynamics',
    name: "James Wilson",
    company: "Retail Dynamics Corp",
    industry: "E-commerce",
    icon: Users,
    category: "Retail",
    badge: "Market Leader",
    testimonial: "Emotional analytics helped us personalize customer experiences like never before. Our conversion rates and customer loyalty skyrocketed.",
    results: [
      "280% increase in conversion rates",
      "190% boost in customer lifetime value",
      "160% improvement in repeat purchases",
      "220% growth in revenue per customer"
    ],
    improvement: "+280% conversions",
    rating: 5
  },
  {
    id: 'education-excellence',
    name: "Prof. Lisa Martinez",
    company: "Education Excellence Institute",
    industry: "Education",
    icon: Award,
    category: "Education",
    badge: "Innovation Award",
    testimonial: "Student engagement and learning outcomes improved dramatically with emotional intelligence insights. Our teaching methods are now data-driven.",
    results: [
      "180% improvement in learning outcomes",
      "95% increase in student engagement",
      "140% better instructor effectiveness",
      "75% reduction in dropout rates"
    ],
    improvement: "+180% outcomes",
    rating: 5
  },
  {
    id: 'manufacturing-pro',
    name: "Robert Kim",
    company: "Manufacturing Pro Industries",
    industry: "Manufacturing",
    icon: Building2,
    category: "Manufacturing",
    badge: "Industry Pioneer",
    testimonial: "Employee satisfaction and productivity reached new heights. The emotional insights helped us create a better workplace culture.",
    results: [
      "160% increase in operational efficiency",
      "120% improvement in employee satisfaction",
      "85% reduction in workplace incidents",
      "200% boost in quality metrics"
    ],
    improvement: "+160% efficiency",
    rating: 5
  }
];

const categories = [
  'All Customers',
  'Enterprise',
  'Healthcare',
  'Finance',
  'Retail',
  'Education',
  'Manufacturing'
];

export default function CustomersPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Customers');

  const filteredCustomers = selectedCategory === 'All Customers' 
    ? customers 
    : customers.filter(customer => customer.category === selectedCategory);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const getCustomerIcon = (IconComponent: any) => {
    return <IconComponent className="h-6 w-6" />;
  };

  const handleStartTrial = () => {
    window.location.href = '/#signup';
  };

  const handleScheduleDemo = () => {
    window.location.href = '/request-demo';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <LandingLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white py-16 relative overflow-hidden">
          {/* Background Technology Image */}
          <div className="absolute inset-0 opacity-15">
            <img 
              src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=400&fit=crop&crop=center" 
              alt="Happy business team celebrating success together" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Success Stories & Testimonials
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                Real Results • Proven Impact • Transformative Outcomes
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge className="bg-purple-600/20 text-purple-100 px-4 py-2 text-sm">
                  <Users className="h-4 w-4 mr-2" />
                  500+ Customers
                </Badge>
                <Badge className="bg-blue-600/20 text-blue-100 px-4 py-2 text-sm">
                  <Star className="h-4 w-4 mr-2" />
                  98% Satisfaction
                </Badge>
                <Badge className="bg-indigo-600/20 text-indigo-100 px-4 py-2 text-sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  300% Average ROI
                </Badge>
              </div>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-3"
                onClick={handleStartTrial}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Join Our Success Stories
              </Button>
            </div>
          </div>
        </div>

        {/* Customer Categories */}
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
                  {category === 'All Customers' 
                    ? customers.length 
                    : customers.filter(c => c.category === category).length
                  }
                </Badge>
              </button>
            ))}
          </div>

          {/* Featured Customer Success Showcase */}
          <div className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=400&fit=crop&crop=center" 
                  alt="Professional business meeting and customer success" 
                  className="rounded-lg shadow-2xl w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent rounded-lg"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-sm font-semibold text-gray-800">Customer Success</div>
                    <div className="text-xs text-gray-600">Building lasting partnerships</div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Proven Results Across Industries
                </h3>
                <p className="text-gray-600 mb-6">
                  Our customers have achieved remarkable growth and success using NODE CRM's emotional intelligence platform. See how we've transformed businesses worldwide.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-1">98%</div>
                    <div className="text-sm text-gray-600">Customer Satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">300%</div>
                    <div className="text-sm text-gray-600">Average ROI Increase</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">85%</div>
                    <div className="text-sm text-gray-600">Faster Issue Resolution</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-1">250%</div>
                    <div className="text-sm text-gray-600">Revenue Growth</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                      {getCustomerIcon(customer.icon)}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="bg-purple-100 text-purple-700"
                    >
                      {customer.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                    {customer.company}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {customer.name} • {customer.industry}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        {renderStars(customer.rating)}
                      </div>
                      <span className="font-semibold text-green-600">{customer.improvement}</span>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                      <Quote className="h-5 w-5 text-purple-500 mb-2" />
                      <p className="text-sm text-gray-700 italic">"{customer.testimonial}"</p>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-500 mb-2 block">Key Results</span>
                      <div className="space-y-1">
                        {customer.results.slice(0, 3).map((result, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 flex-shrink-0"></div>
                            {result}
                          </div>
                        ))}
                        {customer.results.length > 3 && (
                          <div className="text-sm text-purple-600 font-medium">
                            +{customer.results.length - 3} more achievements
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
                <h3 className="text-2xl font-bold mb-4">Ready to Write Your Success Story?</h3>
                <p className="text-lg mb-6 text-purple-100">
                  Join thousands of satisfied customers who've transformed their business with NODE CRM
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    className="bg-white text-purple-600 hover:bg-gray-100"
                    onClick={handleStartTrial}
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Start Your Success Story
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