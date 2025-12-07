import express, { Request, Response } from 'express';
import { db } from '../db.js';
import { 
  enrichmentJobs, 
  emailValidations, 
  contacts, 
  tenantSubscriptions,
  insertEnrichmentJobSchema,
  insertEmailValidationSchema 
} from '../../shared/schema.js';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { authenticate } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();

const DATAFORSEO_API_URL = "https://api.dataforseo.com/v3";

function hasDataForSEOCredentials(): boolean {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  return !!(login && password);
}

function getDataForSEOAuthHeader(): string | null {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  
  if (!login || !password) {
    return null;
  }
  
  return `Basic ${Buffer.from(`${login}:${password}`).toString("base64")}`;
}

async function callDataForSEOAPI(endpoint: string, body: any): Promise<any> {
  const authHeader = getDataForSEOAuthHeader();
  if (!authHeader) {
    throw new Error("DataForSEO credentials not configured");
  }

  const response = await fetch(`${DATAFORSEO_API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`DataForSEO API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function generateDemoEnrichmentData(email?: string, domain?: string, linkedinUrl?: string): any {
  const baseDomain = domain || (email ? email.split('@')[1] : 'example.com');
  const companyName = baseDomain.split('.')[0].charAt(0).toUpperCase() + baseDomain.split('.')[0].slice(1);
  
  const result: any = {
    companyName: `${companyName} Inc`,
    industry: 'Technology',
    website: baseDomain,
    description: `${companyName} is a leading company in their industry, providing innovative solutions.`,
    location: {
      city: 'San Francisco',
      state: 'California',
      country: 'US',
    },
    socialProfiles: {
      linkedin: `https://linkedin.com/company/${baseDomain.split('.')[0]}`,
    },
    employeeCount: '50-200',
    foundedYear: 2015,
  };

  if (email) {
    result.email = email;
    const emailParts = email.split('@')[0].split('.');
    if (emailParts.length >= 2) {
      result.firstName = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
      result.lastName = emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1);
    }
  }

  return result;
}

// POST /api/enrichment/contact - Enrich a single contact from domain/email
router.post('/contact', authenticate as any, async (req: any, res: Response) => {
  try {
    const user = req.user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const enrichContactSchema = z.object({
      email: z.string().email().optional(),
      domain: z.string().optional(),
      linkedinUrl: z.string().url().optional(),
      contactId: z.string().optional(),
    }).refine(data => data.email || data.domain || data.linkedinUrl, {
      message: "At least one of email, domain, or linkedinUrl is required"
    });

    const validatedData = enrichContactSchema.parse(req.body);
    const isDemo = !hasDataForSEOCredentials();

    if (isDemo) {
      const demoData = generateDemoEnrichmentData(validatedData.email, validatedData.domain, validatedData.linkedinUrl);
      return res.json({
        success: true,
        isDemo: true,
        message: "DataForSEO credentials not configured - showing sample data",
        data: demoData,
        job: null,
      });
    }

    const [job] = await db.insert(enrichmentJobs).values({
      tenantId: user.tenantId,
      contactId: validatedData.contactId || null,
      jobType: 'contact_enrich',
      status: 'processing',
      provider: 'dataforseo',
      inputData: {
        email: validatedData.email,
        domain: validatedData.domain,
        linkedinUrl: validatedData.linkedinUrl,
      },
      startedAt: new Date(),
    }).returning();

    try {
      let enrichmentResult: any = {};
      const domain = validatedData.domain || (validatedData.email ? validatedData.email.split('@')[1] : null);

      if (domain) {
        try {
          const domainData = await callDataForSEOAPI('/business_data/business_listings/search/live', [{
            keyword: domain,
            location_code: 2840,
            language_code: "en",
            limit: 1,
          }]);

          const businessInfo = domainData?.tasks?.[0]?.result?.[0]?.items?.[0];
          if (businessInfo) {
            enrichmentResult = {
              companyName: businessInfo.title || businessInfo.domain,
              industry: businessInfo.category || null,
              website: businessInfo.domain || domain,
              description: businessInfo.description || null,
              location: {
                city: businessInfo.address_info?.city,
                state: businessInfo.address_info?.region,
                country: businessInfo.address_info?.country_code,
              },
              socialProfiles: {
                linkedin: businessInfo.social_url,
              },
            };
          }
        } catch (apiError) {
          console.log('Business listings API not available, using domain info');
          enrichmentResult = {
            website: domain,
            companyName: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
          };
        }
      }

      if (validatedData.email) {
        enrichmentResult.email = validatedData.email;
        const emailParts = validatedData.email.split('@')[0].split('.');
        if (emailParts.length >= 2) {
          enrichmentResult.firstName = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
          enrichmentResult.lastName = emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1);
        }
      }

      const [updatedJob] = await db.update(enrichmentJobs)
        .set({
          status: 'completed',
          resultData: enrichmentResult,
          confidence: Object.keys(enrichmentResult).length > 3 ? 0.85 : 0.6,
          creditsUsed: 1,
          completedAt: new Date(),
        })
        .where(eq(enrichmentJobs.id, job.id))
        .returning();

      res.json({
        success: true,
        isDemo: false,
        job: updatedJob,
        data: enrichmentResult,
      });
    } catch (enrichError) {
      await db.update(enrichmentJobs)
        .set({
          status: 'failed',
          errorMessage: (enrichError as Error).message,
          completedAt: new Date(),
        })
        .where(eq(enrichmentJobs.id, job.id));

      throw enrichError;
    }
  } catch (error) {
    console.error('Error enriching contact:', error);
    res.status(500).json({ error: 'Failed to enrich contact', details: (error as Error).message });
  }
});

