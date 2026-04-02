import { BusinessSkill } from "./types.js";

export const ENERGY_SKILLS: BusinessSkill[] = [
  {
    id: "esg-report",
    name: "ESG Report",
    domain: "energy",
    description: "Write an ESG (Environmental, Social, Governance) report",
    prompt: `Write an ESG report for {{company}} covering {{period}}.

Industry: {{industry}}
Revenue: {{revenue}}
Employees: {{employees}}
Key ESG initiatives: {{initiatives}}
Reporting framework: {{framework}}
Stakeholders: {{stakeholders}}

ESG Report Structure:
1. CEO Letter (commitment + progress)

2. Environmental Performance
   - Carbon footprint (Scope 1, 2, 3 emissions if known: {{emissions}})
   - Energy consumption and renewables %
   - Water usage
   - Waste and recycling
   - Climate risk assessment
   - 2030 environmental targets

3. Social Performance
   - Workforce diversity data (gender, ethnicity)
   - Employee wellbeing (turnover, safety incidents)
   - Living wage commitment
   - Community investment
   - Supply chain labor standards
   - Customer data privacy

4. Governance Performance
   - Board composition and diversity
   - Executive compensation disclosure
   - Anti-corruption policies
   - Shareholder rights
   - Tax transparency
   - Whistleblower protections

5. SDG Alignment (relevant UN Sustainable Development Goals)
6. Material Issues Assessment
7. Stakeholder Engagement Summary
8. GRI/SASB/TCFD index (if applicable)
9. Third-party verification status
10. Targets and commitments for next period`,
    inputs: [
      {
        name: "company",
        label: "Company name",
        type: "text",
        required: true,
      },
      {
        name: "period",
        label: "Reporting period",
        type: "text",
        required: true,
        placeholder: "2024 Annual ESG Report",
      },
      {
        name: "industry",
        label: "Industry",
        type: "text",
        required: true,
        placeholder: "Technology, manufacturing, finance",
      },
      {
        name: "revenue",
        label: "Annual revenue",
        type: "text",
        required: true,
        placeholder: "$50M",
      },
      {
        name: "employees",
        label: "Number of employees",
        type: "number",
        required: false,
      },
      {
        name: "initiatives",
        label: "Key ESG initiatives this period",
        type: "textarea",
        required: true,
        placeholder: "Solar panels installed, DEI program launched, carbon offset program",
      },
      {
        name: "framework",
        label: "Reporting framework",
        type: "select",
        required: true,
        options: ["GRI Standards", "SASB", "TCFD", "UN SDGs", "Custom/none yet", "Multiple frameworks"],
      },
      {
        name: "stakeholders",
        label: "Key stakeholders",
        type: "text",
        required: true,
        placeholder: "Investors, employees, customers, regulators, community",
      },
      {
        name: "emissions",
        label: "Carbon emissions data",
        type: "text",
        required: false,
        placeholder: "Scope 1: 120 tCO2e, Scope 2: 340 tCO2e",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["guard", "aria"],
    tags: ["ESG", "sustainability", "climate", "reporting", "governance"],
    estimatedTokens: 900,
  },
  {
    id: "solar-feasibility",
    name: "Solar Energy Feasibility",
    domain: "energy",
    description: "Analyze solar energy feasibility for any facility",
    prompt: `Conduct a solar energy feasibility analysis for {{facility}}.

Location: {{location}}
Roof/land area available: {{area}} sq meters
Current electricity consumption: {{consumption}} kWh/month
Current tariff: {{tariff}} per kWh
Grid reliability: {{grid_reliability}}
Budget: {{budget}}
Grid-tied or off-grid: {{system_type}}

Feasibility Analysis:
1. Solar Resource Assessment
   - Average sun hours per day for {{location}}
   - Seasonal variation
   - Shading and orientation factors

2. System Sizing
   - Recommended system capacity (kWp)
   - Panel quantity and type
   - Inverter specification
   - Battery storage (if off-grid/hybrid)

3. Financial Analysis
   - CapEx estimate (equipment + installation)
   - Annual energy production (kWh)
   - Annual savings vs current tariff
   - Payback period
   - ROI over 25 years
   - NPV and IRR
   - Available incentives/grants (by country)

4. Technical Recommendations
   - Panel technology (monocrystalline recommended)
   - Mounting system
   - Monitoring system
   - Maintenance requirements

5. Implementation Roadmap
   - Site assessment → design → permits → installation → commissioning
   - Timeline estimate

6. Risk Analysis (weather, component failure, tariff changes)
7. Financing Options (own capital, loan, leasing, PPA)
8. Next Steps`,
    inputs: [
      {
        name: "facility",
        label: "Facility name and type",
        type: "text",
        required: true,
        placeholder: "Office building, school, factory, hospital",
      },
      {
        name: "location",
        label: "Location",
        type: "text",
        required: true,
        placeholder: "Lomé, Togo / Lagos, Nigeria / Nairobi, Kenya",
      },
      {
        name: "area",
        label: "Available roof/land area (sq meters)",
        type: "number",
        required: true,
      },
      {
        name: "consumption",
        label: "Monthly electricity consumption (kWh)",
        type: "number",
        required: true,
      },
      {
        name: "tariff",
        label: "Current electricity tariff (per kWh)",
        type: "text",
        required: true,
        placeholder: "$0.18/kWh or XOF 95/kWh",
      },
      {
        name: "grid_reliability",
        label: "Grid reliability",
        type: "select",
        required: true,
        options: ["Reliable (< 2hr/month outage)", "Unreliable (2-8hr/day outage)", "Very unreliable (> 8hr/day)", "No grid access"],
      },
      {
        name: "budget",
        label: "Available budget",
        type: "text",
        required: true,
        placeholder: "$50,000 or XOF 30,000,000",
      },
      {
        name: "system_type",
        label: "System type",
        type: "select",
        required: true,
        options: ["Grid-tied", "Off-grid", "Hybrid (grid + storage)", "Mini-grid for community"],
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["ops", "ledger"],
    tags: ["solar", "renewable energy", "Africa", "feasibility", "sustainability"],
    estimatedTokens: 800,
  },
];
