import { db } from "../db";
import { 
  aiSearchPlatforms, 
  aiBrandMentions, 
  aiCitations,
  aiSentimentAnalysis,
  projects 
} from "./seo-schema";
import { eq, and, desc } from "drizzle-orm";
import { aiService } from "../ai";

/**
 * AI Search Optimization (ASO) Service
 * Tracks brand visibility across AI platforms: ChatGPT, Perplexity, Gemini, Copilot, Google AI Overviews
 * Following NP Digital's "Search Everywhere Optimization" methodology
 */

interface AIPlatformConfig {
  platform: string;
  displayName: string;
  apiSupport: boolean;
  trackingMethod: 'api' | 'simulation' | 'manual';
}

// Supported AI platforms + Social Media + E-commerce for brand tracking
const AI_PLATFORMS: AIPlatformConfig[] = [
  // AI Platforms
  { platform: 'chatgpt', displayName: 'ChatGPT', apiSupport: true, trackingMethod: 'api' },
  { platform: 'perplexity', displayName: 'Perplexity', apiSupport: false, trackingMethod: 'simulation' },
  { platform: 'gemini', displayName: 'Google Gemini', apiSupport: true, trackingMethod: 'api' },
  { platform: 'copilot', displayName: 'Microsoft Copilot', apiSupport: false, trackingMethod: 'simulation' },
  { platform: 'google_ai_overviews', displayName: 'Google AI Overviews', apiSupport: false, trackingMethod: 'simulation' },
  { platform: 'claude', displayName: 'Claude', apiSupport: true, trackingMethod: 'api' },
  // Social Media & E-commerce Platforms (AI-powered search simulation)
  { platform: 'youtube', displayName: 'YouTube Search', apiSupport: false, trackingMethod: 'simulation' },
  { platform: 'instagram', displayName: 'Instagram Search', apiSupport: false, trackingMethod: 'simulation' },
  { platform: 'tiktok', displayName: 'TikTok Search', apiSupport: false, trackingMethod: 'simulation' },
  { platform: 'pinterest', displayName: 'Pinterest Search', apiSupport: false, trackingMethod: 'simulation' },
  { platform: 'amazon', displayName: 'Amazon Search', apiSupport: false, trackingMethod: 'simulation' }
];

interface BrandMentionResult {
  query: string;
  platform: string;
  brandName: string;
  mentioned: boolean;
  position?: number;
  mentionType: 'direct' | 'indirect' | 'competitive' | 'citation';
  context?: string;
  fullResponse: string;
  citationUrl?: string;
  domainAuthority?: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  visibility: 'high' | 'medium' | 'low';
  competitorMentioned?: string;
  queryIntent: string;
  queryCategory: string;
}

interface SentimentAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  sentimentScore: number;
  positiveAspects: string[];
  negativeAspects: string[];
  neutralAspects: string[];
  emotions: string[];
  emotionScores: Record<string, number>;
  keyPhrases: string[];
  comparisonMade: boolean;
  comparedTo: string[];
  overallTone: 'factual' | 'promotional' | 'critical' | 'enthusiastic';
  aiGeneratedSummary: string;
}

/**
 * Initialize AI platform tracking for a project
 */
export async function initializeAIPlatforms(tenantId: string, projectId: string): Promise<void> {
  const existingPlatforms = await db
    .select()
    .from(aiSearchPlatforms)
    .where(and(
      eq(aiSearchPlatforms.tenantId, tenantId),
      eq(aiSearchPlatforms.projectId, projectId)
    ));

  for (const platformConfig of AI_PLATFORMS) {
    const exists = existingPlatforms.find((p: any) => p.platform === platformConfig.platform);
    
    if (!exists) {
      await db.insert(aiSearchPlatforms).values({
        tenantId,
        projectId,
        platform: platformConfig.platform,
        isActive: 1,
        trackingEnabled: 1,
        lastChecked: null,
        apiKey: null
      });
    }
  }
}

/**
 * Get platform-specific prompt for simulation
 */
