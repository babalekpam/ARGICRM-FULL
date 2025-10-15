// Section 3: Critical Bug Resolution - Tax Calculation Service with P0 Fixes
// 3.1.1. Identify all currency conversion call points
// 3.1.2. Implement null-check guards for region codes
// 3.1.3. Add default fallback tax rates
// 3.1.4. Write test cases for edge-case region inputs

import { DatabaseStorage } from "../database-storage.js";
import type { TaxRate, InsertTaxRate } from "@shared/schema.js";

export interface TaxCalculationRequest {
  amount: number;
  regionCode?: string | null;
  jurisdiction?: string | null;
  taxType?: string;
  customerAddress?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

export interface TaxCalculationResult {
  originalAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  jurisdiction: string;
  regionCode: string;
  taxType: string;
  confidence: 'high' | 'medium' | 'low' | 'fallback';
  warnings: string[];
  ruleApplied: string;
}

// 3.1.3. Default fallback tax rates for major jurisdictions
const DEFAULT_TAX_RATES: Record<string, { rate: number; jurisdiction: string; description: string }> = {
  // United States - State tax rates
  'CA': { rate: 0.0825, jurisdiction: 'California', description: 'California state sales tax' },
  'NY': { rate: 0.08, jurisdiction: 'New York', description: 'New York state sales tax' },
  'TX': { rate: 0.0625, jurisdiction: 'Texas', description: 'Texas state sales tax' },
  'FL': { rate: 0.06, jurisdiction: 'Florida', description: 'Florida state sales tax' },
  'WA': { rate: 0.065, jurisdiction: 'Washington', description: 'Washington state sales tax' },
  'IL': { rate: 0.0625, jurisdiction: 'Illinois', description: 'Illinois state sales tax' },
  'PA': { rate: 0.06, jurisdiction: 'Pennsylvania', description: 'Pennsylvania state sales tax' },
  'OH': { rate: 0.0575, jurisdiction: 'Ohio', description: 'Ohio state sales tax' },
  'GA': { rate: 0.04, jurisdiction: 'Georgia', description: 'Georgia state sales tax' },
  'NC': { rate: 0.0475, jurisdiction: 'North Carolina', description: 'North Carolina state sales tax' },
  
  // Canada - Provincial tax rates (GST + PST combined)
  'ON': { rate: 0.13, jurisdiction: 'Ontario', description: 'Ontario HST (GST + PST)' },
  'BC': { rate: 0.12, jurisdiction: 'British Columbia', description: 'BC GST + PST' },
  'QC': { rate: 0.14975, jurisdiction: 'Quebec', description: 'Quebec GST + QST' },
  'AB': { rate: 0.05, jurisdiction: 'Alberta', description: 'Alberta GST only' },
  'SK': { rate: 0.11, jurisdiction: 'Saskatchewan', description: 'Saskatchewan GST + PST' },
  'MB': { rate: 0.12, jurisdiction: 'Manitoba', description: 'Manitoba GST + PST' },
  
  // European Union - VAT rates
  'GB': { rate: 0.20, jurisdiction: 'United Kingdom', description: 'UK VAT' },
  'DE': { rate: 0.19, jurisdiction: 'Germany', description: 'German VAT' },
  'FR': { rate: 0.20, jurisdiction: 'France', description: 'French VAT' },
  'IT': { rate: 0.22, jurisdiction: 'Italy', description: 'Italian VAT' },
  'ES': { rate: 0.21, jurisdiction: 'Spain', description: 'Spanish VAT' },
  'NL': { rate: 0.21, jurisdiction: 'Netherlands', description: 'Dutch VAT' },
  
  // Default fallback
  'DEFAULT': { rate: 0.08, jurisdiction: 'Default', description: 'Standard fallback tax rate' }
};

export class TaxCalculationService {
  private static instance: TaxCalculationService;
  private storage: DatabaseStorage;
  private cache: Map<string, TaxCalculationResult> = new Map();

