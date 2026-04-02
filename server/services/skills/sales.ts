import { BusinessSkill } from "./types.js";

export const SALES_SKILLS: BusinessSkill[] = [
  {
    id: "cold-email-b2b",
    name: "B2B Cold Email",
    domain: "sales",
    description: "Write a personalized cold email that gets replies",
    prompt: `Write a highly personalized B2B cold email to {{prospect_name}}, {{prospect_title}} at {{company_name}}.

Context about them: {{prospect_context}}
Our product/service: {{our_offer}}
Key pain point to address: {{pain_point}}

Requirements:
- Subject line that creates curiosity (not clickbait)
- Opening that shows genuine research (reference something specific about them)
- One clear, specific value proposition tied to their role
- Social proof (if available: {{social_proof}})
- One soft CTA (suggest a 15-min call, not "Buy now")
- Under 150 words in the body
- P.S. line with a relevant hook

Output the subject line and email body separately.`,
    inputs: [
      { name: "prospect_name", label: "Prospect name", type: "text", required: true, placeholder: "Sarah Mitchell" },
      { name: "prospect_title", label: "Job title", type: "text", required: true, placeholder: "VP Sales" },
      { name: "company_name", label: "Company", type: "text", required: true, placeholder: "TechVision Inc" },
      { name: "prospect_context", label: "What you know about them", type: "textarea", required: true, placeholder: "Recently raised Series B, hiring 3 AEs, using HubSpot" },
      { name: "our_offer", label: "Your product/service", type: "textarea", required: true, placeholder: "ARGI CRM - AI-powered sales intelligence" },
      { name: "pain_point", label: "Core pain point to address", type: "text", required: true, placeholder: "Manual lead research wasting reps' time" },
      { name: "social_proof", label: "Social proof (optional)", type: "text", required: false, placeholder: "Used by 200+ SaaS sales teams" },
    ],
    outputFormat: "email",
    agentsWhoUseThis: ["bolt"],
    tags: ["cold email", "outreach", "prospecting"],
    estimatedTokens: 400,
  },
  {
    id: "linkedin-message",
    name: "LinkedIn Connection Message",
    domain: "sales",
    description: "Craft a LinkedIn message that gets accepted and starts a conversation",
    prompt: `Write a LinkedIn connection request message to {{prospect_name}}, {{prospect_title}} at {{company_name}}.

Context: {{shared_context}}
Goal: {{goal}}

Rules:
- Maximum 300 characters (LinkedIn limit)
- Reference a specific shared connection, content, or trigger event
- No pitch in the connection request
- Make it feel human, not templated

Then write a follow-up message to send after they accept (under 200 words). This one can gently introduce value.`,
    inputs: [
      { name: "prospect_name", label: "Name", type: "text", required: true },
      { name: "prospect_title", label: "Title", type: "text", required: true },
      { name: "company_name", label: "Company", type: "text", required: true },
      { name: "shared_context", label: "Common ground / trigger", type: "textarea", required: true, placeholder: "They commented on a post about AI in sales, or attended SaaStr" },
      { name: "goal", label: "Desired outcome", type: "text", required: true, placeholder: "Book a discovery call" },
    ],
    outputFormat: "text",
    agentsWhoUseThis: ["bolt"],
    tags: ["linkedin", "social selling", "outreach"],
    estimatedTokens: 250,
  },
  {
    id: "discovery-call-script",
    name: "Discovery Call Script",
    domain: "sales",
    description: "Generate a tailored discovery call framework for a specific prospect",
    prompt: `Create a discovery call script for a call with {{prospect_name}}, {{prospect_title}} at {{company_name}}.

What we know about them: {{background}}
Industry: {{industry}}
Our product: {{product}}
Call length: {{duration}} minutes

Structure:
1. Opener (rapport + agenda, 2 min)
2. Situation questions (current state, 5 min)
3. Problem discovery (pain points, 8 min)
4. Impact questions (what's this costing them, 5 min)  
5. Need-payoff (future state, 5 min)
6. Transition to demo/next steps (5 min)

For each section, provide:
- The exact questions to ask (SPIN methodology)
- What to listen for
- Follow-up probes
- Red flags to watch for

End with: ideal discovery outcomes and qualification criteria.`,
    inputs: [
      { name: "prospect_name", label: "Prospect name", type: "text", required: true },
      { name: "prospect_title", label: "Title", type: "text", required: true },
      { name: "company_name", label: "Company", type: "text", required: true },
      { name: "background", label: "What you know", type: "textarea", required: true },
      { name: "industry", label: "Industry", type: "text", required: true },
      { name: "product", label: "Your product", type: "text", required: true },
      { name: "duration", label: "Call duration (min)", type: "number", required: true },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["bolt"],
    tags: ["discovery", "SPIN", "sales call", "script"],
    estimatedTokens: 700,
  },
  {
    id: "objection-handler",
    name: "Objection Handler",
    domain: "sales",
    description: "Counter any sales objection with proven responses",
    prompt: `Provide 3 professional responses to this sales objection: "{{objection}}"

Context:
- Our product: {{product}}
- Prospect's industry: {{industry}}
- Deal stage: {{stage}}

For each response:
1. Acknowledge the concern (show you heard them)
2. Reframe or provide evidence
3. Pivot back to their goal
4. Close with a question that moves forward

Also provide:
- The root fear behind this objection
- What NOT to say
- Early warning signs this objection is coming (so you can preempt it)`,
    inputs: [
      { name: "objection", label: "The exact objection", type: "textarea", required: true, placeholder: "\"We're happy with our current solution\"" },
      { name: "product", label: "Your product/service", type: "text", required: true },
      { name: "industry", label: "Prospect industry", type: "text", required: true },
      { name: "stage", label: "Deal stage", type: "select", required: true, options: ["Discovery", "Demo", "Proposal", "Negotiation", "Closing"] },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["bolt"],
    tags: ["objections", "negotiation", "closing"],
    estimatedTokens: 500,
  },
  {
    id: "proposal-writer",
    name: "Sales Proposal",
    domain: "sales",
    description: "Write a compelling, tailored sales proposal",
    prompt: `Write a professional sales proposal for {{company_name}}.

Prospect pain points discovered: {{pain_points}}
Our proposed solution: {{solution}}
Investment: {{pricing}}
Timeline: {{timeline}}
Key stakeholders: {{stakeholders}}
Competitors they're evaluating: {{competitors}}

Proposal structure:
1. Executive Summary (1 paragraph — business case, not product pitch)
2. Understanding Your Challenge (demonstrate you listened)
3. Our Recommended Solution (specific to their situation)
4. Why {{our_company}} (differentiation vs {{competitors}})
5. Implementation Plan (3 phases with milestones)
6. Investment & ROI (show the math)
7. Success Metrics (how we'll measure outcomes)
8. Next Steps (clear CTA with specific date)

Tone: Confident, consultative, partner-focused. Not salesy.`,
    inputs: [
      { name: "company_name", label: "Prospect company", type: "text", required: true },
      { name: "pain_points", label: "Discovered pain points", type: "textarea", required: true },
      { name: "solution", label: "Your proposed solution", type: "textarea", required: true },
      { name: "pricing", label: "Pricing", type: "text", required: true },
      { name: "timeline", label: "Implementation timeline", type: "text", required: true },
      { name: "stakeholders", label: "Key stakeholders", type: "text", required: false },
      { name: "competitors", label: "Competitors in evaluation", type: "text", required: false },
      { name: "our_company", label: "Your company name", type: "text", required: true },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["bolt"],
    tags: ["proposal", "closing", "deal"],
    estimatedTokens: 900,
  },
  {
    id: "lead-score-analysis",
    name: "Lead Score Analysis",
    domain: "sales",
    description: "Score and qualify a lead using BANT + behavioral signals",
    prompt: `Score and qualify this lead using BANT + behavioral signals.

Lead information:
Name: {{name}}, Title: {{title}}, Company: {{company}}
Company size: {{size}}, Industry: {{industry}}
Budget signals: {{budget}}
Authority level: {{authority}}
Need identified: {{need}}
Timeline: {{timeline}}
Behavioral signals: {{signals}}

Score each dimension 1-10 and explain:
- Budget fit (1-10): 
- Authority level (1-10):
- Need urgency (1-10):
- Timeline fit (1-10):
- ICP match (1-10):

Overall score: /100
Qualification: Hot / Warm / Cold / Disqualify

Recommended next action:
Outreach personalization tip:`,
    inputs: [
      { name: "name", label: "Lead name", type: "text", required: true },
      { name: "title", label: "Job title", type: "text", required: true },
      { name: "company", label: "Company", type: "text", required: true },
      { name: "size", label: "Company size", type: "text", required: false },
      { name: "industry", label: "Industry", type: "text", required: true },
      { name: "budget", label: "Budget signals", type: "text", required: false },
      { name: "authority", label: "Decision-making authority", type: "text", required: false },
      { name: "need", label: "Identified need", type: "textarea", required: false },
      { name: "timeline", label: "Purchase timeline", type: "text", required: false },
      { name: "signals", label: "Behavioral signals", type: "textarea", required: false, placeholder: "Visited pricing page 3x, downloaded whitepaper" },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["bolt", "aria"],
    tags: ["lead scoring", "BANT", "qualification"],
    estimatedTokens: 350,
  },
  {
    id: "followup-sequence",
    name: "Follow-up Email Sequence",
    domain: "sales",
    description: "Generate a 5-touch follow-up sequence after no response",
    prompt: `Create a 5-touch follow-up email sequence for a prospect who hasn't responded to the initial outreach.

Prospect: {{prospect_name}}, {{title}} at {{company}}
Initial email topic: {{initial_topic}}
Our product: {{product}}
Time between touches: Touch 1: Day 3, Touch 2: Day 7, Touch 3: Day 14, Touch 4: Day 21, Touch 5: Day 30 (breakup)

For each touch:
- Unique angle (never repeat the same hook)
- Subject line that doesn't say "Following up"
- Body under 100 words
- Different CTA each time

Touch 5 must be the "breakup email" — gracious, leaves door open, provides final value.`,
    inputs: [
      { name: "prospect_name", label: "Prospect name", type: "text", required: true },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "company", label: "Company", type: "text", required: true },
      { name: "initial_topic", label: "What your first email was about", type: "text", required: true },
      { name: "product", label: "Product/service", type: "text", required: true },
    ],
    outputFormat: "email",
    agentsWhoUseThis: ["bolt"],
    tags: ["follow-up", "sequence", "nurture"],
    estimatedTokens: 600,
  },
  {
    id: "deal-review",
    name: "Deal Review & Risk Assessment",
    domain: "sales",
    description: "Analyze a deal for risks and suggest acceleration tactics",
    prompt: `Perform a deal review for this opportunity.

Deal: {{deal_name}}
Value: {{value}}
Stage: {{stage}}
Close date: {{close_date}}
Days in stage: {{days_in_stage}}
Champion: {{champion}}
Economic buyer: {{economic_buyer}}
Competitors: {{competitors}}
Last activity: {{last_activity}}
Blocker or concern: {{blocker}}

Analysis:
1. Deal health score (Red/Yellow/Green) with reasoning
2. Top 3 risks threatening this deal
3. Missing stakeholders or information
4. Competitive positioning gaps
5. Recommended actions (this week)
6. Probability adjustment (should it move up or down?)
7. Executive coaching note for the rep`,
    inputs: [
      { name: "deal_name", label: "Deal name", type: "text", required: true },
      { name: "value", label: "Deal value", type: "text", required: true },
      { name: "stage", label: "Current stage", type: "text", required: true },
      { name: "close_date", label: "Expected close date", type: "text", required: true },
      { name: "days_in_stage", label: "Days in current stage", type: "number", required: true },
      { name: "champion", label: "Internal champion", type: "text", required: false },
      { name: "economic_buyer", label: "Economic buyer", type: "text", required: false },
      { name: "competitors", label: "Competitors in deal", type: "text", required: false },
      { name: "last_activity", label: "Last activity", type: "text", required: true },
      { name: "blocker", label: "Current blocker", type: "textarea", required: false },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["bolt", "aria"],
    tags: ["deal review", "pipeline", "forecast"],
    estimatedTokens: 500,
  },
];
