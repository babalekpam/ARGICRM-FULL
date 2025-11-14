import { Router, Response } from 'express';
import { z } from 'zod';
import { insertFunnelProjectSchema, insertFunnelVersionSchema, insertFunnelStepSchema, insertLandingPageSchema, insertFunnelAdSchema, insertFunnelEmailSchema, insertAiGenerationSchema } from '@shared/schema';
import type { IStorage } from '../storage';
import { aiFailoverService } from '../services/ai-failover-service';
import { resolveTenant, validateUserTenant, type TenantRequest } from '../middleware/tenant';
import { authenticate } from '../middleware/auth';
import { DatabaseStorage } from '../database-storage';

const router = Router();

// Apply authentication and tenant middleware
router.use(authenticate);
router.use(resolveTenant);
router.use(validateUserTenant);

// Helper function to get storage - SECURITY FIX: No default tenant fallback
function getUserStorage(req: any): IStorage {
  if (!req.user?.email || !req.tenant?.id) {
    throw new Error('Missing required tenant context');
  }
  
  const userEmail = req.user.email;
  const tenantId = req.tenant.id;
  const isPlatformOwner = userEmail === 'abel@argilette.com';
  
  return new DatabaseStorage(userEmail, tenantId, isPlatformOwner);
}

const aiService = aiFailoverService;

// ===== TRANSFORMATION HELPERS: snake_case → camelCase =====
// These functions transform database responses (snake_case) to API responses (camelCase)

function transformAiGeneration(db: any) {
  if (!db) return null;
  return {
    id: db.id,
    tenantId: db.tenant_id || db.tenantId,
    provider: db.provider,
    model: db.model,
    tokensUsed: db.tokens_used || db.tokensUsed,
    durationMs: db.duration_ms || db.durationMs,
    prompt: db.prompt,
    generationType: db.generation_type || db.generationType,
    generatedBy: db.generated_by || db.generatedBy,
    createdAt: db.created_at || db.createdAt,
  };
}

function transformLandingPage(db: any) {
  if (!db) return null;
  return {
    id: db.id,
    stepId: db.step_id || db.stepId,
    headline: db.headline,
    subheadline: db.subheadline,
    heroContent: db.hero_content || db.heroContent,
    benefits: db.benefits || [],
    testimonials: db.testimonials || [],
    ctaText: db.cta_text || db.ctaText,
    formFields: db.form_fields || db.formFields || [],
    stylePreset: db.style_preset || db.stylePreset,
    customCss: db.custom_css || db.customCss,
    customScripts: db.custom_scripts || db.customScripts,
    faqs: db.faqs || [],
    metadata: db.metadata || {},
    aiGenerationId: db.ai_generation_id || db.aiGenerationId,
    createdAt: db.created_at || db.createdAt,
    updatedAt: db.updated_at || db.updatedAt,
  };
}

function transformFunnelAd(db: any) {
  if (!db) return null;
  return {
    id: db.id,
    versionId: db.version_id || db.versionId,
    platform: db.platform,
    adType: db.ad_type || db.adType,
    variantName: db.variant_name || db.variantName,
    headline: db.headline,
    bodyText: db.body_text || db.bodyText,
    ctaText: db.cta_text || db.ctaText,
    targetUrl: db.target_url || db.targetUrl,
    targetAudience: db.target_audience || db.targetAudience,
    variants: db.variants || [],
    aiGenerationId: db.ai_generation_id || db.aiGenerationId,
    createdAt: db.created_at || db.createdAt,
  };
}

function transformFunnelEmail(db: any) {
  if (!db) return null;
  return {
    id: db.id,
    versionId: db.version_id || db.versionId,
    sequenceName: db.sequence_name || db.sequenceName,
    sequenceOrder: db.sequence_order || db.sequenceOrder,
    delayDays: db.delay_days || db.delayDays,
    subject: db.subject,
    preheader: db.preheader,
    bodyHtml: db.body_html || db.bodyHtml,
    bodyText: db.body_text || db.bodyText,
    ctaText: db.cta_text || db.ctaText,
    ctaUrl: db.cta_url || db.ctaUrl,
    aiGenerationId: db.ai_generation_id || db.aiGenerationId,
    createdAt: db.created_at || db.createdAt,
  };
}

