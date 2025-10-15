interface UserAction {
  id: string;
  userId: string;
  action: string;
  timestamp: Date;
  context: Record<string, any>;
  sessionId: string;
}

interface BehaviorPattern {
  id: string;
  userId: string;
  pattern: string;
  frequency: number;
  confidence: number;
  lastOccurrence: Date;
  predictedNext: Date;
}

interface PredictiveInsight {
  id: string;
  type: 'conversion' | 'churn' | 'engagement' | 'performance';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  recommendations: string[];
  data: Record<string, any>;
}

class BehaviorAnalyticsService {
  private userActions: Map<string, UserAction[]> = new Map();
  private behaviorPatterns: Map<string, BehaviorPattern[]> = new Map();
  private insights: Map<string, PredictiveInsight[]> = new Map();

  // Track user actions
  trackAction(userId: string, action: string, context: Record<string, any> = {}) {
    const userAction: UserAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      timestamp: new Date(),
      context,
      sessionId: this.getCurrentSessionId(userId)
    };

    if (!this.userActions.has(userId)) {
      this.userActions.set(userId, []);
    }
    
    this.userActions.get(userId)!.push(userAction);
    
    // Trigger pattern analysis
    this.analyzePatterns(userId);
  }

  // Analyze user behavior patterns
  private analyzePatterns(userId: string) {
    const actions = this.userActions.get(userId) || [];
    if (actions.length < 5) return; // Need minimum actions for pattern analysis

    const patterns: BehaviorPattern[] = [];
    
    // Analyze time-based patterns
    const timePatterns = this.analyzeTimePatterns(actions);
    patterns.push(...timePatterns);
    
    // Analyze sequence patterns
    const sequencePatterns = this.analyzeSequencePatterns(actions);
    patterns.push(...sequencePatterns);
    
    // Analyze feature usage patterns
    const usagePatterns = this.analyzeUsagePatterns(actions);
    patterns.push(...usagePatterns);
    
    this.behaviorPatterns.set(userId, patterns);
    
    // Generate predictive insights
    this.generateInsights(userId);
  }

  private analyzeTimePatterns(actions: UserAction[]): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];
    
    // Group actions by hour of day
    const hourlyActivity = new Map<number, number>();
    actions.forEach(action => {
      const hour = action.timestamp.getHours();
      hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);
    });
    
    // Find peak activity hours
    const peakHour = [...hourlyActivity.entries()]
      .sort((a, b) => b[1] - a[1])[0];
    
    if (peakHour && peakHour[1] > 3) {
      patterns.push({
        id: `time_pattern_${Date.now()}`,
        userId: actions[0].userId,
        pattern: `peak_activity_hour_${peakHour[0]}`,
        frequency: peakHour[1],
        confidence: Math.min(95, (peakHour[1] / actions.length) * 100),
        lastOccurrence: new Date(),
        predictedNext: this.predictNextOccurrence(peakHour[0])
      });
    }
    
    return patterns;
  }

  private analyzeSequencePatterns(actions: UserAction[]): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];
    const sequences = new Map<string, number>();
    
    // Analyze action sequences (2-action sequences)
    for (let i = 0; i < actions.length - 1; i++) {
      const sequence = `${actions[i].action}->${actions[i + 1].action}`;
      sequences.set(sequence, (sequences.get(sequence) || 0) + 1);
    }
    
    // Find common sequences
    sequences.forEach((count, sequence) => {
      if (count >= 3) {
        patterns.push({
          id: `sequence_pattern_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          userId: actions[0].userId,
          pattern: `sequence_${sequence}`,
          frequency: count,
          confidence: Math.min(90, (count / (actions.length - 1)) * 100),
          lastOccurrence: new Date(),
          predictedNext: new Date(Date.now() + 24 * 60 * 60 * 1000) // Predict next day
        });
      }
    });
    
    return patterns;
  }

  private analyzeUsagePatterns(actions: UserAction[]): BehaviorPattern[] {
    const patterns: BehaviorPattern[] = [];
    const featureUsage = new Map<string, number>();
    
    // Count feature usage
    actions.forEach(action => {
      const feature = this.extractFeature(action.action);
      if (feature) {
        featureUsage.set(feature, (featureUsage.get(feature) || 0) + 1);
      }
    });
    
    // Identify heavy feature usage
    featureUsage.forEach((count, feature) => {
      if (count >= 5) {
        patterns.push({
          id: `usage_pattern_${Date.now()}_${feature}`,
          userId: actions[0].userId,
          pattern: `heavy_usage_${feature}`,
          frequency: count,
          confidence: Math.min(95, (count / actions.length) * 100),
          lastOccurrence: new Date(),
          predictedNext: new Date(Date.now() + 12 * 60 * 60 * 1000) // Predict next 12 hours
        });
      }
    });
    
    return patterns;
  }

  private generateInsights(userId: string) {
    const patterns = this.behaviorPatterns.get(userId) || [];
    const actions = this.userActions.get(userId) || [];
    const insights: PredictiveInsight[] = [];
    
    // Generate conversion insights
    const conversionInsight = this.generateConversionInsight(userId, patterns, actions);
    if (conversionInsight) insights.push(conversionInsight);
    
    // Generate engagement insights
    const engagementInsight = this.generateEngagementInsight(userId, patterns, actions);
    if (engagementInsight) insights.push(engagementInsight);
    
    // Generate performance insights
    const performanceInsight = this.generatePerformanceInsight(userId, patterns, actions);
    if (performanceInsight) insights.push(performanceInsight);
    
    this.insights.set(userId, insights);
  }

  private generateConversionInsight(userId: string, patterns: BehaviorPattern[], actions: UserAction[]): PredictiveInsight | null {
    // Analyze conversion probability based on behavior
    const dealActions = actions.filter(a => a.action.includes('deal') || a.action.includes('contact'));
    if (dealActions.length < 3) return null;
    
    const recentEngagement = actions.filter(a => 
      Date.now() - a.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
    ).length;
    
    const conversionScore = Math.min(95, (recentEngagement / 10) * 100);
    
    return {
      id: `conversion_insight_${userId}`,
      type: 'conversion',
      title: 'High Conversion Probability Detected',
      description: `Based on your recent activity patterns, you have a ${conversionScore.toFixed(0)}% likelihood of closing deals this week`,
      confidence: conversionScore,
      impact: conversionScore > 70 ? 'high' : conversionScore > 40 ? 'medium' : 'low',
      timeframe: '7 days',
      recommendations: [
        'Focus on warm leads with recent engagement',
        'Schedule follow-up calls for this week',
        'Prepare proposals for interested prospects'
      ],
      data: { recentEngagement, dealActions: dealActions.length }
    };
  }

  private generateEngagementInsight(userId: string, patterns: BehaviorPattern[], actions: UserAction[]): PredictiveInsight | null {
    const last7Days = actions.filter(a => 
      Date.now() - a.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
    );
    
    const previousWeek = actions.filter(a => {
      const daysDiff = (Date.now() - a.timestamp.getTime()) / (24 * 60 * 60 * 1000);
      return daysDiff >= 7 && daysDiff < 14;
    });
    
    if (previousWeek.length === 0) return null;
    
    const engagementChange = ((last7Days.length - previousWeek.length) / previousWeek.length) * 100;
    
    return {
      id: `engagement_insight_${userId}`,
      type: 'engagement',
      title: engagementChange > 0 ? 'Engagement Trending Up' : 'Engagement Decline Detected',
      description: `Your activity has ${engagementChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(engagementChange).toFixed(0)}% compared to last week`,
      confidence: 85,
      impact: Math.abs(engagementChange) > 30 ? 'high' : Math.abs(engagementChange) > 15 ? 'medium' : 'low',
      timeframe: 'ongoing',
      recommendations: engagementChange < 0 ? [
        'Review and adjust your daily routine',
        'Set specific activity goals',
        'Focus on high-impact activities'
      ] : [
        'Maintain current momentum',
        'Consider scaling successful activities',
        'Document what\'s working well'
      ],
      data: { currentWeek: last7Days.length, previousWeek: previousWeek.length, change: engagementChange }
    };
  }

  private generatePerformanceInsight(userId: string, patterns: BehaviorPattern[], actions: UserAction[]): PredictiveInsight | null {
    const peakPattern = patterns.find(p => p.pattern.includes('peak_activity'));
    if (!peakPattern) return null;
    
    const peakHour = parseInt(peakPattern.pattern.split('_').pop() || '9');
    const currentHour = new Date().getHours();
    
    return {
      id: `performance_insight_${userId}`,
      type: 'performance',
      title: 'Optimal Performance Window Identified',
      description: `You're most productive around ${peakHour}:00. Consider scheduling important tasks during this time.`,
      confidence: peakPattern.confidence,
      impact: 'medium',
      timeframe: 'daily',
      recommendations: [
        `Schedule important calls around ${peakHour}:00`,
        'Block calendar during peak hours for high-value activities',
        'Use off-peak hours for administrative tasks'
      ],
      data: { peakHour, currentHour, pattern: peakPattern }
    };
  }

  // Utility methods
  private getCurrentSessionId(userId: string): string {
    return `session_${userId}_${Date.now()}`;
  }

  private extractFeature(action: string): string | null {
    const features = ['contacts', 'deals', 'tasks', 'calendar', 'email', 'analytics', 'reports'];
    return features.find(feature => action.toLowerCase().includes(feature)) || null;
  }

  private predictNextOccurrence(hour: number): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hour, 0, 0, 0);
    return tomorrow;
  }

  // Public API methods
  getUserInsights(userId: string): PredictiveInsight[] {
    return this.insights.get(userId) || [];
  }

  getUserPatterns(userId: string): BehaviorPattern[] {
    return this.behaviorPatterns.get(userId) || [];
  }

  getUserActions(userId: string, limit = 50): UserAction[] {
    const actions = this.userActions.get(userId) || [];
    return actions.slice(-limit);
  }

  // Initialize with sample data for demo
  initializeSampleData(userId: string) {
    const sampleActions: UserAction[] = [
      { id: '1', userId, action: 'view_contacts', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), context: {}, sessionId: 'demo_session' },
      { id: '2', userId, action: 'create_deal', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), context: { value: 5000 }, sessionId: 'demo_session' },
      { id: '3', userId, action: 'send_email', timestamp: new Date(Date.now() - 30 * 60 * 1000), context: { recipient: 'prospect' }, sessionId: 'demo_session' },
      { id: '4', userId, action: 'view_analytics', timestamp: new Date(Date.now() - 15 * 60 * 1000), context: {}, sessionId: 'demo_session' },
      { id: '5', userId, action: 'update_contact', timestamp: new Date(Date.now() - 5 * 60 * 1000), context: { contactId: 'contact_123' }, sessionId: 'demo_session' }
    ];

    this.userActions.set(userId, sampleActions);
    this.analyzePatterns(userId);
  }
}

export const behaviorAnalytics = new BehaviorAnalyticsService();