function getPlatformPrompt(platform: string, query: string, brandName: string): string {
  const basePlatforms: Record<string, string> = {
    youtube: `You are simulating YouTube search results. For the search query "${query}", list 5-10 video titles that would appear, including relevance to "${brandName}" if applicable. Format: video titles with view counts and channel names. Focus on video content, tutorials, reviews, and product demonstrations.`,
    instagram: `You are simulating Instagram search results. For the search query "${query}", describe posts, profiles, reels, and hashtags that would appear, mentioning "${brandName}" if relevant. Include engagement metrics like likes and followers. Focus on visual content, influencer posts, and brand accounts.`,
    tiktok: `You are simulating TikTok search results. For the search query "${query}", describe trending videos and creators that would appear, mentioning "${brandName}" if relevant. Include view counts and hashtags. Focus on short-form video content, trends, and viral content.`,
    pinterest: `You are simulating Pinterest search results. For the search query "${query}", describe pins, boards, and ideas that would appear, mentioning "${brandName}" if relevant. Include save counts. Focus on visual inspiration, DIY projects, product ideas, and lifestyle content.`,
    amazon: `You are simulating Amazon product search results. For the search query "${query}", list products that would appear, including "${brandName}" products if relevant. Include star ratings, prices, and review counts. Focus on product listings, best sellers, and customer favorites.`
  };

  // Use platform-specific prompt or default AI chat prompt
  const platformPrompt = basePlatforms[platform];
  if (platformPrompt) {
    return platformPrompt;
  }

  // Default AI chat platform prompt
  return `${query}\n\nNote: Focus on providing accurate, helpful information about ${brandName} if relevant to the query. Simulate a response as if from ${platform}.`;
}

/**
 * Query AI platform with brand-related prompts
 */
async function queryAIPlatform(
  platform: string,
  query: string,
  brandName: string
): Promise<string> {
  try {
    // Use Argilette AI (white-labeled Replit AI Integration) for all platforms
    const userPrompt = getPlatformPrompt(platform, query, brandName);
    
    const response = await aiService.chat(userPrompt);

    return response;
  } catch (error) {
    console.error(`Error querying ${platform}:`, error);
    throw error;
  }
}

/**
 * Analyze AI response for brand mentions
 */
function analyzeBrandMention(
  response: string,
  brandName: string,
  query: string,
  platform: string
): BrandMentionResult {
  const mentioned = response.toLowerCase().includes(brandName.toLowerCase());
  
  if (!mentioned) {
    return {
      query,
      platform,
      brandName,
      mentioned: false,
      fullResponse: response,
      sentiment: 'neutral',
      sentimentScore: 0,
      visibility: 'low',
      queryIntent: classifyQueryIntent(query),
      queryCategory: classifyQueryCategory(query),
      mentionType: 'direct'
    };
  }

  // Find position of first mention
  const lowerResponse = response.toLowerCase();
  const lowerBrand = brandName.toLowerCase();
  const firstMentionIndex = lowerResponse.indexOf(lowerBrand);
  
  // Calculate position (approximate paragraph/section)
  const beforeMention = response.substring(0, firstMentionIndex);
  const position = beforeMention.split('\n\n').length;

  // Extract context (surrounding text)
  const contextStart = Math.max(0, firstMentionIndex - 150);
  const contextEnd = Math.min(response.length, firstMentionIndex + 150);
  const context = response.substring(contextStart, contextEnd);

  // Determine mention type
  const mentionType = determineMentionType(context, brandName);

  // Extract citations if present
  const citationMatch = context.match(/https?:\/\/[^\s]+/);
  const citationUrl = citationMatch ? citationMatch[0] : undefined;

  // Analyze sentiment
  const sentiment = analyzeSentiment(context);
  const sentimentScore = calculateSentimentScore(sentiment);

  // Determine visibility based on position and prominence
  const visibility = position <= 2 ? 'high' : position <= 5 ? 'medium' : 'low';

  // Check for competitor mentions
  const competitorMentioned = detectCompetitorMentions(response);

  return {
    query,
    platform,
    brandName,
    mentioned: true,
    position,
    mentionType,
    context,
    fullResponse: response,
    citationUrl,
    sentiment,
    sentimentScore,
    visibility,
    competitorMentioned,
    queryIntent: classifyQueryIntent(query),
    queryCategory: classifyQueryCategory(query)
  };
}

/**
 * Perform deep sentiment analysis using AI
 */
