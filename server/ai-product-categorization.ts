import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ProductData {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  sku?: string;
  barcode?: string;
  weight?: number;
  brand?: string;
  model?: string;
  color?: string;
  size?: string;
  material?: string;
  dimensions?: string;
  rawData: Record<string, any>; // Original spreadsheet row data
}

export interface CategorizedProduct extends ProductData {
  categories: string[];
  tags: string[];
  shortDescription: string;
  seoTitle: string;
  seoDescription: string;
  slug: string;
  suggestedCompareAtPrice?: number;
  suggestedCost?: number;
  confidence: number; // 0-100
  reasoning: string;
}

export interface CategorySuggestion {
  name: string;
  slug: string;
  description: string;
  confidence: number;
}

export class AIProductCategorization {
  private static instance: AIProductCategorization;

  static getInstance(): AIProductCategorization {
    if (!AIProductCategorization.instance) {
      AIProductCategorization.instance = new AIProductCategorization();
    }
    return AIProductCategorization.instance;
  }

  async categorizeProducts(products: ProductData[]): Promise<CategorizedProduct[]> {
    const categorizedProducts: CategorizedProduct[] = [];

    for (const product of products) {
      try {
        const categorized = await this.categorizeProduct(product);
        categorizedProducts.push(categorized);
      } catch (error) {
        console.error(`Error categorizing product ${product.name}:`, error);
        // Fallback categorization
        categorizedProducts.push(this.createFallbackProduct(product));
      }
    }

    return categorizedProducts;
  }