function transformAutomationWorkflow(db: any) {
  if (!db) return null;
  return {
    id: db.id,
    versionId: db.version_id || db.versionId,
    name: db.name,
    description: db.description,
    triggerType: db.trigger_type || db.triggerType,
    triggerConditions: db.trigger_conditions || db.triggerConditions || {},
    isActive: db.is_active !== undefined ? db.is_active : db.isActive,
    actions: db.actions || [],
    createdAt: db.created_at || db.createdAt,
    updatedAt: db.updated_at || db.updatedAt,
  };
}

function transformFunnelStep(db: any) {
  if (!db) return null;
  return {
    id: db.id,
    versionId: db.version_id || db.versionId,
    name: db.name,
    stepType: db.step_type || db.stepType,
    orderIndex: db.order_index || db.orderIndex,
    description: db.description,
    crmLinkage: db.crm_linkage || db.crmLinkage || {},
    conversionGoal: db.conversion_goal || db.conversionGoal,
    createdAt: db.created_at || db.createdAt,
  };
}

function transformFunnelVersion(db: any) {
  if (!db) return null;
  return {
    id: db.id,
    funnelId: db.funnel_id || db.funnelId,
    versionNumber: db.version_number || db.versionNumber,
    name: db.version_name || db.versionName || db.name,
    sourceFunnelId: db.source_funnel_id || db.sourceFunnelId,
    clonedFromVersionId: db.cloned_from_version_id || db.clonedFromVersionId,
    settings: db.settings || {},
    createdBy: db.created_by || db.createdBy,
    createdAt: db.created_at || db.createdAt,
  };
}

function transformFunnelPublication(db: any) {
  if (!db) return null;
  return {
    id: db.id,
    funnelId: db.funnel_id || db.funnelId,
    versionId: db.version_id || db.versionId,
    publishedUrl: db.published_url || db.publishedUrl,
    customDomain: db.custom_domain || db.customDomain,
    environment: db.environment,
    status: db.status,
    publishedBy: db.published_by || db.publishedBy,
    publishedAt: db.published_at || db.publishedAt,
    lastDeployedAt: db.last_deployed_at || db.lastDeployedAt,
  };
}

function transformFunnelProject(db: any) {
  if (!db) return null;
  return {
    id: db.id,
    tenantId: db.tenant_id || db.tenantId,
    name: db.name,
    description: db.description,
    offerDescription: db.offer_description || db.offerDescription,
    status: db.status,
    isTemplate: db.is_template !== undefined ? db.is_template : db.isTemplate,
    templateCategory: db.template_category || db.templateCategory,
    activeVersionId: db.active_version_id || db.activeVersionId,
    aiGenerationId: db.ai_generation_id || db.aiGenerationId,
    createdBy: db.created_by || db.createdBy,
    createdAt: db.created_at || db.createdAt,
    updatedAt: db.updated_at || db.updatedAt,
  };
}

function transformCompleteFunnel(db: any) {
  if (!db) return null;
  
  return {
    funnel: transformFunnelProject(db.funnel_project || db.funnel),
    version: db.version ? transformFunnelVersion(db.version) : null,
    steps: Array.isArray(db.steps) ? db.steps.map(transformFunnelStep) : [],
    landingPage: transformLandingPage(db.landing_page || db.landingPage),
    ads: Array.isArray(db.ad_assets || db.ads) 
      ? (db.ad_assets || db.ads).map(transformFunnelAd) 
      : [],
    emails: Array.isArray(db.email_sequences || db.emails)
      ? (db.email_sequences || db.emails).map(transformFunnelEmail)
      : [],
    workflows: Array.isArray(db.automation_workflows || db.workflows)
      ? (db.automation_workflows || db.workflows).map(transformAutomationWorkflow)
      : [],
    aiGeneration: transformAiGeneration(db.ai_generation || db.aiGeneration),
  };
}

