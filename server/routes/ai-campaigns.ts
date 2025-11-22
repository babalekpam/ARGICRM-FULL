import { Router, Response } from 'express';
import { z } from 'zod';
import { insertAIContentSchema, insertAIUsageSchema } from '@shared/schema';
import type { IStorage } from '../storage';
import { aiFailoverService } from '../services/ai-failover-service';
import { resolveTenant, validateUserTenant, type TenantRequest } from '../middleware/tenant';
import { authenticate } from '../middleware/auth';
import { DatabaseStorage } from '../database-storage';
import { emailService } from '../email';

const router = Router();

// Apply authentication and tenant middleware
router.use(authenticate);
router.use(resolveTenant);
router.use(validateUserTenant);

// Helper function to get storage
function getUserStorage(req: any): IStorage {
  const userEmail = req.user?.email || 'system@default.com';
  const tenantId = req.tenant?.id || 'default-tenant';
  const isPlatformOwner = userEmail === 'abel@argilette.com';
  return new DatabaseStorage(userEmail, tenantId, isPlatformOwner);
}

const aiService = aiFailoverService;

// Validation schemas
const generateAdSchema = z.object({
  url: z.string().url(),
  channel: z.enum(['facebook', 'instagram', 'tiktok', 'google_ads', 'twitter', 'linkedin', 'snapchat', 'pinterest']),
  audience: z.string().optional(),
  tone: z.enum(['casual', 'professional', 'friendly', 'urgent', 'playful']).default('professional'),
  objective: z.enum(['awareness', 'conversion', 'engagement', 'traffic']).default('awareness'),
  numVariants: z.number().min(1).max(5).default(3),
});

const generateEmailsSchema = z.object({
  contactIds: z.array(z.string()).optional(),
  contacts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    company: z.string().optional(),
    jobTitle: z.string().optional(),
    phone: z.string().optional(),
  })).optional(),
  objective: z.string(),
  tone: z.enum(['casual', 'professional', 'friendly', 'urgent']).default('professional'),
  websiteUrl: z.string().url().optional(),
  numVariants: z.number().min(1).max(3).default(2),
}).refine(data => (data.contactIds && data.contactIds.length > 0) || (data.contacts && data.contacts.length > 0), {
  message: 'Either contactIds or contacts array is required',
});

// POST /api/ai-campaigns/generate-ad
router.post('/generate-ad', async (req: TenantRequest, res: Response) => {
  try {
    const storage = getUserStorage(req);
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    const validatedData = generateAdSchema.parse(req.body);

    // Build the AI prompt for ad generation
    const prompt = `Generate ${validatedData.numVariants} creative ad variants for ${validatedData.channel}.

Website URL: ${validatedData.url}
Target Audience: ${validatedData.audience || 'General audience'}
Tone: ${validatedData.tone}
Campaign Objective: ${validatedData.objective}

For each variant, provide:
1. Headline (${validatedData.channel === 'google_ads' ? '30 characters max' : '40-50 characters'})
2. Body copy (${validatedData.channel === 'twitter' ? '280 characters max' : '125-150 characters'})
3. Call-to-action (5-10 words)
${['instagram', 'tiktok', 'twitter'].includes(validatedData.channel) ? '4. 3-5 relevant hashtags' : ''}

Platform-specific requirements for ${validatedData.channel}:
${getPlatformGuidelines(validatedData.channel)}

Return the response as valid JSON in this exact format:
{
  "variants": [
    {
      "headline": "...",
      "body": "...",
      "cta": "...",
      "hashtags": ["...", "..."]
    }
  ]
}`;

    // Generate content using AI failover service
    const startTime = Date.now();
    const aiResponse = await aiService.processRequest({
      prompt,
      maxTokens: 2000,
      temperature: 0.8,
      responseFormat: 'json',
      systemPrompt: 'You are an expert advertising copywriter specializing in social media and digital ads. Create compelling, platform-optimized ad copy that drives engagement and conversions.'
    });

    const responseTime = Date.now() - startTime;

    // Parse AI response
    let parsedOutput;
    try {
      parsedOutput = JSON.parse(aiResponse.content);
    } catch (error) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedOutput = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // Create AI content record
    const aiContent = await storage.createAIContent({
      tenantId,
      userId,
      type: 'ad',
      channel: validatedData.channel,
      input: {
        url: validatedData.url,
        audience: validatedData.audience,
        tone: validatedData.tone,
        objective: validatedData.objective,
        numVariants: validatedData.numVariants,
      },
      prompt,
      output: parsedOutput,
      status: 'draft',
      modelUsed: aiResponse.provider,
      tokensIn: aiResponse.tokensUsed || 0,
      tokensOut: 0,
      costCents: estimateCost(aiResponse.provider, aiResponse.tokensUsed || 0),
    });

    // Track usage
    await storage.createAIUsage({
      tenantId,
      userId,
      provider: aiResponse.provider,
      model: aiResponse.provider,
      tokensIn: aiResponse.tokensUsed || 0,
      tokensOut: 0,
      costCents: estimateCost(aiResponse.provider, aiResponse.tokensUsed || 0),
      requestType: 'ad_generation',
      success: true,
    });

    res.json({
      success: true,
      content: aiContent,
      message: `Generated ${parsedOutput.variants?.length || 0} ad variants using ${aiResponse.provider}`,
    });
  } catch (error: any) {
    console.error('Error generating ad:', error);
    
    // Track failed usage
    if (req.storage && req.tenantId) {
      try {
        await (req.storage as IStorage).createAIUsage({
          tenantId: req.tenantId as string,
          userId: req.userId as string,
          provider: 'unknown',
          model: 'unknown',
          tokensIn: 0,
          tokensOut: 0,
          costCents: 0,
          requestType: 'ad_generation',
          success: false,
          errorMessage: error.message,
        });
      } catch (usageError) {
        console.error('Error tracking failed usage:', usageError);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate ad',
    });
  }
});

