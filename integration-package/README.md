# ARGILETTE SEO Analytics - CRM Integration Package

## 📦 What's This?

This package allows you to integrate ARGILETTE's complete SEO analytics platform into your existing Node.js CRM. You'll get:

- ✅ **Keyword Research & Tracking** - Monitor rankings and search volumes
- ✅ **Backlink Analysis** - AI-powered and API-based backlink tracking
- ✅ **Traffic Analytics** - Organic traffic monitoring
- ✅ **Competitor Analysis** - Track and compare competitors
- ✅ **SEO Audits** - Technical SEO issue detection
- ✅ **AI Insights** - Claude-powered SEO recommendations
- ✅ **Local SEO** - Google Business Profile tracking
- ✅ **Social Media Monitoring** - Multi-platform tracking
- ✅ **Automated Reports** - Generate and schedule SEO reports
- ✅ **API Access** - Full REST API for programmatic access
- ✅ **Multi-Language Support** - 6 languages (EN, ES, FR, DE, ZH, JA)

## 🚀 Quick Start (5 Minutes)

### Step 1: Copy Files to Your CRM

```bash
# Copy integration files to your CRM project
cp -r integration-package/server/* YOUR_CRM/server/seo/
cp -r integration-package/client/* YOUR_CRM/client/src/seo/
cp integration-package/database/schema.sql YOUR_CRM/database/
```

### Step 2: Install Dependencies

```bash
cd YOUR_CRM
npm install @anthropic-ai/sdk recharts react-i18next i18next i18next-browser-languagedetector drizzle-orm @neondatabase/serverless
```

### Step 3: Set Up Database

```bash
# Run the schema SQL to add SEO tables
psql $DATABASE_URL -f database/schema.sql

# Or use your CRM's migration tool
npm run migrate # (adjust to your CRM's command)
```

### Step 4: Add Routes to Your CRM

```javascript
// In your CRM's server/index.js or app.js
import { registerSEORoutes } from './seo/routes.js';

// After your existing routes
registerSEORoutes(app);

// SEO routes will be available at:
// /api/seo/dashboard
// /api/seo/keywords
// /api/seo/backlinks
// etc.
```

### Step 5: Add UI Navigation

```javascript
// In your CRM's navigation/menu component
const menuItems = [
  // Your existing menu items
  { name: 'Customers', path: '/customers' },
  { name: 'Deals', path: '/deals' },
  
  // Add SEO section
  { 
    name: 'SEO Analytics', 
    path: '/seo',
    submenu: [
      { name: 'Dashboard', path: '/seo/dashboard' },
      { name: 'Keywords', path: '/seo/keywords' },
      { name: 'Backlinks', path: '/seo/backlinks' },
      { name: 'Traffic', path: '/seo/traffic' },
    ]
  }
];
```

### Step 6: Set Environment Variables

```bash
# Add to your .env file
ANTHROPIC_API_KEY=your_key_here  # For AI features
DATAFORSEO_LOGIN=optional         # For API backlink mode
DATAFORSEO_PASSWORD=optional      # For API backlink mode
```

## 📁 Package Structure

```
integration-package/
├── README.md                    # This file
├── docs/
│   ├── INSTALLATION.md         # Detailed installation guide
│   ├── API.md                  # API documentation
│   └── FEATURES.md             # Feature documentation
├── server/
│   ├── routes.js               # All SEO API routes
│   ├── ai-service.js           # Anthropic AI integration
│   ├── storage.js              # Database operations
│   └── middleware.js           # Auth & tenant middleware
├── database/
│   ├── schema.sql              # PostgreSQL schema
│   └── seed.sql                # Sample data (optional)
├── client/
│   ├── pages/                  # React pages
│   ├── components/             # React components
│   └── i18n/                   # Translation files
└── config/
    ├── dependencies.json       # Required npm packages
    └── .env.example            # Environment variables template

```

## 🔐 Authentication Integration

