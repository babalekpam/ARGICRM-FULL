/**
 * Complex Password Policy Validation
 * Implements enterprise-grade password security requirements
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  score: number; // 0-100
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  minSpecialChars: number;
  preventCommonPasswords: boolean;
  preventSequential: boolean;
  preventRepeated: boolean;
  preventUserInfo: boolean;
}

// Default enterprise password policy - made more user-friendly
export const DEFAULT_PASSWORD_POLICY: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  minSpecialChars: 1,
  preventCommonPasswords: false, // Disabled for better user experience
  preventSequential: false,
  preventRepeated: false,
  preventUserInfo: false,
};

// Common passwords to reject - reduced list for better user experience
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123',
  'password1', 'admin', 'welcome', 'login', 'guest', 'test',
  'root', 'master', 'letmein'
];

export class PasswordValidator {
  private requirements: PasswordRequirements;

  constructor(requirements: PasswordRequirements = DEFAULT_PASSWORD_POLICY) {
    this.requirements = requirements;
  }

  /**
   * Validate password against all policy requirements
   */
  validatePassword(password: string, userInfo?: { email?: string; firstName?: string; lastName?: string; company?: string }): PasswordValidationResult {
    const errors: string[] = [];
    let score = 0;

    // Length validation
    if (password.length < this.requirements.minLength) {
      errors.push(`Password must be at least ${this.requirements.minLength} characters long`);
    } else {
      score += Math.min(25, (password.length / this.requirements.minLength) * 25);
    }

    // Character requirements
    if (this.requirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (this.requirements.requireUppercase) {
      score += 15;
    }

    if (this.requirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (this.requirements.requireLowercase) {
      score += 15;
    }

    if (this.requirements.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else if (this.requirements.requireNumbers) {
      score += 15;
    }

    if (this.requirements.requireSpecialChars) {
      const specialChars = password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g);
      const specialCharCount = specialChars ? specialChars.length : 0;
      
      if (specialCharCount < this.requirements.minSpecialChars) {
        errors.push(`Password must contain at least ${this.requirements.minSpecialChars} special characters (!@#$%^&*()_+-=[]{}|;':\",./<>?)`);
      } else {
        score += Math.min(20, specialCharCount * 5);
      }
    }

    // Advanced security checks
    if (this.requirements.preventCommonPasswords && this.isCommonPassword(password)) {
      errors.push('Password is too common. Please choose a more unique password');
    }

    if (this.requirements.preventSequential && this.hasSequentialChars(password)) {
      errors.push('Password cannot contain sequential characters (e.g., abc, 123, qwerty)');
    }

    if (this.requirements.preventRepeated && this.hasRepeatedChars(password)) {
      errors.push('Password cannot contain repeated characters (e.g., aaa, 111)');
    }

    if (this.requirements.preventUserInfo && userInfo && this.containsUserInfo(password, userInfo)) {
      errors.push('Password cannot contain personal information (name, email, company)');
    }

    // Bonus points for complexity
    if (password.length >= 16) score += 5;
    if (/[A-Z].*[A-Z]/.test(password)) score += 2; // Multiple uppercase
    if (/\d.*\d/.test(password)) score += 2; // Multiple numbers
    if (this.hasVariedCharacterTypes(password)) score += 5;

    // Determine strength
    const strength = this.calculateStrength(score);

    return {
      isValid: errors.length === 0,
      errors,
      strength,
      score: Math.min(100, score)
    };
  }

  private isCommonPassword(password: string): boolean {
    const lowerPassword = password.toLowerCase();
    return COMMON_PASSWORDS.some(common => 
      lowerPassword === common || 
      lowerPassword.includes(common) || 
      common.includes(lowerPassword)
    );
  }

  private hasSequentialChars(password: string): boolean {
    const sequential = [
      'abcdefghijklmnopqrstuvwxyz',
      'qwertyuiopasdfghjklzxcvbnm',
      '0123456789'
    ];

    for (const seq of sequential) {
      for (let i = 0; i <= seq.length - 3; i++) {
        const substr = seq.substring(i, i + 3);
        if (password.toLowerCase().includes(substr)) {
          return true;
        }
      }
    }
    return false;
  }

  private hasRepeatedChars(password: string): boolean {
    // Check for 3 or more repeated characters
    const repeatedPattern = /(.)\1{2,}/;
    return repeatedPattern.test(password);
  }

  private containsUserInfo(password: string, userInfo: { email?: string; firstName?: string; lastName?: string; company?: string }): boolean {
    const lowerPassword = password.toLowerCase();
    
    if (userInfo.email) {
      const emailParts = userInfo.email.toLowerCase().split('@');
      if (emailParts[0].length >= 4 && lowerPassword.includes(emailParts[0])) {
        return true;
      }
    }

    if (userInfo.firstName && userInfo.firstName.length >= 3 && lowerPassword.includes(userInfo.firstName.toLowerCase())) {
      return true;
    }

    if (userInfo.lastName && userInfo.lastName.length >= 3 && lowerPassword.includes(userInfo.lastName.toLowerCase())) {
      return true;
    }

    if (userInfo.company) {
      const companyWords = userInfo.company.toLowerCase().split(/\s+/);
      for (const word of companyWords) {
        if (word.length >= 4 && lowerPassword.includes(word)) {
          return true;
        }
      }
    }

    return false;
  }

  private hasVariedCharacterTypes(password: string): boolean {
    const types = [
      /[a-z]/.test(password), // lowercase
      /[A-Z]/.test(password), // uppercase  
      /\d/.test(password),    // digits
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) // special
    ];
    
    return types.filter(Boolean).length >= 3;
  }

  private calculateStrength(score: number): 'weak' | 'fair' | 'good' | 'strong' | 'very-strong' {
    if (score < 30) return 'weak';
    if (score < 50) return 'fair';
    if (score < 70) return 'good';
    if (score < 90) return 'strong';
    return 'very-strong';
  }

  /**
   * Get human-readable description of password requirements
   */
  getRequirementsDescription(): string[] {
    const descriptions = [];
    
    descriptions.push(`At least ${this.requirements.minLength} characters long`);
    
    if (this.requirements.requireUppercase) {
      descriptions.push('At least one uppercase letter (A-Z)');
    }
    
    if (this.requirements.requireLowercase) {
      descriptions.push('At least one lowercase letter (a-z)');
    }
    
    if (this.requirements.requireNumbers) {
      descriptions.push('At least one number (0-9)');
    }
    
    if (this.requirements.requireSpecialChars) {
      descriptions.push(`At least ${this.requirements.minSpecialChars} special character(s) (!@#$%^&* etc.)`);
    }
    
    if (this.requirements.preventCommonPasswords) {
      descriptions.push('Cannot be a commonly used password');
    }
    
    if (this.requirements.preventUserInfo) {
      descriptions.push('Cannot contain personal information');
    }

    return descriptions;
  }
}

// Export singleton instance with default policy
export const passwordValidator = new PasswordValidator();