  private constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  static getInstance(storage: DatabaseStorage): TaxCalculationService {
    if (!TaxCalculationService.instance) {
      TaxCalculationService.instance = new TaxCalculationService(storage);
    }
    return TaxCalculationService.instance;
  }

  // 3.1.1. Main tax calculation method with comprehensive error handling
  async calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResult> {
    const warnings: string[] = [];
    
    try {
      // Input validation with null-check guards
      if (!request.amount || request.amount <= 0) {
        throw new Error('Invalid amount: must be greater than 0');
      }

      // 3.1.2. Implement null-check guards for region codes
      const normalizedRegionCode = this.normalizeRegionCode(request.regionCode);
      if (!normalizedRegionCode) {
        warnings.push('No region code provided, using address-based detection');
      }

      // Determine region from multiple sources with fallbacks
      const detectedRegion = await this.detectRegion(request, normalizedRegionCode);
      
      // Get tax rate with multiple fallback strategies
      const taxRateInfo = await this.getTaxRateWithFallback(
        detectedRegion.regionCode,
        detectedRegion.jurisdiction,
        request.taxType || 'sales'
      );

      // Calculate tax amounts
      const taxAmount = this.calculateTaxAmount(request.amount, taxRateInfo.rate);
      const totalAmount = request.amount + taxAmount;

      const result: TaxCalculationResult = {
        originalAmount: request.amount,
        taxRate: taxRateInfo.rate,
        taxAmount: taxAmount,
        totalAmount: totalAmount,
        jurisdiction: taxRateInfo.jurisdiction,
        regionCode: detectedRegion.regionCode,
        taxType: request.taxType || 'sales',
        confidence: taxRateInfo.confidence,
        warnings: warnings.concat(taxRateInfo.warnings || []),
        ruleApplied: taxRateInfo.ruleApplied
      };

      // Cache result for performance
      const cacheKey = this.generateCacheKey(request);
      this.cache.set(cacheKey, result);

      console.log(`💰 Tax calculated: $${request.amount} + $${taxAmount.toFixed(2)} (${(taxRateInfo.rate * 100).toFixed(2)}%) = $${totalAmount.toFixed(2)} [${detectedRegion.regionCode}]`);
      
      return result;

    } catch (error) {
      console.error('Tax calculation error:', error);
      
      // 3.1.3. Emergency fallback to default tax rate
      return this.createFallbackResult(request, warnings, error as Error);
    }
  }

  // 3.1.2. Null-check guards for region code normalization
  private normalizeRegionCode(regionCode?: string | null): string | null {
    if (!regionCode || typeof regionCode !== 'string') {
      return null;
    }
    
    const normalized = regionCode.trim().toUpperCase();
    return normalized.length >= 2 ? normalized : null;
  }

  // Region detection with multiple fallback strategies
  private async detectRegion(request: TaxCalculationRequest, regionCode?: string | null): Promise<{
    regionCode: string;
    jurisdiction: string;
    confidence: 'high' | 'medium' | 'low';
  }> {
    // Strategy 1: Use provided region code
    if (regionCode && DEFAULT_TAX_RATES[regionCode]) {
      return {
        regionCode,
        jurisdiction: DEFAULT_TAX_RATES[regionCode].jurisdiction,
        confidence: 'high'
      };
    }

    // Strategy 2: Extract from customer address
    if (request.customerAddress) {
      const addressRegion = this.extractRegionFromAddress(request.customerAddress);
      if (addressRegion && DEFAULT_TAX_RATES[addressRegion]) {
        return {
          regionCode: addressRegion,
          jurisdiction: DEFAULT_TAX_RATES[addressRegion].jurisdiction,
          confidence: 'medium'
        };
      }
    }

    // Strategy 3: Use jurisdiction if provided
    if (request.jurisdiction) {
      const jurisdictionRegion = this.findRegionByJurisdiction(request.jurisdiction);
      if (jurisdictionRegion) {
        return {
          regionCode: jurisdictionRegion,
          jurisdiction: DEFAULT_TAX_RATES[jurisdictionRegion].jurisdiction,
          confidence: 'medium'
        };
      }
    }

    // Strategy 4: Default fallback
    return {
      regionCode: 'DEFAULT',
      jurisdiction: 'Default',
      confidence: 'low'
    };
  }

