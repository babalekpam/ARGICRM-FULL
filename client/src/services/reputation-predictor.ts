interface ReputationData {
  date: Date;
  rating: number;
  reviewCount: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  responseRate: number;
  responseTime: number; // hours
  platform: string;
  keywords: string[];
}

interface PredictionFactors {
  seasonality: number;
  trendMomentum: number;
  responseEffectiveness: number;
  competitorImpact: number;
  marketConditions: number;
  contentQuality: number;
  customerSatisfaction: number;
}

export interface ReputationPrediction {
  predictedRating: number;
  confidence: number;
  timeframe: '1_week' | '1_month' | '3_months' | '6_months';
  factors: PredictionFactors;
  recommendations: string[];
  risks: string[];
  opportunities: string[];
  scenarioAnalysis: {
    bestCase: number;
    worstCase: number;
    mostLikely: number;
  };
}

interface TrendAnalysis {
  direction: 'improving' | 'declining' | 'stable';
  velocity: number; // rate of change
  volatility: number; // consistency of reviews
  momentum: number; // acceleration
}

export class ReputationScorePredictor {
  private static instance: ReputationScorePredictor;
  private historicalData: ReputationData[] = [];
  private predictionModels: Map<string, any> = new Map();

  static getInstance(): ReputationScorePredictor {
    if (!ReputationScorePredictor.instance) {
      ReputationScorePredictor.instance = new ReputationScorePredictor();
    }
    return ReputationScorePredictor.instance;
  }

  constructor() {
    this.initializeModels();
    this.generateSampleData();
  }

  private initializeModels() {
    // Initialize different prediction models
    this.predictionModels.set('linear_regression', {
      weights: { rating: 0.4, responseRate: 0.25, responseTime: -0.15, sentiment: 0.3 },
      accuracy: 0.78
    });

    this.predictionModels.set('seasonal_model', {
      seasonalFactors: {
        'Q1': 0.95, 'Q2': 1.05, 'Q3': 1.02, 'Q4': 0.98
      },
      accuracy: 0.82
    });

    this.predictionModels.set('sentiment_model', {
      sentimentWeights: { positive: 1.2, neutral: 1.0, negative: 0.6 },
      accuracy: 0.75
    });
  }

  private generateSampleData() {
    const startDate = new Date(2024, 0, 1);
    const platforms = ['Google', 'Yelp', 'Facebook', 'TripAdvisor', 'Trustpilot'];
    
    for (let i = 0; i < 180; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      platforms.forEach(platform => {
        this.historicalData.push({
          date,
          rating: 3.8 + Math.random() * 1.4 + Math.sin(i / 30) * 0.3,
          reviewCount: Math.floor(Math.random() * 10) + 1,
          sentiment: Math.random() > 0.7 ? 'positive' : Math.random() > 0.15 ? 'neutral' : 'negative',
          responseRate: 0.6 + Math.random() * 0.4,
          responseTime: 2 + Math.random() * 12,
          platform,
          keywords: this.generateRandomKeywords()
        });
      });
    }
  }

