# ARGILETTE - SEO Analytics Dashboard

## Overview

ARGILETTE is a comprehensive SEO analytics platform inspired by Neil Patel's Ubersuggest. It offers keyword research, site audits, traffic analysis, competitor tracking, backlink monitoring, and link building capabilities through a professional, data-rich dashboard. The platform aims to provide actionable insights for improving search engine rankings and online visibility.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Technologies
The platform uses a modern full-stack architecture:
- **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack Query for state management, shadcn/ui and Tailwind CSS for UI, and Recharts for data visualization.
- **Backend**: Node.js with Express.js, TypeScript.
- **Database**: PostgreSQL with Drizzle ORM and Neon serverless driver.

### Design System
- Custom theme with light/dark mode, professional analytics color palette, and Inter/JetBrains Mono fonts.
- Features card-based modular layouts for metric grouping and follows a single-page overview philosophy.

### Dashboard & Real-Time Metrics
- **Real-Time Calculations**: All dashboard metrics are calculated from actual account data, not static values
- **Dynamic Metrics**:
  - Keywords Tracked: Count from keywords table
  - Total Backlinks: Count from backlinks table
  - Referring Domains: Unique domain count from backlink URLs (normalized)
  - Organic Traffic: Latest visits from traffic data (date-sorted)
  - SEO Score: 100 - weighted penalties (critical: -10, high: -5, medium: -2, low: -1)
- **Connected Platform**: Dashboard updates instantly when users add keywords, generate backlinks, or modify data
- **Multi-tenant Secure**: All calculations filtered by tenantId for data isolation

### AI-Powered Analytics
- Integrates Anthropic's Claude Sonnet 4 model for AI-driven insights.
- Provides context-aware analysis based on project data (keywords, traffic, competitors, SEO issues).
- Offers specialized AI methods for general SEO consultation, actionable recommendations, keyword analysis, competitor analysis, and SEO issue prioritization.
- AI insights are automatically generated and displayed on the dashboard, with an interactive chat component available.

### Automated Reporting System
- Allows users to configure and generate comprehensive reports (full, keywords, traffic, technical, backlinks) with customizable frequency, format, and sections.
- Stores generated reports and provides a history view for download.

### Link Building System
- Manages backlink opportunities, outreach campaigns, and contact tracking.
- Includes a tabbed interface for finding opportunities, managing campaigns, and performing competitor gap analysis.
- Leverages AI for recommending link building strategies.

### API Access System
- Comprehensive API key management with secure SHA-256 hashing and one-time secret display.
- Features permission-based access control (read, write, full access) and configurable rate limits.
- Provides per-key usage analytics including endpoint tracking, status codes, and response times.
- Interactive API documentation with example requests for all available endpoints.
- Supports programmatic access to keyword data, traffic analytics, backlinks, and SEO audit results.

### Authentication & Multi-Tenancy
- Utilizes Replit Auth for OpenID Connect authentication (Google, GitHub, X, Apple, email/password).
- Implements a strict multi-tenant architecture where all data tables include a `tenantId` for isolation and security, ensuring users only access their own data.

### Multi-Lingual Support (Internationalization)
- **Complete i18n Implementation**: Built with react-i18next for comprehensive multi-language support
- **6 Languages Supported**: English (en), Spanish (es), French (fr), German (de), Chinese (zh), Japanese (ja)
- **Browser Language Detection**: Automatically detects and sets user's preferred language on first visit
- **Persistent Language Selection**: User language choice saved to localStorage and persists across sessions
- **UI Language Switcher**: Globe icon dropdown in header allows instant language switching
- **Fully Translated Components**: 
  - Sidebar navigation (Analytics, Account, Admin sections)
  - App shell (user menu, logout, loading states, empty project messages)
  - Common UI elements and labels
  - All core navigation and interaction elements
- **Translation Files**: Structured JSON files in client/src/i18n/locales/ for easy maintenance and expansion
- **No Emoji Usage**: Language switcher uses text-only labels (following design guidelines)
- **Accessibility**: Screen reader text properly translated for inclusive user experience

### Super Admin Dashboard
- **Platform Overview**: Dedicated admin dashboard for platform-wide monitoring and management
- **Access Control**: Role-based access via `isAdmin` boolean field on users table
- **Security**: Multi-layer protection with backend middleware (requireAdmin) and frontend route guards
- **Real-Time Metrics**: 
  - Total users, tenants, projects, keywords, and backlinks
  - Active tenant count and subscription plan distribution
  - Recent users and tenants lists (last 10 entries)