// Validation schemas
const generateFunnelSchema = z.object({
  offerName: z.string().min(3, "Offer name must be at least 3 characters"),
  offerDescription: z.string().min(10, "Offer description must be at least 10 characters"),
  targetAudience: z.string().optional(),
  pricePoint: z.string().optional(),
  industryType: z.enum(['ecommerce', 'saas', 'consulting', 'coaching', 'agency', 'local_business', 'other']).default('other'),
  funnelGoal: z.enum(['lead_generation', 'product_sales', 'appointment_booking', 'webinar_signup', 'demo_request']).default('lead_generation'),
});

// POST /api/funnels/generate - AI-powered complete funnel generation with database persistence
router.post('/generate', async (req: TenantRequest, res: Response) => {
  try {
    const storage = getUserStorage(req);
    const tenantId = req.tenant!.id;
    const userId = req.user!.id;

    const validatedData = generateFunnelSchema.parse(req.body);

    // Build comprehensive AI prompt for complete funnel generation
    const prompt = `You are an expert marketing funnel strategist and copywriter. Generate a complete, high-converting marketing funnel for this offer:

**Offer Details:**
- Name: ${validatedData.offerName}
- Description: ${validatedData.offerDescription}
- Target Audience: ${validatedData.targetAudience || 'General audience'}
- Price Point: ${validatedData.pricePoint || 'Not specified'}
- Industry: ${validatedData.industryType}
- Primary Goal: ${validatedData.funnelGoal}

**Generate a complete funnel package including:**

1. **Landing Page Copy** (Conversion-optimized):
   - Compelling headline (8-12 words, benefit-driven)
   - Subheadline (supporting the main promise)
   - Hero section content (2-3 sentences establishing credibility)
   - 3-5 key benefits (each with title and description)
   - 2-3 social proof elements (testimonial-style)
   - Strong CTA (call-to-action text)
   - FAQ section (3-5 questions)

2. **Ad Copy for Multiple Platforms**:
   Generate 2 ad variants for each platform:
   - Facebook Ads (headline + 125 char body + CTA)
   - Google Ads (30 char headline + 90 char description)
   - LinkedIn Ads (headline + 150 char body + CTA)

3. **Email Nurture Sequence** (3 emails):
   - Email 1: Welcome & Value Introduction (Day 0)
   - Email 2: Education & Social Proof (Day 2)
   - Email 3: Urgency & Final CTA (Day 4)
   For each email provide: subject line, preview text, and body copy

4. **Automation Workflows**:
   - Form Submit: What happens when someone fills the landing page form
   - Email Clicks: Follow-up actions for email engagement
   - Deal Creation: CRM integration triggers

Return the response as valid JSON in this exact format:
{
  "funnelName": "Generated name for this funnel",
  "landingPage": {
    "headline": "...",
    "subheadline": "...",
    "heroContent": "...",
    "benefits": [
      {"title": "...", "description": "..."}
    ],
    "testimonials": [
      {"quote": "...", "author": "...", "role": "..."}
    ],
    "ctaText": "...",
    "faqs": [
      {"question": "...", "answer": "..."}
    ]
  },
  "adCopy": {
    "facebook": [
      {"headline": "...", "body": "...", "cta": "..."}
    ],
    "google": [
      {"headline": "...", "description": "...", "cta": "..."}
    ],
    "linkedin": [
      {"headline": "...", "body": "...", "cta": "..."}
    ]
  },
  "emailSequence": [
    {
      "sequenceName": "Welcome Email",
      "subject": "...",
      "preheader": "...",
      "bodyHtml": "...",
      "ctaText": "...",
      "delayDays": 0
    }
  ],
  "automations": [
    {
      "name": "Form Submit Handler",
      "triggerType": "form_submit",
      "description": "...",
      "actions": ["create_contact", "send_email", "create_deal"]
    }
  ]
}`;

    // Generate complete funnel using AI
    const startTime = Date.now();
    const aiResponse = await aiService.processRequest({
      prompt,
      maxTokens: 4000,
      temperature: 0.7,
      responseFormat: 'json',
      systemPrompt: 'You are a world-class marketing funnel expert who creates high-converting sales funnels. Generate complete, actionable funnel content that drives results.'
    });

    const durationMs = Date.now() - startTime;

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

    // ===== PERSIST EVERYTHING TO DATABASE =====
    
    // 1. Create AI generation record
    const aiGeneration = await storage.createAIGeneration({
      tenantId,
      provider: aiResponse.provider,
      model: 'gpt-4o',
      tokensUsed: aiResponse.tokensUsed || 0,
      durationMs,
      prompt,
      generationType: 'funnel',
      generatedBy: userId,
    });

    // 2. Create funnel project
    const funnelProject = await storage.createFunnelProject({
      tenantId,
      name: parsedOutput.funnelName || validatedData.offerName + ' Funnel',
      description: validatedData.offerDescription,
      status: 'draft',
      aiGenerationId: aiGeneration.id,
      createdBy: userId,
    });

    // 3. Create funnel version (version 1)
    const funnelVersion = await storage.createFunnelVersion({
      funnelId: funnelProject.id,
      versionNumber: 1,
      name: 'Version 1',
      status: 'draft',
      createdBy: userId,
    });

    // 4. Update funnel project with active version ID
    await storage.updateFunnelProject(funnelProject.id, {
      activeVersionId: funnelVersion.id,
    });

    // 5. Create funnel step (landing page step)
    const funnelSteps = await storage.createFunnelSteps([{
      versionId: funnelVersion.id,
      name: 'Landing Page',
      stepType: 'landing_page',
      orderIndex: 1,
      conversionGoal: 'form_submit',
    }]);

    const landingPageStep = funnelSteps[0];

    // 6. Create landing page
    const landingPage = await storage.createLandingPage({
      stepId: landingPageStep.id,
      headline: parsedOutput.landingPage.headline,
      subheadline: parsedOutput.landingPage.subheadline,
      heroContent: parsedOutput.landingPage.heroContent,
      benefits: parsedOutput.landingPage.benefits,
      testimonials: parsedOutput.landingPage.testimonials,
      ctaText: parsedOutput.landingPage.ctaText,
      faqs: parsedOutput.landingPage.faqs,
      formFields: ['name', 'email', 'phone'],
      stylePreset: 'modern',
    });

    // 7. Create funnel ads (all platforms)
    const funnelAds = [];
    for (const [platform, variants] of Object.entries(parsedOutput.adCopy)) {
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i] as any;
        funnelAds.push({
          versionId: funnelVersion.id,
          platform,
          variantName: `Variant ${i + 1}`,
          headline: variant.headline,
          bodyText: variant.body || variant.description,
          ctaText: variant.cta,
          targetAudience: validatedData.targetAudience,
          aiGenerationId: aiGeneration.id,
        });
      }
    }
    const createdAds = await storage.createFunnelAds(funnelAds);

    // 8. Create funnel emails (all sequence emails)
    const funnelEmails = parsedOutput.emailSequence.map((email: any, index: number) => ({
      versionId: funnelVersion.id,
      sequenceName: email.sequenceName,
      subject: email.subject,
      preheader: email.preheader || '',
      bodyHtml: email.bodyHtml,
      ctaText: email.ctaText,
      ctaUrl: '',
      sequenceOrder: index + 1,
      delayDays: email.delayDays || 0,
      aiGenerationId: aiGeneration.id,
    }));
    const createdEmails = await storage.createFunnelEmails(funnelEmails);

    // 9. Create automation workflows (optional - based on AI output)
    const workflows = [];
    if (parsedOutput.automations && Array.isArray(parsedOutput.automations)) {
      for (const automation of parsedOutput.automations) {
        const workflow = await storage.createAutomationWorkflow({
          versionId: funnelVersion.id,
          name: automation.name,
          triggerType: automation.triggerType,
          triggerConditions: {},
          actions: automation.actions || [],
          isActive: false,
        });
        workflows.push(workflow);
      }
    }

    // Return the complete saved funnel with database IDs - TRANSFORMED TO CAMELCASE
    const transformedResponse = transformCompleteFunnel({
      funnel_project: funnelProject,
      version: funnelVersion,
      steps: funnelSteps,
      landing_page: landingPage,
      ad_assets: createdAds,
      email_sequences: createdEmails,
      automation_workflows: workflows,
      ai_generation: aiGeneration,
    });

    res.json({
      success: true,
      ...transformedResponse,
      metadata: {
        generatedAt: new Date().toISOString(),
        provider: aiResponse.provider,
        tokensUsed: aiResponse.tokensUsed,
        durationMs,
      }
    });

  } catch (error: any) {
    console.error('❌ Funnel generation error:', error);
    res.status(error instanceof z.ZodError ? 400 : 500).json({
      error: error instanceof z.ZodError ? 'Invalid input data' : 'Failed to generate funnel',
      details: error instanceof z.ZodError ? error.errors : error.message,
    });
  }
});

