export interface SentimentResult {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  score: number; // 0-100
  keywords: string;
  emotionalTone: string;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

const positiveWords = [
  'excellent', 'great', 'amazing', 'wonderful', 'fantastic', 'love', 'perfect',
  'outstanding', 'brilliant', 'superb', 'incredible', 'awesome', 'satisfied',
  'happy', 'pleased', 'delighted', 'thrilled', 'impressed', 'recommend',
  'thank', 'appreciate', 'grateful', 'helpful', 'good', 'nice', 'best'
];

const negativeWords = [
  'terrible', 'awful', 'horrible', 'worst', 'hate', 'disgusting', 'pathetic',
  'useless', 'disappointing', 'frustrated', 'angry', 'furious', 'upset',
  'dissatisfied', 'unhappy', 'complaint', 'problem', 'issue', 'broken',
  'failed', 'error', 'wrong', 'bad', 'poor', 'slow', 'delayed', 'cancel'
];

const urgentWords = [
  'urgent', 'emergency', 'asap', 'immediately', 'quickly', 'rush', 'critical',
  'deadline', 'time-sensitive', 'priority', 'escalate', 'now', 'today'
];

const emotionalTones = {
  POSITIVE: ['appreciative', 'enthusiastic', 'satisfied', 'grateful', 'excited'],
  NEGATIVE: ['frustrated', 'disappointed', 'angry', 'concerned', 'upset'],
  NEUTRAL: ['professional', 'informative', 'neutral', 'factual', 'standard']
};

export function analyzeSentiment(text: string): SentimentResult {
  const lowercaseText = text.toLowerCase();
  const words = lowercaseText.split(/\s+/);
  
  let positiveScore = 0;
  let negativeScore = 0;
  let urgencyScore = 0;
  
  const foundPositiveWords: string[] = [];
  const foundNegativeWords: string[] = [];
  const foundUrgentWords: string[] = [];
  
  words.forEach(word => {
    if (positiveWords.includes(word)) {
      positiveScore++;
      foundPositiveWords.push(word);
    }
    if (negativeWords.includes(word)) {
      negativeScore++;
      foundNegativeWords.push(word);
    }
    if (urgentWords.includes(word)) {
      urgencyScore++;
      foundUrgentWords.push(word);
    }
  });
  
  // Determine overall sentiment
  let sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  let score: number;
  
  if (positiveScore > negativeScore) {
    sentiment = 'POSITIVE';
    score = Math.min(60 + (positiveScore * 10), 100);
  } else if (negativeScore > positiveScore) {
    sentiment = 'NEGATIVE';
    score = Math.min(60 + (negativeScore * 10), 100);
  } else {
    sentiment = 'NEUTRAL';
    score = Math.min(50 + Math.random() * 30, 100);
  }
  
  // Determine keywords
  const keywords = sentiment === 'POSITIVE' 
    ? foundPositiveWords.slice(0, 3).join(', ')
    : foundNegativeWords.slice(0, 3).join(', ') || 'standard, professional';
  
  // Determine emotional tone
  const toneOptions = emotionalTones[sentiment];
  const emotionalTone = toneOptions[Math.floor(Math.random() * toneOptions.length)];
  
  // Determine urgency level
  let urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  if (urgencyScore >= 2 || foundUrgentWords.length > 0) {
    urgencyLevel = 'HIGH';
  } else if (negativeScore > 2) {
    urgencyLevel = 'MEDIUM';
  } else {
    urgencyLevel = 'LOW';
  }
  
  return {
    sentiment,
    score: Math.round(score),
    keywords,
    emotionalTone,
    urgencyLevel
  };
}
