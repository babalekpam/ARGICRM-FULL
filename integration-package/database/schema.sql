-- ARGILETTE SEO Analytics - Database Schema
-- This schema adds SEO analytics capabilities to your existing CRM database
-- All tables include tenantId for multi-tenant isolation

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Tenants/Organizations table
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan VARCHAR NOT NULL DEFAULT 'free',
  stripe_customer_id VARCHAR,
  stripe_subscription_id VARCHAR,
  subscription_status VARCHAR DEFAULT 'inactive',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users table (extends your CRM users if needed)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SEO Projects table
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  seo_score INTEGER NOT NULL DEFAULT 0,
  organic_traffic INTEGER NOT NULL DEFAULT 0,
  total_backlinks INTEGER NOT NULL DEFAULT 0,
  referring_domains INTEGER NOT NULL DEFAULT 0,
  total_keywords INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- KEYWORD TRACKING
-- ============================================================================

-- Keywords table
CREATE TABLE IF NOT EXISTS keywords (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_volume INTEGER NOT NULL DEFAULT 0,
  difficulty INTEGER NOT NULL DEFAULT 0,
  position INTEGER,
  cpc REAL DEFAULT 0,
  trend TEXT DEFAULT 'stable'
);

-- Keyword ranking distribution
CREATE TABLE IF NOT EXISTS keyword_rankings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  top_3 INTEGER NOT NULL DEFAULT 0,
  top_10 INTEGER NOT NULL DEFAULT 0,
  top_20 INTEGER NOT NULL DEFAULT 0,
  top_50 INTEGER NOT NULL DEFAULT 0,
  over_50 INTEGER NOT NULL DEFAULT 0
);

-- ============================================================================
-- TRAFFIC ANALYTICS
-- ============================================================================

-- Traffic data table
CREATE TABLE IF NOT EXISTS traffic_data (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  visits INTEGER NOT NULL DEFAULT 0
);

-- ============================================================================
-- BACKLINK TRACKING
-- ============================================================================

-- Backlinks table
CREATE TABLE IF NOT EXISTS backlinks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  domain_score INTEGER NOT NULL DEFAULT 0,
  anchor_text TEXT,
  date TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'ai'
);

-- Backlink growth tracking
CREATE TABLE IF NOT EXISTS backlink_growth (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  new_backlinks INTEGER NOT NULL DEFAULT 0,
  lost_backlinks INTEGER NOT NULL DEFAULT 0,
  total_backlinks INTEGER NOT NULL DEFAULT 0
);

-- ============================================================================
-- COMPETITOR ANALYSIS
-- ============================================================================

-- Competitors table
CREATE TABLE IF NOT EXISTS competitors (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  domain_score INTEGER NOT NULL DEFAULT 0,
  top_keyword TEXT,
  estimated_traffic INTEGER NOT NULL DEFAULT 0,
  common_keywords INTEGER NOT NULL DEFAULT 0
);

-- ============================================================================
-- SEO AUDITS
-- ============================================================================

-- SEO Issues table
CREATE TABLE IF NOT EXISTS seo_issues (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_pages INTEGER NOT NULL DEFAULT 1
);

-- Audit scans table
CREATE TABLE IF NOT EXISTS audit_scans (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scan_date TIMESTAMP NOT NULL DEFAULT NOW(),
  pages_crawled INTEGER NOT NULL DEFAULT 0,
  issues_found INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed'
);

-- ============================================================================
-- LINK BUILDING
-- ============================================================================

-- Link opportunities table
CREATE TABLE IF NOT EXISTS link_opportunities (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  domain_authority INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'new'
);

-- Outreach campaigns table
CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  contacts_count INTEGER NOT NULL DEFAULT 0,
  response_rate REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Backlink gap analysis
CREATE TABLE IF NOT EXISTS backlink_gaps (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,
  backlink_url TEXT NOT NULL,
  domain_score INTEGER NOT NULL DEFAULT 0,
  opportunity_score INTEGER NOT NULL DEFAULT 0
);

