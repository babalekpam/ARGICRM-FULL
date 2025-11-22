import { FinancialTransaction } from "@shared/schema";

export interface TransactionCategoryRule {
  id: number;
  pattern: string;
  category: string;
  confidence: number;
  accountType: 'income' | 'expense';
  keywords: string[];
  merchantPatterns: string[];
  amountRange?: { min?: number; max?: number };
}

export interface CategoryPrediction {
  category: string;
  confidence: number;
  reasoning: string;
  suggestedAccountType: 'income' | 'expense';
  alternativeCategories: Array<{ category: string; confidence: number }>;
}

export class TransactionCategorizationAI {
  private static instance: TransactionCategorizationAI;
  private learningRules: Map<string, TransactionCategoryRule> = new Map();
  private userFeedback: Map<string, { category: string; feedback: 'correct' | 'incorrect' }> = new Map();

  // Pre-trained categorization rules based on common transaction patterns
  private readonly defaultRules: TransactionCategoryRule[] = [
    // Income Categories
    {
      id: 1,
      pattern: 'salary|payroll|wage|income|payment from|deposit from',
      category: 'Salary & Wages',
      confidence: 0.95,
      accountType: 'income',
      keywords: ['salary', 'payroll', 'wage', 'income', 'payment'],
      merchantPatterns: ['company', 'corp', 'inc', 'llc'],
      amountRange: { min: 1000 }
    },
    {
      id: 2,
      pattern: 'consulting|freelance|contract|service fee|professional services',
      category: 'Consulting Revenue',
      confidence: 0.90,
      accountType: 'income',
      keywords: ['consulting', 'freelance', 'contract', 'service'],
      merchantPatterns: ['consulting', 'services'],
      amountRange: { min: 500 }
    },
    {
      id: 3,
      pattern: 'subscription|recurring|monthly fee|annual fee|saas',
      category: 'Subscription Revenue',
      confidence: 0.88,
      accountType: 'income',
      keywords: ['subscription', 'monthly', 'annual', 'recurring'],
      merchantPatterns: ['stripe', 'paypal', 'square'],
      amountRange: { min: 10, max: 10000 }
    },
    
    // Expense Categories
    {
      id: 4,
      pattern: 'office supplies|staples|amazon|stationery|printer|paper',
      category: 'Office Supplies',
      confidence: 0.85,
      accountType: 'expense',
      keywords: ['office', 'supplies', 'paper', 'printer', 'stationery'],
      merchantPatterns: ['staples', 'amazon', 'office depot', 'best buy'],
      amountRange: { max: 1000 }
    },
    {
      id: 5,
      pattern: 'software|saas|subscription|license|cloud|hosting|domain',
      category: 'Software & Technology',
      confidence: 0.92,
      accountType: 'expense',
      keywords: ['software', 'license', 'cloud', 'hosting', 'domain'],
      merchantPatterns: ['microsoft', 'google', 'adobe', 'aws', 'github'],
      amountRange: { max: 5000 }
    },
    {
      id: 6,
      pattern: 'travel|hotel|flight|uber|taxi|rental car|mileage|gas|fuel',
      category: 'Travel & Transportation',
      confidence: 0.87,
      accountType: 'expense',
      keywords: ['travel', 'hotel', 'flight', 'uber', 'taxi', 'gas'],
      merchantPatterns: ['hilton', 'marriott', 'delta', 'uber', 'lyft'],
      amountRange: { max: 5000 }
    },
    {
      id: 7,
      pattern: 'marketing|advertising|facebook|google ads|promotion|campaign',
      category: 'Marketing & Advertising',
      confidence: 0.88,
      accountType: 'expense',
      keywords: ['marketing', 'advertising', 'promotion', 'campaign'],
      merchantPatterns: ['facebook', 'google', 'linkedin', 'twitter'],
      amountRange: { max: 10000 }
    },
    {
      id: 8,
      pattern: 'rent|lease|utilities|electricity|water|internet|phone|office space',
      category: 'Rent & Utilities',
      confidence: 0.93,
      accountType: 'expense',
      keywords: ['rent', 'lease', 'utilities', 'electricity', 'water', 'internet'],
      merchantPatterns: ['property', 'management', 'utilities', 'electric'],
      amountRange: { min: 100, max: 10000 }
    },
    {
      id: 9,
      pattern: 'legal|attorney|lawyer|accounting|bookkeeping|tax|audit|professional services',
      category: 'Professional Services',
      confidence: 0.90,
      accountType: 'expense',
      keywords: ['legal', 'attorney', 'accounting', 'tax', 'audit'],
      merchantPatterns: ['law', 'legal', 'accounting', 'cpa'],
      amountRange: { min: 200, max: 50000 }
    },
    {
      id: 10,
      pattern: 'insurance|health|dental|vision|liability|business insurance',
      category: 'Insurance',
      confidence: 0.91,
      accountType: 'expense',
      keywords: ['insurance', 'health', 'dental', 'vision', 'liability'],
      merchantPatterns: ['insurance', 'health', 'dental'],
      amountRange: { min: 50, max: 5000 }
    }
  ];

  static getInstance(): TransactionCategorizationAI {
    if (!TransactionCategorizationAI.instance) {
      TransactionCategorizationAI.instance = new TransactionCategorizationAI();
    }
    return TransactionCategorizationAI.instance;
  }

  constructor() {
    this.initializeRules();
  }

