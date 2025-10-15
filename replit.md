# ARGILETTE - SEO Analytics Dashboard

## Overview

ARGILETTE is a comprehensive SEO analytics platform inspired by Neil Patel's Ubersuggest. The application provides keyword research, site audits, traffic analysis, competitor tracking, and backlink monitoring capabilities through a professional, data-rich dashboard interface.

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

### Authentication & Multi-Tenancy

**Replit Auth Integration:**
- OpenID Connect authentication via Replit
- Supports Google, GitHub, X, Apple, and email/password login
- Session storage in PostgreSQL (sessions table)
- Automatic tenant creation on first user login
- Each user gets their own organization/tenant by default

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