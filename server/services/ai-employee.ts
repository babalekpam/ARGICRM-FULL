/**
 * AI Employee Service
 * Autonomous AI agents for social posting, prospecting, email replies, and deal progression
 */

import OpenAI from 'openai';

// Argilette AI powered by Replit AI Integrations
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

const DEFAULT_MODEL = "gpt-5";

// AI Employee Agent Prompts
export const AI_EMPLOYEE_PROMPTS = {
  // Social Media Author - Platform-specific post generation
  socialAuthor: {
    system: `You are ARGILETTE's social marketer. Create platform-specific posts with strong hooks and clear CTAs. 
Keep brand voice: concise, helpful, confident. Offer 1 actionable tip per post.
Always include relevant hashtags and format appropriately for the platform.`,
    
    platforms: {
      linkedin: `Create a professional LinkedIn post (220-260 words) with:
- Compelling opening hook that addresses a business pain point
- 2-3 key insights or actionable tips
- Clear value proposition
- Engaging CTA (comment, share, connect, download)
- 2-3 relevant professional hashtags (#CRM #SalesAutomation #AIMarketing)
Format: Use line breaks for readability, emojis sparingly for emphasis points.`,
      
      twitter: `Create a Twitter/X thread (3-5 tweets) with:
- Opening tweet: Attention-grabbing hook (max 280 characters)
- Body tweets: Break down insights or tips
- Final tweet: CTA with link or engagement ask
- 2-3 relevant hashtags
Format: Keep punchy, use numbers for listicles, one idea per tweet.`,
      
      facebook: `Create an engaging Facebook post (150-200 words) with:
- Relatable opening question or statement
- Story-driven content that resonates emotionally
- Clear business value or insight
- Conversational CTA (comment, share, visit website)
- 1-2 relevant hashtags
Format: Casual tone, short paragraphs, use emojis to break up text.`,
      
      instagram: `Create an Instagram caption (125-150 words) with:
- Eye-catching first line (appears in feed preview)
- Storytelling or behind-the-scenes angle
- Valuable takeaway or tip
- Engagement CTA (double-tap, save, tag a friend)
- 5-7 targeted hashtags (mix of popular and niche)
Format: Line breaks between sections, conversational voice, visual language.`
    }
  },

  // SDR Outreach - Prospecting and qualification
  sdrOutreach: {
    system: `You are ARGILETTE's SDR (Sales Development Representative). 
Qualify prospects by pain, budget, authority, and timing (BANT framework).
Personalize outreach using CRM data. Use a friendly, concise tone.
End every email with 2 specific time slots for a call.`,
    
    email: `Craft a personalized cold outreach email that:
- Opens with a relevant insight about their business/industry
- Identifies a specific pain point they likely face
- Introduces ARGILETTE as the solution in 1-2 sentences
- Provides social proof (customer win, metric, or testimonial)
- Asks 1 qualifying question about their current process
- Offers 2 specific meeting times (e.g., "Tuesday 2pm EST or Thursday 10am EST")
Keep under 120 words. Subject line should be curiosity-driven, not salesy.`,
    
    followUp: `Create a brief follow-up email (60-80 words) that:
- References the previous outreach
- Adds new value (insight, resource, case study)
- Creates urgency with a time-sensitive angle
- Offers alternative contact methods (calendar link, phone)
- Maintains friendly persistence without being pushy`
  },

  // Reply Handler - Email intent classification and response
  replyHandler: {
    system: `You are ARGILETTE's email reply classifier and responder.
Classify incoming email intent accurately: positive, neutral, objection, pricing, unsubscribe, OOO, bounce.
Propose next_best_action for the sales team.
Draft email responses under 120 words that advance the deal.`,
    
    classification: `Analyze this email and return JSON with:
{
  "intent": "positive|neutral|objection|pricing|unsubscribe|ooo|bounce",
  "score": 0-100,  // Lead quality/interest level
  "summary": "2-sentence summary of key points",
  "next_stage": "qualification|demo|proposal|negotiation|closed-won|closed-lost",
  "next_action": "Specific action for sales rep to take",
  "sentiment": "positive|neutral|negative",
  "urgency": "low|medium|high",
  "key_objections": ["list of any concerns raised"]
}`,
    
    response: `Write a concise, friendly sales reply (under 120 words) that:
- Addresses their specific question or concern
- Provides value (answer, resource, or insight)
- Advances the conversation toward a meeting
- Asks 1 qualifying question to understand their needs better
- Offers 2 specific time slots for a call
Keep conversational, helpful, and human-sounding.`
  },

  // Closer - Proposal and deal closing
  closer: {
    system: `You are ARGILETTE's deal closer.
Draft proposals, meeting recaps, and closing emails with clear value propositions.
Include scope bullets, next steps, and calendar/scheduling links.
Maintain confidence while addressing concerns.`,
    
    proposal: `Create a proposal email that:
- Opens with appreciation for their time/interest
- Summarizes their key requirements and pain points
- Presents ARGILETTE's solution with specific features that address their needs
- Outlines clear scope in 3-5 bullet points
- Provides transparent pricing breakdown
- Includes implementation timeline
- Lists next steps with specific dates/milestones
- Ends with CTA to schedule contract review call
Keep professional, structured, and under 300 words.`,
    
    recap: `Write a meeting recap email that:
- Thanks them for the productive conversation
- Summarizes 3-4 key discussion points
- Confirms agreed-upon next steps with dates
- Addresses any open questions raised
- Provides any promised resources or documentation
- Proposes next meeting time
Keep concise (150-200 words), bullet-formatted for easy scanning.`
  },

  // Lead Scorer - AI-powered qualification
  leadScorer: {
    system: `You are ARGILETTE's lead scoring AI.
Analyze contact data and interactions to assign a quality score (0-100).
Consider: engagement level, company fit, budget indicators, authority signals, and timing.`,
    
    scoring: `Based on this contact data, assign a lead score (0-100) and return JSON:
{
  "score": 0-100,
  "reasoning": "2-sentence explanation of score",
  "fit_score": 0-100,  // Company size, industry, use case fit
  "engagement_score": 0-100,  // Email opens, replies, website visits
  "readiness_score": 0-100,  // Buying signals, timeline indicators
  "recommended_action": "Specific next step",
  "priority": "low|medium|high|urgent"
}`
  },

  // Chat Qualifier - Website chat bot
  chatQualifier: {
    system: `You are ARGILETTE's site assistant. Ask focused questions to qualify leads in ≤4 turns.
Be helpful and conversational. If qualified (has pain, budget signal, and timeline), offer booking link.
Keep responses brief (40-60 words per message).`,
    
    greeting: `Greet website visitors warmly and ask: "What brings you to ARGILETTE today?"
Follow-up questions to uncover:
1. Their current CRM/sales challenge (pain point)
2. Team size and who makes software decisions (authority)
3. Timeline for solving this problem (urgency)
4. Budget range or current tool costs (budget)
After 3-4 exchanges, if qualified, offer: "Based on what you've shared, I think ARGILETTE would be a great fit. Would you like to book a 15-minute demo with our team?"`
  }
};

