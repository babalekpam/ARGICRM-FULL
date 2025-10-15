/**
 * Email Uniqueness and Validation Utility
 * Ensures each email can only be used once for signup
 */

import { db } from "../db.js";
import { users } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

export interface EmailValidationResult {
  isValid: boolean;
  errors: string[];
  isUnique: boolean;
}

export class EmailValidator {
  /**
   * Validate email format and uniqueness
   */
  async validateEmail(email: string): Promise<EmailValidationResult> {
    const errors: string[] = [];

    // Basic email format validation
    if (!this.isValidEmailFormat(email)) {
      errors.push('Please enter a valid email address');
    }

    // Check email uniqueness in database
    const isUnique = await this.isEmailUnique(email);
    if (!isUnique) {
      errors.push('An account with this email address already exists. Please use a different email or try logging in.');
    }

    // Additional email security checks
    if (this.isDisposableEmail(email)) {
      errors.push('Disposable email addresses are not allowed. Please use a permanent email address.');
    }

    if (this.isBlockedDomain(email)) {
      errors.push('Email domain is not allowed. Please use a business or personal email address.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      isUnique
    };
  }

  /**
   * Check if email is already registered in the database
   */
  private async isEmailUnique(email: string): Promise<boolean> {
    try {
      // Check if email exists in users table
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      return existingUser.length === 0;
    } catch (error) {
      console.error('Database error checking email uniqueness:', error);
      // In case of database error, err on the side of caution
      return false;
    }
  }

  /**
   * Validate email format using RFC 5322 compliant regex
   */
  private isValidEmailFormat(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(email)) {
      return false;
    }

    // Additional checks
    if (email.length > 254) { // RFC 5321 limit
      return false;
    }

    const [localPart, domainPart] = email.split('@');
    if (localPart.length > 64) { // RFC 5321 limit
      return false;
    }

    return true;
  }

  /**
   * Check if email is from a disposable email service
   */
  private isDisposableEmail(email: string): boolean {
    const disposableDomains = [
      '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com',
      'throwaway.email', 'temp-mail.org', 'yopmail.com', 'getairmail.com',
      'maildrop.cc', 'sharklasers.com', 'grr.la', 'guerrillamailblock.com',
      'pokemail.net', 'spam4.me', 'bccto.me', 'chacuo.net', 'dispostable.com',
      'emailondeck.com', 'fakeinbox.com', 'mailnesia.com', 'mjukglass.nu',
      'nwldx.com', 'objectmail.com', 'proxymail.eu', 'rcpt.at', 'safe-mail.net',
      'trashmail.at', 'trashmail.com', 'trashmail.net', 'wegwerfmail.de',
      'wegwerfmail.net', 'wegwerfmail.org', 'zehnminutenmail.de'
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.includes(domain);
  }

  /**
   * Check if email domain is blocked
   */
  private isBlockedDomain(email: string): boolean {
    // Only block localhost/IP addresses, allow test emails in non-production
    const blockedDomains = process.env.NODE_ENV === 'production'
      ? ['localhost', '127.0.0.1'] // Strict in production
      : []; // Allow all in development

    const domain = email.split('@')[1]?.toLowerCase();
    return blockedDomains.includes(domain);
  }

  /**
   * Normalize email for consistent storage
   */
  normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Check if email domain supports business accounts
   */
  isBusinessEmail(email: string): boolean {
    const consumerDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
      'icloud.com', 'me.com', 'mac.com', 'live.com', 'msn.com'
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    return !consumerDomains.includes(domain);
  }

  /**
   * Extract company domain from email for company verification
   */
  extractCompanyDomain(email: string): string | null {
    const domain = email.split('@')[1]?.toLowerCase();
    
    // Skip consumer email domains
    if (!this.isBusinessEmail(email)) {
      return null;
    }

    return domain;
  }
}

// Export singleton instance
export const emailValidator = new EmailValidator();