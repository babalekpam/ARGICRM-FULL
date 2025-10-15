# 📦 ARGILETTE Integration Package

## What's Inside?

This package contains everything you need to integrate ARGILETTE SEO analytics into your existing Node.js CRM.

## 📂 Package Structure

```
integration-package/
│
├── 📄 README.md                    ← Start here! Complete integration guide
├── 🚀 QUICK_START.md              ← 5-minute quick setup guide
├── 📑 INDEX.md                     ← This file (package overview)
│
├── 📚 docs/
│   ├── INSTALLATION.md            ← Detailed installation instructions
│   └── API.md                     ← Complete API documentation
│
├── 🔧 config/
│   ├── dependencies.json          ← Required npm packages
│   └── .env.example               ← Environment variables template
│
├── 💾 database/
│   └── schema.sql                 ← PostgreSQL database schema
│
├── 🖥️ server/
│   └── routes-example.js          ← Server routes integration example
│
└── 📝 examples/
    └── crm-integration-example.js ← Complete CRM integration example
```

## 🎯 Quick Links

### Getting Started
1. **[Quick Start Guide](QUICK_START.md)** - Get up and running in 5 minutes
2. **[Full README](README.md)** - Comprehensive integration guide
3. **[Installation Guide](docs/INSTALLATION.md)** - Step-by-step installation

### Reference
- **[API Documentation](docs/API.md)** - All API endpoints and usage
- **[Dependencies](config/dependencies.json)** - Required packages
- **[Database Schema](database/schema.sql)** - SQL schema

### Examples
- **[CRM Integration Example](examples/crm-integration-example.js)** - Complete working example
- **[Server Routes](server/routes-example.js)** - Routes integration guide

## 🚀 Integration Methods

### Method 1: Full Integration (Recommended)
**Time: 5-10 minutes**

Copy ARGILETTE modules directly into your CRM:
1. Copy files to your project
2. Install dependencies
3. Run database migration
4. Add routes to server
5. Update navigation

**Result:** Complete SEO platform embedded in your CRM

### Method 2: API Integration
**Time: 3-5 minutes**

Use ARGILETTE's API from your CRM:
1. Add server routes only
2. Call SEO endpoints from your code
3. Display data in your UI

**Result:** Access SEO data programmatically

### Method 3: Standalone + Proxy
**Time: 10 minutes**

Deploy ARGILETTE separately and proxy requests:
1. Deploy ARGILETTE on subdomain
2. Create proxy routes in your CRM
3. Unified experience for users

**Result:** Separate services, unified experience

## ✨ Features You Get

### Core Features
- ✅ **Keyword Research** - Track and analyze keywords
- ✅ **Backlink Analysis** - AI and API-based backlink tracking
- ✅ **Traffic Analytics** - Monitor organic traffic
- ✅ **Competitor Tracking** - Analyze competitors
- ✅ **SEO Audits** - Technical SEO issue detection
- ✅ **Rank Tracking** - Monitor search rankings

### Advanced Features
- ✅ **AI Insights** - Claude-powered recommendations
- ✅ **Local SEO** - Google Business Profile tracking
- ✅ **Social Media** - Multi-platform monitoring
- ✅ **Automated Reports** - Generate and schedule reports
- ✅ **API Access** - Full REST API
- ✅ **Multi-Language** - 6 languages supported

## 📊 What Your CRM Gets

### New API Endpoints
```
GET  /api/seo/dashboard          # Dashboard metrics
GET  /api/seo/keywords            # Keywords tracking
GET  /api/seo/backlinks           # Backlink analysis
GET  /api/seo/traffic             # Traffic analytics
GET  /api/seo/competitors         # Competitor tracking
POST /api/seo/ai/insights         # AI-powered insights
GET  /api/seo/local-rankings      # Local SEO
GET  /api/seo/social-accounts     # Social media
POST /api/seo/reports/generate    # Generate reports
```

### Database Tables Added
```
projects           # SEO projects
keywords           # Keyword tracking
backlinks          # Backlink data
traffic_data       # Traffic analytics
competitors        # Competitor analysis
seo_issues         # SEO audit issues
local_rankings     # Local SEO data
social_accounts    # Social media tracking
api_keys           # API access management
generated_reports  # Report storage
```

### UI Components (React)
```
- Dashboard page
- Keywords management
- Backlinks analysis
- Traffic charts
- Competitor analysis
- Reports generator
- AI insights chat
- Local SEO tracking
- Social media monitoring
```

## 🔗 Linking to Your CRM

### Option 1: Direct Field
Add SEO project ID to your CRM entities:

```sql
ALTER TABLE crm_customers 
ADD COLUMN seo_project_id VARCHAR REFERENCES projects(id);
```

### Option 2: Mapping Table
Create a flexible mapping:

```sql
CREATE TABLE crm_seo_mapping (
  crm_entity_id VARCHAR NOT NULL,
  crm_entity_type VARCHAR NOT NULL,
  seo_project_id VARCHAR NOT NULL,
  PRIMARY KEY (crm_entity_id, crm_entity_type)
);
```

## 🔐 Authentication

ARGILETTE works with any authentication system:

### Your CRM's Auth (Recommended)
```javascript
// Use your existing auth middleware
registerSEORoutes(app, {
  authMiddleware: yourCRMAuth,
  tenantMiddleware: yourOrgMiddleware
});
```

### Shared Session
```javascript
// Share session store
app.use(session({ store: sharedStore }));
```

### JWT Tokens
```javascript
// Token-based auth
app.use('/api/seo', verifyJWT);
```

## 🎨 Customization

### Change Routes
```javascript
app.use("/api/seo", createSEORouter());
```

### Disable Features
```javascript
const config = {
  localSEO: false,
  socialMedia: false
};
```

### Custom Branding
```css
:root {
  --seo-primary: #your-color;
}
```

## 📈 Usage Examples

### Fetch Customer SEO Data
```javascript
async function getCustomerSEO(customerId) {
  const customer = await db.customers.findOne({ id: customerId });
  const seoData = await fetch(`/api/seo/dashboard?projectId=${customer.seo_project_id}`);
  return seoData.json();
}
```

### Generate Reports for All Customers
```javascript
const customers = await db.customers.findMany();
for (const customer of customers) {
  await fetch('/api/seo/reports/generate', {
    method: 'POST',
    body: JSON.stringify({ projectId: customer.seo_project_id })
  });
}
```

### Display SEO Metrics in CRM
```javascript
// In your customer detail page
const { seoScore, totalKeywords, totalBacklinks } = await getCustomerSEO(id);
```

## 🔧 Required Dependencies

### Backend
```bash
npm install @anthropic-ai/sdk drizzle-orm @neondatabase/serverless zod
```

### Frontend (if using React)
```bash
npm install react-i18next recharts @tanstack/react-query lucide-react
```

### UI Components (if using shadcn)
```bash
npm install @radix-ui/react-dialog @radix-ui/react-tabs tailwindcss
```

## 🌍 Environment Variables

Required:
```bash
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
```

Optional:
```bash
DATAFORSEO_LOGIN=...        # For API backlink mode
DATAFORSEO_PASSWORD=...     # For API backlink mode
```

## ✅ Installation Checklist

- [ ] Copy integration files to your project
- [ ] Install required dependencies
- [ ] Run database migration (schema.sql)
- [ ] Add routes to server
- [ ] Configure environment variables
- [ ] Update navigation/menu
- [ ] Link to CRM entities (customers, etc.)
- [ ] Test API endpoints
- [ ] Customize branding (optional)
- [ ] Deploy and enjoy!

## 🐛 Troubleshooting

### Routes not working?
```javascript
// Ensure routes after body parser
app.use(express.json());
registerSEORoutes(app);
```

### Auth errors?
```javascript
// Map your user object
req.tenantId = req.user.organizationId;
```

### Database errors?
```bash
psql $DATABASE_URL -f database/schema.sql
```

## 📞 Support

- **README**: Comprehensive integration guide
- **Installation Guide**: Step-by-step setup
- **API Docs**: Complete API reference
- **Examples**: Working code samples

## 🎉 What's Next?

1. **Read [QUICK_START.md](QUICK_START.md)** - Get running in 5 minutes
2. **Follow [README.md](README.md)** - Complete integration
3. **Check [Examples](examples/)** - See working code
4. **Customize** - Make it yours!

---

## 📦 Package Contents Summary

| File | Purpose | Size |
|------|---------|------|
| README.md | Main integration guide | Comprehensive |
| QUICK_START.md | 5-minute setup | Essential |
| docs/INSTALLATION.md | Detailed installation | Step-by-step |
| docs/API.md | API documentation | Complete |
| config/dependencies.json | Package list | Reference |
| config/.env.example | Environment template | Setup |
| database/schema.sql | Database schema | Migration |
| server/routes-example.js | Server integration | Code |
| examples/crm-integration-example.js | Full example | Working code |

---

**Total Setup Time:** 5-15 minutes (depending on method)

**Level:** Intermediate (basic Node.js/Express knowledge required)

**Support:** All documentation included

---

## 🚀 Ready to Start?

Choose your path:

1. **Quick & Easy** → [QUICK_START.md](QUICK_START.md)
2. **Full Guide** → [README.md](README.md)  
3. **Step-by-Step** → [docs/INSTALLATION.md](docs/INSTALLATION.md)
4. **See Code First** → [examples/crm-integration-example.js](examples/crm-integration-example.js)

**Let's integrate!** 🎯
