import { OpenAI } from 'openai';
import { db } from './db';
import { customers, customerEmotionalProfiles, insertCustomerEmotionalProfileSchema } from '../shared/schema';
import { eq } from 'drizzle-orm';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// OpenRouter client for reliable AI fallback
const openrouter = process.env.OPENROUTER_API_KEY ? new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
}) : null;

export interface EmotionalAnalysis {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence: number;
  emotions: {
    joy: number;
    anger: number;
    sadness: number;
    fear: number;
    surprise: number;
    trust: number;
  };
  urgencyLevel: 'HIGH' | 'NORMAL' | 'LOW';
  satisfactionScore: number;
  stressIndicators: string[];
  recommendedActions: string[];
}

export interface CustomerEmotionalProfile {
  customerId: string;
  primaryEmotion: string;
  sentimentScore: number;
  stressIndicators: string[];
  preferredCommunicationStyle: string;
  emotionalTriggers: string[];
  satisfactionTrend: 'increasing' | 'decreasing' | 'stable';
  churnRisk: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class EmotionalIntelligenceEngine {
  private sentimentCache = new Map<string, EmotionalAnalysis>();

  async analyzeCustomerCommunication(text: string, customerId?: string): Promise<EmotionalAnalysis> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(text);
      if (this.sentimentCache.has(cacheKey)) {
        return this.sentimentCache.get(cacheKey)!;
      }

      if (!openai) {
        throw new Error('OPENAI_API_KEY not configured - Emotional Intelligence features unavailable');
      }

      // Use OpenAI for advanced sentiment and emotion analysis
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an advanced emotional intelligence AI that analyzes customer communications. 
            Analyze the following text and return a JSON response with:
            - sentiment: POSITIVE, NEGATIVE, or NEUTRAL
            - confidence: 0-1 score
            - emotions: object with joy, anger, sadness, fear, surprise, trust scores (0-1)
            - urgencyLevel: HIGH, NORMAL, or LOW
            - satisfactionScore: 0-1 overall satisfaction
            - stressIndicators: array of detected stress signals
            - recommendedActions: array of suggested response strategies
            
            Focus on business context and customer service implications.`
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content!) as EmotionalAnalysis;
      
      // Cache the result
      this.sentimentCache.set(cacheKey, analysis);
      
      // Store in database if customer ID provided
      if (customerId) {
        await this.updateCustomerEmotionalProfile(customerId, analysis);
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing customer communication:', error);
      // Try OpenRouter as reliable fallback before local analysis
      try {
        return await this.analyzeWithOpenRouter(text, customerId);
      } catch (fallbackError) {
        console.error('OpenRouter fallback also failed:', fallbackError);
        // Use intelligent local fallback analysis as last resort
        return this.performLocalEmotionalAnalysis(text);
      }
    }
  }

  async analyzeVoiceEmotion(audioTranscript: string, customerId?: string): Promise<EmotionalAnalysis> {
    // Enhanced analysis for voice communications
    const baseAnalysis = await this.analyzeCustomerCommunication(audioTranscript, customerId);
    
    if (!openai) {
      return baseAnalysis; // Return base analysis if OpenAI not configured
    }
    
    // Voice-specific analysis enhancements
    const voiceEnhancement = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Analyze this voice call transcript for additional emotional indicators:
          - Speaking pace indicators
          - Repetition patterns
          - Interruption frequency
          - Question vs statement ratio
          Return voice-specific insights as JSON.`
        },
        {
          role: "user",
          content: audioTranscript
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const voiceInsights = JSON.parse(voiceEnhancement.choices[0].message.content!);
    
    return {
      ...baseAnalysis,
      stressIndicators: [
        ...baseAnalysis.stressIndicators,
        ...(voiceInsights.voiceStressIndicators || [])
      ],
      recommendedActions: [
        ...baseAnalysis.recommendedActions,
        ...(voiceInsights.voiceRecommendations || [])
      ]
    };
  }

