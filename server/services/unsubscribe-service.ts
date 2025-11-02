/**
 * Unsubscribe Service
 * Manages email unsubscribe links and preferences
 */

import crypto from 'crypto';

interface UnsubscribeLink {
  email: string;
  token: string;
  url: string;
}

export class UnsubscribeService {
  private baseUrl: string;
  private secretKey: string;

  constructor() {
    this.baseUrl = process.env.REPLIT_DOMAINS || 'http://localhost:5000';
    this.secretKey = process.env.UNSUBSCRIBE_SECRET || 'default-secret-key-change-in-production';
  }

  /**
   * Generate unsubscribe token for an email
   */
  generateToken(email: string): string {
    const hash = crypto
      .createHmac('sha256', this.secretKey)
      .update(email.toLowerCase())
      .digest('hex');
    
    return Buffer.from(`${email}:${hash}`).toString('base64url');
  }

  /**
   * Verify unsubscribe token
   */
  verifyToken(token: string): { valid: boolean; email?: string } {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf-8');
      const [email, hash] = decoded.split(':');

      const expectedHash = crypto
        .createHmac('sha256', this.secretKey)
        .update(email.toLowerCase())
        .digest('hex');

      if (hash === expectedHash) {
        return { valid: true, email };
      }

      return { valid: false };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Generate complete unsubscribe link
   */
  generateUnsubscribeLink(email: string): UnsubscribeLink {
    const token = this.generateToken(email);
    const url = `${this.baseUrl}/unsubscribe?token=${token}`;

    return {
      email,
      token,
      url
    };
  }

  /**
   * Add unsubscribe footer to HTML email
   */
  addUnsubscribeFooter(htmlContent: string, email: string, companyName: string = 'NODE CRM'): string {
    const { url } = this.generateUnsubscribeLink(email);
    
    const footer = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
        <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
        <p>
          <a href="${url}" style="color: #666; text-decoration: underline;">Unsubscribe</a> from these emails
        </p>
        <p style="margin-top: 10px;">
          ${companyName}<br>
          Argilette Organization<br>
          Email: info@argilette.org
        </p>
      </div>
    `;

    // Try to insert before closing body tag, or append if not found
    if (htmlContent.includes('</body>')) {
      return htmlContent.replace('</body>', `${footer}</body>`);
    } else {
      return htmlContent + footer;
    }
  }

  /**
   * Add unsubscribe to plain text email
   */
  addUnsubscribeText(textContent: string, email: string): string {
    const { url } = this.generateUnsubscribeLink(email);
    
    const footer = `

---
To unsubscribe from these emails, visit: ${url}

© ${new Date().getFullYear()} NODE CRM - Argilette Organization
Email: info@argilette.org
`;

    return textContent + footer;
  }

  /**
   * Generate List-Unsubscribe header (for email clients)
   */
  generateUnsubscribeHeaders(email: string): {
    'List-Unsubscribe': string;
    'List-Unsubscribe-Post': string;
  } {
    const { url } = this.generateUnsubscribeLink(email);
    
    return {
      'List-Unsubscribe': `<${url}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    };
  }
}

export const unsubscribeService = new UnsubscribeService();
