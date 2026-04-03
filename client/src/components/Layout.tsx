import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { useWhiteLabel } from "../contexts/WhiteLabelContext";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { SUPPORTED_LANGUAGES } from "@shared/languages";
import { useQuery } from "@tanstack/react-query";
import ARIADialog from "./ARIADialog";
import {
  LayoutDashboard, Users, UserPlus, TrendingUp, CheckSquare,
  Building2, Megaphone, FileText, Settings, LogOut, ChevronLeft,
  Bell, Menu, Shield, Zap, Crown, ChevronRight, UsersRound,
  Bot, Search, Activity, ShoppingCart, DollarSign, Briefcase,
  Globe, Target, Brain, BarChart2, Workflow, Sparkles, Command, X, Store,
  Sun, Moon, Languages
} from "lucide-react";

const NAV_SECTIONS_DEF = [
  {
    labelKey: "nav_crm",
    items: [
      { labelKey: "nav_dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { labelKey: "nav_contacts", icon: Users, path: "/contacts" },
      { labelKey: "nav_leads", icon: UserPlus, path: "/leads" },
      { labelKey: "nav_deals", icon: TrendingUp, path: "/deals" },
      { labelKey: "nav_tasks", icon: CheckSquare, path: "/tasks" },
      { labelKey: "nav_accounts", icon: Building2, path: "/accounts" },
    ]
  },
  {
    labelKey: "nav_intelligence",
    items: [
      { labelKey: "nav_analytics", icon: BarChart2, path: "/analytics" },
      { labelKey: "nav_ai_tools", icon: Sparkles, path: "/ai-tools" },
      { labelKey: "nav_automation", icon: Workflow, path: "/workflows" },
      { labelKey: "nav_lead_intelligence", icon: Search, path: "/intelligence" },
      { labelKey: "nav_lead_gen", icon: Zap, path: "/leadgen" },
      { labelKey: "nav_ai_agents", icon: Bot, path: "/agents" },
      { labelKey: "nav_skills_library", icon: Brain, path: "/skills" },
    ]
  },
  {
    labelKey: "nav_sales_marketing",
    items: [
      { labelKey: "nav_marketing_hub", icon: Megaphone, path: "/marketing" },
      { labelKey: "nav_campaigns", icon: Target, path: "/campaigns" },
      { labelKey: "nav_invoices", icon: FileText, path: "/invoices" },
    ]
  },
  {
    labelKey: "nav_platform",
    items: [
      { labelKey: "nav_marketplace", icon: Store, path: "/marketplace" },
      { labelKey: "nav_seo_platform", icon: Globe, path: "/seo" },
      { labelKey: "nav_ecommerce", icon: ShoppingCart, path: "/ecommerce" },
      { labelKey: "nav_finance", icon: DollarSign, path: "/finance" },
    ]
  },
  {
    labelKey: "nav_operations",
    items: [
      { labelKey: "nav_projects", icon: Briefcase, path: "/projects" },
      { labelKey: "nav_employees", icon: UsersRound, path: "/employees" },
    ]
  },
  {
    labelKey: "nav_admin",
    items: [
      { labelKey: "nav_team", icon: UsersRound, path: "/team" },
      { labelKey: "nav_settings", icon: Settings, path: "/settings" },
      { labelKey: "nav_code_healing", icon: Activity, path: "/healing" },
    ]
  },
];

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: results } = useQuery<any>({
    queryKey: ["/api/search", q],
    queryFn: async () => {
      if (q.trim().length < 2) return null;
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
      return res.json();
    },
    enabled: q.trim().length >= 2,
  });

  useEffect(() => { inputRef.current?.focus(); }, []);

  function go(path: string) { setLocation(path); onClose(); }

  const sections = [
    { key: "contacts", label: "Contacts", path: (i: any) => `/contacts`, icon: Users },
    { key: "leads", label: "Leads", path: (i: any) => `/leads`, icon: UserPlus },
    { key: "deals", label: "Deals", path: (i: any) => `/deals`, icon: TrendingUp },
    { key: "accounts", label: "Accounts", path: (i: any) => `/accounts`, icon: Building2 },
  ];

  const hasResults = results && sections.some(s => (results[s.key]?.length || 0) > 0);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 999, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: window.innerWidth < 768 ? 20 : 80, padding: window.innerWidth < 768 ? "20px 12px 0" : undefined }} onClick={onClose}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, width: "100%", maxWidth: 560, boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
          <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input ref={inputRef} data-testid="input-global-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search contacts, leads, deals, accounts…" style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text-primary)", fontSize: 15 }} />
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 2 }}><X size={14} /></button>
        </div>
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {q.trim().length < 2 ? (
            <div style={{ padding: "20px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Type to search across your CRM…</div>
          ) : !hasResults ? (
            <div style={{ padding: "20px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No results for "{q}"</div>
          ) : sections.map(s => {
            const items = results?.[s.key] || [];
            if (!items.length) return null;
            const Icon = s.icon;
            return (
              <div key={s.key}>
                <div style={{ padding: "8px 16px 4px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>{s.label}</div>
                {items.map((item: any) => (
                  <button key={item.id} onClick={() => go(s.path(item))} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-overlay)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--bg-overlay)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={13} style={{ color: "var(--text-muted)" }} /></div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{item.firstName ? `${item.firstName} ${item.lastName || ""}`.trim() : item.name || item.email || "—"}</div>
                      {item.company && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.company}</div>}
                      {item.email && !item.company && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.email}</div>}
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
        <div style={{ padding: "8px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 12, fontSize: 11, color: "var(--text-muted)" }}>
          <span>↵ to navigate</span><span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children, title, subtitle, actions }: LayoutProps) {
  const { user, tenant, logout } = useAuth();
  const { logoUrl, brandName } = useWhiteLabel();
  const { theme, toggleTheme } = useTheme();
  const { t, lang, setLang } = useLanguage();
  const [location] = useLocation();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const isPlatformOwner = user?.role === "platform_owner";

  useEffect(() => {
    function handleResize() { setIsMobile(window.innerWidth < 768); }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") setSearchOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);
  const isTrial = tenant?.plan === "trial" || tenant?.plan === "trialing";

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    if (langOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [langOpen]);

  const initials = [user?.firstName, user?.lastName].filter(Boolean).map(n => n![0]).join("") || user?.email?.[0]?.toUpperCase() || "?";

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: "14px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "space-between", flexShrink: 0 }}>
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <img src={logoUrl || "/assets/logo.png"} alt={brandName} style={{ width: 88, height: "auto", objectFit: "contain" }} />
          </div>
        )}
        {collapsed && <img src={logoUrl || "/assets/logo.png"} alt={brandName} style={{ width: 44, height: "auto", objectFit: "contain" }} />}
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
        {NAV_SECTIONS_DEF.map(section => (
          <div key={section.labelKey} style={{ marginTop: 8 }}>
            {!collapsed && (
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", padding: "0 6px", marginBottom: 2 }}>{t(section.labelKey)}</div>
            )}
            {section.items.map(item => {
              const Icon = item.icon;
              const active = location === item.path;
              const label = t(item.labelKey);
              return (
                <Link
                  key={item.path + item.labelKey}
                  href={item.path}
                  className={`nav-item ${active ? "active" : ""}`}
                  title={collapsed ? label : undefined}
                  style={{ marginBottom: 1 }}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  {!collapsed && <span style={{ fontSize: 13 }}>{label}</span>}
                  {active && !collapsed && <ChevronRight size={12} style={{ marginLeft: "auto", opacity: 0.5 }} />}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Platform Owner */}
        {isPlatformOwner && (
          <div style={{ marginTop: 8 }}>
            {!collapsed && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#f59e0b", padding: "0 6px", marginBottom: 2 }}>Platform</div>}
            <Link
              href="/superadmin"
              className={`nav-item ${location === "/superadmin" ? "active" : ""}`}
              style={{ color: "#f59e0b" }}
              title={collapsed ? "Platform Admin" : undefined}
            >
              <Shield size={15} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ fontSize: 13 }}>Platform Admin</span>}
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
      {/* Desktop Sidebar — hidden on mobile */}
      {!isMobile && (
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
      )}

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
        <header style={{ padding: "0 16px", height: "58px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", background: "var(--bg-card)", position: "sticky", top: 0, zIndex: 40, flexShrink: 0, gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
            {isMobile && (
              <button data-testid="button-mobile-menu" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex", flexShrink: 0 }} onClick={() => setMobileOpen(!mobileOpen)}>
                <Menu size={20} />
              </button>
            )}
            {title && (
              <div style={{ minWidth: 0 }}>
                <h1 style={{ fontSize: isMobile ? "15px" : "17px", fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</h1>
                {subtitle && !isMobile && <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{subtitle}</p>}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {/* Global search trigger */}
            <button data-testid="button-global-search" onClick={() => setSearchOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-overlay)", border: "1px solid var(--border)", borderRadius: 8, padding: isMobile ? "6px 8px" : "5px 10px", cursor: "pointer", color: "var(--text-muted)", fontSize: 12 }}>
              <Search size={13} />
              {!isMobile && <span style={{ fontSize: 12 }}>{t("search")}…</span>}
              {!isMobile && (
                <span style={{ display: "flex", alignItems: "center", gap: 2, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 4, padding: "1px 4px", fontSize: 10, fontFamily: "monospace" }}>
                  <Command size={9} />K
                </span>
              )}
            </button>
            {actions}
            {/* Language switcher */}
            <div ref={langRef} style={{ position: "relative" }}>
              <button
                data-testid="button-language-switcher"
                onClick={() => setLangOpen(!langOpen)}
                title={t("language")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 8, display: "flex", alignItems: "center", gap: 4, borderRadius: 8, fontSize: 12 }}
              >
                <Languages size={16} />
                {!isMobile && <span style={{ fontSize: 11, fontWeight: 600 }}>{lang.toUpperCase()}</span>}
              </button>
              {langOpen && (
                <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 4, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", minWidth: 180, zIndex: 200, overflow: "hidden" }}>
                  <div style={{ padding: "8px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>{t("language")}</div>
                  {SUPPORTED_LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      data-testid={`button-lang-${l.code}`}
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                      style={{ width: "100%", background: lang === l.code ? "var(--bg-overlay)" : "none", border: "none", cursor: "pointer", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-primary)", textAlign: "left" }}
                    >
                      <span style={{ fontSize: 16 }}>{l.flag}</span>
                      <span style={{ flex: 1 }}>{l.nativeName}</span>
                      {lang === l.code && <span style={{ fontSize: 10, color: "var(--accent)", fontWeight: 700 }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              data-testid="button-theme-toggle"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 8, display: "flex", borderRadius: 8 }}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 8, display: "flex", borderRadius: 8 }}>
              <Bell size={16} />
            </button>
          </div>
        </header>
        {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}

        {/* Page content */}
        <main style={{ flex: 1, padding: isMobile ? "12px" : "20px", overflowY: "auto" }} className="animate-fade-in">
          {children}
        </main>
      </div>
      <ARIADialog />
    </div>
  );
}
