# NODE CRM

## Overview
NODE CRM is a comprehensive customer relationship management platform with advanced AI-powered capabilities designed for global markets. It is built as a full-stack React/Express application with PostgreSQL for data persistence. Key capabilities include real-time sentiment analysis, AI campaign generation, multi-cultural optimization for 195+ countries, and advanced financial management. The platform aims to be the world's first Emotional Intelligence CRM, offering autonomous AI operations and competitive pricing.

## User Preferences
Preferred communication style: Simple, everyday language.
CRM Name: NODE CRM
Email Marketing: IONOS SMTP configured for professional bulk email system (October 2025)
- SMTP Configuration: Complete with host, port, credentials, and from address
- Registration/Confirmation Emails: Configured via SMTP_FROM_EMAIL secret
- Marketing Emails: Use customizable professional addresses via SMTP
- Previous SendGrid integration removed - now using IONOS SMTP exclusively
Anti-spam optimization: Personalization, batch sending, compliance features enabled
Branding: Argilette NODE CRM logos integrated across platform (August 2025) - includes colored and transparent variants with infinity symbol design
Offline Capabilities: Comprehensive offline functionality implemented platform-wide for tenants without consistent internet access (August 2025)
Platform Owner Privileges: Restored unlimited access for platform owner (abel@argilette.com) with super admin rights, no subscription limits, and full platform oversight capabilities (August 2025)
Login Page: Clean NODE CRM branding with credentials-only interface, no role indicators or quick login buttons - access levels determined purely by email credentials (August 2025)
Settings Backup: Fully functional backup system with browser save dialog popup (August 2025) - includes backup.html standalone solution for guaranteed reliability, comprehensive JSON export with platform data, settings, and metadata
Security: Enterprise-grade security hardening COMPLETED (August 2025) - PRODUCTION READY with 0 vulnerabilities, all 37 critical/high severity vulnerabilities resolved, comprehensive security headers implemented, input validation and sanitization active, multi-tier rate limiting deployed, audit logging enabled, secure file processing with safe xlsx alternatives, CRITICAL authentication vulnerability patched (bcrypt password hashing implemented, removed insecure demo login bypass), clean production environment confirmed
Translation System: Comprehensive page-wide automatic translation implemented (August 2025) - PageTranslator component automatically translates all page content when language changes, TranslatedText component for individual elements, bulk translation API integration, intelligent text detection excluding code/inputs, RTL language support, translation caching
SEO Optimization: Complete SEO implementation for launch readiness (August 2025) - comprehensive meta tags, Open Graph and Twitter Card integration, structured data (JSON-LD), sitemap.xml, robots.txt, Google Search Console verification, optimized page titles and descriptions, proper cache headers, SEO-friendly server routing
E-commerce Currency System: Comprehensive global currency support (August 2025) - 54 African currencies across all regions (North, West, East, Central, Southern Africa), complete with flag indicators and regional organization, covering every African country including CFA Franc zones, island nations, and emerging economies
Super Admin Dashboard: Complete user registration tracking system implemented (August 2025) - comprehensive registration analytics, user activity monitoring, subscription plan distribution tracking, registration source analysis, detailed user profiles with verification status and login history
Deployment Redirect Fix: PERMANENTLY FIXED /lander redirect issue (September 2025) - implemented enhanced permanent redirect from /lander to /landing with trailing slash support, removed conflicting static files, updated routing to handle domain-level redirects correctly at server level with Express 301 redirects
Code Quality: Major cleanup completed (August 2025) - removed duplicate functions causing TypeScript errors, created clean new landing page component (simple-landing-new.tsx), eliminated all code duplication issues
Traffic & Conversion Tracking: Comprehensive B2B acquisition system implemented (August 2025) - advanced Google Analytics 4 & Google Ads integration, Meta Pixel for business decision-makers, LinkedIn Insight Tag for professional targeting, intelligent business profile detection, CRM need level assessment, qualified lead scoring, enhanced signup form tracking with business context, conversion value optimization for different package tiers, real-time attribution tracking with UTM parameters
Security Services Removal: Removed all security-related pricing plans and services from the platform (August 2025) - NODE CRM now focuses exclusively on customer relationship management without offering security monitoring or threat detection services
Page Refresh Issue Fix: Fixed persistent page refresh requirement (September 2025) - implemented network-first service worker strategy, added proper cache control headers to prevent stale content serving, reduced aggressive caching that was causing navigation issues
Lander Redirect Issue: PERMANENT FIX IMPLEMENTED (September 2025) - BULLETPROOF 6-LAYER REDIRECT SYSTEM: 1) Server-side Express middleware redirects /lander to / with 301 status (CRITICAL - never modify), 2) Client-side index.html immediate redirect, 3) Static fallback public/lander/index.html, 4) JavaScript protection via lander-blocker.js, 5) _redirects file for platform compatibility, 6) Health check endpoint /api/lander-health for monitoring. System includes anti-cache headers, multiple redirect methods, and comprehensive logging. PROTECTED CODE: Server redirect marked as CRITICAL in routes.ts with warning comments to prevent accidental removal
Navigation System: Organized grouped/collapsible navigation (September 2025) - replaced long flat tab lists with categorized navigation groups (Core CRM, Sales & Marketing, Operations, Intelligence, Platform) with expand/collapse functionality, improved UX for better feature discoverability, mobile-optimized responsive design
AI Campaign Studio: Complete backend infrastructure (September 2025) - Multi-provider AI failover system (you.com as primary, Anthropic, OpenAI, Google, Qwen), automated ad generation from website/product information, personalized email campaign generation from contact data, tenant-isolated content storage, usage tracking with cost estimation, comprehensive REST API endpoints (/api/ai-campaigns/generate-ad, /api/ai-campaigns/generate-emails, full CRUD for content management), enterprise-grade security with tenant validation and cross-tenant access prevention, integration-ready for Sales Channels and Simple Messaging modules
Sales Channels: Multi-platform integration system (September 2025) - TikTok, Facebook Business, Instagram Business, LinkedIn Company, Twitter/X Business, Pinterest Business, Snapchat Business connections, database persistence with proper tenant isolation, connection status tracking, secure credential management, API-ready for publishing AI-generated content to connected platforms

