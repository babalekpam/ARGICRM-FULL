import { useState } from "react";
import { useLocation } from "wouter";
import LandingLayout from "@/components/landing-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Radio, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Zap, 
  Globe, 
  Lock,
  Wifi,
  Smartphone,
  Database,
  Mail,
  Search,
  TrendingUp,
  Headphones,
  Settings,
  Calendar,
  Send,
  Bot,
  Sparkles,
  ArrowRight
} from "lucide-react";

interface Service {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: string;
  pricing: string;
  features: string[];
  expertise: 'cybersecurity' | 'rf-engineering' | 'crm' | 'marketing' | 'analytics' | 'communication' | 'operations' | 'consultation';
}

const services: Service[] = [
  // Cybersecurity Services
  {
    id: 'cybersecurity-assessment',
    title: 'Cybersecurity Assessment',
    description: 'Comprehensive security evaluation of your infrastructure, networks, and applications',
    icon: Shield,
    category: 'Cybersecurity',
    pricing: 'Contact for Quote',
    features: ['Vulnerability scanning', 'Penetration testing', 'Risk assessment', 'Compliance review', 'Security roadmap'],
    expertise: 'cybersecurity'
  },
  {
    id: 'managed-security',
    title: 'Managed Security Operations',
    description: '24/7 security monitoring and incident response services',
    icon: Lock,
    category: 'Cybersecurity',
    pricing: 'Contact for Quote',
    features: ['SOC monitoring', 'Threat detection', 'Incident response', 'Security analytics', 'Compliance reporting'],
    expertise: 'cybersecurity'
  },
  {
    id: 'compliance-consulting',
    title: 'Compliance Consulting',
    description: 'Expert guidance for GDPR, HIPAA, SOC 2, and other regulatory requirements',
    icon: Settings,
    category: 'Cybersecurity',
    pricing: 'Contact for Quote',
    features: ['Compliance gap analysis', 'Policy development', 'Audit preparation', 'Training programs', 'Certification support'],
    expertise: 'cybersecurity'
  },

  // RF Engineering Services
  {
    id: 'rf-system-design',
    title: 'RF System Design & Integration',
    description: 'Custom RF solutions for wireless communication systems and IoT deployments',
    icon: Radio,
    category: 'RF Engineering',
    pricing: 'Contact for Quote',
    features: ['System architecture', 'Component selection', 'Performance optimization', 'EMC compliance', 'Field testing'],
    expertise: 'rf-engineering'
  },
  {
    id: 'wireless-optimization',
    title: 'Wireless Network Optimization',
    description: 'Optimize wireless performance for maximum coverage and reliability',
    icon: Wifi,
    category: 'RF Engineering',
    pricing: 'Contact for Quote',
    features: ['Coverage analysis', 'Interference mitigation', 'Capacity planning', 'Performance tuning', 'Site surveys'],
    expertise: 'rf-engineering'
  },
  {
    id: 'iot-connectivity',
    title: 'IoT Connectivity Solutions',
    description: 'End-to-end IoT communication infrastructure and device management',
    icon: Smartphone,
    category: 'RF Engineering',
    pricing: 'Contact for Quote',
    features: ['Protocol implementation', 'Device provisioning', 'Network management', 'Security integration', 'Scalability planning'],
    expertise: 'rf-engineering'
  },

  // CRM Solutions
  {
    id: 'crm-implementation',
    title: 'CRM Implementation & Setup',
    description: 'Complete CRM deployment with customization and team training',
    icon: Users,
    category: 'CRM Solutions',
    pricing: '$99 - $199/month',
    features: ['Custom configuration', 'Data migration', 'User training', 'Integration setup', 'Ongoing support'],
    expertise: 'crm'
  },
  {
    id: 'sales-automation',
    title: 'Sales Process Automation',
    description: 'Streamline your sales workflow with intelligent automation',
    icon: Zap,
    category: 'CRM Solutions',
    pricing: '$149 - $299/month',
    features: ['Lead scoring', 'Pipeline automation', 'Email sequences', 'Follow-up reminders', 'Performance tracking'],
    expertise: 'crm'
  },
  {
    id: 'customer-analytics',
    title: 'Customer Analytics & Insights',
    description: 'Advanced analytics to understand customer behavior and improve retention',
    icon: BarChart3,
    category: 'CRM Solutions',
    pricing: '$199 - $399/month',
    features: ['Behavioral analysis', 'Predictive modeling', 'Churn prediction', 'Lifetime value', 'Custom dashboards'],
    expertise: 'crm'
  },

  // Marketing Automation
  {
    id: 'email-marketing',
    title: 'Email Marketing Campaigns',
    description: 'Automated email marketing with personalization and advanced analytics',
    icon: Mail,
    category: 'Marketing Automation',
    pricing: '$49 - $199/month',
    features: ['Campaign builder', 'Personalization', 'A/B testing', 'Deliverability optimization', 'ROI tracking'],
    expertise: 'marketing'
  },
  {
    id: 'lead-generation',
    title: 'Lead Generation & Nurturing',
    description: 'Intelligent lead capture and nurturing sequences',
    icon: Search,
    category: 'Marketing Automation',
    pricing: '$99 - $299/month',
    features: ['Landing pages', 'Form optimization', 'Lead scoring', 'Nurture sequences', 'Conversion tracking'],
    expertise: 'marketing'
  },

  // Analytics & AI
  {
    id: 'business-intelligence',
    title: 'Business Intelligence Platform',
    description: 'Comprehensive BI solution with real-time dashboards and reporting',
    icon: TrendingUp,
    category: 'Analytics & AI',
    pricing: '$199 - $499/month',
    features: ['Real-time dashboards', 'Custom reports', 'Data visualization', 'Predictive analytics', 'Mobile access'],
    expertise: 'analytics'
  },
  {
    id: 'ai-insights',
    title: 'AI-Powered Business Insights',
    description: 'Machine learning algorithms to uncover hidden business opportunities',
    icon: Sparkles,
    category: 'Analytics & AI',
    pricing: '$299 - $799/month',
    features: ['Pattern recognition', 'Predictive modeling', 'Anomaly detection', 'Recommendation engine', 'Natural language queries'],
    expertise: 'analytics'
  },

  // Communication
  {
    id: 'unified-inbox',
    title: 'Unified Communication Hub',
    description: 'Centralize all customer communications in one intelligent platform',
    icon: MessageSquare,
    category: 'Communication',
    pricing: '$79 - $199/month',
    features: ['Multi-channel inbox', 'Auto-routing', 'Response templates', 'Collaboration tools', 'Performance metrics'],
    expertise: 'communication'
  },
  {
    id: 'customer-support',
    title: 'Customer Support System',
    description: 'Complete help desk solution with ticketing and knowledge base',
    icon: Headphones,
    category: 'Communication',
    pricing: '$99 - $249/month',
    features: ['Ticket management', 'Knowledge base', 'Live chat', 'SLA tracking', 'Customer satisfaction surveys'],
    expertise: 'communication'
  },

  // Business Operations
  {
    id: 'workflow-automation',
    title: 'Business Process Automation',
    description: 'Automate repetitive tasks and streamline business workflows',
    icon: Settings,
    category: 'Business Operations',
    pricing: '$149 - $399/month',
    features: ['Process mapping', 'Task automation', 'Approval workflows', 'Integration hub', 'Performance monitoring'],
    expertise: 'operations'
  },
  {
    id: 'project-management',
    title: 'Project Management Suite',
    description: 'Complete project management with resource allocation and timeline tracking',
    icon: Calendar,
    category: 'Business Operations',
    pricing: '$99 - $299/month',
    features: ['Project planning', 'Resource management', 'Time tracking', 'Collaboration tools', 'Progress reporting'],
    expertise: 'operations'
  },

  // Consultation & Strategy
  {
    id: 'digital-transformation',
    title: 'Digital Transformation Consulting',
    description: 'Strategic guidance for modernizing your business processes and technology',
    icon: Globe,
    category: 'Consultation & Strategy',
    pricing: 'Contact for Quote',
    features: ['Strategy development', 'Technology assessment', 'Implementation roadmap', 'Change management', 'Performance metrics'],
    expertise: 'consultation'
  },
  {
    id: 'technical-advisory',
    title: 'Technical Advisory Services',
    description: 'Expert technical guidance for complex cybersecurity and RF engineering challenges',
    icon: Settings,
    category: 'Consultation & Strategy',
    pricing: 'Contact for Quote',
    features: ['Technical assessment', 'Solution architecture', 'Best practices', 'Risk mitigation', 'Performance optimization'],
    expertise: 'consultation'
  }
];