// GET /api/funnels - List all funnels for tenant
router.get('/', async (req: TenantRequest, res: Response) => {
  try {
    const storage = getUserStorage(req);

    const funnels = await storage.getFunnelProjects();

    // Transform all funnels to camelCase
    const transformedFunnels = funnels.map(transformFunnelProject);

    res.json({
      success: true,
      funnels: transformedFunnels,
      total: transformedFunnels.length,
    });

  } catch (error: any) {
    console.error('❌ List funnels error:', error);
    res.status(500).json({
      error: 'Failed to fetch funnels',
      details: error.message,
    });
  }
});

// GET /api/funnels/:id - Get funnel details with all relations
router.get('/:id', async (req: TenantRequest, res: Response) => {
  try {
    const storage = getUserStorage(req);
    const { id } = req.params;

    const completeFunnel = await storage.getCompleteFunnel(id);

    if (!completeFunnel) {
      return res.status(404).json({
        error: 'Funnel not found',
      });
    }

    // Transform complete funnel to camelCase
    const transformed = transformCompleteFunnel(completeFunnel);

    res.json({
      success: true,
      ...transformed,
    });

  } catch (error: any) {
    console.error('❌ Get funnel error:', error);
    res.status(500).json({
      error: 'Failed to fetch funnel',
      details: error.message,
    });
  }
});

