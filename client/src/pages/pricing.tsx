import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, Star, Zap, Crown, Sparkles } from "lucide-react";
import { Link } from "wouter";
import Logo from "@/components/logo";

const plans = [
  {
    name: "Starter",
    price: "$49.99",
    period: "/month",
    description: "Perfect for freelancers and solo entrepreneurs",
    popular: false,
    icon: Star,
    color: "blue",
    features: [
      { name: "Full CRM (up to 1,000 contacts)", included: true },
      { name: "5 SEO projects", included: true },
      { name: "100 keywords tracked", included: true },
      { name: "Track all 7 platforms (Google, YouTube, Instagram, TikTok, Pinterest, Amazon, ChatGPT)", included: true },
      { name: "AI-powered insights & analysis (Argilette AI)", included: true },
      { name: "SEO audit + backlink monitoring", included: true },
      { name: "Email marketing", included: true },
      { name: "E-commerce (up to 50 products)", included: true },
      { name: "Landing page builder", included: true },
      { name: "Standard support", included: true },
      { name: "Multi-platform sentiment analysis", included: false },
      { name: "White-label branding", included: false },
      { name: "API access", included: false },
      { name: "Multi-user access", included: false }
    ],
    cta: "Start Free Trial",
    highlight: "Great for getting started"
  },
  {
    name: "Professional",
    price: "$149.99",
    period: "/month",
    description: "Ideal for small businesses and marketing agencies",
    popular: true,
    icon: Zap,
    color: "purple",
    features: [
      { name: "Everything in Starter plus:", included: true },
      { name: "Advanced CRM (up to 10,000 contacts)", included: true },
      { name: "25 SEO projects", included: true },
      { name: "500 keywords tracked", included: true },
      { name: "Multi-platform sentiment analysis", included: true },
      { name: "Competitive benchmarking", included: true },
      { name: "Advanced marketing automation", included: true },
      { name: "SMS marketing", included: true },
      { name: "AI campaign generation", included: true },
      { name: "Full e-commerce (unlimited products)", included: true },
      { name: "Multi-currency support (54 African currencies)", included: true },
      { name: "Custom reports", included: true },
      { name: "Priority support", included: true },
      { name: "Multi-user (up to 3 users)", included: true },
      { name: "White-label branding (contact for pricing)", included: false }
    ],
    cta: "Start Free Trial",
    highlight: "Most popular - Best value"
  },
  {
    name: "Business",
    price: "$299.99",
    period: "/month",
    description: "Comprehensive solution for growing agencies",
    popular: false,
    icon: Crown,
    color: "gold",
    features: [
      { name: "Everything in Professional plus:", included: true },
      { name: "Enterprise CRM (unlimited contacts)", included: true },
      { name: "100 SEO projects", included: true },
      { name: "2,000 keywords tracked", included: true },
      { name: "Advanced competitive intelligence", included: true },
      { name: "API access + webhooks", included: true },
      { name: "Multi-user (up to 10 users)", included: true },
      { name: "Dedicated account manager", included: true },
      { name: "Custom integrations", included: true },
      { name: "Advanced security features", included: true },
      { name: "Priority phone support", included: true },
      { name: "White-label platform (contact for pricing)", included: false },
      { name: "Custom domain + full branding (contact for pricing)", included: false },
      { name: "Reseller rights (contact for pricing)", included: false }
    ],
    cta: "Start Free Trial",
    highlight: "Best for agencies"
  },
  {
    name: "Enterprise",
    price: "$799.99",
    period: "/month",
    description: "Ultimate solution for large organizations",
    popular: false,
    icon: Sparkles,
    color: "gradient",
    features: [
      { name: "Everything in Business plus:", included: true },
      { name: "Unlimited projects, keywords, contacts", included: true },
      { name: "Unlimited users", included: true },
      { name: "Dedicated infrastructure", included: true },
      { name: "Custom features development", included: true },
      { name: "White-glove onboarding", included: true },
      { name: "24/7 priority support", included: true },
      { name: "SLA guarantee", included: true },
      { name: "Complete white-label ownership (contact for pricing)", included: false },
      { name: "Custom domain + full branding (contact for pricing)", included: false },
      { name: "Custom CSS injection (contact for pricing)", included: false },
      { name: "Reseller rights (contact for pricing)", included: false }
    ],
    cta: "Contact Sales",
    highlight: "Everything you need"
  }
];

