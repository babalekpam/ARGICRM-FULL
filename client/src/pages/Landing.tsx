import React, { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Users, TrendingUp, Zap, Shield, Globe, BarChart2,
  CheckCircle, ArrowRight, Star, Megaphone,
  Bot, DollarSign, Paintbrush, Building2,
  Play, X, ChevronDown, Layers, Repeat, Lock
} from "lucide-react";

const STATS = [
  { value: "3,400+", label: "Agencies using it" },
  { value: "90%", label: "Cheaper than alternatives" },
  { value: "4.9★", label: "Average rating" },
  { value: "100%", label: "White-label ready" },
];

const FEATURES = [
  { icon: Users, title: "Contact & Lead Management", desc: "Centralize every contact and lead. Track all interactions, score prospects, and turn conversations into revenue.", color: "#3b82f6" },
  { icon: TrendingUp, title: "Visual Sales Pipeline", desc: "Drag-and-drop Kanban boards with 6 customizable stages. See your entire revenue pipeline at a glance.", color: "#8b5cf6" },
  { icon: Bot, title: "6 AI Employees", desc: "Autonomous agents for outreach, lead scoring, reply handling, closing, chat qualification, and social posting.", color: "#10b981" },
  { icon: Megaphone, title: "Email Campaigns", desc: "Design, schedule and send targeted email and SMS campaigns from one unified dashboard with real-time analytics.", color: "#f59e0b" },
  { icon: BarChart2, title: "Analytics & Reporting", desc: "Real-time dashboards showing revenue trends, team performance, campaign ROI and full pipeline health.", color: "#ef4444" },
  { icon: Shield, title: "Enterprise Security", desc: "Multi-tenant isolation, role-based access control, audit logs and SOC 2-aligned data protection.", color: "#06b6d4" },
];

const AGENCY_FEATURES = [
  { icon: Paintbrush, color: "#6366f1", title: "Full brand replacement", desc: "Your logo, colours, favicon. Every pixel reflects your brand — ARGILETTE is invisible to your clients." },
  { icon: Globe, color: "#3b82f6", title: "Custom domain per client", desc: "Point crm.yourclient.com to their workspace. SSL provisioned automatically." },
  { icon: Megaphone, color: "#10b981", title: "Branded transactional emails", desc: "Welcome, invite and receipt emails sent from your company name and domain." },
  { icon: Layers, color: "#f59e0b", title: "Isolated client workspaces", desc: "Each client sits in their own secure, isolated environment. Zero data bleed." },
  { icon: DollarSign, color: "#8b5cf6", title: "Your pricing, your margin", desc: "We charge you wholesale. You set your own price and keep the entire difference." },
  { icon: Repeat, color: "#06b6d4", title: "API & webhook access", desc: "Connect to your existing billing portals, reporting dashboards, or PSA tools." },
];

const PLANS = [
  { name: "Starter", price: "$69", period: "/mo", desc: "For small teams getting started", users: "5 users", contacts: "2,000 contacts", features: ["Full CRM", "Email campaigns", "Pipeline management", "Basic reporting"], color: "#3b82f6", popular: false, cta: "Start free trial" },
  { name: "Professional", price: "$179", period: "/mo", desc: "Most popular for growing teams", users: "25 users", contacts: "10,000 contacts", features: ["Everything in Starter", "AI email generation", "Lead scoring", "Advanced analytics", "Priority support"], color: "#8b5cf6", popular: true, cta: "Start free trial" },
  { name: "Business", price: "$349", period: "/mo", desc: "For scaling organizations", users: "Unlimited", contacts: "50,000 contacts", features: ["Everything in Pro", "White-label branding", "API access", "Dedicated support", "Custom integrations"], color: "#10b981", popular: false, cta: "Start free trial" },
];

