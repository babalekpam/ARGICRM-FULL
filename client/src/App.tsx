import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/api";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { WhiteLabelProvider } from "./contexts/WhiteLabelContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";

import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import LandingPage from "./pages/Landing";
import DashboardPage from "./pages/Dashboard";
import ContactsPage from "./pages/Contacts";
import LeadsPage from "./pages/Leads";
import DealsPage from "./pages/Deals";
import TasksPage from "./pages/Tasks";
import AccountsPage from "./pages/Accounts";
import CampaignsPage from "./pages/Campaigns";
import InvoicesPage from "./pages/Invoices";
import SettingsPage from "./pages/Settings";
import TeamPage from "./pages/Team";
import AgentsPage from "./pages/Agents";
import IntelligencePage from "./pages/Intelligence";
import HealingPage from "./pages/Healing";
import SeoPage from "./pages/Seo";
import EcommercePage from "./pages/Ecommerce";
import FinancePage from "./pages/Finance";
import { ProjectsPage, EmployeesPage, MarketingPage } from "./pages/Operations";
import LeadGenPage from "./pages/LeadGen";
import SuperAdminPage from "./pages/SuperAdmin";
import AnalyticsPage from "./pages/Analytics";
import AIToolsPage from "./pages/AITools";
import WorkflowsPage from "./pages/Workflows";
import SkillsPage from "./pages/Skills";
import PrivacyPage from "./pages/Privacy";
import TermsPage from "./pages/Terms";
import SecurityPage from "./pages/Security";
import ContactPage from "./pages/Contact";
import NotFoundPage from "./pages/NotFound";
import StorefrontPage from "./pages/Storefront";

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
      <Route path="/store/:slug">{() => <StorefrontPage />}</Route>
      <Route>{() => <NotFoundPage />}</Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <WhiteLabelProvider>
              <AppRoutes />
            </WhiteLabelProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