const whiteLabelFeatures = [
  {
    tier: "Basic White-Label",
    price: "Contact for Custom Quote",
    features: [
      "Upload your company logo",
      "Customize brand colors (primary, secondary, accent)",
      "Custom company name throughout platform",
      "Basic branding in client-facing pages",
      "Remove ARGILETTE footer branding"
    ],
    cta: "Contact Sales"
  },
  {
    tier: "Full White-Label",
    price: "Contact for Custom Quote",
    features: [
      "Everything in Basic plus:",
      "Remove ALL ARGILETTE branding",
      "Custom domain support (app.yourbrand.com)",
      "Custom email templates with your branding",
      "Custom favicon & page titles",
      "White-labeled reports and exports",
      "White-labeled client portal"
    ],
    cta: "Contact Sales"
  },
  {
    tier: "Complete White-Label Ownership",
    price: "Contact for Custom Quote",
    features: [
      "Everything in Full plus:",
      "Custom CSS injection for complete styling control",
      "Custom subdomain architecture",
      "Your branding in API responses",
      "White-labeled mobile experience",
      "Reseller rights (sell under your brand)",
      "Revenue sharing options",
      "Dedicated white-label support team"
    ],
    cta: "Contact Sales"
  }
];

const addOns = [
  {
    name: "Additional Users",
    price: "$97",
    period: "/month per user",
    description: "Add more team members to your account. Includes all features of your plan.",
    applicableTo: "Starter & Professional"
  },
  {
    name: "White-Label Package",
    price: "Custom Quote",
    period: "contact for pricing",
    description: "Full white-label branding for your agency. Custom domain, remove our branding, reseller rights available.",
    applicableTo: "All plans"
  },
  {
    name: "Advanced Storage",
    price: "$197",
    period: "/month per 100GB",
    description: "Additional storage for documents, images, and files beyond plan limits",
    applicableTo: "All plans"
  },
  {
    name: "SMS Credits Bundle",
    price: "$0.04",
    period: "per SMS",
    description: "Send SMS messages globally. Volume discounts available for 10,000+ messages",
    applicableTo: "All plans"
  },
  {
    name: "Priority Onboarding",
    price: "$997",
    period: "one-time",
    description: "Dedicated onboarding specialist, data migration assistance, and custom training",
    applicableTo: "All plans"
  },
  {
    name: "Custom Integration",
    price: "Custom Quote",
    period: "one-time",
    description: "Build custom integrations with your existing tools and workflows",
    applicableTo: "Business & Enterprise"
  }
];

const faqs = [
  {
    question: "Can I cancel anytime?",
    answer: "Yes! You can cancel your subscription at any time with no penalties or long-term contracts. Your account will remain active until the end of your current billing period. You can export all your data before canceling."
  },
  {
    question: "Do you offer annual billing?",
    answer: "Yes! We offer annual billing options with discounted rates. Contact our sales team to discuss annual pricing and save up to 20% compared to monthly billing. Annual plans include priority support and dedicated onboarding."
  },
  {
    question: "Can I white-label the platform for my clients?",
    answer: "Yes! White-label options are available with custom pricing based on your specific needs. We offer three tiers: Basic (logo + colors), Full (custom domain + complete rebranding), and Complete Ownership (reseller rights + revenue sharing). Contact our sales team for a custom quote."
  },
  {
    question: "How does the 7-platform tracking work?",
    answer: "We track your brand's visibility across Google, YouTube, Instagram, TikTok, Pinterest, Amazon, and ChatGPT. You'll see where you appear, how you rank, sentiment analysis, and competitive benchmarking - all in one unified dashboard."
  },
  {
    question: "Is the CRM included or separate?",
    answer: "The full CRM is included in all plans! You get contact management, deal tracking, pipeline automation, email/SMS marketing, task management, and more. It's not an add-on - it's core to every plan."
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer: "Absolutely! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, and you'll be prorated for the remainder of your billing cycle. Downgrades take effect at the start of your next billing period."
  },
  {
    question: "What AI features are included?",
    answer: "All plans include Argilette AI powered insights for SEO optimization, content recommendations, sentiment analysis, and keyword research. Higher plans add AI campaign generation, advanced content creation, and predictive analytics."
  },
  {
    question: "Do I own my data?",
    answer: "Yes, 100%. You can export all your data anytime in standard formats (CSV, JSON, Excel). We also provide automated daily backups. Your data is yours forever."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and wire transfers for Enterprise plans. All payments are processed securely through Stripe. Subscriptions are billed automatically on your monthly or annual renewal date."
  }
];

