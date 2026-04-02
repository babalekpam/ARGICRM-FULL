import { BusinessSkill } from "./types.js";

export const STRATEGY_SKILLS: BusinessSkill[] = [
  {
    id: "board-memo",
    name: "Board Memo",
    domain: "strategy",
    description: "Write a concise board memo on any strategic topic",
    prompt: `Write a board memo from the CEO of {{company}} regarding: {{topic}}

Context: {{context}}
Decision needed: {{decision}}
Options considered: {{options}}
Recommendation: {{recommendation}}
Financial impact: {{financial_impact}}
Risks: {{risks}}

Memo structure (Pyramid Principle — conclusion first):
1. Executive Summary (3-4 sentences: recommendation + rationale)
2. Background (minimum necessary context)
3. Options Analysis (2-3 options with pros/cons)
4. Recommendation with rationale
5. Financial implications
6. Key risks and mitigations
7. Requested board action

Tone: Direct, analytical, confident. Board members are busy — no fluff.
Length: Under 1 page (500 words max).`,
    inputs: [
      { name: "company", label: "Company name", type: "text", required: true },
      { name: "topic", label: "Topic / decision to address", type: "text", required: true },
      { name: "context", label: "Background context", type: "textarea", required: true },
      { name: "decision", label: "Decision needed", type: "text", required: true },
      { name: "options", label: "Options considered", type: "textarea", required: true },
      { name: "recommendation", label: "CEO recommendation", type: "text", required: true },
      { name: "financial_impact", label: "Financial impact", type: "text", required: false },
      { name: "risks", label: "Key risks", type: "textarea", required: false },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["aria"],
    tags: ["board", "strategy", "executive", "memo"],
    estimatedTokens: 500,
  },
  {
    id: "competitive-analysis",
    name: "Competitive Analysis",
    domain: "strategy",
    description: "Deep competitive analysis for any market",
    prompt: `Conduct a competitive analysis for {{company_name}} in the {{market}} space.

Our product: {{our_product}}
Our ICP: {{icp}}
Competitors to analyze: {{competitors}}

For each competitor, analyze:
1. Positioning & messaging (what story they tell)
2. Target customer (who they win with)
3. Key features vs ours (table format)
4. Pricing model
5. Go-to-market motion (PLG, sales-led, channel)
6. Strengths (what they do well)
7. Weaknesses (where they fall short)
8. Where we win against them
9. Where they win against us

Summary section:
- Whitespace opportunities (what no one does well)
- Our unique competitive position
- Battle card for each competitor (for sales team)
- Recommended positioning to defend against all`,
    inputs: [
      { name: "company_name", label: "Our company", type: "text", required: true },
      { name: "market", label: "Market/industry", type: "text", required: true },
      { name: "our_product", label: "Our product summary", type: "textarea", required: true },
      { name: "icp", label: "Our ICP", type: "text", required: true },
      { name: "competitors", label: "Competitors to analyze", type: "text", required: true, placeholder: "Salesforce, HubSpot, Pipedrive" },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["atlas", "vision", "aria"],
    tags: ["competitive analysis", "strategy", "positioning", "battle card"],
    estimatedTokens: 900,
  },
];