ARGILETTE uses **Replit Auth** by default, but you can adapt it to your CRM's auth:

### Option A: Use Your CRM's Auth (Recommended)

```javascript
// In server/seo/routes.js
// Replace Replit Auth middleware with your CRM's auth:

// Before:
import { isAuthenticated } from './replitAuth';

// After:
import { requireAuth } from '../middleware/auth'; // Your CRM's auth

// Then use your auth middleware:
app.get('/api/seo/dashboard', requireAuth, async (req, res) => {
  const tenantId = req.user.tenantId; // Adjust to your user object
  // ... rest of code
});
```

### Option B: Keep Separate Auth

Run ARGILETTE with its own auth and use iframe/API integration.

## 🗄️ Database Integration

### Multi-Tenant Architecture

All SEO tables include `tenantId` for data isolation:

```sql
-- Example: Keywords table
CREATE TABLE keywords (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  project_id VARCHAR NOT NULL REFERENCES projects(id),
  keyword TEXT NOT NULL,
  search_volume INTEGER,
  -- ... more fields
);
```

### Link SEO to Your CRM Data

Connect SEO projects to CRM customers:

```javascript
// Add to your CRM's customer table:
ALTER TABLE crm_customers 
ADD COLUMN seo_project_id VARCHAR REFERENCES projects(id);

// Then fetch customer's SEO data:
const customer = await db.customers.findOne({ id: customerId });
const seoData = await db.keywords.findMany({ 
  projectId: customer.seo_project_id 
});
```

## 🎨 Frontend Integration

### Option 1: Full React Integration (If your CRM uses React)

```javascript
// In your CRM's main router
import { Dashboard } from './seo/pages/dashboard';
import { Keywords } from './seo/pages/keywords';

function AppRouter() {
  return (
    <Routes>
      {/* Your existing routes */}
      <Route path="/customers" element={<Customers />} />
      
      {/* Add SEO routes */}
      <Route path="/seo/dashboard" element={<Dashboard />} />
      <Route path="/seo/keywords" element={<Keywords />} />
      {/* ... more SEO routes */}
    </Routes>
  );
}
```

### Option 2: API Integration (For any framework)

Use ARGILETTE's API from your CRM's frontend:

```javascript
// Fetch SEO data in your CRM
async function fetchKeywords(projectId) {
  const response = await fetch(`/api/seo/keywords?projectId=${projectId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}

// Display in your CRM's UI
const keywords = await fetchKeywords(customer.seo_project_id);
```

### Option 3: Iframe Embedding (Simplest)

```html
<!-- In your CRM's customer detail page -->
<div class="seo-section">
  <h2>SEO Analytics</h2>
  <iframe 
    src="/seo/dashboard?projectId=${projectId}" 
    width="100%" 
    height="600px"
    frameborder="0"
  ></iframe>
</div>
```

## 📊 API Endpoints Available

Once integrated, these endpoints will be available:

```
GET  /api/seo/dashboard          # Dashboard metrics
GET  /api/seo/keywords            # Keyword list
POST /api/seo/keywords            # Add keyword
GET  /api/seo/backlinks           # Backlink list
POST /api/seo/backlinks/generate  # Generate AI backlinks
GET  /api/seo/traffic             # Traffic analytics
GET  /api/seo/competitors         # Competitor analysis
GET  /api/seo/seo-issues          # SEO audit issues
POST /api/seo/ai/insights         # Get AI insights
GET  /api/seo/local-rankings      # Local SEO data
GET  /api/seo/social-accounts     # Social media tracking
POST /api/seo/reports/generate    # Generate reports
GET  /api/seo/api-keys            # API key management
```

See `docs/API.md` for complete API documentation.

## 🌍 Multi-Language Support

ARGILETTE supports 6 languages out of the box:

```javascript
// In your CRM's i18n config
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import SEO translations
import enTranslation from './seo/i18n/locales/en.json';
import esTranslation from './seo/i18n/locales/es.json';
// ... more languages

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: { ...yourTranslations, ...enTranslation } },
      es: { translation: { ...yourTranslations, ...esTranslation } },
      // ... more languages
    }
  });
