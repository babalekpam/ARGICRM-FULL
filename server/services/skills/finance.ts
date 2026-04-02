import { BusinessSkill } from "./types.js";

export const FINANCE_SKILLS: BusinessSkill[] = [
  {
    id: "investor-update",
    name: "Investor Update Email",
    domain: "finance",
    description: "Write a monthly investor update that builds confidence",
    prompt: `Write a monthly investor update for {{company_name}}.

Month: {{month}}
Key metrics:
- MRR: {{mrr}} (vs last month: {{mrr_last}})
- ARR: {{arr}}
- Churn rate: {{churn}}
- New customers: {{new_customers}}
- Runway: {{runway}} months
- Burn rate: {{burn}}

Highlights: {{wins}}
Challenges: {{challenges}}
Ask from investors: {{ask}}

Structure:
1. TL;DR (3 bullet points — top metric, top win, top challenge)
2. Financial metrics (with month-over-month)
3. Key wins this month
4. Honest challenges + what you're doing about it
5. Focus for next 30 days
6. Ask (specific and actionable)

Tone: Confident, transparent, brief. Investors get too many updates — respect their time.`,
    inputs: [
      { name: "company_name", label: "Company name", type: "text", required: true },
      { name: "month", label: "Month/period", type: "text", required: true },
      { name: "mrr", label: "Current MRR", type: "text", required: true },
      { name: "mrr_last", label: "Last month MRR", type: "text", required: true },
      { name: "arr", label: "ARR", type: "text", required: false },
      { name: "churn", label: "Churn rate", type: "text", required: false },
      { name: "new_customers", label: "New customers", type: "number", required: true },
      { name: "runway", label: "Runway (months)", type: "number", required: true },
      { name: "burn", label: "Monthly burn", type: "text", required: true },
      { name: "wins", label: "Key wins this month", type: "textarea", required: true },
      { name: "challenges", label: "Key challenges", type: "textarea", required: true },
      { name: "ask", label: "Ask from investors", type: "text", required: false },
    ],
    outputFormat: "email",
    agentsWhoUseThis: ["ledger", "aria"],
    tags: ["investor", "fundraising", "reporting"],
    estimatedTokens: 600,
  },
  {
    id: "unit-economics",
    name: "Unit Economics Calculator",
    domain: "finance",
    description: "Analyze and interpret key SaaS unit economics",
    prompt: `Analyze the unit economics for {{company_name}} and provide recommendations.

Provided metrics:
- CAC: {{cac}}
- LTV: {{ltv}}
- Gross margin: {{gross_margin}}%
- Average contract value: {{acv}}
- Churn rate: {{churn}}% monthly
- Payback period: {{payback}} months
- Sales cycle: {{sales_cycle}} days

Calculate and explain:
1. LTV:CAC ratio (benchmark: >3:1)
2. CAC payback period (benchmark: <18 months)
3. Net Revenue Retention (if churn provided)
4. Gross Margin analysis (SaaS benchmark: 70-80%)
5. Rule of 40 (if growth rate provided: {{growth_rate}}%)

For each metric:
- Current status (Red/Yellow/Green)
- Industry benchmark
- What's causing the number
- Top 3 levers to improve it
- Target to aim for in 12 months`,
    inputs: [
      { name: "company_name", label: "Company name", type: "text", required: true },
      { name: "cac", label: "Customer Acquisition Cost", type: "text", required: true },
      { name: "ltv", label: "Lifetime Value", type: "text", required: true },
      { name: "gross_margin", label: "Gross Margin %", type: "number", required: true },
      { name: "acv", label: "Average Contract Value", type: "text", required: true },
      { name: "churn", label: "Monthly Churn Rate %", type: "number", required: true },
      { name: "payback", label: "CAC Payback Period (months)", type: "number", required: false },
      { name: "sales_cycle", label: "Sales Cycle (days)", type: "number", required: false },
      { name: "growth_rate", label: "Monthly Growth Rate %", type: "number", required: false },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["ledger", "oracle"],
    tags: ["unit economics", "SaaS metrics", "LTV CAC"],
    estimatedTokens: 500,
  },
];
