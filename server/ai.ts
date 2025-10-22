import OpenAI from 'openai';
import type { Project, Keyword, Competitor, SeoIssue, BacklinkOpportunity } from './argilette/seo-schema';

/*
<important_code_snippet_instructions>
This integration uses Replit AI Integrations (OpenAI-compatible).
The newest OpenAI model is "gpt-5" which was released August 7, 2025. Do not change this unless explicitly requested by the user.
Charges are billed to Replit credits. No separate API key needed.
</important_code_snippet_instructions>
*/

// <important_do_not_delete>
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const DEFAULT_MODEL_STR = "gpt-5";
// </important_do_not_delete>

// This is Argilette AI, powered by Replit's AI Integrations service
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

// Validate integration setup
const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

if (!baseURL || !apiKey) {
  console.error('❌ Argilette AI not configured. Missing environment variables.');
  console.error('   AI_INTEGRATIONS_OPENAI_BASE_URL:', baseURL ? '✓ Set' : '✗ Missing');
  console.error('   AI_INTEGRATIONS_OPENAI_API_KEY:', apiKey ? '✓ Set' : '✗ Missing');
} else {
  console.log('✅ Argilette AI configured correctly (Replit AI Integrations)');
}

interface SEOContext {
  project?: Project;
  keywords?: Keyword[];
  competitors?: Competitor[];
  seoIssues?: SeoIssue[];
}

