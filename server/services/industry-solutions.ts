import OpenAI from "openai";
import { aiIntegrationService } from "./ai-integration-service";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Industry Solutions interfaces
export interface IndustrySolution {
  id: string;
  industry: 'healthcare' | 'realestate' | 'manufacturing' | 'financial' | 'retail';
  organizationId: string;
  features: string[];
  complianceFrameworks: string[];
  customFields: { name: string; type: string; required: boolean }[];
  workflows: string[];
  integrations: string[];
  setupDate: Date;
  status: 'active' | 'pending' | 'inactive';
}

export interface HealthcareSolution extends IndustrySolution {
  hipaaCompliance: boolean;
  patientJourneyMapping: boolean;
  clinicalWorkflows: string[];
  ehrIntegrations: string[];
  patientCommunication: {
    templates: string[];
    channels: string[];
    complianceCheck: boolean;
  };
}

export interface RealEstateSolution extends IndustrySolution {
  mlsIntegration: boolean;
  propertyManagement: boolean;
  leadNurturing: {
    buyerJourney: string[];
    sellerJourney: string[];
    investorJourney: string[];
  };
  documentManagement: string[];
  marketAnalytics: boolean;
}

export interface ManufacturingSolution extends IndustrySolution {
  b2bSalesProcess: boolean;
  supplierManagement: boolean;
  inventoryIntegration: boolean;
  qualityCompliance: string[];
  salesChannels: {
    direct: boolean;
    distributors: boolean;
    partners: boolean;
  };
}

export interface FinancialSolution extends IndustrySolution {
  regulatoryCompliance: string[];
  riskAssessment: boolean;
  clientOnboarding: {
    kycProcess: boolean;
    documentVerification: boolean;
    complianceChecks: string[];
  };
  portfolioManagement: boolean;
  reportingFrameworks: string[];
}

export interface RetailSolution extends IndustrySolution {
  omnichannel: {
    online: boolean;
    inStore: boolean;
    mobile: boolean;
    social: boolean;
  };
  inventorySync: boolean;
  customerLoyalty: boolean;
  seasonalCampaigns: boolean;
  priceOptimization: boolean;
}

export interface IndustryMetrics {
  industry: string;
  organizationId: string;
  performanceKPIs: {
    conversionRate: number;
    customerSatisfaction: number;
    averageDealSize: number;
    salesCycleLength: number;
    complianceScore: number;
  };
  benchmarks: {
    industryAverage: number;
    topPerformer: number;
    yourPosition: number;
  };
  recommendations: string[];
  trends: string[];
}

export class IndustrySolutions {
  private static instance: IndustrySolutions;
  private solutions: Map<string, IndustrySolution> = new Map();
  private metrics: Map<string, IndustryMetrics> = new Map();

  static getInstance(): IndustrySolutions {
    if (!IndustrySolutions.instance) {
      IndustrySolutions.instance = new IndustrySolutions();
    }
    return IndustrySolutions.instance;
  }

