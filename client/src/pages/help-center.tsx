import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Search, 
  Rocket, 
  CreditCard, 
  Cpu, 
  Headphones, 
  DollarSign,
  Mail,
  MessageCircle,
  HelpCircle,
  ChevronRight,
  Book,
  UserPlus,
  Settings,
  BarChart,
  ShoppingCart,
  MessageSquare
} from "lucide-react";
import Logo from "@/components/logo";

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  // Getting Started
  {
    category: "Getting Started",
    question: "How do I create an account?",
    answer: "Click the 'Sign Up' button on the homepage, fill in your details including email, password, and company information. You'll receive a verification email to activate your account. Once verified, you can log in and start using NODE CRM."
  },
  {
    category: "Getting Started",
    question: "What happens after I sign up?",
    answer: "After signing up, you'll be enrolled in a free trial period. You can explore all features, import contacts, set up your pipeline, and customize your workspace. Our onboarding wizard will guide you through the essential setup steps."
  },
  {
    category: "Getting Started",
    question: "How do I import my existing contacts?",
    answer: "Navigate to Contacts > Import. You can upload CSV, Excel files, or connect to popular CRMs like Salesforce or HubSpot. Our system will automatically map fields and help you avoid duplicates."
  },
  {
    category: "Getting Started",
    question: "Is there a mobile app?",
    answer: "Yes! NODE CRM has native mobile apps for iOS and Android. Download them from the App Store or Google Play. Your data syncs in real-time across all devices."
  },
  
  // Account & Billing
  {
    category: "Account & Billing",
    question: "How do I upgrade my plan?",
    answer: "Go to Settings > Subscription > Upgrade Plan. Choose from Starter, Professional, or Enterprise plans. Your card will be charged immediately, and features are available right away."
  },
  {
    category: "Account & Billing",
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual plans. Enterprise customers can request custom invoicing."
  },
  {
    category: "Account & Billing",
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel anytime from Settings > Subscription. Your access continues until the end of your billing period. We don't offer refunds for partial months."
  },
  {
    category: "Account & Billing",
    question: "How do I change my billing information?",
    answer: "Visit Settings > Billing > Payment Methods. You can add, remove, or update credit cards and billing addresses. Changes take effect immediately."
  },
  {
    category: "Account & Billing",
    question: "Do you offer discounts for annual plans?",
    answer: "Yes! Annual plans save you 20% compared to monthly billing. Nonprofit organizations and educational institutions may qualify for additional discounts - contact sales@argilette.org."
  },
  
  // Features & Usage
  {
    category: "Features & Usage",
    question: "How do I create and manage deals?",
    answer: "Go to Deals > New Deal. Fill in details like deal name, value, expected close date, and associated contact. Drag deals between pipeline stages to update progress. Add notes, files, and activities to track everything."
  },
  {
    category: "Features & Usage",
    question: "Can I customize my sales pipeline?",
    answer: "Absolutely! Go to Settings > Pipelines. Create custom stages, set probability percentages, add automation rules, and configure win/loss reasons. You can have multiple pipelines for different products or teams."
  },
  {
    category: "Features & Usage",
    question: "How does the AI assistant work?",
    answer: "Our AI analyzes your customer data to provide insights, predict deal outcomes, suggest next best actions, and automate repetitive tasks. It learns from your patterns and improves over time."
  },
  {
    category: "Features & Usage",
    question: "Can I send bulk emails?",
    answer: "Yes! Go to Campaigns > Email Marketing. Create templates, segment your audience, personalize messages with merge tags, and schedule sends. Track opens, clicks, and replies in real-time."
  },
  {
    category: "Features & Usage",
    question: "How do I set up automation workflows?",
    answer: "Navigate to Automation > Workflows. Choose triggers (e.g., new lead, deal stage change), add conditions, and set actions (send email, create task, update field). Our visual builder makes it easy."
  },
  {
    category: "Features & Usage",
    question: "Can I integrate with other tools?",
    answer: "Yes! We integrate with 100+ tools including Gmail, Outlook, Slack, Zapier, Stripe, Shopify, and more. Go to Settings > Integrations to connect your apps."
  },
  
  // Technical Support
  {
    category: "Technical Support",
    question: "I forgot my password. How do I reset it?",
    answer: "Click 'Forgot password?' on the login page. Enter your email address, and we'll send you a reset link. The link expires in 1 hour. If you don't receive it, check your spam folder."
  },
  {
    category: "Technical Support",
    question: "Why can't I log in?",
    answer: "Common reasons: incorrect password, unverified email, or account suspension. Try resetting your password. If issues persist, contact support@argilette.org with your email address."
  },
  {
    category: "Technical Support",
    question: "How do I export my data?",
    answer: "Go to Settings > Data > Export. Choose what to export (contacts, deals, tasks, etc.) and format (CSV, Excel, JSON). Large exports are emailed to you within minutes."
  },
  {
    category: "Technical Support",
    question: "Is my data secure?",
    answer: "Absolutely. We use bank-level 256-bit SSL encryption, regular security audits, and SOC 2 compliance. Data is backed up daily to multiple locations. You own your data and can export it anytime."
  },
  {
    category: "Technical Support",
    question: "What browsers are supported?",
    answer: "We support the latest versions of Chrome, Firefox, Safari, and Edge. For best performance, use Chrome. Mobile browsers are also fully supported."
  },
  
  // Pricing & Plans
  {
    category: "Pricing & Plans",
    question: "What's included in the free trial?",
    answer: "14-day free trial with full access to Professional plan features. No credit card required. Trial includes unlimited contacts, email campaigns, automation, and all integrations."
  },
  {
    category: "Pricing & Plans",
    question: "What's the difference between plans?",
    answer: "Starter: Basic CRM for small teams (5 users, 10k contacts). Professional: Advanced features, automation, unlimited contacts. Enterprise: Custom limits, dedicated support, API access, SSO."
  },
  {
    category: "Pricing & Plans",
    question: "Can I change plans later?",
    answer: "Yes! Upgrade or downgrade anytime. Upgrades are immediate. Downgrades take effect at the next billing cycle. Pro-rated credits apply."
  },
  {
    category: "Pricing & Plans",
    question: "Do you charge per user?",
    answer: "Yes, pricing is per user per month. Starter: $29/user, Professional: $59/user, Enterprise: custom. Volume discounts available for 10+ users."
  },
  {
    category: "Pricing & Plans",
    question: "What happens if I exceed my contact limit?",
    answer: "We'll notify you when you reach 80% of your limit. You can upgrade your plan or purchase additional contact packs. We never delete contacts or block access."
  }
];

