import type { Express } from "express";
import { storeAutomationEngine, AutomationRule, AutomationInsights, SmartAutomationSuggestion } from "../store-automation-engine";

export function registerAutomationRoutes(app: Express) {
  
  // Get all automation rules for a tenant
  app.get('/api/automation/rules', async (req, res) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || 'platform-tenant';
      const rules = await storeAutomationEngine.getAutomationRules(tenantId);
      
      res.json({
        success: true,
        rules,
        total: rules.length
      });
    } catch (error: any) {
      console.error('Error fetching automation rules:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Create new automation rule
  app.post('/api/automation/rules', async (req, res) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || 'platform-tenant';
      const ruleData = req.body;
      
      const newRule = await storeAutomationEngine.createAutomationRule(tenantId, ruleData);
      
      res.json({
        success: true,
        rule: newRule,
        message: 'Automation rule created successfully'
      });
    } catch (error: any) {
      console.error('Error creating automation rule:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Update automation rule
  app.patch('/api/automation/rules/:ruleId', async (req, res) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || 'platform-tenant';
      const ruleId = req.params.ruleId;
      const updates = req.body;
      
      const updatedRule = await storeAutomationEngine.updateAutomationRule(tenantId, ruleId, updates);
      
      if (!updatedRule) {
        return res.status(404).json({
          success: false,
          error: 'Automation rule not found'
        });
      }
      
      res.json({
        success: true,
        rule: updatedRule,
        message: 'Automation rule updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating automation rule:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Delete automation rule
  app.delete('/api/automation/rules/:ruleId', async (req, res) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || 'platform-tenant';
      const ruleId = req.params.ruleId;
      
      const deleted = await storeAutomationEngine.deleteAutomationRule(tenantId, ruleId);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Automation rule not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Automation rule deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting automation rule:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get automation insights and analytics
  app.get('/api/automation/insights', async (req, res) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || 'platform-tenant';
      const insights = await storeAutomationEngine.getAutomationInsights(tenantId);
      
      res.json({
        success: true,
        insights
      });
    } catch (error: any) {
      console.error('Error fetching automation insights:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get smart automation suggestions
  app.get('/api/automation/suggestions', async (req, res) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || 'platform-tenant';
      const suggestions = await storeAutomationEngine.generateSmartSuggestions(tenantId);
      
      res.json({
        success: true,
        suggestions,
        total: suggestions.length
      });
    } catch (error: any) {
      console.error('Error fetching automation suggestions:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Test automation rule
  app.post('/api/automation/rules/:ruleId/test', async (req, res) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || 'platform-tenant';
      const ruleId = req.params.ruleId;
      const testData = req.body;
      
      const testResult = await storeAutomationEngine.testAutomationRule(tenantId, ruleId, testData);
      
      res.json({
        success: true,
        testResult,
        message: 'Automation rule test completed'
      });
    } catch (error: any) {
      console.error('Error testing automation rule:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Trigger automation manually
  app.post('/api/automation/trigger', async (req, res) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || 'platform-tenant';
      const { triggerType, data } = req.body;
      
      await storeAutomationEngine.triggerAutomation(tenantId, triggerType, data);
      
      res.json({
        success: true,
        message: 'Automation triggered successfully'
      });
    } catch (error: any) {
      console.error('Error triggering automation:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get automation rule templates
  app.get('/api/automation/templates', async (req, res) => {
    try {
      const templates = [
        {
          id: 'low-stock-alert',
          name: 'Low Stock Alert',
          category: 'inventory',
          description: 'Automatically alert when product inventory is running low',
          trigger: { type: 'low_stock', conditions: { threshold: 10 } },
          actions: [
            { type: 'notification', parameters: { message: 'Low stock alert for {product_name}' } },
            { type: 'send_email', parameters: { template: 'low_stock', recipient: 'admin' } }
          ],
          estimatedImpact: 'Prevent stockouts and maintain 99% product availability'
        },
        {
          id: 'abandoned-cart-recovery',
          name: 'Abandoned Cart Recovery',
          category: 'marketing',
          description: 'Automatically send recovery emails for abandoned carts',
          trigger: { type: 'abandoned_cart', conditions: { delay_hours: 1 } },
          actions: [
            { type: 'send_email', parameters: { template: 'cart_recovery', discount: 10 } },
            { type: 'create_coupon', parameters: { type: 'percentage', value: 10, expires_hours: 48 } }
          ],
          estimatedImpact: 'Recover 20-30% of abandoned carts'
        },
        {
          id: 'dynamic-pricing',
          name: 'Dynamic Pricing',
          category: 'pricing',
          description: 'Automatically adjust prices based on demand and competition',
          trigger: { type: 'high_demand', conditions: { demand_increase: 50 } },
          actions: [
            { type: 'adjust_price', parameters: { increase_percentage: 5, max_increase: 20 } }
          ],
          estimatedImpact: 'Increase revenue by 8-15% through optimal pricing'
        },
        {
          id: 'customer-review-response',
          name: 'Review Response',
          category: 'customer_service',
          description: 'Automatically respond to customer reviews with AI-generated responses',
          trigger: { type: 'customer_review', conditions: { rating_below: 4 } },
          actions: [
            { type: 'ai_response', parameters: { tone: 'professional', follow_up: true } }
          ],
          estimatedImpact: 'Improve customer satisfaction and review ratings'
        },
        {
          id: 'order-fulfillment',
          name: 'Order Fulfillment',
          category: 'orders',
          description: 'Automatically process orders and update inventory',
          trigger: { type: 'new_order', conditions: {} },
          actions: [
            { type: 'update_inventory', parameters: { auto_deduct: true } },
            { type: 'send_email', parameters: { template: 'order_confirmation' } },
            { type: 'notification', parameters: { message: 'New order received: {order_id}' } }
          ],
          estimatedImpact: 'Reduce order processing time by 80%'
        },
        {
          id: 'social-media-promo',
          name: 'Social Media Promotion',
          category: 'marketing',
          description: 'Automatically create social media posts for new products',
          trigger: { type: 'new_product', conditions: {} },
          actions: [
            { type: 'social_media_post', parameters: { platforms: ['facebook', 'instagram', 'twitter'] } },
            { type: 'create_coupon', parameters: { type: 'percentage', value: 15, new_product: true } }
          ],
          estimatedImpact: 'Increase new product visibility and early sales'
        }
      ];
      
      res.json({
        success: true,
        templates,
        total: templates.length
      });
    } catch (error: any) {
      console.error('Error fetching automation templates:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Enable/disable automation rule
  app.patch('/api/automation/rules/:ruleId/toggle', async (req, res) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || 'platform-tenant';
      const ruleId = req.params.ruleId;
      const { enabled } = req.body;
      
      const updatedRule = await storeAutomationEngine.updateAutomationRule(tenantId, ruleId, { enabled });
      
      if (!updatedRule) {
        return res.status(404).json({
          success: false,
          error: 'Automation rule not found'
        });
      }
      
      res.json({
        success: true,
        rule: updatedRule,
        message: `Automation rule ${enabled ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error: any) {
      console.error('Error toggling automation rule:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get automation performance metrics
  app.get('/api/automation/metrics', async (req, res) => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string || 'platform-tenant';
      const rules = await storeAutomationEngine.getAutomationRules(tenantId);
      
      const metrics = {
        totalRules: 0,
        activeRules: 0,
        totalExecutions: 0,
        averageSuccessRate: 0,
        totalRevenueImpact: 0,
        averageResponseTime: 0,
        categoryBreakdown: {},
        recentActivity: []
      };
      
      res.json({
        success: true,
        metrics
      });
    } catch (error: any) {
      console.error('Error fetching automation metrics:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}