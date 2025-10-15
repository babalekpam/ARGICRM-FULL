/**
 * ARGILETTE + CRM Integration Example
 * 
 * This file shows a complete example of integrating ARGILETTE SEO analytics
 * into your existing Node.js CRM.
 */

// ============================================================================
// STEP 1: SERVER SETUP
// ============================================================================

// server/index.js (Your CRM's main server file)
import express from 'express';
import session from 'express-session';
import { registerSEORoutes } from './seo/routes.js'; // ARGILETTE routes

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session (if needed)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Your CRM's auth middleware
function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  // Attach user data
  req.user = {
    id: req.session.userId,
    organizationId: req.session.organizationId,
    email: req.session.email
  };
  
  next();
}

// Tenant/Organization middleware
function attachOrganization(req, res, next) {
  const organizationId = req.user?.organizationId;
  
  if (!organizationId) {
    return res.status(400).json({ error: 'No organization context' });
  }
  
  req.tenantId = organizationId;
  next();
}

// ============================================================================
// STEP 2: YOUR EXISTING CRM ROUTES
// ============================================================================

// Customers
app.get('/api/customers', requireAuth, async (req, res) => {
  const customers = await db.customers.findMany({
    where: { organizationId: req.user.organizationId }
  });
  res.json(customers);
});

app.get('/api/customers/:id', requireAuth, async (req, res) => {
  const customer = await db.customers.findFirst({
    where: { 
      id: req.params.id,
      organizationId: req.user.organizationId 
    }
  });
  res.json(customer);
});

// Deals
app.get('/api/deals', requireAuth, async (req, res) => {
  const deals = await db.deals.findMany({
    where: { organizationId: req.user.organizationId }
  });
  res.json(deals);
});

// ============================================================================
// STEP 3: ADD ARGILETTE SEO ROUTES
// ============================================================================

registerSEORoutes(app, {
  basePath: '/api/seo',
  authMiddleware: requireAuth,
  tenantMiddleware: attachOrganization
});

// Now you have these SEO endpoints available:
// GET  /api/seo/dashboard
// GET  /api/seo/keywords
// POST /api/seo/keywords
// GET  /api/seo/backlinks
// POST /api/seo/backlinks/generate
// GET  /api/seo/traffic
// GET  /api/seo/competitors
// GET  /api/seo/seo-issues
// POST /api/seo/ai/insights

// ============================================================================
// STEP 4: LINK SEO DATA TO CRM ENTITIES
// ============================================================================

// Add SEO project to customer
app.post('/api/customers/:id/seo-project', requireAuth, async (req, res) => {
  const { customerId } = req.params;
  const { domain } = req.body;
  
  // Create SEO project
  const seoProject = await db.projects.create({
    tenantId: req.tenantId,
    name: `${customer.name} SEO`,
    domain: domain
  });
  
  // Link to customer
  await db.customers.update({
    where: { id: customerId },
    data: { seoProjectId: seoProject.id }
  });
  
  res.json(seoProject);
});

// Get customer with SEO data
app.get('/api/customers/:id/dashboard', requireAuth, async (req, res) => {
  const customer = await db.customers.findFirst({
    where: { id: req.params.id }
  });
  
  // Fetch SEO data if project exists
  let seoData = null;
  if (customer.seoProjectId) {
    const seoResponse = await fetch(
      `http://localhost:3000/api/seo/dashboard?projectId=${customer.seoProjectId}`,
      {
        headers: {
          'Cookie': req.headers.cookie // Pass auth
        }
      }
    );
    seoData = await seoResponse.json();
  }
  
  res.json({
    customer,
    seo: seoData
  });
});

// ============================================================================
// STEP 5: BULK SEO OPERATIONS
// ============================================================================

// Generate SEO reports for all customers
app.post('/api/bulk/generate-seo-reports', requireAuth, async (req, res) => {
  const customers = await db.customers.findMany({
    where: { 
      organizationId: req.user.organizationId,
      seoProjectId: { not: null }
    }
  });
  
  const reports = [];
  
  for (const customer of customers) {
    const reportResponse = await fetch('http://localhost:3000/api/seo/reports/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.cookie
      },
      body: JSON.stringify({
        projectId: customer.seoProjectId,
        reportType: 'full',
        format: 'pdf'
      })
    });
    
    const report = await reportResponse.json();
    reports.push({
      customerId: customer.id,
      customerName: customer.name,
      reportId: report.id,
      reportUrl: report.fileUrl
    });
  }
  
  res.json({ 
    message: `Generated ${reports.length} reports`,
    reports 
  });
});

// ============================================================================
// STEP 6: FRONTEND INTEGRATION
// ============================================================================