// POST /api/enrichment/bulk - Bulk enrich multiple contacts
router.post('/bulk', authenticate as any, async (req: any, res: Response) => {
  try {
    const user = req.user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const bulkEnrichSchema = z.object({
      contacts: z.array(z.object({
        email: z.string().email().optional(),
        domain: z.string().optional(),
        linkedinUrl: z.string().url().optional(),
        contactId: z.string().optional(),
      })).min(1).max(100),
    });

    const { contacts: contactsToEnrich } = bulkEnrichSchema.parse(req.body);

    const jobs = await db.insert(enrichmentJobs).values(
      contactsToEnrich.map(contact => ({
        tenantId: user.tenantId,
        contactId: contact.contactId || null,
        jobType: 'contact_enrich' as const,
        status: 'pending' as const,
        provider: 'dataforseo',
        inputData: {
          email: contact.email,
          domain: contact.domain,
          linkedinUrl: contact.linkedinUrl,
        },
      }))
    ).returning();

    res.json({
      success: true,
      message: `${jobs.length} enrichment jobs queued`,
      jobs: jobs.map(j => ({ id: j.id, status: j.status })),
      totalJobs: jobs.length,
    });
  } catch (error) {
    console.error('Error bulk enriching contacts:', error);
    res.status(500).json({ error: 'Failed to bulk enrich contacts' });
  }
});

