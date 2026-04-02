import { BusinessSkill } from "./types.js";

export const NONPROFIT_SKILLS: BusinessSkill[] = [
  {
    id: "impact-report",
    name: "Impact Report",
    domain: "nonprofit",
    description: "Write an annual impact report for donors and stakeholders",
    prompt: `Write an impact report for {{organization}} covering {{period}}.

Mission: {{mission}}
Beneficiaries served: {{beneficiaries}}
Key programs: {{programs}}
Top outcomes: {{outcomes}}
Budget: {{budget}}
Donors/funders to credit: {{donors}}

Impact Report Structure:
1. Letter from Executive Director (2-3 paragraphs, personal, compelling)
2. By The Numbers (visual-friendly stats block)
   - Beneficiaries served
   - Programs delivered
   - Geographic reach
   - Volunteers
   - Funds raised

3. Program Stories (2-3 narratives)
   - One beneficiary story with permission
   - Program name → challenge → intervention → outcome → future

4. Financial Highlights
   - Revenue by source (grants, donations, earned)
   - Expense allocation (program vs admin ratio)
   - Reserves/financial health note

5. Partner Acknowledgments
6. Board List
7. Year in Quotes (testimonials from beneficiaries/partners)
8. Looking Ahead (goals for next period)
9. Call to Action (donate/volunteer/spread the word)

Tone: Warm, evidence-based, humble but proud of impact.`,
    inputs: [
      {
        name: "organization",
        label: "Organization name",
        type: "text",
        required: true,
      },
      {
        name: "period",
        label: "Reporting period",
        type: "text",
        required: true,
        placeholder: "2024 Annual Report",
      },
      {
        name: "mission",
        label: "Organization mission",
        type: "textarea",
        required: true,
      },
      {
        name: "beneficiaries",
        label: "Beneficiaries served",
        type: "text",
        required: true,
        placeholder: "2,400 students in 12 schools across rural Togo",
      },
      {
        name: "programs",
        label: "Key programs",
        type: "textarea",
        required: true,
        placeholder: "Girls' education scholarships, digital literacy, school feeding",
      },
      {
        name: "outcomes",
        label: "Top outcomes achieved",
        type: "textarea",
        required: true,
        placeholder: "94% scholarship recipients graduated, 340 teachers trained",
      },
      {
        name: "budget",
        label: "Annual budget",
        type: "text",
        required: true,
        placeholder: "$850,000",
      },
      {
        name: "donors",
        label: "Key donors to acknowledge",
        type: "text",
        required: false,
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["aria", "nova"],
    tags: ["impact report", "nonprofit", "donor relations", "annual report"],
    estimatedTokens: 800,
  },
  {
    id: "fundraising-strategy",
    name: "Fundraising Strategy",
    domain: "nonprofit",
    description: "Develop a comprehensive nonprofit fundraising strategy",
    prompt: `Develop a fundraising strategy for {{organization}}.

Annual revenue target: {{target}}
Current funding sources: {{current_sources}}
Cause area: {{cause}}
Geography: {{geography}}
Team capacity: {{capacity}}
Timeline: {{timeline}}

Fundraising Strategy:
1. Funding Mix Analysis (recommended portfolio)
   - Individual donors (major gifts, mid-level, small)
   - Foundation grants
   - Corporate partnerships
   - Government grants
   - Earned revenue/social enterprise
   - Crowdfunding/online campaigns

2. Major Gifts Program (donors $10k+)
   - Prospect identification criteria
   - Cultivation roadmap
   - Stewardship plan

3. Annual Fund Campaign
   - Direct mail plan
   - Email fundraising sequence (4-6 emails)
   - Year-end campaign strategy

4. Grant Calendar (12-month)
   - Foundation targets by quarter
   - Application deadlines
   - Priority grants

5. Corporate Partnership Program
   - Sponsor benefits tiers
   - Employee giving/volunteering integration

6. Digital Fundraising
   - Website donation page optimization
   - Social media fundraising
   - Peer-to-peer fundraising platform

7. Events (if applicable)
   - Annual gala concept
   - Virtual event option

8. Donor Retention Strategy
   - Thank-you protocol
   - Impact updates
   - Upgrade path

9. Month-by-month implementation calendar`,
    inputs: [
      {
        name: "organization",
        label: "Organization name",
        type: "text",
        required: true,
      },
      {
        name: "target",
        label: "Annual fundraising target",
        type: "text",
        required: true,
        placeholder: "$500,000",
      },
      {
        name: "current_sources",
        label: "Current funding sources",
        type: "textarea",
        required: true,
        placeholder: "60% grants, 30% individual donors, 10% events",
      },
      {
        name: "cause",
        label: "Cause area",
        type: "text",
        required: true,
        placeholder: "Education, health, climate, economic empowerment",
      },
      {
        name: "geography",
        label: "Geographic focus",
        type: "text",
        required: true,
        placeholder: "Togo, West Africa, diaspora communities in France and US",
      },
      {
        name: "capacity",
        label: "Fundraising team capacity",
        type: "text",
        required: true,
        placeholder: "1 development director, 50% of ED time",
      },
      {
        name: "timeline",
        label: "Strategy period",
        type: "text",
        required: true,
        placeholder: "12 months",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["aria", "ledger"],
    tags: ["fundraising", "nonprofit", "grants", "donor development"],
    estimatedTokens: 900,
  },
];
