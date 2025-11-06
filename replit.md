# NODE CRM

## Overview
NODE CRM is an AI-powered, full-stack customer relationship management platform designed for global markets. It integrates real-time sentiment analysis, AI campaign generation, multi-cultural optimization, advanced financial management, and e-commerce functionalities. The platform aims for autonomous AI operations, competitive pricing, and robust data security, providing a comprehensive solution for businesses worldwide. Its business vision is to provide an all-encompassing, secure, and globally adaptable CRM solution that leverages AI for operational efficiency and market responsiveness. The platform uses the domain ARGILETTE.org.

## User Preferences
Preferred communication style: Simple, everyday language.
Pricing Model: Monthly subscription structure with four tiers (Starter $49.99/month, Professional $149.99/month, Business $299.99/month, Enterprise $799.99/month). All white-label branding options (Basic, Full, Complete Ownership) available as custom-priced add-ons requiring sales contact for quotes. Platform includes CRM + SEO + E-commerce + Link Building + 11-platform tracking in all base plans. Pricing designed to be sustainable for ongoing AI/API costs (Argilette AI, DataForSEO) while remaining competitive vs. buying Semrush + HubSpot + Shopify separately.
Platform Owner Privileges: Restored unlimited access for platform owner (abel@argilette.com) with super admin rights, no subscription limits, and full platform oversight capabilities
Login Page: Clean NODE CRM branding with credentials-only interface, no role indicators or quick login buttons - access levels determined purely by email credentials
Settings Backup: Fully functional backup system with browser save dialog popup - includes backup.html standalone solution for guaranteed reliability, comprehensive JSON export with platform data, settings, and metadata
Contact Import Enhancement: Expanded bulk import to capture complete contact data - added LinkedIn profile URL, location, bio, company website, and number of employees fields to contacts schema with full CSV/Excel import support and intelligent column mapping
E-commerce Currency System: Comprehensive global currency support - 54 African currencies across all regions (North, West, East, Central, Southern Africa), complete with flag indicators and regional organization, covering every African country including CFA Franc zones, island nations, and emerging economies
Theme Control: User-selectable dark/light mode - ThemeToggle button added to main header (between notifications and settings icons) allowing users to choose Light, Dark, or System theme preferences. Default theme changed from automatic system-based switching to Light mode for explicit user control. Theme preference persists in localStorage.
Feature Removal: Completely removed Sentiment Analysis feature - Deleted all frontend components (client/src/components/sentiment-analysis.tsx, client/src/pages/sentiment.tsx), removed navigation menu entries from AI & Intelligence section, removed routes from App.tsx, and cleaned up all UI references. The AI & Intelligence section now focuses on AI Campaign Studio, Cloe AI Agent, AI Automation, Unified Communications, and Forms & Surveys.

## System Architecture

The application features a monorepo structure with a React 18 frontend (Vite, TypeScript, Shadcn/ui, TanStack Query, Wouter, React Hook Form with Zod) and an Express.js backend (TypeScript). PostgreSQL with Drizzle ORM is used for data persistence.

### Recent Fixes
- **Platform Owner Visual Indicator Fix (2025-11-06)**: Corrected platform owner detection across all frontend components. Fixed email check from `abel@argilette.org` to `abel@argilette.com` in Header, Navigation, Dashboard Redirect, and Protected Route components. Crown icon and "Platform Owner" badge now display correctly for super admin account, with automatic redirect to Super Admin Dashboard.
- **SEO Audit API Fix (2025-11-02)**: Fixed critical routing issue where SEO audit endpoints were mounted at `/api/argilette` but frontend was calling `/api/seo`. Added proper `/api/seo` mount point with authentication middleware while maintaining `/api/argilette` for backward compatibility.

### UI/UX Decisions
- Consistent professional styling with gradient headers, animated badges, and modern design patterns inspired by Linear, Notion, and Stripe.
- Horizontal top tabs for navigation and mobile-first responsive design.
- User-selectable dark/light mode with persistence.
- Professional landing page redesign with a B2B SaaS aesthetic.
- Organized grouped/collapsible navigation for improved user experience and feature discoverability.
- Semantic design tokens, enhanced core components, and utility classes for visual effects.

