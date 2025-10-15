import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// In-memory storage for voice emotion analysis records
interface VoiceEmotionRecord {
  id: string;
  contactId: string;
  emotion: string;
  intensity: number;
  confidence: number;
  transcript: string;
  duration: number;
  timestamp: Date;
  analysisData: {
    voiceTone: string;
    speechRate: number;
    volume: number;
    clarity: number;
  };
}

let voiceEmotionRecords: VoiceEmotionRecord[] = [];

// Voice emotion analysis schema
const voiceEmotionSchema = z.object({
  contactId: z.string(),
  emotion: z.string(),
  intensity: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  transcript: z.string(),
  duration: z.number().min(0),
  analysisData: z.object({
    voiceTone: z.string(),
    speechRate: z.number(),
    volume: z.number(),
    clarity: z.number()
  })
});

// Create voice emotion analysis record
router.post('/', async (req, res) => {
  try {
    const data = voiceEmotionSchema.parse(req.body);
    
    const record: VoiceEmotionRecord = {
      id: Date.now().toString(),
      ...data,
      timestamp: new Date()
    };
    
    voiceEmotionRecords.push(record);
    
    res.json({
      success: true,
      message: 'Voice emotion analysis recorded',
      record
    });
  } catch (error) {
    console.error('Voice emotion analysis error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid voice emotion data'
    });
  }
});

// Get voice emotion analytics for a contact
router.get('/contact/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    
    const contactRecords = voiceEmotionRecords.filter(record => 
      record.contactId === contactId
    );
    
    // Calculate analytics
    const totalRecords = contactRecords.length;
    const averageIntensity = totalRecords > 0 ? 
      contactRecords.reduce((sum, record) => sum + record.intensity, 0) / totalRecords : 0;
    
    const emotionDistribution = contactRecords.reduce((acc: Record<string, number>, record) => {
      acc[record.emotion] = (acc[record.emotion] || 0) + 1;
      return acc;
    }, {});
    
    const recentTrend = contactRecords
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5)
      .map(record => ({
        emotion: record.emotion,
        intensity: record.intensity,
        timestamp: record.timestamp
      }));
    
    res.json({
      contactId,
      analytics: {
        totalAnalyses: totalRecords,
        averageIntensity: Math.round(averageIntensity),
        emotionDistribution,
        recentTrend,
        overallSentiment: averageIntensity > 70 ? 'positive' : 
                         averageIntensity > 40 ? 'neutral' : 'negative'
      },
      records: contactRecords
    });
  } catch (error) {
    console.error('Voice emotion analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve voice emotion analytics'
    });
  }
});

// Get overall voice emotion statistics
router.get('/analytics', async (req, res) => {
  try {
    const totalRecords = voiceEmotionRecords.length;
    
    if (totalRecords === 0) {
      return res.json({
        totalAnalyses: 0,
        averageIntensity: 0,
        emotionBreakdown: {},
        topEmotions: [],
        recentActivity: []
      });
    }
    
    // Calculate overall analytics
    const averageIntensity = voiceEmotionRecords.reduce((sum, record) => 
      sum + record.intensity, 0) / totalRecords;
    
    const emotionBreakdown = voiceEmotionRecords.reduce((acc: Record<string, number>, record) => {
      acc[record.emotion] = (acc[record.emotion] || 0) + 1;
      return acc;
    }, {});
    
    const topEmotions = Object.entries(emotionBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([emotion, count]) => ({ emotion, count }));
    
    const recentActivity = voiceEmotionRecords
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10)
      .map(record => ({
        contactId: record.contactId,
        emotion: record.emotion,
        intensity: record.intensity,
        timestamp: record.timestamp
      }));
    
    res.json({
      totalAnalyses: totalRecords,
      averageIntensity: Math.round(averageIntensity),
      emotionBreakdown,
      topEmotions,
      recentActivity
    });
  } catch (error) {
    console.error('Voice emotion analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve voice emotion analytics'
    });
  }
});

export default router;