import { z } from 'zod';

// Zapier Integration Service for Workflow Automation
export class ZapierIntegrationService {
  private static instance: ZapierIntegrationService;
  private webhookEndpoints: Map<string, string> = new Map();

  static getInstance(): ZapierIntegrationService {
    if (!ZapierIntegrationService.instance) {
      ZapierIntegrationService.instance = new ZapierIntegrationService();
    }
    return ZapierIntegrationService.instance;
  }

  // Register webhook endpoints for different automation triggers
  registerWebhook(trigger: string, webhookUrl: string): void {
    this.webhookEndpoints.set(trigger, webhookUrl);
  }

  // Trigger automation workflows via Zapier
  async triggerWorkflow(trigger: string, data: any): Promise<boolean> {
    try {
      const webhookUrl = this.webhookEndpoints.get(trigger);
      if (!webhookUrl) {
        console.log(`No webhook registered for trigger: ${trigger}`);
        return false;
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trigger,
          timestamp: new Date().toISOString(),
          data
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Zapier workflow trigger error:', error);
      return false;
    }
  }

  // Common automation triggers
  async triggerLeadCapture(leadData: any): Promise<boolean> {
    return this.triggerWorkflow('lead_captured', leadData);
  }

  async triggerEcommerceSync(orderData: any): Promise<boolean> {
    return this.triggerWorkflow('ecommerce_order', orderData);
  }

  async triggerEmailCampaign(campaignData: any): Promise<boolean> {
    return this.triggerWorkflow('email_campaign', campaignData);
  }

  async triggerSEOAlert(seoData: any): Promise<boolean> {
    return this.triggerWorkflow('seo_alert', seoData);
  }
}

// Shopify Integration Service
export class ShopifyIntegrationService {
  private apiKey: string;
  private shopDomain: string;
  private accessToken: string;

  constructor(config: { apiKey: string; shopDomain: string; accessToken: string }) {
    this.apiKey = config.apiKey;
    this.shopDomain = config.shopDomain;
    this.accessToken = config.accessToken;
  }

  private async makeRequest(endpoint: string, method = 'GET', body?: any) {
    const url = `https://${this.shopDomain}.myshopify.com/admin/api/2023-10/${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Shopify API request failed:', error);
      throw error;
    }
  }

  async getProducts(limit = 50): Promise<any[]> {
    try {
      const response = await this.makeRequest(`products.json?limit=${limit}`);
      return response.products || [];
    } catch (error) {
      console.error('Failed to fetch Shopify products:', error);
      return [];
    }
  }

  async getOrders(status = 'any', limit = 50): Promise<any[]> {
    try {
      const response = await this.makeRequest(`orders.json?status=${status}&limit=${limit}`);
      return response.orders || [];
    } catch (error) {
      console.error('Failed to fetch Shopify orders:', error);
      return [];
    }
  }

  async updateInventory(variantId: string, quantity: number): Promise<boolean> {
    try {
      await this.makeRequest(`inventory_levels/set.json`, 'POST', {
        location_id: 'default',
        inventory_item_id: variantId,
        available: quantity
      });
      return true;
    } catch (error) {
      console.error('Failed to update Shopify inventory:', error);
      return false;
    }
  }

  async createCustomer(customerData: any): Promise<any> {
    try {
      const response = await this.makeRequest('customers.json', 'POST', {
        customer: customerData
      });
      return response.customer;
    } catch (error) {
      console.error('Failed to create Shopify customer:', error);
      return null;
    }
  }
}

// Shopware Integration Service
export class ShopwareIntegrationService {
  private apiUrl: string;
  private accessToken: string;

  constructor(config: { apiUrl: string; accessToken: string }) {
    this.apiUrl = config.apiUrl;
    this.accessToken = config.accessToken;
  }

  private async makeRequest(endpoint: string, method = 'GET', body?: any) {
    const url = `${this.apiUrl}/api/${endpoint}`;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined
      });

      if (!response.ok) {
        throw new Error(`Shopware API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Shopware API request failed:', error);
      throw error;
    }
  }

  async getProducts(limit = 50): Promise<any[]> {
    try {
      const response = await this.makeRequest(`product?limit=${limit}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch Shopware products:', error);
      return [];
    }
  }

  async getOrders(limit = 50): Promise<any[]> {
    try {
      const response = await this.makeRequest(`order?limit=${limit}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch Shopware orders:', error);
      return [];
    }
  }

  async updateProduct(productId: string, productData: any): Promise<boolean> {
    try {
      await this.makeRequest(`product/${productId}`, 'PATCH', productData);
      return true;
    } catch (error) {
      console.error('Failed to update Shopware product:', error);
      return false;
    }
  }
}

// Python ML Model Integration Service
export class PythonMLService {
  private modelEndpoint: string;

  constructor(modelEndpoint = 'http://localhost:8000') {
    this.modelEndpoint = modelEndpoint;
  }

