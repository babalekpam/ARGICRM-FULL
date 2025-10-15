import express from 'express';
import { SalesChannelService } from '../services/sales-channel-service.js';
import { resolveTenant, validateUserTenant, requirePermission, type TenantRequest } from '../middleware/tenant.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const salesChannelService = SalesChannelService.getInstance();

// ================================
// DEBUG ROUTES (NO AUTH)
// ================================

// DEBUG ROUTE: Get platform owner channels directly
router.get('/debug/platform-owner-channels', async (req: any, res: any) => {
  try {
    const platformOwnerTenantId = '00000000-0000-0000-0000-000000000001';
    console.log('DEBUG: Fetching channels for platform owner tenant:', platformOwnerTenantId);
    const channels = await salesChannelService.getChannelsByTenant(platformOwnerTenantId);
    console.log('DEBUG: Found', channels.length, 'channels');
    res.json({
      success: true,
      channels,
      total: channels.length,
      tenantId: platformOwnerTenantId
    });
  } catch (error) {
    console.error('Debug get channels error:', error);
    res.status(500).json({ error: 'Debug failed' });
  }
});

// ================================
// MIDDLEWARE SETUP
// ================================

// Apply authentication first, then tenant middleware
router.use(authenticate);
router.use('/channels', resolveTenant);
router.use('/channels', validateUserTenant);

// Apply authentication and tenant middleware to connect routes  
router.use('/connect', authenticate);
router.use('/connect', resolveTenant);
router.use('/connect', validateUserTenant);

// ================================
// GET ROUTES
// ================================

// Get all sales channels for current tenant
router.get('/channels', requirePermission('marketing.read'), async (req: TenantRequest, res) => {
  try {
    console.log('🚀 GET /channels - tenant ID:', req.tenant!.id);
    console.log('🚀 GET /channels - user email:', req.user?.email);
    console.log('🚀 GET /channels - platform owner tenant:', '00000000-0000-0000-0000-000000000001');
    const channels = await salesChannelService.getChannelsByTenant(req.tenant!.id);
    console.log('🚀 GET /channels - found channels:', channels.length);
    res.json({
      success: true,
      channels,
      total: channels.length
    });
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ error: 'Failed to fetch sales channels' });
  }
});

// Get specific channel details (tenant-isolated)
router.get('/channels/:channelId', requirePermission('marketing.read'), async (req: TenantRequest, res) => {
  try {
    const { channelId } = req.params;
    const channel = await salesChannelService.getChannel(channelId, req.tenant!.id);
    
    if (!channel) {
      return res.status(404).json({ error: 'Sales channel not found' });
    }
    
    res.json({
      success: true,
      channel
    });
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({ error: 'Failed to fetch channel details' });
  }
});

// Get channel metrics (tenant-isolated)
router.get('/channels/:channelId/metrics', requirePermission('analytics.read'), async (req: TenantRequest, res) => {
  try {
    const { channelId } = req.params;
    const { period = '7d' } = req.query;
    
    const metrics = await salesChannelService.getChannelMetrics(
      channelId, 
      req.tenant!.id, 
      period as '24h' | '7d' | '30d' | '90d'
    );
    
    if (!metrics) {
      return res.status(404).json({ error: 'Channel not found or access denied' });
    }
    
    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Get channel metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch channel metrics' });
  }
});

// Get available platforms - No auth required for platform list
router.get('/platforms', async (req: any, res: any) => {
  try {
    const platforms = salesChannelService.getAvailablePlatforms();
    res.json({
      success: true,
      platforms
    });
  } catch (error) {
    console.error('Get platforms error:', error);
    res.status(500).json({ error: 'Failed to fetch available platforms' });
  }
});

// DEBUG ROUTE: Get platform owner channels directly
router.get('/debug/platform-owner-channels', async (req: any, res: any) => {
  try {
    const platformOwnerTenantId = '00000000-0000-0000-0000-000000000001';
    console.log('DEBUG: Fetching channels for platform owner tenant:', platformOwnerTenantId);
    const channels = await salesChannelService.getChannelsByTenant(platformOwnerTenantId);
    console.log('DEBUG: Found', channels.length, 'channels');
    res.json({
      success: true,
      channels,
      total: channels.length,
      tenantId: platformOwnerTenantId
    });
  } catch (error) {
    console.error('Debug get channels error:', error);
    res.status(500).json({ error: 'Debug failed' });
  }
});

