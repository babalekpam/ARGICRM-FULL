/**
 * ARGILETTE SKILL TYPES
 * Shared types for the entire skills library
 */

export interface SkillInput {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "select";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export type SkillDomain =
  | "sales" | "marketing" | "customer_success" | "finance"
  | "hr" | "operations" | "legal" | "product" | "intelligence"
  | "strategy" | "africa" | "ai_automation" | "it" | "cybersecurity"
  | "data_analytics" | "healthcare" | "education" | "ecommerce"
  | "manufacturing" | "logistics" | "real_estate" | "nonprofit"
  | "creative" | "executive" | "hospitality" | "energy";

export interface BusinessSkill {
  id: string;
  name: string;
  domain: SkillDomain;
  description: string;
  prompt: string;
  inputs: SkillInput[];
  outputFormat: "text" | "json" | "markdown" | "email" | "table";
  agentsWhoUseThis: string[];
  tags: string[];
  estimatedTokens: number;
}

export const DOMAIN_META: Record<SkillDomain, { label: string; color: string; emoji: string; description: string }> = {
  sales:            { label: "Sales & Revenue",       color: "#3b82f6", emoji: "⚡", description: "Cold outreach, proposals, objection handling, deal management" },
  marketing:        { label: "Marketing & Content",   color: "#8b5cf6", emoji: "✨", description: "Content, ads, email campaigns, SEO, social media, PR" },
  customer_success: { label: "Customer Success",      color: "#06b6d4", emoji: "💙", description: "Churn prevention, QBRs, support, onboarding, NPS" },
  finance:          { label: "Finance & Accounting",  color: "#10b981", emoji: "💰", description: "Investor updates, unit economics, budgeting, M&A" },
  hr:               { label: "HR & People",           color: "#f59e0b", emoji: "🤝", description: "Recruiting, performance, onboarding, culture, compensation" },
  operations:       { label: "Operations",            color: "#f97316", emoji: "⚙️", description: "SOPs, OKRs, supply chain, process optimization, lean" },
  legal:            { label: "Legal & Compliance",    color: "#64748b", emoji: "🛡️", description: "Contracts, GDPR, IP, risk, policies, regulatory" },
  product:          { label: "Product Management",    color: "#ec4899", emoji: "🎯", description: "PRDs, roadmaps, user research, pricing, launch strategy" },
  intelligence:     { label: "Business Intelligence", color: "#14b8a6", emoji: "📊", description: "Data analysis, KPI frameworks, dashboards, reporting" },
  strategy:         { label: "Executive Strategy",    color: "#a855f7", emoji: "👑", description: "Board memos, competitive analysis, M&A, VC pitch" },
  africa:           { label: "Africa & Emerging",     color: "#22c55e", emoji: "🌍", description: "Market entry, mobile money, francophone, ECOWAS strategy" },
  ai_automation:    { label: "AI & Automation",       color: "#6366f1", emoji: "🤖", description: "Prompt engineering, workflow automation, RAG, fine-tuning" },
  it:               { label: "IT & Infrastructure",   color: "#0ea5e9", emoji: "🖥️", description: "Architecture, CI/CD, incident response, API docs, cloud" },
  cybersecurity:    { label: "Cybersecurity",         color: "#ef4444", emoji: "🔒", description: "Security audits, threat modeling, SIEM, pentest, CSIRT" },
  data_analytics:   { label: "Data & Analytics",      color: "#f472b6", emoji: "📈", description: "SQL, dashboards, ML strategy, A/B testing, data engineering" },
  healthcare:       { label: "Healthcare & MedTech",  color: "#34d399", emoji: "🏥", description: "Clinical ops, HIPAA, patient journey, telehealth, trials" },
  education:        { label: "Education & EdTech",    color: "#fbbf24", emoji: "🎓", description: "Curriculum, LMS, assessment, grant writing, pedagogy" },
  ecommerce:        { label: "E-commerce & Retail",   color: "#fb7185", emoji: "🛒", description: "Store ops, Amazon, DTC, logistics, returns, merchandising" },
  manufacturing:    { label: "Manufacturing",         color: "#78716c", emoji: "🏭", description: "Lean, quality control, supply chain, ISO, production planning" },
  logistics:        { label: "Logistics & Supply Chain", color: "#84cc16", emoji: "🚚", description: "Route optimization, freight, 3PL, inventory, customs" },
  real_estate:      { label: "Real Estate",           color: "#fb923c", emoji: "🏠", description: "Listings, due diligence, negotiation, investment analysis" },
  nonprofit:        { label: "Nonprofit & NGO",       color: "#a78bfa", emoji: "🌱", description: "Grant writing, donor relations, impact reporting, fundraising" },
  creative:         { label: "Creative & Brand",      color: "#e879f9", emoji: "🎨", description: "Copywriting, brand strategy, video scripts, PR, storytelling" },
  executive:        { label: "Executive Leadership",  color: "#c084fc", emoji: "💼", description: "Executive coaching, 1:1s, feedback, decision frameworks" },
  hospitality:      { label: "Hospitality & Tourism", color: "#2dd4bf", emoji: "🏨", description: "F&B, hotel ops, events, guest experience, travel" },
  energy:           { label: "Energy & Sustainability", color: "#4ade80", emoji: "⚡", description: "ESG reporting, solar, renewable, sustainability strategy" },
};
