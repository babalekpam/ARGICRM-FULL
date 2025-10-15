/**
 * Email Engagement Scoring Service
 * Tracks and scores recipient engagement for better deliverability
 */

interface EngagementData {
  email: string;
  opens: number;
  clicks: number;
  lastOpened?: Date;
  lastClicked?: Date;
  lastSent?: Date;
  bounces: number;
  spamComplaints: number;
  unsubscribed: boolean;
}

interface EngagementScore {
  email: string;
  score: number; // 0-100
  level: 'cold' | 'warm' | 'engaged' | 'highly_engaged';
  shouldSend: boolean;
  reason?: string;
  recommendations: string[];
}

export class EngagementScorer {
  /**
   * Calculate engagement score for a recipient
   */
  calculateScore(data: EngagementData): EngagementScore {
    let score = 50; // Start at neutral

    const result: EngagementScore = {
      email: data.email,
      score: 0,
      level: 'cold',
      shouldSend: true,
      recommendations: []
    };

    // Immediate disqualifiers
    if (data.unsubscribed) {
      result.score = 0;
      result.level = 'cold';
      result.shouldSend = false;
      result.reason = 'User has unsubscribed';
      return result;
    }

    if (data.spamComplaints > 0) {
      result.score = 0;
      result.level = 'cold';
      result.shouldSend = false;
      result.reason = 'User marked emails as spam';
      return result;
    }

    if (data.bounces >= 3) {
      result.score = 0;
      result.level = 'cold';
      result.shouldSend = false;
      result.reason = 'Too many bounces (invalid email)';
      return result;
    }

    // 1. Open rate impact (+/- 30 points)
    if (data.opens > 10) {
      score += 30;
    } else if (data.opens > 5) {
      score += 20;
    } else if (data.opens > 0) {
      score += 10;
    } else {
      score -= 20; // Never opened
    }

    // 2. Click rate impact (+/- 25 points)
    if (data.clicks > 5) {
      score += 25;
    } else if (data.clicks > 2) {
      score += 15;
    } else if (data.clicks > 0) {
      score += 10;
    } else if (data.opens > 0) {
      score -= 5; // Opens but no clicks
    }

    // 3. Recency impact (+/- 25 points)
    const now = new Date();
    if (data.lastOpened) {
      const daysSinceOpen = Math.floor((now.getTime() - new Date(data.lastOpened).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceOpen < 7) {
        score += 25; // Opened within last week
      } else if (daysSinceOpen < 30) {
        score += 15; // Opened within last month
      } else if (daysSinceOpen < 90) {
        score += 5; // Opened within last 3 months
      } else if (daysSinceOpen < 180) {
        score -= 10; // Opened within last 6 months
      } else {
        score -= 25; // No opens in 6+ months
        result.recommendations.push('Send re-engagement campaign before regular emails');
      }
    } else if (data.lastSent) {
      const daysSinceSent = Math.floor((now.getTime() - new Date(data.lastSent).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceSent > 180) {
        score -= 30;
        result.recommendations.push('Very old contact - verify email before sending');
      }
    }

    // 4. Bounce penalty (-20 points per bounce)
    score -= data.bounces * 20;

    // 5. Click-through rate bonus
    if (data.opens > 0 && data.clicks > 0) {
      const ctr = data.clicks / data.opens;
      if (ctr > 0.3) { // >30% CTR
        score += 15;
      } else if (ctr > 0.1) { // >10% CTR
        score += 10;
      }
    }

    // Normalize score (0-100)
    result.score = Math.max(0, Math.min(100, score));

    // Determine engagement level
    if (result.score >= 75) {
      result.level = 'highly_engaged';
      result.recommendations.push('Priority sending - highest engagement');
    } else if (result.score >= 50) {
      result.level = 'engaged';
      result.recommendations.push('Regular sending schedule');
    } else if (result.score >= 25) {
      result.level = 'warm';
      result.recommendations.push('Send less frequently, focus on quality content');
    } else {
      result.level = 'cold';
      result.recommendations.push('Re-engagement campaign or remove from list');
    }

    // Determine if should send
    if (result.score < 10) {
      result.shouldSend = false;
      result.reason = 'Very low engagement (likely inactive)';
    }

    return result;
  }

  /**
   * Segment contacts by engagement level
   */
  segmentByEngagement(contacts: EngagementData[]): {
    highlyEngaged: string[];
    engaged: string[];
    warm: string[];
    cold: string[];
    doNotSend: string[];
  } {
    const segments = {
      highlyEngaged: [] as string[],
      engaged: [] as string[],
      warm: [] as string[],
      cold: [] as string[],
      doNotSend: [] as string[]
    };

    contacts.forEach(contact => {
      const score = this.calculateScore(contact);
      
      if (!score.shouldSend) {
        segments.doNotSend.push(contact.email);
      } else {
        switch (score.level) {
          case 'highly_engaged':
            segments.highlyEngaged.push(contact.email);
            break;
          case 'engaged':
            segments.engaged.push(contact.email);
            break;
          case 'warm':
            segments.warm.push(contact.email);
            break;
          case 'cold':
            segments.cold.push(contact.email);
            break;
        }
      }
    });

    return segments;
  }

  /**
   * Get sending priority order (most engaged first)
   */
  getSendingOrder(contacts: EngagementData[]): string[] {
    const scored = contacts
      .map(contact => ({
        email: contact.email,
        score: this.calculateScore(contact).score,
        shouldSend: this.calculateScore(contact).shouldSend
      }))
      .filter(item => item.shouldSend)
      .sort((a, b) => b.score - a.score); // Highest score first

    return scored.map(item => item.email);
  }

  /**
   * Recommend re-engagement for cold contacts
   */
  getReengagementCandidates(contacts: EngagementData[]): string[] {
    return contacts
      .filter(contact => {
        const score = this.calculateScore(contact);
        return score.level === 'cold' && score.shouldSend;
      })
      .map(contact => contact.email);
  }
}

export const engagementScorer = new EngagementScorer();
