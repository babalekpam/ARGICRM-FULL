# ARGILETTE SEO Analytics - CRM Integration Package

## 📦 What's This?

This package contains the **complete, working ARGILETTE SEO platform** that you can integrate into your existing Node.js CRM. All files are production-ready and fully functional - just copy and configure!

## ✨ What You Get

### Core Features
- ✅ **Keyword Research & Tracking** - Monitor rankings and search volumes
- ✅ **Backlink Analysis** - AI-powered (free) and API-based (DataForSEO) tracking
- ✅ **Traffic Analytics** - Organic traffic monitoring with charts
- ✅ **Competitor Tracking** - Analyze and compare competitors
- ✅ **SEO Audits** - Technical SEO issue detection
- ✅ **AI Insights** - Claude Sonnet 4 powered recommendations

### Advanced Features
- ✅ **Local SEO** - Google Business Profile & local rankings
- ✅ **Social Media Monitoring** - Multi-platform tracking
- ✅ **Automated Reports** - Generate and schedule PDF/CSV reports
- ✅ **API Access** - Full REST API with key management
- ✅ **Multi-Language** - 6 languages (EN, ES, FR, DE, ZH, JA)
- ✅ **Link Building** - Opportunity tracking & outreach campaigns

## 🚀 Quick Start (5 Minutes)

### Step 1: Copy Files
```bash
cd YOUR_CRM_PROJECT

# Copy actual server implementation
cp integration-package/server/seo-*.ts server/seo/

# Copy schema
cp integration-package/server/seo-schema.ts shared/
```

### Step 2: Install Dependencies
```bash
npm install @anthropic-ai/sdk @neondatabase/serverless drizzle-orm zod ws
```

### Step 3: Database Setup
```bash
# Run migration
psql $DATABASE_URL -f integration-package/database/schema.sql
```

### Step 4: Add Routes
```javascript
// In your CRM's server/index.js
import { registerSEORoutes } from './seo/seo-routes';

// Replace Replit Auth with your CRM's auth
function yourAuthMiddleware(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  req.tenantId = req.user.organizationId; // Map to your org ID
  next();
}

// Register SEO routes
app.use('/api/seo', yourAuthMiddleware);
registerSEORoutes(app);
```

### Step 5: Environment Variables
```bash
# Add to .env
ANTHROPIC_API_KEY=sk-ant-xxxxx
DATABASE_URL=postgresql://...
```

### Step 6: Test
```bash
curl http://localhost:3000/api/seo/dashboard?projectId=1
```

## 📁 What's Included

### Server Files (Real Implementation)
```
server/
├── seo-routes.ts      # Complete API routes (1500+ lines)
├── seo-storage.ts     # Database operations (850+ lines)
├── seo-ai.ts          # AI service with Claude (700+ lines)
└── seo-schema.ts      # TypeScript types & Drizzle schema
```

### Database
```
database/
└── schema.sql         # Complete PostgreSQL schema (25+ tables)
```

### Documentation
```
docs/
├── INSTALLATION.md    # Step-by-step setup guide
└── API.md            # Complete API reference
```

### Configuration
```
config/
├── dependencies.json  # All required packages
└── .env.example      # Environment template
```

### Examples
```
examples/
└── crm-integration-example.js  # Full working example
```

## 🔗 Integration Methods

### Method 1: Direct Integration (Recommended)

Copy files and use your CRM's auth:

```typescript
// server/index.ts
import { registerSEORoutes } from './seo/seo-routes';
import { DbStorage } from './seo/seo-storage';

// Initialize storage
export const seoStorage = new DbStorage();

// Add middleware to map your auth to tenantId
app.use('/api/seo', (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  req.tenantId = req.user.organizationId; // Your org ID field
  req.userId = req.user.id;
  next();
});

// Register routes
registerSEORoutes(app);
```

### Method 2: Modify for Your Auth

The routes file uses Replit Auth by default. Replace with your auth:

```typescript
// In seo-routes.ts, replace:
import { setupAuth, isAuthenticated } from './replitAuth';

// With your auth:
import { requireAuth } from '../middleware/auth';

// Then use your middleware:
app.get('/api/seo/dashboard', requireAuth, async (req, res) => {
  const tenantId = req.user.organizationId;
  // ... rest of code
});
```

## 🗄️ Database Setup

### The Schema Includes:

**Core Tables:**
- `projects` - SEO projects
- `keywords` - Keyword tracking
- `backlinks` - Backlink data
- `traffic_data` - Traffic analytics
- `competitors` - Competitor analysis
- `seo_issues` - SEO audit issues

**Advanced Tables:**
- `local_rankings` - Local SEO
- `social_accounts` - Social media
- `api_keys` - API management
- `generated_reports` - Report storage
- `outreach_campaigns` - Link building
- ...and 15+ more!

### Migration Note:

If you already have `tenants` and `users` tables:

```sql
-- Skip these in schema.sql or modify to match your structure
-- The schema creates these tables, but you can use your existing ones

-- Option 1: Comment out in schema.sql
-- CREATE TABLE IF NOT EXISTS tenants ...
-- CREATE TABLE IF NOT EXISTS users ...

-- Option 2: Ensure compatibility
-- Make sure your tables have: id, tenantId fields
```

## 🔐 Authentication

