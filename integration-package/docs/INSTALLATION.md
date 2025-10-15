# ARGILETTE Installation Guide

## Prerequisites

- Node.js 18+ or 20+
- PostgreSQL database
- Existing Node.js CRM application
- npm or yarn package manager

## Installation Methods

### Method 1: Quick Integration (Recommended)

**Time: 5-10 minutes**

This method copies ARGILETTE modules into your existing CRM with minimal changes.

#### Step 1: Copy Files

```bash
# Navigate to your CRM project
cd /path/to/your-crm

# Copy server files
mkdir -p server/seo
cp -r /path/to/integration-package/server/* server/seo/

# Copy client files (if using React)
mkdir -p client/src/seo
cp -r /path/to/integration-package/client/* client/src/seo/
```

#### Step 2: Install Dependencies

```bash
# Install required packages
npm install @anthropic-ai/sdk recharts react-i18next i18next i18next-browser-languagedetector drizzle-orm @neondatabase/serverless zod

# Or install all at once
npm install $(cat integration-package/config/dependencies.json | jq -r '.required_dependencies | keys | .[]')
```

#### Step 3: Database Setup

```bash
# Option A: Using psql
psql $DATABASE_URL -f integration-package/database/schema.sql

# Option B: Using your CRM's migration tool
# Copy schema.sql to your migrations folder and run your migration command
```

#### Step 4: Add Routes to Your Server

```javascript
// In your CRM's server/index.js or app.js
import { registerSEORoutes } from './seo/routes.js';

// After existing middleware and routes
registerSEORoutes(app);

console.log('SEO routes registered at /api/seo/*');
```

#### Step 5: Configure Environment

```bash
# Add to your .env file
ANTHROPIC_API_KEY=your_anthropic_key_here

# Optional: For API-based backlink analysis
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password
```

#### Step 6: Update Navigation

```javascript
// In your CRM's navigation component
const navItems = [
  // ... your existing items
  {
    name: 'SEO Analytics',
    icon: ChartBarIcon,
    children: [
      { name: 'Dashboard', href: '/seo' },
      { name: 'Keywords', href: '/seo/keywords' },
      { name: 'Backlinks', href: '/seo/backlinks' },
      { name: 'Traffic', href: '/seo/traffic' }
    ]
  }
];
```

---

### Method 2: API-Only Integration

**Time: 3-5 minutes**

Use ARGILETTE's API endpoints from your existing CRM frontend.

#### Step 1: Install Server-Side Only

```bash
# Copy only server files
mkdir -p server/seo
cp -r /path/to/integration-package/server/* server/seo/

# Install backend dependencies only
npm install @anthropic-ai/sdk drizzle-orm @neondatabase/serverless zod
```

#### Step 2: Database Setup

```bash
psql $DATABASE_URL -f integration-package/database/schema.sql
```

#### Step 3: Add Routes

```javascript
// In your server
import { registerSEORoutes } from './seo/routes.js';
registerSEORoutes(app);
```

#### Step 4: Use API from Your Frontend

```javascript
// In your CRM's existing frontend (any framework)
async function fetchKeywords(projectId) {
  const res = await fetch(`/api/seo/keywords?projectId=${projectId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
}

// Display in your UI
const data = await fetchKeywords('project-123');
console.log(data); // Use in your existing components
```

---

### Method 3: Standalone Deployment + API Integration

**Time: 10-15 minutes**

Deploy ARGILETTE separately and connect via API.

#### Step 1: Deploy ARGILETTE

```bash
# Deploy ARGILETTE to a subdomain
# e.g., seo.yourcrm.com
```

#### Step 2: Create API Integration Layer

```javascript
// In your CRM backend
import fetch from 'node-fetch';

const SEO_API_URL = 'https://seo.yourcrm.com/api';
const SEO_API_KEY = process.env.SEO_API_KEY;

