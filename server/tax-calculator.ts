import { storage } from "./storage.js";
import type { TaxRate, TaxCalculationRule } from "@shared/schema";

export interface TaxCalculationRequest {
  amount: number;
  customerAddress?: {
    country?: string;
    state?: string;
    city?: string;
    zipCode?: string;
  };
  productType?: string;
  accountType?: string;
  invoiceDate?: Date;
}

export interface TaxCalculationResult {
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  taxRateName: string;
  total: number;
  appliedRules: string[];
  jurisdiction: string;
}

export class TaxCalculator {
  // No default tax rates - all taxes must be configured by user in tax settings

  static async calculateTax(request: TaxCalculationRequest): Promise<TaxCalculationResult> {
    try {
      // Get all available tax rates (from storage or defaults)
      const taxRates = await this.getTaxRates();
      
      // Find applicable tax rate based on address
      const applicableTaxRate = this.findApplicableTaxRate(taxRates, request);
      
      if (!applicableTaxRate) {
        return {
          subtotal: request.amount,
          taxAmount: 0,
          taxRate: 0,
          taxRateName: "No Tax",
          total: request.amount,
          appliedRules: ["No applicable tax rate found"],
          jurisdiction: "Unknown",
        };
      }

      const rate = parseFloat(applicableTaxRate.rate);
      const taxAmount = request.amount * rate;
      const total = request.amount + taxAmount;

      return {
        subtotal: request.amount,
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        taxRate: rate,
        taxRateName: applicableTaxRate.name,
        total: parseFloat(total.toFixed(2)),
        appliedRules: [`Applied ${applicableTaxRate.name} at ${(rate * 100).toFixed(2)}%`],
        jurisdiction: `${applicableTaxRate.jurisdiction}${applicableTaxRate.region ? `-${applicableTaxRate.region}` : ''}`,
      };
    } catch (error) {
      console.error("Tax calculation error:", error);
      
      // Fallback to no tax
      return {
        subtotal: request.amount,
        taxAmount: 0,
        taxRate: 0,
        taxRateName: "Error - No Tax Applied",
        total: request.amount,
        appliedRules: ["Tax calculation failed"],
        jurisdiction: "Unknown",
      };
    }
  }

  private static async getTaxRates(): Promise<TaxRate[]> {
    try {
      // Only get user-configured tax rates from storage
      const storedRates = await storage.getTaxRates();
      return storedRates || [];
    } catch (error) {
      console.log("No tax rates configured in tax settings - taxes will not be applied");
      return [];
    }
  }

  private static findApplicableTaxRate(taxRates: TaxRate[], request: TaxCalculationRequest): TaxRate | null {
    const { customerAddress } = request;
    
    if (!customerAddress) {
      // Default to no tax if no address provided
      return null;
    }

    // Filter active tax rates
    const activeTaxRates = taxRates.filter(rate => rate.isActive);

    // Priority matching logic
    let bestMatch: TaxRate | null = null;
    let matchScore = 0;

    for (const taxRate of activeTaxRates) {
      let currentScore = 0;

      // Country match (required)
      if (this.normalizeCountry(customerAddress.country) === this.normalizeCountry(taxRate.jurisdiction)) {
        currentScore += 100;
      } else {
        continue; // Skip if country doesn't match
      }

      // State/Region match
      if (taxRate.region && customerAddress.state) {
        if (this.normalizeRegion(customerAddress.state) === this.normalizeRegion(taxRate.region)) {
          currentScore += 50;
        }
      }

      // City match
      if (taxRate.city && customerAddress.city) {
        if (customerAddress.city.toLowerCase() === taxRate.city.toLowerCase()) {
          currentScore += 25;
        }
      }

      // ZIP code match
      if (taxRate.zipCode && customerAddress.zipCode) {
        if (customerAddress.zipCode === taxRate.zipCode) {
          currentScore += 10;
        }
      }

      // Update best match if this is better
      if (currentScore > matchScore) {
        matchScore = currentScore;
        bestMatch = taxRate;
      }
    }

    return bestMatch;
  }

  private static normalizeCountry(country?: string): string {
    if (!country) return "";
    
    const countryMap: { [key: string]: string } = {
      "united states": "US",
      "usa": "US",
      "us": "US",
      "united kingdom": "UK",
      "uk": "UK",
      "great britain": "UK",
      "canada": "CA",
      "ca": "CA",
      "australia": "AU",
      "au": "AU",
    };

    const normalized = country.toLowerCase();
    return countryMap[normalized] || country.toUpperCase();
  }

  private static normalizeRegion(region?: string): string {
    if (!region) return "";
    
    const regionMap: { [key: string]: string } = {
      "california": "CA",
      "new york": "NY",
      "texas": "TX",
      "florida": "FL",
      "illinois": "IL",
      // Add more state mappings as needed
    };

    const normalized = region.toLowerCase();
    return regionMap[normalized] || region.toUpperCase();
  }

  // Calculate tax for multiple line items
  static async calculateTaxForLineItems(lineItems: Array<{
    amount: number;
    description?: string;
    taxable?: boolean;
  }>, customerAddress?: TaxCalculationRequest['customerAddress']): Promise<TaxCalculationResult> {
    const taxableItems = lineItems.filter(item => item.taxable !== false);
    const totalTaxableAmount = taxableItems.reduce((sum, item) => sum + item.amount, 0);
    
    if (totalTaxableAmount === 0) {
      const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);
      return {
        subtotal: totalAmount,
        taxAmount: 0,
        taxRate: 0,
        taxRateName: "No Taxable Items",
        total: totalAmount,
        appliedRules: ["No taxable items found"],
        jurisdiction: "N/A",
      };
    }

    return this.calculateTax({
      amount: totalTaxableAmount,
      customerAddress,
    });
  }

  // Validate tax calculation
  static validateTaxCalculation(result: TaxCalculationResult): boolean {
    return (
      result.subtotal >= 0 &&
      result.taxAmount >= 0 &&
      result.taxRate >= 0 &&
      result.total >= result.subtotal &&
      Math.abs(result.total - (result.subtotal + result.taxAmount)) < 0.01
    );
  }
}