- **Admin API Endpoints**:
  - GET /api/admin/stats - Platform-wide statistics
  - GET /api/admin/users - All users list
  - GET /api/admin/tenants - All tenants list
- **UI Integration**: Admin link conditionally shown in sidebar only for admin users
- **Route Protection**: Non-admin users receive "Access Denied" when attempting to access /admin

### Local SEO Tracking (AI-Powered)
- **AI-Generated Local SEO Data**: Uses Anthropic Claude Sonnet 4 to generate complete local SEO profiles
- **Google Business Profile Metrics**: AI generates realistic views, searches, calls, directions, rating, and review counts
- **Location-Based Rankings**: Generates keyword rankings across multiple cities with local pack positions
- **Business Citations**: Creates citations from 20+ popular directories (Google, Yelp, Facebook, Yellow Pages, etc.)
- **One-Click Generation**: Enter business name and target locations, AI creates everything instantly
- **Realistic Data Distribution**: Status (80% active, 15% pending, 5% removed), NAP consistency (85% consistent)
- **Smart Context-Aware**: Uses project keywords for ranking generation, falls back to business name if needed
- **Free & Instant**: No external APIs required, uses existing Anthropic AI infrastructure

### Social Media Monitoring
- Multi-platform social media tracking (Twitter, Facebook, Instagram, LinkedIn, TikTok).
- Metrics tracking: followers, engagement rate, posts, reach, likes, comments, shares.
- Account connection dialog with platform selector and profile details.
- Post performance analysis with engagement metrics.
- Historical metrics tracking for trend analysis.

### Database Schema
- PostgreSQL database with UUID primary keys.
- Core tables include `projects`, `keywords`, `keywordRankings`, `trafficData`, `backlinks`, `backlinkGrowth`, `competitors`, `seoIssues`, `apiKeys`, `apiUsage`, all linked to `tenantId`.
- **Phase 6 additions**: `localRankings`, `googleBusinessProfile`, `localCitations`, `socialAccounts`, `socialPosts`, `socialMetrics` - all with tenantId and CASCADE DELETE.
- Features `CASCADE DELETE` on foreign key relationships for data integrity.
- API keys table stores hashed keys (SHA-256) with metadata including permissions, rate limits, and expiration dates.
- API usage table tracks all API calls with endpoint, method, status code, response time, and timestamp for analytics.

### Build & Deployment
- **Development**: Uses Vite for hot reload and TypeScript checking.
- **Production**: Frontend built with Vite, backend bundled with esbuild.

## External Dependencies

### UI Components & Styling
- shadcn/ui (built on Radix UI)
- Radix UI
- Tailwind CSS
- class-variance-authority
- Recharts
- Lucide React
- Google Fonts

### Data Management
- TanStack Query
- React Hook Form
- Zod
- date-fns

### Database & Backend
- Neon Serverless (PostgreSQL driver)
- Drizzle ORM
- Drizzle Kit

### AI Integration
- Anthropic SDK (`@anthropic-ai/sdk`)

### Authentication
- Replit Auth

### Backlink Analysis System (AI-First Architecture)
- **Primary Mode: AI-Powered (Free)**: Uses Anthropic Claude Sonnet 4 to generate realistic backlink analysis for any domain
- **Optional Mode: DataForSEO API (Paid)**: Real backlink data from DataForSEO for users who need verified data
- Users can generate up to 100 AI backlinks or fetch up to 1,000 API backlinks per request
- AI generation considers project keywords and competitors for industry-appropriate results
- **Data Provenance Tracking**: All backlinks tagged with `source` field ('ai' or 'api') for transparency
- **UI Toggle**: Users can easily switch between AI (free) and API (paid) modes in the interface
- **Visual Indicators**: Sparkles icon for AI-generated, Database icon for API-verified backlinks
- AI features include: domain authority scoring, realistic anchor text, varied source types (news, blogs, directories, forums)
- **Setup for API Mode**: Valid DataForSEO credentials (DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD) required
- **Note**: DataForSEO requires paid subscription (~$100/month). AI mode works out-of-the-box with no external costs