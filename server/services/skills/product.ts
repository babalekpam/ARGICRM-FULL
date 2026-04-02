import { BusinessSkill } from "./types.js";

export const PRODUCT_SKILLS: BusinessSkill[] = [
  {
    id: "prd-writer",
    name: "Product Requirements Document (PRD)",
    domain: "product",
    description: "Write a complete PRD for any feature or product",
    prompt: `Write a Product Requirements Document for: {{feature_name}}

Context:
User problem: {{problem}}
Target users: {{users}}
Business case: {{business_case}}
Success metric: {{metric}}
Constraints: {{constraints}}
Out of scope: {{out_of_scope}}

PRD Sections:
1. Problem Statement (why this exists)
2. Goals & Non-Goals
3. User Stories (persona → action → benefit)
4. Functional Requirements (numbered, specific)
5. Non-Functional Requirements (performance, security, scalability)
6. UX Considerations (key flows, edge cases)
7. Data Model (if applicable)
8. API Design (endpoints needed)
9. Analytics & Success Metrics
10. Launch Plan (phases, rollout strategy)
11. Open Questions

Be specific enough that an engineer can build without follow-up questions.`,
    inputs: [
      { name: "feature_name", label: "Feature/product name", type: "text", required: true },
      { name: "problem", label: "User problem being solved", type: "textarea", required: true },
      { name: "users", label: "Target users/personas", type: "text", required: true },
      { name: "business_case", label: "Business case", type: "textarea", required: true },
      { name: "metric", label: "Primary success metric", type: "text", required: true },
      { name: "constraints", label: "Technical/business constraints", type: "textarea", required: false },
      { name: "out_of_scope", label: "Explicitly out of scope", type: "textarea", required: false },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["vision"],
    tags: ["PRD", "product", "requirements", "feature"],
    estimatedTokens: 800,
  },
];
