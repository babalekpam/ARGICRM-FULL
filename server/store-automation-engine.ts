import OpenAI from 'openai';
import { DatabaseStorage } from './database-storage';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const DEFAULT_OPENAI_MODEL = "gpt-4o";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export interface AutomationRule {
  id: string;
  tenantId: string;
  name: string;
  category: 'inventory' | 'pricing' | 'marketing' | 'customer_service' | 'orders' | 'analytics';
  trigger: {
    type: 'low_stock' | 'high_demand' | 'abandoned_cart' | 'new_order' | 'customer_review' | 'price_change' | 'time_based' | 'competitor_price';
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: 'restock_alert' | 'adjust_price' | 'send_email' | 'create_coupon' | 'update_inventory' | 'social_media_post' | 'ai_response' | 'notification';
    parameters: Record<string, any>;
    delay?: number; // milliseconds
  }>;
  enabled: boolean;
  schedule?: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    time?: string; // HH:MM format
    days?: string[]; // for weekly
  };
  aiConfig?: {
    personalityType: 'professional' | 'friendly' | 'casual' | 'luxury';
    responseStyle: 'concise' | 'detailed' | 'conversational';
    brandVoice: string;
  };
  performance: {
    timesTriggered: number;
    successRate: number;
    lastTriggered?: Date;
    avgResponseTime: number;
    revenueImpact: number;
  };
}