const AGENCY_PLANS = [
  { name: "Agency Starter", price: "$499", period: "/mo", seats: "Up to 10 client workspaces", highlight: false,
    features: ["Full white-label per workspace", "Custom domain per client", "Branded emails", "Priority support", "Agency management dashboard"] },
  { name: "Agency Pro", price: "$999", period: "/mo", seats: "Up to 30 client workspaces", highlight: true,
    features: ["Everything in Starter", "API & webhook access", "Custom onboarding flow", "Dedicated account manager", "SLA guarantee", "Volume discounts"] },
  { name: "Enterprise", price: "Custom", period: "", seats: "Unlimited workspaces", highlight: false,
    features: ["Unlimited white-label seats", "Revenue share model", "Co-branding available", "On-premise option", "Custom contract & SLA"] },
];

const TESTIMONIALS = [
  { name: "Sarah Mitchell", role: "CTO, TechVision Inc", text: "We moved from HubSpot and cut our CRM costs by 70%. The AI email generation alone saves 3 hours a week per rep.", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80&fit=crop&crop=face" },
  { name: "Marcus Johnson", role: "VP Operations, HealthBridge", text: "The multi-tenant setup was perfect for our agency. Each client gets their own isolated workspace — fully white-labelled under our brand.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80&fit=crop&crop=face" },
  { name: "Aisha Okonkwo", role: "CEO, GreenScale Digital", text: "We resell this to 14 clients at our own pricing. The white-label is seamless — none of them know it's ARGILETTE under the hood.", img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&q=80&fit=crop&crop=face" },
];

const BRANDS = ["Salesforce", "HubSpot", "Semrush", "Apollo", "ZoomInfo", "Drift"];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"teams" | "agencies">("teams");
  const [activePlan, setActivePlan] = useState<"regular" | "agency">("regular");
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const S = {
    section: { padding: "100px 40px" } as React.CSSProperties,
    maxW: { maxWidth: 1100, margin: "0 auto" } as React.CSSProperties,
    label: (color = "#3b82f6") => ({ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color, textTransform: "uppercase" as const, marginBottom: 12 }),
    h2: { fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, margin: "0 0 16px", lineHeight: 1.15 } as React.CSSProperties,
    sub: { fontSize: 17, color: "#64748b", maxWidth: 540, margin: "0 auto" } as React.CSSProperties,
  };

  return (
    <div style={{ background: "#080d1a", color: "#f1f5f9", fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: "100vh", overflowX: "hidden" }}>

      {/* ─── NAVBAR ─────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        padding: "0 40px",
        background: scrolled ? "rgba(8,13,26,0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "none",
        transition: "all 0.3s ease",
        height: 68, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <img src="/assets/logo.png" alt="ARGILETTE" style={{ height: 44, width: "auto", objectFit: "contain" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          {[
            { label: "Features", href: "#features" },
            { label: "Agency", href: "#agency" },
            { label: "Pricing", href: "#pricing" },
            { label: "Contact", href: "/contact" },
          ].map(l => (
            <a key={l.label} href={l.href}
              style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f1f5f9")}
              onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
            >{l.label}</a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/login">
            <a style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8", textDecoration: "none", padding: "8px 16px" }}>Sign in</a>
          </Link>
          <Link href="/register">
            <a style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none", transition: "opacity 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >Get started free <ArrowRight size={14} /></a>
          </Link>
        </div>
      </nav>

      {/* ─── HERO ───────────────────────────────────────────── */}
      <section ref={heroRef} style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&q=85&fit=crop" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(8,13,26,0.95) 0%, rgba(8,13,26,0.85) 50%, rgba(8,13,26,0.92) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 30% 50%, rgba(99,102,241,0.1) 0%, transparent 60%)" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "120px 40px 100px", textAlign: "center" }}>

          {/* Dual audience badge */}
          <div style={{ display: "flex", gap: 10, marginBottom: 32, justifyContent: "center", flexWrap: "wrap" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 14px", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 999, fontSize: 12, fontWeight: 600, color: "#818cf8" }}>
              <Zap size={12} fill="#818cf8" /> For Sales Teams
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 14px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 999, fontSize: 12, fontWeight: 600, color: "#34d399" }}>
              <Paintbrush size={12} /> For Agencies — White Label Ready
            </div>
          </div>

          <h1 style={{ fontSize: "clamp(38px,6vw,80px)", fontWeight: 800, lineHeight: 1.08, margin: "0 0 28px", letterSpacing: "-0.03em", maxWidth: 960 }}>
            The CRM agencies resell.<br />
            <span style={{ background: "linear-gradient(135deg,#818cf8 0%,#a78bfa 50%,#34d399 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Teams love. Clients never see.
            </span>
          </h1>

          <p style={{ fontSize: "clamp(16px,2vw,20px)", color: "#94a3b8", lineHeight: 1.7, maxWidth: 660, margin: "0 auto 48px" }}>
            Full CRM + AI employees + white-label branding. Sell it under your own name at your own price — or use it for your team. 90% cheaper than building your own stack.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
            <Link href="/register">
              <a style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "15px 30px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: "none", boxShadow: "0 0 40px rgba(99,102,241,0.35)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}
              >Start free 14-day trial <ArrowRight size={16} /></a>
            </Link>
            <Link href="/contact">
              <a style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 28px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#f1f5f9", borderRadius: 10, fontSize: 16, fontWeight: 600, textDecoration: "none", backdropFilter: "blur(10px)", transition: "all 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              ><Building2 size={15} /> Agency pricing</a>
            </Link>
          </div>

          <p style={{ fontSize: 13, color: "#475569" }}>No credit card required &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; Setup in 2 minutes</p>

          <div style={{ display: "flex", gap: 0, marginTop: 64, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", background: "rgba(13,20,38,0.7)" }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ padding: "20px 36px", borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)" }}>
            <ChevronDown size={20} style={{ color: "#334155", animation: "pulse 2s infinite" }} />
          </div>
        </div>
      </section>

      {/* ─── LOGO BAR ────────────────────────────────────────── */}
      <section style={{ padding: "36px 40px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#334155", textTransform: "uppercase", marginBottom: 24 }}>REPLACES ALL OF THESE</p>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 40, flexWrap: "wrap" }}>
            {BRANDS.map(b => <span key={b} style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", letterSpacing: "-0.01em" }}>{b}</span>)}
          </div>
        </div>
      </section>

      {/* ─── WHO IT'S FOR ────────────────────────────────────── */}
      <section style={{ padding: "100px 40px", background: "linear-gradient(180deg,#080d1a,#0a1020)" }}>
        <div style={{ ...S.maxW, textAlign: "center" }}>
          <div style={S.label("#6366f1")}>BUILT FOR TWO KINDS OF TEAMS</div>
          <h2 style={{ ...S.h2, textAlign: "center" }}>One platform. Two powerful use cases.</h2>
          <p style={{ ...S.sub, marginBottom: 48 }}>Whether you're running sales in-house or reselling CRM to your clients, ARGILETTE is built for you.</p>

          {/* Toggle */}
          <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 4, marginBottom: 52 }}>
            {(["teams", "agencies"] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{ padding: "10px 28px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all 0.2s", background: activeTab === t ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "transparent", color: activeTab === t ? "#fff" : "#64748b" }}>
                {t === "teams" ? "Sales Teams" : "Agencies & Resellers"}
              </button>
            ))}
          </div>

          {activeTab === "teams" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20 }}>
              {[
                { icon: Users, color: "#3b82f6", title: "Manage your pipeline", desc: "Full CRM with contacts, leads, deals and visual pipeline boards." },
                { icon: Bot, color: "#10b981", title: "AI does the heavy lifting", desc: "6 AI agents handle outreach, qualification and follow-up around the clock." },
                { icon: Megaphone, color: "#f59e0b", title: "Run email campaigns", desc: "Send targeted campaigns with real-time open, click and reply analytics." },
                { icon: BarChart2, color: "#8b5cf6", title: "Track every metric", desc: "Revenue dashboards, team performance reports and pipeline forecasts." },
              ].map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.title} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "28px 22px", textAlign: "left" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: `${f.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                      <Icon size={20} style={{ color: f.color }} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65 }}>{f.desc}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20 }}>
              {[
                { icon: Paintbrush, color: "#6366f1", title: "Your brand everywhere", desc: "Logo, colours, favicon, domain — clients never see ARGILETTE." },
                { icon: Layers, color: "#3b82f6", title: "Isolated workspaces", desc: "Each client gets their own secure environment. Zero data bleed between accounts." },
                { icon: DollarSign, color: "#10b981", title: "Keep 100% margin", desc: "You set your own price. We charge you wholesale. You keep the difference." },
                { icon: Globe, color: "#8b5cf6", title: "Custom domains", desc: "crm.yourclient.com with auto SSL. Point-and-click setup in minutes." },
              ].map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.title} style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 14, padding: "28px 22px", textAlign: "left" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: `${f.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                      <Icon size={20} style={{ color: f.color }} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65 }}>{f.desc}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── FEATURES ───────────────────────────────────────── */}
      <section id="features" style={{ ...S.section }}>
        <div style={S.maxW}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={S.label("#3b82f6")}>FEATURES</div>
            <h2 style={{ ...S.h2, textAlign: "center" }}>Everything you need to close more deals</h2>
            <p style={{ ...S.sub }}>Replace 6 separate tools with one unified platform and save thousands per month.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i}
                  style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: "28px 26px", transition: "all 0.25s", cursor: "default" }}
                  onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${f.color}40`; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 20px 50px rgba(0,0,0,0.4), 0 0 30px ${f.color}12`; }}
                  onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${f.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                    <Icon size={22} style={{ color: f.color }} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 10px" }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── AI AGENTS ──────────────────────────────────────── */}
      <section style={{ ...S.section, position: "relative", overflow: "hidden", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <img src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1400&q=80&fit=crop" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.12 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(8,13,26,0.97) 0%, rgba(8,13,26,0.88) 100%)" }} />
        </div>
        <div style={{ position: "relative", zIndex: 1, ...S.maxW, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          <div>
            <div style={S.label("#10b981")}>AI EMPLOYEES</div>
            <h2 style={S.h2}>6 AI agents working<br /><span style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>while you sleep</span></h2>
            <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.75, marginBottom: 36 }}>Autonomous AI handles your entire sales workflow — from prospecting to closing. Each agent is purpose-built and learns from your data.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { name: "Prospector", desc: "Finds and qualifies new leads from the web", color: "#3b82f6" },
                { name: "Outreach Agent", desc: "Writes and sends personalised cold emails", color: "#8b5cf6" },
                { name: "Reply Handler", desc: "Responds to incoming leads within minutes", color: "#10b981" },
                { name: "Closer", desc: "Crafts proposals and follow-up sequences", color: "#f59e0b" },
                { name: "Chat Qualifier", desc: "Qualifies website visitors in real-time", color: "#ef4444" },
                { name: "Social Poster", desc: "Publishes content across your social channels", color: "#06b6d4" },
              ].map(a => (
                <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color, boxShadow: `0 0 8px ${a.color}`, flexShrink: 0 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#f1f5f9", minWidth: 130 }}>{a.name}</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{a.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", position: "relative" }}>
            <img src="https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=600&q=85&fit=crop" alt="AI Agents" style={{ width: "100%", height: 500, objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(8,13,26,0.7) 0%, transparent 50%)" }} />
            <div style={{ position: "absolute", bottom: 24, left: 24, right: 24, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Prospecting", "Outreach", "Closing"].map(tag => (
                <div key={tag} style={{ padding: "6px 12px", background: "rgba(8,13,26,0.85)", backdropFilter: "blur(16px)", borderRadius: 8, border: "1px solid rgba(16,185,129,0.25)", fontSize: 12, fontWeight: 600, color: "#34d399" }}>{tag}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── AGENCY / WHITE LABEL ────────────────────────────── */}
      <section id="agency" style={{ ...S.section, background: "linear-gradient(180deg,#0a1020,#080d1a)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ ...S.maxW, position: "relative" }}>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", fontSize: 12, fontWeight: 600, color: "#818cf8" }}>
              <Paintbrush size={13} /> WHITE LABEL &amp; AGENCY
            </div>
          </div>

          <h2 style={{ textAlign: "center", fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, color: "#f1f5f9", marginBottom: 16, lineHeight: 1.15 }}>
            Sell it as your own.<br />
            <span style={{ background: "linear-gradient(90deg,#6366f1,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Keep 100% of the revenue.</span>
          </h2>
          <p style={{ textAlign: "center", fontSize: 17, color: "#64748b", maxWidth: 580, margin: "0 auto 64px" }}>
            Agencies and resellers white-label ARGILETTE under their own brand. Logo, colours, domain, emails — your clients never see our name.
          </p>

          {/* Feature grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20, marginBottom: 60 }}>
            {AGENCY_FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "26px 22px", transition: "border-color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = `${f.color}40`)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${f.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <Icon size={20} style={{ color: f.color }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65 }}>{f.desc}</div>
                </div>
              );
            })}
          </div>

          {/* Before / After comparison */}
          <div style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 18, padding: "40px", marginBottom: 64 }}>
            <div style={{ textAlign: "center", fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 32 }}>What your clients see</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 32, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", letterSpacing: "0.1em", marginBottom: 18 }}>WITHOUT WHITE LABEL</div>
                {["ARGILETTE logo in sidebar", "info@argilette.com in emails", "'Powered by ARGILETTE' mentions", "argilette.org in browser"].map(t => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 13, color: "#64748b" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <X size={10} color="#f87171" />
                    </div>{t}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ArrowRight size={18} color="#fff" />
                </div>
                <div style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>vs</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981", letterSpacing: "0.1em", marginBottom: 18 }}>WITH WHITE LABEL</div>
                {["Your logo on every page", "Your email address throughout", "Your company name everywhere", "crm.yourdomain.com with SSL"].map(t => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 13, color: "#94a3b8" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CheckCircle size={10} color="#34d399" />
                    </div>{t}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* How to activate */}
          <div style={{ textAlign: "center", padding: "28px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14 }}>
            <Lock size={18} style={{ color: "#818cf8", marginBottom: 10 }} />
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Already a Business or Enterprise customer?</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>White-label is already included. Go to <strong style={{ color: "#818cf8" }}>Settings → White Label</strong> to activate it right now.</div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ───────────────────────────────────── */}
      <section style={{ ...S.section, background: "rgba(255,255,255,0.01)" }}>
        <div style={S.maxW}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={S.label("#f59e0b")}>TESTIMONIALS</div>
            <h2 style={{ ...S.h2, textAlign: "center" }}>Loved by teams and agencies</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "28px 26px" }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
                  {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.75, margin: "0 0 24px", fontStyle: "italic" }}>"{t.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img src={t.img} alt={t.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────────── */}
      <section id="pricing" style={{ ...S.section }}>
        <div style={S.maxW}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={S.label("#6366f1")}>PRICING</div>
            <h2 style={{ ...S.h2, textAlign: "center" }}>Transparent pricing for every use case</h2>
            <p style={{ ...S.sub, marginBottom: 36 }}>Whether you're a team or an agency, we have a plan for you.</p>

            {/* Plan toggle */}
            <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 4 }}>
              {([["regular", "For Teams"], ["agency", "For Agencies"]] as const).map(([key, label]) => (
                <button key={key} onClick={() => setActivePlan(key)} style={{ padding: "10px 28px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all 0.2s", background: activePlan === key ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "transparent", color: activePlan === key ? "#fff" : "#64748b" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {activePlan === "regular" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
              {PLANS.map(plan => (
                <div key={plan.name} style={{ position: "relative", background: plan.popular ? "linear-gradient(145deg,rgba(99,102,241,0.12),rgba(139,92,246,0.06))" : "#0d1426", border: `1px solid ${plan.popular ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.07)"}`, borderRadius: 18, padding: "32px 28px" }}>
                  {plan.popular && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 100, whiteSpace: "nowrap" }}>MOST POPULAR</div>}
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: `${plan.color}18`, fontSize: 12, fontWeight: 700, color: plan.color, marginBottom: 16 }}>{plan.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                    <span style={{ fontSize: 40, fontWeight: 800 }}>{plan.price}</span>
                    <span style={{ fontSize: 14, color: "#64748b" }}>{plan.period}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>{plan.desc}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20, display: "flex", gap: 16 }}>
                    <span>{plan.users}</span>
                    <span>·</span>
                    <span>{plan.contacts}</span>
                  </div>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 13, color: "#94a3b8" }}>
                      <CheckCircle size={13} color={plan.color} />{f}
                    </div>
                  ))}
                  <Link href="/register">
                    <a style={{ display: "block", textAlign: "center", marginTop: 24, padding: "11px", borderRadius: 10, background: plan.popular ? `linear-gradient(135deg,${plan.color},#8b5cf6)` : `${plan.color}18`, color: plan.popular ? "#fff" : plan.color, border: plan.popular ? "none" : `1px solid ${plan.color}30`, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                      {plan.cta}
                    </a>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
              {AGENCY_PLANS.map(plan => (
                <div key={plan.name} style={{ position: "relative", background: plan.highlight ? "linear-gradient(145deg,rgba(99,102,241,0.15),rgba(139,92,246,0.08))" : "rgba(255,255,255,0.025)", border: `1px solid ${plan.highlight ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.07)"}`, borderRadius: 18, padding: "32px 28px" }}>
                  {plan.highlight && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 100, whiteSpace: "nowrap" }}>MOST POPULAR</div>}
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 18 }}>{plan.seats}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                    <span style={{ fontSize: 38, fontWeight: 800 }}>{plan.price}</span>
                    <span style={{ fontSize: 14, color: "#64748b" }}>{plan.period}</span>
                  </div>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 13, color: "#94a3b8" }}>
                      <CheckCircle size={13} color="#6366f1" />{f}
                    </div>
                  ))}
                  <Link href="/contact">
                    <a style={{ display: "block", textAlign: "center", marginTop: 24, padding: "11px", borderRadius: 10, background: plan.highlight ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(99,102,241,0.1)", color: plan.highlight ? "#fff" : "#818cf8", border: plan.highlight ? "none" : "1px solid rgba(99,102,241,0.25)", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                      {plan.price === "Custom" ? "Contact sales" : "Get started"}
                    </a>
                  </Link>
                </div>
              ))}
            </div>
          )}

          <p style={{ textAlign: "center", fontSize: 13, color: "#334155", marginTop: 28 }}>All plans include a 14-day free trial · No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ─── FINAL CTA ──────────────────────────────────────── */}
      <section style={{ padding: "80px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1400&q=80&fit=crop" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.08 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.08))" }} />
        </div>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, marginBottom: 16, lineHeight: 1.15 }}>
            Ready to launch your own CRM?
          </h2>
          <p style={{ fontSize: 17, color: "#64748b", marginBottom: 36, lineHeight: 1.7 }}>
            Join 3,400+ agencies and sales teams. Start your trial today — or talk to us about white-label and agency pricing.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register">
              <a style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 30px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none", transition: "opacity 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >Start free trial <ArrowRight size={16} /></a>
            </Link>
            <Link href="/contact">
              <a style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#f1f5f9", fontSize: 15, fontWeight: 600, textDecoration: "none", backdropFilter: "blur(10px)", transition: "background 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              ><Building2 size={15} /> Talk to agency sales</a>
            </Link>
          </div>
          <p style={{ marginTop: 20, fontSize: 13, color: "#334155" }}>14 days free · No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "48px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div>
            <img src="/assets/logo.png" alt="ARGILETTE" style={{ height: 36, width: "auto", objectFit: "contain", marginBottom: 8, display: "block" }} />
            <p style={{ fontSize: 13, color: "#334155", margin: 0 }}>© 2026 ARGILETTE LLC. All rights reserved.</p>
          </div>
          <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
            {[
              { label: "Privacy", path: "/privacy" },
              { label: "Terms", path: "/terms" },
              { label: "Security", path: "/security" },
              { label: "Contact", path: "/contact" },
            ].map(({ label, path }) => (
              <Link key={label} href={path}>
                <span style={{ fontSize: 13, color: "#334155", textDecoration: "none", cursor: "pointer", transition: "color 0.2s" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLSpanElement).style.color = "#94a3b8")}
                  onMouseLeave={e => ((e.currentTarget as HTMLSpanElement).style.color = "#334155")}
                >{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.3 } 50% { opacity: 1 } }
        @keyframes progress { from { width: 0% } to { width: 100% } }
      `}</style>
    </div>
  );
}
