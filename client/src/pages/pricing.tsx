import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, Star, Zap, Crown } from "lucide-react";
import { Link } from "wouter";
import Logo from "@/components/logo";

const plans = [
  {
    name: "Starter Package",
    price: "$29.99-49.99",
    period: "per user/month",
    description: "Perfect for small teams getting started with CRM",
    popular: false,
    icon: Star,
    color: "blue",
    features: [
      { name: "Basic contact management (up to 1,000 contacts)", included: true },
      { name: "Email integration", included: true },
      { name: "Basic reporting dashboard", included: true },
      { name: "Mobile app access", included: true },
      { name: "Standard support (email)", included: true },
      { name: "2GB storage", included: true },
      { name: "Advanced AI features", included: false },
      { name: "Custom integrations", included: false },
      { name: "Priority support", included: false },
      { name: "Advanced analytics", included: false }
    ],
    cta: "Start Starter Plan",
    highlight: "Great for small businesses"
  },
  {
    name: "Professional Package",
    price: "$79.99-99.99",
    period: "per user/month",
    description: "Ideal for growing businesses with advanced needs",
    popular: true,
    icon: Zap,
    color: "purple",
    features: [
      { name: "Everything in Starter plus:", included: true },
      { name: "Advanced contact management (up to 10,000 contacts)", included: true },
      { name: "Sales pipeline automation", included: true },
      { name: "Custom fields and workflows", included: true },
      { name: "Email marketing integration", included: true },
      { name: "Advanced reporting and analytics", included: true },
      { name: "Priority support (phone + email)", included: true },
      { name: "10GB storage", included: true },
      { name: "API access", included: true },
      { name: "Dedicated account manager", included: false }
    ],
    cta: "Start Professional Plan",
    highlight: "Most popular choice for growing teams"
  },
  {
    name: "Enterprise Package",
    price: "$149.99-199.99",
    period: "per user/month",
    description: "Comprehensive solution for large organizations",
    popular: false,
    icon: Crown,
    color: "gold",
    features: [
      { name: "Everything in Professional plus:", included: true },
      { name: "Unlimited contacts", included: true },
      { name: "Advanced automation and AI features", included: true },
      { name: "Multi-team collaboration tools", included: true },
      { name: "Custom integrations", included: true },
      { name: "Advanced security features", included: true },
      { name: "Dedicated account manager", included: true },
      { name: "50GB storage", included: true },
      { name: "White-label client portal access", included: true },
      { name: "Advanced API and webhook support", included: true }
    ],
    cta: "Contact Sales",
    highlight: "Everything you need for enterprise success"
  }
];

const faqs = [
  {
    question: "What's included in the free trial?",
    answer: "The 14-day free trial includes access to all features of your selected plan with no limitations. No credit card required to start."
  },
  {
    question: "Can I change plans anytime?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the billing accordingly."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use enterprise-grade security with encryption, regular backups, and compliance with industry standards including GDPR and SOC 2."
  },
  {
    question: "Do you offer custom pricing for large teams?",
    answer: "Yes, we offer custom pricing for teams with 100+ users. Contact our sales team to discuss volume discounts and custom features."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and bank transfers for enterprise customers. All payments are processed securely through Stripe."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, you can cancel your subscription at any time with no cancellation fees. Your data remains accessible until the end of your billing period."
  }
];

const addOns = [
  {
    name: "White Label Solution",
    price: "Custom Quote",
    period: "contact for pricing",
    description: "Fully branded CRM solution with your company's branding and complete customization"
  },
  {
    name: "SMS Credits",
    price: "$0.05",
    period: "per SMS",
    description: "Send SMS messages directly from NODE CRM with global delivery"
  },
  {
    name: "Additional Storage",
    price: "$5",
    period: "per 10GB/month",
    description: "Extra storage for documents, images, and files"
  },
  {
    name: "Advanced AI Package",
    price: "$15",
    period: "per user/month",
    description: "Enhanced AI features including predictive analytics and advanced sentiment analysis"
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEO
        title="NODE CRM Pricing - Affordable Plans for Every Business Size"
        description="Choose the perfect NODE CRM plan for your business. From free trials to enterprise solutions with AI-powered features, multi-language support, and 24/7 support. Start your free 14-day trial today."
        keywords="CRM pricing, business software pricing, affordable CRM, enterprise CRM cost, customer management pricing, free CRM trial, professional CRM plans"
        canonical="https://argilette.org/pricing"
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
              <Link to="/features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</Link>
              <Link to="/pricing" className="text-blue-600 font-medium">Pricing</Link>
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
            Simple, Transparent
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Choose the plan that fits your business needs. All plans include our core CRM features 
            with a 14-day free trial and no setup fees.
          </p>
          <Badge variant="outline" className="px-4 py-2 text-lg">
            ✨ 14-day free trial on all plans
          </Badge>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-purple-500 shadow-xl scale-105' : 'hover:shadow-lg'} transition-all duration-200`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white px-4 py-1">Most Popular</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className={`p-3 rounded-full ${plan.color === 'gold' ? 'bg-yellow-100' : plan.color === 'purple' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                    <plan.icon className={`h-8 w-8 ${plan.color === 'gold' ? 'text-yellow-600' : plan.color === 'purple' ? 'text-purple-600' : 'text-blue-600'}`} />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-500 ml-2">{plan.period}</span>
                </div>
                <CardDescription className="text-base mt-2">{plan.description}</CardDescription>
                <p className="text-sm text-gray-500 mt-2 italic">{plan.highlight}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      {feature.included ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-gray-900' : 'text-gray-400'}`}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-6">
                  <Link to={plan.name === 'Enterprise Package' ? '/contact' : '/signup'}>
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add-ons Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Add-ons & Extensions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addOns.map((addon, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-lg">{addon.name}</CardTitle>
                  <div className="text-2xl font-bold text-blue-600">
                    {addon.price}
                    <span className="text-sm text-gray-500 ml-1">{addon.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{addon.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">{faq.answer}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of businesses transforming their customer relationships with NODE CRM.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="px-8 py-4 text-lg">
                Start Your Free Trial
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-blue-600">
                Talk to Sales
              </Button>
            </Link>
          </div>
          <p className="text-sm mt-4 opacity-75">No credit card required • Cancel anytime • 24/7 support</p>
        </div>
      </div>
    </div>
  );
}