ARGILETTE is auth-agnostic. Works with:

- **Your CRM's Auth** (Recommended)
- **Replit Auth** (Default, can be replaced)
- **JWT Tokens**
- **Session-based auth**
- **Any Express middleware**

Just map to `tenantId`:

```javascript
app.use('/api/seo', (req, res, next) => {
  req.tenantId = req.user.yourOrgIdField;
  next();
});
```

## 🎨 Customization

### Change API Path
```javascript
app.use('/custom-seo', seoRouter); // Instead of /api/seo
```

### Disable Features

Edit `seo-routes.ts` to comment out routes you don't need:

```typescript
// Comment out if not needed:
// app.get('/api/seo/local-rankings', ...);
// app.get('/api/seo/social-accounts', ...);
```

### Custom Branding

The frontend components (React) can be customized with your design system.

## 📊 API Endpoints

Once integrated, you'll have **50+ endpoints**:

```
GET  /api/seo/dashboard          # Dashboard with all metrics
GET  /api/seo/keywords            # Keyword list
POST /api/seo/keywords            # Add keyword
GET  /api/seo/backlinks           # Backlink list
POST /api/seo/backlinks/generate  # AI/API backlink generation
GET  /api/seo/traffic             # Traffic data
GET  /api/seo/competitors         # Competitor list
GET  /api/seo/seo-issues          # SEO audit issues
POST /api/seo/ai/chat             # AI chat
POST /api/seo/ai/insights         # Generate insights
GET  /api/seo/local-rankings      # Local SEO data
GET  /api/seo/social-accounts     # Social media
POST /api/seo/reports/generate    # Generate reports
GET  /api/seo/api-keys            # API keys
... and 35+ more!
```

See [docs/API.md](docs/API.md) for complete reference.

## 💡 Linking to Your CRM

### Option 1: Add Field to CRM Table

```sql
ALTER TABLE crm_customers 
ADD COLUMN seo_project_id VARCHAR REFERENCES projects(id);
```

Then fetch SEO data:

```javascript
const customer = await db.customers.findOne({ id });
const seoData = await seoStorage.getProject(customer.organizationId, customer.seo_project_id);
```

### Option 2: Use Shared Tenant ID

All SEO data is already linked by `tenantId`:

```javascript
// Fetch all SEO projects for an organization
const projects = await seoStorage.getAllProjects(req.tenantId);

// Display in your CRM
const customer = await db.customers.findOne({ organizationId: req.tenantId });
```

## 🤖 AI Features

Powered by Anthropic's Claude Sonnet 4:

```javascript
import { aiService } from './seo/seo-ai';

// General SEO insights
const insights = await aiService.chat('How can I improve my SEO?', {
  project, keywords, competitors, seoIssues
});

// Keyword analysis
const analysis = await aiService.analyzeKeywords(keywords);

// Generate AI backlinks (free alternative to DataForSEO)
const backlinks = await aiService.generateAIBacklinks(domain, count);
```

## 🌍 Multi-Language Support

Already built-in! 6 languages supported:

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Chinese (zh)
- Japanese (ja)

## 📈 What Your Customers Get

When you add ARGILETTE to your CRM, your customers get:

- **All-in-One Platform** - CRM + SEO in one place
- **Better Decisions** - Data-driven SEO strategy
- **Save Time** - No context switching
- **Save Money** - No separate SEO tools needed
- **AI-Powered** - Smart recommendations
- **Professional Reports** - Automated PDF/CSV reports

## 🛠️ Troubleshooting

### "Module not found" errors

```bash
# Make sure all dependencies are installed
npm install @anthropic-ai/sdk @neondatabase/serverless drizzle-orm zod ws
```

### "tenantId is undefined"

```javascript
// Ensure middleware sets tenantId
app.use('/api/seo', (req, res, next) => {
  req.tenantId = req.user.organizationId;
  next();
});
```

### Database connection errors

```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### "gen_random_uuid() does not exist"

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - 5-minute setup
- **[docs/INSTALLATION.md](docs/INSTALLATION.md)** - Detailed guide
- **[docs/API.md](docs/API.md)** - API reference
- **[examples/](examples/)** - Code examples

## ✅ Installation Checklist

- [ ] Copy server files to your CRM
- [ ] Install dependencies
- [ ] Run database migration
- [ ] Add routes with auth middleware
- [ ] Set ANTHROPIC_API_KEY in .env
- [ ] Test API endpoints
- [ ] Link to CRM entities
- [ ] Update navigation
- [ ] Customize (optional)
- [ ] Deploy!

## 🚀 Next Steps

1. **Copy the files** to your CRM project
2. **Follow QUICK_START.md** for 5-minute setup
3. **Test the endpoints** to verify integration
4. **Customize** to match your CRM's design
5. **Roll out** to your customers

---

## 🎉 You're Ready!

This package contains **real, production-ready code** extracted from ARGILETTE. Everything works out of the box - just configure and deploy!

**Questions?** Check the [docs/](docs/) folder for detailed guides.

**Need help?** See [examples/crm-integration-example.js](examples/crm-integration-example.js) for a complete working example.

---

**Package Version:** 1.0.0 (Production-Ready)  
**Code Status:** ✅ Fully Functional  
**Lines of Code:** 3,000+ (actual implementation)  
**Last Updated:** January 2025
