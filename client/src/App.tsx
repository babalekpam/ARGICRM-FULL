import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Switch, Route, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WhiteLabelProvider } from "@/components/white-label-provider";
import { ThemeProvider } from "@/components/theme-provider";
import ErrorBoundary from "@/components/error-boundary";
import { initializeAuth } from "@/lib/auth-init";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PageTranslator } from "@/components/PageTranslator";
import { AuthProvider } from "@/hooks/useAuth";
import TrackingScripts from "@/components/tracking-scripts";
import { PerformanceProvider } from "@/components/PerformanceProvider";
import React, { lazy, Suspense, useEffect } from 'react';

// OPTIMIZED: Core pages loaded immediately - no lazy loading for nav items
import SimpleLanding from "@/pages/landing";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import HelpCenterPage from "@/pages/help-center";
import Dashboard from "@/pages/dashboard";
import DashboardRedirect from "@/components/dashboard-redirect";
import UserDashboard from "@/pages/user-dashboard";
import ContactsPage from "@/pages/contacts";
import AccountsPage from "@/pages/accounts";
import LeadsPage from "@/pages/leads";
import DealsPage from "@/pages/deals";
import TasksPage from "@/pages/tasks";
import CampaignsPage from "@/pages/campaigns";
import SchedulingPage from "@/pages/scheduling";
import SimpleMessagingPage from "@/pages/simple-messaging";
import FunnelBuilderPage from "@/pages/funnel-builder";
import EcommerceDashboardPage from "@/pages/e-commerce-dashboard";
import StorePreview from "@/pages/store-preview";
import FeaturesPage from "@/pages/features";
import PricingPage from "@/pages/pricing";
import AboutPage from "@/pages/about";
import PrivacyPage from "@/pages/privacy";
import BlogPage from "@/pages/blog";
import TermsPage from "@/pages/terms";
import CrmForSmallBusinessPage from "@/pages/crm-for-small-business";
import EnterpriseCrmPage from "@/pages/enterprise-crm";
import AiPoweredCrmPage from "@/pages/ai-powered-crm";
import OverviewPage from "@/pages/overview";
import UnsubscribePage from "@/pages/unsubscribe";

// OPTIMIZED: Only truly optional pages are lazy loaded
const SettingsPage = lazy(() => import("@/pages/settings"));
const AnalyticsPage = lazy(() => import("@/pages/analytics"));
const AdvancedAnalyticsPage = lazy(() => import("@/pages/advanced-analytics"));
const UnifiedAnalyticsPage = lazy(() => import("@/pages/unified-analytics"));
const IntentSignalsPage = lazy(() => import("@/pages/intent-signals"));
const ConversationIntelligencePage = lazy(() => import("@/pages/conversation-intelligence"));
const AbTestingPage = lazy(() => import("@/pages/ab-testing"));
const AbTestingCreatePage = lazy(() => import("@/pages/ab-testing-create"));
const AbTestingDetailsPage = lazy(() => import("@/pages/ab-testing-details"));
const ReportsPage = lazy(() => import("@/pages/reports"));
const InvoicesPage = lazy(() => import("@/pages/invoices"));
const ProjectsPage = lazy(() => import("@/pages/projects"));
const TicketsPage = lazy(() => import("@/pages/tickets"));
const TeamCollaborationPage = lazy(() => import("@/pages/team-collaboration"));
const InventoryManagementPage = lazy(() => import("@/pages/inventory-management"));
const DocumentManagementPage = lazy(() => import("@/pages/document-management"));
const BookkeepingPage = lazy(() => import("@/pages/bookkeeping"));
const TaxSettingsPage = lazy(() => import("@/pages/tax-settings"));

// Team & Administration
const EmployeesPage = lazy(() => import("@/pages/employees"));
const RolesPage = lazy(() => import("@/pages/roles"));
const ResourceManagement = lazy(() => import("@/pages/resource-management"));
const UsersManagement = lazy(() => import("@/pages/users-management"));
const RolesManagement = lazy(() => import("@/pages/roles-management"));

