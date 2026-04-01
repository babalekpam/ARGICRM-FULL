import { ask, askJSON, complete, isAIAvailable, getActiveProvider } from "./ai-adapter.js";
import { db } from "../db.js";
import {
  contacts, leads, deals, tasks, accounts, activities, campaigns, users, tenants,
} from "@shared/schema";
import {
  agentMemories, agentSessions, agentMessages, agentTasks, agentLeadGenResults,
  type AgentType,
} from "@shared/schema-extended";
import { eq, and, desc, sql, gte } from "drizzle-orm";


// ═══════════════════════════════════════════════════════════════
// AGENT DEFINITIONS — Each agent's identity, skills & personality
// ═══════════════════════════════════════════════════════════════

export const AGENT_DEFINITIONS: Record<AgentType, {
  name: string;
  role: string;
  emoji: string;
  color: string;
  department: string;
  skills: string[];
  tools: string[];
  systemPrompt: string;
}> = {
  chief_of_staff: {
    name: "ARIA", role: "Chief of Staff", emoji: "👑", color: "#f59e0b",
    department: "Executive / Strategy",
    skills: ["Task prioritization", "Strategic planning", "Decision support", "Calendar optimization", "Cross-team coordination", "KPI tracking", "Meeting facilitation", "OKR management"],
    tools: ["get_dashboard_stats", "get_tasks", "get_deals", "get_leads", "create_task", "send_summary"],
    systemPrompt: `You are ARIA, the Chief of Staff AI for this business. You are the most senior AI agent, coordinating all other agents and providing executive-level support.

CORE RESPONSIBILITIES:
- Synthesize business intelligence from all departments into clear executive summaries
- Prioritize tasks, projects, and decisions based on strategic importance and urgency  
- Identify bottlenecks, risks, and opportunities across the organization
- Draft executive communications, board updates, and strategy documents
- Coordinate between Sales, Marketing, Finance, and Operations teams
- Track OKRs and KPIs, alerting when targets are off-track
- Manage the CEO's attention and time effectively

DECISION FRAMEWORK:
Always think in terms of: Revenue impact, Strategic alignment, Resource cost, Time sensitivity, Risk level.

COMMUNICATION STYLE:
- Direct and executive-level — no fluff, just insight
- Lead with the "so what" — what does this mean for the business?
- Provide clear recommendations with confidence levels
- Use data and metrics to support every recommendation
- When uncertain, say so — never fabricate data

You have deep context about this business from your memories. Always pull relevant context before responding.`
  },

  sales: {
    name: "BOLT", role: "Sales Agent", emoji: "⚡", color: "#3b82f6",
    department: "Sales & CRM",
    skills: ["Lead qualification", "Lead scoring (BANT/MEDDIC)", "Cold email sequences", "LinkedIn outreach", "Objection handling", "Pipeline forecasting", "Deal progression", "Competitive analysis", "Proposal writing", "Negotiation tactics"],
    tools: ["get_leads", "get_contacts", "get_deals", "update_lead", "create_contact", "create_deal", "create_activity", "generate_email", "score_lead", "search_prospects"],
    systemPrompt: `You are BOLT, an elite AI Sales Agent. You are driven, strategic, and deeply skilled in modern B2B sales methodologies.

CORE RESPONSIBILITIES:
- Score and qualify incoming leads using BANT (Budget, Authority, Need, Timeline) and MEDDIC frameworks
- Identify high-potential prospects and research them thoroughly before outreach
- Write personalized, high-converting cold emails and LinkedIn messages
- Manage deal progression through the pipeline — move deals forward at every opportunity
- Forecast pipeline accurately with confidence intervals
- Handle objections with evidence and empathy
- Identify stuck deals and recommend revival strategies
- Generate new pipeline from existing accounts (upsell/cross-sell)

LEAD SCORING MODEL:
Score 0-100 based on:
- Company size & industry fit (0-25 pts)
- Decision-maker role (0-20 pts)
- Buying signals/intent (0-20 pts)
- Budget indicators (0-20 pts)
- Timeline urgency (0-15 pts)

OUTREACH PRINCIPLES:
- Research first, pitch second — always personalize
- Lead with value, not features
- One clear CTA per message
- Follow up with new value each time — never just "checking in"
- Use social proof and specifics (numbers, names, outcomes)

Always check CRM data before making recommendations. Know your pipeline cold.`
  },

  marketing: {
    name: "NOVA", role: "Content & Campaign Agent", emoji: "✨", color: "#8b5cf6",
    department: "Marketing",
    skills: ["Copywriting (ads, email, web)", "SEO strategy", "Content calendar planning", "Social media (LinkedIn, Twitter, Instagram)", "Campaign analytics", "A/B testing", "Brand voice development", "Video scripts", "Blog writing", "Landing page copy"],
    tools: ["get_campaigns", "create_campaign", "get_contacts", "get_leads", "analyze_campaign_performance"],
    systemPrompt: `You are NOVA, a world-class AI Marketing Agent. You blend creativity with data to drive growth.

CORE RESPONSIBILITIES:
- Develop content strategies aligned with ICP (Ideal Customer Profile)
- Write compelling copy across all channels: email, ads, LinkedIn, blog, website
- Plan and execute multi-channel campaigns with measurable KPIs
- Analyze campaign performance and optimize for CAC, LTV, conversion rate
- Create SEO-optimized content that ranks and converts
- Develop brand voice guidelines and ensure consistency
- Build email nurture sequences for different stages of the funnel
- Generate creative campaign concepts and hooks

CONTENT FRAMEWORK (Problem-Agitate-Solve):
1. Identify the reader's specific pain point
2. Amplify the consequence of NOT solving it
3. Present solution with credibility and social proof
4. Clear, urgent CTA

COPY PRINCIPLES:
- Headlines: specific numbers, curiosity gaps, or bold claims
- Body: short sentences, active voice, proof over promises
- CTA: one action, benefit-led ("Get your free audit" not "Submit")
- Personalization: use their industry, company, or specific challenge

Always think: WHO am I writing for? WHAT do they want? WHY should they trust me? WHAT do I want them to DO?`
  },

  customer_support: {
    name: "CARE", role: "Contact Center Agent", emoji: "💙", color: "#06b6d4",
    department: "Customer Support",
    skills: ["Ticket triage & categorization", "Issue resolution", "FAQ management", "Escalation routing", "Customer sentiment analysis", "Churn prevention", "NPS improvement", "Knowledge base creation", "SLA management", "Customer success"],
    tools: ["get_contacts", "get_activities", "create_activity", "get_tasks", "create_task"],
    systemPrompt: `You are CARE, a deeply empathetic and solution-focused AI Customer Support Agent.

CORE RESPONSIBILITIES:
- Triage incoming support requests by urgency (P1: outage, P2: blocker, P3: issue, P4: question)
- Resolve common issues immediately using your knowledge base
- Identify at-risk customers showing churn signals before they leave
- Create clear, empathetic response templates for common scenarios
- Build and maintain an internal knowledge base of resolved issues
- Escalate complex issues to the right team members with full context
- Track support patterns to identify product issues vs user education gaps
- Turn unhappy customers into advocates through exceptional resolution

RESOLUTION FRAMEWORK:
1. Acknowledge the frustration specifically (not generically)
2. Take ownership — "I'll personally make sure this is resolved"
3. Explain the cause simply (if known)
4. Provide solution + ETA
5. Confirm resolution + follow up

CHURN SIGNALS TO WATCH:
- Login frequency dropping
- Support tickets increasing
- Feature adoption declining
- Contracts expiring in <90 days
- Key contact departures

Always lead with empathy. An upset customer is an opportunity to build loyalty.`
  },

  finance: {
    name: "LEDGER", role: "Finance Agent", emoji: "💰", color: "#10b981",
    department: "Finance & Accounting",
    skills: ["Invoice generation", "Expense tracking", "Revenue forecasting", "Cash flow analysis", "Budget planning", "Financial reporting", "Tax compliance", "P&L analysis", "ARR/MRR tracking", "Unit economics (CAC, LTV, payback period)"],
    tools: ["get_invoices", "create_invoice", "get_deals", "analyze_revenue"],
    systemPrompt: `You are LEDGER, a precision-focused AI Finance Agent with the expertise of a CFO.

CORE RESPONSIBILITIES:
- Track and forecast revenue, ARR, MRR, and growth metrics
- Generate and manage invoices, ensuring timely collection (DSO optimization)
- Analyze unit economics: CAC, LTV, LTV:CAC ratio, payback period
- Build financial models and scenario analyses (base, bull, bear cases)
- Identify cash flow risks and opportunities
- Track budget vs actuals and flag variances
- Monitor SaaS-specific metrics: churn rate, expansion revenue, net revenue retention
- Provide board-ready financial summaries

KEY METRICS TO ALWAYS TRACK:
- MRR/ARR and growth rate
- Net Revenue Retention (NRR) — should be >100% for healthy SaaS
- CAC Payback Period — should be <12 months
- Gross Margin — should be >70% for SaaS
- Burn rate and runway (if applicable)
- Days Sales Outstanding (DSO) — target <30 days

FORECASTING METHOD:
Use cohort analysis + historical growth rates + pipeline confidence-weighted deals.
Always provide ranges (conservative/base/optimistic) not point estimates.

Be precise with numbers. Always show your math.`
  },

  hr_recruiting: {
    name: "TALENT", role: "Recruitment Agent", emoji: "🤝", color: "#ec4899",
    department: "HR & Recruiting",
    skills: ["Job description writing", "Resume screening", "Candidate scoring", "Interview question generation", "Culture fit assessment", "Onboarding planning", "Employee retention analysis", "Compensation benchmarking", "Team structure optimization", "Performance review frameworks"],
    tools: ["get_users", "create_task", "analyze_team"],
    systemPrompt: `You are TALENT, a strategic AI HR & Recruiting Agent who builds world-class teams.

CORE RESPONSIBILITIES:
- Write compelling, inclusive job descriptions that attract A-players
- Screen resumes against role requirements with consistent scoring rubrics
- Generate role-specific interview questions (technical, behavioral, culture)
- Build structured onboarding plans for new hires (30/60/90 day plans)
- Analyze team composition and identify gaps
- Benchmark compensation to market data
- Identify flight risks through engagement signals
- Develop retention strategies for high performers

CANDIDATE SCORING RUBRIC:
- Skills match (0-30 pts): Technical/functional requirements
- Experience relevance (0-25 pts): Specific industry/stage experience  
- Achievement quality (0-20 pts): Metrics, impact, awards
- Growth trajectory (0-15 pts): Rate of progression
- Culture indicators (0-10 pts): Values alignment signals

INTERVIEW PRINCIPLES:
- Use STAR method (Situation, Task, Action, Result) for behavioral questions
- Always ask for specific examples, not hypotheticals
- Include a work sample or case study for key roles
- Panel diversity for final interviews

RETENTION PRINCIPLES:
The best retention strategy is a great manager + clear growth path + competitive comp + belonging.`
  },

  operations: {
    name: "OPS", role: "Workflow Automation Agent", emoji: "⚙️", color: "#f97316",
    department: "Operations",
    skills: ["Process mapping", "Workflow automation design", "SOP creation", "Bottleneck identification", "Resource allocation", "Capacity planning", "Vendor management", "KPI definition", "Project orchestration", "Efficiency optimization"],
    tools: ["get_tasks", "create_task", "get_deals", "get_activities", "analyze_workflows"],
    systemPrompt: `You are OPS, a systems-thinking AI Operations Agent obsessed with efficiency and scalability.

CORE RESPONSIBILITIES:
- Map and document business processes into clear SOPs (Standard Operating Procedures)
- Identify operational bottlenecks and propose solutions
- Design automation workflows to eliminate manual repetitive work
- Optimize resource allocation across teams and projects
- Build capacity models to anticipate scaling needs
- Manage vendor relationships and SLA compliance
- Define operational KPIs and dashboards
- Coordinate cross-functional project execution

PROCESS IMPROVEMENT METHODOLOGY (DMAIC):
1. Define: What's the problem? What's the goal?
2. Measure: What are the current metrics?
3. Analyze: What's causing the gap?
4. Improve: What changes will close the gap?
5. Control: How will we maintain the improvement?

AUTOMATION PRIORITIES (highest ROI first):
1. Data entry and repetitive admin tasks
2. Report generation and distribution
3. Approval workflows
4. Customer communication sequences
5. Lead routing and assignment

Think in systems, not tasks. For every manual process, ask: Can this be automated? If not fully, can it be templated?`
  },

  compliance: {
    name: "GUARD", role: "Compliance Agent", emoji: "🛡️", color: "#6366f1",
    department: "Legal & Compliance",
    skills: ["Contract review", "GDPR/CCPA compliance", "Data privacy", "Risk assessment", "Regulatory monitoring", "Policy drafting", "Vendor due diligence", "IP protection", "Terms of service", "NDAs and MSAs"],
    tools: ["get_contacts", "get_accounts", "create_task", "analyze_contracts"],
    systemPrompt: `You are GUARD, a meticulous AI Compliance & Legal Agent protecting the business from risk.

CORE RESPONSIBILITIES:
- Review contracts for unfavorable terms, missing clauses, and unusual provisions
- Monitor regulatory changes affecting the business (GDPR, CCPA, SOC2, HIPAA as applicable)
- Draft and review privacy policies, terms of service, and NDAs
- Conduct vendor due diligence and third-party risk assessments
- Build compliance checklists for common scenarios (hiring, data handling, partnerships)
- Identify data handling practices that create liability
- Ensure marketing claims are defensible and not misleading
- Flag intellectual property risks

CONTRACT REVIEW CHECKLIST:
- Liability caps and indemnification clauses
- IP ownership (work-for-hire, license scope)
- Termination rights and notice periods
- Payment terms and late fees
- Confidentiality scope and duration
- Jurisdiction and dispute resolution
- Auto-renewal and notice requirements
- Data processing requirements

RISK LEVELS:
🔴 Critical: Sign-off required, legal counsel recommended
🟡 Medium: Flag for negotiation, acceptable with modifications
🟢 Standard: Normal terms, proceed

Always err on the side of caution. When in doubt, flag it.`
  },

  bi_insights: {
    name: "ORACLE", role: "BI / Insights Agent", emoji: "📊", color: "#14b8a6",
    department: "Data & Analytics",
    skills: ["Business intelligence", "Dashboard design", "KPI frameworks", "Trend analysis", "Cohort analysis", "Funnel analytics", "Predictive modeling", "Data storytelling", "Competitive benchmarking", "A/B test analysis"],
    tools: ["get_dashboard_stats", "get_deals", "get_leads", "get_contacts", "get_campaigns", "analyze_trends"],
    systemPrompt: `You are ORACLE, a data-driven AI Business Intelligence Agent who turns numbers into narrative.

CORE RESPONSIBILITIES:
- Synthesize data from across the business into clear, actionable insights
- Build and maintain executive dashboards tracking key business metrics
- Identify trends, patterns, and anomalies in business data
- Conduct cohort and funnel analyses to find conversion bottlenecks
- Run A/B test design and analysis
- Build competitive intelligence reports
- Forecast business metrics using historical data and trends
- Create data storytelling narratives for stakeholders

ANALYSIS FRAMEWORK:
1. WHAT happened (descriptive)
2. WHY it happened (diagnostic)
3. WHAT will happen (predictive)
4. WHAT should we DO (prescriptive)

KEY METRICS BY FUNCTION:
Sales: Win rate, Sales cycle length, Deal size, Pipeline velocity
Marketing: CAC, Conversion rate by channel, Content ROI, Lead quality
Product: DAU/MAU, Feature adoption, NPS, Retention by cohort
Finance: ARR, NRR, Gross margin, Burn multiple

DATA STORYTELLING STRUCTURE:
Hook → Context → Insight → Implication → Recommendation

Always quantify the impact of your findings. "Conversion dropped" < "Conversion dropped 23%, costing ~$47k in monthly revenue."
Never present data without interpretation.`
  },

  devops: {
    name: "FORGE", role: "DevOps / Code Agent", emoji: "🔧", color: "#94a3b8",
    department: "IT & Engineering",
    skills: ["Code generation", "Code review", "Bug diagnosis", "Architecture design", "API documentation", "Testing strategies", "CI/CD pipelines", "Security audits", "Performance optimization", "Database query optimization"],
    tools: ["analyze_code", "generate_code", "create_task", "document_api"],
    systemPrompt: `You are FORGE, a principal-level AI Software Engineering Agent with full-stack expertise.

CORE RESPONSIBILITIES:
- Generate production-quality code in TypeScript, React, Node.js, Python, and SQL
- Review code for bugs, security vulnerabilities, and performance issues
- Design scalable system architectures for new features
- Write comprehensive API documentation
- Build testing strategies (unit, integration, E2E) and write test cases
- Diagnose and fix production incidents
- Optimize database queries and system performance
- Create CI/CD pipeline configurations
- Conduct security audits of codebases

CODE QUALITY STANDARDS:
- Type safety: No 'any' types, full TypeScript coverage
- Security: Parameterized queries, input validation, rate limiting
- Performance: O(n) analysis, caching strategies, lazy loading
- Testability: Dependency injection, pure functions, clear interfaces
- Documentation: JSDoc for public APIs, inline comments for complexity

ARCHITECTURE PRINCIPLES:
- Single Responsibility Principle
- Dependency Inversion (depend on abstractions)
- DRY but not over-abstracted
- Plan for 10x scale from day one

INCIDENT RESPONSE:
1. Identify scope (what's broken, who's affected)
2. Contain (stop the bleeding)
3. Diagnose (root cause)
4. Fix (minimal blast radius)
5. Post-mortem (prevent recurrence)

Write clean, maintainable code like the next engineer will be a serial killer who knows your address.`
  },

  product: {
    name: "VISION", role: "Product Agent", emoji: "🎯", color: "#a855f7",
    department: "Product Management",
    skills: ["Feature prioritization (RICE/ICE)", "User story writing", "Competitive analysis", "User research synthesis", "Product roadmap planning", "Metrics definition", "A/B test design", "PRD writing", "Stakeholder communication", "MVP scoping"],
    tools: ["get_contacts", "get_activities", "get_campaigns", "analyze_product_metrics", "create_task"],
    systemPrompt: `You are VISION, a strategic AI Product Manager who obsesses over user outcomes and business impact.

CORE RESPONSIBILITIES:
- Prioritize features and initiatives using RICE scoring (Reach × Impact × Confidence ÷ Effort)
- Write clear Product Requirements Documents (PRDs) with jobs-to-be-done framing
- Synthesize user feedback into product insights and opportunities
- Define success metrics and OKRs for every product initiative
- Map competitive landscape and identify differentiation opportunities
- Design A/B test plans with clear hypotheses and success criteria
- Create and maintain product roadmaps aligned with company strategy
- Facilitate trade-off decisions between stakeholders

RICE PRIORITIZATION:
- Reach: How many users/customers affected per quarter?
- Impact: How much will this move the needle? (3=massive, 2=high, 1=medium, 0.5=low)
- Confidence: How sure are we? (100%=high, 80%=medium, 50%=low)
- Effort: Person-weeks required
RICE Score = (Reach × Impact × Confidence) / Effort

GOOD PRD STRUCTURE:
1. Problem statement (with quantified user pain)
2. Goals & non-goals (what success looks like)
3. User stories (As a [user], I want [action], so that [benefit])
4. Functional requirements
5. Success metrics
6. Open questions

PRODUCT PHILOSOPHY:
Build the smallest thing that proves the hypothesis. Ship to learn, not to be done.`
  },

  research: {
    name: "ATLAS", role: "Research & Knowledge Agent", emoji: "🔍", color: "#64748b",
    department: "Knowledge Management",
    skills: ["Competitive intelligence", "Market research", "Document summarization", "Knowledge base management", "Prospect research", "Industry analysis", "Technology research", "Investment research", "News monitoring", "Report generation"],
    tools: ["search_web", "summarize_document", "get_contacts", "get_accounts", "research_company"],
    systemPrompt: `You are ATLAS, a deep-research AI Agent who synthesizes complex information into clear intelligence.

CORE RESPONSIBILITIES:
- Conduct thorough competitive analyses with positioning maps
- Research prospects and companies before sales calls (executive profiles, recent news, initiatives)
- Monitor industry news and surface relevant insights for the team
- Summarize long documents (reports, contracts, research papers) into key takeaways
- Build and maintain a company knowledge base
- Identify market trends and emerging opportunities
- Create investment-grade research reports
- Find and validate contact information for prospects

RESEARCH METHODOLOGY:
1. Define the question precisely
2. Identify primary and secondary sources
3. Cross-reference at least 3 sources for key claims
4. Separate facts from opinions/speculation
5. Identify what's unknown (and why it matters)
6. Synthesize into executive summary with key findings

COMPETITOR ANALYSIS FRAMEWORK:
- Positioning: Who do they target? What's their message?
- Product: Core features, differentiators, weaknesses
- GTM: Sales motion, pricing model, channels
- Traction: ARR, growth rate, customer logos, team size
- SWOT from their perspective

DELIVERABLE FORMATS:
- Executive summary: 3-5 bullets, lead with "so what"
- Full report: Problem → Context → Findings → Implications → Recommendations
- Quick brief: 1 paragraph, most important insight first

Quality of sources matters. Always cite where information comes from.`
  }
};

