# ARGILETTE - SEO Analytics Dashboard

## Overview

ARGILETTE is a comprehensive SEO analytics platform inspired by Neil Patel's Ubersuggest. The application provides keyword research, site audits, traffic analysis, competitor tracking, backlink monitoring, and **link building** capabilities through a professional, data-rich dashboard interface.

The platform follows a modern full-stack architecture with React/TypeScript frontend, Express backend, and PostgreSQL database using Drizzle ORM. The design system emphasizes clarity over complexity with card-based layouts and Material Design principles for data visualization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: shadcn/ui components based on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Charts**: Recharts for data visualization

**Design System:**
- Custom theme with light/dark mode support
- Professional analytics color palette (primary blue: `220 70% 45%`)
- Inter font for UI, JetBrains Mono for metrics
- Card-based modular layouts for metric grouping
- HSL color system with CSS custom properties for theming

**Component Architecture:**
- Reusable metric cards, charts, and data tables
- Page-level components for each analytics section (Dashboard, Keywords, Traffic, SEO Audit, Backlinks, Competitors)
- Sidebar navigation with project selector
- Design follows single-page overview philosophy with minimal nested navigation

**Build Configuration:**
- Vite for fast development and optimized production builds
- Path aliases (@/ for client, @shared for shared types)
- Development-only Replit plugins (cartographer, dev banner, runtime error overlay)

### Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database ORM**: Drizzle ORM
- **Database Driver**: Neon serverless PostgreSQL driver

**API Design:**
- RESTful endpoints under `/api` prefix
- Project-scoped data queries (all data filtered by projectId)
- Main endpoints:
  - `GET /api/dashboard` - Aggregated dashboard data
  - `GET /api/projects` - Project management
  - `GET /api/keywords` - Keyword research data
  - `GET /api/traffic` - Traffic analytics
  - `GET /api/backlinks` - Backlink monitoring
  - `GET /api/competitors` - Competitor analysis
  - `GET /api/seo-issues` - SEO audit results

**Server Architecture:**
- Development: Vite middleware for HMR and SSR
- Production: Static file serving from dist/public
- Request logging middleware for API routes
- Error handling middleware

**Data Storage:**
- PostgreSQL database with Drizzle ORM (DbStorage implementation)
- Interface-based storage abstraction (IStorage) for flexible implementation
- UUID-based primary keys for all entities
- Full data persistence across server restarts
- WebSocket-enabled Neon serverless driver

### AI-Powered Analytics

**Anthropic Integration:**
- **Model**: Claude Sonnet 4 (claude-sonnet-4-20250514) - Latest Anthropic model
- **SDK**: @anthropic-ai/sdk for TypeScript integration
- **API Key**: Managed via Replit Secrets (ANTHROPIC_API_KEY)

**AI Service Architecture** (server/ai.ts):
- **Context-Aware Analysis**: Automatically includes project data (keywords, traffic, competitors, SEO issues) in AI prompts
- **Specialized Methods**:
  - `chat()` - General SEO consultation with project context
  - `generateInsights()` - Automated actionable recommendations
  - `analyzeKeywords()` - Keyword strategy and opportunity analysis
  - `analyzeCompetitors()` - Competitive intelligence and positioning
  - `prioritizeSEOIssues()` - Issue prioritization and fix roadmap

**AI API Endpoints:**
- `POST /api/ai/chat` - Interactive chat with SEO context
- `POST /api/ai/insights` - Auto-generated insights for dashboard
- `POST /api/ai/analyze-keywords` - Keyword strategy analysis
- `POST /api/ai/analyze-competitors` - Competitor analysis
- `POST /api/ai/prioritize-issues` - SEO issue prioritization
- All endpoints are authenticated and tenant-scoped

**Frontend AI Components:**
- **AIInsightsCard**: Auto-generates insights on dashboard load, displays 3-5 actionable recommendations
- **AIAssistant**: Interactive chat component with compact and full variants
- **AI Assistant Page**: Dedicated page with all AI analysis tools and chat interface
- **Auto-Loading**: Insights generate automatically when dashboard mounts - no user action required
- **Error Handling**: Graceful degradation with retry options

**User Experience:**
- ✅ AI insights visible immediately on dashboard homepage
- ✅ Automatic generation on page load (no manual triggers required)
- ✅ Manual refresh available for new insights
- ✅ Dedicated AI Assistant page in sidebar navigation
- ✅ Real-time chat interface for SEO questions
- ✅ One-click specialized analysis tools

### Link Building System

**Database Schema (4 new tables):**
- **backlinkOpportunities**: Target URL tracking with domain authority (0-100), relevance score (0-100), contact email, notes, status (identified/contacted/negotiating/secured/rejected)
- **outreachCampaigns**: Campaign management with objectives, target counts, progress tracking (totalSent, totalReplies, successfulLinks), status (planning/active/paused/completed)
- **outreachContacts**: Contact relationship tracking with email, domain, last contact date, response status (no_response/responded/interested/rejected)
- **backlinkGaps**: Competitor gap analysis with shared/unique backlink counts, gap scores

**API Endpoints:**
- `GET/POST/PATCH/DELETE /api/link-building/opportunities` - Opportunity CRUD with project filtering
- `GET/POST/PATCH/DELETE /api/link-building/campaigns` - Campaign CRUD with progress metrics
- `GET/POST/PATCH /api/link-building/contacts` - Contact tracking and status updates
- `GET/POST/PATCH /api/link-building/gaps` - Competitor gap analysis
- `POST /api/ai/recommend-backlinks` - AI-powered opportunity recommendations using Claude