```

## 🤖 AI Features Setup

ARGILETTE uses Anthropic's Claude for AI insights:

1. **Get API Key**: https://console.anthropic.com/
2. **Add to .env**: `ANTHROPIC_API_KEY=sk-ant-...`
3. **AI Features**:
   - Automatic SEO insights generation
   - AI-powered backlink generation (free alternative to DataForSEO)
   - Local SEO profile generation
   - Keyword analysis and recommendations

## 🔗 Link Building Integration

Two modes available:

### AI Mode (Free, Default)
```javascript
// Generate AI-powered backlinks
POST /api/seo/backlinks/generate
{
  "domain": "example.com",
  "mode": "ai",
  "count": 50
}
```

### API Mode (Paid, DataForSEO)
```javascript
// Fetch real backlinks from DataForSEO
POST /api/seo/backlinks/generate
{
  "domain": "example.com", 
  "mode": "api",
  "count": 1000
}
```

## 📈 Usage Examples

### Example 1: Add SEO Dashboard to Customer Page

```javascript
// In your CRM's customer detail page
import { SEODashboard } from './seo/components/SEODashboard';

function CustomerDetail({ customerId }) {
  const customer = useCustomer(customerId);
  
  return (
    <div>
      {/* Your existing customer info */}
      <CustomerInfo customer={customer} />
      
      {/* Add SEO section */}
      <section className="seo-analytics">
        <h3>SEO Performance</h3>
        <SEODashboard projectId={customer.seo_project_id} />
      </section>
    </div>
  );
}
```

### Example 2: Bulk SEO Reports for Customers

```javascript
// Generate SEO reports for all customers
async function generateCustomerReports() {
  const customers = await db.customers.findMany();
  
  for (const customer of customers) {
    if (customer.seo_project_id) {
      await fetch('/api/seo/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          projectId: customer.seo_project_id,
          reportType: 'full',
          format: 'pdf'
        })
      });
    }
  }
}
```

## 🛠️ Customization

### Customize Colors/Theme

```css
/* In your CRM's CSS */
:root {
  --seo-primary: #your-brand-color;
  --seo-secondary: #your-secondary-color;
}
```

### Customize Features

Enable/disable features in config:

```javascript
// config/seo-features.js
export const seoFeatures = {
  keywords: true,
  backlinks: true,
  traffic: true,
  competitors: true,
  localSEO: true,
  socialMedia: false,  // Disable if not needed
  apiAccess: true,
  aiInsights: true
};
```

## 📚 Additional Resources

- **Full Installation Guide**: See `docs/INSTALLATION.md`
- **API Documentation**: See `docs/API.md`
- **Feature Guide**: See `docs/FEATURES.md`
- **Migration Guide**: See `docs/MIGRATION.md`

## 🆘 Support & Troubleshooting

### Common Issues

**Issue**: Authentication errors
```javascript
// Solution: Make sure tenantId is set correctly
app.use((req, res, next) => {
  req.tenantId = req.user.organizationId; // Adjust to your user object
  next();
});
```

**Issue**: Database connection errors
```javascript
// Solution: Ensure DATABASE_URL is set
console.log(process.env.DATABASE_URL); // Should show your DB connection
```

**Issue**: Missing dependencies
```bash
# Solution: Install all required packages
npm install --save-exact $(cat config/dependencies.json | jq -r '.dependencies | keys[]')
```

## 🚀 Next Steps

1. ✅ Copy integration files
2. ✅ Install dependencies  
3. ✅ Run database migrations
4. ✅ Add routes to your server
5. ✅ Update navigation/menu
6. ✅ Set environment variables
7. ✅ Test integration
8. ✅ Customize to match your CRM's design

**You're ready to go!** 🎉

Your CRM now has enterprise-grade SEO analytics capabilities.