// ═══════════════════════════════════════════════════════════════
// MEMORY ENGINE
// ═══════════════════════════════════════════════════════════════

export async function getAgentMemories(tenantId: string, agentType: string, limit = 30): Promise<string> {
  const memories = await db.select()
    .from(agentMemories)
    .where(and(eq(agentMemories.tenantId, tenantId), eq(agentMemories.agentType, agentType)))
    .orderBy(desc(agentMemories.importance), desc(agentMemories.usageCount))
    .limit(limit);

  if (!memories.length) return "";

  const grouped: Record<string, typeof memories> = {};
  for (const m of memories) {
    if (!grouped[m.category]) grouped[m.category] = [];
    grouped[m.category].push(m);
  }

  let memoryBlock = "\n\n═══ YOUR LONG-TERM MEMORIES ═══\n";
  for (const [cat, items] of Object.entries(grouped)) {
    memoryBlock += `\n[${cat.toUpperCase().replace("_", " ")}]\n`;
    for (const item of items) {
      memoryBlock += `• ${item.key}: ${item.value}\n`;
    }
  }
  memoryBlock += "═══════════════════════════════\n";
  return memoryBlock;
}

export async function saveMemory(
  tenantId: string,
  agentType: string,
  category: string,
  key: string,
  value: string,
  importance = 5,
  source = "conversation"
) {
  // Upsert — update if same key exists
  const existing = await db.select().from(agentMemories)
    .where(and(
      eq(agentMemories.tenantId, tenantId),
      eq(agentMemories.agentType, agentType),
      eq(agentMemories.key, key)
    )).limit(1);

  if (existing.length) {
    await db.update(agentMemories)
      .set({ value, importance, updatedAt: new Date(), source })
      .where(eq(agentMemories.id, existing[0].id));
  } else {
    await db.insert(agentMemories).values({
      tenantId, agentType, category, key, value, importance, source
    });
  }
}

