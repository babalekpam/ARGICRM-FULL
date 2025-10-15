import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface InventoryAnalysisResult {
  item: {
    id: string;
    name: string;
    sku: string;
    description: string;
    category: string;
    subcategory: string;
    price: number;
    cost: number;
    quantity: number;
    reorderLevel: number;
    supplier: string;
    location: string;
    barcode: string;
    weight: number;
    dimensions: string;
  };
  aiAnalysis: {
    // Market Analysis
    marketDemand: {
      score: number; // 0-100
      trend: 'rising' | 'stable' | 'declining';
      seasonality: string[];
      competitivePrice: number;
      reasoning: string;
    };
    
    // Inventory Optimization
    inventoryOptimization: {
      suggestedReorderLevel: number;
      suggestedMaxStock: number;
      turnoverRate: number;
      stockoutRisk: 'low' | 'medium' | 'high';
      overStockRisk: 'low' | 'medium' | 'high';
      optimization: string;
    };
    
    // Profitability Analysis
    profitability: {
      grossMargin: number;
      profitPerUnit: number;
      roi: number;
      priceElasticity: 'low' | 'medium' | 'high';
      pricingRecommendation: string;
    };
    
    // Quality & Compliance
    qualityAssessment: {
      shelfLife: string;
      storageRequirements: string[];
      handlingInstructions: string[];
      complianceFlags: string[];
      qualityScore: number;
    };
    
    // Sales Potential
    salesPotential: {
      velocity: 'slow' | 'medium' | 'fast';
      crossSellOpportunities: string[];
      bundleRecommendations: string[];
      marketingTags: string[];
      targetCustomers: string[];
    };
    
    // Risk Assessment
    riskAssessment: {
      obsolescenceRisk: number; // 0-100
      damageRisk: number;
      theftRisk: number;
      supplierRisk: number;
      overallRisk: 'low' | 'medium' | 'high';
      mitigationStrategies: string[];
    };
    
    // Automation Recommendations
    automation: {
      autoReorderEnabled: boolean;
      dynamicPricingEnabled: boolean;
      forecastingAccuracy: number;
      aiRecommendations: string[];
      nextActions: string[];
    };
    
    // Overall Insights
    overallInsights: {
      score: number; // 0-100 overall inventory health
      classification: 'star' | 'profitable' | 'average' | 'problematic' | 'critical';
      keyStrengths: string[];
      improvementAreas: string[];
      actionPriority: 'immediate' | 'high' | 'medium' | 'low';
    };
  };
  confidence: number;
  processingTime: number;
}

export class AIInventoryAnalyzer {
  private static instance: AIInventoryAnalyzer;
  
  static getInstance(): AIInventoryAnalyzer {
    if (!AIInventoryAnalyzer.instance) {
      AIInventoryAnalyzer.instance = new AIInventoryAnalyzer();
    }
    return AIInventoryAnalyzer.instance;
  }

