import React, { useState, useRef, useEffect } from 'react';
// Removed Card components to eliminate potential focus ring issues
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Sparkles, Shield, Radio, Settings, MessageCircle, X, Minimize2, Maximize2, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { securityServices, rfServices, crmServices, marketingServices, analyticsServices, collaborationServices, type EnhancedService } from './enhanced-service-data';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  suggestions?: string[];
  services?: ServiceRecommendation[];
}

interface ServiceRecommendation {
  title: string;
  category: string;
  description: string;
  confidence: number;
  price: string;
  duration: string;
  action: string;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
}

const ServiceMatchingChatbot: React.FC<ChatbotProps> = ({ 
  isOpen, 
  onClose, 
  onMinimize, 
  isMinimized 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm Cloe, your AI assistant for NODE CRM platform. I specialize in helping you discover the perfect business solutions from our comprehensive platform: Complete CRM with customer management, E-commerce store builder, Email marketing campaigns, Inventory management, Financial management & bookkeeping, Team collaboration, Advanced analytics, AI automation, and cybersecurity services. What business challenges can I help you solve today?",
      sender: 'bot',
      timestamp: new Date(),
      suggestions: [
        "I need a complete CRM solution",
        "Help me build an online store",
        "Email marketing automation",
        "Show me all available services"
      ]
    }
  ]);
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const analyzeUserQuery = (query: string): ServiceRecommendation[] => {
    const queryLower = query.toLowerCase();
    const services: ServiceRecommendation[] = [];
    
    // Enhanced keyword scoring system
    const calculateRelevanceScore = (keywords: string[], query: string): number => {
      let score = 0;
      const queryWords = query.toLowerCase().split(' ');
      
      keywords.forEach(keyword => {
        if (query.includes(keyword)) {
          score += 100; // Exact phrase match
        } else {
          // Check for partial word matches
          const keywordWords = keyword.split(' ');
          let partialMatches = 0;
          keywordWords.forEach(word => {
            if (queryWords.some(qWord => qWord.includes(word) || word.includes(qWord))) {
              partialMatches++;
            }
          });
          score += (partialMatches / keywordWords.length) * 50;
        }
      });
      
      return Math.min(score, 100);
    };

    // Enhanced service mapping with comprehensive CRM and platform services
    const crmServices = [
      {
        title: 'NODE CRM - Complete Customer Management',
        description: 'Full-featured CRM with contact management, deals pipeline, lead tracking, and customer analytics',
        price: 'Starting at $15.99/user/month',
        duration: 'Setup in 1 day',
        keywords: ['crm', 'customer management', 'contact management', 'deals', 'pipeline', 'leads', 'customer tracking', 'sales management'],
        category: 'CRM',
        confidence: 100,
        action: '/adaptive-signup',
        benefits: ['Contact management', 'Sales pipeline', 'Customer analytics', 'Deal tracking']
      },
      {
        title: 'Cloe AI Agent - Intelligent Business Assistant',
        description: 'AI-powered business automation with NLP onboarding, e-commerce integration, SEO optimization, and email recovery',
        price: 'Included with CRM plans',
        duration: 'Instant setup',
        keywords: ['ai assistant', 'cloe', 'automation', 'artificial intelligence', 'business assistant', 'ai agent', 'intelligent automation'],
        category: 'AI & Intelligence',
        confidence: 100,
        action: '/cloe-ai-agent',
        benefits: ['NLP onboarding', 'E-commerce automation', 'SEO optimization', 'Email recovery']
      },
      {
        title: 'Email Marketing Campaigns',
        description: 'Professional email marketing with templates, automation, and SendGrid integration',
        price: 'Included with Professional plans',
        duration: 'Setup in hours',
        keywords: ['email marketing', 'email campaigns', 'email automation', 'newsletters', 'marketing automation', 'sendgrid'],
        category: 'Marketing',
        confidence: 95,
        action: '/campaigns',
        benefits: ['Email templates', 'Campaign automation', 'Analytics tracking', 'Subscriber management']
      },
      {
        title: 'E-commerce Store Builder',
        description: 'Complete e-commerce platform with store management, product catalog, and payment integration',
        price: 'Starting at $29.99/user/month',
        duration: 'Store live in 24 hours',
        keywords: ['ecommerce', 'e-commerce', 'online store', 'store builder', 'shopping cart', 'product catalog', 'payments'],
        category: 'E-commerce',
        confidence: 95,
        action: '/e-commerce-dashboard',
        benefits: ['Store builder', 'Product management', 'Payment processing', 'Inventory tracking']
      },
      {
        title: 'Advanced Analytics & Reports',
        description: 'Business intelligence with sales analytics, customer insights, and performance tracking',
        price: 'Included with all plans',
        duration: 'Real-time data',
        keywords: ['analytics', 'reports', 'business intelligence', 'data analysis', 'insights', 'performance tracking', 'metrics'],
        category: 'Analytics',
        confidence: 95,
        action: '/analytics',
        benefits: ['Sales analytics', 'Customer insights', 'Performance tracking', 'Custom reports']
      },
      {
        title: 'Inventory Management System',
        description: 'Complete inventory tracking with AI-powered analysis, supplier management, and order processing',
        price: 'Starting at $29.99/user/month',
        duration: 'Setup in 2 days',
        keywords: ['inventory', 'inventory management', 'stock tracking', 'warehouse', 'supplier management', 'order management'],
        category: 'Operations',
        confidence: 95,
        action: '/inventory',
        benefits: ['Stock tracking', 'Supplier management', 'Order processing', 'AI analysis']
      },
      {
        title: 'Funnel Builder & Lead Generation',
        description: 'Create high-converting sales funnels with lead capture, automation, and conversion tracking',
        price: 'Starting at $29.99/user/month',
        duration: 'Funnels live in hours',
        keywords: ['funnel builder', 'sales funnel', 'lead generation', 'conversion', 'landing pages', 'lead capture'],
        category: 'Marketing',
        confidence: 95,
        action: '/funnel-builder',
        benefits: ['Lead capture', 'Sales automation', 'Conversion tracking', 'A/B testing']
      },
      {
        title: 'Team Collaboration & Project Management',
        description: 'Team workspace with task management, collaboration tools, and project tracking',
        price: 'Included with all plans',
        duration: 'Instant setup',
        keywords: ['collaboration', 'team management', 'project management', 'tasks', 'teamwork', 'workspace'],
        category: 'Collaboration',
        confidence: 90,
        action: '/team',
        benefits: ['Task management', 'Team workspace', 'Project tracking', 'File sharing']
      },
      {
        title: 'Financial Management & Bookkeeping',
        description: 'Complete financial management with invoicing, expense tracking, and tax preparation',
        price: 'Starting at $29.99/user/month',
        duration: 'Setup in 1 day',
        keywords: ['financial management', 'bookkeeping', 'invoicing', 'accounting', 'expenses', 'tax preparation', 'billing'],
        category: 'Finance',
        confidence: 90,
        action: '/bookkeeping',
        benefits: ['Invoice management', 'Expense tracking', 'Tax preparation', 'Financial reports']
      },
      {
        title: 'Customer Support & Ticketing',
        description: 'Professional customer support system with ticket management and knowledge base',
        price: 'Included with Professional plans',
        duration: 'Setup in hours',
        keywords: ['customer support', 'help desk', 'ticketing', 'support tickets', 'customer service', 'knowledge base'],
        category: 'Support',
        confidence: 90,
        action: '/support',
        benefits: ['Ticket management', 'Knowledge base', 'Customer portal', 'Response tracking']
      }
    ];

    const securityServices = [
      {
        title: 'Cybersecurity Assessment & Planning',
        description: 'Comprehensive security evaluation and strategic planning for your organization',
        price: 'Starting at $5,000',
        duration: '2-3 weeks',
        keywords: ['security assessment', 'security audit', 'vulnerability assessment', 'security review', 'risk assessment', 'security evaluation'],
        category: 'Cybersecurity',
        confidence: 95,
        action: '/request-demo?service=cybersecurity',
        benefits: ['Identify vulnerabilities', 'Compliance roadmap', 'Security strategy']
      },
      {
        title: 'Ethical Hacking & Penetration Testing',
        description: 'Advanced threat simulation and vulnerability assessment with detailed reporting',
        price: 'Starting at $7,500',
        duration: '1-2 weeks',
        keywords: ['penetration test', 'pen test', 'ethical hacking', 'security testing', 'hack test', 'vulnerability test'],
        category: 'Cybersecurity',
        confidence: 95,
        action: '/request-demo?service=cybersecurity',
        benefits: ['Real attack simulation', 'Vulnerability discovery', 'Security validation']
      },
      {
        title: 'Compliance Consulting',
        description: 'Industry-specific regulatory compliance guidance (HIPAA, SOX, PCI-DSS, GDPR)',
        price: 'Starting at $7,500',
        duration: '3-6 weeks',
        keywords: ['compliance', 'regulatory', 'hipaa', 'gdpr', 'sox', 'pci-dss', 'audit', 'standards'],
        category: 'Cybersecurity',
        confidence: 95,
        action: '/request-demo?service=cybersecurity',
        benefits: ['Regulatory alignment', 'Audit preparation', 'Risk mitigation']
      },
      {
        title: 'Security Incident Response',
        description: '24/7 emergency cybersecurity incident management and forensics',
        price: 'Starting at $3,000',
        duration: 'Immediate',
        keywords: ['incident response', 'security breach', 'emergency', 'forensics', 'incident management', 'breach response'],
        category: 'Cybersecurity',
        confidence: 95,
        action: '/request-demo?service=cybersecurity',
        benefits: ['Rapid response', 'Damage containment', 'Forensic analysis']
      },
      {
        title: 'Managed Security Operations',
        description: 'Ongoing 24/7 security monitoring, threat detection, and response services',
        price: 'Starting at $8,000/month',
        duration: 'Ongoing',
        keywords: ['managed security', 'soc', 'security monitoring', '24/7 security', 'threat detection', 'security operations'],
        category: 'Cybersecurity',
        confidence: 95,
        action: '/request-demo?service=cybersecurity',
        benefits: ['24/7 monitoring', 'Threat detection', 'Incident response']
      }
    ];

    // RF Engineering keywords mapping
    const rfKeywords = {
      'rf network': {
        title: 'RF Network Implementation',
        description: 'Complete wireless infrastructure design and deployment',
        price: 'Starting at $10,000',
        duration: '4-8 weeks'
      },
      'spectrum analysis': {
        title: 'RF Spectrum Analysis',
        description: 'Comprehensive spectrum monitoring and optimization',
        price: 'Starting at $4,500',
        duration: '1-2 weeks'
      },
      'wireless': {
        title: 'Wireless Infrastructure Consulting',
        description: 'Expert wireless system design and optimization',
        price: 'Starting at $6,000',
        duration: '2-4 weeks'
      },
      'antenna': {
        title: 'Antenna System Design',
        description: 'Custom antenna placement and configuration',
        price: 'Starting at $3,500',
        duration: '1-3 weeks'
      }
    };

    // CRM & Business Solutions keywords mapping
    const crmKeywords = {
      'crm': {
        title: 'NODE CRM Professional',
        description: 'Complete customer relationship management with AI insights',
        price: '$59.99/month',
        duration: 'Subscription'
      },
      'contact management': {
        title: 'Contact & Lead Management',
        description: 'Organize and track all customer interactions',
        price: '$15.99/user/month',
        duration: 'Subscription'
      },
      'sales automation': {
        title: 'Sales Process Automation',
        description: 'Automated workflows and sales pipeline management',
        price: '$59.99/month',
        duration: 'Subscription'
      },
      'customer tracking': {
        title: 'Customer Analytics & Tracking',
        description: 'Advanced customer behavior analysis and insights',
        price: '$119.99/month',
        duration: 'Subscription'
      },
      'lead generation': {
        title: 'Lead Generation & Qualification',
        description: 'AI-powered lead scoring and qualification system',
        price: '$59.99/month',
        duration: 'Subscription'
      }
    };

    // Marketing & Communication keywords mapping
    const marketingKeywords = {
      'email marketing': {
        title: 'Email Marketing Automation',
        description: 'Professional email campaigns with advanced analytics',
        price: '$59.99/month',
        duration: 'Subscription'
      },
      'sms marketing': {
        title: 'SMS Marketing Campaigns',
        description: 'Bulk SMS campaigns with personalization',
        price: '$59.99/month',
        duration: 'Subscription'
      },
      'social media': {
        title: 'Social Media Management',
        description: 'Multi-platform social media automation and scheduling',
        price: '$59.99/month',
        duration: 'Subscription'
      },
      'marketing automation': {
        title: 'Marketing Workflow Automation',
        description: 'End-to-end marketing process automation',
        price: '$119.99/month',
        duration: 'Subscription'
      }
    };

    // Analytics & AI keywords mapping
    const analyticsKeywords = {
      'analytics': {
        title: 'Business Intelligence & Analytics',
        description: 'Comprehensive business data analysis and reporting',
        price: '$119.99/month',
        duration: 'Subscription'
      },
      'ai insights': {
        title: 'AI-Powered Business Insights',
        description: 'Machine learning-driven business recommendations',
        price: '$199.99/month',
        duration: 'Subscription'
      },
      'sentiment analysis': {
        title: 'Customer Sentiment Analysis',
        description: 'AI-powered emotional intelligence for customer communications',
        price: '$119.99/month',
        duration: 'Subscription'
      },
      'predictive analytics': {
        title: 'Predictive Business Analytics',
        description: 'Forecast trends and customer behavior patterns',
        price: '$199.99/month',
        duration: 'Subscription'
      }
    };

    // Team Collaboration keywords mapping
    const collaborationKeywords = {
      'team collaboration': {
        title: 'Team Collaboration Suite',
        description: 'Integrated team communication and project management',
        price: '$59.99/month',
        duration: 'Subscription'
      },
      'project management': {
        title: 'Project & Task Management',
        description: 'Complete project lifecycle management tools',
        price: '$59.99/month',
        duration: 'Subscription'
      },
      'video conferencing': {
        title: 'Video Conferencing Integration',
        description: 'Seamless video meetings with CRM integration',
        price: '$59.99/month',
        duration: 'Subscription'
      }
    };

    // Enhanced service matching with relevance scoring - All services combined
    const allServices = [...crmServices, ...securityServices];
    
    allServices.forEach(service => {
      const relevanceScore = calculateRelevanceScore(service.keywords, queryLower);
      if (relevanceScore > 25) { // Lower threshold for better matching
        services.push({
          title: service.title,
          category: service.category,
          description: service.description,
          confidence: Math.round(relevanceScore),
          price: service.price,
          duration: service.duration,
          action: service.action
        });
      }
    });

    // Add comprehensive business process matching
    const businessProcesses = [
      'customer management', 'sales process', 'marketing', 'lead generation', 
      'inventory tracking', 'financial management', 'team collaboration',
      'project management', 'analytics', 'reporting', 'automation'
    ];
    
    businessProcesses.forEach(process => {
      if (queryLower.includes(process)) {
        // Always recommend the core CRM as it covers most business processes
        if (!services.some(s => s.title.includes('NODE CRM'))) {
          services.push({
            title: 'NODE CRM - Complete Business Solution',
            category: 'CRM Platform',
            description: 'Comprehensive business management platform covering all your operational needs',
            confidence: 95,
            price: 'Starting at $15.99/user/month',
            duration: 'Ready in 24 hours',
            action: '/adaptive-signup'
          });
        }
      }
    });

    // Check for collaboration-related keywords
    Object.entries(collaborationKeywords).forEach(([keyword, service]) => {
      if (queryLower.includes(keyword)) {
        services.push({
          ...service,
          category: 'Team Collaboration',
          confidence: 90,
          action: '/adaptive-signup?plan=professional'
        });
      }
    });

    // Generic recommendations if no specific matches
    if (services.length === 0) {
      if (queryLower.includes('security') || queryLower.includes('cyber') || queryLower.includes('hack')) {
        services.push({
          title: 'Cybersecurity Assessment & Planning',
          category: 'Cybersecurity',
          description: 'Start with a comprehensive security evaluation',
          confidence: 80,
          price: 'Starting at $5,000',
          duration: '2-3 weeks',
          action: '/request-demo?service=cybersecurity'
        });
      }
      
      if (queryLower.includes('network') || queryLower.includes('wireless') || queryLower.includes('signal')) {
        services.push({
          title: 'RF Network Implementation',
          category: 'RF Engineering',
          description: 'Complete wireless infrastructure solution',
          confidence: 80,
          price: 'Starting at $10,000',
          duration: '4-8 weeks',
          action: '/request-demo?service=rf-engineering'
        });
      }

      if (queryLower.includes('customer') || queryLower.includes('sales') || queryLower.includes('business') || queryLower.includes('help')) {
        services.push({
          title: 'NODE CRM - Complete Business Platform',
          category: 'CRM Platform',
          description: 'Comprehensive business management with customer relations, sales tracking, inventory, and e-commerce',
          confidence: 85,
          price: 'Starting at $15.99/user/month',
          duration: 'Ready in 24 hours',
          action: '/adaptive-signup'
        });
      }

      if (queryLower.includes('marketing') || queryLower.includes('email') || queryLower.includes('campaign')) {
        services.push({
          title: 'Marketing Automation Suite',
          category: 'Marketing Automation',
          description: 'Comprehensive marketing workflow automation',
          confidence: 75,
          price: '$59.99/month',
          duration: 'Subscription',
          action: '/adaptive-signup?plan=professional'
        });
      }

      if (queryLower.includes('data') || queryLower.includes('report') || queryLower.includes('insights')) {
        services.push({
          title: 'Business Intelligence & Analytics',
          category: 'Analytics & AI',
          description: 'Advanced business analytics and AI insights',
          confidence: 75,
          price: '$119.99/month',
          duration: 'Subscription',
          action: '/adaptive-signup?plan=enterprise'
        });
      }
    }

    return services;
  };

  const generateBotResponse = (userMessage: string): Message => {
    const services = analyzeUserQuery(userMessage);
    const queryLower = userMessage.toLowerCase();

    let responseText = '';
    let suggestions: string[] = [];

    if (services.length > 0) {
      // Sort services by confidence score
      services.sort((a, b) => b.confidence - a.confidence);
      
      const topService = services[0];
      const isHighConfidence = topService.confidence > 80;
      
      if (isHighConfidence) {
        responseText = `Based on your needs, I highly recommend our ${topService.title}. This solution specifically addresses your requirements with ${topService.confidence}% accuracy match.`;
      } else {
        responseText = `I found ${services.length} relevant service${services.length > 1 ? 's' : ''} that might help you. Let me show you the best matches:`;
      }
      
      suggestions = [
        "Tell me more about implementation",
        "What's included in this service?",
        "Compare with alternatives",
        "Schedule consultation",
        "Get detailed pricing"
      ];
    } else if (queryLower.includes('hello') || queryLower.includes('hi')) {
      responseText = "Hello! I'm Cloe, your intelligent AI assistant. ARGILETTE offers comprehensive business solutions starting with our powerful CRM platform, plus cybersecurity, RF engineering, marketing automation, and analytics. What business area would you like to improve?";
      suggestions = [
        "CRM & customer management",
        "Sales process automation",
        "Marketing campaign tools",
        "Cybersecurity protection",
        "Wireless network solutions",
        "Business data analytics",
        "I'm not sure what I need"
      ];
    } else if (queryLower.includes('show') && queryLower.includes('all') || queryLower.includes('complete') || queryLower.includes('available services')) {
      responseText = "Here's our complete NODE CRM platform suite:\n\n🎯 **Core CRM**: Customer management, deals pipeline, lead tracking\n🛒 **E-commerce**: Store builder, product catalog, payment processing\n📧 **Marketing**: Email campaigns, automation, funnel builder\n📊 **Analytics**: Business intelligence, performance tracking\n💰 **Finance**: Bookkeeping, invoicing, expense tracking\n📦 **Inventory**: Stock management, supplier relations\n👥 **Team**: Collaboration, project management\n🤖 **AI**: Cloe assistant, automation, insights\n🔒 **Security**: Cybersecurity assessments, compliance\n\nWhich area interests you most?";
      suggestions = [
        "Start with core CRM",
        "Build an online store", 
        "Set up email marketing",
        "Get pricing details",
        "Schedule a demo"
      ];
    } else if (queryLower.includes('not sure') || queryLower.includes('don\'t know')) {
      responseText = "No problem! NODE CRM is a complete business platform that grows with you. We start with customer management, then add e-commerce, marketing automation, analytics, and more. Most businesses begin with our core CRM to organize customers and sales, then expand from there. What's your main business challenge?";
      suggestions = [
        "Managing customer relationships",
        "Increasing sales revenue",
        "Building an online presence",
        "Automating business processes",
        "Better business insights",
        "Get actionable business insights",
        "Improve team collaboration"
      ];
    } else if (queryLower.includes('price') || queryLower.includes('cost')) {
      responseText = "Our pricing varies by service type. Professional services (cybersecurity/RF) start at $5,000-$10,000. Software subscriptions range from $15.99-$79.99/user/month. What type of solution interests you?";
      suggestions = [
        "Cybersecurity pricing",
        "CRM software pricing",
        "Marketing automation costs",
        "Custom enterprise quote",
        "Professional services rates"
      ];
    } else {
      responseText = "I understand you're looking for business solutions! NODE CRM is our comprehensive platform that handles everything from customer management and sales tracking to e-commerce, marketing automation, inventory management, and team collaboration. Most businesses start with our core CRM features and then expand to other modules as they grow. What's your main business priority right now?";
      suggestions = [
        "Start with CRM basics",
        "Complete business solution",
        "E-commerce integration",
        "Marketing automation",
        "Get full feature overview",
        "See pricing options",
        "Schedule demo"
      ];
    }

    return {
      id: Date.now().toString(),
      text: responseText,
      sender: 'bot',
      timestamp: new Date(),
      suggestions,
      services
    };
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse = generateBotResponse(messageText);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleServiceAction = (action: string) => {
    window.location.href = action;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="chatbot-container"
      style={{ 
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 999999,
        isolation: 'isolate',
        pointerEvents: 'auto',
        transform: 'translateZ(0)', // Force hardware acceleration and new stacking context
        willChange: 'transform'
      }}
    >
      <div 
        className={`w-96 ${isMinimized ? 'h-16' : 'h-[600px]'} bg-white border-2 border-purple-200 transition-all duration-300 overflow-hidden rounded-lg`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          zIndex: 1,
          isolation: 'isolate'
        }}
      >
        <div className="pb-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-none tracking-tight">Cloe - AI Assistant</div>
                <p className="text-xs text-purple-100">Service matching and support</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 p-1 h-6 w-6"
                onClick={onMinimize}
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 p-1 h-6 w-6"
                onClick={onClose}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {!isMinimized && (
          <div className="p-0 flex flex-col h-[calc(600px-80px)]">
            {/* Messages Area */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${message.sender === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-100'} rounded-lg p-3`}>
                      <div className="flex items-start gap-2">
                        {message.sender === 'bot' && (
                          <Bot className="h-4 w-4 mt-0.5 text-purple-600" />
                        )}
                        {message.sender === 'user' && (
                          <User className="h-4 w-4 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm">{message.text}</p>
                          
                          {/* Service Recommendations */}
                          {message.services && message.services.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {message.services.map((service, index) => (
                                <div key={index} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-sm text-gray-900 mb-1">{service.title}</h4>
                                      <Badge variant="secondary" className="text-xs mb-2">
                                        {service.confidence}% match • {service.category}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <p className="text-xs text-gray-600 mb-3 leading-relaxed">{service.description}</p>
                                  
                                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                                    <div className="flex items-center gap-1 text-green-600">
                                      <DollarSign className="h-3 w-3" />
                                      <span className="font-medium">{service.price}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-blue-600">
                                      <Clock className="h-3 w-3" />
                                      <span className="font-medium">{service.duration}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-xs"
                                      onClick={() => handleServiceAction(service.action)}
                                    >
                                      Get Started
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs"
                                      onClick={() => handleSendMessage(`Tell me more about ${service.title}`)}
                                    >
                                      Details
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Quick Suggestions */}
                          {message.suggestions && message.suggestions.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {message.suggestions.map((suggestion, index) => (
                                <Button
                                  key={index}
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-6 px-2 bg-white hover:bg-purple-50"
                                  onClick={() => handleSendMessage(suggestion)}
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-purple-600" />
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex gap-2">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your needs..."
                  className="flex-1"
                />
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceMatchingChatbot;