# ARGILETTE API Documentation

## Base URL

```
http://localhost:3000/api/seo
```

## Authentication

All endpoints require authentication. Include auth token in headers:

```javascript
headers: {
  'Authorization': 'Bearer YOUR_TOKEN',
  // or use your CRM's auth method
}
```

## Endpoints

### 📊 Dashboard

#### GET /api/seo/dashboard
Get dashboard overview with all metrics.

**Query Parameters:**
- `projectId` (required) - Project ID

**Response:**
```json
{
  "id": "project-1",
  "name": "Main Website",
  "domain": "example.com",
  "totalKeywords": 150,
  "totalBacklinks": 1250,
  "referringDomains": 320,
  "organicTraffic": 25000,
  "seoScore": 85,
  "keywords": [...],
  "backlinks": [...],
  "trafficData": [...],
  "aiInsights": "..."
}
```

---

### 🔑 Keywords

#### GET /api/seo/keywords
Get all keywords for a project.

**Query Parameters:**
- `projectId` (required)

**Response:**
```json
[
  {
    "id": "kw-1",
    "keyword": "best seo tools",
    "searchVolume": 12000,
    "difficulty": 65,
    "position": 5,
    "cpc": 3.50,
    "trend": "up"
  }
]
```

#### POST /api/seo/keywords
Add a new keyword to track.

**Body:**
```json
{
  "projectId": "project-1",
  "keyword": "seo analytics",
  "searchVolume": 8000,
  "difficulty": 45
}
```

#### DELETE /api/seo/keywords/:id
Remove a keyword.

---

### 🔗 Backlinks

#### GET /api/seo/backlinks
Get all backlinks for a project.

**Query Parameters:**
- `projectId` (required)

**Response:**
```json
[
  {
    "id": "bl-1",
    "url": "https://example.com/article",
    "domainScore": 75,
    "anchorText": "SEO tools",
    "date": "2024-01-15",
    "source": "ai"
  }
]
```

#### POST /api/seo/backlinks/generate
Generate backlinks using AI or API.

**Body:**
```json
{
  "projectId": "project-1",
  "domain": "example.com",
  "mode": "ai",
  "count": 50
}
```

**Modes:**
- `ai` - Free AI-generated backlinks (default)
- `api` - Real backlinks from DataForSEO (requires credentials)

**Response:**
```json
{
  "message": "Generated 50 backlinks",
  "backlinks": [...]
}
```

---

### 📈 Traffic Analytics

#### GET /api/seo/traffic
Get traffic data over time.

**Query Parameters:**
- `projectId` (required)

**Response:**
```json
[
  {
    "id": "t-1",
    "date": "2024-01-01",
    "visits": 5230
  },
  {
    "id": "t-2",
    "date": "2024-01-02",
    "visits": 5450
  }
]
```

#### POST /api/seo/traffic
Add traffic data point.

**Body:**
```json
{
  "projectId": "project-1",
  "date": "2024-01-15",
  "visits": 6200
}
```

---

### 🥊 Competitors

#### GET /api/seo/competitors
Get competitor analysis.

**Query Parameters:**
- `projectId` (required)

**Response:**
```json
[
  {
    "id": "c-1",
    "domain": "competitor.com",
    "domainScore": 80,
    "topKeyword": "seo tools",
    "estimatedTraffic": 50000,
    "commonKeywords": 25
  }
]
```

#### POST /api/seo/competitors
Add competitor to track.

**Body:**
```json
{
  "projectId": "project-1",
  "domain": "competitor.com",
  "domainScore": 75
}
```

---

### 🔧 SEO Issues

#### GET /api/seo/seo-issues
Get SEO audit issues.

**Query Parameters:**
- `projectId` (required)

**Response:**
```json
[
  {
    "id": "i-1",
    "severity": "critical",
    "title": "Missing meta descriptions",
    "description": "15 pages are missing meta descriptions",
    "affectedPages": 15
  }
]
```

#### POST /api/seo/seo-issues
Add SEO issue.

**Body:**
```json
{
  "projectId": "project-1",
  "severity": "high",
  "title": "Slow page speed",
  "description": "Homepage loads in 5.2s",
  "affectedPages": 1
}
```

---

### 🤖 AI Insights

#### POST /api/seo/ai/insights
Get AI-powered SEO insights.

**Body:**
```json
{
  "projectId": "project-1",
  "type": "general"
}
```

**Types:**
- `general` - Overall SEO analysis
- `keywords` - Keyword recommendations
- `technical` - Technical SEO issues
- `content` - Content optimization
- `competitors` - Competitor strategy

**Response:**
```json
{
  "insights": "Based on your current SEO data, here are my recommendations...",
  "recommendations": [
    "Focus on building more backlinks from high-authority sites",
    "Optimize meta descriptions for better CTR"
  ]
}
```

---

### 📍 Local SEO

#### GET /api/seo/local-rankings
Get local search rankings.

**Query Parameters:**
- `projectId` (required)

**Response:**
```json
[
  {
    "id": "lr-1",
    "location": "New York, NY",
    "keyword": "seo agency",
    "position": 3,
    "localPackPosition": 1,
    "searchVolume": 2400
  }
]
```