  async predictChurnRisk(customerId: string): Promise<{
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    confidence: number;
    factors: string[];
    recommendedInterventions: string[];
  }> {
    try {
      // Get customer's emotional history
      const emotionalHistory = await db
        .select()
        .from(customerEmotionalProfiles)
        .where(eq(customerEmotionalProfiles.customerId, customerId))
        .orderBy(customerEmotionalProfiles.interactionDate)
        .limit(10);

      if (emotionalHistory.length === 0) {
        return {
          riskLevel: 'LOW',
          confidence: 0.3,
          factors: ['Insufficient data'],
          recommendedInterventions: ['Collect more interaction data']
        };
      }

      // Analyze emotional trends
      const recentNegative = emotionalHistory.filter(h => h.sentimentScore < 0.4).length;
      const satisfactionTrend = this.calculateSatisfactionTrend(emotionalHistory);
      const stressLevel = this.calculateOverallStressLevel(emotionalHistory);

      const churnFactors = [];
      let riskScore = 0;

      if (recentNegative > emotionalHistory.length * 0.6) {
        churnFactors.push('High frequency of negative interactions');
        riskScore += 0.4;
      }

      if (satisfactionTrend === 'decreasing') {
        churnFactors.push('Declining satisfaction trend');
        riskScore += 0.3;
      }

      if (stressLevel > 0.7) {
        churnFactors.push('High stress indicators');
        riskScore += 0.2;
      }

      if (!openai) {
        // Return basic risk assessment if OpenAI not configured
        const finalRiskScore = riskScore;
        return {
          riskLevel: finalRiskScore > 0.7 ? 'HIGH' : finalRiskScore > 0.4 ? 'MEDIUM' : 'LOW',
          confidence: finalRiskScore * 0.7, // Lower confidence without AI
          factors: churnFactors,
          recommendedInterventions: ['Manual review recommended']
        };
      }

      // Use AI for advanced pattern recognition
      const aiPrediction = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Analyze customer emotional data for churn prediction. Return JSON with:
            - additionalFactors: array of risk factors
            - interventions: array of recommended actions
            - confidenceAdjustment: -0.2 to +0.2 to adjust base confidence`
          },
          {
            role: "user",
            content: JSON.stringify({
              emotionalHistory: emotionalHistory.slice(-5),
              currentRiskScore: riskScore,
              identifiedFactors: churnFactors
            })
          }
        ],
        response_format: { type: "json_object" }
      });

      const aiInsights = JSON.parse(aiPrediction.choices[0].message.content!);
      
      const finalRiskScore = Math.min(1, Math.max(0, riskScore + (aiInsights.confidenceAdjustment || 0)));
      
      return {
        riskLevel: finalRiskScore > 0.7 ? 'HIGH' : finalRiskScore > 0.4 ? 'MEDIUM' : 'LOW',
        confidence: finalRiskScore,
        factors: [...churnFactors, ...(aiInsights.additionalFactors || [])],
        recommendedInterventions: aiInsights.interventions || []
      };

    } catch (error) {
      console.error('Error predicting churn risk:', error);
      return {
        riskLevel: 'LOW',
        confidence: 0.3,
        factors: ['Error in analysis'],
        recommendedInterventions: ['Manual review required']
      };
    }
  }

  async generateEmpatheticResponse(
    customerMessage: string,
    emotionalAnalysis: EmotionalAnalysis,
    context?: string
  ): Promise<{
    response: string;
    tone: string;
    urgency: string;
    followUpActions: string[];
  }> {
    try {
      if (!openai) {
        throw new Error('OPENAI_API_KEY not configured');
      }
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a customer service AI that generates empathetic, contextually appropriate responses.
            
            Based on the customer's emotional state, generate a response that:
            1. Acknowledges their emotions appropriately
            2. Uses the right tone for their emotional state
            3. Provides helpful solutions
            4. Suggests follow-up actions
            
            Customer emotional state: ${JSON.stringify(emotionalAnalysis)}
            Context: ${context || 'General customer inquiry'}
            
            Return JSON with: response, tone, urgency, followUpActions array`
          },
          {
            role: "user",
            content: customerMessage
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4
      });

