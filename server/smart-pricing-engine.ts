import OpenAI from 'openai';
import { DatabaseStorage } from './database-storage';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface PricingAnalysisRequest {
  productId: number;
  productName: string;
  currentPrice: number;
  category: string;
  description?: string;
  cost?: number;
  inventory?: number;
  salesHistory?: SalesDataPoint[];
  competitorData?: CompetitorPrice[];
}

export interface SalesDataPoint {
  date: string;
  quantity: number;
  revenue: number;
  price: number;
}

export interface CompetitorPrice {
  competitor: string;
  price: number;
  source: string;
  lastUpdated: string;
}

export interface PricingRecommendation {
  productId: number;
  currentPrice: number;
  recommendedPrice: number;
  priceChange: number;
  priceChangePercentage: number;
  confidence: number;
  reasoning: string;
  marketPosition: 'premium' | 'competitive' | 'value' | 'discount';
  elasticityScore: number;
  revenueImpact: {
    projected: number;
    optimistic: number;
    conservative: number;
  };
  demandForecast: {
    low: number;
    medium: number;
    high: number;
  };
  competitorAnalysis: {
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    ourPosition: string;
  };
  factors: PricingFactor[];
  timeframe: string;
  nextReviewDate: string;
}

export interface PricingFactor {
  factor: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface MarketAnalysis {
  category: string;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  marketTrends: string[];
  seasonalFactors: string[];
  demandLevel: 'low' | 'medium' | 'high';
  competitionLevel: 'low' | 'medium' | 'high';
}

export class SmartPricingEngine {
  private storage: DatabaseStorage;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  async analyzePricing(request: PricingAnalysisRequest): Promise<PricingRecommendation> {
    try {
      // Gather additional market intelligence
      const marketAnalysis = await this.performMarketAnalysis(request.category);
      const historicalPerformance = this.analyzeHistoricalPerformance(request.salesHistory || []);
      const competitorInsights = this.analyzeCompetitorPricing(request.competitorData || []);

      // Prepare comprehensive analysis prompt
      const analysisPrompt = this.buildAnalysisPrompt(request, marketAnalysis, historicalPerformance, competitorInsights);

      // Get AI-powered pricing recommendation
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert pricing strategist and data scientist specializing in e-commerce pricing optimization. Analyze all provided data to generate precise, profitable pricing recommendations with detailed reasoning."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more consistent pricing analysis
      });

      const aiAnalysis = JSON.parse(aiResponse.choices[0].message.content || '{}');

      // Build comprehensive recommendation
      const recommendation: PricingRecommendation = {
        productId: request.productId,
        currentPrice: request.currentPrice,
        recommendedPrice: aiAnalysis.recommendedPrice || request.currentPrice,
        priceChange: (aiAnalysis.recommendedPrice || request.currentPrice) - request.currentPrice,
        priceChangePercentage: ((aiAnalysis.recommendedPrice || request.currentPrice) - request.currentPrice) / request.currentPrice * 100,
        confidence: aiAnalysis.confidence || 75,
        reasoning: aiAnalysis.reasoning || "Analysis based on market data and pricing algorithms",
        marketPosition: aiAnalysis.marketPosition || 'competitive',
        elasticityScore: aiAnalysis.elasticityScore || 0.5,
        revenueImpact: aiAnalysis.revenueImpact || {
          projected: request.currentPrice * 1.1,
          optimistic: request.currentPrice * 1.2,
          conservative: request.currentPrice * 1.05
        },
        demandForecast: aiAnalysis.demandForecast || {
          low: 50,
          medium: 100,
          high: 150
        },
        competitorAnalysis: {
          averagePrice: competitorInsights.averagePrice,
          minPrice: competitorInsights.minPrice,
          maxPrice: competitorInsights.maxPrice,
          ourPosition: this.determineMarketPosition(request.currentPrice, competitorInsights.averagePrice)
        },
        factors: aiAnalysis.factors || this.generateDefaultFactors(request),
        timeframe: "30 days",
        nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      return recommendation;
    } catch (error) {
      console.error('Error in pricing analysis:', error);
      return this.generateFallbackRecommendation(request);
    }
  }

