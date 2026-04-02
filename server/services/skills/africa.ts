import { BusinessSkill } from "./types.js";

export const AFRICA_SKILLS: BusinessSkill[] = [
  {
    id: "africa-market-entry",
    name: "Africa Market Entry Analysis",
    domain: "africa",
    description: "Analyze market entry strategy for a specific African country",
    prompt: `Analyze market entry strategy for {{company_type}} entering {{country}}.

Our product/service: {{product}}
Target segment: {{segment}}
Budget range: {{budget}}
Timeline: {{timeline}}

Provide:
1. Market overview
   - Market size & growth rate
   - Mobile penetration & internet access
   - Key economic indicators
   - Regulatory environment (business registration, foreign ownership rules, taxes)

2. Opportunity sizing
   - TAM, SAM, SOM estimates
   - Competing local and international players
   - Pricing benchmarks (local purchasing power context)

3. Go-to-market approach
   - Recommended entry mode (direct, partnership, distributor, agent)
   - Local distribution channels (mobile money, agents, USSD, web)
   - Language and localization requirements
   - Cultural considerations for sales and marketing

4. Payment infrastructure
   - Available payment methods (M-Pesa, MTN MoMo, Wave, Orange Money, bank transfer)
   - Currency risk management

5. Partnership opportunities
   - Relevant NGOs, government programs, accelerators
   - Local channel partners to approach

6. Top 5 risks and mitigation strategies`,
    inputs: [
      { name: "company_type", label: "Company type", type: "text", required: true, placeholder: "B2B SaaS startup" },
      { name: "country", label: "Target country", type: "select", required: true, options: ["Nigeria", "Kenya", "Ghana", "South Africa", "Togo", "Senegal", "Ivory Coast", "Ethiopia", "Tanzania", "Rwanda", "Egypt", "Morocco", "Cameroon", "Uganda"] },
      { name: "product", label: "Product/service", type: "textarea", required: true },
      { name: "segment", label: "Target customer segment", type: "text", required: true },
      { name: "budget", label: "Entry budget range", type: "text", required: false },
      { name: "timeline", label: "Launch timeline", type: "text", required: false },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["atlas", "aria"],
    tags: ["Africa", "market entry", "emerging markets", "go-to-market"],
    estimatedTokens: 900,
  },
  {
    id: "mobile-money-integration",
    name: "Mobile Money Integration Plan",
    domain: "africa",
    description: "Plan mobile money payment integration for African markets",
    prompt: `Create a mobile money integration plan for {{product_name}} in {{markets}}.

Business type: {{business_type}}
Monthly transaction volume (estimated): {{volume}}
Average transaction size: {{avg_size}}
Currency: {{currency}}

Coverage required:
- MTN Mobile Money ({{mtn_countries}})
- Orange Money ({{orange_countries}})
- M-Pesa (Kenya, Tanzania)
- Wave (Senegal, Ivory Coast, Mali)
- Airtel Money
- Local bank integrations

For each payment provider:
1. Integration method (API, USSD, STK push, QR)
2. Settlement timeline
3. Transaction fees
4. API documentation quality
5. Support availability
6. Recommended for your volume?

Also provide:
- Multi-currency reconciliation approach
- Fraud prevention measures
- Regulatory compliance checklist (per country)
- Recommended payment aggregator (Flutterwave, Paystack, Hubtel, etc.)
- Implementation timeline estimate`,
    inputs: [
      { name: "product_name", label: "Product name", type: "text", required: true },
      { name: "markets", label: "Target markets", type: "text", required: true, placeholder: "Togo, Senegal, Ghana, Nigeria" },
      { name: "business_type", label: "Business type", type: "text", required: true },
      { name: "volume", label: "Estimated monthly transactions", type: "text", required: false },
      { name: "avg_size", label: "Average transaction size", type: "text", required: false },
      { name: "currency", label: "Primary currency", type: "text", required: true, placeholder: "XOF, NGN, GHS" },
      { name: "mtn_countries", label: "MTN countries needed", type: "text", required: false },
      { name: "orange_countries", label: "Orange countries needed", type: "text", required: false },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["ledger", "ops"],
    tags: ["mobile money", "payments", "Africa", "fintech"],
    estimatedTokens: 700,
  },
  {
    id: "francophone-africa-copy",
    name: "Francophone Africa Marketing Copy",
    domain: "africa",
    description: "Create localized marketing copy for French-speaking African markets",
    prompt: `Create marketing copy for {{brand_name}} targeting {{country}} ({{language}} market).

Product: {{product}}
Target audience: {{audience}}
Key value proposition: {{value_prop}}
Local competitors: {{competitors}}
Medium: {{medium}}

Create:
1. Core tagline (in French, authentic — not a translation)
2. Hero headline and subheadline for website/app
3. 3 Facebook/WhatsApp ad copy variants (French)
4. SMS campaign message (160 chars, French)
5. Radio script (30 seconds, conversational French or local dialect if appropriate)
6. WhatsApp Business auto-reply messages (French)

Cultural notes:
- Tone: {{tone}}
- Avoid: Western idioms that don't translate
- Include: Local cultural references where appropriate
- Consider: Low-bandwidth environments (no jargon, simple language)`,
    inputs: [
      { name: "brand_name", label: "Brand name", type: "text", required: true },
      { name: "country", label: "Target country", type: "select", required: true, options: ["Togo", "Senegal", "Ivory Coast", "Cameroon", "Mali", "Burkina Faso", "Guinea", "DRC", "Madagascar", "Morocco", "Tunisia"] },
      { name: "language", label: "Language/dialect", type: "text", required: true, placeholder: "French, or French + local dialect" },
      { name: "product", label: "Product/service", type: "textarea", required: true },
      { name: "audience", label: "Target audience", type: "text", required: true },
      { name: "value_prop", label: "Key value proposition", type: "text", required: true },
      { name: "competitors", label: "Local competitors", type: "text", required: false },
      { name: "medium", label: "Marketing medium", type: "text", required: true, placeholder: "Facebook ads, WhatsApp, SMS, radio" },
      { name: "tone", label: "Tone", type: "select", required: true, options: ["Formal & professional", "Friendly & accessible", "Aspirational", "Community-focused"] },
    ],
    outputFormat: "text",
    agentsWhoUseThis: ["nova"],
    tags: ["francophone", "Africa", "localization", "French"],
    estimatedTokens: 600,
  },
];
