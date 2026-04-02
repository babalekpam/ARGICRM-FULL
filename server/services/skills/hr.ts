import { BusinessSkill } from "./types.js";

export const HR_SKILLS: BusinessSkill[] = [
  {
    id: "job-description",
    name: "Job Description Writer",
    domain: "hr",
    description: "Write an inclusive, compelling job description",
    prompt: `Write a compelling job description for a {{role}} position at {{company_name}}.

Company stage: {{stage}}
Team size: {{team_size}}
Location/remote: {{location}}
Salary range: {{salary}}
Must-have skills: {{must_have}}
Nice-to-have: {{nice_to_have}}
Team culture: {{culture}}

Structure:
1. Company intro (2-3 sentences — mission, not just "we're a startup")
2. Role summary (what success looks like in 90 days)
3. What you'll do (5-7 bullets, outcomes not tasks)
4. What we're looking for (split: must-have vs nice-to-have)
5. What we offer (comp, benefits, growth)
6. Our commitment to diversity

Avoid: gendered language, "rockstar/ninja", unnecessary requirements that filter good candidates.
Optimize for: clarity, specificity, authentic culture signal.`,
    inputs: [
      { name: "role", label: "Role title", type: "text", required: true },
      { name: "company_name", label: "Company name", type: "text", required: true },
      { name: "stage", label: "Company stage", type: "select", required: true, options: ["Pre-seed", "Seed", "Series A", "Series B+", "Growth", "Enterprise"] },
      { name: "team_size", label: "Team size", type: "text", required: false },
      { name: "location", label: "Location/Remote policy", type: "text", required: true },
      { name: "salary", label: "Salary range", type: "text", required: false },
      { name: "must_have", label: "Must-have skills", type: "textarea", required: true },
      { name: "nice_to_have", label: "Nice-to-have skills", type: "textarea", required: false },
      { name: "culture", label: "Team culture notes", type: "textarea", required: false },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["talent"],
    tags: ["hiring", "recruiting", "JD", "HR"],
    estimatedTokens: 600,
  },
  {
    id: "interview-questions",
    name: "Interview Question Pack",
    domain: "hr",
    description: "Generate role-specific behavioral and technical interview questions",
    prompt: `Create a comprehensive interview question pack for hiring a {{role}}.

Company values: {{values}}
Key competencies for this role: {{competencies}}
Interview format: {{format}}
Seniority level: {{level}}

Generate:
1. Phone screen questions (5 questions, 30 min)
   - Role fit
   - Culture signal
   - Dealbreaker check

2. Behavioral questions (10 questions, STAR format triggers)
   - Leadership / influence
   - Problem solving
   - Failure & learning
   - Cross-functional work
   - Ambiguity handling

3. Technical/functional questions (8 questions relevant to {{role}})

4. Case study or take-home prompt (if applicable)

5. Questions to invite candidates to ask us (signals about the role we should be transparent about)

For each question, note: what "great" looks like in an answer.`,
    inputs: [
      { name: "role", label: "Role", type: "text", required: true },
      { name: "values", label: "Company values", type: "text", required: false },
      { name: "competencies", label: "Key competencies needed", type: "textarea", required: true },
      { name: "format", label: "Interview format", type: "select", required: true, options: ["Phone screen only", "Phone + panel", "Full loop (4-5 rounds)", "Async + live"] },
      { name: "level", label: "Seniority level", type: "select", required: true, options: ["Junior (0-2 years)", "Mid-level (2-5 years)", "Senior (5+ years)", "Staff/Principal", "Manager", "Director+"] },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["talent"],
    tags: ["interview", "hiring", "recruiting"],
    estimatedTokens: 700,
  },
];
