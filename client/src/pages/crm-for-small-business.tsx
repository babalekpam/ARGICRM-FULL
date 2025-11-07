import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, TrendingUp, DollarSign, Star, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import Logo from "@/components/logo";

const smallBusinessFeatures = [
  { title: "Contact Management", description: "Organize up to 1,000 contacts with detailed profiles and interaction history", included: true },
  { title: "Sales Pipeline", description: "Visual deal tracking with automated follow-up reminders", included: true },
  { title: "Email Marketing", description: "Send professional campaigns with templates and analytics", included: true },
  { title: "Mobile Access", description: "Full-featured mobile app for managing CRM on the go", included: true },
  { title: "Basic Reports", description: "Essential analytics and performance dashboards", included: true },
  { title: "AI Lead Scoring", description: "Intelligent lead prioritization and recommendations", included: false },
  { title: "Advanced Automation", description: "Complex workflow automation and integrations", included: false },
  { title: "Dedicated Support", description: "Priority phone support and dedicated account manager", included: false }
];

export default function CrmForSmallBusinessPage() {
  return (
    <>
      <SEO 
        title="CRM for Small Business - Affordable Customer Management | NODE CRM"
        description="Get powerful CRM tools designed for small businesses. Manage contacts, track sales, and grow your business with NODE CRM's affordable, easy-to-use platform."
        canonicalUrl="https://argilette.org/crm-for-small-business"
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
              <Link to="/features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</Link>
              <Link to="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</Link>
              <Link to="/about" className="text-gray-600 hover:text-blue-600 transition-colors">About</Link>
              <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">Home</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-sm px-3 py-1 bg-green-100 text-green-800">For Small Business</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              CRM Built for <br />
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Small Business Success
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Simple, affordable, and powerful CRM tools to help small businesses organize customers, track sales, 
              and grow revenue without the complexity of enterprise software.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/signup">
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white">
                  Start Free 14-Day Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>

          {/* Why Small Businesses Choose NODE CRM */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Small Businesses Choose NODE CRM</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="bg-white/60 backdrop-blur-sm border border-gray-200 text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Building2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Easy Setup</h3>
                  <p className="text-sm text-gray-600">Get started in minutes, not months. No technical expertise required.</p>
                </CardContent>
              </Card>
              <Card className="bg-white/60 backdrop-blur-sm border border-gray-200 text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <DollarSign className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Affordable Pricing</h3>
                  <p className="text-sm text-gray-600">Starting at just $29.99/month with no long-term contracts.</p>
                </CardContent>
              </Card>
              <Card className="bg-white/60 backdrop-blur-sm border border-gray-200 text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Team Collaboration</h3>
                  <p className="text-sm text-gray-600">Keep your team aligned with shared customer data and tasks.</p>
                </CardContent>
              </Card>
              <Card className="bg-white/60 backdrop-blur-sm border border-gray-200 text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <TrendingUp className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Grow Revenue</h3>
                  <p className="text-sm text-gray-600">Track opportunities and never miss a follow-up with automated reminders.</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Starter Plan Features */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Perfect Starter Plan for Small Business</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Everything you need to manage customers and grow your business, without paying for features you don't need.
              </p>
            </div>

            <Card className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm border border-gray-200">
              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-4">
                  <Badge className="bg-green-100 text-green-800 px-4 py-2">
                    <Star className="h-4 w-4 mr-2" />
                    Most Popular for Small Business
                  </Badge>
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">Starter Package</CardTitle>
                <CardDescription className="text-xl text-gray-600">Perfect for teams of 1-10 people</CardDescription>
                <div className="text-center mt-6">
                  <div className="text-4xl font-bold text-green-600">$29.99-49.99</div>
                  <div className="text-gray-600">per user/month</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {smallBusinessFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`mt-1 ${feature.included ? 'text-green-600' : 'text-gray-400'}`}>
                        {feature.included ? <CheckCircle className="h-5 w-5" /> : <div className="h-5 w-5 rounded-full border-2 border-gray-300"></div>}
                      </div>
                      <div>
                        <div className={`font-medium ${feature.included ? 'text-gray-900' : 'text-gray-500'}`}>
                          {feature.title}
                        </div>
                        <div className={`text-sm ${feature.included ? 'text-gray-600' : 'text-gray-400'}`}>
                          {feature.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 text-center">
                  <Link to="/signup">
                    <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
                      Start Your Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <p className="text-sm text-gray-500 mt-2">No credit card required • Cancel anytime</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Success Stories */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Small Business Success Stories</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-2xl font-bold text-green-600">145%</div>
                    <div className="ml-2 text-gray-600">increase in sales</div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    "NODE CRM helped us organize our customer data and never miss a follow-up. Our conversion rate improved dramatically."
                  </p>
                  <div className="text-sm text-gray-500">- Local Retail Store</div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-2xl font-bold text-blue-600">3 hours</div>
                    <div className="ml-2 text-gray-600">saved per week</div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    "The automation features save us hours every week on follow-ups and data entry. More time to focus on customers."
                  </p>
                  <div className="text-sm text-gray-500">- Service Business</div>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-2xl font-bold text-purple-600">50%</div>
                    <div className="ml-2 text-gray-600">better team coordination</div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    "Our team can see all customer interactions in one place. No more dropped balls or duplicate work."
                  </p>
                  <div className="text-sm text-gray-500">- Consulting Firm</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white text-center">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Grow Your Small Business?</h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of small businesses using NODE CRM to organize customers, increase sales, and build lasting relationships.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/signup">
                  <Button size="lg" variant="secondary" className="bg-white text-green-600 hover:bg-gray-100">
                    Start Free 14-Day Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/features">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                    See All Features
                  </Button>
                </Link>
              </div>
              <p className="text-sm opacity-75 mt-4">Free trial • No credit card required • Cancel anytime</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}