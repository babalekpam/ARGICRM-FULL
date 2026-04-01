# ARGILETTE CRM v2.0

## Overview
ARGILETTE CRM v2.0 is a complete rebuild — a fully integrated AI-powered B2B intelligence and CRM platform. The system combines autonomous AI agents, real-time lead intelligence, SEO tools, e-commerce, financial management, and a self-healing code system. Uploaded and replaced April 2026. Operating under the domain ARGILETTE.org.

## User Preferences
Preferred communication style: Simple, everyday language.
Pricing Model: Monthly subscription with AI Employee automation included - Starter $69.99/month (1,000 AI operations/month), Professional $179.99/month (5,000 AI operations/month), Business $349.99/month (15,000 AI operations/month), Enterprise $899.99/month (unlimited AI operations). All plans include CRM + SEO + E-commerce + Link Building + 11-platform tracking + 6 AI Employees (Social Author, SDR Outreach, Reply Handler, Closer, Chat Bot, Lead Scorer). White-label branding options (Basic, Full, Complete Ownership) available as custom-priced add-ons requiring sales contact for quotes. Pricing designed to be sustainable for ongoing AI/API costs (Argilette AI, OpenAI GPT-5, DataForSEO) while remaining 90% cheaper than buying Semrush + HubSpot + Drift + Copy.ai separately ($3,500+ vs. $349.99).
Platform Owner Privileges: Platform owner (abel@argilette.com) has unlimited unrestricted access to ALL features forever with zero subscription limits. Navigation component bypasses ALL feature locks for platform owners, granting full access to White Label Settings, Testing & Deployment, Bug Resolution, Feature Toggles, and all enterprise features (A/B Testing, Client Portal, Unified Analytics, Resource Management) without any restrictions. Super admin rights include full platform oversight capabilities. SECURE PASSWORD: ArgiletteSecure2024! (bcrypt hash stored in database). Database contains ONLY 1 user account - the platform owner with full privileges.
Login Page: Clean NODE CRM branding with credentials-only interface, no role indicators or quick login buttons - access levels determined purely by email credentials
Security Hardening: Comprehensive security audit completed November 2025 - removed all emergency bypass code, debug utilities, and backup files. Enhanced authentication with JWT_SECRET enforcement (requires SESSION_SECRET environment variable, fails fast if missing), eliminated sensitive console.log statements exposing user data/tokens, preserved only error logging. Platform uses secure bcrypt password hashing with 12 rounds. Database contains ONLY 1 unique platform owner account. Account Protection: Platform owner (abel@argilette.com) is the unique super admin with full platform privileges - fully protected from deactivation and role changes via triple-layer security: (1) Backend API validation with strict type checking, (2) Database layer enforcement blocking unauthorized modifications, (3) Frontend UI controls disabled. Protection uses email-based immutable identifier and strict !== undefined checks to prevent falsy value exploits. Production-ready with zero backdoors.
Settings Backup: Fully functional backup system with browser save dialog popup - includes backup.html standalone solution for guaranteed reliability, comprehensive JSON export with platform data, settings, and metadata
Contact Import Enhancement: Expanded bulk import to capture complete contact data - added LinkedIn profile URL, location, bio, company website, and number of employees fields to contacts schema with full CSV/Excel import support and intelligent column mapping
E-commerce Currency System: Comprehensive global currency support - 54 African currencies across all regions (North, West, East, Central, Southern Africa), complete with flag indicators and regional organization, covering every African country including CFA Franc zones, island nations, and emerging economies
Theme Control: User-selectable dark/light mode - ThemeToggle button added to main header (between notifications and settings icons) allowing users to choose Light, Dark, or System theme preferences. Default theme changed from automatic system-based switching to Light mode for explicit user control. Theme preference persists in localStorage.
Feature Removal: Completely removed Sentiment Analysis feature - Deleted all frontend components, removed navigation menu entries from AI & Intelligence section, removed routes from App.tsx, and cleaned up all UI references. The AI & Intelligence section now focuses on AI Campaign Studio, Cloe AI Agent, AI Automation, Unified Communications, and Forms & Surveys.
Mock Data Removal (November 2025): Comprehensive cleanup of ALL hardcoded mock/test data across the entire platform - removed 100+ instances of fake statistics, demo arrays, and placeholder content from 15+ files. All pages now use real API data via TanStack Query hooks. Cleaned pages include: contacts.tsx, dashboard.tsx, crm-dashboard.tsx, e-commerce order-management.tsx, advanced-project-management.tsx, forms-surveys.tsx, team-collaboration.tsx, voice-emotion-analytics.tsx, omnichannel-hub.tsx, reputation-management.tsx, and collaboration-indicators.tsx. All pages now show accurate empty states (0) when database is empty and real calculated metrics when data exists. Lead templates kept as legitimate feature functionality (not mock data).

## System Architecture