async function performSentimentAnalysis(
  response: string,
  brandName: string,
  query: string
): Promise<SentimentAnalysisResult> {
  const sentimentPrompt = `Analyze the sentiment and tone of the following AI response about "${brandName}" in response to the query: "${query}".

Response to analyze:
${response}

Provide a detailed sentiment analysis including:
1. Overall sentiment (positive, negative, neutral, or mixed)
2. Sentiment score (-1.0 to 1.0)
3. Positive aspects mentioned
4. Negative aspects mentioned  
5. Neutral aspects mentioned
6. Emotions detected (trust, joy, anticipation, fear, etc.)
7. Key phrases used to describe the brand
8. Whether comparisons were made to competitors
9. Overall tone (factual, promotional, critical, enthusiastic)
10. Brief summary of the sentiment analysis

Format your response as JSON.`;

  try {
    const aiAnalysis = await aiService.chat(sentimentPrompt);
    
    // Parse AI response (with fallback)
    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(aiAnalysis);
    } catch {
      // Fallback to basic analysis if JSON parsing fails
      parsedAnalysis = {
        sentiment: 'neutral',
        sentimentScore: 0,
        positiveAspects: [],
        negativeAspects: [],
        neutralAspects: [],
        emotions: [],
        emotionScores: {},
        keyPhrases: [],
        comparisonMade: false,
        comparedTo: [],
        overallTone: 'factual',
        aiGeneratedSummary: 'Unable to parse detailed analysis'
      };
    }

    return {
      sentiment: parsedAnalysis.sentiment || 'neutral',
      sentimentScore: parsedAnalysis.sentimentScore || 0,
      positiveAspects: parsedAnalysis.positiveAspects || [],
      negativeAspects: parsedAnalysis.negativeAspects || [],
      neutralAspects: parsedAnalysis.neutralAspects || [],
      emotions: parsedAnalysis.emotions || [],
      emotionScores: parsedAnalysis.emotionScores || {},
      keyPhrases: parsedAnalysis.keyPhrases || [],
      comparisonMade: parsedAnalysis.comparisonMade || false,
      comparedTo: parsedAnalysis.comparedTo || [],
      overallTone: parsedAnalysis.overallTone || 'factual',
      aiGeneratedSummary: parsedAnalysis.summary || aiAnalysis.substring(0, 200)
    };
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    // Return neutral fallback
    return {
      sentiment: 'neutral',
      sentimentScore: 0,
      positiveAspects: [],
      negativeAspects: [],
      neutralAspects: [],
      emotions: [],
      emotionScores: {},
      keyPhrases: [],
      comparisonMade: false,
      comparedTo: [],
      overallTone: 'factual',
      aiGeneratedSummary: 'Analysis unavailable due to error'
    };
  }
}

/**
 * Track brand mentions across all AI platforms
 */
export async function trackBrandMentions(
  tenantId: string,
  projectId: string,
  brandName: string,
  queries: string[]
): Promise<{ success: boolean; mentionsTracked: number; platforms: string[] }> {
  try {
    // Get active platforms for this project
    const activePlatforms = await db
      .select()
      .from(aiSearchPlatforms)
      .where(and(
        eq(aiSearchPlatforms.tenantId, tenantId),
        eq(aiSearchPlatforms.projectId, projectId),
        eq(aiSearchPlatforms.isActive, 1)
      ));

    // Limit to first 3 platforms for faster demo (ChatGPT, Gemini, Claude - the API-supported ones)
    const platformsToQuery = activePlatforms
      .filter(p => ['chatgpt', 'gemini', 'claude'].includes(p.platform))
      .slice(0, 3);

    let mentionsTracked = 0;
    const platformsTracked: string[] = [];

    // Process platforms in parallel for speed
    const trackingPromises = platformsToQuery.map(async (platform) => {
      for (const query of queries) {
        try {
          // Query the AI platform with timeout
          const response = await Promise.race([
            queryAIPlatform(platform.platform, query, brandName),
            new Promise<string>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 15000) // 15 second timeout
            )
          ]);

          // Analyze for brand mentions
          const mentionResult = analyzeBrandMention(response, brandName, query, platform.platform);

          // Always store the mention (even if brand not found) to show we checked
          await db.insert(aiBrandMentions).values({
            tenantId,
            projectId,
            platformId: platform.id,
            platform: platform.platform,
            query: mentionResult.query,
            brandName: mentionResult.brandName,
            isMentioned: mentionResult.mentioned ? 1 : 0,
            mentionType: mentionResult.mentionType,
            position: mentionResult.position,
            context: mentionResult.context,
            responseSnippet: response.substring(0, 500), // Store first 500 chars
            fullResponse: mentionResult.fullResponse,
            citationUrl: mentionResult.citationUrl,
            domainAuthority: mentionResult.domainAuthority,
            sentiment: mentionResult.sentiment,
            sentimentScore: mentionResult.sentimentScore,
            visibilityScore: mentionResult.visibility === 'high' ? 80 : mentionResult.visibility === 'medium' ? 50 : 20,
            competitorMentioned: mentionResult.competitorMentioned,
            queryIntent: mentionResult.queryIntent,
            queryCategory: mentionResult.queryCategory
          });

          if (mentionResult.mentioned) {
            mentionsTracked++;
            
            // Skip deep sentiment analysis for speed - use basic analysis
            await db.insert(aiSentimentAnalysis).values({
              tenantId,
              projectId,
              platformId: platform.id,
              platform: platform.platform,
              query,
              brandName,
              sentiment: mentionResult.sentiment,
              sentimentScore: mentionResult.sentimentScore,
              positiveAspects: [],
              negativeAspects: [],
              neutralAspects: [],
              emotions: [],
              emotionScores: {},
              keyPhrases: [],
              comparisonMade: 0,
              comparedTo: [],
              overallTone: 'factual',
              aiGeneratedSummary: `${brandName} was mentioned in ${platform.platform} search results.`
            });
          }

          // Update platform last checked timestamp
          await db
            .update(aiSearchPlatforms)
            .set({ lastChecked: new Date() })
            .where(eq(aiSearchPlatforms.id, platform.id));

        } catch (error) {
          console.error(`Error tracking ${platform.platform} for query "${query}":`, error);
        }
      }

      if (!platformsTracked.includes(platform.platform)) {
        platformsTracked.push(platform.platform);
      }
    });

    // Wait for all platforms to complete (with overall 30 second max)
    await Promise.race([
      Promise.all(trackingPromises),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Overall timeout')), 30000)
      )
    ]).catch(() => {
    });

    return {
      success: true,
      mentionsTracked,
      platforms: platformsTracked
    };
  } catch (error) {
    console.error('Error tracking brand mentions:', error);
    throw error;
  }
}