  private initializeRules() {
    this.defaultRules.forEach(rule => {
      this.learningRules.set(rule.pattern, rule);
    });
  }

  public async categorizeTransaction(description: string, amount: number, merchant?: string): Promise<CategoryPrediction> {
    const normalizedDescription = description.toLowerCase().trim();
    const normalizedMerchant = merchant?.toLowerCase().trim() || '';
    
    let bestMatch: TransactionCategoryRule | null = null;
    let bestScore = 0;
    const alternatives: Array<{ category: string; confidence: number }> = [];

    // Analyze each rule for pattern matching
    for (const rule of this.learningRules.values()) {
      let score = 0;
      const reasons: string[] = [];

      // Pattern matching in description
      const patternRegex = new RegExp(rule.pattern, 'i');
      if (patternRegex.test(normalizedDescription)) {
        score += 0.4;
        reasons.push('description pattern match');
      }

      // Keyword matching
      const keywordMatches = rule.keywords.filter(keyword => 
        normalizedDescription.includes(keyword) || normalizedMerchant.includes(keyword)
      );
      if (keywordMatches.length > 0) {
        score += (keywordMatches.length / rule.keywords.length) * 0.3;
        reasons.push(`${keywordMatches.length} keyword matches`);
      }

      // Merchant pattern matching
      const merchantMatches = rule.merchantPatterns.filter(pattern => 
        normalizedMerchant.includes(pattern) || normalizedDescription.includes(pattern)
      );
      if (merchantMatches.length > 0) {
        score += (merchantMatches.length / rule.merchantPatterns.length) * 0.2;
        reasons.push('merchant pattern match');
      }

      // Amount range validation
      if (rule.amountRange) {
        if (rule.amountRange.min && amount >= rule.amountRange.min) {
          score += 0.05;
          reasons.push('amount within range');
        }
        if (rule.amountRange.max && amount <= rule.amountRange.max) {
          score += 0.05;
          reasons.push('amount within range');
        }
      }

      // Apply base confidence
      const finalScore = score * rule.confidence;

      if (finalScore > 0.3) {
        alternatives.push({ category: rule.category, confidence: finalScore });
      }

      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestMatch = rule;
      }
    }

    // Sort alternatives by confidence
    alternatives.sort((a, b) => b.confidence - a.confidence);

    if (!bestMatch || bestScore < 0.3) {
      return this.generateFallbackPrediction(description, amount);
    }

    return {
      category: bestMatch.category,
      confidence: bestScore,
      reasoning: this.generateReasoning(bestMatch, normalizedDescription, amount),
      suggestedAccountType: bestMatch.accountType,
      alternativeCategories: alternatives.slice(0, 3).filter(alt => alt.category !== bestMatch!.category)
    };
  }

  private generateFallbackPrediction(description: string, amount: number): CategoryPrediction {
    // Simple heuristics for unknown transactions
    const isIncome = amount > 0 && (
      description.toLowerCase().includes('payment') ||
      description.toLowerCase().includes('deposit') ||
      description.toLowerCase().includes('transfer in')
    );

    return {
      category: isIncome ? 'Other Income' : 'Other Expenses',
      confidence: 0.2,
      reasoning: 'No clear pattern detected, categorized based on transaction direction',
      suggestedAccountType: isIncome ? 'income' : 'expense',
      alternativeCategories: []
    };
  }

  private generateReasoning(rule: TransactionCategoryRule, description: string, amount: number): string {
    const reasons: string[] = [];
    
    if (new RegExp(rule.pattern, 'i').test(description)) {
      reasons.push('matches known pattern');
    }
    
    const keywordMatches = rule.keywords.filter(keyword => description.includes(keyword));
    if (keywordMatches.length > 0) {
      reasons.push(`contains relevant keywords: ${keywordMatches.join(', ')}`);
    }
    
    if (rule.amountRange && amount >= (rule.amountRange.min || 0) && amount <= (rule.amountRange.max || Infinity)) {
      reasons.push('amount is typical for this category');
    }

    return reasons.length > 0 ? reasons.join('; ') : 'based on transaction analysis';
  }

  public async learnFromFeedback(transactionId: string, actualCategory: string, feedback: 'correct' | 'incorrect') {
    this.userFeedback.set(transactionId, { category: actualCategory, feedback });
    
    if (feedback === 'correct') {
      // Reinforce the rule that led to correct categorization
      await this.reinforceRule(actualCategory);
    } else {
      // Adjust confidence or create new rule
      await this.adjustRules(transactionId, actualCategory);
    }
  }

  private async reinforceRule(category: string) {
    for (const rule of this.learningRules.values()) {
      if (rule.category === category && rule.confidence < 0.95) {
        rule.confidence = Math.min(rule.confidence + 0.02, 0.95);
      }
    }
  }

  private async adjustRules(transactionId: string, correctCategory: string) {
    // Create or adjust rules based on incorrect predictions
    // This would be expanded with more sophisticated ML algorithms
  }

  public getCategoryStatistics() {
    const stats = new Map<string, { count: number; accuracy: number }>();
    
    for (const rule of this.learningRules.values()) {
      stats.set(rule.category, {
        count: 0, // Would track usage in real implementation
        accuracy: rule.confidence
      });
    }

    return Object.fromEntries(stats);
  }

  public getAvailableCategories(): string[] {
    return Array.from(new Set(this.defaultRules.map(rule => rule.category))).sort();
  }
}

export const transactionAI = TransactionCategorizationAI.getInstance();