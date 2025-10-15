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

### Local SEO Tracking
- Monitors location-based search rankings across multiple cities and regions.
- Google Business Profile metrics tracking (views, searches, actions, calls, directions).
- Local citations management showing business listings across directories.
- Location selector for targeted local SEO analysis.

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