// POST /api/funnels/:id/publish - Publish funnel to live URL
router.post('/:id/publish', async (req: TenantRequest, res: Response) => {
  try {
    const storage = getUserStorage(req);
    const userId = req.user!.id;
    const { id } = req.params;
    const { customDomain } = req.body;

    // SECURITY: Verify ownership - getFunnelProject uses this.tenantId internally
    const funnel = await storage.getFunnelProject(id);
    if (!funnel) {
      return res.status(404).json({
        error: 'Funnel not found',
      });
    }

    if (!funnel.activeVersionId) {
      return res.status(400).json({
        error: 'Cannot publish funnel without an active version',
      });
    }

    // Generate unique URL
    const publishedUrl = customDomain || `https://funnels.argilette.org/${id}`;

    // Create or update publication record
    const existingPublication = await storage.getFunnelPublication(id);
    
    let publication;
    if (existingPublication) {
      // Update existing publication
      publication = await storage.updateFunnelPublication(existingPublication.id, {
        versionId: funnel.activeVersionId,
        publishedUrl,
        customDomain,
        status: 'active',
        lastDeployedAt: new Date(),
      });
    } else {
      // Create new publication
      publication = await storage.publishFunnel({
        funnelId: id,
        versionId: funnel.activeVersionId,
        publishedUrl,
        customDomain,
        status: 'active',
        publishedBy: userId,
      });
    }

    // Update funnel status to active
    await storage.updateFunnelProject(id, {
      status: 'active',
    });

    // Transform publication to camelCase
    const transformedPublication = transformFunnelPublication(publication);

    res.json({
      success: true,
      publication: transformedPublication,
      publishedUrl: transformedPublication.publishedUrl,
      message: 'Funnel published successfully',
    });

  } catch (error: any) {
    console.error('❌ Publish funnel error:', error);
    res.status(500).json({
      error: 'Failed to publish funnel',
      details: error.message,
    });
  }
});