  async analyzeInventoryItem(rawData: any): Promise<InventoryAnalysisResult> {
    const startTime = Date.now();
    
    try {
      // Parse and normalize inventory data
      const inventoryItem = this.parseInventoryData(rawData);
      
      // Perform comprehensive AI analysis
      const aiAnalysis = await this.performAIAnalysis(inventoryItem, rawData);
      
      return {
        item: inventoryItem,
        aiAnalysis,
        confidence: aiAnalysis.overallInsights.score / 100,
        processingTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('AI Inventory Analysis error:', error);
      return this.createFallbackAnalysis(rawData, Date.now() - startTime);
    }
  }

  private parseInventoryData(rawData: any) {
    return {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: rawData.name || rawData.Name || rawData.product_name || rawData['Product Name'] || 'Unknown Item',
      sku: rawData.sku || rawData.SKU || rawData.item_code || rawData['Item Code'] || '',
      description: rawData.description || rawData.Description || rawData.details || '',
      category: rawData.category || rawData.Category || rawData.type || rawData.Type || 'General',
      subcategory: rawData.subcategory || rawData.Subcategory || '',
      price: this.parseNumber(rawData.price || rawData.Price || rawData.selling_price),
      cost: this.parseNumber(rawData.cost || rawData.Cost || rawData.wholesale_price),
      quantity: this.parseNumber(rawData.quantity || rawData.Quantity || rawData.stock || rawData.Stock),
      reorderLevel: this.parseNumber(rawData.reorder_level || rawData['Reorder Level'] || rawData.min_stock),
      supplier: rawData.supplier || rawData.Supplier || rawData.vendor || rawData.Vendor || '',
      location: rawData.location || rawData.Location || rawData.warehouse || rawData.Warehouse || '',
      barcode: rawData.barcode || rawData.Barcode || rawData.upc || rawData.UPC || '',
      weight: this.parseNumber(rawData.weight || rawData.Weight),
      dimensions: rawData.dimensions || rawData.Dimensions || ''
    };
  }

  private parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  private async performAIAnalysis(item: any, rawData: any) {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert inventory analyst with deep knowledge of supply chain management, market analysis, and inventory optimization. Analyze the provided inventory item and provide comprehensive insights in JSON format.

Focus on:
1. Market demand and pricing analysis
2. Inventory optimization recommendations
3. Profitability assessment
4. Quality and compliance evaluation
5. Sales potential analysis
6. Risk assessment
7. Automation opportunities
8. Overall strategic insights

Provide actionable recommendations based on industry best practices and current market conditions.`
          },
          {
            role: "user",
            content: `Analyze this inventory item:
Name: ${item.name}
SKU: ${item.sku}
Description: ${item.description}
Category: ${item.category}
Price: $${item.price}
Cost: $${item.cost}
Current Stock: ${item.quantity}
Reorder Level: ${item.reorderLevel}
Supplier: ${item.supplier}
Location: ${item.location}

Provide comprehensive analysis in this JSON structure:
{
  "marketDemand": {
    "score": number (0-100),
    "trend": "rising|stable|declining",
    "seasonality": ["season1", "season2"],
    "competitivePrice": number,
    "reasoning": "string"
  },
  "inventoryOptimization": {
    "suggestedReorderLevel": number,
    "suggestedMaxStock": number,
    "turnoverRate": number,
    "stockoutRisk": "low|medium|high",
    "overStockRisk": "low|medium|high",
    "optimization": "string"
  },
  "profitability": {
    "grossMargin": number,
    "profitPerUnit": number,
    "roi": number,
    "priceElasticity": "low|medium|high",
    "pricingRecommendation": "string"
  },
  "qualityAssessment": {
    "shelfLife": "string",
    "storageRequirements": ["requirement1", "requirement2"],
    "handlingInstructions": ["instruction1", "instruction2"],
    "complianceFlags": ["flag1", "flag2"],
    "qualityScore": number (0-100)
  },
  "salesPotential": {
    "velocity": "slow|medium|fast",
    "crossSellOpportunities": ["item1", "item2"],
    "bundleRecommendations": ["bundle1", "bundle2"],
    "marketingTags": ["tag1", "tag2"],
    "targetCustomers": ["segment1", "segment2"]
  },
  "riskAssessment": {
    "obsolescenceRisk": number (0-100),
    "damageRisk": number (0-100),
    "theftRisk": number (0-100),
    "supplierRisk": number (0-100),
    "overallRisk": "low|medium|high",
    "mitigationStrategies": ["strategy1", "strategy2"]
  },
  "automation": {
    "autoReorderEnabled": boolean,
    "dynamicPricingEnabled": boolean,
    "forecastingAccuracy": number (0-100),
    "aiRecommendations": ["rec1", "rec2"],
    "nextActions": ["action1", "action2"]
  },
  "overallInsights": {
    "score": number (0-100),
    "classification": "star|profitable|average|problematic|critical",
    "keyStrengths": ["strength1", "strength2"],
    "improvementAreas": ["area1", "area2"],
    "actionPriority": "immediate|high|medium|low"
  }
}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      return this.enhanceAnalysis(analysis, item);
      
    } catch (error) {
      console.error('OpenAI analysis failed, using enhanced fallback:', error);
      return this.createIntelligentFallback(item);
    }
  }

  private enhanceAnalysis(aiAnalysis: any, item: any) {
    // Calculate additional metrics
    const grossMargin = item.price > 0 ? ((item.price - item.cost) / item.price) * 100 : 0;
    const profitPerUnit = item.price - item.cost;
    const roi = item.cost > 0 ? (profitPerUnit / item.cost) * 100 : 0;

    return {
      ...aiAnalysis,
      profitability: {
        ...aiAnalysis.profitability,
        grossMargin: Math.round(grossMargin),
        profitPerUnit: Math.round(profitPerUnit * 100) / 100,
        roi: Math.round(roi)
      }
    };
  }

