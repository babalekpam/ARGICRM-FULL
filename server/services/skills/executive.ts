import { BusinessSkill } from "./types.js";

export const EXECUTIVE_SKILLS: BusinessSkill[] = [
  {
    id: "executive-coaching",
    name: "Executive Coaching Session",
    domain: "executive",
    description: "Facilitate a structured executive coaching conversation",
    prompt: `Facilitate a coaching session for an executive leader.

Coachee role: {{role}}
Challenge/topic: {{topic}}
Background: {{background}}
Desired outcome: {{desired_outcome}}
Time frame: {{time_frame}}

Coaching Framework (GROW Model):
G - GOAL
  "What do you want to achieve from this conversation?"
  "If this session goes perfectly, what will be different?"
  Clarifying questions and goal refinement

R - REALITY
  "What's happening right now?"
  "What have you already tried?"
  "What's working? What isn't?"
  "What's the impact of this situation?"
  Probing questions for deeper awareness

O - OPTIONS
  "What could you do?"
  "What else?"
  "What would you do if there were no constraints?"
  "What would a mentor you admire do?"
  Generating 5-7 options without judgment

W - WILL
  "Which option resonates most?"
  "What's your first step?"
  "By when?"
  "What support do you need?"
  "On a scale of 1-10, how committed are you?"

Output: Structured coaching dialogue, key insights, action commitments, and follow-up questions for next session.`,
    inputs: [
      {
        name: "role",
        label: "Coachee's role",
        type: "text",
        required: true,
        placeholder: "Founder & CEO, VP Engineering, COO",
      },
      {
        name: "topic",
        label: "Coaching topic",
        type: "textarea",
        required: true,
        placeholder: "Navigating conflict with a co-founder, delegation challenges, scaling leadership",
      },
      {
        name: "background",
        label: "Relevant context",
        type: "textarea",
        required: false,
        placeholder: "Fast-growing startup, team grew from 5 to 50 in 18 months",
      },
      {
        name: "desired_outcome",
        label: "Desired outcome",
        type: "text",
        required: true,
        placeholder: "Clear on how to handle the situation, confident action plan",
      },
      {
        name: "time_frame",
        label: "Action time frame",
        type: "text",
        required: true,
        placeholder: "Next 30 days",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["aria"],
    tags: ["executive coaching", "leadership", "GROW", "development"],
    estimatedTokens: 600,
  },
  {
    id: "decision-framework",
    name: "Decision Framework",
    domain: "executive",
    description: "Apply structured decision-making to any complex choice",
    prompt: `Apply a structured decision framework to: {{decision}}

Decision maker: {{role}}
Options being considered: {{options}}
Key stakeholders: {{stakeholders}}
Decision criteria: {{criteria}}
Constraints: {{constraints}}
Deadline: {{deadline}}

Decision Analysis:
1. Problem Reframing (is this the right question?)
2. Decision Criteria (weighted 1-10)
   {{criteria}}

3. Options Analysis
   For each option:
   - Score against each criterion
   - Weighted score
   - Key assumptions being made
   - What would have to be true for this to succeed

4. Pre-Mortem Analysis
   - "Imagine it's 12 months later and this decision failed — what went wrong?"
   - For each option, failure modes and probability

5. Second-Order Effects
   - Ripple effects of each option
   - Reversibility assessment (can we undo this?)

6. Recommendation
   - Top-ranked option
   - Key conditions and tripwires (what would make you revisit)
   - Minimum viable test to reduce uncertainty

7. Dissenting View (steelman the alternative)
8. Communication plan for decision`,
    inputs: [
      {
        name: "decision",
        label: "Decision to be made",
        type: "text",
        required: true,
        placeholder: "Hire a COO now or wait 6 months",
      },
      {
        name: "role",
        label: "Decision maker's role",
        type: "text",
        required: true,
      },
      {
        name: "options",
        label: "Options being considered",
        type: "textarea",
        required: true,
      },
      {
        name: "stakeholders",
        label: "Key stakeholders affected",
        type: "text",
        required: true,
        placeholder: "Board, team, customers, investors",
      },
      {
        name: "criteria",
        label: "Decision criteria",
        type: "textarea",
        required: true,
        placeholder: "Financial impact, team morale, strategic fit, speed",
      },
      {
        name: "constraints",
        label: "Constraints",
        type: "text",
        required: false,
        placeholder: "Budget cap, board approval needed, 60-day timeline",
      },
      {
        name: "deadline",
        label: "Decision deadline",
        type: "text",
        required: true,
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["aria"],
    tags: ["decision making", "executive", "strategy", "leadership"],
    estimatedTokens: 700,
  },
  {
    id: "performance-review",
    name: "Performance Review Writing",
    domain: "executive",
    description: "Write comprehensive performance reviews",
    prompt: `Write a {{review_type}} performance review for {{employee_name}}.

Employee role: {{role}}
Review period: {{period}}
Key accomplishments: {{accomplishments}}
Areas for improvement: {{improvements}}
Goals achieved: {{goals}}
Rating: {{rating}}
Manager context: {{context}}

Performance Review:
1. Overall Assessment Summary (2-3 sentences — clear, direct, balanced)

2. Key Accomplishments
   - Impact-focused bullets (not tasks, but outcomes)
   - Quantify where possible
   - Tie to team/company goals

3. Core Competencies Assessment (scale: Exceeds/Meets/Below expectations)
   - Technical skills
   - Collaboration and teamwork
   - Communication
   - Leadership (if applicable)
   - Innovation and initiative
   - Reliability and execution

4. Areas for Development
   - Specific and actionable
   - Not personal — behavioral
   - With suggested resources/actions

5. Goal Review (vs last period's goals)
6. Goals for Next Period (SMART format)
7. Development Plan
   - Skills to build
   - Experiences to seek
   - Mentorship/training

8. Manager's Commitment (support you'll provide)
9. Rating Justification (clear rationale linked to evidence)`,
    inputs: [
      {
        name: "employee_name",
        label: "Employee name",
        type: "text",
        required: true,
      },
      {
        name: "review_type",
        label: "Review type",
        type: "select",
        required: true,
        options: ["Annual review", "Mid-year review", "90-day review", "Probation review", "Promotion review"],
      },
      {
        name: "role",
        label: "Employee's role",
        type: "text",
        required: true,
      },
      {
        name: "period",
        label: "Review period",
        type: "text",
        required: true,
        placeholder: "Jan-Dec 2024",
      },
      {
        name: "accomplishments",
        label: "Key accomplishments this period",
        type: "textarea",
        required: true,
      },
      {
        name: "improvements",
        label: "Areas for improvement",
        type: "textarea",
        required: true,
      },
      {
        name: "goals",
        label: "Goals from last review + achievement status",
        type: "textarea",
        required: false,
      },
      {
        name: "rating",
        label: "Overall performance rating",
        type: "select",
        required: true,
        options: ["Exceptional (top 10%)", "Exceeds expectations", "Meets expectations", "Below expectations", "Unsatisfactory"],
      },
      {
        name: "context",
        label: "Manager context",
        type: "textarea",
        required: false,
        placeholder: "First year in this role, had challenging Q3 due to team changes",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["talent", "aria"],
    tags: ["performance review", "HR", "management", "feedback"],
    estimatedTokens: 700,
  },
];