// GET /api/enrichment/jobs - Get enrichment job history
router.get('/jobs', authenticate as any, async (req: any, res: Response) => {
  try {
    const user = req.user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const status = req.query.status as string;
    const jobType = req.query.jobType as string;

    const conditions: any[] = [eq(enrichmentJobs.tenantId, user.tenantId)];
    
    if (status) {
      conditions.push(eq(enrichmentJobs.status, status));
    }
    if (jobType) {
      conditions.push(eq(enrichmentJobs.jobType, jobType));
    }

    const offset = (page - 1) * limit;

    const [jobs, countResult] = await Promise.all([
      db.select()
        .from(enrichmentJobs)
        .where(and(...conditions))
        .orderBy(desc(enrichmentJobs.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` })
        .from(enrichmentJobs)
        .where(and(...conditions))
    ]);

    const totalCount = Number(countResult[0]?.count || 0);

    res.json({
      jobs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching enrichment jobs:', error);
    res.status(500).json({ error: 'Failed to fetch enrichment jobs' });
  }
});

// GET /api/enrichment/jobs/:id - Get job status/results
router.get('/jobs/:id', authenticate as any, async (req: any, res: Response) => {
  try {
    const user = req.user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const [job] = await db.select()
      .from(enrichmentJobs)
      .where(and(
        eq(enrichmentJobs.id, id),
        eq(enrichmentJobs.tenantId, user.tenantId)
      ));

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching enrichment job:', error);
    res.status(500).json({ error: 'Failed to fetch enrichment job' });
  }
});

// POST /api/enrichment/email/find - Find email for contact (name + company)
router.post('/email/find', authenticate as any, async (req: any, res: Response) => {
  try {
    const user = req.user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const findEmailSchema = z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      company: z.string().min(1),
      domain: z.string().optional(),
    });

    const validatedData = findEmailSchema.parse(req.body);
    const domain = validatedData.domain || validatedData.company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
    const isDemo = !hasDataForSEOCredentials();

    const emailPatterns = [
      `${validatedData.firstName.toLowerCase()}.${validatedData.lastName.toLowerCase()}@${domain}`,
      `${validatedData.firstName.toLowerCase()}${validatedData.lastName.toLowerCase()}@${domain}`,
      `${validatedData.firstName[0].toLowerCase()}${validatedData.lastName.toLowerCase()}@${domain}`,
      `${validatedData.firstName.toLowerCase()}@${domain}`,
      `${validatedData.lastName.toLowerCase()}.${validatedData.firstName.toLowerCase()}@${domain}`,
    ];

    if (isDemo) {
      return res.json({
        success: true,
        isDemo: true,
        message: "DataForSEO credentials not configured - showing generated email patterns",
        email: emailPatterns[0],
        alternatives: emailPatterns.slice(1),
        confidence: 0.65,
        job: null,
      });
    }

    const [job] = await db.insert(enrichmentJobs).values({
      tenantId: user.tenantId,
      jobType: 'email_find',
      status: 'processing',
      provider: 'internal',
      inputData: {
        name: `${validatedData.firstName} ${validatedData.lastName}`,
        company: validatedData.company,
        domain: domain,
      },
      startedAt: new Date(),
    }).returning();

    const [updatedJob] = await db.update(enrichmentJobs)
      .set({
        status: 'completed',
        resultData: {
          email: emailPatterns[0],
          alternativeEmails: emailPatterns.slice(1),
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          companyName: validatedData.company,
        } as any,
        confidence: 0.75,
        creditsUsed: 1,
        completedAt: new Date(),
      })
      .where(eq(enrichmentJobs.id, job.id))
      .returning();

    res.json({
      success: true,
      isDemo: false,
      job: updatedJob,
      email: emailPatterns[0],
      alternatives: emailPatterns.slice(1),
      confidence: 0.75,
    });
  } catch (error) {
    console.error('Error finding email:', error);
    res.status(500).json({ error: 'Failed to find email' });
  }
});

// POST /api/enrichment/email/validate - Validate email address
router.post('/email/validate', authenticate as any, async (req: any, res: Response) => {
  try {
    const user = req.user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validateEmailSchema = z.object({
      email: z.string().email(),
    });

    const { email } = validateEmailSchema.parse(req.body);
    const isDemo = !hasDataForSEOCredentials();

    const domain = email.split('@')[1];
    const isDisposable = ['tempmail.com', 'throwaway.email', 'guerrillamail.com', '10minutemail.com', 'mailinator.com'].includes(domain);
    const isFreeProvider = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com'].includes(domain);
    const isRoleAccount = email.split('@')[0].match(/^(info|support|admin|contact|sales|hello|team|help|noreply|no-reply)$/i) !== null;

    let status: string;
    let isValid: boolean;
    let deliverability: string;

    if (isDisposable) {
      status = 'disposable';
      isValid = false;
      deliverability = 'undeliverable';
    } else if (isRoleAccount) {
      status = 'risky';
      isValid = true;
      deliverability = 'risky';
    } else {
      status = 'valid';
      isValid = true;
      deliverability = 'deliverable';
    }

    if (isDemo) {
      return res.json({
        success: true,
        isDemo: true,
        message: "DataForSEO credentials not configured - showing sample validation",
        validation: {
          id: 'demo-' + Date.now(),
          email: email.toLowerCase(),
          isValid,
          status,
          deliverability,
          isDisposable,
          isFreeProvider,
          isRoleAccount,
          isCatchAll: false,
          provider: 'demo',
          confidence: 0.75,
        },
      });
    }

    const existingValidation = await db.select()
      .from(emailValidations)
      .where(and(
        eq(emailValidations.tenantId, user.tenantId),
        eq(emailValidations.email, email.toLowerCase())
      ))
      .limit(1);

    if (existingValidation.length > 0) {
      const existing = existingValidation[0];
      if (existing.expiresAt && new Date(existing.expiresAt) > new Date()) {
        return res.json({
          cached: true,
          isDemo: false,
          validation: existing,
        });
      }
    }

    const [validation] = await db.insert(emailValidations).values({
      tenantId: user.tenantId,
      email: email.toLowerCase(),
      isValid,
      status,
      deliverability,
      isDisposable,
      isFreeProvider,
      isRoleAccount,
      isCatchAll: false,
      provider: 'internal',
      confidence: 0.85,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }).returning();

    res.json({
      success: true,
      isDemo: false,
      validation,
    });
  } catch (error) {
    console.error('Error validating email:', error);
    res.status(500).json({ error: 'Failed to validate email' });
  }
});

// POST /api/enrichment/email/validate/bulk - Bulk validate emails
router.post('/email/validate/bulk', authenticate as any, async (req: any, res: Response) => {
  try {
    const user = req.user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const bulkValidateSchema = z.object({
      emails: z.array(z.string().email()).min(1).max(1000),
    });

    const { emails } = bulkValidateSchema.parse(req.body);
    const isDemo = !hasDataForSEOCredentials();

    const results: any[] = [];
    const errors: any[] = [];

    for (const email of emails) {
      try {
        const domain = email.split('@')[1];
        const isDisposable = ['tempmail.com', 'throwaway.email', 'guerrillamail.com', '10minutemail.com', 'mailinator.com'].includes(domain);
        const isFreeProvider = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com'].includes(domain);
        const isRoleAccount = email.split('@')[0].match(/^(info|support|admin|contact|sales|hello|team|help|noreply|no-reply)$/i) !== null;

        let status: string;
        let isValid: boolean;
        let deliverability: string;

        if (isDisposable) {
          status = 'disposable';
          isValid = false;
          deliverability = 'undeliverable';
        } else if (isRoleAccount) {
          status = 'risky';
          isValid = true;
          deliverability = 'risky';
        } else {
          status = 'valid';
          isValid = true;
          deliverability = 'deliverable';
        }

        if (isDemo) {
          results.push({
            id: 'demo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            email: email.toLowerCase(),
            isValid,
            status,
            deliverability,
            isDisposable,
            isFreeProvider,
            isRoleAccount,
            isCatchAll: false,
            provider: 'demo',
            confidence: 0.75,
          });
        } else {
          const [validation] = await db.insert(emailValidations).values({
            tenantId: user.tenantId,
            email: email.toLowerCase(),
            isValid,
            status,
            deliverability,
            isDisposable,
            isFreeProvider,
            isRoleAccount,
            isCatchAll: false,
            provider: 'internal',
            confidence: 0.85,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          }).returning();

          results.push(validation);
        }
      } catch (err) {
        errors.push({ email, error: (err as Error).message });
      }
    }

    res.json({
      success: true,
      isDemo,
      message: isDemo ? "DataForSEO credentials not configured - showing sample validation results" : undefined,
      totalProcessed: results.length,
      totalErrors: errors.length,
      results,
      errors,
      stats: {
        valid: results.filter(r => r.status === 'valid').length,
        invalid: results.filter(r => r.status === 'invalid').length,
        risky: results.filter(r => r.status === 'risky').length,
        disposable: results.filter(r => r.status === 'disposable').length,
      },
    });
  } catch (error) {
    console.error('Error bulk validating emails:', error);
    res.status(500).json({ error: 'Failed to bulk validate emails' });
  }
});

// GET /api/enrichment/credits - Get remaining enrichment credits
router.get('/credits', authenticate as any, async (req: any, res: Response) => {
  try {
    const user = req.user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [subscription] = await db.select()
      .from(tenantSubscriptions)
      .where(eq(tenantSubscriptions.tenantId, user.tenantId))
      .limit(1);

    const usageLimits = (subscription?.usageLimits as any) || {};
    const currentUsage = (subscription?.currentUsage as any) || {};

    const enrichmentLimit = usageLimits.enrichmentCredits || 1000;
    const emailValidationLimit = usageLimits.emailValidationCredits || 5000;

    const [enrichmentUsed, validationUsed] = await Promise.all([
      db.select({ count: sql<number>`COALESCE(SUM(credits_used), 0)` })
        .from(enrichmentJobs)
        .where(eq(enrichmentJobs.tenantId, user.tenantId)),
      db.select({ count: sql<number>`count(*)` })
        .from(emailValidations)
        .where(eq(emailValidations.tenantId, user.tenantId)),
    ]);

    res.json({
      enrichment: {
        used: Number(enrichmentUsed[0]?.count || 0),
        limit: enrichmentLimit,
        remaining: Math.max(0, enrichmentLimit - Number(enrichmentUsed[0]?.count || 0)),
      },
      emailValidation: {
        used: Number(validationUsed[0]?.count || 0),
        limit: emailValidationLimit,
        remaining: Math.max(0, emailValidationLimit - Number(validationUsed[0]?.count || 0)),
      },
      plan: subscription?.planId || 'starter',
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    res.status(500).json({ error: 'Failed to fetch credits' });
  }
});

// GET /api/enrichment/email/validations - Get validation history
router.get('/email/validations', authenticate as any, async (req: any, res: Response) => {
  try {
    const user = req.user;
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const status = req.query.status as string;

    const conditions: any[] = [eq(emailValidations.tenantId, user.tenantId)];
    
    if (status) {
      conditions.push(eq(emailValidations.status, status));
    }

    const offset = (page - 1) * limit;

    const [validations, countResult] = await Promise.all([
      db.select()
        .from(emailValidations)
        .where(and(...conditions))
        .orderBy(desc(emailValidations.validatedAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` })
        .from(emailValidations)
        .where(and(...conditions))
    ]);

    res.json({
      validations,
      pagination: {
        page,
        limit,
        totalCount: Number(countResult[0]?.count || 0),
        totalPages: Math.ceil(Number(countResult[0]?.count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching validations:', error);
    res.status(500).json({ error: 'Failed to fetch validations' });
  }
});

export default router;