  private generateRandomKeywords(): string[] {
    const allKeywords = [
      'professional', 'responsive', 'quality', 'excellent', 'fast',
      'slow', 'expensive', 'poor', 'helpful', 'friendly',
      'communication', 'service', 'support', 'delivery', 'timing'
    ];
    
    const count = Math.floor(Math.random() * 3) + 1;
    return allKeywords.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  public async predictReputationScore(timeframe: '1_week' | '1_month' | '3_months' | '6_months'): Promise<ReputationPrediction> {
    const recentData = this.getRecentData(30);
    const trendAnalysis = this.analyzeTrends(recentData);
    const factors = this.calculatePredictionFactors(recentData, trendAnalysis);
    
    const basePrediction = this.calculateBasePrediction(recentData, timeframe);
    const adjustedPrediction = this.applyFactors(basePrediction, factors);
    
    const confidence = this.calculateConfidence(recentData, trendAnalysis);
    const scenarios = this.generateScenarios(adjustedPrediction, confidence);
    
    return {
      predictedRating: adjustedPrediction,
      confidence,
      timeframe,
      factors,
      recommendations: this.generateRecommendations(factors, trendAnalysis),
      risks: this.identifyRisks(factors, trendAnalysis),
      opportunities: this.identifyOpportunities(factors, trendAnalysis),
      scenarioAnalysis: scenarios
    };
  }

  private getRecentData(days: number): ReputationData[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.historicalData.filter(data => data.date >= cutoffDate);
  }

  private analyzeTrends(data: ReputationData[]): TrendAnalysis {
    const ratings = data.map(d => d.rating);
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    
    // Calculate trend direction and velocity
    const recentRatings = ratings.slice(-7); // Last week
    const earlierRatings = ratings.slice(-14, -7); // Previous week
    
    const recentAvg = recentRatings.reduce((sum, r) => sum + r, 0) / recentRatings.length;
    const earlierAvg = earlierRatings.reduce((sum, r) => sum + r, 0) / earlierRatings.length;
    
    const velocity = recentAvg - earlierAvg;
    const direction = velocity > 0.1 ? 'improving' : velocity < -0.1 ? 'declining' : 'stable';
    
    // Calculate volatility (standard deviation)
    const variance = ratings.reduce((sum, r) => sum + Math.pow(r - avgRating, 2), 0) / ratings.length;
    const volatility = Math.sqrt(variance);
    
    // Calculate momentum (acceleration)
    const momentum = this.calculateMomentum(ratings);
    
    return { direction, velocity, volatility, momentum };
  }

  private calculateMomentum(ratings: number[]): number {
    if (ratings.length < 6) return 0;
    
    const recent = ratings.slice(-3);
    const middle = ratings.slice(-6, -3);
    
    const recentAvg = recent.reduce((sum, r) => sum + r, 0) / recent.length;
    const middleAvg = middle.reduce((sum, r) => sum + r, 0) / middle.length;
    
    return recentAvg - middleAvg;
  }

  private calculatePredictionFactors(data: ReputationData[], trends: TrendAnalysis): PredictionFactors {
    const avgResponseRate = data.reduce((sum, d) => sum + d.responseRate, 0) / data.length;
    const avgResponseTime = data.reduce((sum, d) => sum + d.responseTime, 0) / data.length;
    
    const sentimentScore = this.calculateSentimentScore(data);
    const seasonalityFactor = this.getSeasonalityFactor();
    
    return {
      seasonality: seasonalityFactor,
      trendMomentum: Math.max(0, Math.min(1, (trends.momentum + 1) / 2)),
      responseEffectiveness: avgResponseRate * (1 - avgResponseTime / 24),
      competitorImpact: 0.8 + Math.random() * 0.4, // Simulated competitor impact
      marketConditions: 0.9 + Math.random() * 0.2, // Simulated market conditions
      contentQuality: sentimentScore,
      customerSatisfaction: data.reduce((sum, d) => sum + d.rating, 0) / data.length / 5
    };
  }

  private calculateSentimentScore(data: ReputationData[]): number {
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    data.forEach(d => sentimentCounts[d.sentiment]++);
    
    const total = data.length;
    return (sentimentCounts.positive * 1 + sentimentCounts.neutral * 0.5) / total;
  }

  private getSeasonalityFactor(): number {
    const month = new Date().getMonth();
    const quarter = Math.floor(month / 3);
    const seasonalFactors = [0.95, 1.05, 1.02, 0.98]; // Q1, Q2, Q3, Q4
    return seasonalFactors[quarter];
  }

  private calculateBasePrediction(data: ReputationData[], timeframe: string): number {
    const currentAvg = data.reduce((sum, d) => sum + d.rating, 0) / data.length;
    const model = this.predictionModels.get('linear_regression');
    
    const avgResponseRate = data.reduce((sum, d) => sum + d.responseRate, 0) / data.length;
    const avgResponseTime = data.reduce((sum, d) => sum + d.responseTime, 0) / data.length;
    const sentimentScore = this.calculateSentimentScore(data);
    
    const timeMultiplier = this.getTimeMultiplier(timeframe);
    
    return currentAvg + 
           (model.weights.responseRate * avgResponseRate * timeMultiplier) +
           (model.weights.responseTime * (1 - avgResponseTime / 24) * timeMultiplier) +
           (model.weights.sentiment * sentimentScore * timeMultiplier);
  }

  private getTimeMultiplier(timeframe: string): number {
    const multipliers = {
      '1_week': 0.1,
      '1_month': 0.3,
      '3_months': 0.7,
      '6_months': 1.0
    };
    return multipliers[timeframe] || 0.5;
  }

  private applyFactors(basePrediction: number, factors: PredictionFactors): number {
    let adjusted = basePrediction;
    
    adjusted *= factors.seasonality;
    adjusted += (factors.trendMomentum - 0.5) * 0.5;
    adjusted += (factors.responseEffectiveness - 0.5) * 0.3;
    adjusted += (factors.contentQuality - 0.5) * 0.4;
    
    return Math.max(1, Math.min(5, adjusted));
  }

  private calculateConfidence(data: ReputationData[], trends: TrendAnalysis): number {
    const dataQuality = Math.min(1, data.length / 30); // More data = higher confidence
    const trendStability = 1 - trends.volatility; // Less volatility = higher confidence
    const modelAccuracy = 0.78; // Average model accuracy
    
    return Math.max(0.3, Math.min(0.95, (dataQuality + trendStability + modelAccuracy) / 3));
  }

  private generateScenarios(prediction: number, confidence: number): {
    bestCase: number;
    worstCase: number;
    mostLikely: number;
  } {
    const variance = (1 - confidence) * 0.8; // Higher confidence = lower variance
    
    return {
      mostLikely: prediction,
      bestCase: Math.min(5, prediction + variance),
      worstCase: Math.max(1, prediction - variance)
    };
  }

  private generateRecommendations(factors: PredictionFactors, trends: TrendAnalysis): string[] {
    const recommendations: string[] = [];
    
    if (factors.responseEffectiveness < 0.7) {
      recommendations.push("Improve response rate and reduce response time to boost reputation");
    }
    
    if (factors.contentQuality < 0.6) {
      recommendations.push("Focus on addressing negative sentiment in reviews");
    }
    
    if (trends.direction === 'declining') {
      recommendations.push("Implement immediate reputation recovery strategies");
    }
    
    if (factors.customerSatisfaction < 0.8) {
      recommendations.push("Enhance customer service training and processes");
    }
    
    recommendations.push("Monitor competitor activities and market trends closely");
    recommendations.push("Encourage satisfied customers to leave positive reviews");
    
    return recommendations;
  }

  private identifyRisks(factors: PredictionFactors, trends: TrendAnalysis): string[] {
    const risks: string[] = [];
    
    if (trends.direction === 'declining') {
      risks.push("Reputation score declining - immediate action required");
    }
    
    if (factors.responseEffectiveness < 0.5) {
      risks.push("Poor response management may accelerate reputation decline");
    }
    
    if (trends.volatility > 0.5) {
      risks.push("High review volatility indicates unstable reputation");
    }
    
    if (factors.competitorImpact < 0.7) {
      risks.push("Competitor activities may negatively impact reputation");
    }
    
    return risks;
  }

  private identifyOpportunities(factors: PredictionFactors, trends: TrendAnalysis): string[] {
    const opportunities: string[] = [];
    
    if (trends.direction === 'improving') {
      opportunities.push("Capitalize on positive momentum with targeted marketing");
    }
    
    if (factors.responseEffectiveness > 0.8) {
      opportunities.push("Strong response management - showcase customer service excellence");
    }
    
    if (factors.contentQuality > 0.7) {
      opportunities.push("High-quality reviews - leverage for social proof");
    }
    
    opportunities.push("Optimize review generation during peak satisfaction periods");
    opportunities.push("Develop proactive reputation management strategies");
    
    return opportunities;
  }

  public async getHistoricalAccuracy(): Promise<number> {
    // Simulate model accuracy calculation
    return 0.78;
  }

  public async getModelMetrics(): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  }> {
    return {
      accuracy: 0.78,
      precision: 0.82,
      recall: 0.75,
      f1Score: 0.78
    };
  }
}

export const reputationPredictor = ReputationScorePredictor.getInstance();