// POST /api/ai-campaigns/generate-emails
router.post('/generate-emails', async (req: TenantRequest, res: Response) => {
  try {
    const storage = getUserStorage(req);
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;


    const validatedData = generateEmailsSchema.parse(req.body);


    // Handle both contactIds (from CRM) and direct contact objects (from CSV upload)
    let validContacts: any[] = [];

    if (validatedData.contactIds && validatedData.contactIds.length > 0) {
      // Fetch contacts from database with tenant validation - CRITICAL SECURITY: Prevent cross-tenant data access
      const contacts = await Promise.all(
        validatedData.contactIds.map(async (id) => {
          const contact = await storage.getContact(id);
          if (!contact) {
            return undefined;
          }
          // Verify tenant ownership
          if (contact.tenantId !== tenantId) {
            return undefined;
          }
          return contact;
        })
      );
      validContacts = contacts.filter(c => c !== undefined);
    }

    if (validatedData.contacts && validatedData.contacts.length > 0) {
      // Add CSV-uploaded contacts (direct contact objects from client)
      validContacts = [...validContacts, ...validatedData.contacts];
    }


    if (validContacts.length === 0) {
      const errorDetails = {
        contactIdsReceived: validatedData.contactIds?.length || 0,
        csvContactsReceived: validatedData.contacts?.length || 0,
        tenantId: tenantId,
      };
      console.error('[AI Campaigns] No valid contacts found. Details:', errorDetails);
      throw new Error(`No valid contacts found. Received ${errorDetails.contactIdsReceived} contact IDs and ${errorDetails.csvContactsReceived} CSV contacts, but none were valid for tenant ${tenantId}`);
    }

    // Analyze each contact individually and generate personalized emails
    const contactsInfo = validContacts.map(c => ({
      id: c!.id,
      name: c!.name || 'there',
      email: c!.email,
      company: c!.company || '',
      role: c!.jobTitle || '',
      phone: c!.phone || '',
    }));

    const prompt = `You are an expert email marketing specialist. Analyze each contact below and create a UNIQUE, highly personalized email for EACH person based on their specific profile.

CAMPAIGN OBJECTIVE: "${validatedData.objective}"
TONE: ${validatedData.tone}
${validatedData.websiteUrl ? `COMPANY WEBSITE: ${validatedData.websiteUrl}` : ''}

CONTACTS TO ANALYZE (${contactsInfo.length} prospects):
${contactsInfo.map((c, i) => `
${i + 1}. ${c.name}
   - Company: ${c.company || 'Not specified'}
   - Role: ${c.role || 'Not specified'}
   - Email: ${c.email}
   ${c.phone ? `- Phone: ${c.phone}` : ''}
`).join('\n')}

FOR EACH CONTACT ABOVE:
1. Analyze their role and company context
2. Identify what would resonate with them specifically
3. Create a unique email with:
   - Personalized subject line (40-60 chars, mention their company/role when relevant)
   - Custom email body (150-250 words) that speaks directly to their situation
   - Specific call-to-action relevant to their role
   
REQUIREMENTS:
- Each email must be DIFFERENT and tailored to that specific person
- Reference their company/role naturally in the content
- Focus on value THEY would care about based on their position
- Professional but conversational tone
- Include merge tags: {{firstName}}, {{lastName}}, {{company}}, {{jobTitle}} for final personalization

Return as valid JSON with one email per contact IN THE SAME ORDER:
{
  "emails": [
    {
      "contactId": "${contactsInfo[0]?.id}",
      "contactName": "${contactsInfo[0]?.name}",
      "subject": "...",
      "body": "...",
      "cta": "...",
      "personalizationNotes": "why this approach works for this contact"
    }
  ]
}`;

    // Generate content using AI failover service
    const startTime = Date.now();
    const aiResponse = await aiService.processRequest({
      prompt,
      maxTokens: 2500,
      temperature: 0.7,
      responseFormat: 'json',
      systemPrompt: 'You are an expert email marketing copywriter specializing in personalized B2B and B2C email campaigns. Create compelling, conversion-focused email copy that respects recipients and provides value.'
    });

    const responseTime = Date.now() - startTime;

    // Parse AI response
    let parsedOutput;
    try {
      parsedOutput = JSON.parse(aiResponse.content);
    } catch (error) {
      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedOutput = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // Validate we have emails for each contact
    const emails = parsedOutput.emails || [];
    if (emails.length === 0) {
      throw new Error('No emails generated by AI');
    }

    // Create AI content record with individual emails
    const aiContent = await storage.createAIContent({
      tenantId,
      userId,
      type: 'email',
      channel: 'email',
      input: {
        contactIds: validatedData.contactIds,
        objective: validatedData.objective,
        tone: validatedData.tone,
        url: validatedData.websiteUrl,
        numVariants: validatedData.numVariants,
      },
      prompt,
      output: parsedOutput,
      status: 'draft',
      modelUsed: aiResponse.provider,
      tokensIn: aiResponse.tokensUsed || 0,
      tokensOut: 0,
      costCents: estimateCost(aiResponse.provider, aiResponse.tokensUsed || 0),
    });

    // Track usage
    await storage.createAIUsage({
      tenantId,
      userId,
      provider: aiResponse.provider,
      model: aiResponse.provider,
      tokensIn: aiResponse.tokensUsed || 0,
      tokensOut: 0,
      costCents: estimateCost(aiResponse.provider, aiResponse.tokensUsed || 0),
      requestType: 'email_generation',
      success: true,
    });

    res.json({
      success: true,
      content: aiContent,
      emails: emails,
      message: `Generated ${emails.length} personalized emails using ${aiResponse.provider}`,
    });
  } catch (error: any) {
    console.error('Error generating emails:', error);
    
    // Track failed usage
    if (req.storage && req.tenantId) {
      try {
        await (req.storage as IStorage).createAIUsage({
          tenantId: req.tenantId as string,
          userId: req.userId as string,
          provider: 'unknown',
          model: 'unknown',
          tokensIn: 0,
          tokensOut: 0,
          costCents: 0,
          requestType: 'email_generation',
          success: false,
          errorMessage: error.message,
        });
      } catch (usageError) {
        console.error('Error tracking failed usage:', usageError);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate emails',
    });
  }
});

// POST /api/ai-campaigns/send-personalized-emails
router.post('/send-personalized-emails', async (req: TenantRequest, res: Response) => {
  try {
    const storage = getUserStorage(req);
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    const { contentId, contactIds, contacts: csvContacts, fromEmail, fromName } = req.body;

    if (!contentId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: contentId'
      });
    }

    if (!contactIds && !csvContacts) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: contactIds or contacts array'
      });
    }

    // Fetch the AI-generated email content
    const aiContent = await storage.getAIContent(contentId, tenantId);
    if (!aiContent || aiContent.type !== 'email') {
      return res.status(404).json({
        success: false,
        message: 'Email content not found'
      });
    }

    // Handle both contactIds (from CRM) and direct contact objects (from CSV upload)
    let validContacts: any[] = [];

    if (contactIds && Array.isArray(contactIds) && contactIds.length > 0) {
      // Fetch contacts from database with tenant validation
      const dbContacts = await Promise.all(
        contactIds.map(async (id: string) => {
          const contact = await storage.getContact(id);
          if (contact && contact.tenantId !== tenantId) {
            return undefined;
          }
          return contact;
        })
      );
      validContacts = dbContacts.filter(c => c !== undefined);
    }

    if (csvContacts && Array.isArray(csvContacts) && csvContacts.length > 0) {
      // Add CSV-uploaded contacts (direct contact objects from client)
      validContacts = [...validContacts, ...csvContacts];
    }

    if (validContacts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid contacts found'
      });
    }

    // Extract individual emails from AI output
    const individualEmails = aiContent.output?.emails || [];
    if (individualEmails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No personalized emails found in AI content'
      });
    }

    // Send personalized emails individually (not bulk template)
    let totalSent = 0;
    let totalFailed = 0;
    const errors: string[] = [];

    for (const emailData of individualEmails) {
      try {
        // Find the contact for this email
        const contact = validContacts.find(c => c!.id === emailData.contactId);
        if (!contact) {
          totalFailed++;
          errors.push(`Contact not found for email: ${emailData.contactId}`);
          continue;
        }

        // Convert to HTML format with unique content for this contact
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            ${emailData.body.split('\n').map((line: string) => `<p style="margin: 10px 0;">${line}</p>`).join('')}
            ${emailData.cta ? `<p style="margin-top: 20px;"><a href="#" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">${emailData.cta}</a></p>` : ''}
          </div>
        `;

        // Send individual email with unique content
        const result = await emailService.sendBulkEmail({
          contacts: [contact as any],
          template: {
            subject: emailData.subject || 'Important Message',
            htmlContent: htmlContent,
            textContent: emailData.body,
            personalizedFields: ['firstName', 'lastName', 'company', 'jobTitle']
          },
          fromEmail: fromEmail || 'noreply@argilette.org',
          fromName: fromName || 'NODE CRM',
          unsubscribeUrl: `${process.env.BASE_URL || 'https://nodecrm.com'}/unsubscribe`
        });

        totalSent += result.sent;
        totalFailed += result.failed;
        errors.push(...result.errors);
      } catch (error: any) {
        totalFailed++;
        errors.push(`Failed to send email to ${emailData.contactName}: ${error.message}`);
      }
    }

    const result = {
      success: totalFailed === 0,
      sent: totalSent,
      failed: totalFailed,
      errors
    };

    // Update AI content status to 'sent'
    await storage.updateAIContent(contentId, {
      tenantId,
      status: 'sent',
      publishedAt: new Date()
    });

    res.json({
      success: result.success,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors,
      message: `Email campaign sent: ${result.sent} delivered, ${result.failed} failed`
    });
  } catch (error: any) {
    console.error('Error sending personalized emails:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send emails'
    });
  }
});

// GET /api/ai-contents
router.get('/contents', async (req: TenantRequest, res: Response) => {
  try {
    const storage = getUserStorage(req);
    const tenantId = req.tenant!.id;

    const { type, status, channel } = req.query;

    const contents = await storage.getAIContentsByTenant(tenantId, {
      type: type as string | undefined,
      status: status as string | undefined,
      channel: channel as string | undefined,
    });

    res.json({
      success: true,
      contents,
      count: contents.length,
    });
  } catch (error: any) {
    console.error('Error fetching AI contents:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch AI contents',
    });
  }
});

// GET /api/ai-contents/:id
router.get('/contents/:id', async (req: TenantRequest, res: Response) => {
  try {
    const storage = getUserStorage(req);
    const tenantId = req.tenant!.id;
    const { id } = req.params;

    const content = await storage.getAIContent(id, tenantId);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'AI content not found',
      });
    }

    res.json({
      success: true,
      content,
    });
  } catch (error: any) {
    console.error('Error fetching AI content:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch AI content',
    });
  }
});

// PATCH /api/ai-contents/:id
router.patch('/contents/:id', async (req: TenantRequest, res: Response) => {
  try {
    const storage = getUserStorage(req);
    const tenantId = req.tenant!.id;
    const { id } = req.params;

    // Verify ownership
    const existing = await storage.getAIContent(id, tenantId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'AI content not found',
      });
    }

    const updatedContent = await storage.updateAIContent(id, {
      ...req.body,
      tenantId, // Ensure tenant ID is included for security
    });

    res.json({
      success: true,
      content: updatedContent,
      message: 'AI content updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating AI content:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update AI content',
    });
  }
});

// DELETE /api/ai-contents/:id
router.delete('/contents/:id', async (req: TenantRequest, res: Response) => {
  try {
    const storage = getUserStorage(req);
    const tenantId = req.tenant!.id;
    const { id } = req.params;

    const deleted = await storage.deleteAIContent(id, tenantId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'AI content not found',
      });
    }

    res.json({
      success: true,
      message: 'AI content deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting AI content:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete AI content',
    });
  }
});

// GET /api/ai-usage/stats
router.get('/usage/stats', async (req: TenantRequest, res: Response) => {
  try {
    const storage = getUserStorage(req);
    const tenantId = req.tenant!.id;

    const stats = await storage.getTenantAIUsageStats(tenantId);

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching AI usage stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch AI usage stats',
    });
  }
});

// Helper functions
function getPlatformGuidelines(channel: string): string {
  const guidelines: Record<string, string> = {
    facebook: '- Focus on storytelling and community\n- Use conversational tone\n- Emoji usage is acceptable',
    instagram: '- Visual-first copy\n- Use emojis and line breaks\n- Include call to action in bio link',
    tiktok: '- Casual, authentic tone\n- Short, punchy sentences\n- Trending hashtags recommended',
    google_ads: '- Headline: max 30 characters\n- Description: max 90 characters\n- Include keywords',
    twitter: '- Max 280 characters total\n- Front-load key message\n- Use hashtags sparingly (1-2)',
    linkedin: '- Professional tone\n- Value-driven messaging\n- Include industry insights',
    snapchat: '- Youth-oriented language\n- Urgent, time-sensitive messaging\n- Casual and fun tone',
    pinterest: '- Descriptive, keyword-rich\n- DIY and how-to focus\n- Inspirational messaging',
  };

  return guidelines[channel] || 'Follow platform best practices';
}

function estimateCost(provider: string, tokens: number): number {
  // Rough estimates in cents per 1000 tokens
  const costPer1kTokens: Record<string, number> = {
    'you': 0.5,
    'anthropic': 0.8,
    'openai': 1.0,
    'google': 0.4,
    'qwen': 0.3,
  };

  const rate = costPer1kTokens[provider] || 0.5;
  return Math.ceil((tokens / 1000) * rate);
}

// POST /api/ai-campaigns/send-automated - Automated email sending with deliverability optimization
router.post('/send-automated', async (req: TenantRequest, res: Response) => {
  try {
    const { emailValidator } = await import('../services/email-validator.js');
    const { batchEmailSender } = await import('../services/email-batch-sender.js');
    const { spamChecker } = await import('../services/spam-checker.js');
    
    const schema = z.object({
      recipients: z.array(z.string().email()),
      from: z.string().email(),
      fromName: z.string(),
      subject: z.string(),
      htmlContent: z.string(),
      textContent: z.string(),
      warmupMode: z.boolean().default(false),
      daysSinceStart: z.number().default(1),
    });

    const data = schema.parse(req.body);

    // Step 1: Validate and clean email list
    const validation = emailValidator.validateBulk(data.recipients);
    
    if (validation.valid.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid recipients found',
        validation: {
          total: validation.stats.total,
          valid: validation.stats.valid,
          invalid: validation.stats.invalid,
          duplicates: validation.stats.duplicates,
          disposable: validation.stats.disposable,
        }
      });
    }

    // Step 2: Check content for spam
    const spamCheck = spamChecker.checkContent(data.subject, data.textContent, data.htmlContent);
    
    if (spamCheck.isSpammy && spamCheck.risk === 'high') {
      return res.status(400).json({
        success: false,
        message: 'Content flagged as high spam risk',
        spamCheck: {
          score: spamCheck.score,
          risk: spamCheck.risk,
          triggers: spamCheck.triggers,
          suggestions: spamCheck.suggestions,
        }
      });
    }

    // Step 3: Prepare batch configuration based on warm-up
    const warmupConfig = batchEmailSender.getWarmupConfig(data.daysSinceStart);
    const recipientsToSend = data.warmupMode 
      ? validation.valid.slice(0, warmupConfig.maxEmails)
      : validation.valid;


    // Step 4: Send in batches
    const emailBatch = recipientsToSend.map(email => ({
      to: email,
      from: `"${data.fromName}" <${data.from}>`,
      subject: data.subject,
      html: data.htmlContent,
      text: data.textContent,
    }));

    const sendResult = await batchEmailSender.sendBatch(emailBatch, {
      batchSize: warmupConfig.batchSize,
      delayBetweenBatches: warmupConfig.delayMs,
      maxDailyLimit: data.warmupMode ? warmupConfig.maxEmails : undefined,
      warmupMode: data.warmupMode,
    });

    res.json({
      success: true,
      result: {
        sent: sendResult.sent,
        failed: sendResult.failed,
        bounced: sendResult.bounced,
        duration: sendResult.duration,
        errors: sendResult.errors.slice(0, 10), // First 10 errors only
      },
      validation: {
        total: validation.stats.total,
        valid: validation.stats.valid,
        invalid: validation.stats.invalid,
        duplicates: validation.stats.duplicates,
        removed: validation.invalid,
      },
      spamCheck: {
        score: spamCheck.score,
        risk: spamCheck.risk,
        warnings: spamCheck.triggers.length,
        suggestions: spamCheck.suggestions,
      }
    });
  } catch (error: any) {
    console.error('Error in automated email send:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send emails',
    });
  }
});

export default router;
