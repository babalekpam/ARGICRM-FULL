import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Users, TrendingUp, Zap, Shield, Globe, BarChart2,
  CheckCircle, ArrowRight, Star, Building2, Megaphone,
  Mail, Phone, ChevronRight, Menu, X
} from "lucide-react";

const FEATURES = [
  { icon: Users, title: "Contact & Lead Management", desc: "Centralize all your contacts and leads. Track interactions, score prospects, and never lose a deal.", color: "#3b82f6" },
  { icon: TrendingUp, title: "Sales Pipeline", desc: "Kanban deal tracking with 6 customizable stages. See your entire revenue pipeline at a glance.", color: "#8b5cf6" },
  { icon: Megaphone, title: "Email Campaigns", desc: "Create, schedule and send targeted email, SMS and LinkedIn campaigns from one dashboard.", color: "#10b981" },
  { icon: Zap, title: "AI-Powered Automation", desc: "Let AI generate cold emails, score leads, and surface the highest-priority actions every morning.", color: "#f59e0b" },
  { icon: BarChart2, title: "Analytics & Reporting", desc: "Real-time dashboards showing revenue, team performance, campaign ROI and pipeline health.", color: "#ef4444" },
  { icon: Shield, title: "Multi-tenant Security", desc: "Enterprise-grade isolation. Each workspace is fully separated with role-based access control.", color: "#06b6d4" },
];

const PLANS = [
  { name: "Starter", price: "$69", period: "/mo", desc: "For small teams getting started", users: "5 users", contacts: "2,000 contacts", features: ["Full CRM", "Email campaigns", "Pipeline management", "Basic reporting"], color: "#3b82f6", popular: false },
  { name: "Professional", price: "$179", period: "/mo", desc: "Most popular for growing teams", users: "25 users", contacts: "10,000 contacts", features: ["Everything in Starter", "AI email generation", "Lead scoring", "Advanced analytics", "Priority support"], color: "#8b5cf6", popular: true },
  { name: "Business", price: "$349", period: "/mo", desc: "For scaling organizations", users: "Unlimited", contacts: "50,000 contacts", features: ["Everything in Pro", "White-label options", "API access", "Dedicated support", "Custom integrations"], color: "#10b981", popular: false },
];

