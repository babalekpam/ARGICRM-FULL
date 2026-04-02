import { BusinessSkill } from "./types.js";

export const EDUCATION_SKILLS: BusinessSkill[] = [
  {
    id: "curriculum-design",
    name: "Curriculum Design",
    domain: "education",
    description: "Design a complete course curriculum",
    prompt: `Design a curriculum for: {{course_title}}

Audience: {{audience}}
Duration: {{duration}}
Learning format: {{format}}
Prior knowledge required: {{prerequisites}}
Learning objectives: {{objectives}}
Assessment approach: {{assessment}}

Curriculum Design:
1. Course Overview
   - Purpose and value proposition
   - Target learner profile
   - Prerequisite knowledge map

2. Learning Objectives (Bloom's Taxonomy)
   - Knowledge level (recall)
   - Comprehension (understanding)
   - Application (using knowledge)
   - Analysis (breaking down)
   - Synthesis (creating)
   - Evaluation (judging)

3. Module Structure (week by week or unit by unit)
   For each module:
   - Topic and subtopics
   - Learning activities (lecture, discussion, practice, project)
   - Estimated time
   - Resources needed
   - Formative assessment

4. Assessment Design
   - Formative assessments (low-stakes, frequent)
   - Summative assessments (graded projects, exams)
   - Rubrics for major assignments

5. Differentiation Strategies
   - For advanced learners
   - For struggling learners
   - Accessibility considerations

6. Resource List
7. Educator Guide Notes`,
    inputs: [
      {
        name: "course_title",
        label: "Course title",
        type: "text",
        required: true,
        placeholder: "Introduction to Digital Marketing for African SMEs",
      },
      {
        name: "audience",
        label: "Target audience",
        type: "text",
        required: true,
        placeholder: "Small business owners, 25-45, limited digital experience",
      },
      {
        name: "duration",
        label: "Course duration",
        type: "text",
        required: true,
        placeholder: "8 weeks, 3 hours/week",
      },
      {
        name: "format",
        label: "Delivery format",
        type: "select",
        required: true,
        options: ["In-person", "Online self-paced", "Online live (synchronous)", "Blended", "Hybrid"],
      },
      {
        name: "prerequisites",
        label: "Prerequisites required",
        type: "text",
        required: false,
        placeholder: "Basic computer literacy, no prior marketing knowledge",
      },
      {
        name: "objectives",
        label: "Key learning objectives",
        type: "textarea",
        required: true,
        placeholder: "By end of course, learners will be able to...",
      },
      {
        name: "assessment",
        label: "Assessment approach",
        type: "select",
        required: true,
        options: ["Quizzes only", "Projects only", "Mixed (quizzes + projects)", "Portfolio", "Competency-based"],
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["aria"],
    tags: ["curriculum", "education", "instructional design", "eLearning"],
    estimatedTokens: 800,
  },
  {
    id: "grant-proposal",
    name: "Grant Proposal Writing",
    domain: "education",
    description: "Write a compelling grant proposal",
    prompt: `Write a grant proposal for {{organization}} applying to {{grant_name}}.

Grant amount: {{amount}}
Funder: {{funder}}
Project: {{project_title}}
Target population: {{population}}
Problem statement: {{problem}}
Proposed solution: {{solution}}
Timeline: {{timeline}}
Partners: {{partners}}

Grant Proposal Sections:
1. Executive Summary (1 page max)
   - Problem, solution, impact, amount requested

2. Organization Background
   - Mission alignment with funder
   - Track record and credibility
   - Financial stability indicators

3. Problem Statement
   - Data-driven needs assessment
   - Geographic/demographic specificity
   - Gap in existing services
   - Why now

4. Project Description
   - Goals and objectives (SMART)
   - Activities and methodology
   - Theory of change / logic model
   - Innovation/uniqueness

5. Target Population Profile
   - Demographics and need severity
   - How they'll be reached

6. Evaluation Plan
   - Outcomes and indicators
   - Data collection methods
   - Who conducts evaluation

7. Sustainability Plan
   - How project continues after grant ends
   - Other funding sources

8. Budget Narrative
   - Line-by-line justification
   - Cost-effectiveness argument
   - Matching funds (if any)

9. Timeline (Gantt chart description)
10. Staff Qualifications`,
    inputs: [
      {
        name: "organization",
        label: "Applying organization",
        type: "text",
        required: true,
      },
      {
        name: "grant_name",
        label: "Grant program name",
        type: "text",
        required: true,
      },
      {
        name: "amount",
        label: "Amount requested",
        type: "text",
        required: true,
        placeholder: "$250,000",
      },
      {
        name: "funder",
        label: "Funding organization",
        type: "text",
        required: true,
        placeholder: "USAID, Gates Foundation, World Bank, national government",
      },
      {
        name: "project_title",
        label: "Project title",
        type: "text",
        required: true,
      },
      {
        name: "population",
        label: "Target population",
        type: "textarea",
        required: true,
        placeholder: "Out-of-school girls aged 12-18 in rural Togo",
      },
      {
        name: "problem",
        label: "Problem statement",
        type: "textarea",
        required: true,
        placeholder: "Dropout rate reaches 60% for girls after age 12 due to...",
      },
      {
        name: "solution",
        label: "Proposed solution",
        type: "textarea",
        required: true,
      },
      {
        name: "timeline",
        label: "Project timeline",
        type: "text",
        required: true,
        placeholder: "24 months",
      },
      {
        name: "partners",
        label: "Key partners",
        type: "text",
        required: false,
        placeholder: "Ministry of Education, local NGOs, community leaders",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["aria", "atlas"],
    tags: ["grant writing", "nonprofit", "education", "funding"],
    estimatedTokens: 1000,
  },
  {
    id: "training-program",
    name: "Employee Training Program",
    domain: "education",
    description: "Design a complete employee training program",
    prompt: `Design an employee training program on {{topic}} for {{company}}.

Audience: {{audience}}
Duration: {{duration}}
Format: {{format}}
Learning goals: {{goals}}
Current knowledge level: {{baseline}}
Budget: {{budget}}

Training Program Design:
1. Training Needs Analysis Summary
2. Learning Objectives (measurable, tied to performance)
3. Program Structure
   - Pre-work (reading, assessment)
   - Core modules (sequence and rationale)
   - Practice activities
   - Coaching/mentoring elements
4. Facilitation Guide (for each module)
   - Key messages
   - Discussion prompts
   - Exercises and role plays
   - Time allocation
5. Content Delivery Mix
   - Synchronous vs async
   - Video scripts (2-3 micro-lessons)
   - Job aids and quick reference cards
6. Assessment Strategy
   - Pre-training knowledge check
   - Post-training assessment
   - 30-day application check-in
7. Manager Toolkit (how managers reinforce learning)
8. Kirkpatrick Model evaluation plan (Level 1-4)
9. Implementation timeline
10. Budget breakdown`,
    inputs: [
      {
        name: "topic",
        label: "Training topic",
        type: "text",
        required: true,
        placeholder: "HIPAA compliance, sales methodology, DEI, cybersecurity",
      },
      {
        name: "company",
        label: "Company name",
        type: "text",
        required: true,
      },
      {
        name: "audience",
        label: "Target audience",
        type: "textarea",
        required: true,
        placeholder: "200 new hires across all departments",
      },
      {
        name: "duration",
        label: "Total training duration",
        type: "text",
        required: true,
        placeholder: "8 hours spread over 4 weeks",
      },
      {
        name: "format",
        label: "Delivery format",
        type: "select",
        required: true,
        options: ["In-person workshop", "Online self-paced", "Live virtual", "Blended", "On-the-job"],
      },
      {
        name: "goals",
        label: "Learning goals",
        type: "textarea",
        required: true,
        placeholder: "After training, employees will be able to...",
      },
      {
        name: "baseline",
        label: "Baseline knowledge level",
        type: "select",
        required: true,
        options: ["No prior knowledge", "Basic awareness", "Intermediate", "Refresher for experienced"],
      },
      {
        name: "budget",
        label: "Training budget",
        type: "text",
        required: false,
        placeholder: "$50 per person",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["talent", "ops"],
    tags: ["training", "L&D", "employee development", "instructional design"],
    estimatedTokens: 800,
  },
];
