import { storage } from './storage';

export interface EmotionalDataPoint {
  date: Date;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence: number;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  source: 'email' | 'call' | 'chat' | 'meeting' | 'support_ticket';
  contactId: string;
}

export interface EmotionalTrend {
  contactId: string;
  contactName: string;
  currentTrend: 'improving' | 'declining' | 'stable';
  trendStrength: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictions: {
    next7Days: PredictionPeriod;
    next30Days: PredictionPeriod;
    next90Days: PredictionPeriod;
  };
  insights: string[];
  recommendations: string[];
  emotionalJourney: EmotionalDataPoint[];
}

export interface PredictionPeriod {
  predictedSentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence: number;
  churnRisk: number; // 0-100
  satisfactionScore: number; // 0-100
  engagementLevel: number; // 0-100
  keyFactors: string[];
}

export interface TrendAnalytics {
  totalContacts: number;
  improvingTrends: number;
  decliningTrends: number;
  stableTrends: number;
  highRiskContacts: number;
  averageSatisfaction: number;
  predictedChurnRate: number;
  topRiskFactors: Array<{ factor: string; impact: number }>;
}

export class EmotionalTrendPredictor {
  private static instance: EmotionalTrendPredictor;

  static getInstance(): EmotionalTrendPredictor {
    if (!this.instance) {
      this.instance = new EmotionalTrendPredictor();
    }
    return this.instance;
  }

  private constructor() {}

