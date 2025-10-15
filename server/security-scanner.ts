/**
 * Security Scanner - Comprehensive security audit and vulnerability detection
 * 
 * This module provides automated security scanning capabilities to identify
 * and report potential security vulnerabilities in the application.
 */

import fs from 'fs/promises';
import path from 'path';
import { DataEncryption, InputSecurity } from './security.js';

interface SecurityIssue {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'ENCRYPTION' | 'INPUT_VALIDATION' | 'AUTHENTICATION' | 'AUTHORIZATION' | 'SESSION' | 'DEPENDENCY' | 'CONFIG';
  description: string;
  file?: string;
  line?: number;
  recommendation: string;
}

export class SecurityScanner {
  private issues: SecurityIssue[] = [];

  async scanApplication(): Promise<SecurityIssue[]> {
    this.issues = [];

    // Scan for common security issues
    await this.scanPackageVulnerabilities();
    await this.scanEnvironmentVariables();
    await this.scanFilePermissions();
    await this.scanDependencyInjection();
    await this.scanAuthenticationFlaws();
    
    return this.issues;
  }

  private async scanPackageVulnerabilities(): Promise<void> {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      
      // Check for known vulnerable packages
      const vulnerablePackages = [
        'xlsx', // Known prototype pollution vulnerability
        'node-xlsx', // Check if properly secured
      ];

      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      for (const [pkg, version] of Object.entries(dependencies)) {
        if (vulnerablePackages.includes(pkg)) {
          this.issues.push({
            severity: 'HIGH',
            category: 'DEPENDENCY',
            description: `Potentially vulnerable package detected: ${pkg}@${version}`,
            file: 'package.json',
            recommendation: 'Review package security advisories and consider alternatives or updates'
          });
        }
      }
    } catch (error) {
      this.issues.push({
        severity: 'MEDIUM',
        category: 'CONFIG',
        description: 'Unable to scan package.json for vulnerabilities',
        recommendation: 'Ensure package.json is accessible and properly formatted'
      });
    }
  }

  private async scanEnvironmentVariables(): Promise<void> {
    const criticalEnvVars = [
      'SESSION_SECRET',
      'ENCRYPTION_KEY',
      'JWT_SECRET',
      'DATABASE_URL'
    ];

    for (const envVar of criticalEnvVars) {
      if (!process.env[envVar]) {
        this.issues.push({
          severity: envVar === 'ENCRYPTION_KEY' ? 'CRITICAL' : 'HIGH',
          category: 'CONFIG',
          description: `Missing critical environment variable: ${envVar}`,
          recommendation: `Set ${envVar} in your environment configuration with a strong, random value`
        });
      } else if (envVar === 'SESSION_SECRET' && process.env[envVar]!.length < 32) {
        this.issues.push({
          severity: 'HIGH',
          category: 'SESSION',
          description: 'Session secret is too short',
          recommendation: 'Use a session secret that is at least 32 characters long'
        });
      }
    }
  }

  private async scanFilePermissions(): Promise<void> {
    try {
      // Check if sensitive files have proper permissions
      const sensitiveFiles = [
        'server/security.ts',
        'server/auth.ts',
        '.env',
        'package.json'
      ];

      for (const file of sensitiveFiles) {
        try {
          const stats = await fs.stat(file);
          const mode = stats.mode.toString(8).slice(-3);
          
          // Check if file is world-readable (ends with 4, 5, 6, or 7)
          if (parseInt(mode[2]) >= 4) {
            this.issues.push({
              severity: 'MEDIUM',
              category: 'CONFIG',
              description: `Sensitive file ${file} may have overly permissive permissions: ${mode}`,
              file,
              recommendation: 'Restrict file permissions to prevent unauthorized access'
            });
          }
        } catch {
          // File doesn't exist, continue
        }
      }
    } catch (error) {
      this.issues.push({
        severity: 'LOW',
        category: 'CONFIG',
        description: 'Unable to check file permissions',
        recommendation: 'Ensure proper file system permissions are set for sensitive files'
      });
    }
  }

  private async scanDependencyInjection(): Promise<void> {
    // Check for potential SQL injection vulnerabilities
    try {
      const routesFile = await fs.readFile('server/routes.ts', 'utf-8');
      
      // Look for direct SQL queries without parameterization
      const sqlPatterns = [
        /SELECT.*\$\{.*\}/gi,
        /INSERT.*\$\{.*\}/gi,
        /UPDATE.*\$\{.*\}/gi,
        /DELETE.*\$\{.*\}/gi
      ];

      for (const pattern of sqlPatterns) {
        if (pattern.test(routesFile)) {
          this.issues.push({
            severity: 'HIGH',
            category: 'INPUT_VALIDATION',
            description: 'Potential SQL injection vulnerability detected in routes.ts',
            file: 'server/routes.ts',
            recommendation: 'Use parameterized queries and input validation for all database operations'
          });
          break;
        }
      }
    } catch {
      // File doesn't exist or can't be read
    }
  }

  private async scanAuthenticationFlaws(): Promise<void> {
    // Check for weak session configuration
    if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'default') {
      this.issues.push({
        severity: 'CRITICAL',
        category: 'SESSION',
        description: 'Using default or weak session secret',
        recommendation: 'Generate a strong, random session secret and store it securely'
      });
    }

    // Check for missing HTTPS enforcement in production
    if (process.env.NODE_ENV === 'production' && !process.env.FORCE_HTTPS) {
      this.issues.push({
        severity: 'HIGH',
        category: 'CONFIG',
        description: 'HTTPS enforcement not configured for production',
        recommendation: 'Enable HTTPS enforcement and secure cookie settings for production'
      });
    }
  }

  generateSecurityReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      totalIssues: this.issues.length,
      severityCount: {
        CRITICAL: this.issues.filter(i => i.severity === 'CRITICAL').length,
        HIGH: this.issues.filter(i => i.severity === 'HIGH').length,
        MEDIUM: this.issues.filter(i => i.severity === 'MEDIUM').length,
        LOW: this.issues.filter(i => i.severity === 'LOW').length
      },
      issues: this.issues
    };

    return JSON.stringify(report, null, 2);
  }

  async generateSecuritySummary(): Promise<string> {
    const issues = await this.scanApplication();
    
    let summary = '\n🔒 SECURITY AUDIT SUMMARY\n';
    summary += '==========================\n\n';
    
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
    const highIssues = issues.filter(i => i.severity === 'HIGH');
    const mediumIssues = issues.filter(i => i.severity === 'MEDIUM');
    const lowIssues = issues.filter(i => i.severity === 'LOW');
    
    summary += `🔴 CRITICAL: ${criticalIssues.length}\n`;
    summary += `🟠 HIGH: ${highIssues.length}\n`;
    summary += `🟡 MEDIUM: ${mediumIssues.length}\n`;
    summary += `🟢 LOW: ${lowIssues.length}\n\n`;
    
    if (criticalIssues.length > 0) {
      summary += '🚨 CRITICAL ISSUES (Fix immediately!):\n';
      criticalIssues.forEach((issue, idx) => {
        summary += `${idx + 1}. ${issue.description}\n`;
        summary += `   → ${issue.recommendation}\n\n`;
      });
    }
    
    if (highIssues.length > 0) {
      summary += '⚠️  HIGH PRIORITY ISSUES:\n';
      highIssues.forEach((issue, idx) => {
        summary += `${idx + 1}. ${issue.description}\n`;
        summary += `   → ${issue.recommendation}\n\n`;
      });
    }
    
    if (issues.length === 0) {
      summary += '✅ No security issues detected!\n';
    }
    
    summary += '\n📊 Full report available via generateSecurityReport()\n';
    
    return summary;
  }
}

// Export singleton instance
export const securityScanner = new SecurityScanner();