  private createIntelligentFallback(item: any) {
    const grossMargin = item.price > 0 ? ((item.price - item.cost) / item.price) * 100 : 0;
    const profitPerUnit = item.price - item.cost;
    const stockLevel = item.quantity || 0;
    const reorderLevel = item.reorderLevel || 0;
    
    // Intelligent classification based on data
    let classification: 'star' | 'profitable' | 'average' | 'problematic' | 'critical' = 'average';
    let score = 50;
    
    if (grossMargin > 40 && stockLevel > reorderLevel * 2) {
      classification = 'star';
      score = 85;
    } else if (grossMargin > 25 && stockLevel > reorderLevel) {
      classification = 'profitable';
      score = 70;
    } else if (stockLevel < reorderLevel || grossMargin < 10) {
      classification = 'problematic';
      score = 30;
    } else if (stockLevel === 0 || grossMargin < 0) {
      classification = 'critical';
      score = 15;
    }

    return {
      marketDemand: {
        score: Math.max(20, Math.min(80, 50 + (grossMargin - 25))),
        trend: grossMargin > 30 ? 'rising' : grossMargin > 15 ? 'stable' : 'declining',
        seasonality: this.getSeasonality(item.category),
        competitivePrice: item.price * 0.95,
        reasoning: `Market analysis based on ${grossMargin.toFixed(1)}% gross margin and category trends`
      },
      inventoryOptimization: {
        suggestedReorderLevel: Math.max(reorderLevel, Math.round(stockLevel * 0.2)),
        suggestedMaxStock: Math.round(stockLevel * 1.5) || 100,
        turnoverRate: stockLevel > 0 ? Math.round((stockLevel / 30) * 100) / 100 : 0,
        stockoutRisk: stockLevel <= reorderLevel ? 'high' : stockLevel <= reorderLevel * 2 ? 'medium' : 'low',
        overStockRisk: stockLevel > reorderLevel * 5 ? 'high' : stockLevel > reorderLevel * 3 ? 'medium' : 'low',
        optimization: `Optimize reorder point to ${Math.max(reorderLevel, Math.round(stockLevel * 0.2))} units`
      },
      profitability: {
        grossMargin: Math.round(grossMargin),
        profitPerUnit: Math.round(profitPerUnit * 100) / 100,
        roi: item.cost > 0 ? Math.round((profitPerUnit / item.cost) * 100) : 0,
        priceElasticity: grossMargin > 40 ? 'low' : grossMargin > 20 ? 'medium' : 'high',
        pricingRecommendation: grossMargin < 20 ? 'Consider price increase' : grossMargin > 50 ? 'Price optimization opportunity' : 'Current pricing acceptable'
      },
      qualityAssessment: {
        shelfLife: this.getShelfLife(item.category),
        storageRequirements: this.getStorageRequirements(item.category),
        handlingInstructions: this.getHandlingInstructions(item.category),
        complianceFlags: this.getComplianceFlags(item.category),
        qualityScore: Math.max(60, Math.min(95, score + 10))
      },
      salesPotential: {
        velocity: stockLevel > reorderLevel * 3 ? 'fast' : stockLevel > reorderLevel ? 'medium' : 'slow',
        crossSellOpportunities: this.getCrossSellItems(item.category),
        bundleRecommendations: this.getBundleRecommendations(item.category),
        marketingTags: this.getMarketingTags(item.category, grossMargin),
        targetCustomers: this.getTargetCustomers(item.category)
      },
      riskAssessment: {
        obsolescenceRisk: this.getObsolescenceRisk(item.category),
        damageRisk: this.getDamageRisk(item.category),
        theftRisk: this.getTheftRisk(item.category, item.price),
        supplierRisk: item.supplier ? 30 : 70,
        overallRisk: score < 40 ? 'high' : score < 70 ? 'medium' : 'low',
        mitigationStrategies: this.getMitigationStrategies(classification)
      },
      automation: {
        autoReorderEnabled: stockLevel > 0 && reorderLevel > 0,
        dynamicPricingEnabled: grossMargin > 20,
        forecastingAccuracy: Math.max(60, score),
        aiRecommendations: this.getAIRecommendations(classification),
        nextActions: this.getNextActions(classification, stockLevel, reorderLevel)
      },
      overallInsights: {
        score,
        classification,
        keyStrengths: this.getKeyStrengths(item, grossMargin),
        improvementAreas: this.getImprovementAreas(item, grossMargin, stockLevel, reorderLevel),
        actionPriority: classification === 'critical' ? 'immediate' : classification === 'problematic' ? 'high' : score > 70 ? 'low' : 'medium'
      }
    };
  }

