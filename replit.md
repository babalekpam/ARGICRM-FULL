# NODE CRM

## Overview
NODE CRM is an AI-powered, full-stack customer relationship management platform designed for global markets. It integrates real-time sentiment analysis, AI campaign generation, multi-cultural optimization, advanced financial management, and e-commerce functionalities. The platform aims for autonomous AI operations, competitive pricing, and robust data security, providing a comprehensive solution for businesses worldwide. Its business vision is to provide an all-encompassing, secure, and globally adaptable CRM solution that leverages AI for operational efficiency and market responsiveness.

**Domain:** ARGILETTE.org - All platform email addresses use @argilette.org domain (support@argilette.org, info@argilette.org, enterprise@argilette.org).

## User Preferences
Preferred communication style: Simple, everyday language.
Pricing Model: Monthly subscription structure with four tiers (Starter $49.99/month, Professional $149.99/month, Business $299.99/month, Enterprise $799.99/month). All white-label branding options (Basic, Full, Complete Ownership) available as custom-priced add-ons requiring sales contact for quotes. Platform includes CRM + SEO + E-commerce + Link Building + 11-platform tracking in all base plans. Pricing designed to be sustainable for ongoing AI/API costs (Argilette AI, DataForSEO) while remaining competitive vs. buying Semrush + HubSpot + Shopify separately.
Platform Owner Privileges: Restored unlimited access for platform owner (abel@argilette.com) with super admin rights, no subscription limits, and full platform oversight capabilities
Login Page: Clean NODE CRM branding with credentials-only interface, no role indicators or quick login buttons - access levels determined purely by email credentials
Settings Backup: Fully functional backup system with browser save dialog popup - includes backup.html standalone solution for guaranteed reliability, comprehensive JSON export with platform data, settings, and metadata
Contact Import Enhancement: Expanded bulk import to capture complete contact data - added LinkedIn profile URL, location, bio, company website, and number of employees fields to contacts schema with full CSV/Excel import support and intelligent column mapping
E-commerce Currency System: Comprehensive global currency support - 54 African currencies across all regions (North, West, East, Central, Southern Africa), complete with flag indicators and regional organization, covering every African country including CFA Franc zones, island nations, and emerging economies
Code Quality: Major cleanup completed - removed duplicate functions causing TypeScript errors, created clean new landing page component (simple-landing-new.tsx), eliminated all code duplication issues
Page Refresh Issue Fix: Fixed persistent page refresh requirement - implemented network-first service worker strategy, added proper cache control headers to prevent stale content serving, reduced aggressive caching that was causing navigation issues
AI Integration Migration: Migrated from Anthropic Claude to Replit AI Integrations with COMPLETE WHITE-LABEL branding as "Argilette AI". All AI services (SEO insights, campaign generation, sentiment analysis, content generation) now use cost-effective Replit AI Integrations with OpenAI GPT-4o fully white-labeled. Internal provider identifier changed from "openai" to "argilette" to completely hide OpenAI references from end users in API responses, logs, and UI. API responses show `"provider":"argilette"` with zero OpenAI exposure. Settings page displays "Argilette AI Key" instead of "OpenAI API Key". Server logs show "Argilette AI" branding throughout. Charges billed to Replit credits. Multi-provider AI failover system provides redundancy (Argilette AI primary, Anthropic fallback, You.com, Google, Qwen). Key files: server/ai.ts, server/argilette/seo-ai.ts, server/services/ai-failover-service.ts, client/src/pages/settings.tsx.
Landing Page: Complete modern redesign with top navigation - Fixed top navigation bar displaying all 7 key platform features (CRM, Marketing, E-commerce, SEO, AI Tools, Analytics, Multi-Platform) with working navigation links, modern hero section with AI-powered badge and compelling CTAs, 8-feature grid with hover effects, benefits section with highlighted cards, centered login form, primary CTA section, and organized footer. Fully responsive with mobile menu, smooth scroll navigation, and consistent modern design matching platform aesthetic. All interactive elements have proper data-testid attributes for testing. Navigation fix implemented: removed button nesting inside Link components to enable instant tab switching without page refresh - Links now handle navigation directly with proper styling and accessibility
Code Quality: TypeScript errors fully resolved - Eliminated all 235 TypeScript diagnostics by removing duplicate type exports in shared/schema.ts (Project, Product, Territory, ChartOfAccount duplicates), fixed circular reference warnings, resolved type mismatches. Codebase now has 0 LSP diagnostics with full type safety while maintaining 100% runtime functionality.
Theme Control: User-selectable dark/light mode - ThemeToggle button added to main header (between notifications and settings icons) allowing users to choose Light, Dark, or System theme preferences. Default theme changed from automatic system-based switching to Light mode for explicit user control. Theme preference persists in localStorage. Located in client/src/components/header.tsx and client/src/components/theme-toggle.tsx.
SEO Optimization: Comprehensive SEO improvements implemented - Fixed critical domain/canonical mismatch (nodecrm.replit.app → argilette.org), updated all branding from NODE CRM to ARGILETTE throughout meta tags and structured data, created comprehensive sitemap with all SEO tool pages (keyword research, site audit, backlinks, link building, rank tracking, etc.), added visible FAQ section with Schema.org FAQ markup for Google featured snippets, optimized title tags and descriptions to target primary keywords (AI business platform, CRM software, SEO tools, link building software). All changes designed to improve Google search rankings and visibility.
Sales Channel UX Improvements: Complete redesign of platform connection flow - Added comprehensive step-by-step setup guides for all 8 platforms (TikTok, Facebook, Instagram, Google Ads, Twitter/X, LinkedIn, Snapchat, Pinterest), direct "Get Credentials" links that open platform developer portals (e.g., developers.facebook.com/tools/accesstoken/), field-level help text explaining exactly where to find each credential, form validation requiring all required fields before submission, proper state management resetting dialog on close and after successful connection, explicit optional field flags (e.g., Facebook Pixel ID), error message display for failed connections, and improved visual design with blue info alerts and monospace font for tokens. Key file: client/src/components/sales-channels-manager.tsx.

