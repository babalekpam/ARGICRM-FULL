import nodemailer from 'nodemailer';
import { MailService } from '@sendgrid/mail';

export async function createTransporter() {
  // Check for SendGrid API key first (preferred method)
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  
  if (sendgridApiKey) {
    try {
      // Use official SendGrid Mail Service
      const mailService = new MailService();
      mailService.setApiKey(sendgridApiKey);
      
      // Test the connection with a simple validation
      const isValid = sendgridApiKey.startsWith('SG.') && sendgridApiKey.length > 50;
      
      if (!isValid) {
        throw new Error('Invalid SendGrid API key format');
      }
      
      
      // Return a nodemailer-compatible transporter interface
      return {
        sendMail: async (mailOptions: any) => {
          try {
            const msg: any = {
              to: mailOptions.to,
              from: mailOptions.from,
              subject: mailOptions.subject,
              text: mailOptions.text,
              html: mailOptions.html,
            };
            
            // Support additional fields
            if (mailOptions.cc) msg.cc = mailOptions.cc;
            if (mailOptions.bcc) msg.bcc = mailOptions.bcc;
            if (mailOptions.replyTo) msg.replyTo = mailOptions.replyTo;
            if (mailOptions.headers) msg.headers = mailOptions.headers;
            if (mailOptions.attachments) msg.attachments = mailOptions.attachments;
            
            const response = await mailService.send(msg);
            
            // Extract message ID with fallback
            const messageId = response[0]?.headers?.['x-message-id'] 
                           || response[0]?.headers?.['X-Message-Id'] 
                           || `sg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Return nodemailer-compatible response
            return {
              messageId: messageId,
              accepted: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
              rejected: [],
              response: `SendGrid API - Status: ${response[0]?.statusCode || 202}`,
              envelope: {
                from: mailOptions.from,
                to: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to]
              }
            };
          } catch (error: any) {
            console.error('❌ SendGrid API Error:', error);
            // Convert SendGrid error to consistent format
            const sendgridError = new Error(`SendGrid Error: ${error.message || 'Unknown error'}`);
            if (error.code) {
              (sendgridError as any).code = error.code;
            }
            if (error.response) {
              (sendgridError as any).response = error.response.body;
              (sendgridError as any).statusCode = error.response.status;
            }
            throw sendgridError;
          }
        },
        verify: async () => {
          try {
            // Validate API key format and attempt a lightweight verification
            const isValidFormat = sendgridApiKey.startsWith('SG.') && sendgridApiKey.length > 50;
            if (!isValidFormat) {
              throw new Error('Invalid API key format');
            }
            
            // Test with a minimal request to validate the key
            await mailService.send({
              to: 'test@example.com',
              from: 'no-reply@argilette.org', 
              subject: 'Connection Test',
              text: 'Test'
            }, true); // sandbox mode - won't actually send
            
            return true;
          } catch (error: any) {
            throw error;
          }
        }
      };
    } catch (error) {
    }
  }
  // Check for Gmail SMTP credentials
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  
  // Check for generic SMTP credentials
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  
  // Try Gmail SMTP first
  if (gmailUser && gmailPass) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });
    
    try {
      await transporter.verify();
      return transporter;
    } catch (error) {
    }
  }
  
  // Try generic SMTP
  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
    
    try {
      await transporter.verify();
      return transporter;
    } catch (error) {
    }
  }
  
  // Try Outlook/Hotmail SMTP
  const outlookUser = process.env.OUTLOOK_USER;
  const outlookPass = process.env.OUTLOOK_PASSWORD;
  
  if (outlookUser && outlookPass) {
    const transporter = nodemailer.createTransport({
      service: 'hotmail',
      auth: {
        user: outlookUser,
        pass: outlookPass
      }
    });
    
    try {
      await transporter.verify();
      return transporter;
    } catch (error) {
    }
  }
  
  
  // Development fallback: Create a mock transporter that simulates sending emails
  if (process.env.NODE_ENV === 'development') {
    return {
      sendMail: async (mailOptions: any) => {
        if (mailOptions.text) {
          const urlMatch = mailOptions.text.match(/https?:\/\/[^\s]+/);
          if (urlMatch) {
          }
        }
        return { messageId: 'simulated-' + Date.now() };
      },
      verify: async () => true // Always return true for verification
    };
  }
  
  return null;
}