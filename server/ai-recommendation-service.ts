import { storage } from './storage';

export interface UserProfile {
  id: string;
  industry?: string;
  businessSize?: string;
  goals?: string[];
  previousTemplates?: string[];
  behaviorData?: {
    templatesViewed: string[];
    templatesUsed: string[];
    lastActiveDate: Date;
    conversionRates: Record<string, number>;
    preferredComplexity: 'Simple' | 'Moderate' | 'Advanced';
  };
}

export interface RecommendationContext {
  userProfile: UserProfile;
  industryTrends: Record<string, number>;
  templatePerformance: Record<string, {
    conversionRate: number;
    usageCount: number;
    avgSetupTime: number;
    industryFit: Record<string, number>;
  }>;
}

export class AIRecommendationService {
  private static instance: AIRecommendationService;
  
  static getInstance(): AIRecommendationService {
    if (!AIRecommendationService.instance) {
      AIRecommendationService.instance = new AIRecommendationService();
    }
    return AIRecommendationService.instance;
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      // Get user data from database
      const user = await storage.getUserWithPermissions(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Analyze user behavior from CRM data
      const leads = await storage.getLeads();
      const deals = await storage.getDeals();
      const contacts = await storage.getContacts();

      // Infer industry from company data
      const industry = this.inferIndustry(contacts, deals);
      
      // Determine business size from lead volume and deal values
      const businessSize = this.inferBusinessSize(leads, deals);
      
      // Extract goals from recent activity patterns
      const goals = this.inferGoals(leads, deals);

      // Get template usage history (would be from a separate tracking table in real app)
      const previousTemplates = this.getTemplateUsageHistory(userId);

      return {
        id: userId,
        industry,
        businessSize,
        goals,
        previousTemplates,
        behaviorData: {
          templatesViewed: [],
          templatesUsed: previousTemplates,
          lastActiveDate: new Date(),
          conversionRates: {},
          preferredComplexity: 'Simple'
        }
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      // Return default profile
      return {
        id: userId,
        industry: 'Technology',
        businessSize: 'SMB',
        goals: ['lead-generation'],
        previousTemplates: []
      };
    }
  }

  private inferIndustry(contacts: any[], deals: any[]): string {
    // Analyze contact domains and deal descriptions to infer industry
    const industryKeywords = {
      'Technology': ['tech', 'software', 'saas', 'app', 'digital', 'cloud', 'ai'],
      'Healthcare': ['health', 'medical', 'clinic', 'hospital', 'patient', 'care'],
      'Finance': ['finance', 'bank', 'invest', 'loan', 'credit', 'insurance'],
      'Education': ['education', 'school', 'university', 'learn', 'training'],
      'Retail': ['retail', 'store', 'shop', 'ecommerce', 'product', 'sales'],
      'Consulting': ['consulting', 'advisory', 'strategy', 'management', 'expert'],
      'Manufacturing': ['manufacturing', 'production', 'factory', 'industrial']
    };

    const scores: Record<string, number> = {};
    
    // Analyze contact company names and deal descriptions
    [...contacts, ...deals].forEach(item => {
      const text = `${item.company || ''} ${item.description || ''} ${item.notes || ''}`.toLowerCase();
      
      Object.entries(industryKeywords).forEach(([industry, keywords]) => {
        keywords.forEach(keyword => {
          if (text.includes(keyword)) {
            scores[industry] = (scores[industry] || 0) + 1;
          }
        });
      });
    });

    // Return industry with highest score, or default to Technology
    return Object.entries(scores).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Technology';
  }

  private inferBusinessSize(leads: any[], deals: any[]): string {
    const leadCount = leads.length;
    const avgDealValue = deals.length > 0 
      ? deals.reduce((sum, deal) => sum + (deal.value || 0), 0) / deals.length 
      : 0;

    if (leadCount < 50 && avgDealValue < 10000) return 'Small';
    if (leadCount < 200 && avgDealValue < 50000) return 'SMB';
    if (leadCount < 1000 && avgDealValue < 100000) return 'Mid-Market';
    return 'Enterprise';
  }

  private inferGoals(leads: any[], deals: any[]): string[] {
    const goals = [];
    
    // Infer goals based on CRM activity patterns
    if (leads.length > deals.length * 3) {
      goals.push('lead-generation');
    }
    
    if (deals.some(deal => deal.stage === 'proposal' || deal.stage === 'negotiation')) {
      goals.push('sales-conversion');
    }
    
    // Default goals if none inferred
    if (goals.length === 0) {
      goals.push('lead-generation', 'brand-awareness');
    }
    
    return goals;
  }

  private getTemplateUsageHistory(userId: string): string[] {
    // In a real app, this would query a template_usage table
    // For now, return empty array
    return [];
  }

  async getTemplateRecommendations(userId: string): Promise<{
    recommendations: any[];
    userProfile: UserProfile;
    insights: {
      primaryFocus: string;
      conversionPotential: string;
      optimizationTips: string[];
    };
  }> {
    const userProfile = await this.getUserProfile(userId);
    
    // Get industry-specific template performance data
    const templatePerformance = this.getTemplatePerformanceData();
    
    // Generate AI-powered recommendations
    const recommendations = this.generateSmartRecommendations(userProfile, templatePerformance);
    
    // Generate insights
    const insights = this.generateInsights(userProfile, recommendations);

    return {
      recommendations,
      userProfile,
      insights
    };
  }

  private getTemplatePerformanceData() {
    // Simulated performance data - in real app would come from analytics
    return {
      'lead-generation': {
        conversionRate: 18.5,
        usageCount: 1247,
        avgSetupTime: 15,
        industryFit: {
          'Technology': 0.9,
          'Healthcare': 0.7,
          'Finance': 0.8,
          'Consulting': 0.6
        }
      },
      'b2b-lead': {
        conversionRate: 12.8,
        usageCount: 543,
        avgSetupTime: 25,
        industryFit: {
          'Technology': 0.95,
          'Finance': 0.9,
          'Consulting': 0.85,
          'Manufacturing': 0.8
        }
      },
      'saas-trial': {
        conversionRate: 22.1,
        usageCount: 890,
        avgSetupTime: 20,
        industryFit: {
          'Technology': 0.95,
          'Education': 0.7,
          'Healthcare': 0.6
        }
      },
      'consultation': {
        conversionRate: 15.7,
        usageCount: 432,
        avgSetupTime: 30,
        industryFit: {
          'Consulting': 0.95,
          'Finance': 0.8,
          'Healthcare': 0.75
        }
      },
      'product-launch': {
        conversionRate: 16.3,
        usageCount: 321,
        avgSetupTime: 35,
        industryFit: {
          'Technology': 0.8,
          'Retail': 0.9,
          'Manufacturing': 0.7
        }
      },
      'event-registration': {
        conversionRate: 19.2,
        usageCount: 654,
        avgSetupTime: 20,
        industryFit: {
          'Education': 0.9,
          'Technology': 0.7,
          'Consulting': 0.8
        }
      }
    };
  }

  private generateSmartRecommendations(userProfile: UserProfile, performanceData: any) {
    const recommendations = [];
    
    // Score each template based on user profile
    Object.entries(performanceData).forEach(([templateId, data]: [string, any]) => {
      let score = data.conversionRate; // Base score
      
      // Industry fit multiplier
      const industryFit = data.industryFit[userProfile.industry || 'Technology'] || 0.5;
      score *= (1 + industryFit);
      
      // Business size considerations
      if (userProfile.businessSize === 'Enterprise' && templateId === 'b2b-lead') {
        score *= 1.3;
      }
      if (userProfile.businessSize === 'Small' && data.avgSetupTime <= 20) {
        score *= 1.2; // Prefer quick setup for small businesses
      }
      
      // Goal alignment
      if (userProfile.goals?.includes('lead-generation') && 
          ['lead-generation', 'b2b-lead'].includes(templateId)) {
        score *= 1.25;
      }
      
      // Avoid recently used templates (if any)
      if (userProfile.previousTemplates?.includes(templateId)) {
        score *= 0.7;
      }
      
      recommendations.push({
        templateId,
        score: Math.min(100, Math.round(score)),
        conversionRate: data.conversionRate,
        setupTime: data.avgSetupTime,
        industryFit,
        usageCount: data.usageCount
      });
    });
    
    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  }

  private generateInsights(userProfile: UserProfile, recommendations: any[]) {
    const topRecommendation = recommendations[0];
    
    return {
      primaryFocus: `Based on your ${userProfile.industry} business profile, focus on ${
        userProfile.goals?.includes('lead-generation') ? 'lead generation' : 'customer acquisition'
      } strategies`,
      conversionPotential: `Your top recommended template has a ${topRecommendation?.conversionRate}% average conversion rate in similar businesses`,
      optimizationTips: [
        `Optimize for ${userProfile.businessSize === 'Small' ? 'quick setup and immediate results' : 'comprehensive lead qualification'}`,
        `Focus on ${userProfile.industry}-specific messaging and value propositions`,
        'Test multiple variations to improve conversion rates',
        'Monitor and analyze performance metrics regularly'
      ]
    };
  }

  async trackTemplateUsage(userId: string, templateId: string, action: 'view' | 'use' | 'convert') {
    // In a real app, this would update a template_analytics table
    console.log(`User ${userId} performed ${action} on template ${templateId}`);
    
    // This data would be used to improve future recommendations
  }
}

export const aiRecommendationService = AIRecommendationService.getInstance();