const comparisons = [
  {
    feature: "SEO Platform",
    competitors: "SEMrush: $250/month, Ahrefs: $199/month",
    argilette: "Included in all plans"
  },
  {
    feature: "CRM System",
    competitors: "HubSpot: $133/month, Salesforce: $250/month",
    argilette: "Included in all plans"
  },
  {
    feature: "E-commerce",
    competitors: "Shopify: $39/month, BigCommerce: $29/month",
    argilette: "Included in all plans"
  },
  {
    feature: "7-Platform Tracking",
    competitors: "Not available anywhere",
    argilette: "✅ Unique to ARGILETTE"
  },
  {
    feature: "Marketing Automation",
    competitors: "Mailchimp: $50/month, ActiveCampaign: $100/month",
    argilette: "Included in all plans"
  },
  {
    feature: "Monthly Cost Comparison",
    competitors: "$422+ per month (separate tools)",
    argilette: "$149.99/month (all included)"
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEO
        title="ARGILETTE Pricing - Affordable Monthly Plans | All-in-One CRM, SEO & E-commerce"
        description="Flexible monthly subscription plans starting at $49.99/month. ARGILETTE combines CRM, SEO tools, e-commerce, and unique 7-platform tracking in one platform. Cancel anytime."
        keywords="CRM pricing, SEO tool pricing, white-label CRM, multi-platform tracking, affordable CRM, SaaS pricing, ChatGPT tracking, social media SEO"
        canonical="https://argilette.org/pricing"
      />
      
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Logo size="sm" />
              <Link href="/">
                <span className="text-xl font-bold text-gray-900 cursor-pointer">ARGILETTE</span>
              </Link>
            </div>
            <div className="hidden md:flex space-x-8">
              <Link href="/features" className="text-gray-600 hover:text-blue-600 transition-colors" data-testid="link-features">Features</Link>
              <Link href="/pricing" className="text-blue-600 font-medium" data-testid="link-pricing">Pricing</Link>
              <Link href="/signup" className="text-gray-600 hover:text-blue-600 transition-colors" data-testid="link-signup">Sign Up</Link>
              <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors" data-testid="link-login">Login</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2 text-sm">
            ⚡ Flexible Monthly Plans - Cancel Anytime
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            One Platform.
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Flexible Monthly Plans.
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto leading-relaxed">
            Get CRM + SEO + E-commerce + Multi-Platform Tracking (Google to ChatGPT) in one comprehensive subscription.
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            <strong>White-label ready</strong> for agencies. No hidden fees. No long-term contracts.
          </p>
        </div>

        {/* Value Comparison Banner */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 mb-16 max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">All-in-One Platform Value</h3>
            <p className="text-gray-600">See how much you save vs. buying separate tools monthly</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 border-2 border-red-200">
              <div className="text-red-600 font-semibold mb-3">❌ Buying Separate Tools</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">SEMrush (SEO)</span>
                  <span className="font-semibold">$250/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">HubSpot (CRM)</span>
                  <span className="font-semibold">$133/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shopify (E-commerce)</span>
                  <span className="font-semibold">$39/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mailchimp (Marketing)</span>
                  <span className="font-semibold">$50/month</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between">
                  <span className="font-bold">Monthly Total:</span>
                  <span className="font-bold text-red-600">$472/month</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-500">
              <div className="text-blue-600 font-semibold mb-3">✅ ARGILETTE (Professional)</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">SEO + 7-Platform Tracking</span>
                  <span className="font-semibold text-green-600">✓ Included</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Full CRM System</span>
                  <span className="font-semibold text-green-600">✓ Included</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">E-commerce Platform</span>
                  <span className="font-semibold text-green-600">✓ Included</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Marketing Automation</span>
                  <span className="font-semibold text-green-600">✓ Included</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between">
                  <span className="font-bold">Monthly Cost:</span>
                  <span className="font-bold text-blue-600">$149.99/month</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-6">
            <Badge className="bg-green-600 text-white text-lg px-6 py-2">
              Save $322/month with ARGILETTE Professional 🎉
            </Badge>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${plan.popular ? 'ring-2 ring-purple-500 shadow-2xl scale-105 z-10' : 'hover:shadow-lg'} transition-all duration-200`}
              data-testid={`card-plan-${plan.name.toLowerCase()}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white px-4 py-1">⭐ Most Popular</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className={`p-3 rounded-full ${
                    plan.color === 'gradient' ? 'bg-gradient-to-r from-yellow-100 to-purple-100' :
                    plan.color === 'gold' ? 'bg-yellow-100' : 
                    plan.color === 'purple' ? 'bg-purple-100' : 
                    'bg-blue-100'
                  }`}>
                    <plan.icon className={`h-6 w-6 ${
                      plan.color === 'gradient' ? 'text-purple-600' :
                      plan.color === 'gold' ? 'text-yellow-600' : 
                      plan.color === 'purple' ? 'text-purple-600' : 
                      'text-blue-600'
                    }`} />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold mb-2">{plan.name}</CardTitle>
                <div className="mb-2">
                  <div className="text-3xl font-bold text-gray-900">{plan.price}</div>
                  <div className="text-sm text-gray-500">{plan.period}</div>
                </div>
                <CardDescription className="text-sm mt-3">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-2">
                      {feature.included ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-xs ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Link href={plan.name === 'Enterprise' ? '/contact' : '/signup'}>
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                      size="default"
                      data-testid={`button-${plan.name.toLowerCase()}-cta`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* White-Label Features Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 px-4 py-2">
              🎨 White-Label Ready
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Sell Under Your Own Brand</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Remove our branding and make it yours. Perfect for agencies and resellers. Additional monthly cost on top of base subscription.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {whiteLabelFeatures.map((tier, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-200" data-testid={`card-whitelabel-${tier.tier.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardHeader>
                  <CardTitle className="text-xl mb-3">{tier.tier}</CardTitle>
                  <div className="text-lg font-semibold text-blue-600 mb-2">{tier.price}</div>
                  <Badge variant="outline" className="text-xs w-fit">
                    Custom Pricing
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/contact">
                    <Button variant="outline" className="w-full" data-testid={`button-whitelabel-${tier.tier.toLowerCase().replace(/\s+/g, '-')}-contact`}>
                      {tier.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Add-ons Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Optional Add-ons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addOns.map((addon, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-200" data-testid={`card-addon-${addon.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardHeader>
                  <CardTitle className="text-lg">{addon.name}</CardTitle>
                  <div className="text-2xl font-bold text-blue-600 mt-2">
                    {addon.price}
                    <span className="text-sm text-gray-500 ml-1 font-normal">{addon.period}</span>
                  </div>
                  <Badge variant="outline" className="text-xs w-fit mt-2">
                    {addon.applicableTo}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{addon.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Monthly Cost Comparison</h2>
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Feature</th>
                      <th className="text-left p-4 font-semibold">Competitors</th>
                      <th className="text-left p-4 font-semibold text-blue-600">ARGILETTE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisons.map((comparison, index) => (
                      <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                        <td className="p-4 font-medium">{comparison.feature}</td>
                        <td className="p-4 text-sm text-gray-600">{comparison.competitors}</td>
                        <td className="p-4 text-sm font-semibold text-blue-600">{comparison.argilette}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <div className="text-center mt-8">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" data-testid="button-comparison-signup">
                Start With Professional ($149.99/month)
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="ml-4" data-testid="button-comparison-contact">
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-200" data-testid={`card-faq-${index}`}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Start your free trial today. No credit card required. Cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-gray-100 border-white" data-testid="button-cta-trial">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10" data-testid="button-cta-demo">
                Schedule a Demo
              </Button>
            </Link>
          </div>
          <p className="text-sm mt-6 opacity-75">
            Join thousands of businesses already using ARGILETTE
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Logo size="sm" className="mb-4" />
              <p className="text-sm text-gray-600">
                All-in-one platform for CRM, SEO, and E-commerce
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/features" data-testid="link-footer-features">Features</Link></li>
                <li><Link href="/pricing" data-testid="link-footer-pricing">Pricing</Link></li>
                <li><Link href="/integrations" data-testid="link-footer-integrations">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/about" data-testid="link-footer-about">About</Link></li>
                <li><Link href="/contact" data-testid="link-footer-contact">Contact</Link></li>
                <li><Link href="/support" data-testid="link-footer-support">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/privacy" data-testid="link-footer-privacy">Privacy</Link></li>
                <li><Link href="/terms" data-testid="link-footer-terms">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-600">
            <p>© 2025 ARGILETTE. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
