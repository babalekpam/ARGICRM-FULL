# 🚀 ARGILETTE Quick Start (5 Minutes)

## ✅ Checklist

### 1. Copy Real Implementation Files (1 min)
```bash
cd YOUR_CRM_PROJECT

# Copy actual server implementation (3000+ lines of working code!)
cp integration-package/server/seo-*.ts server/seo/

# Copy schema
cp integration-package/server/seo-schema.ts shared/
```

### 2. Install Packages (1 min)
```bash
npm install @anthropic-ai/sdk recharts react-i18next i18next i18next-browser-languagedetector drizzle-orm @neondatabase/serverless zod
```

### 3. Database Setup (1 min)
```bash
psql $DATABASE_URL -f integration-package/database/schema.sql
```

### 4. Add Routes (1 min)
```javascript
// In server/index.js
import { registerSEORoutes } from './seo/seo-routes';

// Add middleware for your auth (replace with your CRM's auth)
app.use('/api/seo', (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  req.tenantId = req.user.organizationId; // Map to your org ID field
  next();
});

// Register SEO routes - actual working implementation!
registerSEORoutes(app);
```

### 5. Environment Variables (1 min)
```bash
# Add to .env
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### 6. Add to Navigation (1 min)
```javascript
// In your nav component
{ name: 'SEO', icon: ChartIcon, href: '/seo' }
```

## ✨ Done!

Visit: `http://localhost:3000/seo`

## 📡 Available Endpoints

```
GET  /api/seo/dashboard          # Dashboard metrics
GET  /api/seo/keywords            # Keyword list
POST /api/seo/keywords            # Add keyword
GET  /api/seo/backlinks           # Backlink list
POST /api/seo/backlinks/generate  # Generate backlinks (AI/API)
GET  /api/seo/traffic             # Traffic data
GET  /api/seo/competitors         # Competitors
GET  /api/seo/seo-issues          # SEO issues
POST /api/seo/ai/insights         # AI insights
GET  /api/seo/local-rankings      # Local SEO
GET  /api/seo/social-accounts     # Social media
```

## 🔗 Link to CRM Data

### Option 1: Add SEO Project ID to Customers
```sql
ALTER TABLE crm_customers ADD COLUMN seo_project_id VARCHAR REFERENCES projects(id);
```

### Option 2: Use Tenant ID
```javascript
// All SEO data is already linked by tenantId
// Just ensure req.tenantId matches your CRM's org/tenant ID
```

## 🎨 Customize (Optional)

### Change Route Path
```javascript
app.use('/custom-path', seoRouter); // Instead of /api/seo
```

### Disable Features
```javascript
// server/seo/config.js
export const features = {
  localSEO: false,
  socialMedia: false,
  // ... more options
};
```

### Brand Colors
```css
/* In your CSS */
:root {
  --seo-primary: #your-color;
}
```

## 🐛 Troubleshooting

### Routes not working?
```javascript
// Ensure routes are after body parser
app.use(express.json());
registerSEORoutes(app);
```

### Auth errors?
```javascript
// Map your auth to SEO
function attachTenantId(req, res, next) {
  req.tenantId = req.user.organizationId;
  next();
}
```

### Database errors?
```bash
# Verify connection
psql $DATABASE_URL -c "SELECT 1"

# Re-run schema
psql $DATABASE_URL -f integration-package/database/schema.sql
```

## 📚 More Help

- **Full Guide**: `integration-package/README.md`
- **Installation**: `integration-package/docs/INSTALLATION.md`
- **API Docs**: `integration-package/docs/API.md`

---

**That's it!** Your CRM now has enterprise SEO analytics. 🎉