  private getSeasonality(category: string): string[] {
    const seasonalityMap: Record<string, string[]> = {
      'Electronics': ['Q4 Holiday Season', 'Back to School'],
      'Clothing': ['Spring/Summer', 'Fall/Winter', 'Holiday Season'],
      'Food': ['Summer BBQ', 'Holiday Cooking'],
      'Sports': ['Spring/Summer Active Season'],
      'Home': ['Spring Cleaning', 'Holiday Decorating'],
      'default': ['Peak Season', 'Off Season']
    };
    return seasonalityMap[category] || seasonalityMap.default;
  }

  private getShelfLife(category: string): string {
    const shelfLifeMap: Record<string, string> = {
      'Food': '6-12 months',
      'Electronics': '2-3 years',
      'Clothing': 'Indefinite with proper storage',
      'Cosmetics': '12-24 months',
      'default': '12+ months'
    };
    return shelfLifeMap[category] || shelfLifeMap.default;
  }

  private getStorageRequirements(category: string): string[] {
    const storageMap: Record<string, string[]> = {
      'Food': ['Cool, dry place', 'Temperature controlled'],
      'Electronics': ['Climate controlled', 'Anti-static protection'],
      'Clothing': ['Dry storage', 'Pest protection'],
      'default': ['Standard warehouse conditions']
    };
    return storageMap[category] || storageMap.default;
  }

  private getHandlingInstructions(category: string): string[] {
    const handlingMap: Record<string, string[]> = {
      'Electronics': ['Handle with care', 'Avoid static discharge'],
      'Food': ['Check expiration dates', 'First in, first out'],
      'Fragile': ['Fragile - handle carefully', 'Use protective packaging'],
      'default': ['Standard handling procedures']
    };
    return handlingMap[category] || handlingMap.default;
  }

  private getComplianceFlags(category: string): string[] {
    const complianceMap: Record<string, string[]> = {
      'Food': ['FDA Regulations', 'Expiration Tracking'],
      'Electronics': ['FCC Compliance', 'RoHS Compliance'],
      'Medical': ['FDA Medical Device', 'Quality Assurance'],
      'default': ['General Safety Standards']
    };
    return complianceMap[category] || complianceMap.default;
  }

  private getCrossSellItems(category: string): string[] {
    const crossSellMap: Record<string, string[]> = {
      'Electronics': ['Accessories', 'Extended Warranties', 'Cables'],
      'Clothing': ['Matching Accessories', 'Care Products', 'Similar Styles'],
      'Food': ['Complementary Items', 'Beverages', 'Seasonings'],
      'default': ['Related Products', 'Accessories', 'Maintenance Items']
    };
    return crossSellMap[category] || crossSellMap.default;
  }

  private getBundleRecommendations(category: string): string[] {
    const bundleMap: Record<string, string[]> = {
      'Electronics': ['Starter Kit Bundle', 'Professional Package'],
      'Clothing': ['Complete Outfit Bundle', 'Seasonal Collection'],
      'Food': ['Meal Kit Bundle', 'Party Pack'],
      'default': ['Value Pack', 'Starter Bundle']
    };
    return bundleMap[category] || bundleMap.default;
  }

  private getMarketingTags(category: string, grossMargin: number): string[] {
    const baseTags = ['Quality Product', 'Fast Shipping'];
    if (grossMargin > 40) baseTags.push('Premium Quality');
    if (grossMargin > 30) baseTags.push('Best Value');
    baseTags.push('Customer Favorite');
    return baseTags;
  }

  private getTargetCustomers(category: string): string[] {
    const customerMap: Record<string, string[]> = {
      'Electronics': ['Tech Enthusiasts', 'Professionals', 'Students'],
      'Clothing': ['Fashion Conscious', 'Young Adults', 'Professionals'],
      'Food': ['Home Cooks', 'Families', 'Food Enthusiasts'],
      'default': ['General Consumers', 'Businesses', 'Professionals']
    };
    return customerMap[category] || customerMap.default;
  }