## System Architecture
The application uses a monorepo structure with distinct client and server sides.

- **Frontend**: React 18 with TypeScript (Vite), Shadcn/ui (Radix UI, Tailwind CSS), TanStack Query for state, Wouter for routing, React Hook Form with Zod for forms.
- **Backend**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **Monorepo Structure**: Separation of client-side and server-side code.
- **Data Flow**: Frontend communicates with Express backend via REST APIs, data persisted via Drizzle ORM. Client-side sentiment analysis results are stored with contact records.
- **UI/UX Decisions**: Consistent professional styling with gradient headers, animated badges, and modern design patterns across all modules. Vertical side tabs are used for unified navigation within CRM modules. Mobile-first responsive design is implemented.
- **Core Features**:
    - **CRM Core**: Comprehensive CRUD operations for contacts, leads, deals, tasks, accounts.
    - **AI & Intelligence**: AI-powered sentiment analysis, campaign generation, emotional intelligence hub (customer profiling, voice analysis, real-time coaching), AI autonomous operations (lead scoring, workflow optimization), AI-powered template generator.
    - **Marketing**: Simple Messaging (email/SMS sending), landing page builder (drag-and-drop, AI recommendations, templates), SEO management, reputation management (multi-platform monitoring, predictive scores).
    - **E-commerce**: Full store builder with product creation, store management, unique web link generation (subdomains), AI recommendations, layout builder, inventory heatmap.
    - **Financial Management**: Multi-currency bookkeeping, invoice generation, bank feed synchronization, automated tax calculation, financial reporting.
    - **HR & Project Management**: Employee management, advanced project management (Gantt charts), document management.
    - **Security**: Multi-tenant access control, user data isolation, platform owner dashboard, comprehensive security features (encryption, rate limiting, audit logging).
    - **Platform Capabilities**: Multi-tenant system with company isolation, roles & permissions system (11 categories, 75+ permissions), comprehensive settings, multi-language support (20+ languages), adaptive signup flow, subscription management with tiered AI activation.
    - **Collaboration**: Real-time team collaboration heat map, video conferencing integration.
    - **Offline Capabilities**: Progressive Web App (PWA) with service worker, IndexedDB offline storage, tenant-isolated offline databases, offline-aware data layer, background sync, offline CRUD operations, PWA installation support, offline settings management.
    - **Platform Owner System**: Restored super admin privileges for platform owner with unlimited subscription access, full tenant oversight, subscription management controls, security administration, and system-wide administrative capabilities.

## External Dependencies
- **Database**: PostgreSQL (configured with Drizzle ORM).
- **Cloud Database**: Neon Database (Serverless PostgreSQL driver).
- **AI Services**: OpenAI (GPT-4o), Anthropic (Claude Sonnet 4), Google Gemini AI.
- **Email/SMS**: SendGrid (for email confirmation and marketing), Twilio (for SMS).
- **Authentication**: JWT tokens.
- **UI/Component Libraries**: Shadcn/ui, Radix UI, Tailwind CSS, TanStack Query, Wouter, React Hook Form, Zod, dnd-kit.
- **Maps/Translate**: Google Maps API, Google Translate API.
- **Build Tools**: Vite, esbuild.
- **Other Integrations (examples)**: Zapier, Shopify, Shopware.
- **Security Tools**: Helmet.js, bcrypt.
- **Payment Gateways**: Stripe, Visa (for tenant configurations).
```