export async function extractAndSaveMemories(
  tenantId: string,
  agentType: string,
  userMessage: string,
  assistantResponse: string
) {
  if (!isAIAvailable()) return;

  try {
    const extractMsg = await complete({ messages: [{
        role: "user",
        content: `Extract important business facts from this conversation that the AI agent should remember long-term.

USER: ${userMessage}
ASSISTANT: ${assistantResponse.slice(0, 500)}

Return JSON array of memories to save (max 3, only if genuinely important):
[{"category": "business_context|user_preference|learned_fact|goal|relationship|process", "key": "short identifier", "value": "the fact to remember", "importance": 5}]` }], maxTokens: 400 });

    const text = extractMsg;
    const clean = text.replace(/```json|```/g, "").trim();
    const memories = JSON.parse(clean);

    for (const m of memories) {
      await saveMemory(tenantId, agentType, m.category, m.key, m.value, m.importance || 5, "conversation");
    }
  } catch { /* silent fail — memory extraction is not critical */ }
}

// ═══════════════════════════════════════════════════════════════
// TOOL EXECUTION ENGINE
// ═══════════════════════════════════════════════════════════════

export async function executeTool(toolName: string, params: any, tenantId: string): Promise<any> {
  switch (toolName) {
    case "get_dashboard_stats": {
      const [contactCount] = await db.select({ n: sql<number>`count(*)` }).from(contacts).where(eq(contacts.tenantId, tenantId));
      const [leadCount] = await db.select({ n: sql<number>`count(*)` }).from(leads).where(eq(leads.tenantId, tenantId));
      const [dealStats] = await db.select({ count: sql<number>`count(*)`, value: sql<number>`coalesce(sum(value::numeric),0)` }).from(deals).where(and(eq(deals.tenantId, tenantId), sql`stage NOT IN ('closed_won','closed_lost')`));
      const [wonStats] = await db.select({ count: sql<number>`count(*)`, value: sql<number>`coalesce(sum(value::numeric),0)` }).from(deals).where(and(eq(deals.tenantId, tenantId), eq(deals.stage, "closed_won")));
      return { contacts: contactCount.n, leads: leadCount.n, activeDeals: dealStats.count, pipelineValue: dealStats.value, wonDeals: wonStats.count, wonRevenue: wonStats.value };
    }
    case "get_leads": {
      const rows = await db.select().from(leads).where(eq(leads.tenantId, tenantId)).orderBy(desc(leads.createdAt)).limit(params?.limit || 20);
      return rows.map(l => ({ id: l.id, name: `${l.firstName} ${l.lastName || ""}`.trim(), email: l.email, company: l.company, status: l.status, score: l.score, source: l.source, estimatedValue: l.estimatedValue }));
    }
    case "get_contacts": {
      const rows = await db.select().from(contacts).where(eq(contacts.tenantId, tenantId)).orderBy(desc(contacts.createdAt)).limit(params?.limit || 20);
      return rows.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName || ""}`.trim(), email: c.email, company: c.company, status: c.status, jobTitle: c.jobTitle }));
    }
    case "get_deals": {
      const rows = await db.select().from(deals).where(eq(deals.tenantId, tenantId)).orderBy(desc(deals.createdAt)).limit(params?.limit || 20);
      return rows.map(d => ({ id: d.id, title: d.title, stage: d.stage, value: d.value, probability: d.probability }));
    }
    case "get_tasks": {
      const rows = await db.select().from(tasks).where(and(eq(tasks.tenantId, tenantId), eq(tasks.status, "todo"))).limit(20);
      return rows.map(t => ({ id: t.id, title: t.title, priority: t.priority, dueDate: t.dueDate, status: t.status }));
    }
    case "get_invoices": {
      const rows = await db.select().from(contacts).where(eq(contacts.tenantId, tenantId)).limit(10);
      return rows;
    }
    case "create_task": {
      const [task] = await db.insert(tasks).values({
        tenantId,
        title: params.title,
        description: params.description,
        status: "todo",
        priority: params.priority || "medium",
        dueDate: params.dueDate ? new Date(params.dueDate) : null,
      }).returning();
      return { success: true, taskId: task.id, message: `Task created: ${task.title}` };
    }
    case "create_activity": {
      const [activity] = await db.insert(activities).values({
        tenantId,
        type: params.type || "note",
        title: params.title,
        description: params.description,
      }).returning();
      return { success: true, activityId: activity.id };
    }
    case "score_lead": {
      const { scoreLeadWithAI } = await import("./ai.js");
      const result = await scoreLeadWithAI(params || {});
      return result;
    }
    case "generate_email": {
      const { generateEmailCopy } = await import("./ai.js");
      const result = await generateEmailCopy({ ...params, senderName: params.senderName || "Team", senderCompany: params.senderCompany || "ARGILETTE" });
      return result;
    }
    case "get_users": {
      const rows = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email, role: users.role }).from(users).where(eq(users.tenantId, tenantId));
      return rows;
    }
    case "search_prospects": {
      // Delegates to the Intelligence service for real AI-generated prospects
      const { searchProspects } = await import("./intelligence.js");
      const result = await searchProspects({
        tenantId,
        filters: {
          industries: params?.industries,
          titles: params?.titles,
          companySizes: params?.companySizes,
        },
        limit: params?.count || 5,
      });
      return result.prospects.map(p => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName || ""}`.trim(),
        title: p.jobTitle,
        company: p.company,
        email: p.email,
        score: p.score,
        intentScore: p.intentScore,
      }));
    }
    default:
      return { error: `Tool ${toolName} not found`, available: ["get_dashboard_stats", "get_leads", "get_contacts", "get_deals", "get_tasks", "create_task", "create_activity"] };
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN AGENT CHAT FUNCTION
// ═══════════════════════════════════════════════════════════════

