// Enhanced service data with comprehensive keyword mapping and context
export interface EnhancedService {
  title: string;
  description: string;
  price: string;
  duration: string;
  keywords: string[];
  category: string;
  confidence: number;
  action: string;
  benefits: string[];
  targetIndustries?: string[];
  technicalRequirements?: string[];
  deliverables?: string[];
}

export const rfServices: EnhancedService[] = [
  {
    title: 'RF Network Implementation',
    description: 'Complete wireless infrastructure design, deployment, and optimization for enterprise environments',
    price: 'Starting at $10,000',
    duration: '4-8 weeks',
    keywords: ['rf network', 'wireless network', 'rf implementation', 'wireless infrastructure', 'network design', 'rf deployment'],
    category: 'RF Engineering',
    confidence: 95,
    action: '/request-demo?service=rf-engineering',
    benefits: ['Optimized coverage', 'Reduced interference', 'Scalable architecture'],
    targetIndustries: ['Manufacturing', 'Healthcare', 'Logistics', 'Education'],
    technicalRequirements: ['Site survey', 'Spectrum analysis', 'Equipment installation'],
    deliverables: ['Network design document', 'Installation plan', 'Performance report']
  },
  {
    title: 'RF Spectrum Analysis',
    description: 'Comprehensive spectrum monitoring, interference detection, and optimization services',
    price: 'Starting at $4,500',
    duration: '1-2 weeks',
    keywords: ['spectrum analysis', 'rf analysis', 'interference detection', 'frequency analysis', 'signal analysis', 'spectrum monitoring'],
    category: 'RF Engineering',
    confidence: 95,
    action: '/request-demo?service=rf-engineering',
    benefits: ['Interference identification', 'Optimal frequency selection', 'Compliance verification'],
    targetIndustries: ['Telecommunications', 'Broadcasting', 'Aviation', 'Defense'],
    technicalRequirements: ['Spectrum analyzer', 'Field measurements', 'Data analysis'],
    deliverables: ['Spectrum report', 'Interference analysis', 'Recommendations']
  }
];

export const crmServices: EnhancedService[] = [
  {
    title: 'NODE CRM Professional',
    description: 'Complete customer relationship management with AI-powered insights and automation',
    price: '$59.99/month',
    duration: 'Subscription',
    keywords: ['crm', 'customer management', 'contact management', 'sales management', 'customer database', 'client tracking'],
    category: 'CRM Solutions',
    confidence: 90,
    action: '/adaptive-signup?plan=professional',
    benefits: ['Centralized customer data', 'Sales pipeline management', 'AI-powered insights'],
    targetIndustries: ['All industries', 'Professional services', 'Sales organizations'],
    technicalRequirements: ['Web browser', 'Internet connection', 'Data migration support'],
    deliverables: ['Configured CRM system', 'Training materials', 'Support documentation']
  },
  {
    title: 'Contact & Lead Management',
    description: 'Organize, track, and nurture all customer interactions and sales opportunities',
    price: '$17.99/month',
    duration: 'Subscription',
    keywords: ['contact management', 'lead management', 'lead tracking', 'prospect management', 'customer tracking', 'lead nurturing'],
    category: 'CRM Solutions',
    confidence: 90,
    action: '/adaptive-signup?plan=starter',
    benefits: ['Organized contact database', 'Lead scoring', 'Automated follow-ups'],
    targetIndustries: ['Small business', 'Startups', 'Sales teams'],
    technicalRequirements: ['Basic computer skills', 'Email integration'],
    deliverables: ['Contact database setup', 'Lead scoring system', 'Training session']
  }
];

export const marketingServices: EnhancedService[] = [
  {
    title: 'Email Marketing Automation',
    description: 'Professional email campaigns with advanced analytics and automation workflows',
    price: '$59.99/month',
    duration: 'Subscription',
    keywords: ['email marketing', 'email automation', 'email campaigns', 'newsletter', 'email blast', 'marketing emails'],
    category: 'Marketing Automation',
    confidence: 90,
    action: '/adaptive-signup?plan=professional',
    benefits: ['Automated campaigns', 'Advanced analytics', 'A/B testing'],
    targetIndustries: ['E-commerce', 'SaaS', 'Professional services', 'Non-profit'],
    technicalRequirements: ['Email list', 'Brand assets', 'Content strategy'],
    deliverables: ['Campaign templates', 'Automation workflows', 'Performance reports']
  }
];

export const analyticsServices: EnhancedService[] = [
  {
    title: 'Business Intelligence & Analytics',
    description: 'Comprehensive business data analysis, reporting, and predictive insights',
    price: '$119.99/month',
    duration: 'Subscription',
    keywords: ['analytics', 'business intelligence', 'data analysis', 'reporting', 'dashboards', 'business insights', 'data visualization'],
    category: 'Analytics & AI',
    confidence: 90,
    action: '/adaptive-signup?plan=enterprise',
    benefits: ['Real-time dashboards', 'Predictive analytics', 'Custom reports'],
    targetIndustries: ['Enterprise', 'Data-driven organizations', 'Management consulting'],
    technicalRequirements: ['Data sources', 'API access', 'Business requirements'],
    deliverables: ['Custom dashboards', 'Automated reports', 'Training materials']
  }
];

export const collaborationServices: EnhancedService[] = [
  {
    title: 'Team Collaboration Suite',
    description: 'Integrated team communication, project management, and collaboration tools',
    price: '$59.99/month',
    duration: 'Subscription',
    keywords: ['team collaboration', 'project management', 'team communication', 'collaboration tools', 'teamwork', 'project tracking'],
    category: 'Team Collaboration',
    confidence: 90,
    action: '/adaptive-signup?plan=professional',
    benefits: ['Unified communication', 'Project tracking', 'Document sharing'],
    targetIndustries: ['Remote teams', 'Agencies', 'Consulting firms', 'Tech companies'],
    technicalRequirements: ['Team members', 'Internet access', 'Project requirements'],
    deliverables: ['Collaboration workspace', 'Training sessions', 'Best practices guide']
  }
];