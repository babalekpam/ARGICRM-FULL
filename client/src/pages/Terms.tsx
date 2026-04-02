import { Link } from "wouter";
import { ArrowLeft, FileText } from "lucide-react";

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

export default function Terms() {
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
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#8b5cf6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={20} color="#fff" />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#8b5cf6", textTransform: "uppercase", letterSpacing: "0.08em" }}>Legal</span>
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 800, background: "linear-gradient(135deg,#e2e8f0,#94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12 }}>
          Terms of Service
        </h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>Last updated: April 2, 2026 — Effective immediately</p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 40px 80px" }}>
        <Section title="1. Acceptance of Terms">
          <P>These Terms of Service ("Terms") constitute a legally binding agreement between you ("Customer", "you", or "your") and ARGILETTE LLC ("ARGILETTE", "we", "our", or "us"), governing your access to and use of the ARGILETTE CRM platform and all associated services (the "Services").</P>
          <P>By creating an account or using the Services, you affirm that you are at least 18 years of age, have the legal capacity to enter into these Terms, and agree to comply with them in full. If you are using the Services on behalf of an organization, you represent that you have authority to bind that organization to these Terms.</P>
        </Section>

        <Section title="2. Account Registration">
          <P>To access the Services, you must register for an account and provide accurate, current, and complete information. You are responsible for:</P>
          <UL items={[
            "Maintaining the confidentiality of your account credentials",
            "All activities that occur under your account",
            "Notifying us immediately of any unauthorized use of your account",
            "Ensuring your account information remains accurate and up-to-date",
          ]} />
          <P>We reserve the right to suspend or terminate accounts that provide false information or violate these Terms.</P>
        </Section>

        <Section title="3. Subscription Plans & Billing">
          <P><strong style={{ color: "#e2e8f0" }}>Subscription Fees:</strong> Access to the Services requires a paid subscription. Fees are charged in advance on a monthly or annual basis, depending on your selected plan.</P>
          <P><strong style={{ color: "#e2e8f0" }}>Payment:</strong> All payments are processed securely by Stripe. By providing payment information, you authorize us to charge the applicable fees to your payment method.</P>
          <P><strong style={{ color: "#e2e8f0" }}>Auto-Renewal:</strong> Subscriptions automatically renew at the end of each billing period unless cancelled before the renewal date.</P>
          <P><strong style={{ color: "#e2e8f0" }}>Refunds:</strong> We offer a 14-day free trial. After the trial, fees are non-refundable except where required by law. Contact <a href="mailto:billing@argilette.com" style={{ color: "#8b5cf6" }}>billing@argilette.com</a> for billing disputes.</P>
          <P><strong style={{ color: "#e2e8f0" }}>Price Changes:</strong> We may change our pricing with 30 days' notice. Continued use of the Services after a price change constitutes acceptance of the new pricing.</P>
        </Section>

        <Section title="4. Acceptable Use">
          <P>You agree not to use the Services to:</P>
          <UL items={[
            "Violate any applicable law, regulation, or third-party rights",
            "Send unsolicited bulk communications (spam) or engage in phishing",
            "Upload or transmit malicious code, viruses, or harmful content",
            "Attempt to gain unauthorized access to our systems or other users' accounts",
            "Scrape, crawl, or systematically extract data from the platform without written permission",
            "Reverse engineer, decompile, or disassemble any part of the Services",
            "Use the Services for any competitive intelligence or benchmark purposes without prior written consent",
            "Impersonate any person or entity or misrepresent your affiliation",
          ]} />
          <P>Violation of these rules may result in immediate account suspension without refund.</P>
        </Section>

        <Section title="5. Data Ownership & License">
          <P><strong style={{ color: "#e2e8f0" }}>Your Data:</strong> You retain full ownership of all data you input into the Services ("Customer Data"). You grant ARGILETTE a non-exclusive, worldwide license to use, store, and process Customer Data solely to provide the Services.</P>
          <P><strong style={{ color: "#e2e8f0" }}>Our Platform:</strong> ARGILETTE retains all rights to the platform, including software, algorithms, designs, and aggregated anonymized analytics derived from usage patterns (which do not contain your identifiable data).</P>
          <P><strong style={{ color: "#e2e8f0" }}>Data Export:</strong> You may export your Customer Data at any time in standard formats. Upon account termination, we will make your data available for export for 30 days before deletion.</P>
        </Section>

        <Section title="6. AI-Powered Features">
          <P>The Services include AI-powered features such as email generation, deal intelligence, and the Skills Library. You acknowledge that:</P>
          <UL items={[
            "AI-generated content may contain errors and should be reviewed before use",
            "You are solely responsible for any decisions made based on AI suggestions",
            "We do not guarantee the accuracy, completeness, or fitness for purpose of AI outputs",
            "AI features may be updated, modified, or discontinued at any time",
          ]} />
        </Section>

        <Section title="7. Service Availability & SLA">
          <P>We target 99.9% monthly uptime for the Services. In the event of downtime exceeding this target, you may be eligible for service credits. Planned maintenance windows will be announced at least 48 hours in advance.</P>
          <P>We reserve the right to temporarily suspend the Services for maintenance, updates, or emergency repairs without liability.</P>
        </Section>

        <Section title="8. Confidentiality">
          <P>Each party agrees to maintain the confidentiality of the other's non-public information and not to disclose it to third parties without prior written consent. This obligation survives termination of these Terms for a period of three (3) years.</P>
        </Section>

        <Section title="9. Limitation of Liability">
          <P>TO THE MAXIMUM EXTENT PERMITTED BY LAW, ARGILETTE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICES.</P>
          <P>OUR TOTAL CUMULATIVE LIABILITY TO YOU SHALL NOT EXCEED THE AMOUNTS PAID BY YOU TO ARGILETTE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.</P>
        </Section>

        <Section title="10. Termination">
          <P>Either party may terminate these Terms at any time. You may cancel your subscription through the platform settings or by contacting support. Upon termination:</P>
          <UL items={[
            "Your access to the Services will be suspended at the end of the current billing period",
            "Your Customer Data will be available for export for 30 days",
            "After 30 days, your data will be permanently deleted from our systems",
          ]} />
          <P>We may terminate your account immediately for material breach of these Terms.</P>
        </Section>

        <Section title="11. Governing Law">
          <P>These Terms shall be governed by the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Any disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.</P>
        </Section>

        <Section title="12. Changes to Terms">
          <P>We may update these Terms at any time. We will notify you by email and in-platform notification at least 30 days before material changes take effect. Your continued use of the Services after the effective date constitutes acceptance of the updated Terms.</P>
        </Section>

        <Section title="13. Contact">
          <P>For questions about these Terms, contact us at <a href="mailto:legal@argilette.com" style={{ color: "#8b5cf6" }}>legal@argilette.com</a>.</P>
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
