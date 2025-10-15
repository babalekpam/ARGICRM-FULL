import { storage } from '../storage.js';
import type { SalesChannel as DBSalesChannel, InsertSalesChannel } from '@shared/schema';

export interface SalesChannelConfig {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  accountId?: string;
  pixelId?: string;
  businessManagerId?: string;
  webhookUrl?: string;
  settings?: Record<string, any>;
}

export interface SalesChannel {
  id: string;
  platformId: string;
  platformName: string;
  userId: string;
  tenantId: string; // CRITICAL: Ensure tenant isolation
  status: 'connected' | 'disconnected' | 'error' | 'pending_auth';
  config: SalesChannelConfig;
  lastSync: Date | null;
  syncStats: {
    totalLeads: number;
    totalOrders: number;
    totalRevenue: number;
    lastSyncResult: 'success' | 'error' | 'partial';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesChannelMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  roas: number;
  period: '24h' | '7d' | '30d' | '90d';
}

export class SalesChannelService {
  private static instance: SalesChannelService;

  static getInstance(): SalesChannelService {
    if (!SalesChannelService.instance) {
      SalesChannelService.instance = new SalesChannelService();
    }
    return SalesChannelService.instance;
  }

  // TENANT-ISOLATED: Get channels only for specific tenant
  async getChannelsByTenant(tenantId: string): Promise<SalesChannel[]> {
    const channels = await storage.getSalesChannelsByTenant(tenantId);
    return channels.map((channel) => this.mapDBChannelToService(channel));
  }

  // TENANT-ISOLATED: Get specific channel with tenant validation
  async getChannel(channelId: string, tenantId: string): Promise<SalesChannel | null> {
    const channel = await storage.getSalesChannel(channelId, tenantId);
    return channel ? this.mapDBChannelToService(channel) : null;
  }

  // Helper to map database channel to service interface
  private mapDBChannelToService(dbChannel: DBSalesChannel): SalesChannel {
    return {
      id: dbChannel.id,
      platformId: dbChannel.platformId,
      platformName: this.getPlatformName(dbChannel.platformId),
      userId: dbChannel.userId,
      tenantId: dbChannel.tenantId,
      status: dbChannel.status as 'connected' | 'disconnected' | 'error' | 'pending_auth',
      config: dbChannel.config || {},
      lastSync: dbChannel.lastSync,
      syncStats: dbChannel.syncStats || {
        totalLeads: 0,
        totalOrders: 0,
        totalRevenue: 0,
        lastSyncResult: 'success'
      },
      createdAt: dbChannel.createdAt,
      updatedAt: dbChannel.updatedAt
    };
  }

  private getPlatformName(platformId: string): string {
    const names: Record<string, string> = {
      'tiktok': 'TikTok for Business',
      'facebook_business': 'Facebook Business',
      'instagram_business': 'Instagram Business',
      'google_ads': 'Google Ads',
      'twitter': 'X (Twitter) Business',
      'linkedin': 'LinkedIn Business',
      'snapchat': 'Snapchat Business',
      'pinterest': 'Pinterest Business'
    };
    return names[platformId] || platformId;
  }

  // ================================
  // TIKTOK INTEGRATION
  // ================================
  async connectTikTok(userId: string, tenantId: string, accessToken: string, accountId: string): Promise<SalesChannel> {
    const channelData: InsertSalesChannel = {
      platformId: 'tiktok',
      platformName: 'TikTok for Business', // CRITICAL: Add the missing platform name
      userId,
      tenantId, // CRITICAL: Tenant isolation
      status: 'connected',
      config: {
        accessToken,
        accountId,
        webhookUrl: `${process.env.BASE_URL}/api/webhooks/tiktok`,
        settings: {
          autoSync: true,
          syncInterval: '1h',
          trackConversions: true,
          pixelTracking: true
        }
      },
      lastSync: null,
      syncStats: {
        totalLeads: 0,
        totalOrders: 0,
        totalRevenue: 0,
        lastSyncResult: 'success'
      }
    };

    const dbChannel = await storage.createSalesChannel(channelData);
    return this.mapDBChannelToService(dbChannel);
  }

  // ================================
  // FACEBOOK/META BUSINESS INTEGRATION (Enhanced)
  // ================================
  async connectFacebookBusiness(userId: string, tenantId: string, accessToken: string, businessManagerId: string, pixelId?: string): Promise<SalesChannel> {
    const channelData: InsertSalesChannel = {
      platformId: 'facebook_business',
      platformName: 'Facebook Business',
      userId,
      tenantId, // CRITICAL: Tenant isolation
      status: 'connected',
      config: {
        accessToken,
        businessManagerId,
        pixelId,
        accountId: businessManagerId,
        webhookUrl: `${process.env.BASE_URL}/api/webhooks/facebook`,
        settings: {
          autoSyncAds: true,
          syncLeads: true,
          trackConversions: true,
          retargetingEnabled: true,
          campaignOptimization: 'CONVERSIONS'
        }
      },
      lastSync: null,
      syncStats: {
        totalLeads: 0,
        totalOrders: 0,
        totalRevenue: 0,
        lastSyncResult: 'success'
      }
    };

    const dbChannel = await storage.createSalesChannel(channelData);
    return this.mapDBChannelToService(dbChannel);
  }

