import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google AI with the API key from environment variables
const getApiKey = () => {
  if (typeof window !== 'undefined') {
    return import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBDbO931nTw9t5PueEt9l0YlO47QQiyDQ0';
  }
  return process.env.GEMINI_API_KEY || 'AIzaSyBDbO931nTw9t5PueEt9l0YlO47QQiyDQ0';
};

const genAI = new GoogleGenerativeAI(getApiKey());

export class GoogleAIService {
  private model: any;

  constructor() {
    // Use Gemini 1.5 Flash for fast responses
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  // Sentiment Analysis
  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    score: number;
  }> {
    try {
      const prompt = `Analyze the sentiment of the following text and respond in JSON format:
{
  "sentiment": "positive|negative|neutral",
  "confidence": 0.95,
  "score": 0.8
}

Text to analyze: "${text}"

Rules:
- sentiment: positive, negative, or neutral
- confidence: how confident you are (0-1)
- score: sentiment intensity (-1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive)`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const jsonResponse = JSON.parse(response.text());
      
      return {
        sentiment: jsonResponse.sentiment,
        confidence: Math.max(0, Math.min(1, jsonResponse.confidence)),
        score: Math.max(-1, Math.min(1, jsonResponse.score))
      };
    } catch (error) {
      console.error('Google AI sentiment analysis error:', error);
      // Fallback to simple keyword-based analysis
      return this.fallbackSentimentAnalysis(text);
    }
  }

  // Customer Behavior Prediction
  async predictCustomerBehavior(customerData: {
    interactions: number;
    lastContactDays: number;
    responseRate: number;
    purchaseHistory: number;
    supportTickets: number;
  }): Promise<{
    churnRisk: number;
    engagementScore: number;
    nextBestAction: string;
    confidence: number;
  }> {
    try {
      const prompt = `Analyze customer behavior and predict outcomes based on this data:
${JSON.stringify(customerData, null, 2)}

Respond in JSON format:
{
  "churnRisk": 0.25,
  "engagementScore": 0.75,
  "nextBestAction": "Schedule follow-up call",
  "confidence": 0.85
}

Consider:
- churnRisk: probability of customer leaving (0-1)
- engagementScore: how engaged the customer is (0-1)
- nextBestAction: recommended next step
- confidence: prediction confidence (0-1)`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const jsonResponse = JSON.parse(response.text());
      
      return jsonResponse;
    } catch (error) {
      console.error('Google AI behavior prediction error:', error);
      return {
        churnRisk: 0.3,
        engagementScore: 0.6,
        nextBestAction: "Review customer engagement",
        confidence: 0.5
      };
    }
  }

  // Deal Closure Prediction
  async predictDealClosure(dealData: {
    stage: string;
    value: number;
    daysInStage: number;
    contactFrequency: number;
    competitorPresent: boolean;
    decisionMaker: boolean;
  }): Promise<{
    closureProbability: number;
    timeToClose: number;
    recommendations: string[];
    confidence: number;
  }> {
    try {
      const prompt = `Predict deal closure based on this sales data:
${JSON.stringify(dealData, null, 2)}

Respond in JSON format:
{
  "closureProbability": 0.75,
  "timeToClose": 14,
  "recommendations": ["Engage decision maker", "Address competitor concerns"],
  "confidence": 0.80
}

Consider:
- closureProbability: chance of winning the deal (0-1)
- timeToClose: estimated days to close
- recommendations: actionable next steps
- confidence: prediction confidence (0-1)`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const jsonResponse = JSON.parse(response.text());
      
      return jsonResponse;
    } catch (error) {
      console.error('Google AI deal prediction error:', error);
      return {
        closureProbability: 0.5,
        timeToClose: 30,
        recommendations: ["Follow up with prospect", "Gather more information"],
        confidence: 0.5
      };
    }
  }