The application uses a monorepo structure with a React 18 frontend (Vite, TypeScript, Shadcn/ui, TanStack Query, Wouter, React Hook Form with Zod) and an Express.js backend (TypeScript). PostgreSQL with Drizzle ORM is used for data persistence.

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
- **RBAC System**: Enterprise-grade Role-Based Access Control with 143 granular permissions across 37 functional modules.
- **Offline Capabilities**: PWA with service worker, IndexedDB, background sync, and offline CRUD.
- **AI Integration**: White-labeled "Argilette AI" services for SEO insights, campaign generation, autonomous operations, and template generation, using a multi-provider failover system and Replit AI Integrations with OpenAI GPT-5.
- **Authentication**: Secure login/signup with bcrypt password hashing and email verification.
- **Translation System**: Page-wide automatic translation with RTL support and caching.
- **SEO Optimization**: Comprehensive meta tags, Open Graph, Twitter Cards, structured data, sitemap, robots.txt, Google Search Console verification, and SEO-friendly routing.
- **Lander Redirect System**: Bulletproof 6-layer redirect system for `/lander` to `/landing`.
- **Database Schema**: Core CRM tables (contacts, leads, deals, tasks, accounts) with tenant isolation and relationships, using UUIDs for columns.
- **AI Campaign Studio**: Backend for automated ad/email generation, tenant-isolated content, usage tracking, and REST API.
- **Sales Channels**: Multi-platform integration for publishing AI-generated content.
- **ARGILETTE SEO Platform**: Integrated Ubersuggest clone with keyword research, site audits, backlinks, rank tracking, competitor analysis, content intelligence, and local SEO, built on a multi-tenant PostgreSQL architecture with AI insights.
- **Multi-Platform Search Optimization**: System for tracking brand visibility and sentiment across AI platforms, social search, and traditional SEO.
- **Link Building System**: Complete link building workflow with AI-powered opportunity discovery, competitor backlink analysis, broken link detection, automated outreach, relationship tracking, and link health monitoring.
- **AI Funnel Builder**: Comprehensive AI-powered sales funnel generation system that transforms user offers into complete marketing funnels with one-click generation, including landing pages, ad copy, email sequences, and automation workflows.
- **CRM Core**: CRUD for contacts, leads, deals, tasks, accounts.
- **Marketing**: Simple Messaging (email/SMS), landing page builder, SEO management, reputation management, AI Campaign Studio, AI Funnel Builder, Multi-platform Search Optimization, Sales Channels integration.
- **E-commerce**: Full store builder with product creation, management, AI recommendations, inventory tracking, and global currency support (54 African currencies).
- **Financial Management**: Multi-currency bookkeeping, invoicing, bank feed synchronization, automated tax calculation, and financial reporting.
- **HR & Project Management**: Employee management, advanced project management (Gantt charts), and document management.
- **Platform Capabilities**: Comprehensive settings, multi-language support, adaptive signup flow, subscription management with tiered AI activation, and a Super Admin Dashboard with user registration tracking.
- **Enterprise Features**: A/B Testing System, Client Portal System, Unified Analytics Dashboard, Resource Management System.
- **AI Employee System**: Multi-tenant autonomous AI agents for CRM operations powered by OpenAI GPT-5 via Replit AI Integrations (Social Media Author, SDR Outreach, Reply Handler, Closer, Chat Qualifier, Lead Scorer).
- **Apollo.io Feature Parity**: Comprehensive sales engagement platform with 8 major modules: Email Sequence Builder, B2B Prospect Database, Contact Data Enrichment, Email Finder & Validation, Buyer Intent Signals, Built-in Dialer, LinkedIn Integration, Conversation Intelligence. Includes Chrome Extension Backend and 15 new database tables.
- **ZoomInfo Feature Parity**: B2B Intelligence platform with 6 specialized modules for competitive data intelligence: Website Visitor Identification, Technographics, Org Charts, Company News & Alerts, Data Health Dashboard, Account Scoring.

## External Dependencies

- **Database**: PostgreSQL (Drizzle ORM), Neon Database.
- **AI Services**: Argilette AI (Replit AI Integrations with OpenAI GPT-4o/GPT-5), Anthropic Claude Sonnet 4, Google Gemini AI, You.com AI, QWEN AI.
- **Email/SMS**: IONOS SMTP, Twilio.
- **Authentication**: JWT tokens, bcrypt.
- **UI/Component Libraries**: Shadcn/ui, Radix UI, Tailwind CSS, TanStack Query, Wouter, React Hook Form, Zod, dnd-kit.
- **Maps/Translate**: Google Maps API, Google Translate API.
- **Other Integrations**: Zapier, Shopify, Shopware, Google Analytics 4, Google Ads, Meta Pixel, LinkedIn Insight Tag, TikTok, Facebook Business, Instagram Business, LinkedIn Company, Twitter/X Business, Pinterest Business, Snapchat Business, DataForSEO.
- **Security Tools**: Helmet.js.
- **Payment Gateways**: Stripe, Visa.