  // ================================
  // INSTAGRAM BUSINESS INTEGRATION (Enhanced)
  // ================================
  async connectInstagramBusiness(userId: string, tenantId: string, accessToken: string, businessAccountId: string): Promise<SalesChannel> {
    const channelData: InsertSalesChannel = {
      platformId: 'instagram_business',
      platformName: 'Instagram Business',
      userId,
      tenantId, // CRITICAL: Tenant isolation
      status: 'connected',
      config: {
        accessToken,
        accountId: businessAccountId,
        webhookUrl: `${process.env.BASE_URL}/api/webhooks/instagram`,
        settings: {
          autoPosting: false,
          storyHighlights: true,
          shoppingIntegration: true,
          hashtagStrategy: 'trending',
          influencerTracking: true
        }
      },
      lastSync: null,
      syncStats: {
        totalLeads: 0,
        totalOrders: 0,
        totalRevenue: 0,
        lastSyncResult: 'success'
      }
    };

    const dbChannel = await storage.createSalesChannel(channelData);
    return this.mapDBChannelToService(dbChannel);
  }

  // ================================
  // GOOGLE ADS INTEGRATION
  // ================================
  async connectGoogleAds(userId: string, tenantId: string, accessToken: string, customerId: string, refreshToken: string): Promise<SalesChannel> {
    const channelData: InsertSalesChannel = {
      platformId: 'google_ads',
      platformName: 'Google Ads',
      userId,
      tenantId, // CRITICAL: Tenant isolation
      status: 'connected',
      config: {
        accessToken,
        refreshToken,
        accountId: customerId,
        webhookUrl: `${process.env.BASE_URL}/api/webhooks/google`,
        settings: {
          autoKeywordExpansion: true,
          smartBidding: 'TARGET_CPA',
          audienceTargeting: 'CUSTOM',
          conversionTracking: true,
          performanceMaxCampaigns: true
        }
      },
      lastSync: null,
      syncStats: {
        totalLeads: 0,
        totalOrders: 0,
        totalRevenue: 0,
        lastSyncResult: 'success'
      }
    };

    const dbChannel = await storage.createSalesChannel(channelData);
    return this.mapDBChannelToService(dbChannel);
  }

  // ================================
  // TWITTER/X BUSINESS INTEGRATION
  // ================================
  async connectTwitterBusiness(userId: string, tenantId: string, accessToken: string, accountId: string): Promise<SalesChannel> {
    const channelData: InsertSalesChannel = {
      platformId: 'twitter_business',
      platformName: 'X (Twitter) Business',
      userId,
      tenantId, // CRITICAL: Tenant isolation
      status: 'connected',
      config: {
        accessToken,
        accountId,
        webhookUrl: `${process.env.BASE_URL}/api/webhooks/twitter`,
        settings: {
          tweetPromoting: true,
          threadOptimization: true,
          hashtagTracking: true,
          influencerEngagement: true,
          videoAdsEnabled: true
        }
      },
      lastSync: null,
      syncStats: {
        totalLeads: 0,
        totalOrders: 0,
        totalRevenue: 0,
        lastSyncResult: 'success'
      }
    };

    const dbChannel = await storage.createSalesChannel(channelData);
    return this.mapDBChannelToService(dbChannel);
  }

  // ================================
  // LINKEDIN BUSINESS INTEGRATION (Enhanced)
  // ================================
  async connectLinkedInBusiness(userId: string, tenantId: string, accessToken: string, companyPageId: string): Promise<SalesChannel> {
    const channelData: InsertSalesChannel = {
      platformId: 'linkedin_business',
      platformName: 'LinkedIn Business',
      userId,
      tenantId, // CRITICAL: Tenant isolation
      status: 'connected',
      config: {
        accessToken,
        accountId: companyPageId,
        webhookUrl: `${process.env.BASE_URL}/api/webhooks/linkedin`,
        settings: {
          sponsoredContent: true,
          leadGenForms: true,
          messagingAds: true,
          videoAds: true,
          audienceNetwork: 'PROFESSIONAL'
        }
      },
      lastSync: null,
      syncStats: {
        totalLeads: 0,
        totalOrders: 0,
        totalRevenue: 0,
        lastSyncResult: 'success'
      }
    };

    const dbChannel = await storage.createSalesChannel(channelData);
    return this.mapDBChannelToService(dbChannel);
  }

