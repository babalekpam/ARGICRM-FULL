import { createTransporter } from './email-transporter.js';

interface EmailVerificationData {
  email: string;
  firstName: string;
  lastName: string;
  verificationToken: string;
  verificationUrl: string;
}

interface PasswordResetData {
  email: string;
  firstName: string;
  resetUrl: string;
}

class EmailService {
  private transporter: any = null;
  private isConfigured = false;

  constructor() {
    this.initializeService();
  }

  private async initializeService() {
    try {
      this.transporter = await createTransporter();
      this.isConfigured = !!this.transporter;
      
      if (this.isConfigured) {
      } else {
      }
    } catch (error) {
    }
  }

  async sendVerificationEmail(data: EmailVerificationData): Promise<boolean> {
    // Force email initialization if not configured
    if (!this.isConfigured || !this.transporter) {
      await this.initializeService();
    }
    
    if (!this.isConfigured || !this.transporter) {
      return false; // Return false to indicate email wasn't sent
    }

    try {
      const fromEmail = process.env.SMTP_FROM_EMAIL || 'no-reply@argilette.org';
      const mailOptions = {
        from: `"NODE CRM" <${fromEmail}>`,
        to: data.email,
        subject: 'Activate Your NODE CRM Account',
        html: this.getVerificationEmailTemplate(data),
        text: `Hi ${data.firstName},

Welcome to NODE CRM! Please activate your account by clicking the link below:

${data.verificationUrl}

This link will expire in 24 hours.

If you didn't create this account, please ignore this email.

Best regards,
The NODE CRM Team`
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      return false;
    }
  }

  private getVerificationEmailTemplate(data: EmailVerificationData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Activate Your NODE CRM Account</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to NODE CRM!</h1>
        </div>
        <div class="content">
            <p>Hi ${data.firstName},</p>
            
            <p>Thank you for signing up for NODE CRM! We're excited to have you on board.</p>
            
            <p>To complete your registration and activate your account, please click the button below:</p>
            
            <div style="text-align: center;">
                <a href="${data.verificationUrl}" class="button">Activate My Account</a>
            </div>
            
            <p><strong>This link will expire in 24 hours.</strong></p>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace;">${data.verificationUrl}</p>
            
            <p>If you didn't create this account, please ignore this email.</p>
            
            <p>Welcome aboard!<br>The NODE CRM Team</p>
        </div>
        <div class="footer">
            <p>© 2025 NODE CRM. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  async sendPasswordResetEmail(data: PasswordResetData): Promise<boolean> {
    // Force email initialization if not configured
    if (!this.isConfigured || !this.transporter) {
      await this.initializeService();
    }
    
    if (!this.isConfigured || !this.transporter) {
      return false;
    }

    try {
      const fromEmail = process.env.SMTP_FROM_EMAIL || 'no-reply@argilette.org';
      const mailOptions = {
        from: `"NODE CRM" <${fromEmail}>`,
        to: data.email,
        subject: 'Reset Your NODE CRM Password',
        html: this.getPasswordResetEmailTemplate(data),
        text: `Hi ${data.firstName},

We received a request to reset your NODE CRM password. Click the link below to create a new password:

${data.resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The NODE CRM Team`
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      return true;
    }

    try {
      const fromEmail = process.env.SMTP_FROM_EMAIL || 'no-reply@argilette.org';
      const mailOptions = {
        from: `"NODE CRM" <${fromEmail}>`,
        to: email,
        subject: 'Welcome to NODE CRM - Your Account is Ready!',
        html: this.getWelcomeEmailTemplate(firstName),
        text: `Hi ${firstName},

Your NODE CRM account has been successfully activated! 

You can now sign in and start managing your customer relationships with our powerful CRM platform.

Get started: ${process.env.REPLIT_DOMAINS || 'http://localhost:5000'}

Best regards,
The NODE CRM Team`
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      return false;
    }
  }

  private getWelcomeEmailTemplate(firstName: string): string {
    const loginUrl = process.env.REPLIT_DOMAINS || 'http://localhost:5000';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to NODE CRM</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Account Activated!</h1>
        </div>
        <div class="content">
            <p>Hi ${firstName},</p>
            
            <p>Congratulations! Your NODE CRM account has been successfully activated and is ready to use.</p>
            
            <div style="text-align: center;">
                <a href="${loginUrl}" class="button">Sign In to Your Account</a>
            </div>
            
            <h3>What you can do now:</h3>
            
            <div class="feature">
                <strong>🏢 Manage Contacts & Accounts</strong><br>
                Organize your customer relationships and company data
            </div>
            
            <div class="feature">
                <strong>📈 Track Deals & Pipeline</strong><br>
                Monitor your sales opportunities and revenue forecasts
            </div>
            
            <div class="feature">
                <strong>📧 Email Marketing</strong><br>
                Create and send professional email campaigns
            </div>
            
            <div class="feature">
                <strong>📊 Advanced Analytics</strong><br>
                Get insights with powerful reporting and dashboard features
            </div>
            
            <p>Need help getting started? Our support team is here to assist you at <a href="mailto:info@argilette.org">info@argilette.org</a></p>
            
            <p>Thank you for choosing NODE CRM!<br>The NODE CRM Team</p>
        </div>
        <div class="footer">
            <p>© 2025 NODE CRM. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private getPasswordResetEmailTemplate(data: PasswordResetData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your NODE CRM Password</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hi ${data.firstName},</p>
            
            <p>We received a request to reset your NODE CRM password. If you made this request, click the button below to set a new password:</p>
            
            <div style="text-align: center;">
                <a href="${data.resetUrl}" class="button">Reset My Password</a>
            </div>
            
            <p><strong>This link will expire in 1 hour.</strong></p>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace;">${data.resetUrl}</p>
            
            <div class="warning">
                <strong>⚠️ Security Note:</strong><br>
                If you didn't request a password reset, please ignore this email. Your password will remain unchanged and your account is secure.
            </div>
            
            <p>Best regards,<br>The NODE CRM Team</p>
        </div>
        <div class="footer">
            <p>© 2025 NODE CRM. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
  }
}

export const emailService = new EmailService();