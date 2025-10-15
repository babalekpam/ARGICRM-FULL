import { storage } from '../storage';

export interface OnboardingData {
  personalInfo: {
    firstName: string;
    lastName: string;
    jobTitle: string;
    phone: string;
  };
  companyInfo: {
    companyName: string;
    industry: string;
    companySize: string;
    website: string;
    address: string;
  };
  businessGoals: {
    primaryGoals: string[];
    expectedUsers: string;
    currentChallenges: string;
    timeline: string;
  };
  teamSetup: {
    inviteTeam: boolean;
    teamMembers: Array<{
      name: string;
      email: string;
      role: string;
    }>;
  };
  preferences: {
    timezone: string;
    currency: string;
    language: string;
    notifications: {
      email: boolean;
      sms: boolean;
      browser: boolean;
    };
  };
}

export interface OnboardingProgress {
  userId: string;
  tenantId: string;
  completed: boolean;
  currentStep: number;
  completedSteps: string[];
  data: Partial<OnboardingData>;
  createdAt: Date;
  updatedAt: Date;
}

export class OnboardingService {
  constructor(private storage: DatabaseStorage) {}

  async saveOnboardingProgress(
    userId: string,
    tenantId: string,
    step: number,
    stepData: Partial<OnboardingData>
  ): Promise<OnboardingProgress> {
    try {
      // In a real implementation, this would save to database
      // For now, we'll use in-memory storage
      if (!global.__ONBOARDING_PROGRESS_STORAGE__) {
        global.__ONBOARDING_PROGRESS_STORAGE__ = new Map();
      }

      const progressKey = `${userId}-${tenantId}`;
      const existing = global.__ONBOARDING_PROGRESS_STORAGE__.get(progressKey);
      
      const progress: OnboardingProgress = {
        userId,
        tenantId,
        completed: false,
        currentStep: step,
        completedSteps: existing?.completedSteps || [],
        data: {
          ...existing?.data,
          ...stepData
        },
        createdAt: existing?.createdAt || new Date(),
        updatedAt: new Date()
      };

      global.__ONBOARDING_PROGRESS_STORAGE__.set(progressKey, progress);
      
      return progress;
    } catch (error) {
      console.error('Error saving onboarding progress:', error);
      throw error;
    }
  }

  async getOnboardingProgress(userId: string, tenantId: string): Promise<OnboardingProgress | null> {
    try {
      if (!global.__ONBOARDING_PROGRESS_STORAGE__) {
        return null;
      }

      const progressKey = `${userId}-${tenantId}`;
      return global.__ONBOARDING_PROGRESS_STORAGE__.get(progressKey) || null;
    } catch (error) {
      console.error('Error getting onboarding progress:', error);
      return null;
    }
  }

