import { Link } from "wouter";
import { ArrowLeft, Lock, Server, Eye, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";

const Pillar = ({ icon: Icon, title, color, items }: { icon: any; title: string; color: string; items: string[] }) => (
  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 24, marginBottom: 20 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={18} color={color} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{title}</h3>
    </div>
    <ul style={{ paddingLeft: 18, margin: 0, color: "#94a3b8", fontSize: 14, lineHeight: 1.8 }}>
      {items.map((item, i) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
    </ul>
  </div>
);

const Cert = ({ name, desc, color }: { name: string; desc: string; color: string }) => (
  <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}30`, borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
    <CheckCircle size={18} color={color} />
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{name}</div>
      <div style={{ fontSize: 12, color: "#64748b" }}>{desc}</div>
    </div>
  </div>
);

export default function Security() {
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
      <div style={{ padding: "64px 40px 48px", maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Lock size={28} color="#fff" />
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 800, background: "linear-gradient(135deg,#e2e8f0,#94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 16 }}>
          Security at ARGILETTE
        </h1>
        <p style={{ color: "#64748b", fontSize: 16, lineHeight: 1.7, maxWidth: 580, margin: "0 auto" }}>
          Enterprise-grade security is built into every layer of our platform. Your data is protected by the same standards trusted by Fortune 500 companies.
        </p>
      </div>

      {/* Certifications */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 40px 48px" }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Compliance & Certifications</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          <Cert name="SOC 2 Type II" desc="Annual third-party audits" color="#3b82f6" />
          <Cert name="GDPR Compliant" desc="EU data protection standards" color="#8b5cf6" />
          <Cert name="CCPA Compliant" desc="California privacy rights" color="#10b981" />
          <Cert name="ISO 27001" desc="Information security management" color="#f59e0b" />
          <Cert name="HIPAA Ready" desc="Healthcare data controls" color="#ef4444" />
          <Cert name="PCI DSS" desc="Payment data security via Stripe" color="#06b6d4" />
        </div>
      </div>

      {/* Security Pillars */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 40px 60px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", marginBottom: 24 }}>Our Security Pillars</h2>

        <Pillar icon={Lock} title="Encryption" color="#3b82f6" items={[
          "All data in transit protected with TLS 1.3 — no legacy SSL/TLS versions accepted",
          "All data at rest encrypted with AES-256 using AWS KMS-managed keys",
          "Database backups encrypted with separate key rotation policies",
          "End-to-end encryption for sensitive fields (passwords hashed with bcrypt + salt)",
        ]} />

        <Pillar icon={Server} title="Infrastructure" color="#10b981" items={[
          "Hosted on AWS with multi-region redundancy across US-East and EU-West",
          "Infrastructure as Code (IaC) — all changes audited and version-controlled",
          "Automated vulnerability scanning on every code deployment via CI/CD pipeline",
          "Web Application Firewall (WAF) with DDoS protection at the edge",
          "Isolated production environments with strict network segmentation",
          "Daily automated backups with 30-day point-in-time recovery",
        ]} />

        <Pillar icon={Eye} title="Access Controls" color="#8b5cf6" items={[
          "Role-based access control (RBAC) — users only see what their role permits",
          "Multi-factor authentication (MFA) available for all accounts",
          "Single Sign-On (SSO) support via SAML 2.0 and OAuth 2.0",
          "Zero-trust network access — all internal service calls authenticated",
          "Privileged access management with time-limited admin sessions",
          "Comprehensive audit logs for all data access and administrative actions",
        ]} />

        <Pillar icon={RefreshCw} title="Incident Response" color="#f59e0b" items={[
          "24/7 automated security monitoring with real-time alerting",
          "Security Operations Center (SOC) with 15-minute response SLA for critical incidents",
          "Documented incident response plan tested quarterly with tabletop exercises",
          "Customer notification within 72 hours of any confirmed data breach (GDPR requirement)",
          "Post-incident reports shared with affected customers upon request",
        ]} />

        <Pillar icon={AlertTriangle} title="Vulnerability Management" color="#ef4444" items={[
          "Responsible disclosure program — report vulnerabilities to security@argilette.com",
          "Regular penetration testing by independent third-party security firms",
          "Dependency scanning and automated patching for known CVEs",
          "Static Application Security Testing (SAST) on every pull request",
          "Bug bounty program for responsible disclosure of critical vulnerabilities",
        ]} />
      </div>

      {/* Reporting */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 40px 80px" }}>
        <div style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.08))", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 16, padding: "32px 36px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", marginBottom: 8 }}>Report a Security Vulnerability</h2>
          <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            We take security reports seriously and respond to all submissions within 24 hours. If you discover a potential vulnerability, please disclose it responsibly.
          </p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Security Contact</div>
              <a href="mailto:security@argilette.com" style={{ color: "#e2e8f0", fontSize: 15, textDecoration: "none" }}>security@argilette.com</a>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>PGP Key</div>
              <span style={{ color: "#64748b", fontSize: 14 }}>Available on request</span>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Response Time</div>
              <span style={{ color: "#e2e8f0", fontSize: 14 }}>24 hours</span>
            </div>
          </div>
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
