import { BusinessSkill } from "./types.js";

export const LEGAL_SKILLS: BusinessSkill[] = [
  {
    id: "nda-template",
    name: "NDA Template",
    domain: "legal",
    description: "Generate a non-disclosure agreement",
    prompt: `Draft a Non-Disclosure Agreement between {{party_a}} and {{party_b}}.

Purpose: {{purpose}}
NDA type: {{nda_type}}
Duration: {{duration}}
Governing law: {{governing_law}}

Include:
1. Definitions (Confidential Information, Disclosing Party, Receiving Party)
2. Obligations of Receiving Party
3. Permitted Disclosures (legal requirement, need-to-know)
4. Exclusions from Confidential Information
5. Term and Termination
6. Return or Destruction of Information
7. Remedies (injunctive relief clause)
8. General provisions (entire agreement, severability, waiver)
9. Signature blocks

Note: This is a template for review by qualified legal counsel.`,
    inputs: [
      {
        name: "party_a",
        label: "Party A (disclosing)",
        type: "text",
        required: true,
        placeholder: "ARGILETTE LLC",
      },
      {
        name: "party_b",
        label: "Party B (receiving)",
        type: "text",
        required: true,
      },
      {
        name: "purpose",
        label: "Purpose of disclosure",
        type: "text",
        required: true,
        placeholder: "Evaluating a potential partnership",
      },
      {
        name: "nda_type",
        label: "NDA type",
        type: "select",
        required: true,
        options: ["Mutual", "One-way (disclosing to receiving)", "One-way (receiving from disclosing)"],
      },
      {
        name: "duration",
        label: "Duration of confidentiality",
        type: "text",
        required: true,
        placeholder: "2 years",
      },
      {
        name: "governing_law",
        label: "Governing law / jurisdiction",
        type: "text",
        required: true,
        placeholder: "State of Delaware, USA",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["guard"],
    tags: ["NDA", "contract", "legal"],
    estimatedTokens: 700,
  },
  {
    id: "gdpr-compliance",
    name: "GDPR Compliance Checklist",
    domain: "legal",
    description: "Generate a GDPR compliance checklist for any organization",
    prompt: `Create a comprehensive GDPR compliance checklist for {{organization}}.

Organization type: {{org_type}}
Data types processed: {{data_types}}
Employees: {{employees}}
Operating in: {{countries}}
Current compliance level: {{current_level}}

Checklist organized by GDPR article:
1. Lawful basis for processing (Art. 6)
2. Consent management (Art. 7)
3. Privacy notices & transparency (Art. 13/14)
4. Data subject rights procedures (Art. 15-22):
   - Right of access
   - Right to rectification
   - Right to erasure ("right to be forgotten")
   - Right to data portability
   - Right to object
5. Data Protection by Design & Default (Art. 25)
6. Records of processing activities (Art. 30)
7. Data breach notification procedures (Art. 33/34)
8. Data Protection Impact Assessments (Art. 35)
9. International data transfers (Art. 44-49)
10. Processor agreements (Art. 28)
11. DPO appointment requirements (Art. 37)

For each item: Status (✅ Done / ⚠️ In Progress / ❌ Not Started), Priority, Owner, Deadline
Risk assessment and top 5 immediate actions.`,
    inputs: [
      {
        name: "organization",
        label: "Organization name",
        type: "text",
        required: true,
      },
      {
        name: "org_type",
        label: "Organization type",
        type: "select",
        required: true,
        options: ["SaaS/Technology", "Healthcare", "E-commerce", "Financial Services", "NGO/Nonprofit", "Other"],
      },
      {
        name: "data_types",
        label: "Types of data processed",
        type: "textarea",
        required: true,
        placeholder: "Email, name, payment info, health records",
      },
      {
        name: "employees",
        label: "Number of employees",
        type: "number",
        required: false,
      },
      {
        name: "countries",
        label: "Countries operating in",
        type: "text",
        required: true,
        placeholder: "EU, UK, US",
      },
      {
        name: "current_level",
        label: "Current compliance level",
        type: "select",
        required: true,
        options: ["Starting from scratch", "Partial compliance", "Near-compliant", "Review needed"],
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["guard"],
    tags: ["GDPR", "compliance", "privacy", "data protection"],
    estimatedTokens: 800,
  },
  {
    id: "terms-of-service",
    name: "Terms of Service",
    domain: "legal",
    description: "Draft Terms of Service for a digital product",
    prompt: `Draft Terms of Service for {{product_name}}.

Product type: {{product_type}}
Company: {{company}}
Jurisdiction: {{jurisdiction}}
Key features: {{features}}
Subscription/payment: {{payment}}

Sections:
1. Agreement to Terms
2. Description of Service
3. User Accounts & Registration
4. Acceptable Use Policy (what users may/may not do)
5. Intellectual Property Rights
6. Payment Terms & Subscriptions (if applicable)
7. Cancellation & Refunds
8. Disclaimers & Limitation of Liability
9. Indemnification
10. Privacy Policy reference
11. Third-Party Services
12. Termination
13. Governing Law & Dispute Resolution
14. Changes to Terms
15. Contact Information

Use plain language where possible. Flag any clauses that require specific legal advice.`,
    inputs: [
      {
        name: "product_name",
        label: "Product name",
        type: "text",
        required: true,
      },
      {
        name: "product_type",
        label: "Product type",
        type: "select",
        required: true,
        options: ["SaaS platform", "Mobile app", "Marketplace", "E-commerce", "API/Developer tool", "Content platform"],
      },
      {
        name: "company",
        label: "Company name & location",
        type: "text",
        required: true,
      },
      {
        name: "jurisdiction",
        label: "Governing jurisdiction",
        type: "text",
        required: true,
        placeholder: "State of Delaware, USA",
      },
      {
        name: "features",
        label: "Key product features",
        type: "textarea",
        required: true,
        placeholder: "User accounts, payments, data storage, AI features",
      },
      {
        name: "payment",
        label: "Payment/subscription details",
        type: "text",
        required: false,
        placeholder: "Monthly/annual subscription, free tier available",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["guard"],
    tags: ["terms", "ToS", "legal", "SaaS"],
    estimatedTokens: 900,
  },
  {
    id: "privacy-policy",
    name: "Privacy Policy",
    domain: "legal",
    description: "Write a GDPR/CCPA-compliant privacy policy",
    prompt: `Write a comprehensive Privacy Policy for {{company}} ({{product}}).

Data collected: {{data_collected}}
Purpose of collection: {{purposes}}
Third parties: {{third_parties}}
Users in: {{user_regions}}
Contact: {{contact}}

Privacy Policy sections:
1. Introduction & Who We Are
2. Information We Collect (categories, sources)
3. How We Use Your Information (purpose for each category)
4. Legal Basis for Processing (GDPR - EU users)
5. Sharing Your Information (third parties, why, safeguards)
6. Cookies & Tracking Technologies
7. Data Retention
8. International Transfers
9. Your Rights (GDPR: Art. 15-22 / CCPA: opt-out, deletion)
10. Children's Privacy (COPPA if applicable)
11. Security Measures
12. Changes to This Policy
13. Contact & DPO Details

Include CCPA-specific section if US users included.`,
    inputs: [
      {
        name: "company",
        label: "Company name",
        type: "text",
        required: true,
      },
      {
        name: "product",
        label: "Product/service name",
        type: "text",
        required: true,
      },
      {
        name: "data_collected",
        label: "Data types collected",
        type: "textarea",
        required: true,
        placeholder: "Name, email, usage data, payment info, IP address",
      },
      {
        name: "purposes",
        label: "Purposes for collection",
        type: "textarea",
        required: true,
        placeholder: "Account management, analytics, marketing, legal compliance",
      },
      {
        name: "third_parties",
        label: "Third-party services",
        type: "text",
        required: true,
        placeholder: "Stripe, AWS, Google Analytics, Mailchimp",
      },
      {
        name: "user_regions",
        label: "User regions",
        type: "text",
        required: true,
        placeholder: "EU, US, Africa, Global",
      },
      {
        name: "contact",
        label: "Privacy contact email",
        type: "text",
        required: true,
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["guard"],
    tags: ["privacy policy", "GDPR", "CCPA", "legal"],
    estimatedTokens: 800,
  },
  {
    id: "contract-review",
    name: "Contract Review",
    domain: "legal",
    description: "Review any contract and surface key risks",
    prompt: `Review this contract and identify key risks, obligations, and negotiation points.

Contract type: {{contract_type}}
Our role: {{our_role}}
Contract text or description: {{contract_text}}
Red lines (non-negotiable for us): {{red_lines}}
Jurisdiction: {{jurisdiction}}

Deliver:
1. Executive Summary (2-3 sentences — sign as-is, negotiate, or reject?)
2. Key Terms Summary (table: term, what it means for us)
3. Risk Analysis (each clause rated: Low / Medium / High risk)
4. Favorable clauses (things we should keep)
5. Unfavorable clauses (things we should push back on, with alternatives)
6. Missing clauses (what's not in the contract that should be)
7. Negotiation playbook:
   - Must-change items
   - Should-change items
   - Nice-to-have changes
8. Suggested redlines with alternative language
9. Questions for legal counsel

Note: AI review is preliminary — consult qualified legal counsel before signing.`,
    inputs: [
      {
        name: "contract_type",
        label: "Contract type",
        type: "select",
        required: true,
        options: ["SaaS Agreement", "Employment", "Vendor/Supplier", "Partnership", "NDA", "Enterprise License", "Service Agreement", "Investment"],
      },
      {
        name: "our_role",
        label: "Our role in contract",
        type: "select",
        required: true,
        options: ["Service Provider", "Customer/Buyer", "Employee", "Employer", "Investor", "Investee"],
      },
      {
        name: "contract_text",
        label: "Contract text or key clauses to review",
        type: "textarea",
        required: true,
      },
      {
        name: "red_lines",
        label: "Our non-negotiables",
        type: "textarea",
        required: false,
        placeholder: "Unlimited liability is unacceptable, IP ownership must stay with us",
      },
      {
        name: "jurisdiction",
        label: "Jurisdiction",
        type: "text",
        required: true,
        placeholder: "New York, USA",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["guard"],
    tags: ["contract", "legal review", "negotiation", "risk"],
    estimatedTokens: 800,
  },
  {
    id: "ip-strategy",
    name: "IP Protection Strategy",
    domain: "legal",
    description: "Plan intellectual property protection for innovations",
    prompt: `Create an IP protection strategy for {{company}}'s innovations.

Innovation description: {{innovation}}
Business stage: {{stage}}
Target markets: {{markets}}
Budget range: {{budget}}
Existing IP: {{existing_ip}}

IP Strategy:
1. IP Audit (what you have, what's protectable)
2. Patent Strategy
   - Patentable elements
   - Patent type recommendation (utility, design, provisional)
   - Key jurisdictions to file
   - Timeline and cost estimate
3. Trademark Protection
   - Brand elements to trademark
   - Classes to register in
   - Priority markets
4. Copyright considerations
5. Trade Secrets (what to keep secret vs patent)
6. Open Source considerations (if applicable)
7. Employee IP agreements needed
8. Competitor IP landscape analysis
9. IP monetization opportunities
10. Enforcement strategy

Priority actions for next 90 days.`,
    inputs: [
      {
        name: "company",
        label: "Company name",
        type: "text",
        required: true,
      },
      {
        name: "innovation",
        label: "What innovation to protect",
        type: "textarea",
        required: true,
        placeholder: "AI algorithm, brand, product design, software",
      },
      {
        name: "stage",
        label: "Business stage",
        type: "select",
        required: true,
        options: ["Idea/Pre-revenue", "Early Stage", "Growth", "Scaling", "Established"],
      },
      {
        name: "markets",
        label: "Target markets",
        type: "text",
        required: true,
        placeholder: "USA, EU, Africa, Global",
      },
      {
        name: "budget",
        label: "IP budget range",
        type: "text",
        required: false,
        placeholder: "$5,000 - $50,000",
      },
      {
        name: "existing_ip",
        label: "Existing IP assets",
        type: "text",
        required: false,
        placeholder: "Registered trademark in US, 1 provisional patent",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["guard"],
    tags: ["IP", "patent", "trademark", "legal strategy"],
    estimatedTokens: 700,
  },
];