### Technical Implementations
- **Monorepo Structure**: Separated client-side and server-side codebases.
- **Multi-tenancy**: Robust system with data isolation, configurable roles & permissions.
- **Offline Capabilities**: PWA with service worker, IndexedDB, background sync, and offline CRUD.
- **AI Integration**: White-labeled "Argilette AI" services for SEO insights, campaign generation, autonomous operations, and template generation, using a multi-provider failover system. All AI services use Replit AI Integrations with OpenAI GPT-5 fully white-labeled as "Argilette AI".
- **Authentication**: Secure login/signup with bcrypt password hashing and email verification.
- **Translation System**: Page-wide automatic translation with RTL support and caching.
- **SEO Optimization**: Comprehensive meta tags, Open Graph, Twitter Cards, structured data, sitemap, robots.txt, Google Search Console verification, and SEO-friendly routing; fixed critical domain/canonical mismatch and updated branding.
- **Lander Redirect System**: Bulletproof 6-layer redirect system for `/lander` to `/landing`.
- **Database Schema**: Core CRM tables (contacts, leads, deals, tasks, accounts) with tenant isolation and relationships.
- **AI Campaign Studio**: Backend for automated ad/email generation, tenant-isolated content, usage tracking, and REST API.
- **Sales Channels**: Multi-platform integration for publishing AI-generated content to social/business platforms, with improved UX for connection flow.
- **ARGILETTE SEO Platform**: Integrated Ubersuggest clone with keyword research, site audits (including comprehensive website audit workflow), backlinks, rank tracking, competitor analysis, content intelligence, and local SEO, built on a multi-tenant PostgreSQL architecture with AI insights.
- **Multi-Platform Search Optimization**: System for tracking brand visibility and sentiment across AI platforms, social search, and traditional SEO.
- **Link Building System**: Complete link building workflow with AI-powered opportunity discovery, competitor backlink analysis, broken link detection, automated outreach, relationship tracking, and link health monitoring, integrating with DataForSEO.
- **CRM Core**: CRUD for contacts, leads, deals, tasks, accounts.
- **Marketing**: Simple Messaging (email/SMS), landing page builder, SEO management, reputation management, AI Campaign Studio, Multi-platform Search Optimization, Sales Channels integration.
- **E-commerce**: Full store builder with product creation, management, AI recommendations, inventory tracking, and global currency support (54 African currencies).
- **Financial Management**: Multi-currency bookkeeping, invoicing, bank feed synchronization, automated tax calculation, and financial reporting.
- **HR & Project Management**: Employee management, advanced project management (Gantt charts), and document management.
- **Platform Capabilities**: Comprehensive settings, multi-language support, adaptive signup flow, subscription management with tiered AI activation, and a Super Admin Dashboard with user registration tracking.
- **Code Quality**: Resolved all TypeScript errors and removed duplicate type exports. Fixed critical runtime errors across 12 major pages by handling null query data explicitly. Applied systematic null-safe pattern: `const { data: queryData } = useQuery(); const safeData = queryData || [];` to prevent "Cannot read properties of null" errors during TanStack Query initialization. Fixed pages: Dashboard, User Dashboard, Accounts, Deals, Leads, Tasks, Tickets, Employees, Invoices, Inventory Management, AI Campaign Studio, SEO Audit. This eliminates the "flash of error" issue where pages showed errors before refreshing.

## External Dependencies

- **Database**: PostgreSQL (Drizzle ORM), Neon Database.
- **AI Services**: Argilette AI (white-labeled Replit AI Integrations with OpenAI GPT-4o/GPT-5), Anthropic Claude Sonnet 4, Google Gemini AI, You.com AI, QWEN AI.
- **Email/SMS**: IONOS SMTP, Twilio.
- **Authentication**: JWT tokens, bcrypt.
- **UI/Component Libraries**: Shadcn/ui, Radix UI, Tailwind CSS, TanStack Query, Wouter, React Hook Form, Zod, dnd-kit.
- **Maps/Translate**: Google Maps API, Google Translate API.
- **Other Integrations**: Zapier, Shopify, Shopware, Google Analytics 4, Google Ads, Meta Pixel, LinkedIn Insight Tag, TikTok, Facebook Business, Instagram Business, LinkedIn Company, Twitter/X Business, Pinterest Business, Snapchat Business.
- **Security Tools**: Helmet.js.
- **Payment Gateways**: Stripe, Visa.