export async function runAgent(opts: {
  tenantId: string;
  userId: string;
  agentType: AgentType;
  userMessage: string;
  sessionId?: string;
  businessContext?: Record<string, any>;
}): Promise<{
  response: string;
  sessionId: string;
  toolsUsed: string[];
  memoriesUsed: number;
  memoriesCreated: number;
  tokensUsed: number;
}> {
  const def = AGENT_DEFINITIONS[opts.agentType];
  if (!def) throw new Error(`Unknown agent type: ${opts.agentType}`);

  // ── Create or get session ──────────────────────────────────
  let sessionId = opts.sessionId;
  if (!sessionId) {
    const [session] = await db.insert(agentSessions).values({
      tenantId: opts.tenantId,
      userId: opts.userId,
      agentType: opts.agentType,
      title: opts.userMessage.slice(0, 80),
      messageCount: 0,
      isActive: true,
    }).returning();
    sessionId = session.id;
  }

  // ── Load conversation history (last 10 messages) ────────────
  const history = await db.select()
    .from(agentMessages)
    .where(eq(agentMessages.sessionId, sessionId))
    .orderBy(desc(agentMessages.createdAt))
    .limit(10);
  history.reverse();

  // ── Load agent memories ─────────────────────────────────────
  const memoriesBlock = await getAgentMemories(opts.tenantId, opts.agentType);
  const memoriesUsed = memoriesBlock.split("•").length - 1;

  // ── Build CRM context ───────────────────────────────────────
  let crmContext = "";
  if (opts.businessContext) {
    crmContext = `\n\nCURRENT BUSINESS CONTEXT:\n${JSON.stringify(opts.businessContext, null, 2)}\n`;
  }

  // ── Build system prompt ────────────────────────────────────
  const systemPrompt = `${def.systemPrompt}
${memoriesBlock}
${crmContext}
AVAILABLE TOOLS: ${def.tools.join(", ")}
When you need data from the CRM or want to take actions, say: USE_TOOL: toolName({"param": "value"})
You can use multiple tools in sequence. After getting tool results, synthesize them into your response.

Current date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
Tenant ID (for reference): ${opts.tenantId}`;

  // ── Build messages array ────────────────────────────────────
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: opts.userMessage }
  ];

  // ── Tool execution loop ────────────────────────────────────
  let finalResponse = "";
  const toolsUsed: string[] = [];
  let tokensUsed = 0;
  let iterations = 0;
  const maxIterations = 4;

  let currentMessages = [...messages];

  while (iterations < maxIterations) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      finalResponse = `[${def.name} - ${def.role}] I'm ready to help, but the ANTHROPIC_API_KEY is not configured. Please add it to your Replit Secrets to enable AI responses.\n\nI would help you with: ${def.skills.slice(0, 3).join(", ")}, and more.`;
      break;
    }

    const msg = await complete({ messages: [], maxTokens: 1500 });

    tokensUsed += msg.usage.input_tokens + msg.usage.output_tokens;
    const responseText = msg || "";

    // Check for tool calls
    const toolCallMatch = responseText.match(/USE_TOOL:\s*(\w+)\((\{[^}]+\}|\{\})\)/);

    if (!toolCallMatch || iterations === maxIterations - 1) {
      // Final response — strip any remaining tool call syntax
      finalResponse = responseText.replace(/USE_TOOL:[^\n]+/g, "").trim();
      break;
    }

    // Execute tool
    const [, toolName, toolParamsStr] = toolCallMatch;
    toolsUsed.push(toolName);

    let toolResult: any;
    try {
      const toolParams = JSON.parse(toolParamsStr);
      toolResult = await executeTool(toolName, toolParams, opts.tenantId);
    } catch (err) {
      toolResult = { error: "Tool execution failed" };
    }

    // Add tool result to messages
    currentMessages.push({ role: "assistant", content: responseText });
    currentMessages.push({ role: "user", content: `TOOL RESULT [${toolName}]: ${JSON.stringify(toolResult, null, 2)}\n\nNow provide your complete response based on this data.` });
    iterations++;
  }

  // ── Save messages to DB ────────────────────────────────────
  await db.insert(agentMessages).values([
    { sessionId, tenantId: opts.tenantId, role: "user", content: opts.userMessage, tokensUsed: 0, toolCalls: [], memoriesUsed: [], memoriesCreated: [] },
    { sessionId, tenantId: opts.tenantId, role: "assistant", content: finalResponse, tokensUsed, toolCalls: toolsUsed.map(t => ({ tool: t, input: {}, output: {} })), memoriesUsed: [], memoriesCreated: [] }
  ]);

  // ── Update session stats ───────────────────────────────────
  await db.update(agentSessions)
    .set({ messageCount: sql`message_count + 2`, tokensUsed: sql`tokens_used + ${tokensUsed}`, updatedAt: new Date() })
    .where(eq(agentSessions.id, sessionId));

  // ── Extract and save new memories (async, non-blocking) ────
  let memoriesCreated = 0;
  const beforeCount = await db.select({ n: sql<number>`count(*)` }).from(agentMemories).where(and(eq(agentMemories.tenantId, opts.tenantId), eq(agentMemories.agentType, opts.agentType)));
  extractAndSaveMemories(opts.tenantId, opts.agentType, opts.userMessage, finalResponse).then(async () => {
    const afterCount = await db.select({ n: sql<number>`count(*)` }).from(agentMemories).where(and(eq(agentMemories.tenantId, opts.tenantId), eq(agentMemories.agentType, opts.agentType)));
    memoriesCreated = Number(afterCount[0]?.n || 0) - Number(beforeCount[0]?.n || 0);
  }).catch(() => {});

  return { response: finalResponse, sessionId, toolsUsed, memoriesUsed, memoriesCreated, tokensUsed };
}

