# NODE CRM

## Overview
NODE CRM is an AI-powered, full-stack customer relationship management platform designed for global markets. It integrates real-time sentiment analysis, AI campaign generation, multi-cultural optimization, advanced financial management, and e-commerce functionalities. The platform aims for autonomous AI operations, competitive pricing, and robust data security, providing a comprehensive solution for businesses worldwide. Its business vision is to provide an all-encompassing, secure, and globally adaptable CRM solution that leverages AI for operational efficiency and market responsiveness. The platform uses the domain ARGILETTE.org.

## User Preferences
Preferred communication style: Simple, everyday language.
Pricing Model: Monthly subscription with AI Employee automation included - Starter $69.99/month (1,000 AI operations/month), Professional $179.99/month (5,000 AI operations/month), Business $349.99/month (15,000 AI operations/month), Enterprise $899.99/month (unlimited AI operations). All plans include CRM + SEO + E-commerce + Link Building + 11-platform tracking + 6 AI Employees (Social Author, SDR Outreach, Reply Handler, Closer, Chat Bot, Lead Scorer). White-label branding options (Basic, Full, Complete Ownership) available as custom-priced add-ons requiring sales contact for quotes. Pricing designed to be sustainable for ongoing AI/API costs (Argilette AI, OpenAI GPT-5, DataForSEO) while remaining 90% cheaper than buying Semrush + HubSpot + Drift + Copy.ai separately ($3,500+ vs. $349.99).
Platform Owner Privileges: Platform owner (abel@argilette.com) has unlimited unrestricted access to ALL features forever with zero subscription limits. Navigation component bypasses ALL feature locks for platform owners, granting full access to White Label Settings, Testing & Deployment, Bug Resolution, Feature Toggles, and all enterprise features (A/B Testing, Client Portal, Unified Analytics, Resource Management) without any restrictions. Super admin rights include full platform oversight capabilities. SECURE PASSWORD: ArgiletteSecure2024! (bcrypt hash stored in database). Database contains ONLY 1 user account - the platform owner with full privileges.
Login Page: Clean NODE CRM branding with credentials-only interface, no role indicators or quick login buttons - access levels determined purely by email credentials
Security Hardening: Comprehensive security audit completed November 2025 - removed all emergency bypass code (dns-bypass.html, autologin.html, debug-login.html, emergency-login.html, quick-login.html), debug utilities (TabDebugger, TabDiagnostic, redirect-monitor), and backup files (languages-backup.ts, schema.backup.ts). Enhanced authentication with JWT_SECRET enforcement (requires SESSION_SECRET environment variable, fails fast if missing), eliminated sensitive console.log statements exposing user data/tokens (~513 removed), preserved only error logging. Platform uses secure bcrypt password hashing with 12 rounds. Database contains ONLY 1 unique platform owner account. Account Protection: Platform owner (abel@argilette.com) is the unique super admin with full platform privileges - fully protected from deactivation and role changes via triple-layer security: (1) Backend API validation with strict type checking, (2) Database layer enforcement blocking unauthorized modifications, (3) Frontend UI controls disabled. Protection uses email-based immutable identifier and strict !== undefined checks to prevent falsy value exploits. Production-ready with zero backdoors.
Settings Backup: Fully functional backup system with browser save dialog popup - includes backup.html standalone solution for guaranteed reliability, comprehensive JSON export with platform data, settings, and metadata
Contact Import Enhancement: Expanded bulk import to capture complete contact data - added LinkedIn profile URL, location, bio, company website, and number of employees fields to contacts schema with full CSV/Excel import support and intelligent column mapping
E-commerce Currency System: Comprehensive global currency support - 54 African currencies across all regions (North, West, East, Central, Southern Africa), complete with flag indicators and regional organization, covering every African country including CFA Franc zones, island nations, and emerging economies
Theme Control: User-selectable dark/light mode - ThemeToggle button added to main header (between notifications and settings icons) allowing users to choose Light, Dark, or System theme preferences. Default theme changed from automatic system-based switching to Light mode for explicit user control. Theme preference persists in localStorage.
Feature Removal: Completely removed Sentiment Analysis feature - Deleted all frontend components (client/src/components/sentiment-analysis.tsx, client/src/pages/sentiment.tsx), removed navigation menu entries from AI & Intelligence section, removed routes from App.tsx, and cleaned up all UI references. The AI & Intelligence section now focuses on AI Campaign Studio, Cloe AI Agent, AI Automation, Unified Communications, and Forms & Surveys.
Mock Data Removal (November 2025): Comprehensive cleanup of ALL hardcoded mock/test data across the entire platform - removed 100+ instances of fake statistics, demo arrays, and placeholder content from 15+ files. All pages now use real API data via TanStack Query hooks. Cleaned pages include: contacts.tsx (removed hardcoded 530/487/43 statistics), dashboard.tsx, crm-dashboard.tsx, e-commerce order-management.tsx, advanced-project-management.tsx, forms-surveys.tsx, team-collaboration.tsx, voice-emotion-analytics.tsx, omnichannel-hub.tsx, reputation-management.tsx, and collaboration-indicators.tsx. All pages now show accurate empty states (0) when database is empty and real calculated metrics when data exists. Lead templates kept as legitimate feature functionality (not mock data).

## System Architecture

