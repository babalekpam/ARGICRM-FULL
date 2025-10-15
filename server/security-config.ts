/**
 * Security Configuration - Comprehensive security hardening
 * 
 * This module provides enhanced security configurations and hardening
 * measures for the NODE CRM application.
 */

import { securityHeaders } from './security.js';
import type { Application } from 'express';

export interface SecurityConfig {
  environment: 'development' | 'production' | 'staging';
  enableAuditLogging: boolean;
  enableRateLimiting: boolean;
  enableCSP: boolean;
  enableHSTS: boolean;
  enableEncryption: boolean;
  sessionTimeout: number; // in milliseconds
  maxLoginAttempts: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
}

export const securityConfig: SecurityConfig = {
  environment: (process.env.NODE_ENV as any) || 'development',
  enableAuditLogging: true,
  enableRateLimiting: true,
  enableCSP: true,
  enableHSTS: process.env.NODE_ENV === 'production',
  enableEncryption: true,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  maxLoginAttempts: 5,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  }
};

/**
 * Apply comprehensive security hardening to the Express application
 */
export function applySecurityHardening(app: Application): void {
  // Disable X-Powered-By header
  app.disable('x-powered-by');
  
  // Enable trust proxy for rate limiting
  app.set('trust proxy', 1);
  
  // Apply security headers
  if (securityConfig.enableCSP) {
    app.use(securityHeaders);
  }
  
  // Additional security middleware
  app.use((req, res, next) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // XSS Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions Policy
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    next();
  });
  
  console.log('🔒 Security hardening applied successfully');
}

/**
 * Environment-specific security configurations
 */
export function getEnvironmentSecurityConfig(): Partial<SecurityConfig> {
  switch (securityConfig.environment) {
    case 'production':
      return {
        enableHSTS: true,
        sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours for production
        maxLoginAttempts: 3, // Stricter for production
      };
    
    case 'staging':
      return {
        enableHSTS: true,
        sessionTimeout: 12 * 60 * 60 * 1000, // 12 hours for staging
      };
    
    case 'development':
    default:
      return {
        enableHSTS: false,
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours for development
      };
  }
}