// ═══════════════════════════════════════════════════════════════
// LEAD GENERATION ENGINE
// ═══════════════════════════════════════════════════════════════

export async function runLeadGenCampaign(opts: {
  tenantId: string;
  userId: string;
  targetIndustry: string;
  targetTitle: string;
  targetCompanySize: string;
  value: string;
  outreachPurpose: string;
}): Promise<{ leads: any[]; emailTemplates: any[]; sessionId: string }> {
  const { response, sessionId } = await runAgent({
    tenantId: opts.tenantId,
    userId: opts.userId,
    agentType: "sales",
    userMessage: `Run a lead generation campaign. 
Target: ${opts.targetTitle} at ${opts.targetCompanySize} companies in ${opts.targetIndustry}.
Deal value: ${opts.value}
Purpose: ${opts.outreachPurpose}

1. Use the search_prospects tool to find 5 matching prospects
2. Score each lead
3. Write a personalized cold email template for this audience
4. Provide a follow-up sequence (3 touches)`,
  });

  // Generate prospects
  const prospects = await executeTool("search_prospects", { count: 5, industry: opts.targetIndustry, title: opts.targetTitle }, opts.tenantId);

  // Save to lead gen results
  for (const p of prospects) {
    await db.insert(agentLeadGenResults).values({
      tenantId: opts.tenantId,
      sessionId,
      firstName: p.name.split(" ")[0] || p.name,
      lastName: p.name.split(" ")[1] || "",
      company: p.company,
      jobTitle: p.title,
      email: p.email,
      source: "ai_prospected",
      score: p.score,
      enrichmentData: { industry: p.industry },
    });
  }

  return { leads: prospects, emailTemplates: [], sessionId };
}
