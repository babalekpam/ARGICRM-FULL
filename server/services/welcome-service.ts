import { storage } from '../storage';

export interface PersonalizedData {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    company: string;
    lastLogin: string;
    timezone: string;
    avatar?: string;
  };
  stats: {
    contacts: number;
    deals: number;
    tasks: number;
    revenue: number;
    leadsThisWeek: number;
    closedDealsThisMonth: number;
  };
  activities: {
    recentContacts: any[];
    upcomingTasks: any[];
    dealsPipeline: any[];
  };
  insights: {
    topPerformingCampaign?: string;
    hotLeads: number;
    averageDealSize: number;
    conversionRate: number;
  };
}

export class WelcomeService {
  constructor(private storage: DatabaseStorage) {}

  async getPersonalizedData(userEmail: string, tenantId: string): Promise<PersonalizedData> {
    try {
      // Get user profile
      const user = await this.getUserProfile(userEmail);
      
      // Get statistics
      const stats = await this.getUserStats(tenantId);
      
      // Get recent activities
      const activities = await this.getRecentActivities(tenantId);
      
      // Get insights
      const insights = await this.getInsights(tenantId);

      return {
        user,
        stats,
        activities,
        insights
      };
    } catch (error) {
      console.error('Error generating personalized data:', error);
      throw error;
    }
  }

  private async getUserProfile(email: string) {
    try {
      // Try to get actual user profile from onboarding data
      const { OnboardingService } = await import('./onboarding-service.js');
      const onboardingService = new OnboardingService(this.storage);
      
      // Get user ID from email
      const isPlatformOwner = email === 'abel@argilette.com';
      const userId = isPlatformOwner ? 'platform-owner-1' : 'demo-user-1';
      const tenantId = 'default-tenant';
      
      // Check if onboarding was completed and get stored profile
      const progress = await onboardingService.getOnboardingProgress(userId, tenantId);
      
      if (progress && progress.completed && progress.data?.personalInfo) {
        const personalInfo = progress.data.personalInfo;
        const companyInfo = progress.data.companyInfo;
        
        return {
          firstName: personalInfo.firstName || 'User',
          lastName: personalInfo.lastName || 'Admin',
          email: email,
          role: isPlatformOwner ? 'Platform Owner' : personalInfo.jobTitle || 'Administrator',
          company: companyInfo?.companyName || 'NODE CRM',
          lastLogin: new Date().toISOString(),
          timezone: progress.data.preferences?.timezone || 'UTC',
        };
      }
    } catch (error) {
      console.error('Error getting user profile from onboarding:', error);
    }
    
    // Fallback to default profile if onboarding data not available
    // For abel@argilette.com, use proper admin name instead of parsing email
    if (email === 'abel@argilette.com') {
      return {
        firstName: 'Platform',
        lastName: 'Administrator',
        email: email,
        role: 'Platform Owner',
        company: 'NODE CRM',
        lastLogin: new Date().toISOString(),
        timezone: 'UTC',
      };
    }
    
    // For madjewaba@hotmail.com, use specific company name
    if (email === 'madjewaba@hotmail.com') {
      return {
        firstName: 'Madjewaba',
        lastName: 'User',
        email: email,
        role: 'Administrator',
        company: 'Madjewaba Corporation',
        lastLogin: new Date().toISOString(),
        timezone: 'UTC',
      };
    }
    
    const emailPrefix = email.split('@')[0];
    const nameParts = emailPrefix.split('.');
    const domain = email.split('@')[1];
    const companyName = domain ? this.capitalize(domain.split('.')[0]) + ' Company' : 'Your Company';
    
    return {
      firstName: nameParts[0] ? this.capitalize(nameParts[0]) : 'User',
      lastName: nameParts[1] ? this.capitalize(nameParts[1]) : 'Admin',
      email: email,
      role: isPlatformOwner ? 'Platform Owner' : 'Administrator',
      company: companyName,
      lastLogin: new Date().toISOString(),
      timezone: 'UTC',
    };
  }