-- ============================================================================
-- REPORTING
-- ============================================================================

-- Report configurations table
CREATE TABLE IF NOT EXISTS report_configs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'pdf',
  sections JSONB NOT NULL,
  recipients TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Generated reports table
CREATE TABLE IF NOT EXISTS generated_reports (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  config_id VARCHAR REFERENCES report_configs(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL,
  file_url TEXT,
  generated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- API ACCESS
-- ============================================================================

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  permissions TEXT NOT NULL DEFAULT 'read',
  rate_limit INTEGER NOT NULL DEFAULT 1000,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- API usage tracking table
CREATE TABLE IF NOT EXISTS api_usage (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  api_key_id VARCHAR NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time INTEGER,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- LOCAL SEO
-- ============================================================================

-- Local rankings table
CREATE TABLE IF NOT EXISTS local_rankings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  keyword TEXT NOT NULL,
  position INTEGER,
  local_pack_position INTEGER,
  search_volume INTEGER DEFAULT 0,
  date TIMESTAMP DEFAULT NOW()
);

-- Google Business Profile table
CREATE TABLE IF NOT EXISTS google_business_profile (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0,
  searches INTEGER NOT NULL DEFAULT 0,
  calls INTEGER NOT NULL DEFAULT 0,
  directions INTEGER NOT NULL DEFAULT 0,
  rating REAL DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  month TEXT NOT NULL
);

-- Local citations table
CREATE TABLE IF NOT EXISTS local_citations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  directory TEXT NOT NULL,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  nap_consistent BOOLEAN DEFAULT true
);

-- ============================================================================
-- SOCIAL MEDIA MONITORING
-- ============================================================================

-- Social accounts table
CREATE TABLE IF NOT EXISTS social_accounts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  followers INTEGER DEFAULT 0,
  engagement_rate REAL DEFAULT 0,
  connected_at TIMESTAMP DEFAULT NOW()
);

-- Social posts table
CREATE TABLE IF NOT EXISTS social_posts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  account_id VARCHAR NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  post_url TEXT NOT NULL,
  content TEXT,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  posted_at TIMESTAMP DEFAULT NOW()
);

-- Social metrics table
CREATE TABLE IF NOT EXISTS social_metrics (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  account_id VARCHAR NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  followers INTEGER DEFAULT 0,
  engagement_rate REAL DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0
);

-- ============================================================================
-- SESSION STORAGE (for Replit Auth - optional if using your own auth)
-- ============================================================================

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Tenant isolation indexes
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_keywords_tenant ON keywords(tenant_id);
CREATE INDEX IF NOT EXISTS idx_backlinks_tenant ON backlinks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_traffic_tenant ON traffic_data(tenant_id);
CREATE INDEX IF NOT EXISTS idx_competitors_tenant ON competitors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_seo_issues_tenant ON seo_issues(tenant_id);

-- Project relationship indexes
CREATE INDEX IF NOT EXISTS idx_keywords_project ON keywords(project_id);
CREATE INDEX IF NOT EXISTS idx_backlinks_project ON backlinks(project_id);
CREATE INDEX IF NOT EXISTS idx_traffic_project ON traffic_data(project_id);
CREATE INDEX IF NOT EXISTS idx_competitors_project ON competitors(project_id);
CREATE INDEX IF NOT EXISTS idx_seo_issues_project ON seo_issues(project_id);

-- API performance indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_tenant ON api_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_timestamp ON api_usage(timestamp);

-- ============================================================================
-- SAMPLE DATA (Optional - Remove in production)
-- ============================================================================

-- Uncomment to insert sample data for testing
/*
-- Sample tenant
INSERT INTO tenants (id, name, plan) VALUES 
  ('sample-tenant-1', 'Sample Company', 'business');

-- Sample project
INSERT INTO projects (id, tenant_id, name, domain, seo_score) VALUES 
  ('sample-project-1', 'sample-tenant-1', 'Main Website', 'example.com', 75);
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All SEO analytics tables have been created successfully!
-- You can now integrate ARGILETTE into your CRM.
