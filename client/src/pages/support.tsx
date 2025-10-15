import { useState } from "react";
import LandingLayout from "@/components/landing-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Calendar,
  FileText,
  Video,
  HelpCircle,
  Zap,
  ArrowRight,
  Sparkles,
  Clock,
  Users,
  BookOpen,
  Shield
} from "lucide-react";

interface SupportService {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: string;
  badge: string;
  availability: string;
  responseTime: string;
  features: string[];
  action: () => void;
}

export default function SupportPage() {
  const [selectedCategory, setSelectedCategory] = useState('All Support');

  const handleLiveChat = () => {
    // Simulate live chat opening
    alert('Live chat support coming soon! Please use email support for now.');
  };

  const handlePhoneSupport = () => {
    window.location.href = 'tel:+13144723839';
  };

  const handleEmailSupport = () => {
    window.location.href = 'mailto:support@argilette.org';
  };

  const handleScheduleConsultation = () => {
    window.location.href = '/consultation-booking';
  };

  const handleDocumentation = () => {
    window.location.href = '/learning';
  };

  const handleVideoTutorials = () => {
    window.location.href = '/learning';
  };

  const handleCommunityForum = () => {
    alert('Community forum coming soon! Please use direct support channels for now.');
  };

  const handleEmergencySupport = () => {
    window.location.href = 'tel:+13144723839';
  };

  const handleTrainingSession = () => {
    window.location.href = '/consultation-booking';
  };

  const handleImplementationHelp = () => {
    window.location.href = '/consultation-booking';
  };

  const handleTechnicalIntegration = () => {
    window.location.href = '/consultation-booking';
  };

  const handleKnowledgeBase = () => {
    window.location.href = '/learning';
  };

  const handleWebinarSeries = () => {
    window.location.href = '/learning';
  };

  const handleBestPracticesGuide = () => {
    window.location.href = '/learning';
  };

  const handleDataMigration = () => {
    window.location.href = '/consultation-booking';
  };

  const supportServices: SupportService[] = [
    {
      id: 'live-chat',
      title: "Live Chat Support",
      description: "Instant help from our expert support team via real-time chat",
      icon: MessageCircle,
      category: "Direct Support",
      badge: "24/7 Available",
      availability: "24/7",
      responseTime: "< 2 minutes",
      features: [
        "Real-time assistance",
        "Screen sharing support",
        "Issue escalation",
        "Chat history access"
      ],
      action: handleLiveChat
    },
    {
      id: 'phone-support',
      title: "Phone Support",
      description: "Direct phone line to our technical support specialists",
      icon: Phone,
      category: "Direct Support",
      badge: "Priority Access",
      availability: "Business Hours",
      responseTime: "Immediate",
      features: [
        "One-on-one consultation",
        "Complex issue resolution",
        "Urgent matter handling",
        "Expert guidance"
      ],
      action: handlePhoneSupport
    },
    {
      id: 'email-support',
      title: "Email Support",
      description: "Comprehensive email support with detailed solutions",
      icon: Mail,
      category: "Direct Support",
      badge: "Detailed Solutions",
      availability: "24/7",
      responseTime: "< 4 hours",
      features: [
        "Detailed documentation",
        "Screenshot assistance",
        "Step-by-step guides",
        "Follow-up support"
      ],
      action: handleEmailSupport
    },
    {
      id: 'consultation-booking',
      title: "Expert Consultation",
      description: "Schedule one-on-one sessions with CRM implementation experts",
      icon: Calendar,
      category: "Professional Services",
      badge: "Expert Guidance",
      availability: "Scheduled",
      responseTime: "Same day",
      features: [
        "Personalized consultation",
        "Implementation planning",
        "Best practices review",
        "Strategic guidance"
      ],
      action: handleScheduleConsultation
    },
    {
      id: 'documentation',
      title: "Knowledge Base",
      description: "Comprehensive documentation and help articles",
      icon: FileText,
      category: "Self-Service",
      badge: "Comprehensive",
      availability: "24/7",
      responseTime: "Instant",
      features: [
        "Searchable articles",
        "Video tutorials",
        "API documentation",
        "Best practices"
      ],
      action: handleDocumentation
    },
    {
      id: 'video-tutorials',
      title: "Video Tutorials",
      description: "Step-by-step video guides for all platform features",
      icon: Video,
      category: "Self-Service",
      badge: "Visual Learning",
      availability: "24/7",
      responseTime: "Instant",
      features: [
        "HD video quality",
        "Feature walkthroughs",
        "Advanced techniques",
        "Regular updates"
      ],
      action: handleVideoTutorials
    },
    {
      id: 'community-forum',
      title: "Community Forum",
      description: "Connect with other users and share best practices",
      icon: Users,
      category: "Community",
      badge: "Peer Support",
      availability: "24/7",
      responseTime: "Community driven",
      features: [
        "User discussions",
        "Expert moderators",
        "Solution sharing",
        "Feature requests"
      ],
      action: handleCommunityForum
    },
    {
      id: 'emergency-support',
      title: "Emergency Support",
      description: "Critical issue resolution for business-critical problems",
      icon: Zap,
      category: "Premium Support",
      badge: "Critical",
      availability: "24/7",
      responseTime: "< 15 minutes",
      features: [
        "Emergency hotline",
        "Immediate escalation",
        "Critical issue priority",
        "Dedicated specialists"
      ],
      action: handleEmergencySupport
    },
    {
      id: 'training-sessions',
      title: "Training Sessions",
      description: "Personalized training for your team and advanced features",
      icon: BookOpen,
      category: "Professional Services",
      badge: "Team Training",
      availability: "Scheduled",
      responseTime: "Within 24 hours",
      features: [
        "Custom curriculum",
        "Team workshops",
        "Advanced features",
        "Certification programs"
      ],
      action: handleTrainingSession
    }
  ];

  const categories = [
    'All Support',
    'Direct Support',
    'Professional Services',
    'Self-Service',
    'Community',
    'Premium Support'
  ];

  const filteredServices = selectedCategory === 'All Support' 
    ? supportServices 
    : supportServices.filter(service => service.category === selectedCategory);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const getServiceIcon = (IconComponent: any) => {
    return <IconComponent className="h-6 w-6" />;
  };

  const getResponseTimeColor = (responseTime: string) => {
    if (responseTime.includes('minute')) return 'text-green-600';
    if (responseTime.includes('hour')) return 'text-yellow-600';
    if (responseTime === 'Instant') return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <LandingLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white py-16 relative overflow-hidden">
          {/* Background Technology Image */}
          <div className="absolute inset-0 opacity-15">
            <img 
              src="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1200&h=400&fit=crop&crop=center" 
              alt="Customer support team with headsets and computers" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Support & Help Center
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                Expert Support • Quick Solutions • Always Available
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <Badge className="bg-purple-600/20 text-purple-100 px-4 py-2 text-sm">
                  <Clock className="h-4 w-4 mr-2" />
                  24/7 Support
                </Badge>
                <Badge className="bg-blue-600/20 text-blue-100 px-4 py-2 text-sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Expert Team
                </Badge>
                <Badge className="bg-indigo-600/20 text-indigo-100 px-4 py-2 text-sm">
                  <Zap className="h-4 w-4 mr-2" />
                  Fast Response
                </Badge>
              </div>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-3"
                onClick={handleLiveChat}
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Get Help Now
              </Button>
            </div>
          </div>
        </div>

        {/* Support Categories */}
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
                  {category === 'All Support' 
                    ? supportServices.length 
                    : supportServices.filter(s => s.category === category).length
                  }
                </Badge>
              </button>
            ))}
          </div>

          {/* Featured Support Technology Showcase */}
          <div className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  World-Class Support Technology
                </h3>
                <p className="text-gray-600 mb-6">
                  Our advanced support infrastructure combines AI-powered assistance, expert human support, and cutting-edge technology to provide you with the fastest, most effective help possible.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">&lt;2min</div>
                    <div className="text-sm text-gray-600">Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">24/7</div>
                    <div className="text-sm text-gray-600">Availability</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">99%</div>
                    <div className="text-sm text-gray-600">Resolution Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">5⭐</div>
                    <div className="text-sm text-gray-600">Support Rating</div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center" 
                  alt="Modern support center with advanced technology" 
                  className="rounded-lg shadow-xl w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent rounded-lg"></div>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
                    <div className="text-xs font-semibold text-gray-800">24/7 Support</div>
                    <div className="text-xs text-gray-600">Always here to help</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Support Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service) => (
              <Card key={service.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                      {getServiceIcon(service.icon)}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="bg-purple-100 text-purple-700"
                    >
                      {service.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                    {service.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Availability</span>
                      <span className="font-semibold text-green-600">{service.availability}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Response Time</span>
                      <span className={`font-semibold ${getResponseTimeColor(service.responseTime)}`}>
                        {service.responseTime}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-500 mb-2 block">Features</span>
                      <div className="space-y-1">
                        {service.features.map((feature, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 flex-shrink-0"></div>
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all"
                        onClick={service.action}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Get Support
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Emergency Contact Section */}
          <div className="mt-16">
            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">
              <CardContent className="py-8">
                <div className="text-center">
                  <Zap className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Emergency Support</h3>
                  <p className="mb-4 text-red-100">
                    For critical business issues requiring immediate attention
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Button 
                      size="lg" 
                      variant="secondary" 
                      className="bg-white text-red-600 hover:bg-gray-100"
                      onClick={handleEmergencySupport}
                    >
                      <Phone className="h-5 w-5 mr-2" />
                      Emergency Hotline
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="border-white text-white hover:bg-white/10"
                      onClick={handleEmailSupport}
                    >
                      <Mail className="h-5 w-5 mr-2" />
                      Priority Email
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="mt-16">
            <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
              <CardContent className="py-12">
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold mb-4">Contact Our Team</h3>
                  <p className="text-lg text-purple-100">
                    Reach out to the right department for fast, personalized assistance
                  </p>
                </div>

                {/* Primary Contact Methods */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  <div className="text-center">
                    <Phone className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-semibold">Phone Support</p>
                    <a href="tel:+13144723839" className="text-purple-100 hover:text-white transition-colors">
                      +1 (314) 472-3839
                    </a>
                  </div>
                  <div className="text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-semibold">Support Hours</p>
                    <p className="text-purple-100">24/7 Availability</p>
                  </div>
                  <div className="text-center">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-semibold">Live Chat</p>
                    <p className="text-purple-100">Instant Response</p>
                  </div>
                </div>

                {/* Email Addresses by Department */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8">
                  <h4 className="text-xl font-bold mb-6 text-center">Contact by Department</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* General Inquiries */}
                    <div className="bg-white/10 rounded-lg p-4">
                      <p className="font-semibold mb-2 text-purple-100">General Inquiries</p>
                      <div className="space-y-1">
                        <a href="mailto:info@argilette.org" className="text-sm hover:text-white transition-colors block">
                          info@argilette.org
                        </a>
                        <a href="mailto:hello@argilette.org" className="text-sm hover:text-white transition-colors block">
                          hello@argilette.org
                        </a>
                        <a href="mailto:contact@argilette.org" className="text-sm hover:text-white transition-colors block">
                          contact@argilette.org
                        </a>
                      </div>
                    </div>

                    {/* Customer Support */}
                    <div className="bg-white/10 rounded-lg p-4">
                      <p className="font-semibold mb-2 text-purple-100">Customer Support</p>
                      <div className="space-y-1">
                        <a href="mailto:support@argilette.org" className="text-sm hover:text-white transition-colors block">
                          support@argilette.org
                        </a>
                        <a href="mailto:help@argilette.org" className="text-sm hover:text-white transition-colors block">
                          help@argilette.org
                        </a>
                        <a href="mailto:service@argilette.org" className="text-sm hover:text-white transition-colors block">
                          service@argilette.org
                        </a>
                      </div>
                    </div>

                    {/* Sales & Business */}
                    <div className="bg-white/10 rounded-lg p-4">
                      <p className="font-semibold mb-2 text-purple-100">Sales & Business</p>
                      <div className="space-y-1">
                        <a href="mailto:sales@argilette.org" className="text-sm hover:text-white transition-colors block">
                          sales@argilette.org
                        </a>
                        <a href="mailto:business@argilette.org" className="text-sm hover:text-white transition-colors block">
                          business@argilette.org
                        </a>
                        <a href="mailto:demo@argilette.org" className="text-sm hover:text-white transition-colors block">
                          demo@argilette.org
                        </a>
                      </div>
                    </div>

                    {/* Billing & Accounts */}
                    <div className="bg-white/10 rounded-lg p-4">
                      <p className="font-semibold mb-2 text-purple-100">Billing & Accounts</p>
                      <div className="space-y-1">
                        <a href="mailto:billing@argilette.org" className="text-sm hover:text-white transition-colors block">
                          billing@argilette.org
                        </a>
                        <a href="mailto:accounts@argilette.org" className="text-sm hover:text-white transition-colors block">
                          accounts@argilette.org
                        </a>
                        <a href="mailto:finance@argilette.org" className="text-sm hover:text-white transition-colors block">
                          finance@argilette.org
                        </a>
                      </div>
                    </div>

                    {/* Partnerships */}
                    <div className="bg-white/10 rounded-lg p-4">
                      <p className="font-semibold mb-2 text-purple-100">Partnerships</p>
                      <div className="space-y-1">
                        <a href="mailto:partnerships@argilette.org" className="text-sm hover:text-white transition-colors block">
                          partnerships@argilette.org
                        </a>
                        <a href="mailto:marketing@argilette.org" className="text-sm hover:text-white transition-colors block">
                          marketing@argilette.org
                        </a>
                        <a href="mailto:press@argilette.org" className="text-sm hover:text-white transition-colors block">
                          press@argilette.org
                        </a>
                      </div>
                    </div>

                    {/* Technical Support */}
                    <div className="bg-white/10 rounded-lg p-4">
                      <p className="font-semibold mb-2 text-purple-100">Technical Support</p>
                      <div className="space-y-1">
                        <a href="mailto:tech@argilette.org" className="text-sm hover:text-white transition-colors block">
                          tech@argilette.org
                        </a>
                        <a href="mailto:api@argilette.org" className="text-sm hover:text-white transition-colors block">
                          api@argilette.org
                        </a>
                        <a href="mailto:developers@argilette.org" className="text-sm hover:text-white transition-colors block">
                          developers@argilette.org
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Button 
                    size="lg" 
                    variant="secondary" 
                    className="bg-white text-purple-600 hover:bg-gray-100"
                    onClick={handleScheduleConsultation}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Schedule Expert Consultation
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