export class AIService {
  async chat(userMessage: string, context?: SEOContext): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    
    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL_STR,
      max_completion_tokens: 2048,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
    });

    return completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  }

  async generateInsights(context: SEOContext): Promise<string[]> {
    const contextSummary = this.summarizeContext(context);
    
    const prompt = `Based on the following SEO data, provide 3-5 actionable insights and recommendations. Focus on the most important opportunities and issues. Be specific and data-driven.

${contextSummary}

Provide insights as a JSON array of strings, each insight should be 1-2 sentences.`;

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL_STR,
      max_completion_tokens: 1024,
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: 'You are an SEO expert. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
    });

    try {
      const content = completion.choices[0]?.message?.content;
      if (!content) return [];
      
      const parsed = JSON.parse(content);
      const insights = parsed.insights || parsed;
      return Array.isArray(insights) ? insights : [];
    } catch {
      return [];
    }
  }

  async analyzeKeywords(keywords: Keyword[]): Promise<string> {
    const keywordSummary = keywords.slice(0, 20).map(k => 
      `${k.keyword}: Volume ${k.searchVolume}, Difficulty ${k.difficulty}, Position ${k.position || 'N/A'}, CPC $${k.cpc || 0}`
    ).join('\n');

    const prompt = `Analyze these keywords and provide strategic recommendations for SEO optimization:

${keywordSummary}

Focus on:
1. Best opportunities (high volume, low difficulty)
2. Keywords to prioritize
3. Content gap opportunities
4. Quick wins`;

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL_STR,
      max_completion_tokens: 1024,
      messages: [
        { role: 'system', content: 'You are an SEO keyword analysis expert.' },
        { role: 'user', content: prompt }
      ],
    });

    return completion.choices[0]?.message?.content || 'Unable to analyze keywords.';
  }

  async analyzeCompetitors(competitors: Competitor[]): Promise<string> {
    const competitorSummary = competitors.map(c => 
      `${c.domain}: Traffic ${c.estimatedTraffic}, Keywords ${c.commonKeywords}, Domain Score ${c.domainScore}`
    ).join('\n');

    const prompt = `Analyze these competitors and provide strategic insights:

${competitorSummary}

Focus on:
1. Competitive advantages we can leverage
2. Competitor weaknesses to exploit
3. Traffic acquisition strategies
4. Market positioning recommendations`;

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL_STR,
      max_completion_tokens: 1024,
      messages: [
        { role: 'system', content: 'You are a competitive analysis expert.' },
        { role: 'user', content: prompt }
      ],
    });

    return completion.choices[0]?.message?.content || 'Unable to analyze competitors.';
  }

  async prioritizeIssues(issues: SeoIssue[]): Promise<string> {
    const issueSummary = issues.map(i => 
      `[${i.severity.toUpperCase()}] ${i.title}: ${i.description}`
    ).join('\n');

    const prompt = `Prioritize these SEO issues and provide a strategic action plan:

${issueSummary}

Focus on:
1. Quick wins with high impact
2. Critical issues to address first
3. Long-term improvements
4. Resource allocation recommendations`;

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL_STR,
      max_completion_tokens: 1024,
      messages: [
        { role: 'system', content: 'You are an SEO technical expert.' },
        { role: 'user', content: prompt }
      ],
    });

    return completion.choices[0]?.message?.content || 'Unable to prioritize issues.';
  }

  async recommendBacklinks(opportunities: BacklinkOpportunity[]): Promise<string> {
    const opportunitySummary = opportunities.map(o => 
      `${o.url}: DA ${o.domainAuthority}, PA ${o.pageAuthority}, Status: ${o.status}`
    ).join('\n');

    const prompt = `Analyze these backlink opportunities and provide strategic recommendations:

${opportunitySummary}

Focus on:
1. Highest value opportunities
2. Outreach strategy
3. Content requirements
4. Expected timeline and effort`;

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL_STR,
      max_completion_tokens: 1024,
      messages: [
        { role: 'system', content: 'You are a link building expert.' },
        { role: 'user', content: prompt }
      ],
    });

    return completion.choices[0]?.message?.content || 'Unable to recommend backlinks.';
  }

  async generateContentBrief(keyword: string, context?: SEOContext): Promise<string> {
    const prompt = `Create a comprehensive content brief for the keyword: "${keyword}"

Include:
1. Target audience and search intent
2. Recommended content structure
3. Key topics and subtopics to cover
4. Word count and format recommendations
5. SEO optimization tips
${context ? `\nAdditional context: ${this.summarizeContext(context)}` : ''}`;

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL_STR,
      max_completion_tokens: 2048,
      messages: [
        { role: 'system', content: 'You are a content strategy expert.' },
        { role: 'user', content: prompt }
      ],
    });

    return completion.choices[0]?.message?.content || 'Unable to generate content brief.';
  }

  async analyzeSERP(keyword: string, serpData: any[]): Promise<string> {
    const serpSummary = serpData.slice(0, 10).map((result, i) => 
      `${i + 1}. ${result.title} - ${result.url}`
    ).join('\n');

    const prompt = `Analyze the SERP (Search Engine Results Page) for keyword: "${keyword}"

Top 10 Results:
${serpSummary}

Provide insights on:
1. SERP intent and patterns
2. Content gaps and opportunities
3. Ranking difficulty assessment
4. Recommended content approach`;

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL_STR,
      max_completion_tokens: 1024,
      messages: [
        { role: 'system', content: 'You are a SERP analysis expert.' },
        { role: 'user', content: prompt }
      ],
    });

    return completion.choices[0]?.message?.content || 'Unable to analyze SERP.';
  }

  async identifyContentGaps(keywords: Keyword[], competitors: Competitor[]): Promise<string[]> {
    const keywordList = keywords.slice(0, 15).map(k => k.keyword).join(', ');
    const competitorList = competitors.map(c => c.domain).join(', ');

    const prompt = `Identify content gaps and opportunities based on:

Keywords: ${keywordList}
Competitors: ${competitorList}

Provide a JSON array of 5-7 specific content gap opportunities. Each should be a brief description.`;

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL_STR,
      max_completion_tokens: 1024,
      response_format: { type: "json_object" },
      messages: [
        { role: 'system', content: 'You are a content strategy expert. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
    });

    try {
      const content = completion.choices[0]?.message?.content;
      if (!content) return [];
      
      const parsed = JSON.parse(content);
      const gaps = parsed.gaps || parsed.contentGaps || parsed;
      return Array.isArray(gaps) ? gaps : [];
    } catch {
      return [];
    }
  }

  private buildSystemPrompt(context?: SEOContext): string {
    let prompt = 'You are an expert SEO analyst and strategist. Provide actionable, data-driven insights and recommendations.';
    
    if (context) {
      const summary = this.summarizeContext(context);
      if (summary) {
        prompt += `\n\nContext:\n${summary}`;
      }
    }
    
    return prompt;
  }

  private summarizeContext(context: SEOContext): string {
    const parts: string[] = [];
    
    if (context.project) {
      parts.push(`Project: ${context.project.name} (${context.project.domain})`);
    }
    
    if (context.keywords && context.keywords.length > 0) {
      parts.push(`\nKeywords Tracked: ${context.keywords.length}`);
      const topKeywords = context.keywords
        .slice(0, 5)
        .map(k => `${k.keyword} (Vol: ${k.searchVolume})`)
        .join(', ');
      parts.push(`Top Keywords: ${topKeywords}`);
    }
    
    if (context.seoIssues && context.seoIssues.length > 0) {
      const criticalIssues = context.seoIssues.filter(i => i.severity === 'critical').length;
      parts.push(`\nSEO Issues: ${context.seoIssues.length} total (${criticalIssues} critical)`);
    }
    
    if (context.competitors && context.competitors.length > 0) {
      parts.push(`\nCompetitors Tracked: ${context.competitors.length}`);
    }
    
    return parts.join('\n');
  }
}

export const aiService = new AIService();
