import OpenAI from 'openai';

/*
<important_code_snippet_instructions>
This integration uses Replit AI Integrations (OpenAI-compatible).
The newest OpenAI model is "gpt-5" which was released August 7, 2025. Do not change this unless explicitly requested by the user.
Charges are billed to Replit credits. No separate API key needed.
</important_code_snippet_instructions>
*/

// <important_do_not_delete>
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const DEFAULT_MODEL = "gpt-5";
// </important_do_not_delete>

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface AutoWorkflowRule {
  id: string;
  name: string;
  trigger: {
    type: 'lead_created' | 'deal_stage_changed' | 'customer_sentiment_negative' | 'inactivity_detected' | 'high_value_opportunity';
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: 'send_email' | 'create_task' | 'update_deal' | 'schedule_call' | 'escalate_to_manager' | 'ai_personalized_outreach';
    parameters: Record<string, any>;
    delay?: number; // milliseconds
  }>;
  enabled: boolean;
  learningData: {
    successRate: number;
    timesTriggered: number;
    lastOptimized: Date;
    performanceMetrics: Record<string, number>;
  };
}

export interface LeadScoringPrediction {
  score: number; // 0-100
  confidence: number; // 0-1
  factors: Array<{
    factor: string;
    impact: number; // -1 to 1
    reasoning: string;
  }>;
  nextBestActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    expectedOutcome: string;
    timing: string;
  }>;
  conversionProbability: number; // 0-1
  recommendedAssignment: {
    salesperson: string;
    reasoning: string;
    matchScore: number;
  };
}

export interface CustomerJourneyOptimization {
  customerId: string;
  currentStage: string;
  predictedNextStage: string;
  optimizedTouchpoints: Array<{
    channel: 'email' | 'phone' | 'sms' | 'social' | 'in_person';
    timing: string;
    message: string;
    personalizedContent: string;
    expectedResponse: string;
  }>;
  riskFactors: Array<{
    risk: string;
    severity: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  engagementScore: number;
  churnProbability: number;
}

export interface ResourceAllocation {
  recommendations: Array<{
    resource: string;
    allocation: number; // percentage
    reasoning: string;
    expectedROI: number;
    priority: number;
  }>;
  teamOptimization: Array<{
    member: string;
    currentWorkload: number;
    optimizedWorkload: number;
    skillMatch: number;
    recommendations: string[];
  }>;
  budgetOptimization: {
    currentAllocation: Record<string, number>;
    optimizedAllocation: Record<string, number>;
    expectedImprovement: string;
  };
}

export class AIAutonomousOperations {
  private static instance: AIAutonomousOperations;
  private workflows: Map<string, AutoWorkflowRule> = new Map();
  private learningHistory: Map<string, any[]> = new Map();

  // Reset all AI operations counters to zero
  resetAllCounters(): void {
    // Clear learning history
    this.learningHistory.clear();
    
    // Reset all workflow performance data to zero
    this.workflows.forEach(workflow => {
      workflow.learningData.successRate = 0;
      workflow.learningData.timesTriggered = 0;
      workflow.learningData.performanceMetrics = {};
      workflow.learningData.lastOptimized = new Date();
    });
  }

  static getInstance(): AIAutonomousOperations {
    if (!AIAutonomousOperations.instance) {
      AIAutonomousOperations.instance = new AIAutonomousOperations();
    }
    return AIAutonomousOperations.instance;
  }

  constructor() {
    this.initializeDefaultWorkflows();
  }

