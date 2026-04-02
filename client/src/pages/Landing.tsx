import React, { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Users, TrendingUp, Zap, Shield, Globe, BarChart2,
  CheckCircle, ArrowRight, Star, Megaphone,
  ChevronRight, Bot, Target, DollarSign, Mail,
  Phone, Building2, Activity, Play, X, Paintbrush
} from "lucide-react";

const STATS = [
  { value: "12,000+", label: "Active teams" },
  { value: "90%", label: "Cheaper than alternatives" },
  { value: "4.9★", label: "Average rating" },
  { value: "2 min", label: "Average setup time" },
];

const FEATURES = [
  {
    icon: Users, title: "Contact & Lead Management",
    desc: "Centralize every contact and lead. Track all interactions, score prospects, and turn conversations into revenue.",
    color: "#3b82f6",
    img: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=480&q=80&fit=crop",
  },
  {
    icon: TrendingUp, title: "Visual Sales Pipeline",
    desc: "Drag-and-drop Kanban boards with 6 customizable stages. See your entire revenue pipeline at a glance.",
    color: "#8b5cf6",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=480&q=80&fit=crop",
  },
  {
    icon: Bot, title: "6 AI Employees",
    desc: "Autonomous agents for outreach, lead scoring, reply handling, closing, chat qualification, and social posting.",
    color: "#10b981",
    img: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=480&q=80&fit=crop",
  },
  {
    icon: Megaphone, title: "Email Campaigns",
    desc: "Design, schedule and send targeted email and SMS campaigns from one unified dashboard with real-time analytics.",
    color: "#f59e0b",
    img: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=480&q=80&fit=crop",
  },
  {
    icon: BarChart2, title: "Analytics & Reporting",
    desc: "Real-time dashboards showing revenue trends, team performance, campaign ROI and full pipeline health.",
    color: "#ef4444",
    img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=480&q=80&fit=crop",
  },
  {
    icon: Shield, title: "Enterprise Security",
    desc: "Multi-tenant isolation, role-based access control, audit logs and SOC 2-aligned data protection.",
    color: "#06b6d4",
    img: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=480&q=80&fit=crop",
  },
];