  async categorizeProduct(product: ProductData): Promise<CategorizedProduct> {
    const prompt = `Analyze this product and provide intelligent categorization with business insights:

Product Information:
- Name: ${product.name}
- Description: ${product.description || 'Not provided'}
- Price: $${product.price}
- Quantity: ${product.quantity}
- SKU: ${product.sku || 'Not provided'}
- Brand: ${product.brand || 'Not provided'}
- Weight: ${product.weight || 'Not provided'}
- Color: ${product.color || 'Not provided'}
- Size: ${product.size || 'Not provided'}
- Material: ${product.material || 'Not provided'}
- Dimensions: ${product.dimensions || 'Not provided'}

Provide a comprehensive analysis in JSON format with:
{
  "categories": ["primary category", "secondary category"],
  "tags": ["relevant", "searchable", "tags"],
  "shortDescription": "Compelling 50-word marketing description",
  "seoTitle": "SEO optimized title under 60 characters",
  "seoDescription": "SEO meta description under 160 characters",
  "slug": "url-friendly-product-slug",
  "suggestedCompareAtPrice": number (20-40% higher than price),
  "suggestedCost": number (40-60% of price),
  "confidence": number (0-100 confidence in categorization),
  "reasoning": "Brief explanation of categorization decisions"
}

Focus on:
- Accurate product categorization for e-commerce
- SEO-optimized content for search visibility
- Marketing-focused descriptions that drive conversions
- Logical pricing suggestions based on market standards
- Relevant tags for product discovery`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert e-commerce product categorization specialist with deep knowledge of retail categories, SEO optimization, and consumer behavior. Provide accurate, actionable categorization data that helps products succeed in online marketplaces."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1000
      });

      const aiResult = JSON.parse(response.choices[0].message.content || '{}');

      return {
        ...product,
        categories: aiResult.categories || [this.inferCategory(product.name, product.description)],
        tags: aiResult.tags || this.generateBasicTags(product),
        shortDescription: aiResult.shortDescription || this.generateShortDescription(product),
        seoTitle: aiResult.seoTitle || product.name,
        seoDescription: aiResult.seoDescription || this.generateSeoDescription(product),
        slug: aiResult.slug || this.generateSlug(product.name),
        suggestedCompareAtPrice: aiResult.suggestedCompareAtPrice || product.price * 1.3,
        suggestedCost: aiResult.suggestedCost || product.price * 0.5,
        confidence: aiResult.confidence || 75,
        reasoning: aiResult.reasoning || "AI-powered categorization based on product attributes"
      };
    } catch (error) {
      console.error('OpenAI categorization error:', error);
      return this.createFallbackProduct(product);
    }
  }

  async suggestCategories(products: ProductData[]): Promise<CategorySuggestion[]> {
    const productNames = products.slice(0, 20).map(p => p.name).join(', ');
    
    const prompt = `Based on these products, suggest optimal e-commerce categories for organizing them:

Products: ${productNames}

Provide 5-10 category suggestions in JSON format:
{
  "categories": [
    {
      "name": "Category Name",
      "slug": "category-slug",
      "description": "Brief category description",
      "confidence": number (0-100)
    }
  ]
}

Categories should be:
- Broad enough to group multiple products
- Specific enough to be meaningful for shoppers
- Following standard e-commerce category conventions
- Optimized for product discovery and navigation`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an e-commerce category structure expert. Create logical, user-friendly category hierarchies that improve product discoverability and shopping experience."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.categories || [];
    } catch (error) {
      console.error('Category suggestion error:', error);
      return this.createFallbackCategories();
    }
  }

  private createFallbackProduct(product: ProductData): CategorizedProduct {
    return {
      ...product,
      categories: [this.inferCategory(product.name, product.description)],
      tags: this.generateBasicTags(product),
      shortDescription: this.generateShortDescription(product),
      seoTitle: product.name,
      seoDescription: this.generateSeoDescription(product),
      slug: this.generateSlug(product.name),
      suggestedCompareAtPrice: product.price * 1.25,
      suggestedCost: product.price * 0.6,
      confidence: 60,
      reasoning: "Fallback categorization - AI service unavailable"
    };
  }

  private inferCategory(name: string, description?: string): string {
    const text = `${name} ${description || ''}`.toLowerCase();
    
    const categories = [
      { keywords: ['electronic', 'phone', 'computer', 'laptop', 'tablet', 'gadget', 'tech'], category: 'Electronics' },
      { keywords: ['shirt', 'pants', 'dress', 'clothing', 'apparel', 'fashion', 'wear'], category: 'Clothing' },
      { keywords: ['book', 'novel', 'guide', 'manual', 'education', 'learn'], category: 'Books' },
      { keywords: ['home', 'kitchen', 'furniture', 'decor', 'household'], category: 'Home & Garden' },
      { keywords: ['sport', 'fitness', 'exercise', 'outdoor', 'athletic'], category: 'Sports & Outdoors' },
      { keywords: ['beauty', 'cosmetic', 'skincare', 'makeup', 'health'], category: 'Beauty & Health' },
      { keywords: ['tool', 'hardware', 'automotive', 'repair', 'construction'], category: 'Tools & Hardware' },
      { keywords: ['toy', 'game', 'puzzle', 'play', 'kids', 'children'], category: 'Toys & Games' }
    ];

    for (const cat of categories) {
      if (cat.keywords.some(keyword => text.includes(keyword))) {
        return cat.category;
      }
    }

    return 'General';
  }

  private generateBasicTags(product: ProductData): string[] {
    const tags = [];
    
    if (product.brand) tags.push(product.brand);
    if (product.color) tags.push(product.color);
    if (product.size) tags.push(product.size);
    if (product.material) tags.push(product.material);
    
    // Add price-based tags
    if (product.price < 25) tags.push('affordable', 'budget-friendly');
    else if (product.price > 100) tags.push('premium', 'high-quality');
    
    // Add basic descriptive tags
    const words = product.name.toLowerCase().split(' ');
    tags.push(...words.filter(word => word.length > 3));
    
    return [...new Set(tags)]; // Remove duplicates
  }

  private generateShortDescription(product: ProductData): string {
    const features = [];
    if (product.brand) features.push(`${product.brand} quality`);
    if (product.color) features.push(`${product.color} color`);
    if (product.material) features.push(`${product.material} material`);
    
    return `${product.name}${features.length ? ` featuring ${features.join(', ')}` : ''}. High-quality product perfect for your needs.`;
  }

  private generateSeoDescription(product: ProductData): string {
    return `Shop ${product.name} for $${product.price}. ${product.description || 'Premium quality product'} with fast shipping and excellent customer service.`;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private createFallbackCategories(): CategorySuggestion[] {
    return [
      { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and gadgets', confidence: 80 },
      { name: 'Clothing', slug: 'clothing', description: 'Apparel and fashion items', confidence: 80 },
      { name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and garden supplies', confidence: 75 },
      { name: 'Sports & Outdoors', slug: 'sports-outdoors', description: 'Athletic and outdoor equipment', confidence: 75 },
      { name: 'General', slug: 'general', description: 'General merchandise', confidence: 60 }
    ];
  }
}

export const aiProductCategorization = AIProductCategorization.getInstance();