const TESTIMONIALS = [
  { name: "Sarah Mitchell", role: "CTO, TechVision Inc", text: "We moved from HubSpot and cut our CRM costs by 70%. The AI email generation alone saves 3 hours a week per rep.", avatar: "SM" },
  { name: "Marcus Johnson", role: "VP Operations, HealthBridge", text: "The multi-tenant setup was perfect for our agency. Each client gets their own isolated workspace with full customization.", avatar: "MJ" },
  { name: "Aisha Okonkwo", role: "CEO, GreenScale", text: "From sign-up to first deal tracked in under 20 minutes. The cleanest CRM UI I've ever used.", avatar: "AO" },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div style={{ background: "#080d1a", color: "#f1f5f9", fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: "100vh" }}>

      {/* ─── Navbar ──────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 40px",
        background: scrolled ? "rgba(8,13,26,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "all 0.3s ease",
        height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <img src="/assets/logo.png" alt="ARGI CRM" style={{ height: 44, width: "auto", objectFit: "contain" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="hidden md:flex">
          {["Features", "Pricing", "About"].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500, textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f1f5f9")}
              onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
            >{l}</a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/login"><a style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8", textDecoration: "none", padding: "8px 16px" }} className="hidden md:block">Sign in</a></Link>
          <Link href="/register"><a style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#3b82f6", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none", transition: "background 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#60a5fa")}
            onMouseLeave={e => (e.currentTarget.style.background = "#3b82f6")}
          >Start free trial <ArrowRight size={14} /></a></Link>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 40px 80px", position: "relative", overflow: "hidden" }}>
        {/* Background glow */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 50%, rgba(139,92,246,0.07) 0%, transparent 50%)" }} />
        {/* Grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "60px 60px", maskImage: "radial-gradient(ellipse 80% 80% at 50% 0%, black 0%, transparent 70%)" }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 820 }} className="animate-slide-up">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 999, fontSize: 13, fontWeight: 600, color: "#60a5fa", marginBottom: 32 }}>
            <Zap size={13} /> AI-Powered CRM for Global Teams
          </div>

          <h1 style={{ fontSize: "clamp(40px,6vw,76px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 24px", letterSpacing: "-0.02em" }}>
            The CRM that works{" "}
            <span style={{ background: "linear-gradient(135deg,#60a5fa,#818cf8,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              as hard as you do
            </span>
          </h1>

          <p style={{ fontSize: "clamp(16px,2vw,20px)", color: "#94a3b8", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 40px" }}>
            CRM, email campaigns, deal pipelines, invoicing, and AI automation — everything your team needs, 90% cheaper than piecing it together from multiple tools.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register">
              <a style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "#3b82f6", color: "#fff", borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: "none", boxShadow: "0 0 30px rgba(59,130,246,0.3)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#60a5fa"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#3b82f6"; e.currentTarget.style.transform = "none"; }}
              >Start free 14-day trial <ArrowRight size={16} /></a>
            </Link>
            <Link href="/login">
              <a style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#f1f5f9", borderRadius: 10, fontSize: 16, fontWeight: 600, textDecoration: "none", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              >View demo</a>
            </Link>
          </div>

          <p style={{ marginTop: 20, fontSize: 13, color: "#64748b" }}>No credit card required · 14-day free trial · Cancel anytime</p>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────── */}
      <section id="features" style={{ padding: "100px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#3b82f6", textTransform: "uppercase", marginBottom: 12 }}>FEATURES</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, margin: "0 0 16px" }}>Everything you need to close more deals</h2>
            <p style={{ fontSize: 17, color: "#94a3b8", maxWidth: 560, margin: "0 auto" }}>
              Replace 6 separate tools with one unified platform. Save thousands per month.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "28px", transition: "all 0.2s", cursor: "default" }}
                  onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${f.color}44`; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <Icon size={22} style={{ color: f.color }} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─────────────────────────────────── */}
      <section id="pricing" style={{ padding: "100px 40px", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#8b5cf6", textTransform: "uppercase", marginBottom: 12 }}>PRICING</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, margin: "0 0 16px" }}>Simple, transparent pricing</h2>
            <p style={{ fontSize: 17, color: "#94a3b8" }}>Start free. No credit card needed.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {PLANS.map(plan => (
              <div key={plan.name} style={{
                background: plan.popular ? "linear-gradient(180deg, rgba(139,92,246,0.1), rgba(59,130,246,0.06))" : "#0d1426",
                border: `1.5px solid ${plan.popular ? "#8b5cf6" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 18, padding: "32px",
                position: "relative",
                transform: plan.popular ? "scale(1.03)" : "none",
              }}>
                {plan.popular && (
                  <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 999, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>{plan.name}</h3>
                  <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>{plan.desc}</p>
                </div>
                <div style={{ marginBottom: 28 }}>
                  <span style={{ fontSize: 48, fontWeight: 800, color: plan.color }}>{plan.price}</span>
                  <span style={{ fontSize: 16, color: "#64748b" }}>{plan.period}</span>
                </div>
                <div style={{ marginBottom: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[plan.users, plan.contacts].map(t => (
                    <span key={t} style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", background: "rgba(255,255,255,0.06)", borderRadius: 6, color: "#94a3b8" }}>{t}</span>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#94a3b8" }}>
                      <CheckCircle size={15} style={{ color: plan.color, flexShrink: 0 }} />{f}
                    </div>
                  ))}
                </div>
                <Link href="/register">
                  <a style={{ display: "block", textAlign: "center", padding: "12px", background: plan.popular ? "#8b5cf6" : "rgba(255,255,255,0.07)", color: "#fff", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none", border: plan.popular ? "none" : "1px solid rgba(255,255,255,0.12)", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                  >Get started free</a>
                </Link>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", marginTop: 32, fontSize: 14, color: "#64748b" }}>
            All plans include a 14-day free trial. Enterprise pricing available for 50+ users.
          </p>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────── */}
      <section style={{ padding: "100px 40px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: "clamp(28px,4vw,42px)", fontWeight: 800, margin: "0 0 12px" }}>Trusted by teams worldwide</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "28px" }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                  {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="#f59e0b" style={{ color: "#f59e0b" }} />)}
                </div>
                <p style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.7, margin: "0 0 20px" }}>"{t.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{t.avatar}</div>
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

      {/* ─── CTA ─────────────────────────────────────── */}
      <section style={{ padding: "100px 40px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 24, padding: "60px 40px" }}>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, margin: "0 0 16px" }}>Ready to grow your business?</h2>
            <p style={{ fontSize: 17, color: "#94a3b8", margin: "0 0 36px", lineHeight: 1.7 }}>
              Join thousands of teams already using ARGILETTE to manage customers, close deals, and automate their growth.
            </p>
            <Link href="/register">
              <a style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 32px", background: "#3b82f6", color: "#fff", borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: "none", boxShadow: "0 0 30px rgba(59,130,246,0.3)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#60a5fa"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#3b82f6"; }}
              >Start your free trial <ArrowRight size={16} /></a>
            </Link>
            <p style={{ marginTop: 16, fontSize: 13, color: "#475569" }}>14 days free · No credit card · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "40px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><img src="/assets/logo.png" alt="ARGI CRM" style={{ height: 36, width: "auto", objectFit: "contain" }} /></div>
        <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>© 2026 ARGILETTE LLC. All rights reserved. Built by Abel Nkawula.</p>
      </footer>
    </div>
  );
}
