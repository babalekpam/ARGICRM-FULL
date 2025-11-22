import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Shield, Users, Zap, Crown, CheckCircle, ArrowRight, Globe } from "lucide-react";
import { Link } from "wouter";
import Logo from "@/components/logo";

const enterpriseFeatures = [
  { title: "Unlimited Contacts", description: "No limits on customer data storage and management", included: true },
  { title: "Advanced AI Automation", description: "Intelligent workflows, lead scoring, and predictive analytics", included: true },
  { title: "Multi-team Collaboration", description: "Department-level permissions and workflow management", included: true },
  { title: "Custom Integrations", description: "API access and custom integrations with existing systems", included: true },
  { title: "Enterprise Security", description: "SOC 2 compliance, SSO, and advanced security features", included: true },
  { title: "Dedicated Account Manager", description: "Personal support and strategic guidance", included: true },
  { title: "White-label Options", description: "Brand the platform with your company identity", included: true },
  { title: "Advanced Analytics", description: "Custom reports, dashboards, and business intelligence", included: true }
];

export default function EnterpriseCrmPage() {
  return (
    <>
      <SEO 
        title="Enterprise CRM Solution - Scalable Business Management | NODE CRM"
        description="Power your enterprise with NODE CRM's advanced AI automation, unlimited scalability, and enterprise-grade security. Custom solutions for large organizations."
        canonical="https://argilette.org/enterprise-crm"
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
              <Link href="/features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</Link>
              <Link href="/about" className="text-gray-600 hover:text-blue-600 transition-colors">About</Link>
              <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">Home</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 text-sm px-3 py-1 bg-purple-100 text-purple-800">Enterprise Solution</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Enterprise CRM for <br />
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Global Organizations
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Comprehensive business management platform with advanced AI, unlimited scalability, and enterprise-grade 
              security designed for large organizations operating globally.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                Contact Sales Team
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50">
                  View Enterprise Pricing
                </Button>
              </Link>
            </div>
          </div>

          {/* Enterprise Advantages */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Built for Enterprise Scale</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="bg-white/60 backdrop-blur-sm border border-gray-200 text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Building className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Unlimited Scale</h3>
                  <p className="text-sm text-gray-600">Handle millions of contacts and transactions without performance degradation.</p>
                </CardContent>
              </Card>
              <Card className="bg-white/60 backdrop-blur-sm border border-gray-200 text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Enterprise Security</h3>
                  <p className="text-sm text-gray-600">SOC 2 compliance, SSO integration, and advanced security controls.</p>
                </CardContent>
              </Card>
              <Card className="bg-white/60 backdrop-blur-sm border border-gray-200 text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Multi-Department</h3>
                  <p className="text-sm text-gray-600">Manage complex organizational structures with role-based access.</p>
                </CardContent>
              </Card>
              <Card className="bg-white/60 backdrop-blur-sm border border-gray-200 text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Globe className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Global Operations</h3>
                  <p className="text-sm text-gray-600">Multi-currency, multi-language support for 195+ countries.</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Enterprise Package Details */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Enterprise Package</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Comprehensive solution for large organizations requiring advanced capabilities and dedicated support.
              </p>
            </div>

            <Card className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm border border-gray-200">
              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-4">
                  <Badge className="bg-purple-100 text-purple-800 px-4 py-2">
                    <Crown className="h-4 w-4 mr-2" />
                    Premium Enterprise Solution
                  </Badge>
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">Enterprise Package</CardTitle>
                <CardDescription className="text-xl text-gray-600">For organizations with 50+ users</CardDescription>
                <div className="text-center mt-6">
                  <div className="text-4xl font-bold text-purple-600">$179.99-249.99</div>
                  <div className="text-gray-600">per user/month</div>
                  <div className="text-sm text-gray-500 mt-2">Custom pricing available for 500+ users</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {enterpriseFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-purple-600 mt-1" />
                      <div>
                        <div className="font-medium text-gray-900">{feature.title}</div>
                        <div className="text-sm text-gray-600">{feature.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 text-center space-y-4">
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
                    Contact Enterprise Sales
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-sm text-gray-500">Custom implementation • Dedicated support • Volume discounts available</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Capabilities */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Advanced Enterprise Capabilities</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-6 w-6 text-purple-600 mr-3" />
                    AI-Powered Automation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Intelligent lead scoring and routing</li>
                    <li>• Predictive analytics and forecasting</li>
                    <li>• Automated workflow optimization</li>
                    <li>• Natural language processing for sentiment analysis</li>
                    <li>• Custom AI model training for your industry</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-6 w-6 text-blue-600 mr-3" />
                    Enterprise Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600">
                    <li>• SOC 2 Type II compliance</li>
                    <li>• Single Sign-On (SSO) integration</li>
                    <li>• Advanced audit logging and monitoring</li>
                    <li>• Data encryption at rest and in transit</li>
                    <li>• Custom security policies and controls</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-6 w-6 text-green-600 mr-3" />
                    Advanced Collaboration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Department-level permissions and workflows</li>
                    <li>• Real-time collaboration tools</li>
                    <li>• Advanced project management features</li>
                    <li>• Team performance analytics</li>
                    <li>• Custom approval processes</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="h-6 w-6 text-orange-600 mr-3" />
                    Custom Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600">
                    <li>• REST API with unlimited requests</li>
                    <li>• Custom webhook integrations</li>
                    <li>• Enterprise system connectors</li>
                    <li>• White-label and co-branding options</li>
                    <li>• Dedicated integration support team</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Enterprise Success */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Enterprise Success Stories</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">500K+</div>
                  <div className="text-gray-600 mb-4">Contacts Managed</div>
                  <p className="text-sm text-gray-500">Global manufacturing company managing customer relationships across 50 countries</p>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">40%</div>
                  <div className="text-gray-600 mb-4">Productivity Increase</div>
                  <p className="text-sm text-gray-500">Financial services firm improved team efficiency with automated workflows</p>
                </CardContent>
              </Card>
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
                  <div className="text-gray-600 mb-4">Uptime Achieved</div>
                  <p className="text-sm text-gray-500">Healthcare organization with mission-critical customer data requirements</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Scale Your Enterprise?</h2>
              <p className="text-xl mb-8 opacity-90">
                Let our enterprise team show you how NODE CRM can transform your organization's customer relationships.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                  Schedule Enterprise Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
                  Contact Sales Team
                </Button>
              </div>
              <p className="text-sm opacity-75 mt-4">Custom implementation • Dedicated support • Volume pricing available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}