export async function getSEOData(projectId) {
  const response = await fetch(`${SEO_API_URL}/dashboard?projectId=${projectId}`, {
    headers: {
      'X-API-Key': SEO_API_KEY,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}
```

#### Step 3: Proxy Routes (Optional)

```javascript
// Create proxy routes in your CRM
app.get('/api/seo/*', async (req, res) => {
  const seoUrl = `${SEO_API_URL}${req.path.replace('/api/seo', '')}`;
  const response = await fetch(seoUrl, {
    headers: { 'X-API-Key': SEO_API_KEY }
  });
  const data = await response.json();
  res.json(data);
});
```

---

## Authentication Integration

### Option A: Use Your CRM's Authentication (Recommended)

```javascript
// In server/seo/routes.js
// Replace ARGILETTE auth with your auth

// Before (ARGILETTE auth):
import { isAuthenticated } from './replitAuth';
const requireAuth = [isAuthenticated, attachTenantId];

// After (Your CRM auth):
import { requireAuth } from '../middleware/auth'; // Your CRM's auth
import { attachSEOTenantId } from './middleware';

app.get('/api/seo/dashboard', requireAuth, attachSEOTenantId, async (req, res) => {
  const tenantId = req.user.organizationId; // Adjust to your user object
  // ... rest of code
});
```

### Option B: Shared Session

If both use same session store:

```javascript
// Share session between CRM and SEO
app.use(session({
  store: sharedSessionStore,
  secret: process.env.SESSION_SECRET,
  // ... other options
}));
```

### Option C: JWT Tokens

```javascript
// Generate JWT in CRM, verify in SEO routes
import jwt from 'jsonwebtoken';

// In SEO routes
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
}

app.get('/api/seo/dashboard', verifyToken, async (req, res) => {
  // ... 
});
```

---

## Linking SEO to CRM Data

### Option 1: Add SEO Project ID to CRM Entities

```sql
-- Add to your CRM's customer/client table
ALTER TABLE crm_customers 
ADD COLUMN seo_project_id VARCHAR REFERENCES projects(id);

-- Then query SEO data for a customer
SELECT c.*, p.seo_score, p.total_backlinks
FROM crm_customers c
LEFT JOIN projects p ON c.seo_project_id = p.id
WHERE c.id = 'customer-123';
```

### Option 2: Create Mapping Table

```sql
-- Create a link table
CREATE TABLE crm_seo_mapping (
  crm_entity_id VARCHAR NOT NULL,
  crm_entity_type VARCHAR NOT NULL, -- 'customer', 'account', etc.
  seo_project_id VARCHAR NOT NULL REFERENCES projects(id),
  PRIMARY KEY (crm_entity_id, crm_entity_type)
);

-- Query SEO data for any CRM entity
SELECT p.* FROM projects p
JOIN crm_seo_mapping m ON m.seo_project_id = p.id
WHERE m.crm_entity_id = 'customer-123' 
AND m.crm_entity_type = 'customer';
```

---

## Multi-Tenant Setup

### Ensure Tenant Isolation

```javascript
// Middleware to attach tenantId
function attachSEOTenantId(req, res, next) {
  // Map your CRM's organization to SEO tenantId
  const tenantId = req.user.organizationId || req.user.companyId;
  
  if (!tenantId) {
    return res.status(400).json({ error: 'No tenant context' });
  }
  
  req.tenantId = tenantId;
  next();
}

// Use in all SEO routes
app.get('/api/seo/*', requireAuth, attachSEOTenantId, seoRouteHandler);
```

### Create Tenants Automatically

```javascript
// When a new CRM organization is created
async function createCRMOrganization(orgData) {
  // Create in CRM
  const org = await db.organizations.create(orgData);
  
  // Create corresponding SEO tenant
  await db.tenants.create({
    id: org.id, // Use same ID
    name: org.name,
    plan: org.plan || 'free'
  });
  
  return org;
}
```

---

## Customization

### Custom Branding

```javascript
// Create config file: server/seo/config.js
export const seoConfig = {
  branding: {
    name: 'Your CRM SEO',
    logo: '/assets/logo.png',
    primaryColor: '#your-color'
  },
  features: {
    keywords: true,
    backlinks: true,
    localSEO: false, // Disable if not needed
    socialMedia: false
  }
};
```

### Custom Routes

```javascript
// Customize route paths
app.use('/custom-seo-path', seoRouter); // Instead of /api/seo
```

---

## Verification

### Test Integration

```bash
# 1. Server is running
curl http://localhost:3000/api/seo/dashboard

# 2. Database tables exist
psql $DATABASE_URL -c "\dt" | grep -E "(projects|keywords|backlinks)"

# 3. Authentication works
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/seo/dashboard
```

### Check Logs

```javascript
// Add debug logging
app.use('/api/seo', (req, res, next) => {
  console.log('SEO API Request:', {
    method: req.method,
    path: req.path,
    tenantId: req.tenantId,
    userId: req.user?.id
  });
  next();
});
```

---

## Troubleshooting

### Issue: Routes not working

**Solution:**
```javascript
// Ensure routes are registered after body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Then register SEO routes
registerSEORoutes(app);
```

### Issue: Database errors

**Solution:**
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Verify tables exist
psql $DATABASE_URL -c "\dt projects"

# Re-run schema if needed
psql $DATABASE_URL -f integration-package/database/schema.sql
```

### Issue: Authentication fails

**Solution:**
```javascript
// Debug middleware
app.use('/api/seo', (req, res, next) => {
  console.log('Auth check:', {
    hasUser: !!req.user,
    hasTenantId: !!req.tenantId,
    headers: req.headers
  });
  next();
});
```

### Issue: CORS errors

**Solution:**
```javascript
// Add CORS middleware
import cors from 'cors';

app.use('/api/seo', cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

---

## Next Steps

1. ✅ Complete installation
2. ✅ Test API endpoints
3. ✅ Link to CRM entities
4. ✅ Customize branding
5. ✅ Add to navigation
6. ✅ Train team on features

## Support

- **Documentation**: See `/docs` folder for detailed guides
- **API Reference**: See `API.md` for endpoint documentation
- **Examples**: See `examples/` folder for integration samples

---

**Installation Complete!** 🎉

Your CRM now has enterprise-grade SEO analytics capabilities.
