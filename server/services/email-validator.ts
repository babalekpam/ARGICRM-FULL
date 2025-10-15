/**
 * Email Validator Service
 * Automated email validation, cleaning, and deliverability checks
 */

interface ValidationResult {
  isValid: boolean;
  email: string;
  issues: string[];
  risk: 'low' | 'medium' | 'high';
}

interface BulkValidationResult {
  valid: string[];
  invalid: string[];
  duplicates: string[];
  disposable: string[];
  risky: string[];
  stats: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
    disposable: number;
  };
}

// Common disposable email domains
const DISPOSABLE_DOMAINS = [
  'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com',
  'throwaway.email', 'temp-mail.org', 'getnada.com', 'maildrop.cc',
  'trashmail.com', 'fakeinbox.com', 'yopmail.com', 'sharklasers.com'
];

// Role-based emails (typically not monitored)
const ROLE_BASED_PREFIXES = [
  'noreply', 'no-reply', 'donotreply', 'admin', 'administrator',
  'info', 'contact', 'support', 'sales', 'webmaster', 'postmaster'
];

export class EmailValidator {
  
  /**
   * Validate single email address
   */
  validateEmail(email: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      email: email.toLowerCase().trim(),
      issues: [],
      risk: 'low'
    };

    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(result.email)) {
      result.isValid = false;
      result.issues.push('Invalid email format');
      result.risk = 'high';
      return result;
    }

    const [localPart, domain] = result.email.split('@');

    // Check for disposable email
    if (DISPOSABLE_DOMAINS.includes(domain)) {
      result.isValid = false;
      result.issues.push('Disposable email domain');
      result.risk = 'high';
    }

    // Check for role-based email
    if (ROLE_BASED_PREFIXES.some(prefix => localPart.startsWith(prefix))) {
      result.issues.push('Role-based email (may have low engagement)');
      result.risk = result.risk === 'low' ? 'medium' : 'high';
    }

    // Check for suspicious patterns
    if (localPart.length < 3) {
      result.issues.push('Very short local part (suspicious)');
      result.risk = 'medium';
    }

    // Check for excessive special characters
    const specialCharCount = (localPart.match(/[+._-]/g) || []).length;
    if (specialCharCount > 3) {
      result.issues.push('Too many special characters');
      result.risk = 'medium';
    }

    // Check for numeric-only local part (often spam traps)
    if (/^\d+$/.test(localPart)) {
      result.issues.push('Numeric-only address (potential spam trap)');
      result.risk = 'high';
    }

    return result;
  }

  /**
   * Validate and clean bulk email list
   */
  validateBulk(emails: string[]): BulkValidationResult {
    const seen = new Set<string>();
    const result: BulkValidationResult = {
      valid: [],
      invalid: [],
      duplicates: [],
      disposable: [],
      risky: [],
      stats: {
        total: emails.length,
        valid: 0,
        invalid: 0,
        duplicates: 0,
        disposable: 0
      }
    };

    for (const email of emails) {
      const cleaned = email.toLowerCase().trim();
      
      // Check for duplicates
      if (seen.has(cleaned)) {
        result.duplicates.push(cleaned);
        result.stats.duplicates++;
        continue;
      }
      seen.add(cleaned);

      // Validate email
      const validation = this.validateEmail(cleaned);

      if (!validation.isValid) {
        result.invalid.push(cleaned);
        result.stats.invalid++;
        
        if (validation.issues.includes('Disposable email domain')) {
          result.disposable.push(cleaned);
          result.stats.disposable++;
        }
      } else {
        if (validation.risk === 'high' || validation.risk === 'medium') {
          result.risky.push(cleaned);
        }
        result.valid.push(cleaned);
        result.stats.valid++;
      }
    }

    return result;
  }

  /**
   * Remove duplicates and normalize emails
   */
  deduplicateAndNormalize(emails: string[]): string[] {
    const seen = new Set<string>();
    const normalized: string[] = [];

    for (const email of emails) {
      const cleaned = email.toLowerCase().trim();
      if (!seen.has(cleaned) && cleaned) {
        seen.add(cleaned);
        normalized.push(cleaned);
      }
    }

    return normalized;
  }

  /**
   * Extract emails from text (finds email addresses in content)
   */
  extractEmails(text: string): string[] {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex) || [];
    return this.deduplicateAndNormalize(matches);
  }

  /**
   * Check if domain is likely to be deliverable
   */
  async checkDomainHealth(domain: string): Promise<{
    hasValidDNS: boolean;
    hasMXRecords: boolean;
    risk: string;
  }> {
    // In production, you'd use DNS lookup libraries
    // For now, we'll do basic checks
    const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com'];
    
    return {
      hasValidDNS: true, // Would check DNS in production
      hasMXRecords: true, // Would check MX records in production
      risk: commonDomains.includes(domain) ? 'low' : 'medium'
    };
  }
}

export const emailValidator = new EmailValidator();