The application features a monorepo structure with a React 18 frontend (Vite, TypeScript, Shadcn/ui, TanStack Query, Wouter, React Hook Form with Zod) and an Express.js backend (TypeScript). PostgreSQL with Drizzle ORM is used for data persistence.

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
- **RBAC System**: Enterprise-grade Role-Based Access Control with 143 granular permissions across 37 functional modules. Five system roles (Platform Owner, Admin, Manager, User, Viewer) with wildcard "*" support for platform owner. Platform owner (abel@argilette.com) has unrestricted access via email-based checking. Frontend usePermissions hook consumes real-time permission data.
- **Offline Capabilities**: PWA with service worker, IndexedDB, background sync, and offline CRUD.
- **AI Integration**: White-labeled "Argilette AI" services for SEO insights, campaign generation, autonomous operations, and template generation, using a multi-provider failover system. All AI services use Replit AI Integrations with OpenAI GPT-5 fully white-labeled as "Argilette AI".
- **Authentication**: Secure login/signup with bcrypt password hashing and email verification.
- **Translation System**: Page-wide automatic translation with RTL support and caching.
- **SEO Optimization**: Comprehensive meta tags, Open Graph, Twitter Cards, structured data, sitemap, robots.txt, Google Search Console verification, and SEO-friendly routing; fixed critical domain/canonical mismatch and updated branding.
- **Lander Redirect System**: Bulletproof 6-layer redirect system for `/lander` to `/landing`.
- **Database Schema**: Core CRM tables (contacts, leads, deals, tasks, accounts) with tenant isolation and relationships. All UUID columns use VARCHAR type with gen_random_uuid() defaults to match existing database structure.
- **AI Campaign Studio**: Backend for automated ad/email generation, tenant-isolated content, usage tracking, and REST API.
- **Sales Channels**: Multi-platform integration for publishing AI-generated content to social/business platforms, with improved UX for connection flow.
- **ARGILETTE SEO Platform**: Integrated Ubersuggest clone with keyword research, site audits, backlinks, rank tracking, competitor analysis, content intelligence, and local SEO, built on a multi-tenant PostgreSQL architecture with AI insights.
- **Multi-Platform Search Optimization**: System for tracking brand visibility and sentiment across AI platforms, social search, and traditional SEO.
- **Link Building System**: Complete link building workflow with AI-powered opportunity discovery, competitor backlink analysis, broken link detection, automated outreach, relationship tracking, and link health monitoring.
- **AI Funnel Builder**: Comprehensive AI-powered sales funnel generation system that transforms user offers into complete marketing funnels with one-click generation. Features include: 14-table database architecture; AI-powered generation of landing pages, multi-platform ad copy, email sequences, and automation workflows; website image extraction service; comprehensive funnel management with versioning, cloning, templates, and publishing; visual landing page editor; tabbed content display; strict tenant isolation; real-time generation feedback via Argilette AI; backend data transformation; TanStack Query integration; complete analytics tracking; industry-specific visual asset mapping; and support for A/B testing different funnel versions.
- **CRM Core**: CRUD for contacts, leads, deals, tasks, accounts.
- **Marketing**: Simple Messaging (email/SMS), landing page builder, SEO management, reputation management, AI Campaign Studio, AI Funnel Builder, Multi-platform Search Optimization, Sales Channels integration.
- **E-commerce**: Full store builder with product creation, management, AI recommendations, inventory tracking, and global currency support (54 African currencies).
- **Financial Management**: Multi-currency bookkeeping, invoicing, bank feed synchronization, automated tax calculation, and financial reporting.
- **HR & Project Management**: Employee management, advanced project management (Gantt charts), and document management.
- **Platform Capabilities**: Comprehensive settings, multi-language support, adaptive signup flow, subscription management with tiered AI activation, and a Super Admin Dashboard with user registration tracking.
- **Enterprise Features**:
    - **A/B Testing System**: Complete infrastructure with statistical significance calculations, real-time conversion tracking, and automated winner selection.
    - **Client Portal System**: Secure client collaboration platform with dual isolation security (tenant + clientAccountId), dedicated authentication middleware, and session-based authentication with JWT tokens. Email uniqueness enforced at database and application levels.
    - **Unified Analytics Dashboard**: Cross-functional analytics integrating CRM customer data, e-commerce behavior, and SEO performance in a single comprehensive view with tenant-scoped queries.
    - **Resource Management System**: Comprehensive workforce planning platform for team capacity planning, employee skills tracking, resource forecasting, and workload analytics, with tenant-isolated storage and authenticated API endpoints.
- **AI Employee System**: Multi-tenant autonomous AI agents for CRM operations powered by OpenAI GPT-5 via Replit AI Integrations. Agent roles include Social Media Author, SDR Outreach, Reply Handler, Closer, Chat Qualifier, and Lead Scorer. Features database schema extensions, dedicated API endpoints, and frontend components for management and display. Strict tenant isolation, privacy-safe logging, and JSON parsing safeguards are implemented.

## External Dependencies

- **Database**: PostgreSQL (Drizzle ORM), Neon Database.
- **AI Services**: Argilette AI (white-labeled Replit AI Integrations with OpenAI GPT-4o/GPT-5), Anthropic Claude Sonnet 4, Google Gemini AI, You.com AI, QWEN AI.
- **Email/SMS**: IONOS SMTP, Twilio.
- **Authentication**: JWT tokens, bcrypt.
- **UI/Component Libraries**: Shadcn/ui, Radix UI, Tailwind CSS, TanStack Query, Wouter, React Hook Form, Zod, dnd-kit.
- **Maps/Translate**: Google Maps API, Google Translate API.
- **Other Integrations**: Zapier, Shopify, Shopware, Google Analytics 4, Google Ads, Meta Pixel, LinkedIn Insight Tag, TikTok, Facebook Business, Instagram Business, LinkedIn Company, Twitter/X Business, Pinterest Business, Snapchat Business, DataForSEO.
- **Security Tools**: Helmet.js.
- **Payment Gateways**: Stripe, Visa.