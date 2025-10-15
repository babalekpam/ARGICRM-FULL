/**
 * ARGILETTE SEO Routes - CRM Integration Example
 * 
 * This example shows how to integrate the real ARGILETTE SEO router
 * into your existing Node.js CRM using Express.
 * 
 * The actual implementation is in:
 * - server/seo-routes.ts (1500+ lines of working routes)
 * - server/seo-storage.ts (database operations)
 * - server/seo-ai.ts (AI service)
 * - server/seo-schema.ts (TypeScript types & schema)
 */

import express from 'express';
import { createSEORouter } from './seo-routes.js';

const app = express();
app.use(express.json());

// ============================================================================
// YOUR CRM'S AUTH MIDDLEWARE
// ============================================================================

/**
 * This middleware authenticates the user and sets required properties:
 * - req.tenantId: The organization/tenant ID for multi-tenant isolation
 * - req.userId: The current user's ID
 * - req.isAdmin: Boolean indicating if user has admin privileges
 */
function yourCRMAuthMiddleware(req, res, next) {
  // Example: Check session/JWT/token
  const user = req.session?.user || req.user;
  
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Map your CRM's user model to required properties
  req.tenantId = user.organizationId || user.companyId || user.tenantId;
  req.userId = user.id || user.userId;
  req.isAdmin = user.role === 'admin' || user.isAdmin;
  
  if (!req.tenantId) {
    return res.status(400).json({ error: 'No tenant context found' });
  }
  
  next();
}

// ============================================================================
// MOUNT SEO ROUTES
// ============================================================================

/**
 * Step 1: Apply auth middleware to the /api/seo path
 * Step 2: Mount the SEO router at the same path
 * 
 * All routes in the SEO router will be prefixed with /api/seo
 * For example:
 * - GET /api/seo/dashboard
 * - GET /api/seo/keywords
 * - POST /api/seo/backlinks/generate
 * - POST /api/seo/ai/insights
 */
app.use('/api/seo', yourCRMAuthMiddleware);
app.use('/api/seo', createSEORouter());

// ============================================================================
// YOUR EXISTING CRM ROUTES
// ============================================================================

app.get('/api/customers', yourCRMAuthMiddleware, (req, res) => {
  // Your existing CRM logic
  res.json({ customers: [] });
});

app.get('/api/deals', yourCRMAuthMiddleware, (req, res) => {
  // Your existing CRM logic
  res.json({ deals: [] });
});

// ============================================================================
// START SERVER
// ============================================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ CRM with SEO integration running on port ${PORT}`);
  console.log(`📊 SEO Dashboard: http://localhost:${PORT}/api/seo/dashboard`);
  console.log(`🔑 SEO Keywords: http://localhost:${PORT}/api/seo/keywords`);
  console.log(`🔗 SEO Backlinks: http://localhost:${PORT}/api/seo/backlinks`);
});

// ============================================================================
// ALTERNATIVE: Multiple Tenants/Namespaces
// ============================================================================

/**
 * If you need to mount SEO routes at different paths for different purposes:
 */
function alternativeSetup() {
  // Main SEO routes
  app.use('/api/seo', yourCRMAuthMiddleware);
  app.use('/api/seo', createSEORouter());
  
  // Maybe a different auth context for a different tenant/org
  app.use('/api/agency-seo', agencyAuthMiddleware);
  app.use('/api/agency-seo', createSEORouter());
  
  // Public demo (read-only, limited features)
  app.use('/api/demo-seo', demoAuthMiddleware);
  app.use('/api/demo-seo', createSEORouter());
}

// ============================================================================
// AVAILABLE ENDPOINTS
// ============================================================================