// ================================
// POST ROUTES - PLATFORM CONNECTIONS
// ================================

// Apply authentication first, then tenant middleware to connection routes
router.use('/connect', authenticate);
router.use('/connect', resolveTenant);
router.use('/connect', validateUserTenant);

// Connect TikTok Business
router.post('/connect/tiktok', requirePermission('marketing.write'), async (req: TenantRequest, res) => {
  try {
    const { accessToken, accountId } = req.body;
    
    if (!accessToken || !accountId) {
      return res.status(400).json({ error: 'Access token and account ID are required' });
    }
    
    const channel = await salesChannelService.connectTikTok(
      req.user!.id,
      req.tenant!.id,
      accessToken,
      accountId
    );
    
    res.json({
      success: true,
      channel,
      message: 'TikTok Business connected successfully'
    });
  } catch (error) {
    console.error('Connect TikTok error:', error);
    res.status(500).json({ error: 'Failed to connect TikTok Business' });
  }
});

// Connect Facebook Business
router.post('/connect/facebook', requirePermission('marketing.write'), async (req: TenantRequest, res) => {
  try {
    const { accessToken, businessManagerId, pixelId } = req.body;
    
    if (!accessToken || !businessManagerId) {
      return res.status(400).json({ error: 'Access token and business manager ID are required' });
    }
    
    const channel = await salesChannelService.connectFacebookBusiness(
      req.user!.id,
      req.tenant!.id,
      accessToken,
      businessManagerId,
      pixelId
    );
    
    res.json({
      success: true,
      channel,
      message: 'Facebook Business connected successfully'
    });
  } catch (error) {
    console.error('Connect Facebook error:', error);
    res.status(500).json({ error: 'Failed to connect Facebook Business' });
  }
});

// Connect Instagram Business
router.post('/connect/instagram', requirePermission('marketing.write'), async (req: TenantRequest, res) => {
  try {
    const { accessToken, businessAccountId } = req.body;
    
    if (!accessToken || !businessAccountId) {
      return res.status(400).json({ error: 'Access token and business account ID are required' });
    }
    
    const channel = await salesChannelService.connectInstagramBusiness(
      req.user!.id,
      req.tenant!.id,
      accessToken,
      businessAccountId
    );
    
    res.json({
      success: true,
      channel,
      message: 'Instagram Business connected successfully'
    });
  } catch (error) {
    console.error('Connect Instagram error:', error);
    res.status(500).json({ error: 'Failed to connect Instagram Business' });
  }
});

// Connect Google Ads
router.post('/connect/google-ads', requirePermission('marketing.write'), async (req: TenantRequest, res) => {
  try {
    const { accessToken, customerId, refreshToken } = req.body;
    
    if (!accessToken || !customerId || !refreshToken) {
      return res.status(400).json({ error: 'Access token, customer ID, and refresh token are required' });
    }
    
    const channel = await salesChannelService.connectGoogleAds(
      req.user!.id,
      req.tenant!.id,
      accessToken,
      customerId,
      refreshToken
    );
    
    res.json({
      success: true,
      channel,
      message: 'Google Ads connected successfully'
    });
  } catch (error) {
    console.error('Connect Google Ads error:', error);
    res.status(500).json({ error: 'Failed to connect Google Ads' });
  }
});

// Connect Twitter/X Business
router.post('/connect/twitter', requirePermission('marketing.write'), async (req: TenantRequest, res) => {
  try {
    const { accessToken, accountId } = req.body;
    
    if (!accessToken || !accountId) {
      return res.status(400).json({ error: 'Access token and account ID are required' });
    }
    
    const channel = await salesChannelService.connectTwitterBusiness(
      req.user!.id,
      req.tenant!.id,
      accessToken,
      accountId
    );
    
    res.json({
      success: true,
      channel,
      message: 'X (Twitter) Business connected successfully'
    });
  } catch (error) {
    console.error('Connect Twitter error:', error);
    res.status(500).json({ error: 'Failed to connect X (Twitter) Business' });
  }
});

