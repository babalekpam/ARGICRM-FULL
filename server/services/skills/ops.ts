import { BusinessSkill } from "./types.js";

export const OPS_SKILLS: BusinessSkill[] = [
  {
    id: "sop-writer",
    name: "SOP / Process Document",
    domain: "operations",
    description: "Turn any process into a clear, repeatable SOP",
    prompt: `Write a Standard Operating Procedure (SOP) for: {{process_name}}

Department: {{department}}
Who performs this: {{performer}}
Frequency: {{frequency}}
Tools used: {{tools}}
Current pain points: {{pain_points}}

SOP Structure:
1. Purpose (why this process exists)
2. Scope (who this applies to, what's included/excluded)
3. Prerequisites (what must be in place first)
4. Step-by-step instructions (numbered, ultra-specific)
   - Decision points with if/then branches
   - Embedded screenshots or diagram references
5. Common mistakes to avoid
6. Troubleshooting guide
7. Metrics to track (how you know the process is working)
8. Review schedule and owner

Format for: clarity over cleverness. A new hire should be able to follow this on day one.`,
    inputs: [
      { name: "process_name", label: "Process name", type: "text", required: true, placeholder: "Customer onboarding handoff" },
      { name: "department", label: "Department", type: "text", required: true },
      { name: "performer", label: "Who performs this", type: "text", required: true },
      { name: "frequency", label: "How often", type: "text", required: true },
      { name: "tools", label: "Tools/systems used", type: "text", required: true },
      { name: "pain_points", label: "Current pain points", type: "textarea", required: false },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["ops"],
    tags: ["SOP", "process", "documentation", "operations"],
    estimatedTokens: 700,
  },
  {
    id: "okr-framework",
    name: "OKR Planning",
    domain: "operations",
    description: "Create quarterly OKRs for a team or company",
    prompt: `Create quarterly OKRs for {{team_or_company}}.

Quarter: {{quarter}}
Company mission: {{mission}}
Last quarter's performance: {{last_quarter}}
Current challenges: {{challenges}}
Available resources: {{resources}}
Strategic priorities: {{priorities}}

Create 3 Objectives with 3-4 Key Results each:

For each Objective:
- Objective statement (inspiring, directional, not measurable)
- Why this matters now (strategic rationale)
- 3-4 Key Results (specific, measurable, time-bound, ambitious but achievable)
- Leading vs lagging indicators
- Owner and contributors
- Dependencies and risks

Confidence rating scale: 70% = ideal stretch
Flag any OKRs that are "business as usual" and should be removed.`,
    inputs: [
      { name: "team_or_company", label: "Team or company", type: "text", required: true },
      { name: "quarter", label: "Quarter (e.g. Q2 2025)", type: "text", required: true },
      { name: "mission", label: "Company mission", type: "text", required: false },
      { name: "last_quarter", label: "Last quarter performance summary", type: "textarea", required: false },
      { name: "challenges", label: "Current key challenges", type: "textarea", required: true },
      { name: "resources", label: "Team size / budget", type: "text", required: false },
      { name: "priorities", label: "Strategic priorities this quarter", type: "textarea", required: true },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["ops", "aria"],
    tags: ["OKR", "goals", "planning", "strategy"],
    estimatedTokens: 600,
  },
];
