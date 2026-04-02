import { BusinessSkill } from "./types.js";

export const CREATIVE_SKILLS: BusinessSkill[] = [
  {
    id: "brand-story",
    name: "Brand Story & Narrative",
    domain: "creative",
    description: "Craft a compelling brand origin story and narrative",
    prompt: `Write the brand story and narrative for {{brand}}.

Founder(s): {{founder}}
Origin story: {{origin}}
Core mission: {{mission}}
Target audience: {{audience}}
Brand personality: {{personality}}
What makes you different: {{differentiation}}

Deliverables:
1. The Origin Story (300-500 words)
   - The founder moment (what problem they personally experienced)
   - The "why" that drives the company
   - The journey to solution
   - The vision for the future

2. Brand Manifesto (150-200 words)
   - Bold, inspiring declaration of beliefs
   - What you stand for and against

3. Brand Tagline (5 options, under 8 words each)

4. Elevator Pitches:
   - 15-second version (tweet-length)
   - 30-second version
   - 2-minute version (investor/partner)

5. "About Us" website copy (200 words)

6. Brand Voice Guidelines
   - Tone adjectives (what we are / what we're not)
   - 3 writing examples (do / don't)

7. Key messages for each audience segment`,
    inputs: [
      {
        name: "brand",
        label: "Brand name",
        type: "text",
        required: true,
      },
      {
        name: "founder",
        label: "Founder name(s)",
        type: "text",
        required: true,
      },
      {
        name: "origin",
        label: "Origin story — what led to founding this",
        type: "textarea",
        required: true,
        placeholder: "Abel was solving X problem and couldn't find a solution, so he built one",
      },
      {
        name: "mission",
        label: "Core mission",
        type: "text",
        required: true,
        placeholder: "Empowering African entrepreneurs with enterprise-grade technology",
      },
      {
        name: "audience",
        label: "Primary audience",
        type: "text",
        required: true,
        placeholder: "Small business owners in francophone Africa, SaaS founders globally",
      },
      {
        name: "personality",
        label: "Brand personality",
        type: "text",
        required: true,
        placeholder: "Bold, empowering, innovative, authentic, pan-African",
      },
      {
        name: "differentiation",
        label: "What makes you different",
        type: "textarea",
        required: true,
        placeholder: "Built specifically for African markets + global ambition, founded by an African",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["nova"],
    tags: ["brand", "storytelling", "copywriting", "brand strategy"],
    estimatedTokens: 700,
  },
  {
    id: "video-script",
    name: "Video Script",
    domain: "creative",
    description: "Write a professional video script for any purpose",
    prompt: `Write a video script for {{brand}}: {{video_title}}

Video type: {{video_type}}
Length: {{length}}
Platform: {{platform}}
Target audience: {{audience}}
Core message: {{message}}
CTA: {{cta}}
Tone: {{tone}}

Script Format:
[SCENE DESCRIPTION]
VOICEOVER/SPEAKER:

Full script including:
1. Hook (first 3 seconds — stop the scroll)
2. Problem statement (empathy with viewer)
3. Solution introduction
4. Key benefits (shown, not just told)
5. Social proof moment
6. Call to action (clear, one action)

Also provide:
- Shot list suggestions
- B-roll recommendations
- Music mood recommendation
- Thumbnail/cover frame suggestion
- Caption/subtitle notes`,
    inputs: [
      {
        name: "brand",
        label: "Brand name",
        type: "text",
        required: true,
      },
      {
        name: "video_title",
        label: "Video title/topic",
        type: "text",
        required: true,
      },
      {
        name: "video_type",
        label: "Video type",
        type: "select",
        required: true,
        options: ["Brand story", "Product demo", "Testimonial", "How-to tutorial", "Ad (paid)", "Social media short", "Explainer", "Pitch"],
      },
      {
        name: "length",
        label: "Target length",
        type: "text",
        required: true,
        placeholder: "60 seconds, 3 minutes",
      },
      {
        name: "platform",
        label: "Platform",
        type: "select",
        required: true,
        options: ["YouTube", "TikTok", "Instagram Reels", "LinkedIn", "Facebook", "Website", "Presentation"],
      },
      {
        name: "audience",
        label: "Target audience",
        type: "text",
        required: true,
      },
      {
        name: "message",
        label: "Core message to convey",
        type: "textarea",
        required: true,
      },
      {
        name: "cta",
        label: "Call to action",
        type: "text",
        required: true,
        placeholder: "Visit website, start free trial, follow us",
      },
      {
        name: "tone",
        label: "Tone",
        type: "select",
        required: true,
        options: ["Professional", "Inspirational", "Educational", "Entertaining", "Urgent", "Emotional"],
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["nova"],
    tags: ["video script", "content", "marketing", "storytelling"],
    estimatedTokens: 600,
  },
  {
    id: "pr-strategy",
    name: "PR & Media Strategy",
    domain: "creative",
    description: "Build a public relations and media strategy",
    prompt: `Create a PR and media strategy for {{company}} around {{news_angle}}.

News: {{news}}
Business stage: {{stage}}
Target publications: {{publications}}
Spokesperson: {{spokesperson}}
Timeline: {{timeline}}
Budget: {{budget}}

PR Strategy:
1. Core Narrative (the story, not the announcement)
   - News hook (why NOW? why THEM? why CARE?)
   - Broader trend this fits into
   - Data points to support story

2. Media Tiers
   - Tier 1: National/global publications (exclusive targets)
   - Tier 2: Trade/industry press
   - Tier 3: Local/regional media
   - Tier 4: Blogs/newsletters/podcasts

3. Press Materials
   - Press release (inverted pyramid format)
   - Media kit contents
   - Executive bio
   - Company boilerplate

4. Outreach Strategy
   - Embargo strategy (exclusive → then broad)
   - Journalist targeting criteria
   - Personalization approach

5. Messaging by Audience
   - Customers
   - Investors
   - Employees
   - Partners

6. Social Media Amplification Plan

7. Crisis Prep (top 3 questions to prepare for)

8. Success Metrics (coverage, domain authority, sentiment)

9. Timeline and outreach sequence`,
    inputs: [
      {
        name: "company",
        label: "Company name",
        type: "text",
        required: true,
      },
      {
        name: "news_angle",
        label: "PR angle/news",
        type: "text",
        required: true,
        placeholder: "Series A raise, product launch, African expansion",
      },
      {
        name: "news",
        label: "The actual news to announce",
        type: "textarea",
        required: true,
      },
      {
        name: "stage",
        label: "Company stage",
        type: "select",
        required: true,
        options: ["Pre-seed", "Seed", "Series A", "Growth", "Public"],
      },
      {
        name: "publications",
        label: "Target publications",
        type: "text",
        required: true,
        placeholder: "TechCrunch, VentureBeat, African Business, Jeune Afrique",
      },
      {
        name: "spokesperson",
        label: "Primary spokesperson",
        type: "text",
        required: true,
      },
      {
        name: "timeline",
        label: "PR campaign timeline",
        type: "text",
        required: true,
        placeholder: "2 weeks from embargo to release",
      },
      {
        name: "budget",
        label: "PR budget",
        type: "text",
        required: false,
        placeholder: "$5,000 in-house, or agency budget",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["nova", "aria"],
    tags: ["PR", "public relations", "media", "press release"],
    estimatedTokens: 800,
  },
  {
    id: "pitch-deck",
    name: "Pitch Deck Narrative",
    domain: "creative",
    description: "Write the narrative and key slides for any pitch deck",
    prompt: `Write a pitch deck narrative for {{company}} raising {{round}}.

Industry: {{industry}}
Business model: {{model}}
Traction: {{traction}}
Ask: {{ask}}
Use of funds: {{use_of_funds}}
Competition: {{competition}}

Pitch Deck (10-12 slides):
1. Cover (tagline + founder names)
2. Problem (1 slide — the pain, quantified)
3. Solution (your product in 1-2 sentences + screenshot/visual description)
4. Why Now (market timing, tailwind)
5. Market Size (TAM → SAM → SOM with sources)
6. Product (key features, demo flow)
7. Business Model (how you make money)
8. Traction (metrics that matter — MRR, users, retention, growth)
9. Team (why you will win)
10. Competition (2x2 matrix — your unique position)
11. Financials (3-year projection, unit economics)
12. The Ask (amount, use of funds, milestones to achieve)

For each slide:
- Headline (the one thing to remember)
- Key data points
- Presenter talking points (60-90 seconds)
- Design notes`,
    inputs: [
      {
        name: "company",
        label: "Company name",
        type: "text",
        required: true,
      },
      {
        name: "round",
        label: "Round raising",
        type: "select",
        required: true,
        options: ["Pre-seed", "Seed", "Series A", "Series B", "Bridge", "Grant"],
      },
      {
        name: "industry",
        label: "Industry",
        type: "text",
        required: true,
      },
      {
        name: "model",
        label: "Business model",
        type: "textarea",
        required: true,
        placeholder: "B2B SaaS, $149-499/month, annual contracts",
      },
      {
        name: "traction",
        label: "Key traction metrics",
        type: "textarea",
        required: true,
        placeholder: "$42k MRR, 180 customers, 3% monthly churn, 2.1x YoY growth",
      },
      {
        name: "ask",
        label: "Raise amount",
        type: "text",
        required: true,
        placeholder: "$2M",
      },
      {
        name: "use_of_funds",
        label: "Use of funds",
        type: "textarea",
        required: true,
        placeholder: "60% engineering, 25% sales, 15% ops",
      },
      {
        name: "competition",
        label: "Key competitors",
        type: "text",
        required: true,
        placeholder: "Salesforce, HubSpot, Pipedrive",
      },
    ],
    outputFormat: "markdown",
    agentsWhoUseThis: ["aria", "bolt"],
    tags: ["pitch deck", "fundraising", "startup", "investor"],
    estimatedTokens: 800,
  },
];
