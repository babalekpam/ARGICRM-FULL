import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing required OpenAI API key: OPENAI_API_KEY');
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface ProductRecommendation {
  productId: number;
  score: number;
  reason: string;
  category: string;
  pricePoint: 'budget' | 'mid-range' | 'premium';
  tags: string[];
}

export interface CustomerProfile {
  browsedProducts: any[];
  purchaseHistory: any[];
  categories: string[];
  priceRange: { min: number; max: number };
  demographics?: {
    age?: number;
    location?: string;
    interests?: string[];
  };
}

export interface RecommendationRequest {
  customerId?: string;
  currentProduct?: any;
  customerProfile?: CustomerProfile;
  products: any[];
  type: 'similar' | 'complementary' | 'trending' | 'personalized' | 'upsell';
  limit?: number;
}

export class AIProductRecommendationEngine {
  private static instance: AIProductRecommendationEngine;

  static getInstance(): AIProductRecommendationEngine {
    if (!AIProductRecommendationEngine.instance) {
      AIProductRecommendationEngine.instance = new AIProductRecommendationEngine();
    }
    return AIProductRecommendationEngine.instance;
  }

  async generateRecommendations(request: RecommendationRequest): Promise<ProductRecommendation[]> {
    try {
      const prompt = this.buildRecommendationPrompt(request);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert e-commerce product recommendation engine. Analyze customer data and product catalogs to generate highly relevant product recommendations with detailed reasoning."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return this.processAIRecommendations(result, request);
    } catch (error) {
      console.error('AI recommendation error:', error);
      return this.generateFallbackRecommendations(request);
    }
  }

  private buildRecommendationPrompt(request: RecommendationRequest): string {
    const { type, currentProduct, customerProfile, products } = request;
    
    let prompt = `Generate ${type} product recommendations based on the following data:\n\n`;
    
    if (currentProduct) {
      prompt += `Current Product:\n${JSON.stringify(currentProduct, null, 2)}\n\n`;
    }
    
    if (customerProfile) {
      prompt += `Customer Profile:\n${JSON.stringify(customerProfile, null, 2)}\n\n`;
    }
    
    prompt += `Available Products:\n${JSON.stringify(products.slice(0, 20), null, 2)}\n\n`;
    
    prompt += `Recommendation Type: ${type}\n\n`;
    
    switch (type) {
      case 'similar':
        prompt += "Find products similar to the current product based on category, features, and price range.";
        break;
      case 'complementary':
        prompt += "Find products that complement or work well with the current product.";
        break;
      case 'trending':
        prompt += "Identify trending products that would appeal to similar customers.";
        break;
      case 'personalized':
        prompt += "Create personalized recommendations based on customer's browsing and purchase history.";
        break;
      case 'upsell':
        prompt += "Suggest higher-value products that the customer might upgrade to.";
        break;
    }
    
    prompt += `\n\nReturn a JSON object with this structure:
    {
      "recommendations": [
        {
          "productId": number,
          "score": number (0-100),
          "reason": "detailed explanation",
          "category": "product category",
          "pricePoint": "budget|mid-range|premium",
          "tags": ["relevant", "tags"]
        }
      ]
    }`;
    
    return prompt;
  }

  private processAIRecommendations(aiResult: any, request: RecommendationRequest): ProductRecommendation[] {
    if (!aiResult.recommendations || !Array.isArray(aiResult.recommendations)) {
      return this.generateFallbackRecommendations(request);
    }

    return aiResult.recommendations
      .map((rec: any) => ({
        productId: rec.productId || 0,
        score: Math.min(100, Math.max(0, rec.score || 0)),
        reason: rec.reason || 'AI-generated recommendation',
        category: rec.category || 'General',
        pricePoint: rec.pricePoint || 'mid-range',
        tags: Array.isArray(rec.tags) ? rec.tags : []
      }))
      .filter((rec: ProductRecommendation) => rec.productId > 0)
      .slice(0, request.limit || 10);
  }

