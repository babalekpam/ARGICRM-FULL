import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard, Users, UserPlus, TrendingUp, CheckSquare,
  Building2, Megaphone, FileText, Settings, LogOut, ChevronLeft,
  Bell, Menu, Shield, Zap, Crown, ChevronRight, UsersRound,
  Bot, Search, Activity, ShoppingCart, DollarSign, Briefcase,
  Globe, Target, Brain, BarChart2, Workflow, Sparkles
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "CRM",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { label: "Contacts", icon: Users, path: "/contacts" },
      { label: "Leads", icon: UserPlus, path: "/leads" },
      { label: "Deals", icon: TrendingUp, path: "/deals" },
      { label: "Tasks", icon: CheckSquare, path: "/tasks" },
      { label: "Accounts", icon: Building2, path: "/accounts" },
    ]
  },
  {
    label: "Intelligence",
    items: [
      { label: "Analytics", icon: BarChart2, path: "/analytics" },
      { label: "AI Tools", icon: Sparkles, path: "/ai-tools" },
      { label: "Automation", icon: Workflow, path: "/workflows" },
      { label: "Lead Intelligence", icon: Search, path: "/intelligence" },
      { label: "AI Agents", icon: Bot, path: "/agents" },
    ]
  },
  {
    label: "Sales & Marketing",
    items: [
      { label: "Marketing Hub", icon: Megaphone, path: "/marketing" },
      { label: "Campaigns", icon: Target, path: "/campaigns" },
      { label: "Invoices", icon: FileText, path: "/invoices" },
    ]
  },
  {
    label: "Platform",
    items: [
      { label: "SEO Platform", icon: Globe, path: "/seo" },
      { label: "E-commerce", icon: ShoppingCart, path: "/ecommerce" },
      { label: "Finance", icon: DollarSign, path: "/finance" },
    ]
  },
  {
    label: "Operations",
    items: [
      { label: "Projects", icon: Briefcase, path: "/projects" },
      { label: "Employees", icon: UsersRound, path: "/employees" },
    ]
  },
  {
    label: "Admin",
    items: [
      { label: "Team", icon: UsersRound, path: "/team" },
      { label: "Settings", icon: Settings, path: "/settings" },
      { label: "Code Healing", icon: Activity, path: "/healing" },
    ]
  },
];

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Layout({ children, title, subtitle, actions }: LayoutProps) {
  const { user, tenant, logout } = useAuth();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isPlatformOwner = user?.role === "platform_owner";
  const isTrial = tenant?.plan === "trial" || tenant?.plan === "trialing";

  const initials = [user?.firstName, user?.lastName].filter(Boolean).map(n => n![0]).join("") || user?.email?.[0]?.toUpperCase() || "?";

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: "14px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "space-between", flexShrink: 0 }}>
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <img src="/assets/logo.png" alt="ARGI CRM" style={{ width: 88, height: "auto", objectFit: "contain" }} />
          </div>
        )}
        {collapsed && <img src="/assets/logo.png" alt="ARGI CRM" style={{ width: 44, height: "auto", objectFit: "contain" }} />}
        <button onClick={() => setCollapsed(!collapsed)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex", borderRadius: 6, flexShrink: 0 }}>
          <ChevronLeft size={14} style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>
      </div>

      {/* Trial banner */}
      {isTrial && !collapsed && (
        <div style={{ margin: "10px 10px 0", padding: "8px 10px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#fbbf24", display: "flex", alignItems: "center", gap: 4 }}>
            <Zap size={11} /> Trial Active
          </div>
          {tenant?.trialEndsAt && <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Ends {new Date(tenant.trialEndsAt).toLocaleDateString()}</div>}
        </div>
      )}

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px", scrollbarWidth: "none" }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.label} style={{ marginTop: 8 }}>
            {!collapsed && (
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", padding: "0 6px", marginBottom: 2 }}>{section.label}</div>
            )}
            {section.items.map(item => {
              const Icon = item.icon;
              const active = location === item.path;
              return (
                <Link key={item.path + item.label} href={item.path}>
                  <a
                    className={`nav-item ${active ? "active" : ""}`}
                    title={collapsed ? item.label : undefined}
                    style={{ marginBottom: 1 }}
                  >
                    <Icon size={15} style={{ flexShrink: 0 }} />
                    {!collapsed && <span style={{ fontSize: 13 }}>{item.label}</span>}
                    {active && !collapsed && <ChevronRight size={12} style={{ marginLeft: "auto", opacity: 0.5 }} />}
                  </a>
                </Link>
              );
            })}
          </div>
        ))}

        {/* Platform Owner */}
        {isPlatformOwner && (
          <div style={{ marginTop: 8 }}>
            {!collapsed && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#f59e0b", padding: "0 6px", marginBottom: 2 }}>Platform</div>}
            <Link href="/superadmin">
              <a className={`nav-item ${location === "/superadmin" ? "active" : ""}`} style={{ color: "#f59e0b" }} title={collapsed ? "Platform Admin" : undefined}>
                <Shield size={15} style={{ flexShrink: 0 }} />
                {!collapsed && <span style={{ fontSize: 13 }}>Platform Admin</span>}
              </a>
            </Link>
          </div>
        )}
      </div>

      {/* User footer */}
      <div style={{ padding: "10px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px", borderRadius: 9, background: "var(--bg-overlay)" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
            {initials}
          </div>
          {!collapsed && (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.email}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "capitalize" }}>{user?.role?.replace("_", " ")}</div>
              </div>
              <button onClick={logout} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex", borderRadius: 6 }} title="Log out">
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
        {collapsed && (
          <button onClick={logout} style={{ width: "100%", marginTop: 6, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "6px", display: "flex", justifyContent: "center", borderRadius: 6 }} title="Log out">
            <LogOut size={15} />
          </button>
        )}
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Desktop Sidebar */}
      <aside style={{
        width: collapsed ? "60px" : "220px",
        transition: "width 0.2s ease",
        flexShrink: 0,
        background: "var(--bg-card)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowX: "hidden",
      }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setMobileOpen(false)} />
          <aside style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 220, background: "var(--bg-card)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Header */}
        <header style={{ padding: "0 20px", height: "58px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", background: "var(--bg-card)", position: "sticky", top: 0, zIndex: 40, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex" }} onClick={() => setMobileOpen(!mobileOpen)}>
              <Menu size={18} />
            </button>
            {title && (
              <div>
                <h1 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1.2 }}>{title}</h1>
                {subtitle && <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{subtitle}</p>}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {actions}
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 8, display: "flex", borderRadius: 8 }}>
              <Bell size={16} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "20px", overflowY: "auto" }} className="animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
