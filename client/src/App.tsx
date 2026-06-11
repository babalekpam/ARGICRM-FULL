import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/api";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { WhiteLabelProvider } from "./contexts/WhiteLabelContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastHost } from "./components/Toast";

// Auth-critical pages stay in the main bundle for instant first paint;
// everything else is lazy-loaded per route to keep the initial download small.
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import LandingPage from "./pages/Landing";
import DashboardPage from "./pages/Dashboard";

const ContactsPage = React.lazy(() => import("./pages/Contacts"));
const LeadsPage = React.lazy(() => import("./pages/Leads"));
const DealsPage = React.lazy(() => import("./pages/Deals"));
const TasksPage = React.lazy(() => import("./pages/Tasks"));
const AccountsPage = React.lazy(() => import("./pages/Accounts"));
const CampaignsPage = React.lazy(() => import("./pages/Campaigns"));
const InvoicesPage = React.lazy(() => import("./pages/Invoices"));
const SettingsPage = React.lazy(() => import("./pages/Settings"));
const TeamPage = React.lazy(() => import("./pages/Team"));
const AgentsPage = React.lazy(() => import("./pages/Agents"));
const IntelligencePage = React.lazy(() => import("./pages/Intelligence"));
const HealingPage = React.lazy(() => import("./pages/Healing"));
const SeoPage = React.lazy(() => import("./pages/Seo"));
const EcommercePage = React.lazy(() => import("./pages/Ecommerce"));
const FinancePage = React.lazy(() => import("./pages/Finance"));
const ProjectsPage = React.lazy(() => import("./pages/Operations").then(m => ({ default: m.ProjectsPage })));
const EmployeesPage = React.lazy(() => import("./pages/Operations").then(m => ({ default: m.EmployeesPage })));
const MarketingPage = React.lazy(() => import("./pages/Operations").then(m => ({ default: m.MarketingPage })));
const LeadGenPage = React.lazy(() => import("./pages/LeadGen"));
const MarketplacePage = React.lazy(() => import("./pages/Marketplace"));
const EmailTrackingPage = React.lazy(() => import("./pages/EmailTracking"));
const SuperAdminPage = React.lazy(() => import("./pages/SuperAdmin"));
const AnalyticsPage = React.lazy(() => import("./pages/Analytics"));
const AIToolsPage = React.lazy(() => import("./pages/AITools"));
const WorkflowsPage = React.lazy(() => import("./pages/Workflows"));
const SkillsPage = React.lazy(() => import("./pages/Skills"));
const ContractsPage = React.lazy(() => import("./pages/Contracts"));
const SignPage = React.lazy(() => import("./pages/Sign"));
const PrivacyPage = React.lazy(() => import("./pages/Privacy"));
const TermsPage = React.lazy(() => import("./pages/Terms"));
const SecurityPage = React.lazy(() => import("./pages/Security"));
const ContactPage = React.lazy(() => import("./pages/Contact"));
const NotFoundPage = React.lazy(() => import("./pages/NotFound"));
const StorefrontPage = React.lazy(() => import("./pages/Storefront"));

function PageFallback() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div className="spinner" />
    </div>
  );
}

function useNoIndex() {
  React.useEffect(() => {
    let tag = document.querySelector('meta[name="robots"][data-app]') as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", "robots");
      tag.setAttribute("data-app", "noindex");
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", "noindex, nofollow");
    return () => { tag?.remove(); };
  }, []);
}

function Guard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  useNoIndex();
  if (loading) return null;
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div style={{ position: "fixed", inset: 0, background: "#080d1a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <img src="/assets/logo.png" alt="ARGI CRM" style={{ height: 56, width: "auto", objectFit: "contain" }} />
      <div className="spinner" />
    </div>
  );

  return (
    <React.Suspense fallback={<PageFallback />}>
    <Switch>
      <Route path="/">{() => isAuthenticated ? <Redirect to="/dashboard" /> : <LandingPage />}</Route>
      <Route path="/landing">{() => <LandingPage />}</Route>
      <Route path="/login">{() => isAuthenticated ? <Redirect to="/dashboard" /> : <LoginPage />}</Route>
      <Route path="/register">{() => isAuthenticated ? <Redirect to="/dashboard" /> : <RegisterPage />}</Route>
      <Route path="/dashboard">{() => <Guard><DashboardPage /></Guard>}</Route>
      <Route path="/contacts">{() => <Guard><ContactsPage /></Guard>}</Route>
      <Route path="/leads">{() => <Guard><LeadsPage /></Guard>}</Route>
      <Route path="/deals">{() => <Guard><DealsPage /></Guard>}</Route>
      <Route path="/tasks">{() => <Guard><TasksPage /></Guard>}</Route>
      <Route path="/accounts">{() => <Guard><AccountsPage /></Guard>}</Route>
      <Route path="/campaigns">{() => <Guard><CampaignsPage /></Guard>}</Route>
      <Route path="/invoices">{() => <Guard><InvoicesPage /></Guard>}</Route>
      <Route path="/settings">{() => <Guard><SettingsPage /></Guard>}</Route>
      <Route path="/team">{() => <Guard><TeamPage /></Guard>}</Route>
      <Route path="/agents">{() => <Guard><AgentsPage /></Guard>}</Route>
      <Route path="/intelligence">{() => <Guard><IntelligencePage /></Guard>}</Route>
      <Route path="/healing">{() => <Guard><HealingPage /></Guard>}</Route>
      <Route path="/seo">{() => <Guard><SeoPage /></Guard>}</Route>
      <Route path="/ecommerce">{() => <Guard><EcommercePage /></Guard>}</Route>
      <Route path="/finance">{() => <Guard><FinancePage /></Guard>}</Route>
      <Route path="/leadgen">{() => <Guard><LeadGenPage /></Guard>}</Route>
      <Route path="/marketplace">{() => <Guard><MarketplacePage /></Guard>}</Route>
      <Route path="/email-tracking">{() => <Guard><EmailTrackingPage /></Guard>}</Route>
      <Route path="/projects">{() => <Guard><ProjectsPage /></Guard>}</Route>
      <Route path="/employees">{() => <Guard><EmployeesPage /></Guard>}</Route>
      <Route path="/marketing">{() => <Guard><MarketingPage /></Guard>}</Route>
      <Route path="/superadmin">{() => <Guard><SuperAdminPage /></Guard>}</Route>
      <Route path="/analytics">{() => <Guard><AnalyticsPage /></Guard>}</Route>
      <Route path="/ai-tools">{() => <Guard><AIToolsPage /></Guard>}</Route>
      <Route path="/workflows">{() => <Guard><WorkflowsPage /></Guard>}</Route>
      <Route path="/skills">{() => <Guard><SkillsPage /></Guard>}</Route>
      <Route path="/privacy">{() => <PrivacyPage />}</Route>
      <Route path="/terms">{() => <TermsPage />}</Route>
      <Route path="/security">{() => <SecurityPage />}</Route>
      <Route path="/contact">{() => <ContactPage />}</Route>
      <Route path="/contracts">{() => <Guard><ContractsPage /></Guard>}</Route>
      <Route path="/sign/:token">{() => <SignPage />}</Route>
      <Route path="/store/:slug">{() => <StorefrontPage />}</Route>
      <Route>{() => <NotFoundPage />}</Route>
    </Switch>
    </React.Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <WhiteLabelProvider>
                <AppRoutes />
                <ToastHost />
              </WhiteLabelProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
