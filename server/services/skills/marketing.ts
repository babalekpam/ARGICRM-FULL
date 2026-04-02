import { BusinessSkill } from "./types.js";

export const MARKETING_SKILLS: BusinessSkill[] = [
  {
    id: "content-calendar",
    name: "Monthly Content Calendar",
    domain: "marketing",
    description: "Generate a complete 30-day content calendar",
    prompt: `Create a 30-day content calendar for {{brand_name}} in the {{industry}} space.

Target audience: {{audience}}
Content goal: {{goal}}
Brand voice: {{voice}}
Platforms: {{platforms}}

For each week, provide:
- 3 LinkedIn posts (thought leadership, educational, social proof)
- 2 Twitter/X threads (data-driven, opinion-based)  
- 1 long-form blog post (SEO-optimized, pillar content)
- 2 email newsletter ideas
- 1 short-form video script concept

For each content piece:
✓ Hook (first line that stops the scroll)
✓ Core message
✓ CTA
✓ Relevant hashtags (LinkedIn/Twitter)
✓ Best time to post

Highlight 3 "pillar content" pieces for the month that anchor the strategy.`,
    inputs: [
      { name: "brand_name", label: "Brand name", type: "text", required: true },
      { name: "industry", label: "Industry", type: "text", required: true },
      { name: "audience", label: "Target audience", type: "textarea", required: true },
      { name: "goal", label: "Content goal", type: "select", required: true, options: ["Brand awareness", "Lead generation", "Thought leadership", "Community building", "Sales enablement"] },
      { name: "voice", label: "Brand voice", type: "text", required: false, placeholder: "Professional but approachable, data-driven" },
      { name: "platforms", label: "Platforms", type: "text", required: true, placeholder: "LinkedIn, Twitter, Email" },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["nova"],
    tags: ["content calendar", "social media", "planning"],
    estimatedTokens: 1000,
  },
  {
    id: "linkedin-thought-leadership",
    name: "LinkedIn Thought Leadership Post",
    domain: "marketing",
    description: "Write a viral-worthy LinkedIn post on any topic",
    prompt: `Write a high-engagement LinkedIn post about: {{topic}}

Author persona: {{author_role}} in the {{industry}} space
Unique angle: {{angle}}
Target audience: {{audience}}

Format rules:
- Hook: First line must stop the scroll (provocative question, bold statement, or counterintuitive insight)
- No intro fluff — get straight to the value
- Use line breaks liberally (one idea per line)
- Short paragraphs (max 3 lines)
- Numbered lists or bullet points for scanability
- Personal story or observation grounded in real experience
- End with a question that invites comments
- 200–400 words

Write 3 different versions with different angles:
Version A: Contrarian/provocative
Version B: Data-driven/insight
Version C: Personal story/lesson`,
    inputs: [
      { name: "topic", label: "Topic or insight to share", type: "textarea", required: true },
      { name: "author_role", label: "Author's role", type: "text", required: true },
      { name: "industry", label: "Industry", type: "text", required: true },
      { name: "angle", label: "Your unique angle or opinion", type: "textarea", required: false },
      { name: "audience", label: "Who should see this", type: "text", required: true },
    ],
    outputFormat: "text",
    agentsWhoUseThis: ["nova"],
    tags: ["linkedin", "thought leadership", "social media"],
    estimatedTokens: 600,
  },
  {
    id: "email-campaign",
    name: "Email Campaign (Full Sequence)",
    domain: "marketing",
    description: "Write a complete email campaign from welcome to conversion",
    prompt: `Write a {{sequence_length}}-email marketing campaign for: {{campaign_goal}}

Product/offer: {{offer}}
Target segment: {{segment}}
Campaign trigger: {{trigger}}
Tone: {{tone}}

For each email:
Subject line (+ A/B variant)
Preview text
Body (HTML-friendly structure: headline → value → proof → CTA)
CTA button text
Send timing recommendation

Campaign arc: Build curiosity → Educate → Social proof → Urgency → Convert → Post-purchase`,
    inputs: [
      { name: "sequence_length", label: "Number of emails", type: "select", required: true, options: ["3", "5", "7", "10"] },
      { name: "campaign_goal", label: "Campaign objective", type: "text", required: true, placeholder: "Convert trial users to paid" },
      { name: "offer", label: "Product/offer details", type: "textarea", required: true },
      { name: "segment", label: "Target segment", type: "text", required: true },
      { name: "trigger", label: "What triggers this campaign", type: "text", required: true, placeholder: "User signs up for free trial" },
      { name: "tone", label: "Tone", type: "select", required: true, options: ["Professional", "Friendly & conversational", "Urgent", "Educational", "Inspirational"] },
    ],
    outputFormat: "email",
    agentsWhoUseThis: ["nova"],
    tags: ["email", "campaign", "nurture", "conversion"],
    estimatedTokens: 1200,
  },
  {
    id: "ad-copy-google",
    name: "Google Ads Copy",
    domain: "marketing",
    description: "Write Google Search Ads copy for any keyword/offer",
    prompt: `Write Google Search Ads for this campaign:

Target keyword: {{keyword}}
Landing page focus: {{landing_page_focus}}
Unique value prop: {{uvp}}
Target audience: {{audience}}
CTA goal: {{cta}}

Create 3 Responsive Search Ad (RSA) variations:
For each:
- 15 headlines (max 30 chars each) — label as Pinned or Rotatable
- 4 descriptions (max 90 chars each)
- Display URL path suggestions

Also write 5 ad extensions:
- 4 sitelink extensions
- 4 callout extensions
- 2 structured snippet headlines

Flag which headlines include: keyword insertion, emotional trigger, social proof, urgency, and feature highlight.`,
    inputs: [
      { name: "keyword", label: "Primary target keyword", type: "text", required: true },
      { name: "landing_page_focus", label: "Landing page focus", type: "text", required: true },
      { name: "uvp", label: "Unique value proposition", type: "textarea", required: true },
      { name: "audience", label: "Target audience", type: "text", required: true },
      { name: "cta", label: "Call to action goal", type: "text", required: true, placeholder: "Free trial signup" },
    ],
    outputFormat: "text",
    agentsWhoUseThis: ["nova"],
    tags: ["google ads", "PPC", "advertising"],
    estimatedTokens: 600,
  },
  {
    id: "seo-blog-post",
    name: "SEO Blog Post",
    domain: "marketing",
    description: "Write a fully optimized long-form blog post",
    prompt: `Write a comprehensive, SEO-optimized blog post.

Primary keyword: {{keyword}}
Secondary keywords: {{secondary_keywords}}
Target audience: {{audience}}
Content goal: {{goal}}
Word count: {{word_count}}
Competitor articles to outperform: {{competitors}}

Structure:
- Title (with primary keyword, under 60 chars)
- Meta description (under 155 chars, includes keyword)
- Introduction with hook (problem → promise)
- H2 and H3 sections covering all search intent
- Include: stats/data points, examples, actionable steps
- FAQ section (targets "People Also Ask" features)
- Conclusion with CTA
- Internal linking suggestions
- Image alt text suggestions

Make it genuinely better than existing content on this topic.`,
    inputs: [
      { name: "keyword", label: "Primary keyword", type: "text", required: true },
      { name: "secondary_keywords", label: "Secondary keywords", type: "text", required: false },
      { name: "audience", label: "Target reader", type: "text", required: true },
      { name: "goal", label: "Content goal", type: "text", required: true, placeholder: "Rank #1 for keyword + generate leads" },
      { name: "word_count", label: "Target word count", type: "select", required: true, options: ["800", "1200", "1800", "2500", "3500"] },
      { name: "competitors", label: "Competitor articles to beat", type: "text", required: false },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["nova", "atlas"],
    tags: ["SEO", "blog", "content", "organic"],
    estimatedTokens: 1500,
  },
];
