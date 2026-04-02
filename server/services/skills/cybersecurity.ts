import { BusinessSkill } from "./types.js";

export const CYBERSECURITY_SKILLS: BusinessSkill[] = [
  {
    id: "threat-model",
    name: "Threat Modeling",
    domain: "cybersecurity",
    description: "STRIDE threat model for any system",
    prompt: `Create a STRIDE threat model for {{system}}.

Architecture: {{architecture}}
Data sensitivity: {{data_sensitivity}}
User types: {{user_types}}
External integrations: {{integrations}}
Compliance requirements: {{compliance}}

STRIDE Analysis:
For each component/data flow, identify:

S - Spoofing (identity attacks)
T - Tampering (data integrity attacks)
R - Repudiation (denial of actions)
I - Information Disclosure (data leakage)
D - Denial of Service (availability attacks)
E - Elevation of Privilege (authorization bypass)

For each threat:
- Threat description
- Attack vector
- Likelihood (High/Medium/Low)
- Impact (High/Medium/Low)
- Risk score
- Mitigations (specific, actionable)

Output:
1. Threat inventory (all identified threats)
2. Top 10 risks prioritized by score
3. Security architecture recommendations
4. Security user stories for development backlog
5. Penetration testing scope`,
    inputs: [
      {
        name: "system",
        label: "System name",
        type: "text",
        required: true,
      },
      {
        name: "architecture",
        label: "System architecture description",
        type: "textarea",
        required: true,
      },
      {
        name: "data_sensitivity",
        label: "Data sensitivity",
        type: "select",
        required: true,
        options: ["Public", "Internal", "Confidential", "Restricted/PII", "Healthcare/Financial"],
      },
      {
        name: "user_types",
        label: "User types",
        type: "text",
        required: true,
        placeholder: "Authenticated users, admins, anonymous visitors, API clients",
      },
      {
        name: "integrations",
        label: "External integrations",
        type: "text",
        required: true,
        placeholder: "Stripe, AWS, OAuth providers, third-party APIs",
      },
      {
        name: "compliance",
        label: "Compliance requirements",
        type: "text",
        required: false,
        placeholder: "GDPR, SOC2, HIPAA, PCI-DSS",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["guard", "forge"],
    tags: ["threat model", "STRIDE", "security", "architecture"],
    estimatedTokens: 800,
  },
  {
    id: "security-audit",
    name: "Security Audit Checklist",
    domain: "cybersecurity",
    description: "Generate a comprehensive security audit checklist",
    prompt: `Create a security audit checklist for {{organization}} ({{audit_scope}}).

Organization size: {{size}}
Industry: {{industry}}
Compliance framework: {{compliance}}
Current security posture: {{current_posture}}

Audit Checklist by Domain:
1. Access Control & Identity
   - MFA enforcement
   - Privileged access management
   - Least privilege principle
   - Access reviews

2. Network Security
   - Firewall configuration
   - Network segmentation
   - VPN/Zero Trust
   - IDS/IPS

3. Data Protection
   - Encryption at rest
   - Encryption in transit
   - Data classification
   - DLP controls

4. Application Security
   - OWASP Top 10 coverage
   - Input validation
   - Authentication/session management
   - Dependency scanning

5. Cloud Security (if applicable)
   - IAM configuration
   - S3/storage bucket policies
   - Security groups
   - CloudTrail/audit logging

6. Incident Response
   - IR plan existence
   - Tabletop exercise frequency
   - SIEM/SOAR deployment

7. Third-Party/Supply Chain
   - Vendor security assessments
   - API security
   - Open source governance

8. Physical Security
9. Employee Security Training

For each item: Status, Risk level, Remediation steps, Priority`,
    inputs: [
      {
        name: "organization",
        label: "Organization name",
        type: "text",
        required: true,
      },
      {
        name: "audit_scope",
        label: "Audit scope",
        type: "text",
        required: true,
        placeholder: "Cloud infrastructure, web application, entire organization",
      },
      {
        name: "size",
        label: "Organization size",
        type: "select",
        required: true,
        options: ["1-50", "51-200", "201-1000", "1000+"],
      },
      {
        name: "industry",
        label: "Industry",
        type: "text",
        required: true,
      },
      {
        name: "compliance",
        label: "Target compliance framework",
        type: "select",
        required: true,
        options: ["SOC 2 Type II", "ISO 27001", "NIST CSF", "HIPAA", "PCI-DSS", "GDPR", "CIS Controls", "None yet"],
      },
      {
        name: "current_posture",
        label: "Current security posture",
        type: "select",
        required: true,
        options: ["Starting from scratch", "Basic controls in place", "Mature program", "Post-breach improvement"],
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["guard"],
    tags: ["security audit", "compliance", "SOC2", "ISO27001", "cybersecurity"],
    estimatedTokens: 900,
  },
  {
    id: "incident-response-plan",
    name: "Incident Response Plan",
    domain: "cybersecurity",
    description: "Build a cyber incident response plan",
    prompt: `Create a Cyber Incident Response Plan for {{company}}.

Industry: {{industry}}
Critical assets: {{assets}}
Team size (security): {{sec_team}}
Compliance requirements: {{compliance}}

IR Plan Sections:
1. Scope and Objectives
2. Incident Classification (Severity 1-4 with examples)
3. IR Team Structure
   - CSIRT roster and contacts
   - Roles: Incident Commander, Technical Lead, Communications, Legal
4. Incident Response Phases:
   a. Preparation (tools, runbooks, training)
   b. Detection & Analysis (indicators of compromise, triage)
   c. Containment (short-term and long-term)
   d. Eradication (root cause removal)
   e. Recovery (restore + validate)
   f. Post-Incident Activity (lessons learned)
5. Communication Plan
   - Internal escalation tree
   - Customer notification triggers
   - Regulatory notification (GDPR 72hr rule)
   - PR crisis communication
6. Playbooks for top 5 scenarios:
   - Ransomware
   - Data breach
   - DDoS
   - Account compromise
   - Insider threat
7. Evidence preservation procedures
8. Contact list (law enforcement, cyber insurance, forensics firms)
9. Regulatory reporting requirements`,
    inputs: [
      {
        name: "company",
        label: "Company name",
        type: "text",
        required: true,
      },
      {
        name: "industry",
        label: "Industry",
        type: "text",
        required: true,
      },
      {
        name: "assets",
        label: "Critical assets to protect",
        type: "textarea",
        required: true,
        placeholder: "Customer database, payment systems, source code, IP",
      },
      {
        name: "sec_team",
        label: "Security team size",
        type: "number",
        required: false,
      },
      {
        name: "compliance",
        label: "Compliance requirements",
        type: "text",
        required: false,
        placeholder: "GDPR, HIPAA, PCI-DSS",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["guard"],
    tags: ["incident response", "CSIRT", "cybersecurity", "breach"],
    estimatedTokens: 900,
  },
  {
    id: "pentest-plan",
    name: "Penetration Test Plan",
    domain: "cybersecurity",
    description: "Plan a penetration testing engagement",
    prompt: `Create a penetration testing plan for {{target_system}}.

Scope: {{scope}}
Test type: {{test_type}}
Timeline: {{timeline}}
Rules of engagement: {{rules}}
Out of scope: {{out_of_scope}}

Pentest Plan:
1. Scope Definition (IP ranges, domains, apps, APIs)
2. Testing Phases:
   a. Reconnaissance (passive + active)
   b. Scanning & enumeration
   c. Vulnerability assessment
   d. Exploitation (authorized only)
   e. Post-exploitation (privilege escalation, lateral movement)
   f. Reporting
3. Testing Methodologies (OWASP, PTES, NIST)
4. Tools list by phase (Nmap, Burp Suite, Metasploit, etc.)
5. Documentation requirements
6. Communication protocol (who to call if critical vuln found)
7. Deliverables (executive report + technical report + remediation guide)
8. Re-test scope (after remediation)
9. Legal authorization checklist`,
    inputs: [
      {
        name: "target_system",
        label: "Target system name",
        type: "text",
        required: true,
      },
      {
        name: "scope",
        label: "Scope (IPs, domains, applications)",
        type: "textarea",
        required: true,
      },
      {
        name: "test_type",
        label: "Test type",
        type: "select",
        required: true,
        options: ["Black box (no prior info)", "Gray box (limited info)", "White box (full access)", "Red team", "Purple team"],
      },
      {
        name: "timeline",
        label: "Testing timeline",
        type: "text",
        required: true,
        placeholder: "2 weeks",
      },
      {
        name: "rules",
        label: "Rules of engagement",
        type: "text",
        required: true,
        placeholder: "No DDoS, testing hours 9am-5pm only",
      },
      {
        name: "out_of_scope",
        label: "Out of scope",
        type: "text",
        required: false,
        placeholder: "Production payment systems, third-party SSO",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["guard", "forge"],
    tags: ["pentest", "penetration testing", "red team", "security"],
    estimatedTokens: 700,
  },
  {
    id: "zero-trust-design",
    name: "Zero Trust Architecture",
    domain: "cybersecurity",
    description: "Design a Zero Trust security model",
    prompt: `Design a Zero Trust security architecture for {{company}}.

Current network: {{current_network}}
Users: {{users}} (locations: {{locations}})
Applications: {{applications}}
Migration timeline: {{timeline}}

Zero Trust Design:
1. Zero Trust Principles Applied
   - "Never trust, always verify"
   - Least privilege access
   - Assume breach mentality
   - Microsegmentation

2. Identity Pillar
   - IAM/IdP design
   - MFA strategy
   - Conditional access policies
   - Privileged Identity Management

3. Device Pillar
   - Device compliance enforcement
   - MDM/UEM deployment
   - Certificate-based auth

4. Network Pillar
   - Software-defined perimeter
   - Microsegmentation plan
   - East-west traffic controls
   - Eliminating VPN

5. Application Pillar
   - ZTNA for app access
   - API gateway security
   - App-layer controls

6. Data Pillar
   - Data classification
   - DLP implementation
   - Encryption strategy

7. Implementation Roadmap (phases)
8. Tool recommendations (Cloudflare Access, Okta, Zscaler, etc.)
9. KPIs to measure Zero Trust maturity`,
    inputs: [
      {
        name: "company",
        label: "Company name",
        type: "text",
        required: true,
      },
      {
        name: "current_network",
        label: "Current network setup",
        type: "textarea",
        required: true,
        placeholder: "Traditional hub-and-spoke with VPN",
      },
      {
        name: "users",
        label: "Number of users",
        type: "text",
        required: true,
        placeholder: "500 employees",
      },
      {
        name: "locations",
        label: "Work locations",
        type: "text",
        required: true,
        placeholder: "Remote-first, offices in 3 cities",
      },
      {
        name: "applications",
        label: "Key applications",
        type: "textarea",
        required: true,
        placeholder: "SaaS apps, on-prem legacy, cloud workloads",
      },
      {
        name: "timeline",
        label: "Migration timeline",
        type: "text",
        required: true,
        placeholder: "12 months",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["guard", "forge"],
    tags: ["zero trust", "ZTNA", "security architecture", "IAM"],
    estimatedTokens: 800,
  },
];