const categories = [
  { name: "Getting Started", icon: Rocket, color: "from-blue-500 to-cyan-500" },
  { name: "Account & Billing", icon: CreditCard, color: "from-green-500 to-emerald-500" },
  { name: "Features & Usage", icon: Cpu, color: "from-purple-500 to-pink-500" },
  { name: "Technical Support", icon: Headphones, color: "from-orange-500 to-red-500" },
  { name: "Pricing & Plans", icon: DollarSign, color: "from-indigo-500 to-blue-500" }
];

const quickLinks = [
  { title: "Getting Started Guide", icon: Book, href: "#getting-started" },
  { title: "Create Account", icon: UserPlus, href: "/signup" },
  { title: "Account Settings", icon: Settings, href: "/settings" },
  { title: "Analytics Dashboard", icon: BarChart, href: "/analytics" },
  { title: "E-commerce Setup", icon: ShoppingCart, href: "/e-commerce-dashboard" },
  { title: "Contact Support", icon: MessageSquare, href: "#support" }
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedFAQs = filteredFAQs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <Logo />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              How can we help you?
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Search our knowledge base or browse categories below
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg bg-white dark:bg-gray-800 border-none shadow-xl"
                  data-testid="input-search-help"
                />
              </div>
              {searchQuery && (
                <p className="mt-3 text-sm text-white/80">
                  Found {filteredFAQs.length} {filteredFAQs.length === 1 ? 'result' : 'results'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 max-w-6xl py-12">
        {/* Quick Links */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Quick Links</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <Link 
                  key={index}
                  to={link.href}
                  data-testid={`link-quick-${index}`}
                >
                  <Card className="hover-elevate cursor-pointer transition-all">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{link.title}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category, index) => {
              const Icon = category.icon;
              const categoryFAQs = faqs.filter(faq => faq.category === category.name);
              const isSelected = selectedCategory === category.name;
              
              return (
                <Card 
                  key={index}
                  className={`cursor-pointer hover-elevate transition-all ${
                    isSelected ? 'border-2 border-primary' : ''
                  }`}
                  onClick={() => setSelectedCategory(isSelected ? null : category.name)}
                  data-testid={`card-category-${index}`}
                >
                  <CardHeader>
                    <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center mb-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription>
                      {categoryFAQs.length} {categoryFAQs.length === 1 ? 'article' : 'articles'}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
          
          {selectedCategory && (
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedCategory(null)}
                data-testid="button-clear-category"
              >
                Clear Filter
              </Button>
            </div>
          )}
        </div>

        {/* FAQs */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            {selectedCategory || 'Frequently Asked Questions'}
          </h2>
          
          {Object.keys(groupedFAQs).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">
                  No articles found for "{searchQuery}"
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try different keywords or browse categories above
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedFAQs).map(([category, categoryFAQs]) => (
              <div key={category} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="outline" className="text-sm">
                    {category}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {categoryFAQs.length} {categoryFAQs.length === 1 ? 'article' : 'articles'}
                  </span>
                </div>
                
                <Card>
                  <CardContent className="p-6">
                    <Accordion type="single" collapsible className="w-full">
                      {categoryFAQs.map((faq, index) => (
                        <AccordionItem key={index} value={`${category}-${index}`}>
                          <AccordionTrigger 
                            className="text-left hover:no-underline"
                            data-testid={`accordion-trigger-${category}-${index}`}
                          >
                            <div className="flex items-start gap-3">
                              <HelpCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                              <span className="font-medium">{faq.question}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent 
                            className="text-muted-foreground pl-8"
                            data-testid={`accordion-content-${category}-${index}`}
                          >
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>

        {/* Contact Support Section */}
        <div id="support">
          <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-2 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Still need help?</CardTitle>
              <CardDescription className="text-base">
                Our support team is here to assist you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <Card className="hover-elevate">
                  <CardContent className="pt-6 text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Email Support</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get help via email within 24 hours
                    </p>
                    <a href="mailto:support@argilette.org">
                      <Button variant="outline" className="w-full" data-testid="button-email-support">
                        support@argilette.org
                      </Button>
                    </a>
                  </CardContent>
                </Card>

                <Card className="hover-elevate">
                  <CardContent className="pt-6 text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Live Chat</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Chat with our team in real-time
                    </p>
                    <Button className="w-full" data-testid="button-start-chat">
                      Start Chat
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Enterprise customers:{" "}
                  <a 
                    href="mailto:enterprise@argilette.org" 
                    className="text-primary hover:underline font-medium"
                    data-testid="link-enterprise-support"
                  >
                    enterprise@argilette.org
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link href="/">
            <Button variant="outline" size="lg" data-testid="button-back-home">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
