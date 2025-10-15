import { emotionalIntelligenceEngine, EmotionalAnalysis } from './ai-emotional-intelligence';
import { db } from './db';
import { tickets, users } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

export interface TicketRoutingDecision {
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  assignedAgent: string;
  suggestedResponseTone: string;
  escalationThreshold: string;
  estimatedResolutionTime: number;
  requiredSkills: string[];
  recommendedActions: string[];
}

export interface AgentProfile {
  id: string;
  name: string;
  skills: string[];
  emotionalIntelligenceRating: number;
  currentWorkload: number;
  specializationAreas: string[];
  performanceMetrics: {
    averageResolutionTime: number;
    customerSatisfactionScore: number;
    emotionalHandlingScore: number;
  };
}

export class IntelligentTicketRouting {
  private agentProfiles: Map<string, AgentProfile> = new Map();

  constructor() {
    this.initializeAgentProfiles();
  }

  async routeTicket(ticketData: {
    id: string;
    customerId: string;
    content: string;
    type: string;
    channel: 'email' | 'chat' | 'phone' | 'social';
    customerHistory?: any[];
  }): Promise<TicketRoutingDecision> {
    try {
      // Analyze emotional content of the ticket
      const emotionalAnalysis = await emotionalIntelligenceEngine
        .analyzeCustomerCommunication(ticketData.content, ticketData.customerId);

      // Get customer profile and history
      const customerProfile = await this.getCustomerProfile(ticketData.customerId);
      
      // Determine urgency and priority
      const priority = this.calculatePriority(emotionalAnalysis, ticketData, customerProfile);
      
      // Find best agent for the ticket
      const assignedAgent = await this.selectOptimalAgent(
        emotionalAnalysis, 
        ticketData, 
        priority,
        customerProfile
      );
      
      // Generate routing decision
      const routingDecision: TicketRoutingDecision = {
        priority,
        assignedAgent: assignedAgent.id,
        suggestedResponseTone: this.determinResponseTone(emotionalAnalysis),
        escalationThreshold: this.calculateEscalationThreshold(emotionalAnalysis, priority),
        estimatedResolutionTime: this.estimateResolutionTime(ticketData.type, priority, assignedAgent),
        requiredSkills: this.identifyRequiredSkills(ticketData, emotionalAnalysis),
        recommendedActions: emotionalAnalysis.recommendedActions
      };

      // Log the routing decision for analytics
      await this.logRoutingDecision(ticketData.id, routingDecision, emotionalAnalysis);

      return routingDecision;
    } catch (error) {
      console.error('Error in intelligent ticket routing:', error);
      return this.getDefaultRouting();
    }
  }

  private calculatePriority(
    emotionalAnalysis: EmotionalAnalysis,
    ticketData: any,
    customerProfile: any
  ): 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW' {
    let priorityScore = 0;

    // Emotional factors
    if (emotionalAnalysis.urgencyLevel === 'HIGH') {
      priorityScore += 40;
    } else if (emotionalAnalysis.urgencyLevel === 'NORMAL') {
      priorityScore += 20;
    }

    // Sentiment impact
    if (emotionalAnalysis.sentiment === 'NEGATIVE' && emotionalAnalysis.confidence > 0.8) {
      priorityScore += 30;
    }

    // Anger and frustration indicators
    if (emotionalAnalysis.emotions.anger > 0.6) {
      priorityScore += 25;
    }

    // Customer value and history
    if (customerProfile?.tier === 'enterprise') {
      priorityScore += 20;
    } else if (customerProfile?.tier === 'premium') {
      priorityScore += 15;
    }

    // Churn risk
    if (customerProfile?.churnRisk === 'HIGH') {
      priorityScore += 25;
    }

    // Issue type urgency
    const urgentKeywords = ['down', 'broken', 'not working', 'urgent', 'emergency', 'critical'];
    if (urgentKeywords.some(keyword => ticketData.content.toLowerCase().includes(keyword))) {
      priorityScore += 20;
    }

    // Multiple recent tickets
    if (customerProfile?.recentTicketCount > 2) {
      priorityScore += 15;
    }