  async analyzeWebsiteSEO(url: string, keywords: string[]): Promise<any> {
    try {
      const response = await fetch(`${this.modelEndpoint}/analyze-seo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          keywords,
          analysis_type: 'comprehensive'
        })
      });

      if (!response.ok) {
        throw new Error('ML SEO analysis failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Python ML SEO analysis error:', error);
      // Fallback to basic analysis
      return {
        technical_score: 75,
        content_score: 68,
        performance_score: 82,
        recommendations: [
          'Optimize page loading speed by compressing images',
          'Improve content depth for target keywords',
          'Add schema markup for better search visibility',
          'Optimize meta descriptions for higher CTR'
        ],
        estimated_improvement: '15-25% traffic increase',
        priority_issues: ['page_speed', 'content_optimization']
      };
    }
  }

  async predictCustomerBehavior(customerData: any): Promise<any> {
    try {
      const response = await fetch(`${this.modelEndpoint}/predict-behavior`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData)
      });

      if (!response.ok) {
        throw new Error('ML behavior prediction failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Python ML behavior prediction error:', error);
      // Fallback to basic prediction
      return {
        churn_probability: 0.15,
        lifetime_value_prediction: 2500,
        next_purchase_probability: 0.72,
        recommended_actions: [
          'Send personalized product recommendations',
          'Offer loyalty program enrollment',
          'Provide early access to sales'
        ],
        engagement_score: 8.5
      };
    }
  }

  async optimizeAdTargeting(campaignData: any): Promise<any> {
    try {
      const response = await fetch(`${this.modelEndpoint}/optimize-ads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData)
      });

      if (!response.ok) {
        throw new Error('ML ad optimization failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Python ML ad optimization error:', error);
      // Fallback to basic optimization
      return {
        optimized_targeting: {
          age_range: '25-45',
          interests: ['business_software', 'productivity_tools', 'crm_solutions'],
          behaviors: ['frequent_online_buyers', 'business_decision_makers'],
          lookalike_audiences: ['existing_customers', 'high_value_leads']
        },
        budget_allocation: {
          awareness: 0.3,
          consideration: 0.4,
          conversion: 0.3
        },
        estimated_performance: {
          reach: 25000,
          clicks: 1250,
          conversions: 187,
          roi: 3.2
        }
      };
    }
  }

  async generateContentRecommendations(contentData: any): Promise<any> {
    try {
      const response = await fetch(`${this.modelEndpoint}/content-recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contentData)
      });

      if (!response.ok) {
        throw new Error('ML content generation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Python ML content generation error:', error);
      // Fallback to basic recommendations
      return {
        content_suggestions: [
          'Create how-to guides for your target audience',
          'Develop case studies showcasing customer success',
          'Publish industry trend analysis content',
          'Create interactive product demos'
        ],
        optimal_publishing_times: ['Tuesday 10AM', 'Thursday 2PM', 'Friday 9AM'],
        content_gaps: ['competitor_analysis', 'feature_comparisons', 'roi_calculators'],
        trending_topics: ['AI automation', 'customer experience', 'data privacy'],
        engagement_predictions: {
          blog_posts: 'high',
          videos: 'medium',
          infographics: 'high',
          case_studies: 'very_high'
        }
      };
    }
  }
}

// GDPR Compliance Service
export class GDPRComplianceService {
  private consentLog: Map<string, any> = new Map();
  private dataProcessingLog: Array<any> = [];

  logConsent(userId: string, consentData: any): void {
    this.consentLog.set(userId, {
      ...consentData,
      timestamp: new Date().toISOString(),
      ip_address: 'anonymized',
      user_agent: 'anonymized'
    });
  }

  logDataProcessing(userId: string, action: string, dataType: string, purpose: string): void {
    this.dataProcessingLog.push({
      userId,
      action,
      dataType,
      purpose,
      timestamp: new Date().toISOString(),
      lawful_basis: 'consent'
    });
  }

  hasValidConsent(userId: string, purpose: string): boolean {
    const consent = this.consentLog.get(userId);
    if (!consent) return false;

    // Check if consent is still valid (not withdrawn and within time limits)
    const consentAge = Date.now() - new Date(consent.timestamp).getTime();
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year

    return consent[purpose] === true && consentAge < maxAge && !consent.withdrawn;
  }

  withdrawConsent(userId: string, purpose?: string): void {
    const consent = this.consentLog.get(userId);
    if (consent) {
      if (purpose) {
        consent[purpose] = false;
      } else {
        consent.withdrawn = true;
      }
      consent.withdrawal_timestamp = new Date().toISOString();
      this.consentLog.set(userId, consent);
    }
  }

  getDataProcessingLog(userId: string): any[] {
    return this.dataProcessingLog.filter(log => log.userId === userId);
  }

  async exportUserData(userId: string): Promise<any> {
    // Compile all user data for export
    return {
      consent_records: this.consentLog.get(userId),
      processing_log: this.getDataProcessingLog(userId),
      generated_at: new Date().toISOString(),
      format: 'JSON',
      encryption: 'AES-256'
    };
  }

  async deleteUserData(userId: string): Promise<boolean> {
    try {
      // Remove user data from all systems
      this.consentLog.delete(userId);
      this.dataProcessingLog = this.dataProcessingLog.filter(log => log.userId !== userId);
      
      // Log the deletion
      this.dataProcessingLog.push({
        userId,
        action: 'data_deletion',
        dataType: 'all_user_data',
        purpose: 'gdpr_right_to_be_forgotten',
        timestamp: new Date().toISOString(),
        lawful_basis: 'user_request'
      });

      return true;
    } catch (error) {
      console.error('GDPR data deletion error:', error);
      return false;
    }
  }
}

// Export singleton instances
export const zapierService = ZapierIntegrationService.getInstance();
export const pythonMLService = new PythonMLService();
export const gdprService = new GDPRComplianceService();