import { BusinessSkill } from "./types.js";

export const ECOMMERCE_SKILLS: BusinessSkill[] = [
  {
    id: "amazon-listing",
    name: "Amazon Product Listing",
    domain: "ecommerce",
    description: "Optimize an Amazon product listing for maximum conversion",
    prompt: `Write an optimized Amazon product listing for {{product_name}}.

Category: {{category}}
Key features: {{features}}
Target keywords: {{keywords}}
Price point: {{price}}
Target buyer: {{buyer}}
Competitors: {{competitors}}

Amazon Listing:
1. Title (under 200 chars, includes primary keyword, brand, key spec)
2. Bullet Points (5 bullets)
   - Lead with benefit, then feature
   - Include secondary keywords naturally
   - Address top buyer concerns
   - Under 255 chars each
3. Product Description (HTML-formatted, 2000 chars)
   - Story format + benefits
   - Trust signals
   - Use case scenarios
4. A+ Content outline (Brand Story + modules)
5. Backend Keywords (hidden search terms, 250 bytes)
6. Suggested categories and subcategories
7. Review strategy (how to get initial reviews legitimately)
8. FBA vs FBM recommendation

Keyword strategy: Primary keyword in title and first bullet, secondary throughout.`,
    inputs: [
      {
        name: "product_name",
        label: "Product name",
        type: "text",
        required: true,
      },
      {
        name: "category",
        label: "Amazon category",
        type: "text",
        required: true,
        placeholder: "Home & Kitchen, Electronics, Beauty",
      },
      {
        name: "features",
        label: "Key product features",
        type: "textarea",
        required: true,
        placeholder: "Adjustable, BPA-free, 32oz capacity, dishwasher safe",
      },
      {
        name: "keywords",
        label: "Target keywords",
        type: "text",
        required: true,
        placeholder: "insulated water bottle, stainless steel water bottle",
      },
      {
        name: "price",
        label: "Price point",
        type: "text",
        required: true,
        placeholder: "$29.99",
      },
      {
        name: "buyer",
        label: "Target buyer",
        type: "text",
        required: true,
        placeholder: "Active adults 25-45 who exercise daily",
      },
      {
        name: "competitors",
        label: "Top 3 competitors",
        type: "text",
        required: false,
        placeholder: "Hydro Flask, YETI, Stanley",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["nova", "bolt"],
    tags: ["Amazon", "product listing", "e-commerce", "SEO"],
    estimatedTokens: 600,
  },
  {
    id: "dtc-launch",
    name: "DTC Brand Launch Strategy",
    domain: "ecommerce",
    description: "Plan a direct-to-consumer brand launch",
    prompt: `Plan a DTC brand launch strategy for {{brand}} ({{product_category}}).

Target market: {{market}}
Launch budget: {{budget}}
Timeline to launch: {{timeline}}
Competitive advantage: {{advantage}}
Distribution: {{distribution}}

Launch Strategy:
1. Brand Positioning (1-sentence brand promise)
2. Target Customer Deep Dive (demographics, psychographics, jobs-to-be-done)
3. Pre-Launch (6 weeks before)
   - Email waitlist building strategy
   - Teaser content calendar
   - Influencer seeding plan
   - PR outreach targets
4. Launch Week Plan (day by day)
   - Email sequence (3-5 emails)
   - Social media posts
   - Paid ad activation
   - PR moment
5. Post-Launch Acquisition Channels
   - Paid: Meta, TikTok, Google Shopping
   - Organic: SEO, content, social
   - Partnerships and collaborations
6. Retention Strategy
   - Post-purchase email flow
   - Loyalty/subscription offer
   - Referral program design
7. Key Metrics and Targets
   - CAC target by channel
   - LTV target
   - Return rate threshold
8. First 90-Day Revenue Forecast
9. Budget Allocation`,
    inputs: [
      {
        name: "brand",
        label: "Brand name",
        type: "text",
        required: true,
      },
      {
        name: "product_category",
        label: "Product category",
        type: "text",
        required: true,
      },
      {
        name: "market",
        label: "Target market",
        type: "text",
        required: true,
        placeholder: "US, UK, West Africa, Global",
      },
      {
        name: "budget",
        label: "Launch budget",
        type: "text",
        required: true,
        placeholder: "$50,000",
      },
      {
        name: "timeline",
        label: "Weeks to launch",
        type: "text",
        required: true,
        placeholder: "12 weeks",
      },
      {
        name: "advantage",
        label: "Competitive advantage",
        type: "textarea",
        required: true,
        placeholder: "Made in Africa, sustainable materials, unique formulation",
      },
      {
        name: "distribution",
        label: "Distribution channels",
        type: "text",
        required: true,
        placeholder: "Own website, Amazon, retail partnerships",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["nova", "bolt"],
    tags: ["DTC", "e-commerce", "launch", "brand strategy"],
    estimatedTokens: 900,
  },
  {
    id: "returns-reduction",
    name: "Returns Reduction Strategy",
    domain: "ecommerce",
    description: "Create a plan to reduce e-commerce return rates",
    prompt: `Create a returns reduction strategy for {{store_name}}.

Current return rate: {{return_rate}}%
Top return reasons: {{return_reasons}}
Product categories: {{categories}}
Platform: {{platform}}
Customer type: {{customer_type}}

Returns Reduction Plan:
1. Root Cause Analysis
   - Returns by reason (size, quality, expectation mismatch, etc.)
   - Returns by product category
   - Returns by customer segment
   - Returns by acquisition channel

2. Pre-Purchase Improvements
   - Size guide enhancements
   - Photography requirements (detail shots, lifestyle, scale)
   - Product description improvements
   - Review strategy (encourage photo reviews)
   - Virtual try-on / AR (if applicable)
   - AI product recommendations (reduce wrong-item purchases)

3. At-Checkout Improvements
   - Size confirmation prompts
   - "Customers who bought this also viewed" alternatives
   - Cross-sell to prevent buyer's remorse

4. Post-Purchase Interventions
   - Order confirmation with usage guide
   - Proactive shipment tracking
   - Unboxing experience improvements
   - Usage/care instructions

5. Returns Process Optimization
   - Exchange-first return flow
   - Store credit incentives
   - Self-service returns portal
   - Refund timing improvements

6. Return Fraud Prevention
7. Financial Impact Model (1% reduction = $X saved)
8. 90-day implementation plan`,
    inputs: [
      {
        name: "store_name",
        label: "Store name",
        type: "text",
        required: true,
      },
      {
        name: "return_rate",
        label: "Current return rate %",
        type: "number",
        required: true,
      },
      {
        name: "return_reasons",
        label: "Top return reasons",
        type: "textarea",
        required: true,
        placeholder: "Wrong size (40%), quality issue (25%), changed mind (20%)",
      },
      {
        name: "categories",
        label: "Product categories",
        type: "text",
        required: true,
        placeholder: "Apparel, electronics, home goods",
      },
      {
        name: "platform",
        label: "Platform",
        type: "select",
        required: true,
        options: ["Shopify", "WooCommerce", "Amazon", "Magento", "Custom", "Multi-channel"],
      },
      {
        name: "customer_type",
        label: "Primary customer type",
        type: "select",
        required: true,
        options: ["B2C consumers", "B2B buyers", "Mixed"],
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["ops", "nova"],
    tags: ["returns", "e-commerce", "conversion rate", "customer experience"],
    estimatedTokens: 700,
  },
];