/**
 * Once mounted at /api/seo, these endpoints are available:
 * 
 * DASHBOARD:
 * GET  /api/seo/dashboard?projectId=1
 * 
 * PROJECTS:
 * GET  /api/seo/projects
 * POST /api/seo/projects
 * GET  /api/seo/projects/:id
 * PUT  /api/seo/projects/:id
 * DELETE /api/seo/projects/:id
 * 
 * KEYWORDS:
 * GET  /api/seo/keywords?projectId=1
 * POST /api/seo/keywords
 * 
 * BACKLINKS:
 * GET  /api/seo/backlinks?projectId=1
 * POST /api/seo/backlinks/generate (AI or DataForSEO)
 * POST /api/seo/backlinks/fetch
 * 
 * AI INSIGHTS:
 * POST /api/seo/ai/chat
 * POST /api/seo/ai/insights
 * POST /api/seo/ai/analyze-keywords
 * POST /api/seo/ai/analyze-competitors
 * POST /api/seo/ai/prioritize-issues
 * POST /api/seo/ai/recommend-backlinks
 * 
 * TRAFFIC:
 * GET  /api/seo/traffic?projectId=1
 * 
 * COMPETITORS:
 * GET  /api/seo/competitors?projectId=1
 * 
 * SEO ISSUES:
 * GET  /api/seo/seo-issues?projectId=1
 * 
 * RANK TRACKING:
 * GET  /api/seo/rank-tracking/history?projectId=1
 * POST /api/seo/rank-tracking/history
 * GET  /api/seo/rank-tracking/competitor-ranks?projectId=1
 * POST /api/seo/rank-tracking/competitor-snapshot
 * 
 * CONTENT INTELLIGENCE:
 * GET  /api/seo/content/briefs/:projectId
 * POST /api/seo/content/briefs
 * DELETE /api/seo/content/briefs/:id
 * GET  /api/seo/content/scorecards/:projectId
 * POST /api/seo/content/score
 * DELETE /api/seo/content/scorecards/:id
 * POST /api/seo/content/serp-analysis
 * POST /api/seo/content/gap-analysis
 * 
 * TECHNICAL SEO:
 * GET  /api/seo/technical-audit/scans/:projectId
 * GET  /api/seo/technical-audit/latest/:projectId
 * POST /api/seo/technical-audit/start
 * GET  /api/seo/technical-audit/metrics/:auditScanId
 * GET  /api/seo/technical-audit/vitals/:pageMetricId
 * 
 * LINK BUILDING:
 * GET  /api/seo/link-building/opportunities/:projectId
 * POST /api/seo/link-building/opportunities
 * PATCH /api/seo/link-building/opportunities/:id
 * DELETE /api/seo/link-building/opportunities/:id
 * GET  /api/seo/link-building/campaigns/:projectId
 * POST /api/seo/link-building/campaigns
 * PATCH /api/seo/link-building/campaigns/:id
 * DELETE /api/seo/link-building/campaigns/:id
 * GET  /api/seo/link-building/contacts/:campaignId
 * POST /api/seo/link-building/contacts
 * PATCH /api/seo/link-building/contacts/:id
 * GET  /api/seo/link-building/gaps/:projectId
 * POST /api/seo/link-building/gaps
 * PATCH /api/seo/link-building/gaps/:id
 * 
 * API KEY MANAGEMENT:
 * GET  /api/seo/keys
 * POST /api/seo/keys
 * PATCH /api/seo/keys/:id
 * DELETE /api/seo/keys/:id
 * GET  /api/seo/keys/:id/usage
 * GET  /api/seo/usage
 * 
 * LOCAL SEO:
 * GET  /api/seo/projects/:projectId/local-rankings
 * POST /api/seo/projects/:projectId/local-rankings
 * DELETE /api/seo/local-rankings/:id
 * GET  /api/seo/projects/:projectId/google-business-profile
 * POST /api/seo/projects/:projectId/google-business-profile
 * PATCH /api/seo/google-business-profiles/:id
 * GET  /api/seo/projects/:projectId/local-citations
 * POST /api/seo/projects/:projectId/local-citations
 * PATCH /api/seo/local-citations/:id
 * DELETE /api/seo/local-citations/:id
 * POST /api/seo/projects/:projectId/local-seo/generate (AI-powered!)
 * 
 * SOCIAL MEDIA:
 * GET  /api/seo/projects/:projectId/social-accounts
 * POST /api/seo/projects/:projectId/social-accounts
 * DELETE /api/seo/social-accounts/:id
 * GET  /api/seo/social-accounts/:accountId/posts
 * POST /api/seo/social-accounts/:accountId/posts
 * DELETE /api/seo/social-posts/:id
 * GET  /api/seo/social-posts/:postId/metrics
 * POST /api/seo/social-accounts/:accountId/metrics
 * 
 * ADMIN (requires req.isAdmin = true):
 * GET  /api/seo/admin/stats
 * GET  /api/seo/admin/users
 * GET  /api/seo/admin/tenants
 */

export default createSEORouter;