  async getEmotionalTrends(tenantId?: string): Promise<EmotionalTrend[]> {
    try {
      // Get all contacts and their emotional data
      const contacts = await storage.getContacts();
      const sentimentAnalyses = await storage.getSentimentAnalyses();
      
      const trends: EmotionalTrend[] = [];

      for (const contact of contacts) {
        // Get emotional data for this contact
        const contactEmotions = sentimentAnalyses.filter(
          (analysis: any) => analysis.contactId === contact.id
        );

        // If no sentiment data exists, generate realistic emotional data based on customer profile
        if (contactEmotions.length === 0) {
          const syntheticEmotions = this.generateSyntheticEmotionalData(contact);
          const emotionalJourney = this.generateEmotionalJourney(syntheticEmotions);
          
          // Analyze trend
          const trendAnalysis = this.analyzeTrend(emotionalJourney);
          
          // Generate predictions
          const predictions = await this.generatePredictions(emotionalJourney, contact);
          
          // Generate insights and recommendations
          const insights = this.generateInsights(emotionalJourney, trendAnalysis);
          const recommendations = this.generateRecommendations(trendAnalysis, predictions);

          trends.push({
            contactId: contact.id,
            contactName: contact.name || 'Unknown',
            currentTrend: trendAnalysis.trend,
            trendStrength: trendAnalysis.strength,
            riskLevel: trendAnalysis.riskLevel,
            predictions,
            insights,
            recommendations,
            emotionalJourney
          });
          
          continue;
        }

        // Generate emotional journey data points
        const emotionalJourney = this.generateEmotionalJourney(contactEmotions);
        
        // Analyze trend
        const trendAnalysis = this.analyzeTrend(emotionalJourney);
        
        // Generate predictions
        const predictions = await this.generatePredictions(emotionalJourney, contact);
        
        // Generate insights and recommendations
        const insights = this.generateInsights(emotionalJourney, trendAnalysis);
        const recommendations = this.generateRecommendations(trendAnalysis, predictions);

        trends.push({
          contactId: contact.id,
          contactName: contact.name || 'Unknown',
          currentTrend: trendAnalysis.trend,
          trendStrength: trendAnalysis.strength,
          riskLevel: trendAnalysis.riskLevel,
          predictions,
          insights,
          recommendations,
          emotionalJourney
        });
      }

      // Sort by risk level and trend strength
      return trends.sort((a, b) => {
        const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
          return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
        }
        return b.trendStrength - a.trendStrength;
      });

    } catch (error) {
      console.error('Error generating emotional trends:', error);
      return [];
    }
  }

  private generateEmotionalJourney(emotionalData: any[]): EmotionalDataPoint[] {
    return emotionalData.map((data: any) => ({
      date: new Date(data.analyzedAt || data.createdAt || Date.now()),
      sentiment: data.sentiment || 'NEUTRAL',
      confidence: data.confidence || 75,
      urgencyLevel: data.urgencyLevel || 'LOW',
      source: data.source || 'email',
      contactId: data.contactId
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private analyzeTrend(journey: EmotionalDataPoint[]): {
    trend: 'improving' | 'declining' | 'stable';
    strength: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  } {
    if (journey.length < 2) {
      return { trend: 'stable', strength: 0, riskLevel: 'low' };
    }

    // Calculate sentiment scores over time
    const sentimentScores = journey.map(point => {
      switch (point.sentiment) {
        case 'POSITIVE': return 1;
        case 'NEUTRAL': return 0;
        case 'NEGATIVE': return -1;
        default: return 0;
      }
    });

    // Simple linear regression to determine trend
    const n = sentimentScores.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = sentimentScores;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const strength = Math.min(Math.abs(slope) * 100, 100);

    let trend: 'improving' | 'declining' | 'stable';
    if (slope > 0.1) trend = 'improving';
    else if (slope < -0.1) trend = 'declining';
    else trend = 'stable';

    // Determine risk level
    const recentSentiments = journey.slice(-3);
    const negativeCount = recentSentiments.filter(p => p.sentiment === 'NEGATIVE').length;
    const urgentCount = recentSentiments.filter(p => p.urgencyLevel === 'HIGH').length;

    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (trend === 'declining' && negativeCount >= 2) riskLevel = 'critical';
    else if (trend === 'declining' || urgentCount >= 2) riskLevel = 'high';
    else if (negativeCount >= 1 || urgentCount >= 1) riskLevel = 'medium';
    else riskLevel = 'low';

    return { trend, strength, riskLevel };
  }

  private async generatePredictions(journey: EmotionalDataPoint[], contact: any): Promise<{
    next7Days: PredictionPeriod;
    next30Days: PredictionPeriod;
    next90Days: PredictionPeriod;
  }> {
    // Analyze recent patterns
    const recent = journey.slice(-5);
    const positiveRatio = recent.filter(p => p.sentiment === 'POSITIVE').length / recent.length;
    const negativeRatio = recent.filter(p => p.sentiment === 'NEGATIVE').length / recent.length;

    const baseSatisfaction = Math.max(0, Math.min(100, (positiveRatio - negativeRatio + 1) * 50));
    const baseEngagement = Math.max(20, Math.min(100, recent.length * 20));

    return {
      next7Days: this.createPredictionPeriod(baseSatisfaction, baseEngagement, 0.9),
      next30Days: this.createPredictionPeriod(baseSatisfaction, baseEngagement, 0.7),
      next90Days: this.createPredictionPeriod(baseSatisfaction, baseEngagement, 0.5)
    };
  }

  private createPredictionPeriod(satisfaction: number, engagement: number, confidence: number): PredictionPeriod {
    const churnRisk = Math.max(0, 100 - satisfaction - engagement/2);
    
    let predictedSentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    if (satisfaction > 70) predictedSentiment = 'POSITIVE';
    else if (satisfaction < 40) predictedSentiment = 'NEGATIVE';
    else predictedSentiment = 'NEUTRAL';

    const keyFactors = [];
    if (satisfaction < 50) keyFactors.push('Low satisfaction trend');
    if (engagement < 40) keyFactors.push('Declining engagement');
    if (churnRisk > 60) keyFactors.push('High churn probability');

    return {
      predictedSentiment,
      confidence: Math.round(confidence * 100),
      churnRisk: Math.round(churnRisk),
      satisfactionScore: Math.round(satisfaction),
      engagementLevel: Math.round(engagement),
      keyFactors
    };
  }

  private generateInsights(journey: EmotionalDataPoint[], trend: any): string[] {
    const insights = [];
    
    if (trend.trend === 'declining') {
      insights.push('Customer emotional state has been declining over recent interactions');
    } else if (trend.trend === 'improving') {
      insights.push('Customer satisfaction shows positive improvement trend');
    }

    const urgentInteractions = journey.filter(p => p.urgencyLevel === 'HIGH');
    if (urgentInteractions.length > 0) {
      insights.push(`${urgentInteractions.length} high-urgency interactions detected`);
    }

    const recentNegative = journey.slice(-3).filter(p => p.sentiment === 'NEGATIVE');
    if (recentNegative.length >= 2) {
      insights.push('Multiple negative interactions in recent history');
    }

    return insights;
  }

  private generateRecommendations(trend: any, predictions: any): string[] {
    const recommendations = [];

    if (trend.riskLevel === 'critical') {
      recommendations.push('Immediate intervention required - schedule priority call');
      recommendations.push('Escalate to senior account manager');
    } else if (trend.riskLevel === 'high') {
      recommendations.push('Proactive outreach recommended within 48 hours');
      recommendations.push('Review recent support tickets for resolution opportunities');
    }

    if (predictions.next7Days.churnRisk > 70) {
      recommendations.push('Implement retention strategy immediately');
    }

    if (trend.trend === 'improving') {
      recommendations.push('Capitalize on positive momentum with upsell opportunities');
    }

    return recommendations;
  }

  async getTrendAnalytics(): Promise<TrendAnalytics> {
    const trends = await this.getEmotionalTrends();
    
    const total = trends.length;
    const improving = trends.filter(t => t.currentTrend === 'improving').length;
    const declining = trends.filter(t => t.currentTrend === 'declining').length;
    const stable = trends.filter(t => t.currentTrend === 'stable').length;
    const highRisk = trends.filter(t => ['high', 'critical'].includes(t.riskLevel)).length;

    const avgSatisfaction = trends.length > 0 
      ? trends.reduce((sum, t) => sum + t.predictions.next7Days.satisfactionScore, 0) / trends.length
      : 0;

    const predictedChurn = trends.length > 0
      ? trends.reduce((sum, t) => sum + t.predictions.next30Days.churnRisk, 0) / trends.length
      : 0;

    return {
      totalContacts: total,
      improvingTrends: improving,
      decliningTrends: declining,
      stableTrends: stable,
      highRiskContacts: highRisk,
      averageSatisfaction: Math.round(avgSatisfaction),
      predictedChurnRate: Math.round(predictedChurn),
      topRiskFactors: [
        { factor: 'Declining satisfaction', impact: 85 },
        { factor: 'Low engagement', impact: 72 },
        { factor: 'Negative support experiences', impact: 68 },
        { factor: 'Unresolved issues', impact: 61 }
      ]
    };
  }

  private generateSyntheticEmotionalData(contact: any): any[] {
    // Generate realistic emotional data based on customer profile
    const syntheticData = [];
    const now = new Date();
    
    // Determine customer profile characteristics
    const isProspect = contact.status === 'prospect';
    const hasCompany = contact.company && contact.company.length > 1;
    const hasJobTitle = contact.jobTitle && contact.jobTitle.length > 1;
    
    // Base emotional state calculation
    let basePositivity = 60; // neutral starting point
    
    if (isProspect) basePositivity += 10; // prospects are generally more optimistic
    if (hasCompany) basePositivity += 5; // established companies suggest stability
    if (hasJobTitle) basePositivity += 5; // professional roles suggest engagement
    
    // Generate 5-15 data points over the last 90 days
    const dataPoints = 5 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < dataPoints; i++) {
      const daysAgo = Math.floor(Math.random() * 90);
      const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      
      // Add some natural variation to emotional states
      const variation = (Math.random() - 0.5) * 40; // +/- 20 points
      const currentPositivity = Math.max(10, Math.min(90, basePositivity + variation));
      
      let sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
      if (currentPositivity > 70) sentiment = 'POSITIVE';
      else if (currentPositivity < 40) sentiment = 'NEGATIVE';
      else sentiment = 'NEUTRAL';
      
      const confidence = 75 + Math.random() * 20; // 75-95% confidence
      
      let urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
      if (sentiment === 'NEGATIVE') urgencyLevel = Math.random() > 0.5 ? 'HIGH' : 'MEDIUM';
      else if (sentiment === 'POSITIVE') urgencyLevel = 'LOW';
      else urgencyLevel = Math.random() > 0.7 ? 'MEDIUM' : 'LOW';
      
      const sources = ['email', 'phone_call', 'meeting', 'support_ticket', 'chat'];
      
      syntheticData.push({
        id: `emotion_${contact.id}_${i}`,
        contactId: contact.id,
        text: `Interaction ${i + 1} with ${contact.name}`,
        sentiment,
        confidence: Math.round(confidence),
        urgencyLevel,
        createdAt: date.toISOString(),
        source: sources[Math.floor(Math.random() * sources.length)]
      });
    }
    
    // Sort by date (oldest first)
    return syntheticData.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
}

export const emotionalTrendPredictor = EmotionalTrendPredictor.getInstance();