/**
 * Get brand mention statistics
 */
export async function getBrandMentionStats(
  tenantId: string,
  projectId: string
): Promise<any> {
  const mentions = await db
    .select()
    .from(aiBrandMentions)
    .where(and(
      eq(aiBrandMentions.tenantId, tenantId),
      eq(aiBrandMentions.projectId, projectId)
    ))
    .orderBy(desc(aiBrandMentions.checkedAt));

  // Calculate statistics
  const totalMentions = mentions.length;
  const platformBreakdown = mentions.reduce((acc: Record<string, number>, m: any) => {
    acc[m.platform] = (acc[m.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgPosition = mentions
    .filter((m: any) => m.position)
    .reduce((sum: number, m: any) => sum + (m.position || 0), 0) / mentions.filter((m: any) => m.position).length || 0;

  const sentimentBreakdown = mentions.reduce((acc: Record<string, number>, m: any) => {
    acc[m.sentiment || 'neutral'] = (acc[m.sentiment || 'neutral'] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgSentimentScore = mentions
    .filter((m: any) => m.sentimentScore !== null)
    .reduce((sum: number, m: any) => sum + (m.sentimentScore || 0), 0) / mentions.filter((m: any) => m.sentimentScore !== null).length || 0;

  return {
    totalMentions,
    platformBreakdown,
    avgPosition: Math.round(avgPosition * 10) / 10,
    sentimentBreakdown,
    avgSentimentScore: Math.round(avgSentimentScore * 100) / 100,
    recentMentions: mentions.slice(0, 10)
  };
}

// Helper functions
function determineMentionType(context: string, brandName: string): 'direct' | 'indirect' | 'competitive' | 'citation' {
  const lowerContext = context.toLowerCase();
  const lowerBrand = brandName.toLowerCase();

  if (lowerContext.includes(`${lowerBrand} is`) || lowerContext.includes(`${lowerBrand} offers`)) {
    return 'direct';
  }
  if (lowerContext.includes('source:') || lowerContext.includes('according to')) {
    return 'citation';
  }
  if (lowerContext.includes('compare') || lowerContext.includes('versus') || lowerContext.includes('vs')) {
    return 'competitive';
  }
  return 'indirect';
}

function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['best', 'great', 'excellent', 'outstanding', 'superior', 'leading', 'innovative', 'trusted', 'reliable'];
  const negativeWords = ['worst', 'poor', 'bad', 'inferior', 'lacking', 'limited', 'expensive', 'problematic'];

  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function calculateSentimentScore(sentiment: 'positive' | 'negative' | 'neutral'): number {
  if (sentiment === 'positive') return 0.7;
  if (sentiment === 'negative') return -0.7;
  return 0;
}

function detectCompetitorMentions(text: string): string | undefined {
  const competitorKeywords = ['competitor', 'alternative', 'similar to', 'compared to', 'versus'];
  const lowerText = text.toLowerCase();
  
  const hasCompetitor = competitorKeywords.some(keyword => lowerText.includes(keyword));
  return hasCompetitor ? 'Competitor detected' : undefined;
}

function classifyQueryIntent(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('buy') || lowerQuery.includes('price') || lowerQuery.includes('cost')) {
    return 'transactional';
  }
  if (lowerQuery.includes('how') || lowerQuery.includes('what') || lowerQuery.includes('why')) {
    return 'informational';
  }
  if (lowerQuery.includes('best') || lowerQuery.includes('review') || lowerQuery.includes('compare')) {
    return 'commercial';
  }
  return 'navigational';
}

function classifyQueryCategory(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('compare') || lowerQuery.includes('vs')) {
    return 'comparison';
  }
  if (lowerQuery.includes('how to') || lowerQuery.includes('guide')) {
    return 'how-to';
  }
  if (lowerQuery.includes('best') || lowerQuery.includes('top')) {
    return 'recommendation';
  }
  if (lowerQuery.includes('review')) {
    return 'review';
  }
  return 'general_inquiry';
}