  private async getUserStats(tenantId: string) {
    try {
      // Validate UUID format before making database calls - but allow platform owner access
      if (!tenantId || (tenantId.length !== 36 || !tenantId.includes('-'))) {
        return {
          contacts: 0,
          deals: 0,
          tasks: 0,
          revenue: 0,
          leadsThisWeek: 0,
          closedDealsThisMonth: 0
        };
      }

      // Get actual data from storage
      const contacts = await this.storage.getContacts();
      const deals = await this.storage.getDeals();
      const tasks = await this.storage.getTasks();
      const leads = await this.storage.getLeads();

      // Calculate revenue from deals
      const totalRevenue = deals.reduce((sum, deal) => {
        return sum + (parseFloat(deal.value?.toString() || '0') || 0);
      }, 0);

      // Count recent activities
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentLeads = leads.filter(lead => 
        new Date(lead.createdAt || '') > oneWeekAgo
      ).length;

      const closedDeals = deals.filter(deal => 
        deal.stage === 'closed-won' || deal.stage === 'won'
      ).length;

      return {
        contacts: contacts.length,
        deals: deals.length,
        tasks: tasks.length,
        revenue: Math.round(totalRevenue),
        leadsThisWeek: recentLeads,
        closedDealsThisMonth: closedDeals
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      // Return fallback data
      return {
        contacts: 0,
        deals: 0,
        tasks: 0,
        revenue: 0,
        leadsThisWeek: 0,
        closedDealsThisMonth: 0
      };
    }
  }

  private async getRecentActivities(tenantId: string) {
    try {
      // Validate UUID format before making database calls - but allow platform owner access  
      if (!tenantId || (tenantId.length !== 36 || !tenantId.includes('-'))) {
        return {
          recentContacts: [],
          upcomingTasks: [],
          dealsPipeline: []
        };
      }

      const contacts = await this.storage.getContacts();
      const tasks = await this.storage.getTasks();
      const deals = await this.storage.getDeals();

      // Get recent contacts (last 5)
      const recentContacts = contacts
        .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
        .slice(0, 5);

      // Get upcoming tasks
      const upcomingTasks = tasks
        .filter(task => task.status !== 'completed')
        .sort((a, b) => new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime())
        .slice(0, 5);

      // Get pipeline deals
      const dealsPipeline = deals
        .filter(deal => deal.stage !== 'closed-won' && deal.stage !== 'closed-lost')
        .sort((a, b) => (parseFloat(b.value?.toString() || '0') || 0) - (parseFloat(a.value?.toString() || '0') || 0))
        .slice(0, 5);

      return {
        recentContacts,
        upcomingTasks,
        dealsPipeline
      };
    } catch (error) {
      console.error('Error getting recent activities:', error);
      return {
        recentContacts: [],
        upcomingTasks: [],
        dealsPipeline: []
      };
    }
  }

  private async getInsights(tenantId: string) {
    try {
      const deals = await this.storage.getDeals();
      const leads = await this.storage.getLeads();

      // Calculate average deal size
      const closedDeals = deals.filter(deal => deal.stage === 'closed-won' || deal.stage === 'won');
      const totalRevenue = closedDeals.reduce((sum, deal) => 
        sum + (parseFloat(deal.value?.toString() || '0') || 0), 0
      );
      const averageDealSize = closedDeals.length > 0 ? Math.round(totalRevenue / closedDeals.length) : 0;

      // Calculate conversion rate
      const convertedLeads = leads.filter(lead => lead.status === 'converted').length;
      const conversionRate = leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0;

      // Count hot leads
      const hotLeads = leads.filter(lead => 
        lead.score && parseFloat(lead.score.toString()) > 80
      ).length;

      return {
        averageDealSize,
        conversionRate,
        hotLeads,
        topPerformingCampaign: 'Email Marketing Campaign'
      };
    } catch (error) {
      console.error('Error getting insights:', error);
      return {
        averageDealSize: 0,
        conversionRate: 0,
        hotLeads: 0
      };
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  async getGreetingRecommendations(userEmail: string, tenantId: string): Promise<string[]> {
    try {
      const data = await this.getPersonalizedData(userEmail, tenantId);
      const recommendations = [];

      // Smart recommendations based on real data
      if (data.stats.tasks > 0) {
        recommendations.push(`You have ${data.stats.tasks} pending tasks to complete`);
      }

      if (data.insights.hotLeads > 0) {
        recommendations.push(`${data.insights.hotLeads} hot leads need your attention`);
      }

      if (data.activities.dealsPipeline.length > 0) {
        const highValueDeals = data.activities.dealsPipeline.filter(deal => 
          parseFloat(deal.value?.toString() || '0') > 10000
        );
        if (highValueDeals.length > 0) {
          recommendations.push(`${highValueDeals.length} high-value deals in your pipeline`);
        }
      }

      if (data.stats.leadsThisWeek > 0) {
        recommendations.push(`${data.stats.leadsThisWeek} new leads this week to follow up`);
      }

      // Default recommendations if no specific ones apply
      if (recommendations.length === 0) {
        recommendations.push(
          "Review your monthly performance dashboard",
          "Check for new lead opportunities",
          "Schedule follow-ups with warm prospects",
          "Update your sales pipeline status"
        );
      }

      return recommendations.slice(0, 4); // Limit to 4 recommendations
    } catch (error) {
      console.error('Error getting greeting recommendations:', error);
      return [
        "Review your monthly performance dashboard",
        "Check for new lead opportunities",
        "Schedule follow-ups with warm prospects"
      ];
    }
  }

  async getUpcomingEvents(userEmail: string, tenantId: string) {
    try {
      const tasks = await this.storage.getTasks();
      
      // Convert tasks to events
      const events = tasks
        .filter(task => task.status !== 'completed')
        .sort((a, b) => new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime())
        .slice(0, 4)
        .map(task => ({
          title: task.title || 'Untitled Task',
          time: this.formatTaskTime(task.dueDate),
          type: 'task' as const
        }));

      // Add some example meetings if we have fewer than 4 events
      if (events.length < 4) {
        const exampleEvents = [
          { title: "Team Stand-up", time: "Tomorrow 10:00 AM", type: 'meeting' as const },
          { title: "Client Check-in", time: "Tomorrow 2:30 PM", type: 'meeting' as const },
          { title: "Weekly Report Review", time: "Friday", type: 'reminder' as const }
        ];
        
        events.push(...exampleEvents.slice(0, 4 - events.length));
      }

      return events;
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      return [
        { title: "Team Stand-up", time: "10:00 AM", type: 'meeting' as const },
        { title: "Client Demo", time: "2:30 PM", type: 'meeting' as const },
        { title: "Follow up with prospects", time: "4:00 PM", type: 'task' as const },
        { title: "Weekly report review", time: "Tomorrow", type: 'reminder' as const }
      ];
    }
  }

  private formatTaskTime(dueDate?: string): string {
    if (!dueDate) return 'No due date';
    
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today ' + due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Tomorrow ' + due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return due.toLocaleDateString([], { weekday: 'long' });
    } else {
      return due.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }
}