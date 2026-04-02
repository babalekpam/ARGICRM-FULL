import { BusinessSkill } from "./types.js";

export const CS_SKILLS: BusinessSkill[] = [
  {
    id: "churn-prevention",
    name: "Churn Risk Intervention",
    domain: "customer_success",
    description: "Craft an intervention plan for an at-risk account",
    prompt: `Create a churn prevention plan for at-risk customer: {{customer_name}}

Risk signals observed: {{signals}}
Customer tier: {{tier}}
Contract value: {{arr}}
Months remaining: {{months}}
Last success milestone: {{last_win}}
Key stakeholder: {{stakeholder}}

Deliver:
1. Root cause hypothesis (what's really going on)
2. Immediate action (this week)
3. Personalized outreach message to {{stakeholder}}
4. QBR agenda tailored to re-engage
5. Quick win we can deliver in 30 days
6. Escalation path (if direct outreach fails)
7. Success metric to track recovery`,
    inputs: [
      { name: "customer_name", label: "Customer name", type: "text", required: true },
      { name: "signals", label: "Churn risk signals", type: "textarea", required: true, placeholder: "Login frequency dropped 60%, champion left, support tickets up 200%" },
      { name: "tier", label: "Customer tier", type: "text", required: true },
      { name: "arr", label: "Annual contract value", type: "text", required: true },
      { name: "months", label: "Months remaining on contract", type: "number", required: true },
      { name: "last_win", label: "Last success milestone", type: "text", required: false },
      { name: "stakeholder", label: "Key stakeholder to reach", type: "text", required: true },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["care", "aria"],
    tags: ["churn", "retention", "customer success"],
    estimatedTokens: 500,
  },
  {
    id: "qbr-agenda",
    name: "Quarterly Business Review (QBR)",
    domain: "customer_success",
    description: "Generate a complete QBR agenda and talking points",
    prompt: `Create a complete QBR agenda for customer: {{customer_name}}

Their goals from last QBR: {{previous_goals}}
Outcomes achieved: {{achievements}}
Metrics this quarter: {{metrics}}
Upcoming renewal date: {{renewal}}
Expansion opportunity: {{expansion}}
Risks to address: {{risks}}

QBR Agenda (90 minutes):
1. Welcome & agenda (5 min)
2. Success recap — wins & ROI proof (20 min)
3. Usage analysis & insights (15 min)
4. Upcoming roadmap relevant to them (10 min)
5. Open discussion — their priorities (20 min)
6. Goals for next quarter (10 min)
7. Renewal/expansion discussion (if appropriate, 10 min)

For each section:
- Exact talking points
- Questions to ask
- Data/slides to prepare
- What outcome you need from this section`,
    inputs: [
      { name: "customer_name", label: "Customer name", type: "text", required: true },
      { name: "previous_goals", label: "Goals set last QBR", type: "textarea", required: true },
      { name: "achievements", label: "What was achieved", type: "textarea", required: true },
      { name: "metrics", label: "Key metrics this quarter", type: "textarea", required: true },
      { name: "renewal", label: "Renewal date", type: "text", required: true },
      { name: "expansion", label: "Expansion opportunity", type: "text", required: false },
      { name: "risks", label: "Risks to address", type: "textarea", required: false },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["care"],
    tags: ["QBR", "customer success", "renewal"],
    estimatedTokens: 700,
  },
  {
    id: "support-response",
    name: "Support Ticket Response",
    domain: "customer_success",
    description: "Write a professional support response for any issue",
    prompt: `Write a support response for this customer issue.

Customer name: {{name}}
Issue type: {{issue_type}}
What happened: {{issue}}
Customer sentiment: {{sentiment}}
Previous interactions: {{history}}
Resolution we have: {{resolution}}

Write:
1. Empathetic opening (acknowledge, never defend)
2. Clear explanation of what happened (if applicable)
3. Exact steps to resolve (numbered, specific)
4. Prevention advice (what to do next time)
5. Goodwill gesture if warranted
6. Closing with check-in commitment

Tone: {{tone}}
Keep under 250 words.`,
    inputs: [
      { name: "name", label: "Customer name", type: "text", required: true },
      { name: "issue_type", label: "Issue category", type: "select", required: true, options: ["Billing", "Technical bug", "Feature request", "Access issue", "Data question", "Integration problem"] },
      { name: "issue", label: "What happened", type: "textarea", required: true },
      { name: "sentiment", label: "Customer sentiment", type: "select", required: true, options: ["Frustrated", "Confused", "Neutral", "Urgent", "Very angry"] },
      { name: "history", label: "Previous interactions", type: "text", required: false },
      { name: "resolution", label: "Resolution available", type: "textarea", required: true },
      { name: "tone", label: "Response tone", type: "select", required: true, options: ["Professional & empathetic", "Casual & friendly", "Formal"] },
    ],
    outputFormat: "email",
    agentsWhoUseThis: ["care"],
    tags: ["support", "customer service", "ticket"],
    estimatedTokens: 300,
  },
];