  // Extract region from address components
  private extractRegionFromAddress(address: NonNullable<TaxCalculationRequest['customerAddress']>): string | null {
    // Try state/province first
    if (address.state) {
      const stateCode = this.normalizeRegionCode(address.state);
      if (stateCode && DEFAULT_TAX_RATES[stateCode]) {
        return stateCode;
      }
    }

    // Try country as fallback
    if (address.country) {
      const countryCode = this.normalizeRegionCode(address.country);
      if (countryCode && DEFAULT_TAX_RATES[countryCode]) {
        return countryCode;
      }
    }

    // Try postal code pattern matching for specific regions
    if (address.postalCode) {
      const regionFromPostal = this.detectRegionFromPostalCode(address.postalCode);
      if (regionFromPostal) {
        return regionFromPostal;
      }
    }

    return null;
  }

  // Find region by jurisdiction name
  private findRegionByJurisdiction(jurisdiction: string): string | null {
    const normalizedJurisdiction = jurisdiction.toLowerCase().trim();
    
    for (const [regionCode, info] of Object.entries(DEFAULT_TAX_RATES)) {
      if (info.jurisdiction.toLowerCase().includes(normalizedJurisdiction) ||
          normalizedJurisdiction.includes(info.jurisdiction.toLowerCase())) {
        return regionCode;
      }
    }
    
    return null;
  }

  // Detect region from postal code patterns
  private detectRegionFromPostalCode(postalCode: string): string | null {
    const cleanPostal = postalCode.replace(/\s+/g, '').toUpperCase();
    
    // Canadian postal codes (pattern: A1A 1A1)
    if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleanPostal)) {
      const firstChar = cleanPostal.charAt(0);
      const canadianProvinces: Record<string, string> = {
        'A': 'NL', 'B': 'NS', 'C': 'PE', 'E': 'NB',
        'G': 'QC', 'H': 'QC', 'J': 'QC',
        'K': 'ON', 'L': 'ON', 'M': 'ON', 'N': 'ON', 'P': 'ON',
        'R': 'MB', 'S': 'SK', 'T': 'AB',
        'V': 'BC', 'X': 'NU', 'Y': 'YT'
      };
      return canadianProvinces[firstChar] || null;
    }

    // UK postal codes (various patterns)
    if (/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(cleanPostal)) {
      return 'GB';
    }

