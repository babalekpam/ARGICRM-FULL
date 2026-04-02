import { BusinessSkill } from "./types.js";

export const MANUFACTURING_SKILLS: BusinessSkill[] = [
  {
    id: "lean-improvement",
    name: "Lean Manufacturing Plan",
    domain: "manufacturing",
    description: "Apply lean principles to any manufacturing operation",
    prompt: `Create a lean improvement plan for {{facility}} ({{product}}).

Current OEE: {{oee}}%
Main waste types: {{wastes}}
Production volume: {{volume}}
Team size: {{team_size}}
Current processes: {{processes}}

Lean Analysis & Plan:
1. Current State Value Stream Map (VSM) description
2. Eight Wastes (MUDA) Assessment
   - Transport, Inventory, Motion, Waiting, Overproduction, Overprocessing, Defects, Skills
3. OEE Breakdown (Availability × Performance × Quality)
4. Kaizen Event Schedule (priority improvements)
5. 5S Implementation Plan
   - Sort, Set in order, Shine, Standardize, Sustain
6. Standard Work Design for top 3 processes
7. Visual Management System
   - Andon system recommendation
   - Production control boards
8. TPM (Total Productive Maintenance) plan
9. Error-proofing (Poka-yoke) opportunities
10. Pull system design (Kanban)
11. Future State VSM description
12. Expected improvements (OEE, cycle time, inventory turns)
13. Implementation roadmap (6 months)`,
    inputs: [
      {
        name: "facility",
        label: "Facility/plant name",
        type: "text",
        required: true,
      },
      {
        name: "product",
        label: "Products manufactured",
        type: "text",
        required: true,
        placeholder: "Automotive parts, consumer goods, electronics",
      },
      {
        name: "oee",
        label: "Current OEE %",
        type: "number",
        required: false,
        placeholder: "65",
      },
      {
        name: "wastes",
        label: "Observed waste types",
        type: "textarea",
        required: true,
        placeholder: "Long changeovers, high WIP inventory, frequent defects",
      },
      {
        name: "volume",
        label: "Production volume",
        type: "text",
        required: true,
        placeholder: "500 units/day",
      },
      {
        name: "team_size",
        label: "Shop floor team size",
        type: "number",
        required: false,
      },
      {
        name: "processes",
        label: "Key manufacturing processes",
        type: "textarea",
        required: true,
        placeholder: "Stamping, assembly, quality inspection, packaging",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["ops"],
    tags: ["lean", "manufacturing", "kaizen", "5S", "continuous improvement"],
    estimatedTokens: 800,
  },
  {
    id: "quality-management",
    name: "Quality Management System",
    domain: "manufacturing",
    description: "Design an ISO 9001-aligned quality management system",
    prompt: `Design a Quality Management System (QMS) for {{company}} aligned with {{standard}}.

Industry: {{industry}}
Products/services: {{products}}
Team size: {{team_size}}
Current quality issues: {{issues}}
Customer requirements: {{requirements}}

QMS Design:
1. Quality Policy Statement (to be signed by leadership)
2. Quality Objectives (SMART, aligned with policy)
3. Process Approach
   - Core processes mapping
   - Support processes
   - Management processes
4. Document Control System
   - Document hierarchy (policy → procedure → work instruction → form)
   - Version control approach
5. Required Procedures by Standard:
   - Control of documented information
   - Control of nonconforming outputs
   - Corrective actions
   - Internal audits
   - Management review
6. Risk-Based Thinking Implementation
   - Risk register template
   - Opportunity identification
7. Measurement, Analysis, Improvement
   - KPIs and monitoring frequency
   - Customer satisfaction measurement
   - Internal audit schedule
8. Supplier Quality Management
9. Training Requirements
10. Certification roadmap and timeline
11. Estimated costs (consultant, certification, training)`,
    inputs: [
      {
        name: "company",
        label: "Company name",
        type: "text",
        required: true,
      },
      {
        name: "standard",
        label: "Quality standard",
        type: "select",
        required: true,
        options: ["ISO 9001:2015", "ISO 13485 (Medical devices)", "IATF 16949 (Automotive)", "AS9100 (Aerospace)", "GMP (Food/Pharma)", "General QMS (no certification)"],
      },
      {
        name: "industry",
        label: "Industry",
        type: "text",
        required: true,
      },
      {
        name: "products",
        label: "Products/services",
        type: "textarea",
        required: true,
      },
      {
        name: "team_size",
        label: "Total employees",
        type: "number",
        required: false,
      },
      {
        name: "issues",
        label: "Current quality issues",
        type: "textarea",
        required: true,
        placeholder: "High defect rate, customer complaints, rework",
      },
      {
        name: "requirements",
        label: "Customer quality requirements",
        type: "textarea",
        required: false,
        placeholder: "Zero-defect delivery, traceability, first-article inspection",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["ops", "guard"],
    tags: ["quality", "ISO 9001", "QMS", "manufacturing", "compliance"],
    estimatedTokens: 900,
  },
];