const STEPS = [
  { num: "01", title: "Create your workspace", desc: "Sign up in 2 minutes. Your isolated, white-labeled workspace is ready instantly.", img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=560&q=80&fit=crop" },
  { num: "02", title: "Import your contacts", desc: "Upload a CSV or connect your existing tools. All data migrates in one click.", img: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=560&q=80&fit=crop" },
  { num: "03", title: "Let AI work for you", desc: "Activate your 6 AI employees. They prospect, qualify, follow up and close — around the clock.", img: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=560&q=80&fit=crop" },
];

const PLANS = [
  { name: "Starter", price: "$69", period: "/mo", desc: "For small teams getting started", users: "5 users", contacts: "2,000 contacts", features: ["Full CRM", "Email campaigns", "Pipeline management", "Basic reporting"], color: "#3b82f6", popular: false },
  { name: "Professional", price: "$179", period: "/mo", desc: "Most popular for growing teams", users: "25 users", contacts: "10,000 contacts", features: ["Everything in Starter", "AI email generation", "Lead scoring", "Advanced analytics", "Priority support"], color: "#8b5cf6", popular: true },
  { name: "Business", price: "$349", period: "/mo", desc: "For scaling organizations", users: "Unlimited", contacts: "50,000 contacts", features: ["Everything in Pro", "White-label options", "API access", "Dedicated support", "Custom integrations"], color: "#10b981", popular: false },
];

const TESTIMONIALS = [
  {
    name: "Sarah Mitchell", role: "CTO, TechVision Inc",
    text: "We moved from HubSpot and cut our CRM costs by 70%. The AI email generation alone saves 3 hours a week per rep.",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80&fit=crop&crop=face",
  },
  {
    name: "Marcus Johnson", role: "VP Operations, HealthBridge",
    text: "The multi-tenant setup was perfect for our agency. Each client gets their own isolated workspace with full customization.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80&fit=crop&crop=face",
  },
  {
    name: "Aisha Okonkwo", role: "CEO, GreenScale",
    text: "From sign-up to first deal tracked in under 20 minutes. The cleanest CRM UI I've ever used — and we've tried them all.",
    img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&q=80&fit=crop&crop=face",
  },
];

const BRANDS = ["Salesforce", "HubSpot", "Semrush", "Apollo", "ZoomInfo", "Drift"];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveStep(s => (s + 1) % STEPS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: "#080d1a", color: "#f1f5f9", fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: "100vh", overflowX: "hidden" }}>

      {/* ─── Navbar ─────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        padding: "0 40px",
        background: scrolled ? "rgba(8,13,26,0.97)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "none",
        transition: "all 0.3s ease",
        height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <img src="/assets/logo.png" alt="ARGILETTE" style={{ height: 44, width: "auto", objectFit: "contain" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          {["Features", "How it works", "Pricing"].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500, textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f1f5f9")}
              onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
            >{l}</a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/login">
            <a style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8", textDecoration: "none", padding: "8px 16px" }}>Sign in</a>
          </Link>
          <Link href="/register">
            <a style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", background: "#3b82f6", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#2563eb")}
              onMouseLeave={e => (e.currentTarget.style.background = "#3b82f6")}
            >Get started free <ArrowRight size={14} /></a>
          </Link>
        </div>
      </nav>

      {/* ─── HERO ───────────────────────────────────────────── */}
      <section ref={heroRef} style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
        {/* Full-bleed background image with dark overlay */}
        <div style={{ position: "absolute", inset: 0 }}>
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&q=85&fit=crop"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(8,13,26,0.93) 0%, rgba(8,13,26,0.82) 50%, rgba(8,13,26,0.90) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 60% at 30% 50%, rgba(59,130,246,0.12) 0%, transparent 60%)" }} />
        </div>

        {/* Grid overlay */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "120px 40px 100px", textAlign: "center" }}>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 999, fontSize: 13, fontWeight: 600, color: "#60a5fa", marginBottom: 32 }}>
            <Zap size={13} fill="#60a5fa" /> AI-Powered B2B Intelligence Platform
          </div>

          <h1 style={{ fontSize: "clamp(38px,6vw,80px)", fontWeight: 800, lineHeight: 1.08, margin: "0 0 28px", letterSpacing: "-0.03em", maxWidth: 900 }}>
            Close more deals with<br />
            <span style={{ background: "linear-gradient(135deg,#60a5fa 0%,#818cf8 50%,#a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              AI working 24/7
            </span>{" "}for you
          </h1>

          <p style={{ fontSize: "clamp(16px,2vw,20px)", color: "#94a3b8", lineHeight: 1.7, maxWidth: 620, margin: "0 auto 48px" }}>
            CRM + SEO + Email Campaigns + 6 AI Employees — everything your revenue team needs in one platform. 90% cheaper than piecing it together.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
            <Link href="/register">
              <a style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "15px 30px", background: "#3b82f6", color: "#fff", borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: "none", boxShadow: "0 0 40px rgba(59,130,246,0.35)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 50px rgba(59,130,246,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#3b82f6"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 0 40px rgba(59,130,246,0.35)"; }}
              >Start free 14-day trial <ArrowRight size={16} /></a>
            </Link>
            <Link href="/login">
              <a style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 28px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#f1f5f9", borderRadius: 10, fontSize: 16, fontWeight: 600, textDecoration: "none", backdropFilter: "blur(10px)", transition: "all 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
              ><Play size={15} /> View demo</a>
            </Link>
          </div>

          <p style={{ fontSize: 13, color: "#475569" }}>No credit card required &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; Setup in 2 minutes</p>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 0, marginTop: 64, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", background: "rgba(13,20,38,0.7)" }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ padding: "20px 36px", borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ width: 1, height: 48, background: "linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)", animation: "pulse 2s infinite" }} />
        </div>
      </section>

      {/* ─── DASHBOARD PREVIEW ──────────────────────────────── */}
      <section style={{ padding: "80px 40px", background: "linear-gradient(180deg, #080d1a 0%, #0a1020 100%)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#3b82f6", textTransform: "uppercase", marginBottom: 10 }}>THE PLATFORM</div>
            <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 800, margin: "0 0 14px" }}>Your entire revenue stack — one screen</h2>
            <p style={{ fontSize: 16, color: "#64748b", maxWidth: 500, margin: "0 auto" }}>Built for modern B2B teams who need speed, intelligence and control.</p>
          </div>

          {/* Main dashboard image */}
          <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 40px 120px rgba(0,0,0,0.6), 0 0 80px rgba(59,130,246,0.08)" }}>
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=85&fit=crop"
              alt="ARGILETTE CRM Dashboard"
              style={{ width: "100%", display: "block", maxHeight: 480, objectFit: "cover" }}
            />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(8,13,26,0.5) 0%, transparent 60%)" }} />
            {/* Floating badge */}
            <div style={{ position: "absolute", bottom: 24, left: 24, display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "rgba(8,13,26,0.85)", backdropFilter: "blur(16px)", borderRadius: 12, border: "1px solid rgba(59,130,246,0.25)" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>AI Agents running live</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUSTED BY (Logo bar) ───────────────────────────── */}
      <section style={{ padding: "40px", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: "#475569", textTransform: "uppercase", marginBottom: 28 }}>REPLACES TOOLS LIKE</p>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 40, flexWrap: "wrap" }}>
            {BRANDS.map(b => (
              <span key={b} style={{ fontSize: 15, fontWeight: 700, color: "#334155", letterSpacing: "-0.01em" }}>{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ───────────────────────────────────────── */}
      <section id="features" style={{ padding: "100px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#3b82f6", textTransform: "uppercase", marginBottom: 12 }}>FEATURES</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, margin: "0 0 16px" }}>Everything you need to close more deals</h2>
            <p style={{ fontSize: 17, color: "#94a3b8", maxWidth: 540, margin: "0 auto" }}>Replace 6 separate tools with one unified platform and save thousands per month.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, overflow: "hidden", transition: "all 0.25s", cursor: "default" }}
                  onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${f.color}40`; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 20px 50px rgba(0,0,0,0.4), 0 0 30px ${f.color}12`; }}
                  onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {/* Feature image */}
                  <div style={{ height: 180, overflow: "hidden", position: "relative" }}>
                    <img src={f.img} alt={f.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }}
                      onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
                      onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                    />
                    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${f.color}20, transparent 60%)` }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, background: "linear-gradient(to top, #0d1426, transparent)" }} />
                  </div>
                  {/* Feature content */}
                  <div style={{ padding: "24px" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${f.color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                      <Icon size={20} style={{ color: f.color }} />
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>{f.title}</h3>
                    <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: "100px 40px", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#10b981", textTransform: "uppercase", marginBottom: 12 }}>HOW IT WORKS</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, margin: "0 0 16px" }}>Up and running in minutes</h2>
            <p style={{ fontSize: 17, color: "#94a3b8", maxWidth: 480, margin: "0 auto" }}>Three simple steps to transform your sales process with AI.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
            {/* Steps list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {STEPS.map((step, i) => (
                <div key={i}
                  onClick={() => setActiveStep(i)}
                  style={{
                    padding: "24px 28px",
                    borderRadius: 16,
                    cursor: "pointer",
                    border: `1px solid ${activeStep === i ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.05)"}`,
                    background: activeStep === i ? "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.05))" : "rgba(13,20,38,0.5)",
                    transition: "all 0.25s",
                  }}
                >
                  <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: activeStep === i ? "#3b82f6" : "#334155", letterSpacing: "0.05em", flexShrink: 0, paddingTop: 2 }}>{step.num}</div>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 6px", color: activeStep === i ? "#f1f5f9" : "#94a3b8" }}>{step.title}</h3>
                      <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  {activeStep === i && (
                    <div style={{ marginTop: 16, height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "linear-gradient(90deg,#3b82f6,#8b5cf6)", borderRadius: 2, animation: "progress 4s linear" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Step image */}
            <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 30px 80px rgba(0,0,0,0.5)", position: "relative" }}>
              <img
                src={STEPS[activeStep].img}
                alt={STEPS[activeStep].title}
                style={{ width: "100%", height: 400, objectFit: "cover", display: "block", transition: "opacity 0.3s" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(8,13,26,0.6) 0%, transparent 50%)" }} />
              <div style={{ position: "absolute", bottom: 20, left: 20, right: 20 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "rgba(8,13,26,0.85)", backdropFilter: "blur(16px)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#10b981" }}>Step {activeStep + 1} of {STEPS.length}</span>
                  <span style={{ fontSize: 13, color: "#64748b" }}>· {STEPS[activeStep].title}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── AI AGENTS HIGHLIGHT ────────────────────────────── */}
      <section style={{ padding: "100px 40px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <img
            src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1400&q=80&fit=crop"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.15 }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(8,13,26,0.97) 0%, rgba(8,13,26,0.85) 100%)" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#10b981", textTransform: "uppercase", marginBottom: 16 }}>AI EMPLOYEES</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, margin: "0 0 20px", lineHeight: 1.15 }}>
              6 AI agents working{" "}
              <span style={{ background: "linear-gradient(135deg,#10b981,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                while you sleep
              </span>
            </h2>
            <p style={{ fontSize: 16, color: "#94a3b8", lineHeight: 1.75, marginBottom: 36 }}>
              Autonomous AI agents handle your entire sales workflow — from prospecting to closing. Each one is purpose-built and learns from your data.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { name: "Social Author", icon: Megaphone, color: "#3b82f6" },
                { name: "SDR Outreach", icon: Mail, color: "#8b5cf6" },
                { name: "Reply Handler", icon: Activity, color: "#10b981" },
                { name: "Closer Agent", icon: Target, color: "#f59e0b" },
                { name: "Chat Qualifier", icon: Phone, color: "#ef4444" },
                { name: "Lead Scorer", icon: TrendingUp, color: "#06b6d4" },
              ].map((agent, i) => {
                const Icon = agent.icon;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "rgba(13,20,38,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: `${agent.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={15} style={{ color: agent.color }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1" }}>{agent.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 30px 100px rgba(0,0,0,0.6)" }}>
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=640&q=85&fit=crop"
              alt="AI Sales Team"
              style={{ width: "100%", height: 460, objectFit: "cover", display: "block" }}
            />
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ───────────────────────────────────── */}
      <section style={{ padding: "100px 40px", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 2, marginBottom: 16 }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={20} fill="#f59e0b" style={{ color: "#f59e0b" }} />)}
            </div>
            <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, margin: "0 0 10px" }}>Trusted by 12,000+ teams worldwide</h2>
            <p style={{ fontSize: 16, color: "#64748b" }}>Real reviews from real customers.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: "#0d1426", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: "28px", transition: "all 0.25s" }}
                onMouseEnter={e => { e.currentTarget.style.border = "1px solid rgba(59,130,246,0.2)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ display: "flex", gap: 2, marginBottom: 18 }}>
                  {[...Array(5)].map((_, j) => <Star key={j} size={13} fill="#f59e0b" style={{ color: "#f59e0b" }} />)}
                </div>
                <p style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.75, margin: "0 0 24px", fontStyle: "italic" }}>"{t.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img src={t.img} alt={t.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(59,130,246,0.3)" }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: "100px 40px" }}>
        <div style={{ maxWidth: 1050, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#8b5cf6", textTransform: "uppercase", marginBottom: 12 }}>PRICING</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, margin: "0 0 16px" }}>Simple, transparent pricing</h2>
            <p style={{ fontSize: 17, color: "#94a3b8" }}>Start free. No credit card needed. Cancel anytime.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 20 }}>
            {PLANS.map(plan => (
              <div key={plan.name} style={{
                background: plan.popular ? "linear-gradient(180deg, rgba(139,92,246,0.12), rgba(59,130,246,0.06))" : "#0d1426",
                border: `1.5px solid ${plan.popular ? "#8b5cf6" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 20, padding: "36px",
                position: "relative",
                transform: plan.popular ? "scale(1.03)" : "none",
                boxShadow: plan.popular ? "0 30px 80px rgba(139,92,246,0.15)" : "none",
              }}>
                {plan.popular && (
                  <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 999, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    MOST POPULAR
                  </div>
                )}
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>{plan.name}</h3>
                <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 24px" }}>{plan.desc}</p>
                <div style={{ marginBottom: 28 }}>
                  <span style={{ fontSize: 52, fontWeight: 800, color: plan.color }}>{plan.price}</span>
                  <span style={{ fontSize: 16, color: "#64748b" }}>{plan.period}</span>
                </div>
                <div style={{ marginBottom: 24, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[plan.users, plan.contacts].map(t => (
                    <span key={t} style={{ fontSize: 12, fontWeight: 600, padding: "5px 10px", background: "rgba(255,255,255,0.06)", borderRadius: 6, color: "#94a3b8" }}>{t}</span>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 28 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14, color: "#94a3b8" }}>
                      <CheckCircle size={14} style={{ color: plan.color, flexShrink: 0 }} />{f}
                    </div>
                  ))}
                </div>
                <Link href="/register">
                  <a style={{ display: "block", textAlign: "center", padding: "13px", background: plan.popular ? "#8b5cf6" : "rgba(255,255,255,0.07)", color: "#fff", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none", border: plan.popular ? "none" : "1px solid rgba(255,255,255,0.12)", transition: "opacity 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >Get started free</a>
                </Link>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", marginTop: 36, fontSize: 14, color: "#475569" }}>
            All plans include a 14-day free trial. Enterprise pricing available — <a href="mailto:abel@argilette.com" style={{ color: "#60a5fa", textDecoration: "none" }}>contact us</a>.
          </p>
        </div>
      </section>

      {/* ─── FINAL CTA ──────────────────────────────────────── */}
      <section style={{ padding: "80px 40px 120px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0 }}>
          <img
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1400&q=80&fit=crop"
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.12 }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(8,13,26,0.97), rgba(8,13,26,0.93))" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))", border: "1px solid rgba(59,130,246,0.18)", borderRadius: 28, padding: "72px 48px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", color: "#3b82f6", textTransform: "uppercase", marginBottom: 20 }}>GET STARTED TODAY</div>
            <h2 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, margin: "0 0 18px", lineHeight: 1.15 }}>
              Your team's unfair<br />competitive advantage
            </h2>
            <p style={{ fontSize: 17, color: "#94a3b8", margin: "0 0 40px", lineHeight: 1.7 }}>
              Join 12,000+ teams already using ARGILETTE to manage customers, close deals, and automate their growth — at a fraction of the cost.
            </p>
            <Link href="/register">
              <a style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 36px", background: "#3b82f6", color: "#fff", borderRadius: 10, fontSize: 17, fontWeight: 700, textDecoration: "none", boxShadow: "0 0 50px rgba(59,130,246,0.3)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#3b82f6"; e.currentTarget.style.transform = "none"; }}
              >Start your free trial <ArrowRight size={18} /></a>
            </Link>
            <p style={{ marginTop: 18, fontSize: 13, color: "#475569" }}>14 days free · No credit card · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ─── WHITE LABEL / AGENCY ────────────────────────────── */}
      <section style={{ padding: "96px 40px", background: "linear-gradient(180deg, #080d1a 0%, #0d1224 100%)", position: "relative", overflow: "hidden" }}>
        {/* Background decoration */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)", pointerEvents: "none" }}/>
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>

          {/* Badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", fontSize: 12, fontWeight: 600, color: "#818cf8" }}>
              <Paintbrush size={13}/> WHITE LABEL &amp; AGENCY
            </div>
          </div>

          <h2 style={{ textAlign: "center", fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, color: "#f1f5f9", marginBottom: 16, lineHeight: 1.2 }}>
            Sell it as your own.<br/>
            <span style={{ background: "linear-gradient(90deg,#6366f1,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Keep 100% of the revenue.</span>
          </h2>
          <p style={{ textAlign: "center", fontSize: 17, color: "#64748b", maxWidth: 580, margin: "0 auto 60px" }}>
            Agencies and resellers can white-label ARGILETTE CRM under their own brand — logo, colours, domain, emails. Your clients never see our name.
          </p>

          {/* Feature grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20, marginBottom: 60 }}>
            {[
              { icon: "🎨", color: "#6366f1", title: "Full brand replacement", desc: "Your logo, your colours, your favicon. Every pixel matches your brand identity." },
              { icon: "🌐", color: "#3b82f6", title: "Custom domain", desc: "Point crm.yourcompany.com to your workspace. SSL provisioned automatically." },
              { icon: "✉️", color: "#10b981", title: "Branded emails", desc: "Welcome, invite, and receipt emails all sent from your company name and domain." },
              { icon: "🏢", color: "#f59e0b", title: "Isolated workspaces", desc: "Each client gets their own secure, isolated environment. No data bleed." },
              { icon: "💰", color: "#8b5cf6", title: "Your pricing, your margin", desc: "We charge you wholesale. You set your own price and keep the difference." },
              { icon: "🔧", color: "#06b6d4", title: "API access", desc: "Connect to your existing client portals, reporting dashboards, or billing systems." },
            ].map(f => (
              <div key={f.title} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "24px 22px" }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Comparison */}
          <div style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 16, padding: "36px 40px", marginBottom: 52 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 32, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", letterSpacing: "0.08em", marginBottom: 16 }}>WITHOUT WHITE LABEL</div>
                {["Your clients see ARGILETTE branding", "ARGILETTE support contact shown", "Our name in emails and documents", "Limited to argilette.org domain"].map(t => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, fontSize: 13, color: "#64748b" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: "#f87171", fontSize: 10, fontWeight: 700 }}>✕</span>
                    </div>
                    {t}
                  </div>
                ))}
              </div>
              <div style={{ width: 1, height: 120, background: "rgba(255,255,255,0.08)" }}/>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981", letterSpacing: "0.08em", marginBottom: 16 }}>WITH WHITE LABEL</div>
                {["Your logo and brand everywhere", "Your support email on every screen", "Your name in all transactional emails", "crm.yourdomain.com with SSL"].map(t => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, fontSize: 13, color: "#94a3b8" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CheckCircle size={9} color="#4ade80"/>
                    </div>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Agency pricing card */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20, marginBottom: 52 }}>
            {[
              { name: "Agency Starter", price: "$499", period: "/mo", seats: "Up to 10 client workspaces", highlight: false,
                features: ["Full white-label", "Custom domain per workspace", "Branded emails", "Priority support", "Agency dashboard"] },
              { name: "Agency Pro", price: "$999", period: "/mo", seats: "Up to 30 client workspaces", highlight: true,
                features: ["Everything in Starter", "API access", "Custom onboarding flow", "Dedicated account manager", "SLA guarantee", "Volume discounts"] },
              { name: "Enterprise", price: "Custom", period: "", seats: "Unlimited workspaces", highlight: false,
                features: ["Unlimited white-label seats", "On-premise option", "Custom contract", "Co-branding available", "Revenue share model"] },
            ].map(plan => (
              <div key={plan.name} style={{ background: plan.highlight ? "linear-gradient(145deg,rgba(99,102,241,0.15),rgba(139,92,246,0.08))" : "rgba(255,255,255,0.025)", border: `1px solid ${plan.highlight ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: "28px 24px", position: "relative" }}>
                {plan.highlight && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 100, whiteSpace: "nowrap" }}>MOST POPULAR</div>}
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{plan.name}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 16 }}>{plan.seats}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
                  <span style={{ fontSize: 34, fontWeight: 800, color: "#f1f5f9" }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: "#64748b" }}>{plan.period}</span>
                </div>
                {plan.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9, fontSize: 13, color: "#94a3b8" }}>
                    <CheckCircle size={12} color="#6366f1"/>{f}
                  </div>
                ))}
                <Link href="/contact">
                  <a style={{ display: "block", textAlign: "center", marginTop: 20, padding: "10px", borderRadius: 8, background: plan.highlight ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(99,102,241,0.1)", color: plan.highlight ? "#fff" : "#818cf8", border: plan.highlight ? "none" : "1px solid rgba(99,102,241,0.3)", fontSize: 13, fontWeight: 600, textDecoration: "none", cursor: "pointer" }}>
                    {plan.price === "Custom" ? "Contact sales" : "Get started"}
                  </a>
                </Link>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#475569", marginBottom: 20 }}>Already a Business or Enterprise customer? White-label is included — just go to <strong style={{ color: "#818cf8" }}>Settings → White Label</strong> to activate it.</p>
            <Link href="/contact">
              <a style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 32px", borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                Talk to our agency team <ArrowRight size={16}/>
              </a>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "48px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div>
            <img src="/assets/logo.png" alt="ARGILETTE" style={{ height: 36, width: "auto", objectFit: "contain", marginBottom: 8, display: "block" }} />
            <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>© 2026 ARGILETTE LLC. All rights reserved.</p>
          </div>
          <div style={{ display: "flex", gap: 28 }}>
            {[
              { label: "Privacy", path: "/privacy" },
              { label: "Terms", path: "/terms" },
              { label: "Security", path: "/security" },
              { label: "Contact", path: "/contact" },
            ].map(({ label, path }) => (
              <Link key={label} href={path}>
                <span style={{ fontSize: 13, color: "#475569", textDecoration: "none", cursor: "pointer" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLSpanElement).style.color = "#94a3b8")}
                  onMouseLeave={e => ((e.currentTarget as HTMLSpanElement).style.color = "#475569")}
                >{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes progress {
          from { width: 0% }
          to { width: 100% }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3 }
          50% { opacity: 1 }
        }
      `}</style>
    </div>
  );
}