#### POST /api/seo/local-rankings/generate
Generate AI-powered local SEO data.

**Body:**
```json
{
  "projectId": "project-1",
  "businessName": "My Business",
  "locations": ["New York, NY", "Los Angeles, CA"]
}
```

---

### 📱 Social Media

#### GET /api/seo/social-accounts
Get connected social accounts.

**Query Parameters:**
- `projectId` (required)

**Response:**
```json
[
  {
    "id": "sa-1",
    "platform": "twitter",
    "handle": "@mybrand",
    "followers": 15000,
    "engagementRate": 3.5,
    "connectedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/seo/social-accounts
Connect a social account.

**Body:**
```json
{
  "projectId": "project-1",
  "platform": "twitter",
  "handle": "@mybrand",
  "followers": 15000
}
```

---

### 📄 Reports

#### GET /api/seo/reports
Get report configurations.

**Query Parameters:**
- `projectId` (required)

**Response:**
```json
[
  {
    "id": "rc-1",
    "name": "Weekly SEO Report",
    "reportType": "full",
    "frequency": "weekly",
    "format": "pdf",
    "isActive": true
  }
]
```

#### POST /api/seo/reports/generate
Generate a report.

**Body:**
```json
{
  "projectId": "project-1",
  "reportType": "full",
  "format": "pdf"
}
```

**Report Types:**
- `full` - Complete SEO report
- `keywords` - Keywords only
- `traffic` - Traffic analytics
- `technical` - Technical SEO
- `backlinks` - Backlink analysis

---

### 🔐 API Keys

#### GET /api/seo/api-keys
Get API keys for programmatic access.

**Response:**
```json
[
  {
    "id": "ak-1",
    "name": "Production API Key",
    "permissions": "read",
    "rateLimit": 1000,
    "lastUsedAt": "2024-01-15T10:30:00Z"
  }
]
```

#### POST /api/seo/api-keys
Create new API key.

**Body:**
```json
{
  "name": "My API Key",
  "permissions": "read",
  "rateLimit": 1000,
  "expiresAt": "2025-01-01T00:00:00Z"
}
```

**Response:**
```json
{
  "id": "ak-1",
  "name": "My API Key",
  "key": "seo_live_xxxxx",
  "message": "Save this key - it won't be shown again"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required field: projectId"
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "message": "Forbidden: Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Project not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

---

## Rate Limiting

- **Default**: 1000 requests/hour per API key
- **Headers returned**:
  - `X-RateLimit-Limit`: Total allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

---

## Webhook Events (Optional)

Subscribe to events:

```javascript
POST /api/seo/webhooks
{
  "url": "https://your-crm.com/webhooks/seo",
  "events": ["keyword.ranking.changed", "backlink.gained"]
}
```

**Events:**
- `keyword.ranking.changed` - Keyword position changed
- `backlink.gained` - New backlink discovered
- `backlink.lost` - Backlink removed
- `seo_score.changed` - SEO score updated
- `report.generated` - New report available

---

## Example Integration

### Fetch SEO Data in Your CRM

```javascript
// In your CRM's backend
import fetch from 'node-fetch';

async function getCustomerSEOData(customerId) {
  // Get customer's SEO project ID
  const customer = await db.customers.findOne({ id: customerId });
  
  if (!customer.seo_project_id) {
    return null;
  }
  
  // Fetch SEO data
  const response = await fetch(
    `http://localhost:3000/api/seo/dashboard?projectId=${customer.seo_project_id}`,
    {
      headers: {
        'Authorization': `Bearer ${req.user.token}`
      }
    }
  );
  
  return response.json();
}

// Use in your routes
app.get('/crm/customer/:id/seo', async (req, res) => {
  const seoData = await getCustomerSEOData(req.params.id);
  res.json(seoData);
});
```

### Display in Frontend

```javascript
// In your CRM's frontend
async function loadCustomerSEO(customerId) {
  const response = await fetch(`/crm/customer/${customerId}/seo`);
  const data = await response.json();
  
  // Display SEO metrics
  document.getElementById('seo-score').textContent = data.seoScore;
  document.getElementById('keywords-count').textContent = data.totalKeywords;
  document.getElementById('backlinks-count').textContent = data.totalBacklinks;
}
```

---

## Client Libraries

### JavaScript/TypeScript

```javascript
class ARGILETTEClient {
  constructor(apiUrl, token) {
    this.apiUrl = apiUrl;
    this.token = token;
  }
  
  async getKeywords(projectId) {
    const res = await fetch(`${this.apiUrl}/keywords?projectId=${projectId}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return res.json();
  }
  
  async addKeyword(projectId, keyword) {
    const res = await fetch(`${this.apiUrl}/keywords`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ projectId, ...keyword })
    });
    return res.json();
  }
}

// Usage
const seo = new ARGILETTEClient('http://localhost:3000/api/seo', token);
const keywords = await seo.getKeywords('project-1');
```

---

**API Version**: 1.0.0  
**Last Updated**: January 2025