// React component example
/**
 * import React from 'react';
 * import { useQuery } from '@tanstack/react-query';
 * 
 * function CustomerSEODashboard({ customerId }) {
 *   const { data: customer, isLoading } = useQuery({
 *     queryKey: ['customer-dashboard', customerId],
 *     queryFn: async () => {
 *       const res = await fetch(`/api/customers/${customerId}/dashboard`);
 *       return res.json();
 *     }
 *   });
 * 
 *   if (isLoading) return <div>Loading...</div>;
 * 
 *   return (
 *     <div>
 *       <h1>{customer.customer.name}</h1>
 *       
 *       {customer.seo && (
 *         <div className="seo-metrics">
 *           <h2>SEO Performance</h2>
 *           
 *           <div className="metrics-grid">
 *             <MetricCard
 *               title="SEO Score"
 *               value={customer.seo.seoScore}
 *               trend="up"
 *             />
 *             <MetricCard
 *               title="Keywords"
 *               value={customer.seo.totalKeywords}
 *             />
 *             <MetricCard
 *               title="Backlinks"
 *               value={customer.seo.totalBacklinks}
 *             />
 *             <MetricCard
 *               title="Traffic"
 *               value={customer.seo.organicTraffic}
 *             />
 *           </div>
 * 
 *           <div className="seo-charts">
 *             <TrafficChart data={customer.seo.trafficData} />
 *             <KeywordsChart data={customer.seo.keywords} />
 *           </div>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 */

// ============================================================================
// STEP 7: NAVIGATION UPDATE
// ============================================================================

/**
 * // In your CRM's navigation/sidebar component
 * const navigation = [
 *   // Existing menu items
 *   {
 *     name: 'Dashboard',
 *     icon: HomeIcon,
 *     href: '/'
 *   },
 *   {
 *     name: 'Customers',
 *     icon: UsersIcon,
 *     href: '/customers',
 *     children: [
 *       { name: 'All Customers', href: '/customers' },
 *       { name: 'Add Customer', href: '/customers/new' }
 *     ]
 *   },
 *   {
 *     name: 'Deals',
 *     icon: BriefcaseIcon,
 *     href: '/deals'
 *   },
 *   
 *   // Add SEO section
 *   {
 *     name: 'SEO Analytics',
 *     icon: ChartBarIcon,
 *     href: '/seo',
 *     children: [
 *       { name: 'Overview', href: '/seo' },
 *       { name: 'Keywords', href: '/seo/keywords' },
 *       { name: 'Backlinks', href: '/seo/backlinks' },
 *       { name: 'Traffic', href: '/seo/traffic' },
 *       { name: 'Competitors', href: '/seo/competitors' },
 *       { name: 'Reports', href: '/seo/reports' }
 *     ]
 *   }
 * ];
 */

// ============================================================================
// STEP 8: WEBHOOKS (Optional)
// ============================================================================

// Receive SEO events in your CRM
app.post('/webhooks/seo', express.json(), async (req, res) => {
  const { event, data } = req.body;
  
  switch (event) {
    case 'keyword.ranking.changed':
      // Notify customer of ranking change
      await sendNotification(data.customerId, {
        title: 'SEO Update',
        message: `Keyword "${data.keyword}" moved to position ${data.newPosition}`
      });
      break;
      
    case 'backlink.gained':
      // Log new backlink
      await createActivity({
        customerId: data.customerId,
        type: 'seo_update',
        message: `New backlink from ${data.domain}`
      });
      break;
      
    case 'seo_score.changed':
      // Update customer record
      await db.customers.update({
        where: { id: data.customerId },
        data: { lastSeoScore: data.newScore }
      });
      break;
  }
  
  res.json({ received: true });
});

// ============================================================================
// START SERVER
// ============================================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 CRM Server running on port ${PORT}`);
  console.log(`📊 SEO routes available at /api/seo/*`);
  console.log(`✅ Integration complete!`);
});

// ============================================================================
// DATABASE SCHEMA ADDITIONS
// ============================================================================

/**
 * Add these columns to your CRM's database:
 * 
 * -- Add to customers table
 * ALTER TABLE crm_customers 
 * ADD COLUMN seo_project_id VARCHAR REFERENCES projects(id);
 * 
 * ALTER TABLE crm_customers
 * ADD COLUMN last_seo_score INTEGER DEFAULT 0;
 * 
 * ALTER TABLE crm_customers
 * ADD COLUMN last_seo_check TIMESTAMP;
 * 
 * -- Or create a mapping table
 * CREATE TABLE crm_seo_mapping (
 *   id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
 *   crm_entity_type VARCHAR NOT NULL, -- 'customer', 'deal', etc.
 *   crm_entity_id VARCHAR NOT NULL,
 *   seo_project_id VARCHAR NOT NULL REFERENCES projects(id),
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   UNIQUE(crm_entity_type, crm_entity_id)
 * );
 */

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

/**
 * Add to your .env file:
 * 
 * # SEO Features
 * ANTHROPIC_API_KEY=sk-ant-xxxxx
 * DATAFORSEO_LOGIN=optional
 * DATAFORSEO_PASSWORD=optional
 * 
 * # Feature flags
 * ENABLE_SEO_FEATURES=true
 * ENABLE_AI_INSIGHTS=true
 */

export default app;
