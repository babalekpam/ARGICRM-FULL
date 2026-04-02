/**
 * ARGILETTE SKILLS MASTER INDEX
 * 
 * Aggregates all domain skill files into one registry.
 * Import from here for everything skills-related.
 */

import { BusinessSkill, SkillDomain, DOMAIN_META } from "./types.js";

// ── Existing domains (from original skills.ts) ─────────────────
import { SALES_SKILLS } from "./sales.js";
import { MARKETING_SKILLS } from "./marketing.js";
import { CS_SKILLS } from "./cs.js";
import { FINANCE_SKILLS } from "./finance.js";
import { HR_SKILLS } from "./hr.js";
import { OPS_SKILLS } from "./ops.js";
import { PRODUCT_SKILLS } from "./product.js";
import { AFRICA_SKILLS } from "./africa.js";
import { STRATEGY_SKILLS } from "./strategy.js";
import { AI_SKILLS } from "./ai_automation.js";

// ── New domains ────────────────────────────────────────────────
import { LEGAL_SKILLS } from "./legal.js";
import { IT_SKILLS } from "./it.js";
import { CYBERSECURITY_SKILLS } from "./cybersecurity.js";
import { DATA_SKILLS } from "./data_analytics.js";
import { HEALTHCARE_SKILLS } from "./healthcare.js";
import { EDUCATION_SKILLS } from "./education.js";
import { ECOMMERCE_SKILLS } from "./ecommerce.js";
import { MANUFACTURING_SKILLS } from "./manufacturing.js";
import { CREATIVE_SKILLS } from "./creative.js";
import { NONPROFIT_SKILLS } from "./nonprofit.js";
import { EXECUTIVE_SKILLS } from "./executive.js";
import { HOSPITALITY_SKILLS } from "./hospitality.js";
import { ENERGY_SKILLS } from "./energy.js";

// ── Master registry ────────────────────────────────────────────
export const ALL_SKILLS: BusinessSkill[] = [
  ...SALES_SKILLS,
  ...MARKETING_SKILLS,
  ...CS_SKILLS,
  ...FINANCE_SKILLS,
  ...HR_SKILLS,
  ...OPS_SKILLS,
  ...LEGAL_SKILLS,
  ...PRODUCT_SKILLS,
  ...STRATEGY_SKILLS,
  ...IT_SKILLS,
  ...CYBERSECURITY_SKILLS,
  ...DATA_SKILLS,
  ...AFRICA_SKILLS,
  ...HEALTHCARE_SKILLS,
  ...EDUCATION_SKILLS,
  ...ECOMMERCE_SKILLS,
  ...MANUFACTURING_SKILLS,
  ...CREATIVE_SKILLS,
  ...NONPROFIT_SKILLS,
  ...EXECUTIVE_SKILLS,
  ...HOSPITALITY_SKILLS,
  ...ENERGY_SKILLS,
  ...AI_SKILLS,
];

export const SKILLS_BY_DOMAIN: Record<SkillDomain, BusinessSkill[]> = {
  sales: SALES_SKILLS,
  marketing: MARKETING_SKILLS,
  customer_success: CS_SKILLS,
  finance: FINANCE_SKILLS,
  hr: HR_SKILLS,
  operations: OPS_SKILLS,
  legal: LEGAL_SKILLS,
  product: PRODUCT_SKILLS,
  intelligence: DATA_SKILLS,
  strategy: STRATEGY_SKILLS,
  africa: AFRICA_SKILLS,
  ai_automation: AI_SKILLS,
  it: IT_SKILLS,
  cybersecurity: CYBERSECURITY_SKILLS,
  data_analytics: DATA_SKILLS,
  healthcare: HEALTHCARE_SKILLS,
  education: EDUCATION_SKILLS,
  ecommerce: ECOMMERCE_SKILLS,
  manufacturing: MANUFACTURING_SKILLS,
  logistics: [],
  real_estate: [],
  nonprofit: NONPROFIT_SKILLS,
  creative: CREATIVE_SKILLS,
  executive: EXECUTIVE_SKILLS,
  hospitality: HOSPITALITY_SKILLS,
  energy: ENERGY_SKILLS,
};

// ── Helper functions ─────────────────────────────────────────────

export function getSkillById(id: string): BusinessSkill | undefined {
  return ALL_SKILLS.find(s => s.id === id);
}

export function getSkillsByDomain(domain: SkillDomain): BusinessSkill[] {
  return SKILLS_BY_DOMAIN[domain] || [];
}

export function getSkillsByAgent(agentType: string): BusinessSkill[] {
  return ALL_SKILLS.filter(s => s.agentsWhoUseThis.includes(agentType));
}

export function searchSkills(query: string): BusinessSkill[] {
  const q = query.toLowerCase();
  return ALL_SKILLS.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.tags.some(t => t.toLowerCase().includes(q)) ||
    s.domain.includes(q)
  );
}

export function buildPrompt(skill: BusinessSkill, inputs: Record<string, string>): string {
  let prompt = skill.prompt;
  for (const [key, value] of Object.entries(inputs)) {
    prompt = prompt.replaceAll(`{{${key}}}`, value || `[${key} not provided]`);
  }
  // Clean any unreplaced placeholders with a sensible default
  prompt = prompt.replace(/\{\{[^}]+\}\}/g, "[not specified]");
  return prompt;
}

export function getSkillStats() {
  const byDomain = Object.entries(SKILLS_BY_DOMAIN)
    .map(([domain, skills]) => ({ domain, count: skills.length }))
    .filter(d => d.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    total: ALL_SKILLS.length,
    domains: Object.keys(SKILLS_BY_DOMAIN).filter(d => (SKILLS_BY_DOMAIN[d as SkillDomain] || []).length > 0).length,
    byDomain,
    topAgents: Object.entries(
      ALL_SKILLS.flatMap(s => s.agentsWhoUseThis).reduce((acc, a) => {
        acc[a] = (acc[a] || 0) + 1; return acc;
      }, {} as Record<string, number>)
    ).sort(([, a], [, b]) => b - a).slice(0, 5),
  };
}

// Re-export types
export type { BusinessSkill, SkillDomain, SkillInput } from "./types.js";
export { DOMAIN_META } from "./types.js";