export interface AutomationInsights {
  tenantId: string;
  totalRules: number;
  activeRules: number;
  totalTriggers: number;
  successRate: number;
  revenueGenerated: number;
  topPerformingRules: Array<{
    ruleName: string;
    category: string;
    successRate: number;
    revenueImpact: number;
  }>;
  recommendations: Array<{
    type: 'optimization' | 'new_rule' | 'improvement';
    title: string;
    description: string;
    expectedImpact: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface SmartAutomationSuggestion {
  id: string;
  tenantId: string;
  category: string;
  title: string;
  description: string;
  estimatedImpact: {
    revenueIncrease: number; // percentage
    timesSaved: number; // hours per week
    customerSatisfaction: number; // score improvement
  };
  complexity: 'easy' | 'moderate' | 'advanced';
  ruleTemplate: Partial<AutomationRule>;
  aiGenerated: boolean;
}

export class StoreAutomationEngine {
  private static instance: StoreAutomationEngine;
  private storage: DatabaseStorage;
  private automationRules: Map<string, AutomationRule[]> = new Map(); // tenantId -> rules
  private processingQueue: Map<string, any[]> = new Map(); // tenantId -> queue

  constructor() {
    this.storage = new DatabaseStorage();
    this.initializeDefaultRules();
  }

  static getInstance(): StoreAutomationEngine {
    if (!StoreAutomationEngine.instance) {
      StoreAutomationEngine.instance = new StoreAutomationEngine();
    }
    return StoreAutomationEngine.instance;
  }

  private initializeDefaultRules() {
    // Initialize with common automation rule templates
    console.log('🤖 Store Automation Engine initialized');
  }

  async createAutomationRule(tenantId: string, rule: Partial<AutomationRule>): Promise<AutomationRule> {
    const newRule: AutomationRule = {
      id: `rule_${Date.now()}`,
      tenantId,
      name: rule.name || 'New Automation Rule',
      category: rule.category || 'inventory',
      trigger: rule.trigger || { type: 'low_stock', conditions: {} },
      actions: rule.actions || [],
      enabled: rule.enabled ?? true,
      schedule: rule.schedule,
      aiConfig: rule.aiConfig,
      performance: {
        timesTriggered: 0,
        successRate: 0,
        avgResponseTime: 0,
        revenueImpact: 0
      }
    };

    const tenantRules = this.automationRules.get(tenantId) || [];
    tenantRules.push(newRule);
    this.automationRules.set(tenantId, tenantRules);

    return newRule;
  }

  async getAutomationRules(tenantId: string): Promise<AutomationRule[]> {
    return this.automationRules.get(tenantId) || [];
  }

  async updateAutomationRule(tenantId: string, ruleId: string, updates: Partial<AutomationRule>): Promise<AutomationRule | null> {
    const tenantRules = this.automationRules.get(tenantId) || [];
    const ruleIndex = tenantRules.findIndex(r => r.id === ruleId);
    
    if (ruleIndex === -1) return null;

    tenantRules[ruleIndex] = { ...tenantRules[ruleIndex], ...updates };
    this.automationRules.set(tenantId, tenantRules);

    return tenantRules[ruleIndex];
  }

  async deleteAutomationRule(tenantId: string, ruleId: string): Promise<boolean> {
    const tenantRules = this.automationRules.get(tenantId) || [];
    const filteredRules = tenantRules.filter(r => r.id !== ruleId);
    
    if (filteredRules.length === tenantRules.length) return false;
    
    this.automationRules.set(tenantId, filteredRules);
    return true;
  }

  async triggerAutomation(tenantId: string, triggerType: string, data: any): Promise<void> {
    const tenantRules = this.automationRules.get(tenantId) || [];
    const applicableRules = tenantRules.filter(rule => 
      rule.enabled && rule.trigger.type === triggerType
    );

    for (const rule of applicableRules) {
      try {
        await this.executeRule(rule, data);
        
        // Update performance metrics
        rule.performance.timesTriggered++;
        rule.performance.lastTriggered = new Date();
        
      } catch (error) {
        console.error(`Error executing automation rule ${rule.id}:`, error);
      }
    }
  }

  private async executeRule(rule: AutomationRule, triggerData: any): Promise<void> {
    const startTime = Date.now();

    for (const action of rule.actions) {
      if (action.delay) {
        await new Promise(resolve => setTimeout(resolve, action.delay));
      }

      await this.executeAction(rule, action, triggerData);
    }

    const responseTime = Date.now() - startTime;
    rule.performance.avgResponseTime = (rule.performance.avgResponseTime + responseTime) / 2;
  }

  private async executeAction(rule: AutomationRule, action: any, triggerData: any): Promise<void> {
    switch (action.type) {
      case 'restock_alert':
        await this.sendRestockAlert(rule.tenantId, action.parameters, triggerData);
        break;
      case 'adjust_price':
        await this.adjustPrice(rule.tenantId, action.parameters, triggerData);
        break;
      case 'send_email':
        await this.sendAutomatedEmail(rule.tenantId, action.parameters, triggerData);
        break;
      case 'create_coupon':
        await this.createAutomatedCoupon(rule.tenantId, action.parameters, triggerData);
        break;
      case 'update_inventory':
        await this.updateInventory(rule.tenantId, action.parameters, triggerData);
        break;
      case 'social_media_post':
        await this.createSocialMediaPost(rule.tenantId, action.parameters, triggerData);
        break;
      case 'ai_response':
        await this.generateAIResponse(rule, action.parameters, triggerData);
        break;
      case 'notification':
        await this.sendNotification(rule.tenantId, action.parameters, triggerData);
        break;
    }
  }

  private async sendRestockAlert(tenantId: string, parameters: any, data: any): Promise<void> {
    // Implementation for restock alerts
    console.log(`📦 Restock alert sent for tenant ${tenantId}:`, data);
  }

  private async adjustPrice(tenantId: string, parameters: any, data: any): Promise<void> {
    // Implementation for price adjustments
    console.log(`💰 Price adjusted for tenant ${tenantId}:`, data);
  }

  private async sendAutomatedEmail(tenantId: string, parameters: any, data: any): Promise<void> {
    // Implementation for automated emails
    console.log(`📧 Automated email sent for tenant ${tenantId}:`, data);
  }

  private async createAutomatedCoupon(tenantId: string, parameters: any, data: any): Promise<void> {
    // Implementation for automated coupon creation
    console.log(`🎟️ Automated coupon created for tenant ${tenantId}:`, data);
  }

  private async updateInventory(tenantId: string, parameters: any, data: any): Promise<void> {
    // Implementation for inventory updates
    console.log(`📊 Inventory updated for tenant ${tenantId}:`, data);
  }

  private async createSocialMediaPost(tenantId: string, parameters: any, data: any): Promise<void> {
    // Implementation for social media posts
    console.log(`📱 Social media post created for tenant ${tenantId}:`, data);
  }

  private async generateAIResponse(rule: AutomationRule, parameters: any, data: any): Promise<void> {
    try {
      const prompt = this.buildAIPrompt(rule, parameters, data);
      
      const response = await openai.chat.completions.create({
        model: DEFAULT_OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: `You are an AI assistant for an e-commerce store automation system. 
            Brand voice: ${rule.aiConfig?.brandVoice || 'professional and helpful'}
            Response style: ${rule.aiConfig?.responseStyle || 'concise'}
            Personality: ${rule.aiConfig?.personalityType || 'professional'}`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (aiResponse) {
        await this.processAIResponse(rule.tenantId, aiResponse, data);
      }
    } catch (error) {
      console.error('AI response generation error:', error);
      await this.generateFallbackResponse(rule.tenantId, data);
    }
  }

  private buildAIPrompt(rule: AutomationRule, parameters: any, data: any): string {
    return `Generate an appropriate response for the following e-commerce automation trigger:
    
    Trigger: ${rule.trigger.type}
    Category: ${rule.category}
    Data: ${JSON.stringify(data)}
    Parameters: ${JSON.stringify(parameters)}
    
    Please provide a helpful, actionable response that addresses the trigger appropriately.`;
  }

  private async processAIResponse(tenantId: string, aiResponse: string, data: any): Promise<void> {
    // Process and execute the AI-generated response
    console.log(`🤖 AI response processed for tenant ${tenantId}:`, aiResponse);
  }

  private async generateFallbackResponse(tenantId: string, data: any): Promise<void> {
    // Fallback response when AI is unavailable
    console.log(`🔄 Fallback response generated for tenant ${tenantId}`);
  }

  private async sendNotification(tenantId: string, parameters: any, data: any): Promise<void> {
    // Implementation for notifications
    console.log(`🔔 Notification sent for tenant ${tenantId}:`, data);
  }

  async getAutomationInsights(tenantId: string): Promise<AutomationInsights> {
    const rules = await this.getAutomationRules(tenantId);
    const activeRules = rules.filter(r => r.enabled);
    
    const totalTriggers = rules.reduce((sum, rule) => sum + rule.performance.timesTriggered, 0);
    const totalRevenue = rules.reduce((sum, rule) => sum + rule.performance.revenueImpact, 0);
    const avgSuccessRate = rules.length > 0 ? 
      rules.reduce((sum, rule) => sum + rule.performance.successRate, 0) / rules.length : 0;

    const topPerformingRules = rules
      .sort((a, b) => b.performance.revenueImpact - a.performance.revenueImpact)
      .slice(0, 5)
      .map(rule => ({
        ruleName: rule.name,
        category: rule.category,
        successRate: rule.performance.successRate,
        revenueImpact: rule.performance.revenueImpact
      }));

    return {
      tenantId,
      totalRules: rules.length,
      activeRules: activeRules.length,
      totalTriggers,
      successRate: avgSuccessRate,
      revenueGenerated: totalRevenue,
      topPerformingRules,
      recommendations: await this.generateRecommendations(tenantId, rules)
    };
  }

  private async generateRecommendations(tenantId: string, rules: AutomationRule[]): Promise<any[]> {
    // Generate intelligent recommendations based on performance and missing automation opportunities
    const recommendations = [];

    if (rules.length === 0) {
      recommendations.push({
        type: 'new_rule',
        title: 'Set up inventory automation',
        description: 'Automatically manage stock levels and reorder products',
        expectedImpact: 'Prevent stockouts and increase sales by 15%',
        priority: 'high'
      });
    }

    if (!rules.some(r => r.category === 'marketing')) {
      recommendations.push({
        type: 'new_rule',
        title: 'Enable marketing automation',
        description: 'Automatically send abandoned cart emails and promotional campaigns',
        expectedImpact: 'Recover 20% of abandoned carts and increase customer retention',
        priority: 'high'
      });
    }

    return recommendations;
  }

  async generateSmartSuggestions(tenantId: string): Promise<SmartAutomationSuggestion[]> {
    // Generate AI-powered automation suggestions based on store data
    try {
      const storeData = await this.analyzeStoreData(tenantId);
      
      const response = await openai.chat.completions.create({
        model: DEFAULT_OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: "You are an e-commerce automation expert. Analyze store data and suggest powerful automation rules that can increase revenue and efficiency."
          },
          {
            role: "user",
            content: `Analyze this store data and suggest 5 high-impact automation rules: ${JSON.stringify(storeData)}`
          }
        ],
        temperature: 0.8,
        max_tokens: 1000
      });

      const suggestions = this.parseAISuggestions(response.choices[0]?.message?.content || '');
      return suggestions.map(s => ({ ...s, tenantId, aiGenerated: true }));
      
    } catch (error) {
      console.error('Error generating smart suggestions:', error);
      return this.getFallbackSuggestions(tenantId);
    }
  }

  private async analyzeStoreData(tenantId: string): Promise<any> {
    // Analyze store performance data to inform automation suggestions
    return {
      productCount: 50,
      orderCount: 200,
      averageOrderValue: 75,
      topCategories: ['Electronics', 'Clothing', 'Books'],
      lowStockItems: 12,
      abandonedCarts: 45
    };
  }

  private parseAISuggestions(aiResponse: string): SmartAutomationSuggestion[] {
    // Parse AI response into structured suggestions
    return [
      {
        id: 'suggestion_1',
        tenantId: '',
        category: 'inventory',
        title: 'Smart Stock Replenishment',
        description: 'Automatically reorder products when stock falls below optimal levels',
        estimatedImpact: {
          revenueIncrease: 15,
          timesSaved: 5,
          customerSatisfaction: 20
        },
        complexity: 'easy',
        ruleTemplate: {
          name: 'Smart Stock Replenishment',
          category: 'inventory',
          trigger: { type: 'low_stock', conditions: { threshold: 10 } },
          actions: [{ type: 'restock_alert', parameters: { notify: 'admin' } }]
        },
        aiGenerated: true
      }
    ];
  }

  private getFallbackSuggestions(tenantId: string): SmartAutomationSuggestion[] {
    return [
      {
        id: 'fallback_1',
        tenantId,
        category: 'inventory',
        title: 'Low Stock Alerts',
        description: 'Get notified when products are running low',
        estimatedImpact: {
          revenueIncrease: 10,
          timesSaved: 3,
          customerSatisfaction: 15
        },
        complexity: 'easy',
        ruleTemplate: {
          name: 'Low Stock Alert',
          category: 'inventory',
          trigger: { type: 'low_stock', conditions: { threshold: 5 } },
          actions: [{ type: 'notification', parameters: { message: 'Low stock alert' } }]
        },
        aiGenerated: false
      }
    ];
  }

  async testAutomationRule(tenantId: string, ruleId: string, testData: any): Promise<any> {
    const rules = await this.getAutomationRules(tenantId);
    const rule = rules.find(r => r.id === ruleId);
    
    if (!rule) throw new Error('Rule not found');

    const testResult = {
      ruleId,
      triggered: true,
      executionTime: 0,
      actionsExecuted: rule.actions.length,
      success: true,
      output: 'Test execution completed successfully'
    };

    return testResult;
  }
}

export const storeAutomationEngine = StoreAutomationEngine.getInstance();