// AI & Intelligence  
const AICampaignStudioPage = lazy(() => import("@/pages/ai-campaign-studio"));
const CloeAIAgentPage = lazy(() => import("@/pages/cloe-ai-agent"));
const AIAutonomousPage = lazy(() => import("@/pages/ai-autonomous-dashboard"));
const AIEmployeeDashboardPage = lazy(() => import("@/pages/ai-employee-dashboard"));
const UnifiedInboxPage = lazy(() => import("@/pages/unified-inbox"));
const FormsSurveysPage = lazy(() => import("@/pages/forms-surveys"));
const SalesChannelsPage = lazy(() => import("@/components/sales-channels-manager"));
const SequencesPage = lazy(() => import("@/pages/sequences"));
const LinkedinTasksPage = lazy(() => import("@/pages/linkedin-tasks"));
const DialerPage = lazy(() => import("@/pages/dialer"));
const ProspectExplorerPage = lazy(() => import("@/pages/prospect-explorer"));
const EmailFinderPage = lazy(() => import("@/pages/email-finder"));

// ARGILETTE SEO Platform - Full Ubersuggest Clone
const SeoAuditPage = lazy(() => import("@/pages/seo-audit"));
const SeoManagementPage = lazy(() => import("@/pages/seo-management"));
const BacklinksPage = lazy(() => import("@/pages/backlinks"));
const KeywordsPage = lazy(() => import("@/pages/keywords"));
const RankTrackingPage = lazy(() => import("@/pages/rank-tracking"));
const TechnicalAuditPage = lazy(() => import("@/pages/technical-audit"));
const CompetitorsPage = lazy(() => import("@/pages/competitors"));
const LocalSeoPage = lazy(() => import("@/pages/local-seo"));
const MultiPlatformSearchPage = lazy(() => import("@/pages/multi-platform-search"));
const LinkBuildingPage = lazy(() => import("@/pages/link-building"));

// Platform Administration
const IntegrityDashboardPage = lazy(() => import("@/pages/integrity-dashboard"));
const PerformanceDashboardPage = lazy(() => import("@/pages/performance-dashboard"));
const TestingDeploymentPage = lazy(() => import("@/pages/testing-deployment-dashboard"));
const BugResolutionPage = lazy(() => import("@/pages/bug-resolution-dashboard"));
const FeatureTogglesPage = lazy(() => import("@/pages/feature-toggles"));
const WhiteLabelSettingsPage = lazy(() => import("@/pages/white-label-settings"));
const TermsOfServicePage = lazy(() => import("@/pages/terms-of-service"));
const AccountSettingsPage = lazy(() => import("@/pages/account-settings"));

// Admin dashboard pages for platform owners
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const SuperAdminDashboard = lazy(() => import("@/pages/super-admin-dashboard"));

// Non-lazy imports for essential components
import ProtectedRoute from "@/components/protected-route";
import "./App.css";

// Client Portal imports
import ClientPortalLogin from "@/pages/client-portal-login";
import ClientPortalDashboard from "@/pages/client-portal-dashboard";
import ClientPortalProjects from "@/pages/client-portal-projects";
import ClientPortalDeliverables from "@/pages/client-portal-deliverables";
import ClientPortalInvoices from "@/pages/client-portal-invoices";
import ClientPortalMessages from "@/pages/client-portal-messages";
import ClientPortalLayout from "@/components/client-portal-layout";
import { ClientPortalProvider } from "@/contexts/client-portal-context";

// OPTIMIZED: Clean loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
  </div>
);

