import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  TrendingUp, 
  Mail, 
  MessageSquare, 
  BarChart3, 
  Shield, 
  Zap, 
  Globe, 
  Brain, 
  Heart,
  Target,
  PieChart,
  Calendar,
  Phone,
  Video,
  FileText,
  Settings,
  Database,
  Smartphone,
  Award,
  CheckCircle,
  ArrowRight,
  Star,
  Clock,
  DollarSign,
  Users2,
  Briefcase,
  Headphones,
  Lock,
  Workflow,
  Radio,
  Lightbulb,
  Search,
  AlertTriangle,
  Wifi,
  Network,
  Radar,
  GraduationCap,
  BookOpen,
  UserCheck,
  FileCheck,
  Bot
} from "lucide-react";
import ServiceMatchingChatbot from "@/components/service-matching-chatbot";

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const serviceCategories = [
    { id: "all", label: "All Services", icon: Globe },
    { id: "rf", label: "RF Engineering", icon: Radio },
    { id: "crm", label: "CRM Solutions", icon: Users },
    { id: "marketing", label: "Marketing Automation", icon: Mail },
    { id: "analytics", label: "Analytics & AI", icon: BarChart3 },
    { id: "communication", label: "Communication", icon: MessageSquare },
    { id: "business", label: "Business Operations", icon: Briefcase },
    { id: "consultation", label: "Consultation & Strategy", icon: Lightbulb }
  ];

  const services = [
    // RF Engineering Services
    {
      category: "rf",
      title: "Spectrum Analysis & Management",
      description: "Identify and resolve interference issues with comprehensive spectrum analysis",
      features: ["Interference Detection", "Frequency Planning", "Spectrum Optimization", "Compliance Verification"],
      icon: Radar,
      pricing: "Starting at $1,500.99/analysis"
    },
    {
      category: "rf",
      title: "Network Design & Optimization",
      description: "Build and improve wireless communication systems for optimal performance",
      features: ["Network Planning", "Coverage Analysis", "Performance Optimization", "Capacity Planning"],
      icon: Network,
      pricing: "Starting at $3,500.99/project"
    },
    {
      category: "rf",
      title: "Antenna Placement & Tuning",
      description: "Optimize signal strength and coverage through strategic antenna placement and tuning",
      features: ["Site Surveys", "Antenna Selection", "Signal Optimization", "Coverage Testing"],
      icon: Radio,
      pricing: "Starting at $1,200.99/site"
    },
    {
      category: "rf",
      title: "Wireless Infrastructure Troubleshooting",
      description: "Diagnose and fix connectivity problems in wireless communication systems",
      features: ["Problem Diagnosis", "Signal Analysis", "Equipment Testing", "Solution Implementation"],
      icon: Wifi,
      pricing: "Starting at $800.99/hour"
    },
    {
      category: "rf",
      title: "Signal Flow Analysis",
      description: "Ensure efficient and reliable data transmission through comprehensive signal flow analysis",
      features: ["Path Loss Analysis", "Link Budget Calculations", "Signal Quality Assessment", "Performance Reports"],
      icon: TrendingUp,
      pricing: "Starting at $2,000.99/analysis"
    },

    // CRM Solutions
    {
      category: "crm",
      title: "Customer Relationship Management",
      description: "Complete CRM solution with contact management, lead tracking, and deal pipeline",
      features: ["Contact Management", "Lead Scoring", "Deal Pipeline", "Activity Tracking"],
      icon: Users,
      pricing: "Starting at $17.99/month",
      popular: true
    },
    {
      category: "crm",
      title: "Sales Force Automation",
      description: "Automate your sales processes with intelligent workflows and territory management",
      features: ["Sales Automation", "Territory Management", "Quota Tracking", "Performance Analytics"],
      icon: Target,
      pricing: "Starting at $59.99/month"
    },
    {
      category: "crm",
      title: "Account & Contact Management",
      description: "Centralized customer database with 360-degree customer view",
      features: ["360° Customer View", "Account Hierarchies", "Contact Segmentation", "Data Enrichment"],
      icon: Database,
      pricing: "Included in all plans"
    },

    // Marketing Automation
    {
      category: "marketing",
      title: "Email Marketing Campaigns",
      description: "Create, send, and track professional email campaigns with advanced automation",
      features: ["Email Builder", "A/B Testing", "Automation Sequences", "Deliverability Optimization"],
      icon: Mail,
      pricing: "Starting at $17.99/month"
    },
    {
      category: "marketing",
      title: "SMS Marketing",
      description: "Reach customers instantly with targeted SMS campaigns and notifications",
      features: ["Bulk SMS", "Two-way Messaging", "Opt-in Management", "Campaign Analytics"],
      icon: Smartphone,
      pricing: "Pay per message"
    },
    {
      category: "marketing",
      title: "Landing Page Builder",
      description: "Create high-converting landing pages with drag-and-drop editor",
      features: ["Drag & Drop Builder", "Mobile Responsive", "A/B Testing", "Conversion Tracking"],
      icon: Globe,
      pricing: "Starting at $59.99/month"
    },
    {
      category: "marketing",
      title: "Marketing Automation",
      description: "Intelligent workflows that nurture leads and engage customers automatically",
      features: ["Workflow Builder", "Lead Nurturing", "Behavioral Triggers", "Multi-channel Campaigns"],
      icon: Workflow,
      pricing: "Starting at $59.99/month"
    },

    // Analytics & AI
    {
      category: "analytics",
      title: "Emotional Intelligence Analytics",
      description: "Revolutionary sentiment analysis and emotional intelligence insights",
      features: ["Sentiment Analysis", "Emotional Profiling", "Communication Insights", "Predictive Modeling"],
      icon: Heart,
      pricing: "Starting at $119.99/month",
      premium: true
    },
    {
      category: "analytics",
      title: "Advanced Business Analytics",
      description: "Comprehensive business intelligence with AI-powered insights",
      features: ["Custom Dashboards", "Predictive Analytics", "Revenue Forecasting", "Performance Metrics"],
      icon: BarChart3,
      pricing: "Starting at $59.99/month"
    },
    {
      category: "analytics",
      title: "AI-Powered Predictions",
      description: "Machine learning algorithms for deal scoring and behavior prediction",
      features: ["Lead Scoring", "Deal Probability", "Churn Prediction", "Revenue Forecasting"],
      icon: Brain,
      pricing: "Starting at $119.99/month"
    },
    {
      category: "analytics",
      title: "Custom Reporting",
      description: "Build custom reports and dashboards with advanced data visualization",
      features: ["Report Builder", "Data Visualization", "Scheduled Reports", "Export Options"],
      icon: PieChart,
      pricing: "Starting at $59.99/month"
    },

    // Communication
    {
      category: "communication",
      title: "Unified Communications Hub",
      description: "Centralize all customer communications in one intelligent inbox",
      features: ["Email Integration", "SMS Integration", "Live Chat", "Call Logging"],
      icon: MessageSquare,
      pricing: "Starting at $59.99/month"
    },
    {
      category: "communication",
      title: "Video Conferencing",
      description: "Built-in video meetings with screen sharing and recording",
      features: ["HD Video Calls", "Screen Sharing", "Meeting Recording", "Calendar Integration"],
      icon: Video,
      pricing: "Starting at $59.99/month"
    },
    {
      category: "communication",
      title: "VoIP Phone System",
      description: "Cloud-based phone system with advanced call management",
      features: ["Click-to-Call", "Call Recording", "IVR System", "Call Analytics"],
      icon: Phone,
      pricing: "Starting at $59.99/month"
    },

    // Business Operations
    {
      category: "business",
      title: "Project Management",
      description: "Complete project tracking with team collaboration tools",
      features: ["Task Management", "Team Collaboration", "Timeline Tracking", "Resource Planning"],
      icon: Briefcase,
      pricing: "Starting at $59.99/month"
    },
    {
      category: "business",
      title: "Calendar & Scheduling",
      description: "Smart scheduling with automated booking and calendar sync",
      features: ["Online Booking", "Calendar Sync", "Appointment Reminders", "Resource Scheduling"],
      icon: Calendar,
      pricing: "Starting at $17.99/month"
    },
    {
      category: "business",
      title: "Document Management",
      description: "Secure document storage with version control and collaboration",
      features: ["Document Storage", "Version Control", "Collaboration Tools", "Access Control"],
      icon: FileText,
      pricing: "Starting at $59.99/month"
    },
    {
      category: "business",
      title: "Financial Management",
      description: "Comprehensive bookkeeping and financial reporting tools",
      features: ["Invoicing", "Expense Tracking", "Financial Reports", "Tax Management"],
      icon: DollarSign,
      pricing: "Starting at $59.99/month"
    },

    // Support & Security
    {
      category: "support",
      title: "Customer Support Platform",
      description: "Complete help desk solution with ticket management and knowledge base",
      features: ["Ticket Management", "Knowledge Base", "Live Chat Support", "SLA Management"],
      icon: Headphones,
      pricing: "Starting at $59.99/month"
    },
    {
      category: "support",
      title: "Enterprise Security",
      description: "Advanced security features with compliance and audit tools",
      features: ["Data Encryption", "Access Control", "Audit Logs", "Compliance Tools"],
      icon: Lock,
      pricing: "Starting at $119.99/month"
    },
    {
      category: "support",
      title: "Reputation Management",
      description: "Monitor and manage your online reputation across all platforms",
      features: ["Review Monitoring", "Response Management", "Sentiment Tracking", "Brand Protection"],
      icon: Award,
      pricing: "Starting at $119.99/month"
    },

    // Consultation & Strategy
    {
      category: "consultation",
      title: "Cybersecurity Strategy Consultation",
      description: "Develop comprehensive long-term security strategies tailored to your business needs",
      features: ["Risk Assessment", "Security Roadmap", "Budget Planning", "Implementation Strategy"],
      icon: Lightbulb,
      pricing: "Starting at $2,000/consultation"
    },
    {
      category: "consultation",
      title: "Compliance Support Services",
      description: "Assist with industry-specific regulatory requirements and compliance frameworks",
      features: ["Compliance Auditing", "Documentation Support", "Training Programs", "Ongoing Monitoring"],
      icon: BookOpen,
      pricing: "Starting at $1,500/month"
    },
    {
      category: "consultation",
      title: "Customized Security Solutions",
      description: "Tailor security and connectivity services to meet the unique needs of each client",
      features: ["Custom Development", "Integration Services", "Ongoing Support", "Solution Optimization"],
      icon: UserCheck,
      pricing: "Custom pricing"
    }
  ];

  const filteredServices = selectedCategory === "all" 
    ? services 
    : services.filter(service => service.category === selectedCategory);

  const professionalServices = [
    {
      title: "Cybersecurity Assessment & Planning",
      description: "Comprehensive security evaluation and strategic planning for your organization",
      duration: "2-3 weeks",
      price: "Starting at $5,000.99"
    },
    {
      title: "RF Network Implementation",
      description: "Complete wireless infrastructure design, deployment, and optimization",
      duration: "4-8 weeks",
      price: "Starting at $10,000.99"
    },
    {
      title: "Security Training & Awareness",
      description: "Organization-wide security education and awareness programs",
      duration: "1-2 weeks",
      price: "Starting at $2,500.99"
    },
    {
      title: "Compliance Consulting",
      description: "Industry-specific regulatory compliance guidance and implementation",
      duration: "3-6 weeks",
      price: "Starting at $7,500.99"
    },
    {
      title: "Managed Security Operations",
      description: "Ongoing 24/7 security monitoring and incident response services",
      duration: "Ongoing",
      price: "Starting at $8,000.99/month"
    },
    {
      title: "RF Optimization & Maintenance",
      description: "Continuous monitoring and optimization of wireless infrastructure",
      duration: "Ongoing",
      price: "Starting at $3,000.99/month"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
            ARGILETTE Services
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Comprehensive CRM, cybersecurity and RF engineering solutions powered by advanced AI technology
          </p>
          
          {/* AI Assistant CTA */}
          <div className="mb-8">
            <Button
              onClick={() => setIsChatbotOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Bot className="mr-2 h-5 w-5" />
              Get Personalized Service Recommendations
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Chat with Cloe, our AI assistant, to find the perfect solution for your needs
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={() => window.location.href = '/request-demo?service=cybersecurity&type=assessment'}
            >
              Start Security Assessment
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.location.href = '/request-demo?service=consultation&type=strategy'}
            >
              Schedule Consultation
            </Button>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Service Portfolio</h2>
            <p className="text-lg text-gray-600">
              Explore our comprehensive range of CRM, cybersecurity, and RF engineering solutions
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {serviceCategories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;
              const serviceCount = category.id === "all" 
                ? services.length 
                : services.filter(service => service.category === category.id).length;
              
              return (
                <Button
                  key={category.id}
                  variant={isActive ? "default" : "outline"}
                  onClick={() => {
                    console.log(`Switching to category: ${category.id}`);
                    setSelectedCategory(category.id);
                  }}
                  className={`flex items-center gap-2 transition-all duration-200 ${
                    isActive 
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg" 
                      : "hover:bg-purple-50 hover:border-purple-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {serviceCount}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {/* Active Category Display */}
          {selectedCategory !== "all" && (
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold text-gray-700">
                Showing {serviceCategories.find(cat => cat.id === selectedCategory)?.label} Services
              </h3>
              <p className="text-gray-500 mt-1">
                {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} available
              </p>
            </div>
          )}

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.length > 0 ? filteredServices.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
                  {service.popular && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                        <Star className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}
                  {service.premium && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                        <Award className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg group-hover:from-purple-200 group-hover:to-blue-200 transition-colors">
                        <Icon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{service.title}</CardTitle>
                        <p className="text-sm text-green-600 font-medium">{service.pricing}</p>
                      </div>
                    </div>
                    <CardDescription className="text-gray-600">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Key Features:</h4>
                        <ul className="space-y-1">
                          {service.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="pt-4 flex gap-2">
                        <Button 
                          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          onClick={() => {
                            const serviceRoutes = {
                              cybersecurity: service.title === 'ARGILETTE Security Platform Access' ? '/unified-security-platform' : '/request-demo?service=cybersecurity',
                              rf: '/request-demo?service=rf-engineering',
                              crm: '/adaptive-signup?plan=professional',
                              marketing: '/adaptive-signup?plan=professional',
                              analytics: '/adaptive-signup?plan=enterprise',
                              communication: '/adaptive-signup?plan=professional',
                              business: '/adaptive-signup?plan=professional',
                              consultation: '/request-demo?service=consultation',
                              support: '/adaptive-signup?plan=enterprise'
                            };
                            const route = serviceRoutes[service.category as keyof typeof serviceRoutes] || '/request-demo';
                            window.location.href = route;
                          }}
                        >
                          {service.title === 'ARGILETTE Security Platform Access' ? 'Access Platform' : 'Get Started'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const contactRoutes = {
                              cybersecurity: '/request-demo?service=cybersecurity&type=consultation',
                              rf: '/request-demo?service=rf-engineering&type=consultation',
                              consultation: '/request-demo?service=consultation&type=detailed'
                            };
                            const route = contactRoutes[service.category as keyof typeof contactRoutes] || '/support';
                            window.location.href = route;
                          }}
                        >
                          Learn More
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Globe className="h-16 w-16 mx-auto mb-4" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Services Found</h3>
                <p className="text-gray-500">
                  No services available in the selected category. Try selecting a different category.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Professional Services */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Professional Services</h2>
            <p className="text-lg text-gray-600">
              Expert cybersecurity and RF engineering services delivered by certified professionals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professionalServices.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {service.duration}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                      <DollarSign className="h-4 w-4" />
                      {service.price}
                    </div>
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {
                        window.location.href = '/request-demo?service=professional&type=quote';
                      }}
                    >
                      Request Quote
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose ARGILETTE */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose NODE CRM?</h2>
            <p className="text-lg text-gray-600">
              Your trusted partner for comprehensive CRM, cybersecurity and RF engineering excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cybersecurity Expertise</h3>
              <p className="text-gray-600">
                Advanced threat detection, compliance auditing, and incident response services to protect your digital assets and ensure regulatory compliance.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
                <Radio className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">RF Engineering Excellence</h3>
              <p className="text-gray-600">
                Comprehensive wireless infrastructure solutions including spectrum analysis, network optimization, and signal flow management.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
                <UserCheck className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Trusted Partnership</h3>
              <p className="text-gray-600">
                Customized solutions tailored to your unique requirements with ongoing support and strategic consultation services.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Secure Your Digital Future?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Partner with ARGILETTE for comprehensive CRM, cybersecurity and RF engineering solutions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-purple-600 hover:bg-gray-100"
              onClick={() => window.location.href = '/unified-security-platform'}
            >
              Access Security Platform
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-purple-600"
              onClick={() => window.location.href = '/request-demo?service=cybersecurity&priority=urgent'}
            >
              Security Assessment
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-purple-600"
              onClick={() => window.location.href = '/request-demo?service=enterprise&type=consultation'}
            >
              Contact Sales
            </Button>
          </div>
          <p className="text-sm text-purple-200 mt-4">
            No credit card required • 15-day free trial • Cancel anytime
          </p>
        </div>
      </section>
      {/* Service Matching Chatbot */}
      <ServiceMatchingChatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        onMinimize={() => setIsChatbotOpen(false)}
        isMinimized={false}
      />
    </div>
  );
}