    if (priorityScore >= 80) return 'URGENT';
    if (priorityScore >= 60) return 'HIGH';
    if (priorityScore >= 30) return 'NORMAL';
    return 'LOW';
  }

  private async selectOptimalAgent(
    emotionalAnalysis: EmotionalAnalysis,
    ticketData: any,
    priority: string,
    customerProfile: any
  ): Promise<AgentProfile> {
    const availableAgents = Array.from(this.agentProfiles.values())
      .filter(agent => agent.currentWorkload < 10); // Max 10 concurrent tickets

    if (availableAgents.length === 0) {
      // Emergency fallback - get least loaded agent
      const agents = Array.from(this.agentProfiles.values());
      return agents.reduce((min, agent) => 
        agent.currentWorkload < min.currentWorkload ? agent : min
      );
    }

    // Score agents based on multiple factors
    const agentScores = availableAgents.map(agent => ({
      agent,
      score: this.calculateAgentScore(agent, emotionalAnalysis, ticketData, priority, customerProfile)
    }));

    // Sort by score (highest first)
    agentScores.sort((a, b) => b.score - a.score);

    return agentScores[0].agent;
  }

  private calculateAgentScore(
    agent: AgentProfile,
    emotionalAnalysis: EmotionalAnalysis,
    ticketData: any,
    priority: string,
    customerProfile: any
  ): number {
    let score = 100; // Base score

    // Emotional intelligence match
    if (emotionalAnalysis.urgencyLevel === 'HIGH' && agent.emotionalIntelligenceRating > 8) {
      score += 30;
    }

    // Skill matching
    const requiredSkills = this.identifyRequiredSkills(ticketData, emotionalAnalysis);
    const skillMatch = requiredSkills.filter(skill => 
      agent.skills.includes(skill)
    ).length / Math.max(requiredSkills.length, 1);
    score += skillMatch * 25;

    // Specialization match
    if (agent.specializationAreas.includes(ticketData.type)) {
      score += 20;
    }

    // Performance metrics
    score += (agent.performanceMetrics.customerSatisfactionScore - 5) * 2; // Scale 0-10 to -10 to +10
    score += (10 - agent.performanceMetrics.averageResolutionTime / 60) * 1.5; // Faster resolution = higher score

    // Workload penalty
    score -= agent.currentWorkload * 5;

    // Priority matching - senior agents for urgent tickets
    if (priority === 'URGENT' && agent.emotionalIntelligenceRating > 7) {
      score += 15;
    }

    // High-value customer handling
    if (customerProfile?.tier === 'enterprise' && agent.specializationAreas.includes('enterprise')) {
      score += 15;
    }

    return Math.max(0, score);
  }

  private determinResponseTone(emotionalAnalysis: EmotionalAnalysis): string {
    if (emotionalAnalysis.emotions.anger > 0.6) {
      return 'calm_apologetic';
    } else if (emotionalAnalysis.emotions.fear > 0.5) {
      return 'reassuring_confident';
    } else if (emotionalAnalysis.emotions.sadness > 0.5) {
      return 'empathetic_supportive';
    } else if (emotionalAnalysis.sentiment === 'NEGATIVE') {
      return 'understanding_solution_focused';
    } else if (emotionalAnalysis.emotions.joy > 0.6) {
      return 'enthusiastic_friendly';
    }
    return 'professional_helpful';
  }

  private calculateEscalationThreshold(
    emotionalAnalysis: EmotionalAnalysis,
    priority: string
  ): string {
    if (priority === 'URGENT' || emotionalAnalysis.emotions.anger > 0.7) {
      return 'immediate';
    } else if (priority === 'HIGH' || emotionalAnalysis.urgencyLevel === 'HIGH') {
      return '15_minutes';
    } else if (emotionalAnalysis.sentiment === 'NEGATIVE') {
      return '30_minutes';
    }
    return '1_hour';
  }

  private estimateResolutionTime(
    ticketType: string,
    priority: string,
    agent: AgentProfile
  ): number {
    let baseTime = 120; // 2 hours default

    // Adjust by ticket type
    const typeMultipliers: { [key: string]: number } = {
      'technical': 1.5,
      'billing': 0.8,
      'general': 1.0,
      'bug_report': 2.0,
      'feature_request': 1.3
    };

    baseTime *= typeMultipliers[ticketType] || 1.0;

    // Adjust by priority
    const priorityMultipliers = {
      'URGENT': 0.5,
      'HIGH': 0.7,
      'NORMAL': 1.0,
      'LOW': 1.5
    };

    baseTime *= priorityMultipliers[priority as keyof typeof priorityMultipliers];

    // Adjust by agent performance
    baseTime *= (agent.performanceMetrics.averageResolutionTime / 120);

    return Math.round(baseTime);
  }

  private identifyRequiredSkills(ticketData: any, emotionalAnalysis: EmotionalAnalysis): string[] {
    const skills = [];

    // Technical skills based on content
    if (ticketData.content.toLowerCase().includes('api')) {
      skills.push('api_support');
    }
    if (ticketData.content.toLowerCase().includes('integration')) {
      skills.push('integrations');
    }
    if (ticketData.content.toLowerCase().includes('billing') || ticketData.content.toLowerCase().includes('payment')) {
      skills.push('billing');
    }

    // Emotional handling skills
    if (emotionalAnalysis.emotions.anger > 0.6) {
      skills.push('conflict_resolution');
    }
    if (emotionalAnalysis.urgencyLevel === 'HIGH') {
      skills.push('crisis_management');
    }
    if (emotionalAnalysis.emotions.fear > 0.5) {
      skills.push('customer_reassurance');
    }

    // Channel-specific skills
    if (ticketData.channel === 'phone') {
      skills.push('voice_communication');
    } else if (ticketData.channel === 'chat') {
      skills.push('real_time_chat');
    }

    return skills;
  }

  private async getCustomerProfile(customerId: string): Promise<any> {
    try {
      // This would typically fetch from customer database
      // For now, return mock data structure
      return {
        tier: 'professional',
        churnRisk: 'LOW',
        recentTicketCount: 1,
        totalValue: 5000,
        satisfactionScore: 8.5
      };
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      return null;
    }
  }

  private async logRoutingDecision(
    ticketId: string,
    decision: TicketRoutingDecision,
    emotionalAnalysis: EmotionalAnalysis
  ): Promise<void> {
    try {
      // Log for analytics and continuous improvement
      console.log('Ticket routing decision:', {
        ticketId,
        priority: decision.priority,
        assignedAgent: decision.assignedAgent,
        emotionalFactors: {
          sentiment: emotionalAnalysis.sentiment,
          primaryEmotion: Object.keys(emotionalAnalysis.emotions).reduce((a, b) => 
            emotionalAnalysis.emotions[a as keyof typeof emotionalAnalysis.emotions] > 
            emotionalAnalysis.emotions[b as keyof typeof emotionalAnalysis.emotions] ? a : b
          ),
          urgency: emotionalAnalysis.urgencyLevel
        }
      });
    } catch (error) {
      console.error('Error logging routing decision:', error);
    }
  }

  private getDefaultRouting(): TicketRoutingDecision {
    return {
      priority: 'NORMAL',
      assignedAgent: 'agent_001',
      suggestedResponseTone: 'professional_helpful',
      escalationThreshold: '1_hour',
      estimatedResolutionTime: 120,
      requiredSkills: ['general_support'],
      recommendedActions: ['Standard response protocol']
    };
  }

  private initializeAgentProfiles(): void {
    // Initialize with sample agent profiles
    // In production, this would load from database
    const sampleAgents: AgentProfile[] = [
      {
        id: 'agent_001',
        name: 'Sarah Chen',
        skills: ['technical_support', 'api_support', 'integrations', 'conflict_resolution'],
        emotionalIntelligenceRating: 9,
        currentWorkload: 3,
        specializationAreas: ['technical', 'enterprise'],
        performanceMetrics: {
          averageResolutionTime: 90,
          customerSatisfactionScore: 9.2,
          emotionalHandlingScore: 8.8
        }
      },
      {
        id: 'agent_002',
        name: 'Michael Rodriguez',
        skills: ['billing', 'general_support', 'customer_reassurance', 'voice_communication'],
        emotionalIntelligenceRating: 8,
        currentWorkload: 5,
        specializationAreas: ['billing', 'general'],
        performanceMetrics: {
          averageResolutionTime: 75,
          customerSatisfactionScore: 8.9,
          emotionalHandlingScore: 9.1
        }
      },
      {
        id: 'agent_003',
        name: 'Emma Thompson',
        skills: ['crisis_management', 'conflict_resolution', 'real_time_chat', 'enterprise'],
        emotionalIntelligenceRating: 9.5,
        currentWorkload: 2,
        specializationAreas: ['crisis_management', 'enterprise'],
        performanceMetrics: {
          averageResolutionTime: 60,
          customerSatisfactionScore: 9.7,
          emotionalHandlingScore: 9.8
        }
      }
    ];

    sampleAgents.forEach(agent => {
      this.agentProfiles.set(agent.id, agent);
    });
  }

  async updateAgentWorkload(agentId: string, increment: number): Promise<void> {
    const agent = this.agentProfiles.get(agentId);
    if (agent) {
      agent.currentWorkload = Math.max(0, agent.currentWorkload + increment);
    }
  }

  async getAgentPerformanceMetrics(): Promise<{ [agentId: string]: any }> {
    const metrics: { [agentId: string]: any } = {};
    
    this.agentProfiles.forEach((agent, agentId) => {
      metrics[agentId] = {
        name: agent.name,
        currentWorkload: agent.currentWorkload,
        emotionalIntelligenceRating: agent.emotionalIntelligenceRating,
        performanceMetrics: agent.performanceMetrics,
        skills: agent.skills.length,
        specializations: agent.specializationAreas
      };
    });

    return metrics;
  }
}

// Export singleton instance
export const intelligentTicketRouting = new IntelligentTicketRouting();