// Connect LinkedIn Business
router.post('/connect/linkedin', requirePermission('marketing.write'), async (req: TenantRequest, res) => {
  try {
    const { accessToken, companyPageId } = req.body;
    
    if (!accessToken || !companyPageId) {
      return res.status(400).json({ error: 'Access token and company page ID are required' });
    }
    
    const channel = await salesChannelService.connectLinkedInBusiness(
      req.user!.id,
      req.tenant!.id,
      accessToken,
      companyPageId
    );
    
    res.json({
      success: true,
      channel,
      message: 'LinkedIn Business connected successfully'
    });
  } catch (error) {
    console.error('Connect LinkedIn error:', error);
    res.status(500).json({ error: 'Failed to connect LinkedIn Business' });
  }
});

// Connect Snapchat Business
router.post('/connect/snapchat', requirePermission('marketing.write'), async (req: TenantRequest, res) => {
  try {
    const { accessToken, adAccountId } = req.body;
    
    if (!accessToken || !adAccountId) {
      return res.status(400).json({ error: 'Access token and ad account ID are required' });
    }
    
    const channel = await salesChannelService.connectSnapchatBusiness(
      req.user!.id,
      req.tenant!.id,
      accessToken,
      adAccountId
    );
    
    res.json({
      success: true,
      channel,
      message: 'Snapchat Business connected successfully'
    });
  } catch (error) {
    console.error('Connect Snapchat error:', error);
    res.status(500).json({ error: 'Failed to connect Snapchat Business' });
  }
});

// Connect Pinterest Business
router.post('/connect/pinterest', requirePermission('marketing.write'), async (req: TenantRequest, res) => {
  try {
    const { accessToken, adAccountId } = req.body;
    
    if (!accessToken || !adAccountId) {
      return res.status(400).json({ error: 'Access token and ad account ID are required' });
    }
    
    const channel = await salesChannelService.connectPinterestBusiness(
      req.user!.id,
      req.tenant!.id,
      accessToken,
      adAccountId
    );
    
    res.json({
      success: true,
      channel,
      message: 'Pinterest Business connected successfully'
    });
  } catch (error) {
    console.error('Connect Pinterest error:', error);
    res.status(500).json({ error: 'Failed to connect Pinterest Business' });
  }
});

// ================================
// PUT/PATCH ROUTES - UPDATES
// ================================

// Update channel settings (tenant-isolated)
router.put('/channels/:channelId/settings', requirePermission('marketing.write'), async (req: TenantRequest, res) => {
  try {
    const { channelId } = req.params;
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Valid settings object is required' });
    }
    
    const updatedChannel = await salesChannelService.updateChannelSettings(
      channelId,
      req.tenant!.id,
      settings
    );
    
    if (!updatedChannel) {
      return res.status(404).json({ error: 'Channel not found or access denied' });
    }
    
    res.json({
      success: true,
      channel: updatedChannel,
      message: 'Channel settings updated successfully'
    });
  } catch (error) {
    console.error('Update channel settings error:', error);
    res.status(500).json({ error: 'Failed to update channel settings' });
  }
});

// Sync channel data (tenant-isolated)
router.post('/channels/:channelId/sync', requirePermission('marketing.write'), async (req: TenantRequest, res) => {
  try {
    const { channelId } = req.params;
    
    const success = await salesChannelService.syncChannel(channelId, req.tenant!.id);
    
    if (!success) {
      return res.status(404).json({ error: 'Channel not found, access denied, or sync failed' });
    }
    
    res.json({
      success: true,
      message: 'Channel sync completed successfully'
    });
  } catch (error) {
    console.error('Sync channel error:', error);
    res.status(500).json({ error: 'Failed to sync channel data' });
  }
});

// ================================
// DELETE ROUTES
// ================================

// Disconnect channel (tenant-isolated)
router.delete('/channels/:channelId', requirePermission('marketing.write'), async (req: TenantRequest, res) => {
  try {
    const { channelId } = req.params;
    
    const success = await salesChannelService.disconnectChannel(channelId, req.tenant!.id);
    
    if (!success) {
      return res.status(404).json({ error: 'Channel not found or access denied' });
    }
    
    res.json({
      success: true,
      message: 'Sales channel disconnected successfully'
    });
  } catch (error) {
    console.error('Disconnect channel error:', error);
    res.status(500).json({ error: 'Failed to disconnect sales channel' });
  }
});

export default router;