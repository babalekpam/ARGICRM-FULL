import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { isAIAvailable } from "../services/ai-adapter.js";
import { askForTenant } from "../services/tenant-ai.js";
import {
  ALL_SKILLS, SKILLS_BY_DOMAIN, DOMAIN_META, getSkillStats,
  getSkillById, getSkillsByAgent, searchSkills, buildPrompt,
  type SkillDomain
} from "../services/skills/index.js";

const router = Router();

// ── List all skills ────────────────────────────────────────────
router.get("/", authenticate, (req: AuthRequest, res) => {
  const { domain, agent, search } = req.query as any;

  let skills = ALL_SKILLS;
  if (domain) skills = SKILLS_BY_DOMAIN[domain as SkillDomain] || [];
  if (agent) skills = getSkillsByAgent(agent);
  if (search) skills = searchSkills(search);

  res.json({
    skills: skills.map(s => ({
      id: s.id, name: s.name, domain: s.domain,
      description: s.description, tags: s.tags,
      inputs: s.inputs, outputFormat: s.outputFormat,
      agentsWhoUseThis: s.agentsWhoUseThis,
      estimatedTokens: s.estimatedTokens,
    })),
    total: skills.length,
  });
});

// ── List domains ───────────────────────────────────────────────
router.get("/domains", authenticate, (req: AuthRequest, res) => {
  const domains = Object.entries(DOMAIN_META).map(([key, meta]) => ({
    id: key,
    ...meta,
    skillCount: SKILLS_BY_DOMAIN[key as SkillDomain]?.length || 0,
  }));
  res.json(domains);
});

// ── Get single skill ───────────────────────────────────────────
router.get("/:skillId", authenticate, (req: AuthRequest, res) => {
  const skill = getSkillById(req.params.skillId);
  if (!skill) return res.status(404).json({ error: "Skill not found" });
  res.json(skill);
});

// ── Run a skill ─────────────────────────────────────────────────
router.post("/:skillId/run", authenticate, async (req: AuthRequest, res) => {
  try {
    const skill = getSkillById(req.params.skillId);
    if (!skill) return res.status(404).json({ error: "Skill not found" });

    if (!isAIAvailable()) {
      return res.status(503).json({
        error: "No AI provider configured. Add ANTHROPIC_API_KEY, OPENAI_API_KEY, GROQ_API_KEY, or any supported provider to your environment."
      });
    }

    const inputs = req.body.inputs || {};

    // Validate required inputs
    const missing = skill.inputs
      .filter(i => i.required && !inputs[i.name])
      .map(i => i.label);

    if (missing.length) {
      return res.status(400).json({ error: `Missing required inputs: ${missing.join(", ")}` });
    }

    // Build the final prompt
    const prompt = buildPrompt(skill, inputs);

    // Run with appropriate settings based on output format
    const systemPrompt = skill.outputFormat === "json"
      ? "Return ONLY valid JSON. No markdown, no explanation."
      : `You are an expert AI assistant specialized in ${skill.domain.replace("_", " ")}. Follow the instructions precisely and deliver exceptional quality output.`;

    const result = await askForTenant(req.user!.tenantId, prompt, systemPrompt, false);

    res.json({
      skillId: skill.id,
      skillName: skill.name,
      domain: skill.domain,
      outputFormat: skill.outputFormat,
      result,
      inputs: Object.keys(inputs),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Stream a skill result ──────────────────────────────────────
router.post("/:skillId/stream", authenticate, async (req: AuthRequest, res) => {
  try {
    const skill = getSkillById(req.params.skillId);
    if (!skill) return res.status(404).json({ error: "Skill not found" });

    if (!isAIAvailable()) {
      return res.status(503).json({ error: "No AI provider configured." });
    }

    const inputs = req.body.inputs || {};
    const prompt = buildPrompt(skill, inputs);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const { stream } = await import("../services/ai-adapter.js");

    for await (const chunk of stream({
      messages: [{ role: "user", content: prompt }],
      system: `You are an expert AI assistant specialized in ${skill.domain.replace("_", " ")}.`,
      maxTokens: skill.estimatedTokens * 3,
    })) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ── Suggest skills for a context ──────────────────────────────
router.post("/suggest", authenticate, async (req: AuthRequest, res) => {
  try {
    const { context, agentType, query } = req.body;

    if (query) {
      return res.json(searchSkills(query).slice(0, 8));
    }

    if (agentType) {
      return res.json(getSkillsByAgent(agentType).slice(0, 10));
    }

    // Use AI to suggest relevant skills
    if (context && isAIAvailable()) {
      const skillNames = ALL_SKILLS.map(s => `${s.id}: ${s.name} (${s.domain})`).join("\n");
      const suggestion = await askForTenant(
        req.user!.tenantId,
        `Given this business context: "${context}"\n\nWhich 5 of these skills would be most useful right now?\n${skillNames}\n\nReturn ONLY a comma-separated list of skill IDs.`,
        "You are a business advisor. Return only the skill IDs, nothing else.",
        true
      );
      const ids = suggestion.split(",").map(s => s.trim()).filter(Boolean);
      const suggested = ids.map(id => getSkillById(id)).filter(Boolean);
      return res.json(suggested);
    }

    // Default: return top skills across domains
    res.json(ALL_SKILLS.slice(0, 10));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