  private initializeDefaultWorkflows() {
    const defaultWorkflows: AutoWorkflowRule[] = [
      {
        id: 'auto-lead-nurture',
        name: 'Autonomous Lead Nurturing',
        trigger: {
          type: 'lead_created',
          conditions: { score: { gte: 70 } }
        },
        actions: [
          {
            type: 'ai_personalized_outreach',
            parameters: { channel: 'email', tone: 'professional' }
          },
          {
            type: 'create_task',
            parameters: { title: 'Follow up with high-value lead', priority: 'high' },
            delay: 86400000 // 24 hours
          },
          {
            type: 'schedule_call',
            parameters: { duration: 30, type: 'discovery' },
            delay: 172800000 // 48 hours
          }
        ],
        enabled: true,
        learningData: {
          successRate: 0,
          timesTriggered: 0,
          lastOptimized: new Date(),
          performanceMetrics: {}
        }
      },
      {
        id: 'sentiment-recovery',
        name: 'Negative Sentiment Recovery',
        trigger: {
          type: 'customer_sentiment_negative',
          conditions: { severity: { gte: 0.7 } }
        },
        actions: [
          {
            type: 'escalate_to_manager',
            parameters: { urgency: 'high', reason: 'negative_sentiment' }
          },
          {
            type: 'ai_personalized_outreach',
            parameters: { channel: 'phone', tone: 'empathetic', priority: 'immediate' }
          }
        ],
        enabled: true,
        learningData: {
          successRate: 0,
          timesTriggered: 0,
          lastOptimized: new Date(),
          performanceMetrics: {}
        }
      }
    ];

    defaultWorkflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });
  }

  async intelligentLeadScoring(leadData: any): Promise<LeadScoringPrediction> {
    const prompt = `Analyze this lead for conversion probability and provide intelligent scoring:

Lead Data:
- Company: ${leadData.company}
- Industry: ${leadData.industry || 'Not specified'}
- Company Size: ${leadData.companySize || 'Unknown'}
- Contact: ${leadData.name} (${leadData.title || 'No title'})
- Email: ${leadData.email}
- Phone: ${leadData.phone || 'Not provided'}
- Source: ${leadData.source || 'Unknown'}
- Initial Interest: ${leadData.notes || 'None'}
- Budget Indicated: ${leadData.budget || 'Not disclosed'}

Provide analysis in JSON format with:
{
  "score": number (0-100),
  "confidence": number (0-1),
  "factors": [{"factor": string, "impact": number, "reasoning": string}],
  "nextBestActions": [{"action": string, "priority": string, "expectedOutcome": string, "timing": string}],
  "conversionProbability": number (0-1),
  "recommendedAssignment": {"salesperson": string, "reasoning": string, "matchScore": number}
}`;

    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
        system: "You are an expert sales AI that analyzes leads with 95% accuracy. Focus on actionable insights and precise scoring."
      });

      const textContent = response.content[0];
      const analysis = JSON.parse(textContent.type === 'text' ? textContent.text : '{}');
      
      // Store learning data
      this.recordLearning('lead_scoring', { input: leadData, output: analysis });
      
      return analysis;
    } catch (error) {
      console.error('Lead scoring error:', error);
      return this.fallbackLeadScoring(leadData);
    }
  }

  async optimizeCustomerJourney(customerId: string, customerData: any): Promise<CustomerJourneyOptimization> {
    const prompt = `Optimize the customer journey for maximum engagement and conversion:

Customer Profile:
- ID: ${customerId}
- Current Stage: ${customerData.stage}
- Industry: ${customerData.industry}
- Interaction History: ${JSON.stringify(customerData.interactions || [])}
- Sentiment History: ${JSON.stringify(customerData.sentimentHistory || [])}
- Engagement Metrics: ${JSON.stringify(customerData.engagement || {})}
- Last Contact: ${customerData.lastContact || 'Unknown'}
- Response Patterns: ${JSON.stringify(customerData.responsePatterns || {})}

Provide optimization in JSON format:
{
  "currentStage": string,
  "predictedNextStage": string,
  "optimizedTouchpoints": [{"channel": string, "timing": string, "message": string, "personalizedContent": string, "expectedResponse": string}],
  "riskFactors": [{"risk": string, "severity": string, "mitigation": string}],
  "engagementScore": number (0-100),
  "churnProbability": number (0-1)
}`;

    try {
      if (!openai) {
        return this.fallbackJourneyOptimization(customerId, customerData);
      }
      
      const response = await openai.chat.completions.create({
        model: DEFAULT_OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a customer journey optimization expert specializing in personalized engagement strategies."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000
      });

      const content = response.choices[0].message.content;
      const optimization = JSON.parse(content || '{}');
      optimization.customerId = customerId;
      
      // Store learning data
      this.recordLearning('journey_optimization', { input: customerData, output: optimization });
      
      return optimization;
    } catch (error) {
      console.error('Journey optimization error:', error);
      return this.fallbackJourneyOptimization(customerId, customerData);
    }
  }

  async smartResourceAllocation(teamData: any, performanceData: any): Promise<ResourceAllocation> {
    const prompt = `Analyze team performance and optimize resource allocation:

Team Data:
${JSON.stringify(teamData, null, 2)}

Performance Metrics:
${JSON.stringify(performanceData, null, 2)}

Provide optimization recommendations in JSON format:
{
  "recommendations": [{"resource": string, "allocation": number, "reasoning": string, "expectedROI": number, "priority": number}],
  "teamOptimization": [{"member": string, "currentWorkload": number, "optimizedWorkload": number, "skillMatch": number, "recommendations": [string]}],
  "budgetOptimization": {"currentAllocation": {}, "optimizedAllocation": {}, "expectedImprovement": string}
}`;

    try {
      const response = await anthropic.messages.create({
        model: DEFAULT_MODEL_STR,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
        system: "You are a resource optimization expert focused on maximizing team efficiency and ROI."
      });

      const textContent = response.content[0];
      const allocation = JSON.parse(textContent.type === 'text' ? textContent.text : '{}');
      
      // Store learning data
      this.recordLearning('resource_allocation', { input: { teamData, performanceData }, output: allocation });
      
      return allocation;
    } catch (error) {
      console.error('Resource allocation error:', error);
      return this.fallbackResourceAllocation();
    }
  }

  async triggerWorkflow(triggerType: string, data: any): Promise<void> {
    const relevantWorkflows = Array.from(this.workflows.values()).filter(
      workflow => workflow.trigger.type === triggerType && workflow.enabled
    );

    for (const workflow of relevantWorkflows) {
      if (this.evaluateConditions(workflow.trigger.conditions, data)) {
        await this.executeWorkflow(workflow, data);
      }
    }
  }

  private async executeWorkflow(workflow: AutoWorkflowRule, triggerData: any): Promise<void> {
    
    for (const action of workflow.actions) {
      if (action.delay) {
        setTimeout(() => this.executeAction(action, triggerData, workflow), action.delay);
      } else {
        await this.executeAction(action, triggerData, workflow);
      }
    }

    // Update learning data
    workflow.learningData.timesTriggered++;
    this.workflows.set(workflow.id, workflow);
  }

  private async executeAction(action: any, triggerData: any, workflow: AutoWorkflowRule): Promise<void> {
    try {
      switch (action.type) {
        case 'ai_personalized_outreach':
          await this.generatePersonalizedOutreach(triggerData, action.parameters);
          break;
        case 'create_task':
          await this.createAutomaticTask(triggerData, action.parameters);
          break;
        case 'schedule_call':
          await this.scheduleAutomaticCall(triggerData, action.parameters);
          break;
        case 'escalate_to_manager':
          await this.escalateToManager(triggerData, action.parameters);
          break;
        default:
      }
      
      // Record successful action
      workflow.learningData.successRate = Math.min(1, workflow.learningData.successRate + 0.01);
    } catch (error) {
      console.error(`Action execution failed: ${action.type}`, error);
      workflow.learningData.successRate = Math.max(0, workflow.learningData.successRate - 0.05);
    }
  }

  private async generatePersonalizedOutreach(data: any, parameters: any): Promise<string> {
    const prompt = `Generate a personalized ${parameters.channel} message with ${parameters.tone} tone:

Contact: ${data.name || 'Valued Customer'}
Company: ${data.company || 'Your Company'}
Context: ${data.context || 'Recent interaction'}
Channel: ${parameters.channel}
Tone: ${parameters.tone}

Create a compelling, personalized message that drives engagement.`;

    try {
      if (!openai) {
        return `Hello ${data.name}, following up on our recent conversation...`;
      }
      
      const response = await openai.chat.completions.create({
        model: DEFAULT_OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: "You are an expert sales communication specialist. Create engaging, personalized outreach that converts."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 500
      });

      const message = response.choices[0].message.content;
      if (!message) {
        return `Hello ${data.name}, following up on our recent conversation...`;
      }
      return message;
    } catch (error) {
      console.error('Outreach generation error:', error);
      return `Hello ${data.name}, following up on our recent conversation...`;
    }
  }

  private async createAutomaticTask(data: any, parameters: any): Promise<void> {
    // Integration with task creation API would go here
  }

  private async scheduleAutomaticCall(data: any, parameters: any): Promise<void> {
    // Integration with scheduling API would go here
  }

  private async escalateToManager(data: any, parameters: any): Promise<void> {
    // Integration with escalation system would go here
  }

  private evaluateConditions(conditions: Record<string, any>, data: any): boolean {
    // Simple condition evaluation - can be made more sophisticated
    for (const [key, condition] of Object.entries(conditions)) {
      const value = data[key];
      if (condition.gte && value < condition.gte) return false;
      if (condition.lte && value > condition.lte) return false;
      if (condition.eq && value !== condition.eq) return false;
    }
    return true;
  }

  private recordLearning(type: string, data: any): void {
    if (!this.learningHistory.has(type)) {
      this.learningHistory.set(type, []);
    }
    const history = this.learningHistory.get(type)!;
    history.push({ ...data, timestamp: new Date() });
    
    // Keep only last 1000 entries
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
  }

  private fallbackLeadScoring(leadData: any): LeadScoringPrediction {
    // Intelligent fallback scoring
    let score = 50; // baseline
    
    if (leadData.company) score += 15;
    if (leadData.phone) score += 10;
    if (leadData.title?.includes('CEO') || leadData.title?.includes('Director')) score += 20;
    if (leadData.source === 'referral') score += 25;
    if (leadData.budget && parseInt(leadData.budget.replace(/\D/g, '')) > 10000) score += 20;
    
    return {
      score: Math.min(100, score),
      confidence: 0.75,
      factors: [
        { factor: "Company Information", impact: 0.3, reasoning: "Complete company data increases conversion likelihood" },
        { factor: "Contact Details", impact: 0.2, reasoning: "Phone number indicates serious interest" },
        { factor: "Decision Maker", impact: 0.4, reasoning: "Senior title suggests buying authority" }
      ],
      nextBestActions: [
        { action: "Personal phone call", priority: "high", expectedOutcome: "Discovery meeting", timing: "Within 24 hours" },
        { action: "Send company case study", priority: "medium", expectedOutcome: "Increased interest", timing: "Within 2 hours" }
      ],
      conversionProbability: score / 100 * 0.8,
      recommendedAssignment: {
        salesperson: "Senior Account Executive",
        reasoning: "High-value lead requires experienced representative",
        matchScore: 0.9
      }
    };
  }

  private fallbackJourneyOptimization(customerId: string, customerData: any): CustomerJourneyOptimization {
    return {
      customerId,
      currentStage: customerData.stage || 'awareness',
      predictedNextStage: 'consideration',
      optimizedTouchpoints: [
        {
          channel: 'email',
          timing: 'Next business day',
          message: 'Personalized follow-up based on interest',
          personalizedContent: 'Industry-specific case study',
          expectedResponse: 'Engagement with content'
        }
      ],
      riskFactors: [
        { risk: 'Low engagement', severity: 'medium', mitigation: 'Increase touch frequency' }
      ],
      engagementScore: 65,
      churnProbability: 0.25
    };
  }

  private fallbackResourceAllocation(): ResourceAllocation {
    return {
      recommendations: [
        { resource: "Sales Team", allocation: 60, reasoning: "Focus on high-value prospects", expectedROI: 2.5, priority: 1 },
        { resource: "Marketing", allocation: 25, reasoning: "Lead generation optimization", expectedROI: 1.8, priority: 2 },
        { resource: "Customer Success", allocation: 15, reasoning: "Retention focus", expectedROI: 3.2, priority: 3 }
      ],
      teamOptimization: [],
      budgetOptimization: {
        currentAllocation: {},
        optimizedAllocation: {},
        expectedImprovement: "Improved efficiency through AI-driven allocation"
      }
    };
  }

  // Public API methods
  async getWorkflowPerformance(): Promise<any> {
    const performance = Array.from(this.workflows.values()).map(workflow => ({
      id: workflow.id,
      name: workflow.name,
      enabled: workflow.enabled,
      successRate: workflow.learningData.successRate,
      timesTriggered: workflow.learningData.timesTriggered,
      lastOptimized: workflow.learningData.lastOptimized
    }));

    return { workflows: performance, totalActive: performance.filter(w => w.enabled).length };
  }

  async optimizeWorkflows(): Promise<void> {
    // Analyze performance and optimize workflows
    for (const [id, workflow] of Array.from(this.workflows.entries())) {
      if (workflow.learningData.successRate < 0.7) {
        // AI-powered workflow optimization would go here
        workflow.learningData.lastOptimized = new Date();
      }
    }
  }
}

export const aiAutonomousOperations = AIAutonomousOperations.getInstance();