  async completeOnboarding(
    userId: string,
    tenantId: string,
    finalData: OnboardingData
  ): Promise<{
    success: boolean;
    userProfileCreated: boolean;
    teamInvitesSent: number;
    setupComplete: boolean;
  }> {
    try {
      // Save final onboarding data
      const progress = await this.saveOnboardingProgress(userId, tenantId, 6, finalData);
      progress.completed = true;
      
      // Update user profile with personal info
      const userProfileUpdated = await this.updateUserProfile(userId, finalData);
      
      // Update company/tenant info
      const companyUpdated = await this.updateCompanyInfo(tenantId, finalData);
      
      // Send team invitations
      const teamInvitesSent = await this.sendTeamInvitations(tenantId, finalData);
      
      // Apply user preferences
      const preferencesApplied = await this.applyUserPreferences(userId, tenantId, finalData);
      
      // Create initial sample data if requested
      const sampleDataCreated = await this.createInitialData(tenantId, finalData);

      return {
        success: true,
        userProfileCreated: userProfileUpdated,
        teamInvitesSent,
        setupComplete: companyUpdated && preferencesApplied
      };
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }

  private async updateUserProfile(userId: string, data: OnboardingData): Promise<boolean> {
    try {
      // Update user profile with personal information
      const userProfile = {
        firstName: data.personalInfo?.firstName || '',
        lastName: data.personalInfo?.lastName || '',
        jobTitle: data.personalInfo?.jobTitle || '',
        phone: data.personalInfo?.phone || '',
        timezone: data.preferences?.timezone || 'America/New_York',
        language: data.preferences?.language || 'en',
        updatedAt: new Date()
      };

      // In a real implementation, this would update the user record in database
      console.log('Updated user profile for:', userId, userProfile);
      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  private async updateCompanyInfo(tenantId: string, data: OnboardingData): Promise<boolean> {
    try {
      // Update tenant/company information
      const companyInfo = {
        name: data.companyInfo?.companyName || '',
        industry: data.companyInfo?.industry || '',
        size: data.companyInfo?.companySize || '',
        website: data.companyInfo?.website || '',
        address: data.companyInfo?.address || '',
        currency: data.preferences?.currency || 'USD',
        timezone: data.preferences?.timezone || 'America/New_York',
        updatedAt: new Date()
      };

      // Store company preferences
      if (!global.__COMPANY_SETTINGS_STORAGE__) {
        global.__COMPANY_SETTINGS_STORAGE__ = new Map();
      }
      
      global.__COMPANY_SETTINGS_STORAGE__.set(tenantId, companyInfo);
      
      console.log('Updated company info for tenant:', tenantId, companyInfo);
      return true;
    } catch (error) {
      console.error('Error updating company info:', error);
      return false;
    }
  }

  private async sendTeamInvitations(tenantId: string, data: OnboardingData): Promise<number> {
    try {
      if (!data.teamSetup?.inviteTeam || !data.teamSetup?.teamMembers?.length) {
        return 0;
      }

      let invitesSent = 0;
      
      for (const member of data.teamSetup.teamMembers) {
        if (member.email && member.name) {
          // In a real implementation, this would send email invitations
          // For now, we'll just create pending team member records
          const invitation = {
            tenantId,
            name: member.name,
            email: member.email,
            role: member.role,
            status: 'pending',
            invitedAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          };

          if (!global.__TEAM_INVITATIONS_STORAGE__) {
            global.__TEAM_INVITATIONS_STORAGE__ = [];
          }
          
          global.__TEAM_INVITATIONS_STORAGE__.push(invitation);
          invitesSent++;
          
          console.log('Team invitation created for:', member.email);
        }
      }

      return invitesSent;
    } catch (error) {
      console.error('Error sending team invitations:', error);
      return 0;
    }
  }

  private async applyUserPreferences(userId: string, tenantId: string, data: OnboardingData): Promise<boolean> {
    try {
      // Apply user preferences to the system
      const preferences = {
        userId,
        tenantId,
        timezone: data.preferences?.timezone || 'America/New_York',
        currency: data.preferences?.currency || 'USD',
        language: data.preferences?.language || 'en',
        notifications: data.preferences?.notifications || { email: true, sms: false, browser: true },
        appliedAt: new Date()
      };

      if (!global.__USER_PREFERENCES_STORAGE__) {
        global.__USER_PREFERENCES_STORAGE__ = new Map();
      }
      
      global.__USER_PREFERENCES_STORAGE__.set(`${userId}-${tenantId}`, preferences);
      
      console.log('Applied user preferences for:', userId, preferences);
      return true;
    } catch (error) {
      console.error('Error applying user preferences:', error);
      return false;
    }
  }

  private async createInitialData(tenantId: string, data: OnboardingData): Promise<boolean> {
    try {
      // Based on business goals, create some initial sample data
      const goals = data.businessGoals?.primaryGoals || [];
      
      // Create sample contacts if lead management is a goal
      if (goals.includes('Better lead management') || goals.includes('Increase sales revenue')) {
        await this.createSampleContacts(tenantId, data);
      }
      
      // Create sample deals if sales process is a goal
      if (goals.includes('Streamline sales processes') || goals.includes('Pipeline optimization')) {
        await this.createSampleDeals(tenantId, data);
      }
      
      // Create sample tasks if collaboration is a goal
      if (goals.includes('Team collaboration')) {
        await this.createSampleTasks(tenantId, data);
      }

      return true;
    } catch (error) {
      console.error('Error creating initial data:', error);
      return false;
    }
  }

  private async createSampleContacts(tenantId: string, data: OnboardingData) {
    try {
      const sampleContacts = [
        {
          tenantId,
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '555-0123',
          company: 'Sample Corp',
          jobTitle: 'Manager',
          leadSource: 'Onboarding Setup',
          notes: 'Sample contact created during onboarding',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          tenantId,
          name: 'Jane Smith',
          email: 'jane.smith@demo.com',
          phone: '555-0124',
          company: 'Demo Industries',
          jobTitle: 'Director',
          leadSource: 'Onboarding Setup',
          notes: 'Sample contact for testing CRM features',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Add to storage
      for (const contact of sampleContacts) {
        try {
          await this.storage.createContact(contact);
        } catch (error) {
          console.log('Sample contact creation skipped - storage may already have data');
        }
      }
    } catch (error) {
      console.error('Error creating sample contacts:', error);
    }
  }

  private async createSampleDeals(tenantId: string, data: OnboardingData) {
    try {
      const sampleDeals = [
        {
          tenantId,
          name: 'Sample Deal - New Business',
          amount: 50000,
          stage: 'Proposal',
          probability: 75,
          expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          description: 'Sample deal created during onboarding to demonstrate CRM features',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Add to storage
      for (const deal of sampleDeals) {
        try {
          await this.storage.createDeal(deal);
        } catch (error) {
          console.log('Sample deal creation skipped - storage may already have data');
        }
      }
    } catch (error) {
      console.error('Error creating sample deals:', error);
    }
  }

  private async createSampleTasks(tenantId: string, data: OnboardingData) {
    try {
      const sampleTasks = [
        {
          tenantId,
          title: 'Welcome to NODE CRM',
          description: 'Explore your new CRM system and familiarize yourself with the features',
          priority: 'medium' as const,
          status: 'pending' as const,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          tenantId,
          title: 'Set up your first campaign',
          description: 'Create your first marketing campaign to engage with prospects',
          priority: 'low' as const,
          status: 'pending' as const,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Add to storage
      for (const task of sampleTasks) {
        try {
          await this.storage.createTask(task);
        } catch (error) {
          console.log('Sample task creation skipped - storage may already have data');
        }
      }
    } catch (error) {
      console.error('Error creating sample tasks:', error);
    }
  }

  async getOnboardingStats(): Promise<{
    totalStarted: number;
    totalCompleted: number;
    completionRate: number;
    averageTimeToComplete: number;
    stepDropoffRates: Record<string, number>;
  }> {
    try {
      if (!global.__ONBOARDING_PROGRESS_STORAGE__) {
        return {
          totalStarted: 0,
          totalCompleted: 0,
          completionRate: 0,
          averageTimeToComplete: 0,
          stepDropoffRates: {}
        };
      }

      const allProgress = Array.from(global.__ONBOARDING_PROGRESS_STORAGE__.values());
      const totalStarted = allProgress.length;
      const totalCompleted = allProgress.filter(p => p.completed).length;
      const completionRate = totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0;

      // Calculate average time to complete for completed onboardings
      const completedWithTimes = allProgress.filter(p => p.completed);
      const totalTimeMs = completedWithTimes.reduce((acc, p) => {
        return acc + (p.updatedAt.getTime() - p.createdAt.getTime());
      }, 0);
      const averageTimeToComplete = completedWithTimes.length > 0 
        ? totalTimeMs / completedWithTimes.length / (1000 * 60) // Convert to minutes
        : 0;

      // Calculate step dropoff rates
      const stepCounts = [0, 0, 0, 0, 0, 0]; // 6 steps
      allProgress.forEach(p => {
        if (p.currentStep >= 0 && p.currentStep < 6) {
          stepCounts[p.currentStep]++;
        }
      });

      const stepDropoffRates = {
        'Personal Info': stepCounts[0],
        'Company Info': stepCounts[1],
        'Business Goals': stepCounts[2],
        'Team Setup': stepCounts[3],
        'Preferences': stepCounts[4],
        'Complete': stepCounts[5]
      };

      return {
        totalStarted,
        totalCompleted,
        completionRate,
        averageTimeToComplete,
        stepDropoffRates
      };
    } catch (error) {
      console.error('Error getting onboarding stats:', error);
      return {
        totalStarted: 0,
        totalCompleted: 0,
        completionRate: 0,
        averageTimeToComplete: 0,
        stepDropoffRates: {}
      };
    }
  }
}