function App() {
  useEffect(() => {
    // OPTIMIZED: Simple initialization
    initializeAuth();
    
    // OPTIMIZED: Simplified service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .catch(err => console.log('SW registration failed:', err));
    }
  }, []);
  
  return (
    <ErrorBoundary>
      <PerformanceProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ThemeProvider defaultTheme="light" storageKey="argilette-theme">
              <LanguageProvider>
                <WhiteLabelProvider>
                  <AuthProvider>
                    <TrackingScripts />
                    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                      <Suspense fallback={<LoadingSpinner />}>
                        <Switch>
                        {/* Public Routes - IMPORTANT: "/" must be at the END to avoid matching all paths */}
                        <Route path="/landing">{() => <PageTranslator><SimpleLanding /></PageTranslator>}</Route>
                        <Route path="/login">{() => <PageTranslator><LoginPage /></PageTranslator>}</Route>
                        <Route path="/signup">{() => <PageTranslator><SignupPage /></PageTranslator>}</Route>
                          <Route path="/forgot-password">{() => <PageTranslator><ForgotPasswordPage /></PageTranslator>}</Route>
                          <Route path="/reset-password">{() => <PageTranslator><ResetPasswordPage /></PageTranslator>}</Route>
                          <Route path="/help-center">{() => <PageTranslator><HelpCenterPage /></PageTranslator>}</Route>
                          <Route path="/help">{() => <PageTranslator><HelpCenterPage /></PageTranslator>}</Route>
                          <Route path="/unsubscribe">{() => <UnsubscribePage />}</Route>
                          <Route path="/features">{() => <PageTranslator><FeaturesPage /></PageTranslator>}</Route>
                          <Route path="/pricing">{() => <PageTranslator><PricingPage /></PageTranslator>}</Route>
                          <Route path="/about">{() => <PageTranslator><AboutPage /></PageTranslator>}</Route>
                          <Route path="/privacy">{() => <PageTranslator><PrivacyPage /></PageTranslator>}</Route>
                          <Route path="/blog">{() => <PageTranslator><BlogPage /></PageTranslator>}</Route>
                          <Route path="/terms">{() => <PageTranslator><TermsPage /></PageTranslator>}</Route>
                          <Route path="/crm-for-small-business">{() => <PageTranslator><CrmForSmallBusinessPage /></PageTranslator>}</Route>
                          <Route path="/enterprise-crm">{() => <PageTranslator><EnterpriseCrmPage /></PageTranslator>}</Route>
                          <Route path="/ai-powered-crm">{() => <PageTranslator><AiPoweredCrmPage /></PageTranslator>}</Route>
                          <Route path="/overview">{() => <PageTranslator><OverviewPage /></PageTranslator>}</Route>
                          
                          {/* Protected Core Routes */}
                          <Route path="/dashboard">{() => (
                            <ProtectedRoute requiredPermission="dashboard.read">
                              <PageTranslator><DashboardRedirect /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/user-dashboard">{() => (
                            <ProtectedRoute requiredPermission="dashboard.read">
                              <PageTranslator><UserDashboard /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/contacts">{() => (
                            <ProtectedRoute requiredPermission="contacts.read">
                              <PageTranslator><ContactsPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/accounts">{() => (
                            <ProtectedRoute requiredPermission="accounts.read">
                              <PageTranslator><AccountsPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/leads">{() => (
                            <ProtectedRoute requiredPermission="leads.read">
                              <PageTranslator><LeadsPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/deals">{() => (
                            <ProtectedRoute requiredPermission="deals.read">
                              <PageTranslator><DealsPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/tasks">{() => (
                            <ProtectedRoute requiredPermission="tasks.read">
                              <PageTranslator><TasksPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/campaigns">{() => (
                            <ProtectedRoute requiredPermission="campaigns.read">
                              <PageTranslator><CampaignsPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/scheduling">{() => (
                            <ProtectedRoute requiredPermission="scheduling.read">
                              <PageTranslator><SchedulingPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/simple-messaging">{() => (
                            <ProtectedRoute requiredPermission="campaigns.read">
                              <PageTranslator><SimpleMessagingPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/funnel-builder">{() => (
                            <ProtectedRoute requiredPermission="marketing.read">
                              <PageTranslator><FunnelBuilderPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/sales-channels">{() => (
                            <ProtectedRoute requiredPermission="marketing.read">
                              <Suspense fallback={<div>Loading...</div>}>
                                <PageTranslator><SalesChannelsPage /></PageTranslator>
                              </Suspense>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/e-commerce-dashboard">{() => (
                            <ProtectedRoute requiredPermission="inventory.read">
                              <PageTranslator><EcommerceDashboardPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/store-preview/:id">{() => (
                            <ProtectedRoute requiredPermission="inventory.read">
                              <StorePreview />
                            </ProtectedRoute>
                          )}</Route>
                          
                          {/* Lead Generation Routes */}
                          <Route path="/prospect-explorer">{() => (
                            <ProtectedRoute requiredPermission="leads.read">
                              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
                                <PageTranslator><ProspectExplorerPage /></PageTranslator>
                              </Suspense>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/email-finder">{() => (
                            <ProtectedRoute requiredPermission="leads.read">
                              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
                                <PageTranslator><EmailFinderPage /></PageTranslator>
                              </Suspense>
                            </ProtectedRoute>
                          )}</Route>
                          
                          {/* Engagement Routes */}
                          <Route path="/sequences">{() => (
                            <ProtectedRoute requiredPermission="campaigns.read">
                              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
                                <PageTranslator><SequencesPage /></PageTranslator>
                              </Suspense>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/linkedin-tasks">{() => (
                            <ProtectedRoute requiredPermission="campaigns.read">
                              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
                                <PageTranslator><LinkedinTasksPage /></PageTranslator>
                              </Suspense>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/dialer">{() => (
                            <ProtectedRoute requiredPermission="campaigns.read">
                              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
                                <PageTranslator><DialerPage /></PageTranslator>
                              </Suspense>
                            </ProtectedRoute>
                          )}</Route>
                          
                          {/* A/B Testing Routes */}
                          <Route path="/ab-testing">{() => (
                            <ProtectedRoute requiredPermission="marketing.read">
                              <PageTranslator><AbTestingPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/ab-testing/create">{() => (
                            <ProtectedRoute requiredPermission="marketing.read">
                              <PageTranslator><AbTestingCreatePage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/ab-testing/:id">{() => (
                            <ProtectedRoute requiredPermission="marketing.read">
                              <PageTranslator><AbTestingDetailsPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          
                          {/* Optional Lazy-Loaded Routes */}
                          <Route path="/settings">{() => (
                            <ProtectedRoute requiredPermission="settings.read">
                              <PageTranslator><SettingsPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/analytics">{() => (
                            <ProtectedRoute requiredPermission="analytics.read">
                              <PageTranslator><AnalyticsPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/advanced-analytics">{() => (
                            <ProtectedRoute requiredPermission="analytics.read">
                              <PageTranslator><AdvancedAnalyticsPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/unified-analytics">{() => (
                            <ProtectedRoute requiredPermission="analytics.read">
                              <PageTranslator><UnifiedAnalyticsPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/intent-signals">{() => (
                            <ProtectedRoute requiredPermission="analytics.read">
                              <PageTranslator><IntentSignalsPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/conversation-intelligence">{() => (
                            <ProtectedRoute requiredPermission="analytics.read">
                              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
                                <PageTranslator><ConversationIntelligencePage /></PageTranslator>
                              </Suspense>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/reports">{() => (
                            <ProtectedRoute requiredPermission="reports.read">
                              <PageTranslator><ReportsPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/projects">{() => (
                            <ProtectedRoute requiredPermission="projects.read">
                              <PageTranslator><ProjectsPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/tickets">{() => (
                            <ProtectedRoute requiredPermission="support.read">
                              <PageTranslator><TicketsPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/team-collaboration">{() => (
                            <ProtectedRoute requiredPermission="collaboration.read">
                              <PageTranslator><TeamCollaborationPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/inventory-management">{() => (
                            <ProtectedRoute requiredPermission="inventory.read">
                              <PageTranslator><InventoryManagementPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/document-management">{() => (
                            <ProtectedRoute requiredPermission="documents.read">
                              <PageTranslator><DocumentManagementPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/invoices">{() => (
                            <ProtectedRoute requiredPermission="invoices.read">
                              <PageTranslator><InvoicesPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/bookkeeping">{() => (
                            <ProtectedRoute requiredPermission="bookkeeping.read">
                              <PageTranslator><BookkeepingPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/tax-settings">{() => (
                            <ProtectedRoute requiredPermission="tax.read">
                              <PageTranslator><TaxSettingsPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          
                          {/* Team & Administration Routes */}
                          <Route path="/employees">{() => (
                            <ProtectedRoute requiredPermission="hr.read">
                              <PageTranslator><EmployeesPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/roles">{() => (
                            <ProtectedRoute requiredPermission="admin.read">
                              <PageTranslator><RolesPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/resource-management">{() => (
                            <ProtectedRoute requiredPermission="hr.read">
                              <PageTranslator><ResourceManagement /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/users-management">{() => (
                            <ProtectedRoute requiredPermission="users.read">
                              <PageTranslator><UsersManagement /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/roles-management">{() => (
                            <ProtectedRoute requiredPermission="roles.read">
                              <PageTranslator><RolesManagement /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          
                          {/* AI & Intelligence Routes */}
                          <Route path="/ai-campaign-studio">{() => (
                            <ProtectedRoute requiredPermission="ai.read">
                              <PageTranslator><AICampaignStudioPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/cloe-ai-agent">{() => (
                            <ProtectedRoute requiredPermission="ai.read">
                              <PageTranslator><CloeAIAgentPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/ai-autonomous">{() => (
                            <ProtectedRoute requiredPermission="ai.read">
                              <PageTranslator><AIAutonomousPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/ai-employee-dashboard">{() => (
                            <ProtectedRoute requiredPermission="ai.read">
                              <PageTranslator><AIEmployeeDashboardPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/unified-inbox">{() => (
                            <ProtectedRoute requiredPermission="communications.read">
                              <PageTranslator><UnifiedInboxPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/forms-surveys">{() => (
                            <ProtectedRoute requiredPermission="forms.read">
                              <PageTranslator><FormsSurveysPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          
                          {/* ARGILETTE SEO Platform Routes - Full Ubersuggest Clone */}
                          <Route path="/seo-audit">{() => (
                            <ProtectedRoute requiredPermission="seo.read">
                              <PageTranslator><SeoAuditPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/seo-management">{() => (
                            <ProtectedRoute requiredPermission="seo.read">
                              <PageTranslator><SeoManagementPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/backlinks">{() => (
                            <ProtectedRoute requiredPermission="seo.read">
                              <PageTranslator><BacklinksPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/keywords">{() => (
                            <ProtectedRoute requiredPermission="seo.read">
                              <PageTranslator><KeywordsPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/rank-tracking">{() => (
                            <ProtectedRoute requiredPermission="seo.read">
                              <PageTranslator><RankTrackingPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/technical-audit">{() => (
                            <ProtectedRoute requiredPermission="seo.read">
                              <PageTranslator><TechnicalAuditPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/competitors">{() => (
                            <ProtectedRoute requiredPermission="seo.read">
                              <PageTranslator><CompetitorsPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/local-seo">{() => (
                            <ProtectedRoute requiredPermission="seo.read">
                              <PageTranslator><LocalSeoPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/link-building">{() => (
                            <ProtectedRoute requiredPermission="seo.read">
                              <PageTranslator><LinkBuildingPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/multi-platform-search">{() => (
                            <ProtectedRoute requiredPermission="seo.read">
                              <PageTranslator><MultiPlatformSearchPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          
                          {/* Platform Administration Routes */}
                          <Route path="/integrity-dashboard">{() => (
                            <ProtectedRoute requiredPermission="platform.read">
                              <PageTranslator><IntegrityDashboardPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/performance-dashboard">{() => (
                            <ProtectedRoute requiredPermission="platform.read">
                              <PageTranslator><PerformanceDashboardPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/testing-deployment-dashboard">{() => (
                            <ProtectedRoute requiredPermission="platform.read">
                              <PageTranslator><TestingDeploymentPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/bug-resolution-dashboard">{() => (
                            <ProtectedRoute requiredPermission="platform.read">
                              <PageTranslator><BugResolutionPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/feature-toggles">{() => (
                            <ProtectedRoute requiredPermission="platform.read">
                              <PageTranslator><FeatureTogglesPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/white-label-settings">{() => (
                            <ProtectedRoute requiredPermission="platform.read">
                              <PageTranslator><WhiteLabelSettingsPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/terms-of-service">{() => (
                            <ProtectedRoute requiredPermission="legal.read">
                              <PageTranslator><TermsOfServicePage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/account-settings">{() => (
                            <ProtectedRoute requiredPermission="settings.read">
                              <PageTranslator><AccountSettingsPage /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          
                          {/* Admin Dashboard Routes - Platform Owner Only */}
                          <Route path="/admin-dashboard">{() => (
                            <ProtectedRoute requiredPermission="admin.read">
                              <PageTranslator><AdminDashboard /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          <Route path="/super-admin-dashboard">{() => (
                            <ProtectedRoute requiredPermission="platform.read">
                              <PageTranslator><SuperAdminDashboard /></PageTranslator>
                            </ProtectedRoute>
                          )}</Route>
                          
                          {/* Client Portal Routes - Separate authentication system */}
                          <Route path="/client-portal/login">{() => (
                            <ClientPortalProvider>
                              <ClientPortalLogin />
                            </ClientPortalProvider>
                          )}</Route>
                          <Route path="/client-portal/dashboard">{() => (
                            <ClientPortalProvider>
                              <ClientPortalLayout>
                                <ClientPortalDashboard />
                              </ClientPortalLayout>
                            </ClientPortalProvider>
                          )}</Route>
                          <Route path="/client-portal/projects">{() => (
                            <ClientPortalProvider>
                              <ClientPortalLayout>
                                <ClientPortalProjects />
                              </ClientPortalLayout>
                            </ClientPortalProvider>
                          )}</Route>
                          <Route path="/client-portal/deliverables">{() => (
                            <ClientPortalProvider>
                              <ClientPortalLayout>
                                <ClientPortalDeliverables />
                              </ClientPortalLayout>
                            </ClientPortalProvider>
                          )}</Route>
                          <Route path="/client-portal/invoices">{() => (
                            <ClientPortalProvider>
                              <ClientPortalLayout>
                                <ClientPortalInvoices />
                              </ClientPortalLayout>
                            </ClientPortalProvider>
                          )}</Route>
                          <Route path="/client-portal/messages">{() => (
                            <ClientPortalProvider>
                              <ClientPortalLayout>
                                <ClientPortalMessages />
                              </ClientPortalLayout>
                            </ClientPortalProvider>
                          )}</Route>
                          
                          {/* Home route - MUST be at the end to avoid prefix matching all paths */}
                          <Route path="/">{() => <PageTranslator><SimpleLanding /></PageTranslator>}</Route>
                          
                          {/* Fallback */}
                          <Route path="*">{() => <Redirect to="/landing" />}</Route>
                        </Switch>
                      </Suspense>
                      <Toaster />
                    </div>
                </AuthProvider>
              </WhiteLabelProvider>
            </LanguageProvider>
          </ThemeProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </PerformanceProvider>
    </ErrorBoundary>
  );
}

export default App;