    return null;
  }

  // Get tax rate with comprehensive fallback strategy
  private async getTaxRateWithFallback(
    regionCode: string,
    jurisdiction: string,
    taxType: string
  ): Promise<{
    rate: number;
    jurisdiction: string;
    confidence: 'high' | 'medium' | 'low' | 'fallback';
    warnings: string[];
    ruleApplied: string;
  }> {
    const warnings: string[] = [];

    try {
      // Strategy 1: Get from database
      const dbTaxRates = await this.storage.getTaxRates();
      
      // Find exact match using existing schema fields
      const exactMatch = dbTaxRates.find(rate => 
        rate.region === regionCode && 
        rate.type === taxType &&
        rate.isActive &&
        this.isRateEffective(rate)
      );

      if (exactMatch) {
        return {
          rate: parseFloat(exactMatch.rate),
          jurisdiction: exactMatch.jurisdiction,
          confidence: 'high',
          warnings,
          ruleApplied: `Database rate for ${regionCode}`
        };
      }

      // Find region match with different tax type
      const regionMatch = dbTaxRates.find(rate => 
        rate.region === regionCode && 
        rate.isActive &&
        this.isRateEffective(rate)
      );

      if (regionMatch) {
        warnings.push(`Using ${regionMatch.type} rate instead of requested ${taxType}`);
        return {
          rate: parseFloat(regionMatch.rate),
          jurisdiction: regionMatch.jurisdiction,
          confidence: 'medium',
          warnings,
          ruleApplied: `Database rate for ${regionCode} (different tax type)`
        };
      }

    } catch (dbError) {
      console.error('Database tax rate lookup error:', dbError);
      warnings.push('Database lookup failed, using fallback rates');
    }

    // Strategy 2: Use default fallback rates
    const fallbackRate = DEFAULT_TAX_RATES[regionCode] || DEFAULT_TAX_RATES['DEFAULT'];
    
    return {
      rate: fallbackRate.rate,
      jurisdiction: fallbackRate.jurisdiction,
      confidence: regionCode === 'DEFAULT' ? 'fallback' : 'medium',
      warnings,
      ruleApplied: `Fallback rate for ${regionCode}`
    };
  }

  // Check if tax rate is currently effective
  private isRateEffective(rate: TaxRate): boolean {
    const now = new Date();
    const effectiveDate = rate.effectiveDate ? new Date(rate.effectiveDate) : new Date(0);
    const expiryDate = rate.expiryDate ? new Date(rate.expiryDate) : new Date('2099-12-31');
    
    return now >= effectiveDate && now <= expiryDate;
  }

  // Calculate tax amount with precision handling
  private calculateTaxAmount(amount: number, taxRate: number): number {
    const taxAmount = amount * taxRate;
    // Round to 2 decimal places to avoid floating point precision issues
    return Math.round(taxAmount * 100) / 100;
  }

  // 3.1.3. Create fallback result for emergency situations
  private createFallbackResult(
    request: TaxCalculationRequest, 
    warnings: string[], 
    error: Error
  ): TaxCalculationResult {
    const fallbackRate = DEFAULT_TAX_RATES['DEFAULT'];
    const taxAmount = this.calculateTaxAmount(request.amount, fallbackRate.rate);
    
    return {
      originalAmount: request.amount,
      taxRate: fallbackRate.rate,
      taxAmount: taxAmount,
      totalAmount: request.amount + taxAmount,
      jurisdiction: fallbackRate.jurisdiction,
      regionCode: 'DEFAULT',
      taxType: request.taxType || 'sales',
      confidence: 'fallback',
      warnings: [...warnings, `Emergency fallback due to error: ${error.message}`],
      ruleApplied: 'Emergency fallback rate'
    };
  }

  // Generate cache key for performance optimization
  private generateCacheKey(request: TaxCalculationRequest): string {
    return `${request.amount}_${request.regionCode || 'null'}_${request.jurisdiction || 'null'}_${request.taxType || 'sales'}`;
  }

  // Initialize default tax rates in database using existing schema
  async initializeDefaultTaxRates(): Promise<void> {
    try {
      console.log('🏛️ Initializing default tax rates...');
      
      for (const [regionCode, info] of Object.entries(DEFAULT_TAX_RATES)) {
        if (regionCode === 'DEFAULT') continue; // Skip the fallback entry
        
        const taxRateData = {
          name: `${info.jurisdiction} Sales Tax`,
          jurisdiction: info.jurisdiction,
          region: regionCode,
          type: 'sales_tax',
          rate: info.rate.toString(),
          isActive: true,
          description: info.description
        };

        try {
          await this.storage.createTaxRate(taxRateData);
          console.log(`✅ Created tax rate for ${regionCode}: ${(info.rate * 100).toFixed(2)}%`);
        } catch (error: any) {
          // Ignore duplicate errors, log others
          if (!error.message?.includes('duplicate') && !error.message?.includes('unique')) {
            console.error(`Error creating tax rate for ${regionCode}:`, error);
          }
        }
      }
      
      console.log('🏛️ Default tax rates initialization completed');
    } catch (error) {
      console.error('Error initializing default tax rates:', error);
    }
  }

  // Clear cache for performance management
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance factory
export const createTaxCalculationService = (storage: DatabaseStorage) => {
  return TaxCalculationService.getInstance(storage);
};