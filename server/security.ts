import crypto from "crypto";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { Request, Response, NextFunction } from "express";

// Encryption utilities for sensitive data
export class DataEncryption {
  private static algorithm = 'aes-256-gcm';
  private static keyLength = 32;
  
  private static getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error("ENCRYPTION_KEY environment variable is required for data security");
    }
    return Buffer.from(key, 'base64');
  }

  static encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', key);
    cipher.setAAD(Buffer.from('ARGILETTE_CRM', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const key = this.getEncryptionKey();
    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAAD(Buffer.from('ARGILETTE_CRM', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  static hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Input validation and sanitization
export class InputSecurity {
  static sanitizeInput(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    return { valid: errors.length === 0, errors };
  }

  static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeInput(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  }
}

// Rate limiting configurations
export const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Security rate limiters - adjusted for development
export const rateLimiters = {
  general: createRateLimiter(15 * 60 * 1000, 
    process.env.NODE_ENV === 'development' ? 1000 : 100, 
    "Too many requests, please try again later"),
  auth: createRateLimiter(15 * 60 * 1000, 
    process.env.NODE_ENV === 'development' ? 50 : 5, 
    "Too many login attempts, please try again later"),
  api: createRateLimiter(1 * 60 * 1000, 
    process.env.NODE_ENV === 'development' ? 600 : 60, 
    "API rate limit exceeded"),
  upload: createRateLimiter(1 * 60 * 1000, 
    process.env.NODE_ENV === 'development' ? 100 : 10, 
    "Too many file uploads, please try again later")
};

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: process.env.NODE_ENV === 'development' 
        ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://va.vercel-scripts.com", "https://replit.com", "blob:"]
        : ["'self'", "https://va.vercel-scripts.com", "https://replit.com"],
      connectSrc: ["'self'", "ws:", "wss:", "https:", "http://localhost:*", "http://127.0.0.1:*"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'"],
      formAction: ["'self'"],
      ...(process.env.NODE_ENV === 'production' && { upgradeInsecureRequests: [] }),
    },
  },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});

// Audit logging
export class SecurityAudit {
  static logSecurityEvent(event: {
    type: 'LOGIN' | 'LOGOUT' | 'DATA_ACCESS' | 'DATA_MODIFICATION' | 'FAILED_AUTH' | 'RATE_LIMIT' | 'SUSPICIOUS_ACTIVITY';
    userId?: string;
    ipAddress: string;
    userAgent: string;
    details?: any;
    timestamp?: Date;
  }) {
    const logEntry = {
      ...event,
      timestamp: event.timestamp || new Date(),
      id: crypto.randomUUID()
    };

    // In production, this would be sent to a secure logging service
    console.log('[SECURITY AUDIT]', JSON.stringify(logEntry));
    
    // Store in database for compliance
    this.storeSecurityLog(logEntry);
  }

  private static async storeSecurityLog(logEntry: any) {
    // In a real implementation, this would store to a secure audit database
    // For now, we'll just ensure the structure is in place
  }
}

// Request validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize all inputs
  if (req.body) {
    req.body = InputSecurity.sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = InputSecurity.sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = InputSecurity.sanitizeObject(req.params);
  }

  // Log data access for audit
  SecurityAudit.logSecurityEvent({
    type: 'DATA_ACCESS',
    ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    details: {
      method: req.method,
      path: req.path,
      timestamp: new Date()
    }
  });

  next();
};

// File upload security
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file && !req.files) {
    return next();
  }

  const allowedMimeTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf'
  ];

  const file = req.file || (Array.isArray(req.files) ? req.files[0] : Object.values(req.files || {})[0]);
  
  if (file && typeof file === 'object' && 'mimetype' in file && !allowedMimeTypes.includes(file.mimetype)) {
    return res.status(400).json({
      error: 'File type not allowed. Only CSV, Excel, images, and PDF files are permitted.'
    });
  }

  // Check file size (10MB limit)
  if (file && typeof file === 'object' && 'size' in file && file.size > 10 * 1024 * 1024) {
    return res.status(400).json({
      error: 'File size too large. Maximum size is 10MB.'
    });
  }

  next();
};

// Session security with production-ready store
export const sessionSecurity = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  store: (() => {
    try {
      if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
        const ConnectPgSimple = require('connect-pg-simple')(require('express-session'));
        return new ConnectPgSimple({
          conString: process.env.DATABASE_URL,
          tableName: 'user_sessions',
          createTableIfMissing: true
        });
      } else {
        const session = require('express-session');
        const MemoryStore = require('memorystore');
        return new (MemoryStore(session))({ checkPeriod: 86400000 });
      }
    } catch (error) {
      console.warn('Session store configuration failed, using default store');
      return undefined;
    }
  })(),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' as const
  }
};

// Database query security
export class DatabaseSecurity {
  static sanitizeQuery(query: string): string {
    // Basic SQL injection prevention
    return query
      .replace(/['";\\]|--|\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b/gi, '')
      .trim();
  }

  static validateId(id: any): boolean {
    return typeof id === 'number' && id > 0 && Number.isInteger(id);
  }
}

// Environment variable validation
export const validateEnvironment = () => {
  const requiredVars = [
    'DATABASE_URL',
    'SESSION_SECRET'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Generate encryption key if not provided
  if (!process.env.ENCRYPTION_KEY) {
    console.warn('ENCRYPTION_KEY not set. Generating temporary key. Set ENCRYPTION_KEY for production.');
    process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
  }
};