**Link Building Page UI (client/src/pages/link-building.tsx):**
- **Metrics Dashboard**: Total opportunities, active campaigns, secured links, success rate
- **Tabbed Interface**: 
  - Opportunities Finder: Search, filter, create opportunities with DA and relevance scores
  - Campaign Manager: Track outreach campaigns with progress metrics
  - Gap Analysis: Identify competitor backlink opportunities
- **AI Integration**: One-click AI-powered recommendations for link building strategies
- **Status Tracking**: Visual badges for opportunity and campaign states
- **Error Handling**: User-friendly toast notifications for API errors (including Anthropic key issues)

**Implementation Highlights:**
- Full CRUD operations with optimistic UI updates
- Real-time cache invalidation via TanStack Query
- Comprehensive form validation with Zod schemas
- Toast notifications for success/error feedback
- Responsive design with data-testid attributes for e2e testing

### Authentication & Multi-Tenancy

**Replit Auth Integration:**
- OpenID Connect authentication via Replit (server/replitAuth.ts)
- Supports Google, GitHub, X, Apple, and email/password login
- Session storage in PostgreSQL (sessions table)
- Automatic tenant creation on first user login
- Each user gets their own organization/tenant by default

**Authentication Endpoints:**
- `GET /api/login` - Initiates OIDC login flow
- `GET /api/callback` - OIDC callback handler (passport)
- `GET /api/logout` - Logs out and redirects to OIDC logout
- `GET /api/auth/user` - Returns current user session (401 if not authenticated)

**Frontend Authentication (client/src/hooks/use-auth.ts):**
- Custom useAuth hook for authentication state management
- Fetches user session with 5-minute cache window
- Handles 401 responses (returns null for unauthenticated)
- Provides login/logout helper functions

**Landing Page (client/src/pages/landing.tsx):**
- Public landing page with professional hero section
- Feature showcase and benefits presentation
- Multiple login CTAs throughout the page
- Redirects to /api/login for Replit Auth

**Protected Routes (client/src/App.tsx):**
- Shows loading state while checking authentication
- Displays landing page for unauthenticated users
- Only loads projects query when authenticated (enabled: isAuthenticated)
- All dashboard routes protected behind authentication

**User Profile Display:**
- Avatar in header with user profile image
- Fallback to initials if no profile image
- Dropdown menu with user name (firstName + lastName) and email
- Logout button with proper session cleanup

**Multi-Tenant Architecture:**
- **Strict tenant isolation**: ALL data tables include tenantId foreign key
- **CASCADE DELETE**: Deleting a tenant removes all associated data
- **Automatic tenant assignment**: Users automatically assigned to their organization
- **Security model**: Users can only access data from their own tenant
- **Storage layer enforcement**: All queries filtered by tenantId

### Database Schema

**Auth & Tenant Tables:**
- **sessions**: Session storage for Replit Auth (sid, sess, expire)
- **users**: User profiles with Replit OIDC claims (id, email, firstName, lastName, profileImageUrl, tenantId)
- **tenants**: Organizations/workspaces (id, name)

**Core Tables (all with tenantId for isolation):**
- **projects**: Website projects with SEO metrics (tenantId, seoScore, organicTraffic, totalBacklinks, etc.)
- **keywords**: Keyword tracking (tenantId, projectId, search volume, difficulty, position, CPC)
- **keywordRankings**: Ranking distribution (tenantId, projectId, top3, top10, top20, top50, over50)
- **trafficData**: Daily traffic analytics (tenantId, projectId, date, visits)
- **backlinks**: Link building data (tenantId, projectId, domain scores)
- **backlinkGrowth**: Historical backlink count data (tenantId, projectId, date, backlinkCount)
- **competitors**: Competitor domains (tenantId, projectId, traffic estimates)
- **seoIssues**: Site audit findings (tenantId, projectId, severity levels)

**Design Decisions:**
- PostgreSQL dialect with UUID primary keys (varchar + gen_random_uuid())
- Foreign key relationships: tenants → users, tenants → all data tables
- CASCADE DELETE on all FK relationships for data cleanup
- Text-based date storage for flexible querying
- Real numbers for financial data (CPC)
- Integer metrics for counts and scores
- Insert schemas omit tenantId (added by server from authenticated user)

### Build & Deployment

**Development:**
- `npm run dev` - Starts development server with hot reload
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push schema changes to database

**Production:**
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles server to `dist/index.js`
- Single-command build: `npm run build`
- Start: `npm start` runs production server

## External Dependencies

### UI Components & Styling
- **shadcn/ui**: Complete UI component library built on Radix UI
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, popovers, etc.)
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Component variant handling
- **Recharts**: Chart library for data visualization
- **Lucide React**: Icon library
- **Google Fonts**: Inter (UI), JetBrains Mono (metrics)

### Data Management
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **date-fns**: Date formatting and manipulation

### Database & Backend
- **Neon Serverless**: PostgreSQL database driver
- **Drizzle ORM**: TypeScript ORM with schema validation
- **Drizzle Kit**: Database migrations and schema management

### Development Tools
- **Vite**: Build tool and dev server
- **esbuild**: Production backend bundling
- **TypeScript**: Type safety across full stack
- **Replit Plugins**: Development tooling (cartographer, dev banner, error overlay)