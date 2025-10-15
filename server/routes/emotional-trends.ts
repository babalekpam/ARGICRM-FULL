import { Router } from 'express';
import { emotionalTrendPredictor } from '../emotional-trend-predictor';

const router = Router();

// Get emotional trends for all contacts
router.get('/trends', async (req, res) => {
  try {
    const trends = await emotionalTrendPredictor.getEmotionalTrends();
    res.json({ success: true, trends });
  } catch (error) {
    console.error('Error fetching emotional trends:', error);
    res.status(500).json({ error: 'Failed to fetch emotional trends' });
  }
});

// Get trend analytics summary
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await emotionalTrendPredictor.getTrendAnalytics();
    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Error fetching trend analytics:', error);
    res.status(500).json({ error: 'Failed to fetch trend analytics' });
  }
});

// Get emotional trend for specific contact
router.get('/contact/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const trends = await emotionalTrendPredictor.getEmotionalTrends();
    const contactTrend = trends.find(t => t.contactId === contactId);
    
    if (!contactTrend) {
      return res.status(404).json({ error: 'Contact trend not found' });
    }
    
    res.json({ success: true, trend: contactTrend });
  } catch (error) {
    console.error('Error fetching contact trend:', error);
    res.status(500).json({ error: 'Failed to fetch contact trend' });
  }
});

export default router;