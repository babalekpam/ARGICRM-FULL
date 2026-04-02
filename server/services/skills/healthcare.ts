import { BusinessSkill } from "./types.js";

export const HEALTHCARE_SKILLS: BusinessSkill[] = [
  {
    id: "hipaa-compliance",
    name: "HIPAA Compliance Plan",
    domain: "healthcare",
    description: "Create a HIPAA compliance plan for health tech companies",
    prompt: `Create a HIPAA compliance plan for {{organization}}.

Organization type: {{org_type}}
PHI types handled: {{phi_types}}
Employee count: {{employees}}
Technology stack: {{tech_stack}}
Current compliance: {{current_compliance}}

HIPAA Compliance Plan:
1. Risk Analysis (required by Security Rule)
   - PHI inventory and data flows
   - Threat identification
   - Vulnerability assessment
   - Risk level matrix

2. Administrative Safeguards
   - Privacy Officer designation
   - Workforce training requirements
   - Access management procedures
   - Contingency planning

3. Physical Safeguards
   - Facility access controls
   - Workstation security
   - Device and media controls

4. Technical Safeguards
   - Access control (unique user IDs, emergency access)
   - Audit controls and logs
   - Integrity controls
   - Transmission security

5. Business Associate Agreements (BAA)
   - Who needs BAAs
   - BAA template key clauses

6. Breach Notification Procedures
   - Detection → assessment → notification timeline
   - HHS reporting requirements
   - Patient notification templates

7. Training Program Design
8. Policy Documents Required (list)
9. Implementation roadmap (30-60-90 days)
10. Estimated compliance cost`,
    inputs: [
      {
        name: "organization",
        label: "Organization name",
        type: "text",
        required: true,
      },
      {
        name: "org_type",
        label: "Organization type",
        type: "select",
        required: true,
        options: ["Digital health startup", "Healthcare provider", "Health insurance/payer", "Health IT vendor", "Medical device company", "Research institution"],
      },
      {
        name: "phi_types",
        label: "PHI types handled",
        type: "textarea",
        required: true,
        placeholder: "Patient names, medical records, diagnosis codes, payment info",
      },
      {
        name: "employees",
        label: "Employee count",
        type: "number",
        required: false,
      },
      {
        name: "tech_stack",
        label: "Technology stack",
        type: "text",
        required: true,
        placeholder: "AWS, Node.js, PostgreSQL, React Native",
      },
      {
        name: "current_compliance",
        label: "Current compliance status",
        type: "select",
        required: true,
        options: ["Starting from scratch", "Basic measures in place", "Partially compliant", "Compliance review needed"],
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["guard", "ops"],
    tags: ["HIPAA", "healthcare compliance", "PHI", "health tech"],
    estimatedTokens: 900,
  },
  {
    id: "patient-journey-map",
    name: "Patient Journey Mapping",
    domain: "healthcare",
    description: "Map the complete patient experience",
    prompt: `Create a patient journey map for {{condition}} at {{organization}}.

Patient persona: {{persona}}
Care setting: {{setting}}
Current touchpoints: {{touchpoints}}
Known pain points: {{pain_points}}
Technology used: {{technology}}

Patient Journey Map:
1. Awareness Stage
   - How patients learn of condition/need
   - Information sources
   - Emotions: fears, confusion, denial

2. Access Stage
   - How patients reach care (referral, self-refer, ER)
   - Scheduling process
   - Insurance/authorization hurdles
   - Emotions: anxiety, hope, frustration

3. Diagnosis Stage
   - Initial consultation experience
   - Testing and wait times
   - Communication of results
   - Emotions: shock, relief, confusion

4. Treatment Stage
   - Treatment decision-making process
   - Care team coordination
   - Medication adherence factors
   - Emotions: hope, fear, fatigue

5. Monitoring / Follow-up Stage
   - Check-in frequency
   - Remote monitoring opportunities
   - Caregiver involvement

6. Resolution / Ongoing Management
   - Discharge planning
   - Self-management support

For each stage: Touchpoints, Emotions, Pain Points, Opportunities, Digital Enhancement Options

Output: Actionable improvement recommendations ranked by patient impact`,
    inputs: [
      {
        name: "condition",
        label: "Clinical condition or care path",
        type: "text",
        required: true,
        placeholder: "Type 2 diabetes management, post-surgical recovery",
      },
      {
        name: "organization",
        label: "Healthcare organization name",
        type: "text",
        required: true,
      },
      {
        name: "persona",
        label: "Patient persona",
        type: "text",
        required: true,
        placeholder: "55-year-old with newly diagnosed T2D, low health literacy",
      },
      {
        name: "setting",
        label: "Care setting",
        type: "select",
        required: true,
        options: ["Primary care", "Specialty clinic", "Hospital", "Telehealth", "Home care", "Community health"],
      },
      {
        name: "touchpoints",
        label: "Current touchpoints",
        type: "textarea",
        required: false,
        placeholder: "Scheduling, waiting room, consultation, pharmacy, follow-up calls",
      },
      {
        name: "pain_points",
        label: "Known patient pain points",
        type: "textarea",
        required: false,
      },
      {
        name: "technology",
        label: "Technology currently used",
        type: "text",
        required: false,
        placeholder: "EHR, patient portal, mobile app",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["care", "vision"],
    tags: ["patient experience", "healthcare", "journey map", "CX"],
    estimatedTokens: 800,
  },
  {
    id: "clinical-ops-improvement",
    name: "Clinical Operations Improvement",
    domain: "healthcare",
    description: "Identify and improve clinical workflow inefficiencies",
    prompt: `Analyze and improve clinical operations for {{department}} at {{facility}}.

Department: {{department}}
Volume: {{volume}} patients/day
Current bottlenecks: {{bottlenecks}}
Staff: {{staff_mix}}
Technology: {{technology}}
Regulatory requirements: {{regulatory}}

Operations Analysis:
1. Current State Assessment
   - Patient flow mapping
   - Wait time analysis by stage
   - Staff utilization analysis
   - Revenue cycle touchpoints

2. Bottleneck Analysis (Theory of Constraints)
   - Primary constraint identification
   - Root cause analysis
   - Ripple effect mapping

3. Improvement Opportunities (ranked by impact):
   a. Quick wins (< 30 days, low investment)
   b. Medium-term projects (1-3 months)
   c. Strategic initiatives (3-12 months)

4. Lean Healthcare Recommendations
   - 5S methodology application
   - Standard work design
   - Visual management

5. Technology Enhancement Opportunities
   - EHR optimization
   - Clinical decision support
   - Patient self-service
   - Remote monitoring

6. Staffing Model Recommendations
7. KPIs to track improvement
8. Implementation roadmap`,
    inputs: [
      {
        name: "department",
        label: "Clinical department",
        type: "text",
        required: true,
        placeholder: "Emergency department, outpatient clinic, radiology",
      },
      {
        name: "facility",
        label: "Facility name",
        type: "text",
        required: true,
      },
      {
        name: "volume",
        label: "Patient volume",
        type: "text",
        required: true,
        placeholder: "150 patients/day",
      },
      {
        name: "bottlenecks",
        label: "Current bottlenecks",
        type: "textarea",
        required: true,
        placeholder: "Long wait times, documentation burden, care coordination gaps",
      },
      {
        name: "staff_mix",
        label: "Staff mix",
        type: "text",
        required: true,
        placeholder: "5 physicians, 12 nurses, 4 MA, 2 admin",
      },
      {
        name: "technology",
        label: "Current technology",
        type: "text",
        required: true,
        placeholder: "Epic EHR, scheduling system, paper-based some areas",
      },
      {
        name: "regulatory",
        label: "Regulatory requirements",
        type: "text",
        required: false,
        placeholder: "Joint Commission, CMS, state health dept",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["ops", "aria"],
    tags: ["clinical operations", "healthcare", "lean", "efficiency"],
    estimatedTokens: 800,
  },
];