// PATCH /api/funnels/:funnelId/landing-page/:landingPageId - Update landing page
router.patch('/:funnelId/landing-page/:landingPageId', async (req: TenantRequest, res: Response) => {
  try {
    const storage = getUserStorage(req);
    const { funnelId, landingPageId } = req.params;

    // SECURITY: Verify funnel ownership
    const funnel = await storage.getFunnelProject(funnelId);
    if (!funnel) {
      return res.status(404).json({
        error: 'Funnel not found',
      });
    }

    // Validate and parse landing page data
    const updateData = insertLandingPageSchema.partial().parse(req.body);

    // Update landing page
    const updatedLandingPage = await storage.updateLandingPage(landingPageId, updateData);

    if (!updatedLandingPage) {
      return res.status(404).json({
        error: 'Landing page not found',
      });
    }

    // Transform to camelCase
    const transformed = transformLandingPage(updatedLandingPage);

    res.json({
      success: true,
      landingPage: transformed,
      message: 'Landing page updated successfully',
    });

  } catch (error: any) {
    console.error('❌ Update landing page error:', error);
    res.status(error instanceof z.ZodError ? 400 : 500).json({
      error: error instanceof z.ZodError ? 'Invalid landing page data' : 'Failed to update landing page',
      details: error instanceof z.ZodError ? error.errors : error.message,
    });
  }
});

// PUT /api/funnels/:funnelId/landing-pages/:pageId - Update landing page (frontend-expected endpoint)
router.put('/:funnelId/landing-pages/:pageId', async (req: TenantRequest, res: Response) => {
  try {
    const storage = getUserStorage(req);
    const { funnelId, pageId } = req.params;

    // SECURITY: Verify funnel ownership
    const funnel = await storage.getFunnelProject(funnelId);
    if (!funnel) {
      return res.status(404).json({
        error: 'Funnel not found',
      });
    }

    // Validate and parse landing page data using partial schema (stepId is preserved automatically)
    const updateData = insertLandingPageSchema.partial().parse(req.body);

    // Update landing page - stepId is preserved from existing record
    const updatedLandingPage = await storage.updateLandingPage(pageId, updateData);

    if (!updatedLandingPage) {
      return res.status(404).json({
        error: 'Landing page not found',
      });
    }

    // Transform to camelCase for frontend
    const transformed = transformLandingPage(updatedLandingPage);

    res.status(200).json({
      success: true,
      landingPage: transformed,
      message: 'Landing page updated successfully',
    });

  } catch (error: any) {
    console.error('❌ Update landing page error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid landing page data',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      error: 'Failed to update landing page',
      details: error.message,
    });
  }
});

// DELETE /api/funnels/:id - Delete funnel
router.delete('/:id', async (req: TenantRequest, res: Response) => {
  try {
    const storage = getUserStorage(req);
    const { id } = req.params;

    // SECURITY: Verify ownership before delete - getFunnelProject uses this.tenantId internally
    const funnel = await storage.getFunnelProject(id);
    if (!funnel) {
      return res.status(404).json({
        error: 'Funnel not found',
      });
    }

    // Delete funnel (cascade should handle related records)
    await storage.deleteFunnelProject(id);

    res.json({
      success: true,
      message: 'Funnel deleted successfully',
    });

  } catch (error: any) {
    console.error('❌ Delete funnel error:', error);
    res.status(500).json({
      error: 'Failed to delete funnel',
      details: error.message,
    });
  }
});

// GET /api/funnels/:id/analytics - Get funnel analytics
router.get('/:id/analytics', async (req: TenantRequest, res: Response) => {
  try {
    const storage = getUserStorage(req);
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Parse dates if provided
    let start: Date | undefined;
    let end: Date | undefined;
    
    if (startDate && typeof startDate === 'string') {
      start = new Date(startDate);
    }
    if (endDate && typeof endDate === 'string') {
      end = new Date(endDate);
    }

    // Get analytics (ownership validated internally via getFunnelProject)
    const analytics = await storage.getFunnelAnalytics(id, start, end);

    res.json({
      success: true,
      ...analytics,
    });

  } catch (error: any) {
    console.error('❌ Get analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      details: error.message,
    });
  }
});

export default router;