  private generateFallbackRecommendations(request: RecommendationRequest): ProductRecommendation[] {
    const { products, currentProduct, type, limit = 10 } = request;
    
    if (!products || products.length === 0) {
      return [];
    }

    let filteredProducts = [...products];
    
    // Remove current product if specified
    if (currentProduct) {
      filteredProducts = filteredProducts.filter(p => p.id !== currentProduct.id);
    }

    // Sort based on recommendation type
    switch (type) {
      case 'similar':
        if (currentProduct) {
          filteredProducts.sort((a, b) => {
            const aCategoryMatch = a.category === currentProduct.category ? 1 : 0;
            const bCategoryMatch = b.category === currentProduct.category ? 1 : 0;
            const aPriceDiff = Math.abs(a.price - currentProduct.price);
            const bPriceDiff = Math.abs(b.price - currentProduct.price);
            
            if (aCategoryMatch !== bCategoryMatch) {
              return bCategoryMatch - aCategoryMatch;
            }
            return aPriceDiff - bPriceDiff;
          });
        }
        break;
      case 'upsell':
        if (currentProduct) {
          filteredProducts = filteredProducts
            .filter(p => p.price > currentProduct.price)
            .sort((a, b) => a.price - b.price);
        }
        break;
      case 'trending':
        filteredProducts.sort(() => Math.random() - 0.5); // Random for demo
        break;
    }

    return filteredProducts
      .slice(0, limit)
      .map((product, index) => ({
        productId: product.id,
        score: Math.max(50, 100 - (index * 10)),
        reason: this.getFallbackReason(type, product, currentProduct),
        category: product.category || 'General',
        pricePoint: this.getPricePoint(product.price),
        tags: this.generateTags(product)
      }));
  }

  private getFallbackReason(type: string, product: any, currentProduct?: any): string {
    switch (type) {
      case 'similar':
        return currentProduct ? 
          `Similar to ${currentProduct.name} in the ${product.category} category` :
          `Popular in the ${product.category} category`;
      case 'complementary':
        return currentProduct ?
          `Works well with ${currentProduct.name}` :
          'Frequently bought together';
      case 'upsell':
        return 'Premium option with enhanced features';
      case 'trending':
        return 'Currently trending with customers';
      case 'personalized':
        return 'Based on your browsing preferences';
      default:
        return 'Recommended for you';
    }
  }

  private getPricePoint(price: number): 'budget' | 'mid-range' | 'premium' {
    if (price < 50) return 'budget';
    if (price < 200) return 'mid-range';
    return 'premium';
  }

  private generateTags(product: any): string[] {
    const tags = [];
    
    if (product.category) tags.push(product.category.toLowerCase());
    if (product.price < 50) tags.push('affordable');
    if (product.price > 200) tags.push('premium');
    if (product.isActive) tags.push('available');
    if (product.inventory && product.inventory > 10) tags.push('in-stock');
    
    return tags;
  }

  async analyzeCustomerBehavior(customerId: string, interactions: any[]): Promise<CustomerProfile> {
    try {
      const prompt = `Analyze customer behavior and create a profile based on these interactions:
      
      Customer ID: ${customerId}
      Interactions: ${JSON.stringify(interactions, null, 2)}
      
      Return a JSON object with customer insights including:
      - browsed product categories
      - price preferences
      - shopping patterns
      - demographic insights
      
      Format: {
        "browsedProducts": [],
        "purchaseHistory": [],
        "categories": [],
        "priceRange": {"min": 0, "max": 1000},
        "demographics": {
          "interests": [],
          "shoppingPattern": "string"
        }
      }`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a customer behavior analyst. Analyze shopping patterns and create detailed customer profiles."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return this.processCustomerProfile(result);
    } catch (error) {
      console.error('Customer analysis error:', error);
      return this.generateFallbackProfile(interactions);
    }
  }

  private processCustomerProfile(aiResult: any): CustomerProfile {
    return {
      browsedProducts: aiResult.browsedProducts || [],
      purchaseHistory: aiResult.purchaseHistory || [],
      categories: aiResult.categories || [],
      priceRange: aiResult.priceRange || { min: 0, max: 1000 },
      demographics: aiResult.demographics || {}
    };
  }

  private generateFallbackProfile(interactions: any[]): CustomerProfile {
    const categories = [...new Set(interactions.map(i => i.category).filter(Boolean))];
    const prices = interactions.map(i => i.price).filter(Boolean);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 1000;

    return {
      browsedProducts: interactions.filter(i => i.type === 'view').slice(0, 10),
      purchaseHistory: interactions.filter(i => i.type === 'purchase').slice(0, 10),
      categories,
      priceRange: { min: minPrice, max: maxPrice },
      demographics: {
        interests: categories.slice(0, 5)
      }
    };
  }
}

export const aiRecommendationEngine = AIProductRecommendationEngine.getInstance();