  // Content Generation for Marketing
  async generateMarketingContent(params: {
    type: 'email' | 'social' | 'ad' | 'blog';
    audience: string;
    tone: string;
    keywords: string[];
    length: 'short' | 'medium' | 'long';
  }): Promise<{
    content: string;
    suggestions: string[];
    seoScore: number;
  }> {
    try {
      const prompt = `Generate ${params.type} content with these parameters:
- Audience: ${params.audience}
- Tone: ${params.tone}
- Keywords: ${params.keywords.join(', ')}
- Length: ${params.length}

Respond in JSON format:
{
  "content": "Generated content here...",
  "suggestions": ["Improvement suggestion 1", "Improvement suggestion 2"],
  "seoScore": 0.85
}

Make the content engaging, relevant, and optimized for the target audience.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const jsonResponse = JSON.parse(response.text());
      
      return jsonResponse;
    } catch (error) {
      console.error('Google AI content generation error:', error);
      return {
        content: `Sample ${params.type} content for ${params.audience}`,
        suggestions: ["Add more personalization", "Include clear call-to-action"],
        seoScore: 0.6
      };
    }
  }

  // Voice Emotion Analysis (placeholder for future voice integration)
  async analyzeVoiceEmotion(audioData: string): Promise<{
    emotion: string;
    intensity: number;
    confidence: number;
    transcript?: string;
  }> {
    // This would require Google Speech-to-Text and additional processing
    // For now, return mock data based on transcript analysis
    try {
      const prompt = `Analyze the emotional content of this voice transcript:
"${audioData}"

Respond in JSON format:
{
  "emotion": "happy|sad|angry|frustrated|excited|calm|neutral",
  "intensity": 0.75,
  "confidence": 0.85,
  "transcript": "transcribed text"
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const jsonResponse = JSON.parse(response.text());
      
      return jsonResponse;
    } catch (error) {
      console.error('Google AI voice emotion analysis error:', error);
      return {
        emotion: 'neutral',
        intensity: 0.5,
        confidence: 0.5,
        transcript: audioData
      };
    }
  }

  // Reputation Management Analysis
  async analyzeReviewSentiment(reviews: string[]): Promise<{
    overallSentiment: number;
    keyThemes: string[];
    urgentIssues: string[];
    responseRecommendations: string[];
  }> {
    try {
      const prompt = `Analyze these customer reviews and provide insights:
${reviews.map((review, index) => `Review ${index + 1}: "${review}"`).join('\n')}

Respond in JSON format:
{
  "overallSentiment": 0.65,
  "keyThemes": ["service quality", "pricing", "user experience"],
  "urgentIssues": ["slow response time mentioned in 3 reviews"],
  "responseRecommendations": ["Address service speed concerns", "Highlight recent improvements"]
}

Analyze for:
- overallSentiment: average sentiment score (-1 to 1)
- keyThemes: main topics mentioned
- urgentIssues: problems that need immediate attention
- responseRecommendations: suggested responses or actions`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const jsonResponse = JSON.parse(response.text());
      
      return jsonResponse;
    } catch (error) {
      console.error('Google AI review analysis error:', error);
      return {
        overallSentiment: 0,
        keyThemes: ['general feedback'],
        urgentIssues: [],
        responseRecommendations: ['Monitor for common patterns']
      };
    }
  }

  // Fallback sentiment analysis using keyword matching
  private fallbackSentimentAnalysis(text: string): {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    score: number;
  } {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'happy', 'satisfied'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'angry', 'frustrated', 'disappointed', 'upset'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
    
    const total = positiveCount + negativeCount;
    if (total === 0) {
      return { sentiment: 'neutral', confidence: 0.5, score: 0 };
    }
    
    const score = (positiveCount - negativeCount) / total;
    const sentiment = score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral';
    const confidence = Math.min(0.8, total / words.length * 2);
    
    return { sentiment, confidence, score };
  }
}

export const googleAI = new GoogleAIService();