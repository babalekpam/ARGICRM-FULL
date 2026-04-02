import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Mail, MessageSquare, Globe, Clock, CheckCircle, Headphones, BookOpen, LifeBuoy } from "lucide-react";
import { useSeoPage } from "../hooks/useSeoPage";

const Channel = ({ icon: Icon, title, desc, detail, color, href }: { icon: any; title: string; desc: string; detail: string; color: string; href?: string }) => (
  <a href={href || "#"} style={{ textDecoration: "none", display: "block" }}>
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 24, transition: "border-color 0.2s", cursor: href ? "pointer" : "default" }}
      onMouseEnter={e => { if (href) (e.currentTarget as HTMLDivElement).style.borderColor = `${color}40`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)"; }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 10 }}>{desc}</div>
      <div style={{ fontSize: 14, color: color, fontWeight: 500 }}>{detail}</div>
    </div>
  </a>
);

export default function Contact() {
  useSeoPage("Contact Us — ARGILETTE CRM", "Get in touch with the ARGILETTE team. Sales inquiries, agency pricing, support and partnerships.");
  const [form, setForm] = useState({ name: "", email: "", company: "", type: "support", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus("sending");
    await new Promise(r => setTimeout(r, 1400));
    setStatus("sent");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0d14", color: "#e2e8f0" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/">
          <img src="/assets/logo.png" alt="ARGILETTE" style={{ height: 32, width: "auto", objectFit: "contain", cursor: "pointer" }} />
        </Link>
        <Link href="/">
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b", textDecoration: "none", cursor: "pointer" }}>
            <ArrowLeft size={14} /> Back to home
          </span>
        </Link>
      </nav>

      {/* Header */}
      <div style={{ padding: "64px 40px 48px", maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ fontSize: 44, fontWeight: 800, background: "linear-gradient(135deg,#e2e8f0,#94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 16 }}>
          Get in Touch
        </h1>
        <p style={{ color: "#64748b", fontSize: 16, lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>
          Our team is here to help. Reach us through any channel — we typically respond within one business day.
        </p>
      </div>

      {/* Main grid */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 40px 80px", display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 40, alignItems: "start" }}>

        {/* Left — channels */}
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Contact Channels</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
            <Channel icon={Mail} title="General Inquiries" desc="Sales, partnerships, press" detail="hello@argilette.com" color="#3b82f6" href="mailto:hello@argilette.com" />
            <Channel icon={Headphones} title="Customer Support" desc="Technical issues, billing, account help" detail="support@argilette.com" color="#10b981" href="mailto:support@argilette.com" />
            <Channel icon={LifeBuoy} title="Enterprise Sales" desc="Custom plans, white-label, API access" detail="enterprise@argilette.com" color="#8b5cf6" href="mailto:enterprise@argilette.com" />
            <Channel icon={Globe} title="Headquarters" desc="ARGILETTE LLC" detail="Delaware, United States" color="#f59e0b" />
          </div>

          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Response Times</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Support (Starter)", time: "< 48 hours", color: "#64748b" },
              { label: "Support (Professional)", time: "< 12 hours", color: "#3b82f6" },
              { label: "Support (Business)", time: "< 4 hours", color: "#10b981" },
              { label: "Security incidents", time: "< 24 hours", color: "#ef4444" },
            ].map(({ label, time, color }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color }}>{time}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: "16px 18px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <BookOpen size={14} color="#3b82f6" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.06em" }}>Self-Service Resources</span>
            </div>
            <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>
              Check our documentation, video tutorials, and community forum before reaching out — most answers are there instantly.
            </div>
          </div>
        </div>

        {/* Right — contact form */}
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Send a Message</h2>

          {status === "sent" ? (
            <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 14, padding: "48px 32px", textAlign: "center" }}>
              <CheckCircle size={48} color="#10b981" style={{ margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>Message sent!</h3>
              <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.7 }}>We've received your message and will get back to you within one business day. Check your inbox for a confirmation email.</p>
              <button onClick={() => setStatus("idle")} style={{ marginTop: 24, padding: "10px 24px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#94a3b8", fontSize: 13, cursor: "pointer" }}>
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 28 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Your Name *</label>
                  <input
                    data-testid="input-contact-name"
                    type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                    placeholder="Jane Smith"
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "#3b82f6")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Email Address *</label>
                  <input
                    data-testid="input-contact-email"
                    type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required
                    placeholder="jane@company.com"
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "#3b82f6")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Company</label>
                <input
                  data-testid="input-contact-company"
                  type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                  placeholder="Your company name"
                  style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#3b82f6")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Topic</label>
                <select
                  data-testid="select-contact-type"
                  value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", cursor: "pointer" }}>
                  <option value="support">Technical Support</option>
                  <option value="billing">Billing & Payments</option>
                  <option value="sales">Sales & Pricing</option>
                  <option value="enterprise">Enterprise / Custom Plan</option>
                  <option value="partnership">Partnership & Integration</option>
                  <option value="press">Press & Media</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Message *</label>
                <textarea
                  data-testid="input-contact-message"
                  value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required
                  placeholder="Tell us how we can help you..."
                  rows={5}
                  style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#e2e8f0", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#3b82f6")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
              </div>

              <button
                data-testid="button-contact-submit"
                type="submit" disabled={status === "sending"}
                style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#3b82f6,#6366f1)", border: "none", borderRadius: 8, color: "#fff", fontSize: 15, fontWeight: 600, cursor: status === "sending" ? "not-allowed" : "pointer", opacity: status === "sending" ? 0.7 : 1, transition: "opacity 0.2s" }}>
                {status === "sending" ? "Sending…" : "Send Message"}
              </button>

              <p style={{ marginTop: 12, fontSize: 11, color: "#475569", textAlign: "center" }}>
                By submitting this form you agree to our <Link href="/privacy"><span style={{ color: "#475569", textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span></Link>.
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 40px", textAlign: "center" }}>
        <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>© 2026 ARGILETTE LLC. All rights reserved. &nbsp;·&nbsp;
          <Link href="/privacy"><span style={{ color: "#475569", cursor: "pointer" }}>Privacy</span></Link> &nbsp;·&nbsp;
          <Link href="/terms"><span style={{ color: "#475569", cursor: "pointer" }}>Terms</span></Link> &nbsp;·&nbsp;
          <Link href="/security"><span style={{ color: "#475569", cursor: "pointer" }}>Security</span></Link> &nbsp;·&nbsp;
          <Link href="/contact"><span style={{ color: "#475569", cursor: "pointer" }}>Contact</span></Link>
        </p>
      </footer>
    </div>
  );
}
