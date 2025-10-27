import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, Star, Zap, Crown, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/logo";

const plans = [
  {
    name: "Starter",
    price: "$497",
    originalPrice: "$997",
    period: "one-time payment",
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
    cta: "Get Started",
    highlight: "Great for getting started",
    savings: "Save $500"
  },
  {
    name: "Professional",
    price: "$1,297",
    originalPrice: "$2,997",
    period: "one-time payment",
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
    cta: "Start Professional",
    highlight: "Most popular - Best value",
    savings: "Save $1,700"
  },
  {
    name: "Business",
    price: "$2,997",
    originalPrice: "$6,997",
    period: "one-time payment",
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
    cta: "Get Business",
    highlight: "Best for agencies",
    savings: "Save $4,000"
  },
  {
    name: "Enterprise",
    price: "$7,997",
    originalPrice: "$15,997",
    period: "one-time payment",
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
    highlight: "Everything you need",
    savings: "Save $8,000"
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
    period: "per user (one-time)",
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
    period: "per 100GB (one-time)",
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
    question: "What does 'lifetime' really mean?",
    answer: "Lifetime means you pay once and own the software forever. No monthly fees, no annual renewals. You get all future updates and improvements included. The only exceptions are optional add-ons like SMS credits or additional storage."
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
    question: "Can I upgrade or add features later?",
    answer: "Absolutely! You can upgrade to a higher tier anytime and we'll credit your original payment. You can also add individual features as add-ons if you don't need a full upgrade."
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
    answer: "We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and wire transfers for Enterprise plans. All payments are processed securely through Stripe."
  }
];

const comparisons = [
  {
    feature: "SEO Platform",
    competitors: "Ubersuggest: $290-990 lifetime, SEMrush: $1,680-5,999/year",
    argilette: "Included in all plans"
  },
  {
    feature: "CRM System",
    competitors: "HubSpot: $1,600/year, Salesforce: $3,000/year",
    argilette: "Included in all plans"
  },
  {
    feature: "E-commerce",
    competitors: "Shopify: $468/year, WooCommerce: $500+/year",
    argilette: "Included in all plans"
  },
  {
    feature: "7-Platform Tracking",
    competitors: "Not available anywhere",
    argilette: "✅ Unique to ARGILETTE"
  },
  {
    feature: "Marketing Automation",
    competitors: "Mailchimp: $600/year, ActiveCampaign: $1,200/year",
    argilette: "Included in all plans"
  },
  {
    feature: "Total 3-Year Cost",
    competitors: "$15,000 - $30,000+",
    argilette: "$497 - $7,997 (one-time)"
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEO
        title="ARGILETTE Pricing - All-in-One CRM, SEO & Multi-Platform Tracking | Lifetime Payment"
        description="Pay once, own forever. ARGILETTE combines CRM, SEO tools, e-commerce, and unique 7-platform tracking (Google to ChatGPT) in one lifetime payment. From $497. No monthly fees."
        keywords="lifetime CRM pricing, SEO tool pricing, white-label CRM, multi-platform tracking, one-time payment CRM, affordable SEO platform, ChatGPT tracking, social media SEO"
        canonical="https://argilette.org/pricing"
      />
      
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Logo size="sm" />
              <Link to="/">
                <span className="text-xl font-bold text-gray-900 cursor-pointer">ARGILETTE</span>
              </Link>
            </div>
            <div className="hidden md:flex space-x-8">
              <Link to="/features" className="text-gray-600 hover:text-blue-600 transition-colors" data-testid="link-features">Features</Link>
              <Link to="/pricing" className="text-blue-600 font-medium" data-testid="link-pricing">Pricing</Link>
              <Link to="/signup" className="text-gray-600 hover:text-blue-600 transition-colors" data-testid="link-signup">Sign Up</Link>
              <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors" data-testid="link-login">Login</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2 text-sm">
            ⚡ Pay Once, Own Forever - No Monthly Fees
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            One Platform.
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              One Lifetime Payment.
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto leading-relaxed">
            Get CRM + SEO + E-commerce + Multi-Platform Tracking (Google to ChatGPT) in one comprehensive platform.
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            <strong>White-label ready</strong> for agencies. No hidden fees. All future updates included.
          </p>
        </div>

        {/* Value Comparison Banner */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 mb-16 max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Why Lifetime Pricing?</h3>
            <p className="text-gray-600">See how much you save vs. buying separate monthly tools</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 border-2 border-red-200">
              <div className="text-red-600 font-semibold mb-3">❌ Traditional Approach (Monthly)</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">SEMrush (SEO)</span>
                  <span className="font-semibold">$2,999/year</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">HubSpot (CRM)</span>
                  <span className="font-semibold">$1,600/year</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shopify (E-com)</span>
                  <span className="font-semibold">$468/year</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mailchimp</span>
                  <span className="font-semibold">$600/year</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between">
                  <span className="font-bold">3-Year Total:</span>
                  <span className="font-bold text-red-600">$16,002</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-500">
              <div className="text-blue-600 font-semibold mb-3">✅ ARGILETTE (Lifetime)</div>
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
                  <span className="font-bold">One-Time Payment:</span>
                  <span className="font-bold text-blue-600">$1,297</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center mt-6">
            <Badge className="bg-green-600 text-white text-lg px-6 py-2">
              Save $14,705 over 3 years with ARGILETTE Professional 🎉
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
                  <div className="text-sm text-gray-400 line-through">{plan.originalPrice}</div>
                  <div className="text-3xl font-bold text-gray-900">{plan.price}</div>
                  <div className="text-xs text-gray-500">{plan.period}</div>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                  {plan.savings}
                </Badge>
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
                  <Link to={plan.name === 'Enterprise' ? '/contact' : '/signup'}>
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
              Remove our branding and make it yours. Perfect for agencies and resellers.
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
                  <Link to="/contact">
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
                  <CardDescription className="text-sm">{addon.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {faqs.map((faq, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-200" data-testid={`card-faq-${index}`}>
                <CardHeader>
                  <CardTitle className="text-base">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">{faq.answer}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-2 opacity-90">
            Join thousands of businesses using ARGILETTE to dominate search everywhere.
          </p>
          <p className="text-lg mb-8 opacity-75">
            From Google to ChatGPT - track, optimize, and grow across all 7 platforms.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="px-8 py-4 text-lg" data-testid="button-cta-signup">
                Start With Professional ($1,297)
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-blue-600" data-testid="button-cta-contact">
                Talk to Sales (Enterprise)
              </Button>
            </Link>
          </div>
          <p className="text-sm mt-6 opacity-75">
            ✅ Lifetime access • ✅ All future updates • ✅ No monthly fees • ✅ 30-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
}
