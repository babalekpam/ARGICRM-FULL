import { BusinessSkill } from "./types.js";

export const IT_SKILLS: BusinessSkill[] = [
  {
    id: "incident-postmortem",
    name: "Incident Post-Mortem",
    domain: "it",
    description: "Write a blameless post-mortem for any system incident",
    prompt: `Write a blameless post-mortem for this incident at {{company}}.

Incident: {{summary}}
Severity: {{severity}} | Start: {{start_time}} | Resolved: {{resolution_time}}
Impact: {{user_impact}}
Root cause: {{root_cause}}
Timeline: {{timeline}}

Post-Mortem:
1. Executive Summary (what happened, impact, resolution)
2. Impact Assessment (users affected, revenue lost, SLA breach?)
3. Timeline (chronological, precise, blameless language)
4. Root Cause Analysis (5 Whys)
5. Contributing Factors (systemic — not people)
6. What Went Well
7. What Went Wrong (monitoring gaps, process gaps)
8. Action Items (minimum 5 — specific, owned, time-bound)
9. Lessons Learned

Blameless tone throughout. Never name individuals as root cause.`,
    inputs: [
      {
        name: "company",
        label: "Company/team",
        type: "text",
        required: true,
      },
      {
        name: "summary",
        label: "Incident summary",
        type: "textarea",
        required: true,
      },
      {
        name: "severity",
        label: "Severity",
        type: "select",
        required: true,
        options: ["SEV-1 (Critical/All-down)", "SEV-2 (Major degradation)", "SEV-3 (Minor)", "SEV-4 (Cosmetic)"],
      },
      {
        name: "start_time",
        label: "Start time",
        type: "text",
        required: true,
      },
      {
        name: "resolution_time",
        label: "Resolution time",
        type: "text",
        required: true,
      },
      {
        name: "user_impact",
        label: "User impact",
        type: "textarea",
        required: true,
      },
      {
        name: "root_cause",
        label: "Root cause (initial)",
        type: "textarea",
        required: true,
      },
      {
        name: "timeline",
        label: "Timeline of events",
        type: "textarea",
        required: false,
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["forge", "ops"],
    tags: ["incident", "post-mortem", "SRE", "DevOps"],
    estimatedTokens: 700,
  },
  {
    id: "architecture-review",
    name: "Architecture Review",
    domain: "it",
    description: "Review and critique a system architecture",
    prompt: `Review the architecture for {{system}} and provide expert analysis.

Architecture: {{architecture}}
Scale: {{scale}} | Tech stack: {{tech_stack}}
Pain points: {{pain_points}} | Budget: {{budget}}

Review:
1. Scalability (horizontal vs vertical, bottlenecks, SPOFs)
2. Reliability (redundancy, failover, RTO/RPO)
3. Security (auth, encryption, network, secrets)
4. Performance (latency, caching, CDN)
5. Cost efficiency (over-provisioning, reserved vs on-demand)
6. Maintainability (observability, deployment complexity, on-call burden)
7. Prioritized recommendations (impact vs effort matrix)
8. Architecture diagram suggestions

For each finding: severity (Critical/High/Medium/Low) and fix effort.`,
    inputs: [
      {
        name: "system",
        label: "System name",
        type: "text",
        required: true,
      },
      {
        name: "architecture",
        label: "Architecture description",
        type: "textarea",
        required: true,
      },
      {
        name: "scale",
        label: "Scale requirements",
        type: "text",
        required: true,
        placeholder: "100k users, 5M req/day",
      },
      {
        name: "tech_stack",
        label: "Tech stack",
        type: "text",
        required: true,
      },
      {
        name: "pain_points",
        label: "Current pain points",
        type: "textarea",
        required: false,
      },
      {
        name: "budget",
        label: "Budget constraints",
        type: "text",
        required: false,
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["forge"],
    tags: ["architecture", "system design", "review"],
    estimatedTokens: 800,
  },
  {
    id: "cicd-pipeline",
    name: "CI/CD Pipeline Design",
    domain: "it",
    description: "Design a complete CI/CD pipeline",
    prompt: `Design a CI/CD pipeline for {{project}}.

Stack: {{tech_stack}} | Cloud: {{cloud}} | Envs: {{environments}}
Team size: {{team_size}} | Deploy target: {{frequency}}

Pipeline Design:
1. Branch strategy (trunk-based vs GitFlow recommendation)
2. Pipeline stages:
   a. Source → PR rules, required reviewers, branch protection
   b. Build → compile, Docker image, artifact storage
   c. Test → unit, integration, E2E, performance thresholds
   d. Security scan → SAST, dependency check, image scan
   e. Staging → deploy + smoke tests + manual gate
   f. Production → strategy: {{deploy_strategy}}
   g. Post-deploy → health checks, rollback trigger
3. Tool recommendations (CI platform, secrets, monitoring)
4. Feature flag integration
5. Rollback procedure
6. Starter GitHub Actions YAML

Optimize for: {{priority}}`,
    inputs: [
      {
        name: "project",
        label: "Project name",
        type: "text",
        required: true,
      },
      {
        name: "tech_stack",
        label: "Tech stack",
        type: "text",
        required: true,
      },
      {
        name: "cloud",
        label: "Cloud provider",
        type: "select",
        required: true,
        options: ["AWS", "Google Cloud", "Azure", "DigitalOcean", "Hetzner", "Vercel", "Self-hosted"],
      },
      {
        name: "environments",
        label: "Environments",
        type: "text",
        required: true,
        placeholder: "dev, staging, production",
      },
      {
        name: "team_size",
        label: "Team size",
        type: "number",
        required: false,
      },
      {
        name: "frequency",
        label: "Deployment frequency target",
        type: "text",
        required: true,
        placeholder: "Multiple times daily",
      },
      {
        name: "deploy_strategy",
        label: "Deployment strategy",
        type: "select",
        required: true,
        options: ["Blue/Green", "Canary", "Rolling", "Recreate"],
      },
      {
        name: "priority",
        label: "Optimize for",
        type: "select",
        required: true,
        options: ["Speed", "Safety (zero-downtime)", "Cost"],
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["forge"],
    tags: ["CI/CD", "DevOps", "pipeline", "automation"],
    estimatedTokens: 800,
  },
  {
    id: "api-documentation",
    name: "API Documentation",
    domain: "it",
    description: "Write complete API documentation",
    prompt: `Write comprehensive API documentation for {{api_name}}.

Base URL: {{base_url}} | Auth: {{auth}}
Endpoints: {{endpoints}} | Audience: {{audience}}

Documentation:
1. Getting Started (3-step quickstart)
2. Authentication guide + code examples (JS, Python, cURL)
3. For each endpoint:
   - Method, path, description
   - Parameters (path/query/body) with types & validation
   - Request example (JSON)
   - Response codes + examples (200, 400, 401, 403, 404, 429, 500)
   - Rate limits + idempotency notes
4. Error handling guide
5. Webhook documentation (if applicable: {{webhooks}})
6. SDK recommendations
7. Changelog template
8. FAQ section`,
    inputs: [
      {
        name: "api_name",
        label: "API name",
        type: "text",
        required: true,
      },
      {
        name: "base_url",
        label: "Base URL",
        type: "text",
        required: true,
      },
      {
        name: "auth",
        label: "Authentication",
        type: "select",
        required: true,
        options: ["API Key (header)", "Bearer JWT", "OAuth 2.0", "Basic Auth", "API Key (query)"],
      },
      {
        name: "endpoints",
        label: "Endpoints to document",
        type: "textarea",
        required: true,
        placeholder: "GET /contacts, POST /contacts, DELETE /contacts/:id",
      },
      {
        name: "audience",
        label: "Audience",
        type: "select",
        required: true,
        options: ["External developers", "Internal engineers", "Partners", "Enterprise clients"],
      },
      {
        name: "webhooks",
        label: "Webhook events",
        type: "text",
        required: false,
        placeholder: "contact.created, deal.won",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["forge"],
    tags: ["API", "docs", "developer", "OpenAPI"],
    estimatedTokens: 900,
  },
  {
    id: "tech-debt-analysis",
    name: "Tech Debt Paydown Plan",
    domain: "it",
    description: "Analyze and prioritize technical debt",
    prompt: `Analyze tech debt for {{system}} and create a paydown plan.

Pain points: {{pain_points}} | Team: {{team_size}} engineers
Velocity lost to debt: {{velocity_impact}} hrs/week | Risk: {{risk_level}}
Known debt areas: {{debt_areas}}

1. Tech Debt Inventory (categorized: code quality, architecture, testing, docs, dependencies, infra)
2. Impact × Effort matrix for each item
3. Prioritized 90-day paydown plan
   - Month 1: Quick wins
   - Month 2: High-risk items
   - Month 3: Foundation improvements
4. "Boy Scout Rule" — how to prevent new accumulation
5. How to communicate debt to non-technical stakeholders (ROI framing)
6. ROI of addressing debt (velocity recovered × dev hourly rate)`,
    inputs: [
      {
        name: "system",
        label: "System/codebase",
        type: "text",
        required: true,
      },
      {
        name: "pain_points",
        label: "Current pain points",
        type: "textarea",
        required: true,
      },
      {
        name: "team_size",
        label: "Team size",
        type: "number",
        required: false,
      },
      {
        name: "velocity_impact",
        label: "Hours/week lost to debt",
        type: "number",
        required: false,
      },
      {
        name: "risk_level",
        label: "Business risk level",
        type: "select",
        required: true,
        options: ["Low", "Medium", "High", "Critical"],
      },
      {
        name: "debt_areas",
        label: "Known debt areas",
        type: "textarea",
        required: false,
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["forge", "vision"],
    tags: ["tech debt", "refactoring", "engineering"],
    estimatedTokens: 700,
  },
  {
    id: "cloud-cost-optimization",
    name: "Cloud Cost Optimization",
    domain: "it",
    description: "Identify and reduce cloud infrastructure costs",
    prompt: `Analyze and optimize cloud costs for {{company}}.

Cloud provider(s): {{cloud}}
Current monthly spend: {{spend}}
Main cost drivers: {{cost_drivers}}
Workload type: {{workload}}

Analysis:
1. Cost breakdown by service/team
2. Quick wins (immediate savings, no risk)
   - Idle resources to terminate
   - Right-sizing opportunities
   - Storage optimization
3. Reserved Instances / Savings Plans analysis
   - Which resources to commit
   - 1-year vs 3-year recommendation
   - Estimated savings %
4. Architecture optimizations (medium-term)
   - Spot instance candidates
   - Auto-scaling improvements
   - Caching to reduce compute
5. FinOps governance
   - Tagging strategy
   - Budget alerts
   - Showback/chargeback model
6. 30-60-90 day savings roadmap
7. Expected savings: $X/month after optimization`,
    inputs: [
      {
        name: "company",
        label: "Company name",
        type: "text",
        required: true,
      },
      {
        name: "cloud",
        label: "Cloud provider",
        type: "select",
        required: true,
        options: ["AWS", "Google Cloud", "Azure", "Multi-cloud"],
      },
      {
        name: "spend",
        label: "Current monthly cloud spend",
        type: "text",
        required: true,
        placeholder: "$15,000/month",
      },
      {
        name: "cost_drivers",
        label: "Main cost drivers",
        type: "textarea",
        required: true,
        placeholder: "EC2 instances, RDS, data transfer, S3",
      },
      {
        name: "workload",
        label: "Workload type",
        type: "select",
        required: true,
        options: ["Web application", "Data processing/ML", "E-commerce", "SaaS platform", "Gaming", "Media streaming"],
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["forge", "ledger"],
    tags: ["cloud", "cost optimization", "FinOps", "AWS"],
    estimatedTokens: 600,
  },
  {
    id: "sre-slo-design",
    name: "SLO / SLA Design",
    domain: "it",
    description: "Design Service Level Objectives for any service",
    prompt: `Design SLOs and error budgets for {{service_name}}.

Service type: {{service_type}}
Current reliability: {{current_reliability}}%
User expectations: {{user_expectations}}
Business impact of downtime: {{downtime_impact}}
Team capacity for reliability work: {{team_capacity}}

SLO Design:
1. SLI definitions (what to measure):
   - Availability SLI (request success rate)
   - Latency SLI (p50, p95, p99 targets)
   - Error rate SLI
   - Freshness SLI (if applicable)
2. SLO targets for each SLI (with rationale)
3. Error budget calculation (monthly)
4. Error budget burn rate alerts (1x, 5x, 14x)
5. SLA commitments (customer-facing, with penalties)
6. Dashboard design for SLO tracking
7. On-call runbook trigger conditions
8. Monthly SLO review process
9. SLO evolution roadmap (tighten over time)`,
    inputs: [
      {
        name: "service_name",
        label: "Service name",
        type: "text",
        required: true,
      },
      {
        name: "service_type",
        label: "Service type",
        type: "select",
        required: true,
        options: ["User-facing web app", "API", "Data pipeline", "Background jobs", "Real-time system"],
      },
      {
        name: "current_reliability",
        label: "Current reliability %",
        type: "text",
        required: true,
        placeholder: "99.5",
      },
      {
        name: "user_expectations",
        label: "User expectations",
        type: "textarea",
        required: true,
        placeholder: "< 200ms response, 99.9% uptime",
      },
      {
        name: "downtime_impact",
        label: "Business impact of 1hr downtime",
        type: "text",
        required: true,
        placeholder: "$10,000 in lost revenue",
      },
      {
        name: "team_capacity",
        label: "Team capacity for reliability work",
        type: "select",
        required: true,
        options: ["<10%", "10-20%", "20-30%", ">30%"],
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["forge", "ops"],
    tags: ["SRE", "SLO", "SLA", "reliability", "monitoring"],
    estimatedTokens: 600,
  },
  {
    id: "disaster-recovery",
    name: "Disaster Recovery Plan",
    domain: "it",
    description: "Create a comprehensive disaster recovery plan",
    prompt: `Create a Disaster Recovery Plan (DRP) for {{company}}.

Systems covered: {{systems}}
RTO (Recovery Time Objective): {{rto}}
RPO (Recovery Point Objective): {{rpo}}
Current backup strategy: {{backup}}
Team size for recovery: {{team_size}}

DRP Sections:
1. Business Impact Analysis (critical systems ranked)
2. Risk Assessment (disaster scenarios: data center fire, ransomware, database corruption, key person loss, DDoS)
3. Recovery Strategies by scenario
4. Recovery Runbooks (step-by-step for top 3 scenarios)
5. Backup architecture design
   - 3-2-1 backup rule implementation
   - Geographic distribution
   - Testing schedule
6. Communication plan (internal + customer-facing)
7. DR testing schedule (tabletop, functional, full)
8. Return-to-normal procedure
9. DR team roles and contacts
10. Vendor contacts and SLAs

Define: RTO = {{rto}}, RPO = {{rpo}}`,
    inputs: [
      {
        name: "company",
        label: "Company name",
        type: "text",
        required: true,
      },
      {
        name: "systems",
        label: "Critical systems to protect",
        type: "textarea",
        required: true,
        placeholder: "Production DB, API servers, file storage, auth service",
      },
      {
        name: "rto",
        label: "Recovery Time Objective",
        type: "text",
        required: true,
        placeholder: "4 hours",
      },
      {
        name: "rpo",
        label: "Recovery Point Objective",
        type: "text",
        required: true,
        placeholder: "1 hour",
      },
      {
        name: "backup",
        label: "Current backup strategy",
        type: "text",
        required: false,
        placeholder: "Daily snapshots to S3",
      },
      {
        name: "team_size",
        label: "DR team size",
        type: "number",
        required: false,
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["forge", "ops"],
    tags: ["disaster recovery", "DR", "backup", "BCP", "SRE"],
    estimatedTokens: 800,
  },
];