## System Architecture

The application features a monorepo structure with a React 18 frontend (Vite, TypeScript, Shadcn/ui, TanStack Query, Wouter, React Hook Form with Zod) and an Express.js backend (TypeScript). PostgreSQL with Drizzle ORM is used for data persistence.

### UI/UX Decisions
- Consistent professional styling with gradient headers, animated badges, and modern design patterns inspired by Linear, Notion, and Stripe.
- Horizontal top tabs for navigation and mobile-first responsive design.
- User-selectable dark/light mode with persistence.
- Professional landing page redesign with a B2B SaaS aesthetic.
- Organized grouped/collapsible navigation for improved user experience and feature discoverability.
- Semantic design tokens, enhanced core components (Layout, Navigation sidebar, Header, Card), and utility classes for visual effects (shadows, gradients, hover-effects, transitions) ensuring a polished, professional appearance.

### Technical Implementations
- **Monorepo Structure**: Separated client-side and server-side codebases.
- **Multi-tenancy**: Robust system with data isolation, configurable roles & permissions.
- **Offline Capabilities**: PWA with service worker, IndexedDB, background sync, and offline CRUD.
- **AI Integration**: White-labeled "Argilette AI" services for SEO insights, campaign generation, autonomous operations, and template generation, using a multi-provider failover system.
- **Authentication**: Secure login/signup with bcrypt password hashing and email verification.
- **Translation System**: Page-wide automatic translation with RTL support and caching.
- **SEO Optimization**: Comprehensive meta tags, Open Graph, Twitter Cards, structured data, sitemap, robots.txt, Google Search Console verification, and SEO-friendly routing.
- **Lander Redirect System**: Bulletproof 6-layer redirect system for `/lander` to `/landing`.
- **Database Schema**: Core CRM tables (contacts, leads, deals, tasks, accounts) with tenant isolation and relationships.
- **AI Campaign Studio**: Backend for automated ad/email generation, tenant-isolated content, usage tracking, and REST API.
- **Sales Channels**: Multi-platform integration for publishing AI-generated content to social/business platforms.
- **ARGILETTE SEO Platform**: Integrated Ubersuggest clone with keyword research, site audits, backlinks, rank tracking, competitor analysis, content intelligence, and local SEO, built on a multi-tenant PostgreSQL architecture with AI insights.
- **Multi-Platform Search Optimization**: System for tracking brand visibility and sentiment across AI platforms (e.g., ChatGPT, Gemini), social search (e.g., TikTok, Instagram), and traditional SEO.
- **Link Building System**: Complete link building workflow with 4-tab interface (Opportunities, Campaigns, Outreach, Link Monitor). Features AI-powered opportunity discovery, competitor backlink analysis, broken link detection, automated outreach campaign management with AI-generated personalized emails (Argilette AI), relationship tracking, and link health monitoring. Integrates with DataForSEO API for real backlink data. Smart project selection system allows users to switch between multiple websites. Workflow: User creates project with website domain → System analyzes backlink profile → Discovers opportunities (competitor backlinks, broken links, guest posts) → User creates outreach campaigns with AI templates → Tracks progress and link acquisition → Monitors link health and impact.
- **CRM Core**: CRUD for contacts, leads, deals, tasks, accounts.
- **Marketing**: Simple Messaging (email/SMS), landing page builder, SEO management, reputation management, AI Campaign Studio, Multi-platform Search Optimization, Sales Channels integration.
- **E-commerce**: Full store builder with product creation, management, AI recommendations, inventory tracking, and global currency support (54 African currencies).
- **Financial Management**: Multi-currency bookkeeping, invoicing, bank feed synchronization, automated tax calculation, and financial reporting.
- **HR & Project Management**: Employee management, advanced project management (Gantt charts), and document management.
- **Platform Capabilities**: Comprehensive settings, multi-language support, adaptive signup flow, subscription management with tiered AI activation, and a Super Admin Dashboard with user registration tracking.
- **Code Quality**: Resolved all TypeScript errors and removed duplicate type exports, ensuring 0 LSP diagnostics.

## External Dependencies

- **Database**: PostgreSQL (Drizzle ORM), Neon Database.
- **AI Services**: Argilette AI (white-labeled Replit AI Integrations with OpenAI GPT-4o), Anthropic Claude Sonnet 4, Google Gemini AI, You.com AI, QWEN AI.
- **Email/SMS**: IONOS SMTP, Twilio.
- **Authentication**: JWT tokens, bcrypt.
- **UI/Component Libraries**: Shadcn/ui, Radix UI, Tailwind CSS, TanStack Query, Wouter, React Hook Form, Zod, dnd-kit.
- **Maps/Translate**: Google Maps API, Google Translate API.
- **Other Integrations**: Zapier, Shopify, Shopware, Google Analytics 4, Google Ads, Meta Pixel, LinkedIn Insight Tag, TikTok, Facebook Business, Instagram Business, LinkedIn Company, Twitter/X Business, Pinterest Business, Snapchat Business.
- **Security Tools**: Helmet.js.
- **Payment Gateways**: Stripe, Visa.
```