export class AIEmployeeService {
  /**
   * Generate platform-specific social media post
   */
  async generateSocialPost(params: {
    platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram';
    topic: string;
    targetAudience?: string;
    cta?: string;
  }): Promise<{
    content: string;
    hashtags: string[];
    mediaRecommendation?: string;
  }> {
    const platformPrompt = AI_EMPLOYEE_PROMPTS.socialAuthor.platforms[params.platform];
    const prompt = `${platformPrompt}

Topic: ${params.topic}
${params.targetAudience ? `Target Audience: ${params.targetAudience}` : ''}
${params.cta ? `Desired CTA: ${params.cta}` : ''}

Generate the post content now.`;

    const apiResponse = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: AI_EMPLOYEE_PROMPTS.socialAuthor.system },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const response = apiResponse.choices[0]?.message?.content || '';

    // Extract hashtags from response
    const hashtagMatches = response.match(/#\w+/g) || [];
    const hashtags = Array.from(new Set(hashtagMatches));

    return {
      content: response,
      hashtags,
      mediaRecommendation: this.getMediaRecommendation(params.platform, params.topic)
    };
  }

  /**
   * Generate personalized outreach email
   */
  async generateOutreachEmail(params: {
    contactName: string;
    companyName: string;
    industry?: string;
    painPoint?: string;
    personalization?: string;
  }): Promise<{
    subject: string;
    body: string;
  }> {
    const prompt = `Generate a cold outreach email:

Recipient: ${params.contactName} at ${params.companyName}
${params.industry ? `Industry: ${params.industry}` : ''}
${params.painPoint ? `Known Pain Point: ${params.painPoint}` : ''}
${params.personalization ? `Personalization Note: ${params.personalization}` : ''}

Include a compelling subject line and email body.`;

    const apiResponse = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: AI_EMPLOYEE_PROMPTS.sdrOutreach.system + '\n\n' + AI_EMPLOYEE_PROMPTS.sdrOutreach.email },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 400
    });

    const response = apiResponse.choices[0]?.message?.content || '';

    // Parse subject and body
    const subjectMatch = response.match(/Subject:?\s*(.+)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : 'Quick question about [Company]';
    const body = response.replace(/Subject:?\s*.+/i, '').trim();

    return { subject, body };
  }

  /**
   * Classify email intent and generate response
   */
  async classifyAndRespondToEmail(params: {
    emailBody: string;
    contactName?: string;
    previousContext?: string;
  }): Promise<{
    classification: {
      intent: string;
      score: number;
      summary: string;
      nextStage: string;
      nextAction: string;
      sentiment: string;
      urgency: string;
      keyObjections: string[];
    };
    response?: string;
  }> {
    // First, classify the email
    const classificationPrompt = `${AI_EMPLOYEE_PROMPTS.replyHandler.classification}

Email to analyze:
${params.emailBody}

${params.previousContext ? `Previous context: ${params.previousContext}` : ''}`;

    const apiClassificationResponse = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: AI_EMPLOYEE_PROMPTS.replyHandler.system },
        { role: "user", content: classificationPrompt }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const classificationResponse = apiClassificationResponse.choices[0]?.message?.content || '';

    // Parse JSON response
    let classification: any;
    try {
      const jsonMatch = classificationResponse.match(/\{[\s\S]*\}/);
      classification = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
    } catch (error) {
      console.error('Email classification JSON parsing failed:', error, 'Response:', classificationResponse);
      classification = {
        intent: 'neutral',
        score: 50,
        summary: 'Unable to parse classification',
        nextStage: 'follow_up',
        nextAction: 'Manual review required',
        sentiment: 'neutral',
        urgency: 'medium',
        keyObjections: []
      };
    }

    // Don't generate response for unsubscribe, OOO, or bounce
    if (['unsubscribe', 'ooo', 'bounce'].includes(classification.intent.toLowerCase())) {
      return { classification };
    }

    // Generate response
    const responsePrompt = `${AI_EMPLOYEE_PROMPTS.replyHandler.response}

Original email:
${params.emailBody}

${params.contactName ? `Recipient name: ${params.contactName}` : ''}
Intent: ${classification.intent}
Key points to address: ${classification.summary}

Draft your response now.`;

    const apiEmailResponse = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: AI_EMPLOYEE_PROMPTS.replyHandler.system },
        { role: "user", content: responsePrompt }
      ],
      temperature: 0.7,
      max_tokens: 250
    });

    const emailResponse = apiEmailResponse.choices[0]?.message?.content || '';

    return {
      classification,
      response: emailResponse.trim()
    };
  }

  /**
   * Generate chat bot response
   */
  async generateChatResponse(params: {
    userMessage: string;
    conversationHistory: Array<{ role: 'user' | 'bot'; content: string }>;
    qualificationData?: any;
  }): Promise<{
    response: string;
    qualificationUpdates?: any;
    isQualified?: boolean;
  }> {
    const history = params.conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Bot'}: ${msg.content}`)
      .join('\n');

    const prompt = `${AI_EMPLOYEE_PROMPTS.chatQualifier.greeting}

Conversation so far:
${history}

User's latest message: ${params.userMessage}

${params.qualificationData ? `Qualification data collected: ${JSON.stringify(params.qualificationData)}` : ''}

Respond to the user now. Be helpful and guide toward qualification.`;

    const apiResponse = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: AI_EMPLOYEE_PROMPTS.chatQualifier.system },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    const response = apiResponse.choices[0]?.message?.content || '';

    // TODO: Parse qualification signals from the conversation
    const qualificationUpdates = this.extractQualificationSignals(params.userMessage);
    const isQualified = this.checkIfQualified(params.qualificationData, qualificationUpdates);

    return {
      response: response.trim(),
      qualificationUpdates,
      isQualified
    };
  }

  /**
   * Score a lead based on available data
   */
  async scoreLead(contactData: {
    company?: string;
    jobTitle?: string;
    industry?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    numberOfEmployees?: string;
    interactions?: number;
    lastEngagement?: string;
  }): Promise<{
    score: number;
    reasoning: string;
    fitScore: number;
    engagementScore: number;
    readinessScore: number;
    recommendedAction: string;
    priority: string;
  }> {
    const prompt = `${AI_EMPLOYEE_PROMPTS.leadScorer.scoring}

Contact data:
${JSON.stringify(contactData, null, 2)}

Provide your scoring analysis now.`;

    const apiResponse = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: AI_EMPLOYEE_PROMPTS.leadScorer.system },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const response = apiResponse.choices[0]?.message?.content || '';

    // Parse JSON response
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
    } catch (error) {
      console.error('Lead scoring JSON parsing failed:', error, 'Response:', response);
      return {
        score: 50,
        reasoning: 'Unable to parse scoring data',
        fitScore: 50,
        engagementScore: 50,
        readinessScore: 50,
        recommendedAction: 'Manual review',
        priority: 'medium'
      };
    }
  }

  /**
   * Generate deal proposal
   */
  async generateProposal(params: {
    contactName: string;
    companyName: string;
    requirements: string[];
    painPoints: string[];
    budget?: string;
    timeline?: string;
  }): Promise<string> {
    const prompt = `${AI_EMPLOYEE_PROMPTS.closer.proposal}

Client: ${params.contactName} at ${params.companyName}
Requirements: ${params.requirements.join(', ')}
Pain Points: ${params.painPoints.join(', ')}
${params.budget ? `Budget: ${params.budget}` : ''}
${params.timeline ? `Timeline: ${params.timeline}` : ''}

Draft the proposal email now.`;

    const apiResponse = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: AI_EMPLOYEE_PROMPTS.closer.system },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 600
    });

    return apiResponse.choices[0]?.message?.content || '';
  }

  // Helper methods
  private getMediaRecommendation(platform: string, topic: string): string {
    const recommendations: Record<string, string> = {
      linkedin: 'Professional photo, infographic, or data visualization',
      twitter: 'Eye-catching graphic, GIF, or short video clip (< 30s)',
      facebook: 'Engaging photo, carousel, or short video (30-60s)',
      instagram: 'High-quality photo, carousel (up to 10 images), or Reel (15-60s)'
    };
    return recommendations[platform] || 'Relevant visual content';
  }

  private extractQualificationSignals(message: string): any {
    // Simple keyword extraction - can be enhanced with AI
    const signals: any = {};
    
    // Budget signals
    if (message.match(/budget|cost|price|afford/i)) {
      signals.budgetMentioned = true;
    }
    
    // Urgency signals
    if (message.match(/asap|urgent|soon|immediately|now/i)) {
      signals.urgency = 'high';
    }
    
    // Authority signals
    if (message.match(/decision|approve|team|manager|director|ceo|founder/i)) {
      signals.authorityMentioned = true;
    }
    
    return signals;
  }

  private checkIfQualified(existingData: any = {}, newSignals: any = {}): boolean {
    const combined = { ...existingData, ...newSignals };
    
    // Simple qualification logic - has pain, budget mention, and authority
    return !!(
      combined.pain &&
      combined.budgetMentioned &&
      (combined.authorityMentioned || combined.authority)
    );
  }
}
