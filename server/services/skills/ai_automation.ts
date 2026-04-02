import { BusinessSkill } from "./types.js";

export const AI_SKILLS: BusinessSkill[] = [
  {
    id: "automation-design",
    name: "Workflow Automation Design",
    domain: "ai_automation",
    description: "Design an automation for any manual business process",
    prompt: `Design an automation workflow for: {{process}}

Current manual process:
{{current_process}}

Tools available: {{tools}}
Team size affected: {{team_size}}
Hours spent manually per week: {{hours}}
Error rate: {{error_rate}}

Design:
1. Trigger (what starts the automation)
2. Data inputs required
3. Processing steps (decision points, transformations)
4. Output / actions taken
5. Error handling and fallbacks
6. Human-in-the-loop checkpoints (if needed)

Provide:
- Pseudocode or flowchart description
- Recommended tool stack (Zapier / Make / n8n / custom code)
- Implementation effort estimate (hours)
- ROI calculation (time saved × hourly rate)
- Risks and edge cases to handle`,
    inputs: [
      { name: "process", label: "Process to automate", type: "text", required: true },
      { name: "current_process", label: "How it works manually today", type: "textarea", required: true },
      { name: "tools", label: "Available tools/integrations", type: "text", required: true },
      { name: "team_size", label: "Team members affected", type: "number", required: false },
      { name: "hours", label: "Hours spent manually per week", type: "number", required: false },
      { name: "error_rate", label: "Current error rate", type: "text", required: false },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["ops", "forge"],
    tags: ["automation", "workflow", "productivity", "no-code"],
    estimatedTokens: 600,
  },
  {
    id: "ai-prompt-engineer",
    name: "Prompt Engineering",
    domain: "ai_automation",
    description: "Engineer the perfect prompt for any AI use case",
    prompt: `Engineer an optimized prompt for this AI use case: {{use_case}}

Context:
- AI model target: {{model}}
- End user: {{user}}
- Desired output format: {{output_format}}
- Edge cases to handle: {{edge_cases}}

Deliver:
1. System prompt (detailed persona, constraints, output rules)
2. User prompt template (with {{variables}} marked)
3. Few-shot examples (2-3 input/output pairs)
4. Chain-of-thought instruction (if complex reasoning needed)
5. Output validation rules (what to check in the response)
6. Failure modes and how to prevent them

Also provide:
- One-line test cases to validate the prompt works
- How to version and iterate this prompt
- Token estimate per run`,
    inputs: [
      { name: "use_case", label: "AI use case", type: "textarea", required: true, placeholder: "Classify support tickets by urgency and route to the right team" },
      { name: "model", label: "Target AI model", type: "select", required: true, options: ["Claude (Anthropic)", "GPT-4o (OpenAI)", "Gemini (Google)", "Llama (Meta)", "Any provider"] },
      { name: "user", label: "End user", type: "text", required: true },
      { name: "output_format", label: "Required output format", type: "text", required: true, placeholder: "JSON with urgency level and team assignment" },
      { name: "edge_cases", label: "Edge cases to handle", type: "textarea", required: false },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["forge", "aria"],
    tags: ["prompt engineering", "AI", "LLM", "automation"],
    estimatedTokens: 600,
  },
];