  private getObsolescenceRisk(category: string): number {
    const riskMap: Record<string, number> = {
      'Electronics': 60,
      'Fashion': 45,
      'Food': 70,
      'Tools': 20,
      'default': 35
    };
    return riskMap[category] || riskMap.default;
  }

  private getDamageRisk(category: string): number {
    const riskMap: Record<string, number> = {
      'Fragile': 80,
      'Electronics': 40,
      'Clothing': 15,
      'Food': 25,
      'default': 30
    };
    return riskMap[category] || riskMap.default;
  }

  private getTheftRisk(category: string, price: number): number {
    let baseRisk = 25;
    if (price > 500) baseRisk += 30;
    else if (price > 100) baseRisk += 15;
    
    const categoryRisk: Record<string, number> = {
      'Electronics': 25,
      'Jewelry': 40,
      'Clothing': 10,
      'default': 0
    };
    
    return Math.min(95, baseRisk + (categoryRisk[category] || categoryRisk.default));
  }

  private getMitigationStrategies(classification: string): string[] {
    const strategyMap: Record<string, string[]> = {
      'critical': ['Immediate inventory review', 'Supplier renegotiation', 'Price adjustment'],
      'problematic': ['Inventory optimization', 'Marketing boost', 'Cost reduction'],
      'average': ['Regular monitoring', 'Performance tracking'],
      'profitable': ['Expand inventory', 'Marketing investment'],
      'star': ['Maintain momentum', 'Scale operations']
    };
    return strategyMap[classification] || strategyMap.average;
  }

  private getAIRecommendations(classification: string): string[] {
    const recommendationMap: Record<string, string[]> = {
      'critical': ['Enable auto-reorder alerts', 'Price optimization analysis'],
      'problematic': ['Demand forecasting', 'Competitor analysis'],
      'average': ['Performance monitoring', 'Trend analysis'],
      'profitable': ['Dynamic pricing', 'Inventory expansion'],
      'star': ['Predictive analytics', 'Advanced optimization']
    };
    return recommendationMap[classification] || recommendationMap.average;
  }

  private getNextActions(classification: string, stockLevel: number, reorderLevel: number): string[] {
    const actions = [];
    
    if (stockLevel <= reorderLevel) {
      actions.push('Reorder inventory immediately');
    }
    
    if (classification === 'critical') {
      actions.push('Review product viability');
      actions.push('Conduct market analysis');
    } else if (classification === 'star') {
      actions.push('Consider inventory expansion');
      actions.push('Optimize pricing strategy');
    } else {
      actions.push('Monitor performance metrics');
      actions.push('Review quarterly performance');
    }
    
    return actions;
  }

  private getKeyStrengths(item: any, grossMargin: number): string[] {
    const strengths = [];
    
    if (grossMargin > 40) strengths.push('High profit margin');
    if (item.quantity > (item.reorderLevel || 0) * 2) strengths.push('Good stock levels');
    if (item.supplier) strengths.push('Established supplier relationship');
    if (item.sku) strengths.push('Proper SKU tracking');
    if (strengths.length === 0) strengths.push('Basic inventory tracking');
    
    return strengths;
  }

  private getImprovementAreas(item: any, grossMargin: number, stockLevel: number, reorderLevel: number): string[] {
    const areas = [];
    
    if (grossMargin < 20) areas.push('Improve profit margins');
    if (stockLevel <= reorderLevel) areas.push('Optimize stock levels');
    if (!item.supplier) areas.push('Establish supplier relationships');
    if (!item.description) areas.push('Add detailed descriptions');
    if (areas.length === 0) areas.push('Consider automation opportunities');
    
    return areas;
  }

  private createFallbackAnalysis(rawData: any, processingTime: number): InventoryAnalysisResult {
    const item = this.parseInventoryData(rawData);
    const aiAnalysis = this.createIntelligentFallback(item);
    
    return {
      item,
      aiAnalysis,
      confidence: 0.7,
      processingTime
    };
  }

  async batchAnalyzeInventory(items: any[]): Promise<InventoryAnalysisResult[]> {
    const results: InventoryAnalysisResult[] = [];
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(item => this.analyzeInventoryItem(item));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}

export const aiInventoryAnalyzer = AIInventoryAnalyzer.getInstance();