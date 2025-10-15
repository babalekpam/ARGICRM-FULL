import axios from 'axios';

export interface UserBehaviorData {
  user_id: string;
  keystroke_speed: number;
  login_time: string;
  sentiment_score: number;
  mouse_patterns: Record<string, number>;
  session_duration?: number;
  page_navigation_pattern?: string[];
}

export interface SecurityAlert {
  user_id: string;
  alert_type: string;
  severity: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

export interface RiskAssessment {
  user_id: string;
  overall_risk_score: number;
  behavioral_risk: number;
  sentiment_risk: number;
  temporal_risk: number;
  recommendations: string[];
  last_updated: string;
}

export interface BehavioralAnalytics {
  user_id: string;
  total_sessions: number;
  average_risk_score: number;
  average_keystroke_speed: number;
  average_sentiment: number;
  behavioral_trends: {
    trend: string;
    risk_variance: number;
    average_session_gap: string;
  };
  risk_history: Array<{
    timestamp: string;
    risk_score: number;
  }>;
}

export class SecurityIntegrationService {
  private static instance: SecurityIntegrationService;
  private securityApiUrl: string;
  private isSecurityApiAvailable: boolean = true;

  constructor() {
    // In production, this would be configurable
    this.securityApiUrl = process.env.SECURITY_API_URL || 'http://localhost:8001';
    this.testConnection();
  }

  static getInstance(): SecurityIntegrationService {
    if (!SecurityIntegrationService.instance) {
      SecurityIntegrationService.instance = new SecurityIntegrationService();
    }
    return SecurityIntegrationService.instance;
  }

  private async testConnection(): Promise<void> {
    try {
      await axios.get(`${this.securityApiUrl}/`);
      this.isSecurityApiAvailable = true;
      // Silent connection - no logging needed
    } catch (error) {
      this.isSecurityApiAvailable = false;
      // Silent fallback - no logging needed
    }
  }

  async logUserBehavior(behaviorData: UserBehaviorData): Promise<{ risk_score: number; message: string }> {
    if (!this.isSecurityApiAvailable) {
      // Fallback risk calculation
      const fallbackRisk = this.calculateFallbackRiskScore(behaviorData);
      return {
        risk_score: fallbackRisk,
        message: 'Behavior logged (fallback mode)'
      };
    }

    try {
      const response = await axios.post(`${this.securityApiUrl}/behavior`, behaviorData, {
        timeout: 5000
      });
      
      return {
        risk_score: response.data.risk_score,
        message: response.data.message
      };
    } catch (error) {
      console.error('Security API error:', error);
      this.isSecurityApiAvailable = false;
      
      // Fallback to local calculation
      const fallbackRisk = this.calculateFallbackRiskScore(behaviorData);
      return {
        risk_score: fallbackRisk,
        message: 'Behavior logged (fallback mode)'
      };
    }
  }

  async getUserRiskScore(userId: string): Promise<{ user_id: string; risk_score: number; last_updated: string } | null> {
    if (!this.isSecurityApiAvailable) {
      return null;
    }

    try {
      const response = await axios.get(`${this.securityApiUrl}/risk-score/${userId}`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user risk score:', error);
      return null;
    }
  }

  async getSecurityAlerts(userId?: string, resolved?: boolean): Promise<{
    alerts: SecurityAlert[];
    total_count: number;
    unresolved_count: number;
  } | null> {
    if (!this.isSecurityApiAvailable) {
      return null;
    }

    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (resolved !== undefined) params.append('resolved', resolved.toString());

      const response = await axios.get(`${this.securityApiUrl}/security-alerts?${params.toString()}`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching security alerts:', error);
      return null;
    }
  }

  async getRiskAssessment(userId: string): Promise<RiskAssessment | null> {
    if (!this.isSecurityApiAvailable) {
      return null;
    }

    try {
      const response = await axios.get(`${this.securityApiUrl}/risk-assessment/${userId}`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching risk assessment:', error);
      return null;
    }
  }

  async getBehavioralAnalytics(userId: string): Promise<BehavioralAnalytics | null> {
    if (!this.isSecurityApiAvailable) {
      return null;
    }

    try {
      const response = await axios.get(`${this.securityApiUrl}/behavioral-analytics/${userId}`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching behavioral analytics:', error);
      return null;
    }
  }

  async resolveSecurityAlert(alertId: number): Promise<boolean> {
    if (!this.isSecurityApiAvailable) {
      return false;
    }

    try {
      await axios.post(`${this.securityApiUrl}/security-alerts/${alertId}/resolve`, {}, {
        timeout: 5000
      });
      return true;
    } catch (error) {
      console.error('Error resolving security alert:', error);
      return false;
    }
  }

  // Generate user behavior data from CRM interactions
  async trackCRMInteraction(
    userId: string, 
    interactionType: string, 
    sentimentScore: number,
    sessionDuration?: number
  ): Promise<void> {
    const behaviorData: UserBehaviorData = {
      user_id: userId,
      keystroke_speed: this.generateKeystrokeSpeed(),
      login_time: new Date().toLocaleTimeString(),
      sentiment_score: sentimentScore,
      mouse_patterns: this.generateMousePatterns(),
      session_duration: sessionDuration,
      page_navigation_pattern: [interactionType]
    };

    await this.logUserBehavior(behaviorData);
  }

  private calculateFallbackRiskScore(behaviorData: UserBehaviorData): number {
    let risk = 0;
    
    // Basic risk factors
    if (behaviorData.sentiment_score < -0.5) risk += 0.3;
    if (behaviorData.keystroke_speed < 20 || behaviorData.keystroke_speed > 100) risk += 0.2;
    
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) risk += 0.1;
    
    return Math.min(risk, 1.0);
  }

  private generateKeystrokeSpeed(): number {
    // Simulate realistic keystroke speed (30-80 CPM)
    return Math.floor(Math.random() * 50) + 30;
  }

  private generateMousePatterns(): Record<string, number> {
    return {
      velocity: Math.random() * 0.8 + 0.2,
      acceleration: Math.random() * 0.6 + 0.1,
      click_frequency: Math.random() * 0.5 + 0.1,
      movement_smoothness: Math.random() * 0.7 + 0.3
    };
  }

  // Utility method to check if security API is available
  isApiAvailable(): boolean {
    return this.isSecurityApiAvailable;
  }

  // Reconnect to security API
  async reconnect(): Promise<boolean> {
    await this.testConnection();
    return this.isSecurityApiAvailable;
  }
}

export const securityIntegration = SecurityIntegrationService.getInstance();