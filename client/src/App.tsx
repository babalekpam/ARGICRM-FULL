import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
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
import SimpleLanding from "@/pages/simple-landing-new";
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

// AI & Intelligence  
const AICampaignStudioPage = lazy(() => import("@/pages/ai-campaign-studio"));
const CloeAIAgentPage = lazy(() => import("@/pages/cloe-ai-agent"));
const AIAutonomousPage = lazy(() => import("@/pages/ai-autonomous-dashboard"));
const SentimentPage = lazy(() => import("@/pages/sentiment"));
const UnifiedInboxPage = lazy(() => import("@/pages/unified-inbox"));
const FormsSurveysPage = lazy(() => import("@/pages/forms-surveys"));
const SalesChannelsPage = lazy(() => import("@/components/sales-channels-manager"));

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
          <ThemeProvider defaultTheme="light" storageKey="argilette-theme">
            <LanguageProvider>
              <WhiteLabelProvider>
                <AuthProvider>
                  <BrowserRouter>
                    <TrackingScripts />
                    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                      <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                          {/* Public Routes */}
                          <Route path="/landing" element={<PageTranslator><SimpleLanding /></PageTranslator>} />
                          <Route path="/" element={<PageTranslator><SimpleLanding /></PageTranslator>} />
                          <Route path="/login" element={<Navigate to="/" replace />} />
                          <Route path="/signup" element={<PageTranslator><SignupPage /></PageTranslator>} />
                          <Route path="/forgot-password" element={<PageTranslator><ForgotPasswordPage /></PageTranslator>} />
                          <Route path="/reset-password" element={<PageTranslator><ResetPasswordPage /></PageTranslator>} />
                          <Route path="/help-center" element={<PageTranslator><HelpCenterPage /></PageTranslator>} />
                          <Route path="/help" element={<PageTranslator><HelpCenterPage /></PageTranslator>} />
                          <Route path="/unsubscribe" element={<UnsubscribePage />} />
                          <Route path="/features" element={<PageTranslator><FeaturesPage /></PageTranslator>} />
                          <Route path="/pricing" element={<PageTranslator><PricingPage /></PageTranslator>} />
                          <Route path="/about" element={<PageTranslator><AboutPage /></PageTranslator>} />
                          <Route path="/privacy" element={<PageTranslator><PrivacyPage /></PageTranslator>} />
                          <Route path="/blog" element={<PageTranslator><BlogPage /></PageTranslator>} />
                          <Route path="/terms" element={<PageTranslator><TermsPage /></PageTranslator>} />
                          <Route path="/crm-for-small-business" element={<PageTranslator><CrmForSmallBusinessPage /></PageTranslator>} />
                          <Route path="/enterprise-crm" element={<PageTranslator><EnterpriseCrmPage /></PageTranslator>} />
                          <Route path="/ai-powered-crm" element={<PageTranslator><AiPoweredCrmPage /></PageTranslator>} />
                          <Route path="/overview" element={<PageTranslator><OverviewPage /></PageTranslator>} />
                          
                          {/* Protected Core Routes */}
                          <Route path="/dashboard" element={
                            <ProtectedRoute requiredPermission="dashboard.read">
                              <PageTranslator><DashboardRedirect /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/user-dashboard" element={
                            <ProtectedRoute requiredPermission="dashboard.read">
                              <PageTranslator><UserDashboard /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/contacts" element={
                            <ProtectedRoute requiredPermission="contacts.read">
                              <PageTranslator><ContactsPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/accounts" element={
                            <ProtectedRoute requiredPermission="accounts.read">
                              <PageTranslator><AccountsPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/leads" element={
                            <ProtectedRoute requiredPermission="leads.read">
                              <PageTranslator><LeadsPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/deals" element={
                            <ProtectedRoute requiredPermission="deals.read">
                              <PageTranslator><DealsPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/tasks" element={
                            <ProtectedRoute requiredPermission="tasks.read">
                              <PageTranslator><TasksPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/campaigns" element={
                            <ProtectedRoute requiredPermission="campaigns.read">
                              <PageTranslator><CampaignsPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/scheduling" element={
                            <ProtectedRoute requiredPermission="scheduling.read">
                              <PageTranslator><SchedulingPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/simple-messaging" element={
                            <ProtectedRoute requiredPermission="campaigns.read">
                              <PageTranslator><SimpleMessagingPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/funnel-builder" element={
                            <ProtectedRoute requiredPermission="marketing.read">
                              <PageTranslator><FunnelBuilderPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/sales-channels" element={
                            <ProtectedRoute requiredPermission="marketing.read">
                              <Suspense fallback={<div>Loading...</div>}>
                                <PageTranslator><SalesChannelsPage /></PageTranslator>
                              </Suspense>
                            </ProtectedRoute>
                          } />
                          <Route path="/e-commerce-dashboard" element={
                            <ProtectedRoute requiredPermission="inventory.read">
                              <PageTranslator><EcommerceDashboardPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/store-preview/:id" element={
                            <ProtectedRoute requiredPermission="inventory.read">
                              <StorePreview />
                            </ProtectedRoute>
                          } />
                          
                          {/* Optional Lazy-Loaded Routes */}
                          <Route path="/settings" element={
                            <ProtectedRoute requiredPermission="settings.read">
                              <PageTranslator><SettingsPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/analytics" element={
                            <ProtectedRoute requiredPermission="analytics.read">
                              <PageTranslator><AnalyticsPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/advanced-analytics" element={
                            <ProtectedRoute requiredPermission="analytics.read">
                              <PageTranslator><AdvancedAnalyticsPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/reports" element={
                            <ProtectedRoute requiredPermission="reports.read">
                              <PageTranslator><ReportsPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/projects" element={
                            <ProtectedRoute requiredPermission="projects.read">
                              <PageTranslator><ProjectsPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/tickets" element={
                            <ProtectedRoute requiredPermission="support.read">
                              <PageTranslator><TicketsPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/team-collaboration" element={
                            <ProtectedRoute requiredPermission="collaboration.read">
                              <PageTranslator><TeamCollaborationPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/inventory-management" element={
                            <ProtectedRoute requiredPermission="inventory.read">
                              <PageTranslator><InventoryManagementPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/document-management" element={
                            <ProtectedRoute requiredPermission="documents.read">
                              <PageTranslator><DocumentManagementPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/invoices" element={
                            <ProtectedRoute requiredPermission="invoices.read">
                              <PageTranslator><InvoicesPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/bookkeeping" element={
                            <ProtectedRoute requiredPermission="bookkeeping.read">
                              <PageTranslator><BookkeepingPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/tax-settings" element={
                            <ProtectedRoute requiredPermission="tax.read">
                              <PageTranslator><TaxSettingsPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          
                          {/* Team & Administration Routes */}
                          <Route path="/employees" element={
                            <ProtectedRoute requiredPermission="hr.read">
                              <PageTranslator><EmployeesPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/roles" element={
                            <ProtectedRoute requiredPermission="admin.read">
                              <PageTranslator><RolesPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          
                          {/* AI & Intelligence Routes */}
                          <Route path="/ai-campaign-studio" element={
                            <ProtectedRoute requiredPermission="ai.read">
                              <PageTranslator><AICampaignStudioPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/cloe-ai-agent" element={
                            <ProtectedRoute requiredPermission="ai.read">
                              <PageTranslator><CloeAIAgentPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/ai-autonomous" element={
                            <ProtectedRoute requiredPermission="sentiment.read">
                              <PageTranslator><AIAutonomousPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/sentiment" element={
                            <ProtectedRoute requiredPermission="sentiment.read">
                              <PageTranslator><SentimentPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/unified-inbox" element={
                            <ProtectedRoute requiredPermission="communications.read">
                              <PageTranslator><UnifiedInboxPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/forms-surveys" element={
                            <ProtectedRoute requiredPermission="forms.read">
                              <PageTranslator><FormsSurveysPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          
                          {/* ARGILETTE SEO Platform Routes - Full Ubersuggest Clone */}
                          <Route path="/seo-audit" element={
                            <ProtectedRoute requiredPermission="seo.read">
                              <PageTranslator><SeoAuditPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/seo-management" element={
                            <ProtectedRoute requiredPermission="seo.read">
                              <PageTranslator><SeoManagementPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/backlinks" element={
                            <ProtectedRoute requiredPermission="seo.read">
                              <PageTranslator><BacklinksPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/keywords" element={
                            <ProtectedRoute requiredPermission="seo.read">
                              <PageTranslator><KeywordsPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/rank-tracking" element={
                            <ProtectedRoute requiredPermission="seo.read">
                              <PageTranslator><RankTrackingPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/technical-audit" element={
                            <ProtectedRoute requiredPermission="seo.read">
                              <PageTranslator><TechnicalAuditPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/competitors" element={
                            <ProtectedRoute requiredPermission="seo.read">
                              <PageTranslator><CompetitorsPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/local-seo" element={
                            <ProtectedRoute requiredPermission="seo.read">
                              <PageTranslator><LocalSeoPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/link-building" element={
                            <ProtectedRoute requiredPermission="seo.read">
                              <PageTranslator><LinkBuildingPage selectedProjectId="1" /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/multi-platform-search" element={
                            <ProtectedRoute requiredPermission="seo.read">
                              <PageTranslator><MultiPlatformSearchPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          
                          {/* Platform Administration Routes */}
                          <Route path="/integrity-dashboard" element={
                            <ProtectedRoute requiredPermission="platform.read">
                              <PageTranslator><IntegrityDashboardPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/performance-dashboard" element={
                            <ProtectedRoute requiredPermission="platform.read">
                              <PageTranslator><PerformanceDashboardPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/testing-deployment-dashboard" element={
                            <ProtectedRoute requiredPermission="platform.read">
                              <PageTranslator><TestingDeploymentPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/bug-resolution-dashboard" element={
                            <ProtectedRoute requiredPermission="platform.read">
                              <PageTranslator><BugResolutionPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/feature-toggles" element={
                            <ProtectedRoute requiredPermission="platform.read">
                              <PageTranslator><FeatureTogglesPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/white-label-settings" element={
                            <ProtectedRoute requiredPermission="platform.read">
                              <PageTranslator><WhiteLabelSettingsPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/terms-of-service" element={
                            <ProtectedRoute requiredPermission="legal.read">
                              <PageTranslator><TermsOfServicePage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/account-settings" element={
                            <ProtectedRoute requiredPermission="settings.read">
                              <PageTranslator><AccountSettingsPage /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          
                          {/* Admin Dashboard Routes - Platform Owner Only */}
                          <Route path="/admin-dashboard" element={
                            <ProtectedRoute requiredPermission="admin.read">
                              <PageTranslator><AdminDashboard /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          <Route path="/super-admin-dashboard" element={
                            <ProtectedRoute requiredPermission="platform.read">
                              <PageTranslator><SuperAdminDashboard /></PageTranslator>
                            </ProtectedRoute>
                          } />
                          
                          {/* Fallback */}
                          <Route path="*" element={<Navigate to="/landing" replace />} />
                        </Routes>
                      </Suspense>
                      <Toaster />
                    </div>
                  </BrowserRouter>
                </AuthProvider>
              </WhiteLabelProvider>
            </LanguageProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </PerformanceProvider>
    </ErrorBoundary>
  );
}

export default App;