  // Healthcare industry solution setup
  async setupHealthcareSolution(organizationId: string, userId: string): Promise<HealthcareSolution> {
    try {
      const canUseAI = await aiIntegrationService.canMakeRequest(userId, 'openai', 'professional');
      if (!canUseAI.canMake) {
        throw new Error('AI usage limit reached. Please upgrade or add custom API key.');
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "Configure a healthcare CRM solution with HIPAA compliance, patient journey mapping, and clinical workflows. Respond in JSON format with healthcare-specific features, compliance frameworks, and recommended integrations."
          },
          {
            role: "user",
            content: JSON.stringify({ organizationId, industry: 'healthcare' })
          }
        ],
        response_format: { type: "json_object" }
      });

      await aiIntegrationService.trackUsage(userId, 'openai');

      const config = JSON.parse(response.choices[0].message.content || '{}');
      
      const solution: HealthcareSolution = {
        id: `healthcare_${Date.now()}`,
        industry: 'healthcare',
        organizationId,
        features: config.features || [
          'Patient Journey Mapping',
          'HIPAA Compliance Framework',
          'Clinical Workflow Automation',
          'Appointment Scheduling',
          'Insurance Verification',
          'Treatment Plan Management',
          'Provider Communication',
          'Medical Record Integration'
        ],
        complianceFrameworks: config.complianceFrameworks || ['HIPAA', 'HITECH', 'FDA 21 CFR Part 11'],
        customFields: config.customFields || [
          { name: 'Patient ID', type: 'text', required: true },
          { name: 'Medical Record Number', type: 'text', required: true },
          { name: 'Insurance Provider', type: 'select', required: false },
          { name: 'Primary Care Physician', type: 'text', required: false },
          { name: 'Emergency Contact', type: 'text', required: true }
        ],
        workflows: config.workflows || [
          'Patient Onboarding',
          'Appointment Confirmation',
          'Treatment Follow-up',
          'Insurance Authorization',
          'Prescription Management'
        ],
        integrations: config.integrations || ['Epic', 'Cerner', 'AllScripts', 'eClinicalWorks'],
        setupDate: new Date(),
        status: 'active',
        hipaaCompliance: true,
        patientJourneyMapping: true,
        clinicalWorkflows: config.clinicalWorkflows || [
          'Pre-visit Planning',
          'Visit Documentation',
          'Post-visit Care',
          'Care Coordination',
          'Quality Reporting'
        ],
        ehrIntegrations: config.ehrIntegrations || ['HL7 FHIR', 'Epic MyChart', 'Cerner PowerChart'],
        patientCommunication: {
          templates: config.patientCommunication?.templates || [
            'Appointment Reminder',
            'Test Results',
            'Treatment Instructions',
            'Prescription Refill',
            'Insurance Updates'
          ],
          channels: config.patientCommunication?.channels || ['Email', 'SMS', 'Patient Portal', 'Phone'],
          complianceCheck: true
        }
      };

      this.solutions.set(solution.id, solution);
      return solution;
    } catch (error) {
      console.error('Healthcare solution setup failed:', error);
      return this.getDefaultHealthcareSolution(organizationId);
    }
  }

  // Real Estate industry solution setup
  async setupRealEstateSolution(organizationId: string, userId: string): Promise<RealEstateSolution> {
    try {
      const canUseAI = await aiIntegrationService.canMakeRequest(userId, 'openai', 'professional');
      if (!canUseAI.canMake) {
        throw new Error('AI usage limit reached');
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Configure a real estate CRM solution with MLS integration, property management, and buyer/seller journey mapping. Respond in JSON format with real estate-specific features and workflows."
          },
          {
            role: "user",
            content: JSON.stringify({ organizationId, industry: 'realestate' })
          }
        ],
        response_format: { type: "json_object" }
      });

      await aiIntegrationService.trackUsage(userId, 'openai');

      const config = JSON.parse(response.choices[0].message.content || '{}');
      
      const solution: RealEstateSolution = {
        id: `realestate_${Date.now()}`,
        industry: 'realestate',
        organizationId,
        features: config.features || [
          'MLS Integration',
          'Property Management',
          'Lead Nurturing Journeys',
          'Document Management',
          'Market Analytics',
          'Commission Tracking',
          'Client Communication',
          'Transaction Management'
        ],
        complianceFrameworks: config.complianceFrameworks || ['RESPA', 'Fair Housing Act', 'State License Requirements'],
        customFields: config.customFields || [
          { name: 'Property Type', type: 'select', required: true },
          { name: 'Price Range', type: 'number', required: true },
          { name: 'Location Preference', type: 'text', required: false },
          { name: 'Financing Pre-approval', type: 'boolean', required: false },
          { name: 'Move Timeline', type: 'select', required: false }
        ],
        workflows: config.workflows || [
          'Buyer Onboarding',
          'Property Search',
          'Showing Coordination',
          'Offer Management',
          'Closing Process'
        ],
        integrations: config.integrations || ['MLS', 'Zillow', 'DocuSign', 'Title Companies'],
        setupDate: new Date(),
        status: 'active',
        mlsIntegration: true,
        propertyManagement: true,
        leadNurturing: {
          buyerJourney: config.leadNurturing?.buyerJourney || [
            'Initial Inquiry',
            'Needs Assessment',
            'Property Search',
            'Property Showing',
            'Offer Preparation',
            'Negotiation',
            'Closing Process'
          ],
          sellerJourney: config.leadNurturing?.sellerJourney || [
            'Market Analysis',
            'Pricing Strategy',
            'Property Preparation',
            'Marketing Launch',
            'Showing Management',
            'Offer Review',
            'Closing Coordination'
          ],
          investorJourney: config.leadNurturing?.investorJourney || [
            'Investment Goals',
            'Market Research',
            'Property Analysis',
            'Deal Evaluation',
            'Financing Options',
            'Portfolio Management'
          ]
        },
        documentManagement: config.documentManagement || [
          'Purchase Agreements',
          'Disclosure Forms',
          'Inspection Reports',
          'Loan Documents',
          'Closing Documents'
        ],
        marketAnalytics: true
      };

      this.solutions.set(solution.id, solution);
      return solution;
    } catch (error) {
      console.error('Real estate solution setup failed:', error);
      return this.getDefaultRealEstateSolution(organizationId);
    }
  }

  // Manufacturing industry solution setup
  async setupManufacturingSolution(organizationId: string, userId: string): Promise<ManufacturingSolution> {
    const solution: ManufacturingSolution = {
      id: `manufacturing_${Date.now()}`,
      industry: 'manufacturing',
      organizationId,
      features: [
        'B2B Sales Process',
        'Supplier Management',
        'Inventory Integration',
        'Quality Compliance',
        'Multi-Channel Sales',
        'Order Management',
        'Supply Chain Visibility',
        'Production Planning'
      ],
      complianceFrameworks: ['ISO 9001', 'ISO 14001', 'OSHA', 'FDA (if applicable)'],
      customFields: [
        { name: 'Product Specifications', type: 'text', required: true },
        { name: 'Minimum Order Quantity', type: 'number', required: true },
        { name: 'Lead Time', type: 'number', required: true },
        { name: 'Quality Certifications', type: 'text', required: false },
        { name: 'Supplier Rating', type: 'select', required: false }
      ],
      workflows: [
        'RFQ Processing',
        'Quote Generation',
        'Order Fulfillment',
        'Quality Control',
        'Shipping Coordination'
      ],
      integrations: ['ERP Systems', 'Inventory Management', 'Quality Management', 'Shipping Partners'],
      setupDate: new Date(),
      status: 'active',
      b2bSalesProcess: true,
      supplierManagement: true,
      inventoryIntegration: true,
      qualityCompliance: ['ISO Standards', 'Industry Specific', 'Customer Requirements'],
      salesChannels: {
        direct: true,
        distributors: true,
        partners: true
      }
    };

    this.solutions.set(solution.id, solution);
    return solution;
  }

  // Financial Services industry solution setup
  async setupFinancialServicesSolution(organizationId: string, userId: string): Promise<FinancialSolution> {
    const solution: FinancialSolution = {
      id: `financial_${Date.now()}`,
      industry: 'financial',
      organizationId,
      features: [
        'Regulatory Compliance',
        'Risk Assessment',
        'Client Onboarding',
        'Portfolio Management',
        'Reporting Frameworks',
        'KYC/AML Processes',
        'Document Management',
        'Audit Trail'
      ],
      complianceFrameworks: ['SOX', 'GDPR', 'PCI DSS', 'Basel III', 'Dodd-Frank'],
      customFields: [
        { name: 'Account Type', type: 'select', required: true },
        { name: 'Risk Profile', type: 'select', required: true },
        { name: 'Investment Objectives', type: 'text', required: true },
        { name: 'Net Worth', type: 'number', required: false },
        { name: 'Liquidity Needs', type: 'select', required: false }
      ],
      workflows: [
        'Client Onboarding',
        'Risk Assessment',
        'Portfolio Review',
        'Compliance Monitoring',
        'Reporting Generation'
      ],
      integrations: ['Trading Platforms', 'Custodial Systems', 'Risk Management', 'Regulatory Reporting'],
      setupDate: new Date(),
      status: 'active',
      regulatoryCompliance: ['KYC', 'AML', 'GDPR', 'SOX', 'MiFID II'],
      riskAssessment: true,
      clientOnboarding: {
        kycProcess: true,
        documentVerification: true,
        complianceChecks: ['Identity Verification', 'Address Verification', 'Source of Funds', 'Sanctions Screening']
      },
      portfolioManagement: true,
      reportingFrameworks: ['Regulatory Reports', 'Performance Reports', 'Risk Reports', 'Compliance Reports']
    };

    this.solutions.set(solution.id, solution);
    return solution;
  }

  // Retail industry solution setup
  async setupRetailSolution(organizationId: string, userId: string): Promise<RetailSolution> {
    const solution: RetailSolution = {
      id: `retail_${Date.now()}`,
      industry: 'retail',
      organizationId,
      features: [
        'Omnichannel Experience',
        'Inventory Synchronization',
        'Customer Loyalty Program',
        'Seasonal Campaigns',
        'Price Optimization',
        'Product Catalog Management',
        'Customer Analytics',
        'Order Management'
      ],
      complianceFrameworks: ['PCI DSS', 'GDPR', 'CCPA', 'Return Policy Compliance'],
      customFields: [
        { name: 'Purchase History', type: 'text', required: false },
        { name: 'Preferred Brands', type: 'text', required: false },
        { name: 'Size Preferences', type: 'text', required: false },
        { name: 'Loyalty Points', type: 'number', required: false },
        { name: 'Communication Preferences', type: 'select', required: false }
      ],
      workflows: [
        'Customer Acquisition',
        'Order Processing',
        'Customer Service',
        'Loyalty Management',
        'Return Processing'
      ],
      integrations: ['E-commerce Platform', 'POS Systems', 'Inventory Management', 'Payment Processing'],
      setupDate: new Date(),
      status: 'active',
      omnichannel: {
        online: true,
        inStore: true,
        mobile: true,
        social: true
      },
      inventorySync: true,
      customerLoyalty: true,
      seasonalCampaigns: true,
      priceOptimization: true
    };

    this.solutions.set(solution.id, solution);
    return solution;
  }

  // Get industry-specific metrics
  async getIndustryMetrics(industry: string, organizationId: string): Promise<IndustryMetrics> {
    const key = `${industry}_${organizationId}`;
    
    if (this.metrics.has(key)) {
      return this.metrics.get(key)!;
    }

    // Generate industry-specific metrics
    const metrics: IndustryMetrics = {
      industry,
      organizationId,
      performanceKPIs: this.getIndustryKPIs(industry),
      benchmarks: this.getIndustryBenchmarks(industry),
      recommendations: this.getIndustryRecommendations(industry),
      trends: this.getIndustryTrends(industry)
    };

    this.metrics.set(key, metrics);
    return metrics;
  }

  // Helper methods for default solutions
  private getDefaultHealthcareSolution(organizationId: string): HealthcareSolution {
    return {
      id: `healthcare_${Date.now()}`,
      industry: 'healthcare',
      organizationId,
      features: ['HIPAA Compliance', 'Patient Management', 'Appointment Scheduling'],
      complianceFrameworks: ['HIPAA', 'HITECH'],
      customFields: [{ name: 'Patient ID', type: 'text', required: true }],
      workflows: ['Patient Onboarding', 'Appointment Management'],
      integrations: ['EHR Systems'],
      setupDate: new Date(),
      status: 'active',
      hipaaCompliance: true,
      patientJourneyMapping: true,
      clinicalWorkflows: ['Pre-visit', 'Visit', 'Post-visit'],
      ehrIntegrations: ['HL7 FHIR'],
      patientCommunication: {
        templates: ['Appointment Reminder'],
        channels: ['Email', 'SMS'],
        complianceCheck: true
      }
    };
  }

  private getDefaultRealEstateSolution(organizationId: string): RealEstateSolution {
    return {
      id: `realestate_${Date.now()}`,
      industry: 'realestate',
      organizationId,
      features: ['MLS Integration', 'Lead Management', 'Property Tracking'],
      complianceFrameworks: ['RESPA', 'Fair Housing Act'],
      customFields: [{ name: 'Property Type', type: 'select', required: true }],
      workflows: ['Lead Nurturing', 'Property Management'],
      integrations: ['MLS', 'DocuSign'],
      setupDate: new Date(),
      status: 'active',
      mlsIntegration: true,
      propertyManagement: true,
      leadNurturing: {
        buyerJourney: ['Inquiry', 'Search', 'Showing', 'Offer'],
        sellerJourney: ['Listing', 'Marketing', 'Showing', 'Sale'],
        investorJourney: ['Analysis', 'Evaluation', 'Investment']
      },
      documentManagement: ['Contracts', 'Disclosures'],
      marketAnalytics: true
    };
  }

  private getIndustryKPIs(industry: string) {
    const kpis: Record<string, any> = {
      healthcare: {
        conversionRate: 0.18,
        customerSatisfaction: 4.2,
        averageDealSize: 15000,
        salesCycleLength: 45,
        complianceScore: 98
      },
      realestate: {
        conversionRate: 0.03,
        customerSatisfaction: 4.5,
        averageDealSize: 285000,
        salesCycleLength: 60,
        complianceScore: 95
      },
      manufacturing: {
        conversionRate: 0.25,
        customerSatisfaction: 4.1,
        averageDealSize: 125000,
        salesCycleLength: 90,
        complianceScore: 92
      },
      financial: {
        conversionRate: 0.15,
        customerSatisfaction: 4.0,
        averageDealSize: 75000,
        salesCycleLength: 120,
        complianceScore: 99
      },
      retail: {
        conversionRate: 0.35,
        customerSatisfaction: 4.3,
        averageDealSize: 125,
        salesCycleLength: 1,
        complianceScore: 88
      }
    };

    return kpis[industry] || kpis.manufacturing;
  }

  private getIndustryBenchmarks(industry: string) {
    return {
      industryAverage: 75,
      topPerformer: 92,
      yourPosition: 82
    };
  }

  private getIndustryRecommendations(industry: string): string[] {
    const recommendations: Record<string, string[]> = {
      healthcare: [
        'Implement patient journey automation',
        'Enhance HIPAA compliance monitoring',
        'Optimize appointment scheduling workflows'
      ],
      realestate: [
        'Leverage MLS data for better lead scoring',
        'Automate property matching algorithms',
        'Implement virtual showing capabilities'
      ],
      manufacturing: [
        'Integrate supply chain visibility',
        'Automate quote generation process',
        'Enhance quality compliance tracking'
      ],
      financial: [
        'Strengthen KYC/AML processes',
        'Implement real-time risk monitoring',
        'Enhance regulatory reporting automation'
      ],
      retail: [
        'Optimize omnichannel customer experience',
        'Implement dynamic pricing strategies',
        'Enhance loyalty program engagement'
      ]
    };

    return recommendations[industry] || recommendations.manufacturing;
  }

  private getIndustryTrends(industry: string): string[] {
    const trends: Record<string, string[]> = {
      healthcare: [
        'Telemedicine adoption increasing',
        'AI-driven diagnostic support',
        'Patient experience focus'
      ],
      realestate: [
        'Virtual property tours trending',
        'AI-powered property valuation',
        'Sustainable building preferences'
      ],
      manufacturing: [
        'Industry 4.0 transformation',
        'Sustainable manufacturing practices',
        'Digital supply chain integration'
      ],
      financial: [
        'Digital banking acceleration',
        'Robo-advisor adoption',
        'Regulatory technology focus'
      ],
      retail: [
        'Social commerce growth',
        'Sustainability consciousness',
        'Personalization at scale'
      ]
    };

    return trends[industry] || trends.manufacturing;
  }

  // Get all solutions
  getSolutions(): IndustrySolution[] {
    return Array.from(this.solutions.values());
  }

  // Get solution by industry and organization
  getSolutionByOrganization(industry: string, organizationId: string): IndustrySolution | undefined {
    return Array.from(this.solutions.values()).find(
      s => s.industry === industry && s.organizationId === organizationId
    );
  }
}

export const industrySolutions = IndustrySolutions.getInstance();