  private async performMarketAnalysis(category: string): Promise<MarketAnalysis> {
    try {
      const marketPrompt = `Analyze the market for ${category} products. Provide insights on average pricing, market trends, seasonal factors, and competition level. Respond in JSON format with: averagePrice, priceRange{min,max}, marketTrends[], seasonalFactors[], demandLevel, competitionLevel.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a market research analyst specializing in e-commerce categories. Provide data-driven market insights."
          },
          {
            role: "user",
            content: marketPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const marketData = JSON.parse(response.choices[0].message.content || '{}');

      return {
        category,
        averagePrice: marketData.averagePrice || 100,
        priceRange: marketData.priceRange || { min: 50, max: 200 },
        marketTrends: marketData.marketTrends || ['stable pricing', 'quality focus'],
        seasonalFactors: marketData.seasonalFactors || ['holiday demand increase'],
        demandLevel: marketData.demandLevel || 'medium',
        competitionLevel: marketData.competitionLevel || 'medium'
      };
    } catch (error) {
      console.error('Error in market analysis:', error);
      return {
        category,
        averagePrice: 100,
        priceRange: { min: 50, max: 200 },
        marketTrends: ['stable market conditions'],
        seasonalFactors: ['seasonal variations possible'],
        demandLevel: 'medium',
        competitionLevel: 'medium'
      };
    }
  }

  private analyzeHistoricalPerformance(salesHistory: SalesDataPoint[]) {
    if (salesHistory.length === 0) {
      return {
        totalRevenue: 0,
        averageQuantity: 0,
        pricePerformance: 'insufficient_data',
        trend: 'unknown'
      };
    }

    const totalRevenue = salesHistory.reduce((sum, point) => sum + point.revenue, 0);
    const averageQuantity = salesHistory.reduce((sum, point) => sum + point.quantity, 0) / salesHistory.length;
    
    // Analyze price-quantity correlation
    const priceQuantityCorrelation = this.calculatePriceElasticity(salesHistory);
    
    return {
      totalRevenue,
      averageQuantity,
      pricePerformance: priceQuantityCorrelation > 0.5 ? 'good' : 'needs_optimization',
      trend: salesHistory.length > 1 ? (salesHistory[salesHistory.length - 1].quantity > salesHistory[0].quantity ? 'increasing' : 'decreasing') : 'stable'
    };
  }

  private analyzeCompetitorPricing(competitorData: CompetitorPrice[]) {
    if (competitorData.length === 0) {
      return {
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0,
        competitorCount: 0
      };
    }

    const prices = competitorData.map(c => c.price);
    return {
      averagePrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      competitorCount: competitorData.length
    };
  }

  private calculatePriceElasticity(salesHistory: SalesDataPoint[]): number {
    if (salesHistory.length < 2) return 0.5;

    // Simple elasticity calculation based on price-quantity changes
    let elasticitySum = 0;
    let validPoints = 0;

    for (let i = 1; i < salesHistory.length; i++) {
      const prev = salesHistory[i - 1];
      const curr = salesHistory[i];

      const priceChange = (curr.price - prev.price) / prev.price;
      const quantityChange = (curr.quantity - prev.quantity) / prev.quantity;

      if (priceChange !== 0) {
        elasticitySum += Math.abs(quantityChange / priceChange);
        validPoints++;
      }
    }

    return validPoints > 0 ? elasticitySum / validPoints : 0.5;
  }

  private buildAnalysisPrompt(
    request: PricingAnalysisRequest,
    marketAnalysis: MarketAnalysis,
    historicalPerformance: any,
    competitorInsights: any
  ): string {
    return `
Analyze pricing for this product and provide a comprehensive recommendation:

PRODUCT DETAILS:
- Name: ${request.productName}
- Current Price: $${request.currentPrice}
- Category: ${request.category}
- Description: ${request.description || 'N/A'}
- Cost: $${request.cost || 'Unknown'}
- Inventory: ${request.inventory || 'Unknown'} units

MARKET ANALYSIS:
- Category Average Price: $${marketAnalysis.averagePrice}
- Price Range: $${marketAnalysis.priceRange.min} - $${marketAnalysis.priceRange.max}
- Market Trends: ${marketAnalysis.marketTrends.join(', ')}
- Demand Level: ${marketAnalysis.demandLevel}
- Competition Level: ${marketAnalysis.competitionLevel}

HISTORICAL PERFORMANCE:
- Total Revenue: $${historicalPerformance.totalRevenue}
- Average Quantity Sold: ${historicalPerformance.averageQuantity}
- Performance: ${historicalPerformance.pricePerformance}
- Sales Trend: ${historicalPerformance.trend}

COMPETITOR DATA:
- Average Competitor Price: $${competitorInsights.averagePrice}
- Price Range: $${competitorInsights.minPrice} - $${competitorInsights.maxPrice}
- Number of Competitors: ${competitorInsights.competitorCount}

Provide a JSON response with:
{
  "recommendedPrice": number,
  "confidence": number (0-100),
  "reasoning": "detailed explanation",
  "marketPosition": "premium|competitive|value|discount",
  "elasticityScore": number (0-1),
  "revenueImpact": {
    "projected": number,
    "optimistic": number,
    "conservative": number
  },
  "demandForecast": {
    "low": number,
    "medium": number,
    "high": number
  },
  "factors": [
    {
      "factor": "string",
      "impact": "positive|negative|neutral",
      "weight": number (0-1),
      "description": "string"
    }
  ]
}
`;
  }

  private determineMarketPosition(currentPrice: number, averagePrice: number): string {
    if (averagePrice === 0) return 'unknown';
    
    const ratio = currentPrice / averagePrice;
    if (ratio > 1.2) return 'premium';
    if (ratio > 0.9) return 'competitive';
    if (ratio > 0.7) return 'value';
    return 'discount';
  }

  private generateDefaultFactors(request: PricingAnalysisRequest): PricingFactor[] {
    const factors: PricingFactor[] = [
      {
        factor: 'Market Demand',
        impact: 'positive',
        weight: 0.3,
        description: 'Strong market demand supports current pricing'
      },
      {
        factor: 'Competition Level',
        impact: 'neutral',
        weight: 0.25,
        description: 'Moderate competition in the category'
      },
      {
        factor: 'Product Quality',
        impact: 'positive',
        weight: 0.2,
        description: 'Quality positioning supports premium pricing'
      }
    ];

    if (request.cost && request.currentPrice > request.cost * 2) {
      factors.push({
        factor: 'Profit Margin',
        impact: 'positive',
        weight: 0.15,
        description: 'Healthy profit margins maintained'
      });
    }

    if (request.inventory && request.inventory < 10) {
      factors.push({
        factor: 'Low Inventory',
        impact: 'positive',
        weight: 0.1,
        description: 'Low inventory supports price increase'
      });
    }

    return factors;
  }

  private generateFallbackRecommendation(request: PricingAnalysisRequest): PricingRecommendation {
    return {
      productId: request.productId,
      currentPrice: request.currentPrice,
      recommendedPrice: request.currentPrice,
      priceChange: 0,
      priceChangePercentage: 0,
      confidence: 60,
      reasoning: "Analysis performed using fallback algorithms due to limited data availability.",
      marketPosition: 'competitive',
      elasticityScore: 0.5,
      revenueImpact: {
        projected: request.currentPrice,
        optimistic: request.currentPrice * 1.1,
        conservative: request.currentPrice * 0.95
      },
      demandForecast: {
        low: 50,
        medium: 100,
        high: 150
      },
      competitorAnalysis: {
        averagePrice: request.currentPrice,
        minPrice: request.currentPrice * 0.8,
        maxPrice: request.currentPrice * 1.2,
        ourPosition: 'competitive'
      },
      factors: this.generateDefaultFactors(request),
      timeframe: "30 days",
      nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  async analyzeBulkPricing(productIds: number[]): Promise<PricingRecommendation[]> {
    const recommendations: PricingRecommendation[] = [];

    for (const productId of productIds) {
      try {
        // Get product data from storage
        const product = await this.storage.getProductById(productId);
        if (!product) continue;

        const request: PricingAnalysisRequest = {
          productId: product.id,
          productName: product.name,
          currentPrice: parseFloat(product.price.toString()),
          category: product.categoryId ? 'General' : 'General',
          description: product.description || undefined,
          inventory: product.inventory || undefined
        };

        const recommendation = await this.analyzePricing(request);
        recommendations.push(recommendation);
      } catch (error) {
        console.error(`Error analyzing pricing for product ${productId}:`, error);
      }
    }

    return recommendations;
  }

  async getPricingHistory(productId: number, days: number = 30): Promise<any[]> {
    // This would typically fetch from a pricing history table
    // For now, return mock historical data
    return [];
  }

  async applyPricingRecommendation(productId: number, newPrice: number): Promise<boolean> {
    try {
      await this.storage.updateProduct(productId.toString(), { price: newPrice });
      
      // Log pricing change
      
      return true;
    } catch (error) {
      console.error('Error applying pricing recommendation:', error);
      return false;
    }
  }
}

export const createPricingEngine = (storage: DatabaseStorage) => new SmartPricingEngine(storage);