const categories = [
  'All Services',
  'Cybersecurity',
  'RF Engineering', 
  'CRM Solutions',
  'Marketing Automation',
  'Analytics & AI',
  'Communication',
  'Business Operations',
  'Consultation & Strategy'
];

export default function ServicesComprehensive() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('All Services');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your ARGILETTE services advisor. I specialize in matching you with the perfect cybersecurity, RF engineering, or CRM solutions for your business needs. How can I help you today?' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [userRequirements, setUserRequirements] = useState({
    industry: '',
    company_size: '',
    budget: '',
    priorities: ''
  });

  const filteredServices = selectedCategory === 'All Services' 
    ? services 
    : services.filter(service => service.category === selectedCategory);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const getServiceIcon = (IconComponent: any) => {
    return <IconComponent className="h-6 w-6" />;
  };

  const getActionButton = (service: Service) => {
    if (service.expertise === 'cybersecurity' || service.expertise === 'rf-engineering' || service.expertise === 'consultation') {
      return (
        <Button 
          variant="outline" 
          className="w-full hover:bg-purple-50 transition-colors"
          onClick={() => setLocation('/consultation-booking')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Consultation
        </Button>
      );
    } else {
      return (
        <Button 
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all"
          onClick={() => setLocation('/')}
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          Get Started
        </Button>
      );
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMsg = { role: 'user', content: newMessage };
    setChatMessages(prev => [...prev, userMsg]);

    // AI Service Matching Logic
    const matchedServices = services.filter(service => {
      const query = newMessage.toLowerCase();
      return (
        service.title.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        service.category.toLowerCase().includes(query) ||
        service.features.some(feature => feature.toLowerCase().includes(query))
      );
    });

    let response = '';
    if (matchedServices.length > 0) {
      response = `Based on your inquiry, I recommend these services:\n\n`;
      matchedServices.slice(0, 3).forEach(service => {
        response += `🔹 **${service.title}**: ${service.description} (${service.pricing})\n\n`;
      });
      response += `Would you like more details about any of these services, or shall I help you with something else?`;
    } else {
      response = `I'd be happy to help you find the right solution! Could you tell me more about:\n\n• Your industry or business type\n• Company size\n• Specific challenges you're facing\n• Budget considerations\n\nThis will help me recommend the best ARGILETTE services for your needs.`;
    }

    const aiMsg = { role: 'assistant', content: response };
    setChatMessages(prev => [...prev, aiMsg]);
    setNewMessage('');
  };

  return (
    <LandingLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              ARGILETTE Professional Services
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Cybersecurity Excellence • RF Engineering Expertise • CRM Innovation
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge className="bg-purple-600/20 text-purple-100 px-4 py-2 text-sm">
                <Shield className="h-4 w-4 mr-2" />
                Cybersecurity Leaders
              </Badge>
              <Badge className="bg-blue-600/20 text-blue-100 px-4 py-2 text-sm">
                <Radio className="h-4 w-4 mr-2" />
                RF Engineering Specialists
              </Badge>
              <Badge className="bg-indigo-600/20 text-indigo-100 px-4 py-2 text-sm">
                <Users className="h-4 w-4 mr-2" />
                CRM Innovation Partners
              </Badge>
            </div>
            <Dialog open={chatOpen} onOpenChange={setChatOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-3">
                  <Bot className="h-5 w-5 mr-2" />
                  Get AI Service Recommendations
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Service Categories */}
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
                {category === 'All Services' 
                  ? services.length 
                  : services.filter(s => s.category === category).length
                }
              </Badge>
            </button>
          ))}
        </div>

        {/* Services Grid */}
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
                    className={`${
                      service.expertise === 'cybersecurity' ? 'bg-red-100 text-red-700' :
                      service.expertise === 'rf-engineering' ? 'bg-blue-100 text-blue-700' :
                      service.expertise === 'crm' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {service.category}
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
                    <span className="text-sm font-medium text-gray-500">Pricing</span>
                    <span className="font-semibold text-purple-600">{service.pricing}</span>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-500 mb-2 block">Key Features</span>
                    <div className="flex flex-wrap gap-1">
                      {service.features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {service.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{service.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="pt-4">
                    {getActionButton(service)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* AI Service Advisor Chat */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Bot className="h-5 w-5 mr-2 text-purple-600" />
              ARGILETTE AI Service Advisor
            </DialogTitle>
            <DialogDescription>
              Get personalized service recommendations based on your business needs
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-gray-800 border'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 mt-4">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Describe your business needs or ask about our services..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} className="bg-purple-600 hover:bg-purple-700">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Section */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Business?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Let our experts help you choose the right combination of cybersecurity, RF engineering, and CRM solutions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-purple-900">
              <Calendar className="h-5 w-5 mr-2" />
              Schedule Free Consultation
            </Button>
            <Dialog open={chatOpen} onOpenChange={setChatOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Chat with AI Advisor
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
          <div className="mt-8 text-blue-200">
            <p>📧 support@argilette.org • 📞 +1 (314) 472-3839</p>
          </div>
        </div>
      </div>
      </div>
    </LandingLayout>
  );
}