import { Link } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 40 }}>
    <h2 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", marginBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 10 }}>{title}</h2>
    <div style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.8 }}>{children}</div>
  </div>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ margin: "0 0 14px 0" }}>{children}</p>
);

const UL = ({ items }: { items: string[] }) => (
  <ul style={{ paddingLeft: 20, margin: "0 0 14px 0" }}>
    {items.map((item, i) => <li key={i} style={{ marginBottom: 6 }}>{item}</li>)}
  </ul>
);

export default function Privacy() {
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
      <div style={{ padding: "64px 40px 32px", maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={20} color="#fff" />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.08em" }}>Legal</span>
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 800, background: "linear-gradient(135deg,#e2e8f0,#94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12 }}>
          Privacy Policy
        </h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>Last updated: April 2, 2026 — Effective immediately</p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 40px 80px" }}>
        <Section title="1. Introduction">
          <P>ARGILETTE LLC ("ARGILETTE", "we", "our", or "us") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our CRM platform and related services (the "Services").</P>
          <P>By accessing or using our Services, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree with the terms of this Privacy Policy, please do not access the Services.</P>
        </Section>

        <Section title="2. Information We Collect">
          <P><strong style={{ color: "#e2e8f0" }}>Information you provide directly:</strong></P>
          <UL items={[
            "Account registration data: name, email address, company name, job title",
            "Billing information: payment card details (processed by Stripe — we never store raw card data)",
            "CRM data you input: contacts, leads, deals, notes, tasks, and communications",
            "Communications with our support team via email or in-app chat",
          ]} />
          <P><strong style={{ color: "#e2e8f0" }}>Information collected automatically:</strong></P>
          <UL items={[
            "Log data: IP address, browser type, pages visited, time and date of visits, time spent on pages",
            "Device information: hardware model, operating system version, unique device identifiers",
            "Usage data: features used, actions taken, performance metrics to improve the platform",
            "Cookies and similar tracking technologies (see Cookie Policy section below)",
          ]} />
        </Section>

        <Section title="3. How We Use Your Information">
          <P>We use the information we collect to:</P>
          <UL items={[
            "Provide, operate, and maintain our Services",
            "Process transactions and send related information, including purchase confirmations and invoices",
            "Send administrative information such as changes to our terms, conditions, and policies",
            "Respond to comments and questions and provide customer support",
            "Send promotional communications, such as product updates and feature announcements (you may opt out at any time)",
            "Monitor and analyze usage and trends to improve user experience",
            "Detect, prevent, and address technical issues and fraudulent or illegal activity",
            "Fulfill any other purpose for which you provide it",
          ]} />
        </Section>

        <Section title="4. Data Retention">
          <P>We retain your personal information for as long as your account is active or as needed to provide you Services. You may request deletion of your data at any time by contacting us at <a href="mailto:privacy@argilette.com" style={{ color: "#3b82f6" }}>privacy@argilette.com</a>. We will respond within 30 days.</P>
          <P>Some information may be retained as required by law, for fraud prevention, or for legitimate business purposes such as resolving disputes or enforcing our agreements.</P>
        </Section>

        <Section title="5. Information Sharing & Disclosure">
          <P>We do not sell, trade, or otherwise transfer your personal information to outside parties except as described below:</P>
          <UL items={[
            "Service providers: We share data with vendors who help us deliver our Services (e.g., Stripe for payments, AWS for hosting, OpenAI for AI features). These providers are contractually bound to protect your data.",
            "Business transfers: If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.",
            "Legal requirements: We may disclose information where required by law or to protect our rights, safety, and the safety of others.",
            "With your consent: We may share your information for any other purpose with your explicit consent.",
          ]} />
        </Section>

        <Section title="6. AI Features & Data Processing">
          <P>ARGILETTE uses AI models (including OpenAI GPT) to power features such as email generation, deal intelligence, meeting summarization, and the Skills Library. When you use these features:</P>
          <UL items={[
            "Your input text is sent to AI service providers for processing",
            "We do not use your CRM data to train AI models",
            "AI-generated content should be reviewed before use — we do not guarantee accuracy",
            "You retain full ownership of data you input and outputs generated from it",
          ]} />
        </Section>

        <Section title="7. Data Security">
          <P>We implement industry-standard security measures to protect your information, including encryption in transit (TLS 1.3) and at rest (AES-256), regular security audits, access controls, and employee training. However, no method of transmission over the Internet is 100% secure.</P>
        </Section>

        <Section title="8. Your Rights (GDPR / CCPA)">
          <P>Depending on your location, you may have the following rights:</P>
          <UL items={[
            "Access: Request a copy of the personal data we hold about you",
            "Rectification: Request correction of inaccurate data",
            "Erasure: Request deletion of your personal data ('right to be forgotten')",
            "Portability: Receive your data in a structured, machine-readable format",
            "Objection: Object to processing of your personal data",
            "Restriction: Request that we restrict processing of your data",
            "Opt-out of sale: California residents may opt out of the sale of personal information (we do not sell data)",
          ]} />
          <P>To exercise any of these rights, contact us at <a href="mailto:privacy@argilette.com" style={{ color: "#3b82f6" }}>privacy@argilette.com</a>.</P>
        </Section>

        <Section title="9. Cookies">
          <P>We use cookies and similar technologies to maintain user sessions, remember your preferences, and analyze platform usage. You can control cookie settings through your browser. Disabling cookies may affect platform functionality.</P>
        </Section>

        <Section title="10. Children's Privacy">
          <P>Our Services are not directed to children under the age of 16. We do not knowingly collect personal information from children. If you believe a child has provided us personal information, please contact us immediately.</P>
        </Section>

        <Section title="11. Changes to This Policy">
          <P>We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by a prominent notice on our platform at least 30 days before the change becomes effective.</P>
        </Section>

        <Section title="12. Contact Us">
          <P>For privacy-related questions or to exercise your rights, contact our Data Protection Officer:</P>
          <UL items={[
            "Email: privacy@argilette.com",
            "Address: ARGILETTE LLC, Privacy Team",
            "Response time: Within 30 business days",
          ]} />
        </Section>
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