  // ================================
  // SNAPCHAT BUSINESS INTEGRATION
  // ================================
  async connectSnapchatBusiness(userId: string, tenantId: string, accessToken: string, adAccountId: string): Promise<SalesChannel> {
    const channelData: InsertSalesChannel = {
      platformId: 'snapchat_business',
      platformName: 'Snapchat Business',
      userId,
      tenantId, // CRITICAL: Tenant isolation
      status: 'connected',
      config: {
        accessToken,
        accountId: adAccountId,
        webhookUrl: `${process.env.BASE_URL}/api/webhooks/snapchat`,
        settings: {
          storyAds: true,
          collectionAds: true,
          commercialAds: true,
          dynamicAds: true,
          snapPixel: true
        }
      },
      lastSync: null,
      syncStats: {
        totalLeads: 0,
        totalOrders: 0,
        totalRevenue: 0,
        lastSyncResult: 'success'
      }
    };

    const dbChannel = await storage.createSalesChannel(channelData);
    return this.mapDBChannelToService(dbChannel);
  }

  // ================================
  // PINTEREST BUSINESS INTEGRATION
  // ================================
  async connectPinterestBusiness(userId: string, tenantId: string, accessToken: string, adAccountId: string): Promise<SalesChannel> {
    const channelData: InsertSalesChannel = {
      platformId: 'pinterest_business',
      platformName: 'Pinterest Business',
      userId,
      tenantId, // CRITICAL: Tenant isolation
      status: 'connected',
      config: {
        accessToken,
        accountId: adAccountId,
        webhookUrl: `${process.env.BASE_URL}/api/webhooks/pinterest`,
        settings: {
          shoppableAds: true,
          catalogSync: true,
          seasonalCampaigns: true,
          richPins: true,
          videoAds: true
        }
      },
      lastSync: null,
      syncStats: {
        totalLeads: 0,
        totalOrders: 0,
        totalRevenue: 0,
        lastSyncResult: 'success'
      }
    };

    const dbChannel = await storage.createSalesChannel(channelData);
    return this.mapDBChannelToService(dbChannel);
  }

  // ================================
  // CHANNEL MANAGEMENT OPERATIONS
  // ================================

  // TENANT-ISOLATED: Disconnect channel with validation
  async disconnectChannel(channelId: string, tenantId: string): Promise<boolean> {
    const channel = this.channels.get(channelId);
    if (!channel || channel.tenantId !== tenantId) {
      return false; // Enforce tenant isolation
    }

    channel.status = 'disconnected';
    channel.updatedAt = new Date();
    return true;
  }

  // TENANT-ISOLATED: Update channel settings with validation
  async updateChannelSettings(channelId: string, tenantId: string, settings: Record<string, any>): Promise<SalesChannel | null> {
    const channel = this.channels.get(channelId);
    if (!channel || channel.tenantId !== tenantId) {
      return null; // Enforce tenant isolation
    }

    channel.config.settings = { ...channel.config.settings, ...settings };
    channel.updatedAt = new Date();
    return channel;
  }

  // TENANT-ISOLATED: Get channel metrics with validation
  async getChannelMetrics(channelId: string, tenantId: string, period: '24h' | '7d' | '30d' | '90d' = '7d'): Promise<SalesChannelMetrics | null> {
    const channel = this.channels.get(channelId);
    if (!channel || channel.tenantId !== tenantId) {
      return null; // Enforce tenant isolation
    }

    // Mock metrics for demonstration - replace with actual API calls
    return {
      impressions: Math.floor(Math.random() * 100000),
      clicks: Math.floor(Math.random() * 5000),
      conversions: Math.floor(Math.random() * 200),
      revenue: Math.floor(Math.random() * 10000),
      ctr: Math.random() * 5,
      cpc: Math.random() * 2,
      roas: Math.random() * 8 + 1,
      period
    };
  }

  // TENANT-ISOLATED: Sync channel data
  async syncChannel(channelId: string, tenantId: string): Promise<boolean> {
    const channel = this.channels.get(channelId);
    if (!channel || channel.tenantId !== tenantId) {
      return false; // Enforce tenant isolation
    }

    try {
      // Implement platform-specific sync logic here
      channel.lastSync = new Date();
      channel.syncStats.lastSyncResult = 'success';
      channel.updatedAt = new Date();
      return true;
    } catch (error) {
      console.error(`Sync failed for channel ${channelId}:`, error);
      channel.syncStats.lastSyncResult = 'error';
      return false;
    }
  }

  // Get available platform types
  getAvailablePlatforms(): Array<{id: string, name: string, category: string}> {
    return [
      { id: 'tiktok', name: 'TikTok for Business', category: 'Social Media' },
      { id: 'facebook_business', name: 'Facebook Business', category: 'Social Media' },
      { id: 'instagram_business', name: 'Instagram Business', category: 'Social Media' },
      { id: 'google_ads', name: 'Google Ads', category: 'Search Engine' },
      { id: 'twitter_business', name: 'X (Twitter) Business', category: 'Social Media' },
      { id: 'linkedin_business', name: 'LinkedIn Business', category: 'Professional' },
      { id: 'snapchat_business', name: 'Snapchat Business', category: 'Social Media' },
      { id: 'pinterest_business', name: 'Pinterest Business', category: 'Social Media' },
      { id: 'youtube_business', name: 'YouTube Business', category: 'Video' },
      { id: 'amazon_ads', name: 'Amazon Ads', category: 'E-commerce' }
    ];
  }
}