      return JSON.parse(response.choices[0].message.content!);
    } catch (error) {
      console.error('Error generating empathetic response:', error);
      return {
        response: "Thank you for your message. We're here to help and will get back to you shortly.",
        tone: "professional",
        urgency: "normal",
        followUpActions: ["Follow standard response protocol"]
      };
    }
  }

  async scoreOpportunity(customerId: string, interactionHistory: any[]): Promise<{
    opportunityScore: number;
    bestApproach: string;
    optimalContactTime: string;
    emotionalFactors: any;
  }> {
    try {
      // Get customer emotional profile
      const profile = await this.getCustomerEmotionalProfile(customerId);
      
      const emotionalFactors = {
        enthusiasmLevel: profile?.satisfactionTrend === 'increasing' ? 0.8 : 0.4,
        trustIndicators: profile?.sentimentScore || 0.5,
        urgencySignals: profile?.stressIndicators?.length || 0,
        satisfactionWithDemos: this.calculateDemoSatisfaction(interactionHistory)
      };

      // Calculate weighted score
      const score = (
        emotionalFactors.enthusiasmLevel * 0.3 +
        emotionalFactors.trustIndicators * 0.3 +
        (1 - emotionalFactors.urgencySignals / 10) * 0.2 +
        emotionalFactors.satisfactionWithDemos * 0.2
      );

      if (!openai) {
        // Return basic recommendation if OpenAI not configured
        return {
          opportunityScore: score,
          bestApproach: 'Standard sales approach',
          optimalContactTime: 'Business hours',
          emotionalFactors
        };
      }

      // AI-powered approach recommendation
      const aiRecommendation = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Recommend sales approach based on customer emotional profile. Return JSON with:
            - bestApproach: recommended sales strategy
            - optimalContactTime: best time to contact
            - reasoning: explanation of recommendations`
          },
          {
            role: "user",
            content: JSON.stringify({ profile, emotionalFactors, score })
          }
        ],
        response_format: { type: "json_object" }
      });

      const recommendations = JSON.parse(aiRecommendation.choices[0].message.content!);

      return {
        opportunityScore: score,
        bestApproach: recommendations.bestApproach,
        optimalContactTime: recommendations.optimalContactTime,
        emotionalFactors
      };
    } catch (error) {
      console.error('Error scoring opportunity:', error);
      return {
        opportunityScore: 0.5,
        bestApproach: "consultative",
        optimalContactTime: "business_hours",
        emotionalFactors: {}
      };
    }
  }

  private async updateCustomerEmotionalProfile(customerId: string, analysis: EmotionalAnalysis): Promise<void> {
    try {
      const profileData = {
        customerId,
        interactionDate: new Date(),
        primaryEmotion: this.getPrimaryEmotion(analysis.emotions),
        sentimentScore: analysis.confidence,
        stressIndicators: analysis.stressIndicators,
        preferredCommunicationStyle: this.inferCommunicationStyle(analysis),
        emotionalTriggers: this.identifyTriggers(analysis),
        satisfactionTrend: this.calculateTrend(analysis.satisfactionScore)
      };

      await db.insert(customerEmotionalProfiles).values(profileData);
    } catch (error) {
      console.error('Error updating customer emotional profile:', error);
    }
  }

  private async getCustomerEmotionalProfile(customerId: string): Promise<any> {
    try {
      const profiles = await db
        .select()
        .from(customerEmotionalProfiles)
        .where(eq(customerEmotionalProfiles.customerId, customerId))
        .orderBy(customerEmotionalProfiles.interactionDate)
        .limit(1);
      
      return profiles[0] || null;
    } catch (error) {
      console.error('Error getting customer emotional profile:', error);
      return null;
    }
  }

  private generateCacheKey(text: string): string {
    return `emotion_${Buffer.from(text).toString('base64').slice(0, 32)}`;
  }

  private getPrimaryEmotion(emotions: any): string {
    return Object.entries(emotions).reduce((a, b) => 
      emotions[a[0] as keyof typeof emotions] > emotions[b[0] as keyof typeof emotions] ? a : b
    )[0];
  }

  private inferCommunicationStyle(analysis: EmotionalAnalysis): string {
    if (analysis.emotions.trust > 0.6) return 'direct';
    if (analysis.emotions.fear > 0.4) return 'reassuring';
    if (analysis.emotions.anger > 0.5) return 'calm_professional';
    return 'friendly_professional';
  }

  private identifyTriggers(analysis: EmotionalAnalysis): string[] {
    const triggers = [];
    if (analysis.emotions.anger > 0.5) triggers.push('delays');
    if (analysis.emotions.fear > 0.4) triggers.push('complexity');
    if (analysis.emotions.sadness > 0.4) triggers.push('disappointment');
    return triggers;
  }

  private calculateTrend(score: number): 'increasing' | 'decreasing' | 'stable' {
    if (score > 0.7) return 'increasing';
    if (score < 0.4) return 'decreasing';
    return 'stable';
  }

  private calculateSatisfactionTrend(history: any[]): 'increasing' | 'decreasing' | 'stable' {
    if (history.length < 2) return 'stable';
    
    const recent = history.slice(-3).map(h => h.sentimentScore);
    const older = history.slice(-6, -3).map(h => h.sentimentScore);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    if (recentAvg > olderAvg + 0.1) return 'increasing';
    if (recentAvg < olderAvg - 0.1) return 'decreasing';
    return 'stable';
  }

  private calculateOverallStressLevel(history: any[]): number {
    const stressCount = history.reduce((sum, h) => sum + (h.stressIndicators?.length || 0), 0);
    return Math.min(1, stressCount / (history.length * 3));
  }

  private calculateDemoSatisfaction(interactionHistory: any[]): number {
    const demoInteractions = interactionHistory.filter(i => 
      i.type === 'demo' || i.content?.toLowerCase().includes('demo')
    );
    
    if (demoInteractions.length === 0) return 0.5;
    
    const avgSentiment = demoInteractions.reduce((sum, i) => 
      sum + (i.sentimentScore || 0.5), 0
    ) / demoInteractions.length;
    
    return avgSentiment;
  }

  // OpenRouter fallback analysis method
  async analyzeWithOpenRouter(text: string, customerId?: string): Promise<EmotionalAnalysis> {
    console.log('📡 Using OpenRouter AI fallback for emotional analysis...');
    
    // Check cache first
    const cacheKey = this.generateCacheKey(text);
    if (this.sentimentCache.has(cacheKey)) {
      return this.sentimentCache.get(cacheKey)!;
    }

    if (!openrouter) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    // Use OpenRouter with cost-effective model
    const response = await openrouter.chat.completions.create({
      model: "meta-llama/llama-3.2-3b-instruct:free", // Free reliable model via OpenRouter
      messages: [
        {
          role: "system",
          content: `You are an advanced emotional intelligence AI that analyzes customer communications. 
          Analyze the following text and return a JSON response with:
          - sentiment: POSITIVE, NEGATIVE, or NEUTRAL
          - confidence: 0-1 score
          - emotions: object with joy, anger, sadness, fear, surprise, trust scores (0-1)
          - urgencyLevel: HIGH, NORMAL, or LOW
          - satisfactionScore: 0-1 overall satisfaction
          - stressIndicators: array of detected stress signals
          - recommendedActions: array of suggested response strategies
          
          Focus on business context and customer service implications.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3
    });

    const analysis = JSON.parse(response.choices[0].message.content!) as EmotionalAnalysis;
    
    // Cache the result
    this.sentimentCache.set(cacheKey, analysis);
    
    // Store in database if customer ID provided
    if (customerId) {
      await this.updateCustomerEmotionalProfile(customerId, analysis);
    }

    return analysis;
  }

  private performLocalEmotionalAnalysis(text: string): EmotionalAnalysis {
    const lowerText = text.toLowerCase();
    
    // Keyword-based sentiment analysis
    const positiveWords = ['happy', 'great', 'excellent', 'love', 'amazing', 'perfect', 'wonderful', 'fantastic', 'good', 'pleased', 'satisfied', 'thank', 'appreciate'];
    const negativeWords = ['hate', 'terrible', 'awful', 'bad', 'horrible', 'angry', 'frustrated', 'disappointed', 'upset', 'annoyed', 'problem', 'issue', 'error', 'fail'];
    const urgencyWords = ['urgent', 'asap', 'immediately', 'emergency', 'critical', 'help', 'now', 'quickly'];
    const stressWords = ['stressed', 'overwhelmed', 'confused', 'worried', 'concerned', 'anxious'];

    let positiveScore = 0;
    let negativeScore = 0;
    let urgencyScore = 0;
    let stressScore = 0;

    // Count keyword matches
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveScore++;
    });
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeScore++;
    });
    urgencyWords.forEach(word => {
      if (lowerText.includes(word)) urgencyScore++;
    });
    stressWords.forEach(word => {
      if (lowerText.includes(word)) stressScore++;
    });

    // Calculate sentiment
    let sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    if (positiveScore > negativeScore) sentiment = 'POSITIVE';
    else if (negativeScore > positiveScore) sentiment = 'NEGATIVE';
    else sentiment = 'NEUTRAL';

    // Calculate confidence based on keyword strength
    const totalKeywords = positiveScore + negativeScore;
    const confidence = Math.min(0.9, 0.3 + (totalKeywords * 0.15));

    // Calculate emotions based on content analysis
    const emotions = {
      joy: sentiment === 'POSITIVE' ? 0.6 + (positiveScore * 0.1) : 0.2,
      anger: negativeScore > 2 ? 0.7 : negativeScore * 0.2,
      sadness: lowerText.includes('sad') || lowerText.includes('disappointed') ? 0.6 : 0.1,
      fear: stressScore > 0 ? 0.3 + (stressScore * 0.2) : 0.1,
      surprise: lowerText.includes('?') ? 0.4 : 0.2,
      trust: sentiment === 'POSITIVE' ? 0.7 : 0.3
    };

    // Normalize emotions to max 1.0
    Object.keys(emotions).forEach(key => {
      emotions[key as keyof typeof emotions] = Math.min(1.0, emotions[key as keyof typeof emotions]);
    });

    // Determine urgency level
    let urgencyLevel: 'HIGH' | 'NORMAL' | 'LOW';
    if (urgencyScore > 0 || negativeScore > 2) urgencyLevel = 'HIGH';
    else if (positiveScore > 1) urgencyLevel = 'LOW';
    else urgencyLevel = 'NORMAL';

    // Calculate satisfaction score
    const satisfactionScore = Math.max(0, Math.min(1, 0.5 + (positiveScore * 0.15) - (negativeScore * 0.15)));

    // Identify stress indicators
    const stressIndicators: string[] = [];
    if (stressScore > 0) stressIndicators.push('Stress-related language detected');
    if (negativeScore > 1) stressIndicators.push('Multiple negative expressions');
    if (urgencyScore > 0) stressIndicators.push('Urgency indicators present');
    if (text.includes('!!') || text.includes('???')) stressIndicators.push('Emphatic punctuation');

    // Generate recommendations
    const recommendedActions: string[] = [];
    if (sentiment === 'NEGATIVE') {
      recommendedActions.push('Acknowledge concerns and provide immediate assistance');
      recommendedActions.push('Escalate to senior representative if needed');
    }
    if (urgencyLevel === 'HIGH') {
      recommendedActions.push('Prioritize this communication for immediate response');
    }
    if (stressIndicators.length > 0) {
      recommendedActions.push('Use empathetic language and reassuring tone');
    }
    if (sentiment === 'POSITIVE') {
      recommendedActions.push('Maintain momentum and explore additional opportunities');
    }
    if (recommendedActions.length === 0) {
      recommendedActions.push('Follow standard response protocol');
    }

    return {
      sentiment,
      confidence,
      emotions,
      urgencyLevel,
      satisfactionScore,
      stressIndicators,
      recommendedActions
    };
  }
}

// Export singleton instance
export const emotionalIntelligenceEngine = new EmotionalIntelligenceEngine();